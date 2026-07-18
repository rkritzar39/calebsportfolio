/* live-activity.js — Apple Music style dynamic accent version
   Spotify via Lanyard (real timestamps -> real progress)
   PreMiD via Lanyard activities[] (show ALL activities)
   Manual Firestore overrides everything
   Twitch via decapi uptime
   Reddit one-time banner per new post
   Settings apply instantly (same tab)
   Match song accent OFF => user accentColor
   Match song accent ON  => Apple Music style cover-art ambient tint
   Time format ALWAYS h:mm:ss
*/

import { doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

const CONFIG = {
  discord: { userId: "850815059093356594" },
  twitch: { username: "calebkritzar" },
  reddit: { username: "Maleficent_Line6570" },
};

const NON_SPOTIFY_PROGRESS_MODE = "indeterminate"; // "indeterminate" | "hide"
const SHOW_ALL_PREMID_ACTIVITIES = true;
const TEMP_BANNER_MS = 15000;

let lastUpdateTime = null;
let lastPollTime = Date.now();
let progressInterval = null;
let currentSpotifyUrl = null;

let tempBanner = null;
let manualStatus = null;

let dynamicColorRequestId = 0;
let lastCoverUrl = null;
let lastSettingsRaw = null;

const $$ = (id) => document.getElementById(id);

function els() {
  return {
    liveActivity: $$("live-activity"),
    spotifyCard: $$("spotify-card"),
    statusLine: $$("status-line"),
    statusIcon: $$("status-icon"),
    statusText: $$("status-line-text"),
    cover: $$("live-activity-cover"),
    title: $$("live-song-title"),
    artist: $$("live-song-artist"),
    explicit: $$("explicit-badge"),
    progressBar: $$("music-progress-bar"),
    elapsed: $$("elapsed-time"),
    remaining: $$("remaining-time"),
    total: $$("total-time"),
    updated: $$("live-activity-updated"),
  };
}

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
   ICONS
========================= */

const ICON_MAP = {
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

  twitch: "https://cdn.simpleicons.org/twitch/9146FF",
  kick: "https://cdn.simpleicons.org/kick/53FC19",
  patreon: "https://cdn.simpleicons.org/patreon/F96854",
  ko_fi: "https://cdn.simpleicons.org/kofi/FF5E5B",

  steam: "https://cdn.simpleicons.org/steam/000000",
  epicgames: "https://cdn.simpleicons.org/epicgames/000000",
  gog: "https://cdn.simpleicons.org/gogdotcom/86328A",
  ubisoft: "https://cdn.simpleicons.org/ubisoft/000000",
  ea: "https://cdn.simpleicons.org/electronicarts/000000",
  battlenet: "https://cdn.simpleicons.org/battledotnet/148EFF",
  roblox: "https://cdn.simpleicons.org/roblox/000000",
  minecraft: "https://cdn.simpleicons.org/minecraft/62B47A",

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

  paypal: "https://cdn.simpleicons.org/paypal/00457C",
  venmo: "https://cdn.simpleicons.org/venmo/3D95CE",
  cashapp: "https://cdn.simpleicons.org/cashapp/00C244",
  applepay: "https://cdn.simpleicons.org/applepay/000000",
  googlepay: "https://cdn.simpleicons.org/googlepay/4285F4",
  stripe: "https://cdn.simpleicons.org/stripe/008CDD",
  klarna: "https://cdn.simpleicons.org/klarna/FFB3C7",
  affirm: "https://cdn.simpleicons.org/affirm/000000",

  doordash: "https://cdn.simpleicons.org/doordash/FF3008",
  ubereats: "https://cdn.simpleicons.org/ubereats/000000",
  grubhub: "https://cdn.simpleicons.org/grubhub/F63440",
  postmates: "https://cdn.simpleicons.org/postmates/000000",
  instacart: "https://cdn.simpleicons.org/instacart/43B02A",

  airbnb: "https://cdn.simpleicons.org/airbnb/FF5A5F",
  booking: "https://cdn.simpleicons.org/bookingdotcom/003580",
  expedia: "https://cdn.simpleicons.org/expedia/00355F",
  uber: "https://cdn.simpleicons.org/uber/000000",
  lyft: "https://cdn.simpleicons.org/lyft/FF00BF",

  activity: "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/activity.svg",
  music: "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/music.svg",
  manual: "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
  default: "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
};

function setImgWithFallback(imgEl, primaryUrl, fallbackUrl) {
  if (!imgEl) return;
  imgEl.onerror = null;
  imgEl.src = primaryUrl || fallbackUrl || ICON_MAP.default;
  imgEl.onerror = () => {
    imgEl.onerror = null;
    imgEl.src = fallbackUrl || ICON_MAP.default;
  };
}

/* =========================
   SETTINGS HELPERS
========================= */

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

function getUserAccent() {
  const settings = getWebsiteSettings();
  return settings.accentColor || "#1DB954";
}

function applySongThemeClass() {
  const { liveActivity } = els();
  if (!liveActivity) return;

  const settings = getWebsiteSettings();
  const matchAccent = settings.matchSongAccent === "enabled";
  const userAccent = settings.accentColor || "#1DB954";

  liveActivity.classList.toggle("song-theme-off", !matchAccent);

  if (!matchAccent) {
    liveActivity.style.setProperty("--dynamic-accent", userAccent);
    liveActivity.style.setProperty("--dynamic-accent-soft", userAccent);
    liveActivity.style.setProperty("--dynamic-accent-glow", userAccent);
    liveActivity.style.setProperty("--dynamic-bg", "none");
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
  { re: /spotify/i, key: "spotify", pretty: "Spotify" },
  { re: /apple\s*music|itunes/i, key: "apple_music", pretty: "Apple Music" },
  { re: /amazon\s*music|prime\s*music/i, key: "amazonmusic", pretty: "Amazon Music" },
  { re: /soundcloud/i, key: "soundcloud", pretty: "SoundCloud" },
  { re: /tidal/i, key: "tidal", pretty: "TIDAL" },
  { re: /deezer/i, key: "deezer", pretty: "Deezer" },
  { re: /pandora/i, key: "pandora", pretty: "Pandora" },
  { re: /bandcamp/i, key: "bandcamp", pretty: "Bandcamp" },
  { re: /audiomack/i, key: "audiomack", pretty: "Audiomack" },

  { re: /youtube\s*music|yt\s*music|youtubemusic/i, key: "youtubemusic", pretty: "YouTube Music" },
  { re: /youtube/i, key: "youtube", pretty: "YouTube" },

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

  { re: /twitch/i, key: "twitch", pretty: "Twitch" },
  { re: /\bkick\b/i, key: "kick", pretty: "Kick" },
  { re: /patreon/i, key: "patreon", pretty: "Patreon" },
  { re: /ko-?fi|kofi/i, key: "ko_fi", pretty: "Ko-fi" },

  { re: /steam/i, key: "steam", pretty: "Steam" },
  { re: /epic\s*games|epicgames/i, key: "epicgames", pretty: "Epic Games" },
  { re: /\bgog\b|gog\.com|gogdotcom/i, key: "gog", pretty: "GOG" },
  { re: /ubisoft/i, key: "ubisoft", pretty: "Ubisoft" },
  { re: /\bea\b|electronic\s*arts/i, key: "ea", pretty: "EA" },
  { re: /battle\.?net|battlenet/i, key: "battlenet", pretty: "Battle.net" },
  { re: /roblox/i, key: "roblox", pretty: "Roblox" },
  { re: /minecraft/i, key: "minecraft", pretty: "Minecraft" },

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

  { re: /google\s*docs|docs\.google/i, key: "googledocs", pretty: "Google Docs" },
  { re: /google\s*sheets|sheets\.google/i, key: "googlesheets", pretty: "Google Sheets" },
  { re: /google\s*slides|slides\.google/i, key: "googleslides", pretty: "Google Slides" },
  { re: /google\s*meet|meet\.google/i, key: "googlemeet", pretty: "Google Meet" },
  { re: /google\s*maps|maps\.google/i, key: "googlemaps", pretty: "Google Maps" },
  { re: /\bgmail\b/i, key: "gmail", pretty: "Gmail" },
  { re: /outlook/i, key: "outlook", pretty: "Outlook" },
  { re: /microsoft\s*teams|\bteams\b/i, key: "teams", pretty: "Microsoft Teams" },
  { re: /one\s*drive|onedrive/i, key: "onedrive", pretty: "OneDrive" },

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

  { re: /paypal/i, key: "paypal", pretty: "PayPal" },
  { re: /\bvenmo\b/i, key: "venmo", pretty: "Venmo" },
  { re: /cash\s*app|cashapp/i, key: "cashapp", pretty: "Cash App" },
  { re: /apple\s*pay|applepay/i, key: "applepay", pretty: "Apple Pay" },
  { re: /google\s*pay|googlepay/i, key: "googlepay", pretty: "Google Pay" },
  { re: /\bstripe\b/i, key: "stripe", pretty: "Stripe" },
  { re: /\bklarna\b/i, key: "klarna", pretty: "Klarna" },
  { re: /\baffirm\b/i, key: "affirm", pretty: "Affirm" },

  { re: /door\s*dash|doordash/i, key: "doordash", pretty: "DoorDash" },
  { re: /uber\s*eats|ubereats/i, key: "ubereats", pretty: "Uber Eats" },
  { re: /grubhub/i, key: "grubhub", pretty: "GrubHub" },
  { re: /postmates/i, key: "postmates", pretty: "Postmates" },
  { re: /instacart/i, key: "instacart", pretty: "Instacart" },

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
  const { statusText, statusLine, statusIcon } = els();
  if (!statusText || !statusLine || !statusIcon) return;

  if (statusText.textContent === text && statusIcon.alt === `${source} icon`) return;

  const iconUrl = ICON_MAP[source] || ICON_MAP.default;

  statusLine.style.transition = "opacity .22s ease";
  statusLine.style.opacity = "0";

  setTimeout(() => {
    setImgWithFallback(statusIcon, iconUrl, ICON_MAP.default);
    statusIcon.alt = `${source} icon`;
    statusText.textContent = text;

    statusIcon.classList.remove("glow");
    if (["spotify", "twitch", "music", "youtube", "youtubemusic"].includes(source)) {
      statusIcon.classList.add("glow");
    }

    statusLine.style.opacity = "1";

    lastUpdateTime = Date.now();
    localStorage.setItem("lastStatus", JSON.stringify({
      text,
      source,
      timestamp: lastUpdateTime
    }));
  }, 180);
}

function updateLastUpdated() {
  const { updated } = els();
  if (!updated) return;

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

  if (s < 5) updated.textContent = "Updated just now";
  else if (s < 60) updated.textContent = `Updated ${s}s ago`;
  else if (s < 3600) updated.textContent = `Updated ${Math.floor(s / 60)}m ago`;
  else updated.textContent = `Updated ${Math.floor(s / 3600)}h ago`;
}

/* =========================
   CARD / PROGRESS
========================= */

function getProgressNodes() {
  return {
    barWrap: document.querySelector(".music-progress-container"),
    timeRow: document.querySelector(".music-progress-time"),
    bar: $$("music-progress-bar"),
    elapsed: $$("elapsed-time"),
    remain: $$("remaining-time"),
    total: $$("total-time"),
  };
}

function setProgressVisibility(mode) {
  const { barWrap, timeRow } = getProgressNodes();
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
  const { bar, elapsed, remain, total, barWrap } = getProgressNodes();

  if (bar) bar.style.width = "0%";
  if (barWrap) barWrap.classList.remove("indeterminate");

  clearInterval(progressInterval);
  progressInterval = null;

  if (elapsed) elapsed.textContent = "0:00:00";
  if (remain) remain.textContent = "-0:00:00";
  if (total) total.textContent = "0:00:00";
}

function setupProgress(startMs, endMs) {
  const { bar, elapsed, remain, total, barWrap, timeRow } = getProgressNodes();
  if (!bar || !startMs || !endMs || endMs <= startMs) return;

  if (barWrap) {
    barWrap.classList.remove("indeterminate");
    barWrap.style.display = "";
  }
  if (timeRow) timeRow.style.display = "";

  const totalSec = Math.max((endMs - startMs) / 1000, 1);
  if (total) total.textContent = fmt(totalSec);

  clearInterval(progressInterval);

  function tick() {
    const now = Date.now();
    const elapsedSec = Math.min((now - startMs) / 1000, totalSec);
    const left = Math.max(totalSec - elapsedSec, 0);

    bar.style.width = `${(elapsedSec / totalSec) * 100}%`;
    if (elapsed) elapsed.textContent = fmt(elapsedSec);
    if (remain) remain.textContent = `-${fmt(left)}`;
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
  const endMs = toEpochMs(act?.timestamps?.end);
  if (!startMs || !endMs || endMs <= startMs) return false;
  setupProgress(startMs, endMs);
  return true;
}

function showCard() {
  const { spotifyCard } = els();
  if (!spotifyCard) return;
  spotifyCard.classList.remove("hidden", "slide-out");
  spotifyCard.classList.add("slide-in");
  spotifyCard.style.display = "";
  spotifyCard.style.opacity = "1";
}

function hideCard() {
  const { spotifyCard } = els();
  if (!spotifyCard) return;

  spotifyCard.classList.remove("slide-in");
  spotifyCard.classList.add("slide-out");

  setTimeout(() => {
    if (spotifyCard.classList.contains("slide-out")) {
      spotifyCard.style.opacity = "0";
      spotifyCard.style.display = "none";
      spotifyCard.classList.add("hidden");
    }
  }, 360);
}

function clearCardContent() {
  const { title, artist, explicit, cover } = els();
  if (title) title.textContent = "—";
  if (artist) artist.textContent = "—";
  if (explicit) explicit.style.display = "none";
  if (cover) cover.removeAttribute("src");
}

/* =========================
   DYNAMIC COLORS
========================= */

function updateDynamicColors(imageUrl) {
  const { liveActivity } = els();
  if (!liveActivity) return;

  const matchAccent = isMatchSongAccentEnabled();
  const userAccent = getUserAccent();

  if (imageUrl) lastCoverUrl = imageUrl;

  const requestId = ++dynamicColorRequestId;

  const resetColors = () => {
    liveActivity.style.setProperty("--dynamic-accent", userAccent);
    liveActivity.style.setProperty("--dynamic-accent-soft", userAccent);
    liveActivity.style.setProperty("--dynamic-accent-glow", userAccent);
    liveActivity.style.setProperty("--dynamic-bg", "none");
  };

  if (!matchAccent || !imageUrl) {
    resetColors();
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
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("No canvas context");

      canvas.width = 64;
      canvas.height = 64;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      let best = null;
      let bestScore = -Infinity;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 180) continue;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;

        const brightness = (r + g + b) / 3;
        const saturation = delta;

        if (brightness < 30 || brightness > 230) continue;
        if (saturation < 28) continue;

        const score =
          saturation * 1.35 +
          (255 - Math.abs(150 - brightness)) * 0.45;

        if (score > bestScore) {
          bestScore = score;
          best = { r, g, b };
        }
      }

      if (!best) {
        resetColors();
        return;
      }

      const soften = (value, amount = 0.18) =>
        Math.round(value + (255 - value) * amount);

      const deepen = (value, amount = 0.12) =>
        Math.round(value * (1 - amount));

      const primary = {
        r: soften(best.r, 0.10),
        g: soften(best.g, 0.10),
        b: soften(best.b, 0.10)
      };

      const soft = {
        r: soften(best.r, 0.28),
        g: soften(best.g, 0.28),
        b: soften(best.b, 0.28)
      };

      const glow = {
        r: soften(best.r, 0.18),
        g: soften(best.g, 0.18),
        b: soften(best.b, 0.18)
      };

      const shadow = {
        r: deepen(best.r, 0.20),
        g: deepen(best.g, 0.20),
        b: deepen(best.b, 0.20)
      };

      const primaryCss = `rgb(${primary.r}, ${primary.g}, ${primary.b})`;
      const softCss = `rgb(${soft.r}, ${soft.g}, ${soft.b})`;
      const glowCss = `rgb(${glow.r}, ${glow.g}, ${glow.b})`;

      liveActivity.style.setProperty("--dynamic-accent", primaryCss);
      liveActivity.style.setProperty("--dynamic-accent-soft", softCss);
      liveActivity.style.setProperty("--dynamic-accent-glow", glowCss);

      liveActivity.style.setProperty(
        "--dynamic-bg",
        `
        radial-gradient(
          circle at 50% 18%,
          rgba(${soft.r}, ${soft.g}, ${soft.b}, 0.30),
          transparent 56%
        ),
        radial-gradient(
          circle at 50% 100%,
          rgba(${shadow.r}, ${shadow.g}, ${shadow.b}, 0.18),
          transparent 70%
        ),
        linear-gradient(
          180deg,
          rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.18),
          rgba(${soft.r}, ${soft.g}, ${soft.b}, 0.08)
        )
        `
      );
    } catch (error) {
      console.warn("Dynamic color extraction failed:", error);
      resetColors();
    }
  };

  img.onerror = () => {
    if (requestId !== dynamicColorRequestId) return;
    resetColors();
  };
}

