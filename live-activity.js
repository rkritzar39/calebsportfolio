/* live-activity.js — Fully Reliable Version: Manual + Spotify + Twitch + Discord + Reddit
   ✅ Spotify via Lanyard: real timestamps -> real progress bar
   ✅ PreMiD (ALL activities) via Lanyard activities[]:
      - shows app + details/state + artwork when available
      - if it’s a MUSIC-ish activity:
          - uses timestamps if present -> real progress bar
          - else indeterminate/hide based on NON_SPOTIFY_PROGRESS_MODE
      - if it’s NOT music -> progress bar + time row are hidden
   ✅ Manual Firestore overrides everything
   ✅ Twitch via decapi uptime
   ✅ Reddit one-time banner per new post via localStorage
   ✅ Settings changes apply instantly (same tab) — no refresh
   ✅ Match song accent OFF => user accentColor (matches theme)
   ✅ Match song accent ON  => snaps to last cover immediately when available
   ✅ Async race fix: token prevents old image loads overwriting newer state
   ✅ Time format is ALWAYS hh:mm:ss (0:03:42, 1:12:09, etc.)

   ✅ UPDATE IN THIS VERSION:
   - Platform logos for YouTube / YouTube Music
   - Smart wording:
       * YouTube Music -> "Listening to YouTube Music"
       * YouTube (music-like) -> "Listening to YouTube"
       * YouTube (video) -> "Watching YouTube"
       * Otherwise -> "Active on {App}"
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

/* Non-Spotify music when timestamps are NOT available:
   - "indeterminate" = animated bar
   - "hide" = hide bar + times */
const NON_SPOTIFY_PROGRESS_MODE = "indeterminate";

/* ✅ Turn this ON to show ALL PreMiD/Discord activities, not just music */
const SHOW_ALL_PREMID_ACTIVITIES = true;

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

/* prevents old image loads overwriting newer state */
let dynamicColorRequestId = 0;

/* remembers last cover so toggling ON snaps back immediately */
let lastCoverUrl = null;

/* same-tab settings watcher (storage event doesn't fire same tab) */
let lastSettingsRaw = null;

const $$  = (id) => document.getElementById(id);

/* ======================================================= */
/* ✅ TIME FORMAT — ALWAYS HH:MM:SS ======================= */
/* ======================================================= */

