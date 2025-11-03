import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/* =========================
   CONFIG: your handles
========================= */
const CONFIG = {
  discord: { userId: "850815059093356594" }, // Lanyard for Spotify + presence
  twitch:  { username: "calebkritzar" },
  reddit:  { username: "Electronic_Row_1262" },
  github:  { username: "rkritzar39" },
  tiktok:  { username: "calebkritzar" },
};

/* =========================
   STATE
========================= */
let lastUpdateTime = null;
let progressInterval = null;
let currentSpotifyUrl = null;

// For temp banners (TikTok / Reddit / GitHub)
let tempBanner = null;          // { text: string, expiresAt: number }
const TEMP_BANNER_MS = 15000;

let lastGitHubEventId = null;
let lastRedditPostId  = null;
let lastTikTokVideoId = null;
let twitchWasLive     = false;

const $$  = (id) => document.getElementById(id);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* =========================
   STATUS LINE (no icons)
========================= */
function setStatusLine(text, isVisible = true) {
  const txt  = $$("status-line-text");
  const line = $$("status-line");
  if (!txt || !line) return;
  txt.textContent = text || "Offline";
  line.classList.toggle("hidden", !isVisible);
  lastUpdateTime = Date.now();
  updateLastUpdated();
}

/* =========================
   LAST UPDATED LABEL
========================= */
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

/* =========================
   PROGRESS BAR (start/remaining/end)
========================= */
function setupProgress(startMs, endMs) {
  const bar       = $$("music-progress-bar");
  const elapsedEl = $$("elapsed-time");
  const remainEl  = $$("remaining-time");
  const totalEl   = $$("total-time");
  if (!bar || !startMs || !endMs) return;

  const totalSec = (endMs - startMs) / 1000;
  totalEl.textContent = fmt(totalSec);
  clearInterval(progressInterval);

  function tick() {
    const now        = Date.now();
    const elapsedSec = Math.min((now - startMs) / 1000, totalSec);
    const left       = Math.max(totalSec - elapsedSec, 0);
    bar.style.width  = `${(elapsedSec / totalSec) * 100}%`;
    elapsedEl.textContent = fmt(elapsedSec);
    remainEl.textContent  = `-${fmt(left)}`;
  }

  tick();
  progressInterval = setInterval(tick, 1000);
}

/* =========================
   DYNAMIC COLORS (accent-first)
========================= */
function updateDynamicColors(imageUrl) {
  const activity = document.querySelector(".live-activity");
  if (!activity) return;

  // Always start with the global accent color
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent-color")
    .trim() || "#1DB954";
  activity.style.setProperty("--dynamic-accent", accent);

  if (!imageUrl) {
    activity.style.setProperty("--dynamic-bg", "none");
    return;
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageUrl;

  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, img.width, img.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
      }
      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);

      const dynamic  = `rgb(${r},${g},${b})`;
      const gradient = `linear-gradient(180deg, rgba(${r},${g},${b},0.35), rgba(${r},${g},${b},0.15))`;
      activity.style.setProperty("--dynamic-bg", gradient);
      activity.style.setProperty("--dynamic-accent", dynamic);
    } catch (err) {
      console.warn("Dynamic color extraction failed:", err);
      activity.style.setProperty("--dynamic-accent", accent);
    }
  };
}

/* =========================
   FIRESTORE MANUAL (optional)
========================= */
async function getManualStatus() {
  try {
    const snap = await getDoc(doc(db, "live_status", "current"));
    if (snap.exists()) {
      const msg = (snap.data().message || "").trim();
      if (msg) return { text: msg, source: "manual" };
    }
  } catch {}
  return null;
}

/* =========================
   DISCORD (via Lanyard) → Spotify + presence
========================= */
async function getDiscord() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}`, { cache: "no-store" });
    const { data } = await res.json();
    if (!data) return null;

    if (data.spotify) {
      const sp = data.spotify;
      $$("spotify-card").classList.remove("hidden");
      $$("live-activity-cover").src   = sp.album_art_url;
      $$("live-song-title").textContent  = sp.song;
      $$("live-song-artist").textContent = sp.artist;
      currentSpotifyUrl = `https://open.spotify.com/track/${sp.track_id}`;
      setupProgress(sp.timestamps.start, sp.timestamps.end);
      updateDynamicColors(sp.album_art_url);
      return { text: `Listening to “${sp.song}” by ${sp.artist}`, source: "spotify" };
    }

    // No Spotify → hide card, use presence
    $$("spotify-card").classList.add("hidden");
    updateDynamicColors(null);
    const map = { online: "Online on Discord", idle: "Idle on Discord", dnd: "Do Not Disturb", offline: "Offline" };
    const status = map[data.discord_status] || "Offline";
    return { text: status, source: data.discord_status === "offline" ? "manual" : "discord" };
  } catch (e) {
    console.warn("Discord error:", e);
    return null;
  }
}