/* =========================
   MANUAL STATUS
========================= */

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

  if (n.includes("youtube")) {
    if (act && isYouTubeMusicLike(act)) return "Listening to";
    return "Watching";
  }

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

  if (
    n.includes("amazon") || n.includes("ebay") || n.includes("walmart") || n.includes("target") ||
    n.includes("etsy") || n.includes("aliexpress") || n.includes("temu") || n.includes("shein") ||
    n.includes("best buy") || n.includes("newegg") || n.includes("micro center") ||
    n.includes("ikea") || n.includes("costco") || n.includes("sam’s") || n.includes("sams") ||
    n.includes("home depot") || n.includes("lowe")
  ) return "Shopping on";

  if (
    n.includes("paypal") || n.includes("venmo") || n.includes("cash app") ||
    n.includes("apple pay") || n.includes("google pay") || n.includes("stripe") ||
    n.includes("klarna") || n.includes("affirm")
  ) return "Paying with";

  if (
    n.includes("doordash") || n.includes("uber eats") || n.includes("grubhub") ||
    n.includes("postmates") || n.includes("instacart")
  ) return "Ordering on";

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

  const strongMusicSignals = [
    "lyrics", "lyric video", "official lyrics",
    "official audio", "audio",
    "music video", "official music video",
    "vevo",
    "provided to youtube",
    "topic",
    "album", "full album",
    "track", "single",
    "remastered"
  ];

  const hay = `${t} ${s} ${l}`;
  if (strongMusicSignals.some(k => hay.includes(k))) return true;

  const hasDashFormat =
    t.includes(" - ") &&
    t.split(" - ").every(part => part.trim().length >= 2);

  if (hasDashFormat) return true;

  const detailsLooksLikeTrack =
    t.length >= 6 && (t.includes(" - ") || t.includes(" by ") || t.includes(" • "));
  const stateLooksLikeArtist =
    s.length >= 3 && s.length <= 80 && !s.includes("watching") && !s.includes("views");

  if (detailsLooksLikeTrack && stateLooksLikeArtist) return true;

  return false;
}

