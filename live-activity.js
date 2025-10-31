/* ======================================================
   🧠 Live Activity System — Final Version with Live Counter + Glow
   ====================================================== */

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

const CONFIG = {
  twitch: { user: "calebkritzar", clientId: "n7e3lys858u96xlg7v2aohe8vzxha3", token: "wh1m17qfuq5dkh5b78ekk6oh5wc8wm" },
  github: { username: "rkritzar39" },
  reddit: { username: "Electronic_Row_1262" },
  steam: { steamId64: "76561199283946668", apiKey: "B254FC3875EF0EB1AAEBA9FACFA81C1F" },
  discord: { userId: "850815059093356594" },
  tiktok: { username: "calebkritzar" },
};

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

let lastUpdateTime = null;
let isLive = false;

/* ---------------- COOLDOWN HANDLING ---------------- */
function wasRecentlyShown(platform, cooldown = 600000) {
  const last = localStorage.getItem(`last_${platform}_shown`);
  return last && Date.now() - parseInt(last, 10) < cooldown;
}
function markAsShown(platform) {
  localStorage.setItem(`last_${platform}_shown`, Date.now().toString());
}

/* ---------------- ICON CLUSTER ---------------- */
function updateIconCluster(platforms) {
  const cluster = document.getElementById("icon-cluster");
  if (!cluster) return;
  cluster.innerHTML = "";

  platforms.forEach(({ source, temporary }) => {
    const icon = document.createElement("div");
    icon.className = `cluster-icon ${source}`;
    icon.style.backgroundColor = BRAND_COLORS[source] || "#777";
    icon.setAttribute("data-tooltip", source.charAt(0).toUpperCase() + source.slice(1));

    const img = document.createElement("img");
    img.src = `https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/${source}.svg`;
    img.alt = source;
    icon.appendChild(img);
    cluster.appendChild(icon);

    // Temporary icons fade out
    if (temporary) {
      setTimeout(() => {
        icon.classList.add("fade-out");
        setTimeout(() => icon.remove(), 800);
      }, 5000);
    }
  });
}

/* ---------------- STATUS DISPLAY ---------------- */
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

  isLive = ["twitch", "steam", "discord"].includes(source);
  container.classList.toggle("live-now", isLive);

  lastUpdateTime = Date.now();
  updateLastUpdated();
}

/* ---------------- COUNTER ---------------- */
function updateLastUpdated() {
  const updated = document.getElementById("live-activity-updated");
  const container = document.getElementById("live-activity");
  if (!updated || !lastUpdateTime) return;

  if (isLive) {
    updated.textContent = "🟢 Live Now";
    container.classList.add("live-now");
    return;
  } else {
    container.classList.remove("live-now");
  }

  const elapsed = Math.floor((Date.now() - lastUpdateTime) / 1000);
  let text;

  if (elapsed < 10) text = "Updated just now";
  else if (elapsed < 60) text = `Updated ${elapsed}s ago`;
  else if (elapsed < 3600) text = `Updated ${Math.floor(elapsed / 60)}m ago`;
  else text = `Updated ${Math.floor(elapsed / 3600)}h ago`;

  updated.textContent = text;
}

/* ---------------- PLATFORM FETCHERS ---------------- */

/* Firestore Manual */
async function getManualStatus() {
  try {
    const snap = await getDoc(doc(db, "live_status", "current"));
    if (snap.exists()) {
      const msg = snap.data().message;
      if (msg && msg.trim()) return { text: msg, source: "manual" };
    }
  } catch (err) {
    console.error("Manual status error:", err);
  }
  return null;
}

/* Twitch */
async function getTwitchStatus() {
  const { user, clientId, token } = CONFIG.twitch;
  try {
    const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${user}`, {
      headers: { "Client-ID": clientId, "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const stream = data?.data?.[0];
    if (stream?.title)
      return { text: `🟣 Streaming on Twitch — ${stream.title}`, source: "twitch" };
  } catch (err) {
    console.error("Twitch API error:", err);
  }
  return null;
}

/* Steam */
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
  } catch (err) {
    console.error("Steam API error:", err);
  }
  return null;
}

/* Discord */
async function getDiscordActivity() {
  const { userId } = CONFIG.discord;
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
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
  } catch (err) {
    console.error("Discord activity error:", err);
  }
  return null;
}

/* GitHub */
async function getGitHubStatus() {
  const { username } = CONFIG.github;
  try {
    if (wasRecentlyShown("github")) return null;
    const res = await fetch(
      `https://api.github.com/users/${username}/events/public?nocache=${Date.now()}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const events = await res.json();
    const latest = events?.[0];
    if (!latest) return null;

    const repo = latest.repo?.name ?? "a repository";
    markAsShown("github");
    if (latest.type === "PushEvent")
      return { text: `💻 Pushed code to ${repo}`, source: "github", temporary: true };
    if (latest.type === "PullRequestEvent")
      return { text: `🧩 Opened PR on ${repo}`, source: "github", temporary: true };
  } catch (err) {
    console.error("GitHub API error:", err);
  }
  return null;
}

/* Reddit */
async function getRedditStatus() {
  const { username } = CONFIG.reddit;
  try {
    if (wasRecentlyShown("reddit")) return null;
    const res = await fetch(
      `https://www.reddit.com/user/${username}/submitted.json?nocache=${Date.now()}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const post = data?.data?.children?.[0]?.data;
    if (!post) return null;
    const sub = post.subreddit ?? "reddit";
    const title = post.title ?? "New post";
    markAsShown("reddit");
    return { text: `📢 Posted on r/${sub} — “${title}”`, source: "reddit", temporary: true };
  } catch (err) {
    console.error("Reddit API error:", err);
  }
  return null;
}

/* TikTok */
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
  } catch (err) {
    console.error("TikTok API error:", err);
  }
  return null;
}

/* ---------------- UPDATE LOOP ---------------- */
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

/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  updateLiveStatus();
  setInterval(updateLiveStatus, 30000);  // refresh activities
  setInterval(updateLastUpdated, 1000);  // update live counter every second
});
