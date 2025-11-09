/* =============================
   CONFIG
============================= */
const OWM_KEY = "e261c0d563503aabaf6710629356bf41"; // ← replace this

/* =============================
   SETTINGS BRIDGE
   - Reads your existing settings from localStorage or window.SettingsManager
   - Applies theme vars live; listens for changes
============================= */
const SettingsBridge = (() => {
  const FALLBACKS = {
    appearanceMode: "device",
    themeStyle: "clear",
    accentColor: "#3ddc84",
    fontSize: 16,
    motionEffects: "enabled",
    highContrast: "disabled",
    units: "metric" // NEW: let settings define metric/imperial if present
  };

  function readFromLocalStorage() {
    // Try common keys your project has used
    const keys = ["appSettings", "userSettings", "settings"];
    for (const k of keys) {
      try {
        const v = localStorage.getItem(k);
        if (v) return JSON.parse(v);
      } catch {}
    }
    return null;
  }

  function getSettings() {
    // Prefer live instance if available
    if (window.SettingsManager && typeof window.SettingsManager.getCurrent === "function") {
      try { return { ...FALLBACKS, ...window.SettingsManager.getCurrent() }; } catch {}
    }
    // Try a global instance pattern
    if (window.settingsManager && typeof window.settingsManager.loadSettings === "function") {
      try { return { ...FALLBACKS, ...window.settingsManager.loadSettings() }; } catch {}
    }
    // Fallback: localStorage
    const stored = readFromLocalStorage();
    return { ...FALLBACKS, ...(stored || {}) };
  }

  function applyTheme(settings) {
    const r = document.documentElement;
    if (settings.accentColor) r.style.setProperty("--accent", settings.accentColor);
    if (settings.fontSize) document.documentElement.style.fontSize = `${settings.fontSize}px`;
    // You already manage bg and content vars globally; we only ensure we respect them here.
    // High contrast
    if (settings.highContrast === "enabled") {
      r.style.setProperty("--border-color", "rgba(255,255,255,.7)");
    }
  }

  function listen(cb) {
    // Custom event (if your settings.js dispatches it)
    window.addEventListener("settings:updated", () => cb(getSettings()));
    // Storage change across tabs
    window.addEventListener("storage", (e) => {
      if (["appSettings","userSettings","settings"].includes(e.key)) cb(getSettings());
    });
  }

  const current = getSettings();
  applyTheme(current);

  return { current, getSettings, applyTheme, listen };
})();

/* =============================
   DOM
============================= */
const el = (id) => document.getElementById(id);
const cityEl = el("city-name");
const tempEl = el("temp");
const descEl = el("description");
const iconEl = el("weather-icon");
const extraEl = el("extra");
const sunriseEl = el("sunrise-sunset");
const dateTimeEl = el("date-time");
const hourlyContainer = el("hourly-scroll");
const dailyContainer = el("daily-forecast");
const detailsGrid = el("weather-details");
const aqiBadge = el("aqi-badge");
const aqiDesc = el("aqi-desc");
const aqiBreakdown = el("aqi-breakdown");
const alertsSection = el("alerts-section");
const alertsList = el("alerts-list");
const unitToggle = el("unit-toggle");

let units = (SettingsBridge.current.units === "imperial") ? "imperial" : "metric";

/* =============================
   DATE / TIME
============================= */
function updateDate() {
  const now = new Date();
  dateTimeEl.textContent = now.toLocaleString(undefined, {
    weekday: "long", hour: "numeric", minute: "2-digit"
  });
}
setInterval(updateDate, 60_000); updateDate();

/* =============================
   BACKGROUND BY CONDITION + THEME
============================= */
function setBackground(condition, themeStyle = "clear") {
  const mapClear = {
    Clear: "linear-gradient(180deg, #4facfe, #00f2fe)",
    Clouds: "linear-gradient(180deg, #757f9a, #d7dde8)",
    Rain: "linear-gradient(180deg, #667db6, #0082c8)",
    Thunderstorm: "linear-gradient(180deg, #283e51, #485563)",
    Snow: "linear-gradient(180deg, #e6dada, #274046)",
    Mist: "linear-gradient(180deg, #606c88, #3f4c6b)",
    Drizzle: "linear-gradient(180deg, #74ebd5, #ACB6E5)",
    Haze: "linear-gradient(180deg, #bdc3c7, #2c3e50)"
  };
  const mapVivid = {
    Clear: "linear-gradient(180deg, #00d2ff, #3a7bd5)",
    Clouds: "linear-gradient(180deg, #6a85b6, #bac8e0)",
    Rain: "linear-gradient(180deg, #2b5876, #4e4376)",
    Thunderstorm: "linear-gradient(180deg, #141e30, #243b55)",
    Snow: "linear-gradient(180deg, #83a4d4, #b6fbff)",
    Mist: "linear-gradient(180deg, #606c88, #3f4c6b)",
    Drizzle: "linear-gradient(180deg, #74ebd5, #9face6)",
    Haze: "linear-gradient(180deg, #bdc3c7, #2c3e50)"
  };
  const palette = themeStyle === "vivid" ? mapVivid : mapClear;
  document.documentElement.style.setProperty("--dynamic-bg", palette[condition] || palette.Clear);
}

