/**
 * device.js — v5.1
 * Caleb’s System Dashboard
 * OS, Browser, Connection Type, and Network Generation
 * Works on desktop + mobile (iOS, Android, Windows, macOS)
 */

document.addEventListener("DOMContentLoaded", () => {
  const osEl = document.querySelector("#os-info .version-value");
  const deviceEl = document.querySelector("#device-info .version-value");
  const browserEl = document.querySelector("#browser-info .version-value");
  const resolutionEl = document.querySelector("#resolution-info .version-value");
  const connectionEl = document.querySelector("#connection-info .version-value");
  const networkEl = document.querySelector("#network-info .version-value");
  const batteryRow = document.querySelector("#battery-info");
  const batteryEl = batteryRow ? batteryRow.querySelector(".version-value") : null;
  const syncedEl = document.querySelector("#synced-info .version-value");

  /* ----------------------------
     🕒 Live Synced Clock
  ---------------------------- */
  function updateSyncedClock() {
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
    const tz = new Date()
      .toLocaleTimeString("en-us", { timeZoneName: "short" })
      .split(" ")
      .pop();
    syncedEl.innerHTML = `${datePart} at ${timePart} <span class="tz-tag">${tz}</span>`;
  }
  updateSyncedClock();
  setInterval(updateSyncedClock, 1000);

  /* ----------------------------
     💻 OS Detection
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
      const build = ua.match(/Build\/([^)]+)\)/i);
      if (build) version += ` (${build[1]})`;
    } else if (/Android/i.test(ua)) {
      os = "Android";
      const m = ua.match(/Android (\d+(\.\d+)*)/i);
      if (m) version = m[1];
    } else if (/Macintosh|Mac OS X/.test(ua)) {
      os = "macOS";
      const m = ua.match(/Mac OS X (\d+([_.]\d+)*)/i);
      if (m) version = m[1].replace(/_/g, ".");
    } else if (/Windows NT/i.test(ua)) {
      os = "Windows";
      const map = {
        "10.0": "11 / 10",
        "6.3": "8.1",
        "6.2": "8",
        "6.1": "7",
        "6.0": "Vista",
      };
      const m = ua.match(/Windows NT (\d+\.\d+)/);
      if (m) version = `${map[m[1]] || "NT " + m[1]}`;
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
     📱 Connection Type (Wi-Fi / Cellular / Both)
  ---------------------------- */
  async function detectConnectionType() {
    if (!connectionEl) return;

    if (!navigator.onLine) {
      connectionEl.textContent = "🚫 Not Connected";
      return "Not Connected";
    }

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (conn && conn.type) {
      if (conn.type === "wifi") {
        connectionEl.textContent = "📶 Wi-Fi";
        return "Wi-Fi";
      } else if (conn.type === "cellular") {
        connectionEl.textContent = "📱 Cellular";
        return "Cellular";
      } else if (conn.type === "mixed" || conn.type === "wifi-cellular") {
        connectionEl.textContent = "📡 Cellular / Wi-Fi";
        return "Cellular / Wi-Fi";
      }
    }

    // Safari fallback: ping latency heuristic
    try {
      const start = performance.now();
      await fetch("https://www.gstatic.com/generate_204", { mode: "no-cors", cache: "no-store" });
      const latency = performance.now() - start;

      // >200 ms → Cellular; <200 ms → Wi-Fi
      if (latency > 200) {
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
      let label = "";
      if (eff.includes("5g")) label = "5G";
      else if (eff.includes("4g")) label = "4G / LTE";
      else if (eff.includes("3g")) label = "3G";
      else if (eff.includes("2g")) label = "2G";
      else label = "LTE / 4G";
      networkEl.textContent = label;
      return;
    }

    // iOS / Safari fallback using latency
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

  /* ----------------------------
     🔋 Battery (Auto-hide on desktop)
  ---------------------------- */
  async function detectBattery() {
    if (!batteryEl) return;
    const ua = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    const isLaptop = /Macintosh|Mac OS X/.test(ua) && navigator.maxTouchPoints > 0;
    if (!isMobile && !isLaptop) {
      batteryRow.style.display = "none";
      return;
    }

    if ("getBattery" in navigator) {
      try {
        const battery = await navigator.getBattery();
        const updateBatteryUI = () => {
          const percent = Math.round(battery.level * 100);
          const icon = battery.charging ? "⚡" : "🔋";
          batteryEl.textContent = `${icon} ${percent}%`;
        };
        updateBatteryUI();
        battery.addEventListener("levelchange", updateBatteryUI);
        battery.addEventListener("chargingchange", updateBatteryUI);
      } catch {
        batteryEl.textContent = "⚡ Battery Mode";
      }
    } else {
      batteryEl.textContent = "🔋 Battery";
    }
  }

  /* ----------------------------
     🧠 Apply Everything
  ---------------------------- */
  function applyAll() {
    if (osEl) osEl.textContent = detectOSVersion();
    if (deviceEl) deviceEl.textContent = navigator.userAgent.includes("iPad")
      ? "iPad"
      : /iPhone/i.test(navigator.userAgent)
      ? "iPhone"
      : "Device";
    if (browserEl) browserEl.textContent = detectBrowser();
    if (resolutionEl) resolutionEl.textContent = `${window.screen.width} × ${window.screen.height}`;
    detectConnectionType();
    detectNetworkGeneration();
    detectBattery();
  }

  applyAll();
  setInterval(() => {
    detectConnectionType();
    detectNetworkGeneration();
  }, 5000);

  window.addEventListener("online", applyAll);
  window.addEventListener("offline", applyAll);
  window.addEventListener("resize", () => {
    if (resolutionEl) resolutionEl.textContent = `${window.screen.width} × ${window.screen.height}`;
  });
});
