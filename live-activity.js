/* live-activity.js — Fully Reliable Version: Manual + Spotify + Twitch + Discord + Reddit
   UPDATED:
   - Adds UNIVERSAL music detection via Discord activities[] (PreMiD / Music Presence / many players)
   - Keeps Spotify via Lanyard as best-quality source (progress, album art, timestamps)
   - Non-Spotify music shows title/artist/artwork when available; hides progress if not available
   - Twitch: decapi uptime via corsproxy
   - Reddit: one-time banner per new post via localStorage
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
let lastPollTime   = Date.now();
let progressInterval = null;
let currentSpotifyUrl = null;
let tempBanner = null;
const TEMP_BANNER_MS = 15000;

let lastRedditPostId  = null;
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
  music:   "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/music.svg",
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
/* === MUSIC CARD HELPERS ================================ */
/* ======================================================= */

function clearMusicUI() {
  slideOutCard($$("spotify-card"));
  clearInterval(progressInterval);
  progressInterval = null;
  currentSpotifyUrl = null;

  // Reset progress UI (hide it)
  const wrap = $$("music-progress-wrap");
  if (wrap) wrap.style.display = "none";

  const bar = $$("music-progress-bar");
  if (bar) bar.style.width = "0%";

  const elapsedEl = $$("elapsed-time");
  const remainEl  = $$("remaining-time");
  const totalEl   = $$("total-time");
  if (elapsedEl) elapsedEl.textContent = "0:00";
  if (remainEl)  remainEl.textContent  = "-0:00";
  if (totalEl)   totalEl.textContent   = "0:00";

  const explicitEl = $$("explicit-badge");
  if (explicitEl) explicitEl.style.display = "none";
}

