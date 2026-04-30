// =====================================================
// Weather Page: Integrated Feature Set
// =====================================================

const OPENWEATHER_KEY = "57e2ef8d1ddf45ced53b8444e23ce2b7"; // Rotate if compromised
const API = "https://api.openweathermap.org";

// Storage Keys
const WEATHER_SETTINGS_KEY = "caleb_weather_settings_v2";
const WEATHER_CITY_KEY     = "caleb_weather_city_v2";
const WEATHER_COORDS_KEY   = "caleb_weather_coords_v2";
const WEATHER_FAVS_KEY     = "caleb_weather_favorites_v1";
const WEATHER_CACHE_KEY    = "caleb_weather_last_good_payload_v1";
const WEATHER_HISTORY_KEY  = "caleb_weather_history_v1";
const WEATHER_ALERT_DISMISS_KEY = "caleb_weather_alert_dismissed_until_v1";

// Map Globals
let map, baseLayer, weatherOverlay, marker;

// ---------- DOM Elements ----------
const $ = (id) => document.getElementById(id);

const weatherPage = $("weatherPage");
const unitPill = $("unitPill");
const alertBanner = $("alertBanner");
const alertTitle = $("alertTitle");
const alertText = $("alertText");
const dismissAlertBtn = $("dismissAlertBtn");
const greetingBanner = $("greetingBanner");
const greetingTitle = $("greetingTitle");
const greetingText = $("greetingText");
const offlineBanner = $("offlineBanner");
const offlineText = $("offlineText");

const searchForm = $("searchForm");
const cityInput = $("cityInput");
const geoBtn = $("geoBtn");
const refreshBtn = $("refreshBtn");
const statusEl = $("status");

const favoritesSelect = $("favoritesSelect");
const favGoBtn = $("favGoBtn");
const favSaveBtn = $("favSaveBtn");
const favRemoveBtn = $("favRemoveBtn");

const currentCard = $("currentCard");
const uvCard = $("uvCard");
const precipCard = $("precipCard");
const airCard = $("airCard");
const hourlyCard = $("hourlyCard");
const dailyCard = $("dailyCard");
const historyCard = $("historyCard");
const compareCard = $("compareCard");
const mapCard = $("mapCard");

const placeEl = $("place");
const metaEl = $("meta");
const iconEl = $("icon");
const tempEl = $("temp");
const feelsEl = $("feels");
const feelsExplain = $("feelsExplain");
const windEl = $("wind");
const humidityEl = $("humidity");
const pressureEl = $("pressure");
const visibilityEl = $("visibility");
const impactPills = $("impactPills");
const sunEl = $("sun");
const hiLoEl = $("hiLo");
const cloudsEl = $("clouds");
const pressureTrendEl = $("pressureTrend");
const sunriseLbl = $("sunriseLbl");
const sunsetLbl = $("sunsetLbl");
const sunbarFill = $("sunbarFill");
const sunbarDot = $("sunbarDot");

const uvValue = $("uvValue");
const uvDesc = $("uvDesc");

const precipChance = $("precipChance");
const precipAmount = $("precipAmount");
const precipNote = $("precipNote");

const hourlyEl = $("hourly");
const dailyEl = $("daily");

const aqiBadge = $("aqiBadge");
const aqiText = $("aqiText");
const pm25El = $("pm25");
const pm10El = $("pm10");
const o3El = $("o3");
const no2El = $("no2");
const so2El = $("so2");
const coEl = $("co");

const histNow = $("histNow");
const hist24 = $("hist24");
const histDelta = $("histDelta");

const compareA = $("compareA");
const compareB = $("compareB");
const compareBtn = $("compareBtn");
const compareGrid = $("compareGrid");

const mapLayerSel = $("mapLayer");
const mapOpacity = $("mapOpacity");

const settingsBtn = $("weatherSettingsBtn");
const settingsModal = $("weatherSettingsModal");
const settingsClose = $("weatherSettingsClose");
const settingsX = $("weatherSettingsX");
const saveSettingsBtn = $("weatherSaveSettings");
const resetSettingsBtn = $("weatherResetSettings");

