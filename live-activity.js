/* ======================================================= */
/* === live-activity.js (merged) ========================= */
/* === Lanyard (Spotify) + Firestore Amazon support ====== */
/* === Priority: Spotify (Lanyard) > Amazon (Firestore) > Twitch > Others
      Option A for Amazon status text: "Listening to Amazon Music"
   ======================================================= */

/* ======================================================= */
/* === IMPORTS =========================================== */
/* ======================================================= */
import { doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

const CONFIG = {
  discord: { userId: "850815059093356594" },
  twitch:  { username: "calebkritzar" },
  reddit:  { username: "Electronic_Row_1262" },
  github:  { username: "rkritzar39" },
  tiktok:  { username: "calebkritzar" },
};

/* ======================================================= */
/* === STATE ============================================= */
/* ======================================================= */
let lastUpdateTime = null;
let progressInterval = null;
let currentSpotifyUrl = null;
let currentAmazonUrl = null;
let tempBanner = null;
const TEMP_BANNER_MS = 15000;

let lastGitHubEventId = null;
let lastRedditPostId  = null;
let lastTikTokVideoId = null;

/* Amazon state */
let lastAmazonPayload = null;
let lastLanyardSuccess = Date.now();
let lastKnownMain = null; // for graceful fallback

/* Shortcuts */
const $$  = (id) => document.getElementById(id);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* ======================================================= */
/* === ICON SYSTEM ======================================= */
/* ======================================================= */
function getThemeColor(light, dark) {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? dark.replace("#", "")
    : light.replace("#", "");
}

const ICON_MAP = {
  spotify: "https://cdn.simpleicons.org/spotify/1DB954",
  discord: "https://cdn.simpleicons.org/discord/5865F2",
  twitch:  "https://cdn.simpleicons.org/twitch/9146FF",
  youtube: "https://cdn.simpleicons.org/youtube/FF0000",
  reddit:  "https://cdn.simpleicons.org/reddit/FF4500",
  github:  `https://cdn.simpleicons.org/github/${getThemeColor("#000000", "#ffffff")}`,
  tiktok:  `https://cdn.simpleicons.org/tiktok/${getThemeColor("#000000", "#ffffff")}`,
  manual:  "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
  default: "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
};

/* ======================================================= */
/* === STATUS LINE ======================================= */
/* ======================================================= */
function setStatusLine(text, isVisible = true, source = "default") {
  const txt  = $$("status-line-text");
  const line = $$("status-line");
  const icon = $$("status-icon");

  if (!txt || !line || !icon) return;

  const iconUrl = ICON_MAP[source] || ICON_MAP.default;

  line.style.opacity = 0;

  setTimeout(() => {
    icon.src = iconUrl;
    icon.alt = `${source} icon`;
    txt.textContent = text || "No Current Active Activities";
    line.classList.toggle("hidden", !isVisible);
    line.style.opacity = 1;
  }, 150);

  icon.classList.remove("glow");
  if (source === "spotify" || source === "twitch" || source === "amazon") icon.classList.add("glow");

  lastUpdateTime = Date.now();
}

/* ======================================================= */
/* === LAST UPDATED LABEL ================================ */
/* ======================================================= */
function updateLastUpdated() {
  const el = $$("live-activity-updated");
  if (!el) return;

  if (!lastUpdateTime) {
    el.textContent = "—";
    return;
  }

  const s = Math.floor((Date.now() - lastUpdateTime) / 1000);

  el.textContent =
    s < 5    ? "Updated just now" :
    s < 60   ? `Updated ${s}s ago` :
    s < 3600 ? `Updated ${Math.floor(s / 60)}m ago` :
               `${Math.floor(s / 3600)}h ago`;
}

/* ======================================================= */
/* === PROGRESS BAR ====================================== */
/* ======================================================= */
function setupProgress(startMs, endMs) {
  const bar       = $$("music-progress-bar");
  const elapsedEl = $$("elapsed-time");
  const remainEl  = $$("remaining-time");
  const totalEl   = $$("total-time");

  if (!bar || !startMs || !endMs) return;

  const totalSec = Math.max((endMs - startMs) / 1000, 1);
  totalEl.textContent = fmt(totalSec);

  clearInterval(progressInterval);

  function tick() {
    const now = Date.now();
    const elapsedSec = Math.min((now - startMs) / 1000, totalSec);
    const left = Math.max(totalSec - elapsedSec, 0);

    bar.style.width = `${(elapsedSec / totalSec) * 100}%`;

    elapsedEl.textContent = fmt(elapsedSec);
    remainEl.textContent  = `-${fmt(left)}`;
  }

  tick();
  progressInterval = setInterval(tick, 1000);
}

/* ======================================================= */
/* === SPOTIFY ALBUM ACCENT COLORS ======================= */
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

      const accent = `rgb(${r}, ${g}, ${b})`;

      activity.style.setProperty("--dynamic-accent", accent);
      activity.style.setProperty(
        "--dynamic-bg",
        `linear-gradient(180deg, rgba(${r},${g},${b},0.35), rgba(${r},${g},${b},0.15))`
      );

    } catch (err) {
      console.warn("Color extraction failed:", err);
      activity.style.setProperty("--dynamic-accent", userAccent);
    }
  };

  img.onerror = () => {
    const userAccent = JSON.parse(localStorage.getItem("websiteSettings") || "{}").accentColor || "#1DB954";
    activity.style.setProperty("--dynamic-accent", userAccent);
    activity.style.setProperty("--dynamic-bg", "none");
  };
}

