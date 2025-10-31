/* =======================================================
   Live Activity System (Everything Easy, Client-Side)
   Platforms: Manual • Twitch • GitHub • Reddit • Steam • Discord • TikTok
   Author: Caleb Kritzar
   ======================================================= */

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/* ================================
   CONFIG — Fill these in
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
   ICON / COLOR MAP
================================ */
const PLATFORM_STYLE = {
  twitch:  { icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/twitch.svg",  color: "#9146FF" },
  tiktok:  { icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/tiktok.svg",  color: "#010101" },
  github:  { icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/github.svg",  color: "#333333" },
  reddit:  { icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/reddit.svg",  color: "#FF4500" },
  steam:   { icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/steam.svg",   color: "#00ADEE" },
  spotify: { icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/spotify.svg", color: "#1DB954" },
  discord: { icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg", color: "#5865F2" },
  manual:  { icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/activitypub.svg", color: "var(--accent-color)" },
  offline: { icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg", color: "gray" },
};

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

function styleFor(source) {
  return PLATFORM_STYLE[source] || PLATFORM_STYLE.discord;
}

let lastTikTokTitle = null;

/* ================================
   SHOW STATUS
================================ */
function showStatus(payload, isOffline = false) {
  const textEl = document.getElementById("live-activity-text");
  const container = document.getElementById("live-activity");
  const iconEl = document.getElementById("activity-icon");
  if (!textEl || !container || !iconEl) return;

  const { text, source } = typeof payload === "string" ? { text: payload, source: "manual" } : payload;
  const { icon, color } = styleFor(isOffline ? "offline" : source);

  textEl.textContent = text;
  textEl.style.color = color;
  iconEl.src = icon;
  iconEl.className = `activity-icon ${source} change`;

  container.classList.toggle("active", !isOffline);
  container.classList.toggle("offline", isOffline);
  container.classList.remove("hidden");
  container.style.opacity = isOffline ? "0.8" : "1";

  setTimeout(() => iconEl.classList.remove("change"), 300);
}

/* ================================
   PLATFORM INTEGRATIONS
================================ */

/* Manual (Firestore) */
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

/* Twitch (live streaming) */
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

/* TikTok (latest post, skip duplicates) */
async function getTikTokStatus() {
  const { username } = CONFIG.tiktok;
  try {
    const endpoint = `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${encodeURIComponent(username)}`;
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.title) return null;

    // Skip if same TikTok post as before
    if (data.title === lastTikTokTitle) return null;
    lastTikTokTitle = data.title;

    return { text: `🎬 Posted on TikTok — “${data.title}”`, source: "tiktok" };
  } catch (err) {
    console.error("TikTok fetch error:", err);
    return null;
  }
}

/* GitHub (latest activity) */
async function getGitHubStatus() {
  const { username } = CONFIG.github;
  if (!username) return null;
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
      case "CreateEvent": return { text: `🪄 Created something in ${repo}`, source: "github" };
      default: return null;
    }
  } catch (err) {
    console.error("GitHub API error:", err);
    return null;
  }
}

/* Reddit (latest post) */
async function getRedditStatus() {
  const { username } = CONFIG.reddit;
  if (!username) return null;
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

/* Steam (currently playing) */
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

/* Discord (via Lanyard) */
async function getDiscordActivity() {
  const { userId } = CONFIG.discord;
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    const { data } = await res.json();
    if (!data) return null;

    const activities = data.activities || [];

    // Spotify
    const spotify = activities.find(a => a.name === "Spotify");
    if (spotify?.details && spotify?.state)
      return { text: `🎵 Listening to “${spotify.details}” by ${spotify.state}`, source: "spotify" };

    // Game / App
    const game = activities.find(a => a.type === 0);
    if (game?.name)
      return { text: `🎮 Playing ${game.name}`, source: "discord" };

    // Status only
    const statusMap = {
      online: "🟢 Online on Discord",
      idle: "🌙 Idle on Discord",
      dnd: "⛔ Do Not Disturb",
      offline: "🔘 Offline",
    };
    const status = data.discord_status;
    if (status !== "offline") return { text: statusMap[status] || "💬 Online on Discord", source: "discord" };
    return null;
  } catch (err) {
    console.error("Discord API error:", err);
    return null;
  }
}

/* ================================
   UPDATE CHAIN (priority order)
================================ */
async function updateLiveStatus() {
  const container = document.getElementById("live-activity");
  if (!container) return;

  if (!isLiveActivityEnabled()) {
    container.style.display = "none";
    return;
  }
  container.style.display = "";
  container.classList.remove("offline");

  try {
    const order = [
      getManualStatus,
      getTwitchStatus,
      getSteamStatus,
      getDiscordActivity,
      getGitHubStatus,
      getRedditStatus,
      getTikTokStatus,
    ];

    for (const fn of order) {
      const result = await fn();
      if (result) return showStatus(result);
    }

    showStatus({ text: "🛌 Offline", source: "offline" }, true);
  } catch (err) {
    console.error("Live activity update error:", err);
    showStatus({ text: "💬 Status unavailable", source: "offline" }, true);
  }
}

/* ================================
   INIT + REFRESH
================================ */
document.addEventListener("DOMContentLoaded", () => {
  updateLiveStatus();
  setInterval(() => {
    if (isLiveActivityEnabled()) updateLiveStatus();
  }, 30000);
});
