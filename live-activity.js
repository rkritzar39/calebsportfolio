import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/* ======================================================= */
/* === CONFIG ============================================ */
/* ======================================================= */
const CONFIG = {
  discord: { userId: "850815059093356594" },
  twitch:  { username: "calebkritzar" },
  reddit:  { username: "Electronic_Row_1262" },
  github:  { username: "rkritzar39" },
  tiktok:  { username: "calebkritzar" },
};

/* ======================================================= */
/* === GLOBAL STATE ====================================== */
/* ======================================================= */
let lastUpdateTime = null;
let progressInterval = null;
let activityTimer = null;
let currentSpotifyUrl = null;
let tempBanner = null;
const TEMP_BANNER_MS = 15000;
let lastGitHubEventId = null;
let lastRedditPostId  = null;
let lastTikTokVideoId = null;
let twitchWasLive     = false;

const $$  = (id) => document.getElementById(id);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* ======================================================= */
/* === ICONS ============================================= */
/* ======================================================= */
function getThemeColor(hexLight, hexDark) {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return isDark ? hexDark.replace("#", "") : hexLight.replace("#", "");
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
/* === STATUS LINE HELPERS =============================== */
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
  if (["spotify", "twitch"].includes(source)) icon.classList.add("glow");

  lastUpdateTime = Date.now();
  updateLastUpdated();
}

/* ======================================================= */
/* === LAST UPDATED LABEL ================================ */
/* ======================================================= */
function updateLastUpdated() {
  const el = $$("live-activity-updated");
  if (!el) return;
  if (!lastUpdateTime) { el.textContent = "—"; return; }
  const s = Math.floor((Date.now() - lastUpdateTime) / 1000);
  el.textContent =
    s < 5 ? "Updated just now" :
    s < 60 ? `Updated ${s}s ago` :
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
  const totalSec = (endMs - startMs) / 1000;
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
/* === ACCENT COLOR (Spotify album art) ================== */
/* ======================================================= */
function updateDynamicColors(imageUrl) {
  const activity = document.querySelector(".live-activity");
  if (!activity) return;
  const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
  const matchAccent = settings.matchSongAccent === "enabled";
  const userAccent = settings.accentColor || "#1DB954";
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
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let r=0,g=0,b=0,count=0;
      for (let i=0;i<data.length;i+=4){r+=data[i];g+=data[i+1];b+=data[i+2];count++;}
      r=Math.floor(r/count);g=Math.floor(g/count);b=Math.floor(b/count);
      const col=`rgb(${r},${g},${b})`;
      activity.style.transition="background .6s ease,box-shadow .6s ease";
      activity.style.setProperty("--dynamic-accent",col);
      activity.style.setProperty("--dynamic-bg",`linear-gradient(180deg,rgba(${r},${g},${b},.35),rgba(${r},${g},${b},.15))`);
    }catch(e){activity.style.setProperty("--dynamic-accent",userAccent);}
  };
}

/* ======================================================= */
/* === LANYARD WEBSOCKET (REALTIME) ====================== */
/* ======================================================= */
let ws=null, hb=null, reconnectTimer=null;
function connectLanyard(){
  ws=new WebSocket("wss://api.lanyard.rest/socket");
  ws.onopen=()=>console.log("✅ Lanyard connected");
  ws.onmessage=(e)=>{
    const msg=JSON.parse(e.data);
    if(msg.op===1){
      hb=setInterval(()=>ws?.readyState===1&&ws.send(JSON.stringify({op:3})),msg.d.heartbeat_interval);
      ws.send(JSON.stringify({op:2,d:{subscribe_to_id:CONFIG.discord.userId}}));
      fetchLanyardOnce();
    }
    if(msg.op===0&&(msg.t==="INIT_STATE"||msg.t==="PRESENCE_UPDATE")) renderDiscord(msg.d);
  };
  ws.onclose=scheduleReconnect;
  ws.onerror=scheduleReconnect;
}
function scheduleReconnect(){clearInterval(hb);if(reconnectTimer)return;reconnectTimer=setTimeout(connectLanyard,1500);}
async function fetchLanyardOnce(){
  try{const r=await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}`);const j=await r.json();
    if(j?.data)renderDiscord(j.data);}catch(e){console.warn("Lanyard REST fail",e);}
}

/* ======================================================= */
/* === DISCORD RENDERER ================================== */
/* ======================================================= */
function renderDiscord(d){
  if(!d)return;
  const spotify=d.spotify;
  const custom=(d.activities||[]).find(a=>a.type===4);
  const game=(d.activities||[]).find(a=>a.type===0);
  const status=d.discord_status;
  const device=d.active_on_discord_mobile?"Mobile":d.active_on_discord_desktop?"Desktop":"";
  const voice=d.in_voice_channel;
  
  // Presence summary line
  let presence=`${status?.charAt(0).toUpperCase()+status?.slice(1)||"Offline"}`;
  if(device) presence+=` · ${device}`;
  if(voice) presence+=" · In Voice";
  if(custom) presence+=` · ${custom.emoji?.name||""}${custom.state||""}`;
  
  // Spotify (always top priority)
  if(spotify){
    $$("spotify-card").classList.remove("hidden");
    $$("live-activity-cover").src=spotify.album_art_url;
    $$("live-song-title").textContent=spotify.song;
    $$("live-song-artist").textContent=spotify.artist;
    currentSpotifyUrl=`https://open.spotify.com/track/${spotify.track_id}`;
    setupProgress(spotify.timestamps.start,spotify.timestamps.end);
    updateDynamicColors(spotify.album_art_url);
    setStatusLine("Listening to Spotify",true,"spotify");
  } else {
    $$("spotify-card").classList.add("hidden");
    updateDynamicColors(null);
  }

  // Game / Rich activity card
  if(game){
    const card=$$("activity-card");
    if(card){
      card.classList.remove("hidden");
      $$("activity-name").textContent=game.name||"—";
      $$("activity-details").textContent=game.details||game.state||"";
      const icon=$$("activity-icon-img");
      if(icon){
        const asset=game.assets?.large_image||game.assets?.small_image||"";
        icon.src=assetToUrl(asset,game.application_id);
      }
      const start=game.timestamps?.start||null;
      if(start) startActivityTimer(start);
    }
  } else {
    $$("activity-card")?.classList.add("hidden");
    stopActivityTimer();
  }

  // Presence line update
  setStatusLine(presence,true,"discord");
}

