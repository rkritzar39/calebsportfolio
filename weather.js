// WeatherAPI setup
// Base URL + endpoints are documented here: http://api.weatherapi.com/v1 with /search.json and /forecast.json etc. :contentReference[oaicite:5]{index=5}
const WEATHERAPI_KEY = "06cd381424154ba99a5180218260301";
const BASE = "https://api.weatherapi.com/v1";

// UI
const card = document.getElementById("weather-card");
const errorEl = document.getElementById("weather-error");
const chip = document.getElementById("statusChip");

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

const suggestionsEl = document.getElementById("suggestions");

// Debounce helper (keeps API calls chill)
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

function hideSuggestions() {
  suggestionsEl.classList.add("hidden");
  suggestionsEl.innerHTML = "";
}

function showSuggestions(items) {
  if (!items?.length) return hideSuggestions();

  suggestionsEl.innerHTML = items
    .slice(0, 8)
    .map((loc, idx) => {
      const name = loc.name ?? "";
      const region = loc.region ?? "";
      const country = loc.country ?? "";
      const id = loc.id; // usable as q=id:<id> per docs :contentReference[oaicite:6]{index=6}
      const label = [name, region, country].filter(Boolean).join(", ");
      return `
        <div class="suggestion" role="option" data-id="${id}" data-label="${escapeHtml(label)}">
          <div>${escapeHtml(name)}</div>
          <div class="sub">${escapeHtml([region, country].filter(Boolean).join(", "))}</div>
        </div>
      `;
    })
    .join("");

  suggestionsEl.classList.remove("hidden");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// --- Autocomplete (Search API) ---
// /search.json exists and returns locations; you can then call forecast with q=id:<id>. :contentReference[oaicite:7]{index=7}
const doAutocomplete = debounce(async () => {
  const q = cityInput.value.trim();
  clearError();

  // Don’t spam when user typed 1 letter
  if (q.length < 2) return hideSuggestions();

  // If user is typing a ZIP, autocomplete isn’t super helpful; let them just search
  if (/^\d{3,}$/.test(q)) return hideSuggestions();

  try {
    setChip("Searching…");
    const url = `${BASE}/search.json?key=${encodeURIComponent(WEATHERAPI_KEY)}&q=${encodeURIComponent(q)}`;
    const res = await fetch(url);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error?.message || `WeatherAPI error ${res.status}`);
    }

    showSuggestions(data);
    setChip("Ready");
  } catch (e) {
    // Autocomplete failure shouldn’t kill the whole page
    console.error(e);
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
  // click outside suggestions closes it
  if (!suggestionsEl.contains(e.target) && e.target !== cityInput) hideSuggestions();
});

// click a suggestion
suggestionsEl.addEventListener("click", (e) => {
  const row = e.target.closest(".suggestion");
  if (!row) return;

  const id = row.getAttribute("data-id");
  const label = row.getAttribute("data-label") || "";
  hideSuggestions();

  cityInput.value = label;
  // Use q=id:<id> for precise location selection :contentReference[oaicite:8]{index=8}
  doSearch(`id:${id}`);
});

// Search button
searchBtn.addEventListener("click", () => {
  hideSuggestions();
  doSearch(cityInput.value.trim());
});

// --- Forecast (current + hourly + daily) ---
// /forecast.json with days param (1–14) per docs. :contentReference[oaicite:9]{index=9}
async function doSearch(query) {
  if (!query) return showError("Type a city or ZIP first.");

  try {
    clearError();
    setChip("Loading…");
    card.classList.add("hidden");

    // days range 1..14 per docs; we’ll do 7. :contentReference[oaicite:10]{index=10}
    const url =
      `${BASE}/forecast.json?key=${encodeURIComponent(WEATHERAPI_KEY)}` +
      `&q=${encodeURIComponent(query)}` +
      `&days=7` +
      `&aqi=yes` +
      `&alerts=yes`;

    const res = await fetch(url);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error?.message || `WeatherAPI error ${res.status}`);
    }

    renderWeather(data);
    setChip("Live");
    card.classList.remove("hidden");
  } catch (e) {
    console.error(e);
    showError(e.message || "Something broke.");
  }
}

function renderWeather(data) {
  const loc = data.location;
  const cur = data.current;
  const forecastDays = data.forecast?.forecastday || [];

  // Header/main
  document.getElementById("weather-location").textContent =
    `${loc.name}, ${loc.region ? loc.region + ", " : ""}${loc.country}`;

  document.getElementById("weather-desc").textContent =
    cur.condition?.text ?? "—";

  document.getElementById("weather-meta").textContent =
    `Local time: ${loc.localtime}`;

  document.getElementById("weather-temp").textContent =
    `${Math.round(cur.temp_f)}°F`;

  // Hi/Lo today
  const today = forecastDays[0]?.day;
  if (today) {
    document.getElementById("weather-hi-lo").textContent =
      `H: ${Math.round(today.maxtemp_f)}°  ·  L: ${Math.round(today.mintemp_f)}°`;
  } else {
    document.getElementById("weather-hi-lo").textContent = "";
  }

  // Stats
  document.getElementById("weather-feels").textContent = `${Math.round(cur.feelslike_f)}°F`;
  document.getElementById("weather-humidity").textContent = `${cur.humidity}%`;
  document.getElementById("weather-wind").textContent = `${Math.round(cur.wind_mph)} mph`;
  document.getElementById("weather-uv").textContent = `${cur.uv}`;

  // Icon
  const iconEl = document.getElementById("weather-icon");
  const iconUrl = cur.condition?.icon ? (cur.condition.icon.startsWith("//") ? `https:${cur.condition.icon}` : cur.condition.icon) : "";
  iconEl.src = iconUrl;
  iconEl.alt = cur.condition?.text ?? "";

  // Hourly (next 6 hours from today's hour array)
  const hourlyEl = document.getElementById("hourly");
  hourlyEl.innerHTML = "";
  const hours = forecastDays[0]?.hour || [];
  const nowEpoch = cur.last_updated_epoch || Math.floor(Date.now() / 1000);

  const next = hours
    .filter(h => h.time_epoch >= nowEpoch)
    .slice(0, 6);

  next.forEach(h => {
    const t = new Date(h.time_epoch * 1000);
    const label = t.toLocaleTimeString([], { hour: "numeric" });
    const hIcon = h.condition?.icon ? (h.condition.icon.startsWith("//") ? `https:${h.condition.icon}` : h.condition.icon) : "";
    hourlyEl.insertAdjacentHTML("beforeend", `
      <div class="hour">
        <span class="t">${label}</span>
        <img src="${hIcon}" alt="" />
        <span class="v">${Math.round(h.temp_f)}°</span>
      </div>
    `);
  });

  // Daily (7-day)
  const dailyEl = document.getElementById("daily");
  dailyEl.innerHTML = "";

  forecastDays.slice(0, 7).forEach(fd => {
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
    `Updated: ${new Date(cur.last_updated_epoch * 1000).toLocaleString()}`;
}

// FYI: If you exceed monthly quota, WeatherAPI stops returning data until reset (UTC 1st of month). :contentReference[oaicite:11]{index=11}