/* =========================
   DISCORD / SPOTIFY / PREMID
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
  if (a.type === 4) return true;
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

function renderSpotify(sp) {
  const { title, artist, cover, explicit } = els();

  showCard();

  if (title) title.textContent = sp.song || "Unknown";
  if (artist) artist.textContent = sp.artist || "Unknown";

  if (cover && cover.src !== sp.album_art_url) {
    setImgWithFallback(cover, sp.album_art_url, "");
  }

  currentSpotifyUrl = sp.track_id
    ? `https://open.spotify.com/track/${sp.track_id}`
    : null;

  const now = Date.now();
  const startMs = sp.timestamps?.start ?? now;
  const endMs = sp.timestamps?.end ?? (startMs + (sp.duration_ms || 0));

  resetProgress();
  setupProgress(startMs, endMs);
  updateDynamicColors(sp.album_art_url);

  if (explicit) {
    explicit.style.display = sp?.explicit ? "inline-flex" : "none";
  }

  return { text: "Listening to Spotify", source: "spotify" };
}

function renderPremid(act) {
  const { title, artist, cover, explicit } = els();

  showCard();

  const appName = act.name || "Activity";
  const n = appName.toLowerCase();
  const isYTM = n.includes("youtube music") || n.includes("yt music") || n.includes("youtubemusic");
  const isYT = n.includes("youtube");

  if (title) title.textContent = act.details || appName;
  if (artist) artist.textContent = act.state || act?.assets?.large_text || appName;

  const coverUrl = resolveDiscordAssetUrl(act);
  if (cover && coverUrl && cover.src !== coverUrl) {
    setImgWithFallback(cover, coverUrl, "");
  }

  currentSpotifyUrl = null;

  if (explicit) explicit.style.display = "none";

  resetProgress();

  const hasRealProgress = setupProgressFromActivityTimestamps(act);
  if (!hasRealProgress) {
    if (isMusicActivity(act) || isYouTubeMusicLike(act)) {
      setProgressVisibility(NON_SPOTIFY_PROGRESS_MODE);
    } else {
      setProgressVisibility("hide");
    }
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

  return { text: `${verb} ${prettyApp}`, source };
}

async function getDiscord() {
  if (isManualActive()) {
    hideCard();
    clearCardContent();
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

    if (data.spotify) {
      return renderSpotify(data.spotify);
    }

    if (SHOW_ALL_PREMID_ACTIVITIES) {
      const act = pickBestPremidActivity(data.activities || []);
      if (act) return renderPremid(act);
    }

    hideCard();
    clearCardContent();
    resetProgress();
    setProgressVisibility("hide");
    updateDynamicColors(null);

    const map = {
      online: "Online on Discord",
      idle: "Idle on Discord",
      dnd: "Do Not Disturb",
      offline: "No Current Active Activities",
    };

    return {
      text: map[data.discord_status] || "No Current Active Activities",
      source: "discord",
    };
  } catch (e) {
    console.warn("Lanyard error:", e);
    return null;
  }
}

/* =========================
   TWITCH / REDDIT
========================= */

