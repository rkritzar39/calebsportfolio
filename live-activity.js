/* live-activity.js — Fully Reliable Version: Manual + Spotify + Twitch + Discord + Reddit
   - Twitch: uses decapi.net status endpoint with decapi.me fallback and robust parsing
   - Reddit: persists last shown post via localStorage so banner shows only once per new post
   - All original features preserved (manual via Firestore, Spotify via Lanyard, progress bar, dynamic colors)
*/

import { doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

const CONFIG = {
  discord: { userId: "850815059093356594" },
  twitch:  { username: "calebkritzar" },
  reddit:  { username: "Maleficent_Line6570" },
};

/* ======================================================= */
/* === GLOBAL STATE ====================================== */
/* ======================================================= */

let lastUpdateTime = null;
let lastPollTime   = Date.now(); // last background refresh
let progressInterval = null;
let currentSpotifyUrl = null;
let tempBanner = null;
const TEMP_BANNER_MS = 15000;

let lastRedditPostId  = null; // runtime variable (kept for compatibility)
let manualStatus = null;

const $$  = (id) => document.getElementById(id);
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

function showStatusLineWithFade(text, source = "manual") {
  const txt = $$("status-line-text");
  const line = $$("status-line");
  const icon = $$("status-icon");
  if (!txt || !line || !icon) return;

  // avoid unnecessary reflow if exact same content
  if (txt.textContent === text && icon.alt === `${source} icon`) return;

  const iconUrl = ICON_MAP[source] || ICON_MAP.default;

  line.style.transition = "opacity .22s ease";
  line.style.opacity = "0";

  setTimeout(() => {
    icon.src = iconUrl;
    icon.alt = `${source} icon`;
    txt.textContent = text;

    icon.classList.remove("glow");
    if (["spotify", "twitch"].includes(source)) icon.classList.add("glow");

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

  let referenceTime = lastPollTime || lastUpdateTime;

  if (!referenceTime) {
    const saved = localStorage.getItem("lastStatus");
    if (saved) {
      try {
        const { timestamp } = JSON.parse(saved);
        if (timestamp) referenceTime = timestamp;
      } catch {}
    }
  }

  if (!referenceTime) referenceTime = Date.now();

  const s = Math.floor((Date.now() - referenceTime) / 1000);

  if (s < 5) el.textContent = "Updated just now";
  else if (s < 60) el.textContent = `Updated ${s}s ago`;
  else if (s < 3600) el.textContent = `Updated ${Math.floor(s / 60)}m ago`;
  else el.textContent = `Updated ${Math.floor(s / 3600)}h ago`;
}

/* ======================================================= */
/* === PROGRESS BAR  ===================================== */
/* ======================================================= */

function setupProgress(startMs, endMs) {
  const bar       = $$("music-progress-bar");
  const elapsedEl = $$("elapsed-time");
  const remainEl  = $$("remaining-time");
  const totalEl   = $$("total-time");

  if (!bar || !startMs || !endMs) return;

  const totalSec = Math.max((endMs - startMs) / 1000, 1);
  if (totalEl) totalEl.textContent = fmt(totalSec);

  clearInterval(progressInterval);

  function tick() {
    const now = Date.now();
    const elapsedSec = Math.min((now - startMs) / 1000, totalSec);
    const left = Math.max(totalSec - elapsedSec, 0);

    bar.style.width = `${(elapsedSec / totalSec) * 100}%`;
    if (elapsedEl) elapsedEl.textContent = fmt(elapsedSec);
    if (remainEl) remainEl.textContent = `-${fmt(left)}`;
  }

  tick();
  progressInterval = setInterval(tick, 1000);
}

/* ======================================================= */
/* === DYNAMIC COLORS  =================================== */
/* ======================================================= */

function updateDynamicColors(imageUrl) {
  const activity = document.querySelector(".live-activity");
  if (!activity) return;

  const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
  const matchAccent = settings.matchSongAccent === "enabled";
  const userAccent  = settings.accentColor || "#1DB954";

  if (!matchAccent || !imageUrl) {
    activity.style.setProperty("--dynamic-bg", "none");
    activity.style.setProperty("--dynamic-accent", userAccent);
    return;
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageUrl;

  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width || 64;
      canvas.height = img.height || 64;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let r=0, g=0, b=0, count=0;

      for (let i = 0; i < data.length; i += 4) {
        r += data[i]; g += data[i+1]; b += data[i+2]; count++;
      }

      r = Math.floor(r/count); g = Math.floor(g/count); b = Math.floor(b/count);

      activity.style.setProperty("--dynamic-accent", `rgb(${r},${g},${b})`);
      activity.style.setProperty("--dynamic-bg",
        `linear-gradient(180deg, rgba(${r},${g},${b},0.35), rgba(${r},${g},${b},0.12))`
      );
    } catch {
      activity.style.setProperty("--dynamic-accent", userAccent);
      activity.style.setProperty("--dynamic-bg", "none");
    }
  };

  img.onerror = () => {
    activity.style.setProperty("--dynamic-accent", userAccent);
    activity.style.setProperty("--dynamic-bg", "none");
  };
}

/* ======================================================= */
/* === ANIMATION HELPERS ================================= */
/* ======================================================= */

function slideInCard(cardEl){ 
  if(!cardEl) return;
  cardEl.classList.remove("slide-out", "hidden"); 
  cardEl.classList.add("slide-in"); 
  cardEl.style.display = ""; 
  cardEl.style.opacity = "1"; 
}

function slideOutCard(cardEl){ 
  if(!cardEl) return;
  cardEl.classList.remove("slide-in"); 
  cardEl.classList.add("slide-out"); 
  setTimeout(()=>{ 
    if(cardEl.classList.contains("slide-out")){
      cardEl.style.opacity = "0"; 
      cardEl.style.display = "none";
      cardEl.classList.add("hidden");
    } 
  },360); 
}

function isManualActive() {
  if (!manualStatus?.enabled) return false;
  const exp = manualStatus.expiresAt;
  if (!exp || typeof exp !== "number" || Number.isNaN(exp)) return true;
  return Date.now() < exp;
}

/* ======================================================= */
/* === DISCORD / SPOTIFY  ================================ */
/* ======================================================= */

let lastSpotifyTrackId = null;

async function getDiscord() {
  if (isManualActive()) {
    slideOutCard($$("spotify-card"));
    clearInterval(progressInterval);
    updateDynamicColors(null);
    return { text: manualStatus?.text || "Status (manual)", source: "manual" };
  }

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}?_ts=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Lanyard ${res.status}`);
    const json = await res.json();
    const data = json.data;
    if (!data) return null;

    if (data.spotify) {
      const sp = data.spotify;
      const now = Date.now();
      const startMs = sp.timestamps?.start ?? now;
      const endMs   = sp.timestamps?.end   ?? (startMs + (sp.duration_ms || 0));

      lastSpotifyTrackId = sp.track_id;

      slideInCard($$("spotify-card"));

      $$("live-song-title").textContent  = sp.song   || "Unknown";
      $$("live-song-artist").textContent = sp.artist || "Unknown";

      const coverEl = $$("live-activity-cover");
      if (coverEl && coverEl.src !== sp.album_art_url) coverEl.src = sp.album_art_url;

      currentSpotifyUrl = sp.track_id ? `https://open.spotify.com/track/${sp.track_id}` : null;

      setupProgress(startMs, endMs);
      updateDynamicColors(sp.album_art_url);

      return { text: "Listening to Spotify", source: "spotify" };
    }

    const map = {
      online: "Online on Discord",
      idle: "Idle on Discord",
      dnd: "Do Not Disturb",
      offline: "No Current Active Activities",
    };

    slideOutCard($$("spotify-card"));
    updateDynamicColors(null);
    return { text: map[data.discord_status] || "No Current Active Activities", source: "discord" };

  } catch (e) {
    console.warn("Lanyard error:", e);
    return null;
  }
}