function assetToUrl(asset,appId){
  if(!asset)return "";
  if(asset.startsWith("mp:")||asset.startsWith("spotify:"))
    return `https://media.discordapp.net/${asset.replace(/^mp:\//,"")}`;
  return appId?`https://cdn.discordapp.com/app-assets/${appId}/${asset}.png`:"";
}

/* ======================================================= */
/* === ACTIVITY TIMER ==================================== */
/* ======================================================= */
function startActivityTimer(start){
  stopActivityTimer();
  const t=$$("activity-timer");
  activityTimer=setInterval(()=>{
    const elapsed=Date.now()-start;
    const s=Math.floor(elapsed/1000);
    const m=Math.floor(s/60);
    const sec=s%60;
    if(t)t.textContent=`Elapsed ${m}:${String(sec).padStart(2,"0")}`;
  },1000);
}
function stopActivityTimer(){clearInterval(activityTimer);activityTimer=null;}

/* ======================================================= */
/* === TWITCH / REDDIT / GITHUB / TIKTOK ================ */
/* ======================================================= */
async function getTwitch(){const u=(CONFIG.twitch.username||"").toLowerCase();if(!u)return null;
  try{const r=await fetch(`https://decapi.me/twitch/live/${u}`);const t=(await r.text()).toLowerCase();
  if(t.includes("is live")){twitchWasLive=true;return{text:"Now Live on Twitch",source:"twitch"};}twitchWasLive=false;}catch(e){console.warn(e);}return null;}
async function getReddit(){const u=CONFIG.reddit.username;if(!u)return null;
  try{const r=await fetch(`https://www.reddit.com/user/${u}/submitted.json?limit=1`);
  const j=await r.json();const p=j?.data?.children?.[0]?.data;
  if(p&&p.id!==lastRedditPostId){lastRedditPostId=p.id;return{text:"Shared on Reddit",source:"reddit",isTemp:true};}}catch(e){console.warn(e);}return null;}
async function getGitHub(){const u=CONFIG.github.username;if(!u)return null;
  try{const r=await fetch(`https://api.github.com/users/${u}/events/public`);
  const ev=await r.json();const e=Array.isArray(ev)?ev.find(x=>["PushEvent","CreateEvent","PullRequestEvent"].includes(x.type)):null;
  if(e&&e.id!==lastGitHubEventId){lastGitHubEventId=e.id;return{text:"Committed on GitHub",source:"github",isTemp:true};}}catch(e){console.warn(e);}return null;}
async function getTikTok(){const u=CONFIG.tiktok.username;if(!u)return null;
  try{const r=await fetch(`https://r.jina.ai/http://www.tiktok.com/@${u}`);const h=await r.text();const m=h.match(/\/video\/(\d+)/);const v=m?.[1];
  if(v&&v!==lastTikTokVideoId){lastTikTokVideoId=v;return{text:"Posted on TikTok",source:"tiktok",isTemp:true};}}catch(e){console.warn(e);}return null;}

/* ======================================================= */
/* === LOOP + INIT ======================================= */
/* ======================================================= */
let tempBanner=null;
function applyStatusDecision({main,twitchLive,temp}){
  if(temp&&temp.text&&Date.now()<temp.expiresAt){setStatusLine(temp.text,true,temp.source);return;}
  if(twitchLive){setStatusLine("Now Live on Twitch",true,"twitch");return;}
  if(main&&main.text){setStatusLine(main.text,true,main.source);return;}
  setStatusLine("No Current Active Activities",true,"manual");
}
async function updateLiveStatus(){
  const [twitch,tiktok,reddit,github]=await Promise.all([getTwitch(),getTikTok(),getReddit(),getGitHub()]);
  const main={text:"",source:"discord"};
  const tempHit=[tiktok,reddit,github].find(r=>r&&r.isTemp);
  if(tempHit){tempBanner={text:tempHit.text,source:tempHit.source,expiresAt:Date.now()+TEMP_BANNER_MS};}
  else if(tempBanner&&Date.now()>=tempBanner.expiresAt){tempBanner=null;}
  applyStatusDecision({main,twitchLive:!!twitch,temp:tempBanner});
  $$("live-activity").classList.remove("hidden");
}

/* ======================================================= */
/* === STARTUP =========================================== */
/* ======================================================= */
document.addEventListener("DOMContentLoaded",()=>{
  const card=$$("spotify-card");
  if(card){card.addEventListener("click",()=>{if(currentSpotifyUrl)window.open(currentSpotifyUrl,"_blank");});}
  connectLanyard(); // connect Discord realtime
  updateLiveStatus(); // update other platforms
  setInterval(updateLiveStatus,15000);
  setInterval(updateLastUpdated,1000);
});
