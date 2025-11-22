/* =======================================================
   live-activity.js — Lanyard-only (Spotify + Discord Hybrid)
   Option C behavior:
     - Show Spotify when playing
     - Show "Paused on Spotify" when paused (keeps album art)
     - If no Spotify: show Discord status text (online/idle/dnd)
     - Twitch > Discord (unless Spotify present)
     - Temp banners: GitHub / Reddit / TikTok (short duration)
   Features:
     - Drift-corrected progress bar
     - Pause detection (delta-based)
     - Smooth album-art crossfade
     - Slide-in/out card animations
     - No Amazon / YouTube / external presence sources
   Drop-in replacement: overwrite your existing live-activity.js
   ======================================================= */

/* =========================
   Minimal CSS suggestions (put these in your CSS if not present)
   -------------------------
   .spotify-card { transition: transform .36s ease, opacity .28s ease; transform-origin: center left; }
   .spotify-card.slide-in  { transform: translateY(0); opacity: 1; }
   .spotify-card.slide-out { transform: translateY(8px); opacity: 0; }
   .album-overlay { pointer-events: none; position: absolute; inset: 0; object-fit: cover; }
   #status-line { transition: opacity .22s ease; }
   .glow { filter: drop-shadow(0 6px 18px rgba(29,185,84,.25)); }
   ========================= */

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
// Note: db import left in place if you use firebase elsewhere. Not used by this file.
// import { db } from "./firebase-init.js";

const CONFIG = {
  discord: { userId: "850815059093356594" },
  twitch:  { username: "calebkritzar" },
  reddit:  { username: "Electronic_Row_1262" },
  github:  { username: "rkritzar39" },
  tiktok:  { username: "calebkritzar" },
};

/* ======================
   Internal state
   ====================== */
let lastUpdateTime = null;
let progressInterval = null;
let currentSpotifyUrl = null;
let tempBanner = null;
const TEMP_BANNER_MS = 15000;

let lastGitHubEventId = null;
let lastRedditPostId  = null;
let lastTikTokVideoId = null;

let lastKnownMain = null; // last known main object (discord / spotify)
let lastLanyardSuccess = Date.now();

/* Spotify pause detection state */
let lastSpotifyTrackId = null;
let lastSpotifyElapsed = null; // seconds
let lastSpotifySeenAt = 0;

/* DOM helpers */
const $$ = (id) => document.getElementById(id);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* ======================
   Icon map (auto theme aware)
   ====================== */
function getThemeColor(light, dark) {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? dark.replace("#", "") : light.replace("#", "");
}
const ICON_MAP = {
  spotify: "https://cdn.simpleicons.org/spotify/1DB954",
  discord: "https://cdn.simpleicons.org/discord/5865F2",
  twitch:  "https://cdn.simpleicons.org/twitch/9146FF",
  reddit:  "https://cdn.simpleicons.org/reddit/FF4500",
  github:  `https://cdn.simpleicons.org/github/${getThemeColor("#000000","#ffffff")}`,
  tiktok:  `https://cdn.simpleicons.org/tiktok/${getThemeColor("#000000","#ffffff")}`,
  manual:  "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
  default: "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
};

/* ======================
   Status line + last-updated
   ====================== */
function showStatusLineWithFade(text, source = "manual") {
  const txt = $$("status-line-text");
  const line = $$("status-line");
  const icon = $$("status-icon");
  if (!txt || !line || !icon) return;

  const iconUrl = ICON_MAP[source] || ICON_MAP.default;
  line.style.transition = "opacity .22s ease";
  line.style.opacity = "0";

  setTimeout(() => {
    icon.src = iconUrl;
    icon.alt = `${source} icon`;
    txt.textContent = text;
    line.style.opacity = "1";
  }, 180);

  icon.classList.remove("glow");
  if (["spotify","twitch"].includes(source)) icon.classList.add("glow");

  lastUpdateTime = Date.now();
}

function updateLastUpdated() {
  const el = $$("live-activity-updated");
  if (!el) return;
  if (!lastUpdateTime) { el.textContent = "—"; return; }
  const s = Math.floor((Date.now() - lastUpdateTime) / 1000);
  el.textContent =
    s < 5    ? "Updated just now" :
    s < 60   ? `Updated ${s}s ago` :
    s < 3600 ? `Updated ${Math.floor(s / 60)}m ago` :
               `${Math.floor(s / 3600)}h ago`;
}

/* ======================
   Progress bar (tick)
   ====================== */
