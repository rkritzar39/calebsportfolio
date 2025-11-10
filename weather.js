/* Weather app using Open-Meteo (no API keys)
   Fixed: improved geolocation + fallback + remembered city
*/

(() => {
  const els = {
    cityInput: document.getElementById("city-input"),
    citySubmit: document.getElementById("city-submit"),
    useLocation: document.getElementById("use-location"),
    unitBtns: [...document.querySelectorAll(".unit-btn")],
    locName: document.getElementById("loc-name"),
    locMeta: document.getElementById("loc-meta"),
    tempNow: document.getElementById("temp-now"),
    tempUnit: document.getElementById("temp-unit"),
    feelsLike: document.getElementById("feels-like"),
    feelsUnit: document.getElementById("feels-unit"),
    humidity: document.getElementById("humidity"),
    wind: document.getElementById("wind"),
    pressure: document.getElementById("pressure"),
    uv: document.getElementById("uv"),
    uvCat: document.getElementById("uv-cat"),
    sunrise: document.getElementById("sunrise"),
    sunset: document.getElementById("sunset"),
    tempHi: document.getElementById("temp-hi"),
    tempLo: document.getElementById("temp-lo"),
    summary: document.getElementById("summary"),
    forecastRow: document.getElementById("forecast-row"),
    toast: document.getElementById("toast")
  };

  const state = {
    unit: localStorage.getItem("wxUnit") || "imperial",
    lastQuery: JSON.parse(localStorage.getItem("wxLastQuery") || "null"),
  };

  init();

  function init(){
    setUnitUI(state.unit);

    els.citySubmit.addEventListener("click", onCitySearch);
    els.cityInput.addEventListener("keydown", (e)=>{ if(e.key==="Enter") onCitySearch(); });
    els.useLocation.addEventListener("click", ()=> useMyLocation({silent:false}));
    els.unitBtns.forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const u = btn.dataset.unit;
        if(u !== state.unit){
          state.unit = u;
          localStorage.setItem("wxUnit", state.unit);
          setUnitUI(state.unit);
          if(state.lastQuery){
            fetchAndRender(state.lastQuery.lat, state.lastQuery.lon, state.lastQuery);
          }
        }
      });
    });

    // Try last location first
    if(state.lastQuery){
      fetchAndRender(state.lastQuery.lat, state.lastQuery.lon, state.lastQuery);
    } else {
      // Try location, fallback if blocked
      useMyLocation({silent:true});
    }
  }

  function setUnitUI(u){
    els.unitBtns.forEach(b=>b.classList.toggle("active", b.dataset.unit===u));
    const isImp = u === "imperial";
    els.tempUnit.textContent = isImp ? "°F" : "°C";
    els.feelsUnit.textContent = isImp ? "°F" : "°C";
  }

  // ====== Interactions ======
  async function onCitySearch(){
    const name = (els.cityInput.value || "").trim();
    if(!name){ return toast("Type a city name to search."); }
    try{
      const loc = await geocodeCity(name);
      if(!loc) throw new Error("City not found.");
      await fetchAndRender(loc.latitude, loc.longitude, loc);
    }catch(err){
      toast(err.message || "Failed to find that city.");
    }
  }

  function useMyLocation(opts = {}){
    if(!navigator.geolocation){
      if(!opts.silent) toast("Geolocation not supported on this device.");
      fallbackToDefault();
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos)=>{
      const { latitude: lat, longitude: lon } = pos.coords || {};
      try{
        const loc = await reverseGeocode(lat, lon);
        await fetchAndRender(lat, lon, loc || { name: `${lat.toFixed(3)}, ${lon.toFixed(3)}` });
      }catch(e){
        toast("Could not get weather for your location, loading fallback city.");
        fallbackToDefault();
      }
    }, async (err)=>{
      if(!opts.silent) toast("Couldn't get location, using fallback city.");
      fallbackToDefault();
    }, { enableHighAccuracy:true, timeout: 20000, maximumAge: 10000 });
  }

  async function fallbackToDefault(){
    await fetchAndRender(40.7128, -74.0060, { name: "New York, US", country: "US" });
  }

  // ====== Data Fetching ======
  async function geocodeCity(name){
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if(!res.ok) throw new Error("Geocoding failed");
    const data = await res.json();
    if(!data.results?.length) return null;
    const r = data.results[0];
    return {
      name: r.name,
      admin1: r.admin1,
      country: r.country,
      timezone: r.timezone,
      latitude: r.latitude,
      longitude: r.longitude,
    };
  }

  async function reverseGeocode(lat, lon){
    const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`;
    const res = await fetch(url);
    if(!res.ok) return null;
    const data = await res.json();
    const r = data?.results?.[0];
    if(!r) return null;
    return {
      name: r.name || "My location",
      admin1: r.admin1,
      country: r.country,
      timezone: r.timezone,
      latitude: lat,
      longitude: lon,
    };
  }

  function unitParams(unit){
    return unit === "imperial" ? {
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
      precipitation_unit: "inch",
      pressure_unit: "inchmercury"
    } : {
      temperature_unit: "celsius",
      wind_speed_unit: "kmh",
      precipitation_unit: "mm",
      pressure_unit: "hPa"
    };
  }

  async function fetchAndRender(lat, lon, locInfo = {}){
    const u = unitParams(state.unit);
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      timezone: "auto",
      current: [
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "wind_speed_10m",
        "pressure_msl"
      ].join(","),
      hourly: [
        "uv_index",
        "weathercode",
        "temperature_2m"
      ].join(","),
      daily: [
        "temperature_2m_max",
        "temperature_2m_min",
        "sunrise",
        "sunset",
        "uv_index_max",
        "precipitation_sum",
        "weathercode"
      ].join(","),
      temperature_unit: u.temperature_unit,
      wind_speed_unit: u.wind_speed_unit,
      precipitation_unit: u.precipitation_unit,
      pressure_unit: u.pressure_unit
    });

    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if(!res.ok) throw new Error("Weather request failed.");
    const data = await res.json();

    state.lastQuery = {
      lat, lon,
      name: locInfo.name || "—",
      admin1: locInfo.admin1,
      country: locInfo.country,
      timezone: data.timezone || locInfo.timezone
    };
    localStorage.setItem("wxLastQuery", JSON.stringify(state.lastQuery));

    renderAll(data);
  }

  // ====== Rendering ======
  function renderAll(data){
    const loc = state.lastQuery;
    const subtitle = [loc.admin1, loc.country].filter(Boolean).join(", ");
    els.locName.textContent = loc.name || "—";
    els.locMeta.textContent = subtitle || loc.timezone || "—";

    const c = data.current || {};
    const d = data.daily || {};
    const hourly = data.hourly || {};

    const nowIdx = findClosestIndex(hourly?.time, data?.current?.time);
    const code = (hourly?.weathercode?.[nowIdx] ?? d?.weathercode?.[0] ?? null);
    els.summary.textContent = weatherCodeToText(code);

    els.tempNow.textContent = round(c.temperature_2m);
    els.tempHi.textContent  = "H: " + round(d.temperature_2m_max?.[0]) + unitSymbol();
    els.tempLo.textContent  = "L: " + round(d.temperature_2m_min?.[0]) + unitSymbol();

    els.feelsLike.textContent = round(c.apparent_temperature);
    els.humidity.textContent = safeInt(c.relative_humidity_2m);
    els.wind.textContent = formatWind(c.wind_speed_10m);
    els.pressure.textContent = formatPressure(c.pressure_msl);

    const uvIdx = findClosestIndex(hourly?.time, data?.current?.time);
    const uvNow = (hourly?.uv_index?.[uvIdx] ?? d?.uv_index_max?.[0] ?? null);
    els.uv.textContent = uvNow != null ? Math.round(uvNow) : "—";
    els.uvCat.textContent = uvCategory(uvNow);
    els.uvCat.className = "chip " + uvBadgeClass(uvNow);

    els.sunrise.textContent = toLocalShortTime(d.sunrise?.[0]);
    els.sunset.textContent  = toLocalShortTime(d.sunset?.[0]);

    renderForecast(d);
  }

  function renderForecast(d){
    const days = d?.time || [];
    const max = d?.temperature_2m_max || [];
    const min = d?.temperature_2m_min || [];
    const codes = d?.weathercode || [];
    const take = Math.min(days.length, 5);
    els.forecastRow.innerHTML = "";
    for(let i=0;i<take;i++){
      const date = new Date(days[i]);
      const label = date.toLocaleDateString([], { weekday:"short" });
      const card = document.createElement("div");
      card.className = "forecast-card";
      card.innerHTML = `
        <div class="forecast-day">${label}</div>
        <div class="forecast-icon">${iconForCode(codes[i])}</div>
        <div class="forecast-hi">${round(max[i])}${unitSymbol()}</div>
        <div class="forecast-lo">${round(min[i])}${unitSymbol()}</div>
      `;
      els.forecastRow.appendChild(card);
    }
  }

  // ====== Helpers ======
  function toast(msg){
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(els.toast._t);
    els.toast._t = setTimeout(()=> els.toast.classList.remove("show"), 3000);
  }

  function round(v){ return (v == null || isNaN(v)) ? "—" : Math.round(v); }
  function safeInt(v){ return (v == null || isNaN(v)) ? "—" : Math.round(v); }
  function unitSymbol(){ return state.unit === "imperial" ? "°F" : "°C"; }

  function formatWind(v){
    if(v == null || isNaN(v)) return "—";
    return `${Math.round(v)} ${state.unit==='imperial'?'mph':'km/h'}`;
  }

  function formatPressure(v){
    if(v == null || isNaN(v)) return "—";
    if(state.unit === 'imperial'){
      if(v > 70){ v = v * 0.02953; }
      return `${v.toFixed(2)} inHg`;
    } else {
      if(v < 70){ v = v / 0.02953; }
      return `${Math.round(v)} hPa`;
    }
  }

  function findClosestIndex(times, targetIso){
    if(!Array.isArray(times) || !times.length) return 0;
    let target = targetIso ? new Date(targetIso).getTime() : Date.now();
    let best = 0, bestDiff = Infinity;
    for(let i=0;i<times.length;i++){
      const diff = Math.abs(new Date(times[i]).getTime() - target);
      if(diff < bestDiff){ best = i; bestDiff = diff; }
    }
    return best;
  }

  function toLocalShortTime(iso){
    if(!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour:'numeric', minute:'2-digit' });
  }

  function uvCategory(u){
    if(u == null || isNaN(u)) return "—";
    if(u < 3) return "Low";
    if(u < 6) return "Moderate";
    if(u < 8) return "High";
    if(u < 11) return "Very High";
    return "Extreme";
  }

  function uvBadgeClass(u){
    if(u == null || isNaN(u)) return "";
    if(u < 3) return "uv-low";
    if(u < 6) return "uv-mod";
    if(u < 8) return "uv-high";
    if(u < 11) return "uv-vhigh";
    return "uv-ext";
  }

  function weatherCodeToText(code){
    const m = {
      0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",
      45:"Fog",48:"Rime fog",51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",
      61:"Light rain",63:"Rain",65:"Heavy rain",66:"Freezing rain",67:"Freezing rain",
      71:"Light snow",73:"Snow",75:"Heavy snow",77:"Snow grains",
      80:"Rain showers",81:"Heavy rain showers",82:"Violent rain showers",
      85:"Snow showers",86:"Heavy snow showers",
      95:"Thunderstorm",96:"Thunderstorm (hail)",97:"Severe storm"
    };
    return m[code] || "—";
  }

  function iconForCode(code){
    if([0].includes(code)) return "☀️";
    if([1,2].includes(code)) return "🌤️";
    if([3].includes(code)) return "☁️";
    if([45,48].includes(code)) return "🌫️";
    if([51,53,55,61,63,65,80,81,82].includes(code)) return "🌧️";
    if([71,73,75,77,85,86].includes(code)) return "🌨️";
    if([95,96,97].includes(code)) return "⛈️";
    return "⛅️";
  }
})();
