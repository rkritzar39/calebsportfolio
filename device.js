/**
 * device.js
 * Enhanced System Detection Dashboard
 * Works with Version Info section and displays:
 * OS, Device, Browser, Resolution, Connection, Battery
 */

document.addEventListener("DOMContentLoaded", () => {
  // Grab all version info fields
  const osEl = document.querySelector("#os-info .version-value");
  const deviceEl = document.querySelector("#device-info .version-value");
  const browserEl = document.querySelector("#browser-info .version-value");
  const resolutionEl = document.querySelector("#resolution-info .version-value");
  const connectionEl = document.querySelector("#connection-info .version-value");
  const batteryEl = document.querySelector("#battery-info .version-value");

  // If version, build, or synced aren't showing, this ensures fallback text stays visible
  document.querySelector("#version-info .version-value").style.opacity = "1";
  document.querySelector("#build-info .version-value").style.opacity = "1";
  document.querySelector("#synced-info .version-value").style.opacity = "1";

  /* ----------------------------
     OS Detection
  ---------------------------- */
  function detectOS() {
    const ua = navigator.userAgent;
    if (/Windows NT/.test(ua)) return "Windows";
    if (/Mac OS X/.test(ua)) return "macOS";
    if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
    if (/Android/.test(ua)) return "Android";
    if (/Linux/.test(ua)) return "Linux";
    return "Unknown";
  }

  /* ----------------------------
     Device Detection
  ---------------------------- */
  function detectDevice() {
    const ua = navigator.userAgent;
    if (/iPhone/.test(ua)) return "iPhone";
    if (/iPad/.test(ua)) return "iPad";
    if (/Mac/.test(ua)) return "Mac";
    if (/Windows/.test(ua)) return "Windows PC";
    if (/Android/.test(ua)) {
      const match = ua.match(/Android.*?;\s*(.*?)\s*Build\//);
      if (match) return match[1].trim();
      return "Android Device";
    }
    if (/Linux/.test(ua)) return "Linux Device";
    return "Unknown Device";
  }

  /* ----------------------------
     Browser Detection
  ---------------------------- */
  function detectBrowser() {
    const ua = navigator.userAgent;
    let name = "Unknown";
    let version = "";

    if (ua.includes("Edg")) {
      name = "Microsoft Edge";
      version = ua.match(/Edg\/(\d+)/)?.[1];
    } else if (ua.includes("OPR") || ua.includes("Opera")) {
      name = "Opera";
      version = ua.match(/(OPR|Opera)\/(\d+)/)?.[2];
    } else if (ua.includes("Chrome") && !ua.includes("Chromium")) {
      name = "Google Chrome";
      version = ua.match(/Chrome\/(\d+)/)?.[1];
    } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
      name = "Safari";
      version = ua.match(/Version\/(\d+)/)?.[1];
    } else if (ua.includes("Firefox")) {
      name = "Firefox";
      version = ua.match(/Firefox\/(\d+)/)?.[1];
    }

    return `${name}${version ? " " + version : ""}`;
  }

  /* ----------------------------
     Connection Type
  ---------------------------- */
  function detectConnection() {
    if (!("connection" in navigator)) {
      return navigator.onLine ? "Online" : "Offline";
    }
    const type = navigator.connection.effectiveType || "Unknown";
    return type.toUpperCase();
  }

  /* ----------------------------
     Resolution
  ---------------------------- */
  function detectResolution() {
    return `${window.screen.width} × ${window.screen.height}`;
  }

  /* ----------------------------
     Battery Detection
  ---------------------------- */
  async function detectBattery() {
    if (!batteryEl) return;
    if (!("getBattery" in navigator)) {
      batteryEl.textContent = "Unavailable";
      batteryEl.style.opacity = "1";
      return;
    }

    try {
      const battery = await navigator.getBattery();
      const updateBatteryDisplay = () => {
        const percent = Math.round(battery.level * 100);
        const icon = battery.charging ? "⚡ Charging" : "🔋";
        batteryEl.textContent = `${icon} ${percent}%`;
        batteryEl.parentElement.classList.remove("low-battery", "medium-battery", "full-battery");
        if (percent <= 20) batteryEl.parentElement.classList.add("low-battery");
        else if (percent <= 60) batteryEl.parentElement.classList.add("medium-battery");
        else batteryEl.parentElement.classList.add("full-battery");
      };

      updateBatteryDisplay();
      battery.addEventListener("levelchange", updateBatteryDisplay);
      battery.addEventListener("chargingchange", updateBatteryDisplay);
      batteryEl.style.opacity = "1";
    } catch (err) {
      batteryEl.textContent = "Unavailable";
      batteryEl.style.opacity = "1";
    }
  }

  /* ----------------------------
     Initialize and Apply Values
  ---------------------------- */
  function applyValues() {
    if (osEl) { osEl.textContent = detectOS(); osEl.style.opacity = "1"; }
    if (deviceEl) { deviceEl.textContent = detectDevice(); deviceEl.style.opacity = "1"; }
    if (browserEl) { browserEl.textContent = detectBrowser(); browserEl.style.opacity = "1"; }
    if (resolutionEl) { resolutionEl.textContent = detectResolution(); resolutionEl.style.opacity = "1"; }
    if (connectionEl) { connectionEl.textContent = detectConnection(); connectionEl.style.opacity = "1"; }

    detectBattery();

    // Live resolution updates
    window.addEventListener("resize", () => {
      if (resolutionEl) resolutionEl.textContent = detectResolution();
    });

    // Live connection updates
    if ("connection" in navigator) {
      navigator.connection.addEventListener("change", () => {
        connectionEl.textContent = detectConnection();
      });
    }
  }

  applyValues();
});
