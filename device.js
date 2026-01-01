/**
 * device.js — v15 SAFE+ (ACTUALLY FIXED)
 * ✅ One geolocation request total
 * ✅ Cached across reloads & visits
 * ✅ Sunrise / Sunset / Weather share location
 * ✅ iOS / Android / Desktop safe
 * ✅ No duplicate helpers
 */

/* ===========================================================
 * 📍 GLOBAL LOCATION SERVICE (SINGLE SOURCE OF TRUTH)
 * =========================================================== */
const LocationService = (() => {
  let cachedCoords = null;
  let pendingPromise = null;

  return {
    async get() {
      if (cachedCoords) return cachedCoords;

      if (localStorage.getItem("geoDenied") === "true") {
        throw new Error("Geolocation denied");
      }

      const saved = localStorage.getItem("userCoords");
      if (saved) {
        cachedCoords = JSON.parse(saved);
        return cachedCoords;
      }

      if (pendingPromise) return pendingPromise;

      pendingPromise = new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          pos => {
            cachedCoords = pos.coords;
            localStorage.setItem("userCoords", JSON.stringify(cachedCoords));
            resolve(cachedCoords);
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

      return pendingPromise;
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

  safeSet(versionEl, "v26.5");
  safeSet(buildEl, "2025.12.4");

  /* 🕒 CLOCK */
  const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";
  setInterval(() => {
    const now = new Date();
    syncedEl.innerHTML =
      `${now.toLocaleDateString(undefined, { weekday:"long", month:"long", day:"numeric", year:"numeric" })} at
       ${now.toLocaleTimeString(undefined, { hour:"2-digit", minute:"2-digit", second:"2-digit" })}
       <span class="tz-tag">${tzName}</span>`;
    syncedEl.style.opacity = "1";
  }, 1000);

  /* 💻 OS */
  const ua = navigator.userAgent;
  safeSet(osEl,
    /iPhone/.test(ua) ? "iOS" :
    /iPad/.test(ua) ? "iPadOS" :
    /Android/.test(ua) ? "Android" :
    /Mac/.test(ua) ? "macOS" :
    /Windows/.test(ua) ? "Windows" :
    /Linux/.test(ua) ? "Linux" : "Unknown"
  );

  /* 📱 DEVICE */
  safeSet(deviceEl,
    /iPhone/.test(ua) ? "iPhone" :
    /iPad/.test(ua) ? "iPad" :
    /Android/.test(ua) ? "Android Device" :
    /Mac/.test(ua) ? "Mac" :
    /Windows/.test(ua) ? "Windows PC" :
    "Unknown Device"
  );

  /* 🌐 BROWSER */
  safeSet(browserEl,
    ua.includes("CriOS") ? "Chrome (iOS)" :
    ua.includes("Edg") ? "Microsoft Edge" :
    ua.includes("Chrome") ? "Google Chrome" :
    ua.includes("Safari") ? "Safari" :
    ua.includes("Firefox") ? "Firefox" :
    "Unknown Browser"
  );

  /* 🖥️ RESOLUTION */
  const setRes = () =>
    safeSet(resolutionEl, `${screen.width} × ${screen.height}`);
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
          { cache: "no-store" }
        );
        const data = await resp.json();

        const sunrise = new Date(data.results.sunrise);
        const sunset  = new Date(data.results.sunset);

        safeSet(sunriseEl, sunrise.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }));
        safeSet(sunsetEl, sunset.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }));

        const now = new Date();
        const status = now >= sunrise && now < sunset ? "Daytime ☀️" : "Nighttime 🌙";

        let statusLi = document.getElementById("day-status-info");
        if (!statusLi) {
          statusLi = document.createElement("li");
          statusLi.id = "day-status-info";
          statusLi.innerHTML =
            `<span class="version-label">🌞 <strong>Status:</strong></span>
             <span class="version-value"></span>`;
          document.querySelector(".version-list").appendChild(statusLi);
        }
        safeSet(statusLi.querySelector(".version-value"), status);
      };

      refresh();
      setInterval(refresh, 60000);

    } catch {
      safeSet(sunriseEl, "Unavailable");
      safeSet(sunsetEl, "Unavailable");
    }
  })();
});

/* ===========================================================
 * 🌤️ WEATHER (USES SAME LOCATION SERVICE)
 * =========================================================== */
async function detectWeather() {
  const el = document.querySelector("#weather-info .version-value");
  if (!el) return;

  try {
    const { latitude, longitude } = await LocationService.get();

    const resp = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&timezone=auto`
    );
    const data = await resp.json();

    const tempF = Math.round((data.current.temperature_2m * 9) / 5 + 32);
    el.textContent = `${tempF}°F`;
    el.style.opacity = "1";

  } catch {
    el.textContent = "Weather unavailable";
    el.style.opacity = "1";
  }
}

detectWeather();
setInterval(detectWeather, 15 * 60 * 1000);