const unitF = $("unitF");
const unitC = $("unitC");
const unitK = $("unitK");
const time12 = $("time12");
const time24 = $("time24");
const langSel = $("lang");
const windUnitSel = $("windUnit");
const pressureUnitSel = $("pressureUnit");
const visUnitSel = $("visUnit");
const autoLocateChk = $("autoLocate");
const loadLastChk = $("loadLast");
const autoRefreshSel = $("autoRefresh");
const mapEnabledChk = $("mapEnabled");

// ---------- Configuration & Defaults ----------
const DEFAULT_SETTINGS = {
  tempUnit: "F",
  timeFormat: "12",
  lang: "en",
  autoLocate: false,
  loadLast: true,
  autoRefreshMin: 0,
  mapEnabled: true,
  mapLayer: "clouds_new",
  mapOpacity: 0.7,
  windUnit: "mph",
  pressureUnit: "hpa",
  visUnit: "km",
};

let settings = loadSettings();
let lastCity = localStorage.getItem(WEATHER_CITY_KEY) || "";
let lastCoords = JSON.parse(localStorage.getItem(WEATHER_COORDS_KEY) || "null");
let refreshTimer = null;

// ---------- Utility Functions ----------
function setStatus(msg) { statusEl.textContent = msg || ""; }

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
  localStorage.removeItem(WEATHER_SETTINGS_KEY);
  settings = { ...DEFAULT_SETTINGS };
  localStorage.setItem(WEATHER_SETTINGS_KEY, JSON.stringify(settings));
  syncSettingsUI();
  applyAutoRefresh();
  updateUnitPill();
  applyMapSettings();
}

function syncSettingsUI() {
  unitF.classList.toggle("is-active", settings.tempUnit === "F");
  unitC.classList.toggle("is-active", settings.tempUnit === "C");
  unitK.classList.toggle("is-active", settings.tempUnit === "K");
  time12.classList.toggle("is-active", settings.timeFormat === "12");
  time24.classList.toggle("is-active", settings.timeFormat === "24");
  langSel.value = settings.lang;
  windUnitSel.value = settings.windUnit;
  pressureUnitSel.value = settings.pressureUnit;
  visUnitSel.value = settings.visUnit;
  autoLocateChk.checked = !!settings.autoLocate;
  loadLastChk.checked = !!settings.loadLast;
  autoRefreshSel.value = String(settings.autoRefreshMin);
  mapEnabledChk.checked = !!settings.mapEnabled;
  mapLayerSel.value = settings.mapLayer;
  mapOpacity.value = String(Math.round(settings.mapOpacity * 100));
}

function applyAutoRefresh() {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
  const m = Number(settings.autoRefreshMin || 0);
  if (!m) return;
  refreshTimer = setInterval(() => refresh().catch(()=>{}), m * 60 * 1000);
}

function updateUnitPill() {
  const tempUnit = settings.tempUnit === "K" ? "K" : (settings.tempUnit === "F" ? "°F" : "°C");
  unitPill.textContent = `${tempUnit} • ${settings.windUnit} • ${settings.pressureUnit} • ${settings.visUnit} • ${settings.timeFormat}h • ${settings.lang}`;
}

// ---------- Unit Conversions ----------
function toCFromK(k){ return k - 273.15; }
function toFFromC(c){ return (c * 9/5) + 32; }
function toKFromC(c){ return c + 273.15; }

function convertTempFromAPI(apiValue, apiUnits){
  if (apiValue == null || Number.isNaN(apiValue)) return null;
  const c = apiUnits === "imperial" ? (apiValue - 32) * 5/9 : apiValue; 
  if (settings.tempUnit === "C") return c;
  if (settings.tempUnit === "F") return toFFromC(c);
  return toKFromC(c);
}

function tempSuffix(){
  if (settings.tempUnit === "K") return "K";
  return settings.tempUnit === "F" ? "°F" : "°C";
}

