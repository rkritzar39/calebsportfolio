/* live-activity.js — Fixed Spotify + manual lock */

import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

const CONFIG = {
  discord: { userId: "850815059093356594" },
  twitch:  { username: "calebkritzar" },
  reddit:  { username: "Electronic_Row_1262" },
  github:  { username: "rkritzar39" },
  tiktok:  { username: "calebkritzar" },
};

let lastUpdateTime = null;
let progressInterval = null;
let currentSpotifyUrl = null;
let tempBanner = null;
const TEMP_BANNER_MS = 15000;
let manualStatus = null;

let lastSpotifyTrackId = null, lastSpotifyElapsed = null, lastSpotifySeenAt = 0;

const $$  = (id) => document.getElementById(id);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const ICON_MAP = {
  spotify: "https://cdn.simpleicons.org/spotify/1DB954",
  discord: "https://cdn.simpleicons.org/discord/5865F2",
  twitch:  "https://cdn.simpleicons.org/twitch/9146FF",
  youtube: "https://cdn.simpleicons.org/youtube/FF0000",
  reddit:  "https://cdn.simpleicons.org/reddit/FF4500",
  github:  "https://cdn.simpleicons.org/github/000000",
  tiktok:  "https://cdn.simpleicons.org/tiktok/000000",
  manual:  "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
  default: "https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/info-circle.svg",
};

/* =========================
   Helpers
   ========================= */
function showStatusLineWithFade(text, source="manual"){
  const txt = $$("status-line-text");
  const line = $$("status-line");
  const icon = $$("status-icon");
  if(!txt||!line||!icon) return;

  line.style.transition="opacity .22s ease";
  line.style.opacity="0";
  setTimeout(()=>{
    icon.src = ICON_MAP[source]||ICON_MAP.default;
    icon.alt = `${source} icon`;
    txt.textContent = text;
    line.style.opacity="1";
  },180);
  icon.classList.remove("glow");
  if(["spotify","twitch"].includes(source)) icon.classList.add("glow");
  lastUpdateTime = Date.now();
}

function updateLastUpdated(){
  const el=$$("live-activity-updated");
  if(!el) return;
  if(!lastUpdateTime){ el.textContent="—"; return; }
  const s=Math.floor((Date.now()-lastUpdateTime)/1000);
  el.textContent = s<5?"Updated just now":s<60?`${s}s ago`:s<3600?`${Math.floor(s/60)}m ago`:`${Math.floor(s/3600)}h ago`;
}

function setupProgress(startMs,endMs){
  const bar=$$("music-progress-bar");
  const elapsedEl=$$("elapsed-time");
  const remainEl=$$("remaining-time");
  const totalEl=$$("total-time");
  if(!bar||!startMs||!endMs) return;

  const totalSec=Math.max((endMs-startMs)/1000,1);
  totalEl.textContent=fmt(totalSec);

  clearInterval(progressInterval);
  function tick(){
    const now=Date.now();
    const elapsedSec=Math.min((now-startMs)/1000,totalSec);
    const left=Math.max(totalSec-elapsedSec,0);
    bar.style.width=`${(elapsedSec/totalSec)*100}%`;
    elapsedEl.textContent=fmt(elapsedSec);
    remainEl.textContent=`-${fmt(left)}`;
  }
  tick();
  progressInterval=setInterval(tick,1000);
}

