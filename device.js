/**
 * device.js — v11.0 Ultra Stable Release
 * Caleb’s System Dashboard
 * ✅ Accurate OS / Device / Browser Detection
 * ✅ Smart Network + Connection
 * ✅ Synced Clock (with Timezone)
 * ✅ Correct Local Sunrise / Sunset (Local-Time Safe)
 * ✅ IP Location fallback for iOS / Safari
 * ✅ True Day/Night detection
 * ✅ Preserves user accent color unless default green
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ device.js v11.0 loaded successfully");

  const getEl = (id) => document.querySelector(`#${id} .version-value`);

  const versionEl = getEl("version-info");
  const buildEl = getEl("build-info");
  const syncedEl = getEl("synced-info");
  const osEl = getEl("os-info");
  const deviceEl = getEl("device-info");
  const browserEl = getEl("browser-info");
  const resolutionEl = getEl("resolution-info");
  const connectionEl = getEl("connection-info");
  const networkEl = document.querySelector("#network-info .version-value");
  const sunriseEl = getEl("sunrise-info");
  const sunsetEl = getEl("sunset-info");

  /* ----------------------------
     🕒 Synced Clock
  ---------------------------- */
  function updateSyncedClock() {
    if (!syncedEl) return;
    const now = new Date();
    const datePart = now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const timePart = now.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    const tz = getTimezoneAbbreviation();
    syncedEl.innerHTML = `${datePart} at ${timePart} <span class="tz-tag">${tz}</span>`;
  }

  function getTimezoneAbbreviation() {
    try {
      const str = new Date().toLocaleTimeString("en-us", { timeZoneName: "short" });
      return str.split(" ").pop().replace(/[()]/g, "");
    } catch {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";
    }
  }

  updateSyncedClock();
  setInterval(updateSyncedClock, 1000);

  /* ----------------------------
     💻 OS + Version Detection
  ---------------------------- */
  function detectOSVersion() {
    const ua = navigator.userAgent;
    let os = "Unknown";
    let version = "";

    const isIPad = /iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (isIPad) {
      os = "iPadOS";
      const m = ua.match(/OS (\d+([_.]\d+)*)/i);
      if (m) version = m[1].replace(/_/g, ".");
    } else if (/iPhone|iPod/i.test(ua)) {
      os = "iOS";
      const m = ua.match(/OS (\d+([_.]\d+)*)/i);
      if (m) version = m[1].replace(/_/g, ".");
    } else if (/Android/i.test(ua)) {
      os = "Android";
      const m = ua.match(/Android (\d+(\.\d+)?)/i);
      if (m) version = m[1];
    } else if (/Macintosh|Mac OS X/.test(ua)) {
      os = "macOS";
      const m = ua.match(/Mac OS X (\d+([_.]\d+)*)/i);
      if (m) version = m[1].replace(/_/g, ".");
    } else if (/Windows NT/i.test(ua)) {
      os = "Windows";
      const map = { "10.0": "11 / 10", "6.3": "8.1", "6.2": "8", "6.1": "7" };
      const m = ua.match(/Windows NT (\d+\.\d+)/);
      if (m) version = map[m[1]] || m[1];
    } else if (/CrOS/i.test(ua)) os = "ChromeOS";
    else if (/Linux/i.test(ua)) os = "Linux";

    return version ? `${os} ${version}` : os;
  }

  /* ----------------------------
     📱 Device
  ---------------------------- */
  function detectDevice() {
    const ua = navigator.userAgent;
    if (/iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1))
      return "iPad";
    if (/iPhone/i.test(ua)) return "iPhone";
    if (/Android/i.test(ua)) {
      const match = ua.match(/Android.*?;\s*(.*?)\s*Build\//);
      return match ? match[1].trim() : "Android Device";
    }
    if (/Macintosh/i.test(ua)) return "Mac";
    if (/Windows/i.test(ua)) return "Windows PC";
    return "Unknown Device";
  }

  /* ----------------------------
     🌐 Browser
  ---------------------------- */
  function detectBrowser() {
    const ua = navigator.userAgent;
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

  /* ----------------------------
     🖥️ Resolution
  ---------------------------- */
  function detectResolution() {
    return `${window.screen.width} × ${window.screen.height}`;
  }

  /* ----------------------------
     📶 Connection + Network
  ---------------------------- */
  function detectConnectionType() {
    if (!navigator.onLine) return "Not Connected";
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn || (!conn.type && !conn.effectiveType)) {
      return /iPhone|iPad|iPod/i.test(navigator.userAgent)
        ? "Unknown (iOS restricted)"
        : "Wi-Fi";
    }
    const type = conn.type || "";
    const eff = conn.effectiveType || "";
    if (type === "wifi") return "Wi-Fi";
    if (type === "cellular") return "Cellular";
    if (navigator.onLine && !type) {
      if (eff.match(/5g|4g|lte/i)) return "Cellular";
      return "Wi-Fi";
    }
    return "Unknown";
  }

  function detectNetworkTier() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!navigator.onLine) return "Not Connected";
    if (conn && (conn.effectiveType || conn.type)) {
      const eff = (conn.effectiveType || "").toLowerCase();
      if (eff.includes("5g")) return "5G";
      if (eff.includes("4g")) return "4G LTE";
      if (eff.includes("lte")) return "LTE";
      if (eff.includes("3g")) return "3G";
      if (eff.includes("2g")) return "2G";
    }
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod|Android/i.test(ua)) return "Cellular (Unknown Speed)";
    if (/Macintosh|Windows|Linux/i.test(ua)) return "Wi-Fi (Unknown Speed)";
    return "Unknown";
  }

  /* ----------------------------
     🌅 Sunrise / Sunset (Fixed)
  ---------------------------- */
  async function getApproxLocation() {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      return { latitude: data.latitude, longitude: data.longitude };
    } catch {
      return null;
    }
  }

  async function fetchSunTimes() {
    if (!sunriseEl || !sunsetEl) return;

    let statusLi = document.getElementById("day-status-info");
    if (!statusLi) {
      const li = document.createElement("li");
      li.id = "day-status-info";
      li.innerHTML = `<span class="version-label">🌞 <strong>Status:</strong></span>
        <span class="version-value">Loading...</span>`;
      document.querySelector(".version-list").appendChild(li);
      statusLi = li.querySelector(".version-value");
    } else {
      statusLi = statusLi.querySelector(".version-value") || statusLi;
    }

    function setSunUI(sunrise, sunset) {
      const now = new Date();
      const isDay = now >= sunrise && now < sunset;

      sunriseEl.textContent = sunrise.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      sunsetEl.textContent = sunset.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
      const userAccent = settings.accentColor || "#3ddc84";
      const root = document.documentElement;

      if (isDay) {
        statusLi.textContent = "Daytime ☀️";
        if (userAccent === "#3ddc84") root.style.setProperty("--accent-color", "#ffd60a");
      } else {
        statusLi.textContent = "Nighttime 🌙";
        if (userAccent === "#3ddc84") root.style.setProperty("--accent-color", "#0a84ff");
      }
    }

    async function fetchSunTimesWithCoords(lat, lng) {
      try {
        const res = await fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&formatted=0`);
        const data = await res.json();
        if (data.status !== "OK") throw new Error("Invalid response");

        // ✅ Correct: use UTC → local automatically
        const sunrise = new Date(data.results.sunrise);
        const sunset = new Date(data.results.sunset);

        console.log("🌅 Local sunrise:", sunrise, "| 🌇 Local sunset:", sunset);
        setSunUI(sunrise, sunset);
      } catch (err) {
        console.error("Sunrise fetch error:", err);
        sunriseEl.textContent = sunsetEl.textContent = "Unavailable";
        statusLi.textContent = "Unavailable";
      }
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchSunTimesWithCoords(pos.coords.latitude, pos.coords.longitude),
        async () => {
          const fallback = await getApproxLocation();
          if (fallback) fetchSunTimesWithCoords(fallback.latitude, fallback.longitude);
          else {
            sunriseEl.textContent = sunsetEl.textContent = "Unavailable";
            statusLi.textContent = "Unavailable";
          }
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    } else {
      const fallback = await getApproxLocation();
      if (fallback) fetchSunTimesWithCoords(fallback.latitude, fallback.longitude);
      else {
        sunriseEl.textContent = sunsetEl.textContent = "Unavailable";
        statusLi.textContent = "Unavailable";
      }
    }
  }

  /* ----------------------------
     ⚙️ Apply All System Info
  ---------------------------- */
  function applySystemInfo() {
    if (versionEl) versionEl.textContent = "v26.1.2";
    if (buildEl) buildEl.textContent = "2025.9.20";
    if (osEl) osEl.textContent = detectOSVersion();
    if (deviceEl) deviceEl.textContent = detectDevice();
    if (browserEl) browserEl.textContent = detectBrowser();
    if (resolutionEl) resolutionEl.textContent = detectResolution();
    if (connectionEl) connectionEl.textContent = detectConnectionType();
    if (networkEl) networkEl.textContent = detectNetworkTier();

    fetchSunTimes();
  }

  applySystemInfo();

  window.addEventListener("resize", () => {
    if (resolutionEl) resolutionEl.textContent = detectResolution();
  });

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn && conn.addEventListener) conn.addEventListener("change", applySystemInfo);
  window.addEventListener("online", applySystemInfo);
  window.addEventListener("offline", applySystemInfo);
});