function fmtTempFromAPI(apiValue, apiUnits){
  const v = convertTempFromAPI(apiValue, apiUnits);
  if (v == null) return "—";
  if (settings.tempUnit === "K") return `${Math.round(v)}K`;
  return `${Math.round(v)}${tempSuffix()}`;
}

function convertWindFromAPI(apiSpeed, apiUnits){
  if (apiSpeed == null || Number.isNaN(apiSpeed)) return null;
  let ms = apiUnits === "imperial" ? apiSpeed * 0.44704 : apiSpeed;
  switch(settings.windUnit){
    case "ms": return { v: ms, u: "m/s" };
    case "kmh": return { v: ms * 3.6, u: "km/h" };
    case "kt": return { v: ms * 1.943844, u: "kt" };
    default: return { v: apiUnits === "imperial" ? apiSpeed : ms * 2.236936, u: "mph" };
  }
}

function fmtWindFromAPI(apiSpeed, apiUnits){
  const w = convertWindFromAPI(apiSpeed, apiUnits);
  if (!w) return "—";
  return `${Math.round(w.v)} ${w.u}`;
}

function fmtPressure(hpa){
  if (hpa == null) return "—";
  if (settings.pressureUnit === "inhg") {
    return `${(hpa * 0.02953).toFixed(2)} inHg`;
  }
  return `${Math.round(hpa)} hPa`;
}

function fmtVisibility(meters){
  if (meters == null) return "—";
  if (settings.visUnit === "mi") return `${(meters / 1609.344).toFixed(1)} mi`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// ---------- Formatting & Time ----------
const pad2 = (n) => String(n).padStart(2,"0");
const iconUrl = (icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`;

function dateFromUnixLocal(unixSeconds, tzOffsetSeconds){
  return new Date((unixSeconds + tzOffsetSeconds) * 1000);
}

function formatLocalTime(unixSeconds, tzOffsetSeconds){
  const d = dateFromUnixLocal(unixSeconds, tzOffsetSeconds);
  const hh = d.getUTCHours();
  const mm = d.getUTCMinutes();
  if (settings.timeFormat === "24") return `${pad2(hh)}:${pad2(mm)}`;
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${pad2(mm)} ${ampm}`;
}

function formatLocalDateTime(unixSeconds, tzOffsetSeconds){
  const d = dateFromUnixLocal(unixSeconds, tzOffsetSeconds);
  const y = d.getUTCFullYear();
  const mo = pad2(d.getUTCMonth()+1);
  const da = pad2(d.getUTCDate());
  return `${y}-${mo}-${da} ${formatLocalTime(unixSeconds, tzOffsetSeconds)}`;
}

function dayKeyFromUnix(unixSeconds, tzOffsetSeconds){
  const d = dateFromUnixLocal(unixSeconds, tzOffsetSeconds);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth()+1)}-${pad2(d.getUTCDate())}`;
}

function weekdayLabelFromKey(key){
  const [y,m,d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m-1, d, 12, 0, 0));
  return dt.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" });
}

// ---------- API Core ----------
async function fetchJSON(url){
  const res = await fetch(url);
  if (!res.ok){
    let detail = "";
    try{ detail = (await res.json())?.message || ""; } catch {}
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.json();
}

const apiUnits = () => settings.tempUnit === "F" ? "imperial" : "metric";

async function geocodeDirect(query) {
  return fetchJSON(`${API}/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${OPENWEATHER_KEY}`);
}
async function geocodeReverse(lat, lon) {
  return fetchJSON(`${API}/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_KEY}`);
}
async function getCurrent(lat, lon) {
  return fetchJSON(`${API}/data/2.5/weather?lat=${lat}&lon=${lon}&units=${apiUnits()}&lang=${settings.lang}&appid=${OPENWEATHER_KEY}`);
}
async function getForecast(lat, lon) {
  return fetchJSON(`${API}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${apiUnits()}&lang=${settings.lang}&appid=${OPENWEATHER_KEY}`);
}
async function getAir(lat, lon) {
  return fetchJSON(`${API}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}`);
}
const getOWMTileUrl = (layer) => `https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${OPENWEATHER_KEY}`;

// ---------- Condition Normalization ----------
function normalizeConditions(current, forecast){
  const w0 = current?.weather?.[0] || {};
  const id = w0.id;
  const icon = w0.icon || "";

  const snowNow = (current?.snow?.["1h"] || current?.snow?.["3h"] || 0) > 0 || (id >= 600 && id < 700);
  const rainNow = (current?.rain?.["1h"] || current?.rain?.["3h"] || 0) > 0 || (id >= 500 && id < 600);
  const next = forecast?.list?.[0];
  const forecastSnow = (next?.snow?.["3h"] || 0) > 0;
  const forecastRain = (next?.rain?.["3h"] || 0) > 0;

  const looksLikeFog = (id >= 700 && id < 800) || icon.startsWith("50");
  const shouldShowSnow = snowNow || forecastSnow;
  const shouldShowRain = !shouldShowSnow && (rainNow || forecastRain);

  let out = { ...w0 };
  const night = icon.endsWith("n");

  if ((looksLikeFog || w0.main?.toLowerCase() === "mist") && (shouldShowSnow || shouldShowRain)){
    if (shouldShowSnow) out = { id: 601, main: "Snow", description: "snowing", icon: night ? "13n" : "13d" };
    else if (shouldShowRain) out = { id: 501, main: "Rain", description: "raining", icon: night ? "10n" : "10d" };
  }
  return out;
}

// ---------- Weather Alerts (Official) ----------
async function fetchNWSAlerts(lat, lon){
  const res = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`, {
    headers: { "User-Agent": "WeatherDashboard (calebkritzar@gmail.com)" }
  });
  if (!res.ok) throw new Error("NWS failed");
  const data = await res.json();
  return (data?.features || []).map(f => ({
    source: "NWS",
    title: f.properties.event,
    detail: f.properties.headline || f.properties.description
  }));
}

