/* ======================================================
   🧠 Live Activity System — Honeycomb + Smart Cooldown Edition
   ====================================================== */

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
   BRAND COLORS
================================ */
const BRAND_COLORS = {
  twitch: "#9146FF",
  tiktok: "#000000",
  github: "#24292F",
  reddit: "#FF4500",
  steam: "#171A21",
  spotify: "#1DB954",
  discord: "#5865F2",
  manual: "#8888FF",
  offline: "#666666"
};

/* ================================
   COOLDOWN HELPERS
================================ */
function wasRecentlyShown(platform, cooldown = 600000) {
  const last = localStorage.getItem(`last_${platform}_shown`);
  if (!last) return false;
  return Date.now() - parseInt(last, 10) < cooldown;
}
function markAsShown(platform) {
  localStorage.setItem(`last_${platform}_shown`, Date.now().toString());
}

/* ================================
   ICON CLUSTER
================================ */
function updateIconCluster(platforms) {
  const cluster = document.getElementById("icon-cluster");
  if (!cluster) return;
  cluster.innerHTML = "";

  platforms.forEach(({ source, temporary }) => {
    const iconWrapper = document.createElement("div");
    iconWrapper.className = `cluster-icon ${source}`;
    iconWrapper.style.backgroundColor = BRAND_COLORS[source] || "#777";

    const img = document.createElement("img");
    img.src = `https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/${source}.svg`;
    img.alt = source;

    iconWrapper.appendChild(img);
    cluster.appendChild(iconWrapper);

    // Temporary icons fade after 5 seconds
    if (temporary) {
      setTimeout(() => {
        iconWrapper.classList.add("fade-out");
        setTimeout(() => iconWrapper.remove(), 800);
      }, 5000);
    }
  });

  // Auto-adjust honeycomb size
  const iconCount = cluster.children.length;
  cluster.style.setProperty("--cluster-size", iconCount > 6 ? "80px" : "60px");
}

/* ================================
   STATUS DISPLAY
================================ */
function showStatus(payload, isOffline = false, allActive = []) {
  const el = document.getElementById("live-activity-text");
  const container = document.getElementById("live-activity");
  if (!el || !container) return;

  const { text, source } = payload || { text: "💬 Status", source: "manual" };
  el.textContent = text;
  container.classList.remove("hidden");
  container.classList.toggle("offline", isOffline);
  container.style.setProperty("--accent-color", BRAND_COLORS[source] || "#999");
  container.style.opacity = isOffline ? "0.8" : "1";

  updateIconCluster(allActive);
}

/* ================================
   PLATFORM FETCHERS
================================ */
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
      headers: { "Client-ID": clientId, "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    const stream = data?.data?.[0];
    if (stream?.title)
      return { text: `🟣 Streaming on Twitch — ${stream.title}`, source: "twitch" };
  } catch {}
  return null;
}

async function getGitHubStatus() {
  const { username } = CONFIG.github;
  try {
    if (wasRecentlyShown("github")) return null;
    const res = await fetch(
      `https://api.github.com/users/${username}/events/public?nocache=${Date.now()}`,
      { cache: "no-store" }
    );
    const events = await res.json();
    const latest = events?.[0];
    if (!latest) return null;
    const repo = latest.repo?.name ?? "a repository";
    markAsShown("github");
    if (latest.type === "PushEvent")
      return { text: `💻 Pushed code to ${repo}`, source: "github", temporary: true };
  } catch {}
  return null;
}

async function getRedditStatus() {
  const { username } = CONFIG.reddit;
  try {
    if (wasRecentlyShown("reddit")) return null;
    const res = await fetch(
      `https://www.reddit.com/user/${username}/submitted.json?nocache=${Date.now()}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    const post = data?.data?.children?.[0]?.data;
    if (!post) return null;
    const sub = post.subreddit ?? "reddit";
    const title = post.title ?? "New post";
    markAsShown("reddit");
    return { text: `📢 Posted on r/${sub} — “${title}”`, source: "reddit", temporary: true };
  } catch {}
  return null;
}

async function getTikTokStatus() {
  const { username } = CONFIG.tiktok;
  try {
    if (wasRecentlyShown("tiktok")) return null;
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${username}?nocache=${Date.now()}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.title) {
      markAsShown("tiktok");
      return { text: `🎬 Posted on TikTok — “${data.title}”`, source: "tiktok", temporary: true };
    }
  } catch {}
  return null;
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
      return { text: `🎮 Playing ${player.gameextrainfo} on Steam`, source: "steam" };
  } catch {}
  return null;
}

async function getDiscordActivity() {
  const { userId } = CONFIG.discord;
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
    const { data } = await res.json();
    if (!data) return null;
    const activities = data.activities || [];
    const spotify = activities.find(a => a.name === "Spotify");
    if (spotify?.details && spotify?.state)
      return { text: `🎵 Listening to “${spotify.details}” by ${spotify.state}`, source: "spotify" };
    const game = activities.find(a => a.type === 0);
    if (game?.name)
      return { text: `🎮 Playing ${game.name}`, source: "discord" };
    if (data.discord_status !== "offline")
      return { text: `🟢 Online on Discord`, source: "discord" };
  } catch {}
  return null;
}

/* ================================
   UPDATE LOOP
================================ */
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
  showStatus(live || { text: "🛌 Offline", source: "offline" }, !live, active);
}

document.addEventListener("DOMContentLoaded", () => {
  updateLiveStatus();
  setInterval(updateLiveStatus, 30000);
});
