/**
 * device.js — v14 SAFE+
 * ✅ Works on iOS, Android, and Desktop
 * ✅ Fixes version/build/synced display
 * ✅ Auto-updates Day/Night every minute
 * ✅ Accurate local sunrise/sunset times
 */

document.addEventListener("DOMContentLoaded", () => {
  const q = (id) => document.querySelector(`#${id} .version-value`);
  const safeSet = (el, text) => { if (el) el.textContent = text; };
  const fadeIn  = (el) => { if (el) { el.style.opacity = "1"; el.style.transition = "opacity .3s"; } };

  const versionEl    = q("version-info");
  const buildEl      = q("build-info");
  const syncedEl     = q("synced-info");
  const osEl         = q("os-info");
  const deviceEl     = q("device-info");
  const browserEl    = q("browser-info");
  const resolutionEl = q("resolution-info");
  const connectionEl = q("connection-info");
  const networkEl    = q("network-info");
  const sunriseEl    = q("sunrise-info");
  const sunsetEl     = q("sunset-info");

  /* ----------------------------
   * Version / Build
   * -------------------------- */
  if (versionEl) {
    safeSet(versionEl, "v26.1.2");
    fadeIn(versionEl);
  }
  if (buildEl) {
    safeSet(buildEl, "2025.9.20");
    fadeIn(buildEl);
  }

  /* ----------------------------
   * 🕒 Synced Clock (local TZ)
   * -------------------------- */
  const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";
  function updateClock() {
    if (!syncedEl) return;
    const now = new Date();
    const date = now.toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric", year: "numeric"
    });
    const time = now.toLocaleTimeString(undefined, {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
    });
    syncedEl.innerHTML = `${date} at ${time} <span class="tz-tag">${tzName}</span>`;
    fadeIn(syncedEl);
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* ----------------------------
   * 💻 OS + Version
   * -------------------------- */
  function detectOSVersion() {
    const ua = navigator.userAgent || "";
    let os = "Unknown", ver = "";

    const isiPad = /iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (isiPad) {
      os = "iPadOS";
      const m = ua.match(/OS (\d+([_.]\d+)*)/i);
      if (m) ver = m[1].replace(/_/g, ".");
    } else if (/iPhone|iPod/i.test(ua)) {
      os = "iOS";
      const m = ua.match(/OS (\d+([_.]\d+)*)/i);
      if (m) ver = m[1].replace(/_/g, ".");
    } else if (/Android/i.test(ua)) {
      os = "Android";
      const m = ua.match(/Android (\d+(\.\d+)?)/i);
      if (m) ver = m[1];
    } else if (/Macintosh|Mac OS X/.test(ua)) {
      os = "macOS";
      const m = ua.match(/Mac OS X (\d+([_.]\d+)*)/i);
      if (m) ver = m[1].replace(/_/g, ".");
    } else if (/Windows NT/i.test(ua)) {
      os = "Windows";
      const map = { "10.0": "11 / 10", "6.3": "8.1", "6.2": "8", "6.1": "7" };
      const m = ua.match(/Windows NT (\d+\.\d+)/);
      if (m) ver = map[m[1]] || m[1];
    } else if (/CrOS/i.test(ua)) os = "ChromeOS";
    else if (/Linux/i.test(ua))   os = "Linux";

    return ver ? `${os} ${ver}` : os;
  }
  safeSet(osEl, detectOSVersion()); fadeIn(osEl);

  /* ----------------------------
   * 📱 Device
   * -------------------------- */
  function detectDevice() {
    const ua = navigator.userAgent || "";
    if (/iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iPad";
    if (/iPhone/i.test(ua))  return "iPhone";
    if (/Android/i.test(ua)) {
      const m = ua.match(/Android.*?;\s*(.*?)\s*Build\//);
      return m ? m[1].trim() : "Android Device";
    }
    if (/Macintosh/i.test(ua)) return "Mac";
    if (/Windows/i.test(ua))   return "Windows PC";
    if (/Linux/i.test(ua))     return "Linux Device";
    return "Unknown Device";
  }
  safeSet(deviceEl, detectDevice()); fadeIn(deviceEl);

  /* ----------------------------
   * 🌐 Browser
   * -------------------------- */
  function detectBrowser() {
    const ua = navigator.userAgent || "";
    if (ua.includes("CriOS")) return "Chrome (iOS)";
    if (ua.includes("EdgiOS")) return "Edge (iOS)";
    if (ua.includes("FxiOS")) return "Firefox (iOS)";
    if (ua.includes("OPiOS")) return "Opera (iOS)";
    if (ua.includes("Edg")) return "Microsoft Edge";
    if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
    if (ua.includes("Chrome") && !ua.includes("Chromium")) return "Google Chrome";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("Firefox")) return "Firefox";
    return "Unknown Browser";
  }
  safeSet(browserEl, detectBrowser()); fadeIn(browserEl);

  /* ----------------------------
   * 🖥️ Resolution
   * -------------------------- */
  const setRes = () => { safeSet(resolutionEl, `${screen.width} × ${screen.height}`); fadeIn(resolutionEl); };
  setRes();
  window.addEventListener("resize", setRes);

  /* ----------------------------
   * 📶 Connection + Network
   * -------------------------- */
  function detectConnection() {
    const ua = navigator.userAgent || "";
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    let connection = "Unknown";
    let network = "Unknown";

    if (!navigator.onLine) {
      connection = network = "Not Connected";
    } else if (conn) {
      const type = (conn.type || "").toLowerCase();
      const eff = (conn.effectiveType || "").toLowerCase();
      const hasWifi = type.includes("wifi");
      const hasCell = /(cellular|5g|4g|lte|3g|2g)/.test(type) || /(5g|4g|lte|3g|2g)/.test(eff);
      if (hasWifi && hasCell) connection = network = "Cellular / Wi-Fi";
      else if (hasCell)       connection = network = "Cellular";
      else if (hasWifi)       connection = network = "Wi-Fi";
      else                    connection = network = "Wi-Fi";
    } else {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
      const isDesktop = /Macintosh|Windows|Linux/i.test(ua);
      if (!navigator.onLine) connection = network = "Not Connected";
      else if (isMobile)     connection = network = "Cellular";
      else if (isDesktop)    connection = network = "Wi-Fi";
    }

    safeSet(connectionEl, connection);
    safeSet(networkEl, network);
    fadeIn(connectionEl);
    fadeIn(networkEl);
  }
  detectConnection();
  window.addEventListener("online", detectConnection);
  window.addEventListener("offline", detectConnection);
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn && conn.addEventListener) conn.addEventListener("change", detectConnection);

  /* ----------------------------
   * 🌅 Sunrise / Sunset + Auto Day/Night
   * -------------------------- */
  async function loadSunTimes() {
    if (!sunriseEl || !sunsetEl) return;
    let statusLi = document.getElementById("day-status-info");
    let statusEl;
    if (!statusLi) {
      const li = document.createElement("li");
      li.id = "day-status-info";
      li.innerHTML = `<span class="version-label">🌞 <strong>Status:</strong></span><span class="version-value">Loading...</span>`;
      document.querySelector(".version-list").appendChild(li);
      statusEl = li.querySelector(".version-value");
    } else {
      statusEl = statusLi.querySelector(".version-value") || statusLi;
    }

    if (!("geolocation" in navigator)) {
      safeSet(sunriseEl, "Unavailable");
      safeSet(sunsetEl, "Unavailable");
      safeSet(statusEl, "Unavailable");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      async function refreshSunTimes() {
        try {
          const resp = await fetch(`https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`, { cache: "no-store" });
          const data = await resp.json();
          if (data.status !== "OK") throw new Error("Sun API error");

          const sunrise = new Date(data.results.sunrise);
          const sunset  = new Date(data.results.sunset);
          safeSet(sunriseEl, sunrise.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          safeSet(sunsetEl,  sunset .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          fadeIn(sunriseEl); fadeIn(sunsetEl);

          const now = new Date();
          const isDay = now >= sunrise && now < sunset;
          safeSet(statusEl, isDay ? "Daytime ☀️" : "Nighttime 🌙");
          fadeIn(statusEl);
        } catch (e) {
          console.error("Sunrise/Sunset fetch failed:", e);
          safeSet(sunriseEl, "Error");
          safeSet(sunsetEl, "Error");
          safeSet(statusEl, "Unavailable");
        }
      }
      await refreshSunTimes();
      setInterval(refreshSunTimes, 60000);
    }, (err) => {
      console.warn("Geolocation denied:", err);
      safeSet(sunriseEl, "Permission denied");
      safeSet(sunsetEl, "Permission denied");
      const li = document.getElementById("day-status-info");
      if (li) safeSet(li.querySelector(".version-value"), "Unavailable");
    }, { timeout: 8000, maximumAge: 0 });
  }

  loadSunTimes();

  /* Ensure everything fades in */
  [versionEl, buildEl, osEl, deviceEl, browserEl, resolutionEl, connectionEl, networkEl, sunriseEl, sunsetEl, syncedEl]
    .forEach(fadeIn);
});

