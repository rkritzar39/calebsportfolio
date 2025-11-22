/* live-activity.js — Lanyard (Spotify) + Manual Status from Firestore
   Priority: Spotify (Lanyard) > Twitch > Manual (Firestore) > Discord > fallback
*/

import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js"; // must export Firestore instance

/* CONFIG (unchanged) */
const CONFIG = {
  discord: { userId: "850815059093356594" },
  twitch:  { username: "calebkritzar" },
  reddit:  { username: "Electronic_Row_1262" },
  github:  { username: "rkritzar39" },
  tiktok:  { username: "calebkritzar" },
};

/* STATE */
let lastUpdateTime = null;
let progressInterval = null;
let currentSpotifyUrl = null;
let tempBanner = null;
const TEMP_BANNER_MS = 15000;

let lastGitHubEventId = null;
let lastRedditPostId  = null;
let lastTikTokVideoId = null;

let lastKnownMain = null;
let lastLanyardSuccess = Date.now();

/* Manual status (from Firestore) */
let manualStatus = null; // { text, icon, enabled, expiresAt, persistent, updated_at }

/* DOM helpers */
const $$  = (id) => document.getElementById(id);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* ICON MAP (match your other file) */
function getThemeColor(light, dark) {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? dark.replace("#", "") : light.replace("#", "");
}
const ICON_MAP = {
  spotify: "https://cdn.simpleicons.org/spotify/1DB954",
  discord: "https://cdn.simpleicons.org/discord/5865F2",
  twitch:  "https://cdn.simpleicons.org/twitch/9146FF",
  youtube: "https://cdn.simpleicons.org/youtube/FF0000",
  reddit:  "https://cdn.simpleicons.org/reddit/FF4500",
  github:  `https://cdn.simpleicons.org/github/${getThemeColor("#000000", "#ffffff")}`,
  tiktok:  `https://cdn.simpleicons.org/tiktok/${getThemeColor("#000000", "#ffffff")}`,
  manual:  "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
  default: "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
};

/* STATUS LINE helper */
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

/* Progress helper (same as before) */
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

/* Dynamic accent / album extraction (same approach) */
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
      for (let i=0;i<data.length;i+=4) { r+=data[i]; g+=data[i+1]; b+=data[i+2]; count++; }
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

/* Crossfade helper (same as before) */
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

/* =========================
   Lanyard (Discord) — Spotify detection (same robust logic as before)
   ========================= */
let lastSpotifyTrackId = null;
let lastSpotifyElapsed = null;
let lastSpotifySeenAt = 0;

async function getDiscord() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}?_ts=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Lanyard ${res.status}`);
    const json = await res.json();
    const data = json.data;
    if (!data) return null;
    lastLanyardSuccess = Date.now();

    if (data.spotify) {
      const sp = data.spotify;
      const now = Date.now();
      const startMs = sp.timestamps?.start ?? (now - (sp.spotify_elapsed ? sp.spotify_elapsed * 1000 : 0));
      const endMs = sp.timestamps?.end ?? (startMs + (sp.spotify_duration ? sp.spotify_duration * 1000 : 0));
      const duration = Math.max(endMs - startMs, 1);
      const elapsedNow = (now - startMs) / 1000;

      let correctedStart = startMs;
      let correctedEnd = endMs;
      if (elapsedNow < -2 || elapsedNow > (duration/1000) + 5) {
        if (typeof sp.spotify_elapsed === "number" && typeof sp.spotify_duration === "number") {
          correctedStart = now - sp.spotify_elapsed * 1000;
          correctedEnd = correctedStart + sp.spotify_duration * 1000;
        }
      }

      const observedElapsed = typeof sp.spotify_elapsed === "number" ? sp.spotify_elapsed : Math.round((Date.now() - correctedStart)/1000);
      const trackId = sp.track_id || null;
      let isPaused = false;
      if (lastSpotifyTrackId && lastSpotifyTrackId === trackId && lastSpotifyElapsed != null) {
        const elapsedDelta = observedElapsed - lastSpotifyElapsed;
        const since = (Date.now() - lastSpotifySeenAt) / 1000;
        if (since >= 2 && elapsedDelta <= 0.9) isPaused = true;
        if (elapsedDelta < -3) isPaused = false;
      }

      lastSpotifyTrackId = trackId;
      lastSpotifyElapsed = observedElapsed;
      lastSpotifySeenAt = Date.now();

      // UI updates
      const card = $$("spotify-card");
      if (card) slideInCard(card);

      const coverEl = $$("live-activity-cover");
      if (coverEl && sp.album_art_url) {
        if (!coverEl.dataset.current) coverEl.dataset.current = coverEl.src || "";
        if (coverEl.dataset.current !== sp.album_art_url) crossfadeAlbumArt(coverEl, sp.album_art_url);
      }

      $$("live-song-title").textContent = sp.song || "Unknown";
      $$("live-song-artist").textContent = sp.artist || "Unknown";
      currentSpotifyUrl = sp.track_id ? `https://open.spotify.com/track/${sp.track_id}` : null;

      if (!isPaused) {
        setupProgress(correctedStart, correctedEnd);
      } else {
        setupProgress(correctedStart, correctedEnd);
        clearInterval(progressInterval);
      }

      updateDynamicColors(sp.album_art_url);
      const statusText = isPaused ? "Paused on Spotify" : "Listening to Spotify";
      lastKnownMain = { text: statusText, source: "spotify" };
      return { text: statusText, source: "spotify", isPaused };
    }

    // no spotify present
    const map = { online: "Online on Discord", idle: "Idle on Discord", dnd: "Do Not Disturb", offline: "No Current Active Activities" };
    const status = map[data.discord_status] || "No Current Active Activities";
    const card = $$("spotify-card");
    if (card) slideOutCard(card);
    updateDynamicColors(null);

    lastKnownMain = { text: status, source: "discord" };
    return { text: status, source: "discord" };
  } catch (e) {
    console.warn("Lanyard error:", e);
    if (lastKnownMain && Date.now() - lastLanyardSuccess < 10000) return lastKnownMain;
    return null;
  }
}