/* =========================
   TWITCH (improved)
========================= */
async function getTwitch() {
  const u = (CONFIG.twitch.username || "").toLowerCase();
  if (!u) return null;
  try {
    // Primary (fast)
    const r1 = await fetch(`https://decapi.me/twitch/live/${u}`, { cache: "no-store" });
    const t1 = (await r1.text()).toLowerCase();

    // Fallback (proxy) — helps with caching/CORS edge cases
    const liveText =
      t1 ||
      (await (await fetch(`https://r.jina.ai/https://decapi.me/twitch/live/${u}`, { cache: "no-store" })).text()).toLowerCase();

    if (liveText.includes("is live")) {
      twitchWasLive = true;
      return { text: "🔴 Now Live on Twitch", source: "twitch" };
    }

    twitchWasLive = false;
  } catch (e) {
    console.warn("Twitch error:", e);
  }
  return null;
}

/* =========================
   REDDIT (latest post)
========================= */
async function getReddit() {
  const u = CONFIG.reddit.username;
  if (!u) return null;
  try {
    const r = await fetch(`https://www.reddit.com/user/${u}/submitted.json?limit=1`, { cache: "no-store" });
    const j = await r.json();
    const post = j?.data?.children?.[0]?.data;
    if (!post) return null;

    // Only trigger when a *new* post id is seen
    if (post.id && post.id !== lastRedditPostId) {
      lastRedditPostId = post.id;
      return { text: "Shared on Reddit", source: "reddit", isTemp: true };
    }
  } catch (e) {
    console.warn("Reddit error:", e);
  }
  return null;
}

/* =========================
   GITHUB (recent public events)
========================= */
async function getGitHub() {
  const u = CONFIG.github.username;
  if (!u) return null;
  try {
    const r = await fetch(`https://api.github.com/users/${u}/events/public`, { cache: "no-store" });
    const events = await r.json();
    const evt = Array.isArray(events) ? events.find((e) => ["PushEvent", "CreateEvent", "PullRequestEvent"].includes(e.type)) : null;
    if (!evt) return null;

    if (evt.id && evt.id !== lastGitHubEventId) {
      lastGitHubEventId = evt.id;
      return { text: "Committed on GitHub", source: "github", isTemp: true };
    }
  } catch (e) {
    console.warn("GitHub error:", e);
  }
  return null;
}

/* =========================
   TIKTOK (profile scrape; detects new video)
========================= */
async function getTikTok() {
  const u = CONFIG.tiktok.username;
  if (!u) return null;
  try {
    const res  = await fetch(`https://r.jina.ai/http://www.tiktok.com/@${u}`, { cache: "no-store" });
    const html = await res.text();

    // try to pull the latest /video/<id>
    const m = html.match(/\/video\/(\d+)/);
    const videoId = m?.[1];
    if (!videoId) return null;

    if (videoId !== lastTikTokVideoId) {
      lastTikTokVideoId = videoId;
      return { text: "Posted on TikTok", source: "tiktok", isTemp: true };
    }
  } catch (e) {
    console.warn("TikTok error:", e);
  }
  return null;
}

/* =========================
   APPLY DECISION / PRIORITY
========================= */
function applyStatusDecision({ main, twitchLive, temp }) {
  // 1) Temporary banner wins briefly (but Spotify card still shows if active)
  if (temp && temp.text && Date.now() < temp.expiresAt) {
    setStatusLine(temp.text, true);
    return;
  }

  // 2) Spotify (card) wins over everything else
  if (main?.source === "spotify") {
    setStatusLine(main.text, true);
    return;
  }

  // 3) Twitch live overrides Discord presence if no Spotify
  if (twitchLive) {
    setStatusLine("🔴 Now Live on Twitch", true);
    return;
  }

  // 4) Otherwise, Discord presence / manual / offline
  if (main) {
    const show = main.source !== "manual" || main.text !== "Offline";
    setStatusLine(main.text, show);
    return;
  }

  // 5) Fallback
  setStatusLine("Offline", false);
}

/* =========================
   UPDATE LOOP
========================= */
async function updateLiveStatus() {
  // Fetch in parallel
  const [manual, discord, twitch, tiktok, reddit, github] = await Promise.all([
    getManualStatus(),
    getDiscord(),
    getTwitch(),
    getTikTok(),
    getReddit(),
    getGitHub(),
  ]);

  // Determine "main" (Spotify>Discord>Manual>Offline)
  const main =
    discord?.source === "spotify" ? discord :
    discord || manual || { text: "Offline", source: "manual" };

  // Create/refresh temp banner if any new temp sources detected
  const tempHit = [tiktok, reddit, github].find((r) => r && r.isTemp);
  if (tempHit) {
    tempBanner = { text: tempHit.text, expiresAt: Date.now() + TEMP_BANNER_MS };
  } else if (tempBanner && Date.now() >= tempBanner.expiresAt) {
    tempBanner = null;
  }

  // Show/hide Spotify card based on main
  if (main?.source === "spotify") {
    $$("spotify-card").classList.remove("hidden");
  } else {
    $$("spotify-card").classList.add("hidden");
    updateDynamicColors(null);
  }

  applyStatusDecision({
    main,
    twitchLive: !!twitch,
    temp: tempBanner,
  });

  $$("live-activity").classList.remove("hidden");
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const card = $$("spotify-card");
  if (card) {
    card.addEventListener("click", () => {
      if (currentSpotifyUrl) window.open(currentSpotifyUrl, "_blank");
    });
  }
  updateLiveStatus();
  setInterval(updateLiveStatus, 10000);
  setInterval(updateLastUpdated, 1000);
});
