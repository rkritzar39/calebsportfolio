/* ======================================================
   🎧 Live Activity System — Multi-Platform + Real Spotify (Lanyard)
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

/* Timer for Spotify progress */
let progressInterval = null;

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
const $$ = id => document.getElementById(id);

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/* =========================
   ICON CLUSTER
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
    img.src = `https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/${source}.svg`;
    img.alt = source;
    icon.appendChild(img);

    // Spotify hover album cover
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
  const container = $$("toast-container");
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
   STATUS DISPLAY (text line + cluster)
========================= */
function showStatus(payload, allActive = []) {
  const el = $$("live-activity-text");
  const container = $$("live-activity");
  if (!el || !container) return;

  const { text, source } = payload || { text: "💬 Status", source: "manual" };
  el.textContent = text;
  container.classList.remove("hidden");
  container.classList.toggle("offline", !payload);
  container.classList.toggle("active", !!payload);

  updateIconCluster(allActive);

  if (payload?.temporary)
    showToast(`🔥 ${source.charAt(0).toUpperCase() + source.slice(1)} activity detected!`, BRAND_COLORS[source]);

  isTwitchLive = source === "twitch";
  container.classList.toggle("live-now", isTwitchLive);
  lastUpdateTime = Date.now();
  updateLastUpdated();
}

/* =========================
   LAST UPDATED TIMER
========================= */
function updateLastUpdated() {
  const updated = $$("live-activity-updated");
  const container = $$("live-activity");
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
   DISCORD (REAL Spotify via Lanyard) + status fallback
========================= */
async function getDiscordActivity() {
  const { userId } = CONFIG.discord;
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`, { cache: "no-store" });
    const { data } = await res.json();
    if (!data) return null;

    const spotify = data.spotify;                // Lanyard's direct spotify object (best for accuracy)
    const activities = data.activities || [];
    const game = activities.find(a => a.type === 0 && a.name && a.name !== "Spotify");

    const spotifyCard = $$("spotify-card");
    const discordStatus = $$("discord-status");
    const card = $$("live-activity");

    if (spotify) {
      // 🎵 Show Spotify card
      const title = spotify.song;
      const artist = spotify.artist;
      const cover = spotify.album_art_url || currentMusicCover;

      currentMusicCover = cover || null;

      // Fill UI
      $$("live-song-title").textContent = title || "Unknown Track";
      $$("live-song-artist").textContent = artist || "Unknown Artist";
      $$("live-activity-cover").src = cover || "path/to/default-cover.jpg";

      // Progress
      const start = spotify.timestamps?.start;
      const end   = spotify.timestamps?.end;
      setupProgress(start, end);

      // Toggle visibility
      spotifyCard.classList.remove("hidden");
      discordStatus.classList.add("hidden");
      card.classList.add("spotify-active");

      return { text: `🎵 Listening to “${title}” by ${artist}`, source: "spotify" };
    }

    // No Spotify → show Discord status/game (and ensure music UI hidden)
    $$("music-progress-bar").style.width = "0%";
    clearInterval(progressInterval);
    spotifyCard.classList.add("hidden");
    $$("live-activity").classList.remove("spotify-active");

    const statusMap = {
      online: { text: "🟢 Online on Discord", class: "status-online" },
      idle:   { text: "🌙 Idle on Discord",   class: "status-idle" },
      dnd:    { text: "⛔ Do Not Disturb",    class: "status-dnd" },
      offline:{ text: "⚫ Offline",           class: "status-offline" },
    };

    const presence = statusMap[data.discord_status] || statusMap.offline;

    // If playing a game, prefer that text
    const statusText = game?.name ? `🎮 Playing ${game.name}` : presence.text;

    // Fill fallback UI
    const icon = $$("status-icon");
    const text = $$("status-text");
    icon.className = `status-icon ${presence.class}`;
    text.textContent = statusText;

    discordStatus.classList.remove("hidden");

    // If fully offline, you may hide the whole card:
    if (data.discord_status === "offline") {
      $$("live-activity").classList.add("hidden");
    } else {
      $$("live-activity").classList.remove("hidden");
    }

    return { text: statusText, source: "discord" };
  } catch (err) {
    console.error("Discord API error:", err);
  }
  return null;
}

/* Progress setup using start/end ms from Lanyard */
function setupProgress(startMs, endMs) {
  const bar = $$("music-progress-bar");
  const elapsedEl = $$("elapsed-time");
  const remainingEl = $$("remaining-time");
  const totalEl = $$("total-time");
  if (!bar || !elapsedEl || !remainingEl || !totalEl || !startMs || !endMs) return;

  clearInterval(progressInterval);

  const totalSec = (endMs - startMs) / 1000;
  totalEl.textContent = formatTime(totalSec);

  function tick() {
    const now = Date.now();
    const elapsedSec = Math.min((now - startMs) / 1000, totalSec);
    const remainingSec = Math.max(totalSec - elapsedSec, 0);

    bar.style.width = `${(elapsedSec / totalSec) * 100}%`;
    elapsedEl.textContent = formatTime(elapsedSec);
    remainingEl.textContent = `-${formatTime(remainingSec)}`;
  }

  tick();
  progressInterval = setInterval(tick, 1000);
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
    getDiscordActivity,   // includes Spotify + status fallback + card toggling
    getGitHubStatus,
    getRedditStatus,
    getTikTokStatus,
  ];

  const active = [];
  for (const fn of sources) {
    try {
      const result = await fn();
      if (result) active.push(result);
    } catch {}
  }

  const live = active.find(a => !a.temporary) || active[0];
  showStatus(live || { text: "🛌 Offline", source: "offline" }, active);

  // If absolutely nothing active and Discord offline, hide whole widget
  if (!active.length) {
    $$("live-activity").classList.add("hidden");
  } else {
    $$("live-activity").classList.remove("hidden");
  }
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  updateLiveStatus();
  setInterval(updateLiveStatus, 5000);   // presence refresh
  setInterval(updateLastUpdated, 1000);  // "Updated Xs ago"
});
