document.addEventListener("DOMContentLoaded", () => {
  const osInfoEl = document.querySelector("#os-info .version-value");
  const deviceInfoEl = document.querySelector("#device-info .version-value");

  // Safety check
  if (!osInfoEl || !deviceInfoEl) return;

  // --- OS Icon Map ---
  const iconMap = {
    "Windows": "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/windows.svg",
    "macOS": "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/apple.svg",
    "iOS": "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/apple.svg",
    "iPadOS": "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/apple.svg",
    "Android": "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/android.svg",
    "Linux": "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/linux.svg",
    "ChromeOS": "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/chrome.svg",
    "Unknown": "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/monitor.svg"
  };

  // --- Style applied to all OS icons ---
  const iconStyle = `display:inline-block;
    width:22px;
    height:22px;
    vertical-align:middle;
    margin-right:8px;
    opacity:0.9;
    filter: drop-shadow(0 0 3px rgba(0,0,0,0.25));
    transition: transform 0.3s ease, opacity 0.3s ease;
  `;

  async function detectOS() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  let os = "Unknown";
  let version = "";

  // Use client hints if available
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

 // Final display
  const icon = iconMap[os] || iconMap["Unknown"];
  osInfoEl.innerHTML = `
    <img src="${icon}" alt="${os} icon" class="os-icon" style="${iconStyle}">
    ${version ? `${os} ${version}` : os}
  `;
}

  // --- Detect Device Type ---
  function detectDevice() {
    const ua = navigator.userAgent;
    if (/iPad/i.test(ua)) return "iPad";
    if (/iPhone/i.test(ua)) return "iPhone";
    if (/iPod/i.test(ua)) return "iPod";
    if (/Android/i.test(ua)) return "Android Device";
    if (/Macintosh/i.test(ua)) return "Mac";
    if (/Windows/i.test(ua)) return "Windows PC";
    if (/Linux/i.test(ua)) return "Linux Device";
    return "Unknown Device";
  }

  // --- Detect Device Model (when available) ---
  async function detectModel() {
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
      try {
        const data = await navigator.userAgentData.getHighEntropyValues(["model"]);
        if (data.model && data.model.length > 0) return data.model;
      } catch (err) {
        console.warn("User-Agent model info unavailable:", err);
      }
    }

    // Fallback parse from UA
    const ua = navigator.userAgent;
    if (/Android/.test(ua)) {
      const match = ua.match(/Android.*?;\s*(.*?)\s*Build\//);
      if (match) return match[1].trim();
    }
    return detectDevice();
  }

  // --- Run Everything ---
  (async () => {
    osInfoEl.textContent = "Detecting...";
    deviceInfoEl.textContent = "Detecting...";

    await detectOS();

    const model = await detectModel();
    deviceInfoEl.textContent = model;

    // Add subtle fade-in
    osInfoEl.style.transition = "opacity 0.4s ease";
    deviceInfoEl.style.transition = "opacity 0.4s ease";
    osInfoEl.style.opacity = "1";
    deviceInfoEl.style.opacity = "1";
  })();
});
