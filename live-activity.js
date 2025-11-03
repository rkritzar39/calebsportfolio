import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/**
 * Live Activity — Complete
 * - Inline brand SVGs (no duplicates)
 * - Auto-detect TikTok, Reddit, GitHub, Discord(+Spotify via Lanyard), Twitch
 * - Firestore manual status fallback
 * - Keeps Spotify progress bar/times intact
 * - Console logs included for debugging
 */

const CONFIG = {
  discord: { userId: "850815059093356594" },
  twitch: { username: "calebkritzar" },
  reddit: { username: "Electronic_Row_1262" },
  github: { username: "rkritzar39" },
  tiktok: { username: "calebkritzar" }
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

/* ========== INLINE BRAND SVGs ========== */
const ICON_SVGS = {
  spotify: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#1DB954" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.371 0 0 5.373 0 12c0 6.627 5.371 12 12 12s12-5.373 12-12C24 5.373 18.629 0 12 0zm5.512 17.34a.744.744 0 0 1-1.023.248c-2.8-1.715-6.327-2.105-10.472-1.161a.744.744 0 1 1-.326-1.452c4.43-1.002 8.282-.56 11.368 1.312.349.214.46.668.243 1.053zm1.415-3.176a.932.932 0 0 1-1.286.31c-3.205-1.99-8.086-2.57-11.875-1.41a.932.932 0 1 1-.54-1.785c4.222-1.277 9.562-.627 13.202 1.662a.933.933 0 0 1 .499 1.223zm.126-3.26C15.39 8.5 8.687 8.33 4.931 9.497a1.116 1.116 0 1 1-.65-2.136c4.219-1.283 11.582-1.09 15.893 1.47a1.115 1.115 0 0 1 1.01 1.982z"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path fill="#25F4EE" d="M12.5 0c.3 2.3 1.8 4.3 3.9 5.2V0h2.4v14.6c0 4.4-3.6 8-8 8-4.4 0-8-3.6-8-8 0-3.8 2.7-7 6.3-7.8v2.5c-2.2.7-3.8 2.7-3.8 5.2 0 3 2.5 5.5 5.5 5.5s5.5-2.5 5.5-5.5V7.8c-.9-.3-1.8-.8-2.6-1.4V0h-1.2z"/></svg>`,
  reddit: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FF4500" xmlns="http://www.w3.org/2000/svg"><path d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zM8.2 9.9a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4zm7.6 0a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4zM12 18c2.2 0 4-1.2 4-2.7H8c0 1.5 1.8 2.7 4 2.7z"/></svg>`,
  discord: `<svg viewBox="0 0 245 240" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path fill="#5865F2" d="M104.4 104.6c-5.7 0-10.2 5-10.2 11.1s4.6 11.1 10.2 11.1 10.3-5 10.2-11.1c.1-6.1-4.5-11.1-10.2-11.1zm36.2 0c-5.7 0-10.2 5-10.2 11.1s4.6 11.1 10.2 11.1 10.2-5 10.2-11.1-4.5-11.1-10.2-11.1z"/><path fill="#5865F2" d="M189.5 20h-134C24.8 20 20 24.8 20 30.5v179C20 215.2 24.8 220 30.5 220h134c5.7 0 10.5-4.8 10.5-10.5v-179C175 24.8 170.2 20 164.5 20z"/></svg>`,
  github: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#181717" xmlns="http://www.w3.org/2000/svg"><path d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.2.8-.6v-2.1c-3.4.8-4.1-1.7-4.1-1.7-.5-1.3-1.2-1.7-1.2-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1 2.1.7 2.1.7 0-.7.4-1.2.8-1.5-2.7-.3-5.5-1.4-5.5-6 0-1.3.5-2.3 1.1-3.1-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.3 1.2a11.4 11.4 0 016 0C17 2.5 18 2.8 18 2.8c.6 1.7.2 3 .1 3.3.7.8 1.1 1.8 1.1 3.1 0 4.6-2.8 5.6-5.5 6 .4.3.8 1 .8 2v3c0 .4.3.7.8.6A12 12 0 0012 .3z"/></svg>`,
  twitch: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#9146FF" xmlns="http://www.w3.org/2000/svg"><path d="M4 2L3 6v13h5v3h3l3-3h4l5-5V2H4zm18 9l-3 3h-5l-3 3v-3H7V4h15v7z"/><path d="M15 6h2v5h-2zM11 6h2v5h-2z"/></svg>`,
  manual: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>`
};

function renderIcon(source) {
  return ICON_SVGS[source] || ICON_SVGS.manual;
}

/* ========== ICON CLUSTER (REAL SVGs) ========== */
function updateIconCluster(list) {
  const cluster = $$("icon-cluster");
  if (!cluster) return;
  cluster.innerHTML = "";

  list.forEach(({ source, text }) => {
    const wrap = document.createElement("span");
    wrap.className = `cluster-icon-svg ${source}`;
    wrap.innerHTML = renderIcon(source);
    wrap.title = `${source} — ${text}`;
    wrap.setAttribute("aria-hidden", "true");
    cluster.appendChild(wrap);
  });
}

/* ========== STATUS LINE (SVG + TEXT INLINE) ========== */
function setStatusLine(text, source = "manual") {
  const txt = $$("status-line-text");
  const ico = $$("status-icon-logo");
  if (!txt || !ico) return;

  txt.textContent = text || "—";
  ico.innerHTML = renderIcon(source); // real inline icon, no duplicates
  ico.style.display = "inline-flex";
  ico.style.alignItems = "center";

  lastUpdateTime = Date.now();
  updateLastUpdated();
}

/* ========== LAST UPDATED TIMER ========== */
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

/* ========== Helpers ========== */
function withTimeout(promise, ms = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return Promise.race([
    promise(ctrl.signal).finally(() => clearTimeout(t)),
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms + 50))
  ]);
}

/* ========== FIRESTORE MANUAL STATUS ========== */
async function getManualStatus() {
  try {
    const snap = await getDoc(doc(db, "live_status", "current"));
    if (snap.exists()) {
      const msg = snap.data().message?.trim();
      if (msg) {
        console.log("[Manual] message:", msg);
        setStatusLine(msg, "manual");
        return { text: msg, source: "manual" };
      }
    }
  } catch (e) {
    console.warn("Firestore error:", e);
  }
  return null;
}

/* ========== DISCORD (Lanyard) + SPOTIFY ========== */
async function getDiscord() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}`, { cache: "no-store" });
    const { data } = await res.json();
    console.log("[Discord] lanyard data:", data);
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
      $$("live-activity")?.classList.add("spotify-active");
      return { text: `Listening on Spotify`, source: "spotify" };
    }

    $$("spotify-card")?.classList.add("hidden");
    $$("live-activity")?.classList.remove("spotify-active");

    const map = {
      online: "Online on Discord",
      idle: "Idle on Discord",
      dnd: "Do Not Disturb",
      offline: "Offline",
    };
    const status = map[data.discord_status] || "Online on Discord";
    setStatusLine(status, "discord");
    return { text: status, source: "discord" };
  } catch (e) {
    console.warn("[Discord] error:", e);
    return null;
  }
}