async function fetchOWAlerts(lat, lon){
  const url = `${API}/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}`;
  try {
    const data = await fetchJSON(url);
    return (data?.alerts || []).map(a => ({ source: "OpenWeather", title: a.event, detail: a.description }));
  } catch { return []; }
}

async function updateAlerts(lat, lon, geo, current, forecast){
  const dismissedUntil = Number(localStorage.getItem(WEATHER_ALERT_DISMISS_KEY) || "0");
  if (Date.now() < dismissedUntil) { alertBanner.hidden = true; return; }

  try {
    const country = (geo?.country || current?.sys?.country || "").toUpperCase();
    let alerts = [];
    if (country === "US") alerts = await fetchNWSAlerts(lat, lon);
    if (alerts.length === 0) alerts = await fetchOWAlerts(lat, lon);

    if (alerts.length > 0){
      alertBanner.hidden = false;
      alertTitle.textContent = `⚠️ ${alerts[0].title}`;
      alertText.textContent = alerts[0].detail;
    } else {
      alertBanner.hidden = true;
    }
  } catch { alertBanner.hidden = true; }
}

// ---------- Impact Pills (Corrected Logic) ----------
function buildImpactPills(current, forecast) {
  const pills = [];
  const units = apiUnits();
  const t = current?.main?.temp;
  const humidity = current?.main?.humidity;
  const wind = current?.wind?.speed;
  const vis = current?.visibility;

  const tC = convertTempFromAPI(t, units);
  const feelsC = convertTempFromAPI(current?.main?.feels_like, units);

  if (tC != null) {
    const tF = toFFromC(tC);
    if (tF <= 40) pills.push("🧥 Dress warm");

    if (feelsC != null) {
      const feelsF = toFFromC(feelsC);
      if (feelsF >= 90) pills.push("🧴 Heat caution");
      else if (tF >= 88 && typeof humidity === "number" && humidity >= 60) pills.push("🧴 Muggy heat");
    }
  }

  const w = convertWindFromAPI(wind, units);
  if (w && ((w.u === "mph" && w.v >= 20) || (w.u === "km/h" && w.v >= 32))) pills.push("💨 Windy");

  if (typeof humidity === "number"){
    const tF = tC != null ? toFFromC(tC) : null;
    if (humidity >= 80 && tF >= 60) pills.push("💦 Very humid");
    else if (humidity <= 25) pills.push("🌵 Dry air");
    else if (humidity >= 85 && tF <= 40) pills.push("❄️ Damp air (winter)");
  }

  if (typeof vis === "number" && vis < 3000) pills.push("🌫 Low visibility");

  const nextPop = forecast?.list?.[0]?.pop;
  if (typeof nextPop === "number" && nextPop >= 0.5) {
    const s = forecast.list[0]?.snow?.["3h"] || 0;
    const r = forecast.list[0]?.rain?.["3h"] || 0;
    pills.push(s > r ? "❄️ Snow likely" : "☔ Rain likely");
  }

  return pills.length ? pills : ["✅ Looks normal"];
}

