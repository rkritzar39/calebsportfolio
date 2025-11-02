/* ======================================================
   🎧 Live Activity — Multi-Platform + Real Spotify + Manual Override
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
  steam:  { steamId64: "76561199283946668", apiKey: "B254FC3875EF0EB1AAEBA9FACFA81C1F" },
  discord:{ userId: "850815059093356594" },
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
  steam:  "#00ADEE",
  spotify:"#1DB954",
  discord:"#5865F2",
  manual: "var(--accent-color)",
  offline:"#666666"
};

/* =========================
   GLOBALS
========================= */
let lastUpdateTime = null;
let currentMusicCover = null;
let progressInterval = null;
let currentSpotifyUrl = null;  // for click-through

/* Utils */
const $$ = id => document.getElementById(id);
const setText = (id, val) => { const el = $$(id); if (el) el.textContent = val; };
function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds)); const m = Math.floor(s/60); const r = s%60;
  return `${m}:${String(r).padStart(2,"0")}`;
}

/* =========================
   Honeycomb (top-left)
========================= */
function updateIconCluster(platforms) {
  const cluster = $$("icon-cluster");
  if (!cluster) return;
  cluster.innerHTML = "";

  platforms.forEach(({ source, text, temporary }) => {
    const icon = document.createElement("div");
    icon.className = `cluster-icon ${source}`;
    icon.style.backgroundColor = BRAND_COLORS[source] || "var(--accent-color)";
    icon.setAttribute("data-tooltip", `${source[0].toUpperCase()+source.slice(1)} — ${text}`);

    const img = document.createElement("img");
    img.src = `https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/${source}.svg`;
    img.alt = source;
    icon.appendChild(img);

    // Spotify hover preview (optional)
    if (source === "spotify" && currentMusicCover) {
      // keep minimal to avoid overlap in compact header
    }

    cluster.appendChild(icon);

    if (temporary) {
      setTimeout(() => {
        icon.classList.add("fade-out");
        setTimeout(() => icon.remove(), 700);
      }, 4500);
    }
  });
}

/* =========================
   Toasts
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
    toast.style.transform = "translateY(-8px)";
    setTimeout(() => toast.remove(), 320);
  }, 2800);
}

/* =========================
   Was Recently Shown
========================= */
function wasRecentlyShown(platform, cooldown = 300000) {
  const last = localStorage.getItem(`last_${platform}_shown`);
  return last && Date.now() - parseInt(last, 10) < cooldown;
}
function markAsShown(platform) {
  localStorage.setItem(`last_${platform}_shown`, Date.now().toString());
}

/* =========================
   Status line + updated timer
========================= */
function setStatusLine(text) {
  setText("status-line-text", text || "—");
  lastUpdateTime = Date.now();
  updateLastUpdated();
}
function updateLastUpdated() {
  const el = $$("live-activity-updated");
  if (!el || !lastUpdateTime) return;
  const sec = Math.floor((Date.now() - lastUpdateTime) / 1000);
  let t = "Updated just now";
  if (sec >= 60 && sec < 3600) t = `Updated ${Math.floor(sec/60)}m ago`;
  else if (sec >= 10 && sec < 60) t = `Updated ${sec}s ago`;
  else if (sec >= 3600) t = `Updated ${Math.floor(sec/3600)}h ago`;
  el.textContent = t;
}

/* =========================
   Firestore Manual Status (override)
========================= */
async function getManualStatus() {
  try {
    const snap = await getDoc(doc(db, "live_status", "current"));
    if (snap.exists()) {
      const msg = (snap.data().message || "").trim();
      if (msg) return { text: msg, source: "manual" };
    }
  } catch {}
  return null;
}

/* =========================
   Twitch
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
    if (stream?.title) return { text: `🟣 Streaming on Twitch — ${stream.title}`, source: "twitch" };
  } catch {}
  return null;
}

/* =========================
   Steam
========================= */
async function getSteamStatus() {
  const { steamId64, apiKey } = CONFIG.steam;
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId64}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    const p = data?.response?.players?.[0];
    if (p?.gameextrainfo) return { text: `🎮 Playing ${p.gameextrainfo} on Steam`, source: "steam" };
  } catch {}
  return null;
}

