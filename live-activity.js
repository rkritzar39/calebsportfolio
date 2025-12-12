/* live-activity.js — Manual Status + Spotify + Discord + Twitch + Reddit (30s Auto-Refresh) */

import { doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

const CONFIG = {
  discord: { userId: "850815059093356594" },
  twitch:  { username: "calebkritzar" },
  reddit:  { username: "Electronic_Row_1262" }
};

/* ======================================================= */
/* === GLOBAL STATE ====================================== */
/* ======================================================= */

let lastUpdateTime = null;
let lastRenderedText = null;
let lastRenderedSource = null;

let progressInterval = null;
let currentSpotifyUrl = null;

let tempBanner = null;
const TEMP_BANNER_MS = 15000;

let lastRedditPostId  = null;
let lastSpotifyTrackId = null;

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
  const txt  = $$("status-line-text");
  const line = $$("status-line");
  const icon = $$("status-icon");
  if (!txt || !line || !icon) return;

  const changed = text !== lastRenderedText || source !== lastRenderedSource;

  if (changed) {
    lastRenderedText = text;
    lastRenderedSource = source;
  }

  line.style.transition = "opacity .22s ease";
  line.style.opacity = "0";

  const iconUrl = ICON_MAP[source] || ICON_MAP.default;

  setTimeout(() => {
    icon.src = iconUrl;
    icon.alt = `${source} icon`;
    txt.textContent = text;

    icon.classList.remove("glow");
    if (source === "spotify" || source === "twitch") {
      icon.classList.add("glow");
    }

    line.style.opacity = "1";

    localStorage.setItem("lastStatus", JSON.stringify({ text, source, timestamp: Date.now() }));
  }, 180);
}

function updateLastUpdated() {
  const el = $$("live-activity-updated");
  if (!el || !lastUpdateTime) return;

  const s = Math.floor((Date.now() - lastUpdateTime) / 1000);

  el.textContent =
    s < 5 ? "Updated just now" :
    s < 60 ? `Updated ${s}s ago` :
    s < 3600 ? `Updated ${Math.floor(s/60)}m ago` :
    `${Math.floor(s/3600)}h ago`;
}

/* ======================================================= */
/* === SPOTIFY BAR ======================================= */
/* ======================================================= */

function setupProgress(startMs, endMs) {
  const bar = $$("music-progress-bar");
  const elapsedEl = $$("elapsed-time");
  const remainEl = $$("remaining-time");
  const totalEl  = $$("total-time");

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
/* === COLORS ============================================ */
/* ======================================================= */

function updateDynamicColors(url) {
  const box = document.querySelector(".live-activity");
  if (!box) return;

  const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
  const matchAccent = settings.matchSongAccent === "enabled";
  const userAccent  = settings.accentColor || "#1DB954";

  if (!matchAccent || !url) {
    box.style.setProperty("--dynamic-accent", userAccent);
    box.style.setProperty("--dynamic-bg", "none");
    return;
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;

  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width || 64;
      canvas.height = img.height || 64;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let r=0,g=0,b=0,count=0;
      const data = ctx.getImageData(0,0,canvas.width,canvas.height).data;

      for (let i = 0; i < data.length; i += 4) {
        r+=data[i]; g+=data[i+1]; b+=data[i+2]; count++;
      }

      r=Math.floor(r/count); g=Math.floor(g/count); b=Math.floor(b/count);
      const accent = `rgb(${r},${g},${b})`;

      box.style.setProperty("--dynamic-accent", accent);
      box.style.setProperty("--dynamic-bg", `linear-gradient(180deg, rgba(${r},${g},${b},0.35), rgba(${r},${g},${b},0.12))`);
    } catch {
      box.style.setProperty("--dynamic-accent", userAccent);
      box.style.setProperty("--dynamic-bg", "none");
    }
  };

  img.onerror = () => {
    box.style.setProperty("--dynamic-accent", userAccent);
    box.style.setProperty("--dynamic-bg", "none");
  };
}

/* ======================================================= */
/* === ANIMATIONS ======================================== */
/* ======================================================= */

function slideInCard(card) {
  if (!card) return;
  card.classList.remove("hidden","slide-out");
  card.classList.add("slide-in");
  card.style.display = "";
  card.style.opacity = "1";
}

function slideOutCard(card) {
  if (!card) return;
  card.classList.remove("slide-in");
  card.classList.add("slide-out");
  setTimeout(() => {
    if (card.classList.contains("slide-out")) {
      card.style.opacity = "0";
      card.style.display = "none";
      card.classList.add("hidden");
    }
  }, 360);
}

/* ======================================================= */
/* === MANUAL FIRESTORE ================================= */
/* ======================================================= */

function isManualActive() {
  if (!manualStatus?.enabled) return false;

  const exp = manualStatus.expiresAt;
  if (!exp || typeof exp !== "number") return true;

  return Date.now() < exp;
}

try {
  const ref = doc(db, "manualStatus", "site");

  onSnapshot(ref, async (snap) => {
    if (!snap.exists()) { manualStatus = null; return; }

    const d = snap.data();

    if (d.expiresAt?.toMillis) {
      d.expiresAt = d.expiresAt.toMillis();
    } else if (typeof d.expiresAt !== "number") {
      d.expiresAt = null;
    }

    manualStatus = d;

    if (d.enabled && d.expiresAt && Date.now() >= d.expiresAt) {
      await setDoc(ref, {
        enabled: false,
        text: "",
        expiresAt: null,
        persistent: false,
        updated_at: Date.now()
      }, { merge: true });

      manualStatus = null;
    }
  });
} catch (e) {
  console.warn("Firestore manual disabled:", e);
}

