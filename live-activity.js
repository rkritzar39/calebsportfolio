/* live-activity.js — Fully Reliable Version: Manual + Spotify + Twitch + Discord + Reddit
   UPDATED (FULL FILE):
   ✅ Spotify via Lanyard: real timestamps -> real progress bar
   ✅ Other music platforms via Lanyard activities[]:
      - shows title/artist/cover
      - USES timestamps IF PRESENT -> real progress bar (works across platforms)
      - NO timestamps -> progress becomes INDTERMINATE (animated) OR hides if you switch flag
   ✅ If NOT a music activity -> progress bar + time row are hidden
   ✅ Manual Firestore overrides everything
   ✅ Twitch via decapi uptime
   ✅ Reddit one-time banner per new post via localStorage
   ✅ Settings changes apply instantly (same tab) — no refresh
   ✅ Match song accent OFF => user accentColor (matches theme)
   ✅ Match song accent ON  => snaps to song accent using last cover immediately
   ✅ Async race fix: token prevents old image loads overwriting newer state
*/

import { doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

const CONFIG = {
  discord: { userId: "850815059093356594" },
  twitch:  { username: "calebkritzar" },
  reddit:  { username: "Maleficent_Line6570" },
};

/* ======================================================= */
/* === SETTINGS ========================================== */
/* ======================================================= */

/* Choose how non-Spotify music should behave when timestamps are NOT available:
   - "indeterminate" = animated loading-style bar
   - "hide" = progress bar + times disappear entirely */
const NON_SPOTIFY_PROGRESS_MODE = "indeterminate";

/* ======================================================= */
/* === GLOBAL STATE ====================================== */
/* ======================================================= */

let lastUpdateTime = null;
let lastPollTime   = Date.now();
let progressInterval = null;
let currentSpotifyUrl = null;

let tempBanner = null;
const TEMP_BANNER_MS = 15000;

let lastRedditPostId  = null;
let manualStatus = null;

/* ✅ prevents old image loads overwriting newer state */
let dynamicColorRequestId = 0;

/* ✅ remembers last cover so toggling ON snaps back immediately */
let lastCoverUrl = null;

/* ✅ same-tab settings watcher (storage event doesn't fire same tab) */
let lastSettingsRaw = null;

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
  music:   "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/music.svg",
  manual:  "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
  default: "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
};

/* ======================================================= */
/* === SETTINGS HELPERS ================================== */
/* ======================================================= */

function getWebsiteSettings() {
  try {
    return JSON.parse(localStorage.getItem("websiteSettings") || "{}");
  } catch {
    return {};
  }
}

function isMatchSongAccentEnabled() {
  const settings = getWebsiteSettings();
  return settings.matchSongAccent === "enabled";
}

function applySongThemeClass() {
  const activity = document.querySelector(".live-activity");
  if (!activity) return;

  const settings = getWebsiteSettings();
  const matchAccent = settings.matchSongAccent === "enabled";
  const userAccent  = settings.accentColor || "#1DB954";

  activity.classList.toggle("song-theme-off", !matchAccent);

  // OFF => match user's accent color
  if (!matchAccent) {
    activity.style.setProperty("--dynamic-bg", "none");
    activity.style.setProperty("--dynamic-accent", userAccent);
  }
}

function watchWebsiteSettings() {
  const raw = localStorage.getItem("websiteSettings") || "{}";
  if (raw === lastSettingsRaw) return;
  lastSettingsRaw = raw;

  applySongThemeClass();

  if (isMatchSongAccentEnabled()) {
    if (lastCoverUrl) updateDynamicColors(lastCoverUrl);
    else updateDynamicColors(null);
  } else {
    updateDynamicColors(null);
  }
}

window.addEventListener("storage", (e) => {
  if (e.key === "websiteSettings") {
    lastSettingsRaw = null;
    watchWebsiteSettings();
  }
});

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
    if (["spotify", "twitch", "music"].includes(source)) icon.classList.add("glow");

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
/* === PROGRESS BAR ====================================== */
/* ======================================================= */

function setProgressVisibility(mode) {
  const barWrap = document.querySelector(".music-progress-container");
  const timeRow = document.querySelector(".music-progress-time");
  if (!barWrap || !timeRow) return;

  barWrap.classList.remove("indeterminate");
  barWrap.style.display = "";
  timeRow.style.display = "";

  if (mode === "hide") {
    barWrap.style.display = "none";
    timeRow.style.display = "none";
    return;
  }

  if (mode === "indeterminate") {
    barWrap.classList.add("indeterminate");
    timeRow.style.display = "none";
  }
}

function resetProgress() {
  const bar = $$("music-progress-bar");
  if (bar) bar.style.width = "0%";
  clearInterval(progressInterval);
  progressInterval = null;

  const elapsedEl = $$("elapsed-time");
  const remainEl  = $$("remaining-time");
  const totalEl   = $$("total-time");
  if (elapsedEl) elapsedEl.textContent = "0:00";
  if (remainEl)  remainEl.textContent  = "-0:00";
  if (totalEl)   totalEl.textContent   = "0:00";
}

