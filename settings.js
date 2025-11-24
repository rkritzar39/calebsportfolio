/**
 * settings.js
 * Full Settings Manager with live previews, themes, accessibility,
 * custom backgrounds, blur, dark-mode scheduler, in-site notifications,
 * and cross-tab synchronization.
 */

// === UNIVERSAL PUSH NOTIFICATIONS (Firebase Cloud Messaging) ===
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
    console.error("❌ Firebase SDK missing.");
    return;
  }

  const firebaseConfig = {
    apiKey: "AIzaSyCIZ0fri5V1E2si1xXpBPQQJqj1F_KuuG0",
    authDomain: "busarmydudewebsite.firebaseapp.com",
    projectId: "busarmydudewebsite",
    storageBucket: "busarmydudewebsite.firebasestorage.app",
    messagingSenderId: "42980404680",
    appId: "1:42980404680:web:f4f1e54789902a4295e4fd",
    measurementId: "G-DQPH8YL789"
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
      if (permission !== "granted") {
        alert("🚫 Please allow notifications in your browser settings.");
        return;
      }
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const vapidKey = "BKqy5iyBspHj5HoS-bLlMWvIc8F-639K8HWjV3iiqtdnnDDBDUti78CL9RTCiBml16qMRjJ4RqMo9DERbt4C9xc";
      const token = await messaging.getToken({
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        alert("⚠️ Failed to get push token.");
        return;
      }
      console.log("🔑 Push token:", token);
      localStorage.setItem("fcmToken", token);

      registration.showNotification("🎉 Notifications Enabled!", {
        body: "You’ll now receive updates from Caleb’s site.",
        icon: "/favicon-32x32.png",
      });

      messaging.onMessage((payload) => {
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
    if (btn) btn.addEventListener("click", requestPushNotifications);
  });
})();

class SettingsManager {
  constructor() {
    /* =============================
       Defaults
    ============================= */
    this.defaultSettings = {
      // Appearance
      appearanceMode: "device",
      themeStyle: "clear",
      accentColor: "#3ddc84",
      matchSongAccent: "enabled",

      // Scheduler
      darkModeScheduler: "off",
      darkModeStart: "20:00",
      darkModeEnd: "06:00",

      // Typography & a11y
      fontSize: 16,
      focusOutline: "enabled",
      motionEffects: "enabled",
      highContrast: "disabled",
      dyslexiaFont: "disabled",
      underlineLinks: "disabled",

      // Reordering & Visibility
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

      // Accessibility advanced features
      adhdMode: "disabled",
      autismMode: "disabled",
      epilepsySafe: "disabled",
      colorBlindMode: "off",
      readingMask: "disabled",
      reducedMotion: "disabled",
      lowVisionMode: "disabled",
      screenReaderEnhancements: "disabled",
      cognitiveMode: "disabled",
      focusLock: "disabled",
      voiceControl: "disabled",
      uiDensity: "default",
      audioFeedback: "disabled",
    };

    /* =============================
       Instance State
    ============================= */
    this.settings = this.loadSettings();
    this.deviceThemeMedia = null;
    this.schedulerInterval = null;

    /* =============================
       Boot on DOM ready
    ============================= */
    document.addEventListener("DOMContentLoaded", () => {
      this.initializeControls();
      this.applyAllSettings();
      this.setupEventListeners();

      // Feature setup
      this.initMouseTrail();
      this.initLoadingScreen();
      this.initScrollArrow();
      this.initCustomBackgroundControls();
      this.applyCustomBackground(false);
      this.initWallpaperBlurControl();
      this.initSchedulerInterval();
      this.initNotificationSettings();

      // System theme listener
      if (window.matchMedia) {
        this.deviceThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
        this.deviceThemeMedia.addEventListener("change", () => {
          if (this.settings.appearanceMode === "device") {
            this.applyAppearanceMode();
            this.applyCustomBackground(false);
          }
        });
      }

      // Sync listener
      window.addEventListener("storage", (e) => {
        if (e.key === "websiteSettings") {
          this.settings = this.loadSettings();
          this.applyAllSettings();
          this.initializeControls();
          this.applyCustomBackground(false);
          this.toggleScheduleInputs(this.settings.darkModeScheduler);
          this.syncWallpaperUIVisibility();
          this.applyNotificationUI();
        }
        if (["customBackground", "customBackgroundName", "wallpaperBlur"].includes(e.key)) {
          this.applyCustomBackground(false);
          this.initCustomBackgroundControls();
          this.initWallpaperBlurControl();
          this.syncWallpaperUIVisibility();
        }
      });

      if (typeof updateLiveStatus === "function") setTimeout(() => updateLiveStatus(), 500);
      const yearSpan = document.getElementById("year");
      if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    });
  }

