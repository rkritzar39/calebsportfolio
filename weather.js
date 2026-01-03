// WeatherAPI setup
const WEATHERAPI_KEY = "06cd381424154ba99a5180218260301"; // <-- rotate your key + paste here
const BASE = "https://api.weatherapi.com/v1";

// Free plan safe settings
const DAYS = 3;                 // WeatherAPI free plan forecast is 3 days
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

// UI
const card = document.getElementById("weather-card");
const errorEl = document.getElementById("weather-error");
const chip = document.getElementById("statusChip");

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

const suggestionsEl = document.getElementById("suggestions");

// ---------- Helpers ----------
function debounce(fn, ms = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function setChip(text) {
  if (chip) chip.textContent = text;
}

function showError(msg) {
  setChip("Error");
  errorEl.textContent = msg;
  card.classList.add("hidden");
}

function clearError() {
  errorEl.textContent = "";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------- Caching (saves quota) ----------
const cacheKey = (q) => `wx-cache:${q.toLowerCase()}`;

function getCached(q) {
  try {
    const raw = localStorage.getItem(cacheKey(q));
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj?.time || !obj?.data) return null;
    if (Date.now() - obj.time > CACHE_TTL_MS) return null;
    return obj.data;
  } catch {
    return null;
  }
}

function setCached(q, data) {
  try {
    localStorage.setItem(cacheKey(q), JSON.stringify({ time: Date.now(), data }));
  } catch {
    // ignore storage failures
  }
}

// ---------- Suggestions UI ----------
function hideSuggestions() {
  suggestionsEl.classList.add("hidden");
  suggestionsEl.innerHTML = "";
}

function showSuggestions(items) {
  if (!items?.length) return hideSuggestions();

  suggestionsEl.innerHTML = items
    .slice(0, 8)
    .map((loc) => {
      const name = loc.name ?? "";
      const region = loc.region ?? "";
      const country = loc.country ?? "";
      const id = loc.id; // q=id:<id>
      return `
        <div class="suggestion" role="option" data-id="${id}">
          <div>${escapeHtml(name)}</div>
          <div class="sub">${escapeHtml([region, country].filter(Boolean).join(", "))}</div>
        </div>
      `;
    })
    .join("");

  suggestionsEl.classList.remove("hidden");
}

// ---------- Autocomplete ----------
const doAutocomplete = debounce(async () => {
  const q = cityInput.value.trim();
  clearError();

  if (q.length < 2) return hideSuggestions();
  if (/^\d{3,}$/.test(q)) return hideSuggestions(); // ZIP: don’t spam suggestions

  try {
    setChip("Searching…");
    const url = `${BASE}/search.json?key=${encodeURIComponent(WEATHERAPI_KEY)}&q=${encodeURIComponent(q)}`;
    const res = await fetch(url);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = data?.error?.message || `WeatherAPI error ${res.status}`;
      throw new Error(msg);
    }

    showSuggestions(data);
    setChip("Ready");
  } catch (e) {
    console.error("Autocomplete failed:", e);
    hideSuggestions();
    setChip("Ready");
  }
}, 250);

// input events
cityInput.addEventListener("input", doAutocomplete);

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    hideSuggestions();
    doSearch(cityInput.value.trim());
  }
  if (e.key === "Escape") hideSuggestions();
});

document.addEventListener("click", (e) => {
  if (!suggestionsEl.contains(e.target) && e.target !== cityInput) hideSuggestions();
});

// click a suggestion
suggestionsEl.addEventListener("click", (e) => {
  const row = e.target.closest(".suggestion");
  if (!row) return;

  const id = row.getAttribute("data-id");
  hideSuggestions();

  // Use ID query for precision
  doSearch(`id:${id}`);
});

// Search button
searchBtn.addEventListener("click", () => {
  hideSuggestions();
  doSearch(cityInput.value.trim());
});

