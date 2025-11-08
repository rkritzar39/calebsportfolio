/**
 * device.js — v7.0 (FINAL)
 * Caleb’s System Dashboard
 * ✅ iPadOS / iOS detection (no build numbers)
 * ✅ Auto-hide unsupported network info
 * ✅ Accurate connection display
 * ✅ Live synced clock + timezone
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
    if (!conn) return "Wi-Fi"; // iOS fallback

    const type = conn.type || "";
    const eff = conn.effectiveType || "";

    // Handle mixed or multiple
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
    if (!conn) {
      if (networkRow) networkRow.style.display = "none"; // hide on unsupported browsers
      return "";
    }

    const eff = conn.effectiveType?.toLowerCase() || "";
    if (eff.includes("5g")) return "5G";
    if (eff.includes("4g")) return "4G LTE";
    if (eff.includes("lte")) return "LTE";
    if (eff.includes("3g")) return "3G";
    if (eff.includes("2g")) return "2G";
    return "";
  }

  /* ----------------------------
     ⚙️ Apply System Info
  ---------------------------- */
  function applySystemInfo() {
    if (versionEl) versionEl.textContent = "v26.1.2";
    if (buildEl) buildEl.textContent = "2025.9.20";

    if (osEl) osEl.textContent = detectOSVersion();
    if (deviceEl) deviceEl.textContent = detectDevice();
    if (browserEl) browserEl.textContent = detectBrowser();
    if (resolutionEl) resolutionEl.textContent = detectResolution();
    if (connectionEl) connectionEl.textContent = detectConnectionType();
    if (networkEl) {
      const network = detectNetworkTier();
      if (network) networkEl.textContent = network;
      else if (networkRow) networkRow.style.display = "none";
    }

    [osEl, deviceEl, browserEl, resolutionEl, connectionEl, networkEl, versionEl, buildEl].forEach(
      (el) => {
        if (el) {
          el.style.opacity = "1";
          el.style.transition = "opacity 0.4s ease";
        }
      }
    );
  }

  applySystemInfo();

  // Live updates
  window.addEventListener("resize", () => {
    if (resolutionEl) resolutionEl.textContent = detectResolution();
  });
  window.addEventListener("online", applySystemInfo);
  window.addEventListener("offline", applySystemInfo);

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn && "addEventListener" in conn) conn.addEventListener("change", applySystemInfo);
});
