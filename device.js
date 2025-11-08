document.addEventListener("DOMContentLoaded", () => {
  const osInfoEl = document.querySelector("#os-info .version-value");
  const deviceInfoEl = document.querySelector("#device-info .version-value");

  // New fields for System Dashboard
  const browserInfoEl = document.querySelector("#browser-info .version-value");
  const resolutionInfoEl = document.querySelector("#resolution-info .version-value");
  const connectionInfoEl = document.querySelector("#connection-info .version-value");
  const batteryInfoEl = document.querySelector("#battery-info .version-value");

  if (!osInfoEl || !deviceInfoEl) return;

  // --- OS Icon Map ---
  const iconMap = {
    "Windows": "/icons/windows.svg",
    "macOS": "/icons/apple.svg",
    "iOS": "/icons/apple.svg",
    "iPadOS": "/icons/apple.svg",
    "Android": "/icons/android.svg",
    "Linux": "/icons/linux.svg",
    "ChromeOS": "/icons/chrome.svg",
    "Unknown": "/icons/monitor.svg"
  };

  // --- Base icon style ---
  const iconStyle = `
    display: inline-block;
    width: 22px;
    height: 22px;
    vertical-align: middle;
    margin-right: 8px;
    filter: drop-shadow(0 0 3px rgba(0,0,0,0.25));
    background-color: color-mix(in srgb, var(--accent-color) 90%, transparent);
    -webkit-mask-size: contain;
    mask-size: contain;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-position: center;
    mask-position: center;
  `;

  // --- Detect OS ---
  async function detectOS() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    let os = "Unknown";
    let version = "";

    // Try Client Hints first
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
      try {
        const data = await navigator.userAgentData.getHighEntropyValues(["platform", "platformVersion"]);
        if (data.platform) os = data.platform;
        if (data.platformVersion) version = data.platformVersion;
      } catch (err) {
        console.warn("ClientHints version retrieval failed:", err);
      }
    }

    // Fallback parsing
    if (!version) {
      if (/iPad/i.test(ua)) {
        os = "iPadOS";
        const m = ua.match(/OS (\d+([_.]\d+)*)/i);
        if (m) version = m[1].replace(/_/g, ".");
      } else if (/iPhone|iPod/.test(ua)) {
        os = "iOS";
        const m = ua.match(/OS (\d+([_.]\d+)*)/i);
        if (m) version = m[1].replace(/_/g, ".");
      } else if (/Android/i.test(ua)) {
        os = "Android";
        const m = ua.match(/Android (\d+(\.\d+)*)/i);
        if (m) version = m[1];
      } else if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(ua)) {
        os = "macOS";
        const m = ua.match(/Mac OS X (\d+([_.]\d+)*)/i);
        if (m) version = m[1].replace(/_/g, ".");
      } else if (/Win/.test(ua)) {
        os = "Windows";
        const m = ua.match(/Windows NT (\d+\.\d+)/i);
        if (m) {
          const nt = m[1];
          const map = {
            "10.0": "10 / 11",
            "6.3": "8.1",
            "6.2": "8",
            "6.1": "7",
            "6.0": "Vista",
            "5.1": "XP"
          };
          version = map[nt] || `NT ${nt}`;
        }
      } else if (/CrOS/.test(ua)) {
        os = "ChromeOS";
      } else if (/Linux/.test(ua)) {
        os = "Linux";
      }
    }

    const icon = iconMap[os] || iconMap["Unknown"];
    osInfoEl.innerHTML = `
      <span
        role="img"
        aria-label="${os} icon"
        class="os-icon"
        style="${iconStyle}
          -webkit-mask-image: url(${icon});
          mask-image: url(${icon});
        "
      ></span>
      ${version ? `${os} ${version}` : os}
    `;
  }

  // --- Detect Device Model ---
  async function detectModel() {
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
      try {
        const data = await navigator.userAgentData.getHighEntropyValues(["model"]);
        if (data.model && data.model.length > 0) return data.model;
      } catch (err) {
        console.warn("User-Agent model info unavailable:", err);
      }
    }
    const ua = navigator.userAgent;
    if (/iPad/i.test(ua)) return "iPad";
    if (/iPhone/i.test(ua)) return "iPhone";
    if (/Android/.test(ua)) {
      const match = ua.match(/Android.*?;\s*(.*?)\s*Build\//);
      if (match) return match[1].trim();
      return "Android Device";
    }
    if (/Macintosh/i.test(ua)) return "Mac";
    if (/Windows/i.test(ua)) return "Windows PC";
    if (/Linux/i.test(ua)) return "Linux Device";
    return "Unknown Device";
  }

  // --- Browser Detection ---
  function detectBrowser() {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    let version = "";
    if (ua.includes("Edg")) {
      browser = "Edge";
      version = ua.match(/Edg\/(\d+)/)?.[1];
    } else if (ua.includes("Chrome")) {
      browser = "Chrome";
      version = ua.match(/Chrome\/(\d+)/)?.[1];
    } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
      browser = "Safari";
      version = ua.match(/Version\/(\d+)/)?.[1];
    } else if (ua.includes("Firefox")) {
      browser = "Firefox";
      version = ua.match(/Firefox\/(\d+)/)?.[1];
    }
    return `${browser}${version ? " " + version : ""}`;
  }

  // --- Connection Type ---
  function detectConnection() {
    if ("connection" in navigator) {
      return navigator.connection.effectiveType.toUpperCase();
    } else if (!navigator.onLine) {
      return "Offline";
    }
    return "Online";
  }

  // --- Battery Info ---
  async function detectBattery() {
    try {
      if ("getBattery" in navigator) {
        const battery = await navigator.getBattery();
        const percent = Math.round(battery.level * 100);
        const charging = battery.charging ? "⚡ Charging" : "🔋";
        const text = `${charging} ${percent}%`;
        if (batteryInfoEl) batteryInfoEl.textContent = text;

        // Live updates
        battery.addEventListener("levelchange", () => {
          const newPercent = Math.round(battery.level * 100);
          batteryInfoEl.textContent = `${charging} ${newPercent}%`;
        });
        battery.addEventListener("chargingchange", () => {
          const state = battery.charging ? "⚡ Charging" : "🔋";
          const newPercent = Math.round(battery.level * 100);
          batteryInfoEl.textContent = `${state} ${newPercent}%`;
        });
      } else {
        batteryInfoEl.textContent = "Unavailable";
      }
    } catch (err) {
      batteryInfoEl.textContent = "Unavailable";
    }
  }

  // --- Run Everything ---
  (async () => {
    osInfoEl.textContent = "Detecting...";
    deviceInfoEl.textContent = "Detecting...";

    await detectOS();
    const model = await detectModel();
    deviceInfoEl.textContent = model;

    if (browserInfoEl) browserInfoEl.textContent = detectBrowser();
    if (resolutionInfoEl) resolutionInfoEl.textContent = `${window.screen.width}×${window.screen.height}`;
    if (connectionInfoEl) connectionInfoEl.textContent = detectConnection();
    if (batteryInfoEl) await detectBattery();

    // Fade-in animation
    [osInfoEl, deviceInfoEl, browserInfoEl, resolutionInfoEl, connectionInfoEl, batteryInfoEl]
      .forEach(el => {
        if (el) {
          el.style.transition = "opacity 0.4s ease";
          el.style.opacity = "1";
        }
      });
  })();
});