/* ======================================================= */
/* === UTILS: album crossfade + slide animations ========= */
/* ======================================================= */
function crossfadeAlbumArt(imgEl, newSrc) {
  if (!imgEl) return;
  if (imgEl.dataset.current === newSrc) return; // no change

  const overlay = document.createElement("img");
  overlay.className = "album-overlay";
  overlay.style.position = "absolute";
  overlay.style.inset = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.objectFit = "cover";
  overlay.style.opacity = "0";
  overlay.style.transition = "opacity .45s ease";
  overlay.src = newSrc;
  overlay.onload = () => {
    imgEl.parentElement.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = "1"; });
    setTimeout(() => {
      imgEl.src = newSrc;
      imgEl.dataset.current = newSrc;
      overlay.remove();
    }, 470);
  };
  overlay.onerror = () => overlay.remove();
}

function slideInCard(cardEl) {
  if (!cardEl) return;
  cardEl.classList.remove("slide-out");
  cardEl.classList.add("slide-in");
  cardEl.style.display = "";
  cardEl.style.opacity = "1";
}

function slideOutCard(cardEl) {
  if (!cardEl) return;
  cardEl.classList.remove("slide-in");
  cardEl.classList.add("slide-out");
  setTimeout(() => {
    if (cardEl.classList.contains("slide-out")) {
      cardEl.style.opacity = "0";
      cardEl.style.display = "none";
    }
  }, 360);
}

function showStatusLineWithFade(text, source = "manual") {
  const txt = $$("status-line-text");
  const line = $$("status-line");
  const icon = $$("status-icon");
  if (!txt || !line || !icon) return;

  const iconUrl = ICON_MAP[source] || ICON_MAP.default;
  line.style.transition = "opacity .22s ease";
  line.style.opacity = "0";

  setTimeout(() => {
    icon.src = iconUrl;
    icon.alt = `${source} icon`;
    txt.textContent = text;
    line.style.opacity = "1";
  }, 180);

  icon.classList.remove("glow");
  if (source === "spotify" || source === "twitch" || source === "amazon") icon.classList.add("glow");

  lastUpdateTime = Date.now();
}

