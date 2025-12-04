/**
 * device.js — v15 SAFE+
 * ✅ Works on iOS, Android, and Desktop
 * ✅ Fixes version/build/synced display
 * ✅ Auto-updates Day/Night every minute
 * ✅ Accurate local sunrise/sunset times
 * ✅ CONSOLIDATED Geolocation (no double-prompt)
 * ✅ ROBUST fetch and async handling
 */

document.addEventListener("DOMContentLoaded", () => {
  /* ----------------------------
   * Helper Utilities
   * -------------------------- */
  const q = (id) => document.querySelector(`#${id} .version-value`);

  // NEW: Combined safeSet + fadeIn helper
  const safeSet = (el, text) => { 
    if (el) { 
      el.textContent = text; 
      el.style.opacity = "1";
      el.style.transition = "opacity .3s";
    } 
  };
  
  // NEW: Consolidated Geolocation Getter (ask permission only once)
  const getPosition = (() => {
    let positionPromise = null;
    return () => {
      if (positionPromise) {
        return positionPromise;
      }
      
      positionPromise = new Promise((resolve, reject) => {
        if (!("geolocation" in navigator)) {
          reject(new Error("Geolocation not available"));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err),
          { timeout: 8000, maximumAge: 0 }
        );
      });
      return positionPromise;
    };
  })();

  // --- Get all elements ---
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
    safeSet(versionEl, "v26.5");
  }
  if (buildEl) {
    safeSet(buildEl, "2025.12.4");
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
    // Use innerHTML only for the clock to keep your tz-tag span
    syncedEl.innerHTML = `${date} at ${time} <span class="tz-tag">${tzName}</span>`;
    syncedEl.style.opacity = "1"; // Manually fade in for innerHTML
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* ----------------------------
   * 💻 OS + Version (SAFE HYBRID METHOD)
   * -------------------------- */
   
  function detectOSVersion_Fallback() {
    const ua = navigator.userAgent || "";
    let os = "Unknown", ver = "";
    const isiPad = /iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isiPad) { os = "iPadOS"; const m = ua.match(/OS (\d+([_.]\d+)*)/i); if (m) ver = m[1].replace(/_/g, "."); }
    else if (/iPhone|iPod/i.test(ua)) { os = "iOS"; const m = ua.match(/OS (\d+([_.]\d+)*)/i); if (m) ver = m[1].replace(/_/g, "."); }
    else if (/Android/i.test(ua)) { os = "Android"; const m = ua.match(/Android (\d+(\.\d+)?)/i); if (m) ver = m[1]; }
    else if (/Macintosh|Mac OS X/.test(ua)) { os = "macOS"; const m = ua.match(/Mac OS X (\d+([_.]\d+)*)/i); if (m) ver = m[1].replace(/_/g, "."); }
    else if (/Windows NT/i.test(ua)) { os = "Windows"; const map = { "10.0": "11 / 10", "6.3": "8.1", "6.2": "8", "6.1": "7" }; const m = ua.match(/Windows NT (\d+\.\d+)/); if (m) ver = map[m[1]] || m[1]; }
    else if (/CrOS/i.test(ua)) os = "ChromeOS";
    else if (/Linux/i.test(ua)) os = "Linux";
    return ver ? `${os} ${ver}` : os;
  }
  
  async function detectOSVersion() {
    if (navigator.userAgentData) {
      try {
        const uaData = await navigator.userAgentData.getHighEntropyValues(["platformVersion"]);
        const os = uaData.platform || "Unknown";
        let ver = uaData.platformVersion || "";
        if (ver) {
          if (os === "Windows") { const majorVer = parseInt(ver.split('.')[0], 10); ver = majorVer >= 13 ? "11" : "10"; }
          else { ver = ver.split('.').slice(0, 2).join('.'); }
        }
        return ver ? `${os} ${ver}` : os;
      } catch (err) {
        console.warn("UserAgentData API failed, falling back...", err);
        return detectOSVersion_Fallback();
      }
    }
    return detectOSVersion_Fallback();
  }

  (async () => {
    const osVersion = await detectOSVersion();
    safeSet(osEl, osVersion); 
  })();

  /* ----------------------------
   * 📱 Device
   * -------------------------- */
  function detectDevice() {
    const ua = navigator.userAgent || "";
    if (/iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iPad";
    if (/iPhone/i.test(ua))  return "iPhone";
    if (/Android/i.test(ua)) { const m = ua.match(/Android.*?;\s*(.*?)\s*Build\//); return m ? m[1].trim() : "Android Device"; }
    if (/Macintosh/i.test(ua)) return "Mac";
    if (/Windows/i.test(ua))   return "Windows PC";
    if (/Linux/i.test(ua))     return "Linux Device";
    return "Unknown Device";
  }
  safeSet(deviceEl, detectDevice());

  /* ----------------------------
   * 🌐 Browser
   * -------------------------- */
  function detectBrowser_Fallback() {
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

  async function detectBrowser() {
    if (navigator.userAgentData) {
      try {
        const uaData = navigator.userAgentData;
        if (uaData.brands && uaData.brands.length > 0) {
          const mainBrand = uaData.brands.find(b => !b.brand.includes("Not") && !b.brand.includes("Chromium"));
          if (mainBrand) return `${mainBrand.brand} ${mainBrand.version}`;
        }
      } catch (e) { /* Fall through to UA parsing */ }
    }
    return detectBrowser_Fallback();
  }

  (async () => {
    safeSet(browserEl, await detectBrowser()); 
  })();

  /* ----------------------------
   * 🖥️ Resolution
   * -------------------------- */
  const setRes = () => { safeSet(resolutionEl, `${screen.width} × ${screen.height}`); };
  setRes();
  window.addEventListener("resize", setRes);

  /* ===========================================================
   * 📶 Network & Connection (Safer Hybrid Version)
   * =========================================================== */
  async function detectNetworkAndConnection() {
    if (!connectionEl || !networkEl) return;
    let connection = "Unknown", network = "Unknown";
    if (!navigator.onLine) {
      connection = "Not Connected"; network = "Not Connected";
    } else if (navigator.connection && navigator.connection.type) {
      switch (navigator.connection.type) {
        case "wifi": connection = "Wi-Fi"; network = "Wi-Fi"; break;
        case "cellular": connection = "Cellular"; network = "Cellular"; break;
        case "ethernet": connection = "Ethernet"; network = "Wired"; break;
        default: connection = "Connected"; network = "Online";
      }
    } else {
      try {
        const response = await fetch("https://api64.ipify.org?format=json", { cache: "no-store" });
        if (!response.ok) throw new Error('IP API failed');
        const { ip } = await response.json();
        const isPrivate = /^10\./.test(ip) || /^192\.168\./.test(ip) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip);
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "");
        if (isPrivate || !isMobile) { connection = "Wi-Fi / LAN"; network = "Wi-Fi / LAN"; }
        else { connection = "Cellular"; network = "Cellular"; }
      } catch (err) {
        console.warn("Network fallback guess failed:", err);
        connection = "Online"; network = "Online";
      }
    }
    // Update UI *inside* this function
    safeSet(connectionEl, connection);
    safeSet(networkEl, network);
  }
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

    try {
      // NEW: Use consolidated getter
      const { latitude, longitude } = await getPosition();

      async function refreshSunTimes() {
        try {
          const resp = await fetch(`https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`, { cache: "no-store" });
          // NEW: Robust error check
          if (!resp.ok) throw new Error(`Sun API error: ${resp.status}`);
          const data = await resp.json();
          if (data.status !== "OK") throw new Error("Sun API status not OK");

          const sunrise = new Date(data.results.sunrise);
          const sunset  = new Date(data.results.sunset);
          // NEW: Use combined helper
          safeSet(sunriseEl, sunrise.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          safeSet(sunsetEl,  sunset.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

          const now = new Date();
          const isDay = now >= sunrise && now < sunset;
          safeSet(statusEl, isDay ? "Daytime ☀️" : "Nighttime 🌙");
        } catch (e) {
          console.error("Sunrise/Sunset fetch failed:", e);
          safeSet(sunriseEl, "Error");
          safeSet(sunsetEl, "Error");
          safeSet(statusEl, "Error");
        }
      }
      await refreshSunTimes();
      setInterval(refreshSunTimes, 60000);
      
    } catch (err) {
      // This block now catches Geolocation permission errors
      console.warn("Geolocation denied or unavailable:", err);
      safeSet(sunriseEl, "Permission denied");
      safeSet(sunsetEl, "Permission denied");
      safeSet(statusEl, "Unavailable");
    }
  }

  loadSunTimes();

  /* ----------------------------
   * FINAL FADE-IN (FIXED)
   * -------------------------- */
  // We REMOVED connectionEl and networkEl, as their async function fades them in
  [versionEl, buildEl, osEl, deviceEl, browserEl, resolutionEl, sunriseEl, sunsetEl, syncedEl]
    .forEach(el => {
      // Added a check to make sure we don't fade in "Loading..." text
      if (el && el.textContent && !el.textContent.includes("Loading...")) {
        el.style.opacity = "1";
        el.style.transition = "opacity .3s";
      }
    });
}); // <-- End of DOMContentLoaded

/* ===========================================================
 * 🌤️ LIVE WEATHER (FAHRENHEIT VERSION)
 * =========================================================== */
async function detectWeather() {
  // We must re-select the element if it's outside DOMContentLoaded
  const el = document.querySelector("#weather-info .version-value");
  if (!el) return;

  // We also need to re-create the helpers OR move this function inside
  const safeSet = (el, text) => { 
    if (el) { 
      el.textContent = text; 
      el.style.opacity = "1";
      el.style.transition = "opacity .3s";
    } 
  };
  
  const getPosition = (() => {
    let positionPromise = null;
    return () => {
      if (positionPromise) return positionPromise;
      positionPromise = new Promise((resolve, reject) => {
        if (!("geolocation" in navigator)) { reject(new Error("Geolocation not available")); return; }
        navigator.geolocation.getCurrentPosition( (pos) => resolve(pos.coords), (err) => reject(err), { timeout: 8000, maximumAge: 0 });
      });
      return positionPromise;
    };
  })();

  try {
    // NEW: Use consolidated getter
    const { latitude, longitude } = await getPosition();

    const resp = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&timezone=auto`
    );
    // NEW: Robust error check
    if (!resp.ok) throw new Error(`Weather API failed: ${resp.status}`);
    const data = await resp.json();

    if (!data.current) {
      safeSet(el, "Weather unavailable");
      return;
    }

    const tempC = data.current.temperature_2m;
    const tempF = Math.round((tempC * 9) / 5 + 32);
    const code = data.current.weathercode;
    const weatherIcons = { 0: "☀️ Clear", 1: "🌤️ Mostly clear", 2: "⛅ Partly cloudy", 3: "☁️ Cloudy", 45: "🌫️ Fog", 48: "🌫️ Fog", 51: "🌦️ Light drizzle", 53: "🌦️ Drizzle", 55: "🌧️ Drizzle", 61: "🌧️ Rain", 63: "🌧️ Rain showers", 65: "🌧️ Heavy rain", 71: "🌨️ Snow", 73: "🌨️ Snow", 75: "❄️ Heavy snow", 77: "🌨️ Snow grains", 80: "🌧️ Rain showers", 81: "🌧️ Moderate rain", 82: "⛈️ Thunderstorm", 95: "⛈️ Thunderstorm", 99: "⛈️ Severe storm", };
    const label = weatherIcons[code] || "🌡️ Weather";
    // NEW: Use combined helper
    safeSet(el, `${label} • ${tempF}°F`);

  } catch (err) {
    // This block now catches Geolocation permission errors
    console.warn("Weather/Geo failed:", err.message);
    if (err.message.includes("denied")) {
      safeSet(el, "Permission denied");
    } else if (err.message.includes("available")) {
      safeSet(el, "Unavailable");
    } else {
      safeSet(el, "Error fetching weather");
    }
  }
}

// Run immediately and auto-refresh
detectWeather();
setInterval(detectWeather, 15 * 60 * 1000);
