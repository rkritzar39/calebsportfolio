/* ======================================================= */
/* === IMPORTS =========================================== */
/* ======================================================= */
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

/* Shortcuts */
const $$  = (id) => document.getElementById(id);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* ======================================================= */
/* === ICON SYSTEM ======================================= */
/* ======================================================= */

function getThemeColor(light, dark) {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? dark.replace("#", "")
    : light.replace("#", "");
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

/* ======================================================= */
/* === STATUS LINE ======================================= */
/* ======================================================= */

function setStatusLine(text, isVisible = true, source = "default") {
  const txt  = $$("status-line-text");
  const line = $$("status-line");
  const icon = $$("status-icon");

  if (!txt || !line || !icon) return;

  const iconUrl = ICON_MAP[source] || ICON_MAP.default;

  line.style.opacity = 0;

  setTimeout(() => {
    icon.src = iconUrl;
    icon.alt = `${source} icon`;
    txt.textContent = text || "No Current Active Activities";
    line.classList.toggle("hidden", !isVisible);
    line.style.opacity = 1;
  }, 150);

  icon.classList.remove("glow");
  if (source === "spotify" || source === "twitch") icon.classList.add("glow");

  lastUpdateTime = Date.now();
}

/* ======================================================= */
/* === LAST UPDATED LABEL ================================ */
/* ======================================================= */

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
    const now = Date.now();
    const elapsedSec = Math.min((now - startMs) / 1000, totalSec);
    const left = Math.max(totalSec - elapsedSec, 0);

    bar.style.width = `${(elapsedSec / totalSec) * 100}%`;

    elapsedEl.textContent = fmt(elapsedSec);
    remainEl.textContent  = `-${fmt(left)}`;
  }

  tick();
  progressInterval = setInterval(tick, 1000);
}

/* ======================================================= */
/* === SPOTIFY ALBUM ACCENT COLORS ======================= */
/* ======================================================= */

function updateDynamicColors(imageUrl) {
  const activity = document.querySelector(".live-activity");
  if (!activity) return;

  const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
  const matchAccent = settings.matchSongAccent === "enabled";
  const userAccent  = settings.accentColor || "#1DB954";

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
      activity.style.setProperty(
        "--dynamic-bg",
        `linear-gradient(180deg, rgba(${r},${g},${b},0.35), rgba(${r},${g},${b},0.15))`
      );

    } catch (err) {
      console.warn("Color extraction failed:", err);
      activity.style.setProperty("--dynamic-accent", userAccent);
    }
  };
}

/* ======================================================= */
/* === DISCORD / LANYARD HANDLER ========================= */
/* ======================================================= */

async function getDiscord() {
  try {
    const res = await fetch(
      `https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}?_ts=${Date.now()}`,
      { cache: "no-store" }
    );

    const json = await res.json();
    const data = json.data;
    if (!data) return null;

    /* ───────────────────────────────────────────────
       LANYARD SPOTIFY DETECTED
    ─────────────────────────────────────────────── */
    if (data.spotify) {
      const sp = data.spotify;

      const now = Date.now();
      const startMs = sp.timestamps.start;
      const endMs   = sp.timestamps.end;

      const duration = endMs - startMs;
      const elapsed  = now - startMs;

      // Fix Lanyard drift
      let correctedStart = startMs;
      let correctedEnd   = endMs;

      if (elapsed < 0 || elapsed > duration + 5000) {
        correctedStart = now - sp.spotify_elapsed * 1000;
        correctedEnd   = correctedStart + sp.spotify_duration * 1000;
      }

      $$("spotify-card").classList.remove("hidden");
      $$("live-activity-cover").src = sp.album_art_url;
      $$("live-song-title").textContent = sp.song;
      $$("live-song-artist").textContent = sp.artist;

      currentSpotifyUrl = `https://open.spotify.com/track/${sp.track_id}`;

      setupProgress(correctedStart, correctedEnd);
      updateDynamicColors(sp.album_art_url);

      return { text: "Listening to Spotify", source: "spotify" };
    }

    /* ───────────────────────────────────────────────
       NO SPOTIFY — RETURN DISCORD STATUS
    ─────────────────────────────────────────────── */

    $$("spotify-card").classList.add("hidden");
    updateDynamicColors(null);

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
    const r = await fetch(`https://decapi.me/twitch/live/${u}`, { cache: "no-store" });
    const t = (await r.text()).toLowerCase();

    if (t.includes("is live")) {
      return { text: "Now Live on Twitch", source: "twitch" };
    }

    return null;
  } catch (e) {
    console.warn("Twitch error:", e);
    return null;
  }
}

/* ======================================================= */
/* === REDDIT ============================================ */
/* ======================================================= */

async function getReddit() {
  const u = CONFIG.reddit.username;
  if (!u) return null;

  try {
    const r = await fetch(`https://www.reddit.com/user/${u}/submitted.json?limit=1`, {
      cache: "no-store"
    });

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
    const r = await fetch(`https://api.github.com/users/${u}/events/public`, {
      cache: "no-store",
    });

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
    const res = await fetch(
      `https://r.jina.ai/http://www.tiktok.com/@${u}`,
      { cache: "no-store" }
    );

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
/* === STATUS PRIORITY LOGIC ============================= */
/* ======================================================= */

function applyStatusDecision({ main, twitchLive, temp }) {
  const spotifyCard = $$("spotify-card");

  // Temporary banner overrides everything
  if (temp && Date.now() < temp.expiresAt) {
    setStatusLine(temp.text, true, temp.source || "default");
    return;
  }

  // Spotify first
  if (main?.source === "spotify") {
    setStatusLine(main.text, true, "spotify");
    spotifyCard.classList.remove("hidden");
    return;
  }

  // Twitch live second
  if (twitchLive) {
    setStatusLine("Now Live on Twitch", true, "twitch");
    return;
  }

  // Discord status third
  if (main && main.text !== "No Current Active Activities") {
    setStatusLine(main.text, true, main.source || "discord");
    return;
  }

  // Default fallback
  setStatusLine("No Current Active Activities", true, "manual");
}

/* ======================================================= */
/* === UPDATE LOOP ======================================= */
/* ======================================================= */

async function updateLiveStatus() {
  const [discord, twitch, reddit, github, tiktok] = await Promise.all([
    getDiscord(),
    getTwitch(),
    getReddit(),
    getGitHub(),
    getTikTok(),
  ]);

  const main = discord || { text: "No Current Active Activities", source: "manual" };

  // Temp activity (Reddit, GitHub, TikTok)
  const temp = [reddit, github, tiktok].find((a) => a && a.isTemp);
  if (temp) {
    tempBanner = {
      text: temp.text,
      source: temp.source,
      expiresAt: Date.now() + TEMP_BANNER_MS,
    };
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

  // LANYARD → update every 5s
  setInterval(updateLiveStatus, 5000);

  // “Updated Xs ago”
  setInterval(updateLastUpdated, 1000);

});
