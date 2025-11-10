(() => {
const $ = id => document.getElementById(id);
const els = {
  toast: $('toast'), cityInput:$('city-input'), citySubmit:$('city-submit'),
  useLoc:$('use-location'), unitBtns:[...document.querySelectorAll('.unit-btn')],
  locName:$('loc-name'), locMeta:$('loc-meta'), updated:$('updated'),
  temp:$('temp-now'), unit:$('temp-unit'), feels:$('feels-like'),
  hum:$('humidity'), wind:$('wind'), windDir:$('wind-dir'),
  press:$('pressure'), uv:$('uv'), air:$('air'),
  summary:$('summary'), sunrise:$('sunrise'), sunset:$('sunset'),
  emoji:$('wx-emoji'), forecast:$('forecast-row'), alerts:$('alerts-card')
};

const state = {
  unit: localStorage.getItem('wxUnit') || 'imperial',
  last: JSON.parse(localStorage.getItem('wxLast') || 'null')
};

/* === INIT === */
init();
function init(){
  setUnitUI();
  els.citySubmit.onclick = searchCity;
  els.cityInput.onkeydown = e => { if(e.key==='Enter') searchCity(); };
  els.useLoc.onclick = () => getLocation();
  els.unitBtns.forEach(b=>{
    b.onclick = ()=>{ if(!b.classList.contains('active')){
      state.unit = b.dataset.unit;
      localStorage.setItem('wxUnit', state.unit);
      setUnitUI();
      if(state.last) loadWeather(state.last.lat, state.last.lon, state.last);
    }}
  });
  if(state.last) loadWeather(state.last.lat, state.last.lon, state.last);
  else getLocation({silent:true});
}

/* === UNIT + TOAST === */
function setUnitUI(){
  els.unitBtns.forEach(b=>b.classList.toggle('active',b.dataset.unit===state.unit));
}
function toast(msg){
  els.toast.textContent=msg;
  els.toast.classList.add('show');
  clearTimeout(els.toast._t);
  els.toast._t=setTimeout(()=>els.toast.classList.remove('show'),2500);
}

/* === LOCATION === */
function getLocation(opt={}){
  if(!navigator.geolocation){ toast("Location not supported."); return fallback(); }
  navigator.geolocation.getCurrentPosition(async pos=>{
    const {latitude:lat,longitude:lon}=pos.coords;
    let info=null; try{ info=await reverse(lat,lon);}catch{}
    await loadWeather(lat,lon,info||{name:"My Location"});
  },err=>{ console.error(err); toast("Couldn't get location."); fallback(); },
  {enableHighAccuracy:true,timeout:20000,maximumAge:10000});
}
async function reverse(lat,lon){
  const r=await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en`);
  const j=await r.json(); const p=j.results?.[0];
  return p?{name:p.name,admin1:p.admin1,country:p.country,lat,lon}:{name:`${lat.toFixed(2)},${lon.toFixed(2)}`,lat,lon};
}
async function geocode(q){
  const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en`);
  const j=await r.json(); const p=j.results?.[0];
  return p?{name:p.name,admin1:p.admin1,country:p.country,lat:p.latitude,lon:p.longitude}:null;
}

/* === FETCH + RENDER === */
async function loadWeather(lat,lon,info={},silent=false){
  const u=state.unit==='imperial'?{t:'fahrenheit',w:'mph',p:'inchmercury'}:{t:'celsius',w:'kmh',p:'hPa'};
  const q=new URLSearchParams({
    latitude:lat,longitude:lon,timezone:'auto',
    current:'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,pressure_msl,weather_code,is_day',
    daily:'temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,weathercode',
    temperature_unit:u.t,wind_speed_unit:u.w,pressure_unit:u.p
  });
  const res=await fetch(`https://api.open-meteo.com/v1/forecast?${q}`);
  const d=await res.json();
  renderAll(d,info);
  if(!silent) toast("Weather updated!");
  state.last={lat,lon,name:info.name,admin1:info.admin1,country:info.country};
  localStorage.setItem('wxLast',JSON.stringify(state.last));
  fetchAir(lat,lon);
  fetchAlerts(lat,lon);
}

/* === RENDER === */
function renderAll(d,info){
  const c=d.current,day=d.daily;
  els.locName.textContent=info.name||"—";
  els.locMeta.textContent=[info.admin1,info.country].filter(Boolean).join(", ");
  els.updated.textContent="Last updated: "+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  els.temp.textContent=Math.round(c.temperature_2m);
  els.unit.textContent=unit();
  els.feels.textContent=Math.round(c.apparent_temperature);
  els.hum.textContent=c.relative_humidity_2m;
  els.wind.textContent=Math.round(c.wind_speed_10m)+' '+(state.unit==='imperial'?'mph':'km/h');
  els.windDir.textContent=degToDir(c.wind_direction_10m);
  els.press.textContent=formatPressure(c.pressure_msl);
  els.uv.textContent=day.uv_index_max[0];
  els.sunrise.textContent=formatTime(day.sunrise[0]);
  els.sunset.textContent=formatTime(day.sunset[0]);
  els.summary.textContent=genSummary(c,day,info);
  els.emoji.textContent=emojiFor(c.weather_code,c.is_day);
  renderForecast(day);
  setSky(c.weather_code,c.is_day);
}

/* === FORECAST === */
function renderForecast(d){
  els.forecast.innerHTML='';
  for(let i=0;i<Math.min(5,d.time.length);i++){
    const el=document.createElement('div');
    el.className='forecast-card';
    el.innerHTML=`<div>${new Date(d.time[i]).toLocaleDateString([], {weekday:'short'})}</div>
      <div style="font-size:32px">${emojiFor(d.weathercode[i],1)}</div>
      <div><b>${Math.round(d.temperature_2m_max[i])}${unit()}</b> / ${Math.round(d.temperature_2m_min[i])}${unit()}</div>`;
    els.forecast.appendChild(el);
  }
}

/* === AIR QUALITY === */
async function fetchAir(lat,lon){
  try{
    const r=await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`);
    const j=await r.json(); const a=j.current.us_aqi;
    els.air.textContent=a+' AQI '+aqiLabel(a);
  }catch{els.air.textContent='—';}
}

/* === ALERTS === */
async function fetchAlerts(lat,lon){
  try{
    const r=await fetch(`https://api.open-meteo.com/v1/warnings?latitude=${lat}&longitude=${lon}&timezone=auto`);
    const j=await r.json(); const w=j.warnings;
    if(!w?.length){els.alerts.classList.add('hidden');return;}
    els.alerts.classList.remove('hidden');
    els.alerts.innerHTML=w.map(x=>`<div><strong>${x.event}</strong><br><small>${x.sender}</small></div>`).join('<hr>');
  }catch{els.alerts.classList.add('hidden');}
}

/* === HELPERS === */
function unit(){return state.unit==='imperial'?'°F':'°C';}
function formatPressure(v){return state.unit==='imperial'?(v>70?(v*0.02953).toFixed(2)+' inHg':v+' inHg'):(v<70?(v/0.02953).toFixed(0)+' hPa':Math.round(v)+' hPa');}
function formatTime(s){return new Date(s).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});}
function degToDir(deg){const dirs=['N','NE','E','SE','S','SW','W','NW'];return dirs[Math.round(deg/45)%8];}
function setSky(c,isDay){
  let sky='default';
  if([0,1].includes(c)) sky=isDay?'clear':'night';
  else if([2,3].includes(c)) sky=isDay?'clear':'night';
  else if([61,63,65,80,81,82].includes(c)) sky='rain';
  else if([71,73,75].includes(c)) sky='snow';
  else if([95,96,97].includes(c)) sky='storm';
  document.body.dataset.sky=sky;
}
function emojiFor(code,isDay){
  if([0,1].includes(code))return isDay?'☀️':'🌙';
  if([2,3].includes(code))return isDay?'🌤️':'☁️';
  if([45,48].includes(code))return'🌫️';
  if([51,61,63,65,80,81,82].includes(code))return'🌧️';
  if([71,73,75].includes(code))return'🌨️';
  if([95,96,97].includes(code))return'⛈️';
  return'☁️';
}
function genSummary(c,day,info){
  const feels=Math.round(c.apparent_temperature);
  const main=wxText(c.weather_code);
  const hi=Math.round(day.temperature_2m_max[0]);
  const lo=Math.round(day.temperature_2m_min[0]);
  const wind=Math.round(c.wind_speed_10m);
  const city=info.name||'your area';
  return `Currently ${feels}${unit()} and ${main.toLowerCase()} in ${city}. Expect a high near ${hi}${unit()} and low of ${lo}${unit()} with winds around ${wind} ${state.unit==='imperial'?'mph':'km/h'}.`;
}
function wxText(c){const m={0:"Clear",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Fog",51:"Drizzle",61:"Rain",63:"Rain",65:"Heavy rain",71:"Snow",73:"Snow",75:"Heavy snow",95:"Thunderstorm"};return m[c]||'—';}
function aqiLabel(a){if(a<=50)return'🟢 Good';if(a<=100)return'🟡 Moderate';if(a<=150)return'🟠 Unhealthy';if(a<=200)return'🔴 Very Unhealthy';return'🟣 Hazardous';}
function fallback(){loadWeather(40.7128,-74.0060,{name:"New York, US"});}
})();
