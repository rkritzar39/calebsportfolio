/* live-activity.js — Cleaned + No Pause Logic (GitHub Removed) */

import { doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

const CONFIG = {
  discord: { userId: "850815059093356594" },
  twitch:  { username: "calebkritzar" },
  reddit:  { username: "Electronic_Row_1262" },
  tiktok:  { username: "calebkritzar" },
};

/* ======================================================= */
/* === GLOBAL STATE ====================================== */
/* ======================================================= */

let lastUpdateTime = null;
let progressInterval = null;
let currentSpotifyUrl = null;
let tempBanner = null;
const TEMP_BANNER_MS = 15000;

let lastRedditPostId  = null;
let lastTikTokVideoId = null;

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
  tiktok:  "https://cdn.simpleicons.org/tiktok/000000",
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
  }, 180);

  lastUpdateTime = Date.now();
}

function updateLastUpdated() {
  const el = $$("live-activity-updated");
  if (!el) return;
  if (!lastUpdateTime) { el.textContent = "—"; return; }
  const s = Math.floor((Date.now() - lastUpdateTime) / 1000);
  el.textContent =
    s < 5    ? "Updated just now" :
    s < 60   ? `Updated ${s}s ago` :
    s < 3600 ? `Updated ${Math.floor(s / 60)}m ago` :
               `${Math.floor(s / 3600)}h ago`;
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
/* === MANUAL STATUS ===================================== */
/* ======================================================= */

function isManualActive() {
  if (!manualStatus?.enabled) return false;

  const exp = manualStatus.expiresAt;

  if (!exp || typeof exp !== "number" || Number.isNaN(exp)) return true;

  return Date.now() < exp;
}

/* ======================================================= */
/* === DISCORD / SPOTIFY  ================================ */
/* ======================================================= */

async function getDiscord() {
  if (isManualActive()) {
    const card = $$("spotify-card");
    if (card) card.style.display = "none";
    clearInterval(progressInterval);
    return { text: manualStatus?.text || "Status (manual)", source: "manual" };
  }

  try {
    const res = await fetch(
      `https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}?_ts=${Date.now()}`,
      { cache: "no-store" }
    );

    const json = await res.json();
    const data = json.data;
    if (!data) return null;

    if (data.spotify) {
      const sp = data.spotify;

      $$("live-song-title").textContent  = sp.song   || "Unknown";
      $$("live-song-artist").textContent = sp.artist || "Unknown";
      $$("live-activity-cover").src      = sp.album_art_url;

      currentSpotifyUrl = sp.track_id
        ? `https://open.spotify.com/track/${sp.track_id}`
        : null;

      setupProgress(sp.timestamps.start, sp.timestamps.end);

      return { text: "Listening to Spotify", source: "spotify" };
    }

    return { text: "Online on Discord", source: "discord" };

  } catch {
    return null;
  }
}

/* ======================================================= */
/* === OTHER SOURCES ===================================== */
/* ======================================================= */

async function getTwitch(){
  const u=(CONFIG.twitch.username||"").toLowerCase();
  if(!u) return null;
  try{
    const r=await fetch(`https://decapi.me/twitch/live/${u}`,{cache:"no-store"});
    const t=(await r.text()).toLowerCase();
    if(t.includes("is live")) return { text:"Now Live on Twitch", source:"twitch" };
  } catch{}
  return null;
}

async function getReddit(){
  const u=CONFIG.reddit.username;
  if(!u) return null;
  try{
    const r=await fetch(`https://www.reddit.com/user/${u}/submitted.json?limit=1`,{cache:"no-store"});
    const j=await r.json();
    const post=j?.data?.children?.[0]?.data;
    if(post && post.id!==lastRedditPostId){
      lastRedditPostId=post.id;
      return { text:"Shared on Reddit", source:"reddit", isTemp:true };
    }
  } catch{}
  return null;
}

async function getTikTok(){
  const u=CONFIG.tiktok.username;
  if(!u) return null;
  try{
    const res=await fetch(`https://r.jina.ai/http://www.tiktok.com/@${u}`,{cache:"no-store"});
    const html=await res.text();
    const m=html.match(/\/video\/(\d+)/);
    const videoId=m?.[1];
    if(videoId && videoId!==lastTikTokVideoId){
      lastTikTokVideoId=videoId;
      return { text:"Posted on TikTok", source:"tiktok", isTemp:true };
    }
  } catch{}
  return null;
}

/* ======================================================= */
/* === MANUAL FIRESTORE AUTO-EXPIRY ====================== */
/* ======================================================= */

try {
  const manualRef = doc(db, "manualStatus", "site");

  onSnapshot(manualRef, async (snap) => {
    if (!snap.exists()) {
      manualStatus = null;
      return;
    }

    const d = snap.data();

    if (d.expiresAt?.toMillis) {
      d.expiresAt = d.expiresAt.toMillis();
    } else if (typeof d.expiresAt !== "number") {
      d.expiresAt = null;
    }

    manualStatus = d;

    if (d.enabled && d.expiresAt && Date.now() >= d.expiresAt) {
      await setDoc(manualRef, {
        enabled: false,
        text: "",
        expiresAt: null,
        persistent: false,
        updated_at: Date.now()
      }, { merge: true });

      manualStatus = null;
    }
  });

} catch {}

/* ======================================================= */
/* === STATUS PRIORITY LOGIC ============================= */
/* ======================================================= */

function applyStatusDecision({ main, twitchLive, temp }) {
  if(isManualActive()){
    showStatusLineWithFade(manualStatus.text||"Status (manual)", manualStatus.icon||"manual");
    return;
  }
  if(temp && Date.now() < temp.expiresAt){
    showStatusLineWithFade(temp.text, temp.source||"default");
    return;
  }
  if(main?.source === "spotify") {
    showStatusLineWithFade("Listening to Spotify", "spotify");
  }
  else if(twitchLive) {
    showStatusLineWithFade("Now Live on Twitch", "twitch");
  }
  else {
    showStatusLineWithFade(main?.text || "No Current Active Activities", main?.source || "discord");
  }
}

/* ======================================================= */
/* === MAIN LOOP ========================================= */
/* ======================================================= */

async function mainLoop() {

  const [discord, twitch, reddit, tiktok] = await Promise.all([
    getDiscord(), getTwitch(), getReddit(), getTikTok()
  ]);

  const primary = twitch || discord || { text:"No Current Active Activities", source:"discord" };

  let tempHit = [reddit, tiktok].find(r=>r && r.isTemp);
  if(tempHit){
    tempBanner={ 
      text: tempHit.text, 
      source: tempHit.source, 
      expiresAt: Date.now()+TEMP_BANNER_MS 
    };
  }
  else if(tempBanner && Date.now()>=tempBanner.expiresAt){
    tempBanner=null;
  }

  applyStatusDecision({
    main: primary,
    twitchLive: !!twitch,
    temp: tempBanner
  });
}

/* ======================================================= */
/* === INIT ============================================== */
/* ======================================================= */

document.addEventListener("DOMContentLoaded",()=>{
  const card=$$("spotify-card");
  if(card){
    card.addEventListener("click",()=>{
      if(currentSpotifyUrl) window.open(currentSpotifyUrl,"_blank");
    });
  }

  mainLoop();
  setInterval(mainLoop, 5000);
  setInterval(updateLastUpdated, 1000);
});
