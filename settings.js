/**
 * settings.js
 * (Fully Expanded Version: Push Notifications, Theme, Background, Scheduler, Controls, and More)
 */

// === UNIVERSAL PUSH NOTIFICATIONS (Firebase Cloud Messaging - NON-MODULE VERSION) ===
(function () {
  console.log("[Push] Initializing universal setup…");

  if (!("serviceWorker" in navigator)) {
    console.warn("❌ Service Workers not supported in this browser.");
    return;
  }

  if (!("Notification" in window)) {
    console.warn("❌ Notifications not supported in this browser.");
    return;
  }

  if (!window.firebase) {
    console.error(
      "❌ Firebase SDK missing. Make sure firebase-app-compat.js and firebase-messaging-compat.js load before settings.js"
    );
    return;
  }

  const firebaseConfig = {
    apiKey: "AIzaSyCIZ0fri5V1E2si1xXpBPQQJqj1F_KuuG0",
    authDomain: "busarmydudewebsite.firebaseapp.com",
    projectId: "busarmydudewebsite",
    storageBucket: "busarmydudewebsite.firebasestorage.app",
    messagingSenderId: "42980404680",
    appId: "1:42980404680:web:f4f1e54789902a4295e4fd",
    measurementId: "G-DQPH8YL789",
  };

  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  } catch (err) {
    console.error("Firebase init failed:", err);
    return;
  }

  const messaging = firebase.messaging();

  async function requestPushNotifications() {
    console.log("[Push] Requesting permission…");

    try {
      const permission = await Notification.requestPermission();
      console.log("[Push] Permission result:", permission);

      if (permission !== "granted") {
        alert(
          "🚫 Please allow notifications in your browser settings to enable push alerts."
        );
        return;
      }

      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );
      console.log("✅ Service worker registered:", registration);

      const vapidKey =
        "BKqy5iyBspHj5HoS-bLlMWvIc8F-639K8HWjV3iiqtdnnDDBDUti78CL9RTCiBml16qMRjJ4RqMo9DERbt4C9xc";

      const token = await messaging.getToken({
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        alert("⚠️ Failed to get push token. Try again later.");
        return;
      }

      console.log("🔑 Push token:", token);
      localStorage.setItem("fcmToken", token);

      registration.showNotification("🎉 Notifications Enabled!", {
        body: "You’ll now receive updates from Caleb’s site.",
        icon: "/favicon-32x32.png",
        badge: "/favicon-32x32.png",
      });

      messaging.onMessage((payload) => {
        console.log("📩 Foreground message received:", payload);
        const { title, body, icon } = payload.notification || {};
        registration.showNotification(title || "Update", {
          body: body || "You’ve got a new message!",
          icon: icon || "/favicon-32x32.png",
        });
      });
    } catch (err) {
      console.error("❌ Push setup failed:", err);
      alert("Push setup failed: " + err.message);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("enablePushNotifications");
    if (btn) {
      console.log("[Push] Enable button found ✅");
      btn.addEventListener("click", requestPushNotifications);
    } else {
      console.warn("[Push] Enable button not found in DOM.");
    }
  });
})();

