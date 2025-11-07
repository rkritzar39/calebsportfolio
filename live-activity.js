import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

const CONFIG = {
  discord: { userId: "850815059093356594" },
  twitch:  { username: "calebkritzar" },
  reddit:  { username: "Electronic_Row_1262" },
  github:  { username: "rkritzar39" },
  tiktok:  { username: "calebkritzar" },
};

let lastUpdateTime = null;
let progressInterval = null;
let currentSpotifyUrl = null;
let tempBanner = null;
const TEMP_BANNER_MS = 15000;

let lastGitHubEventId = null;
let lastRedditPostId  = null;
let lastTikTokVideoId = null;
let twitchWasLive     = false;

const $$  = (id) => document.getElementById(id);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* ======================================================= */
/* === OFFICIAL PLATFORM ICONS (THEME-AWARE) ============= */
/* ======================================================= */
const ICON_MAP = {
  spotify: "https://cdn.simpleicons.org/spotify/1DB954",
  discord: "https://cdn.simpleicons.org/discord/5865F2",
  twitch:  "https://cdn.simpleicons.org/twitch/9146FF",
  youtube: "https://cdn.simpleicons.org/youtube/FF0000",
  reddit:  "https://cdn.simpleicons.org/reddit/FF4500",
  github:  `https://cdn.simpleicons.org/github/${getComputedStyle(document.documentElement).getPropertyValue("--icon-github").trim().replace("#","")}`,
  tiktok:  `https://cdn.simpleicons.org/tiktok/${getComputedStyle(document.documentElement).getPropertyValue("--icon-tiktok").trim().replace("#","")}`,
  manual:  "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
  default: "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
};

/* ======================================================= */
/* === STATUS LINE HANDLER =============================== */
/* ======================================================= */
function setStatusLine(text, isVisible = true, source = "default") {
  const txt  = document.getElementById("status-line-text");
  const line = document.getElementById("status-line");
  const icon = document.getElementById("status-icon");
  if (!txt || !line || !icon) return;

  const iconUrl = ICON_MAP[source] || ICON_MAP.default;

  // Clean fade transition
  line.style.opacity = 0;
  setTimeout(() => {
    icon.src = iconUrl;
    icon.alt = `${source} icon`;
    txt.textContent = text || "No Current Active Activities";
    line.classList.toggle("hidden", !isVisible);
    line.style.opacity = 1;
  }, 150);

  // Add subtle glow for live/active
  icon.classList.remove("glow");
  if (source === "spotify" || source === "twitch") icon.classList.add("glow");

  lastUpdateTime = Date.now();
  updateLastUpdated();
}
/* ======================================================= */
/* === LAST UPDATED LABEL ================================ */
/* ======================================================= */
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

/* ======================================================= */
/* === PROGRESS BAR ====================================== */
/* ======================================================= */
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

/* ======================================================= */
/* === DYNAMIC BACKGROUND + ACCENT ======================= */
/* ======================================================= */
function updateDynamicColors(imageUrl) {
  const activity = document.querySelector(".live-activity");
  if (!activity) return;

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

/* ======================================================= */
/* === DISCORD (Spotify + status) ======================== */
/* ======================================================= */
async function getDiscord() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}`, { cache: "no-store" });
    const { data } = await res.json();
    if (!data) return null;

    // Spotify detected
    if (data.spotify) {
      const sp = data.spotify;
      $$("spotify-card").classList.remove("hidden");
      $$("live-activity-cover").src = sp.album_art_url;
      $$("live-song-title").textContent = sp.song;
      $$("live-song-artist").textContent = sp.artist;
      currentSpotifyUrl = `https://open.spotify.com/track/${sp.track_id}`;
      setupProgress(sp.timestamps.start, sp.timestamps.end);
      updateDynamicColors(sp.album_art_url);
      return { text: `Listening to “${sp.song}” by ${sp.artist}`, source: "spotify" };
    }

    $$("spotify-card").classList.add("hidden");
    updateDynamicColors(null);

    // If offline
    const map = {
      online: "Online on Discord",
      idle: "Idle on Discord",
      dnd: "Do Not Disturb",
      offline: "No Current Active Activities",
    };
    const status = map[data.discord_status] || "No Current Active Activities";
    return { text: status, source: "discord" };
  } catch (e) {
    console.warn("Discord error:", e);
    return null;
  }
}

