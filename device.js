document.addEventListener("DOMContentLoaded", () => {
  const osEl = document.querySelector("#os-info .version-value");
  const deviceEl = document.querySelector("#device-info .version-value");
  const browserEl = document.querySelector("#browser-info .version-value");
  const resolutionEl = document.querySelector("#resolution-info .version-value");
  const connectionEl = document.querySelector("#connection-info .version-value");
  const batteryEl = document.querySelector("#battery-info .version-value");

  // --- Detect OS ---
  function detectOS() {
    const ua = navigator.userAgent;
    if (/Windows NT/.test(ua)) return "Windows";
    if (/Mac OS X/.test(ua)) return "macOS";
    if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
    if (/Android/.test(ua)) return "Android";
    if (/Linux/.test(ua)) return "Linux";
    return "Unknown";
  }

  // --- Detect Device ---
  function detectDevice() {
    const ua = navigator.userAgent;
    if (/iPhone/.test(ua)) return "iPhone";
    if (/iPad/.test(ua)) return "iPad";
    if (/Mac/.test(ua)) return "Mac";
    if (/Windows/.test(ua)) return "Windows PC";
    if (/Android/.test(ua)) return "Android Device";
    return "Unknown Device";
  }

  // --- Detect Browser ---
  function detectBrowser() {
    const ua = navigator.userAgent;
    let name = "Unknown";
    let version = "";

    if (ua.includes("Edg")) {
      name = "Microsoft Edge";
      version = ua.match(/Edg\/(\d+)/)?.[1];
    } else if (ua.includes("Chrome") && !ua.includes("Chromium")) {
      name = "Google Chrome";
      version = ua.match(/Chrome\/(\d+)/)?.[1];
    } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
      name = "Safari";
      version = ua.match(/Version\/(\d+)/)?.[1];
    } else if (ua.includes("Firefox")) {
      name = "Firefox";
      version = ua.match(/Firefox\/(\d+)/)?.[1];
    } else if (ua.includes("OPR")) {
      name = "Opera";
      version = ua.match(/OPR\/(\d+)/)?.[1];
    }

    return `${name}${version ? " " + version : ""}`;
  }

  // --- Detect Connection ---
  function detectConnection() {
    if (!("connection" in navigator)) {
      return navigator.onLine ? "Online" : "Offline";
    }
    const type = navigator.connection.effectiveType || "Unknown";
    return type.toUpperCase();
  }

  // --- Detect Resolution ---
  function detectResolution() {
    return `${window.screen.width} × ${window.screen.height}`;
  }

  // --- Detect Battery ---
  async function detectBattery() {
    if (!("getBattery" in navigator)) {
      batteryEl.textContent = "Unavailable";
      return;
    }

    try {
      const battery = await navigator.getBattery();
      const percent = Math.round(battery.level * 100);
      const icon = battery.charging ? "⚡ Charging" : "🔋";
      batteryEl.textContent = `${icon} ${percent}%`;

      battery.addEventListener("levelchange", () => {
        const p = Math.round(battery.level * 100);
        batteryEl.textContent = `${icon} ${p}%`;
      });

      battery.addEventListener("chargingchange", () => {
        const p = Math.round(battery.level * 100);
        batteryEl.textContent = battery.charging ? `⚡ Charging ${p}%` : `🔋 ${p}%`;
      });
    } catch (err) {
      batteryEl.textContent = "Unavailable";
    }
  }

  // --- Run all ---
  osEl.textContent = detectOS();
  deviceEl.textContent = detectDevice();
  browserEl.textContent = detectBrowser();
  resolutionEl.textContent = detectResolution();
  connectionEl.textContent = detectConnection();
  detectBattery();

  // Update resolution dynamically
  window.addEventListener("resize", () => {
    resolutionEl.textContent = detectResolution();
  });

  // Fade in the values
  [osEl, deviceEl, browserEl, resolutionEl, connectionEl, batteryEl].forEach(el => {
    el.style.opacity = "1";
  });
});
