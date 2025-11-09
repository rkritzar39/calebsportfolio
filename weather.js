let units = "metric"; // "metric" = °C, "imperial" = °F
let map;

// --- date/time header ---
function updateTime(){
  document.getElementById("date-time").textContent =
    new Date().toLocaleString(undefined,{weekday:"long",hour:"2-digit",minute:"2-digit"});
}
setInterval(updateTime,60000);updateTime();

// --- reverse-geocode to city/country ---
async function getCityName(lat,lon){
  try{
    const url=`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const r=await fetch(url,{headers:{'User-Agent':'LiquidGlassWeather/1.0 (demo)'}});
    const j=await r.json();
    const name=j.address.city || j.address.town || j.address.village || j.address.hamlet || j.display_name;
    const country=j.address.country || "";
    document.getElementById("city").textContent = `${name}${country ? ", "+country : ""}`;
  }catch(e){
    document.getElementById("city").textContent=`Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`;
  }
}

// --- main data fetch ---
async function getWeather(lat,lon){
  const base=`latitude=${lat}&longitude=${lon}&timezone=auto`;
  const tUnit=units==="imperial"?"fahrenheit":"celsius";
  const wUnit=units==="imperial"?"mph":"kmh";

  const forecastURL=`https://api.open-meteo.com/v1/forecast?${base}&current_weather=true`
    +`&hourly=temperature_2m,relative_humidity_2m,weathercode,windspeed_10m`
    +`&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,weathercode`
    +`&temperature_unit=${tUnit}&windspeed_unit=${wUnit}&timezone=auto`;

  const aqiURL=`https://air-quality-api.open-meteo.com/v1/air-quality?${base}&hourly=pm2_5,pm10,us_aqi`;

  const [fRes,aRes]=await Promise.all([fetch(forecastURL),fetch(aqiURL)]);
  const forecast=await fRes.json(), air=await aRes.json();
  render(forecast,air,lat,lon);
  getCityName(lat,lon);  // fetch city name separately
}

function codeToText(c){
  const m={0:"Clear",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",
           45:"Fog",48:"Freezing fog",51:"Drizzle",61:"Rain",
           71:"Snow",80:"Showers",95:"Thunderstorm"};
  return m[c]||"—";
}

function render(f,a,lat,lon){
  const cur=f.current_weather;
  const uTemp=units==="imperial"?"°F":"°C";
  const uWind=units==="imperial"?"mph":"km/h";

  document.getElementById("temp").textContent=`${Math.round(cur.temperature)}${uTemp}`;
  document.getElementById("desc").textContent=codeToText(cur.weathercode);
  document.getElementById("extra").textContent=`Wind ${Math.round(cur.windspeed)} ${uWind}`;
  const sr=new Date(f.daily.sunrise[0]).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  const ss=new Date(f.daily.sunset[0]).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  document.getElementById("sun").textContent=`☀️ ${sr}  🌙 ${ss}`;

  // hourly
  const h=document.getElementById("hourly");h.innerHTML="";
  for(let i=0;i<12;i++){
    const t=Math.round(f.hourly.temperature_2m[i]);
    const hr=new Date(f.hourly.time[i]).getHours();
    h.insertAdjacentHTML("beforeend",
      `<div class="hour"><p>${hr}:00</p><p>${t}${uTemp}</p></div>`);
  }

  // daily
  const d=document.getElementById("daily");d.innerHTML="";
  for(let i=0;i<7;i++){
    const day=new Date(f.daily.time[i]).toLocaleDateString(undefined,{weekday:"short"});
    const hi=Math.round(f.daily.temperature_2m_max[i]);
    const lo=Math.round(f.daily.temperature_2m_min[i]);
    d.insertAdjacentHTML("beforeend",
      `<div class="day"><span>${day}</span><span>${hi}${uTemp} / ${lo}${uTemp}</span></div>`);
  }

  // AQI
  const aqi=document.getElementById("aqi");
  if(a.hourly?.us_aqi){
    const val=a.hourly.us_aqi[0];
    let cat="Good";
    if(val>50)cat="Moderate";
    if(val>100)cat="Unhealthy";
    if(val>200)cat="Very Unhealthy";
    aqi.innerHTML=`US AQI <strong>${val}</strong> (${cat})<br>
      PM2.5 ${a.hourly.pm2_5[0]} µg/m³ • PM10 ${a.hourly.pm10[0]} µg/m³`;
  } else aqi.textContent="No air-quality data.";

  initRadar(lat,lon);
}

// --- Radar (RainViewer global) ---
function initRadar(lat,lon){
  if(!window.L)return;
  if(map){map.setView([lat,lon],6);return;}
  map=L.map("radar",{zoomControl:false,attributionControl:false}).setView([lat,lon],6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:10}).addTo(map);
  L.tileLayer("https://tilecache.rainviewer.com/v2/radar/0/256/{z}/{x}/{y}/2/1_1.png",
    {opacity:0.6}).addTo(map);
}

// --- Unit toggle ---
document.getElementById("unit-toggle").addEventListener("click",()=>{
  units = units==="metric"?"imperial":"metric";
  navigator.geolocation.getCurrentPosition(
    p=>getWeather(p.coords.latitude,p.coords.longitude),
    ()=>getWeather(40.7128,-74.0060)
  );
});

// --- Start ---
navigator.geolocation.getCurrentPosition(
  p=>getWeather(p.coords.latitude,p.coords.longitude),
  ()=>getWeather(40.7128,-74.0060)
);
