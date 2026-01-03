// ✅ Put your OpenWeather API key here
const API_KEY = "4db1d129a3a21885b8474decfde9570c";

// Elements
const card = document.getElementById("weather-card");
const errorEl = document.getElementById("weather-error");
const chip = document.getElementById("statusChip");

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

// Enter key triggers search
cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doSearch();
});

searchBtn.addEventListener("click", doSearch);

function setChip(text) {
  if (!chip) return;
  chip.textContent = text;
}

function doSearch() {
  const city = cityInput.value.trim();
  if (!city) {
    errorEl.textContent = "Type a city first 😭";
    return;
  }
  fetchWeatherByQuery(city);
}

function fetchWeatherByQuery(query) {
  errorEl.textContent = "";
  card.classList.add("hidden");
  setChip("Loading…");

  const url =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?q=${encodeURIComponent(query)}` +
    `&units=imperial` +
    `&appid=${API_KEY}`;

  fetch(url)
    .then(async (r) => {
      const data = await r.json().catch(() => ({}));

      // ✅ This is the fix: show what OpenWeather is ACTUALLY saying
      if (!r.ok) {
        const apiMsg = data?.message ? ` — ${data.message}` : "";
        throw new Error(`OpenWeather error ${r.status}${apiMsg}`);
      }

      return data;
    })
    .then(showWeather)
    .catch((err) => {
      setChip("Error");
      errorEl.textContent = err.message;
      console.error("Weather fetch failed:", err);
    });
}

function showWeather(data) {
  const loc = `${data.name}, ${data.sys.country}`;
  const desc = data.weather?.[0]?.description ?? "—";
  const icon = data.weather?.[0]?.icon ?? "01d";

  const temp = Math.round(data.main.temp);
  const feels = Math.round(data.main.feels_like);
  const humidity = data.main.humidity;
  const wind = Math.round(data.wind.speed);
  const pressure = data.main.pressure;

  const hi = Math.round(data.main.temp_max);
  const lo = Math.round(data.main.temp_min);

  document.getElementById("weather-location").textContent = loc;
  document.getElementById("weather-desc").textContent = desc;

  document.getElementById("weather-temp").textContent = `${temp}°F`;
  document.getElementById("weather-feels").textContent = `${feels}°F`;
  document.getElementById("weather-humidity").textContent = `${humidity}%`;
  document.getElementById("weather-wind").textContent = `${wind} mph`;
  document.getElementById("weather-pressure").textContent = `${pressure} hPa`;
  document.getElementById("weather-hi-lo").textContent = `H: ${hi}°  ·  L: ${lo}°`;

  const iconEl = document.getElementById("weather-icon");
  iconEl.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  iconEl.alt = desc;

  const updatedEl = document.getElementById("weather-updated");
  const now = new Date();
  updatedEl.textContent = `Updated: ${now.toLocaleString()}`;

  setChip("Live");
  card.classList.remove("hidden");
}