/* ========== TWITCH (decapi) ========== */
async function getTwitch() {
  try {
    const username = CONFIG.twitch.username.toLowerCase();
    const res = await fetch(`https://decapi.me/twitch/live/${username}`, { cache: "no-store" });
    const text = await res.text();
    console.log("[Twitch] decapi:", text);

    if (text.toLowerCase().includes("is live")) {
      setStatusLine(`Now Live on Twitch`, "twitch");
      return { text: "Now Live on Twitch", source: "twitch" };
    }
    return null;
  } catch (e) {
    console.warn("[Twitch] error:", e);
    return null;
  }
}

/* ========== REDDIT (public JSON) ========== */
async function getReddit() {
  try {
    const u = CONFIG.reddit.username;
    const url = `https://www.reddit.com/user/${encodeURIComponent(u)}/submitted.json?limit=1`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    console.log("[Reddit] latest submission:", json);

    const item = json?.data?.children?.[0]?.data;
    if (!item) return null;

    const title = item.title || "New post";
    setStatusLine("Shared on Reddit", "reddit");
    return { text: `Reddit — ${title}`, source: "reddit" };
  } catch (e) {
    console.warn("[Reddit] error:", e);
    return null;
  }
}

/* ========== GITHUB (public events) ========== */
async function getGitHub() {
  try {
    const u = CONFIG.github.username;
    const url = `https://api.github.com/users/${encodeURIComponent(u)}/events/public`;
    const res = await fetch(url, { cache: "no-store", headers: { "Accept": "application/vnd.github+json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const events = await res.json();
    console.log("[GitHub] events:", events?.slice?.(0, 3));

    const evt = events?.find?.(e => ["PushEvent", "CreateEvent", "PullRequestEvent", "CommitCommentEvent"].includes(e.type));
    if (!evt) return null;

    const typeToText = {
      PushEvent: "Committed on GitHub",
      CreateEvent: "Created on GitHub",
      PullRequestEvent: "Opened a PR on GitHub",
      CommitCommentEvent: "Commented on GitHub"
    };
    const label = typeToText[evt.type] || "Active on GitHub";
    setStatusLine(label, "github");
    return { text: label, source: "github" };
  } catch (e) {
    console.warn("[GitHub] error:", e);
    return null;
  }
}

/* ========== TIKTOK (profile scrape via CORS proxy) ========== */
async function getTikTok() {
  try {
    const u = CONFIG.tiktok.username;
    // r.jina.ai fetches public pages with permissive CORS; we'll scan for a video id.
    const url = `https://r.jina.ai/http://www.tiktok.com/@${encodeURIComponent(u)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    console.log("[TikTok] profile snapshot length:", text.length);

    // Look for latest video id pattern /@username/video/123456789...
    const match = text.match(/\/@[^/]+\/video\/(\d+)/);
    if (!match) return null;

    const videoId = match[1];
    console.log("[TikTok] latest video id:", videoId);
    setStatusLine("Posted on TikTok", "tiktok");
    return { text: "Posted on TikTok", source: "tiktok" };
  } catch (e) {
    console.warn("[TikTok] error:", e);
    return null;
  }
}

/* ========== COMBINE SOURCES ========== */
async function updateLiveStatus() {
  const runners = [getManualStatus, getDiscord, getTwitch, getTikTok, getReddit, getGitHub];

  const results = [];
  for (const fn of runners) {
    try {
      // run each fetch with a timeout to avoid hanging
      const r = await withTimeout((signal) => fn(signal), 7000).catch(err => {
        console.warn(`[${fn.name}] timed out:`, err?.message || err);
        return null;
      });
      if (r) results.push(r);
    } catch (e) {
      console.warn(`[${fn.name}] failed:`, e);
    }
  }

  console.log("[LiveActivity] aggregated results:", results);

  // Build the icon cluster (one icon per detected source)
  updateIconCluster(results);

  // Show/hide entire container
  const container = $$("live-activity");
  container?.classList.toggle("hidden", results.length === 0);
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
  setInterval(updateLiveStatus, 10000); // poll every 10s
  setInterval(updateLastUpdated, 1000); // tick "Updated ..."
});