// ---------- Forecast ----------
async function doSearch(query) {
  if (!query) return showError("Type a city or ZIP first.");

  try {
    clearError();
    setChip("Loading…");
    card.classList.add("hidden");

    // Use cache first
    const cached = getCached(query);
    if (cached) {
      renderWeather(cached);
      setChip("Cached");
      card.classList.remove("hidden");
      return;
    }

    // Free plan safe: days=3, aqi=no, alerts=no
    const url =
      `${BASE}/forecast.json?key=${encodeURIComponent(WEATHERAPI_KEY)}` +
      `&q=${encodeURIComponent(query)}` +
      `&days=${DAYS}` +
      `&aqi=no` +
      `&alerts=no`;

    const res = await fetch(url);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = data?.error?.message || `WeatherAPI error ${res.status}`;
      throw new Error(msg);
    }

    setCached(query, data);
    renderWeather(data);

    setChip("Live");
    card.classList.remove("hidden");
  } catch (e) {
    console.error("Forecast fetch failed:", e);
    showError(e.message || "Something broke.");
  }
}

function renderWeather(data) {
  const loc = data.location;
  const cur = data.current;
  const forecastDays = data.forecast?.forecastday || [];

  // Header/main
  document.getElementById("weather-location").textContent =
    `${loc.name}${loc.region ? ", " + loc.region : ""}, ${loc.country}`;

  document.getElementById("weather-desc").textContent =
    cur.condition?.text ?? "—";

  document.getElementById("weather-meta").textContent =
    `Local time: ${loc.localtime}`;

  document.getElementById("weather-temp").textContent =
    `${Math.round(cur.temp_f)}°F`;

  // Hi/Lo today
  const today = forecastDays[0]?.day;
  document.getElementById("weather-hi-lo").textContent = today
    ? `H: ${Math.round(today.maxtemp_f)}°  ·  L: ${Math.round(today.mintemp_f)}°`
    : "";

  // Stats
  document.getElementById("weather-feels").textContent = `${Math.round(cur.feelslike_f)}°F`;
  document.getElementById("weather-humidity").textContent = `${cur.humidity}%`;
  document.getElementById("weather-wind").textContent = `${Math.round(cur.wind_mph)} mph`;
  document.getElementById("weather-uv").textContent = `${cur.uv ?? "—"}`;

  // Icon
  const iconEl = document.getElementById("weather-icon");
  const iconUrl = cur.condition?.icon
    ? (cur.condition.icon.startsWith("//") ? `https:${cur.condition.icon}` : cur.condition.icon)
    : "";
  iconEl.src = iconUrl;
  iconEl.alt = cur.condition?.text ?? "";

  // Hourly: next 6 hours, even across midnight (uses forecastday[0] and [1])
  const hourlyEl = document.getElementById("hourly");
  hourlyEl.innerHTML = "";

  const nowEpoch = cur.last_updated_epoch || Math.floor(Date.now() / 1000);
  const allHours = [
    ...(forecastDays[0]?.hour || []),
    ...(forecastDays[1]?.hour || []),
  ];

  const next = allHours
    .filter(h => h.time_epoch >= nowEpoch)
    .slice(0, 6);

  next.forEach(h => {
    const t = new Date(h.time_epoch * 1000);
    const label = t.toLocaleTimeString([], { hour: "numeric" });
    const hIcon = h.condition?.icon
      ? (h.condition.icon.startsWith("//") ? `https:${h.condition.icon}` : h.condition.icon)
      : "";

    hourlyEl.insertAdjacentHTML("beforeend", `
      <div class="hour">
        <span class="t">${label}</span>
        <img src="${hIcon}" alt="" />
        <span class="v">${Math.round(h.temp_f)}°</span>
      </div>
    `);
  });

  // Daily: show up to DAYS (free = 3)
  const dailyEl = document.getElementById("daily");
  dailyEl.innerHTML = "";

  forecastDays.slice(0, DAYS).forEach(fd => {
    const d = new Date(fd.date + "T00:00:00");
    const dayName = d.toLocaleDateString([], { weekday: "short" });
    const cond = fd.day?.condition?.text ?? "";
    const hi = Math.round(fd.day?.maxtemp_f ?? 0);
    const lo = Math.round(fd.day?.mintemp_f ?? 0);

    dailyEl.insertAdjacentHTML("beforeend", `
      <div class="day">
        <div class="d">${dayName}</div>
        <div class="c">${escapeHtml(cond)}</div>
        <div class="r">${hi}° / ${lo}°</div>
      </div>
    `);
  });

  document.getElementById("weather-updated").textContent =
    `Updated: ${new Date((cur.last_updated_epoch || nowEpoch) * 1000).toLocaleString()}`;
}
