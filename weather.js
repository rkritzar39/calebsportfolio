const API_KEY = "4db1d129a3a21885b8474decfde9570c";

const card = document.getElementById("weather-card");
const errorEl = document.getElementById("weather-error");

document.getElementById("searchBtn").addEventListener("click", () => {
  const city = document.getElementById("cityInput").value.trim();
  if (city) fetchWeather(city);
});

function fetchWeather(city) {
  errorEl.textContent = "";
  card.classList.add("hidden");

  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=imperial&appid=${API_KEY}`)
    .then(r => {
      if (!r.ok) throw new Error("City not found");
      return r.json();
    })
    .then(showWeather)
    .catch(err => errorEl.textContent = err.message);
}

function showWeather(data) {
  document.getElementById("weather-location").textContent =
    `${data.name}, ${data.sys.country}`;

  document.getElementById("weather-desc").textContent =
    data.weather[0].description;

  document.getElementById("weather-temp").textContent =
    `${Math.round(data.main.temp)}°F`;

  document.getElementById("weather-feels").textContent =
    `${Math.round(data.main.feels_like)}°F`;

  document.getElementById("weather-humidity").textContent =
    `${data.main.humidity}%`;

  document.getElementById("weather-wind").textContent =
    `${Math.round(data.wind.speed)} mph`;

  const icon = data.weather[0].icon;
  document.getElementById("weather-icon").src =
    `https://openweathermap.org/img/wn/${icon}@2x.png`;

  card.classList.remove("hidden");
}
