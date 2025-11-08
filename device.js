/**
 * device.js — v5.2
 * Fully working system dashboard: OS, Browser, Connection, Network
 */

document.addEventListener("DOMContentLoaded", () => {
  const osEl = document.querySelector("#os-info .version-value");
  const deviceEl = document.querySelector("#device-info .version-value");
  const browserEl = document.querySelector("#browser-info .version-value");
  const resolutionEl = document.querySelector("#resolution-info .version-value");
  const connectionEl = document.querySelector("#connection-info .version-value");
  const networkEl = document.querySelector("#network-info .version-value");
  const syncedEl = document.querySelector("#synced-info .version-value");

  /* --- 🕒 Clock --- */
  function updateClock() {
    if (!syncedEl) return;
    const now = new Date();
    const date = now.toLocaleDateString(undefined, {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    const time = now.toLocaleTimeString(undefined, {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
    });
    const tz = new Date().toLocaleTimeString("en-us", { timeZoneName: "short" }).split(" ").pop();
    syncedEl.innerHTML = `${date} at ${time} <span class="tz-tag">${tz}</span>`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* --- 💻 OS --- */
  function detectOS() {
    const ua = navigator.userAgent;
    let os = "Unknown", version = "";
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
      const map = { "10.0": "11/10", "6.3": "8.1", "6.2": "8", "6.1": "7" };
      const m = ua.match(/Windows NT (\d+\.\d+)/);
      if (m) version = map[m[1]] || m[1];
    } else if (/CrOS/i.test(ua)) os = "ChromeOS";
    else if (/Linux/i.test(ua)) os = "Linux";
    return version ? `${os} ${version}` : os;
  }

  /* --- 🌐 Browser --- */
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

  /* --- 📱 Connection --- */
  async function detectConnectionType() {
    if (!connectionEl) return;
    if (!navigator.onLine) {
      connectionEl.textContent = "🚫 Not Connected";
      return;
    }
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && conn.type) {
      if (conn.type === "wifi") return (connectionEl.textContent = "📶 Wi-Fi");
      if (conn.type === "cellular") return (connectionEl.textContent = "📱 Cellular");
    }

    // fallback for Safari/iOS
    try {
      const start = performance.now();
      await fetch("https://www.gstatic.com/generate_204", { mode: "no-cors", cache: "no-store" });
      const latency = performance.now() - start;
      connectionEl.textContent = latency > 200 ? "📱 Cellular" : "📶 Wi-Fi";
    } catch {
      connectionEl.textContent = "🌐 Connected";
    }
  }

  /* --- 📡 Network Generation --- */
  async function detectNetworkGeneration() {
    if (!networkEl) return;
    if (!navigator.onLine) return (networkEl.textContent = "🚫 Not Connected");

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && conn.effectiveType) {
      const eff = conn.effectiveType.toLowerCase();
      if (eff.includes("5g")) return (networkEl.textContent = "5G");
      if (eff.includes("4g")) return (networkEl.textContent = "4G / LTE");
      if (eff.includes("3g")) return (networkEl.textContent = "3G");
      if (eff.includes("2g")) return (networkEl.textContent = "2G");
      return (networkEl.textContent = "LTE / 4G");
    }

    // fallback for Safari/iOS
    try {
      const start = performance.now();
      await fetch("https://www.gstatic.com/generate_204", { mode: "no-cors", cache: "no-store" });
      const latency = performance.now() - start;
      let gen = "LTE / 4G";
      if (latency > 800) gen = "3G";
      else if (latency < 200) gen = "5G";
      networkEl.textContent = gen;
    } catch {
      networkEl.textContent = "Unknown";
    }
  }

  /* --- 🧠 Apply All --- */
  async function applyAll() {
    if (osEl) osEl.textContent = detectOS();
    if (deviceEl) deviceEl.textContent = /iPhone/i.test(navigator.userAgent)
      ? "iPhone"
      : /iPad/i.test(navigator.userAgent)
      ? "iPad"
      : "Device";
    if (browserEl) browserEl.textContent = detectBrowser();
    if (resolutionEl) resolutionEl.textContent = `${window.screen.width} × ${window.screen.height}`;
    await detectConnectionType();
    await detectNetworkGeneration();
  }

  applyAll();
  setInterval(applyAll, 5000);

  window.addEventListener("online", applyAll);
  window.addEventListener("offline", applyAll);
  window.addEventListener("resize", () => {
    if (resolutionEl) resolutionEl.textContent = `${window.screen.width} × ${window.screen.height}`;
  });
});
