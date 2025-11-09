/**
 * device.js — v12 SAFE
 * Minimal, robust, iOS-friendly. No third-party IP services.
 * If a field can't be read, it shows a clear reason instead of staying blank.
 */

document.addEventListener("DOMContentLoaded", () => {
  const q = (id) => document.querySelector(`#${id} .version-value`);

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
   * Helpers
   * -------------------------- */
  const safeSet = (el, text) => { if (el) el.textContent = text; };
  const fadeIn  = (el) => { if (el) { el.style.opacity = "1"; el.style.transition = "opacity .25s"; } };

  /* ----------------------------
   * Version / Build (static from your HTML)
   * -------------------------- */
  fadeIn(versionEl);
  fadeIn(buildEl);

  /* ----------------------------
   * Synced clock (local TZ label)
   * -------------------------- */
  const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";
  function updateClock() {
    if (!syncedEl) return;
    const now  = new Date();
    const date = now.toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
    const time = now.toLocaleTimeString(undefined, {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
    });
    syncedEl.innerHTML = `${date} at ${time} <span class="tz-tag">${tzName}</span>`;
    fadeIn(syncedEl);
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* ----------------------------
   * OS + Version (UA & iPad detection)
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
   * Device
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
   * Browser
   * -------------------------- */
  function detectBrowser() {
    const ua = navigator.userAgent || "";
    if (ua.includes("CriOS"))              return "Chrome (iOS)";
    if (ua.includes("EdgiOS"))             return "Edge (iOS)";
    if (ua.includes("FxiOS"))              return "Firefox (iOS)";
    if (ua.includes("OPiOS"))              return "Opera (iOS)";
    if (ua.includes("Edg"))                return "Microsoft Edge";
    if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
    if (ua.includes("Chrome") && !ua.includes("Chromium")) return "Google Chrome";
    if (ua.includes("Safari") && !ua.includes("Chrome"))   return "Safari";
    if (ua.includes("Firefox"))            return "Firefox";
    return "Unknown Browser";
  }
  safeSet(browserEl, detectBrowser()); fadeIn(browserEl);

  /* ----------------------------
   * Resolution
   * -------------------------- */
  const setRes = () => { safeSet(resolutionEl, `${screen.width} × ${screen.height}`); fadeIn(resolutionEl); };
  setRes(); window.addEventListener("resize", setRes);

  /* ----------------------------
   * Connection (type you're using)
   * Network (5G / LTE / etc.)
   * -------------------------- */
    function readConnection() {
  // If offline — done early
  if (!navigator.onLine) {
    return { connection: "Not Connected", network: "Not Connected" };
  }

  const ua = navigator.userAgent || "";
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  let connection = "Wi-Fi";
  let network = "Wi-Fi";

  if (conn) {
    const type = (conn.type || "").toLowerCase();
    const eff = (conn.effectiveType || "").toLowerCase();

    if (type.includes("wifi")) {
      connection = "Wi-Fi";
      network = "Wi-Fi";
    } else if (type.includes("cellular") || /(5g|4g|lte|3g|2g)/.test(eff)) {
      connection = "Cellular";
      network = "Cellular";
    } else if (type.includes("wifi") && /(5g|4g|lte|3g|2g)/.test(eff)) {
      connection = "Cellular / Wi-Fi";
      network = "Cellular / Wi-Fi";
    } else {
      // Unknown but online
      connection = "Wi-Fi";
      network = "Wi-Fi";
    }
  } else {
    // Safari / iOS fallback
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    const isDesktop = /Macintosh|Windows|Linux/i.test(ua);

    if (isMobile && navigator.onLine) {
      connection = "Cellular";
      network = "Cellular";
    } else if (isDesktop && navigator.onLine) {
      connection = "Wi-Fi";
      network = "Wi-Fi";
    } else {
      connection = "Unknown";
      network = "Unknown";
    }
  }

  // Force “Cellular / Wi-Fi” when both are active
  if (
    navigator.onLine &&
    conn &&
    type?.includes("wifi") &&
    /(5g|4g|lte|3g|2g|cellular)/.test(conn.effectiveType || "")
  ) {
    connection = "Cellular / Wi-Fi";
    network = "Cellular / Wi-Fi";
  }

  return { connection, network };
}
  /* ----------------------------
   * Sunrise / Sunset (Geolocation only)
   * -------------------------- */
  async function loadSunTimes() {
    if (!sunriseEl || !sunsetEl) return;

    // Status row (Daytime/Nighttime)
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

    // If no geolocation, fail cleanly
    if (!("geolocation" in navigator)) {
      safeSet(sunriseEl, "Unavailable");
      safeSet(sunsetEl,  "Unavailable");
      safeSet(statusEl,  "Unavailable");
      return;
    }

    // Ask once; if denied, show reason.
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const resp = await fetch(`https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`, { cache: "no-store" });
        const data = await resp.json();
        if (data.status !== "OK") throw new Error("Sun API error");

        // API returns UTC; Date parses ISO as UTC, format prints local time.
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
        safeSet(sunsetEl,  "Error");
        safeSet(statusEl,  "Unavailable");
      }
    }, (err) => {
      console.warn("Geolocation denied:", err);
      safeSet(sunriseEl, "Permission denied");
      safeSet(sunsetEl,  "Permission denied");
      safeSet(statusEl,  "Unavailable");
    }, { timeout: 8000, maximumAge: 0 });
  }
  loadSunTimes();

  /* Ensure all current fields are visible even if values are defaults */
  [versionEl, buildEl, osEl, deviceEl, browserEl, resolutionEl, connectionEl, networkEl, sunriseEl, sunsetEl, syncedEl]
    .forEach(fadeIn);
});
