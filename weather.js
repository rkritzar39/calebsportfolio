// ========= CONFIG =========
const OPENWEATHER_KEY = "57e2ef8d1ddf45ced53b8444e23ce2b7"; // <-- put your key here

// ========= DOM =========
const $ = (id) => document.getElementById(id);

const searchForm = $("searchForm");
const cityInput  = $("cityInput");
const geoBtn     = $("geoBtn");
const statusEl   = $("status");

const currentCard  = $("currentCard");
const forecastCard = $("forecastCard");

const placeEl = $("place");
const metaEl  = $("meta");
const iconEl  = $("icon");

const tempEl       = $("temp");
const feelsEl      = $("feels");
const windEl       = $("wind");
const humidityEl   = $("humidity");
const pressureEl   = $("pressure");
const visibilityEl = $("visibility");

const forecastEl = $("forecast");

const unitF = $("unitF");
const unitC = $("unitC");

// ========= STATE =========
let units = localStorage.getItem("weather_units") || "imperial"; // imperial=F, metric=C
let lastCity = localStorage.getItem("weather_city") || "";

// ========= HELPERS =========
function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function setUnits(next) {
  units = next;
  localStorage.setItem("weather_units", units);

  const isF = units === "imperial";
  unitF.classList.toggle("is-active", isF);
  unitC.classList.toggle("is-active", !isF);
  unitF.setAttribute("aria-pressed", String(isF));
  unitC.setAttribute("aria-pressed", String(!isF));
}

function fmtTemp(x) {
  if (x === undefined || x === null) return "—";
  return `${Math.round(x)}°`;
}

function fmtWind(speed) {
  if (speed === undefined || speed === null) return "—";
  // OpenWeather: speed in m/s for metric, mph for imperial
  return units === "imperial" ? `${Math.round(speed)} mph` : `${Math.round(speed)} m/s`;
}

function iconUrl(icon) {
  // 2x icon looks nicer
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

function localTimeFromUnix(unixSeconds, tzOffsetSeconds) {
  // OpenWeather gives timezone offset (seconds from UTC) for the city
  const ms = (unixSeconds + tzOffsetSeconds) * 1000;
  return new Date(ms).toUTCString().replace("GMT", "").trim();
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

// ========= API CALLS =========
async function loadByCity(city) {
  if (!city?.trim()) return setStatus("Type a city first.");
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
  render(current, forecast);
  setStatus("");
}

async function loadByCoords(lat, lon) {
  setStatus("Getting weather for your location…");
  const currentUrl =
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=${units}`;
  const current = await fetchJSON(currentUrl);

  const forecastUrl =
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=${units}`;
  const forecast = await fetchJSON(forecastUrl);

  localStorage.setItem("weather_city", current?.name || "");
  render(current, forecast);
  setStatus("");
}

// ========= RENDER =========
function render(current, forecast) {
  currentCard.hidden = false;
  forecastCard.hidden = false;

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
  visibilityEl.textContent = current?.visibility != null ? `${(current.visibility / 1000).toFixed(1)} km` : "—";

  // Forecast: show next 12 hours (4 slots of 3hr = 12hr)
  const list = forecast?.list || [];
  const tzOffset = forecast?.city?.timezone ?? 0;

  const next = list.slice(0, 6); // 18 hours (6*3h). tweak as you want
  forecastEl.innerHTML = next.map(item => {
    const when = item?.dt ? localTimeFromUnix(item.dt, tzOffset) : "";
    const short = when.split(",")[0] ? when.split(",")[0] : when; // messy but ok
    const icon = item?.weather?.[0]?.icon;
    const d = item?.weather?.[0]?.main ?? "";
    const t = fmtTemp(item?.main?.temp);

    return `
      <div class="hour">
        <div class="h">${short}</div>
        ${icon ? `<img src="${iconUrl(icon)}" alt="${d}">` : ""}
        <div class="t">${t}</div>
      </div>
    `;
  }).join("");
}

// ========= EVENTS =========
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await loadByCity(cityInput.value);
  } catch (err) {
    setStatus(`Couldn’t load weather: ${err.message}`);
    currentCard.hidden = true;
    forecastCard.hidden = true;
  }
});

geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) return setStatus("Geolocation isn’t supported here.");
  setStatus("Requesting location permission…");
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        await loadByCoords(pos.coords.latitude, pos.coords.longitude);
      } catch (err) {
        setStatus(`Couldn’t load weather: ${err.message}`);
      }
    },
    (err) => setStatus(`Location blocked/failed: ${err.message}`)
  );
});

unitF.addEventListener("click", async () => {
  if (units === "imperial") return;
  setUnits("imperial");
  // reload last city if we have it
  if (localStorage.getItem("weather_city")) loadByCity(localStorage.getItem("weather_city"));
});
unitC.addEventListener("click", async () => {
  if (units === "metric") return;
  setUnits("metric");
  if (localStorage.getItem("weather_city")) loadByCity(localStorage.getItem("weather_city"));
});

// ========= INIT =========
setUnits(units);
if (lastCity) {
  cityInput.value = lastCity;
  // try auto-load on open (comment out if you hate auto requests)
  loadByCity(lastCity).catch(err => setStatus(`Couldn’t load weather: ${err.message}`));
} else {
  setStatus("Search a city or use your location.");
}