async function getTwitch() {
  const u = CONFIG.twitch.username?.toLowerCase();
  if (!u) return null;

  const proxy = "https://corsproxy.io/?";
  const target = `https://decapi.me/twitch/uptime/${u}?_=${Date.now()}`;

  try {
    const res = await fetch(`${proxy}${encodeURIComponent(target)}`);
    if (!res.ok) return null;

    const text = (await res.text()).trim();

    if (
      !text ||
      text.toLowerCase().includes("offline") ||
      text.toLowerCase().includes("not found") ||
      text.toLowerCase().includes("not live")
    ) {
      return null;
    }

    if (!/\d/.test(text)) return null;

    return { live: true };
  } catch (e) {
    console.warn("Twitch check failed:", e);
    return null;
  }
}

async function getReddit() {
  const u = CONFIG.reddit.username;
  if (!u) return null;

  try {
    const r = await fetch(`https://www.reddit.com/user/${u}/submitted.json?limit=1`, {
      cache: "no-store"
    });
    if (!r.ok) throw new Error(`Reddit fetch ${r.status}`);

    const j = await r.json();
    const post = j?.data?.children?.[0]?.data;
    if (!post) return null;

    const lastShownId = localStorage.getItem("lastRedditShownId");
    if (post.id !== lastShownId) {
      localStorage.setItem("lastRedditShownId", post.id);
      return { text: "Shared on Reddit", source: "reddit", isTemp: true };
    }
  } catch (e) {
    console.warn("Reddit error:", e);
  }

  return null;
}

