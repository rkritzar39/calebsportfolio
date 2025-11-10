(() => {
const $ = id => document.getElementById(id);
const els = {
  toast: $('toast'), cityInput:$('city-input'), citySubmit:$('city-submit'),
  useLoc:$('use-location'), unitBtns:[...document.querySelectorAll('.unit-btn')],
  locName:$('loc-name'), locMeta:$('loc-meta'), updated:$('updated'),
  temp:$('temp-now'), feels:$('feels-like'), hum:$('humidity'),
  wind:$('wind'), press:$('pressure'), uv:$('uv'), summary:$('summary'),
  sunrise:$('sunrise'), sunset:$('sunset'), forecast:$('forecast-row'),
  alerts:$('alerts-card'), favs:$('favs')
};

const state = {
  unit: localStorage.getItem('wxUnit')||'imperial',
  last: JSON.parse(localStorage.getItem('wxLast')||'null'),
  favs: JSON.parse(localStorage.getItem('wxFavs')||'[]')
};

init();

/* ===============================
   INIT
=============================== */
function init(){
  setUnitUI();
  els.citySubmit.onclick = searchCity;
  els.cityInput.onkeydown = e => { if(e.key==='Enter') searchCity(); };
  els.useLoc.onclick = () => getLocation();
  els.unitBtns.forEach(b=>{
    b.onclick = () => {
      if(!b.classList.contains('active')){
        state.unit = b.dataset.unit;
        localStorage.setItem('wxUnit', state.unit);
        setUnitUI();
        if(state.last) loadWeather(state.last.lat, state.last.lon, state.last);
      }
    };
  });

  renderFavs();

  // Start-up sequence
  if(state.last){
    loadWeather(state.last.lat, state.last.lon, state.last);
  } else {
    getLocation({silent:true});
  }

  // Auto refresh every 15 minutes
  setInterval(()=>{ if(state.last) loadWeather(state.last.lat, state.last.lon, state.last, true); }, 15*60*1000);
}

/* ===============================
   UNIT / TOAST
=============================== */
function setUnitUI(){ els.unitBtns.forEach(b=>b.classList.toggle('active', b.dataset.unit===state.unit)); }
function toast(msg){ els.toast.textContent=msg; els.toast.classList.add('show'); clearTimeout(els.toast._t); els.toast._t=setTimeout(()=>els.toast.classList.remove('show'),2500); }

/* ===============================
   GEOLOCATION FIXED
=============================== */
function getLocation(opt={}){
  if(!navigator.geolocation){
    toast("Location not supported.");
    return fallback();
  }
  navigator.geolocation.getCurrentPosition(async pos=>{
    const { latitude:lat, longitude:lon } = pos.coords;
    console.log("📍 Location:", lat, lon);
    // Skip reverse geocode if it fails
    let info = null;
    try { info = await reverse(lat, lon); } catch(e){ console.warn("Reverse failed:", e); }
    await loadWeather(lat, lon, info || { name: "My Location", lat, lon });
  }, async err=>{
    console.error("Geo error:", err);
    toast("Could not access location, loading fallback city.");
    fallback();
  }, { enableHighAccuracy:true, timeout:20000, maximumAge:10000 });
}

/* ===============================
   GEO HELPERS
=============================== */
async function reverse(lat, lon){
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en`);
  if(!r.ok) throw new Error("Reverse failed");
  const j = await r.json();
  const p = j.results?.[0];
  if(!p) return { name: `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}` };
  return { name: p.name || "My Location", admin1: p.admin1, country: p.country, lat, lon };
}
async function geocode(name){
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en`);
  const j = await r.json();
  const p = j.results?.[0];
  return p ? { name:p.name, admin1:p.admin1, country:p.country, lat:p.latitude, lon:p.longitude } : null;
}

/* ===============================
   SEARCH
=============================== */
async function searchCity(){
  const q = els.cityInput.value.trim();
  if(!q) return toast("Type a city name.");
  const loc = await geocode(q);
  if(!loc){ toast("City not found."); return; }
  loadWeather(loc.lat, loc.lon, loc);
}