// ---------- UI Rendering ----------
function renderAll(payload, isFromCache=false){
  let { current, forecast, air, geo } = payload;
  const norm = normalizeConditions(current, forecast);
  current.weather[0] = { ...current.weather[0], ...norm };

  const lat = current.coord.lat;
  const lon = current.coord.lon;
  const tz = current.timezone;
  const units = apiUnits();

  offlineBanner.hidden = !isFromCache;
  showCards(true);

  placeEl.textContent = `${geo?.name || current.name}${geo?.state ? ', '+geo.state : ''}, ${geo?.country || current.sys.country}`;
  metaEl.textContent = `${current.weather[0].description} • Updated ${formatLocalDateTime(current.dt, tz)}`;
  iconEl.src = iconUrl(current.weather[0].icon);
  
  tempEl.textContent = fmtTempFromAPI(current.main.temp, units);
  feelsEl.textContent = `Feels like ${fmtTempFromAPI(current.main.feels_like, units)}`;
  windEl.textContent = fmtWindFromAPI(current.wind.speed, units);
  humidityEl.textContent = `${current.main.humidity}%`;
  pressureEl.textContent = fmtPressure(current.main.pressure);
  visibilityEl.textContent = fmtVisibility(current.visibility);

  impactPills.innerHTML = buildImpactPills(current, forecast).map(p => `<div class="pill">${p}</div>`).join("");

  renderHourly(forecast, tz);
  renderDaily(forecast);
  renderAir(air);
  if (mapEnabledChk.checked) setMapView(lat, lon);
}

function renderHourly(forecast, tz){
  const units = apiUnits();
  hourlyEl.innerHTML = forecast.list.slice(0, 8).map(item => `
    <div class="hour">
      <div class="h">${formatLocalTime(item.dt, tz)}</div>
      <img src="${iconUrl(item.weather[0].icon)}" alt="">
      <div class="t">${fmtTempFromAPI(item.main.temp, units)}</div>
      <div class="h">${item.pop > 0 ? '☔ ' + Math.round(item.pop*100) + '%' : '&nbsp;'}</div>
    </div>
  `).join("");
}

function renderDaily(forecast){
  const tz = forecast.city.timezone;
  const units = apiUnits();
  const byDay = new Map();
  forecast.list.forEach(item => {
    const key = dayKeyFromUnix(item.dt, tz);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(item);
  });

  const today = dayKeyFromUnix(Date.now()/1000, tz);
  dailyEl.innerHTML = Array.from(byDay.entries())
    .filter(([k]) => k >= today)
    .slice(0, 5)
    .map(([key, items]) => {
      const min = Math.min(...items.map(i => i.main.temp));
      const max = Math.max(...items.map(i => i.main.temp));
      const mid = items.find(i => dateFromUnixLocal(i.dt, tz).getUTCHours() >= 12) || items[0];
      return `
        <div class="day">
          <div class="name">${weekdayLabelFromKey(key)}</div>
          <div class="desc"><img src="${iconUrl(mid.weather[0].icon)}" width="24"> ${mid.weather[0].description}</div>
          <div class="range">${fmtTempFromAPI(max, units)} / ${fmtTempFromAPI(min, units)}</div>
        </div>
      `;
    }).join("");
}

