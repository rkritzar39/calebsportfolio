// =====================================================
// Weather Page: All recommended features (in order)
// =====================================================

const OPENWEATHER_KEY = "57e2ef8d1ddf45ced53b8444e23ce2b7"; // rotate ASAP
const API = "https://api.openweathermap.org";

// Namespaced storage
const WEATHER_SETTINGS_KEY = "caleb_weather_settings_v2";
const WEATHER_CITY_KEY     = "caleb_weather_city_v2";
const WEATHER_COORDS_KEY   = "caleb_weather_coords_v2";
const WEATHER_FAVS_KEY     = "caleb_weather_favorites_v1";
const WEATHER_CACHE_KEY    = "caleb_weather_last_good_payload_v1";
const WEATHER_HISTORY_KEY  = "caleb_weather_history_v1";
const WEATHER_ALERT_DISMISS_KEY = "caleb_weather_alert_dismissed_until_v1";

// Leaflet
let map, baseLayer, weatherOverlay, marker;

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);

// Header + banners
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

// Controls
const searchForm = $("searchForm");
const cityInput = $("cityInput");
const geoBtn = $("geoBtn");
const refreshBtn = $("refreshBtn");
const statusEl = $("status");

// Favorites
const favoritesSelect = $("favoritesSelect");
const favGoBtn = $("favGoBtn");
const favSaveBtn = $("favSaveBtn");
const favRemoveBtn = $("favRemoveBtn");

// Cards
const currentCard = $("currentCard");
const uvCard = $("uvCard");
const precipCard = $("precipCard");
const airCard = $("airCard");
const hourlyCard = $("hourlyCard");
const dailyCard = $("dailyCard");
const historyCard = $("historyCard");
const compareCard = $("compareCard");
const mapCard = $("mapCard");

// Current fields
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

// UV
const uvValue = $("uvValue");
const uvDesc = $("uvDesc");

// Precip
const precipChance = $("precipChance");
const precipAmount = $("precipAmount");
const precipNote = $("precipNote");

// Forecast
const hourlyEl = $("hourly");
const dailyEl = $("daily");

// Air
const aqiBadge = $("aqiBadge");
const aqiText = $("aqiText");
const pm25El = $("pm25");
const pm10El = $("pm10");
const o3El = $("o3");
const no2El = $("no2");
const so2El = $("so2");
const coEl = $("co");

// History
const histNow = $("histNow");
const hist24 = $("hist24");
const histDelta = $("histDelta");

// Compare
const compareA = $("compareA");
const compareB = $("compareB");
const compareBtn = $("compareBtn");
const compareGrid = $("compareGrid");

// Map controls
const mapLayerSel = $("mapLayer");
const mapOpacity = $("mapOpacity");

// Settings modal
const settingsBtn = $("weatherSettingsBtn");
const settingsModal = $("weatherSettingsModal");
const settingsClose = $("weatherSettingsClose");
const settingsX = $("weatherSettingsX");
const saveSettingsBtn = $("weatherSaveSettings");
const resetSettingsBtn = $("weatherResetSettings");

// Settings inputs
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

// ---------- SETTINGS ----------
const DEFAULT_SETTINGS = {
  tempUnit: "F",         // F | C | K
  timeFormat: "12",      // 12 | 24
  lang: "en",
  autoLocate: false,
  loadLast: true,
  autoRefreshMin: 0,
  mapEnabled: true,
  mapLayer: "clouds_new",
  mapOpacity: 0.7,
  windUnit: "mph",       // mph | kmh | ms | kt
  pressureUnit: "hpa",   // hpa | inhg
  visUnit: "km",         // km | mi
};

let settings = loadSettings();
let lastCity = localStorage.getItem(WEATHER_CITY_KEY) || "";
let lastCoords = JSON.parse(localStorage.getItem(WEATHER_COORDS_KEY) || "null");
let refreshTimer = null;

// ---------- Helpers ----------
function setStatus(msg) { statusEl.textContent = msg || ""; }

function ensureKey() {
  if (!OPENWEATHER_KEY) {
    setStatus("Missing OpenWeather API key.");
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
  unitPill.textContent = `${tempUnit} • wind ${settings.windUnit} • pressure ${settings.pressureUnit} • vis ${settings.visUnit} • time ${settings.timeFormat}h • lang ${settings.lang}`;
}

// ---- Unit conversions ----
function toCFromK(k){ return k - 273.15; }
function toFFromC(c){ return (c * 9/5) + 32; }
function toKFromC(c){ return c + 273.15; }

function convertTempFromAPI(apiValue, apiUnits){
  // apiUnits: "imperial"(F), "metric"(C)
  if (apiValue == null || Number.isNaN(apiValue)) return null;

  const c = apiUnits === "imperial" ? (apiValue - 32) * 5/9 : apiValue; // normalize to C

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
  // OpenWeather: imperial -> mph, metric -> m/s
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
    const inhg = hpa * 0.0295299830714;
    return `${inhg.toFixed(2)} inHg`;
  }
  return `${Math.round(hpa)} hPa`;
}

function fmtVisibility(meters){
  if (meters == null) return "—";
  if (settings.visUnit === "mi"){
    const mi = meters / 1609.344;
    return `${mi.toFixed(1)} mi`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
}

function pad2(n){ return String(n).padStart(2,"0"); }
function iconUrl(icon){ return `https://openweathermap.org/img/wn/${icon}@2x.png`; }

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

/**
 * ✅ FIX: lock weekday label to the key (no user-timezone drift)
 * Using noon UTC avoids edge-cases where midnight shifts the date.
 */
function weekdayLabelFromKey(key){
  const [y,m,d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m-1, d, 12, 0, 0));
  return dt.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" });
}

