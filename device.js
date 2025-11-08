/**
 * device.js — v4.5 FINAL
 * Caleb’s System Dashboard
 * Accurate OS, Device, Browser, Connection, and Synced Clock
 * Auto-hides battery on desktops
 */

document.addEventListener("DOMContentLoaded", () => {
  const osEl = document.querySelector("#os-info .version-value");
  const deviceEl = document.querySelector("#device-info .version-value");
  const browserEl = document.querySelector("#browser-info .version-value");
  const resolutionEl = document.querySelector("#resolution-info .version-value");
  const connectionEl = document.querySelector("#connection-info .version-value");
  const batteryRow = document.querySelector("#battery-info");
  const batteryEl = batteryRow ? batteryRow.querySelector(".version-value") : null;
  const syncedEl = document.querySelector("#synced-info .version-value");

  /* ----------------------------
     🕒 Human-Friendly “Synced” Clock
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
    const tzShort = getTimezoneAbbreviation();
    syncedEl.innerHTML = `${datePart} at ${timePart} <span class="tz-tag">${tzShort}</span>`;
  }

  function getTimezoneAbbreviation() {
    try {
      const dateString = new Date().toLocaleTimeString("en-us", { timeZoneName: "short" });
      const tz = dateString.split(" ").pop();
      return tz.replace(/[()]/g, "");
    } catch {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";
    }
  }

  updateSyncedClock();
  setInterval(updateSyncedClock, 1000);

  /* ----------------------------
     💻 OS + Version Detection
  ---------------------------- */
  function detectOSVersion() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    let os = "Unknown";
    let version = "";

    const isIPad =
      /iPad/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (isIPad) {
      os = "iPadOS";
      const m = ua.match(/OS (\d+([_.]\d+)*)/i);
      if (m) version = m[1].replace(/_/g, ".");
    } else if (/iPhone|iPod/i.test(ua)) {
      os = "iOS";
      const m = ua.match(/OS (\d+([_.]\d+)*)/i);
      if (m) version = m[1].replace(/_/g, ".");
      // iOS Build ID (if available)
      const build = ua.match(/\((?:iPhone|CPU) OS [^;]+;[^)]+Build\/([^)]+)\)/i);
      if (build) version += ` (${build[1]})`;
    } else if (/Android/i.test(ua)) {
      os = "Android";
      const m = ua.match(/Android (\d+(\.\d+)*)/i);
      if (m) version = m[1];
    } else if (/Macintosh|Mac OS X/.test(ua)) {
      os = "macOS";
      const m = ua.match(/Mac OS X (\d+([_.]\d+)*)/i);
      if (m) version = m[1].replace(/_/g, ".");
    } else if (/Win(dows )?NT/.test(ua)) {
      os = "Windows";
      const m = ua.match(/Windows NT (\d+\.\d+)/i);
      if (m) {
        const nt = m[1];
        const map = {
          "10.0": "11 / 10",
          "6.3": "8.1",
          "6.2": "8",
          "6.1": "7",
          "6.0": "Vista",
          "5.1": "XP",
        };
        version = map[nt] ? `${map[nt]} (NT ${nt})` : `NT ${nt}`;
      }
    } else if (/CrOS/i.test(ua)) os = "ChromeOS";
    else if (/Linux/i.test(ua)) os = "Linux";

    return version ? `${os} ${version}` : os;
  }

  /* ----------------------------
     📱 Device Detection
  ---------------------------- */
  function detectDevice() {
    const ua = navigator.userAgent;
    if (/iPhone/i.test(ua)) return "iPhone";
    if (/iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1))
      return "iPad";
    if (/Android/i.test(ua)) {
      const match = ua.match(/Android.*?;\s*(.*?)\s*Build\//);
      return match ? match[1].trim() : "Android Device";
    }
    if (/Macintosh/i.test(ua)) return "Mac";
    if (/Windows/i.test(ua)) return "Windows PC";
    return "Unknown Device";
  }

  /* ----------------------------
     🌐 Browser Detection (Fixed)
  ---------------------------- */
  function detectBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes("CriOS")) return "Google Chrome (iOS)";
    if (ua.includes("EdgiOS")) return "Microsoft Edge (iOS)";
    if (ua.includes("FxiOS")) return "Firefox (iOS)";
    if (ua.includes("OPiOS")) return "Opera (iOS)";
    if (ua.includes("Edg")) return "Microsoft Edge";
    if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
    if (ua.includes("Chrome") && !ua.includes("Chromium")) return "Google Chrome";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("Firefox")) return "Firefox";
    return "Unknown Browser";
  }

  /* ----------------------------
     📶 Connection + Resolution
  ---------------------------- */
  function detectConnection() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!navigator.onLine) return "Offline";
    if (!conn) {
      // Safari / iOS fallback
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return "📱 Cellular / Wi-Fi";
      if (/Macintosh/.test(navigator.userAgent)) return "💻 Wi-Fi / Ethernet";
      return "🌐 Connected";
    }
    const eff = conn.effectiveType?.toUpperCase() || "";
    const down = conn.downlink ? `${conn.downlink.toFixed(1)} Mbps` : "";
    return `${eff || "Online"} ${down ? `• ${down}` : ""}`;
  }

  function detectResolution() {
    return `${window.screen.width} × ${window.screen.height}`;
  }

  /* ----------------------------
     🔋 Battery (Hide on Desktops)
  ---------------------------- */
  async function detectBattery() {
    if (!batteryEl) return;
    const ua = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    const isLaptop = /Macintosh|Mac OS X/.test(ua) && navigator.maxTouchPoints > 0;
    const hasBattery = isMobile || isLaptop;

    if (!hasBattery && batteryRow) {
      batteryRow.style.display = "none";
      return;
    }

    if ("getBattery" in navigator) {
      try {
        const battery = await navigator.getBattery();
        const updateBatteryUI = () => {
          const percent = Math.round(battery.level * 100);
          const icon = battery.charging ? "⚡ Charging" : "🔋";
          batteryEl.textContent = `${icon} ${percent}%`;
          if (percent <= 20) batteryEl.style.color = "#ff3b30";
          else if (percent <= 50) batteryEl.style.color = "#ffcc00";
          else batteryEl.style.color = "#34c759";
        };
        updateBatteryUI();
        battery.addEventListener("levelchange", updateBatteryUI);
        battery.addEventListener("chargingchange", updateBatteryUI);
        return;
      } catch {
        batteryEl.textContent = "⚡ Battery Mode";
      }
    } else {
      batteryEl.textContent = isMobile ? "🔋 Battery (Mobile)" : "⚡ Plugged In";
    }
  }

  /* ----------------------------
     🧠 Apply Values
  ---------------------------- */
  function applyValues() {
    if (osEl) osEl.textContent = detectOSVersion();
    if (deviceEl) deviceEl.textContent = detectDevice();
    if (browserEl) browserEl.textContent = detectBrowser();
    if (resolutionEl) resolutionEl.textContent = detectResolution();
    if (connectionEl) connectionEl.textContent = detectConnection();
    detectBattery();

    window.addEventListener("resize", () => {
      if (resolutionEl) resolutionEl.textContent = detectResolution();
    });

    // Live updates for connection
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && "addEventListener" in conn)
      conn.addEventListener("change", () => {
        connectionEl.textContent = detectConnection();
      });

    window.addEventListener("online", () => {
      connectionEl.textContent = detectConnection();
    });
    window.addEventListener("offline", () => {
      connectionEl.textContent = detectConnection();
    });
  }

  applyValues();

  // Fade-in animation
  document.querySelectorAll(".version-value").forEach((el) => {
    el.style.transition = "opacity 0.4s ease";
    requestAnimationFrame(() => (el.style.opacity = "1"));
  });
});
