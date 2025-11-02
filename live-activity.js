/* ======================================================
   🎧 Live Activity System — Spotify Progress + Time Edition
   ====================================================== */

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/* =========================
   CONFIG
========================= */
const CONFIG = {
  twitch: { user: "calebkritzar", clientId: "n7e3lys858u96xlg7v2aohe8vzxha3", token: "wh1m17qfuq5dkh5b78ekk6oh5wc8wm" },
  github: { username: "rkritzar39" },
  reddit: { username: "Electronic_Row_1262" },
  steam: { steamId64: "76561199283946668", apiKey: "B254FC3875EF0EB1AAEBA9FACFA81C1F" },
  discord: { userId: "850815059093356594" },
  tiktok: { username: "calebkritzar" },
};

/* =========================
   BRAND COLORS
========================= */
const BRAND_COLORS = {
  twitch: "#9146FF",
  tiktok: "#EE1D52",
  github: "#181717",
  reddit: "#FF4500",
  steam: "#00ADEE",
  spotify: "#1DB954",
  discord: "#5865F2",
  manual: "var(--accent-color)",
  offline: "#666666"
};

/* =========================
   GLOBALS
========================= */
let lastUpdateTime = null;
let isTwitchLive = false;
let currentMusicCover = null;
let spotifyProgressInterval = null;

/* =========================
   UTILS
========================= */
function wasRecentlyShown(platform, cooldown = 300000) {
  const last = localStorage.getItem(`last_${platform}_shown`);
  return last && Date.now() - parseInt(last, 10) < cooldown;
}
function markAsShown(platform) {
  localStorage.setItem(`last_${platform}_shown`, Date.now().toString());
}

/* =========================
   ICON CLUSTER
========================= */
function updateIconCluster(platforms) {
  const cluster = document.getElementById("icon-cluster");
  if (!cluster) return;
  cluster.innerHTML = "";

  platforms.forEach(({ source, text, temporary }) => {
    const icon = document.createElement("div");
    icon.className = `cluster-icon ${source}`;
    icon.style.backgroundColor = BRAND_COLORS[source] || "var(--accent-color)";
    icon.setAttribute("data-tooltip", `${source.charAt(0).toUpperCase() + source.slice(1)} — ${text}`);

    const img = document.createElement("img");
    img.src = `https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/${source}.svg`;
    img.alt = source;
    icon.appendChild(img);

    // 🎵 Spotify hover album art
    if (source === "spotify" && currentMusicCover) {
      const hoverArt = document.createElement("div");
      hoverArt.className = "spotify-hover-art";
      const artImg = document.createElement("img");
      artImg.src = currentMusicCover;
      artImg.alt = "Music Cover";
      hoverArt.appendChild(artImg);
      icon.appendChild(hoverArt);
    }

    cluster.appendChild(icon);

    if (temporary) {
      setTimeout(() => {
        icon.classList.add("fade-out");
        setTimeout(() => icon.remove(), 800);
      }, 5000);
    }
  });
}

/* =========================
   TOASTS
========================= */
function showToast(message, color = "var(--accent-color)") {
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

/* =========================
   STATUS DISPLAY
========================= */
function showStatus(payload, allActive = []) {
  const el = document.getElementById("live-activity-text");
  const container = document.getElementById("live-activity");
  const bar = document.getElementById("music-progress-bar");
  const time = document.getElementById("music-progress-time");

  if (!el || !container) return;

  const { text, source } = payload || { text: "💬 Status", source: "manual" };
  el.textContent = text;
  container.classList.remove("hidden");
  container.classList.toggle("offline", !payload);
  container.classList.toggle("active", !!payload);

  // reset progress if not Spotify
  if (bar && source !== "spotify") {
    bar.style.width = "0%";
    clearInterval(spotifyProgressInterval);
  }
  if (time && source !== "spotify") time.textContent = "";

  updateIconCluster(allActive);

  if (payload?.temporary)
    showToast(`🔥 ${source.charAt(0).toUpperCase() + source.slice(1)} activity detected!`);

  isTwitchLive = source === "twitch";
  container.classList.toggle("live-now", isTwitchLive);
  lastUpdateTime = Date.now();
  updateLastUpdated();
}

/* =========================
   LAST UPDATED TIMER
========================= */
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

/* =========================
   FIRESTORE MANUAL STATUS
========================= */
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

/* =========================
   TWITCH STATUS
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
    if (stream?.title)
      return { text: `🟣 Streaming on Twitch — ${stream.title}`, source: "twitch" };
  } catch {}
  return null;
}

/* =========================
   STEAM STATUS
========================= */
async function getSteamStatus() {
  const { steamId64, apiKey } = CONFIG.steam;
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId64}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    const player = data?.response?.players?.[0];
    if (player?.gameextrainfo)
      return { text: `🎮 Playing ${player.gameextrainfo} on Steam`, source: "steam" };
  } catch {}
  return null;
}

