// =====================================================
// FULL OpenWeather (free-friendly) Weather Website
// =====================================================

const OPENWEATHER_KEY = "57e2ef8d1ddf45ced53b8444e23ce2b7"; // rotate this key ASAP
const API = "https://api.openweathermap.org";

// ---------- WEATHER NAMESPACED KEYS (prevents global collisions) ----------
const WEATHER_SETTINGS_KEY = "caleb_weather_settings_v1";
const WEATHER_CITY_KEY     = "caleb_weather_city_v1";
const WEATHER_COORDS_KEY   = "caleb_weather_coords_v1";

// Leaflet map globals
let map, baseLayer, weatherOverlay, marker;

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);

const searchForm = $("searchForm");
const cityInput  = $("cityInput");
const geoBtn     = $("geoBtn");
const refreshBtn = $("refreshBtn");
const statusEl   = $("status");
const unitPill   = $("unitPill");

// Cards
const currentCard = $("currentCard");
const airCard     = $("airCard");
const hourlyCard  = $("hourlyCard");
const dailyCard   = $("dailyCard");
const daily16Card = $("daily16Card");
const mapCard     = $("mapCard");

// Current
const placeEl = $("place");
const metaEl  = $("meta");
const iconEl  = $("icon");
const tempEl  = $("temp");
const feelsEl = $("feels");
const windEl  = $("wind");
const humidityEl = $("humidity");
const pressureEl = $("pressure");
const visibilityEl = $("visibility");
const sunEl   = $("sun");
const hiLoEl  = $("hiLo");
const cloudsEl= $("clouds");

// Forecast
const hourlyEl = $("hourly");
const dailyEl  = $("daily");

// Air
const aqiBadge = $("aqiBadge");
const aqiText  = $("aqiText");
const pm25El   = $("pm25");
const pm10El   = $("pm10");
const o3El     = $("o3");
const no2El    = $("no2");
const so2El    = $("so2");
const coEl     = $("co");

// 16 day
const daily16El = $("daily16");
const daily16Note = $("daily16Note");

// Map controls
const mapLayerSel = $("mapLayer");
const mapOpacity  = $("mapOpacity");

// Settings modal (namespaced IDs)
const settingsBtn = $("weatherSettingsBtn");
const settingsModal = $("weatherSettingsModal");
const settingsClose = $("weatherSettingsClose");
const settingsX = $("weatherSettingsX");
const saveSettingsBtn = $("weatherSaveSettings");
const resetSettingsBtn = $("weatherResetSettings");

// Settings inputs
const unitF = $("unitF");
const unitC = $("unitC");
const time12 = $("time12");
const time24 = $("time24");
const langSel = $("lang");
const autoLocateChk = $("autoLocate");
const loadLastChk = $("loadLast");
const autoRefreshSel = $("autoRefresh");
const mapEnabledChk = $("mapEnabled");

// ---------- SETTINGS ----------
const DEFAULT_SETTINGS = {
  units: "imperial",      // imperial | metric
  timeFormat: "12",       // 12 | 24
  lang: "en",             // OpenWeather descriptions language
  autoLocate: false,      // default OFF
  loadLast: true,
  autoRefreshMin: 0,      // 0 off, else minutes
  mapEnabled: true,
  mapLayer: "clouds_new",
  mapOpacity: 0.7
};

let settings = loadSettings();
let lastCity = localStorage.getItem(WEATHER_CITY_KEY) || "";
let lastCoords = JSON.parse(localStorage.getItem(WEATHER_COORDS_KEY) || "null");
let refreshTimer = null;

// ---------- UTIL ----------
function setStatus(msg) { statusEl.textContent = msg || ""; }

function ensureKey() {
  if (!OPENWEATHER_KEY) {
    setStatus("Add your OpenWeather API key in weather.js (OPENWEATHER_KEY).");
    return false;
  }
  return true;
}

