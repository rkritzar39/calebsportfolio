/* ======================================================
   🎧 Live Activity System — Polished Final Version
   ====================================================== */

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/* ======================================================
   ⚙️ CONFIG
   ====================================================== */
const CONFIG = {
  twitch: { user: "calebkritzar", clientId: "n7e3lys858u96xlg7v2aohe8vzxha3", token: "wh1m17qfuq5dkh5b78ekk6oh5wc8wm" },
  github: { username: "rkritzar39" },
  reddit: { username: "Electronic_Row_1262" },
  steam: { steamId64: "76561199283946668", apiKey: "B254FC3875EF0EB1AAEBA9FACFA81C1F" },
  discord: { userId: "850815059093356594" },
  tiktok: { username: "calebkritzar" },
};

/* ======================================================
   🎨 BRAND COLORS
   ====================================================== */
const BRAND_COLORS = {
  twitch: "#9146FF",
  tiktok: "#010101",
  github: "#181717",
  reddit: "#FF4500",
  steam: "#171A21",
  spotify: "#1DB954",
  discord: "#5865F2",
  manual: "#8888FF",
  offline: "#666666"
};

/* ======================================================
   🧩 GLOBALS
   ====================================================== */
let lastUpdateTime = null;
let isTwitchLive = false;
let currentMusicCover = null;

/* ======================================================
   🧠 COOLDOWN HANDLING (Temporary Event Logic)
   ====================================================== */
function wasRecentlyShown(platform, cooldown = 300000) {
  const last = localStorage.getItem(`last_${platform}_shown`);
  return last && Date.now() - parseInt(last, 10) < cooldown;
}
function markAsShown(platform) {
  localStorage.setItem(`last_${platform}_shown`, Date.now().toString());
}

/* ======================================================
   🐝 ICON CLUSTER BUILDER
   ====================================================== */
function updateIconCluster(platforms) {
  const cluster = document.getElementById("icon-cluster");
  if (!cluster) return;
  cluster.innerHTML = "";

  platforms.forEach(({ source, text, temporary }) => {
    const icon = document.createElement("div");
    icon.className = `cluster-icon ${source}`;
    icon.style.backgroundColor = BRAND_COLORS[source] || "#777";

    const tooltipText = text
      ? `${source.charAt(0).toUpperCase() + source.slice(1)} — ${text}`
      : source.charAt(0).toUpperCase() + source.slice(1);
    icon.setAttribute("data-tooltip", tooltipText);

    const img = document.createElement("img");
    img.src = `https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/${source}.svg`;
    img.alt = source;
    icon.appendChild(img);
    cluster.appendChild(icon);

    // 🎵 Spotify hover music cover
    if (source === "spotify" && currentMusicCover) {
      const hoverArt = document.createElement("div");
      hoverArt.className = "spotify-hover-art";
      const imgArt = document.createElement("img");
      imgArt.src = currentMusicCover;
      imgArt.alt = "Music Cover";
      hoverArt.appendChild(imgArt);
      icon.appendChild(hoverArt);
    }

    // ⏳ Fade temporary icons
    if (temporary) {
      setTimeout(() => {
        icon.classList.add("fade-out");
        setTimeout(() => icon.remove(), 800);
      }, 5000);
    }

    // Touch / mobile tooltip support
    let holdTimer;
    icon.addEventListener("touchstart", () => {
      holdTimer = setTimeout(() => icon.classList.add("touch-active"), 400);
    });
    icon.addEventListener("touchend", () => {
      clearTimeout(holdTimer);
      setTimeout(() => icon.classList.remove("touch-active"), 1500);
    });
  });
}

/* ======================================================
   🔔 TOAST NOTIFICATIONS
   ====================================================== */