/* ======================================================= */
/* === DISCORD / LANYARD HANDLER ========================= */
/* ======================================================= */
async function getDiscord() {
  try {
    const res = await fetch(
      `https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}?_ts=${Date.now()}`,
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error(`Lanyard responded ${res.status}`);

    const json = await res.json();
    const data = json.data;
    if (!data) return null;

    lastLanyardSuccess = Date.now();

    /* LANYARD SPOTIFY DETECTED */
    if (data.spotify) {
      const sp = data.spotify;

      const now = Date.now();
      const startMs = sp.timestamps?.start ?? (now - (sp.spotify_elapsed ? sp.spotify_elapsed * 1000 : 0));
      const endMs   = sp.timestamps?.end   ?? (startMs + (sp.spotify_duration ? sp.spotify_duration * 1000 : 0));

      const duration = Math.max(endMs - startMs, 1);
      const elapsed  = now - startMs;

      // Fix Lanyard drift
      let correctedStart = startMs;
      let correctedEnd   = endMs;

      if (elapsed < 0 || elapsed > duration + 5000) {
        if (typeof sp.spotify_elapsed === "number" && typeof sp.spotify_duration === "number") {
          correctedStart = now - sp.spotify_elapsed * 1000;
          correctedEnd = correctedStart + sp.spotify_duration * 1000;
        }
      }

      $$("spotify-card").classList.remove("hidden");
      $$("live-activity-cover").src = sp.album_art_url;
      $$("live-song-title").textContent = sp.song;
      $$("live-song-artist").textContent = sp.artist;

      currentSpotifyUrl = `https://open.spotify.com/track/${sp.track_id}`;

      setupProgress(correctedStart, correctedEnd);
      updateDynamicColors(sp.album_art_url);

      lastKnownMain = { text: "Listening to Spotify", source: "spotify" };
      return { text: "Listening to Spotify", source: "spotify" };
    }

    /* NO SPOTIFY — RETURN DISCORD STATUS */
    $$("spotify-card").classList.add("hidden");
    updateDynamicColors(null);

    const map = {
      online: "Online on Discord",
      idle: "Idle on Discord",
      dnd: "Do Not Disturb",
      offline: "No Current Active Activities",
    };

    const status = map[data.discord_status] || "No Current Active Activities";
    lastKnownMain = { text: status, source: "discord" };
    return { text: status, source: "discord" };

  } catch (e) {
    console.warn("Lanyard error:", e);
    // graceful fallback: if we recently had a lastKnownMain, keep it for a bit
    if (lastKnownMain && Date.now() - lastLanyardSuccess < 10000) {
      return lastKnownMain;
    }
    return null;
  }
}

/* ======================================================= */
/* === AMAZON (FIRESTORE) HANDLER ======================== */
/* ======================================================= */
/* Requires Firestore document at: /nowPlaying/amazon
   Example document:
   {
     service: "amazon",
     title: "Song Title",
     artist: "Artist Name",
     album: "Album Name",
     cover: "https://.../cover.jpg",
     duration_ms: 215000,
     progress_ms: 42000,
     paused: false,
     url: "https://music.amazon.com/...", // optional
     updated_at: 1712345678901
   }
*/

function handleAmazonPayload(payload) {
  // payload null => stopped
  if (!payload) {
    const card = $$("spotify-card");
    if (card) slideOutCard(card);
    updateDynamicColors(null);
    currentAmazonUrl = null;
    lastAmazonPayload = null;
    return null;
  }

  lastAmazonPayload = payload;

  const {
    title, artist, album, cover, duration_ms, progress_ms, paused
  } = payload;

  const coverUrl = cover || "path/to/default-cover.jpg";
  const titleText = title || "Unknown";
  const artistText = artist || "Unknown";

  // album art crossfade
  const coverEl = $$("live-activity-cover");
  if (coverEl) {
    if (!coverEl.dataset.current) coverEl.dataset.current = coverEl.src || "";
    if (coverUrl && coverEl.dataset.current !== coverUrl) crossfadeAlbumArt(coverEl, coverUrl);
    else if (coverUrl && coverEl.dataset.current === "") { coverEl.src = coverUrl; coverEl.dataset.current = coverUrl; }
  }

  const titleEl = $$("live-song-title");
  const artistEl = $$("live-song-artist");
  if (titleEl) titleEl.textContent = titleText;
  if (artistEl) artistEl.textContent = artistText;

  currentAmazonUrl = payload.url || null;

  // compute start/end ms from progress/duration
  const now = Date.now();
  const prog = Number(progress_ms || 0);
  const dur = Number(duration_ms || 0);
  const startMs = now - prog;
  const endMs = startMs + (dur || Math.max(prog, 1));

  if (!paused) {
    setupProgress(startMs, endMs);
  } else {
    setupProgress(startMs, endMs);
    clearInterval(progressInterval); // freeze while paused
  }

  updateDynamicColors(coverUrl);

  const card = $$("spotify-card");
  if (card) slideInCard(card);

  // Option A: "Listening to Amazon Music" when playing
  const statusText = paused ? "Paused on Amazon Music" : "Listening to Amazon Music";
  lastKnownMain = { text: statusText, source: "amazon" };
  return { text: statusText, source: "amazon" };
}

/* Firestore listener for Amazon now-playing */
try {
  const amazonDocRef = doc(db, "nowPlaying", "amazon");
  onSnapshot(amazonDocRef, (snap) => {
    if (!snap.exists()) {
      // doc removed
      handleAmazonPayload(null);
      return;
    }
    const payload = snap.data() || {};
    // ensure numeric fields
    if (payload.progress_ms != null) payload.progress_ms = Number(payload.progress_ms);
    if (payload.duration_ms != null) payload.duration_ms = Number(payload.duration_ms);
    handleAmazonPayload(payload);
  }, (err) => {
    console.warn("Firestore Amazon listener error:", err);
  });
} catch (e) {
  console.warn("Firestore not available; Amazon support disabled:", e);
}

/* ======================================================= */
/* === TWITCH ============================================ */
/* ======================================================= */
async function getTwitch() {
  const u = (CONFIG.twitch.username || "").toLowerCase();
  if (!u) return null;

  try {
    const r = await fetch(`https://decapi.me/twitch/live/${u}`, { cache: "no-store" });
    const t = (await r.text()).toLowerCase();

    if (t.includes("is live")) {
      return { text: "Now Live on Twitch", source: "twitch" };
    }

    return null;
  } catch (e) {
    console.warn("Twitch error:", e);
    return null;
  }
}

/* ======================================================= */
/* === REDDIT ============================================ */
/* ======================================================= */
async function getReddit() {
  const u = CONFIG.reddit.username;
  if (!u) return null;

  try {
    const r = await fetch(`https://www.reddit.com/user/${u}/submitted.json?limit=1`, {
      cache: "no-store"
    });

    const j = await r.json();
    const post = j?.data?.children?.[0]?.data;

    if (post && post.id !== lastRedditPostId) {
      lastRedditPostId = post.id;
      return { text: "Shared on Reddit", source: "reddit", isTemp: true };
    }

  } catch (e) {
    console.warn("Reddit error:", e);
  }

  return null;
}

/* ======================================================= */
/* === GITHUB ============================================ */
/* ======================================================= */
async function getGitHub() {
  const u = CONFIG.github.username;
  if (!u) return null;

  try {
    const r = await fetch(`https://api.github.com/users/${u}/events/public`, {
      cache: "no-store",
    });

    const events = await r.json();
    const evt = Array.isArray(events)
      ? events.find((e) => ["PushEvent", "CreateEvent", "PullRequestEvent"].includes(e.type))
      : null;

    if (evt && evt.id !== lastGitHubEventId) {
      lastGitHubEventId = evt.id;
      return { text: "Committed on GitHub", source: "github", isTemp: true };
    }

  } catch (e) {
    console.warn("GitHub error:", e);
  }

  return null;
}

/* ======================================================= */
/* === TIKTOK ============================================ */
/* ======================================================= */
async function getTikTok() {
  const u = CONFIG.tiktok.username;
  if (!u) return null;

  try {
    const res = await fetch(
      `https://r.jina.ai/http://www.tiktok.com/@${u}`,
      { cache: "no-store" }
    );

    const html = await res.text();
    const m = html.match(/\/video\/(\d+)/);
    const videoId = m?.[1];

    if (videoId && videoId !== lastTikTokVideoId) {
      lastTikTokVideoId = videoId;
      return { text: "Posted on TikTok", source: "tiktok", isTemp: true };
    }

  } catch (e) {
    console.warn("TikTok error:", e);
  }

  return null;
}

/* ======================================================= */
/* === STATUS PRIORITY LOGIC ============================= */
/* ======================================================= */
function applyStatusDecision({ main, twitchLive, temp }) {
  const spotifyCard = $$("spotify-card");

  // Temporary banner overrides everything
  if (temp && Date.now() < temp.expiresAt) {
    setStatusLine(temp.text, true, temp.source || "default");
    return;
  }

  // Spotify first
  if (main?.source === "spotify") {
    setStatusLine(main.text, true, "spotify");
    if (spotifyCard) spotifyCard.classList.remove("hidden");
    return;
  }

  // Amazon next (only if payload exists and playing or paused)
  if (main?.source === "amazon") {
    setStatusLine(main.text, true, "amazon");
    if (spotifyCard) spotifyCard.classList.remove("hidden");
    return;
  }

  // Twitch live second
  if (twitchLive) {
    setStatusLine("Now Live on Twitch", true, "twitch");
    return;
  }

  // Discord status third
  if (main && main.text !== "No Current Active Activities") {
    setStatusLine(main.text, true, main.source || "discord");
    return;
  }

  // Default fallback
  setStatusLine("No Current Active Activities", true, "manual");
}

/* ======================================================= */
/* === UPDATE LOOP ======================================= */
/* ======================================================= */
async function updateLiveStatus() {
  // Lanyard (discord) primary since Spotify presence is inside it
  const discord = await getDiscord();

  // Amazon info comes from Firestore listener; we read lastAmazonPayload
  const amazonPayload = lastAmazonPayload;

  // Fetch other sources in parallel
  const [twitch, reddit, github, tiktok] = await Promise.all([
    getTwitch(),
    getReddit(),
    getGitHub(),
    getTikTok(),
  ]);

  // Determine primary source:
  // Priority: Spotify (discord) > Amazon > Twitch > others > manual
  let primary = null;
  if (discord && discord.source === "spotify") {
    primary = discord;
  } else if (amazonPayload && (amazonPayload.title || amazonPayload.artist)) {
    // Map amazon payload to UI-friendly shape
    const playing = !amazonPayload.paused;
    primary = {
      text: playing ? "Listening to Amazon Music" : "Paused on Amazon Music",
      source: "amazon",
    };
  } else if (discord) {
    primary = discord;
  } else if (twitch) {
    primary = twitch;
  } else {
    primary = { text: "No Current Active Activities", source: "manual" };
  }

  // temp banner logic
  const tempHit = [reddit, github, tiktok].find((r) => r && r.isTemp);
  if (tempHit) {
    tempBanner = {
      text: tempHit.text,
      source: tempHit.source,
      expiresAt: Date.now() + TEMP_BANNER_MS,
    };
  } else if (tempBanner && Date.now() >= tempBanner.expiresAt) {
    tempBanner = null;
  }

  // Apply final decision
  applyStatusDecision({
    main: primary,
    twitchLive: !!twitch,
    temp: tempBanner,
  });

  $$("live-activity").classList.remove("hidden");
}

/* ======================================================= */
/* === INIT ============================================== */
/* ======================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const card = $$("spotify-card");
  if (card) {
    card.addEventListener("click", () => {
      if (currentSpotifyUrl) window.open(currentSpotifyUrl, "_blank");
      else if (currentAmazonUrl) window.open(currentAmazonUrl, "_blank");
    });
  }

  updateLiveStatus();

  // Poll/update intervals
  setInterval(updateLiveStatus, 5000); // Lanyard-friendly
  setInterval(updateLastUpdated, 1000);
});