function setupProgress(startMs, endMs) {
  const bar       = $$("music-progress-bar");
  const elapsedEl = $$("elapsed-time");
  const remainEl  = $$("remaining-time");
  const totalEl   = $$("total-time");
  if (!bar || !startMs || !endMs) return;

  const totalSec = Math.max((endMs - startMs) / 1000, 1);
  totalEl.textContent = fmt(totalSec);

  clearInterval(progressInterval);

  function tick() {
    const now = Date.now();
    const elapsedSec = Math.min((now - startMs) / 1000, totalSec);
    const left = Math.max(totalSec - elapsedSec, 0);
    bar.style.width = `${(elapsedSec / totalSec) * 100}%`;
    elapsedEl.textContent = fmt(elapsedSec);
    remainEl.textContent = `-${fmt(left)}`;
  }

  tick();
  progressInterval = setInterval(tick, 1000);
}

/* ======================
   Accent color extraction (album art)
   ====================== */
function updateDynamicColors(imageUrl) {
  const activity = document.querySelector(".live-activity");
  if (!activity) return;
  const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
  const matchAccent = settings.matchSongAccent === "enabled";
  const userAccent = settings.accentColor || "#3ddc84";

  if (!matchAccent || !imageUrl) {
    activity.style.setProperty("--dynamic-bg", "none");
    activity.style.setProperty("--dynamic-accent", userAccent);
    return;
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageUrl;
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width || 64;
      canvas.height = img.height || 64;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let r=0,g=0,b=0,count=0;
      for (let i=0;i<data.length;i+=4){ r+=data[i]; g+=data[i+1]; b+=data[i+2]; count++; }
      r=Math.floor(r/count); g=Math.floor(g/count); b=Math.floor(b/count);
      const accent = `rgb(${r}, ${g}, ${b})`;
      activity.style.setProperty("--dynamic-accent", accent);
      activity.style.setProperty("--dynamic-bg", `linear-gradient(180deg, rgba(${r},${g},${b},0.35), rgba(${r},${g},${b},0.12))`);
    } catch (err) {
      console.warn("Color extraction failed:", err);
      activity.style.setProperty("--dynamic-accent", userAccent);
    }
  };
  img.onerror = () => {
    activity.style.setProperty("--dynamic-accent", userAccent);
    activity.style.setProperty("--dynamic-bg", "none");
  };
}

/* ======================
   Album art crossfade + slide animations
   ====================== */
function crossfadeAlbumArt(imgEl, newSrc) {
  if (!imgEl) return;
  if (imgEl.dataset.current === newSrc) return;
  const overlay = document.createElement("img");
  overlay.className = "album-overlay";
  overlay.style.position = "absolute";
  overlay.style.inset = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.objectFit = "cover";
  overlay.style.opacity = "0";
  overlay.style.transition = "opacity .45s ease";
  overlay.src = newSrc;
  overlay.onload = () => {
    imgEl.parentElement.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = "1"; });
    setTimeout(() => { imgEl.src = newSrc; imgEl.dataset.current = newSrc; overlay.remove(); }, 470);
  };
  overlay.onerror = () => overlay.remove();
}

function slideInCard(cardEl) {
  if (!cardEl) return;
  cardEl.classList.remove("slide-out");
  cardEl.classList.add("slide-in");
  cardEl.style.display = "";
  cardEl.style.opacity = "1";
}
function slideOutCard(cardEl) {
  if (!cardEl) return;
  cardEl.classList.remove("slide-in");
  cardEl.classList.add("slide-out");
  setTimeout(()=>{ if (cardEl.classList.contains("slide-out")) { cardEl.style.opacity="0"; cardEl.style.display="none"; } }, 360);
}

/* ======================
   DISCORD / LANYARD (Spotify)
   - robust handling
   - timestamp drift correction
   - pause detection (delta)
   - keeps lastKnownMain for graceful fallback
   ====================== */