/* ===============================
   FETCH + RENDER WEATHER
=============================== */
async function loadWeather(lat, lon, info={}, silent=false){
  const u = state.unit==='imperial' ? {t:'fahrenheit',w:'mph',p:'inchmercury'} : {t:'celsius',w:'kmh',p:'hPa'};
  const params = new URLSearchParams({
    latitude:lat, longitude:lon, timezone:'auto',
    current:'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,pressure_msl,weather_code,is_day',
    daily:'temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,weathercode',
    temperature_unit:u.t, wind_speed_unit:u.w, pressure_unit:u.p
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if(!res.ok) throw new Error("Weather fetch failed.");
  const data = await res.json();
  renderAll(data, info);
  if(!silent) toast("Weather updated!");

  // Save state
  state.last = { lat, lon, name:info.name, admin1:info.admin1, country:info.country };
  localStorage.setItem('wxLast', JSON.stringify(state.last));
}

/* ===============================
   RENDER
=============================== */
function renderAll(d, info){
  const c = d.current || {};
  const day = d.daily || {};
  els.locName.textContent = info.name || "—";
  els.locMeta.textContent = [info.admin1, info.country].filter(Boolean).join(", ") || "";
  els.updated.textContent = "Last updated: " + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});

  els.temp.textContent = Math.round(c.temperature_2m ?? 0);
  els.feels.textContent = Math.round(c.apparent_temperature ?? 0);
  els.hum.textContent = c.relative_humidity_2m ?? '—';
  els.wind.textContent = Math.round(c.wind_speed_10m ?? 0) + ' ' + (state.unit==='imperial'?'mph':'km/h');
  els.press.textContent = formatPressure(c.pressure_msl);
  els.uv.textContent = (day.uv_index_max?.[0] ?? '—');
  els.summary.textContent = wxText(c.weather_code);
  els.sunrise.textContent = formatTime(day.sunrise?.[0]);
  els.sunset.textContent  = formatTime(day.sunset?.[0]);

  renderForecast(day);
  setSky(c.weather_code, c.is_day);
  fetchAlerts(d.latitude, d.longitude);
}

/* ===============================
   FORECAST
=============================== */
function renderForecast(d){
  els.forecast.innerHTML = '';
  for(let i=0;i<Math.min(5,d.time?.length||0);i++){
    const el = document.createElement('div');
    el.className = 'forecast-card';
    el.innerHTML = `
      <div>${new Date(d.time[i]).toLocaleDateString([], {weekday:'short'})}</div>
      <div>${icon(d.weathercode[i])}</div>
      <div><b>${Math.round(d.temperature_2m_max[i])}${unit()}</b> / ${Math.round(d.temperature_2m_min[i])}${unit()}</div>
    `;
    els.forecast.appendChild(el);
  }
}

/* ===============================
   ALERTS
=============================== */
async function fetchAlerts(lat, lon){
  try{
    const r = await fetch(`https://api.open-meteo.com/v1/warnings?latitude=${lat}&longitude=${lon}&timezone=auto`);
    const j = await r.json();
    const w = j?.warnings;
    if(!w?.length){ els.alerts.classList.add('hidden'); return; }
    els.alerts.classList.remove('hidden');
    els.alerts.innerHTML = w.map(x=>`<div><strong>${x.event}</strong><br><small>${x.sender}</small></div>`).join('<hr>');
  }catch{ els.alerts.classList.add('hidden'); }
}

/* ===============================
   UTILS
=============================== */
function fallback(){ loadWeather(40.7128,-74.0060,{name:"New York, US"}); }
function unit(){ return state.unit==='imperial'?'°F':'°C'; }
function formatPressure(v){
  if(v == null) return '—';
  if(state.unit==='imperial'){ return (v>70?(v*0.02953).toFixed(2):v)+' inHg'; }
  return (v<70?(v/0.02953).toFixed(0):Math.round(v))+' hPa';
}
function formatTime(s){ return s ? new Date(s).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}) : '—'; }
function wxText(c){ const m={0:"Clear",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Fog",51:"Drizzle",61:"Rain",63:"Rain",65:"Heavy rain",71:"Snow",73:"Snow",75:"Heavy snow",95:"Thunderstorm"}; return m[c]||'—'; }
function icon(c){ if([0,1].includes(c))return'☀️'; if([2,3].includes(c))return'⛅️'; if([45,48].includes(c))return'🌫️'; if([51,61,63,65].includes(c))return'🌧️'; if([71,73,75].includes(c))return'🌨️'; if([95].includes(c))return'⛈️'; return'☁️'; }
function setSky(c,isDay){
  let sky='default';
  if([0,1].includes(c)) sky=isDay?'clear':'night';
  else if([2,3].includes(c)) sky=isDay?'clear':'night';
  else if([61,63,65,80,81,82].includes(c)) sky='rain';
  else if([71,73,75].includes(c)) sky='snow';
  else if([95,96,97].includes(c)) sky='storm';
  document.body.dataset.sky = sky;
}

/* ===============================
   FAVORITES
=============================== */
function renderFavs(){
  els.favs.innerHTML='';
  state.favs.forEach(f=>{
    const b=document.createElement('button');
    b.className='btn ghost';
    b.textContent=f.name;
    b.onclick=()=>loadWeather(f.lat,f.lon,f);
    els.favs.appendChild(b);
  });
}
})();