function updateDynamicColors(imageUrl){
  const activity=document.querySelector(".live-activity");
  if(!activity) return;
  const settings = JSON.parse(localStorage.getItem("websiteSettings")||"{}");
  const matchAccent = settings.matchSongAccent==="enabled";
  const userAccent = settings.accentColor||"#1DB954";

  if(!matchAccent||!imageUrl){
    activity.style.setProperty("--dynamic-bg","none");
    activity.style.setProperty("--dynamic-accent",userAccent);
    return;
  }

  const img=new Image();
  img.crossOrigin="anonymous";
  img.src=imageUrl;
  img.onload=()=>{
    try{
      const canvas=document.createElement("canvas");
      const ctx=canvas.getContext("2d");
      canvas.width=img.width||64; canvas.height=img.height||64;
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let r=0,g=0,b=0,count=0;
      for(let i=0;i<data.length;i+=4){r+=data[i];g+=data[i+1];b+=data[i+2];count++;}
      r=Math.floor(r/count); g=Math.floor(g/count); b=Math.floor(b/count);
      const accent=`rgb(${r},${g},${b})`;
      activity.style.setProperty("--dynamic-accent",accent);
      activity.style.setProperty("--dynamic-bg",`linear-gradient(180deg, rgba(${r},${g},${b},0.35), rgba(${r},${g},${b},0.12))`);
    }catch{ activity.style.setProperty("--dynamic-accent",userAccent); activity.style.setProperty("--dynamic-bg","none"); }
  };
  img.onerror=()=>{ activity.style.setProperty("--dynamic-accent",userAccent); activity.style.setProperty("--dynamic-bg","none"); };
}

function crossfadeAlbumArt(imgEl,newSrc){
  if(!imgEl||imgEl.dataset.current===newSrc) return;
  const overlay=document.createElement("img");
  overlay.className="album-overlay";
  overlay.style.position="absolute"; overlay.style.inset="0";
  overlay.style.width="100%"; overlay.style.height="100%"; overlay.style.objectFit="cover"; overlay.style.opacity="0";
  overlay.style.transition="opacity .45s ease"; overlay.src=newSrc;
  overlay.onload=()=>{
    imgEl.parentElement.appendChild(overlay);
    requestAnimationFrame(()=>overlay.style.opacity="1");
    setTimeout(()=>{ imgEl.src=newSrc; imgEl.dataset.current=newSrc; overlay.remove(); },470);
  };
  overlay.onerror=()=>overlay.remove();
}

function slideInCard(cardEl){ if(!cardEl) return; cardEl.style.display=""; cardEl.style.opacity="1"; cardEl.classList.remove("slide-out"); cardEl.classList.add("slide-in"); }
function slideOutCard(cardEl){ if(!cardEl) return; cardEl.classList.remove("slide-in"); cardEl.classList.add("slide-out"); setTimeout(()=>{ if(cardEl.classList.contains("slide-out")){ cardEl.style.opacity="0"; cardEl.style.display="none"; }},360); }

function isManualActive(){ return manualStatus?.enabled && (!manualStatus.expiresAt || Date.now()<manualStatus.expiresAt); }

/* =========================
   Discord + Spotify
   ========================= */
async function getDiscord(){
  try{
    const res=await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}?_ts=${Date.now()}`,{cache:"no-store"});
    if(!res.ok) throw new Error(`Lanyard ${res.status}`);
    const json=await res.json(); const data=json.data; if(!data) return null;

    if(data.spotify){
      const sp=data.spotify; const now=Date.now();
      const startMs=sp.timestamps?.start??(now-(sp.spotify_elapsed? sp.spotify_elapsed*1000:0));
      const endMs=sp.timestamps?.end??(startMs+(sp.spotify_duration? sp.spotify_duration*1000:0));
      const card=$$("spotify-card"); if(card) slideInCard(card);
      const cover=$$("live-activity-cover"); if(cover) crossfadeAlbumArt(cover,sp.album_art_url);
      $$("live-song-title").textContent=sp.song||"Unknown";
      $$("live-song-artist").textContent=sp.artist||"Unknown";
      currentSpotifyUrl=sp.track_id?`https://open.spotify.com/track/${sp.track_id}`:null;
      setupProgress(startMs,endMs);
      updateDynamicColors(sp.album_art_url);
      return { text:"Listening to Spotify", source:"spotify" };
    }

    const map={online:"Online on Discord",idle:"Idle on Discord",dnd:"Do Not Disturb",offline:"No Current Active Activities"};
    const status=map[data.discord_status]||"No Current Active Activities";
    slideOutCard($$("spotify-card"));
    updateDynamicColors(null);
    return { text:status, source:"discord" };
  }catch(e){ console.warn("Discord error:",e); return null; }
}

