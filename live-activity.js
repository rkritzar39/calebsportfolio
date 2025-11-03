import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

const CONFIG = {
  discord: { userId: "850815059093356594" },
  twitch: { username: "calebkritzar" },
};

const BRAND_COLORS = {
  twitch: "#9146FF",
  tiktok: "#EE1D52",
  github: "#181717",
  reddit: "#FF4500",
  steam: "#00ADEE",
  spotify: "#1DB954",
  discord: "#5865F2",
  manual: "var(--accent-color)",
  offline: "#666666",
};

let lastUpdateTime = null;
let progressInterval = null;
let currentSpotifyUrl = null;

const $$ = (id) => document.getElementById(id);
const formatTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* ========== ICON CLUSTER ========== */
function updateIconCluster(list) {
  const cluster = $$("icon-cluster");
  if (!cluster) return;
  cluster.innerHTML = "";
  list.forEach(({ source, text }) => {
    const dot = document.createElement("div");
    dot.className = `cluster-icon ${source}`;
    dot.title = `${source} — ${text}`;
    cluster.appendChild(dot);
  });
}

/* ========== STATUS LINE ========== */
function setStatusLine(text, source = "manual") {
  const txt = $$("status-line-text");
  const ico = $$("status-icon-logo");
  if (!txt || !ico) return;

  txt.textContent = text || "—";
  const color = BRAND_COLORS[source] || "var(--accent-color)";
  ico.style.background = color;
  ico.style.boxShadow = `0 0 8px ${color}`;

  lastUpdateTime = Date.now();
  updateLastUpdated();
}

/* ========== LAST UPDATED TIMER (FIXED) ========== */
function updateLastUpdated() {
  const el = $$("live-activity-updated");
  if (!el) return;

  if (!lastUpdateTime) {
    el.textContent = "—";
    return;
  }

  const seconds = Math.floor((Date.now() - lastUpdateTime) / 1000);
  let label = "";
  if (seconds < 5) label = "Updated just now";
  else if (seconds < 60) label = `Updated ${seconds}s ago`;
  else if (seconds < 3600) label = `Updated ${Math.floor(seconds / 60)}m ago`;
  else if (seconds < 86400) label = `Updated ${Math.floor(seconds / 3600)}h ago`;
  else label = `Updated ${Math.floor(seconds / 86400)}d ago`;

  el.textContent = label;
}

/* ========== SPOTIFY PROGRESS BAR ========== */
function setupProgress(startMs, endMs) {
  const bar = $$("music-progress-bar");
  const elapsed = $$("elapsed-time");
  const remaining = $$("remaining-time");
  const total = $$("total-time");

  if (!bar || !startMs || !endMs) return;
  const totalSec = (endMs - startMs) / 1000;
  total.textContent = formatTime(totalSec);
  clearInterval(progressInterval);

  function tick() {
    const now = Date.now();
    const elapsedSec = Math.min((now - startMs) / 1000, totalSec);
    const left = Math.max(totalSec - elapsedSec, 0);
    bar.style.width = `${(elapsedSec / totalSec) * 100}%`;
    elapsed.textContent = formatTime(elapsedSec);
    remaining.textContent = `-${formatTime(left)}`;
  }

  tick();
  progressInterval = setInterval(tick, 1000);
}

/* ========== FIRESTORE MANUAL STATUS ========== */
async function getManualStatus() {
  try {
    const snap = await getDoc(doc(db, "live_status", "current"));
    if (snap.exists()) {
      const msg = snap.data().message?.trim();
      if (msg) return { text: msg, source: "manual" };
    }
  } catch (e) {
    console.warn("Firestore error:", e);
  }
  return null;
}

/* ========== DISCORD STATUS + SPOTIFY ========== */
async function getDiscord() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}`, { cache: "no-store" });
    const { data } = await res.json();
    if (!data) return null;

    if (data.spotify) {
      const sp = data.spotify;
      $$("spotify-card").classList.remove("hidden");
      $$("live-activity-cover").src = sp.album_art_url;
      $$("live-song-title").textContent = sp.song;
      $$("live-song-artist").textContent = sp.artist;
      currentSpotifyUrl = `https://open.spotify.com/track/${sp.track_id}`;
      setupProgress(sp.timestamps.start, sp.timestamps.end);
      setStatusLine(`Listening to “${sp.song}” by ${sp.artist}`, "spotify");
      $$("live-activity").classList.add("spotify-active");
      return { text: `Spotify — ${sp.song}`, source: "spotify" };
    }

    $$("spotify-card").classList.add("hidden");
    $$("live-activity").classList.remove("spotify-active");

    const map = {
      online: "💬 Online on Discord",
      idle: "🌙 Idle on Discord",
      dnd: "⛔ Do Not Disturb",
      offline: "⚫ Offline",
    };
    const status = map[data.discord_status] || "💬 Online on Discord";
    setStatusLine(status, "discord");
    return { text: status, source: "discord" };
  } catch (e) {
    console.warn("Discord error:", e);
    return null;
  }
}

/* ========== TWITCH LIVE STATUS (WORKING FIX) ========== */
async function getTwitch() {
  try {
    const username = CONFIG.twitch.username.toLowerCase();
    const res = await fetch(`https://decapi.me/twitch/live/${username}`, { cache: "no-store" });
    const text = await res.text();

    if (text.toLowerCase().includes("is live")) {
      setStatusLine(`🔴 Now Live on Twitch`, "twitch");
      return { text: "Now Live on Twitch", source: "twitch" };
    }

    return null;
  } catch (e) {
    console.warn("Twitch error:", e);
    return null;
  }
}

/* ========== COMBINE SOURCES ========== */
async function updateLiveStatus() {
  const sources = [getManualStatus, getDiscord, getTwitch];
  const results = [];
  for (const fn of sources) {
    const res = await fn();
    if (res) results.push(res);
  }
  updateIconCluster(results);
  const container = $$("live-activity");
  container.classList.toggle("hidden", results.length === 0);
}

/* ========== SPOTIFY CLICK-THROUGH ========== */
function bindSpotifyClick() {
  const card = $$("spotify-card");
  if (!card) return;
  const open = () => {
    if (currentSpotifyUrl) window.open(currentSpotifyUrl, "_blank", "noopener");
  };
  card.addEventListener("click", open);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  });
}

/* ========== INIT ========== */
document.addEventListener("DOMContentLoaded", () => {
  bindSpotifyClick();
  updateLiveStatus();
  setInterval(updateLiveStatus, 8000);
  setInterval(updateLastUpdated, 1000);
});
