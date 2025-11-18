/* =======================================================
   live-activity.js — Lanyard-only with pause detection,
   animations (slide-in/out, crossfade), progress fixes,
   and robust fallback behavior.
   Option A ("Paused on Spotify") is used for paused text.
   ======================================================= */

/* ============================
   IMPORTS (keep existing)
   ============================ */
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/* ============================
   CONFIG
   ============================ */
const CONFIG = {
  discord: { userId: "850815059093356594" },
  twitch:  { username: "calebkritzar" },
  reddit:  { username: "Electronic_Row_1262" },
  github:  { username: "rkritzar39" },
  tiktok:  { username: "calebkritzar" },
};

const $$ = (id) => document.getElementById(id);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* ============================
   STATE
   ============================ */
let lastUpdateTime = null;
let progressInterval = null;
let currentSpotifyUrl = null;
let tempBanner = null;
const TEMP_BANNER_MS = 15000;

let lastGitHubEventId = null;
let lastRedditPostId  = null;
let lastTikTokVideoId = null;

/* ----- Spotify-specific state for pause detection ----- */
let lastSpotifySeenAt = 0;         // ts when we last saw a spotify object
let lastSpotifyElapsed = null;     // elapsed seconds at last check
let lastSpotifyDuration = null;
let lastSpotifyTrackId = null;
let lastLanyardSuccess = Date.now();

/* Keep last-known payload for fallback display (avoid flicker) */
let lastKnownMain = null;
let lanyardGraceTimeout = 10000; // 10s keep-last-state when Lanyard fails

/* ============================
   ICON MAP
   ============================ */
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

/* ============================
   UI HELPERS: Animations & Crossfade
   ============================ */

function crossfadeAlbumArt(imgEl, newSrc) {
  if (!imgEl) return;
  if (imgEl.dataset.current === newSrc) return; // no change

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
    setTimeout(() => {
      // after crossfade, set base img to new src and remove overlay
      imgEl.src = newSrc;
      imgEl.dataset.current = newSrc;
      overlay.remove();
    }, 470);
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
  // after animation, hide
  setTimeout(() => {
    if (cardEl.classList.contains("slide-out")) {
      cardEl.style.opacity = "0";
      cardEl.style.display = "none";
    }
  }, 360);
}

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
  if (source === "spotify" || source === "twitch") icon.classList.add("glow");

  lastUpdateTime = Date.now();
}

/* ============================
   LAST UPDATED LABEL
   ============================ */
function updateLastUpdated() {
  const el = $$("live-activity-updated");
  if (!el) return;

  if (!lastUpdateTime) {
    el.textContent = "—";
    return;
  }

  const s = Math.floor((Date.now() - lastUpdateTime) / 1000);
  el.textContent =
    s < 5    ? "Updated just now" :
    s < 60   ? `Updated ${s}s ago` :
    s < 3600 ? `Updated ${Math.floor(s / 60)}m ago` :
               `${Math.floor(s / 3600)}h ago`;
}

/* ============================
   PROGRESS BAR (sync & tick)
   ============================ */
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

/* ============================
   DYNAMIC COLORS
   ============================ */
function updateDynamicColors(imageUrl) {
  const activity = document.querySelector(".live-activity");
  if (!activity) return;

  const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
  const matchAccent = settings.matchSongAccent === "enabled";
  const userAccent = settings.accentColor || "#1DB954";

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
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);
      const accent = `rgb(${r}, ${g}, ${b})`;
      activity.style.setProperty("--dynamic-accent", accent);
      activity.style.setProperty("--dynamic-bg", `linear-gradient(180deg, rgba(${r},${g},${b},0.35), rgba(${r},${g},${b},0.12))`);
    } catch (err) {
      console.warn("Dynamic color extraction failed:", err);
      activity.style.setProperty("--dynamic-accent", userAccent);
    }
  };
  img.onerror = () => {
    activity.style.setProperty("--dynamic-accent", userAccent);
    activity.style.setProperty("--dynamic-bg", "none");
  };
}