function saveSettings(next) {
  settings = { ...settings, ...next };
  localStorage.setItem(WEATHER_SETTINGS_KEY, JSON.stringify(settings));
  syncSettingsUI();
  applyAutoRefresh();
  updateUnitPill();
  applyMapSettings();
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(WEATHER_SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function resetSettings() {
  // ONLY reset WEATHER settings. Never touch global/localStorage.clear().
  localStorage.removeItem(WEATHER_SETTINGS_KEY);
  settings = { ...DEFAULT_SETTINGS };
  localStorage.setItem(WEATHER_SETTINGS_KEY, JSON.stringify(settings));

  syncSettingsUI();
  applyAutoRefresh();
  updateUnitPill();
  applyMapSettings();
}

function syncSettingsUI() {
  const isF = settings.units === "imperial";
  unitF.classList.toggle("is-active", isF);
  unitC.classList.toggle("is-active", !isF);

  const is12 = settings.timeFormat === "12";
  time12.classList.toggle("is-active", is12);
  time24.classList.toggle("is-active", !is12);

  langSel.value = settings.lang;
  autoLocateChk.checked = !!settings.autoLocate;
  loadLastChk.checked = !!settings.loadLast;
  autoRefreshSel.value = String(settings.autoRefreshMin);
  mapEnabledChk.checked = !!settings.mapEnabled;

  mapLayerSel.value = settings.mapLayer;
  mapOpacity.value = String(Math.round(settings.mapOpacity * 100));
}

function updateUnitPill() {
  const tempUnit = settings.units === "imperial" ? "°F" : "°C";
  const windUnit = settings.units === "imperial" ? "mph" : "m/s";
  unitPill.textContent = `${tempUnit} • wind ${windUnit} • time ${settings.timeFormat}h • lang ${settings.lang}`;
}

function applyAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  const m = Number(settings.autoRefreshMin || 0);
  if (!m) return;
  refreshTimer = setInterval(() => refresh().catch(() => {}), m * 60 * 1000);
}

function pad2(n) { return String(n).padStart(2, "0"); }
function iconUrl(icon) { return `https://openweathermap.org/img/wn/${icon}@2x.png`; }

// ✅ UPDATED: show units in temps everywhere
function fmtTemp(x) {
  if (x === undefined || x === null || Number.isNaN(x)) return "—";
  const unit = settings.units === "imperial" ? "°F" : "°C";
  return `${Math.round(x)}${unit}`;
}

function fmtWind(speed) {
  if (speed === undefined || speed === null || Number.isNaN(speed)) return "—";
  return settings.units === "imperial" ? `${Math.round(speed)} mph` : `${Math.round(speed)} m/s`;
}

function fmtKm(meters) {
  if (meters == null) return "—";
  return `${(meters / 1000).toFixed(1)} km`;
}

// OpenWeather gives timezone offset seconds for current/forecast city
function dateFromUnixLocal(unixSeconds, tzOffsetSeconds) {
  return new Date((unixSeconds + tzOffsetSeconds) * 1000);
}
function formatLocalTime(unixSeconds, tzOffsetSeconds) {
  const d = dateFromUnixLocal(unixSeconds, tzOffsetSeconds);
  const hh = d.getUTCHours();
  const mm = d.getUTCMinutes();

  if (settings.timeFormat === "24") return `${pad2(hh)}:${pad2(mm)}`;

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
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
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
    try { detail = (await res.json())?.message || ""; } catch {}
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

// ---------- API ----------
async function geocodeDirect(query) {
  const q = encodeURIComponent(query);
  return fetchJSON(`${API}/geo/1.0/direct?q=${q}&limit=5&appid=${OPENWEATHER_KEY}`);
}
async function geocodeReverse(lat, lon) {
  return fetchJSON(`${API}/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_KEY}`);
}
async function getCurrent(lat, lon) {
  return fetchJSON(`${API}/data/2.5/weather?lat=${lat}&lon=${lon}&units=${settings.units}&lang=${settings.lang}&appid=${OPENWEATHER_KEY}`);
}
async function getForecast(lat, lon) {
  return fetchJSON(`${API}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${settings.units}&lang=${settings.lang}&appid=${OPENWEATHER_KEY}`);
}
async function getAir(lat, lon) {
  return fetchJSON(`${API}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}`);
}

// Optional 16-day endpoint (auto-hides)
async function getDaily16(lat, lon) {
  const cnt = 16;
  return fetchJSON(`${API}/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&cnt=${cnt}&units=${settings.units}&lang=${settings.lang}&appid=${OPENWEATHER_KEY}`);
}

// ---------- RENDER ----------
function aqiLabel(aqi) {
  switch (aqi) {
    case 1: return ["Good", "Air is clean."];
    case 2: return ["Fair", "Mostly fine; sensitive folks might notice."];
    case 3: return ["Moderate", "Sensitive groups should take it easy."];
    case 4: return ["Poor", "Limit outdoor activity if you can."];
    case 5: return ["Very Poor", "Avoid long outdoor exposure."];
    default: return ["—", "—"];
  }
}

function renderAll(current, forecast, air, geo) {
  showCards(true);

  const name = geo?.name || current?.name || "Unknown location";
  const state = geo?.state ? `, ${geo.state}` : "";
  const country = geo?.country ? `, ${geo.country}` : (current?.sys?.country ? `, ${current.sys.country}` : "");
  placeEl.textContent = `${name}${state}${country}`;

  const desc = current?.weather?.[0]?.description ?? "—";
  const tz = current?.timezone ?? 0;
  metaEl.textContent = `${desc} • Updated ${current?.dt ? formatLocalDateTime(current.dt, tz) : "—"}`;

  const icon = current?.weather?.[0]?.icon;
  if (icon) { iconEl.src = iconUrl(icon); iconEl.alt = desc; }
  else { iconEl.removeAttribute("src"); iconEl.alt = ""; }

  tempEl.textContent = fmtTemp(current?.main?.temp);
  feelsEl.textContent = `Feels like ${fmtTemp(current?.main?.feels_like)}`;

  windEl.textContent = fmtWind(current?.wind?.speed);
  humidityEl.textContent = current?.main?.humidity != null ? `${current.main.humidity}%` : "—";
  pressureEl.textContent = current?.main?.pressure != null ? `${current.main.pressure} hPa` : "—";
  visibilityEl.textContent = fmtKm(current?.visibility);

  const sunrise = current?.sys?.sunrise ? formatLocalTime(current.sys.sunrise, tz) : "—";
  const sunset  = current?.sys?.sunset  ? formatLocalTime(current.sys.sunset, tz) : "—";
  sunEl.textContent = `Sun: ${sunrise} ↑  ${sunset} ↓`;

  const hi = current?.main?.temp_max != null ? fmtTemp(current.main.temp_max) : "—";
  const lo = current?.main?.temp_min != null ? fmtTemp(current.main.temp_min) : "—";
  hiLoEl.textContent = `H/L: ${hi} / ${lo}`;

  cloudsEl.textContent = `Clouds: ${current?.clouds?.all != null ? `${current.clouds.all}%` : "—"}`;

  renderHourly(forecast);
  renderDaily(forecast);
  renderAir(air);

  const lat = current?.coord?.lat;
  const lon = current?.coord?.lon;
  if (typeof lat === "number" && typeof lon === "number") setMapView(lat, lon);
}

function renderHourly(forecast) {
  const list = forecast?.list || [];
  const tzOffset = forecast?.city?.timezone ?? 0;

  const next = list.slice(0, 8); // 24h via 3-hour blocks
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
    let min = Infinity, max = -Infinity;
    let best = items[0], bestDist = Infinity;

    for (const it of items) {
      const t = it?.main?.temp;
      if (typeof t === "number") { min = Math.min(min, t); max = Math.max(max, t); }

      const d = dateFromUnixLocal(it.dt, tzOffset);
      const hour = d.getUTCHours();
      const dist = Math.abs(hour - 12);
      if (dist < bestDist) { bestDist = dist; best = it; }
    }

    const label = weekdayLabelFromKey(key);
    const desc = best?.weather?.[0]?.description ?? "—";
    const icon = best?.weather?.[0]?.icon;
    const range = (min !== Infinity && max !== -Infinity) ? `${fmtTemp(max)} / ${fmtTemp(min)}` : "—";

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

  pm25El.textContent = comps.pm2_5 != null ? `${comps.pm2_5}` : "—";
  pm10El.textContent = comps.pm10 != null ? `${comps.pm10}` : "—";
  o3El.textContent   = comps.o3 != null ? `${comps.o3}` : "—";
  no2El.textContent  = comps.no2 != null ? `${comps.no2}` : "—";
  so2El.textContent  = comps.so2 != null ? `${comps.so2}` : "—";
  coEl.textContent   = comps.co != null ? `${comps.co}` : "—";
}

function renderDaily16(data) {
  const days = data?.list || [];
  if (!days.length) return;

  daily16El.innerHTML = days.map((d, idx) => {
    const label = idx === 0 ? "Today" : (d?.dt ? weekdayLabelFromKey(dayKeyFromUnix(d.dt, 0)) : `Day ${idx + 1}`);
    const desc = d?.weather?.[0]?.description ?? "—";
    const icon = d?.weather?.[0]?.icon;
    const hi = d?.temp?.max != null ? fmtTemp(d.temp.max) : "—";
    const lo = d?.temp?.min != null ? fmtTemp(d.temp.min) : "—";

    return `
      <div class="day">
        <div class="name">${label}</div>
        <div class="desc">
          ${icon ? `<img src="${iconUrl(icon)}" alt="" style="width:28px;height:28px;vertical-align:middle;margin-right:6px;">` : ""}
          <span style="vertical-align:middle;">${desc}</span>
        </div>
        <div class="range">${hi} / ${lo}</div>
      </div>
    `;
  }).join("");
}

// ---------- LOAD ----------
async function loadByQuery(searchText) {
  if (!ensureKey()) return;
  const q = searchText?.trim();
  if (!q) return setStatus("Type a city first.");

  setStatus("Finding location…");
  const matches = await geocodeDirect(q);

  if (!matches?.length) {
    showCards(false);
    setStatus("No match. Try adding state/country like “Toledo, OH, US”.");
    return;
  }

  const top = matches[0];
  const lat = top.lat, lon = top.lon;

  localStorage.setItem(WEATHER_CITY_KEY, q);
  localStorage.setItem(WEATHER_COORDS_KEY, JSON.stringify({ lat, lon }));
  lastCity = q;
  lastCoords = { lat, lon };

  await loadByCoords(lat, lon, top);
}

async function loadByCoords(lat, lon, geoHint = null) {
  if (!ensureKey()) return;

  setStatus("Loading weather…");

  let geo = geoHint;
  if (!geo) {
    try { geo = (await geocodeReverse(lat, lon))?.[0] || null; } catch { geo = null; }
  }

  const [current, forecast, air] = await Promise.all([
    getCurrent(lat, lon),
    getForecast(lat, lon),
    getAir(lat, lon),
  ]);

  renderAll(current, forecast, air, geo);
  setStatus("");

  await tryDaily16(lat, lon);
}

async function tryDaily16(lat, lon) {
  daily16Card.hidden = true;
  daily16El.innerHTML = "";
  daily16Note.textContent = "";

  try {
    const data = await getDaily16(lat, lon);
    daily16Note.textContent = "If this shows up, your key/plan allows the endpoint.";
    renderDaily16(data);
    daily16Card.hidden = false;
  } catch {
    daily16Card.hidden = true;
  }
}

async function refresh() {
  if (lastCoords?.lat != null && lastCoords?.lon != null) {
    await loadByCoords(lastCoords.lat, lastCoords.lon);
    return;
  }
  if (lastCity) {
    await loadByQuery(lastCity);
    return;
  }
  setStatus("Nothing to refresh yet.");
}

// ---------- MAP ----------
function initMap() {
  if (!settings.mapEnabled) {
    mapCard.style.display = "none";
    return;
  }
  mapCard.style.display = "";
  if (map) return;

  map = L.map("map", { zoomControl: true }).setView([41.65, -83.54], 8);

  baseLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  weatherOverlay = L.tileLayer(getOWMTileUrl(settings.mapLayer), {
    opacity: settings.mapOpacity,
    zIndex: 10
  }).addTo(map);

  marker = L.marker([41.65, -83.54]).addTo(map);
}

function getOWMTileUrl(layer) {
  return `https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${OPENWEATHER_KEY}`;
}

function applyMapSettings() {
  if (!map) {
    initMap();
    return;
  }

  mapCard.style.display = settings.mapEnabled ? "" : "none";
  if (!settings.mapEnabled) return;

  if (weatherOverlay) {
    weatherOverlay.setOpacity(settings.mapOpacity);
    weatherOverlay.setUrl(getOWMTileUrl(settings.mapLayer));
  }
}

function setMapView(lat, lon) {
  if (!settings.mapEnabled) return;
  initMap();
  map.setView([lat, lon], Math.max(map.getZoom(), 9));
  if (marker) marker.setLatLng([lat, lon]);
}

// ---------- MODAL ----------
function openSettings(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  settingsModal.hidden = false;
  document.body.style.overflow = "hidden";
  syncSettingsUI();
}
function closeSettings(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  settingsModal.hidden = true;
  document.body.style.overflow = "";
}

// Close on ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !settingsModal.hidden) closeSettings(e);
});

