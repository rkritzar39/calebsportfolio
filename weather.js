function updateTime(){
  document.getElementById("date-time").textContent =
    new Date().toLocaleString(undefined,{weekday:"long",hour:"2-digit",minute:"2-digit"});
}
setInterval(updateTime,60000);updateTime();

// ---- Open-Meteo weather + air quality ----
async function getWeather(lat,lon){
  const base=`latitude=${lat}&longitude=${lon}&timezone=auto`;
  const fURL=`https://api.open-meteo.com/v1/forecast?${base}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,weathercode,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,weathercode&alerts=true`;
  const aURL=`https://air-quality-api.open-meteo.com/v1/air-quality?${base}&hourly=pm10,pm2_5,carbon_monoxide,ozone,us_aqi`;
  const [fRes,aRes]=await Promise.all([fetch(fURL),fetch(aURL)]);
  const forecast=await fRes.json(), air=await aRes.json();
  render(forecast,air,lat,lon);
}

function codeToText(c){
  const map={0:"Clear",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",
  48:"Freezing fog",51:"Drizzle",61:"Rain",71:"Snow",80:"Showers",95:"Thunderstorm"};
  return map[c]||"—";
}

function render(f,a,lat,lon){
  const cur=f.current_weather;
  document.getElementById("city").textContent=`${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  document.getElementById("temp").textContent=Math.round(cur.temperature)+"°";
  document.getElementById("desc").textContent=codeToText(cur.weathercode);
  document.getElementById("extra").textContent=`Wind ${Math.round(cur.windspeed)} km/h`;
  const sr=new Date(f.daily.sunrise[0]).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  const ss=new Date(f.daily.sunset[0]).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  document.getElementById("sun").textContent=`☀️ ${sr}  🌙 ${ss}`;

  // Hourly
  const h=document.getElementById("hourly");h.innerHTML="";
  for(let i=0;i<12;i++){
    const t=Math.round(f.hourly.temperature_2m[i]);
    const hr=new Date(f.hourly.time[i]).getHours();
    h.insertAdjacentHTML("beforeend",`<div class="hour"><p>${hr}:00</p><p>${t}°</p></div>`);
  }

  // Daily
  const dl=document.getElementById("daily");dl.innerHTML="";
  for(let i=0;i<7;i++){
    const day=new Date(f.daily.time[i]).toLocaleDateString(undefined,{weekday:"short"});
    const hi=Math.round(f.daily.temperature_2m_max[i]);
    const lo=Math.round(f.daily.temperature_2m_min[i]);
    dl.insertAdjacentHTML("beforeend",`<div class="day"><span>${day}</span><span>${hi}° / ${lo}°</span></div>`);
  }

  // Air quality
  const aqi=document.getElementById("aqi");
  const aqiVal=a.hourly.us_aqi[0];
  aqi.innerHTML=`<div>US AQI: <strong>${aqiVal}</strong></div>
  <div>PM2.5: ${a.hourly.pm2_5[0]} µg/m³</div>
  <div>O₃: ${a.hourly.ozone[0]} µg/m³</div>`;

  // Alerts
  const al=document.getElementById("alerts");
  if(f.alerts && f.alerts.length){
    al.innerHTML=f.alerts.map(x=>`
      <div style="background:rgba(255,0,0,.15);border-radius:12px;padding:10px;margin:6px 0">
        <strong>${x.event}</strong><br>
        <small>${x.sender_name||""}</small><br>
        ${x.description}
      </div>`).join("");
  } else al.textContent="No active alerts.";

  initRadar(lat,lon);
}

// ---- Radar (NOAA US + RainViewer fallback) ----
let map;
function initRadar(lat,lon){
  if(!window.L)return;
  if(map){map.setView([lat,lon],6);return;}
  map=L.map("radar",{zoomControl:false,attributionControl:false}).setView([lat,lon],6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:10}).addTo(map);

  // NOAA if inside US bounding box, else RainViewer
  if(lat>24&&lat<50&&lon>-125&&lon<-66){
    L.tileLayer.wms(
      "https://nowcoast.noaa.gov/arcgis/services/nowcoast/radar_meteo_imagery_nexrad_time/MapServer/WMSServer",
      {layers:1,format:"image/png",transparent:true,opacity:0.6}).addTo(map);
  }else{
    L.tileLayer(
      "https://tilecache.rainviewer.com/v2/radar/0/256/{z}/{x}/{y}/2/1_1.png",
      {opacity:0.6}).addTo(map);
  }
}

// ---- Start ----
navigator.geolocation.getCurrentPosition(
  p=>getWeather(p.coords.latitude,p.coords.longitude),
  ()=>getWeather(40.7128,-74.0060)
);