/* ============================
   LANYARD / DISCORD HANDLER
   - robust Spotify detection
   - pause detection -> "Paused on Spotify"
   - timestamp drift correction
   ============================ */

async function getDiscord() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}?_ts=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Lanyard responded ${res.status}`);
    const { data } = await res.json();
    if (!data) return null;

    lastLanyardSuccess = Date.now();

    // Spotify presence in Lanyard:
    if (data.spotify) {
      const sp = data.spotify;

      // Lanyard fields we expect:
      // sp.timestamps.start (ms), sp.timestamps.end (ms)
      // sp.spotify_elapsed (s), sp.spotify_duration (s)
      // sp.track_id, sp.song, sp.artist, sp.album_art_url

      const now = Date.now();

      // Normalize values
      const startMs = sp.timestamps?.start || (now - (sp.spotify_elapsed ? sp.spotify_elapsed * 1000 : 0));
      const endMs   = sp.timestamps?.end   || (startMs + (sp.spotify_duration ? sp.spotify_duration * 1000 : 0));
      const duration = Math.max(endMs - startMs, 1);
      const elapsedNow = (now - startMs) / 1000;

      // ----- Pause detection logic -----
      // We store the last observed elapsed and compare across polls.
      // If elapsed hasn't progressed by >1s in a 3+ second window, treat as paused.
      const observedElapsed = sp.spotify_elapsed ?? Math.floor(elapsedNow);
      const observedDuration = sp.spotify_duration ?? Math.round(duration / 1000);

      let isPaused = false;

      if (lastSpotifyElapsed !== null && lastSpotifyTrackId === sp.track_id) {
        const elapsedDelta = observedElapsed - lastSpotifyElapsed;
        const sinceLastSeen = (now - lastSpotifySeenAt) / 1000;

        // If no forward progress for a bit, treat as paused.
        if (sinceLastSeen >= 2 && elapsedDelta <= 0.9) {
          // small negative/zero deltas -> paused
          isPaused = true;
        }

        // If a big jump forward but still < 0 -> treat not paused
        if (elapsedDelta < -3) {
          // weird negative jump (maybe timestamp change) -> reset detection
          isPaused = false;
        }
      }

      // Update last-seen trackers
      lastSpotifySeenAt = now;
      lastSpotifyElapsed = observedElapsed;
      lastSpotifyDuration = observedDuration;
      lastSpotifyTrackId = sp.track_id;

      // UI updates
      const spotifyCard = $$("spotify-card");
      const cover = $$("live-activity-cover");
      const title = $$("live-song-title");
      const artist = $$("live-song-artist");

      // Album art crossfade for changes
      if (cover) {
        if (!cover.dataset.current) cover.dataset.current = cover.src || "";
        if (sp.album_art_url && cover.dataset.current !== sp.album_art_url) {
          crossfadeAlbumArt(cover, sp.album_art_url);
        } else if (sp.album_art_url && cover.dataset.current === "") {
          cover.src = sp.album_art_url;
          cover.dataset.current = sp.album_art_url;
        }
      }

      if (title) title.textContent = sp.song || "Unknown";
      if (artist) artist.textContent = sp.artist || "Unknown";

      currentSpotifyUrl = sp.track_id ? `https://open.spotify.com/track/${sp.track_id}` : null;

      // Progress calculation: correct drift if necessary
      let correctedStart = startMs;
      let correctedEnd = endMs;

      const nowElapsed = (Date.now() - correctedStart) / 1000;
      if (nowElapsed < -2 || nowElapsed > ((correctedEnd - correctedStart) / 1000) + 5) {
        // If lanyard timestamps appear stale, recalc using spotify_elapsed/duration
        if (typeof sp.spotify_elapsed === "number" && typeof sp.spotify_duration === "number") {
          correctedStart = now - sp.spotify_elapsed * 1000;
          correctedEnd = correctedStart + sp.spotify_duration * 1000;
        }
      }

      // Apply progress
      if (!isPaused) {
        setupProgress(correctedStart, correctedEnd);
      } else {
        // When paused, stop ticking but show frozen progress
        setupProgress(correctedStart, correctedEnd);
        clearInterval(progressInterval); // freeze UI
      }

      // Dynamic accent
      updateDynamicColors(sp.album_art_url);

      // Show/hide card with nice slide
      if (spotifyCard) {
        slideInCard(spotifyCard);
      }

      // Choose status text
      const statusText = isPaused ? "Paused on Spotify" : `Listening to ${sp.song || "Spotify"}`;
      return { text: statusText, source: "spotify", isPaused, spotify: sp };
    }

    // Not listening — hide spotify card and reset dynamic colors
    const spotifyCard = $$("spotify-card");
    if (spotifyCard) slideOutCard(spotifyCard);
    updateDynamicColors(null);

    // Map discord_status to friendly labels
    const map = {
      online: "Online on Discord",
      idle: "Idle on Discord",
      dnd: "Do Not Disturb",
      offline: "No Current Active Activities",
    };

    const status = map[data.discord_status] || "No Current Active Activities";
    return { text: status, source: "discord" };

  } catch (e) {
    console.warn("Lanyard error:", e);
    // If Lanyard failed, but we have a lastKnownMain that's recent, keep it (graceful)
    if (lastKnownMain && Date.now() - lastLanyardSuccess < lanyardGraceTimeout) {
      // keep last known main temporarily
      return lastKnownMain;
    }
    return null;
  }
}

