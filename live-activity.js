import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/**
 * Live Activity – Final Integrated Version
 * Auto detects TikTok, Reddit, GitHub, Discord (Spotify), Twitch, and manual status.
 * Adds smooth icon transitions and keeps progress bar & theme intact.
 */

const CONFIG = {
  discord: { userId: "850815059093356594" },
  twitch: { username: "calebkritzar" },
  reddit: { username: "Electronic_Row_1262" },
  github: { username: "rkritzar39" },
  tiktok: { username: "calebkritzar" },
};

const BRAND_COLORS = {
  twitch: "#9146FF",
  tiktok: "#EE1D52",
  github: "#181717",
  reddit: "#FF4500",
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

/* === Inline SVGs (One per platform) === */
const ICONS = {
  spotify: `<svg viewBox="0 0 24 24" fill="#1DB954" width="22" height="22"><path d="M12 0C5.371 0 0 5.373 0 12c0 6.627 5.371 12 12 12s12-5.373 12-12C24 5.373 18.629 0 12 0zm5.512 17.34a.744.744 0 0 1-1.023.248c-2.8-1.715-6.327-2.105-10.472-1.161a.744.744 0 1 1-.326-1.452c4.43-1.002 8.282-.56 11.368 1.312.349.214.46.668.243 1.053z"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#25F4EE" d="M12.5 0c.3 2.3 1.8 4.3 3.9 5.2V0h2.4v14.6c0 4.4-3.6 8-8 8-4.4 0-8-3.6-8-8 0-3.8 2.7-7 6.3-7.8v2.5c-2.2.7-3.8 2.7-3.8 5.2 0 3 2.5 5.5 5.5 5.5s5.5-2.5 5.5-5.5V7.8c-.9-.3-1.8-.8-2.6-1.4V0h-1.2z"/></svg>`,
  reddit: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FF4500"><path d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zM8.2 9.9a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4zm7.6 0a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4zM12 18c2.2 0 4-1.2 4-2.7H8c0 1.5 1.8 2.7 4 2.7z"/></svg>`,
  discord: `<svg viewBox="0 0 245 240" width="22" height="22"><path fill="#5865F2" d="M104.4 104.6c-5.7 0-10.2 5-10.2 11.1s4.6 11.1 10.2 11.1 10.3-5 10.2-11.1c.1-6.1-4.5-11.1-10.2-11.1zm36.2 0c-5.7 0-10.2 5-10.2 11.1s4.6 11.1 10.2 11.1 10.2-5 10.2-11.1-4.5-11.1-10.2-11.1z"/></svg>`,
  github: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#181717"><path d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.2.8-.6v-2.1c-3.4.8-4.1-1.7-4.1-1.7-.5-1.3-1.2-1.7-1.2-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1 2.1.7 2.1.7 0-.7.4-1.2.8-1.5-2.7-.3-5.5-1.4-5.5-6 0-1.3.5-2.3 1.1-3.1-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.3 1.2a11.4 11.4 0 016 0C17 2.5 18 2.8 18 2.8c.6 1.7.2 3 .1 3.3.7.8 1.1 1.8 1.1 3.1 0 4.6-2.8 5.6-5.5 6 .4.3.8 1 .8 2v3c0 .4.3.7.8.6A12 12 0 0012 .3z"/></svg>`,
  twitch: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#9146FF"><path d="M4 2L3 6v13h5v3h3l3-3h4l5-5V2H4zm18 9l-3 3h-5l-3 3v-3H7V4h15v7z"/><path d="M15 6h2v5h-2zM11 6h2v5h-2z"/></svg>`,
  manual: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>`,
};

function renderIcon(source) {
  return ICONS[source] || ICONS.manual;
}

/* === Cluster + Status Line Updates === */
function updateIconCluster(list) {
  const cluster = $$("icon-cluster");
  if (!cluster) return;
  cluster.innerHTML = "";

  list.forEach(({ source, text }) => {
    const iconWrap = document.createElement("span");
    iconWrap.className = `cluster-icon-svg ${source} active`;
    iconWrap.innerHTML = renderIcon(source);
    iconWrap.title = `${text}`;
    cluster.appendChild(iconWrap);
  });
}

function setStatusLine(text, source = "manual") {
  const txt = $$("status-line-text");
  const ico = $$("status-icon-logo");
  if (!txt || !ico) return;
  txt.textContent = text || "—";
  ico.innerHTML = renderIcon(source);
  ico.style.display = "inline-flex";
  ico.style.alignItems = "center";
  lastUpdateTime = Date.now();
  updateLastUpdated();
}

/* === Updated Timer === */
function updateLastUpdated() {
  const el = $$("live-activity-updated");
  if (!el) return;
  if (!lastUpdateTime) return (el.textContent = "—");
  const s = Math.floor((Date.now() - lastUpdateTime) / 1000);
  el.textContent =
    s < 5 ? "Updated just now" : s < 60 ? `Updated ${s}s ago` : s < 3600 ? `Updated ${Math.floor(s / 60)}m ago` : `Updated ${Math.floor(s / 3600)}h ago`;
}

/* === Spotify Progress === */
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

/* === Firestore Manual === */
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

/* === Discord + Spotify === */
async function getDiscord() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}`, { cache: "no-store" });
    const { data } = await res.json();
    if (!data) return null;
    if (data.spotify) {
      const sp = data.spotify;
      $$("spotify-card")?.classList.remove("hidden");
      $$("live-activity-cover").src = sp.album_art_url;
      $$("live-song-title").textContent = sp.song;
      $$("live-song-artist").textContent = sp.artist;
      currentSpotifyUrl = `https://open.spotify.com/track/${sp.track_id}`;
      setupProgress(sp.timestamps.start, sp.timestamps.end);
      setStatusLine(`Listening to “${sp.song}” by ${sp.artist}`, "spotify");
      return { text: `Spotify — ${sp.song}`, source: "spotify" };
    }
    $$("spotify-card")?.classList.add("hidden");
    const map = {
      online: "Online on Discord",
      idle: "Idle on Discord",
      dnd: "Do Not Disturb",
      offline: "Offline",
    };
    const status = map[data.discord_status] || "Online on Discord";
    setStatusLine(status, "discord");
    return { text: status, source: "discord" };
  } catch {
    return null;
  }
}