async function getDiscord() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}?_ts=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Lanyard ${res.status}`);
    const json = await res.json();
    const data = json.data;
    if (!data) return null;
    lastLanyardSuccess = Date.now();

    // If Spotify presence exists
    if (data.spotify) {
      const sp = data.spotify;

      // Normalize timestamps
      const now = Date.now();
      const startMs = sp.timestamps?.start ?? (now - (sp.spotify_elapsed ? sp.spotify_elapsed * 1000 : 0));
      const endMs   = sp.timestamps?.end ?? (startMs + (sp.spotify_duration ? sp.spotify_duration * 1000 : 0));
      const duration = Math.max(endMs - startMs, 1);
      const elapsedNow = (now - startMs) / 1000;

      // Drift correction using provided spotify_elapsed/duration if available
      let correctedStart = startMs;
      let correctedEnd = endMs;
      if (elapsedNow < -2 || elapsedNow > (duration/1000) + 5) {
        if (typeof sp.spotify_elapsed === "number" && typeof sp.spotify_duration === "number") {
          correctedStart = now - sp.spotify_elapsed * 1000;
          correctedEnd = correctedStart + sp.spotify_duration * 1000;
        }
      }

      // Pause detection (compare observed elapsed across polls)
      const observedElapsed = typeof sp.spotify_elapsed === "number" ? sp.spotify_elapsed : Math.round((Date.now() - correctedStart)/1000);
      const trackId = sp.track_id || null;
      let isPaused = false;
      if (lastSpotifyTrackId && lastSpotifyTrackId === trackId && lastSpotifyElapsed != null) {
        const elapsedDelta = observedElapsed - lastSpotifyElapsed;
        const since = (Date.now() - lastSpotifySeenAt) / 1000;
        // if time isn't moving forward by >0.9s over a >2s window -> treat paused
        if (since >= 2 && elapsedDelta <= 0.9) isPaused = true;
        // small negative jumps considered noise - don't mark paused
        if (elapsedDelta < -3) isPaused = false;
      }

      // update trackers
      lastSpotifyTrackId = trackId;
      lastSpotifyElapsed = observedElapsed;
      lastSpotifySeenAt = Date.now();

      // Update UI
      const card = $$("spotify-card");
      if (card) slideInCard(card);

      const coverEl = $$("live-activity-cover");
      if (coverEl && sp.album_art_url) {
        if (!coverEl.dataset.current) coverEl.dataset.current = coverEl.src || "";
        if (coverEl.dataset.current !== sp.album_art_url) crossfadeAlbumArt(coverEl, sp.album_art_url);
        else if (!coverEl.src) { coverEl.src = sp.album_art_url; coverEl.dataset.current = sp.album_art_url; }
      }

      const titleEl = $$("live-song-title");
      const artistEl = $$("live-song-artist");
      if (titleEl) titleEl.textContent = sp.song || "Unknown";
      if (artistEl) artistEl.textContent = sp.artist || "Unknown";

      currentSpotifyUrl = sp.track_id ? `https://open.spotify.com/track/${sp.track_id}` : null;

      // Apply progress (freeze if paused)
      if (!isPaused) {
        setupProgress(correctedStart, correctedEnd);
      } else {
        setupProgress(correctedStart, correctedEnd);
        clearInterval(progressInterval); // freeze
      }

      updateDynamicColors(sp.album_art_url);

      const statusText = isPaused ? "Paused on Spotify" : "Listening to Spotify";
      lastKnownMain = { text: statusText, source: "spotify" };
      return { text: statusText, source: "spotify", isPaused };
    }

    // No Spotify present: map Discord status
    const map = { online: "Online on Discord", idle: "Idle on Discord", dnd: "Do Not Disturb", offline: "No Current Active Activities" };
    const status = map[data.discord_status] || "No Current Active Activities";

    // Hide spotify card (but keep status line visible)
    const card = $$("spotify-card");
    if (card) slideOutCard(card);
    updateDynamicColors(null);

    lastKnownMain = { text: status, source: "discord" };
    return { text: status, source: "discord" };

  } catch (e) {
    console.warn("Lanyard error:", e);
    // If Lanyard intermittently fails, keep last known for a short grace period to avoid flicker
    if (lastKnownMain && Date.now() - lastLanyardSuccess < 10000) {
      return lastKnownMain;
    }
    return null;
  }
}

/* ======================
   TWITCH / REDDIT / GITHUB / TIKTOK
   (unchanged behavior — temp banners)
   ====================== */
async function getTwitch() {
  const u = (CONFIG.twitch.username || "").toLowerCase();
  if (!u) return null;
  try {
    const r = await fetch(`https://decapi.me/twitch/live/${u}`, { cache: "no-store" });
    const t = (await r.text()).toLowerCase();
    if (t.includes("is live")) return { text: "Now Live on Twitch", source: "twitch" };
  } catch (e) { console.warn("Twitch error:", e); }
  return null;
}

