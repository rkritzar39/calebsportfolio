// WeatherAPI (free plan safe)
const WEATHERAPI_KEY = "06cd381424154ba99a5180218260301";
const BASE = "https://api.weatherapi.com/v1";
const DAYS = 3;                  // free plan forecast limit
const CACHE_TTL_MS = 10 * 60 * 1000;

const el = (id) => document.getElementById(id);

const statusChip = el("statusChip");
const input = el("cityInput");
const searchBtn = el("searchBtn");
const geoBtn = el("geoBtn");

const suggestionsEl = el("suggestions");
const errorEl = el("weather-error");

const nowPanel = el("nowPanel");
const detailsPanel = el("detailsPanel");
const hourlyPanel = el("hourlyPanel");
const forecastPanel = el("forecastPanel");

const unitF = el("unitF");
const unitC = el("unitC");

const favBtn = el("favBtn");
const favList = el("favList");
const recentList = el("recentList");

let unit = localStorage.getItem("wx:unit") || "f"; // "f" or "c"
let lastResolvedLocationKey = null;                // stable key for favorites/recents
let lastQueryUsed = null;

function setChip(t) { if (statusChip) statusChip.textContent = t; }
function showError(msg) { errorEl.textContent = msg; setChip("Error"); }
function clearError() { errorEl.textContent = ""; }

function debounce(fn, ms = 250) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------- Units ----------
function applyUnitUI() {
  if (unit === "f") { unitF.classList.add("is-on"); unitC.classList.remove("is-on"); }
  else { unitC.classList.add("is-on"); unitF.classList.remove("is-on"); }
}
unitF.addEventListener("click", () => { unit = "f"; localStorage.setItem("wx:unit", unit); applyUnitUI(); if (lastQueryUsed) doSearch(lastQueryUsed, { allowCache: true }); });
unitC.addEventListener("click", () => { unit = "c"; localStorage.setItem("wx:unit", unit); applyUnitUI(); if (lastQueryUsed) doSearch(lastQueryUsed, { allowCache: true }); });
applyUnitUI();

// ---------- Cache ----------
const cacheKey = (q) => `wx:cache:${unit}:${q.toLowerCase()}`;

function getCached(q) {
  try {
    const raw = localStorage.getItem(cacheKey(q));
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj?.t || !obj?.data) return null;
    if (Date.now() - obj.t > CACHE_TTL_MS) return null;
    return obj.data;
  } catch { return null; }
}

function setCached(q, data) {
  try { localStorage.setItem(cacheKey(q), JSON.stringify({ t: Date.now(), data })); } catch {}
}

// ---------- Favorites & Recents ----------
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function getFavs() { return loadJSON("wx:favs", []); }
function setFavs(v) { saveJSON("wx:favs", v); }
function getRecents() { return loadJSON("wx:recents", []); }
function setRecents(v) { saveJSON("wx:recents", v); }

function locationKeyFromData(data) {
  // stable-ish key: name+region+country+lat+lon
  const loc = data.location;
  return `${loc.name}|${loc.region}|${loc.country}|${loc.lat}|${loc.lon}`;
}

function locationLabelFromData(data) {
  const loc = data.location;
  const parts = [loc.name, loc.region, loc.country].filter(Boolean);
  return parts.join(", ");
}

function updateFavStar() {
  const favs = getFavs();
  const on = lastResolvedLocationKey && favs.some(f => f.key === lastResolvedLocationKey);
  favBtn.classList.toggle("is-on", !!on);
}

favBtn.addEventListener("click", () => {
  if (!lastResolvedLocationKey) return;
  const favs = getFavs();
  const exists = favs.find(f => f.key === lastResolvedLocationKey);

  if (exists) {
    setFavs(favs.filter(f => f.key !== lastResolvedLocationKey));
  } else {
    // lastQueryUsed might be id: or typed text; store a safe query: lat,lon
    const loc = window.__wx_last_data?.location;
    const q = loc ? `${loc.lat},${loc.lon}` : lastQueryUsed;
    setFavs([{ key: lastResolvedLocationKey, label: exists?.label ?? el("wxLocation").textContent, q }, ...favs].slice(0, 12));
  }
  renderFavs();
  updateFavStar();
});