/* ============================
   Twitch / Reddit / GitHub / TikTok
   (unchanged behaviour with minor robustness)
   ============================ */

async function getTwitch() {
  const u = (CONFIG.twitch.username || "").toLowerCase();
  if (!u) return null;
  try {
    const r = await fetch(`https://decapi.me/twitch/live/${u}`, { cache: "no-store" });
    const t = (await r.text()).toLowerCase();
    if (t.includes("is live")) return { text: "Now Live on Twitch", source: "twitch" };
  } catch (e) {
    console.warn("Twitch error:", e);
  }
  return null;
}

async function getReddit() {
  const u = CONFIG.reddit.username;
  if (!u) return null;
  try {
    const r = await fetch(`https://www.reddit.com/user/${u}/submitted.json?limit=1`, { cache: "no-store" });
    const j = await r.json();
    const post = j?.data?.children?.[0]?.data;
    if (post && post.id !== lastRedditPostId) {
      lastRedditPostId = post.id;
      return { text: "Shared on Reddit", source: "reddit", isTemp: true };
    }
  } catch (e) {
    console.warn("Reddit error:", e);
  }
  return null;
}

async function getGitHub() {
  const u = CONFIG.github.username;
  if (!u) return null;
  try {
    const r = await fetch(`https://api.github.com/users/${u}/events/public`, { cache: "no-store" });
    const events = await r.json();
    const evt = Array.isArray(events) ? events.find((e) => ["PushEvent", "CreateEvent", "PullRequestEvent"].includes(e.type)) : null;
    if (evt && evt.id !== lastGitHubEventId) {
      lastGitHubEventId = evt.id;
      return { text: "Committed on GitHub", source: "github", isTemp: true };
    }
  } catch (e) {
    console.warn("GitHub error:", e);
  }
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
    if (videoId && videoId !== lastTikTokVideoId) {
      lastTikTokVideoId = videoId;
      return { text: "Posted on TikTok", source: "tiktok", isTemp: true };
    }
  } catch (e) {
    console.warn("TikTok error:", e);
  }
  return null;
}

/* ============================
   STATUS DECISION (priority)
   ============================ */

