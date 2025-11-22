/* live-activity.js — Fully Optimized Single-Loop Version */

import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/* CONFIG */
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
let manualStatus = null;

/* DOM helpers */
const $$  = (id) => document.getElementById(id);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* ICON MAP */
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

/* Show status line with fade only if changed */
function showStatusLineWithFade(text, source = "manual") {
  const txt = $$("status-line-text");
  const line = $$("status-line");
  const icon = $$("status-icon");
  if (!txt || !line || !icon) return;

  if (txt.textContent === text && icon.src.includes(source)) return;

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

/* Last updated display */
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

/* Progress bar */
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

/* Dynamic colors */
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

/* Crossfade album art */
function crossfadeAlbumArt(imgEl, newSrc) {
  if (!imgEl || imgEl.dataset.current === newSrc) return;
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

/* Slide card helpers */
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

/* Manual status lock */
function isManualActive() {
  if (!manualStatus?.enabled) return false;
  const exp = manualStatus.expiresAt ? Number(manualStatus.expiresAt) : null;
  return !exp || Date.now() < exp;
}

/* Apply status decision */
function applyStatusDecision({ main, twitchLive, temp }) {
  const now = Date.now();

  if (isManualActive()) {
    showStatusLineWithFade(manualStatus.text || "Status (manual)", manualStatus.icon || "manual");
    return;
  }

  if (temp && now < temp.expiresAt) {
    showStatusLineWithFade(temp.text, temp.source || "default");
    return;
  }

  if (main?.source === "spotify") {
    showStatusLineWithFade(main.text, "spotify");
    return;
  }

  if (twitchLive) {
    showStatusLineWithFade("Now Live on Twitch", "twitch");
    return;
  }

  showStatusLineWithFade(main?.text || "No Current Active Activities", main?.source || "discord");
}

/* =========================
   Discord / Spotify
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
      const endMs   = sp.timestamps?.end   ?? (startMs + (sp.spotify_duration ? sp.spotify_duration * 1000 : 0));
      const duration = Math.max(endMs - startMs, 1);
      const observedElapsed = typeof sp.spotify_elapsed === "number" ? sp.spotify_elapsed : Math.round((now - startMs)/1000);

      // pause detection
      let isPaused = false;
      if (lastSpotifyTrackId === sp.track_id && lastSpotifyElapsed != null) {
        const elapsedDelta = observedElapsed - lastSpotifyElapsed;
        const since = (Date.now() - lastSpotifySeenAt) / 1000;
        if (since >= 2 && elapsedDelta <= 0.9) isPaused = true;
      }

      lastSpotifyTrackId = sp.track_id;
      lastSpotifyElapsed = observedElapsed;
      lastSpotifySeenAt = Date.now();

      const card = $$("spotify-card");
      if (card) slideInCard(card);

      const coverEl = $$("live-activity-cover");
      if (coverEl && sp.album_art_url) crossfadeAlbumArt(coverEl, sp.album_art_url);

      $$("live-song-title").textContent = sp.song || "Unknown";
      $$("live-song-artist").textContent = sp.artist || "Unknown";
      currentSpotifyUrl = sp.track_id ? `https://open.spotify.com/track/${sp.track_id}` : null;

      if (!isPaused) setupProgress(startMs, endMs);
      else { setupProgress(startMs, endMs); clearInterval(progressInterval); }

      updateDynamicColors(sp.album_art_url);

      const statusText = isPaused ? "Paused on Spotify" : `Listening to ${sp.song} by ${sp.artist}`;
      lastKnownMain = { text: statusText, source: "spotify" };
      return { text: statusText, source: "spotify", isPaused };
    }

    const map = { online: "Online on Discord", idle: "Idle on Discord", dnd: "Do Not Disturb", offline: "No Current Active Activities" };
    const status = map[data.discord_status] || "No Current Active Activities";
    const card = $$("spotify-card");
    if (card) slideOutCard(card);
    updateDynamicColors(null);
    lastKnownMain = { text: status, source: "discord" };
    return { text: status, source: "discord" };
  } catch(e){ console.warn("Lanyard error:", e); return lastKnownMain; }
}

/* Twitch / temp banners */
let lastTwitchCheck = 0, lastTempCheck = 0;
let cachedTwitch = null, cachedTempBanners = [];

async function getTwitch() {
  if (Date.now() - lastTwitchCheck < 30000) return cachedTwitch;
  lastTwitchCheck = Date.now();
  const u = CONFIG.twitch.username?.toLowerCase();
  if (!u) return null;
  try {
    const r = await fetch(`https://decapi.me/twitch/live/${u}`, { cache: "no-store" });
    const t = (await r.text()).toLowerCase();
    cachedTwitch = t.includes("is live") ? { text: "Now Live on Twitch", source: "twitch" } : null;
  } catch(e){ console.warn("Twitch error:", e); cachedTwitch = null; }
  return cachedTwitch;
}

async function getTempBanners() {
  if (Date.now() - lastTempCheck < 60000) return cachedTempBanners;
  lastTempCheck = Date.now();

  async function getReddit() {
    try {
      const r = await fetch(`https://www.reddit.com/user/${CONFIG.reddit.username}/submitted.json?limit=1`, { cache: "no-store" });
      const j = await r.json();
      const post = j?.data?.children?.[0]?.data;
      if (post && post.id !== lastRedditPostId) { lastRedditPostId = post.id; return { text: "Shared on Reddit", source: "reddit", isTemp: true }; }
    } catch(e){ console.warn("Reddit error:", e); }
    return null;
  }

  async function getGitHub() {
    try {
      const r = await fetch(`https://api.github.com/users/${CONFIG.github.username}/events/public`, { cache: "no-store" });
      const events = await r.json();
      const evt = Array.isArray(events) ? events.find(e => ["PushEvent","CreateEvent","PullRequestEvent"].includes(e.type)) : null;
      if (evt && evt.id !== lastGitHubEventId) { lastGitHubEventId = evt.id; return { text: "Committed on GitHub", source: "github", isTemp: true }; }
    } catch(e){ console.warn("GitHub error:", e); }
    return null;
  }

  async function getTikTok() {
    try {
      const res = await fetch(`https://r.jina.ai/http://www.tiktok.com/@${CONFIG.tiktok.username}`, { cache: "no-store" });
      const html = await res.text();
      const m = html.match(/\/video\/(\d+)/);
      const videoId = m?.[1];
      if (videoId && videoId !== lastTikTokVideoId) { lastTikTokVideoId = videoId; return { text: "Posted on TikTok", source: "tiktok", isTemp: true }; }
    } catch(e){ console.warn("TikTok error:", e); }
    return null;
  }

  cachedTempBanners = (await Promise.all([getReddit(), getGitHub(), getTikTok()])).filter(x=>x);
  return cachedTempBanners;
}

/* =========================
   Firestore manual status
   ========================= */
try {
  const manualRef = doc(db, "manualStatus", "site");
  onSnapshot(manualRef, snap => {
    if (!snap.exists()) { manualStatus = null; return; }
    const d = snap.data();
    if (d.expiresAt != null) d.expiresAt = Number(d.expiresAt);
    manualStatus = d;
  }, err => { console.warn("manual status listener error:", err); });
} catch(e){ console.warn("Firestore manual status disabled:", e); }

/* =========================
   Main single-loop update
   ========================= */
async function mainLoop() {
  try {
    const discord = await getDiscord();
    const twitch = await getTwitch();
    const tempBanners = await getTempBanners();
    const tempHit = tempBanners.length > 0 ? tempBanners[0] : null;
    if (tempHit) tempBanner = { text: tempHit.text, source: tempHit.source, expiresAt: Date.now() + TEMP_BANNER_MS };
    else if (tempBanner && Date.now() >= tempBanner.expiresAt) tempBanner = null;

    let primary = discord?.source === "spotify" ? discord : (twitch || discord || { text: "No Current Active Activities", source: "manual" });
    applyStatusDecision({ main: primary, twitchLive: !!twitch, temp: tempBanner });
    $$("live-activity")?.classList.remove("hidden");
  } catch(e){ console.error("mainLoop failed:", e); }
}

/* =========================
   Init
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  const card = $$("spotify-card");
  if (card) card.addEventListener("click", () => { if (currentSpotifyUrl) window.open(currentSpotifyUrl, "_blank"); });

  mainLoop();
  setInterval(mainLoop, 5000);
  setInterval(updateLastUpdated, 1000);
});