/* ======================================================= */
/* === T W I T C H  (robust) ============================= */
/* ======================================================= */
/*
  Strategy:
   1) Primary: decapi.net status endpoint (https://api.decapi.net/twitch/status/<username>)
   2) Fallback: decapi.me/twitch/live/<username> (older but sometimes useful)
   3) Robust parsing: look for "live" and avoid false-positives like "offline", "not found", "does not exist"
*/

async function parseTwitchStatusText(text) {
  if (!text || typeof text !== "string") return false;
  const t = text.trim().toLowerCase();

  // quick rejects
  if (!t) return false;
  if (t.includes("not found") || t.includes("no user") || t.includes("does not exist") || t.includes("invalid")) return false;
  if (t.includes("offline") && !t.includes("live")) return false;

  // common positive patterns:
  // - "<user> is live playing xyz"
  // - "live: playing xyz"
  // - contains "live" but not "offline"
  if (t.includes("live") && !t.includes("offline")) return true;

  return false;
}

async function getTwitch(){
  const username = CONFIG.twitch.username?.toLowerCase();
  if (!username) return null;

  // helper to try an endpoint and interpret its text
  async function tryEndpoint(url) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r) return null;
      const txt = await r.text();
      if (await parseTwitchStatusText(txt)) return true;
    } catch (e) {
      // swallow, we'll fallback
      console.warn("Twitch endpoint error:", e, url);
    }
    return false;
  }

  // Primary: decapi.net status (recommended)
  const primaryUrl = `https://api.decapi.net/twitch/status/${username}`;
  const fallbackUrl = `https://decapi.me/twitch/live/${username}`;
  const legacyDecapi = `https://decapi.net/twitch/status/${username}`; // sometimes works in certain regions

  try {
    const isLivePrimary = await tryEndpoint(primaryUrl);
    if (isLivePrimary) return { text: "Now Live on Twitch", source: "twitch" };

    // fallback to decapi.me (older endpoint)
    const isLiveFallback = await tryEndpoint(fallbackUrl);
    if (isLiveFallback) return { text: "Now Live on Twitch", source: "twitch" };

    // extra fallback: legacy decapi domain
    const isLiveLegacy = await tryEndpoint(legacyDecapi);
    if (isLiveLegacy) return { text: "Now Live on Twitch", source: "twitch" };

  } catch (e) {
    console.warn("getTwitch error:", e);
  }

  return null;
}