// =============================
// SettingsManager Class
// =============================
class SettingsManager {
  constructor() {
    this.defaultSettings = {
      appearanceMode: "device",
      themeStyle: "clear",
      accentColor: "#3ddc84",
      matchSongAccent: "enabled",
      darkModeScheduler: "off",
      darkModeStart: "20:00",
      darkModeEnd: "06:00",
      fontSize: 16,
      focusOutline: "enabled",
      motionEffects: "enabled",
      highContrast: "disabled",
      dyslexiaFont: "disabled",
      underlineLinks: "disabled",
      loadingScreen: "disabled",
      mouseTrail: "disabled",
      liveStatus: "disabled",
      rearrangingEnabled: "disabled",
      showSocialLinks: "enabled",
      showPresidentSection: "enabled",
      showTiktokShoutouts: "enabled",
      showInstagramShoutouts: "enabled",
      showYoutubeShoutouts: "enabled",
      showUsefulLinks: "enabled",
      showCountdown: "enabled",
      showBusinessSection: "enabled",
      showTechInformation: "enabled",
      showDisabilitiesSection: "enabled",
      showQuoteSection: "enabled",
      showLiveActivity: "enabled",
    };

    this.settings = this.loadSettings();
    this.deviceThemeMedia = null;
    this.schedulerInterval = null;

    document.addEventListener("DOMContentLoaded", () => {
      this.initializeControls();
      this.applyAllSettings();
      this.setupEventListeners();
      this.initMouseTrail();
      this.initLoadingScreen();
      this.initScrollArrow();
      this.initCustomBackgroundControls();
      this.applyCustomBackground(false);
      this.initWallpaperBlurControl();
      this.initSchedulerInterval();

      if (window.matchMedia) {
        this.deviceThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
        this.deviceThemeMedia.addEventListener("change", () => {
          if (this.settings.appearanceMode === "device") {
            this.applyAppearanceMode();
            this.applyCustomBackground(false);
          }
        });
      }

      if (window.matchMedia) {
        const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
        motionMedia.addEventListener("change", (e) => {
          if (!localStorage.getItem("websiteSettings")) {
            this.settings.motionEffects = e.matches ? "disabled" : "enabled";
            this.applyMotionEffects();
            this.saveSettings();
            this.setToggle("motionEffects");
          }
        });
      }

      window.addEventListener("storage", (e) => {
        if (e.key === "websiteSettings") {
          this.settings = this.loadSettings();
          this.applyAllSettings();
          this.initializeControls();
          this.applyCustomBackground(false);
          this.toggleScheduleInputs(this.settings.darkModeScheduler);
          this.syncWallpaperUIVisibility();
          this.initCustomBackgroundControls();
          this.initWallpaperBlurControl();
          this.applyNotificationUI();
        }

        if (
          e.key === "customBackground" ||
          e.key === "customBackgroundName" ||
          e.key === "wallpaperBlur"
        ) {
          this.applyCustomBackground(false);
          this.initCustomBackgroundControls();
          this.initWallpaperBlurControl();
          this.syncWallpaperUIVisibility();
        }
      });

      if (typeof updateLiveStatus === "function") {
        setTimeout(() => updateLiveStatus(), 500);
      }

      const yearSpan = document.getElementById("year");
      if (yearSpan) yearSpan.textContent = new Date().getFullYear();

      this.initNotificationSettings();
    });
  }

  // =============================
  // Load/Save
  // =============================
  loadSettings() {
    try {
      const stored = localStorage.getItem("websiteSettings");
      const loaded = stored ? JSON.parse(stored) : {};
      return { ...this.defaultSettings, ...loaded };
    } catch {
      return { ...this.defaultSettings };
    }
  }

  saveSettings() {
    const toSave = {};
    for (const key in this.defaultSettings) {
      if (Object.prototype.hasOwnProperty.call(this.settings, key)) {
        toSave[key] = this.settings[key];
      }
    }
    const existing = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
    if (existing.notifications) {
      toSave.notifications = existing.notifications;
    }
    localStorage.setItem("websiteSettings", JSON.stringify(toSave));
  }

  // =============================
  // Controls
  // =============================
  initializeControls() {
    this.initSegmentedControl("appearanceModeControl", this.settings.appearanceMode);
    this.updateSegmentedBackground("appearanceModeControl");

    const accentPicker = document.getElementById("accentColorPicker");
    if (accentPicker) {
      accentPicker.value = this.settings.accentColor;
      this.checkAccentColor(this.settings.accentColor);
    }

    const matchToggle = document.getElementById("matchSongAccentToggle");
    if (matchToggle) matchToggle.checked = this.settings.matchSongAccent === "enabled";

    const slider = document.getElementById("text-size-slider");
    const badge = document.getElementById("textSizeValue");
    if (slider && badge) {
      slider.value = this.settings.fontSize;
      badge.textContent = `${this.settings.fontSize}px`;
      this.updateSliderFill(slider);
    }

    const schedulerSelect = document.getElementById("darkModeScheduler");
    const startInput = document.getElementById("darkModeStart");
    const endInput = document.getElementById("darkModeEnd");
    if (schedulerSelect) schedulerSelect.value = this.settings.darkModeScheduler;
    if (startInput) startInput.value = this.settings.darkModeStart;
    if (endInput) endInput.value = this.settings.darkModeEnd;
    this.toggleScheduleInputs(this.settings.darkModeScheduler);

    const toggles = Object.keys(this.defaultSettings).filter(
      (k) =>
        typeof this.defaultSettings[k] === "string" &&
        (this.defaultSettings[k] === "enabled" || this.defaultSettings[k] === "disabled")
    );
    toggles.forEach((key) => this.setToggle(key));

    this.syncWallpaperUIVisibility();
  }