function renderAir(air){
  const a = air.list[0];
  aqiBadge.textContent = `AQI: ${a.main.aqi}`;
  pm25El.textContent = a.components.pm2_5;
  pm10El.textContent = a.components.pm10;
}

// ---------- Logic Controllers ----------
async function loadByCoords(lat, lon, geoHint=null){
  setStatus("Loading...");
  try {
    const [current, forecast, air] = await Promise.all([getCurrent(lat, lon), getForecast(lat, lon), getAir(lat, lon)]);
    const geo = geoHint || (await geocodeReverse(lat, lon))[0];
    const payload = { current, forecast, air, geo, fetchedAt: Date.now() };
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(payload));
    renderAll(payload);
    updateAlerts(lat, lon, geo, current, forecast);
    setStatus("");
  } catch (e) { setStatus("Error: " + e.message); }
}

async function loadByQuery(q){
  setStatus("Searching...");
  const matches = await geocodeDirect(q);
  if (!matches.length) return setStatus("Not found.");
  lastCity = q;
  lastCoords = { lat: matches[0].lat, lon: matches[0].lon };
  localStorage.setItem(WEATHER_CITY_KEY, q);
  localStorage.setItem(WEATHER_COORDS_KEY, JSON.stringify(lastCoords));
  await loadByCoords(lastCoords.lat, lastCoords.lon, matches[0]);
}

function refresh() {
  if (lastCoords) loadByCoords(lastCoords.lat, lastCoords.lon);
  else if (lastCity) loadByQuery(lastCity);
}

// ---------- Map Functions ----------
function initMap(){
  if (map || !settings.mapEnabled) return;
  map = L.map("map").setView([41.65, -83.54], 9);
  baseLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
  weatherOverlay = L.tileLayer(getOWMTileUrl(settings.mapLayer), { opacity: settings.mapOpacity }).addTo(map);
  marker = L.marker([41.65, -83.54]).addTo(map);
}

function setMapView(lat, lon){
  initMap();
  map.setView([lat, lon]);
  marker.setLatLng([lat, lon]);
}

function applyMapSettings(){
  if (!map) return initMap();
  mapCard.style.display = settings.mapEnabled ? "" : "none";
  weatherOverlay.setOpacity(settings.mapOpacity);
  weatherOverlay.setUrl(getOWMTileUrl(settings.mapLayer));
}

// ---------- Event Listeners ----------
searchForm.addEventListener("submit", e => { e.preventDefault(); loadByQuery(cityInput.value); });
refreshBtn.addEventListener("click", refresh);
geoBtn.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(p => {
    lastCoords = { lat: p.coords.latitude, lon: p.coords.longitude };
    loadByCoords(lastCoords.lat, lastCoords.lon);
  });
});

dismissAlertBtn.addEventListener("click", () => {
  localStorage.setItem(WEATHER_ALERT_DISMISS_KEY, Date.now() + 21600000);
  alertBanner.hidden = true;
});

settingsBtn.addEventListener("click", () => settingsModal.hidden = false);
settingsClose.addEventListener("click", () => settingsModal.hidden = true);
saveSettingsBtn.addEventListener("click", () => {
  saveSettings({
    autoLocate: autoLocateChk.checked,
    loadLast: loadLastChk.checked,
    autoRefreshMin: Number(autoRefreshSel.value),
    mapEnabled: mapEnabledChk.checked
  });
  settingsModal.hidden = true;
  refresh();
});

// ---------- Initialization ----------
(function init(){
  syncSettingsUI();
  updateUnitPill();
  if (settings.loadLast && (lastCity || lastCoords)) refresh();
  else setStatus("Search a city to begin.");
})();

function showCards(show) { [currentCard, uvCard, precipCard, airCard, hourlyCard, dailyCard, historyCard, mapCard].forEach(c => c.hidden = !show); }