// Clicking outside closes
settingsClose.addEventListener("click", closeSettings);

// Clicking inside modal should NOT close
settingsModal.querySelector(".modal-card")?.addEventListener("click", (e) => e.stopPropagation());

// Buttons
settingsBtn.addEventListener("click", openSettings);
settingsX.addEventListener("click", closeSettings);

// ---------- EVENTS ----------
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try { await loadByQuery(cityInput.value); }
  catch (err) { showCards(false); setStatus(`Couldn’t load: ${err.message}`); }
});

geoBtn.addEventListener("click", () => {
  if (!ensureKey()) return;
  if (!navigator.geolocation) return setStatus("Geolocation isn’t supported.");

  setStatus("Requesting location permission…");
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        localStorage.setItem(WEATHER_COORDS_KEY, JSON.stringify({ lat, lon }));
        lastCoords = { lat, lon };

        await loadByCoords(lat, lon);
      } catch (err) {
        showCards(false);
        setStatus(`Couldn’t load: ${err.message}`);
      }
    },
    (err) => setStatus(`Location blocked/failed: ${err.message}`),
    { enableHighAccuracy: true, timeout: 12000 }
  );
});

refreshBtn.addEventListener("click", async () => {
  try { await refresh(); }
  catch (err) { setStatus(`Refresh failed: ${err.message}`); }
});