/* =============================
   API HELPERS
============================= */
const kmh = (ms, units) => {
  if (units === "imperial") return `${Math.round(ms * 2.237)} mph`;
  return `${Math.round(ms * 3.6)} km/h`;
};
const tempUnit = () => units === "imperial" ? "°F" : "°C";

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchAll(lat, lon) {
  // Current city name
  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${OWM_KEY}`;
  // One Call 3.0 for hourly/daily + alerts
  const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely&units=${units}&appid=${OWM_KEY}`;
  // Air Pollution
  const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OWM_KEY}`;

  const [current, onecall, aqi] = await Promise.all([
    fetchJSON(currentUrl), fetchJSON(oneCallUrl), fetchJSON(aqiUrl)
  ]);
  return { current, onecall, aqi };
}

/* =============================
   RENDERERS
============================= */
function renderCurrent(current, onecall) {
  cityEl.textContent = current.name;
  tempEl.textContent = `${Math.round(current.main.temp)}°`;
  descEl.textContent = current.weather?.[0]?.description ?? "—";
  const icon = current.weather?.[0]?.icon;
  iconEl.src = icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : "";
  extraEl.textContent = `Feels like ${Math.round(current.main.feels_like)}°, Humidity ${current.main.humidity}%, Wind ${kmh(current.wind.speed, units)}`;

  const sunrise = new Date(current.sys.sunrise * 1000).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
  const sunset  = new Date(current.sys.sunset  * 1000).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
  sunriseEl.textContent = `☀️ Sunrise ${sunrise} | 🌙 Sunset ${sunset}`;

  const themeStyle = SettingsBridge.getSettings().themeStyle || "clear";
  setBackground(current.weather?.[0]?.main, themeStyle);

  // Details (use onecall.current for richer fields)
  const c = onecall.current;
  detailsGrid.innerHTML = `
    <div class="detail-card"><h4>UV Index</h4><p>${Math.round(c.uvi ?? 0)}</p></div>
    <div class="detail-card"><h4>Pressure</h4><p>${c.pressure ?? current.main.pressure} hPa</p></div>
    <div class="detail-card"><h4>Visibility</h4><p>${((c.visibility ?? 0)/1000).toFixed(1)} km</p></div>
    <div class="detail-card"><h4>Clouds</h4><p>${c.clouds ?? current.clouds?.all ?? 0}%</p></div>
    <div class="detail-card"><h4>Dew Point</h4><p>${Math.round(c.dew_point ?? 0)}°</p></div>
    <div class="detail-card"><h4>Wind Gust</h4><p>${c.wind_gust ? kmh(c.wind_gust, units) : "—"}</p></div>
  `;
}

function renderHourly(onecall) {
  hourlyContainer.innerHTML = "";
  onecall.hourly.slice(0, 12).forEach(h => {
    const hour = new Date(h.dt * 1000).toLocaleTimeString([], {hour: "2-digit"});
    const card = document.createElement("div");
    card.className = "hour-card";
    card.innerHTML = `
      <p>${hour}</p>
      <img src="https://openweathermap.org/img/wn/${h.weather?.[0]?.icon}.png" alt="">
      <p>${Math.round(h.temp)}°</p>
    `;
    hourlyContainer.appendChild(card);
  });
}

function renderDaily(onecall) {
  dailyContainer.innerHTML = "";
  onecall.daily.slice(1, 8).forEach(d => {
    const day = new Date(d.dt * 1000).toLocaleDateString(undefined, {weekday: "short"});
    const card = document.createElement("div");
    card.className = "day-card";
    card.innerHTML = `
      <span class="day-name">${day}</span>
      <img src="https://openweathermap.org/img/wn/${d.weather?.[0]?.icon}.png" alt="">
      <span class="temp-range">${Math.round(d.temp.max)}° / ${Math.round(d.temp.min)}°</span>
    `;
    dailyContainer.appendChild(card);
  });
}

function aqiLabel(i) {
  // OWM AQI scale: 1 Good, 2 Fair, 3 Moderate, 4 Poor, 5 Very Poor
  return ["—","Good","Fair","Moderate","Poor","Very Poor"][i] || "—";
}
function aqiColor(i){
  return {
    1: "linear-gradient(135deg,#4caf50,#8bc34a)",
    2: "linear-gradient(135deg,#8bc34a,#cddc39)",
    3: "linear-gradient(135deg,#ffeb3b,#ffc107)",
    4: "linear-gradient(135deg,#ff9800,#ff5722)",
    5: "linear-gradient(135deg,#f44336,#e91e63)"
  }[i] || "rgba(255,255,255,.12)";
}

function renderAQI(aqi) {
  const point = aqi.list?.[0];
  if (!point) return;
  const idx = point.main?.aqi ?? 0;
  aqiBadge.textContent = idx;
  aqiBadge.style.background = aqiColor(idx);
  aqiDesc.textContent = aqiLabel(idx);

  const c = point.components || {};
  aqiBreakdown.textContent =
    `PM2.5 ${c.pm2_5 ?? "—"} µg/m³ • PM10 ${c.pm10 ?? "—"} µg/m³ • O₃ ${c.o3 ?? "—"} µg/m³ • NO₂ ${c.no2 ?? "—"} µg/m³ • SO₂ ${c.so2 ?? "—"} µg/m³ • CO ${c.co ?? "—"} µg/m³`;
}

function renderAlerts(onecall) {
  const alerts = onecall.alerts || [];
  if (!alerts.length) {
    alertsSection.hidden = true;
    alertsList.innerHTML = "";
    return;
  }
  alertsSection.hidden = false;
  alertsList.innerHTML = alerts.map(a => `
    <div class="alert-card">
      <h4>${a.event ?? "Alert"}</h4>
      <p class="muted">${new Date(a.start*1000).toLocaleString()} → ${new Date(a.end*1000).toLocaleString()}</p>
      <p>${(a.sender_name || "").toString()}</p>
      <p>${(a.description || "").toString().replace(/\n+/g,'<br>')}</p>
    </div>
  `).join("");
}

/* =============================
   RADAR (Leaflet + OWM tiles)
============================= */
let map, overlayLayers = {};
function initRadar(lat, lon) {
  if (!window.L) return; // Leaflet not loaded
  if (map) {
    map.setView([lat, lon], 8);
    return;
  }
  map = L.map("radar", { zoomControl: false, attributionControl: false }).setView([lat, lon], 8);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18
  }).addTo(map);

  const layerNames = ["precipitation_new","clouds_new","temp_new","wind_new"];
  layerNames.forEach((name) => {
    const layer = L.tileLayer(`https://tile.openweathermap.org/map/${name}/{z}/{x}/{y}.png?appid=${OWM_KEY}`, { opacity: name==="temp_new" ? 0.5 : 0.7 });
    overlayLayers[name] = layer;
    if (name === "precipitation_new") layer.addTo(map);
  });

  document.querySelectorAll(".radar-controls input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", (e) => {
      const lname = e.target.getAttribute("data-layer");
      if (!overlayLayers[lname]) return;
      if (e.target.checked) overlayLayers[lname].addTo(map);
      else overlayLayers[lname].remove();
    });
  });
}