async function getReddit() {
  const u = CONFIG.reddit.username;
  if (!u) return null;
  try {
    const r = await fetch(`https://www.reddit.com/user/${u}/submitted.json?limit=1`, { cache: "no-store" });
    const j = await r.json();
    const post = j?.data?.children?.[0]?.data;
    if (post && post.id !== lastRedditPostId) { lastRedditPostId = post.id; return { text: "Shared on Reddit", source: "reddit", isTemp: true }; }
  } catch (e) { console.warn("Reddit error:", e); }
  return null;
}

async function getGitHub() {
  const u = CONFIG.github.username;
  if (!u) return null;
  try {
    const r = await fetch(`https://api.github.com/users/${u}/events/public`, { cache: "no-store" });
    const events = await r.json();
    const evt = Array.isArray(events) ? events.find((e) => ["PushEvent","CreateEvent","PullRequestEvent"].includes(e.type)) : null;
    if (evt && evt.id !== lastGitHubEventId) { lastGitHubEventId = evt.id; return { text: "Committed on GitHub", source: "github", isTemp: true }; }
  } catch (e) { console.warn("GitHub error:", e); }
  return null;
}

async function getTikTok() {
  const u = CONFIG.tiktok.username;
  if (!u) return null;
  try {
    const res = await fetch(`https://r.jina.ai/http://www.tiktok.com/@${u}`, { cache: "no-store" });
    const html = await res.text();
    const m = html.match(/\/video\/(\d+)/);
    const videoId = m?.[1];
    if (videoId && videoId !== lastTikTokVideoId) { lastTikTokVideoId = videoId; return { text: "Posted on TikTok", source: "tiktok", isTemp: true }; }
  } catch (e) { console.warn("TikTok error:", e); }
  return null;
}

/* ======================
   Status priority logic (Option C)
   Priority:
     1. Spotify (playing/paused)
     2. Twitch (live)
     3. Discord status
     4. Temp banners (GitHub/Reddit/TikTok briefly) override everything
   Note: temp banners override main for TEMP_BANNER_MS
   ====================== */
function applyStatusDecision({ main, twitchLive, temp }) {
  const spotifyCard = $$("spotify-card");

  // Temp banner overrides (immediate)
  if (temp && Date.now() < temp.expiresAt) {
    showStatusLineWithFade(temp.text, temp.source || "default");
    return;
  }

  // Spotify first
  if (main?.source === "spotify") {
    showStatusLineWithFade(main.text, "spotify");
    if (spotifyCard) spotifyCard.classList.remove("hidden");
    return;
  }

  // Twitch (live)
  if (twitchLive) {
    showStatusLineWithFade("Now Live on Twitch", "twitch");
    return;
  }

  // Otherwise show Discord status
  if (main && main.text !== "No Current Active Activities") {
    showStatusLineWithFade(main.text, main.source || "discord");
    return;
  }

  // Default fallback - keep status line visible with manual message
  showStatusLineWithFade("No Current Active Activities", "manual");
}

/* ======================
   Update loop
   ====================== */
async function updateLiveStatus() {
  // Lanyard (discord) primary for Spotify presence
  const discord = await getDiscord();

  // Parallel other checks (twitch + temp events)
  const [twitch, reddit, github, tiktok] = await Promise.all([getTwitch(), getReddit(), getGitHub(), getTikTok()]);

  // Determine primary
  let primary = null;
  if (discord && discord.source === "spotify") {
    primary = discord; // contains isPaused flag if paused
  } else if (twitch) {
    primary = twitch;
  } else if (discord) {
    primary = discord;
  } else {
    primary = { text: "No Current Active Activities", source: "manual" };
  }

  // Temp banner logic (short lived)
  const tempHit = [reddit, github, tiktok].find((r) => r && r.isTemp);
  if (tempHit) {
    tempBanner = { text: tempHit.text, source: tempHit.source, expiresAt: Date.now() + TEMP_BANNER_MS };
  } else if (tempBanner && Date.now() >= tempBanner.expiresAt) {
    tempBanner = null;
  }

  applyStatusDecision({ main: primary, twitchLive: !!twitch, temp: tempBanner });

  // ensure live-activity visible
  const live = $$("live-activity");
  if (live) live.classList.remove("hidden");
}

/* ======================
   Init
   ====================== */
document.addEventListener("DOMContentLoaded", () => {
  const card = $$("spotify-card");
  if (card) {
    card.addEventListener("click", () => {
      if (currentSpotifyUrl) window.open(currentSpotifyUrl, "_blank");
    });
  }

  // initial run
  updateLiveStatus();

  // Lanyard-friendly interval
  setInterval(updateLiveStatus, 5000);

  // last-updated ticker
  setInterval(updateLastUpdated, 1000);
});
