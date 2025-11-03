import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/**
 * Live Activity – Clean Text-Only Version
 * No icons, single status line, improved offline handling.
 * Spotify card appears only when music is active.
 */

const CONFIG = {
  discord: { userId: "850815059093356594" },
  twitch: { username: "calebkritzar" },
  reddit: { username: "Electronic_Row_1262" },
  github: { username: "rkritzar39" },
  tiktok: { username: "calebkritzar" },
};

let lastUpdateTime = null;
let progressInterval = null;
let currentSpotifyUrl = null;

const $$ = (id) => document.getElementById(id);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* ---------- STATUS LINE ---------- */
function setStatusLine(text, color = "var(--text-color)") {
  const txt = $$("status-line-text");
  const ico = $$("status-icon-logo");
  if (!txt || !ico) return;

  txt.textContent = text || "Offline";
  ico.style.display = "none"; // hide icon area
  lastUpdateTime = Date.now();
  updateLastUpdated();
}

/* ---------- UPDATED TIMER ---------- */
function updateLastUpdated() {
  const el = $$("live-activity-updated");
  if (!el) return;

  if (!lastUpdateTime) {
    el.textContent = "—";
    return;
  }

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

/* ---------- FIRESTORE MANUAL STATUS ---------- */
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

/* ---------- DISCORD / SPOTIFY STATUS ---------- */
async function getDiscord() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}`, { cache: "no-store" });
    const { data } = await res.json();
    if (!data) return null;

    // Spotify Activity
    if (data.spotify) {
      const sp = data.spotify;
      $$("spotify-card").classList.remove("hidden");
      $$("live-activity-cover").src = sp.album_art_url;
      $$("live-song-title").textContent = sp.song;
      $$("live-song-artist").textContent = sp.artist;
      currentSpotifyUrl = `https://open.spotify.com/track/${sp.track_id}`;
      setupProgress(sp.timestamps.start, sp.timestamps.end);
      setStatusLine(`Listening to “${sp.song}” by ${sp.artist}`);
      return { text: `Spotify — ${sp.song}`, source: "spotify" };
    }

    // Regular Discord Presence
    $$("spotify-card").classList.add("hidden");
    const map = {
      online: "Online on Discord",
      idle: "Idle on Discord",
      dnd: "Do Not Disturb",
      offline: "Offline",
    };
    const status = map[data.discord_status] || "Offline";
    setStatusLine(status);
    return { text: status, source: "discord" };
  } catch {
    return null;
  }
}

/* ---------- TWITCH STATUS ---------- */
async function getTwitch() {
  try {
    const res = await fetch(`https://decapi.me/twitch/live/${CONFIG.twitch.username}`, { cache: "no-store" });
    const t = await res.text();
    if (t.toLowerCase().includes("is live")) {
      setStatusLine("Now Live on Twitch");
      return { text: "Now Live on Twitch", source: "twitch" };
    }
  } catch {}
  return null;
}

/* ---------- REDDIT STATUS ---------- */
async function getReddit() {
  try {
    const res = await fetch(`https://www.reddit.com/user/${CONFIG.reddit.username}/submitted.json?limit=1`, { cache: "no-store" });
    const json = await res.json();
    const post = json.data.children[0]?.data;
    if (post) {
      setStatusLine("Shared something on Reddit");
      return { text: `Reddit — ${post.title}`, source: "reddit" };
    }
  } catch {}
  return null;
}

/* ---------- GITHUB STATUS ---------- */
async function getGitHub() {
  try {
    const res = await fetch(`https://api.github.com/users/${CONFIG.github.username}/events/public`, { cache: "no-store" });
    const events = await res.json();
    const evt = events.find((e) => ["PushEvent", "CreateEvent"].includes(e.type));
    if (evt) {
      setStatusLine("Committed code on GitHub");
      return { text: "Committed on GitHub", source: "github" };
    }
  } catch {}
  return null;
}

/* ---------- TIKTOK STATUS ---------- */
async function getTikTok() {
  try {
    const res = await fetch(`https://r.jina.ai/http://www.tiktok.com/@${CONFIG.tiktok.username}`, { cache: "no-store" });
    const html = await res.text();
    if (html.includes("/video/")) {
      setStatusLine("Posted a new TikTok video");
      return { text: "Posted on TikTok", source: "tiktok" };
    }
  } catch {}
  return null;
}

/* ---------- COMBINE SOURCES ---------- */
async function updateLiveStatus() {
  const sources = [getManualStatus, getDiscord, getTwitch, getTikTok, getReddit, getGitHub];
  const results = [];

  for (const fn of sources) {
    const r = await fn();
    if (r) results.push(r);
  }

  const main = results.find((r) => ["spotify", "discord"].includes(r.source)) || results[0];

  if (main) {
    setStatusLine(main.text);
  } else {
    $$("spotify-card").classList.add("hidden");
    setStatusLine("Offline");
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
