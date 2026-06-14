/**
 * device.js — v16 SAFE+ BETA REVAMP
 * ✅ One geolocation prompt total
 * ✅ Cached across visits
 * ✅ Accurate OS + VERSION (UA + UA-CH hybrid)
 * ✅ Sunrise / Sunset / Day-Night
 * ✅ Weather WITH current conditions
 * ✅ iOS / Android / Desktop safe
 * ✅ Version / Build / Release Track managed from one place
 */

/* ===========================================================
 * 🧾 WEBSITE VERSION CONFIG
 * Single source of truth for Version Information section
 * =========================================================== */
const WEBSITE_VERSION = "v26.6-beta.1";
const WEBSITE_BUILD = "2026.06.14";
const RELEASE_TRACK = "Beta Revamp Preview";
const REVAMP_STATUS = "Partial beta revamp in progress";
const TARGET_RELEASE = "September 2026";

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
        try {
          const parsed = JSON.parse(saved);

          if (
            parsed &&
            typeof parsed.latitude === "number" &&
            typeof parsed.longitude === "number"
          ) {
            cached = parsed;
            return cached;
          }

          localStorage.removeItem("userCoords");
        } catch {
          localStorage.removeItem("userCoords");
        }
      }

      if (pending) return pending;

      pending = new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation unsupported"));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          pos => {
            cached = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              timestamp: Date.now()
            };

            localStorage.setItem("userCoords", JSON.stringify(cached));
            resolve(cached);
          },
          err => {
            if (err && err.code === err.PERMISSION_DENIED) {
              localStorage.setItem("geoDenied", "true");
            }

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

  const safeSetHTML = (el, html) => {
    if (!el) return;
    el.innerHTML = html;
    el.style.opacity = "1";
    el.style.transition = "opacity .3s";
  };

  const versionList = document.querySelector(".version-list");

  const createVersionRow = (id, labelHTML, fallbackAfterId = null) => {
    if (!versionList) return null;

    let existing = document.getElementById(id);

    if (existing) {
      return existing.querySelector(".version-value");
    }

    const li = document.createElement("li");
    li.id = id;
    li.innerHTML = `
      <span class="version-label">${labelHTML}</span>
      <span class="version-value">Detecting...</span>
    `;

    if (fallbackAfterId) {
      const afterEl = document.getElementById(fallbackAfterId);

      if (afterEl && afterEl.parentNode === versionList) {
        afterEl.insertAdjacentElement("afterend", li);
      } else {
        versionList.appendChild(li);
      }
    } else {
      versionList.appendChild(li);
    }

    return li.querySelector(".version-value");
  };

  /* ===========================================================
   * 🧾 VERSION / BUILD / RELEASE LABELS
   * =========================================================== */
  const versionEl = q("version-info");
  const buildEl = q("build-info");

  const releaseTrackEl = createVersionRow(
    "release-track-info",
    "🧪 <strong>Release Track:</strong>",
    "build-info"
  );

  const revampEl = createVersionRow(
    "revamp-info",
    "🚧 <strong>Revamp Status:</strong>",
    "release-track-info"
  );

  const targetReleaseEl = createVersionRow(
    "target-release-info",
    "📅 <strong>Target Release:</strong>",
    "revamp-info"
  );

  const syncedEl = q("synced-info");
  const osEl = q("os-info");
  const deviceEl = q("device-info");
  const browserEl = q("browser-info");
  const resolutionEl = q("resolution-info");
  const connectionEl = q("connection-info");
  const networkEl = q("network-info");
  const sunriseEl = q("sunrise-info");
  const sunsetEl = q("sunset-info");

  safeSet(versionEl, WEBSITE_VERSION);
  safeSet(buildEl, WEBSITE_BUILD);
  safeSet(releaseTrackEl, RELEASE_TRACK);
  safeSet(revampEl, REVAMP_STATUS);
  safeSet(targetReleaseEl, TARGET_RELEASE);

  /* ===========================================================
   * 🕒 CLOCK / SYNCED TIME
   * =========================================================== */
  const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";

  const updateClock = () => {
    const now = new Date();

    safeSetHTML(
      syncedEl,
      `${now.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      })} at ${now.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })} <span class="tz-tag">${tzName}</span>`
    );
  };

  updateClock();
  setInterval(updateClock, 1000);

  /* ===========================================================
   * 💻 OS + VERSION (SAFE HYBRID)
   * =========================================================== */
  function detectOSVersionFallback() {
    const ua = navigator.userAgent || "";
    let os = "Unknown";
    let ver = "";

    const isiPad =
      /iPad/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (isiPad) {
      os = "iPadOS";
      const m = ua.match(/OS (\d+([_.]\d+)*)/);
      if (m) ver = m[1].replace(/_/g, ".");
    } else if (/iPhone|iPod/i.test(ua)) {
      os = "iOS";
      const m = ua.match(/OS (\d+([_.]\d+)*)/);
      if (m) ver = m[1].replace(/_/g, ".");
    } else if (/Android/i.test(ua)) {
      os = "Android";
      const m = ua.match(/Android (\d+(\.\d+)?)/);
      if (m) ver = m[1];
    } else if (/Mac OS X/i.test(ua)) {
      os = "macOS";
      const m = ua.match(/Mac OS X (\d+([_.]\d+)*)/);
      if (m) ver = m[1].replace(/_/g, ".");
    } else if (/Windows NT/i.test(ua)) {
      os = "Windows";
      const map = {
        "10.0": "11 / 10",
        "6.3": "8.1",
        "6.2": "8",
        "6.1": "7"
      };

      const m = ua.match(/Windows NT (\d+\.\d+)/);

      if (m) {
        ver = map[m[1]] || m[1];
      }
    } else if (/Linux/i.test(ua)) {
      os = "Linux";
    }

    return ver ? `${os} ${ver}` : os;
  }

  async function detectOSVersion() {
    if (navigator.userAgentData) {
      try {
        const uaData = await navigator.userAgentData.getHighEntropyValues([
          "platform",
          "platformVersion"
        ]);

        let os = uaData.platform || "Unknown";
        let ver = uaData.platformVersion || "";

        if (ver) {
          if (os === "Windows") {
            ver = parseInt(ver.split(".")[0], 10) >= 13 ? "11" : "10";
          } else {
            ver = ver.split(".").slice(0, 2).join(".");
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

  /* ===========================================================
   * 📱 DEVICE
   * =========================================================== */
  const ua = navigator.userAgent || "";

  const isIPad =
    /iPad/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  safeSet(
    deviceEl,
    isIPad ? "iPad" :
    /iPhone/.test(ua) ? "iPhone" :
    /Android/.test(ua) ? "Android Device" :
    /Mac/.test(ua) ? "Mac" :
    /Windows/.test(ua) ? "Windows PC" :
    /Linux/.test(ua) ? "Linux Device" :
    "Unknown Device"
  );

  /* ===========================================================
   * 🌐 BROWSER
   * =========================================================== */
  safeSet(
    browserEl,
    ua.includes("CriOS") ? "Chrome (iOS)" :
    ua.includes("EdgiOS") ? "Edge (iOS)" :
    ua.includes("FxiOS") ? "Firefox (iOS)" :
    ua.includes("Edg") ? "Microsoft Edge" :
    ua.includes("OPR") || ua.includes("Opera") ? "Opera" :
    ua.includes("Chrome") ? "Google Chrome" :
    ua.includes("Safari") ? "Safari" :
    ua.includes("Firefox") ? "Firefox" :
    "Unknown Browser"
  );

  /* ===========================================================
   * 🖥️ RESOLUTION
   * =========================================================== */
  const setRes = () => {
    safeSet(resolutionEl, `${screen.width} × ${screen.height}`);
  };

  setRes();
  window.addEventListener("resize", setRes);

  /* ===========================================================
   * 📶 NETWORK
   * =========================================================== */
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

  /* ===========================================================
   * 🌅 SUNRISE / SUNSET + DAY/NIGHT
   * =========================================================== */
  (async () => {
    try {
      const { latitude, longitude } = await LocationService.get();

      const refresh = async () => {
        const resp = await fetch(
          `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`,
          { cache: "no-store" }
        );

        const data = await resp.json();

        if (!data || !data.results) {
          throw new Error("Invalid sunrise/sunset response");
        }

        const sunrise = new Date(data.results.sunrise);
        const sunset = new Date(data.results.sunset);

        safeSet(
          sunriseEl,
          sunrise.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })
        );

        safeSet(
          sunsetEl,
          sunset.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })
        );

        const now = new Date();
        const status = now >= sunrise && now < sunset
          ? "Daytime ☀️"
          : "Nighttime 🌙";

        let li = document.getElementById("day-status-info");

        if (!li && versionList) {
          li = document.createElement("li");
          li.id = "day-status-info";
          li.innerHTML = `
            <span class="version-label">🌞 <strong>Status:</strong></span>
            <span class="version-value"></span>
          `;
          versionList.appendChild(li);
        }

        if (li) {
          safeSet(li.querySelector(".version-value"), status);
        }
      };

      refresh();
      setInterval(refresh, 60000);
    } catch {
      safeSet(sunriseEl, "Unavailable");
      safeSet(sunsetEl, "Unavailable");

      let li = document.getElementById("day-status-info");

      if (!li && versionList) {
        li = document.createElement("li");
        li.id = "day-status-info";
        li.innerHTML = `
          <span class="version-label">🌞 <strong>Status:</strong></span>
          <span class="version-value"></span>
        `;
        versionList.appendChild(li);
      }

      if (li) {
        safeSet(li.querySelector(".version-value"), "Unavailable");
      }
    }
  })();
});

