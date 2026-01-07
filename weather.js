// =====================================================
// Weather Page JS (OpenWeather)
// - search city
// - geolocation
// - F/C toggle
// - hourly + daily preview
// - saves last city + units
// =====================================================

// ====== CONFIG ======
const OPENWEATHER_KEY = "57e2ef8d1ddf45ced53b8444e23ce2b7"; // <-- put your OpenWeather API key here

// ====== DOM ======
const $ = (id) => document.getElementById(id);

const searchForm  = $("searchForm");
const cityInput   = $("cityInput");
const geoBtn      = $("geoBtn");
const refreshBtn  = $("refreshBtn");
const statusEl    = $("status");

const unitF = $("unitF");
const unitC = $("unitC");

const currentCard = $("currentCard");
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

// ====== STATE ======
let units = localStorage.getItem("weather_units") || "imperial"; // imperial=F, metric=C
let lastCity = localStorage.getItem("weather_city") || "";
let lastCoords = JSON.parse(localStorage.getItem("weather_coords") || "null");

// ====== HELPERS ======
function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function setUnits(nextUnits) {
  units = nextUnits;
  localStorage.setItem("weather_units", units);

  const isF = units === "imperial";
  unitF.classList.toggle("is-active", isF);
  unitC.classList.toggle("is-active", !isF);
  unitF.setAttribute("aria-pressed", String(isF));
  unitC.setAttribute("aria-pressed", String(!isF));
}

