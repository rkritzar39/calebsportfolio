/* =======================================================
   Live Activity System (Color Dynamic Edition)
   Platforms: Manual • Twitch • GitHub • Reddit • Steam • Discord • TikTok
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
  twitch: {
    user: "calebkritzar",
    clientId: "n7e3lys858u96xlg7v2aohe8vzxha3",
    token: "wh1m17qfuq5dkh5b78ekk6oh5wc8wm", // ⚠️ move server-side later
  },
  github: { username: "rkritzar39" },
  reddit: { username: "Electronic_Row_1262" },
  steam: {
    steamId64: "76561199283946668",
    apiKey: "B254FC3875EF0EB1AAEBA9FACFA81C1F",
  },
  discord: { userId: "850815059093356594" },
  tiktok: { username: "calebkritzar" },
};

/* ================================
   COLORS + ICONS
================================ */
const PLATFORM_STYLE = {
  twitch:  { color: "#9146FF", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/twitch.svg" },
  tiktok:  { color: "#010101", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/tiktok.svg" },
  github:  { color: "#333333", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/github.svg" },
  reddit:  { color: "#FF4500", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/reddit.svg" },
  steam:   { color: "#00ADEE", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/steam.svg" },
  spotify: { color: "#1DB954", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/spotify.svg" },
  discord: { color: "#5865F2", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg" },
  manual:  { color: "var(--accent-color)", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/activitypub.svg" },
  offline: { color: "#999999", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg" },
};

let lastTikTokTitle = null;

/* ================================
   UTILS
================================ */
function isLiveActivityEnabled() {
  try {
    const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
    return settings.showLiveActivity === "enabled";
  } catch {
    return true;
  }
}

/* ================================
   SHOW STATUS (Dynamic Colors)
================================ */
function showStatus(payload, isOffline = false) {
  const el = document.getElementById("live-activity-text");
  const container = document.getElementById("live-activity");
  const icon = document.getElementById("activity-icon");
  if (!el || !container || !icon) return;

  const { text, source } = typeof payload === "string" ? { text: payload, source: "manual" } : payload;
  const platform = PLATFORM_STYLE[isOffline ? "offline" : source] || PLATFORM_STYLE.discord;
  const { color, icon: iconSrc } = platform;

  // Text + icon
  el.textContent = text;
  icon.src = iconSrc;
  el.style.color = color;
  icon.className = `activity-icon ${source} change`;

  // Background & glow
  container.style.setProperty("--platform-color", color);
  container.classList.toggle("active", !isOffline);
  container.classList.toggle("offline", isOffline);
  container.classList.remove("hidden");

  container.style.background = `color-mix(in srgb, ${color} 20%, var(--content-bg))`;
  container.style.boxShadow = `0 0 15px ${color}60`;
  container.style.opacity = isOffline ? "0.8" : "1";

  setTimeout(() => icon.classList.remove("change"), 300);
}

/* ================================
   PLATFORM FETCHES
================================ */
async function getManualStatus() {
  try {
    const snap = await getDoc(doc(db, "live_status", "current"));
    if (snap.exists()) {
      const msg = snap.data().message;
      if (msg && msg.trim()) return { text: msg, source: "manual" };
    }
    return null;
  } catch (err) {
    console.error("Manual status error:", err);
    return null;
  }
}

async function getTwitchStatus() {
  const { user, clientId, token } = CONFIG.twitch;
  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(user)}`,
      { headers: { "Client-ID": clientId, "Authorization": `Bearer ${token}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const stream = data?.data?.[0];
    if (stream?.title) return { text: `🟣 Streaming on Twitch — ${stream.title}`, source: "twitch" };
    return null;
  } catch (err) {
    console.error("Twitch API error:", err);
    return null;
  }
}

async function getTikTokStatus() {
  const { username } = CONFIG.tiktok;
  try {
    const endpoint = `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${encodeURIComponent(username)}`;
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.title) return null;
    if (data.title === lastTikTokTitle) return null;
    lastTikTokTitle = data.title;
    return { text: `🎬 Posted on TikTok — “${data.title}”`, source: "tiktok" };
  } catch (err) {
    console.error("TikTok API error:", err);
    return null;
  }
}

async function getGitHubStatus() {
  const { username } = CONFIG.github;
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events/public`);
    if (!res.ok) return null;
    const events = await res.json();
    const latest = events?.[0];
    if (!latest) return null;

    const repo = latest.repo?.name ?? "a repository";
    switch (latest.type) {
      case "PushEvent": return { text: `💻 Pushed code to ${repo}`, source: "github" };
      case "PullRequestEvent": return { text: `🧩 Opened PR on ${repo}`, source: "github" };
      default: return null;
    }
  } catch (err) {
    console.error("GitHub API error:", err);
    return null;
  }
}

async function getRedditStatus() {
  const { username } = CONFIG.reddit;
  try {
    const res = await fetch(`https://www.reddit.com/user/${encodeURIComponent(username)}/submitted.json`);
    if (!res.ok) return null;
    const data = await res.json();
    const post = data?.data?.children?.[0]?.data;
    if (!post) return null;
    return { text: `📢 Posted on r/${post.subreddit} — “${post.title}”`, source: "reddit" };
  } catch (err) {
    console.error("Reddit API error:", err);
    return null;
  }
}

async function getSteamStatus() {
  const { steamId64, apiKey } = CONFIG.steam;
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId64}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const player = data?.response?.players?.[0];
    if (player?.gameextrainfo)
      return { text: `🎮 Playing ${player.gameextrainfo} on Steam`, source: "steam" };
    return null;
  } catch (err) {
    console.error("Steam API error:", err);
    return null;
  }
}

async function getDiscordActivity() {
  const { userId } = CONFIG.discord;
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    const { data } = await res.json();
    if (!data) return null;

    const activities = data.activities || [];

    const spotify = activities.find(a => a.name === "Spotify");
    if (spotify?.details && spotify?.state)
      return { text: `🎵 Listening to “${spotify.details}” by ${spotify.state}`, source: "spotify" };

    const game = activities.find(a => a.type === 0);
    if (game?.name)
      return { text: `🎮 Playing ${game.name}`, source: "discord" };

    const statusMap = {
      online: "🟢 Online on Discord",
      idle: "🌙 Idle on Discord",
      dnd: "⛔ Do Not Disturb",
    };
    if (data.discord_status !== "offline")
      return { text: statusMap[data.discord_status] || "💬 Online on Discord", source: "discord" };

    return null;
  } catch (err) {
    console.error("Discord API error:", err);
    return null;
  }
}

/* ================================
   UPDATE LOOP
================================ */
async function updateLiveStatus() {
  const container = document.getElementById("live-activity");
  if (!container) return;
  if (!isLiveActivityEnabled()) {
    container.style.display = "none";
    return;
  }
  container.style.display = "";

  const sources = [
    getManualStatus,
    getTwitchStatus,
    getSteamStatus,
    getDiscordActivity,
    getGitHubStatus,
    getRedditStatus,
    getTikTokStatus,
  ];

  try {
    for (const fn of sources) {
      const result = await fn();
      if (result) return showStatus(result);
    }
    showStatus({ text: "🛌 Offline", source: "offline" }, true);
  } catch (err) {
    console.error("Live status error:", err);
    showStatus({ text: "💬 Status unavailable", source: "offline" }, true);
  }
}

/* ================================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", () => {
  updateLiveStatus();
  setInterval(() => updateLiveStatus(), 30000);
});