function fmt(seconds) {
  seconds = Math.max(0, Math.floor(seconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ======================================================= */
/* === ICONS ============================================= */
/* ======================================================= */

const ICON_MAP = {
  spotify:      "https://cdn.simpleicons.org/spotify/1DB954",
  youtube:      "https://cdn.simpleicons.org/youtube/FF0000",
  youtubemusic: "https://cdn.simpleicons.org/youtubemusic/FF0000",
  discord:      "https://cdn.simpleicons.org/discord/5865F2",
  twitch:       "https://cdn.simpleicons.org/twitch/9146FF",
  reddit:       "https://cdn.simpleicons.org/reddit/FF4500",
  activity:     "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/activity.svg",
  music:        "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/music.svg",
  manual:       "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
  default:      "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
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

  // If accent matching is ON, snap to last cover immediately if we have it
  if (isMatchSongAccentEnabled()) {
    if (lastCoverUrl) updateDynamicColors(lastCoverUrl);
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
    if (["spotify", "twitch", "music", "youtube", "youtubemusic"].includes(source)) {
      icon.classList.add("glow");
    }

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

  if (elapsedEl) elapsedEl.textContent = "0:00:00";
  if (remainEl)  remainEl.textContent  = "-0:00:00";
  if (totalEl)   totalEl.textContent   = "0:00:00";
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
  return v < 1e12 ? v * 1000 : v;
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

  const settings = getWebsiteSettings();
  const matchAccent = settings.matchSongAccent === "enabled";
  const userAccent  = settings.accentColor || "#1DB954";

  if (imageUrl) lastCoverUrl = imageUrl;

  const requestId = ++dynamicColorRequestId;

  // Accent matching OFF -> always user accent
  if (!matchAccent) {
    activity.style.setProperty("--dynamic-bg", "none");
    activity.style.setProperty("--dynamic-accent", userAccent);
    return;
  }

  // Accent matching ON but no image -> fall back to user accent
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
      activity.style.setProperty("--dynamic-bg",
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
/* === ACTIVITY LABELING (verbs + YouTube music detection) */
/* ======================================================= */

function getActivityVerb(appName = "", act = null) {
  const n = (appName || "").toLowerCase();

  // YouTube Music explicitly
  if (n.includes("youtube music")) return "Listening to";

  // Spotify-like
  if (n.includes("spotify") || n.includes("apple music") || n.includes("soundcloud") || n.includes("tidal") || n.includes("deezer")) {
    return "Listening to";
  }

  // YouTube special case: listening vs watching
  if (n.includes("youtube")) {
    if (act && isYouTubeMusicLike(act)) return "Listening to";
    return "Watching";
  }

  // streaming video
  if (n.includes("twitch") || n.includes("netflix") || n.includes("hulu")) return "Watching";

  // browsing
  if (n.includes("reddit")) return "Browsing";
  if (n.includes("twitter") || n === "x") return "Scrolling";

  // default
  return "Active on";
}

function isYouTubeMusicLike(act) {
  if (!act) return false;

  const name = (act.name || "").toLowerCase();
  if (!name.includes("youtube")) return false;

  // Needs timestamps to be “media-like”
  const hasTs = !!(act?.timestamps?.start && act?.timestamps?.end);
  if (!hasTs) return false;

  const title = (act.details || "").toLowerCase();
  const state = (act.state || "").toLowerCase();

  // obvious music keywords
  const musicPatterns = [
    "mix", "playlist", "album", "full album", "lyrics", "lyric", "audio",
    "official music video", "official video", "remastered", "topic"
  ];
  if (musicPatterns.some(p => title.includes(p))) return true;

  // common song formatting
  if (title.includes(" - ") || title.includes(" • ") || title.includes(" | ") || title.includes(" by ")) return true;

  // if state is short-ish, usually a channel/artist line
  if (state && state.length <= 50) return true;

  return false;
}

/* ======================================================= */
/* === DISCORD / SPOTIFY + PreMiD ALL ACTIVITIES ========= */
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

/* Music detection (kept for progress behavior) */
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
  if (act.type === 2) return true; // Discord “Listening”

  const name = (act.name || "").toLowerCase();
  const details = (act.details || "").toLowerCase();
  const state = (act.state || "").toLowerCase();
  const largeText = (act?.assets?.large_text || "").toLowerCase();
  const hay = `${name} ${details} ${state} ${largeText}`.trim();

  // keywords
  if (MUSIC_KEYWORDS.some(k => hay.includes(k))) return true;

  // If details looks like "Song - Artist" or "Song by Artist"
  if (details.includes(" by ") || details.includes(" - ")) return true;

  // YouTube video but music-like
  if (name.includes("youtube") && isYouTubeMusicLike(act)) return true;

  return false;
}

/* Ignore low-value/noise activities */
function isIgnorableActivity(a) {
  if (!a) return true;
  if (a.type === 4) return true; // custom status
  const name = (a.name || "").toLowerCase();
  if (!name) return true;
  if (name === "discord") return true;
  return false;
}

/* Pick best overall PreMiD activity (not Spotify) */
function pickBestPremidActivity(activities = []) {
  const candidates = (activities || []).filter(a => !isIgnorableActivity(a));

  const rich = candidates.find(a => (a.details && a.details.trim()) || (a.state && a.state.trim()));
  if (rich) return rich;

  const withArt = candidates.find(a => a.assets?.large_image);
  if (withArt) return withArt;

  return candidates[0] || null;
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
    const res = await fetch(
      `https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}?_ts=${Date.now()}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Lanyard ${res.status}`);
    const json = await res.json();
    const data = json.data;
    if (!data) return null;

    /* 1) Spotify (best quality) */
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

    /* 2) PreMiD / ALL activities */
    if (SHOW_ALL_PREMID_ACTIVITIES) {
      const act = pickBestPremidActivity(data.activities || []);
      if (act) {
        slideInCard($$("spotify-card"));

        let appName = act.name || "Activity";

        // Normalize YouTube naming for better wording/icon selection
        const n = appName.toLowerCase();
        const isYTM = n.includes("youtube music") || n.includes("yt music") || n.includes("youtubemusic");
        const isYT  = n.includes("youtube");

        // If it's plain YouTube but looks like music, we want "Listening to YouTube"
        // (not "Watching YouTube")
        const ytMusicLike = isYT && isYouTubeMusicLike(act);

        const title = act.details || appName;
        const sub   = act.state || act?.assets?.large_text || appName;

        $$("live-song-title").textContent  = title;
        $$("live-song-artist").textContent = sub;

        const coverUrl = resolveDiscordAssetUrl(act);
        const coverEl = $$("live-activity-cover");
        if (coverEl && coverUrl) coverEl.src = coverUrl;

        currentSpotifyUrl = null;

        const explicitEl = $$("explicit-badge");
        if (explicitEl) explicitEl.style.display = "none";

        // Progress rules:
        resetProgress();
        if (isMusicActivity(act)) {
          const hasRealProgress = setupProgressFromActivityTimestamps(act);
          if (!hasRealProgress) setProgressVisibility(NON_SPOTIFY_PROGRESS_MODE);
        } else {
          setProgressVisibility("hide");
        }

        // Accent tint only if we actually have an image URL
        updateDynamicColors(coverUrl || null);

        // Source/icon selection:
        let source = "activity";
        if (isYTM) source = "youtubemusic";
        else if (isYT) source = "youtube";
        else if (n.includes("twitch")) source = "twitch";
        else if (n.includes("spotify")) source = "spotify";

        // Wording selection:
        const verb = getActivityVerb(appName, act);

        // Slightly nicer appName for display:
        let prettyApp = appName;
        if (isYTM) prettyApp = "YouTube Music";
        else if (isYT) prettyApp = "YouTube";

        // If plain YouTube but music-like, we still say YouTube (Listening to YouTube)
        // The verb function handles that already.
        const statusText = `${verb} ${prettyApp}`;

        return { text: statusText, source };
      }
    }

    /* 3) Nothing else: hide card and show presence */
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

  if (main?.source === "spotify") {
    showStatusLineWithFade(main?.text || "Listening to Spotify", "spotify");
  } else if (main?.source === "youtubemusic") {
    showStatusLineWithFade(main?.text || "Listening to YouTube Music", "youtubemusic");
  } else if (main?.source === "youtube") {
    showStatusLineWithFade(main?.text || "Watching YouTube", "youtube");
  } else if (main?.source === "music") {
    showStatusLineWithFade(main?.text || "Listening to Music", "music");
  } else if (main?.source === "activity") {
    showStatusLineWithFade(main?.text || "Active", "activity");
  } else if (twitchLive) {
    showStatusLineWithFade("Now Live on Twitch", "twitch");
  } else {
    showStatusLineWithFade(main?.text || "No Current Active Activities", main?.source || "discord");
  }
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
    : (discord?.source === "youtubemusic") ? discord
    : (discord?.source === "youtube") ? discord
    : (discord?.source === "music") ? discord
    : (discord?.source === "activity") ? discord
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
  setTimeout(() => { mainLoop(); }, 50);

  setInterval(mainLoop, 30000);
  setInterval(updateLastUpdated, 1000);
});
