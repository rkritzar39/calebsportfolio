/**
 * device.js — v6.0 COMPLETE
 * Caleb's Full System Dashboard
 * Works on Safari, Chrome, iOS, Android, Windows, macOS
 */

window.addEventListener("load", () => {
  const osEl = document.querySelector("#os-info .version-value");
  const deviceEl = document.querySelector("#device-info .version-value");
  const browserEl = document.querySelector("#browser-info .version-value");
  const resolutionEl = document.querySelector("#resolution-info .version-value");
  const connectionEl = document.querySelector("#connection-info .version-value");
  const networkEl = document.querySelector("#network-info .version-value");
  const syncedEl = document.querySelector("#synced-info .version-value");

  /* ----------------------------
     🕒 Live Synced Clock
  ---------------------------- */
  function updateClock() {
    if (!syncedEl) return;
    const now = new Date();
    const datePart = now.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timePart = now.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    syncedEl.innerHTML = `${datePart} at ${timePart} <span class="tz-tag">${tz}</span>`;
  }
  updateClock();
  setInterval(updateClock, 1000);

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
      const m = ua.match(/OS (\d+[._]\d+)/i);
      if (m) version = m[1].replace("_", ".");
    } else if (/iPhone|iPod/i.test(ua)) {
      os = "iOS";
      const m = ua.match(/OS (\d+[._]\d+)/i);
      if (m) version = m[1].replace("_", ".");
      const build = ua.match(/Build\/([^)]+)\)/i);
      if (build) version += ` (${build[1]})`;
    } else if (/Android/i.test(ua)) {
      os = "Android";
      const m = ua.match(/Android (\d+(\.\d+)?)/i);
      if (m) version = m[1];
    } else if (/Macintosh|Mac OS X/.test(ua)) {
      os = "macOS";
      const m = ua.match(/Mac OS X (\d+[._]\d+)/i);
      if (m) version = m[1].replace("_", ".");
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
     🌐 Browser Detection
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
    if (ua.includes("Firefox")) return "Mozilla Firefox";
    return "Unknown Browser";
  }

  /* ----------------------------
     📱 Device Type
  ---------------------------- */
  function detectDevice() {
    const ua = navigator.userAgent;
    if (/iPhone/i.test(ua)) return "iPhone";
    if (/iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iPad";
    if (/Android/i.test(ua)) {
      const m = ua.match(/Android.*?;\s*(.*?)\s*Build\//);
      return m ? m[1].trim() : "Android Device";
    }
    if (/Macintosh/i.test(ua)) return "Mac";
    if (/Windows/i.test(ua)) return "Windows PC";
    return "Device";
  }

  /* ----------------------------
     📶 Connection Type (Wi-Fi / Cellular / Both)
  ---------------------------- */
  async function detectConnectionType() {
    if (!connectionEl) return;
    if (!navigator.onLine) {
      connectionEl.textContent = "🚫 Not Connected";
      return "Not Connected";
    }

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && conn.type) {
      if (conn.type === "wifi") return (connectionEl.textContent = "📶 Wi-Fi");
      if (conn.type === "cellular") return (connectionEl.textContent = "📱 Cellular");
    }

    try {
      const start = performance.now();
      await fetch("https://www.gstatic.com/generate_204", { mode: "no-cors", cache: "no-store" });
      const latency = performance.now() - start;
      if (latency > 300) {
        connectionEl.textContent = "📱 Cellular";
        return "Cellular";
      } else {
        connectionEl.textContent = "📶 Wi-Fi";
        return "Wi-Fi";
      }
    } catch {
      connectionEl.textContent = "🌐 Connected";
      return "Connected";
    }
  }

  /* ----------------------------
     📡 Network Generation (5G / LTE / 4G / 3G)
  ---------------------------- */
  async function detectNetworkGeneration() {
    if (!networkEl) return;
    if (!navigator.onLine) {
      networkEl.textContent = "🚫 Not Connected";
      return;
    }

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && conn.effectiveType) {
      const eff = conn.effectiveType.toLowerCase();
      if (eff.includes("5g")) return (networkEl.textContent = "5G");
      if (eff.includes("4g")) return (networkEl.textContent = "4G / LTE");
      if (eff.includes("3g")) return (networkEl.textContent = "3G");
      if (eff.includes("2g")) return (networkEl.textContent = "2G");
      return (networkEl.textContent = "LTE / 4G");
    }

    // fallback latency-based guess for iOS
    try {
      const start = performance.now();
      await fetch("https://www.gstatic.com/generate_204", { mode: "no-cors", cache: "no-store" });
      const latency = performance.now() - start;
      if (latency < 200) networkEl.textContent = "5G";
      else if (latency < 500) networkEl.textContent = "4G / LTE";
      else if (latency < 1000) networkEl.textContent = "3G";
      else networkEl.textContent = "2G";
    } catch {
      networkEl.textContent = "Unknown";
    }
  }

  /* ----------------------------
     🧠 Apply Everything
  ---------------------------- */
  async function applyAll() {
    if (osEl) osEl.textContent = detectOSVersion();
    if (deviceEl) deviceEl.textContent = detectDevice();
    if (browserEl) browserEl.textContent = detectBrowser();
    if (resolutionEl) resolutionEl.textContent = `${screen.width} × ${screen.height}`;
    await detectConnectionType();
    await detectNetworkGeneration();
  }

  applyAll();
  setInterval(applyAll, 5000);

  window.addEventListener("online", applyAll);
  window.addEventListener("offline", applyAll);
  window.addEventListener("resize", () => {
    if (resolutionEl) resolutionEl.textContent = `${screen.width} × ${screen.height}`;
  });
});
