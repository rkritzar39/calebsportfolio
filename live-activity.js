/* ======================================================
   🎧 Live Activity — Multi-Platform + Logos + Manual Override (Final)
   ====================================================== */

import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/* =========================
   CONFIG
========================= */
const CONFIG = {
  twitch: { user: "calebkritzar", clientId: "n7e3lys858u96xlg7v2aohe8vzxha3", token: "wh1m17qfuq5dkh5b78ekk6oh5wc8wm" },
  github: { username: "rkritzar39" },
  reddit: { username: "Electronic_Row_1262" },
  steam:  { steamId64: "76561199283946668", apiKey: "B254FC3875EF0EB1AAEBA9FACFA81C1F" },
  discord:{ userId: "850815059093356594" },
  tiktok: { username: "calebkritzar" },
};

/* =========================
   BRAND ICONS / COLORS
========================= */
const BRAND_LOGOS = {
  twitch: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/twitch.svg",
  tiktok: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/tiktok.svg",
  github: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/github.svg",
  reddit: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/reddit.svg",
  steam:  "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/steam.svg",
  spotify:"https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/spotify.svg",
  discord:"https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg",
  manual: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/user.svg",
  offline:"https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/offline.svg"
};

const BRAND_COLORS = {
  twitch: "#9146FF",
  tiktok: "#EE1D52",
  github: "#181717",
  reddit: "#FF4500",
  steam:  "#00ADEE",
  spotify:"#1DB954",
  discord:"#5865F2",
  manual: "var(--accent-color)",
  offline:"#666666"
};

/* =========================
   GLOBALS
========================= */
let lastUpdateTime = null;
let currentMusicCover = null;
let progressInterval = null;
let currentSpotifyUrl = null;

const $$ = id => document.getElementById(id);
const setText = (id, val) => { const el = $$(id); if (el) el.textContent = val; };
function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/* =========================
   HONEYCOMB CLUSTER
========================= */
function updateIconCluster(platforms) {
  const cluster = $$("icon-cluster");
  if (!cluster) return;
  cluster.innerHTML = "";

  platforms.forEach(({ source, text, temporary }) => {
    const icon = document.createElement("div");
    icon.className = `cluster-icon ${source}`;
    icon.style.backgroundColor = BRAND_COLORS[source] || "var(--accent-color)";
    icon.setAttribute("data-tooltip", `${source.charAt(0).toUpperCase() + source.slice(1)} — ${text}`);

    const img = document.createElement("img");
    img.src = BRAND_LOGOS[source] || BRAND_LOGOS.manual;
    img.alt = source;
    icon.appendChild(img);

    cluster.appendChild(icon);

    if (temporary) {
      setTimeout(() => {
        icon.classList.add("fade-out");
        setTimeout(() => icon.remove(), 700);
      }, 4500);
    }
  });
}

/* =========================
   STATUS LINE
========================= */
function setStatusLine(text, source = "manual") {
  const logo = document.getElementById("status-icon-logo");
  const line = document.getElementById("status-line-text");
  if (logo && line) {
    logo.src = BRAND_LOGOS[source] || BRAND_LOGOS.manual;
    logo.alt = source;
    line.textContent = text || "—";
  }
  lastUpdateTime = Date.now();
  updateLastUpdated();
}

function updateLastUpdated() {
  const el = $$("live-activity-updated");
  if (!el || !lastUpdateTime) return;
  const sec = Math.floor((Date.now() - lastUpdateTime) / 1000);
  let t = "Updated just now";
  if (sec >= 60 && sec < 3600) t = `Updated ${Math.floor(sec / 60)}m ago`;
  else if (sec >= 10 && sec < 60) t = `Updated ${sec}s ago`;
  else if (sec >= 3600) t = `Updated ${Math.floor(sec / 3600)}h ago`;
  el.textContent = t;
}

/* =========================
   FIRESTORE MANUAL STATUS
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
   PLATFORM FETCHERS
========================= */
async function getTwitchStatus() {
  const { user, clientId, token } = CONFIG.twitch;
  try {
    const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${user}`, {
      headers: { "Client-ID": clientId, "Authorization": `Bearer ${token}` },
      cache: "no-store"
    });
    const data = await res.json();
    const stream = data?.data?.[0];
    if (stream?.title) return { text: `Streaming on Twitch — ${stream.title}`, source: "twitch" };
  } catch {}
  return null;
}

async function getSteamStatus() {
  const { steamId64, apiKey } = CONFIG.steam;
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId64}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    const p = data?.response?.players?.[0];
    if (p?.gameextrainfo) return { text: `Playing ${p.gameextrainfo} on Steam`, source: "steam" };
  } catch {}
  return null;
}

async function getGitHubStatus() {
  const { username } = CONFIG.github;
  if (wasRecentlyShown("github")) return null;
  try {
    const res = await fetch(`https://api.github.com/users/${username}/events/public?_=${Date.now()}`, { cache: "no-store" });
    const events = await res.json();
    const latest = events?.[0];
    if (latest?.repo) {
      markAsShown("github");
      return { text: `Updated ${latest.repo.name}`, source: "github", temporary: true };
    }
  } catch {}
  return null;
}