/* =========================
   Twitch, GitHub, Reddit, TikTok (temp banners), same code as before
   ========================= */
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

/* =========================
   Firestore manual status listener
   document path: manualStatus/site
   Fields: text, icon, enabled (bool), expiresAt (ms|null), updated_at
   ========================= */
try {
  const manualRef = doc(db, "manualStatus", "site");
  onSnapshot(manualRef, (snap) => {
    if (!snap.exists()) {
      manualStatus = null;
      return;
    }
    const d = snap.data();
    // normalize
    if (d.expiresAt != null) d.expiresAt = Number(d.expiresAt);
    manualStatus = d;
  }, (err) => {
    console.warn("manual status listener error:", err);
  });
} catch (e) {
  console.warn("Firestore manual status disabled:", e);
}

/* =========================
   Priority decision (includes manual)
   ========================= */
function applyStatusDecision({ main, twitchLive, temp }) {
  // temp banners override everything first (GitHub/TikTok/Reddit)
  if (temp && Date.now() < temp.expiresAt) {
    showStatusLineWithFade(temp.text, temp.source || "default");
    return;
  }

  // Spotify
  if (main?.source === "spotify") {
    showStatusLineWithFade(main.text, "spotify");
    return;
  }

  // Twitch live is second
  if (twitchLive) {
    showStatusLineWithFade("Now Live on Twitch", "twitch");
    return;
  }

  // Manual third (only if enabled and not expired)
  if (manualStatus && manualStatus.enabled) {
    const exp = manualStatus.expiresAt ? Number(manualStatus.expiresAt) : null;
    if (!exp || Date.now() < exp) {
      const txt = manualStatus.text || "Status (manual)";
      const icon = manualStatus.icon || "manual";
      showStatusLineWithFade(txt, icon);
      return;
    }
  }

  // Otherwise show Discord status
  if (main && main.text !== "No Current Active Activities") {
    showStatusLineWithFade(main.text, main.source || "discord");
    return;
  }

  showStatusLineWithFade("No Current Active Activities", "manual");
}

/* =========================
   Main update loop
   ========================= */
async function updateLiveStatus() {
  const discord = await getDiscord();
  const [twitch, reddit, github, tiktok] = await Promise.all([getTwitch(), getReddit(), getGitHub(), getTikTok()]);

  let primary = null;
  if (discord && discord.source === "spotify") {
    primary = discord;
  } else if (twitch) {
    primary = twitch;
  } else if (discord) {
    primary = discord;
  } else {
    primary = { text: "No Current Active Activities", source: "manual" };
  }

  // temp banners
  const tempHit = [reddit, github, tiktok].find((r) => r && r.isTemp);
  if (tempHit) {
    tempBanner = { text: tempHit.text, source: tempHit.source, expiresAt: Date.now() + TEMP_BANNER_MS };
  } else if (tempBanner && Date.now() >= tempBanner.expiresAt) {
    tempBanner = null;
  }

  applyStatusDecision({ main: primary, twitchLive: !!twitch, temp: tempBanner });
  $$("live-activity").classList.remove("hidden");
}

/* =========================
   Init
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  const card = $$("spotify-card");
  if (card) {
    card.addEventListener("click", () => {
      if (currentSpotifyUrl) window.open(currentSpotifyUrl, "_blank");
    });
  }

  updateLiveStatus();
  setInterval(updateLiveStatus, 5000);
  setInterval(updateLastUpdated, 1000);
});
