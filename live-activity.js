/* ======================================================
   🎧 Live Activity — Spotify Explicit + Pause Detection
   ====================================================== */

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/* =========================
   CONFIG
========================= */
const CONFIG = {
  discord: { userId: "850815059093356594" },
};

/* =========================
   BRAND COLORS
========================= */
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

/* =========================
   GLOBALS
========================= */
let lastUpdateTime = null;
let progressInterval = null;
let currentSpotifyUrl = null;
let lastKnownTrack = null;
let lastSpotifyUpdate = 0;
const $$ = (id) => document.getElementById(id);
const formatTime = (s) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* =========================
   HONEYCOMB ICON CLUSTER
========================= */
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

/* =========================
   STATUS LINE + TIMER
========================= */
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

function updateLastUpdated() {
  const el = $$("live-activity-updated");
  if (!el || !lastUpdateTime) return;
  const sec = Math.floor((Date.now() - lastUpdateTime) / 1000);
  el.textContent =
    sec < 10
      ? "Updated just now"
      : sec < 60
      ? `Updated ${sec}s ago`
      : sec < 3600
      ? `Updated ${Math.floor(sec / 60)}m ago`
      : `Updated ${Math.floor(sec / 3600)}h ago`;
}

/* =========================
   SPOTIFY PROGRESS BAR
========================= */
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

/* =========================
   FIRESTORE MANUAL STATUS
========================= */
async function getManualStatus() {
  try {
    const snap = await getDoc(doc(db, "live_status", "current"));
    if (snap.exists()) {
      const msg = snap.data().message?.trim();
      if (msg) return { text: msg, source: "manual" };
    }
  } catch {}
  return null;
}

/* =========================
   DISCORD / LANYARD HANDLER
========================= */
async function getDiscord() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}`, { cache: "no-store" });
    const { data } = await res.json();
    if (!data) return null;

    // =================== Spotify active ===================
    if (data.spotify) {
      const sp = data.spotify;
      lastKnownTrack = sp;
      lastSpotifyUpdate = Date.now();

      $$("spotify-card").classList.remove("hidden");
      $$("live-activity").classList.add("spotify-active");
      $$("live-activity-cover").src = sp.album_art_url;
      $$("live-song-title").textContent = sp.song;
      $$("live-song-artist").textContent = sp.artist;
      currentSpotifyUrl = `https://open.spotify.com/track/${sp.track_id}`;
      setupProgress(sp.timestamps.start, sp.timestamps.end);

      // ---- explicit check ----
      let isExplicit = false;
      try {
        const r = await fetch(`https://api.spotify.com/v1/tracks/${sp.track_id}`, {
          headers: { Accept: "application/json" },
        });
        if (r.ok) {
          const d = await r.json();
          isExplicit = d.explicit || false;
        }
      } catch (err) {
        console.warn("Explicit check failed:", err);
      }

      // show explicit 🅴 tag before title
      const explicitTag = isExplicit ? "🅴 " : "";
      setStatusLine(`🎵 ${explicitTag}Listening to “${sp.song}” by ${sp.artist}`, "spotify");
      return { text: `Spotify — ${sp.song}`, source: "spotify" };
    }

    // =================== Paused (within 30s) ===================
    const elapsed = Date.now() - lastSpotifyUpdate;
    if (lastKnownTrack && elapsed < 30000) {
      $$("spotify-card").classList.remove("hidden");
      $$("live-activity").classList.add("spotify-paused");
      $$("live-activity-cover").src = lastKnownTrack.album_art_url;
      $$("live-song-title").textContent = lastKnownTrack.song;
      $$("live-song-artist").textContent = lastKnownTrack.artist;
      $$("music-progress-bar").style.width = "100%";
      setStatusLine(`⏸ Paused “${lastKnownTrack.song}” by ${lastKnownTrack.artist}`, "spotify");
      return { text: "Spotify (Paused)", source: "spotify" };
    }

    // =================== Fallback Discord presence ===================
    $$("spotify-card").classList.add("hidden");
    $$("live-activity").classList.remove("spotify-active", "spotify-paused");
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

/* =========================
   UPDATE LOOP
========================= */
async function updateLiveStatus() {
  const sources = [getManualStatus, getDiscord];
  const results = [];
  for (const fn of sources) {
    const res = await fn();
    if (res) results.push(res);
  }
  updateIconCluster(results);
  $$("live-activity").classList.toggle("hidden", results.length === 0);
}

/* =========================
   SPOTIFY CLICK-THROUGH
========================= */
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

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  bindSpotifyClick();
  updateLiveStatus();
  setInterval(updateLiveStatus, 8000);
  setInterval(updateLastUpdated, 1000);
});
