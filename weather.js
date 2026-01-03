const API_KEY = "PUT_YOUR_OPENWEATHER_KEY_HERE";

const weatherEl = document.getElementById("weather");
const errorEl = document.getElementById("error");

document.getElementById("searchBtn").addEventListener("click", getWeatherByCity);

function getWeatherByCity() {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) return;

  fetchWeather(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=imperial&appid=${API_KEY}`
  );
}

function fetchWeather(url) {
  errorEl.textContent = "";
  weatherEl.classList.add("hidden");

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("City not found");
      return res.json();
    })
    .then(data => showWeather(data))
    .catch(err => {
      errorEl.textContent = err.message;
    });
}

function showWeather(data) {
  document.getElementById("location").textContent =
    `${data.name}, ${data.sys.country}`;

  document.getElementById("temp").textContent =
    `${Math.round(data.main.temp)}°F`;

  document.getElementById("desc").textContent =
    data.weather[0].description;

  document.getElementById("extra").textContent =
    `Humidity: ${data.main.humidity}% · Wind: ${Math.round(data.wind.speed)} mph`;

  const icon = data.weather[0].icon;
  const iconEl = document.getElementById("icon");
  iconEl.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  iconEl.alt = data.weather[0].description;

  weatherEl.classList.remove("hidden");
}
