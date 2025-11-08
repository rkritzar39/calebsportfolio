/**
 * device.js — v9.0 FINAL
 * Caleb’s System Dashboard
 * ✅ Accurate OS / Device / Browser Detection
 * ✅ Auto Network & Connection Info
 * ✅ Synced Clock (Timezone-aware)
 * ✅ Sunrise / Sunset + Day/Night Status
 * ✅ Graceful fallbacks for iOS privacy limits
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ device.js loaded");

  const el = (id) => document.querySelector(`#${id} .version-value`);
  const versionEl = el("version-info");
  const buildEl = el("build-info");
  const syncedEl = el("synced-info");
  const osEl = el("os-info");
  const deviceEl = el("device-info");
  const browserEl = el("browser-info");
  const resolutionEl = el("resolution-info");
  const connectionEl = el("connection-info");
  const networkRow = document.getElementById("network-info");
  const networkEl = networkRow ? networkRow.querySelector(".version-value") : null;

  const sunriseEl = el("sunrise-info");
  const sunsetEl = el("sunset-info");

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
    syncedEl.style.opacity = "1";
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
     💻 OS + Version
  ---------------------------- */
  function detectOSVersion() {
    const ua = navigator.userAgent;
    let os = "Unknown";
    let version = "";

    const isIPad =
      /iPad/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

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

    if (type === "wifi" && eff.match(/4g|5g|lte/i)) return "Wi-Fi + Cellular";
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
    if (!conn) return "Unavailable";
    const eff = conn.effectiveType?.toLowerCase() || "";
    if (eff.includes("5g")) return "5G";
    if (eff.includes("4g")) return "4G LTE";
    if (eff.includes("lte")) return "LTE";
    if (eff.includes("3g")) return "3G";
    if (eff.includes("2g")) return "2G";
    return "Unknown";
  }

  /* ----------------------------
     🌅 Sunrise / Sunset + Day/Night
  ---------------------------- */
  function fetchSunTimes() {
    if (!sunriseEl || !sunsetEl) return;

    // Create Day/Night row if not present
    let dayStatusEl = document.getElementById("day-status-info");
    if (!dayStatusEl) {
      const li = document.createElement("li");
      li.id = "day-status-info";
      li.innerHTML = `
        <span class="version-label">🌞 <strong>Status:</strong></span>
        <span class="version-value">Loading...</span>`;
      document.querySelector(".version-list").appendChild(li);
      dayStatusEl = li.querySelector(".version-value");
    }

    function setSunUI(sunrise, sunset) {
      const now = new Date();
      const isDay = now >= sunrise && now < sunset;

      sunriseEl.textContent = sunrise.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      sunsetEl.textContent = sunset.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      sunriseEl.style.color = "#ff9500";
      sunsetEl.style.color = "#5856d6";

      if (isDay) {
        dayStatusEl.textContent = "Daytime ☀️";
        dayStatusEl.style.color = "#ffd60a";
      } else {
        dayStatusEl.textContent = "Nighttime 🌙";
        dayStatusEl.style.color = "#5ac8fa";
      }
    }

    function setError(msg) {
      sunriseEl.textContent = msg;
      sunsetEl.textContent = msg;
      dayStatusEl.textContent = "Unavailable";
      dayStatusEl.style.color = "#999";
    }

    if (!("geolocation" in navigator)) {
      setError("Unavailable");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const response = await fetch(
            `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`
          );
          const data = await response.json();

          if (data.status !== "OK") {
            setError("Unavailable");
            return;
          }

          const sunrise = new Date(data.results.sunrise);
          const sunset = new Date(data.results.sunset);
          setSunUI(sunrise, sunset);

          // Update status every minute
          setInterval(() => setSunUI(sunrise, sunset), 60000);
        } catch (err) {
          console.error("Sunrise/Sunset fetch error:", err);
          setError("Error");
        }
      },
      (err) => {
        console.warn("Geolocation denied:", err);
        setError("Permission Denied");
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  /* ----------------------------
     ⚙️ Apply Everything
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

    document.querySelectorAll(".version-value").forEach((v) => {
      v.style.opacity = "1";
      v.style.transition = "opacity 0.4s ease";
    });
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
