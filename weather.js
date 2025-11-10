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

function init(){
  setUnitUI();
  els.citySubmit.onclick=searchCity;
  els.cityInput.onkeydown=e=>{if(e.key==='Enter')searchCity()};
  els.useLoc.onclick=()=>getLocation();
  els.unitBtns.forEach(b=>b.onclick=()=>{if(!b.classList.contains('active')){state.unit=b.dataset.unit;localStorage.setItem('wxUnit',state.unit);setUnitUI();if(state.last)loadWeather(state.last.lat,state.last.lon,state.last)}});

  renderFavs();
  if(state.last){ loadWeather(state.last.lat,state.last.lon,state.last); }
  else getLocation({silent:true});

  // Auto refresh every 15m
  setInterval(()=>{if(state.last)loadWeather(state.last.lat,state.last.lon,state.last,true)},15*60*1000);
}

/* ==== UI ==== */
function setUnitUI(){ els.unitBtns.forEach(b=>b.classList.toggle('active',b.dataset.unit===state.unit)); }

/* ==== Location ==== */
function getLocation(opt={}){
  if(!navigator.geolocation){ if(!opt.silent) toast("Location not supported."); fallback(); return; }
  navigator.geolocation.getCurrentPosition(async pos=>{
    const {latitude:lat,longitude:lon}=pos.coords;
    let info=null;
    try{ info=await reverse(lat,lon); }catch{}
    await loadWeather(lat,lon,info||{name:"My Location"});
  },err=>{ if(!opt.silent) toast("Could not get location."); fallback(); },
  {enableHighAccuracy:true,timeout:20000,maximumAge:10000});
}
async function reverse(lat,lon){
  const r=await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en`);
  const j=await r.json();
  const p=j.results?.[0];
  return p?{name:p.name,admin1:p.admin1,country:p.country,lat,lon}:{name:`${lat.toFixed(2)},${lon.toFixed(2)}`,lat,lon};
}

/* ==== Fetch Weather ==== */
async function loadWeather(lat,lon,info={},silent){
  const u = state.unit==='imperial'?{t:'fahrenheit',w:'mph',p:'inchmercury'}:{t:'celsius',w:'kmh',p:'hPa'};
  const q = new URLSearchParams({
    latitude:lat,longitude:lon,timezone:'auto',
    current:'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,pressure_msl,weather_code',
    daily:'temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,weathercode',
    temperature_unit:u.t,wind_speed_unit:u.w,pressure_unit:u.p
  });
  const r=await fetch(`https://api.open-meteo.com/v1/forecast?${q}`);
  const j=await r.json();
  if(!j.current){toast("Weather unavailable.");return;}
  renderAll(j,info);
  if(!silent) toast("Weather updated!");
  // Save last
  state.last={lat,lon,name:info.name,admin1:info.admin1,country:info.country};
  localStorage.setItem('wxLast',JSON.stringify(state.last));
}

/* ==== Render ==== */
function renderAll(d,info){
  const c=d.current,day=d.daily;
  els.locName.textContent=info.name||'—';
  els.locMeta.textContent=[info.admin1,info.country].filter(Boolean).join(', ')||'';
  els.updated.textContent=`Last updated: ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
  els.temp.textContent=Math.round(c.temperature_2m);
  els.feels.textContent=Math.round(c.apparent_temperature);
  els.hum.textContent=c.relative_humidity_2m;
  els.wind.textContent=Math.round(c.wind_speed_10m)+' '+(state.unit==='imperial'?'mph':'km/h');
  els.press.textContent=formatPressure(c.pressure_msl);
  els.uv.textContent=day.uv_index_max[0];
  els.summary.textContent=wxText(c.weather_code);
  els.sunrise.textContent=formatTime(day.sunrise[0]);
  els.sunset.textContent=formatTime(day.sunset[0]);
  renderForecast(day);
  setSky(c.weather_code, d.current.is_day);
  fetchAlerts(d.latitude,d.longitude);
}
function renderForecast(d){
  els.forecast.innerHTML='';
  for(let i=0;i<Math.min(5,d.time.length);i++){
    const el=document.createElement('div');
    el.className='forecast-card';
    el.innerHTML=`<div>${new Date(d.time[i]).toLocaleDateString([], {weekday:'short'})}</div>
      <div>${icon(d.weathercode[i])}</div>
      <div><b>${Math.round(d.temperature_2m_max[i])}${unit()}</b> / ${Math.round(d.temperature_2m_min[i])}${unit()}</div>`;
    els.forecast.appendChild(el);
  }
}
async function fetchAlerts(lat,lon){
  try{
    const r=await fetch(`https://api.open-meteo.com/v1/warnings?latitude=${lat}&longitude=${lon}&timezone=auto`);
    const j=await r.json();
    const w=j?.warnings;
    if(!w?.length){els.alerts.classList.add('hidden');return;}
    els.alerts.classList.remove('hidden');
    els.alerts.innerHTML=w.map(x=>`<div><strong>${x.event}</strong><br><small>${x.sender}</small></div>`).join('<hr>');
  }catch{els.alerts.classList.add('hidden');}
}

/* ==== Helpers ==== */
function toast(m){els.toast.textContent=m;els.toast.classList.add('show');clearTimeout(els.toast._t);els.toast._t=setTimeout(()=>els.toast.classList.remove('show'),2500);}
function fallback(){loadWeather(40.7128,-74.006,'New York');}
function unit(){return state.unit==='imperial'?'°F':'°C';}
function formatPressure(v){return state.unit==='imperial'? (v>70?(v*0.02953).toFixed(2)+' inHg':v+' inHg'): (v<70?(v/0.02953).toFixed(0)+' hPa':Math.round(v)+' hPa');}
function formatTime(s){return new Date(s).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});}
function wxText(c){const m={0:"Clear",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Fog",51:"Drizzle",61:"Rain",63:"Rain",65:"Heavy rain",71:"Snow",73:"Snow",75:"Heavy snow",95:"Thunderstorm"};return m[c]||'—';}
function icon(c){if([0,1].includes(c))return'☀️';if([2,3].includes(c))return'⛅️';if([45,48].includes(c))return'🌫️';if([51,61,63,65].includes(c))return'🌧️';if([71,73,75].includes(c))return'🌨️';if([95].includes(c))return'⛈️';return'☁️';}
function setSky(c,isDay){
  let sky='default';
  if([0,1].includes(c)) sky=isDay?'clear':'night';
  else if([2,3].includes(c)) sky=isDay?'clear':'night';
  else if([61,63,65,80,81,82].includes(c)) sky='rain';
  else if([71,73,75].includes(c)) sky='snow';
  else if([95,96,97].includes(c)) sky='storm';
  document.body.dataset.sky=sky;
}

/* ==== Favs ==== */
function renderFavs(){
  els.favs.innerHTML='';
  state.favs.forEach((f,i)=>{
    const b=document.createElement('button');
    b.className='btn ghost';
    b.textContent=f.name;
    b.onclick=()=>loadWeather(f.lat,f.lon,f);
    els.favs.appendChild(b);
  });
}
})();
