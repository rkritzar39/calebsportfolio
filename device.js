/**
 * device.js — v3.4 FINAL (Caleb’s Dashboard)
 * Accurate OS, Device, Browser, Connection, Battery, Resolution + Live Clock
 */

document.addEventListener("DOMContentLoaded", () => {
  // Element references
  const osEl = document.querySelector("#os-info .version-value");
  const deviceEl = document.querySelector("#device-info .version-value");
  const browserEl = document.querySelector("#browser-info .version-value");
  const resolutionEl = document.querySelector("#resolution-info .version-value");
  const connectionEl = document.querySelector("#connection-info .version-value");
  const batteryEl = document.querySelector("#battery-info .version-value");
  const syncedEl = document.querySelector("#synced-info .version-value");

  /* ----------------------------
     🕒 Live "Synced" Clock
  ---------------------------- */
  function updateSyncedClock() {
    if (!syncedEl) return;
    const now = new Date();
    const formatted = now.toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    syncedEl.textContent = formatted;
    syncedEl.style.opacity = "1";
  }

  updateSyncedClock();
  setInterval(updateSyncedClock, 1000);

  /* ----------------------------
     💻 OS Detection (iOS Fix)
  ---------------------------- */
  function detectOS() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;

    // Fix: iOS devices sometimes spoof macOS
    if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
      return "iOS";
    }
    if (/Android/i.test(ua)) return "Android";
    if (/Win(dows )?NT/.test(ua)) return "Windows";
    if (/Macintosh|Mac OS X/.test(ua)) return "macOS";
    if (/Linux/i.test(ua)) return "Linux";
    return "Unknown";
  }

  /* ----------------------------
     📱 Device Detection
  ---------------------------- */
  function detectDevice() {
    const ua = navigator.userAgent;
    if (/iPhone/i.test(ua)) return "iPhone";
    if (/iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iPad";
    if (/Android/i.test(ua)) {
      const match = ua.match(/Android.*?;\s*(.*?)\s*Build\//);
      return match ? match[1].trim() : "Android Device";
    }
    if (/Macintosh/i.test(ua)) return "Mac";
    if (/Windows/i.test(ua)) return "Windows PC";
    return "Unknown Device";
  }

  /* ----------------------------
     🌐 Browser Detection (iOS + Desktop)
  ---------------------------- */
  function detectBrowser() {
    const ua = navigator.userAgent;

    // iOS browsers (hidden identifiers)
    if (ua.includes("CriOS")) return "Chrome (iOS)";
    if (ua.includes("EdgiOS")) return "Edge (iOS)";
    if (ua.includes("FxiOS")) return "Firefox (iOS)";
    if (ua.includes("OPiOS")) return "Opera (iOS)";

    // Desktop browsers
    if (ua.includes("Edg")) return "Microsoft Edge";
    if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
    if (ua.includes("Chrome") && !ua.includes("Chromium")) return "Google Chrome";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("Firefox")) return "Firefox";
    return "Unknown Browser";
  }

  /* ----------------------------
     📶 Connection Type
  ---------------------------- */
  function detectConnection() {
    if (!("connection" in navigator)) return navigator.onLine ? "Online" : "Offline";
    return navigator.connection.effectiveType?.toUpperCase() || "Online";
  }

  /* ----------------------------
     🖥️ Screen Resolution
  ---------------------------- */
  function detectResolution() {
    return `${window.screen.width} × ${window.screen.height}`;
  }

  /* ----------------------------
     🔋 Battery Detection (Safe Fallback)
  ---------------------------- */
  async function detectBattery() {
    if (!batteryEl) return;

    if (!("getBattery" in navigator)) {
      batteryEl.textContent = "Unavailable on this device";
      batteryEl.style.opacity = "1";
      return;
    }

    try {
      const battery = await navigator.getBattery();

      const updateBatteryUI = () => {
        const percent = Math.round(battery.level * 100);
        const icon = battery.charging ? "⚡ Charging" : "🔋";
        batteryEl.textContent = `${icon} ${percent}%`;
      };

      updateBatteryUI();
      battery.addEventListener("levelchange", updateBatteryUI);
      battery.addEventListener("chargingchange", updateBatteryUI);
      batteryEl.style.opacity = "1";
    } catch {
      batteryEl.textContent = "Unavailable";
      batteryEl.style.opacity = "1";
    }
  }

  /* ----------------------------
     🧠 Apply Everything
  ---------------------------- */
  function applyValues() {
    if (osEl) { osEl.textContent = detectOS(); osEl.style.opacity = "1"; }
    if (deviceEl) { deviceEl.textContent = detectDevice(); deviceEl.style.opacity = "1"; }
    if (browserEl) { browserEl.textContent = detectBrowser(); browserEl.style.opacity = "1"; }
    if (resolutionEl) { resolutionEl.textContent = detectResolution(); resolutionEl.style.opacity = "1"; }
    if (connectionEl) { connectionEl.textContent = detectConnection(); connectionEl.style.opacity = "1"; }
    detectBattery();

    // Dynamic updates
    window.addEventListener("resize", () => {
      if (resolutionEl) resolutionEl.textContent = detectResolution();
    });

    if ("connection" in navigator) {
      navigator.connection.addEventListener("change", () => {
        connectionEl.textContent = detectConnection();
      });
    }
  }

  // Initial apply
  applyValues();

  // Fade in animation for smooth entry
  document.querySelectorAll(".version-value").forEach(el => {
    el.style.transition = "opacity 0.5s ease";
    requestAnimationFrame(() => el.style.opacity = "1");
  });
});