function pushRecentFromData(data) {
  const key = locationKeyFromData(data);
  const label = locationLabelFromData(data);
  const loc = data.location;
  const q = `${loc.lat},${loc.lon}`;

  let rec = getRecents().filter(r => r.key !== key);
  rec.unshift({ key, label, q, t: Date.now() });
  rec = rec.slice(0, 12);
  setRecents(rec);
  renderRecents();
}

function renderFavs() {
  const favs = getFavs();
  favList.innerHTML = favs.length ? "" : `<div class="wx-muted">No favorites yet.</div>`;
  favs.forEach(f => {
    favList.insertAdjacentHTML("beforeend", `
      <div class="wx-pill" data-q="${escapeHtml(f.q)}">
        <div>${escapeHtml(f.label)}</div>
        <div class="sub">Favorite</div>
      </div>
    `);
  });
}

function renderRecents() {
  const rec = getRecents();
  recentList.innerHTML = rec.length ? "" : `<div class="wx-muted">No recent searches yet.</div>`;
  rec.forEach(r => {
    const ageMin = Math.max(1, Math.round((Date.now() - r.t) / 60000));
    recentList.insertAdjacentHTML("beforeend", `
      <div class="wx-pill" data-q="${escapeHtml(r.q)}">
        <div>${escapeHtml(r.label)}</div>
        <div class="sub">${ageMin}m ago</div>
      </div>
    `);
  });
}

favList.addEventListener("click", (e) => {
  const pill = e.target.closest(".wx-pill");
  if (!pill) return;
  doSearch(pill.getAttribute("data-q"));
});
recentList.addEventListener("click", (e) => {
  const pill = e.target.closest(".wx-pill");
  if (!pill) return;
  doSearch(pill.getAttribute("data-q"));
});

renderFavs();
renderRecents();

// ---------- Suggestions ----------
function hideSuggestions() { suggestionsEl.classList.add("hidden"); suggestionsEl.innerHTML = ""; }

function showSuggestions(items) {
  if (!items?.length) return hideSuggestions();
  suggestionsEl.innerHTML = items.slice(0, 8).map(loc => {
    const label = [loc.name, loc.region, loc.country].filter(Boolean).join(", ");
    return `
      <div class="wx-suggestion" role="option" data-id="${loc.id}" data-label="${escapeHtml(label)}">
        <div>${escapeHtml(loc.name ?? "")}</div>
        <div class="sub">${escapeHtml([loc.region, loc.country].filter(Boolean).join(", "))}</div>
      </div>
    `;
  }).join("");
  suggestionsEl.classList.remove("hidden");
}

// Autocomplete (don’t spam quota)
const doAutocomplete = debounce(async () => {
  const q = input.value.trim();
  clearError();

  if (q.length < 2) return hideSuggestions();
  if (/^\d{3,}$/.test(q)) return hideSuggestions(); // ZIP typing: no suggestions

  try {
    setChip("Searching…");
    const url = `${BASE}/search.json?key=${encodeURIComponent(WEATHERAPI_KEY)}&q=${encodeURIComponent(q)}`;
    const res = await fetch(url);
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error?.message || `WeatherAPI error ${res.status}`);
    showSuggestions(data);
    setChip("Ready");
  } catch (e) {
    console.error(e);
    hideSuggestions();
    setChip("Ready");
  }
}, 250);

input.addEventListener("input", doAutocomplete);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { hideSuggestions(); doSearch(input.value.trim()); }
  if (e.key === "Escape") hideSuggestions();
});

document.addEventListener("click", (e) => {
  if (!suggestionsEl.contains(e.target) && e.target !== input) hideSuggestions();
});

