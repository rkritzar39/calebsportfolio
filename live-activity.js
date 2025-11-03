import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/**
 * Live Activity – Stable Final Version
 * One main persistent icon (Spotify or Discord)
 * Temporary auto-fade icons (TikTok, Reddit, GitHub, Twitch)
 * Inline SVGs, progress bar intact, and clean layout
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
const formatTime = (s) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* === Inline SVGs === */
const ICONS = {
  spotify: `<svg viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.51 17.34a.74.74 0 0 1-1.02.25c-2.8-1.72-6.33-2.1-10.47-1.16a.74.74 0 1 1-.33-1.45c4.43-1 8.28-.56 11.37 1.31.35.21.46.67.24 1.05z"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24"><path fill="#25F4EE" d="M12.5 0c.3 2.3 1.8 4.3 3.9 5.2V0h2.4v14.6c0 4.4-3.6 8-8 8-4.4 0-8-3.6-8-8 0-3.8 2.7-7 6.3-7.8v2.5c-2.2.7-3.8 2.7-3.8 5.2 0 3 2.5 5.5 5.5 5.5s5.5-2.5 5.5-5.5V7.8c-.9-.3-1.8-.8-2.6-1.4V0h-1.2z"/></svg>`,
  reddit: `<svg viewBox="0 0 24 24" fill="#FF4500"><circle cx="12" cy="12" r="12"/></svg>`,
  discord: `<svg viewBox="0 0 245 240" fill="#5865F2"><path d="M104.4 104.6c-5.7 0-10.2 5-10.2 11.1s4.6 11.1 10.2 11.1 10.3-5 10.2-11.1c.1-6.1-4.5-11.1-10.2-11.1zm36.2 0c-5.7 0-10.2 5-10.2 11.1s4.6 11.1 10.2 11.1 10.2-5 10.2-11.1-4.5-11.1-10.2-11.1z"/></svg>`,
  github: `<svg viewBox="0 0 24 24" fill="#181717"><path d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.2.8-.6v-2.1c-3.4.8-4.1-1.7-4.1-1.7-.5-1.3-1.2-1.7-1.2-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1 2.1.7 2.1.7 0-.7.4-1.2.8-1.5-2.7-.3-5.5-1.4-5.5-6 0-1.3.5-2.3 1.1-3.1-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.3 1.2a11.4 11.4 0 016 0C17 2.5 18 2.8 18 2.8c.6 1.7.2 3 .1 3.3.7.8 1.1 1.8 1.1 3.1 0 4.6-2.8 5.6-5.5 6 .4.3.8 1 .8 2v3c0 .4.3.7.8.6A12 12 0 0012 .3z"/></svg>`,
  twitch: `<svg viewBox="0 0 24 24" fill="#9146FF"><path d="M4 2L3 6v13h5v3h3l3-3h4l5-5V2H4z"/></svg>`,
  manual: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>`,
};

function renderIcon(src) {
  return ICONS[src] || ICONS.manual;
}

/* --- Status Line --- */
function setStatusLine(text, source = "manual") {
  const txt = $$("status-line-text");
  const ico = $$("status-icon-logo");
  if (!txt || !ico) return;
  txt.textContent = text || "—";
  ico.innerHTML = renderIcon(source);
  lastUpdateTime = Date.now();
  updateLastUpdated();
}

/* --- Cluster --- */
function updateIconCluster(results) {
  const cluster = $$("icon-cluster");
  if (!cluster) return;
  cluster.innerHTML = "";

  const main = results.find((r) => ["spotify", "discord"].includes(r.source));
  if (main) {
    const el = document.createElement("span");
    el.className = `cluster-icon-svg main-icon ${main.source} active`;
    el.innerHTML = renderIcon(main.source);
    cluster.appendChild(el);
  }

  const temps = results.filter((r) =>
    ["tiktok", "reddit", "github", "twitch"].includes(r.source)
  );
  temps.forEach((r) => {
    const el = document.createElement("span");
    el.className = `cluster-icon-svg ${r.source} temp-icon active`;
    el.innerHTML = renderIcon(r.source);
    cluster.appendChild(el);
    setTimeout(() => {
      el.classList.remove("active");
      el.style.opacity = 0;
      setTimeout(() => el.remove(), 400);
    }, 20000);
  });
}

/* --- Time Label --- */
function updateLastUpdated() {
  const el = $$("live-activity-updated");
  if (!el) return;
  if (!lastUpdateTime) return (el.textContent = "—");
  const s = Math.floor((Date.now() - lastUpdateTime) / 1000);
  el.textContent =
    s < 5 ? "Updated just now" : s < 60 ? `Updated ${s}s ago` : s < 3600 ? `Updated ${Math.floor(s / 60)}m ago` : `Updated ${Math.floor(s / 3600)}h ago`;
}

/* --- Spotify progress (same as before) --- */
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

/* --- API Fetchers --- */
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
      return { text: `Spotify — ${sp.song}`, source: "spotify" };
    }
    $$("spotify-card").classList.add("hidden");
    const map = { online: "Online on Discord", idle: "Idle on Discord", dnd: "Do Not Disturb", offline: "Offline" };
    const status = map[data.discord_status] || "Online on Discord";
    setStatusLine(status, "discord");
    return { text: status, source: "discord" };
  } catch {
    return null;
  }
}

async function getTwitch() {
  try {
    const u = CONFIG.twitch.username;
    const res = await fetch(`https://decapi.me/twitch/live/${u}`, { cache: "no-store" });
    const text = await res.text();
    if (text.toLowerCase().includes("is live")) {
      setStatusLine("Now Live on Twitch", "twitch");
      return { text: "Now Live on Twitch", source: "twitch" };
    }
  } catch {}
  return null;
}