function showToast(message, color = "#555") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.style.borderLeft = `4px solid ${color}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

/* ======================================================
   🪄 STATUS DISPLAY
   ====================================================== */
function showStatus(payload, allActive = []) {
  const el = document.getElementById("live-activity-text");
  const container = document.getElementById("live-activity");
  if (!el || !container) return;

  const { text, source } = payload || { text: "💬 Status", source: "manual" };
  el.textContent = text;

  container.classList.remove("hidden");
  container.classList.toggle("offline", !payload);
  container.classList.toggle("active", !!payload);
  container.style.setProperty("--accent-color", BRAND_COLORS[source] || "#999");

  updateIconCluster(allActive);

  if (payload?.temporary) {
    showToast(`🔥 ${source.charAt(0).toUpperCase() + source.slice(1)} activity detected!`, BRAND_COLORS[source]);
  }

  isTwitchLive = source === "twitch";
  container.classList.toggle("live-now", isTwitchLive);

  lastUpdateTime = Date.now();
  updateLastUpdated();
}

/* ======================================================
   🕒 LAST UPDATED TIMER
   ====================================================== */
function updateLastUpdated() {
  const updated = document.getElementById("live-activity-updated");
  const container = document.getElementById("live-activity");
  if (!updated || !lastUpdateTime) return;

  if (isTwitchLive) {
    updated.textContent = "🟣 Live Now";
    container.classList.add("live-now");
    return;
  } else container.classList.remove("live-now");

  const elapsed = Math.floor((Date.now() - lastUpdateTime) / 1000);
  let text;
  if (elapsed < 10) text = "Updated just now";
  else if (elapsed < 60) text = `Updated ${elapsed}s ago`;
  else if (elapsed < 3600) text = `Updated ${Math.floor(elapsed / 60)}m ago`;
  else text = `Updated ${Math.floor(elapsed / 3600)}h ago`;

  updated.textContent = text;
}

/* ======================================================
   🌐 PLATFORM FETCHERS
   ====================================================== */
async function getManualStatus() {
  try {
    const snap = await getDoc(doc(db, "live_status", "current"));
    if (snap.exists()) {
      const msg = snap.data().message;
      if (msg && msg.trim()) return { text: msg, source: "manual" };
    }
  } catch {}
  return null;
}

async function getTwitchStatus() {
  const { user, clientId, token } = CONFIG.twitch;
  try {
    const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${user}`, {
      headers: { "Client-ID": clientId, "Authorization": `Bearer ${token}` },
      cache: "no-store"
    });
    const data = await res.json();
    const stream = data?.data?.[0];
    if (stream?.title) return { text: `🟣 Streaming on Twitch — ${stream.title}`, source: "twitch" };
  } catch {}
  return null;
}

async function getSteamStatus() {
  const { steamId64, apiKey } = CONFIG.steam;
  try {
    const res = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId64}`, { cache: "no-store" });
    const data = await res.json();
    const player = data?.response?.players?.[0];
    if (player?.gameextrainfo) return { text: `🎮 Playing ${player.gameextrainfo} on Steam`, source: "steam" };
  } catch {}
  return null;
}

async function getDiscordActivity() {
  const { userId } = CONFIG.discord;
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`, { cache: "no-store" });
    const { data } = await res.json();
    if (!data) return null;

    const activities = data.activities || [];

    // 🎵 Spotify music cover + now playing
    const spotify = activities.find(a => a.name === "Spotify");
    if (spotify?.details && spotify?.state) {
      const trackTitle = spotify.details;
      const artist = spotify.state;
      let musicCover = null;

      if (spotify.assets?.large_image) {
        const raw = spotify.assets.large_image;
        if (raw.startsWith("spotify:")) musicCover = null;
        else if (raw.startsWith("mp:")) musicCover = raw.replace("mp:", "https://i.scdn.co/image/");
        else if (raw.startsWith("https")) musicCover = raw;
      }

      currentMusicCover = musicCover || null;
      return { text: `🎵 Listening to “${trackTitle}” by ${artist}`, source: "spotify" };
    }

    // 🎮 Game
    const game = activities.find(a => a.type === 0);
    if (game?.name) return { text: `🎮 Playing ${game.name}`, source: "discord" };

    // 💬 Presence
    const statusMap = {
      online: "🟢 Online on Discord",
      idle: "🌙 Idle on Discord",
      dnd: "⛔ Do Not Disturb",
    };
    if (data.discord_status !== "offline") return { text: statusMap[data.discord_status] || "💬 Online on Discord", source: "discord" };
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
      return { text: `💻 Updated ${latest.repo.name}`, source: "github", temporary: true };
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
      return { text: `📢 Posted on r/${post.subreddit} — “${post.title}”`, source: "reddit", temporary: true };
    }
  } catch {}
  return null;
}

async function getTikTokStatus() {
  const { username } = CONFIG.tiktok;
  if (wasRecentlyShown("tiktok")) return null;
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${username}/video/${Date.now()}`, { cache: "no-store" });
    const data = await res.json();
    if (data?.title) {
      markAsShown("tiktok");
      return { text: `🎬 Posted on TikTok — “${data.title}”`, source: "tiktok", temporary: true };
    }
  } catch {}
  return null;
}

/* ======================================================
   🔁 MAIN UPDATE LOOP
   ====================================================== */
async function updateLiveStatus() {
  const sources = [
    getManualStatus,
    getTwitchStatus,
    getSteamStatus,
    getDiscordActivity,
    getGitHubStatus,
    getRedditStatus,
    getTikTokStatus,
  ];

  const active = [];
  for (const fn of sources) {
    const result = await fn();
    if (result) active.push(result);
  }

  const live = active.find(a => !a.temporary) || active[0];
  showStatus(live || { text: "🛌 Offline", source: "offline" }, active);
}

/* ======================================================
   🚀 INIT
   ====================================================== */
document.addEventListener("DOMContentLoaded", () => {
  updateLiveStatus();
  setInterval(updateLiveStatus, 30000);
  setInterval(updateLastUpdated, 1000);
});