/* =========================
   GitHub
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
   Reddit
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
   TikTok
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
   Discord Presence (Spotify + fallback)
========================= */
async function getDiscordActivity() {
  const { userId } = CONFIG.discord;
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`, { cache: "no-store" });
    const { data } = await res.json();
    if (!data) return null;

    // Prefer direct Lanyard spotify object (accurate, with track id + timestamps)
    const sp = data.spotify;
    const activities = data.activities || [];
    const game = activities.find(a => a.type === 0 && a.name && a.name !== "Spotify");

    // If Spotify active
    if (sp) {
      const title  = sp.song;
      const artist = sp.artist;
      const cover  = sp.album_art_url;
      currentMusicCover = cover;
      currentSpotifyUrl = sp.track_id ? `https://open.spotify.com/track/${sp.track_id}` : null;

      // Fill UI
      $$("spotify-card").classList.remove("hidden");
      $$("live-activity").classList.remove("hidden");
      $$("live-activity-cover").src = cover || "path/to/default-cover.jpg";
      setText("live-song-title", title || "Unknown Track");
      setText("live-song-artist", artist || "Unknown Artist");

      // Progress using timestamps
      setupProgress(sp.timestamps?.start, sp.timestamps?.end);

      // Status line
      setStatusLine("🎧 Listening to Spotify");

      return { text: `Listening to “${title}” by ${artist}`, source: "spotify" };
    }

    // Not Spotify → hide card & show presence/game in status line
    $$("spotify-card").classList.add("hidden");
    $$("music-progress-bar").style.width = "0%";
    if (progressInterval) { clearInterval(progressInterval); progressInterval = null; }
    currentSpotifyUrl = null;

    const map = {
      online: "💬 Online on Discord",
      idle:   "🌙 Idle on Discord",
      dnd:    "⛔ Do Not Disturb",
      offline:"⚫ Offline"
    };

    const statusText = game?.name ? `🎮 Playing ${game.name}` : (map[data.discord_status] || "💬 Online on Discord");
    setStatusLine(statusText);

    // If truly offline, we’ll still keep the card visible so the honeycomb shows,
    // but you can hide the whole widget here if preferred:
    // if (data.discord_status === "offline") $$("live-activity").classList.add("hidden");

    return { text: statusText, source: "discord" };
  } catch (e) {
    console.error("Discord/Lanyard error:", e);
  }
  return null;
}

/* Progress using start/end ms */
function setupProgress(startMs, endMs) {
  const bar = $$("music-progress-bar");
  const elapsedEl = $$("elapsed-time");
  const remainingEl = $$("remaining-time");
  const totalEl = $$("total-time");
  if (!bar || !elapsedEl || !remainingEl || !totalEl || !startMs || !endMs) return;

  if (progressInterval) clearInterval(progressInterval);

  const totalSec = (endMs - startMs) / 1000;
  totalEl.textContent = formatTime(totalSec);

  function tick() {
    const now = Date.now();
    const elapsed = Math.min((now - startMs) / 1000, totalSec);
    const remaining = Math.max(totalSec - elapsed, 0);

    bar.style.width = `${(elapsed / totalSec) * 100}%`;
    elapsedEl.textContent = formatTime(elapsed);
    remainingEl.textContent = `-${formatTime(remaining)}`;
  }

  tick();
  progressInterval = setInterval(tick, 1000);
}

/* =========================
   Build header + combine sources
========================= */
async function updateLiveStatus() {
  const sources = [
    getManualStatus,   // manual override (will appear in honeycomb + status line if chosen as primary)
    getTwitchStatus,
    getSteamStatus,
    getDiscordActivity, // includes Spotify handling + status line
    getGitHubStatus,
    getRedditStatus,
    getTikTokStatus,
  ];

  const allActive = [];
  for (const fn of sources) {
    try {
      const res = await fn();
      if (res) allActive.push(res);
    } catch {}
  }

  // Choose primary line: prefer Spotify/Discord/Twitch/Steam/Manual order, then first
  const priority = ["spotify","discord","twitch","steam","manual"];
  const main = allActive.sort((a,b) => (priority.indexOf(a.source) + 99*(priority.indexOf(a.source)<0)) - (priority.indexOf(b.source) + 99*(priority.indexOf(b.source)<0)))[0];

  // If manual is present and you want manual to override always, uncomment:
  // const main = allActive.find(a=>a.source==="manual") || allActive.find(a=>a.source==="spotify"||a.source==="discord") || allActive[0];

  // Set status line (avoid duplicates; Discord handler already set it — so only set here if needed)
  if (main && !/Listening to Spotify|Playing |Online on Discord|Idle|Do Not Disturb|Offline/.test($$("status-line-text")?.textContent || "")) {
    setStatusLine(main.text.replace(/^([^\s]+)\s/, (m)=>m)); // keep as-is
  }

  // Build honeycomb icons from all active entries (cap to 9 for neatness)
  updateIconCluster(allActive.slice(0, 9));

  // Show/hide the whole widget if nothing active at all
  if (!allActive.length) {
    $$("live-activity").classList.add("hidden");
  } else {
    $$("live-activity").classList.remove("hidden");
  }
}

/* =========================
   Click-through for Spotify card
========================= */
function bindSpotifyClickThrough() {
  const card = $$("spotify-card");
  if (!card) return;

  function openTrack() {
    if (currentSpotifyUrl) window.open(currentSpotifyUrl, "_blank", "noopener");
  }
  card.addEventListener("click", openTrack);
  card.addEventListener("keydown", (e)=>{ if(e.key==="Enter" || e.key===" "){ e.preventDefault(); openTrack(); } });
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  bindSpotifyClickThrough();
  updateLiveStatus();
  setInterval(updateLiveStatus, 5000); // refresh presence
  setInterval(updateLastUpdated, 1000); // updated stamp
});
