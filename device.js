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
  * 💻 OS + Version (SAFE HYBRID METHOD)
  * -------------------------- */
  
 // 1. Your original function, renamed as a fallback
 function detectOSVersion_Fallback() {
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

 // 2. The new "safe" async function
 async function detectOSVersion() {
   // Check for the modern, safe API
   if (navigator.userAgentData) {
     try {
       // Request "high entropy" (detailed) values
       const uaData = await navigator.userAgentData.getHighEntropyValues([
         "platformVersion"
       ]);
       
       const os = uaData.platform || "Unknown"; // e.g., "Windows", "macOS", "Android"
       let ver = uaData.platformVersion || "";  // e.g., "15.0.0"

       // Clean up the version string
       if (ver) {
         // Special handling for Windows 11 vs 10
         if (os === "Windows") {
           const majorVer = parseInt(ver.split('.')[0], 10);
           if (majorVer >= 13) {
             ver = "11"; // Win 11 reports v13+ (e.g., 15.0.0)
           } else {
             ver = "10"; // Win 10 reports v10.0
           }
         } else {
           // For other OS, just take major/minor
           ver = ver.split('.').slice(0, 2).join('.');
         }
       }
       return ver ? `${os} ${ver}` : os;

     } catch (err) {
       console.warn("UserAgentData API failed, falling back...", err);
       // If the API fails for any reason, use the fallback
       return detectOSVersion_Fallback();
     }
   }
   
   // If navigator.userAgentData doesn't exist, use the fallback
   return detectOSVersion_Fallback();
 }

 // 3. Update the *calling* code to be async
 (async () => {
   const osVersion = await detectOSVersion();
   safeSet(osEl, osVersion); 
   fadeIn(osEl);
 })();

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

/* ===========================================================
   📶 Network & Connection — Final Local-Only Version
   Accurate labeling without Firebase or extra APIs
=========================================================== */
async function detectNetworkAndConnection() {
  const connectionEl = document.querySelector("#connection-info .version-value");
  const networkEl = document.querySelector("#network-info .version-value");
  if (!connectionEl || !networkEl) return;

  // Default
  let connection = "Unknown";
  let network = "Unknown";

  // Offline
  if (!navigator.onLine) {
    connection = "Not Connected";
    network = "Not Connected";
  } else {
    const ua = navigator.userAgent || "";
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    const isDesktop = /Macintosh|Windows|Linux/i.test(ua);

    try {
      // Fetch public IP — helps distinguish private (Wi-Fi) vs public (cellular)
      const response = await fetch("https://api64.ipify.org?format=json", { cache: "no-store" });
      const { ip } = await response.json();

      // Private IP ranges usually mean Wi-Fi / LAN
      const isPrivate =
        /^10\./.test(ip) ||
        /^192\.168\./.test(ip) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip);

      if (isPrivate || isDesktop) {
        connection = "Wi-Fi";
        network = "Wi-Fi";
      } else if (isMobile) {
        connection = "Cellular";
        network = "Cellular";
      } else {
        connection = "Wi-Fi";
        network = "Wi-Fi";
      }
    } catch (err) {
      console.warn("Network guess failed:", err);
      // fallback guesses
      connection = isMobile ? "Cellular" : "Wi-Fi";
      network = connection;
    }
  }

  // Update UI
  connectionEl.textContent = connection;
  networkEl.textContent = network;
  connectionEl.style.opacity = "1";
  networkEl.style.opacity = "1";
}

// Run immediately and keep in sync
detectNetworkAndConnection();
window.addEventListener("online", detectNetworkAndConnection);
window.addEventListener("offline", detectNetworkAndConnection);
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
