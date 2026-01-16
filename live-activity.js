/* live-activity.js — Fully Reliable Version: Manual + Spotify + Twitch + Discord + Reddit
   Spotify via Lanyard (real timestamps -> real progress)
   PreMiD via Lanyard activities[] (show ALL activities)
   Manual Firestore overrides everything
   Twitch via decapi uptime
   Reddit one-time banner per new post
   Settings apply instantly (same tab)
   Match song accent OFF => user accentColor
   Match song accent ON  => average color from cover
   Time format ALWAYS hh:mm:ss
*/

import { doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

const CONFIG = {
  discord: { userId: "850815059093356594" },
  twitch:  { username: "calebkritzar" },
  reddit:  { username: "Maleficent_Line6570" },
};

/* =========================
   SETTINGS
========================= */

const NON_SPOTIFY_PROGRESS_MODE = "indeterminate"; // "indeterminate" | "hide"
const SHOW_ALL_PREMID_ACTIVITIES = true;

/* =========================
   GLOBAL STATE
========================= */

let lastUpdateTime = null;
let lastPollTime   = Date.now();
let progressInterval = null;
let currentSpotifyUrl = null;

let tempBanner = null;
const TEMP_BANNER_MS = 15000;

let lastRedditPostId  = null;
let manualStatus = null;

let dynamicColorRequestId = 0;
let lastCoverUrl = null;
let lastSettingsRaw = null;

const $$ = (id) => document.getElementById(id);

/* =========================
   TIME FORMAT
========================= */

function fmt(seconds) {
  seconds = Math.max(0, Math.floor(seconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* =========================
   ICONS (with some safe fallbacks)
========================= */

const ICON_MAP = {
  // MUSIC
  spotify: "https://cdn.simpleicons.org/spotify/1DB954",
  apple_music: "https://cdn.simpleicons.org/applemusic/FA57C1",
  youtubemusic: "https://cdn.simpleicons.org/youtubemusic/FF0000",
  youtube: "https://cdn.simpleicons.org/youtube/FF0000",
  soundcloud: "https://cdn.simpleicons.org/soundcloud/FF5500",
  tidal: "https://cdn.simpleicons.org/tidal/000000",
  deezer: "https://cdn.simpleicons.org/deezer/FEAA2D",
  pandora: "https://cdn.simpleicons.org/pandora/224099",
  amazonmusic: "https://cdn.simpleicons.org/amazonmusic/00A8E1",
  bandcamp: "https://cdn.simpleicons.org/bandcamp/408294",
  audiomack: "https://cdn.simpleicons.org/audiomack/FFA200",

  // VIDEO / STREAMING
  netflix: "https://cdn.simpleicons.org/netflix/E50914",
  disneyplus: "https://cdn.simpleicons.org/disneyplus/113CCF",
  primevideo: "https://cdn.simpleicons.org/primevideo/1F2E3E",
  hulu: "https://cdn.simpleicons.org/hulu/1CE783",
  hbomax: "https://cdn.simpleicons.org/hbomax/3D1A78",
  peacock: "https://cdn.simpleicons.org/peacock/000000",
  paramountplus: "https://cdn.simpleicons.org/paramountplus/0064FF",
  crunchyroll: "https://cdn.simpleicons.org/crunchyroll/F47521",
  funimation: "https://cdn.simpleicons.org/funimation/5B0BB5",
  plex: "https://cdn.simpleicons.org/plex/E5A00D",
  jellyfin: "https://cdn.simpleicons.org/jellyfin/00A4DC",

  // SOCIAL
  discord: "https://cdn.simpleicons.org/discord/5865F2",
  reddit: "https://cdn.simpleicons.org/reddit/FF4500",
  x: "https://cdn.simpleicons.org/x/000000",
  twitter: "https://cdn.simpleicons.org/x/000000",
  instagram: "https://cdn.simpleicons.org/instagram/E4405F",
  tiktok: "https://cdn.simpleicons.org/tiktok/000000",
  facebook: "https://cdn.simpleicons.org/facebook/1877F2",
  messenger: "https://cdn.simpleicons.org/messenger/00B2FF",
  snapchat: "https://cdn.simpleicons.org/snapchat/FFFC00",
  whatsapp: "https://cdn.simpleicons.org/whatsapp/25D366",
  telegram: "https://cdn.simpleicons.org/telegram/26A5E4",
  signal: "https://cdn.simpleicons.org/signal/3A76F0",

  // LIVE / CREATOR
  twitch: "https://cdn.simpleicons.org/twitch/9146FF",
  kick: "https://cdn.simpleicons.org/kick/53FC19",
  patreon: "https://cdn.simpleicons.org/patreon/F96854",
  ko_fi: "https://cdn.simpleicons.org/kofi/FF5E5B",

  // GAMING / LAUNCHERS
  steam: "https://cdn.simpleicons.org/steam/000000",
  epicgames: "https://cdn.simpleicons.org/epicgames/000000",
  gog: "https://cdn.simpleicons.org/gogdotcom/86328A",
  ubisoft: "https://cdn.simpleicons.org/ubisoft/000000",
  ea: "https://cdn.simpleicons.org/electronicarts/000000",
  battlenet: "https://cdn.simpleicons.org/battledotnet/148EFF",
  roblox: "https://cdn.simpleicons.org/roblox/000000",
  minecraft: "https://cdn.simpleicons.org/minecraft/62B47A",

  // DEV / PRODUCTIVITY
  github: "https://cdn.simpleicons.org/github/000000",
  gitlab: "https://cdn.simpleicons.org/gitlab/FC6D26",
  bitbucket: "https://cdn.simpleicons.org/bitbucket/0052CC",
  stackoverflow: "https://cdn.simpleicons.org/stackoverflow/F58025",
  vscode: "https://cdn.simpleicons.org/visualstudiocode/007ACC",
  replit: "https://cdn.simpleicons.org/replit/F26207",
  vercel: "https://cdn.simpleicons.org/vercel/000000",
  netlify: "https://cdn.simpleicons.org/netlify/00C7B7",
  firebase: "https://cdn.simpleicons.org/firebase/FFCA28",
  notion: "https://cdn.simpleicons.org/notion/000000",
  trello: "https://cdn.simpleicons.org/trello/0052CC",
  slack: "https://cdn.simpleicons.org/slack/4A154B",
  zoom: "https://cdn.simpleicons.org/zoom/2D8CFF",

  // GOOGLE / MICROSOFT
  google: "https://cdn.simpleicons.org/google/4285F4",
  googledocs: "https://cdn.simpleicons.org/googledocs/4285F4",
  googlesheets: "https://cdn.simpleicons.org/googlesheets/34A853",
  googleslides: "https://cdn.simpleicons.org/googleslides/FBBC04",
  googlemeet: "https://cdn.simpleicons.org/googlemeet/00897B",
  googlemaps: "https://cdn.simpleicons.org/googlemaps/4285F4",
  gmail: "https://cdn.simpleicons.org/gmail/EA4335",
  outlook: "https://cdn.simpleicons.org/microsoftoutlook/0078D4",
  teams: "https://cdn.simpleicons.org/microsoftteams/6264A7",
  onedrive: "https://cdn.simpleicons.org/microsoftonedrive/0078D4",

  // SHOPPING / MARKETPLACES
  amazon: "https://cdn.simpleicons.org/amazon/FF9900",
  ebay: "https://cdn.simpleicons.org/ebay/E53238",
  walmart: "https://cdn.simpleicons.org/walmart/0071CE",
  target: "https://cdn.simpleicons.org/target/CC0000",
  bestbuy: "https://cdn.simpleicons.org/bestbuy/003B64",
  etsy: "https://cdn.simpleicons.org/etsy/F16521",
  aliexpress: "https://cdn.simpleicons.org/aliexpress/FF4747",
  temu: "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/shopping-cart.svg",
  shein: "https://cdn.simpleicons.org/shein/000000",
  wayfair: "https://cdn.simpleicons.org/wayfair/7F187F",
  homedepot: "https://cdn.simpleicons.org/homedepot/F96302",
  lowes: "https://cdn.simpleicons.org/lowes/004990",
  costco: "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/shopping-cart.svg",
  samsclub: "https://cdn.simpleicons.org/samsclub/004B87",
  ikea: "https://cdn.simpleicons.org/ikea/0058A3",
  chewy: "https://cdn.simpleicons.org/chewy/0055A5",
  newegg: "https://cdn.simpleicons.org/newegg/FF6600",
  microcenter: "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/cpu.svg",

  // PAYMENTS
  paypal: "https://cdn.simpleicons.org/paypal/00457C",
  venmo: "https://cdn.simpleicons.org/venmo/3D95CE",
  cashapp: "https://cdn.simpleicons.org/cashapp/00C244",
  applepay: "https://cdn.simpleicons.org/applepay/000000",
  googlepay: "https://cdn.simpleicons.org/googlepay/4285F4",
  stripe: "https://cdn.simpleicons.org/stripe/008CDD",
  klarna: "https://cdn.simpleicons.org/klarna/FFB3C7",
  affirm: "https://cdn.simpleicons.org/affirm/000000",

  // FOOD / DELIVERY
  doordash: "https://cdn.simpleicons.org/doordash/FF3008",
  ubereats: "https://cdn.simpleicons.org/ubereats/000000",
  grubhub: "https://cdn.simpleicons.org/grubhub/F63440",
  postmates: "https://cdn.simpleicons.org/postmates/000000",
  instacart: "https://cdn.simpleicons.org/instacart/43B02A",

  // TRAVEL
  airbnb: "https://cdn.simpleicons.org/airbnb/FF5A5F",
  booking: "https://cdn.simpleicons.org/bookingdotcom/003580",
  expedia: "https://cdn.simpleicons.org/expedia/00355F",
  uber: "https://cdn.simpleicons.org/uber/000000",
  lyft: "https://cdn.simpleicons.org/lyft/FF00BF",

  // FALLBACKS
  activity: "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/activity.svg",
  music: "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/music.svg",
  manual: "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
  default: "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
};

/* Safe image set so icons never go blank */
function setImgWithFallback(imgEl, primaryUrl, fallbackUrl) {
  if (!imgEl) return;
  imgEl.onerror = null;
  imgEl.src = primaryUrl;
  imgEl.onerror = () => {
    imgEl.onerror = null;
    imgEl.src = fallbackUrl || ICON_MAP.default;
  };
}

/* =========================
   SETTINGS HELPERS
========================= */

function getWebsiteSettings() {
  try { return JSON.parse(localStorage.getItem("websiteSettings") || "{}"); }
  catch { return {}; }
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

/* =========================
   PREMiD RESOLVER
========================= */

function normAppName(s = "") {
  return String(s || "").trim().toLowerCase();
}

const PREMID_RULES = [
  // MUSIC
  { re: /spotify/i, key: "spotify", pretty: "Spotify" },
  { re: /apple\s*music|itunes/i, key: "apple_music", pretty: "Apple Music" },
  { re: /amazon\s*music|prime\s*music/i, key: "amazonmusic", pretty: "Amazon Music" },
  { re: /soundcloud/i, key: "soundcloud", pretty: "SoundCloud" },
  { re: /tidal/i, key: "tidal", pretty: "TIDAL" },
  { re: /deezer/i, key: "deezer", pretty: "Deezer" },
  { re: /pandora/i, key: "pandora", pretty: "Pandora" },
  { re: /bandcamp/i, key: "bandcamp", pretty: "Bandcamp" },
  { re: /audiomack/i, key: "audiomack", pretty: "Audiomack" },

  // YOUTUBE
  { re: /youtube\s*music|yt\s*music|youtubemusic/i, key: "youtubemusic", pretty: "YouTube Music" },
  { re: /youtube/i, key: "youtube", pretty: "YouTube" },

  // VIDEO / STREAMING
  { re: /netflix/i, key: "netflix", pretty: "Netflix" },
  { re: /disney\+|disneyplus/i, key: "disneyplus", pretty: "Disney+" },
  { re: /prime\s*video|amazon\s*prime\s*video/i, key: "primevideo", pretty: "Prime Video" },
  { re: /hulu/i, key: "hulu", pretty: "Hulu" },
  { re: /\bhbo\b|hbo\s*max|max\b/i, key: "hbomax", pretty: "Max" },
  { re: /peacock/i, key: "peacock", pretty: "Peacock" },
  { re: /paramount\+|paramountplus/i, key: "paramountplus", pretty: "Paramount+" },
  { re: /crunchyroll/i, key: "crunchyroll", pretty: "Crunchyroll" },
  { re: /funimation/i, key: "funimation", pretty: "Funimation" },
  { re: /plex/i, key: "plex", pretty: "Plex" },
  { re: /jellyfin/i, key: "jellyfin", pretty: "Jellyfin" },

  // SOCIAL / COMMS
  { re: /discord/i, key: "discord", pretty: "Discord" },
  { re: /reddit/i, key: "reddit", pretty: "Reddit" },
  { re: /^x$|twitter/i, key: "x", pretty: "X" },
  { re: /instagram/i, key: "instagram", pretty: "Instagram" },
  { re: /tiktok/i, key: "tiktok", pretty: "TikTok" },
  { re: /facebook/i, key: "facebook", pretty: "Facebook" },
  { re: /messenger/i, key: "messenger", pretty: "Messenger" },
  { re: /snapchat/i, key: "snapchat", pretty: "Snapchat" },
  { re: /whatsapp/i, key: "whatsapp", pretty: "WhatsApp" },
  { re: /telegram/i, key: "telegram", pretty: "Telegram" },
  { re: /signal/i, key: "signal", pretty: "Signal" },

  // LIVE / CREATOR
  { re: /twitch/i, key: "twitch", pretty: "Twitch" },
  { re: /\bkick\b/i, key: "kick", pretty: "Kick" },
  { re: /patreon/i, key: "patreon", pretty: "Patreon" },
  { re: /ko-?fi|kofi/i, key: "ko_fi", pretty: "Ko-fi" },

  // GAMING / LAUNCHERS
  { re: /steam/i, key: "steam", pretty: "Steam" },
  { re: /epic\s*games|epicgames/i, key: "epicgames", pretty: "Epic Games" },
  { re: /\bgog\b|gog\.com|gogdotcom/i, key: "gog", pretty: "GOG" },
  { re: /ubisoft/i, key: "ubisoft", pretty: "Ubisoft" },
  { re: /\bea\b|electronic\s*arts/i, key: "ea", pretty: "EA" },
  { re: /battle\.?net|battlenet/i, key: "battlenet", pretty: "Battle.net" },
  { re: /roblox/i, key: "roblox", pretty: "Roblox" },
  { re: /minecraft/i, key: "minecraft", pretty: "Minecraft" },

  // DEV / PRODUCTIVITY
  { re: /github/i, key: "github", pretty: "GitHub" },
  { re: /gitlab/i, key: "gitlab", pretty: "GitLab" },
  { re: /bitbucket/i, key: "bitbucket", pretty: "Bitbucket" },
  { re: /stack\s*overflow/i, key: "stackoverflow", pretty: "Stack Overflow" },
  { re: /visual\s*studio\s*code|vscode/i, key: "vscode", pretty: "VS Code" },
  { re: /replit/i, key: "replit", pretty: "Replit" },
  { re: /vercel/i, key: "vercel", pretty: "Vercel" },
  { re: /netlify/i, key: "netlify", pretty: "Netlify" },
  { re: /firebase/i, key: "firebase", pretty: "Firebase" },
  { re: /notion/i, key: "notion", pretty: "Notion" },
  { re: /trello/i, key: "trello", pretty: "Trello" },
  { re: /slack/i, key: "slack", pretty: "Slack" },
  { re: /zoom/i, key: "zoom", pretty: "Zoom" },

  // GOOGLE / MICROSOFT
  { re: /google\s*docs|docs\.google/i, key: "googledocs", pretty: "Google Docs" },
  { re: /google\s*sheets|sheets\.google/i, key: "googlesheets", pretty: "Google Sheets" },
  { re: /google\s*slides|slides\.google/i, key: "googleslides", pretty: "Google Slides" },
  { re: /google\s*meet|meet\.google/i, key: "googlemeet", pretty: "Google Meet" },
  { re: /google\s*maps|maps\.google/i, key: "googlemaps", pretty: "Google Maps" },
  { re: /\bgmail\b/i, key: "gmail", pretty: "Gmail" },
  { re: /outlook/i, key: "outlook", pretty: "Outlook" },
  { re: /microsoft\s*teams|\bteams\b/i, key: "teams", pretty: "Microsoft Teams" },
  { re: /one\s*drive|onedrive/i, key: "onedrive", pretty: "OneDrive" },

  // SHOPPING / MARKETPLACES
  { re: /\bamazon\b/i, key: "amazon", pretty: "Amazon" },
  { re: /\bebay\b/i, key: "ebay", pretty: "eBay" },
  { re: /\bwalmart\b/i, key: "walmart", pretty: "Walmart" },
  { re: /\btarget\b/i, key: "target", pretty: "Target" },
  { re: /best\s*buy|bestbuy/i, key: "bestbuy", pretty: "Best Buy" },
  { re: /\betsi\b/i, key: "etsy", pretty: "Etsy" },
  { re: /ali\s*express|aliexpress/i, key: "aliexpress", pretty: "AliExpress" },
  { re: /\btemu\b/i, key: "temu", pretty: "Temu" },
  { re: /\bshein\b/i, key: "shein", pretty: "SHEIN" },
  { re: /\bwayfair\b/i, key: "wayfair", pretty: "Wayfair" },
  { re: /home\s*depot|homedepot/i, key: "homedepot", pretty: "Home Depot" },
  { re: /\blowe'?s\b|\blowes\b/i, key: "lowes", pretty: "Lowe’s" },
  { re: /\bcostco\b/i, key: "costco", pretty: "Costco" },
  { re: /sam'?s\s*club|samsclub/i, key: "samsclub", pretty: "Sam’s Club" },
  { re: /\bikea\b/i, key: "ikea", pretty: "IKEA" },
  { re: /\bchewy\b/i, key: "chewy", pretty: "Chewy" },
  { re: /new\s*egg|newegg/i, key: "newegg", pretty: "Newegg" },
  { re: /micro\s*center|microcenter/i, key: "microcenter", pretty: "Micro Center" },

  // PAYMENTS
  { re: /paypal/i, key: "paypal", pretty: "PayPal" },
  { re: /\bvenmo\b/i, key: "venmo", pretty: "Venmo" },
  { re: /cash\s*app|cashapp/i, key: "cashapp", pretty: "Cash App" },
  { re: /apple\s*pay|applepay/i, key: "applepay", pretty: "Apple Pay" },
  { re: /google\s*pay|googlepay/i, key: "googlepay", pretty: "Google Pay" },
  { re: /\bstripe\b/i, key: "stripe", pretty: "Stripe" },
  { re: /\bklarna\b/i, key: "klarna", pretty: "Klarna" },
  { re: /\baffirm\b/i, key: "affirm", pretty: "Affirm" },

  // FOOD / DELIVERY
  { re: /door\s*dash|doordash/i, key: "doordash", pretty: "DoorDash" },
  { re: /uber\s*eats|ubereats/i, key: "ubereats", pretty: "Uber Eats" },
  { re: /grubhub/i, key: "grubhub", pretty: "Grubhub" },
  { re: /postmates/i, key: "postmates", pretty: "Postmates" },
  { re: /instacart/i, key: "instacart", pretty: "Instacart" },

  // TRAVEL
  { re: /airbnb/i, key: "airbnb", pretty: "Airbnb" },
  { re: /booking\.?com|booking/i, key: "booking", pretty: "Booking.com" },
  { re: /expedia/i, key: "expedia", pretty: "Expedia" },
  { re: /\buber\b/i, key: "uber", pretty: "Uber" },
  { re: /\blyft\b/i, key: "lyft", pretty: "Lyft" },
];

function resolvePremidMeta(appName = "", act = null) {
  const raw = appName || act?.name || "";
  const n = normAppName(raw);

  for (const rule of PREMID_RULES) {
    if (rule.re.test(n)) return { key: rule.key, pretty: rule.pretty };
  }
  return { key: "activity", pretty: raw?.trim() || "Activity" };
}

/* =========================
   UI HELPERS
========================= */

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
    setImgWithFallback(icon, iconUrl, ICON_MAP.default);
    icon.alt = `${source} icon`;
    txt.textContent = text;

    icon.classList.remove("glow");
    if (["spotify", "twitch", "music", "youtube", "youtubemusic"].includes(source)) {
      icon.classList.add("glow");
    }

    line.style.opacity = "1";

    lastUpdateTime = Date.now();
    localStorage.setItem("lastStatus", JSON.stringify({ text, source, timestamp: lastUpdateTime }));
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

/* =========================
   PROGRESS BAR
========================= */

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

/* =========================
   DYNAMIC COLORS
========================= */

function updateDynamicColors(imageUrl) {
  const activity = document.querySelector(".live-activity");
  if (!activity) return;

  const settings = getWebsiteSettings();
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

/* =========================
   ANIMATION HELPERS
========================= */

function slideInCard(cardEl) {
  if (!cardEl) return;
  cardEl.classList.remove("slide-out", "hidden");
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
      cardEl.classList.add("hidden");
    }
  }, 360);
}

function isManualActive() {
  if (!manualStatus?.enabled) return false;
  const exp = manualStatus.expiresAt;
  if (!exp || typeof exp !== "number" || Number.isNaN(exp)) return true;
  return Date.now() < exp;
}

/* =========================
   ACTIVITY LABELING
========================= */

function getActivityVerb(appName = "", act = null) {
  const n = (appName || "").toLowerCase();

  // Music apps
  if (
    n.includes("youtube music") ||
    n.includes("spotify") ||
    n.includes("apple music") ||
    n.includes("soundcloud") ||
    n.includes("tidal") ||
    n.includes("deezer") ||
    n.includes("pandora") ||
    n.includes("amazon music")
  ) return "Listening to";

  // YouTube listening vs watching
  if (n.includes("youtube")) {
    if (act && isYouTubeMusicLike(act)) return "Listening to";
    return "Watching";
  }

  // Streaming video
  if (
    n.includes("twitch") ||
    n.includes("netflix") ||
    n.includes("hulu") ||
    n.includes("disney") ||
    n.includes("prime video") ||
    n.includes("max") ||
    n.includes("peacock") ||
    n.includes("paramount")
  ) return "Watching";

  // Shopping
  if (
    n.includes("amazon") || n.includes("ebay") || n.includes("walmart") || n.includes("target") ||
    n.includes("etsy") || n.includes("aliexpress") || n.includes("temu") || n.includes("shein") ||
    n.includes("best buy") || n.includes("newegg") || n.includes("micro center") ||
    n.includes("ikea") || n.includes("costco") || n.includes("sam’s") || n.includes("sams") ||
    n.includes("home depot") || n.includes("lowe")
  ) return "Shopping on";

  // Payments
  if (
    n.includes("paypal") || n.includes("venmo") || n.includes("cash app") ||
    n.includes("apple pay") || n.includes("google pay") || n.includes("stripe") ||
    n.includes("klarna") || n.includes("affirm")
  ) return "Paying with";

  // Delivery
  if (
    n.includes("doordash") || n.includes("uber eats") || n.includes("grubhub") ||
    n.includes("postmates") || n.includes("instacart")
  ) return "Ordering on";

  // Browsing / socials
  if (n.includes("reddit")) return "Browsing";
  if (n === "x" || n.includes("twitter") || n.includes("instagram") || n.includes("tiktok") || n.includes("facebook")) return "Scrolling";

  return "Active on";
}

function isYouTubeMusicLike(act) {
  if (!act) return false;

  const name = (act.name || "").toLowerCase();
  if (!name.includes("youtube")) return false;

  const title = (act.details || "").trim();
  const state = (act.state || "").trim();
  const largeText = (act?.assets?.large_text || "").trim();

  const t = title.toLowerCase();
  const s = state.toLowerCase();
  const l = largeText.toLowerCase();

  // Strong music keywords (ONLY these trigger music mode)
  const strongMusicSignals = [
    "lyrics", "lyric video", "official lyrics",
    "official audio", "audio",
    "music video", "official music video",
    "vevo",
    "provided to youtube",
    "topic",                 // auto-generated music channels often include "Topic"
    "album", "full album",
    "track", "single",
    "remastered"
  ];

  const hay = `${t} ${s} ${l}`;

  // If we see any strong signal anywhere, it's music-like
  if (strongMusicSignals.some(k => hay.includes(k))) return true;

  // Obvious music formatting in the TITLE: "Song - Artist"
  // (This is a very common pattern for music uploads)
  const hasDashFormat =
    t.includes(" - ") &&
    t.split(" - ").every(part => part.trim().length >= 2);

  if (hasDashFormat) return true;

  // Some presences put the artist in state and the track in details.
  // Only treat as music if BOTH look like music fields (avoid short-channel false positives).
  const detailsLooksLikeTrack =
    t.length >= 6 && (t.includes(" - ") || t.includes(" by ") || t.includes(" • "));
  const stateLooksLikeArtist =
    s.length >= 3 && s.length <= 80 && !s.includes("watching") && !s.includes("views");

  if (detailsLooksLikeTrack && stateLooksLikeArtist) return true;

  // Otherwise: assume normal YouTube video
  return false;
}

/* =========================
   DISCORD / SPOTIFY + PreMiD
========================= */

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
  if (act.type === 2) return true;

  const name = (act.name || "").toLowerCase();
  const details = (act.details || "").toLowerCase();
  const state = (act.state || "").toLowerCase();
  const largeText = (act?.assets?.large_text || "").toLowerCase();
  const hay = `${name} ${details} ${state} ${largeText}`.trim();

  if (MUSIC_KEYWORDS.some(k => hay.includes(k))) return true;
  if (details.includes(" by ") || details.includes(" - ")) return true;
  if (name.includes("youtube") && isYouTubeMusicLike(act)) return true;

  return false;
}

function isIgnorableActivity(a) {
  if (!a) return true;
  if (a.type === 4) return true; // custom status
  const name = (a.name || "").toLowerCase();
  if (!name) return true;
  if (name === "discord") return true;
  return false;
}

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

    // 1) Spotify
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

    // 2) PreMiD / All activities
    if (SHOW_ALL_PREMID_ACTIVITIES) {
      const act = pickBestPremidActivity(data.activities || []);
      if (act) {
        slideInCard($$("spotify-card"));

        const appName = act.name || "Activity";

        const n = appName.toLowerCase();
        const isYTM = n.includes("youtube music") || n.includes("yt music") || n.includes("youtubemusic");
        const isYT  = n.includes("youtube");

        const title = act.details || appName;
        const sub   = act.state || act?.assets?.large_text || appName;

        $$("live-song-title").textContent  = title;
        $$("live-song-artist").textContent = sub;

        const coverUrl = resolveDiscordAssetUrl(act);
        const coverEl = $$("live-activity-cover");
        if (coverEl) {
          if (coverUrl) coverEl.src = coverUrl;
        }

        currentSpotifyUrl = null;

        const explicitEl = $$("explicit-badge");
        if (explicitEl) explicitEl.style.display = "none";

        resetProgress();
        if (isMusicActivity(act)) {
          const hasRealProgress = setupProgressFromActivityTimestamps(act);
          if (!hasRealProgress) setProgressVisibility(NON_SPOTIFY_PROGRESS_MODE);
        } else {
          setProgressVisibility("hide");
        }

        updateDynamicColors(coverUrl || null);

        const meta = resolvePremidMeta(appName, act);

        let prettyApp = meta.pretty;
        if (isYTM) prettyApp = "YouTube Music";
        else if (isYT) prettyApp = "YouTube";

        const verb = getActivityVerb(prettyApp, act);

        let source = meta.key;
        if (isYTM) source = "youtubemusic";
        else if (isYT) source = "youtube";

        const statusText = `${verb} ${prettyApp}`;
        return { text: statusText, source };
      }
    }

    // 3) Nothing else
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

/* =========================
   TWITCH
========================= */

async function getTwitch() {
  const u = CONFIG.twitch.username?.toLowerCase();
  if (!u) return null;

  const proxy = "https://corsproxy.io/?";
  const target = `https://decapi.me/twitch/uptime/${u}`;

  try {
    const res = await fetch(`${proxy}${encodeURIComponent(target)}?_=${Date.now()}`);
    const text = (await res.text()).toLowerCase();

    const isOffline =
      text.includes("offline") || text.includes("not live") || text.includes("not found") || !text.trim();

    return isOffline ? null : { live: true };
  } catch (e) {
    console.warn("Twitch check failed:", e);
    return null;
  }
}

/* =========================
   REDDIT
========================= */

async function getReddit() {
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

/* =========================
   MANUAL FIRESTORE
========================= */

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

/* =========================
   STATUS PRIORITY
========================= */

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

/* =========================
   MAIN LOOP
========================= */

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

/* =========================
   INIT
========================= */

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
    } catch (e) {
      console.warn("Failed to restore last status:", e);
    }
  }

  watchWebsiteSettings();
  setInterval(watchWebsiteSettings, 300);

  setTimeout(() => { mainLoop(); }, 50);

  setInterval(mainLoop, 30000);
  setInterval(updateLastUpdated, 1000);
});