/* =========================
   Twitch / GitHub / Reddit / TikTok
   ========================= */
async function getTwitch(){ try{ const r=await fetch(`https://decapi.me/twitch/live/${CONFIG.twitch.username}`,{cache:"no-store"}); const t=(await r.text()).toLowerCase(); if(t.includes("is live")) return { text:"Now Live on Twitch", source:"twitch" }; }catch(e){console.warn(e);} return null; }
async function getGitHub(){ try{ const r=await fetch(`https://api.github.com/users/${CONFIG.github.username}/events/public`,{cache:"no-store"}); const ev=await r.json(); if(ev?.[0]?.id) return { text:"Committed on GitHub", source:"github", isTemp:true }; }catch(e){console.warn(e);} return null; }
async function getReddit(){ try{ const r=await fetch(`https://www.reddit.com/user/${CONFIG.reddit.username}/submitted.json?limit=1`,{cache:"no-store"}); const p=(await r.json())?.data?.children?.[0]?.data; if(p) return { text:"Shared on Reddit", source:"reddit", isTemp:true }; }catch(e){console.warn(e);} return null; }
async function getTikTok(){ try{ const r=await fetch(`https://r.jina.ai/http://www.tiktok.com/@${CONFIG.tiktok.username}`,{cache:"no-store"}); const m=(await r.text()).match(/\/video\/(\d+)/); if(m?.[1]) return { text:"Posted on TikTok", source:"tiktok", isTemp:true }; }catch(e){console.warn(e);} return null; }

/* =========================
   Firestore manual listener
   ========================= */
try{
  const manualRef=doc(db,"manualStatus","site");
  onSnapshot(manualRef,snap=>{
    manualStatus=snap.exists()?snap.data():null;
  });
}catch(e){console.warn("manual listener error:",e);}

/* =========================
   Apply status logic
   ========================= */
function applyStatusDecision({main,twitchLive,temp}){
  const card=$$("spotify-card");
  if(isManualActive()){ showStatusLineWithFade(manualStatus.text||"Manual Status","manual"); if(card) slideOutCard(card); return; }
  if(temp && Date.now()<temp.expiresAt){ showStatusLineWithFade(temp.text,temp.source||"default"); if(card) slideOutCard(card); return; }
  if(main?.source==="spotify"){ showStatusLineWithFade(main.text,"spotify"); if(card) slideInCard(card); }
  else if(twitchLive){ showStatusLineWithFade("Now Live on Twitch","twitch"); if(card) slideOutCard(card); }
  else { showStatusLineWithFade(main?.text||"No Current Active Activities",main?.source||"discord"); if(card) slideOutCard(card); }
}

/* =========================
   Main loop
   ========================= */
async function mainLoop(){
  const [discord,twitch,reddit,github,tiktok]=await Promise.all([getDiscord(),getTwitch(),getReddit(),getGitHub(),getTikTok()]);
  const primary=discord?.source==="spotify"?discord:twitch||discord||{ text:"No Current Active Activities", source:"manual" };
  let tempHit=[reddit,github,tiktok].find(r=>r && r.isTemp);
  if(tempHit){ tempBanner={ text: tempHit.text, source: tempHit.source, expiresAt: Date.now()+TEMP_BANNER_MS }; }
  else if(tempBanner && Date.now()>=tempBanner.expiresAt){ tempBanner=null; }
  applyStatusDecision({main:primary,twitchLive:!!twitch,temp:tempBanner});
  $$("live-activity")?.classList.remove("hidden");
}

/* =========================
   Init
   ========================= */
document.addEventListener("DOMContentLoaded",()=>{
  const card=$$("spotify-card"); if(card) card.addEventListener("click",()=>{ if(currentSpotifyUrl) window.open(currentSpotifyUrl,"_blank"); });
  mainLoop();
  setInterval(mainLoop,5000);
  setInterval(updateLastUpdated,1000);
});
