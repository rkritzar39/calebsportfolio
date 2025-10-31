/* =======================================================
   Live Activity System — Cinematic Neon Pulse Edition ⚡
   Platforms: Manual • Twitch • Steam • Discord • Spotify • GitHub • Reddit • TikTok
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
    token: "wh1m17qfuq5dkh5b78ekk6oh5wc8wm",
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
   PLATFORM STYLES
================================ */
const PLATFORM_STYLE = {
  twitch:  { color: "#9146FF", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/twitch.svg", name: "Twitch" },
  tiktok:  { color: "#010101", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/tiktok.svg", name: "TikTok" },
  github:  { color: "#333333", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/github.svg", name: "GitHub" },
  reddit:  { color: "#FF4500", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/reddit.svg", name: "Reddit" },
  steam:   { color: "#00ADEE", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/steam.svg", name: "Steam" },
  spotify: { color: "#1DB954", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/spotify.svg", name: "Spotify" },
  discord: { color: "#5865F2", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg", name: "Discord" },
  manual:  { color: "var(--accent-color)", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/activitypub.svg", name: "Status" },
  offline: { color: "#999999", icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg", name: "Offline" },
};

/* ================================
   PRIORITY MAP
================================ */
function getPriority(source) {
  const live = ["twitch", "steam", "spotify", "discord"];
  const mid = ["github", "reddit", "tiktok"];
  const low = ["manual"];
  if (live.includes(source)) return 3;
  if (mid.includes(source)) return 2;
  if (low.includes(source)) return 1;
  return 0;
}

/* ================================
   RENDER STATUS
================================ */
function showStatus(activities, isOffline = false) {
  const container = document.getElementById("live-activity");
  const iconEl = document.getElementById("activity-icon");
  const textEl = document.getElementById("live-activity-text");
  if (!container || !iconEl || !textEl) return;

  const list = Array.isArray(activities) ? activities : [activities];
  const sorted = list.sort((a, b) => getPriority(b.source) - getPriority(a.source));
  const top = sorted[0];
  const { color, icon } = PLATFORM_STYLE[isOffline ? "offline" : top.source] || PLATFORM_STYLE.discord;
  const highest = getPriority(top.source);

  // Build HTML with inline icons
  const textHTML = sorted
    .map((a) => {
      const style = PLATFORM_STYLE[a.source] || {};
      const priority = getPriority(a.source);
      const opacity = priority < highest ? 0.55 : 1;
      const italic = priority < highest ? "italic" : "normal";
      const blur = priority < highest ? "blur(0.4px)" : "none";
      return `
        <span class="activity-item" style="opacity:${opacity};font-style:${italic};filter:${blur}">
          <img src="${style.icon}" class="inline-icon" alt="${a.source}" /> ${a.text}
        </span>`;
    })
    .join('<span class="divider"> • </span>');

  // Fade transition
  textEl.classList.add("fade-out");
  setTimeout(() => {
    textEl.innerHTML = textHTML;
    textEl.style.color = color;
    textEl.classList.remove("fade-out");
    textEl.classList.add("fade-in");
    setTimeout(() => textEl.classList.remove("fade-in"), 500);
  }, 250);

  // Main icon + glow
  iconEl.src = icon;
  iconEl.className = `activity-icon ${top.source} change`;

  // Neon gradient background
  container.style.background = `linear-gradient(90deg, color-mix(in srgb, ${color} 35%, transparent), color-mix(in srgb, var(--content-bg) 80%, transparent))`;
  container.style.boxShadow = `0 0 25px ${color}70, 0 0 40px ${color}40 inset`;

  // Glow strength
  const glowPulse = highest === 3 ? "neon" : highest === 2 ? "mid" : "soft";
  container.dataset.glow = glowPulse;
  container.classList.toggle("offline", isOffline);
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
  } catch {
    return [];
  }
}

async function getTwitchStatus() {
  const { user, clientId, token } = CONFIG.twitch;
  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(user)}`,
      { headers: { "Client-ID": clientId, "Authorization": `Bearer ${token}` } }
    );
    const data = await res.json();
    const stream = data?.data?.[0];
    if (stream?.title) return [{ text: `🟣 Streaming on Twitch — ${stream.title}`, source: "twitch" }];
    return [];
  } catch {
    return [];
  }
}

async function getSteamStatus() {
  const { steamId64, apiKey } = CONFIG.steam;
  try {
    const res = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId64}`);
    const data = await res.json();
    const player = data?.response?.players?.[0];
    if (player?.gameextrainfo)
      return [{ text: `🎮 Playing ${player.gameextrainfo}`, source: "steam" }];
    return [];
  } catch {
    return [];
  }
}

async function getDiscordActivity() {
  const { userId } = CONFIG.discord;
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${encodeURIComponent(userId)}`);
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

    const status = {
      online: "🟢 Online",
      idle: "🌙 Idle",
      dnd: "⛔ Busy",
    }[data.discord_status];
    if (status && results.length === 0)
      results.push({ text: `${status} on Discord`, source: "discord" });

    return results;
  } catch {
    return [];
  }
}

async function getGitHubStatus() {
  const { username } = CONFIG.github;
  try {
    const res = await fetch(`https://api.github.com/users/${username}/events/public`);
    const events = await res.json();
    const latest = events?.[0];
    if (!latest) return [];
    const repo = latest.repo?.name ?? "a repo";
    switch (latest.type) {
      case "PushEvent": return [{ text: `💻 Pushed code to ${repo}`, source: "github" }];
      case "PullRequestEvent": return [{ text: `🧩 Opened PR on ${repo}`, source: "github" }];
      default: return [];
    }
  } catch {
    return [];
  }
}

async function getRedditStatus() {
  const { username } = CONFIG.reddit;
  try {
    const res = await fetch(`https://www.reddit.com/user/${username}/submitted.json`);
    const data = await res.json();
    const post = data?.data?.children?.[0]?.data;
    if (post) return [{ text: `📢 Posted “${post.title}” on r/${post.subreddit}`, source: "reddit" }];
    return [];
  } catch {
    return [];
  }
}

async function getTikTokStatus() {
  const { username } = CONFIG.tiktok;
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${username}`);
    const data = await res.json();
    if (data?.title)
      return [{ text: `🎬 Uploaded “${data.title}”`, source: "tiktok" }];
    return [];
  } catch {
    return [];
  }
}

/* ================================
   MAIN LOOP
================================ */
async function updateLiveStatus() {
  const container = document.getElementById("live-activity");
  if (!container) return;

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