  initSegmentedControl(controlId, value) {
    const control = document.getElementById(controlId);
    if (!control) return;
    let foundActive = false;
    control.querySelectorAll("button").forEach((btn) => {
      const isActive = btn.dataset.value === value;
      btn.classList.toggle("active", isActive);
      if (isActive) foundActive = true;
    });
    if (!foundActive) {
      const firstBtn = control.querySelector("button");
      if (firstBtn) firstBtn.classList.add("active");
    }
  }

  updateSegmentedBackground(controlId) {
    const control = document.getElementById(controlId);
    if (!control) return;
    let active = control.querySelector("button.active");
    if (!active) {
      active = control.querySelector("button");
      if (active) active.classList.add("active");
      else return;
    }
    let bg = control.querySelector(".seg-bg");
    if (!bg) {
      bg = document.createElement("div");
      bg.className = "seg-bg";
      control.prepend(bg);
    }
    bg.style.left = `${active.offsetLeft}px`;
    bg.style.width = `${active.offsetWidth}px`;
  }

  setToggle(key) {
    const el = document.getElementById(`${key}Toggle`);
    if (el) el.checked = this.settings[key] === "enabled";
  }

  // =============================
  // Event Listeners
  // =============================
  setupEventListeners() {
    const appearanceControl = document.getElementById("appearanceModeControl");
    if (appearanceControl) {
      appearanceControl.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn || !btn.dataset.value) return;

        if (this.settings.darkModeScheduler === "auto") {
          alert(
            "Appearance mode is controlled by the Scheduler. Disable it to make manual changes."
          );
          this.initSegmentedControl("appearanceModeControl", this.settings.appearanceMode);
          this.updateSegmentedBackground("appearanceModeControl");
          return;
        }

        this.settings.appearanceMode = btn.dataset.value;
        this.applySetting("appearanceMode");
        this.saveSettings();

        appearanceControl.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.updateSegmentedBackground("appearanceModeControl");
        this.applyCustomBackground(false);
      });
    }

    const accentPicker = document.getElementById("accentColorPicker");
    if (accentPicker) {
      accentPicker.addEventListener("input", (e) => {
        this.settings.accentColor = e.target.value;
        this.applyAccentColor();
        this.saveSettings();
        this.updateSliderFill(document.getElementById("text-size-slider"));
        this.updateSliderFill(document.getElementById("blur-slider"));
      });
    }

    const matchToggle = document.getElementById("matchSongAccentToggle");
    if (matchToggle) {
      matchToggle.addEventListener("change", (e) => {
        this.settings.matchSongAccent = e.target.checked ? "enabled" : "disabled";
        this.saveSettings();
        this.showToast(
          "Accent Sync Updated",
          e.target.checked
            ? "Accent color will now match your current Spotify song."
            : "Accent color will use your custom color only."
        );
      });
    }

    const slider = document.getElementById("text-size-slider");
    if (slider) {
      slider.addEventListener("input", (e) => {
        this.settings.fontSize = parseInt(e.target.value, 10);
        this.applyFontSize();
        this.updateSliderFill(slider);
        const badge = document.getElementById("textSizeValue");
        if (badge) badge.textContent = `${this.settings.fontSize}px`;
        this.saveSettings();
      });
    }

    const schedulerSelect = document.getElementById("darkModeScheduler");
    const startInput = document.getElementById("darkModeStart");
    const endInput = document.getElementById("darkModeEnd");

    schedulerSelect?.addEventListener("change", (e) => {
      const val = e.target.value;
      this.settings.darkModeScheduler = val;
      this.saveSettings();
      this.toggleScheduleInputs(val);
      this.checkDarkModeSchedule(true);
    });

    startInput?.addEventListener("change", (e) => {
      this.settings.darkModeStart = e.target.value;
      this.saveSettings();
      this.checkDarkModeSchedule(true);
    });

    endInput?.addEventListener("change", (e) => {
      this.settings.darkModeEnd = e.target.value;
      this.saveSettings();
      this.checkDarkModeSchedule(true);
    });

    const toggleKeys = Object.keys(this.defaultSettings).filter(
      (k) =>
        typeof this.defaultSettings[k] === "string" &&
        (this.defaultSettings[k] === "enabled" || this.defaultSettings[k] === "disabled")
    );
    toggleKeys.forEach((key) => {
      const el = document.getElementById(`${key}Toggle`);
      if (!el) return;
      el.addEventListener("change", () => {
        this.settings[key] = el.checked ? "enabled" : "disabled";
        this.applySetting(key);
        this.saveSettings();
        if (key === "showLiveActivity" && typeof updateLiveStatus === "function") {
          setTimeout(() => updateLiveStatus(), 300);
        }
      });
    });

    document.getElementById("resetLayoutBtn")?.addEventListener("click", () => {
      if (confirm("Reset the section layout to default?")) {
        localStorage.removeItem("sectionOrder");
        alert("Layout reset. Refresh homepage to see changes.");
      }
    });

    document.getElementById("resetSectionsBtn")?.addEventListener("click", () =>
      this.resetSectionVisibility()
    );

    document.getElementById("resetSettings")?.addEventListener("click", () =>
      this.resetSettings()
    );
  }

  // =============================
  // Appearance & Theme
  // =============================
  setThemeClasses(isDark) {
    document.documentElement.classList.toggle("dark-mode", isDark);
    document.documentElement.classList.toggle("light-mode", !isDark);
    document.body.classList.toggle("dark-mode", isDark);
    document.body.classList.toggle("light-e", !isDark);
  }

  applyAppearanceMode() {
    const isDark =
      this.settings.appearanceMode === "dark" ||
      (this.settings.appearanceMode === "device" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    this.setThemeClasses(isDark);
    this.applyAccentColor();
  }

  applyAccentColor() {
    const accent = this.settings.accentColor;
    const contrast = this.getContrastColor(accent);

    document.documentElement.style.setProperty("--accent-color", accent);
    document.documentElement.style.setProperty("--accent-text-color", contrast);
    document.body.style.setProperty("--accent-color", accent);
    document.body.style.setProperty("--accent-text-color", contrast);

    const preview = document.getElementById("accentColorPreview");
    if (preview) preview.style.backgroundColor = accent;

    this.checkAccentColor(accent);
  }

  applyFontSize() {
    document.documentElement.style.setProperty(
      "--font-size-base",
      `${this.settings.fontSize}px`
    );
  }

  applyMotionEffects() {
    const reduced = this.settings.motionEffects === "disabled";
    document.body.classList.toggle("reduced-motion", reduced);
  }

  updateSliderFill(slider) {
    if (!slider) return;
    const min = slider.min || 0;
    const max = slider.max || 100;
    const val = slider.value;
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.setProperty("--_fill", `${pct}%`);
  }

  getContrastColor(hex) {
    if (!hex) return "#fff";
    hex = hex.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16),
      g = parseInt(hex.substr(2, 2), 16),
      b = parseInt(hex.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000" : "#fff";
  }

  checkAccentColor(hex) {
    const warn = document.getElementById("whiteAccentWarning");
    if (!warn) return;
    const isLight =
      this.settings.appearanceMode === "light" ||
      (this.settings.appearanceMode === "device" &&
        !window.matchMedia("(prefers-color-scheme: dark)").matches);
    const r = parseInt(hex.substr(1, 2), 16),
      g = parseInt(hex.substr(3, 2), 16),
      b = parseInt(hex.substr(5, 2), 16);
    const isLightColor = r > 240 && g > 240 && b > 240;
    warn.style.display = isLight && isLightColor ? "block" : "none";
  }

  // =============================
  // Scheduler
  // =============================
  toggleScheduleInputs(val) {
    const start = document.getElementById("darkModeStart");
    const end = document.getElementById("darkModeEnd");
    if (!start || !end) return;
    const disabled = val !== "auto";
    start.disabled = disabled;
    end.disabled = disabled;
  }

  checkDarkModeSchedule(fromInterval = false) {
    if (this.settings.darkModeScheduler !== "auto") return;
    const now = new Date();
    const [startH, startM] = this.settings.darkModeStart.split(":").map(Number);
    const [endH, endM] = this.settings.darkModeEnd.split(":").map(Number);

    const start = new Date();
    start.setHours(startH, startM, 0, 0);
    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    const isDark =
      start < end ? now >= start && now <= end : now >= start || now <= end;

    this.settings.appearanceMode = isDark ? "dark" : "light";
    this.applyAppearanceMode();
    if (!fromInterval) this.saveSettings();
  }

  initSchedulerInterval() {
    this.schedulerInterval = setInterval(() => this.checkDarkModeSchedule(true), 30000);
  }

  // =============================
  // Notifications UI
  // =============================
  initNotificationSettings() {
    const saved = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
    if (saved.notifications && saved.notifications.enabled) {
      const toggle = document.getElementById("pushNotificationToggle");
      if (toggle) toggle.checked = true;
    }
  }

  applyNotificationUI() {
    const saved = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
    const toggle = document.getElementById("pushNotificationToggle");
    if (toggle) toggle.checked = saved.notifications?.enabled || false;
  }

  // =============================
  // Toasts
  // =============================
  showToast(title, msg, duration = 3000) {
    const t = document.createElement("div");
    t.className = "toast-message";
    t.innerHTML = `<strong>${title}</strong><br>${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add("visible"), 50);
    setTimeout(() => t.classList.remove("visible"), duration);
    setTimeout(() => t.remove(), duration + 500);
  }

  // =============================
  // Layout & Sections
  // =============================
  resetSectionVisibility() {
    if (confirm("Reset section visibility to default?")) {
      localStorage.removeItem("websiteSettings");
      this.showToast("Sections Reset", "All section visibility settings have been reset.");
      location.reload();
    }
  }

  resetSettings() {
    if (confirm("Reset ALL website settings to default?")) {
      localStorage.removeItem("websiteSettings");
      location.reload();
    }
  }

  // =============================
  // Custom Backgrounds
  // =============================
  applyCustomBackground(applyBlur = true) {
    const url = localStorage.getItem("customBackground");
    if (!url) {
      document.body.style.backgroundImage = "";
      return;
    }
    document.body.style.backgroundImage = `url('${url}')`;
    if (applyBlur) {
      const blurVal = parseInt(localStorage.getItem("wallpaperBlur") || 0, 10);
      document.body.style.backdropFilter = `blur(${blurVal}px)`;
    }
  }

  initCustomBackgroundControls() {
    const fileInput = document.getElementById("customBackgroundInput");
    const removeBtn = document.getElementById("removeCustomBackground");

    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          localStorage.setItem("customBackground", ev.target.result);
          localStorage.setItem("customBackgroundName", file.name);
          this.applyCustomBackground(true);
        };
        reader.readAsDataURL(file);
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        localStorage.removeItem("customBackground");
        localStorage.removeItem("customBackgroundName");
        this.applyCustomBackground(false);
      });
    }
  }

  syncWallpaperUIVisibility() {
    const container = document.getElementById("customBackgroundControls");
    if (!container) return;
    const hasBg = !!localStorage.getItem("customBackground");
    container.style.display = hasBg ? "block" : "none";
  }

  initWallpaperBlurControl() {
    const slider = document.getElementById("blur-slider");
    if (!slider) return;
    slider.value = localStorage.getItem("wallpaperBlur") || 0;
    slider.addEventListener("input", (e) => {
      const val = e.target.value;
      localStorage.setItem("wallpaperBlur", val);
      this.applyCustomBackground(true);
    });
  }

  // =============================
  // Extras: Loading & Mouse Trail
  // =============================
  initLoadingScreen() {
    if (this.settings.loadingScreen === "enabled") {
      const loader = document.getElementById("loadingScreen");
      if (!loader) return;
      loader.style.display = "block";
      window.addEventListener("load", () => {
        loader.style.opacity = "0";
        setTimeout(() => (loader.style.display = "none"), 500);
      });
    }
  }

  initMouseTrail() {
    if (this.settings.mouseTrail !== "enabled") return;
    document.addEventListener("mousemove", (e) => {
      const trail = document.createElement("div");
      trail.className = "mouse-trail";
      trail.style.left = e.pageX + "px";
      trail.style.top = e.pageY + "px";
      document.body.appendChild(trail);
      setTimeout(() => trail.remove(), 500);
    });
  }

  initScrollArrow() {
    const arrow = document.getElementById("scrollArrow");
    if (!arrow) return;
    window.addEventListener("scroll", () => {
      arrow.style.opacity = window.scrollY > 200 ? "1" : "0";
    });
  }
}

// Instantiate once
window.settingsManager = new SettingsManager();
