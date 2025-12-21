/* =======================================================
   live-activity.js — FINAL, CLEAN, TRUSTWORTHY
   Manual + Spotify + Twitch + Discord + Reddit
   Priority:
     1) Manual
     2) Spotify
     3) Twitch
     4) Discord presence
======================================================= */

import { doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/* ======================================================= */
/* === CONFIG ============================================ */
/* ======================================================= */

const CONFIG = {
  discord: { userId: "850815059093356594" },
  twitch:  { username: "calebkritzar" },
  reddit:  { username: "Maleficent_Line6570" },
};

/* ======================================================= */
/* === GLOBAL STATE ====================================== */
/* ======================================================= */

let lastUpdateTime = null;
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
  default: "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
};

/* ======================================================= */
/* === UI HELPERS ======================================== */
/* ======================================================= */

function showStatusLineWithFade(text, source = "default") {
  const txt = $$("status-line-text");
  const line = $$("status-line");
  const icon = $$("status-icon");
  if (!txt || !line || !icon) return;

  if (txt.textContent === text && icon.alt === `${source} icon`) return;

  const iconUrl = ICON_MAP[source] || ICON_MAP.default;

  line.style.opacity = "0";

  setTimeout(() => {
    icon.src = iconUrl;
    icon.alt = `${source} icon`;
    txt.textContent = text;

    icon.classList.toggle("glow", ["spotify", "twitch"].includes(source));

    line.style.opacity = "1";

    lastUpdateTime = Date.now();
    localStorage.setItem("lastStatus", JSON.stringify({
      text,
      source,
      timestamp: lastUpdateTime
    }));
  }, 180);
}

function updateLastUpdated() {
  const el = $$("live-activity-updated");
  if (!el) return;

  const ref = lastPollTime || lastUpdateTime || Date.now();
  const s = Math.floor((Date.now() - ref) / 1000);

  if (s < 5) el.textContent = "Updated just now";
  else if (s < 60) el.textContent = `Updated ${s}s ago`;
  else if (s < 3600) el.textContent = `Updated ${Math.floor(s / 60)}m ago`;
  else el.textContent = `Updated ${Math.floor(s / 3600)}h ago`;
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

  const totalSec = Math.max((endMs - startMs) / 1000, 1);
  if (totalEl) totalEl.textContent = fmt(totalSec);

  clearInterval(progressInterval);

  function tick() {
    const now = Date.now();
    const elapsed = Math.min((now - startMs) / 1000, totalSec);
    const left = Math.max(totalSec - elapsed, 0);

    bar.style.width = `${(elapsed / totalSec) * 100}%`;
    if (elapsedEl) elapsedEl.textContent = fmt(elapsed);
    if (remainEl) remainEl.textContent = `-${fmt(left)}`;
  }

  tick();
  progressInterval = setInterval(tick, 1000);
}

/* ======================================================= */
/* === MANUAL STATUS ===================================== */
/* ======================================================= */

function isManualActive() {
  if (!manualStatus?.enabled) return false;
  if (!manualStatus.expiresAt) return true;
  return Date.now() < manualStatus.expiresAt;
}

try {
  const manualRef = doc(db, "manualStatus", "site");

  onSnapshot(manualRef, async (snap) => {
    if (!snap.exists()) {
      manualStatus = null;
      return;
    }

    const d = snap.data();
    manualStatus = {
      ...d,
      expiresAt: d.expiresAt?.toMillis ? d.expiresAt.toMillis() : d.expiresAt
    };

    if (d.enabled && d.expiresAt && Date.now() >= manualStatus.expiresAt) {
      await setDoc(manualRef, {
        enabled: false,
        text: "",
        expiresAt: null
      }, { merge: true });

      manualStatus = null;
    }
  });
} catch (e) {
  console.warn("Manual status disabled:", e);
}

/* ======================================================= */
/* === DISCORD / SPOTIFY ================================= */
/* ======================================================= */

async function getDiscord() {
  if (isManualActive()) return { source: "manual" };

  try {
    const r = await fetch(
      `https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}?_ts=${Date.now()}`,
      { cache: "no-store" }
    );

    if (!r.ok) return null;

    const data = (await r.json()).data;
    if (!data) return null;

    if (data.spotify) {
      const sp = data.spotify;

      $$("live-song-title").textContent = sp.song || "Unknown";
      $$("live-song-artist").textContent = sp.artist || "Unknown";
      $$("live-activity-cover").src = sp.album_art_url;

      currentSpotifyUrl = sp.track_id
        ? `https://open.spotify.com/track/${sp.track_id}`
        : null;

      setupProgress(sp.timestamps.start, sp.timestamps.end);

      return { source: "spotify" };
    }

    const map = {
      online: "Online on Discord",
      idle: "Idle on Discord",
      dnd: "Do Not Disturb",
      offline: "Offline"
    };

    return {
      text: map[data.discord_status] || "Online on Discord",
      source: "discord"
    };

  } catch {
    return null;
  }
}

/* ======================================================= */
/* === T W I T C H  (REAL, RELIABLE) ====================== */
/* ======================================================= */

async function getTwitch() {
  const username = CONFIG.twitch.username;
  if (!username) return null;

  try {
    const r = await fetch(
      `https://api.decapi.net/twitch/streaminfo/${username}`,
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

    const post = r.json()?.data?.children?.[0]?.data;
    if (!post) return null;

    const last = localStorage.getItem("lastRedditId");
    if (post.id === last) return null;

    localStorage.setItem("lastRedditId", post.id);

    return {
      text: "Shared on Reddit",
      source: "reddit",
      isTemp: true
    };

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
  } else if (tempBanner && Date.now() >= tempBanner.expiresAt) {
    tempBanner = null;
  }

  if (isManualActive()) {
    showStatusLineWithFade(manualStatus.text, "manual");
  }
  else if (discord?.source === "spotify") {
    showStatusLineWithFade("Listening to Spotify", "spotify");
  }
  else if (twitch) {
    showStatusLineWithFade("Now Live on Twitch", "twitch");
  }
  else if (tempBanner) {
    showStatusLineWithFade(tempBanner.text, tempBanner.source);
  }
  else {
    showStatusLineWithFade(
      discord?.text || "No Current Active Activities",
      discord?.source || "discord"
    );
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
    showStatusLineWithFade(text, source);
  }

  mainLoop();
  setInterval(mainLoop, 30000);
  setInterval(updateLastUpdated, 1000);
});