function setupProgress(startMs, endMs) {
  const bar       = $$("music-progress-bar");
  const elapsedEl = $$("elapsed-time");
  const remainEl  = $$("remaining-time");
  const totalEl   = $$("total-time");

  if (!bar || !startMs || !endMs || endMs <= startMs) return;

  const barWrap = document.querySelector(".music-progress-container");
  const timeRow = document.querySelector(".music-progress-time");
  if (barWrap) {
    barWrap.classList.remove("indeterminate");
    barWrap.style.display = "";
  }
  if (timeRow) timeRow.style.display = "";

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

function toEpochMs(v) {
  if (!v || typeof v !== "number") return null;
  return v < 1e12 ? v * 1000 : v; // seconds -> ms if needed
}

function setupProgressFromActivityTimestamps(act) {
  const startMs = toEpochMs(act?.timestamps?.start);
  const endMs   = toEpochMs(act?.timestamps?.end);
  if (!startMs || !endMs || endMs <= startMs) return false;
  setupProgress(startMs, endMs);
  return true;
}

/* ======================================================= */
/* === DYNAMIC COLORS =================================== */
/* ======================================================= */

function updateDynamicColors(imageUrl) {
  const activity = document.querySelector(".live-activity");
  if (!activity) return;

  const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
  const matchAccent = settings.matchSongAccent === "enabled";
  const userAccent  = settings.accentColor || "#1DB954";

  if (imageUrl) lastCoverUrl = imageUrl;

  const requestId = ++dynamicColorRequestId;

  if (!matchAccent) {
    activity.style.setProperty("--dynamic-bg", "none");
    activity.style.setProperty("--dynamic-accent", userAccent);
    return;
  }

  if (!imageUrl) {
    activity.style.setProperty("--dynamic-bg", "none");
    activity.style.setProperty("--dynamic-accent", userAccent);
    return;
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  img.src = imageUrl;

  img.onload = () => {
    if (requestId !== dynamicColorRequestId) return;

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas ctx");

      canvas.width = img.naturalWidth || img.width || 64;
      canvas.height = img.naturalHeight || img.height || 64;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

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

      activity.style.setProperty("--dynamic-accent", `rgb(${r},${g},${b})`);
      activity.style.setProperty(
        "--dynamic-bg",
        `linear-gradient(180deg, rgba(${r},${g},${b},0.35), rgba(${r},${g},${b},0.12))`
      );
    } catch {
      activity.style.setProperty("--dynamic-accent", userAccent);
      activity.style.setProperty("--dynamic-bg", "none");
    }
  };

  img.onerror = () => {
    if (requestId !== dynamicColorRequestId) return;
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
/* === DISCORD / SPOTIFY + OTHER MUSIC =================== */
/* ======================================================= */

function resolveDiscordAssetUrl(activity) {
  const a = activity?.assets;
  if (!a) return "";

  const large = a.large_image || "";
  const appId = activity?.application_id;
  if (!large) return "";

  if (large.startsWith("mp:")) {
    return `https://media.discordapp.net/${large.replace(/^mp:/, "")}`;
  }

  if (appId) {
    return `https://cdn.discordapp.com/app-assets/${appId}/${large}.png`;
  }

  return "";
}

/* Broad music platform detection (works even if act.type is weird) */
const MUSIC_KEYWORDS = [
  "youtube music", "yt music", "youtubemusic",
  "spotify",
  "amazon music", "prime music", "amazonmusic",
  "apple music", "itunes",
  "soundcloud",
  "tidal",
  "deezer",
  "pandora",
  "bandcamp",
  "audiomack",
  "audius",
  "napster",
  "qobuz",
  "mixcloud",
  "iheartradio",
  "music"
];

function isMusicActivity(act) {
  if (!act) return false;

  // Discord "Listening" is very likely music (type 2)
  if (act.type === 2) return true;

  const name = (act.name || "").toLowerCase();
  const details = (act.details || "").toLowerCase();
  const state = (act.state || "").toLowerCase();
  const largeText = (act?.assets?.large_text || "").toLowerCase();

  const hay = `${name} ${details} ${state} ${largeText}`.trim();

  // keywords
  if (MUSIC_KEYWORDS.some(k => hay.includes(k))) return true;

  // If details looks like "Song - Artist" or "Song by Artist", it’s probably music
  if (details.includes(" by ") || details.includes(" - ")) return true;

  return false;
}

function pickBestMusicActivity(activities = []) {
  // Prefer actual Listening activities first
  const listening = activities.find(a => a && isMusicActivity(a) && a.type === 2);
  if (listening) return listening;

  // Otherwise any activity that looks like music
  return activities.find(a => a && isMusicActivity(a));
}

async function getDiscord() {
  if (isManualActive()) {
    slideOutCard($$("spotify-card"));
    resetProgress();
    setProgressVisibility("hide");
    updateDynamicColors(null);
    return { text: manualStatus?.text || "Status (manual)", source: "manual" };
  }

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}?_ts=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Lanyard ${res.status}`);
    const json = await res.json();
    const data = json.data;
    if (!data) return null;

    /* 1) Spotify */
    if (data.spotify) {
      const sp = data.spotify;
      const now = Date.now();
      const startMs = sp.timestamps?.start ?? now;
      const endMs   = sp.timestamps?.end   ?? (startMs + (sp.duration_ms || 0));

      slideInCard($$("spotify-card"));

      $$("live-song-title").textContent  = sp.song   || "Unknown";
      $$("live-song-artist").textContent = sp.artist || "Unknown";

      const coverEl = $$("live-activity-cover");
      if (coverEl && coverEl.src !== sp.album_art_url) coverEl.src = sp.album_art_url;

      currentSpotifyUrl = sp.track_id ? `https://open.spotify.com/track/${sp.track_id}` : null;

      setupProgress(startMs, endMs);
      updateDynamicColors(sp.album_art_url);

      const explicitEl = $$("explicit-badge");
      if (explicitEl) explicitEl.style.display = sp?.explicit ? "inline-block" : "none";

      return { text: "Listening to Spotify", source: "spotify" };
    }

    /* 2) Other music platforms */
    const act = pickBestMusicActivity(data.activities || []);
    if (act) {
      slideInCard($$("spotify-card"));

      const title = act.details || act.name || "Now Playing";
      const artist = act.state || act?.assets?.large_text || "";

      $$("live-song-title").textContent  = title;
      $$("live-song-artist").textContent = artist || "—";

      const coverUrl = resolveDiscordAssetUrl(act);
      const coverEl = $$("live-activity-cover");
      if (coverEl && coverUrl) coverEl.src = coverUrl;

      currentSpotifyUrl = null;

      // ✅ Music progress logic:
      // - if timestamps exist: real progress
      // - else: indeterminate/hide (your setting)
      resetProgress();
      const hasRealProgress = setupProgressFromActivityTimestamps(act);
      if (!hasRealProgress) setProgressVisibility(NON_SPOTIFY_PROGRESS_MODE);

      updateDynamicColors(coverUrl || null);

      const explicitEl = $$("explicit-badge");
      if (explicitEl) explicitEl.style.display = "none";

      return { text: `Listening on ${act.name || "Music"}`, source: "music" };
    }

    /* 3) Not music: hide progress + card UI */
    slideOutCard($$("spotify-card"));
    resetProgress();
    setProgressVisibility("hide");
    updateDynamicColors(null);

    const map = {
      online: "Online on Discord",
      idle: "Idle on Discord",
      dnd: "Do Not Disturb",
      offline: "No Current Active Activities",
    };

    return { text: map[data.discord_status] || "No Current Active Activities", source: "discord" };

  } catch (e) {
    console.warn("Lanyard error:", e);
    return null;
  }
}