async function getReddit() {
  try {
    const u = CONFIG.reddit.username;
    const res = await fetch(`https://www.reddit.com/user/${u}/submitted.json?limit=1`, { cache: "no-store" });
    const json = await res.json();
    const post = json.data.children[0]?.data;
    if (post) {
      setStatusLine("Shared on Reddit", "reddit");
      return { text: `Reddit — ${post.title}`, source: "reddit" };
    }
  } catch {}
  return null;
}

async function getGitHub() {
  try {
    const u = CONFIG.github.username;
    const res = await fetch(`https://api.github.com/users/${u}/events/public`, { cache: "no-store" });
    const events = await res.json();
    const evt = events.find((e) => ["PushEvent", "CreateEvent"].includes(e.type));
    if (evt) {
      setStatusLine("Committed on GitHub", "github");
      return { text: "Committed on GitHub", source: "github" };
    }
  } catch {}
  return null;
}

async function getTikTok() {
  try {
    const u = CONFIG.tiktok.username;
    const res = await fetch(`https://r.jina.ai/http://www.tiktok.com/@${u}`, { cache: "no-store" });
    const html = await res.text();
    if (html.includes("/video/")) {
      setStatusLine("Posted on TikTok", "tiktok");
      return { text: "Posted on TikTok", source: "tiktok" };
    }
  } catch {}
  return null;
}

/* --- Combine --- */
async function updateLiveStatus() {
  const sources = [getManualStatus, getDiscord, getTwitch, getTikTok, getReddit, getGitHub];
  const results = [];
  for (const fn of sources) {
    const r = await fn();
    if (r) results.push(r);
  }
  const main = results.find((r) => ["spotify", "discord"].includes(r.source)) || results[0];
  if (main) setStatusLine(main.text, main.source);
  updateIconCluster(results);
  $$("live-activity")?.classList.toggle("hidden", results.length === 0);
}

document.addEventListener("DOMContentLoaded", () => {
  const card = $$("spotify-card");
  if (card) card.addEventListener("click", () => currentSpotifyUrl && window.open(currentSpotifyUrl, "_blank"));
  updateLiveStatus();
  setInterval(updateLiveStatus, 10000);
  setInterval(updateLastUpdated, 1000);
});