/* =========================
   FIRESTORE MANUAL STATUS
========================= */

try {
  const manualRef = doc(db, "manualStatus", "site");

  onSnapshot(
    manualRef,
    async (snap) => {
      if (!snap.exists()) {
        manualStatus = null;
        return;
      }

      const d = snap.data();

      if (d.expiresAt?.toMillis) d.expiresAt = d.expiresAt.toMillis();
      else if (typeof d.expiresAt !== "number") d.expiresAt = null;

      manualStatus = d;

      if (d.enabled && d.expiresAt && Date.now() >= d.expiresAt) {
        try {
          await setDoc(
            manualRef,
            {
              enabled: false,
              text: "",
              expiresAt: null,
              persistent: false,
              updated_at: Date.now()
            },
            { merge: true }
          );
        } catch (err) {
          console.warn("Failed to clear expired manual status:", err);
        }
        manualStatus = null;
      }
    },
    (err) => console.warn("manual listener error:", err)
  );
} catch (e) {
  console.warn("Firestore manual disabled:", e);
}

/* =========================
   STATUS DECISION
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

  if (twitchLive) {
    showStatusLineWithFade("Now Live on Twitch", "twitch");
    return;
  }

  const text = main?.text || "No Current Active Activities";
  const source = main?.source || "discord";
  showStatusLineWithFade(text, source);
}

/* =========================
   MAIN LOOP
========================= */