/* ======================================================= */
/* === TWITCH ============================================ */
/* ======================================================= */
async function getTwitch() {
  const u = (CONFIG.twitch.username || "").toLowerCase();
  if (!u) return null;
  try {
    const r1 = await fetch(`https://decapi.me/twitch/live/${u}`, { cache: "no-store" });
    const t1 = (await r1.text()).toLowerCase();
    if (t1.includes("is live")) {
      twitchWasLive = true;
      return { text: "Now Live on Twitch", source: "twitch" };
    }
    twitchWasLive = false;
  } catch (e) {
    console.warn("Twitch error:", e);
  }
  return null;
}

/* ======================================================= */
/* === REDDIT ============================================ */
/* ======================================================= */
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

/* ======================================================= */
/* === GITHUB ============================================ */
/* ======================================================= */
async function getGitHub() {
  const u = CONFIG.github.username;
  if (!u) return null;
  try {
    const r = await fetch(`https://api.github.com/users/${u}/events/public`, { cache: "no-store" });
    const events = await r.json();
    const evt = Array.isArray(events)
      ? events.find((e) => ["PushEvent", "CreateEvent", "PullRequestEvent"].includes(e.type))
      : null;
    if (evt && evt.id !== lastGitHubEventId) {
      lastGitHubEventId = evt.id;
      return { text: "Committed on GitHub", source: "github", isTemp: true };
    }
  } catch (e) {
    console.warn("GitHub error:", e);
  }
  return null;
}

/* ======================================================= */
/* === TIKTOK ============================================ */
/* ======================================================= */
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

/* ======================================================= */
/* === STATUS DECISION =================================== */
/* ======================================================= */
function applyStatusDecision({ main, twitchLive, temp }) {
  const spotifyCard = $$("spotify-card");

  // Temporary banner (TikTok, Reddit, GitHub)
  if (temp && temp.text && Date.now() < temp.expiresAt) {
    setStatusLine(temp.text, true, temp.source || "default");
    return;
  }

  // Spotify (main)
  if (main?.source === "spotify") {
    setStatusLine(main.text, true, "spotify");
    spotifyCard.classList.remove("hidden");
    return;
  }

  // Twitch live
  if (twitchLive) {
    setStatusLine("Now Live on Twitch", true, "twitch");
    return;
  }

  // Discord active or manual
  if (main && main.text && main.text !== "No Current Active Activities") {
    setStatusLine(main.text, true, main.source || "discord");
    return;
  }

  // Default fallback — completely idle
  setStatusLine("No Current Active Activities", true, "manual");
}

/* ======================================================= */
/* === UPDATE LOOP ======================================= */
/* ======================================================= */
async function updateLiveStatus() {
  const [discord, twitch, tiktok, reddit, github] = await Promise.all([
    getDiscord(),
    getTwitch(),
    getTikTok(),
    getReddit(),
    getGitHub(),
  ]);

  const main = discord || { text: "No Current Active Activities", source: "manual" };

  const tempHit = [tiktok, reddit, github].find((r) => r && r.isTemp);
  if (tempHit) {
    tempBanner = { text: tempHit.text, source: tempHit.source, expiresAt: Date.now() + TEMP_BANNER_MS };
  } else if (tempBanner && Date.now() >= tempBanner.expiresAt) {
    tempBanner = null;
  }

  applyStatusDecision({
    main,
    twitchLive: !!twitch,
    temp: tempBanner,
  });

  $$("live-activity").classList.remove("hidden");
}

/* ======================================================= */
/* === INIT ============================================== */
/* ======================================================= */
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
