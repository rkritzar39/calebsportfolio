/**
 * device.js — v5.0
 * Caleb's System Dashboard (Clean + Accurate)
 * ✅ Correct iPadOS / iOS detection (no build numbers)
 * ✅ Connection & Network separation
 * ✅ Synced clock with timezone
 * ✅ Auto hides missing data gracefully
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ device.js loaded");

  const osEl = document.querySelector("#os-info .version-value");
  const deviceEl = document.querySelector("#device-info .version-value");
  const browserEl = document.querySelector("#browser-info .version-value");
  const resolutionEl = document.querySelector("#resolution-info .version-value");
  const connectionEl = document.querySelector("#connection-info .version-value");
  const networkEl = document.querySelector("#network-info .version-value");
  const syncedEl = document.querySelector("#synced-info .version-value");

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
      year: "numeric"
    });
    const timePart = now.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
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
     💻 OS + Version (clean, no build)
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
    if (/iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iPad";
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
     📶 Connection (Cellular/Wi-Fi)
  ---------------------------- */
  function detectConnectionType() {
    if (!navigator.onLine) return "Not Connected";

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return "Online";

    const type = conn.type || "";
    const eff = conn.effectiveType || "";

    // Determine main connection name
    if (type === "wifi") return "Wi-Fi";
    if (type === "cellular") return "Cellular";
    if (navigator.onLine && !type) {
      // Guess based on effective type
      if (eff === "5g" || eff === "4g" || eff === "lte") return "Cellular";
      return "Wi-Fi";
    }

    return "Unknown";
  }

  /* ----------------------------
     📡 Network (Speed / Tier)
  ---------------------------- */
  function detectNetworkTier() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return "Detecting…";

    const eff = conn.effectiveType?.toLowerCase() || "";
    if (eff.includes("5g")) return "5G";
    if (eff.includes("4g")) return "4G LTE";
    if (eff.includes("lte")) return "LTE";
    if (eff.includes("3g")) return "3G";
    if (eff.includes("2g")) return "2G";
    return "Detecting…";
  }

  /* ----------------------------
     ⚙️ Apply Everything
  ---------------------------- */
  function applySystemInfo() {
    osEl.textContent = detectOSVersion();
    deviceEl.textContent = detectDevice();
    browserEl.textContent = detectBrowser();
    resolutionEl.textContent = detectResolution();
    connectionEl.textContent = detectConnectionType();
    networkEl.textContent = detectNetworkTier();

    [osEl, deviceEl, browserEl, resolutionEl, connectionEl, networkEl].forEach(el => {
      el.style.opacity = "1";
      el.style.transition = "opacity 0.4s ease";
    });
  }

  applySystemInfo();

  // Live updates for network/resolution
  window.addEventListener("resize", () => {
    resolutionEl.textContent = detectResolution();
  });
  window.addEventListener("online", applySystemInfo);
  window.addEventListener("offline", applySystemInfo);

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn && "addEventListener" in conn) conn.addEventListener("change", applySystemInfo);
});