/* ======================================================= */
/* === OTHER SOURCES (Reddit) ============================ */
/* ======================================================= */

async function getReddit(){
  const u = CONFIG.reddit.username;
  if (!u) return null;

  try {
    const r = await fetch(`https://www.reddit.com/user/${u}/submitted.json?limit=1`, { cache: "no-store" });
    if (!r.ok) throw new Error(`Reddit fetch ${r.status}`);
    const j = await r.json();
    const post = j?.data?.children?.[0]?.data;
    if (!post) return null;

    // Persist the last shown post ID in localStorage so we don't show repeatedly
    const lastShownId = localStorage.getItem("lastRedditShownId");

    if (post.id !== lastShownId) {
      lastRedditPostId = post.id;
      localStorage.setItem("lastRedditShownId", post.id);
      return { text: "Shared on Reddit", source: "reddit", isTemp: true };
    }
  } catch (e) {
    console.warn("Reddit error:", e);
  }

  return null;
}

/* ======================================================= */
/* === MANUAL FIRESTORE ================================== */
/* ======================================================= */

try {
  const manualRef = doc(db, "manualStatus", "site");

  onSnapshot(manualRef, async (snap) => {
    if (!snap.exists()) { manualStatus = null; return; }
    const d = snap.data();

    if (d.expiresAt?.toMillis) d.expiresAt = d.expiresAt.toMillis();
    else if (typeof d.expiresAt !== "number") d.expiresAt = null;

    manualStatus = d;

    // auto-disable expired manual statuses server-side-ish
    if (d.enabled && d.expiresAt && Date.now() >= d.expiresAt) {
      try {
        await setDoc(manualRef, {
          enabled: false,
          text: "",
          expiresAt: null,
          persistent: false,
          updated_at: Date.now()
        }, { merge: true });
      } catch (err) {
        console.warn("Failed to clear expired manual status:", err);
      }
      manualStatus = null;
    }

  }, err => console.warn("manual listener error:", err));

} catch (e) {
  console.warn("Firestore manual disabled:", e);
}

/* ======================================================= */
/* === STATUS PRIORITY LOGIC ============================= */
/* ======================================================= */

function applyStatusDecision({ main, twitchLive, temp }) {
  if (isManualActive()) {
    showStatusLineWithFade(manualStatus.text || "Status (manual)", manualStatus.icon || "manual");
    return;
  }
  if (temp && Date.now() < temp.expiresAt) {
    showStatusLineWithFade(temp.text, temp.source || "default");
    return;
  }
  if (main?.source === "spotify") showStatusLineWithFade("Listening to Spotify", "spotify");
  else if (twitchLive) showStatusLineWithFade("Now Live on Twitch", "twitch");
  else showStatusLineWithFade(main?.text || "No Current Active Activities", main?.source || "discord");
}

/* ======================================================= */
/* === MAIN LOOP ========================================= */
/* ======================================================= */

async function mainLoop() {
  // gather all sources in parallel
  const [discord, twitch, reddit] = await Promise.all([getDiscord(), getTwitch(), getReddit()]);

  const primary =
    (discord?.source === "manual") ? discord
    : (discord?.source === "spotify") ? discord
    : (twitch || discord || { text: "No Current Active Activities", source: "discord" });

  const tempHit = reddit?.isTemp ? reddit : null;

  // manage temp banner lifecycle
  if (tempHit) {
    // set or replace tempBanner with fresh expiry
    tempBanner = { text: tempHit.text, source: tempHit.source, expiresAt: Date.now() + TEMP_BANNER_MS };
  } else if (tempBanner && Date.now() >= tempBanner.expiresAt) {
    tempBanner = null;
  }

  applyStatusDecision({ main: primary, twitchLive: !!twitch, temp: tempBanner });
  $$("live-activity")?.classList.remove("hidden");

  lastPollTime = Date.now();
}

/* ======================================================= */
/* === INIT ============================================== */
/* ======================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const card = $$("spotify-card");
  if (card) card.addEventListener("click", () => { if (currentSpotifyUrl) window.open(currentSpotifyUrl, "_blank"); });

  // restore last status visual if available
  const saved = localStorage.getItem("lastStatus");
  if (saved) {
    try {
      const { text, source } = JSON.parse(saved);
      if (!isManualActive()) showStatusLineWithFade(text, source);
      else showStatusLineWithFade(manualStatus?.text || "Status (manual)", manualStatus?.icon || "manual");
    } catch (e) { console.warn("Failed to restore last status:", e); }
  }

  // kick off loop and polling timers
  mainLoop();
  setInterval(mainLoop, 10000);
  setInterval(updateLastUpdated, 1000); // update "Last Updated" every second
});
