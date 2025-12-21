/* =======================================================
   live-activity.js — FINAL, STABLE, NO-RUNTIME-ERRORS
   Manual + Spotify + Twitch + Discord + Reddit
   Priority:
     1) Manual
     2) Spotify
     3) Twitch
     4) Discord
======================================================= */

import { doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/* ======================================================= */
/* === CONFIG ============================================ */
/* ======================================================= */

const CONFIG = {
  discord: { userId: "850815059093356594" },
  twitch:  { username: "calebkritzar" },
  reddit:  { username: "Maleficent_Line6570" }
};

/* ======================================================= */
/* === GLOBAL STATE ====================================== */
/* ======================================================= */

let lastPollTime = Date.now();
let progressInterval = null;
let currentSpotifyUrl = null;
let tempBanner = null;
let manualStatus = null;

const TEMP_BANNER_MS = 15000;
const $$ = (id) => document.getElementById(id);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* ======================================================= */
/* === ICONS ============================================= */
/* ======================================================= */

const ICON_MAP = {
  spotify: "https://cdn.simpleicons.org/spotify/1DB954",
  discord: "https://cdn.simpleicons.org/discord/5865F2",
  twitch:  "https://cdn.simpleicons.org/twitch/9146FF",
  reddit:  "https://cdn.simpleicons.org/reddit/FF4500",
  manual:  "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
  default: "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg"
};

/* ======================================================= */
/* === UI ================================================ */
/* ======================================================= */

function showStatusLine(text, source) {
  const line = $$("status-line");
  const txt  = $$("status-line-text");
  const icon = $$("status-icon");

  if (!line || !txt || !icon) return;

  icon.src = ICON_MAP[source] || ICON_MAP.default;
  icon.classList.toggle("glow", source === "spotify" || source === "twitch");
  txt.textContent = text;

  line.style.opacity = "1";

  localStorage.setItem("lastStatus", JSON.stringify({ text, source }));
}

function updateLastUpdated() {
  const el = $$("live-activity-updated");
  if (!el) return;

  const s = Math.floor((Date.now() - lastPollTime) / 1000);
  el.textContent =
    s < 5   ? "Updated just now" :
    s < 60  ? `Updated ${s}s ago` :
    s < 3600 ? `Updated ${Math.floor(s / 60)}m ago` :
               `Updated ${Math.floor(s / 3600)}h ago`;
}

/* ======================================================= */
/* === SPOTIFY PROGRESS ================================== */
/* ======================================================= */

function setupProgress(startMs, endMs) {
  const bar = $$("music-progress-bar");
  const elapsedEl = $$("elapsed-time");
  const remainEl = $$("remaining-time");
  const totalEl = $$("total-time");

  if (!bar || !startMs || !endMs) return;

  clearInterval(progressInterval);

  const total = Math.max((endMs - startMs) / 1000, 1);
  if (totalEl) totalEl.textContent = fmt(total);

  progressInterval = setInterval(() => {
    const now = Date.now();
    const elapsed = Math.min((now - startMs) / 1000, total);
    const remain = Math.max(total - elapsed, 0);

    bar.style.width = `${(elapsed / total) * 100}%`;
    if (elapsedEl) elapsedEl.textContent = fmt(elapsed);
    if (remainEl) remainEl.textContent = `-${fmt(remain)}`;
  }, 1000);
}

/* ======================================================= */
/* === MANUAL STATUS ===================================== */
/* ======================================================= */

function isManualActive() {
  return manualStatus?.enabled && (!manualStatus.expiresAt || Date.now() < manualStatus.expiresAt);
}

try {
  const ref = doc(db, "manualStatus", "site");
  onSnapshot(ref, async (snap) => {
    if (!snap.exists()) return (manualStatus = null);

    const d = snap.data();
    manualStatus = {
      ...d,
      expiresAt: d.expiresAt?.toMillis?.() ?? d.expiresAt
    };

    if (d.enabled && d.expiresAt && Date.now() >= manualStatus.expiresAt) {
      await setDoc(ref, { enabled: false, text: "", expiresAt: null }, { merge: true });
      manualStatus = null;
    }
  });
} catch {}

/* ======================================================= */
/* === DISCORD / SPOTIFY ================================= */
/* ======================================================= */

async function getDiscord() {
  try {
    const r = await fetch(
      `https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}`,
      { cache: "no-store" }
    );
    if (!r.ok) return null;

    const data = (await r.json()).data;
    if (!data) return null;

    if (data.spotify) {
      const sp = data.spotify;

      const titleEl = $$("live-song-title");
      const artistEl = $$("live-song-artist");
      const coverEl = $$("live-activity-cover");

      if (titleEl) titleEl.textContent = sp.song || "Unknown";
      if (artistEl) artistEl.textContent = sp.artist || "Unknown";
      if (coverEl && coverEl.src !== sp.album_art_url) coverEl.src = sp.album_art_url;

      currentSpotifyUrl = sp.track_id
        ? `https://open.spotify.com/track/${sp.track_id}`
        : null;

      setupProgress(sp.timestamps?.start, sp.timestamps?.end);

      return { source: "spotify" };
    }

    const map = {
      online: "Online on Discord",
      idle: "Idle on Discord",
      dnd: "Do Not Disturb",
      offline: "Offline"
    };

    return { text: map[data.discord_status] || "Online on Discord", source: "discord" };
  } catch {
    return null;
  }
}

/* ======================================================= */
/* === TWITCH (DETERMINISTIC) ============================= */
/* ======================================================= */

async function getTwitch() {
  try {
    const r = await fetch(
      `https://api.decapi.net/twitch/streaminfo/${CONFIG.twitch.username}`,
      { cache: "no-store" }
    );
    if (!r.ok) return null;

    const text = (await r.text()).trim().toLowerCase();
    if (text === "offline") return null;

    return { text: "Now Live on Twitch", source: "twitch" };
  } catch {
    return null;
  }
}

/* ======================================================= */
/* === REDDIT ============================================ */
/* ======================================================= */

async function getReddit() {
  try {
    const r = await fetch(
      `https://www.reddit.com/user/${CONFIG.reddit.username}/submitted.json?limit=1`,
      { cache: "no-store" }
    );
    if (!r.ok) return null;

    const j = await r.json();
    const post = j?.data?.children?.[0]?.data;
    if (!post) return null;

    const last = localStorage.getItem("lastRedditId");
    if (post.id === last) return null;

    localStorage.setItem("lastRedditId", post.id);

    return { text: "Shared on Reddit", source: "reddit", isTemp: true };
  } catch {
    return null;
  }
}

/* ======================================================= */
/* === MAIN LOOP ========================================= */
/* ======================================================= */

async function mainLoop() {
  const [discord, twitch, reddit] = await Promise.all([
    getDiscord(),
    getTwitch(),
    getReddit()
  ]);

  if (reddit?.isTemp) {
    tempBanner = {
      text: reddit.text,
      source: reddit.source,
      expiresAt: Date.now() + TEMP_BANNER_MS
    };
  } else if (tempBanner && Date.now() > tempBanner.expiresAt) {
    tempBanner = null;
  }

  if (isManualActive()) {
    showStatusLine(manualStatus.text, "manual");
  }
  else if (discord?.source === "spotify") {
    showStatusLine("Listening to Spotify", "spotify");
  }
  else if (twitch) {
    showStatusLine(twitch.text, "twitch");
  }
  else if (tempBanner) {
    showStatusLine(tempBanner.text, tempBanner.source);
  }
  else {
    showStatusLine(discord?.text || "No Current Active Activities", "discord");
  }

  lastPollTime = Date.now();
}

/* ======================================================= */
/* === INIT ============================================== */
/* ======================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const card = $$("spotify-card");
  if (card) {
    card.addEventListener("click", () => {
      if (currentSpotifyUrl) window.open(currentSpotifyUrl, "_blank");
    });
  }

  const saved = localStorage.getItem("lastStatus");
  if (saved) {
    const { text, source } = JSON.parse(saved);
    showStatusLine(text, source);
  }

  mainLoop();
  setInterval(mainLoop, 30000);
  setInterval(updateLastUpdated, 1000);
});
