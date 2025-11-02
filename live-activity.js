/* ======================================================
   🎧 Live Activity System — Final Complete Version
   ====================================================== */

import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/* =========================
   CONFIG
========================= */
const CONFIG = {
  twitch: { user: "calebkritzar" },
  github: { username: "rkritzar39" },
  reddit: { username: "Electronic_Row_1262" },
  steam:  { steamId64: "76561199283946668" },
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
let progressInterval = null;
let currentSpotifyUrl = null;
const $$ = id => document.getElementById(id);

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ======================================================
   🐝 HONEYCOMB ICON CLUSTER (NO BLACK ICONS)
====================================================== */
function updateIconCluster(platforms) {
  const cluster = $$("icon-cluster");
  if (!cluster) return;
  cluster.innerHTML = "";

  platforms.forEach(({ source, text, temporary }) => {
    const icon = document.createElement("div");
    icon.className = `cluster-icon ${source}`;
    icon.style.backgroundColor = BRAND_COLORS[source] || "var(--accent-color)";
    icon.style.boxShadow = `0 0 8px ${BRAND_COLORS[source] || "var(--accent-color)"}`;
    icon.setAttribute("data-tooltip", `${source.charAt(0).toUpperCase() + source.slice(1)} — ${text}`);
    cluster.appendChild(icon);

    if (temporary) {
      setTimeout(() => {
        icon.classList.add("fade-out");
        setTimeout(() => icon.remove(), 800);
      }, 5000);
    }
  });
}

/* ======================================================
   💬 STATUS LINE + ICON
====================================================== */
function setStatusLine(text, source = "manual") {
  const textEl = $$("status-line-text");
  const iconEl = $$("status-icon-logo");
  if (!textEl || !iconEl) return;

  textEl.textContent = text || "—";
  const color = BRAND_COLORS[source] || "var(--accent-color)";
  iconEl.style.background = color;
  iconEl.style.boxShadow = `0 0 10px ${color}`;

  lastUpdateTime = Date.now();
  updateLastUpdated();
}

/* ======================================================
   🕒 LAST UPDATED TIMER
====================================================== */
function updateLastUpdated() {
  const el = $$("live-activity-updated");
  if (!el || !lastUpdateTime) return;

  const elapsed = Math.floor((Date.now() - lastUpdateTime) / 1000);
  let text;
  if (elapsed < 10) text = "Updated just now";
  else if (elapsed < 60) text = `Updated ${elapsed}s ago`;
  else if (elapsed < 3600) text = `Updated ${Math.floor(elapsed / 60)}m ago`;
  else text = `Updated ${Math.floor(elapsed / 3600)}h ago`;

  el.textContent = text;
}

/* ======================================================
   🎵 SPOTIFY PROGRESS HANDLER
====================================================== */
function setupProgress(start, end) {
  const bar = $$("music-progress-bar");
  const elapsedEl = $$("elapsed-time");
  const remainingEl = $$("remaining-time");
  const totalEl = $$("total-time");
  if (!bar || !start || !end) return;

  const total = (end - start) / 1000;
  totalEl.textContent = formatTime(total);
  clearInterval(progressInterval);

  function tick() {
    const now = Date.now();
    const elapsed = Math.min((now - start) / 1000, total);
    const remaining = Math.max(total - elapsed, 0);
    bar.style.width = `${(elapsed / total) * 100}%`;
    elapsedEl.textContent = formatTime(elapsed);
    remainingEl.textContent = `-${formatTime(remaining)}`;
  }

  tick();
  progressInterval = setInterval(tick, 1000);
}

/* ======================================================
   🔥 FIRESTORE MANUAL STATUS
====================================================== */
async function getManualStatus() {
  try {
    const snap = await getDoc(doc(db, "live_status", "current"));
    if (snap.exists()) {
      const msg = snap.data().message;
      if (msg && msg.trim()) return { text: msg, source: "manual" };
    }
  } catch (e) {
    console.warn("Firestore manual status error:", e);
  }
  return null;
}

/* ======================================================
   💬 DISCORD (WITH REAL SPOTIFY + STATUS)
====================================================== */
async function getDiscordActivity() {
  const { userId } = CONFIG.discord;
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
    const { data } = await res.json();
    if (!data) return null;

    const spotify = data.spotify;
    if (spotify) {
      $$("spotify-card").classList.remove("hidden");
      $$("live-activity-cover").src = spotify.album_art_url;
      $$("live-song-title").textContent = spotify.song;
      $$("live-song-artist").textContent = spotify.artist;
      currentSpotifyUrl = `https://open.spotify.com/track/${spotify.track_id}`;
      setupProgress(spotify.timestamps.start, spotify.timestamps.end);
      setStatusLine(`Listening to “${spotify.song}” by ${spotify.artist}`, "spotify");
      $$("live-activity").classList.add("spotify-active");
      return { text: `Listening to ${spotify.song}`, source: "spotify" };
    } else {
      $$("spotify-card").classList.add("hidden");
      $$("live-activity").classList.remove("spotify-active");
    }

    // Non-Spotify Discord presence
    const map = {
      online: "💬 Online on Discord",
      idle: "🌙 Idle on Discord",
      dnd: "⛔ Do Not Disturb",
      offline: "⚫ Offline"
    };
    const status = map[data.discord_status] || "💬 Online on Discord";
    setStatusLine(status, "discord");
    return { text: status, source: "discord" };
  } catch (err) {
    console.error("Discord/Lanyard API error:", err);
    return null;
  }
}

/* ======================================================
   🔧 COMBINE ALL SOURCES
====================================================== */
async function updateLiveStatus() {
  const sources = [
    getManualStatus,
    getDiscordActivity
    // (Steam, Twitch, Reddit, etc. can be re-enabled here)
  ];

  const active = [];
  for (const fn of sources) {
    try {
      const result = await fn();
      if (result) active.push(result);
    } catch (e) {
      console.warn("Error in source:", e);
    }
  }

  if (active.length > 0) updateIconCluster(active);
  else {
    $$("live-activity").classList.add("hidden");
  }
}

/* ======================================================
   🎵 SPOTIFY CARD CLICK-THROUGH
====================================================== */
function bindSpotifyClickThrough() {
  const card = $$("spotify-card");
  if (!card) return;

  function openTrack() {
    if (currentSpotifyUrl) window.open(currentSpotifyUrl, "_blank", "noopener");
  }

  card.addEventListener("click", openTrack);
  card.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openTrack();
    }
  });
}

/* ======================================================
   🚀 INIT
====================================================== */
document.addEventListener("DOMContentLoaded", () => {
  bindSpotifyClickThrough();
  updateLiveStatus();
  setInterval(updateLiveStatus, 8000);
  setInterval(updateLastUpdated, 1000);
});