function showMusicUI({ title, artist, coverUrl, isExplicit = false, startMs = null, endMs = null, clickUrl = null }) {
  slideInCard($$("spotify-card"));

  $$("live-song-title").textContent  = title  || "Unknown";
  $$("live-song-artist").textContent = artist || "Unknown";

  const coverEl = $$("live-activity-cover");
  if (coverEl && coverUrl && coverEl.src !== coverUrl) coverEl.src = coverUrl;

  currentSpotifyUrl = clickUrl || null;

  const explicitEl = $$("explicit-badge");
  if (explicitEl) explicitEl.style.display = isExplicit ? "inline-block" : "none";

  // Progress only when timestamps exist
  const wrap = $$("music-progress-wrap");
  if (startMs && endMs && endMs > startMs) {
    if (wrap) wrap.style.display = "";
    setupProgress(startMs, endMs);
  } else {
    if (wrap) wrap.style.display = "none";
    clearInterval(progressInterval);
    progressInterval = null;
  }

  updateDynamicColors(coverUrl || null);
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

// =======================================================
// ✅ UPDATE THIS FUNCTION IN YOUR live-activity.js
// This makes the container match the song accent ONLY when Spotify cover exists.
// When no imageUrl -> no tint (dynamic accent becomes transparent).
// =======================================================

function updateDynamicColors(imageUrl) {
  const activity = document.querySelector(".live-activity");
  if (!activity) return;

  const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
  const matchAccent = settings.matchSongAccent === "enabled";
  const userAccent  = settings.accentColor || "#1DB954";

  // ✅ No Spotify / no image = no song tint
  if (!matchAccent || !imageUrl) {
    activity.style.setProperty("--dynamic-bg", "none");
    activity.style.setProperty("--dynamic-accent", "transparent");
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
      // If canvas fails, fall back to user accent tint (still better than nothing)
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
/* === DISCORD ASSET URL RESOLVER ======================== */
/* ======================================================= */

function resolveDiscordAssetUrl(activity) {
  // Works for many PreMiD activities:
  // - Sometimes assets.large_image is "mp:external/..." (already a remote-ish path)
  // - Sometimes it's a normal Discord app asset id (needs cdn URL)
  const a = activity?.assets;
  if (!a) return "";

  const large = a.large_image || "";
  const appId = activity?.application_id;

  if (!large) return "";

  // "mp:" assets (Discord proxy) – this can work as-is in many cases:
  // Examples: "mp:external/...."
  if (large.startsWith("mp:")) {
    // Most browsers accept it as a direct "https://media.discordapp.net/" style URL is not provided here.
    // Lanyard often returns mp: URLs that still render in Discord but not always in browsers.
    // We’ll try to convert mp:external to a media.discordapp.net URL if it’s formatted that way.
    // If it doesn't render, it's fine — your UI will just keep existing cover or default.
    return `https://media.discordapp.net/${large.replace(/^mp:/, "")}`;
  }

  // If it looks like a plain hash and we have an app id, use Discord app-assets CDN:
  if (appId) {
    return `https://cdn.discordapp.com/app-assets/${appId}/${large}.png`;
  }

  return "";
}

function findGenericListeningActivity(activities = []) {
  // Spotify is handled separately via data.spotify
  // We want "Listening" style activities, usually type 2, but PreMiD sometimes uses other types.
  return activities.find(a => {
    const name = (a?.name || "").toLowerCase();
    const details = (a?.details || "").toLowerCase();

    // Avoid obvious non-music
    if (!a) return false;
    if (name.includes("visual studio") || name.includes("chrome")) return false;

    // Strong signals
    if (a.type === 2) return true; // Listening
    if (details.includes("by ") || details.includes(" - ")) return true;
    if (name.includes("music") || name.includes("soundcloud") || name.includes("youtube") || name.includes("apple")) return true;

    return false;
  });
}

/* ======================================================= */
/* === DISCORD / SPOTIFY (UPDATED) ======================= */
/* ======================================================= */

let lastSpotifyTrackId = null;

async function getDiscord() {
  if (isManualActive()) {
    clearMusicUI();
    updateDynamicColors(null);
    return { text: manualStatus?.text || "Status (manual)", source: "manual" };
  }

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}?_ts=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Lanyard ${res.status}`);
    const json = await res.json();
    const data = json.data;
    if (!data) return null;

    // 1) Best-quality: Spotify block
    if (data.spotify) {
      const sp = data.spotify;
      const now = Date.now();
      const startMs = sp.timestamps?.start ?? now;
      const endMs   = sp.timestamps?.end   ?? (startMs + (sp.duration_ms || 0));

      lastSpotifyTrackId = sp.track_id;

      showMusicUI({
        title: sp.song,
        artist: sp.artist,
        coverUrl: sp.album_art_url,
        isExplicit: !!sp?.explicit,
        startMs,
        endMs,
        clickUrl: sp.track_id ? `https://open.spotify.com/track/${sp.track_id}` : null
      });

      return { text: "Listening to Spotify", source: "spotify" };
    }

    // 2) Universal: any “Listening” activity (PreMiD / Music Presence / etc.)
    const act = findGenericListeningActivity(data.activities || []);
    if (act) {
      // Common patterns:
      // - act.details = track title
      // - act.state   = artist OR "by Artist"
      // - act.name    = app/platform name
      const title = act.details || act.name || "Listening";
      const artist = act.state || act?.assets?.large_text || "";

      const coverUrl = resolveDiscordAssetUrl(act);

      // No timestamps -> hide progress bar; clickUrl is unknown generally
      showMusicUI({
        title,
        artist,
        coverUrl,
        isExplicit: false,
        startMs: null,
        endMs: null,
        clickUrl: null
      });

      return { text: `Listening on ${act.name || "Music"}`, source: "music" };
    }

    // 3) No music: fall back to discord presence text
    const map = {
      online: "Online on Discord",
      idle: "Idle on Discord",
      dnd: "Do Not Disturb",
      offline: "No Current Active Activities",
    };

    clearMusicUI();
    updateDynamicColors(null);
    return { text: map[data.discord_status] || "No Current Active Activities", source: "discord" };

  } catch (e) {
    console.warn("Lanyard error:", e);
    return null;
  }
}

/* ======================================================= */
/* === T W I T C H  (Fixed) ============================== */
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
  const card = $$("spotify-card");
  if (card) card.addEventListener("click", () => { if (currentSpotifyUrl) window.open(currentSpotifyUrl, "_blank"); });

  const saved = localStorage.getItem("lastStatus");
  if (saved) {
    try {
      const { text, source } = JSON.parse(saved);
      if (!isManualActive()) showStatusLineWithFade(text, source);
      else showStatusLineWithFade(manualStatus?.text || "Status (manual)", manualStatus?.icon || "manual");
    } catch (e) { console.warn("Failed to restore last status:", e); }
  }

  mainLoop();
  setInterval(mainLoop, 30000);
  setInterval(updateLastUpdated, 1000);
});
