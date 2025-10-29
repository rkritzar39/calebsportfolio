/**
 * device.js
 * Detects and displays OS, OS version, and device model with matching icons.
 * Integrates seamlessly with Onyx / Liquid Glass theme.
 */

document.addEventListener("DOMContentLoaded", () => {
  const osEl = document.querySelector("#os-info .version-value");
  const deviceEl = document.querySelector("#device-info .version-value");

  const setHTML = (el, html) => { if (el) el.innerHTML = html; };
  const setText = (el, text) => { if (el) el.textContent = text; };

  const ua = navigator.userAgent || navigator.vendor || window.opera;
  const uaLower = ua.toLowerCase();

  let os = "Unknown OS";
  let osVersion = "";
  let deviceModel = "Unknown Device";

  /* ===================================
   * 1️⃣ OS Detection
   * =================================== */
  if (/windows phone/i.test(uaLower)) {
    os = "Windows Phone";
  } else if (/windows/i.test(uaLower)) {
    os = "Windows";
  } else if (/android/i.test(uaLower)) {
    os = "Android";
  } else if (/iPad|iPhone|iPod/.test(ua)) {
    os = "iOS";
    if (navigator.maxTouchPoints && navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)) {
      os = "iPadOS";
    }
  } else if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(ua)) {
    os = "macOS";
  } else if (/CrOS/.test(ua)) {
    os = "ChromeOS";
  } else if (/Linux/.test(ua)) {
    os = "Linux";
  }

  /* ===================================
   * 2️⃣ OS Version Parsing (fallback)
   * =================================== */
  const matchVersion = (regex) => {
    const match = ua.match(regex);
    return match && match[1] ? match[1].replace(/_/g, ".") : "";
  };

  switch (os) {
    case "iOS":
    case "iPadOS":
      osVersion = matchVersion(/OS (\d+([_.]\d+)*)/i);
      break;
    case "Android":
      osVersion = matchVersion(/Android (\d+(\.\d+)*)/i);
      break;
    case "macOS":
      osVersion = matchVersion(/Mac OS X (\d+([_.]\d+)*)/i);
      break;
    case "Windows":
      const winMatch = ua.match(/Windows NT (\d+\.\d+)/i);
      if (winMatch && winMatch[1]) {
        const map = {
          "10.0": "10 / 11",
          "6.3": "8.1",
          "6.2": "8",
          "6.1": "7",
          "6.0": "Vista",
          "5.1": "XP",
        };
        osVersion = map[winMatch[1]] || `NT ${winMatch[1]}`;
      }
      break;
  }

  /* ===================================
   * 3️⃣ Device Model (fallback first)
   * =================================== */
  deviceModel = parseModelFromUA(ua);

  /* ===================================
   * 4️⃣ Try Client Hints for accuracy
   * =================================== */
  if (navigator.userAgentData) {
    navigator.userAgentData
      .getHighEntropyValues(["platform", "platformVersion", "model"])
      .then((data) => {
        if (data.platform) os = data.platform;
        if (data.platformVersion) {
          const pv = data.platformVersion.split(".");
          osVersion = pv.slice(0, 2).join(".");
        }
        if (data.model && data.model.trim()) {
          deviceModel = data.model.trim();
        }
        updateOSDisplay(os, osVersion);
        updateDeviceDisplay(deviceModel);
      })
      .catch(() => {
        updateOSDisplay(os, osVersion);
        updateDeviceDisplay(deviceModel);
      });
  } else {
    updateOSDisplay(os, osVersion);
    updateDeviceDisplay(deviceModel);
  }

  /* ===================================
   * 5️⃣ Functions
   * =================================== */

  function updateOSDisplay(os, version) {
    const iconMap = {
      "Windows": "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/windows.svg",
      "macOS": "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/apple.svg",
      "iOS": "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/apple.svg",
      "iPadOS": "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/apple.svg",
      "Android": "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/android.svg",
      "Linux": "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/linux.svg",
      "ChromeOS": "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/chrome.svg",
      "Windows Phone": "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/windows.svg",
    };

    const iconURL = iconMap[os] || "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/monitor.svg";

    setHTML(
      osEl,
      `<img src="${iconURL}" alt="${os} icon" class="os-icon" draggable="false">
       ${version ? `${os} ${version}` : os}`
    );
  }

  function updateDeviceDisplay(model) {
    const cleanModel = model.replace(/\s{2,}/g, " ").trim();
    const deviceIcon = getDeviceIcon(cleanModel);
    setHTML(
      deviceEl,
      `<img src="${deviceIcon}" alt="Device icon" class="os-icon" draggable="false"> ${cleanModel}`
    );
  }

  function getDeviceIcon(model) {
    const m = model.toLowerCase();
    if (m.includes("iphone") || m.includes("ipad") || m.includes("ipod")) {
      return "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/apple.svg";
    }
    if (m.includes("mac")) {
      return "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/apple.svg";
    }
    if (m.includes("android")) {
      return "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/android.svg";
    }
    if (m.includes("windows")) {
      return "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/windows.svg";
    }
    if (m.includes("chromebook") || m.includes("chrome")) {
      return "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/chrome.svg";
    }
    if (m.includes("linux")) {
      return "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/linux.svg";
    }
    return "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/monitor.svg";
  }

  function parseModelFromUA(ua) {
    if (/Android/.test(ua)) {
      const match = ua.match(/Android.*?;\s*(.*?)\s*Build\//);
      if (match && match[1]) {
        return match[1].replace(/\s+$/, "").replace(/^;|;$/g, "");
      }
      return "Android Device";
    }
    if (/iPhone/.test(ua)) return "iPhone";
    if (/iPad/.test(ua)) return "iPad";
    if (/iPod/.test(ua)) return "iPod";
    if (/Macintosh/.test(ua)) return "Mac";
    if (/Windows/i.test(ua)) return "Windows PC";
    if (/CrOS/i.test(ua)) return "Chromebook";
    if (/Linux/i.test(ua)) return "Linux Device";
    return "Unknown Device";
  }
});


    // Initialize everything when the page loads
    const initialDeviceElement = document.querySelector("#device-info .version-value");
    if (initialDeviceElement) {
        initialDeviceElement.textContent = detectDevice();
    }
    detectOSAndVersion();
    getDetailedDeviceModel();
});