/* ===========================================================
   🌤️ LIVE WEATHER (FAHRENHEIT VERSION)
   Powered by Open-Meteo API — No key required
   Automatically updates every 15 minutes
=========================================================== */
async function detectWeather() {
  const el = document.querySelector("#weather-info .version-value");
  if (!el) return;

  // graceful fallback if geolocation is unavailable
  if (!("geolocation" in navigator)) {
    el.textContent = "Unavailable";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;

      try {
        // Fetch weather data
        const resp = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&timezone=auto`
        );
        const data = await resp.json();

        if (!data.current) {
          el.textContent = "Weather unavailable";
          return;
        }

        const tempC = data.current.temperature_2m;
        const tempF = Math.round((tempC * 9) / 5 + 32); // Convert to Fahrenheit
        const code = data.current.weathercode;

        // Weather code → emoji mapping
        const weatherIcons = {
          0: "☀️ Clear",
          1: "🌤️ Mostly clear",
          2: "⛅ Partly cloudy",
          3: "☁️ Cloudy",
          45: "🌫️ Fog",
          48: "🌫️ Fog",
          51: "🌦️ Light drizzle",
          53: "🌦️ Drizzle",
          55: "🌧️ Drizzle",
          61: "🌧️ Rain",
          63: "🌧️ Rain showers",
          65: "🌧️ Heavy rain",
          71: "🌨️ Snow",
          73: "🌨️ Snow",
          75: "❄️ Heavy snow",
          77: "🌨️ Snow grains",
          80: "🌧️ Rain showers",
          81: "🌧️ Moderate rain",
          82: "⛈️ Thunderstorm",
          95: "⛈️ Thunderstorm",
          99: "⛈️ Severe storm",
        };

        const label = weatherIcons[code] || "🌡️ Weather";

        el.textContent = `${label} • ${tempF}°F`;
        el.style.opacity = "1";
      } catch (err) {
        console.error("Weather fetch failed:", err);
        el.textContent = "Error fetching weather";
      }
    },
    (err) => {
      console.warn("Weather denied:", err);
      el.textContent = "Permission denied";
    },
    { timeout: 8000, maximumAge: 0 }
  );
}

// Run immediately and auto-refresh every 15 minutes
detectWeather();
setInterval(detectWeather, 15 * 60 * 1000);
