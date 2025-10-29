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
  const iconStyle = `
    display:inline-block;
    width:22px;
    height:22px;
    vertical-align:middle;
    margin-right:8px;
    opacity:0.9;
    filter: drop-shadow(0 0 3px rgba(0,0,0,0.25));
    transition: transform 0.3s ease, opacity 0.3s ease;
  `;

  // --- Detect OS + Version ---
  async function detectOS() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    let os = "Unknown";
    let version = "";

    // iOS / iPadOS
    if (/iPad/i.test(ua)) {
      os = "iPadOS";
      const match = ua.match(/OS (\d+([_.]\d+)*)/i);
      if (match) version = match[1].replace(/_/g, ".");
    } else if (/iPhone|iPod/.test(ua)) {
      os = "iOS";
      const match = ua.match(/OS (\d+([_.]\d+)*)/i);
      if (match) version = match[1].replace(/_/g, ".");
    }
    // Android
    else if (/Android/i.test(ua)) {
      os = "Android";
      const match = ua.match(/Android (\d+(\.\d+)*)/i);
      if (match) version = match[1];
    }
    // macOS
    else if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(ua)) {
      os = "macOS";
      const match = ua.match(/Mac OS X (\d+([_.]\d+)*)/i);
      if (match) version = match[1].replace(/_/g, ".");
    }
    // Windows
    else if (/Win/.test(ua)) {
      os = "Windows";
      const match = ua.match(/Windows NT (\d+\.\d+)/i);
      if (match) {
        const nt = match[1];
        switch (nt) {
          case "10.0": version = "10 / 11"; break;
          case "6.3": version = "8.1"; break;
          case "6.2": version = "8"; break;
          case "6.1": version = "7"; break;
          case "6.0": version = "Vista"; break;
          case "5.1": case "5.2": version = "XP"; break;
          default: version = "NT " + nt;
        }
      }
    }
    // Linux
    else if (/Linux/i.test(ua)) {
      os = "Linux";
    }
    // ChromeOS
    else if (/CrOS/i.test(ua)) {
      os = "ChromeOS";
    }

    const icon = iconMap[os] || iconMap["Unknown"];
    osInfoEl.innerHTML = `
      <img src="${icon}" alt="${os} icon" style="${iconStyle}">
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