/* ======================================================= */
/* === T W I T C H  ====================================== */
/* ======================================================= */

async function getTwitch() {
  const u = CONFIG.twitch.username?.toLowerCase();
  if (!u) return null;

  const proxy = "https://corsproxy.io/?";
  const target = `https://decapi.me/twitch/uptime/${u}`;

  try {
    const res = await fetch(`${proxy}${encodeURIComponent(target)}?_=${Date.now()}`);
    const text = (await res.text()).toLowerCase();

    const isOffline = text.includes("offline") || text.includes("not live") || text.includes("not found") || !text.trim();
    return isOffline ? null : { live: true };
  } catch (e) {
    console.warn("Twitch check failed:", e);
    return null;
  }
}

/* ======================================================= */
/* === REDDIT ============================================ */
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
  else if (main?.source === "music") showStatusLineWithFade(main?.text || "Listening to Music", "music");
  else if (twitchLive) showStatusLineWithFade("Now Live on Twitch", "twitch");
  else showStatusLineWithFade(main?.text || "No Current Active Activities", main?.source || "discord");
}

/* ======================================================= */
/* === MAIN LOOP ========================================= */
/* ======================================================= */

async function mainLoop() {
  applySongThemeClass();

  const [discord, twitch, reddit] = await Promise.all([getDiscord(), getTwitch(), getReddit()]);

  const primary =
    (discord?.source === "manual") ? discord
    : (discord?.source === "spotify") ? discord
    : (discord?.source === "music") ? discord
    : (twitch || discord || { text: "No Current Active Activities", source: "discord" });

  const tempHit = reddit?.isTemp ? reddit : null;

  if (tempHit) {
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
  applySongThemeClass();

  const card = $$("spotify-card");
  if (card) card.addEventListener("click", () => {
    if (currentSpotifyUrl) window.open(currentSpotifyUrl, "_blank");
  });

  const saved = localStorage.getItem("lastStatus");
  if (saved) {
    try {
      const { text, source } = JSON.parse(saved);
      if (!isManualActive()) showStatusLineWithFade(text, source);
      else showStatusLineWithFade(manualStatus?.text || "Status (manual)", manualStatus?.icon || "manual");
    } catch (e) { console.warn("Failed to restore last status:", e); }
  }

  // instant settings response (same tab)
  watchWebsiteSettings();
  setInterval(watchWebsiteSettings, 300);

  // start loop
  setTimeout(() => {
    mainLoop();
  }, 50);

  setInterval(mainLoop, 30000);
  setInterval(updateLastUpdated, 1000);
});
