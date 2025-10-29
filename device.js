document.addEventListener("DOMContentLoaded", () => {
  const osElement = document.querySelector("#os-info .version-value");
  const deviceElement = document.querySelector("#device-info .version-value");

  // --- Utility: Safe text update ---
  const setText = (el, text) => {
    if (el) el.textContent = text || "Unknown";
  };

  // --- Core Detection ---
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  const uaLower = ua.toLowerCase();

  let os = "Unknown OS";
  let osVersion = "";
  let deviceModel = "Unknown Device";

  // 1️⃣ OS Detection
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

  // 2️⃣ OS Version Parsing (fallback)
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

  // 3️⃣ Try Client Hints for more accuracy (asynchronously)
  if (navigator.userAgentData) {
    navigator.userAgentData
      .getHighEntropyValues(["platform", "platformVersion", "model"])
      .then((data) => {
        // OS platformVersion (better than UA parsing)
        if (data.platform) os = data.platform;
        if (data.platformVersion) {
          const pv = data.platformVersion.split(".");
          osVersion = pv.slice(0, 2).join(".");
        }

        // Device model
        if (data.model && data.model.trim()) {
          deviceModel = data.model.trim();
        } else {
          deviceModel = parseModelFromUA(ua);
        }

        setText(osElement, `${os} ${osVersion}`.trim());
        setText(deviceElement, deviceModel);
      })
      .catch(() => {
        // fallback sync update
        deviceModel = parseModelFromUA(ua);
        setText(osElement, `${os} ${osVersion}`.trim());
        setText(deviceElement, deviceModel);
      });
  } else {
    // Non-Client-Hints browsers (Safari, Firefox)
    deviceModel = parseModelFromUA(ua);
    setText(osElement, `${os} ${osVersion}`.trim());
    setText(deviceElement, deviceModel);
  }

  // --- Model Extraction (Android / iOS / Desktop) ---
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

    // Initialize everything when the page loads
    const initialDeviceElement = document.querySelector("#device-info .version-value");
    if (initialDeviceElement) {
        initialDeviceElement.textContent = detectDevice();
    }
    detectOSAndVersion();
    getDetailedDeviceModel();
});