async function mainLoop() {
  applySongThemeClass();

  const [discord, twitch, reddit] = await Promise.all([
    getDiscord(),
    getTwitch(),
    getReddit()
  ]);

  const primary =
    (discord?.source === "manual") ? discord
    : (discord?.source === "spotify") ? discord
    : (discord?.source === "youtubemusic") ? discord
    : (discord?.source === "youtube") ? discord
    : (discord?.source === "music") ? discord
    : (discord?.source === "activity") ? discord
    : (discord || { text: "No Current Active Activities", source: "discord" });

  const tempHit = reddit?.isTemp ? reddit : null;

  if (tempHit) {
    tempBanner = {
      text: tempHit.text,
      source: tempHit.source,
      expiresAt: Date.now() + TEMP_BANNER_MS,
    };
  } else if (tempBanner && Date.now() >= tempBanner.expiresAt) {
    tempBanner = null;
  }

  applyStatusDecision({
    main: primary,
    twitchLive: !!twitch,
    temp: tempBanner
  });

  const { liveActivity } = els();
  liveActivity?.classList.remove("hidden");

  lastPollTime = Date.now();
}

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {
  applySongThemeClass();

  const { spotifyCard } = els();

  if (spotifyCard) {
    spotifyCard.addEventListener("click", () => {
      if (currentSpotifyUrl) {
        window.open(currentSpotifyUrl, "_blank", "noopener,noreferrer");
      }
    });

    spotifyCard.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && currentSpotifyUrl) {
        e.preventDefault();
        window.open(currentSpotifyUrl, "_blank", "noopener,noreferrer");
      }
    });
  }

  const saved = localStorage.getItem("lastStatus");
  if (saved) {
    try {
      const { text, source } = JSON.parse(saved);
      if (!isManualActive()) {
        showStatusLineWithFade(text, source);
      } else {
        showStatusLineWithFade(
          manualStatus?.text || "Status (manual)",
          manualStatus?.icon || "manual"
        );
      }
    } catch (e) {
      console.warn("Failed to restore last status:", e);
    }
  }

  watchWebsiteSettings();
  setInterval(watchWebsiteSettings, 300);

  setTimeout(() => {
    mainLoop();
  }, 50);

  setInterval(mainLoop, 30000);
  setInterval(updateLastUpdated, 1000);
});
