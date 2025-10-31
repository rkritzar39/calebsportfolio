/* ======================================================
   🧠 Live Activity System — Smart Priority + Cooldown Edition (Final)
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
   HELPERS
================================ */
function isLiveActivityEnabled() {
  try {
    const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
    return settings.showLiveActivity === "enabled";
  } catch {
    return true;
  }
}

function wasRecentlyShown(platform, cooldown = 600000) {
  const last = localStorage.getItem(`last_${platform}_shown`);
  if (!last) return false;
  return Date.now() - parseInt(last, 10) < cooldown;
}

function markAsShown(platform) {
  localStorage.setItem(`last_${platform}_shown`, Date.now().toString());
}

/* ================================
   ICON RENDERING
================================ */
function updateIconCluster(activePlatforms, mainSource) {
  const cluster = document.getElementById("icon-cluster");
  if (!cluster) return;
  cluster.innerHTML = "";

  activePlatforms.forEach(({ source, temporary }) => {
    const icon = document.createElement("div");
    icon.className = "left-icon";
    icon.setAttribute("alt", source);

    const img = document.createElement("img");
    img.src = `https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/${source}.svg`;

    icon.appendChild(img);
    cluster.appendChild(icon);

    // temporary icons fade out after 5s
    if (temporary) {
      setTimeout(() => {
        icon.classList.add("fade-out");
        setTimeout(() => icon.remove(), 700);
      }, 5000);
    }
  });
}

/* ================================
   STATUS DISPLAY
================================ */
function showStatus(payload, isOffline = false, allActive = []) {
  const textEl = document.getElementById("live-activity-text");
  const container = document.getElementById("live-activity");
  if (!textEl || !container) return;

  const { text, source } = payload || { text: "💬 Status", source: "manual" };
  textEl.textContent = text;
  container.classList.remove("hidden");
  container.dataset.glow = isOffline ? "soft" : "neon";
  container.style.setProperty("--accent-color", getBrandColor(source));
  container.style.opacity = isOffline ? "0.8" : "1";

  updateIconCluster(allActive, source);
}

/* ================================
   BRAND COLORS
================================ */
function getBrandColor(source) {
  const colors = {
    twitch: "#9146FF",
    tiktok: "#010101",
    github: "#24292F",
    reddit: "#FF4500",
    steam: "#171A21",
    spotify: "#1DB954",
    discord: "#5865F2",
    manual: "var(--accent-color)",
    offline: "#777",
  };
  return colors[source] || "var(--accent-color)";
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
  } catch {
    return null;
  }
}

async function getTwitchStatus() {
  const { user, clientId, token } = CONFIG.twitch;
  try {
    const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${user}`, {
      headers: { "Client-ID": clientId, "Authorization": `Bearer ${token}` },
    });
    const data = await res.json();
    const stream = data?.data?.[0];
    if (stream?.title)
      return { text: `🟣 Streaming on Twitch — ${stream.title}`, source: "twitch" };
  } catch {}
  return null;
}

async function getTikTokStatus() {
  const { username } = CONFIG.tiktok;
  try {
    if (wasRecentlyShown("tiktok")) return null;
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${username}?t=${Date.now()}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.title) {
      markAsShown("tiktok");
      return { text: `🎬 Posted on TikTok — “${data.title}”`, source: "tiktok", temporary: true };
    }
  } catch (err) {
    console.error("TikTok error:", err);
  }
  return null;
}

async function getGitHubStatus() {
  const { username } = CONFIG.github;
  try {
    if (wasRecentlyShown("github")) return null;
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/events/public?timestamp=${Date.now()}`,
      { cache: "no-store" }
    );
    const events = await res.json();
    const latest = events?.[0];
    if (!latest) return null;
    const repo = latest.repo?.name ?? "a repository";
    markAsShown("github");
    if (latest.type === "PushEvent")
      return { text: `💻 Pushed code to ${repo}`, source: "github", temporary: true };
    if (latest.type === "CreateEvent")
      return { text: `🪄 Created new repo ${repo}`, source: "github", temporary: true };
  } catch (err) {
    console.error("GitHub error:", err);
  }
  return null;
}

async function getRedditStatus() {
  const { username } = CONFIG.reddit;
  try {
    if (wasRecentlyShown("reddit")) return null;
    const res = await fetch(`https://www.reddit.com/user/${encodeURIComponent(username)}/submitted.json?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "User-Agent": "LiveActivitySystem/1.0 (by CalebKritzar)" }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const post = data?.data?.children?.[0]?.data;
    if (!post) return null;
    const sub = post.subreddit ?? "reddit";
    const title = post.title ?? "New post";
    markAsShown("reddit");
    return { text: `📢 Posted on r/${sub} — “${title}”`, source: "reddit", temporary: true };
  } catch (err) {
    console.error("Reddit error:", err);
  }
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
  const container = document.getElementById("live-activity");
  if (!container) return;
  if (!isLiveActivityEnabled()) {
    container.style.display = "none";
    return;
  }

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

/* ================================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", () => {
  updateLiveStatus();
  setInterval(updateLiveStatus, 30000);
});
