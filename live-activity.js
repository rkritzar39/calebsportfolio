/* ======================================================
   🎧 Live Activity — Single status icon + correct bar placement
   ====================================================== */

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

const CONFIG = {
  discord:{ userId:"850815059093356594" }
};

const BRAND_COLORS = {
  twitch:"#9146FF", tiktok:"#EE1D52", github:"#181717", reddit:"#FF4500",
  steam:"#00ADEE", spotify:"#1DB954", discord:"#5865F2",
  manual:"var(--accent-color)", offline:"#666666"
};

let lastUpdateTime=null;
let progressInterval=null;
let currentSpotifyUrl=null;

const $$ = id => document.getElementById(id);
const setText = (id, val) => { const el=$$(id); if(el) el.textContent=val; };
const fmt = s => { s=Math.max(0,Math.floor(s)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; };

/* ========== honeycomb (colored dots only) ========== */
function updateIconCluster(list){
  const cluster=$$("icon-cluster"); if(!cluster) return;
  cluster.innerHTML="";
  list.forEach(({source,text})=>{
    const dot=document.createElement("div");
    dot.className=`cluster-icon ${source}`;
    dot.style.backgroundColor = BRAND_COLORS[source] || "var(--accent-color)";
    dot.style.boxShadow = `0 0 6px ${BRAND_COLORS[source] || "var(--accent-color)"}`;
    dot.title = `${source} — ${text}`;
    cluster.appendChild(dot);
  });
}

/* ========== ONE status icon + text ========== */
function setStatusLine(text, source="manual"){
  const txt=$$("status-line-text"), ico=$$("status-icon-logo");
  if(!txt || !ico) return;
  txt.textContent = text || "—";
  const color = BRAND_COLORS[source] || "var(--accent-color)";
  ico.style.background = color;
  ico.style.boxShadow = `0 0 8px ${color}`;
  lastUpdateTime = Date.now();
  updateLastUpdated();
}

/* ========== updated timer ========== */
function updateLastUpdated(){
  const el=$$("live-activity-updated"); if(!el || !lastUpdateTime) return;
  const sec=Math.floor((Date.now()-lastUpdateTime)/1000);
  el.textContent =
    sec<10 ? "Updated just now" :
    sec<60 ? `Updated ${sec}s ago` :
    sec<3600 ? `Updated ${Math.floor(sec/60)}m ago` :
    `Updated ${Math.floor(sec/3600)}h ago`;
}

/* ========== progress bar inside its track ========== */
function setupProgress(startMs,endMs){
  const bar=$$("music-progress-bar");
  const e=$$("elapsed-time"), r=$$("remaining-time"), t=$$("total-time");
  if(!bar || !startMs || !endMs) return;

  const total=(endMs-startMs)/1000;
  t.textContent = fmt(total);

  clearInterval(progressInterval);
  function tick(){
    const now=Date.now();
    const elapsed=Math.min((now-startMs)/1000,total);
    const left=Math.max(total-elapsed,0);
    bar.style.width = `${(elapsed/total)*100}%`;
    e.textContent = fmt(elapsed);
    r.textContent = `-${fmt(left)}`;
  }
  tick();
  progressInterval=setInterval(tick,1000);
}

/* ========== Firestore manual override (optional) ========== */
async function getManualStatus(){
  try{
    const snap=await getDoc(doc(db,"live_status","current"));
    if(snap.exists()){
      const msg=(snap.data().message||"").trim();
      if(msg) return { text: msg, source: "manual" };
    }
  }catch{}
  return null;
}

/* ========== Discord/Lanyard (with real Spotify) ========== */
async function getDiscord(){
  try{
    const res=await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discord.userId}`,{cache:"no-store"});
    const { data } = await res.json();
    if(!data) return null;

    if(data.spotify){
      const sp=data.spotify;
      // show card
      $$("spotify-card").classList.remove("hidden");
      $$("live-activity").classList.add("spotify-active");
      $$("live-activity-cover").src = sp.album_art_url;
      setText("live-song-title", sp.song);
      setText("live-song-artist", sp.artist);
      currentSpotifyUrl = sp.track_id ? `https://open.spotify.com/track/${sp.track_id}` : null;
      setupProgress(sp.timestamps.start, sp.timestamps.end);
      setStatusLine(`Listening to “${sp.song}” by ${sp.artist}`, "spotify");
      return { text:`Spotify — ${sp.song}`, source:"spotify" };
    }

    // hide card if no spotify
    $$("spotify-card").classList.add("hidden");
    $$("live-activity").classList.remove("spotify-active");

    const map={ online:"💬 Online on Discord", idle:"🌙 Idle on Discord", dnd:"⛔ Do Not Disturb", offline:"⚫ Offline" };
    const status = map[data.discord_status] || "💬 Online on Discord";
    setStatusLine(status,"discord");
    return { text: status, source:"discord" };
  }catch(e){
    console.warn("Discord error",e);
    return null;
  }
}

/* ========== update loop ========== */
async function updateLiveStatus(){
  const results = [];
  const manual = await getManualStatus(); if(manual) results.push(manual);
  const disc = await getDiscord();        if(disc)   results.push(disc);

  // build honeycomb from active sources (unique by source)
  const seen=new Set(); const icons=[];
  for(const r of results){ if(!seen.has(r.source)){ seen.add(r.source); icons.push(r); } }
  updateIconCluster(icons);

  // show widget if anything to show
  const container=$$("live-activity");
  if(results.length){ container.classList.remove("hidden"); }
  else{ container.classList.add("hidden"); }
}

/* ========== click-through to Spotify ========== */
function bindSpotifyClick(){
  const card=$$("spotify-card"); if(!card) return;
  function open(){ if(currentSpotifyUrl) window.open(currentSpotifyUrl,"_blank","noopener"); }
  card.addEventListener("click",open);
  card.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){e.preventDefault();open();} });
}

/* ========== init ========== */
document.addEventListener("DOMContentLoaded", ()=>{
  bindSpotifyClick();
  updateLiveStatus();
  setInterval(updateLiveStatus, 8000);
  setInterval(updateLastUpdated, 1000);
});
