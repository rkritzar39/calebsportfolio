/**
 * device.js — v15 SAFE+ (FINAL CORRECTED)
 * ✅ One geolocation prompt total
 * ✅ Cached across visits
 * ✅ Accurate OS + VERSION (UA + UA-CH hybrid)
 * ✅ Sunrise / Sunset / Day-Night
 * ✅ Weather WITH current conditions
 * ✅ iOS / Android / Desktop safe
 */

/* ===========================================================
 * 📍 GLOBAL LOCATION SERVICE (SINGLE SOURCE OF TRUTH)
 * =========================================================== */
const LocationService = (() => {
  let cached = null;
  let pending = null;

  return {
    async get() {
      if (cached) return cached;

      if (localStorage.getItem("geoDenied") === "true") {
        throw new Error("Geolocation denied");
      }

      const saved = localStorage.getItem("userCoords");
      if (saved) {
        cached = JSON.parse(saved);
        return cached;
      }

      if (pending) return pending;

      pending = new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation unsupported"));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          pos => {
            cached = pos.coords;
            localStorage.setItem("userCoords", JSON.stringify(cached));
            resolve(cached);
          },
          err => {
            localStorage.setItem("geoDenied", "true");
            reject(err);
          },
          {
            enableHighAccuracy: false,
            maximumAge: 6 * 60 * 60 * 1000,
            timeout: 8000
          }
        );
      });

      return pending;
    }
  };
})();

/* ===========================================================
 * 🚀 MAIN
 * =========================================================== */
document.addEventListener("DOMContentLoaded", () => {

  const q = id => document.querySelector(`#${id} .version-value`);
  const safeSet = (el, text) => {
    if (!el) return;
    el.textContent = text;
    el.style.opacity = "1";
    el.style.transition = "opacity .3s";
  };

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

  safeSet(versionEl, "v26.7");
  safeSet(buildEl, "2025.04.26");

  /* 🕒 CLOCK */
  const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";
  const updateClock = () => {
    const now = new Date();
    syncedEl.innerHTML =
      `${now.toLocaleDateString(undefined, {
        weekday:"long", month:"long", day:"numeric", year:"numeric"
      })} at ${now.toLocaleTimeString(undefined, {
        hour:"2-digit", minute:"2-digit", second:"2-digit"
      })} <span class="tz-tag">${tzName}</span>`;
    syncedEl.style.opacity = "1";
  };
  updateClock();
  setInterval(updateClock, 1000);

  /* ===========================================================
   * 💻 OS + VERSION (SAFE HYBRID)
   * =========================================================== */
  function detectOSVersionFallback() {
    const ua = navigator.userAgent || "";
    let os = "Unknown", ver = "";

    const isiPad = /iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isiPad) { os = "iPadOS"; const m = ua.match(/OS (\d+([_.]\d+)*)/); if (m) ver = m[1].replace(/_/g,"."); }
    else if (/iPhone|iPod/i.test(ua)) { os = "iOS"; const m = ua.match(/OS (\d+([_.]\d+)*)/); if (m) ver = m[1].replace(/_/g,"."); }
    else if (/Android/i.test(ua)) { os = "Android"; const m = ua.match(/Android (\d+(\.\d+)?)/); if (m) ver = m[1]; }
    else if (/Mac OS X/i.test(ua)) { os = "macOS"; const m = ua.match(/Mac OS X (\d+([_.]\d+)*)/); if (m) ver = m[1].replace(/_/g,"."); }
    else if (/Windows NT/i.test(ua)) {
      os = "Windows";
      const map = { "10.0":"11 / 10", "6.3":"8.1", "6.2":"8", "6.1":"7" };
      const m = ua.match(/Windows NT (\d+\.\d+)/);
      if (m) ver = map[m[1]] || m[1];
    }
    return ver ? `${os} ${ver}` : os;
  }

  async function detectOSVersion() {
    if (navigator.userAgentData) {
      try {
        const uaData = await navigator.userAgentData.getHighEntropyValues(["platform","platformVersion"]);
        let os = uaData.platform || "Unknown";
        let ver = uaData.platformVersion || "";
        if (ver) {
          if (os === "Windows") {
            ver = parseInt(ver.split(".")[0],10) >= 13 ? "11" : "10";
          } else {
            ver = ver.split(".").slice(0,2).join(".");
          }
        }
        return ver ? `${os} ${ver}` : os;
      } catch {
        return detectOSVersionFallback();
      }
    }
    return detectOSVersionFallback();
  }

  detectOSVersion().then(v => safeSet(osEl, v));

  /* 📱 DEVICE */
  const ua = navigator.userAgent;
  safeSet(deviceEl,
    /iPad/.test(ua) ? "iPad" :
    /iPhone/.test(ua) ? "iPhone" :
    /Android/.test(ua) ? "Android Device" :
    /Mac/.test(ua) ? "Mac" :
    /Windows/.test(ua) ? "Windows PC" :
    /Linux/.test(ua) ? "Linux Device" :
    "Unknown Device"
  );

  /* 🌐 BROWSER */
  safeSet(browserEl,
    ua.includes("CriOS") ? "Chrome (iOS)" :
    ua.includes("EdgiOS") ? "Edge (iOS)" :
    ua.includes("FxiOS") ? "Firefox (iOS)" :
    ua.includes("Edg") ? "Microsoft Edge" :
    ua.includes("Chrome") ? "Google Chrome" :
    ua.includes("Safari") ? "Safari" :
    ua.includes("Firefox") ? "Firefox" :
    "Unknown Browser"
  );

  /* 🖥️ RESOLUTION */
  const setRes = () => safeSet(resolutionEl, `${screen.width} × ${screen.height}`);
  setRes();
  window.addEventListener("resize", setRes);

  /* 📶 NETWORK */
  const updateNetwork = () => {
    if (!navigator.onLine) {
      safeSet(connectionEl, "Offline");
      safeSet(networkEl, "Offline");
    } else {
      safeSet(connectionEl, "Online");
      safeSet(networkEl, "Online");
    }
  };
  updateNetwork();
  window.addEventListener("online", updateNetwork);
  window.addEventListener("offline", updateNetwork);

  /* 🌅 SUNRISE / SUNSET + DAY/NIGHT */
  (async () => {
    try {
      const { latitude, longitude } = await LocationService.get();

      const refresh = async () => {
        const resp = await fetch(
          `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`,
          { cache:"no-store" }
        );
        const data = await resp.json();
        const sunrise = new Date(data.results.sunrise);
        const sunset  = new Date(data.results.sunset);

        safeSet(sunriseEl, sunrise.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }));
        safeSet(sunsetEl,  sunset.toLocaleTimeString([],  { hour:"2-digit", minute:"2-digit" }));

        const now = new Date();
        const status = now >= sunrise && now < sunset ? "Daytime ☀️" : "Nighttime 🌙";

        let li = document.getElementById("day-status-info");
        if (!li) {
          li = document.createElement("li");
          li.id = "day-status-info";
          li.innerHTML = `<span class="version-label">🌞 <strong>Status:</strong></span><span class="version-value"></span>`;
          document.querySelector(".version-list").appendChild(li);
        }
        safeSet(li.querySelector(".version-value"), status);
      };

      refresh();
      setInterval(refresh, 60000);

    } catch {
      safeSet(sunriseEl,"Unavailable");
      safeSet(sunsetEl,"Unavailable");
    }
  })();
});