function iconUrl(icon) {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

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

function pad2(n) {
  return String(n).padStart(2, "0");
}

function localTimeFromUnix(unixSeconds, tzOffsetSeconds) {
  // OpenWeather timezone offset is seconds from UTC
  const ms = (unixSeconds + tzOffsetSeconds) * 1000;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const mo = pad2(d.getUTCMonth() + 1);
  const da = pad2(d.getUTCDate());
  const hh = pad2(d.getUTCHours());
  const mm = pad2(d.getUTCMinutes());
  return `${y}-${mo}-${da} ${hh}:${mm}`;
}

function dayKeyFromUnix(unixSeconds, tzOffsetSeconds) {
  const ms = (unixSeconds + tzOffsetSeconds) * 1000;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const mo = pad2(d.getUTCMonth() + 1);
  const da = pad2(d.getUTCDate());
  return `${y}-${mo}-${da}`;
}

function weekdayLabelFromKey(key) {
  // key: YYYY-MM-DD (in that location's local date)
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
  hourlyCard.hidden  = !show;
  dailyCard.hidden   = !show;
}

// ====== API ======
async function loadByCity(city) {
  if (!city?.trim()) {
    setStatus("Type a city first.");
    return;
  }
  if (!OPENWEATHER_KEY || OPENWEATHER_KEY.includes("YOUR_API_KEY_HERE")) {
    setStatus("Add your OpenWeather API key in weather.js (OPENWEATHER_KEY).");
    return;
  }

  setStatus("Loading weather…");

  const q = encodeURIComponent(city.trim());
  const currentUrl =
    `https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${OPENWEATHER_KEY}&units=${units}`;

  const current = await fetchJSON(currentUrl);
  const { lat, lon } = current.coord;

  const forecastUrl =
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=${units}`;

  const forecast = await fetchJSON(forecastUrl);

  localStorage.setItem("weather_city", city.trim());
  localStorage.setItem("weather_coords", JSON.stringify({ lat, lon }));
  lastCity = city.trim();
  lastCoords = { lat, lon };

  render(current, forecast);
  setStatus("");
}

async function loadByCoords(lat, lon) {
  if (!OPENWEATHER_KEY || OPENWEATHER_KEY.includes("YOUR_API_KEY_HERE")) {
    setStatus("Add your OpenWeather API key in weather.js (OPENWEATHER_KEY).");
    return;
  }

  setStatus("Loading weather for your location…");

  const currentUrl =
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=${units}`;
  const current = await fetchJSON(currentUrl);

  const forecastUrl =
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=${units}`;
  const forecast = await fetchJSON(forecastUrl);

  localStorage.setItem("weather_city", current?.name || "");
  localStorage.setItem("weather_coords", JSON.stringify({ lat, lon }));
  lastCity = current?.name || "";
  lastCoords = { lat, lon };

  render(current, forecast);
  setStatus("");
}

// ====== RENDER ======
function render(current, forecast) {
  showCards(true);

  const name = current?.name ?? "Unknown location";
  const country = current?.sys?.country ? `, ${current.sys.country}` : "";
  placeEl.textContent = `${name}${country}`;

  const desc = current?.weather?.[0]?.description ?? "—";
  const tz = current?.timezone ?? 0;
  const updated = current?.dt ? localTimeFromUnix(current.dt, tz) : "—";
  metaEl.textContent = `${desc} • Updated ${updated}`;

  const icon = current?.weather?.[0]?.icon;
  if (icon) {
    iconEl.src = iconUrl(icon);
    iconEl.alt = desc;
  } else {
    iconEl.removeAttribute("src");
    iconEl.alt = "";
  }

  tempEl.textContent = fmtTemp(current?.main?.temp);
  feelsEl.textContent = `Feels like ${fmtTemp(current?.main?.feels_like)}`;

  windEl.textContent = fmtWind(current?.wind?.speed);
  humidityEl.textContent = current?.main?.humidity != null ? `${current.main.humidity}%` : "—";
  pressureEl.textContent = current?.main?.pressure != null ? `${current.main.pressure} hPa` : "—";
  visibilityEl.textContent = fmtKm(current?.visibility);

  const sunrise = current?.sys?.sunrise ? localTimeFromUnix(current.sys.sunrise, tz).split(" ")[1] : "—";
  const sunset  = current?.sys?.sunset  ? localTimeFromUnix(current.sys.sunset, tz).split(" ")[1] : "—";
  sunEl.textContent = `Sun: ${sunrise} ↑  ${sunset} ↓`;

  const hi = current?.main?.temp_max != null ? fmtTemp(current.main.temp_max) : "—";
  const lo = current?.main?.temp_min != null ? fmtTemp(current.main.temp_min) : "—";
  hiLoEl.textContent = `H/L: ${hi} / ${lo}`;

  const clouds = current?.clouds?.all != null ? `${current.clouds.all}%` : "—";
  cloudsEl.textContent = `Clouds: ${clouds}`;

  renderHourly(forecast);
  renderDaily(forecast);
}

function renderHourly(forecast) {
  const list = forecast?.list || [];
  const tzOffset = forecast?.city?.timezone ?? 0;

  // next 8 blocks = 24 hours (3h steps)
  const next = list.slice(0, 8);

  hourlyEl.innerHTML = next.map(item => {
    const time = item?.dt ? localTimeFromUnix(item.dt, tzOffset).split(" ")[1] : "—";
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

  // Group forecast entries by local-day key
  const byDay = new Map();
  for (const item of list) {
    const key = dayKeyFromUnix(item.dt, tzOffset);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(item);
  }

  // Take next 5 days (including today)
  const days = Array.from(byDay.entries()).slice(0, 5);

  dailyEl.innerHTML = days.map(([key, items]) => {
    let min = Infinity;
    let max = -Infinity;

    // pick "midday-ish" icon/desc (closest to 12:00)
    let best = items[0];
    let bestDist = Infinity;

    for (const it of items) {
      const t = it?.main?.temp;
      if (typeof t === "number") {
        min = Math.min(min, t);
        max = Math.max(max, t);
      }

      const local = localTimeFromUnix(it.dt, tzOffset);
      const hour = Number(local.split(" ")[1].slice(0, 2));
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

// ====== EVENTS ======
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const city = cityInput.value;

  try {
    await loadByCity(city);
  } catch (err) {
    showCards(false);
    setStatus(`Couldn’t load weather: ${err.message}`);
  }
});

geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Geolocation isn’t supported in this browser.");
    return;
  }

  setStatus("Requesting location permission…");

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        await loadByCoords(pos.coords.latitude, pos.coords.longitude);
      } catch (err) {
        showCards(false);
        setStatus(`Couldn’t load weather: ${err.message}`);
      }
    },
    (err) => {
      setStatus(`Location blocked/failed: ${err.message}`);
    },
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
      await loadByCity(lastCity);
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
    else if (lastCity) await loadByCity(lastCity);
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
    else if (lastCity) await loadByCity(lastCity);
  } catch (err) {
    showCards(false);
    setStatus(`Couldn’t reload in °C: ${err.message}`);
  }
});

// ====== INIT ======
setUnits(units);

if (lastCity) {
  cityInput.value = lastCity;
  // Auto-load last searched city on open
  loadByCity(lastCity).catch((err) => {
    showCards(false);
    setStatus(`Couldn’t load saved city: ${err.message}`);
  });
} else {
  setStatus("Search a city or use your location.");
}