function applyStatusDecision({ main, twitchLive, temp }) {
  const spotifyCard = $$("spotify-card");

  // Temporary banners override everything
  if (temp && Date.now() < temp.expiresAt) {
    showStatusLineWithFade(temp.text, temp.source || "default");
    return;
  }

  // Spotify preferred
  if (main?.source === "spotify") {
    showStatusLineWithFade(main.text, "spotify");
    if (spotifyCard) spotifyCard.style.display = "";
    lastKnownMain = main;
    return;
  }

  // Twitch next
  if (twitchLive) {
    showStatusLineWithFade("Now Live on Twitch", "twitch");
    lastKnownMain = { text: "Now Live on Twitch", source: "twitch" };
    return;
  }

  // Discord/status next
  if (main && main.text && main.text !== "No Current Active Activities") {
    showStatusLineWithFade(main.text, main.source || "discord");
    lastKnownMain = main;
    return;
  }

  // default fallback
  showStatusLineWithFade("No Current Active Activities", "manual");
  lastKnownMain = { text: "No Current Active Activities", source: "manual" };
}

/* ============================
   UPDATE LOOP
   ============================ */

async function updateLiveStatus() {
  // Fetch everything in parallel (Lanyard primary for Spotify)
  const [discord, twitch, reddit, github, tiktok] = await Promise.all([
    getDiscord(),
    getTwitch(),
    getReddit(),
    getGitHub(),
    getTikTok(),
  ]);

  const main = discord || lastKnownMain || { text: "No Current Active Activities", source: "manual" };

  // If discord (lanyard) returned valid object recently, update lastKnownMain
  if (discord) lastKnownMain = discord;

  // Temp banner priority
  const tempHit = [reddit, github, tiktok].find((r) => r && r.isTemp);
  if (tempHit) {
    tempBanner = { text: tempHit.text, source: tempHit.source, expiresAt: Date.now() + TEMP_BANNER_MS };
  } else if (tempBanner && Date.now() >= tempBanner.expiresAt) {
    tempBanner = null;
  }

  // Apply decision
  applyStatusDecision({
    main,
    twitchLive: !!twitch,
    temp: tempBanner,
  });

  // make sure live-activity area is visible when something exists
  const live = $$("live-activity");
  if (live) live.classList.remove("hidden");
}

/* ============================
   INIT
   ============================ */

document.addEventListener("DOMContentLoaded", () => {
  const card = $$("spotify-card");
  if (card) {
    card.addEventListener("click", () => {
      if (currentSpotifyUrl) window.open(currentSpotifyUrl, "_blank");
    });
  }

  // initial run + intervals
  updateLiveStatus();
  // Lanyard updates ~5s — poll every 5s for snappy behavior
  setInterval(updateLiveStatus, 5000);
  setInterval(updateLastUpdated, 1000);
});

/* ============================
   NOTES / SUGGESTIONS
   ============================
- Make sure your DOM contains the same IDs used above:
  - live-activity, spotify-card, live-activity-cover, live-song-title,
    live-song-artist, music-progress-bar, elapsed-time, remaining-time,
    total-time, status-line, status-line-text, status-icon, live-activity-updated
- Minimal CSS required for animations. Example styles (add to your CSS):
  .spotify-card { transition: transform .36s ease, opacity .28s ease; transform-origin: center left; }
  .spotify-card.slide-in  { transform: translateY(0); opacity: 1; }
  .spotify-card.slide-out { transform: translateY(8px); opacity: 0; }
  .album-overlay { pointer-events: none; }
  #status-line { transition: opacity .22s ease; }
  .glow { filter: drop-shadow(0 6px 18px rgba(29,185,84,.25)); }

- The pause detection isn't perfect (Lanyard doesn't always include live elapsed). It uses delta checks between polls and will show "Paused on Spotify" quickly when playback stops moving.
- If you'd like I can also:
  • Add an explicit "Paused" icon variant
  • Persist last-known song across page loads
  • Add keyboard/aria handlers for accessibility

Enjoy — paste this file over your existing `live-activity.js`. If anything still looks off in your environment (different DOM IDs or CSS expectations), paste your current CSS for the live activity and I’ll adjust class names and animations to match.
