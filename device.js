/**
 * device.js — v5.3 (iOS-safe)
 * Fixes: iOS no detection issue, waits for DOM readiness
 */

window.addEventListener("load", () => {
  const osEl = document.querySelector("#os-info .version-value");
  const deviceEl = document.querySelector("#device-info .version-value");
  const browserEl = document.querySelector("#browser-info .version-value");
  const resolutionEl = document.querySelector("#resolution-info .version-value");
  const connectionEl = document.querySelector("#connection-info .version-value");
  const networkEl = document.querySelector("#network-info .version-value");
  const syncedEl = document.querySelector("#synced-info .version-value");

  // 🕒 Live Synced Clock
  function updateClock() {
    const now = new Date();
    const date = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const time = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (syncedEl) syncedEl.innerHTML = `${date} at ${time} <span class="tz-tag">${tz}</span>`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // 💻 OS + Version
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
      const map = { "10.0": "11 / 10", "6.3": "8.1", "6.2": "8", "6.1": "7" };
      const m = ua.match(/Windows NT (\d+\.\d+)/);
      if (m) version = map[m[1]] || m[1];
    } else if (/CrOS/i.test(ua)) os = "ChromeOS";
    else if (/Linux/i.test(ua)) os = "Linux";
    return version ? `${os} ${version}` : os;
  }

  // 🌐 Browser
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

  // 📶 Connection Type
  async function detectConnectionType() {
    if (!navigator.onLine) {
      connectionEl.textContent = "🚫 Not Connected";
      networkEl.textContent = "🚫 Not Connected";
      return;
    }

    try {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn && conn.type) {
        if (conn.type === "wifi") connectionEl.textContent = "📶 Wi-Fi";
        else if (conn.type === "cellular") connectionEl.textContent = "📱 Cellular";
        else connectionEl.textContent = "🌐 Connected";
      } else {
        // Safari fallback: simple ping test
        const start = performance.now();
        await fetch("https://www.gstatic.com/generate_204", { mode: "no-cors" });
        const latency = performance.now() - start;
        connectionEl.textContent = latency > 250 ? "📱 Cellular" : "📶 Wi-Fi";
      }
    } catch {
      connectionEl.textContent = "🌐 Connected";
    }
  }

  // 📡 Network Generation (heuristic)
  async function detectNetworkGeneration() {
    if (!navigator.onLine) return (networkEl.textContent = "🚫 Not Connected");
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && conn.effectiveType) {
      const eff = conn.effectiveType.toLowerCase();
      if (eff.includes("5g")) networkEl.textContent = "5G";
      else if (eff.includes("4g")) networkEl.textContent = "4G / LTE";
      else if (eff.includes("3g")) networkEl.textContent = "3G";
      else networkEl.textContent = "LTE / 4G";
      return;
    }
    // fallback latency guess
    const start = performance.now();
    await fetch("https://www.gstatic.com/generate_204", { mode: "no-cors" });
    const latency = performance.now() - start;
    if (latency < 200) networkEl.textContent = "5G";
    else if (latency < 500) networkEl.textContent = "LTE / 4G";
    else if (latency < 1000) networkEl.textContent = "3G";
    else networkEl.textContent = "2G";
  }

  // 🧠 Apply Everything
  async function applyAll() {
    if (osEl) osEl.textContent = detectOS();
    if (deviceEl) deviceEl.textContent = /iPhone/i.test(navigator.userAgent)
      ? "iPhone"
      : /iPad/i.test(navigator.userAgent)
      ? "iPad"
      : "Device";
    if (browserEl) browserEl.textContent = detectBrowser();
    if (resolutionEl) resolutionEl.textContent = `${screen.width} × ${screen.height}`;
    await detectConnectionType();
    await detectNetworkGeneration();
  }

  applyAll();
  setInterval(applyAll, 7000); // auto-refresh
});