async function fetchJSON(url){
  const res = await fetch(url);
  if (!res.ok){
    let detail = "";
    try{ detail = (await res.json())?.message || ""; } catch {}
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.json();
}

function showCards(show){
  currentCard.hidden = !show;
  uvCard.hidden = !show;
  precipCard.hidden = !show;
  airCard.hidden = !show;
  hourlyCard.hidden = !show;
  dailyCard.hidden = !show;
  historyCard.hidden = !show;
}

function setOfflineBanner(on, msg){
  offlineBanner.hidden = !on;
  if (msg) offlineText.textContent = msg;
}

// ---------- OpenWeather endpoints ----------
async function geocodeDirect(query){
  const q = encodeURIComponent(query);
  return fetchJSON(`${API}/geo/1.0/direct?q=${q}&limit=5&appid=${OPENWEATHER_KEY}`);
}
async function geocodeReverse(lat, lon){
  return fetchJSON(`${API}/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_KEY}`);
}
function apiUnits(){
  // We fetch in metric or imperial; Kelvin is derived locally.
  return settings.tempUnit === "F" ? "imperial" : "metric";
}
async function getCurrent(lat, lon){
  return fetchJSON(`${API}/data/2.5/weather?lat=${lat}&lon=${lon}&units=${apiUnits()}&lang=${settings.lang}&appid=${OPENWEATHER_KEY}`);
}
async function getForecast(lat, lon){
  return fetchJSON(`${API}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${apiUnits()}&lang=${settings.lang}&appid=${OPENWEATHER_KEY}`);
}
async function getAir(lat, lon){
  return fetchJSON(`${API}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}`);
}

// Map tile URL
function getOWMTileUrl(layer){
  return `https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${OPENWEATHER_KEY}`;
}

// =====================================================
// 1) Weather Alerts (REAL first, fallback if needed)
// =====================================================

async function fetchNWSAlerts(lat, lon){
  const res = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`, {
    headers: {
      // NWS asks for a UA + contact info
      "User-Agent": "CalebWeatherSite (calebkritzar@gmail.com)"
    }
  });
  if (!res.ok) throw new Error(`NWS alerts failed (${res.status})`);
  const data = await res.json();

  const features = data?.features || [];
  return features.map(f => {
    const p = f.properties || {};
    return {
      source: "NWS",
      title: p.event || "Weather Alert",
      detail: p.headline || p.description || "",
      severity: p.severity || "",
      ends: p.ends || null
    };
  });
}

async function fetchOpenWeatherAlertsOneCall(lat, lon){
  // OpenWeather alerts are in One Call (may require plan)
  const units = apiUnits();
  const url = `${API}/data/3.0/onecall?lat=${lat}&lon=${lon}&units=${units}&lang=${settings.lang}&appid=${OPENWEATHER_KEY}`;
  const data = await fetchJSON(url);

  const alerts = data?.alerts || [];
  return alerts.map(a => ({
    source: "OpenWeather",
    title: a.event || "Weather Alert",
    detail: a.description || "",
    severity: a.tags?.join(", ") || "",
    ends: a.end ? (a.end * 1000) : null
  }));
}

// Your old “computeLocalAlerts”, but now it’s explicitly a fallback heads-up
function computeLocalHeadsUp(current, forecast){
  const alerts = [];
  const units = apiUnits();

  const temp = current?.main?.temp;
  const wind = current?.wind?.speed;
  const id = current?.weather?.[0]?.id;

  if (typeof id === "number" && id >= 200 && id < 300) alerts.push("Thunderstorm conditions detected.");

  const tC = convertTempFromAPI(temp, units);
  if (tC != null){
    const tF = toFFromC(tC);
    if (tF <= 20) alerts.push("Extreme cold risk (very low temperatures).");
    if (tF >= 95) alerts.push("Extreme heat risk (very high temperatures).");
  }

  const w = convertWindFromAPI(wind, units);
  if (w && ((w.u === "mph" && w.v >= 30) || (w.u === "km/h" && w.v >= 50) || (w.u === "m/s" && w.v >= 13))){
    alerts.push("High winds — secure loose items and use caution outdoors.");
  }

  const list = forecast?.list || [];
  const next = list.slice(0, 2); // 6h
  const heavy = next.some(it => {
    const rain = it?.rain?.["3h"] || 0;
    const snow = it?.snow?.["3h"] || 0;
    return (rain + snow) >= 10;
  });
  if (heavy) alerts.push("Heavy precipitation expected in the next few hours.");

  return alerts;
}

function shouldShowAlert(){
  const dismissedUntil = Number(localStorage.getItem(WEATHER_ALERT_DISMISS_KEY) || "0");
  return Date.now() > dismissedUntil;
}

function showAlertBanner({ title, text }){
  alertBanner.hidden = false;
  alertTitle.textContent = title;
  alertText.textContent = text;
}

function hideAlertBanner(){
  alertBanner.hidden = true;
}

dismissAlertBtn.addEventListener("click", () => {
  localStorage.setItem(WEATHER_ALERT_DISMISS_KEY, String(Date.now() + 6*60*60*1000));
  hideAlertBanner();
});

async function updateAlerts(lat, lon, geo, current, forecast){
  if (!shouldShowAlert()){
    hideAlertBanner();
    return;
  }

  try{
    const country = (geo?.country || current?.sys?.country || "").toUpperCase();

    // US: official NWS alerts
    if (country === "US"){
      const nws = await fetchNWSAlerts(lat, lon);
      if (nws.length){
        const top = nws[0];
        showAlertBanner({
          title: `⚠️ ${top.title} (Official)`,
          text: top.detail || "An official weather alert is active for this area."
        });
        return;
      }
    }

    // Try OpenWeather One Call alerts (may fail if plan doesn’t include it)
    const ow = await fetchOpenWeatherAlertsOneCall(lat, lon);
    if (ow.length){
      const top = ow[0];
      showAlertBanner({
        title: `⚠️ ${top.title}`,
        text: (top.detail || "").slice(0, 280) || "A weather alert is active for this area."
      });
      return;
    }
  } catch (err){
    console.warn("Real alerts unavailable:", err);
  }

  // Fallback: rule-based heads-up
  const headsUp = computeLocalHeadsUp(current, forecast);
  if (headsUp.length){
    showAlertBanner({
      title: "⚠️ Weather heads-up",
      text: headsUp.join(" ")
    });
  } else {
    hideAlertBanner();
  }
}

// ---------- 13) Smart greeting ----------
function setGreeting(current, tz){
  if (!current?.dt) return;
  const now = dateFromUnixLocal(current.dt, tz);
  const h = now.getUTCHours();
  const part = (h < 12) ? "Good morning" : (h < 18) ? "Good afternoon" : "Good evening";

  const main = current?.weather?.[0]?.main || "Weather";
  const desc = current?.weather?.[0]?.description || "";
  greetingTitle.textContent = `${part} 👋`;
  greetingText.textContent = `${main}${desc ? ` • ${desc}` : ""}`;
  greetingBanner.hidden = false;
}

// ---------- 12) Weather-based theming ----------
function applyWeatherTheme(current){
  const id = current?.weather?.[0]?.id;
  if (typeof id !== "number") return;

  let mode = "default";
  if (id >= 200 && id < 300) mode = "storm";
  else if (id >= 300 && id < 600) mode = "rain";
  else if (id >= 600 && id < 700) mode = "snow";
  else if (id === 800) mode = "clear";
  else if (id > 800 && id < 900) mode = "cloud";

  weatherPage.dataset.weatherMode = mode;

  const map = {
    storm: "#8b5cf6",
    rain: "#38bdf8",
    snow: "#a5b4fc",
    clear: "#f59e0b",
    cloud: "#60a5fa",
    default: ""
  };
  const c = map[mode] || "";
  if (c) document.documentElement.style.setProperty("--accent-color", c);
}

// ---------- 2) Impact indicators ----------
function buildImpactPills(current, forecast){
  const pills = [];
  const units = apiUnits();

  const t = current?.main?.temp;
  const humidity = current?.main?.humidity;
  const wind = current?.wind?.speed;
  const vis = current?.visibility;

  // cold/hot feel
  const tC = convertTempFromAPI(t, units);
  if (tC != null){
    const tF = toFFromC(tC);
    if (tF <= 40) pills.push("🧥 Dress warm");

    // 🔥 FIX: base heat messaging on feels-like / humidity, not just temp
    const feelsApi = current?.main?.feels_like;
    const feelsC = convertTempFromAPI(feelsApi, units);
    if (feelsC != null){
      const feelsF = toFFromC(feelsC);
      if (feelsF >= 90) pills.push("🧴 Heat caution");
      else if (tF >= 88 && typeof humidity === "number" && humidity >= 60) pills.push("🧴 Muggy heat");
    }
  }

  // wind
  const w = convertWindFromAPI(wind, units);
  if (w && ((w.u === "mph" && w.v >= 20) || (w.u === "km/h" && w.v >= 32) || (w.u === "m/s" && w.v >= 9))){
    pills.push("💨 Windy");
  }

  // humidity
  if (typeof humidity === "number"){
    if (humidity >= 80) pills.push("💦 Very humid");
    if (humidity <= 25) pills.push("🌵 Dry air");
  }

  // visibility
  if (typeof vis === "number" && vis < 3000) pills.push("🌫 Low visibility");

  // precipitation soon
  const next = (forecast?.list || [])[0];
  const pop = next?.pop;
  if (typeof pop === "number" && pop >= 0.5) pills.push("☔ Rain likely");

  return pills;
}

// ---------- 6) Feels-like explanation ----------
function feelsLikeExplanation(current){
  const units = apiUnits();
  const t = current?.main?.temp;
  const feels = current?.main?.feels_like;
  const humidity = current?.main?.humidity;
  const wind = current?.wind?.speed;

  const tC = convertTempFromAPI(t, units);
  const fC = convertTempFromAPI(feels, units);
  if (tC == null || fC == null) return "—";

  const diffC = fC - tC;
  const diffF = diffC * 9/5;

  if (Math.abs(diffF) < 3) return "Feels close to actual temperature.";

  if (diffF < -3 && wind != null) return "Feels colder mainly due to wind (wind chill).";
  if (diffF > 3 && humidity != null && humidity > 60) return "Feels hotter mainly due to humidity (heat index).";
  return diffF < 0 ? "Feels colder due to conditions (wind/humidity)." : "Feels hotter due to conditions (humidity/sun).";
}

// ---------- 9) Pressure trend ----------
function updatePressureTrend(lat, lon, pressureHpa, tz){
  if (pressureHpa == null) {
    pressureTrendEl.textContent = "Pressure trend: —";
    return;
  }
  const key = `p_${lat.toFixed(3)}_${lon.toFixed(3)}`;
  const raw = localStorage.getItem(WEATHER_HISTORY_KEY);
  const data = raw ? JSON.parse(raw) : {};
  if (!data[key]) data[key] = [];
  data[key].push({ t: Date.now(), p: pressureHpa });
  data[key] = data[key].filter(x => Date.now() - x.t < 24*60*60*1000);
  localStorage.setItem(WEATHER_HISTORY_KEY, JSON.stringify(data));

  const now = Date.now();
  const past = data[key].slice().reverse().find(x => now - x.t > 3*60*60*1000);
  if (!past){
    pressureTrendEl.textContent = "Pressure trend: —";
    return;
  }
  const delta = pressureHpa - past.p;
  const arrow = delta > 1 ? "⬆" : (delta < -1 ? "⬇" : "→");
  const label = delta > 1 ? "Rising" : (delta < -1 ? "Falling" : "Steady");
  pressureTrendEl.textContent = `Pressure trend: ${arrow} ${label}`;
}

// ---------- 7) Sunrise/sunset visualization ----------
function renderSunBar(current, tz){
  const sunrise = current?.sys?.sunrise;
  const sunset = current?.sys?.sunset;
  const now = current?.dt;
  if (!sunrise || !sunset || !now) return;

  sunriseLbl.textContent = `Sunrise ${formatLocalTime(sunrise, tz)}`;
  sunsetLbl.textContent  = `Sunset ${formatLocalTime(sunset, tz)}`;

  const total = sunset - sunrise;
  const pos = Math.min(Math.max(now - sunrise, 0), total);
  const pct = total > 0 ? (pos / total) * 100 : 0;

  sunbarFill.style.width = `${pct}%`;
  sunbarDot.style.left = `${pct}%`;
}

// ---------- 3) UV estimate ----------
function estimateUV(lat, lon, unix, tz, cloudsPct){
  const d = dateFromUnixLocal(unix, tz);
  const dayOfYear = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(),0,0)) / 86400000);

  const decl = 23.44 * Math.sin((2*Math.PI/365) * (dayOfYear - 81)) * (Math.PI/180);
  const latRad = lat * Math.PI/180;

  const hour = d.getUTCHours() + d.getUTCMinutes()/60;
  const hourAngle = (Math.PI/12) * (hour - 12);

  const sinElev = Math.sin(latRad)*Math.sin(decl) + Math.cos(latRad)*Math.cos(decl)*Math.cos(hourAngle);
  const elev = Math.asin(Math.max(-1, Math.min(1, sinElev)));

  let uv = Math.max(0, (Math.sin(elev) ** 1.2) * 12);

  const cloudFactor = 1 - (Math.min(Math.max(cloudsPct ?? 0, 0), 100) / 100) * 0.6;
  uv *= cloudFactor;

  if (elev <= 0) uv = 0;

  return Math.round(uv * 10) / 10;
}

function uvCategory(uv){
  if (uv <= 2) return ["Low", "No protection needed for most people."];
  if (uv <= 5) return ["Moderate", "Sunscreen recommended if outside."];
  if (uv <= 7) return ["High", "Sunscreen + shade recommended."];
  if (uv <= 10) return ["Very High", "Limit midday sun exposure."];
  return ["Extreme", "Avoid direct sun; strong protection needed."];
}

// ---------- 4) Precip probability + amount ----------
function renderPrecip(forecast){
  const next = (forecast?.list || [])[0];
  if (!next){
    precipChance.textContent = "—";
    precipAmount.textContent = "—";
    precipNote.textContent = "—";
    return;
  }
  const pop = typeof next.pop === "number" ? Math.round(next.pop * 100) : null;

  const rain = next?.rain?.["3h"] ?? 0;
  const snow = next?.snow?.["3h"] ?? 0;

  precipChance.textContent = pop == null ? "—" : `${pop}%`;
  const mm = rain + snow;
  const inches = mm * 0.0393701;
  precipAmount.textContent = mm > 0
    ? `${mm.toFixed(1)} mm (${inches.toFixed(2)} in)`
    : "0";

  const kind = snow > rain ? "snow" : "rain";
  precipNote.textContent = mm > 0 ? `Next 3h expected ${kind}.` : "No significant precipitation expected next 3h.";
}

// ---------- 5) Favorites ----------
function loadFavs(){
  try { return JSON.parse(localStorage.getItem(WEATHER_FAVS_KEY) || "[]"); } catch { return []; }
}
function saveFavs(list){
  localStorage.setItem(WEATHER_FAVS_KEY, JSON.stringify(list));
}
function refreshFavUI(){
  const favs = loadFavs();
  favoritesSelect.innerHTML = "";
  if (!favs.length){
    favoritesSelect.innerHTML = `<option value="">No favorites yet</option>`;
    return;
  }
  for (const f of favs){
    const opt = document.createElement("option");
    opt.value = f.q;
    opt.textContent = f.label;
    favoritesSelect.appendChild(opt);
  }
}

favSaveBtn.addEventListener("click", () => {
  const q = (lastCity || cityInput.value || "").trim();
  if (!q) return setStatus("Search a city first, then save it.");
  const favs = loadFavs();
  const exists = favs.some(x => x.q.toLowerCase() === q.toLowerCase());
  if (exists) return setStatus("Already in favorites.");
  favs.unshift({ q, label: q });
  saveFavs(favs.slice(0, 25));
  refreshFavUI();
  setStatus("Saved to favorites.");
});

favGoBtn.addEventListener("click", () => {
  const q = favoritesSelect.value;
  if (!q) return;
  cityInput.value = q;
  loadByQuery(q).catch(err => setStatus(err.message));
});

favRemoveBtn.addEventListener("click", () => {
  const q = favoritesSelect.value;
  if (!q) return;
  const favs = loadFavs().filter(x => x.q !== q);
  saveFavs(favs);
  refreshFavUI();
  setStatus("Removed favorite.");
});

// ---------- 10) Compare two locations ----------
async function fetchSummary(q){
  const matches = await geocodeDirect(q);
  if (!matches?.length) throw new Error(`No match for "${q}"`);
  const { lat, lon, name, state, country } = matches[0];
  const [cur, fc] = await Promise.all([getCurrent(lat, lon), getForecast(lat, lon)]);
  const tz = cur?.timezone ?? 0;

  const nowTemp = fmtTempFromAPI(cur?.main?.temp, apiUnits());
  const cond = cur?.weather?.[0]?.description || "—";
  const wind = fmtWindFromAPI(cur?.wind?.speed, apiUnits());
  const pop = typeof fc?.list?.[0]?.pop === "number" ? `${Math.round(fc.list[0].pop*100)}%` : "—";
  const label = `${name}${state ? ", "+state : ""}${country ? ", "+country : ""}`;

  return { label, nowTemp, cond, wind, pop, tz, lat, lon };
}

compareBtn.addEventListener("click", async () => {
  const a = compareA.value.trim();
  const b = compareB.value.trim();
  if (!a || !b) return setStatus("Enter both Location A and Location B.");
  setStatus("Comparing…");
  compareGrid.innerHTML = "";

  try{
    const [A, B] = await Promise.all([fetchSummary(a), fetchSummary(b)]);
    compareGrid.innerHTML = `
      <div class="compare-box">
        <div class="compare-title">${A.label}</div>
        <div class="compare-line"><strong>Now:</strong> ${A.nowTemp}</div>
        <div class="compare-line"><strong>Conditions:</strong> ${A.cond}</div>
        <div class="compare-line"><strong>Wind:</strong> ${A.wind}</div>
        <div class="compare-line"><strong>Rain chance:</strong> ${A.pop}</div>
      </div>
      <div class="compare-box">
        <div class="compare-title">${B.label}</div>
        <div class="compare-line"><strong>Now:</strong> ${B.nowTemp}</div>
        <div class="compare-line"><strong>Conditions:</strong> ${B.cond}</div>
        <div class="compare-line"><strong>Wind:</strong> ${B.wind}</div>
        <div class="compare-line"><strong>Rain chance:</strong> ${B.pop}</div>
      </div>
    `;
    setStatus("");
  } catch(err){
    setStatus(`Compare failed: ${err.message}`);
  }
});

// ---------- 11) History snapshot ----------
function pushHistory(lat, lon, payload){
  const key = `h_${lat.toFixed(3)}_${lon.toFixed(3)}`;
  let data = [];
  try { data = JSON.parse(localStorage.getItem(WEATHER_HISTORY_KEY) || "[]"); } catch { data = []; }

  const units = apiUnits();
  const snap = {
    key,
    t: Date.now(),
    temp: payload?.current?.main?.temp ?? null,
    feels: payload?.current?.main?.feels_like ?? null,
    units,
    main: payload?.current?.weather?.[0]?.main ?? "",
    desc: payload?.current?.weather?.[0]?.description ?? ""
  };

  data.push(snap);
  data = data.filter(x => Date.now() - x.t < 72*60*60*1000);
  localStorage.setItem(WEATHER_HISTORY_KEY, JSON.stringify(data));
}

function renderHistory(lat, lon, current){
  const key = `h_${lat.toFixed(3)}_${lon.toFixed(3)}`;
  let data = [];
  try { data = JSON.parse(localStorage.getItem(WEATHER_HISTORY_KEY) || "[]"); } catch { data = []; }
  const series = data.filter(x => x.key === key).sort((a,b)=>a.t-b.t);

  const now = current?.main?.temp;
  const nowTxt = fmtTempFromAPI(now, apiUnits());
  histNow.textContent = `${nowTxt} • ${current?.weather?.[0]?.description || "—"}`;

  const target = Date.now() - 24*60*60*1000;
  let best = null;
  let bestDist = Infinity;
  for (const s of series){
    const dist = Math.abs(s.t - target);
    if (dist < bestDist){ bestDist = dist; best = s; }
  }

  if (!best){
    hist24.textContent = "Not enough history yet.";
    histDelta.textContent = "—";
    return;
  }

  const oldTempTxt = fmtTempFromAPI(best.temp, best.units);
  hist24.textContent = `${oldTempTxt} • ${best.desc || best.main || "—"}`;

  const nowC = convertTempFromAPI(now, apiUnits());
  const oldC = convertTempFromAPI(best.temp, best.units);
  if (nowC == null || oldC == null){
    histDelta.textContent = "—";
    return;
  }

  let deltaC = nowC - oldC;
  let deltaStr = "";
  if (settings.tempUnit === "C") deltaStr = `${deltaC.toFixed(1)}°C`;
  else if (settings.tempUnit === "F") deltaStr = `${(deltaC*9/5).toFixed(1)}°F`;
  else deltaStr = `${deltaC.toFixed(1)}°C`;

  histDelta.textContent = `${deltaStr} change`;
}

// ---------- Rendering main ----------
function renderAll(payload, isFromCache=false){
  const { current, forecast, air, geo } = payload;

  const lat = current?.coord?.lat;
  const lon = current?.coord?.lon;
  const tz = current?.timezone ?? 0;

  setOfflineBanner(isFromCache, isFromCache ? "This is cached data from your last successful fetch." : "");

  applyWeatherTheme(current);
  setGreeting(current, tz);

  showCards(true);

  const name = geo?.name || current?.name || "Unknown location";
  const state = geo?.state ? `, ${geo.state}` : "";
  const country = geo?.country ? `, ${geo.country}` : (current?.sys?.country ? `, ${current.sys.country}` : "");
  placeEl.textContent = `${name}${state}${country}`;

  const desc = current?.weather?.[0]?.description ?? "—";
  metaEl.textContent = `${desc} • Updated ${current?.dt ? formatLocalDateTime(current.dt, tz) : "—"}`;

  const icon = current?.weather?.[0]?.icon;
  if (icon){ iconEl.src = iconUrl(icon); iconEl.alt = desc; }
  else { iconEl.removeAttribute("src"); iconEl.alt = ""; }

  const units = apiUnits();

  tempEl.textContent = fmtTempFromAPI(current?.main?.temp, units);
  feelsEl.textContent = `Feels like ${fmtTempFromAPI(current?.main?.feels_like, units)}`;
  feelsExplain.textContent = feelsLikeExplanation(current);

  windEl.textContent = fmtWindFromAPI(current?.wind?.speed, units);
  humidityEl.textContent = current?.main?.humidity != null ? `${current.main.humidity}%` : "—";
  pressureEl.textContent = fmtPressure(current?.main?.pressure);
  visibilityEl.textContent = fmtVisibility(current?.visibility);

  const sunrise = current?.sys?.sunrise ? formatLocalTime(current.sys.sunrise, tz) : "—";
  const sunset  = current?.sys?.sunset  ? formatLocalTime(current.sys.sunset, tz) : "—";
  sunEl.textContent = `Sun: ${sunrise} ↑  ${sunset} ↓`;

  const hi = current?.main?.temp_max != null ? fmtTempFromAPI(current.main.temp_max, units) : "—";
  const lo = current?.main?.temp_min != null ? fmtTempFromAPI(current.main.temp_min, units) : "—";
  hiLoEl.textContent = `H/L: ${hi} / ${lo}`;

  cloudsEl.textContent = `Clouds: ${current?.clouds?.all != null ? `${current.clouds.all}%` : "—"}`;

  const pills = buildImpactPills(current, forecast);
  impactPills.innerHTML = pills.map(p => `<div class="pill">${p}</div>`).join("") || `<div class="pill">✅ Looks normal</div>`;

  renderPrecip(forecast);

  if (typeof lat === "number" && typeof lon === "number" && current?.dt){
    const uv = estimateUV(lat, lon, current.dt, tz, current?.clouds?.all ?? 0);
    const [cat, tip] = uvCategory(uv);
    uvValue.textContent = uv.toFixed(1);
    uvDesc.textContent = `${cat} • ${tip}`;
  } else {
    uvValue.textContent = "—";
    uvDesc.textContent = "—";
  }

  renderSunBar(current, tz);

  if (typeof lat === "number" && typeof lon === "number") {
    updatePressureTrend(lat, lon, current?.main?.pressure ?? null, tz);
  }

  renderAir(air);
  renderHourly(forecast, tz);
  renderDaily(forecast);

  if (typeof lat === "number" && typeof lon === "number"){
    renderHistory(lat, lon, current);
  }

  if (typeof lat === "number" && typeof lon === "number") setMapView(lat, lon);
}

function renderHourly(forecast, tzOffset){
  const list = forecast?.list || [];
  const next = list.slice(0, 8);
  const units = apiUnits();

  hourlyEl.innerHTML = next.map(item => {
    const time = item?.dt ? formatLocalTime(item.dt, tzOffset) : "—";
    const t = fmtTempFromAPI(item?.main?.temp, units);
    const pop = typeof item?.pop === "number" ? `${Math.round(item.pop*100)}%` : "";
    const icon = item?.weather?.[0]?.icon;
    const main = item?.weather?.[0]?.main ?? "";
    return `
      <div class="hour">
        <div class="h">${time}</div>
        ${icon ? `<img src="${iconUrl(icon)}" alt="${main}">` : ""}
        <div class="t">${t}</div>
        ${pop ? `<div class="h">☔ ${pop}</div>` : `<div class="h">&nbsp;</div>`}
      </div>
    `;
  }).join("");
}

/**
 * ✅ FIX: prevent the "5 day" from starting on yesterday.
 * OpenWeather 3-hour blocks can include a partial "yesterday" day bucket
 * depending on forecast city timezone. We drop any dayKey < todayKey (in city tz).
 */
function renderDaily(forecast){
  const list = forecast?.list || [];
  const tzOffset = forecast?.city?.timezone ?? 0;
  const units = apiUnits();

  const byDay = new Map();
  for (const item of list){
    const key = dayKeyFromUnix(item.dt, tzOffset);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(item);
  }

  const nowUnix = Math.floor(Date.now() / 1000);
  const todayKey = dayKeyFromUnix(nowUnix, tzOffset);

  const days = Array.from(byDay.entries())
    .filter(([key]) => key >= todayKey) // drop yesterday/past days
    .slice(0, 5);

  dailyEl.innerHTML = days.map(([key, items]) => {
    let min = Infinity, max = -Infinity;
    let best = items[0], bestDist = Infinity;
    let bestPop = 0;

    for (const it of items){
      const temp = it?.main?.temp;
      if (typeof temp === "number"){ min = Math.min(min, temp); max = Math.max(max, temp); }
      const d = dateFromUnixLocal(it.dt, tzOffset);
      const hour = d.getUTCHours();
      const dist = Math.abs(hour - 12);
      if (dist < bestDist){ bestDist = dist; best = it; }
      if (typeof it?.pop === "number") bestPop = Math.max(bestPop, it.pop);
    }

    const label = weekdayLabelFromKey(key);
    const desc = best?.weather?.[0]?.description ?? "—";
    const icon = best?.weather?.[0]?.icon;
    const range = (min !== Infinity && max !== -Infinity)
      ? `${fmtTempFromAPI(max, units)} / ${fmtTempFromAPI(min, units)}`
      : "—";
    const pop = bestPop ? `☔ ${Math.round(bestPop*100)}%` : "";

    return `
      <div class="day">
        <div class="name">${label}</div>
        <div class="desc">
          ${icon ? `<img src="${iconUrl(icon)}" alt="" style="width:28px;height:28px;vertical-align:middle;margin-right:6px;">` : ""}
          <span style="vertical-align:middle;">${desc}</span>
          ${pop ? `<span style="margin-left:10px;color:var(--secondary-text);font-size:12px;">${pop}</span>` : ""}
        </div>
        <div class="range">${range}</div>
      </div>
    `;
  }).join("");
}

function renderAir(air){
  const entry = air?.list?.[0];
  const aqi = entry?.main?.aqi;
  const comps = entry?.components || {};

  aqiBadge.textContent = aqi ? `AQI: ${aqi}` : "AQI: —";
  const map = {
    1: ["Good", "Air is clean."],
    2: ["Fair", "Mostly fine; sensitive folks might notice."],
    3: ["Moderate", "Sensitive groups should take it easy."],
    4: ["Poor", "Limit outdoor activity if you can."],
    5: ["Very Poor", "Avoid long outdoor exposure."],
  };
  const info = map[aqi] || ["—","—"];
  aqiText.textContent = aqi ? `${info[0]} • ${info[1]}` : "—";

  pm25El.textContent = comps.pm2_5 != null ? `${comps.pm2_5}` : "—";
  pm10El.textContent = comps.pm10 != null ? `${comps.pm10}` : "—";
  o3El.textContent   = comps.o3 != null ? `${comps.o3}` : "—";
  no2El.textContent  = comps.no2 != null ? `${comps.no2}` : "—";
  so2El.textContent  = comps.so2 != null ? `${comps.so2}` : "—";
  coEl.textContent   = comps.co != null ? `${comps.co}` : "—";
}

// ---------- Loaders + cache ----------
async function loadByQuery(searchText){
  if (!ensureKey()) return;
  const q = searchText?.trim();
  if (!q) return setStatus("Type a city first.");

  setStatus("Finding location…");
  const matches = await geocodeDirect(q);
  if (!matches?.length){
    showCards(false);
    setStatus("No match. Try: “Toledo, OH, US”.");
    return;
  }

  const top = matches[0];
  const { lat, lon } = top;

  localStorage.setItem(WEATHER_CITY_KEY, q);
  localStorage.setItem(WEATHER_COORDS_KEY, JSON.stringify({ lat, lon }));
  lastCity = q;
  lastCoords = { lat, lon };

  await loadByCoords(lat, lon, top);
}

async function loadByCoords(lat, lon, geoHint=null){
  if (!ensureKey()) return;
  setStatus("Loading weather…");

  let geo = geoHint;
  if (!geo){
    try { geo = (await geocodeReverse(lat, lon))?.[0] || null; } catch { geo = null; }
  }

  try{
    const [current, forecast, air] = await Promise.all([
      getCurrent(lat, lon),
      getForecast(lat, lon),
      getAir(lat, lon),
    ]);

    const payload = { current, forecast, air, geo, fetchedAt: Date.now() };

    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(payload));
    pushHistory(lat, lon, payload);

    renderAll(payload, false);

    // ✅ REAL alerts update (banner)
    updateAlerts(lat, lon, geo, current, forecast).catch(()=>{});

    setStatus("");
  } catch(err){
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if (raw){
      const cached = JSON.parse(raw);
      renderAll(cached, true);

      // ✅ Alerts even for cached (best effort)
      const cLat = cached?.current?.coord?.lat;
      const cLon = cached?.current?.coord?.lon;
      if (typeof cLat === "number" && typeof cLon === "number"){
        updateAlerts(cLat, cLon, cached.geo, cached.current, cached.forecast).catch(()=>{});
      }

      setStatus(`Live fetch failed: ${err.message}`);
      return;
    }
    setStatus(`Couldn’t load: ${err.message}`);
  }
}

async function refresh(){
  if (lastCoords?.lat != null && lastCoords?.lon != null){
    await loadByCoords(lastCoords.lat, lastCoords.lon);
    return;
  }
  if (lastCity){
    await loadByQuery(lastCity);
    return;
  }
  setStatus("Nothing to refresh yet.");
}

// ---------- Map ----------
function initMap(){
  if (!settings.mapEnabled){
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

function applyMapSettings(){
  if (!map){
    initMap();
    return;
  }
  mapCard.style.display = settings.mapEnabled ? "" : "none";
  if (!settings.mapEnabled) return;

  if (weatherOverlay){
    weatherOverlay.setOpacity(settings.mapOpacity);
    weatherOverlay.setUrl(getOWMTileUrl(settings.mapLayer));
  }
}

function setMapView(lat, lon){
  if (!settings.mapEnabled) return;
  initMap();
  map.setView([lat, lon], Math.max(map.getZoom(), 9));
  if (marker) marker.setLatLng([lat, lon]);
}

// ---------- Modal ----------
function openSettings(e){
  if (e){ e.preventDefault(); e.stopPropagation(); }
  settingsModal.hidden = false;
  document.body.style.overflow = "hidden";
  syncSettingsUI();
}
function closeSettings(e){
  if (e){ e.preventDefault(); e.stopPropagation(); }
  settingsModal.hidden = true;
  document.body.style.overflow = "";
}

document.addEventListener("keydown", (e)=>{
  if (e.key === "Escape" && !settingsModal.hidden) closeSettings(e);
});
settingsClose.addEventListener("click", closeSettings);
settingsModal.querySelector(".modal-card")?.addEventListener("click", (e)=>e.stopPropagation());
settingsBtn.addEventListener("click", openSettings);
settingsX.addEventListener("click", closeSettings);

// ---------- Events ----------
searchForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  offlineBanner.hidden = true;
  try { await loadByQuery(cityInput.value); }
  catch(err){ setStatus(err.message); }
});

geoBtn.addEventListener("click", ()=>{
  if (!ensureKey()) return;
  if (!navigator.geolocation) return setStatus("Geolocation isn’t supported.");

  setStatus("Requesting location permission…");
  navigator.geolocation.getCurrentPosition(
    async (pos)=>{
      try{
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        localStorage.setItem(WEATHER_COORDS_KEY, JSON.stringify({ lat, lon }));
        lastCoords = { lat, lon };

        await loadByCoords(lat, lon);
      } catch(err){
        setStatus(`Couldn’t load: ${err.message}`);
      }
    },
    (err)=>setStatus(`Location blocked/failed: ${err.message}`),
    { enableHighAccuracy: true, timeout: 12000 }
  );
});

refreshBtn.addEventListener("click", ()=>refresh().catch(err=>setStatus(err.message)));

mapLayerSel.addEventListener("change", ()=>saveSettings({ mapLayer: mapLayerSel.value }));
mapOpacity.addEventListener("input", ()=>saveSettings({ mapOpacity: Number(mapOpacity.value)/100 }));

unitF.addEventListener("click", ()=>{ saveSettings({ tempUnit: "F" }); refresh().catch(()=>{}); });
unitC.addEventListener("click", ()=>{ saveSettings({ tempUnit: "C" }); refresh().catch(()=>{}); });
unitK.addEventListener("click", ()=>{ saveSettings({ tempUnit: "K" }); refresh().catch(()=>{}); });

time12.addEventListener("click", ()=>{ saveSettings({ timeFormat: "12" }); refresh().catch(()=>{}); });
time24.addEventListener("click", ()=>{ saveSettings({ timeFormat: "24" }); refresh().catch(()=>{}); });

langSel.addEventListener("change", ()=>{ saveSettings({ lang: langSel.value }); refresh().catch(()=>{}); });
windUnitSel.addEventListener("change", ()=>{ saveSettings({ windUnit: windUnitSel.value }); refresh().catch(()=>{}); });
pressureUnitSel.addEventListener("change", ()=>{ saveSettings({ pressureUnit: pressureUnitSel.value }); refresh().catch(()=>{}); });
visUnitSel.addEventListener("change", ()=>{ saveSettings({ visUnit: visUnitSel.value }); refresh().catch(()=>{}); });

saveSettingsBtn.addEventListener("click", (e)=>{
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

resetSettingsBtn.addEventListener("click", (e)=>{
  e.preventDefault();
  resetSettings();
  closeSettings(e);
  refresh().catch(()=>{});
});

// ---------- INIT ----------
(function init(){
  syncSettingsUI();
  updateUnitPill();
  applyAutoRefresh();
  refreshFavUI();
  initMap();
  applyMapSettings();

  if (settings.autoLocate){
    geoBtn.click();
    return;
  }

  if (settings.loadLast){
    if (lastCity){
      cityInput.value = lastCity;
      loadByQuery(lastCity).catch(err=>setStatus(err.message));
    } else if (lastCoords?.lat != null && lastCoords?.lon != null){
      loadByCoords(lastCoords.lat, lastCoords.lon).catch(err=>setStatus(err.message));
    } else {
      setStatus("Search a city or use your location.");
    }
  } else {
    setStatus("Search a city or use your location.");
  }
})();
