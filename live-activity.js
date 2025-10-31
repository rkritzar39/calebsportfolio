/* =======================================================
   Live Activity System (Everything Easy, Client-Side)
   Platforms: Manual • Twitch • TikTok • GitHub • Reddit • Steam • Discord
   ======================================================= */

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/* ================================
   CONFIG — fill these in
================================ */
const CONFIG = {
  // Twitch
  twitch: {
    user: "calebkritzar",
    clientId: "n7e3lys858u96xlg7v2aohe8vzxha3",
    token: "wh1m17qfuq5dkh5b78ekk6oh5wc8wm", // ⚠️ move server-side in production
  },

  // TikTok
  tiktok: {
    username: "calebkritzar", // your @username (no @)
  },

  // GitHub
  github: {
    username: "GITHUB_USERNAME", // e.g., "calebkritzar"
  },

  // Reddit
  reddit: {
    username: "REDDIT_USERNAME", // e.g., "calebkritzar"
  },

  // Steam
  steam: {
    steamId64: "STEAM_ID_64",      // 64-bit SteamID
    apiKey: "STEAM_API_KEY",       // https://steamcommunity.com/dev/apikey
  },

  // Discord (via Lanyard)
  discord: {
    userId: "850815059093356594",
  },
};

/* ================================
   ICON / COLOR MAP
================================ */
const PLATFORM_STYLE = {
  twitch:  { icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/twitch.svg",  color: "#9146FF", class: "twitch"  },
  tiktok:  { icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/tiktok.svg",  color: "#010101", class: "tiktok"  },
  github:  { icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/github.svg",  color: "#333333", class: "github"  },
  reddit:  { icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/reddit.svg",  color: "#FF4500", class: "reddit"  },
  steam:   { icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/steam.svg",   color: "#00ADEE", class: "steam"   },
  spotify: { icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/spotify.svg", color: "#1DB954", class: "spotify" },
  discord: { icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg", color: "#5865F2", class: "discord" },
  manual:  { icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/activitypub.svg", color: "var(--accent-color)", class: "manual" },
  offline: { icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg", color: "gray", class: "offline" },
};

/* ================================
   UTILS
================================ */
function isLiveActivityEnabled() {
  try {
    const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
    return settings.showLiveActivity === "enabled";
  } catch {
    return true; // default enabled
  }
}

function styleFor(source) {
  return PLATFORM_STYLE[source] || PLATFORM_STYLE.discord;
}

/* ================================
   SHOW STATUS + ICON HANDLER
   Accepts { text, source } instead of raw string
================================ */
function showStatus(payload, isOffline = false) {
  const el = document.getElementById("live-activity-text");
  const container = document.getElementById("live-activity");
  const icon = document.getElementById("activity-icon");
  if (!el || !container || !icon) return;

  // Normalize payload to object
  const data = typeof payload === "string" ? { text: payload, source: "manual" } : payload;
  const { text, source } = data || { text: "💬 Status", source: "manual" };

  // Apply text
  el.textContent = text;

  // Classes for active/offline/hidden
  container.classList.toggle("active", !isOffline);
  container.classList.toggle("offline", isOffline);
  container.classList.remove("hidden");
  container.style.opacity = isOffline ? "0.8" : "1";

  // Icon + text color
  const { icon: iconSrc, color, class: iconClass } = styleFor(isOffline ? "offline" : source);
  icon.src = iconSrc;
  icon.className = `activity-icon ${iconClass} change`;
  el.style.color = color;

  // Pop animation on icon change
  setTimeout(() => icon.classList.remove("change"), 300);
}

/* ================================
   PLATFORM INTEGRATIONS (client-side)
   - Return { text, source } or null
================================ */

/* Manual (Firestore) */
async function getManualStatus() {
  try {
    const docSnap = await getDoc(doc(db, "live_status", "current"));
    if (docSnap.exists()) {
      const msg = docSnap.data().message;
      if (msg && typeof msg === "string" && msg.trim()) {
        return { text: msg, source: "manual" };
      }
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
    if (stream?.title) {
      return { text: `🟣 Streaming on Twitch — ${stream.title}`, source: "twitch" };
    }
    return null;
  } catch (err) {
    console.error("Twitch API error:", err);
    return null;
  }
}

/* TikTok (latest post via oEmbed) */
async function getTikTokStatus() {
  const { username } = CONFIG.tiktok;
  try {
    // oEmbed returns info about the profile’s latest post at that URL
    const endpoint = `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${encodeURIComponent(username)}`;
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.title) {
      return { text: `🎬 Posted on TikTok — “${data.title}”`, source: "tiktok" };
    }
    return null;
  } catch (err) {
    console.error("TikTok fetch error:", err);
    return null;
  }
}

/* GitHub (latest public activity) */
async function getGitHubStatus() {
  const { username } = CONFIG.github;
  if (!username || username.includes("GITHUB_USERNAME")) return null;
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events/public`);
    if (!res.ok) return null;
    const events = await res.json();
    const latest = events?.[0];
    if (!latest) return null;

    const repo = latest.repo?.name ?? "a repository";

    switch (latest.type) {
      case "PushEvent":
        return { text: `💻 Pushed code to ${repo}`, source: "github" };
      case "PullRequestEvent": {
        const action = latest.payload?.action ?? "updated";
        return { text: `🧩 ${action === "opened" ? "Opened" : "Updated"} PR on ${repo}`, source: "github" };
      }
      case "CreateEvent":
        return { text: `🪄 Created ${latest.payload?.ref_type ?? "something"} in ${repo}`, source: "github" };
      case "IssuesEvent": {
        const action = latest.payload?.action ?? "updated";
        return { text: `🐞 ${action === "opened" ? "Opened" : "Updated"} issue on ${repo}`, source: "github" };
      }
      default:
        return null;
    }
  } catch (err) {
    console.error("GitHub API error:", err);
    return null;
  }
}

/* Reddit (latest post) */
async function getRedditStatus() {
  const { username } = CONFIG.reddit;
  if (!username || username.includes("REDDIT_USERNAME")) return null;
  try {
    const res = await fetch(`https://www.reddit.com/user/${encodeURIComponent(username)}/submitted.json`);
    if (!res.ok) return null;
    const data = await res.json();
    const post = data?.data?.children?.[0]?.data;
    if (!post) return null;
    const sub = post.subreddit ?? "reddit";
    const title = post.title ?? "New post";
    return { text: `📢 Posted on r/${sub} — “${title}”`, source: "reddit" };
  } catch (err) {
    console.error("Reddit fetch error:", err);
    return null;
  }
}

/* Steam (currently playing) */
async function getSteamStatus() {
  const { steamId64, apiKey } = CONFIG.steam;
  if (!steamId64 || !apiKey || steamId64.includes("STEAM_ID_64") || apiKey.includes("STEAM_API_KEY")) return null;

  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${encodeURIComponent(apiKey)}&steamids=${encodeURIComponent(steamId64)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const player = data?.response?.players?.[0];
    if (player?.gameextrainfo) {
      return { text: `🎮 Playing ${player.gameextrainfo} on Steam`, source: "steam" };
    }
    return null;
  } catch (err) {
    console.error("Steam API error:", err);
    return null;
  }
}

/* Discord (via Lanyard) */
async function getDiscordActivity() {
  const { userId } = CONFIG.discord;
  const endpoint = `https://api.lanyard.rest/v1/users/${encodeURIComponent(userId)}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const { data } = await res.json();
    if (!data) return null;

    const activities = data.activities || [];

    // Spotify
    const spotify = activities.find(a => a.name === "Spotify");
    if (spotify?.details && spotify?.state) {
      return { text: `🎵 Listening to “${spotify.details}” by ${spotify.state}`, source: "spotify" };
    }

    // Game / App (type 0)
    const game = activities.find(a => a.type === 0);
    if (game?.name) {
      return { text: `🎮 Playing ${game.name}`, source: "discord" };
    }

    // Fallback to status string (only if not offline)
    const statusMap = {
      online: "🟢 Online on Discord",
      idle: "🌙 Idle on Discord",
      dnd: "⛔ Do Not Disturb",
      offline: "🔘 Offline",
    };
    const statusText = statusMap[data.discord_status] || "💬 Online on Discord";
    if (data.discord_status !== "offline") {
      return { text: statusText, source: "discord" };
    }
    return null;
  } catch (err) {
    console.error("Discord activity error:", err);
    return null;
  }
}

/* ================================
   UPDATE CHAIN (priority order)
================================ */
async function updateLiveStatus() {
  const el = document.getElementById("live-activity-text");
  const container = document.getElementById("live-activity");
  if (!el || !container) return;

  // Respect user setting
  if (!isLiveActivityEnabled()) {
    container.style.display = "none";
    console.log("[Live Activity] Disabled by user settings.");
    return;
  }
  container.style.display = "";
  container.classList.remove("offline");

  try {
    // 1️⃣ Manual override
    const manual = await getManualStatus();
    if (manual) return showStatus(manual);

    // 2️⃣ Twitch (live)
    const twitch = await getTwitchStatus();
    if (twitch) return showStatus(twitch);

    // 3️⃣ TikTok (latest post)
    const tiktok = await getTikTokStatus();
    if (tiktok) return showStatus(tiktok);

    // 4️⃣ GitHub (latest public activity)
    const github = await getGitHubStatus();
    if (github) return showStatus(github);

    // 5️⃣ Reddit (latest post)
    const reddit = await getRedditStatus();
    if (reddit) return showStatus(reddit);

    // 6️⃣ Steam (currently playing)
    const steam = await getSteamStatus();
    if (steam) return showStatus(steam);

    // 7️⃣ Discord (playing/spotify/status)
    const discord = await getDiscordActivity();
    if (discord) return showStatus(discord);

    // 8️⃣ Offline fallback
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