/* =========================
   DISCORD / SPOTIFY ACTIVITY
========================= */
async function getDiscordActivity() {
  const { userId } = CONFIG.discord;
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`, { cache: "no-store" });
    const { data } = await res.json();
    if (!data) return null;

    const activities = data.activities || [];
    const spotify = activities.find(a => a.name === "Spotify");

    if (spotify?.details && spotify?.state) {
      const trackTitle = spotify.details;
      const artist = spotify.state;

      // album art fix
      let musicCover = null;
      if (spotify.assets?.large_image) {
        const raw = spotify.assets.large_image.trim();
        let hash = null;
        if (raw.startsWith("mp:spotify:image:")) hash = raw.replace("mp:spotify:image:", "");
        else if (raw.startsWith("spotify:image:")) hash = raw.replace("spotify:image:", "");
        else if (raw.startsWith("mp:external/")) hash = raw.replace("mp:external/", "");
        else if (raw.startsWith("mp:")) hash = raw.replace("mp:", "");
        else if (raw.startsWith("https://")) musicCover = raw;
        if (!musicCover && hash) {
          const cleanHash = hash
            .split("?")[0]
            .replace(/_/g, "")
            .replace(/^spotify:image:/, "")
            .trim();
          musicCover = `https://i.scdn.co/image/${cleanHash}`;
        }
      }

      // progress bar + time
      const timestamps = spotify.timestamps || {};
      const bar = document.getElementById("music-progress-bar");
      const time = document.getElementById("music-progress-time");
      clearInterval(spotifyProgressInterval);

      if (timestamps.start && timestamps.end && bar && time) {
        const start = timestamps.start;
        const end = timestamps.end;
        const duration = end - start;

        function format(ms) {
          const totalSec = Math.floor(ms / 1000);
          const min = Math.floor(totalSec / 60);
          const sec = String(totalSec % 60).padStart(2, "0");
          return `${min}:${sec}`;
        }

        spotifyProgressInterval = setInterval(() => {
          const now = Date.now();
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1) * 100;
          bar.style.width = `${progress}%`;

          const elapsedText = format(elapsed);
          const totalText = format(duration);
          time.textContent = `${elapsedText} / ${totalText}`;

          if (progress >= 100) clearInterval(spotifyProgressInterval);
        }, 1000);
      }

      currentMusicCover = musicCover || null;
      document.getElementById("live-activity")?.classList.add("spotify-active");
      return { text: `🎵 Listening to “${trackTitle}” by ${artist}`, source: "spotify" };
    }

    const game = activities.find(a => a.type === 0);
    if (game?.name) return { text: `🎮 Playing ${game.name}`, source: "discord" };

    const statusMap = {
      online: "🟢 Online on Discord",
      idle: "🌙 Idle on Discord",
      dnd: "⛔ Do Not Disturb",
    };
    if (data.discord_status !== "offline")
      return { text: statusMap[data.discord_status] || "💬 Online on Discord", source: "discord" };
  } catch (err) {
    console.error("Discord API error:", err);
  }
  return null;
}

/* =========================
   GITHUB STATUS
========================= */
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

/* =========================
   REDDIT STATUS
========================= */
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

/* =========================
   TIKTOK STATUS
========================= */
async function getTikTokStatus() {
  const { username } = CONFIG.tiktok;
  if (wasRecentlyShown("tiktok")) return null;
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${username}`, { cache: "no-store" });
    const data = await res.json();
    if (data?.title) {
      markAsShown("tiktok");
      return { text: `🎬 Posted on TikTok — “${data.title}”`, source: "tiktok", temporary: true };
    }
  } catch {}
  return null;
}

/* =========================
   UPDATE LOOP
========================= */
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

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  updateLiveStatus();
  setInterval(updateLiveStatus, 30000);
  setInterval(updateLastUpdated, 1000);
});