suggestionsEl.addEventListener("click", (e) => {
  const row = e.target.closest(".wx-suggestion");
  if (!row) return;
  const id = row.getAttribute("data-id");
  const label = row.getAttribute("data-label") || "";
  input.value = label;
  hideSuggestions();
  doSearch(`id:${id}`);
});

searchBtn.addEventListener("click", () => { hideSuggestions(); doSearch(input.value.trim()); });

// ---------- Geolocation ----------
geoBtn.addEventListener("click", () => {
  clearError();
  if (!navigator.geolocation) return showError("Geolocation not supported on this device.");
  setChip("Locating…");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const q = `${pos.coords.latitude},${pos.coords.longitude}`;
      doSearch(q);
    },
    (err) => {
      console.error(err);
      showError("Location denied or unavailable. Search a city/ZIP instead.");
    },
    { enableHighAccuracy: true, timeout: 9000 }
  );
});

// ---------- Fetch + Render ----------
async function doSearch(query, opts = {}) {
  if (!query) return showError("Type a city, ZIP, or postal code.");

  lastQueryUsed = query;
  clearError();
  setChip("Loading…");

  const allowCache = opts.allowCache !== false;

  // Cache first
  if (allowCache) {
    const cached = getCached(query);
    if (cached) {
      setChip("Cached");
      renderAll(cached);
      return;
    }
  }

  try {
    // Free plan safe: days=3, no alerts/aqi
    const endpoint = unit === "f" ? "forecast.json" : "forecast.json"; // same endpoint, we just read temp_c vs temp_f
    const url =
      `${BASE}/${endpoint}?key=${encodeURIComponent(WEATHERAPI_KEY)}` +
      `&q=${encodeURIComponent(query)}` +
      `&days=${DAYS}` +
      `&aqi=no&alerts=no`;

    const res = await fetch(url);
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error?.message || `WeatherAPI error ${res.status}`);

    setCached(query, data);
    setChip("Live");
    renderAll(data);
  } catch (e) {
    console.error(e);
    showError(e.message || "Something broke.");
  }
}

