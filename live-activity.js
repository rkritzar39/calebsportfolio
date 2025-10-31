/* =======================================================
   Live Activity System — Smart Expiring Edition ⚡
   ======================================================= */

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/* ================================
   CONFIG
================================ */
const CONFIG = {
  twitch: { user: "calebkritzar", clientId: "n7e3lys858u96xlg7v2aohe8vzxha3", token: "wh1m17qfuq5dkh5b78ekk6oh5wc8wm" },
  github: { username: "rkritzar39" },
  reddit: { username: "Electronic_Row_1262" },
  steam: { steamId64: "76561199283946668", apiKey: "B254FC3875EF0EB1AAEBA9FACFA81C1F" },
  discord: { userId: "850815059093356594" },
  tiktok: { username: "calebkritzar" },
};

/* ================================
   PLATFORM ICONS + COLORS
================================ */
const PLATFORM_STYLE = {
  twitch:  { color: "#9146FF", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/twitch.svg" },
  tiktok:  { color: "#000000", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/tiktok.svg" },
  github:  { color: "#181717", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/github.svg" },
  reddit:  { color: "#FF4500", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/reddit.svg" },
  steam:   { color: "#171A21", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/steam.svg" },
  spotify: { color: "#1DB954", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/spotify.svg" },
  discord: { color: "#5865F2", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg" },
  manual:  { color: "var(--accent-color)", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/activitypub.svg" },
  offline: { color: "#999999", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg" },
};

/* ================================
   PRIORITY + TEMPORARY TRACKER
================================ */
function getPriority(source) {
  if (["twitch", "steam", "spotify", "discord"].includes(source)) return 3;
  if (["github", "reddit", "tiktok"].includes(source)) return 2;
  if (["manual"].includes(source)) return 1;
  return 0;
}

// persistent temporary map
const TEMP_TRACKER = new Map();
const TEMP_LIFETIME = 90 * 1000; // 90s

function markTemporary(source, text) {
  const key = `${source}:${text}`;
  if (!TEMP_TRACKER.has(key)) TEMP_TRACKER.set(key, Date.now());
}

function isTemporaryExpired(source, text) {
  const key = `${source}:${text}`;
  if (!TEMP_TRACKER.has(key)) return false;
  return Date.now() - TEMP_TRACKER.get(key) > TEMP_LIFETIME;
}

/* ================================
   RENDER / DISPLAY
================================ */
function showStatus(activities, isOffline = false) {
  const container = document.getElementById("live-activity");
  const iconEl = document.getElementById("activity-icon");
  const textEl = document.getElementById("live-activity-text");
  if (!container || !iconEl || !textEl) return;

  const filtered = (Array.isArray(activities) ? activities : [activities]).filter(a => {
    const p = getPriority(a.source);
    if (p === 2) {
      markTemporary(a.source, a.text);
      return !isTemporaryExpired(a.source, a.text);
    }
    return true;
  });

  const sorted = filtered.sort((a, b) => getPriority(b.source) - getPriority(a.source));
  const top = sorted[0] || { text: "🛌 Offline", source: "offline" };
  const { color, icon } = PLATFORM_STYLE[top.source] || PLATFORM_STYLE.discord;
  const highest = getPriority(top.source);

  const textHTML = sorted
    .map(a => {
      const { icon: i, color: c } = PLATFORM_STYLE[a.source] || {};
      const opacity = getPriority(a.source) < highest ? 0.55 : 1;
      const italic = getPriority(a.source) < highest ? "italic" : "normal";
      return `<span class="activity-item" style="opacity:${opacity};font-style:${italic}">
        <img src="${i}" class="inline-icon" alt="${a.source}" style="fill:${c};filter:none"/> ${a.text}
      </span>`;
    })
    .join('<span class="divider"> • </span>');

  // fade animation
  textEl.classList.add("fade-out");
  setTimeout(() => {
    textEl.innerHTML = textHTML;
    textEl.style.color = color;
    textEl.classList.remove("fade-out");
    textEl.classList.add("fade-in");
    setTimeout(() => textEl.classList.remove("fade-in"), 400);
  }, 200);

  iconEl.src = icon;
  iconEl.className = `activity-icon ${top.source} change`;

  container.style.background = `linear-gradient(90deg, color-mix(in srgb, ${color} 30%, transparent), color-mix(in srgb, var(--content-bg) 80%, transparent))`;
  container.style.boxShadow = `0 0 25px ${color}70, 0 0 40px ${color}40 inset`;

  const glow = highest === 3 ? "neon" : highest === 2 ? "mid" : "soft";
  container.dataset.glow = glow;
  container.classList.remove("hidden");
}

/* ================================
   PLATFORM FETCHERS
================================ */
async function getManualStatus() {
  try {
    const snap = await getDoc(doc(db, "live_status", "current"));
    if (snap.exists()) {
      const msg = snap.data().message;
      if (msg && msg.trim()) return [{ text: msg, source: "manual" }];
    }
    return [];
  } catch { return []; }
}

async function getTwitchStatus() {
  const { user, clientId, token } = CONFIG.twitch;
  try {
    const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${user}`, {
      headers: { "Client-ID": clientId, Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const stream = data?.data?.[0];
    if (stream?.title)
      return [{ text: `🟣 Streaming — ${stream.title}`, source: "twitch" }];
    return [];
  } catch { return []; }
}

async function getSteamStatus() {
  const { steamId64, apiKey } = CONFIG.steam;
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId64}`
    );
    const data = await res.json();
    const player = data?.response?.players?.[0];
    if (player?.gameextrainfo)
      return [{ text: `🎮 Playing ${player.gameextrainfo}`, source: "steam" }];
    return [];
  } catch { return []; }
}

async function getDiscordActivity() {
  const { userId } = CONFIG.discord;
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
    const { data } = await res.json();
    if (!data) return [];

    const acts = data.activities || [];
    const results = [];

    const spotify = acts.find(a => a.name === "Spotify");
    if (spotify?.details && spotify?.state)
      results.push({ text: `🎵 “${spotify.details}” by ${spotify.state}`, source: "spotify" });

    const game = acts.find(a => a.type === 0);
    if (game?.name)
      results.push({ text: `🎮 Playing ${game.name}`, source: "discord" });

    const statusMap = { online: "🟢 Online", idle: "🌙 Idle", dnd: "⛔ Busy" };
    if (data.discord_status !== "offline" && results.length === 0)
      results.push({ text: `${statusMap[data.discord_status]} on Discord`, source: "discord" });

    return results;
  } catch { return []; }
}

async function getGitHubStatus() {
  const { username } = CONFIG.github;
  try {
    const res = await fetch(`https://api.github.com/users/${username}/events/public`);
    const events = await res.json();
    const latest = events?.[0];
    if (!latest) return [];
    const repo = latest.repo?.name ?? "a repo";
    if (latest.type === "PushEvent")
      return [{ text: `💻 Pushed to ${repo}`, source: "github" }];
    if (latest.type === "PullRequestEvent")
      return [{ text: `🧩 Opened PR on ${repo}`, source: "github" }];
    return [];
  } catch { return []; }
}

async function getRedditStatus() {
  const { username } = CONFIG.reddit;
  try {
    const res = await fetch(`https://www.reddit.com/user/${username}/submitted.json`);
    const data = await res.json();
    const post = data?.data?.children?.[0]?.data;
    if (post)
      return [{ text: `📢 “${post.title}” on r/${post.subreddit}`, source: "reddit" }];
    return [];
  } catch { return []; }
}

async function getTikTokStatus() {
  const { username } = CONFIG.tiktok;
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${username}`);
    const data = await res.json();
    if (data?.title)
      return [{ text: `🎬 “${data.title}”`, source: "tiktok" }];
    return [];
  } catch { return []; }
}

/* ================================
   MAIN LOOP
================================ */
async function updateLiveStatus() {
  const results = await Promise.all([
    getManualStatus(),
    getTwitchStatus(),
    getSteamStatus(),
    getDiscordActivity(),
    getGitHubStatus(),
    getRedditStatus(),
    getTikTokStatus(),
  ]);

  const active = results.flat();
  if (active.length > 0) showStatus(active);
  else showStatus({ text: "🛌 Offline", source: "offline" }, true);
}

document.addEventListener("DOMContentLoaded", () => {
  updateLiveStatus();
  setInterval(updateLiveStatus, 15000);
});