/* === Twitch === */
async function getTwitch() {
  try {
    const u = CONFIG.twitch.username.toLowerCase();
    const r = await fetch(`https://decapi.me/twitch/live/${u}`, { cache: "no-store" });
    const t = await r.text();
    if (t.toLowerCase().includes("is live")) {
      setStatusLine("Now Live on Twitch", "twitch");
      return { text: "Now Live on Twitch", source: "twitch" };
    }
  } catch {}
  return null;
}

/* === Reddit === */
async function getReddit() {
  try {
    const u = CONFIG.reddit.username;
    const r = await fetch(`https://www.reddit.com/user/${u}/submitted.json?limit=1`, { cache: "no-store" });
    const j = await r.json();
    const post = j.data.children[0]?.data;
    if (!post) return null;
    setStatusLine("Shared on Reddit", "reddit");
    return { text: `Reddit — ${post.title}`, source: "reddit" };
  } catch {
    return null;
  }
}

/* === GitHub === */
async function getGitHub() {
  try {
    const u = CONFIG.github.username;
    const r = await fetch(`https://api.github.com/users/${u}/events/public`, { cache: "no-store" });
    const j = await r.json();
    const evt = j.find((e) => ["PushEvent", "CreateEvent", "PullRequestEvent"].includes(e.type));
    if (!evt) return null;
    setStatusLine("Committed on GitHub", "github");
    return { text: "Committed on GitHub", source: "github" };
  } catch {
    return null;
  }
}

/* === TikTok === */
async function getTikTok() {
  try {
    const u = CONFIG.tiktok.username;
    const res = await fetch(`https://r.jina.ai/http://www.tiktok.com/@${u}`, { cache: "no-store" });
    const text = await res.text();
    if (text.includes("/video/")) {
      setStatusLine("Posted on TikTok", "tiktok");
      return { text: "Posted on TikTok", source: "tiktok" };
    }
  } catch {
    return null;
  }
  return null;
}

/* === Combine + Animate === */
async function updateLiveStatus() {
  const runners = [getManualStatus, getDiscord, getTwitch, getTikTok, getReddit, getGitHub];
  const results = [];
  for (const fn of runners) {
    const res = await fn();
    if (res) results.push(res);
  }
  updateIconCluster(results);
  const container = $$("live-activity");
  container?.classList.toggle("hidden", results.length === 0);
}

/* === Spotify Click === */
function bindSpotifyClick() {
  const card = $$("spotify-card");
  if (!card) return;
  const open = () => currentSpotifyUrl && window.open(currentSpotifyUrl, "_blank");
  card.onclick = open;
}

/* === Init === */
document.addEventListener("DOMContentLoaded", () => {
  bindSpotifyClick();
  updateLiveStatus();
  setInterval(updateLiveStatus, 10000);
  setInterval(updateLastUpdated, 1000);
});