/* =============================
   LOCATION + FETCH
============================= */
async function loadByCoords(lat, lon) {
  const data = await fetchAll(lat, lon);
  renderCurrent(data.current, data.onecall);
  renderHourly(data.onecall);
  renderDaily(data.onecall);
  renderAQI(data.aqi);
  renderAlerts(data.onecall);
  initRadar(lat, lon);
}

function detectAndLoad() {
  navigator.geolocation.getCurrentPosition(
    (pos) => loadByCoords(pos.coords.latitude, pos.coords.longitude),
    () => loadByCoords(40.7128, -74.0060) // NYC fallback
  );
}

/* =============================
   UNITS TOGGLE (sync with settings if present)
============================= */
function setUnits(next) {
  units = next;
  // if your settings system stores units, persist it:
  try {
    const s = SettingsBridge.getSettings();
    s.units = units;
    localStorage.setItem("appSettings", JSON.stringify(s));
    SettingsBridge.applyTheme(s);
  } catch {}
  detectAndLoad();
}

unitToggle?.addEventListener("click", () => setUnits(units === "metric" ? "imperial" : "metric"));
unitToggle?.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") setUnits(units === "metric" ? "imperial" : "metric"); });

/* =============================
   LIVE SETTINGS UPDATES
============================= */
SettingsBridge.listen((settings) => {
  SettingsBridge.applyTheme(settings);
  // Re-apply dynamic background style variant
  const themeStyle = settings.themeStyle || "clear";
  // Keep the same condition if we can infer it from current text
  const cond = (descEl.textContent || "").split(" ")[0];
  setBackground(cond || "Clear", themeStyle);
});

/* =============================
   BOOT
============================= */
detectAndLoad();