  /* =============================
     Load / Save
  ============================= */
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
    if (existing.notifications) toSave.notifications = existing.notifications;
    localStorage.setItem("websiteSettings", JSON.stringify(toSave));
  }

  /* =============================
     UI Setup
  ============================= */
  initializeControls() {
    // 1. Standard Controls
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

    // Scheduler
    const schedulerSelect = document.getElementById("darkModeScheduler");
    const startInput = document.getElementById("darkModeStart");
    const endInput = document.getElementById("darkModeEnd");
    if (schedulerSelect) schedulerSelect.value = this.settings.darkModeScheduler;
    if (startInput) startInput.value = this.settings.darkModeStart;
    if (endInput) endInput.value = this.settings.darkModeEnd;
    this.toggleScheduleInputs(this.settings.darkModeScheduler);

    // 2. Standard "enabled/disabled" Toggles
    const toggles = Object.keys(this.defaultSettings).filter(
      (k) =>
        typeof this.defaultSettings[k] === "string" &&
        (this.defaultSettings[k] === "enabled" || this.defaultSettings[k] === "disabled")
    );
    toggles.forEach((key) => this.setToggle(key));

    // Accessibility Checkboxes
    const mapToggle = (id, key) => {
      const el = document.getElementById(id);
      if (el) el.checked = this.settings[key] === "enabled";
    };
    mapToggle("adhdModeToggle", "adhdMode");
    mapToggle("autismModeToggle", "autismMode");
    mapToggle("epilepsySafeToggle", "epilepsySafe");
    mapToggle("readingMaskToggle", "readingMask");
    mapToggle("lowVisionToggle", "lowVisionMode");
    mapToggle("screenReaderToggle", "screenReaderEnhancements");
    mapToggle("cognitiveModeToggle", "cognitiveMode");
    mapToggle("focusLockToggle", "focusLock");
    mapToggle("voiceControlToggle", "voiceControl");
    mapToggle("audioFeedbackToggle", "audioFeedback");

    const reducedEl = document.getElementById("reducedMotionToggle");
    if (reducedEl) reducedEl.checked = this.settings.reducedMotion === "enabled";

    const colorSelect = document.getElementById("colorBlindModeSelect");
    if (colorSelect) colorSelect.value = this.settings.colorBlindMode || "off";

    const uiDensity = document.getElementById("uiDensitySelect");
    if (uiDensity) uiDensity.value = this.settings.uiDensity || "default";

    this.syncWallpaperUIVisibility();
    this.applyAccessibilityClasses();
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
    if (!active) active = control.querySelector("button");
    if (!active) return;

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

  /* =============================
     Event Listeners
  ============================= */
  setupEventListeners() {
    // --- 1. Rearranging Toggle ---
    const rearrangeToggle = document.getElementById("rearrangingEnabledToggle");
    if (rearrangeToggle) {
      rearrangeToggle.addEventListener("change", (e) => {
        this.settings.rearrangingEnabled = e.target.checked ? "enabled" : "disabled";
        this.applySetting("rearrangingEnabled");
        this.saveSettings();
      });
    }

    // --- 2. Existing Listeners ---
    const appearanceControl = document.getElementById("appearanceModeControl");
    if (appearanceControl) {
      appearanceControl.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn || !btn.dataset.value) return;

        if (this.settings.darkModeScheduler === "auto") {
          alert("Appearance mode is controlled by the Dark Mode Scheduler.");
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
        this.showToast("Accent Sync Updated", e.target.checked ? "Matching Spotify song." : "Using custom color.");
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
      this.settings.darkModeScheduler = e.target.value;
      this.saveSettings();
      this.toggleScheduleInputs(e.target.value);
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
        this.playUiClickSound();
      });
    });

    document.getElementById("resetLayoutBtn")?.addEventListener("click", () => {
      if (confirm("Reset the section layout to default?")) {
        localStorage.removeItem("sectionOrder");
        alert("Layout reset. Refresh homepage to see changes.");
      }
    });
    document.getElementById("resetSectionsBtn")?.addEventListener("click", () => this.resetSectionVisibility());
    document.getElementById("resetSettings")?.addEventListener("click", () => this.resetSettings());

    // Accessibility wiring
    const wireBool = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("change", () => {
        this.settings[key] = el.checked ? "enabled" : "disabled";
        if (key === "reducedMotion") {
          this.settings.motionEffects = el.checked ? "disabled" : "enabled";
        }
        this.applyAccessibilityClasses();
        this.saveSettings();
        this.playUiClickSound();
        if (this.settings.screenReaderEnhancements === "enabled") {
          this.announceForA11y(`${id.replace("Toggle", "")} ${el.checked ? "enabled" : "disabled"}`);
        }
      });
    };
    wireBool("adhdModeToggle", "adhdMode");
    wireBool("autismModeToggle", "autismMode");
    wireBool("epilepsySafeToggle", "epilepsySafe");
    wireBool("readingMaskToggle", "readingMask");
    wireBool("reducedMotionToggle", "reducedMotion");
    wireBool("lowVisionToggle", "lowVisionMode");
    wireBool("screenReaderToggle", "screenReaderEnhancements");
    wireBool("cognitiveModeToggle", "cognitiveMode");
    wireBool("focusLockToggle", "focusLock");
    wireBool("voiceControlToggle", "voiceControl");
    wireBool("audioFeedbackToggle", "audioFeedback");

    const colorSelectEl = document.getElementById("colorBlindModeSelect");
    if (colorSelectEl) {
      colorSelectEl.addEventListener("change", (e) => {
        this.settings.colorBlindMode = e.target.value;
        this.applyAccessibilityClasses();
        this.saveSettings();
      });
    }

    const uiDensityEl = document.getElementById("uiDensitySelect");
    if (uiDensityEl) {
      uiDensityEl.addEventListener("change", (e) => {
        this.settings.uiDensity = e.target.value;
        this.applyAccessibilityClasses();
        this.saveSettings();
      });
    }
  }

  /* =============================
     Apply Settings
  ============================= */
  applyAllSettings() {
    Object.keys(this.settings).forEach((k) => this.applySetting(k));
  }

  applySetting(key) {
    switch (key) {
      case "appearanceMode":
        this.applyAppearanceMode();
        break;
      case "fontSize":
        this.applyFontSize();
        break;
      case "accentColor":
        this.applyAccentColor();
        break;
      case "rearrangingEnabled":
        this.applyRearranging(this.settings.rearrangingEnabled === "enabled");
        break;
      default:
        // Toggles
        break;
    }
  }

  applyAppearanceMode() {
    const dark = this.settings.appearanceMode === "dark" ||
      (this.settings.appearanceMode === "device" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark-mode", dark);
  }

  applyFontSize() {
    document.documentElement.style.setProperty("--base-font-size", `${this.settings.fontSize}px`);
  }

  applyAccentColor() {
    document.documentElement.style.setProperty("--accent-color", this.settings.accentColor);
  }

  /* =============================
     REARRANGING
  ============================= */
  applyRearranging(enabled) {
    const container = document.getElementById("main-sections");
    if (!container) return;

    // Example: simple predefined order if enabled
    const order = enabled
      ? ["quoteSection", "businessSection", "socialLinksSection", "liveActivitySection"]
      : ["businessSection", "quoteSection", "socialLinksSection", "liveActivitySection"];

    order.forEach((id) => {
      const el = document.getElementById(id);
      if (el) container.appendChild(el);
    });
  }

  /* =============================
     Utilities
  ============================= */
  updateSliderFill(slider) {
    if (!slider) return;
    const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(to right, var(--accent-color) ${pct}%, #d3d3d3 ${pct}%)`;
  }

  showToast(title, message) {
    console.log(`[Toast] ${title}: ${message}`);
  }

  playUiClickSound() {}
  announceForA11y(message) {}
  toggleScheduleInputs(value) {}
  checkDarkModeSchedule(force) {}
  initMouseTrail() {}
  initLoadingScreen() {}
  initScrollArrow() {}
  initCustomBackgroundControls() {}
  applyCustomBackground(force) {}
  initWallpaperBlurControl() {}
  initSchedulerInterval() {}
  initNotificationSettings() {}
  syncWallpaperUIVisibility() {}
  applyAccessibilityClasses() {}
  resetSectionVisibility() {}
  resetSettings() {}
}

// Boot
new SettingsManager();
