// =====================================================
// Weather Website (OpenWeather free endpoints)
// - Geocoding (direct/reverse)
// - Current weather
// - 5 day / 3 hour forecast (hourly + daily derived)
// - Air pollution (AQI + pollutants)
// - Units toggle + time format toggle + unit display pill
// - Saves last location + prefs
//
// Notes:
// - OpenWeather recommends using Geocoding API; built-in geocoding is deprecated. :contentReference[oaicite:8]{index=8}
// =====================================================

// ====== CONFIG ======
const OPENWEATHER_KEY = "57e2ef8d1ddf45ced53b8444e23ce2b7";

// Base host for free calls is api.openweathermap.org :contentReference[oaicite:9]{index=9}
const API = "https://api.openweathermap.org";

// ====== DOM ======
const $ = (id) => document.getElementById(id);

const searchForm = $("searchForm");
const cityInput  = $("cityInput");
const geoBtn     = $("geoBtn");
const refreshBtn = $("refreshBtn");
const statusEl   = $("status");
const unitPill   = $("unitPill");

const unitF = $("unitF");
const unitC = $("unitC");
const time12 = $("time12");
const time24 = $("time24");

const currentCard = $("currentCard");
const airCard     = $("airCard");
const hourlyCard  = $("hourlyCard");
const dailyCard   = $("dailyCard");

const placeEl = $("place");
const metaEl  = $("meta");
const iconEl  = $("icon");

const tempEl       = $("temp");
const feelsEl      = $("feels");
const windEl       = $("wind");
const humidityEl   = $("humidity");
const pressureEl   = $("pressure");
const visibilityEl = $("visibility");

const sunEl    = $("sun");
const hiLoEl   = $("hiLo");
const cloudsEl = $("clouds");

const hourlyEl = $("hourly");
const dailyEl  = $("daily");

// Air quality
const aqiBadge = $("aqiBadge");
const aqiText  = $("aqiText");
const pm25El   = $("pm25");
const pm10El   = $("pm10");
const o3El     = $("o3");
const no2El    = $("no2");
const so2El    = $("so2");
const coEl     = $("co");

// ====== STATE ======
let units = localStorage.getItem("weather_units") || "imperial"; // imperial=F, metric=C
let timeFormat = localStorage.getItem("weather_time") || "12";   // "12" or "24"

let lastCity = localStorage.getItem("weather_city") || "";
let lastCoords = JSON.parse(localStorage.getItem("weather_coords") || "null");

// ====== HELPERS ======
function setStatus(msg) { statusEl.textContent = msg || ""; }

function ensureKey() {
  if (!OPENWEATHER_KEY || OPENWEATHER_KEY.includes("YOUR_API_KEY_HERE")) {
    setStatus("Add your OpenWeather API key in weather.js (OPENWEATHER_KEY).");
    return false;
  }
  return true;
}

function setUnits(nextUnits) {
  units = nextUnits;
  localStorage.setItem("weather_units", units);

  const isF = units === "imperial";
  unitF.classList.toggle("is-active", isF);
  unitC.classList.toggle("is-active", !isF);
  unitF.setAttribute("aria-pressed", String(isF));
  unitC.setAttribute("aria-pressed", String(!isF));
  updateUnitPill();
}

function setTimeFormat(next) {
  timeFormat = next;
  localStorage.setItem("weather_time", timeFormat);

  const is12 = timeFormat === "12";
  time12.classList.toggle("is-active", is12);
  time24.classList.toggle("is-active", !is12);
  time12.setAttribute("aria-pressed", String(is12));
  time24.setAttribute("aria-pressed", String(!is12));
}

function updateUnitPill() {
  const tempUnit = units === "imperial" ? "°F" : "°C";
  const windUnit = units === "imperial" ? "mph" : "m/s";
  unitPill.textContent = `${tempUnit} • wind ${windUnit} • time ${timeFormat}h`;
}

function iconUrl(icon) { return `https://openweathermap.org/img/wn/${icon}@2x.png`; }

function fmtTemp(x) {
  if (x === undefined || x === null || Number.isNaN(x)) return "—";
  return `${Math.round(x)}°`;
}

function fmtWind(speed) {
  if (speed === undefined || speed === null || Number.isNaN(speed)) return "—";
  return units === "imperial" ? `${Math.round(speed)} mph` : `${Math.round(speed)} m/s`;
}

function fmtKm(meters) {
  if (meters == null) return "—";
  return `${(meters / 1000).toFixed(1)} km`;
}

function pad2(n) { return String(n).padStart(2, "0"); }