async function getRedditStatus() {
  const { username } = CONFIG.reddit;
  if (wasRecentlyShown("reddit")) return null;
  try {
    const res = await fetch(`https://www.reddit.com/user/${username}/submitted.json?limit=1&_=${Date.now()}`, { cache: "no-store" });
    const data = await res.json();
    const post = data?.data?.children?.[0]?.data;
    if (post) {
      markAsShown("reddit");
      return { text: `Posted on r/${post.subreddit} — “${post.title}”`, source: "reddit", temporary: true };
    }
  } catch {}
  return null;
}

async function getTikTokStatus() {
  const { username } = CONFIG.tiktok;
  if (wasRecentlyShown("tiktok")) return null;
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${username}`, { cache: "no-store" });
    const data = await res.json();
    if (data?.title) {
      markAsShown("tiktok");
      return { text: `Posted on TikTok — “${data.title}”`, source: "tiktok", temporary: true };
    }
  } catch {}
  return null;
}

/* =========================
   DISCORD + SPOTIFY
========================= */
async function getDiscordActivity() {
  const { userId } = CONFIG.discord;
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`, { cache: "no-store" });
    const { data } = await res.json();
    if (!data) return null;

    const sp = data.spotify;
    const activities = data.activities || [];
    const game = activities.find(a => a.type === 0 && a.name && a.name !== "Spotify");

    // Spotify
    if (sp) {
      const { song, artist, album_art_url, track_id, timestamps } = sp;
      $$("spotify-card").classList.remove("hidden");
      $$("live-activity-cover").src = album_art_url;
      setText("live-song-title", song);
      setText("live-song-artist", artist);
      currentSpotifyUrl = `https://open.spotify.com/track/${track_id}`;
      setupProgress(timestamps.start, timestamps.end);
      setStatusLine("Listening to Spotify", "spotify");
      return { text: `Listening to “${song}” by ${artist}`, source: "spotify" };
    }

    // Discord fallback
    $$("spotify-card").classList.add("hidden");
    if (progressInterval) clearInterval(progressInterval);
    const map = {
      online: "Online on Discord",
      idle: "Idle on Discord",
      dnd: "Do Not Disturb",
      offline: "Offline"
    };
    const statusText = game?.name ? `Playing ${game.name}` : (map[data.discord_status] || "Online on Discord");
    setStatusLine(statusText, "discord");
    return { text: statusText, source: "discord" };
  } catch (e) {
    console.error("Discord/Lanyard error:", e);
  }
  return null;
}

/* =========================
   PROGRESS BAR
========================= */
function setupProgress(startMs, endMs) {
  const bar = $$("music-progress-bar");
  const elapsedEl = $$("elapsed-time");
  const remainingEl = $$("remaining-time");
  const totalEl = $$("total-time");
  if (!bar || !elapsedEl || !remainingEl || !totalEl || !startMs || !endMs) return;
  if (progressInterval) clearInterval(progressInterval);
  const totalSec = (endMs - startMs) / 1000;
  totalEl.textContent = formatTime(totalSec);
  function tick() {
    const now = Date.now();
    const elapsed = Math.min((now - startMs) / 1000, totalSec);
    const remaining = Math.max(totalSec - elapsed, 0);
    bar.style.width = `${(elapsed / totalSec) * 100}%`;
    elapsedEl.textContent = formatTime(elapsed);
    remainingEl.textContent = `-${formatTime(remaining)}`;
  }
  tick();
  progressInterval = setInterval(tick, 1000);
}

/* =========================
   COMBINE SOURCES
========================= */
async function updateLiveStatus() {
  const sources = [
    getManualStatus,
    getTwitchStatus,
    getSteamStatus,
    getDiscordActivity,
    getGitHubStatus,
    getRedditStatus,
    getTikTokStatus
  ];
  const allActive = [];
  for (const fn of sources) {
    try {
      const res = await fn();
      if (res) allActive.push(res);
    } catch {}
  }
  const priority = ["spotify", "discord", "twitch", "steam", "manual"];
  const main = allActive.sort((a, b) => priority.indexOf(a.source) - priority.indexOf(b.source))[0];
  if (main) setStatusLine(main.text, main.source);
  updateIconCluster(allActive.slice(0, 9));
  $$("live-activity").classList.toggle("hidden", !allActive.length);
}

/* =========================
   HELPERS
========================= */
function wasRecentlyShown(p, c = 300000) {
  const last = localStorage.getItem(`last_${p}_shown`);
  return last && Date.now() - parseInt(last, 10) < c;
}
function markAsShown(p) {
  localStorage.setItem(`last_${p}_shown`, Date.now().toString());
}

/* =========================
   SPOTIFY CLICK-THROUGH
========================= */
function bindSpotifyClickThrough() {
  const card = $$("spotify-card");
  if (!card) return;
  card.addEventListener("click", () => {
    if (currentSpotifyUrl) window.open(currentSpotifyUrl, "_blank", "noopener");
  });
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  bindSpotifyClickThrough();
  updateLiveStatus();
  setInterval(updateLiveStatus, 8000);
  setInterval(updateLastUpdated, 1000);
});