/* ===========================================================
 * 🌤️ WEATHER — CURRENT CONDITIONS + TEMP
 * =========================================================== */
async function detectWeather() {
  const el = document.querySelector("#weather-info .version-value");
  if (!el) return;

  const safeSet = (t) => {
    el.textContent = t;
    el.style.opacity = "1";
    el.style.transition = "opacity .3s";
  };

  try {
    const { latitude, longitude } = await LocationService.get();
    const resp = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&timezone=auto`
    );
    const data = await resp.json();

    const tempF = Math.round((data.current.temperature_2m * 9) / 5 + 32);
    const code = data.current.weathercode;

    const map = {
      0:"☀️ Clear",1:"🌤️ Mostly clear",2:"⛅ Partly cloudy",3:"☁️ Cloudy",
      45:"🌫️ Fog",48:"🌫️ Fog",51:"🌦️ Light drizzle",53:"🌦️ Drizzle",
      55:"🌧️ Drizzle",61:"🌧️ Rain",63:"🌧️ Rain showers",65:"🌧️ Heavy rain",
      71:"🌨️ Snow",73:"🌨️ Snow",75:"❄️ Heavy snow",77:"🌨️ Snow grains",
      80:"🌧️ Rain showers",81:"🌧️ Moderate rain",82:"⛈️ Thunderstorm",
      95:"⛈️ Thunderstorm",99:"⛈️ Severe storm"
    };

    safeSet(`${map[code] || "🌡️ Weather"} • ${tempF}°F`);

  } catch {
    safeSet("Weather unavailable");
  }
}

detectWeather();
setInterval(detectWeather, 15 * 60 * 1000);