/* ===========================================================
 * 🌤️ WEATHER — CURRENT CONDITIONS + TEMP
 * =========================================================== */
async function detectWeather() {
  const el = document.querySelector("#weather-info .version-value");

  if (!el) return;

  const safeSet = text => {
    el.textContent = text;
    el.style.opacity = "1";
    el.style.transition = "opacity .3s";
  };

  try {
    const { latitude, longitude } = await LocationService.get();

    const resp = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&timezone=auto`,
      { cache: "no-store" }
    );

    const data = await resp.json();

    if (!data || !data.current) {
      throw new Error("Invalid weather response");
    }

    const tempC = data.current.temperature_2m;
    const tempF = Math.round((tempC * 9) / 5 + 32);
    const code = data.current.weathercode;

    const map = {
      0: "☀️ Clear",
      1: "🌤️ Mostly clear",
      2: "⛅ Partly cloudy",
      3: "☁️ Cloudy",
      45: "🌫️ Fog",
      48: "🌫️ Fog",
      51: "🌦️ Light drizzle",
      53: "🌦️ Drizzle",
      55: "🌧️ Heavy drizzle",
      56: "🌧️ Freezing drizzle",
      57: "🌧️ Freezing drizzle",
      61: "🌧️ Light rain",
      63: "🌧️ Rain",
      65: "🌧️ Heavy rain",
      66: "🌧️ Freezing rain",
      67: "🌧️ Freezing rain",
      71: "🌨️ Light snow",
      73: "🌨️ Snow",
      75: "❄️ Heavy snow",
      77: "🌨️ Snow grains",
      80: "🌧️ Rain showers",
      81: "🌧️ Moderate showers",
      82: "🌧️ Heavy showers",
      85: "🌨️ Snow showers",
      86: "❄️ Heavy snow showers",
      95: "⛈️ Thunderstorm",
      96: "⛈️ Thunderstorm with hail",
      99: "⛈️ Severe thunderstorm"
    };

    safeSet(`${map[code] || "🌡️ Weather"} • ${tempF}°F`);
  } catch {
    safeSet("Weather unavailable");
  }
}

detectWeather();
setInterval(detectWeather, 15 * 60 * 1000);