// Map UI
mapLayerSel.addEventListener("change", () => saveSettings({ mapLayer: mapLayerSel.value }));
mapOpacity.addEventListener("input", () => saveSettings({ mapOpacity: Number(mapOpacity.value) / 100 }));

// Settings chips
unitF.addEventListener("click", () => { saveSettings({ units: "imperial" }); refresh().catch(()=>{}); });
unitC.addEventListener("click", () => { saveSettings({ units: "metric" }); refresh().catch(()=>{}); });

time12.addEventListener("click", () => { saveSettings({ timeFormat: "12" }); refresh().catch(()=>{}); });
time24.addEventListener("click", () => { saveSettings({ timeFormat: "24" }); refresh().catch(()=>{}); });

langSel.addEventListener("change", () => { saveSettings({ lang: langSel.value }); refresh().catch(()=>{}); });

// Save/reset buttons
saveSettingsBtn.addEventListener("click", (e) => {
  e.preventDefault();
  saveSettings({
    autoLocate: autoLocateChk.checked,
    loadLast: loadLastChk.checked,
    autoRefreshMin: Number(autoRefreshSel.value),
    mapEnabled: mapEnabledChk.checked
  });
  closeSettings(e);
  refresh().catch(()=>{});
});

resetSettingsBtn.addEventListener("click", (e) => {
  e.preventDefault();
  resetSettings();
  closeSettings(e);
  refresh().catch(()=>{});
});

// ---------- INIT ----------
(function init() {
  syncSettingsUI();
  updateUnitPill();
  applyAutoRefresh();
  initMap();
  applyMapSettings();

  // Don’t auto-fetch location unless enabled
  if (settings.autoLocate) {
    geoBtn.click();
    return;
  }

  // Load last location if enabled
  if (settings.loadLast) {
    if (lastCity) {
      cityInput.value = lastCity;
      loadByQuery(lastCity).catch(err => setStatus(`Couldn’t load saved city: ${err.message}`));
    } else if (lastCoords?.lat != null && lastCoords?.lon != null) {
      loadByCoords(lastCoords.lat, lastCoords.lon).catch(err => setStatus(`Couldn’t load saved coords: ${err.message}`));
    } else {
      setStatus("Search a city or use your location.");
    }
  } else {
    setStatus("Search a city or use your location.");
  }
})();