function renderAll(data) {
  window.__wx_last_data = data;

  // reveal panels
  nowPanel.classList.remove("hidden");
  detailsPanel.classList.remove("hidden");
  hourlyPanel.classList.remove("hidden");
  forecastPanel.classList.remove("hidden");

  const loc = data.location;
  const cur = data.current;
  const days = data.forecast?.forecastday || [];

  const isF = unit === "f";
  const temp = isF ? cur.temp_f : cur.temp_c;
  const feels = isF ? cur.feelslike_f : cur.feelslike_c;
  const wind = isF ? `${Math.round(cur.wind_mph)} mph` : `${Math.round(cur.wind_kph)} kph`;

  // NOW
  el("wxLocation").textContent = `${loc.name}${loc.region ? ", " + loc.region : ""}, ${loc.country}`;
  el("wxLocalTime").textContent = `Local time: ${loc.localtime}`;

  el("wxTemp").textContent = `${Math.round(temp)}°${isF ? "F" : "C"}`;
  el("wxCond").textContent = cur.condition?.text ?? "—";

  const today = days[0]?.day;
  if (today) {
    const hi = isF ? today.maxtemp_f : today.maxtemp_c;
    const lo = isF ? today.mintemp_f : today.mintemp_c;
    el("wxHiLo").textContent = `H: ${Math.round(hi)}°  ·  L: ${Math.round(lo)}°`;
  } else {
    el("wxHiLo").textContent = "—";
  }

  const iconUrl = cur.condition?.icon
    ? (cur.condition.icon.startsWith("//") ? `https:${cur.condition.icon}` : cur.condition.icon)
    : "";

  el("wxIcon").src = iconUrl;
  el("wxIcon").alt = cur.condition?.text ?? "";

  el("wxFeels").textContent = `${Math.round(feels)}°`;
  el("wxHumidity").textContent = `${cur.humidity}%`;
  el("wxWind").textContent = wind;
  el("wxUV").textContent = `${cur.uv ?? "—"}`;

  // DETAILS (WeatherAPI has a lot of these fields on current)
  el("wxPressure").textContent = `${cur.pressure_mb ?? "—"} mb`;
  el("wxVis").textContent = isF ? `${cur.vis_miles ?? "—"} mi` : `${cur.vis_km ?? "—"} km`;
  el("wxCloud").textContent = `${cur.cloud ?? "—"}%`;
  el("wxGust").textContent = isF ? `${Math.round(cur.gust_mph ?? 0)} mph` : `${Math.round(cur.gust_kph ?? 0)} kph`;
  el("wxPrecip").textContent = isF ? `${cur.precip_in ?? 0} in` : `${cur.precip_mm ?? 0} mm`;

  // Dew point isn’t always present directly; approximate from temp+humidity (cheap and “weather app” enough)
  el("wxDew").textContent = approxDewPoint(temp, cur.humidity, isF);

  // HOURLY: next 8 hours across midnight
  const strip = el("hourStrip");
  strip.innerHTML = "";

  const nowEpoch = cur.last_updated_epoch || Math.floor(Date.now() / 1000);
  const allHours = [
    ...(days[0]?.hour || []),
    ...(days[1]?.hour || []),
  ];

  const nextHours = allHours.filter(h => h.time_epoch >= nowEpoch).slice(0, 8);
  nextHours.forEach(h => {
    const t = new Date(h.time_epoch * 1000);
    const label = t.toLocaleTimeString([], { hour: "numeric" });
    const icon = h.condition?.icon ? (h.condition.icon.startsWith("//") ? `https:${h.condition.icon}` : h.condition.icon) : "";
    const ht = isF ? h.temp_f : h.temp_c;

    strip.insertAdjacentHTML("beforeend", `
      <div class="wx-hour">
        <div class="t">${label}</div>
        <img src="${icon}" alt="" />
        <div class="v">${Math.round(ht)}°</div>
      </div>
    `);
  });

  // 3-DAY
  const dayList = el("dayList");
  dayList.innerHTML = "";
  days.slice(0, DAYS).forEach(d => {
    const date = new Date(d.date + "T00:00:00");
    const name = date.toLocaleDateString([], { weekday: "long" });
    const cond = d.day?.condition?.text ?? "";
    const hi = isF ? d.day?.maxtemp_f : d.day?.maxtemp_c;
    const lo = isF ? d.day?.mintemp_f : d.day?.mintemp_c;

    dayList.insertAdjacentHTML("beforeend", `
      <div class="wx-day">
        <div class="d">${escapeHtml(name)}</div>
        <div class="c">${escapeHtml(cond)}</div>
        <div class="r">${Math.round(hi ?? 0)}° / ${Math.round(lo ?? 0)}°</div>
      </div>
    `);
  });

  // updated
  el("wxUpdated").textContent = `Updated: ${new Date((cur.last_updated_epoch || nowEpoch) * 1000).toLocaleString()}`;

  // favorites/recents
  lastResolvedLocationKey = locationKeyFromData(data);
  updateFavStar();
  pushRecentFromData(data);
}

// Helpers for keys/labels
function locationKeyFromData(data) {
  const loc = data.location;
  return `${loc.name}|${loc.region}|${loc.country}|${loc.lat}|${loc.lon}`;
}

// Dew point approximation (Magnus formula-ish)
// If using Fahrenheit, convert to C for calc then back to F
function approxDewPoint(temp, humidity, isF) {
  if (temp == null || humidity == null) return "—";
  let tC = isF ? (temp - 32) * (5/9) : temp;
  const rh = Math.max(1, Math.min(100, humidity)) / 100;

  // Magnus constants for water vapor over liquid water
  const a = 17.62;
  const b = 243.12;
  const gamma = (a * tC) / (b + tC) + Math.log(rh);
  const dewC = (b * gamma) / (a - gamma);

  if (!isFinite(dewC)) return "—";

  const out = isF ? (dewC * (9/5) + 32) : dewC;
  return `${Math.round(out)}°${isF ? "F" : "C"}`;
}