// Build a Date object representing the location-local time using timezone offset seconds.
function dateFromUnixLocal(unixSeconds, tzOffsetSeconds) {
  const ms = (unixSeconds + tzOffsetSeconds) * 1000;
  return new Date(ms);
}

function formatLocalTime(unixSeconds, tzOffsetSeconds) {
  const d = dateFromUnixLocal(unixSeconds, tzOffsetSeconds);
  const hh = d.getUTCHours();
  const mm = d.getUTCMinutes();

  if (timeFormat === "24") return `${pad2(hh)}:${pad2(mm)}`;

  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${pad2(mm)} ${ampm}`;
}

function formatLocalDateTime(unixSeconds, tzOffsetSeconds) {
  const d = dateFromUnixLocal(unixSeconds, tzOffsetSeconds);
  const y = d.getUTCFullYear();
  const mo = pad2(d.getUTCMonth() + 1);
  const da = pad2(d.getUTCDate());
  return `${y}-${mo}-${da} ${formatLocalTime(unixSeconds, tzOffsetSeconds)}`;
}

function dayKeyFromUnix(unixSeconds, tzOffsetSeconds) {
  const d = dateFromUnixLocal(unixSeconds, tzOffsetSeconds);
  const y = d.getUTCFullYear();
  const mo = pad2(d.getUTCMonth() + 1);
  const da = pad2(d.getUTCDate());
  return `${y}-${mo}-${da}`;
}

function weekdayLabelFromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j?.message || "";
    } catch {}
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.json();
}

function showCards(show) {
  currentCard.hidden = !show;
  airCard.hidden     = !show;
  hourlyCard.hidden  = !show;
  dailyCard.hidden   = !show;
}

// ====== OPENWEATHER ENDPOINTS ======
// Geocoding API :contentReference[oaicite:10]{index=10}
async function geocodeDirect(query) {
  const q = encodeURIComponent(query);
  const url = `${API}/geo/1.0/direct?q=${q}&limit=5&appid=${OPENWEATHER_KEY}`;
  return fetchJSON(url);
}

async function geocodeReverse(lat, lon) {
  const url = `${API}/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_KEY}`;
  return fetchJSON(url);
}

// Current Weather :contentReference[oaicite:11]{index=11}
async function getCurrent(lat, lon) {
  const url = `${API}/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${OPENWEATHER_KEY}`;
  return fetchJSON(url);
}

// 5 day / 3 hour forecast :contentReference[oaicite:12]{index=12}
async function getForecast(lat, lon) {
  const url = `${API}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${OPENWEATHER_KEY}`;
  return fetchJSON(url);
}

// Air Pollution API :contentReference[oaicite:13]{index=13}
async function getAir(lat, lon) {
  const url = `${API}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}`;
  return fetchJSON(url);
}

// ====== LOADERS ======
async function loadByQuery(searchText) {
  if (!ensureKey()) return;
  const q = searchText?.trim();
  if (!q) return setStatus("Type a city first.");

  setStatus("Finding location…");
  const matches = await geocodeDirect(q);

  if (!matches?.length) {
    showCards(false);
    setStatus("No matching city found. Try adding state/country like “Toledo, OH, US”.");
    return;
  }

  // Pick the top match
  const top = matches[0];
  const lat = top.lat;
  const lon = top.lon;

  localStorage.setItem("weather_city", q);
  localStorage.setItem("weather_coords", JSON.stringify({ lat, lon }));
  lastCity = q;
  lastCoords = { lat, lon };

  await loadByCoords(lat, lon, top);
}

async function loadByCoords(lat, lon, geoHint = null) {
  if (!ensureKey()) return;

  setStatus("Loading weather…");

  // If we don’t have a nice name, reverse geocode it
  let geo = geoHint;
  if (!geo) {
    try {
      const rev = await geocodeReverse(lat, lon);
      geo = rev?.[0] || null;
    } catch {
      geo = null;
    }
  }

  // Fetch in parallel
  const [current, forecast, air] = await Promise.all([
    getCurrent(lat, lon),
    getForecast(lat, lon),
    getAir(lat, lon),
  ]);

  renderAll(current, forecast, air, geo);
  setStatus("");
}

function aqiLabel(aqi) {
  // OpenWeather AQI scale: 1..5
  // 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor :contentReference[oaicite:14]{index=14}
  switch (aqi) {
    case 1: return ["Good", "Air is clean."];
    case 2: return ["Fair", "Air is okay; sensitive folks might notice."];
    case 3: return ["Moderate", "Sensitive groups should take it easy."];
    case 4: return ["Poor", "Limit outdoor activity if you can."];
    case 5: return ["Very Poor", "Avoid long outdoor exposure."];
    default: return ["—", "—"];
  }
}

// ====== RENDER ======
function renderAll(current, forecast, air, geo) {
  showCards(true);
  updateUnitPill();

  // Location display
  const name = geo?.name || current?.name || "Unknown location";
  const state = geo?.state ? `, ${geo.state}` : "";
  const country = geo?.country ? `, ${geo.country}` : (current?.sys?.country ? `, ${current.sys.country}` : "");
  placeEl.textContent = `${name}${state}${country}`;

  // Meta line
  const desc = current?.weather?.[0]?.description ?? "—";
  const tz = current?.timezone ?? 0;
  const updated = current?.dt ? formatLocalDateTime(current.dt, tz) : "—";
  metaEl.textContent = `${desc} • Updated ${updated}`;

  // Icon
  const icon = current?.weather?.[0]?.icon;
  if (icon) {
    iconEl.src = iconUrl(icon);
    iconEl.alt = desc;
  } else {
    iconEl.removeAttribute("src");
    iconEl.alt = "";
  }

  // Numbers
  tempEl.textContent = fmtTemp(current?.main?.temp);
  feelsEl.textContent = `Feels like ${fmtTemp(current?.main?.feels_like)}`;

  windEl.textContent = fmtWind(current?.wind?.speed);
  humidityEl.textContent = current?.main?.humidity != null ? `${current.main.humidity}%` : "—";
  pressureEl.textContent = current?.main?.pressure != null ? `${current.main.pressure} hPa` : "—";
  visibilityEl.textContent = fmtKm(current?.visibility);

  // Extras
  const sunrise = current?.sys?.sunrise ? formatLocalTime(current.sys.sunrise, tz) : "—";
  const sunset  = current?.sys?.sunset  ? formatLocalTime(current.sys.sunset, tz) : "—";
  sunEl.textContent = `Sun: ${sunrise} ↑  ${sunset} ↓`;

  const hi = current?.main?.temp_max != null ? fmtTemp(current.main.temp_max) : "—";
  const lo = current?.main?.temp_min != null ? fmtTemp(current.main.temp_min) : "—";
  hiLoEl.textContent = `H/L: ${hi} / ${lo}`;

  const clouds = current?.clouds?.all != null ? `${current.clouds.all}%` : "—";
  cloudsEl.textContent = `Clouds: ${clouds}`;

  renderHourly(forecast);
  renderDaily(forecast);
  renderAir(air);
}

function renderHourly(forecast) {
  const list = forecast?.list || [];
  const tzOffset = forecast?.city?.timezone ?? 0;

  // Next 24 hours = 8 blocks of 3 hours
  const next = list.slice(0, 8);

  hourlyEl.innerHTML = next.map(item => {
    const time = item?.dt ? formatLocalTime(item.dt, tzOffset) : "—";
    const t = fmtTemp(item?.main?.temp);
    const icon = item?.weather?.[0]?.icon;
    const main = item?.weather?.[0]?.main ?? "";
    return `
      <div class="hour">
        <div class="h">${time}</div>
        ${icon ? `<img src="${iconUrl(icon)}" alt="${main}">` : ""}
        <div class="t">${t}</div>
      </div>
    `;
  }).join("");
}

function renderDaily(forecast) {
  const list = forecast?.list || [];
  const tzOffset = forecast?.city?.timezone ?? 0;

  const byDay = new Map();
  for (const item of list) {
    const key = dayKeyFromUnix(item.dt, tzOffset);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(item);
  }

  const days = Array.from(byDay.entries()).slice(0, 5);

  dailyEl.innerHTML = days.map(([key, items]) => {
    let min = Infinity;
    let max = -Infinity;

    // choose an entry closest to 12:00 for icon/desc
    let best = items[0];
    let bestDist = Infinity;

    for (const it of items) {
      const temp = it?.main?.temp;
      if (typeof temp === "number") {
        min = Math.min(min, temp);
        max = Math.max(max, temp);
      }
      const d = dateFromUnixLocal(it.dt, tzOffset);
      const hour = d.getUTCHours();
      const dist = Math.abs(hour - 12);
      if (dist < bestDist) {
        bestDist = dist;
        best = it;
      }
    }

    const label = weekdayLabelFromKey(key);
    const desc = best?.weather?.[0]?.description ?? "—";
    const icon = best?.weather?.[0]?.icon;
    const range = (min !== Infinity && max !== -Infinity)
      ? `${fmtTemp(max)} / ${fmtTemp(min)}`
      : "—";

    return `
      <div class="day">
        <div class="name">${label}</div>
        <div class="desc">
          ${icon ? `<img src="${iconUrl(icon)}" alt="" style="width:28px;height:28px;vertical-align:middle;margin-right:6px;">` : ""}
          <span style="vertical-align:middle;">${desc}</span>
        </div>
        <div class="range">${range}</div>
      </div>
    `;
  }).join("");
}

function renderAir(air) {
  const entry = air?.list?.[0];
  const aqi = entry?.main?.aqi;
  const comps = entry?.components || {};

  aqiBadge.textContent = aqi ? `AQI: ${aqi}` : "AQI: —";
  const [label, tip] = aqiLabel(aqi);
  aqiText.textContent = aqi ? `${label} • ${tip}` : "—";

  // μg/m³ per OpenWeather Air Pollution API :contentReference[oaicite:15]{index=15}
  pm25El.textContent = comps.pm2_5 != null ? `${comps.pm2_5}` : "—";
  pm10El.textContent = comps.pm10 != null ? `${comps.pm10}` : "—";
  o3El.textContent   = comps.o3 != null ? `${comps.o3}` : "—";
  no2El.textContent  = comps.no2 != null ? `${comps.no2}` : "—";
  so2El.textContent  = comps.so2 != null ? `${comps.so2}` : "—";
  coEl.textContent   = comps.co != null ? `${comps.co}` : "—";
}

// ====== EVENTS ======
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await loadByQuery(cityInput.value);
  } catch (err) {
    showCards(false);
    setStatus(`Couldn’t load weather: ${err.message}`);
  }
});

geoBtn.addEventListener("click", () => {
  if (!ensureKey()) return;
  if (!navigator.geolocation) return setStatus("Geolocation isn’t supported in this browser.");

  setStatus("Requesting location permission…");

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        localStorage.setItem("weather_coords", JSON.stringify({ lat, lon }));
        lastCoords = { lat, lon };

        await loadByCoords(lat, lon);
      } catch (err) {
        showCards(false);
        setStatus(`Couldn’t load weather: ${err.message}`);
      }
    },
    (err) => setStatus(`Location blocked/failed: ${err.message}`),
    { enableHighAccuracy: true, timeout: 12000 }
  );
});

refreshBtn.addEventListener("click", async () => {
  try {
    if (lastCoords?.lat != null && lastCoords?.lon != null) {
      await loadByCoords(lastCoords.lat, lastCoords.lon);
      return;
    }
    if (lastCity) {
      await loadByQuery(lastCity);
      return;
    }
    setStatus("Nothing to refresh yet. Search a city or use your location.");
  } catch (err) {
    showCards(false);
    setStatus(`Couldn’t refresh: ${err.message}`);
  }
});

unitF.addEventListener("click", async () => {
  if (units === "imperial") return;
  setUnits("imperial");
  try {
    if (lastCoords) await loadByCoords(lastCoords.lat, lastCoords.lon);
    else if (lastCity) await loadByQuery(lastCity);
  } catch (err) {
    showCards(false);
    setStatus(`Couldn’t reload in °F: ${err.message}`);
  }
});

unitC.addEventListener("click", async () => {
  if (units === "metric") return;
  setUnits("metric");
  try {
    if (lastCoords) await loadByCoords(lastCoords.lat, lastCoords.lon);
    else if (lastCity) await loadByQuery(lastCity);
  } catch (err) {
    showCards(false);
    setStatus(`Couldn’t reload in °C: ${err.message}`);
  }
});

time12.addEventListener("click", () => {
  if (timeFormat === "12") return;
  setTimeFormat("12");
  updateUnitPill();
  // Re-render by reloading (keeps it simple + consistent)
  if (lastCoords) loadByCoords(lastCoords.lat, lastCoords.lon).catch(err => setStatus(err.message));
  else if (lastCity) loadByQuery(lastCity).catch(err => setStatus(err.message));
});

time24.addEventListener("click", () => {
  if (timeFormat === "24") return;
  setTimeFormat("24");
  updateUnitPill();
  if (lastCoords) loadByCoords(lastCoords.lat, lastCoords.lon).catch(err => setStatus(err.message));
  else if (lastCity) loadByQuery(lastCity).catch(err => setStatus(err.message));
});

// ====== INIT ======
setUnits(units);
setTimeFormat(timeFormat);
updateUnitPill();

if (lastCity) {
  cityInput.value = lastCity;
  loadByQuery(lastCity).catch((err) => {
    showCards(false);
    setStatus(`Couldn’t load saved city: ${err.message}`);
  });
} else {
  setStatus("Search a city (try “Toledo, OH, US”) or use your location.");
}
