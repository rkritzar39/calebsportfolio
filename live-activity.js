import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

const CONFIG = {
  discord: { userId: "850815059093356594" },
};

let lastUpdateTime = null;
let progressInterval = null;
let currentSpotifyUrl = null;

const $$ = (id) => document.getElementById(id);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* ---------- STATUS LINE ---------- */
function setStatusLine(text, isVisible = true) {
  const txt = $$("status-line-text");
  const line = $$("status-line");
  if (!txt || !line) return;

  txt.textContent = text || "Offline";
  if (isVisible) {
    line.classList.remove("hidden");
  } else {
    line.classList.add("hidden");
  }
  lastUpdateTime = Date.now();
  updateLastUpdated();
}

/* ---------- LAST UPDATED ---------- */
function updateLastUpdated() {
  const el = $$("live-activity-updated");
  if (!el) return;
  if (!lastUpdateTime) return (el.textContent = "—");
  const s = Math.floor((Date.now() - lastUpdateTime) / 1000);
  el.textContent =
    s < 5 ? "Updated just now" :
    s < 60 ? `Updated ${s}s ago` :
    s < 3600 ? `Updated ${Math.floor(s / 60)}m ago` :
    `${Math.floor(s / 3600)}h ago`;
}

/* ---------- SPOTIFY PROGRESS BAR ---------- */
function setupProgress(startMs, endMs) {
  const bar = $$("music-progress-bar");
  const elapsed = $$("elapsed-time");
  const remaining = $$("remaining-time");
  const total = $$("total-time");
  if (!bar || !startMs || !endMs) return;

  const totalSec = (endMs - startMs) / 1000;
  total.textContent = fmt(totalSec);
  clearInterval(progressInterval);

  function tick() {
    const now = Date.now();
    const elapsedSec = Math.min((now - startMs) / 1000, totalSec);
    const left = Math.max(totalSec - elapsedSec, 0);
    bar.style.width = `${(elapsedSec / totalSec) * 100}%`;
    elapsed.textContent = fmt(elapsedSec);
    remaining.textContent = `-${fmt(left)}`;
  }

  tick();
  progressInterval = setInterval(tick, 1000);
}

/* ---------- DYNAMIC BACKGROUND + ACCENT ---------- */
function updateDynamicColors(imageUrl) {
  if (!imageUrl) return;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageUrl;

  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, img.width, img.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);

      const gradient = `linear-gradient(180deg, rgba(${r},${g},${b},0.4), rgba(${r},${g},${b},0.15))`;
      document.querySelector(".live-activity").style.setProperty("--dynamic-bg", gradient);
      document.querySelector(".live-activity").style.setProperty("--dynamic-accent", `rgb(${r},${g},${b})`);
    } catch (err) {
      console.warn("Dynamic color extraction failed:", err);
    }
  };
}

/* ---------- DISCORD (SPOTIFY) ACTIVITY ---------- */
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
      updateDynamicColors(sp.album_art_url);
      setStatusLine(`Listening to “${sp.song}” by ${sp.artist}`, true);
      return { text: `Spotify — ${sp.song}`, source: "spotify" };
    }

    $$("spotify-card").classList.add("hidden");
    setStatusLine("Offline", false);
    return { text: "Offline", source: "manual" };
  } catch (err) {
    console.warn("Discord fetch error:", err);
    return null;
  }
}

/* ---------- UPDATE LOOP ---------- */
async function updateLiveStatus() {
  const res = await getDiscord();
  if (!res) {
    $$("spotify-card").classList.add("hidden");
    setStatusLine("Offline", false);
  }
  $$("live-activity").classList.remove("hidden");
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const card = $$("spotify-card");
  if (card)
    card.addEventListener("click", () => currentSpotifyUrl && window.open(currentSpotifyUrl, "_blank"));
  updateLiveStatus();
  setInterval(updateLiveStatus, 10000);
  setInterval(updateLastUpdated, 1000);
});