/* ======================================================= */
/* === DISCORD / SPOTIFY ================================= */
/* ======================================================= */

async function getDiscord() {
  if (isManualActive()) {
    slideOutCard($$("spotify-card"));
    clearInterval(progressInterval);
    updateDynamicColors(null);
    return { text: manualStatus.text, source: "manual" };
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
      const now = Date.now();
      const start = sp.timestamps?.start ?? now;
      const end   = sp.timestamps?.end   ?? (start + (sp.duration_ms||0));

      lastSpotifyTrackId = sp.track_id;

      slideInCard($$("spotify-card"));
      $$("live-song-title").textContent = sp.song   || "Unknown";
      $$("live-song-artist").textContent = sp.artist || "Unknown";

      const cover = $$("live-activity-cover");
      if (cover && cover.src !== sp.album_art_url) cover.src = sp.album_art_url;

      currentSpotifyUrl = sp.track_id ? `https://open.spotify.com/track/${sp.track_id}` : null;

      setupProgress(start,end);
      updateDynamicColors(sp.album_art_url);

      return { text: "Listening to Spotify", source: "spotify" };
    }

    slideOutCard($$("spotify-card"));
    updateDynamicColors(null);

    return {
      text: ({
        online:  "Online on Discord",
        idle:    "Idle on Discord",
        dnd:     "Do Not Disturb",
        offline: "No Current Active Activities",
      }[data.discord_status]) || "No Current Active Activities",
      source: "discord"
    };

  } catch (e) {
    console.warn("Discord Error:", e);
    return null;
  }
}

/* ======================================================= */
/* === TWITCH LIVE ======================================= */
/* ======================================================= */

async function getTwitch() {
  const u = CONFIG.twitch.username;
  if (!u) return null;

  try {
    const res = await fetch(`https://decapi.me/twitch/live/${u}`, { cache: "no-store" });
    const txt = (await res.text()).toLowerCase();

    if (txt.includes("is live") || txt.includes("currently live") || txt.includes("streaming")) {
      return { text: "Now Live on Twitch", source: "twitch" };
    }
  } catch (e) {
    console.warn("Twitch Error:", e);
  }

  return null;
}

/* ======================================================= */
/* === REDDIT ============================================ */
/* ======================================================= */

async function getReddit() {
  const u = CONFIG.reddit.username;
  if (!u) return null;

  try {
    const res = await fetch(
      `https://www.reddit.com/user/${u}/submitted.json?limit=1`,
      { cache: "no-store" }
    );

    const json = await res.json();
    const post = json?.data?.children?.[0]?.data;

    if (post && post.id !== lastRedditPostId) {
      lastRedditPostId = post.id;

      return { text: "Shared on Reddit", source: "reddit", isTemp: true };
    }
  } catch (e) {
    console.warn("Reddit Error:", e);
  }

  return null;
}

/* ======================================================= */
/* === PRIORITY LOGIC ==================================== */
/* ======================================================= */

function applyStatusDecision({ main, twitchLive, temp }) {
  // Manual always overrides everything
  if (isManualActive()) {
    showStatusLineWithFade(
      manualStatus.text || "Status (manual)",
      manualStatus.icon || "manual"
    );
    slideOutCard($$("spotify-card"));
    clearInterval(progressInterval);
    updateDynamicColors(null);
    return;
  }

  // Temporary banners (like Reddit) only if not manual
  if (temp && Date.now() < temp.expiresAt) {
    showStatusLineWithFade(temp.text, temp.source);
    return;
  }

  // Spotify has priority over Twitch if active
  if (main?.source === "spotify") {
    showStatusLineWithFade("Listening to Spotify", "spotify");
    return;
  }

  // Twitch live next
  if (twitchLive) {
    showStatusLineWithFade("Now Live on Twitch", "twitch");
    return;
  }

  // Fallback to Discord or default
  showStatusLineWithFade(
    main?.text || "No Current Active Activities",
    main?.source || "discord"
  );
}

/* ======================================================= */
/* === MAIN LOOP (30s REFRESH) =========================== */
/* ======================================================= */

async function mainLoop() {
  const [discord, twitch, reddit] = await Promise.all([
    getDiscord(),
    getTwitch(),
    getReddit()
  ]);

  const primary =
    discord?.source === "spotify" ? discord :
    discord || { text: "No Current Active Activities", source: "discord" };

  if (reddit?.isTemp) {
    tempBanner = {
      text: reddit.text,
      source: reddit.source,
      expiresAt: Date.now() + TEMP_BANNER_MS
    };
  } else if (tempBanner && Date.now() >= tempBanner.expiresAt) {
    tempBanner = null;
  }

  applyStatusDecision({
    main: primary,
    twitchLive: !!twitch,
    temp: tempBanner
  });

  lastUpdateTime = Date.now();
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
    try {
      const { text, source } = JSON.parse(saved);
      if (!isManualActive()) {
        showStatusLineWithFade(text, source);
      } else if (manualStatus) {
        showStatusLineWithFade(
          manualStatus.text || "Status (manual)",
          manualStatus.icon || "manual"
        );
      }
    } catch (e) {}
  }

  mainLoop();
  setInterval(mainLoop, 30000);
  setInterval(updateLastUpdated, 1000);
});
