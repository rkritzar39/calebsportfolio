/**
 * settings.js
 * Full Settings Manager with live previews, themes, accessibility,
 * custom backgrounds, blur, dark-mode scheduler, in-site notifications,
 * and cross-tab synchronization.
 *
 * Plug directly into your existing settings.html.
 */

// === UNIVERSAL PUSH NOTIFICATIONS (Firebase Cloud Messaging - NON-MODULE VERSION) ===
(function () {
  console.log("[Push] Initializing universal setup…");

  // --- 1️⃣ Check for browser support ---
  if (!("serviceWorker" in navigator)) {
    console.warn("❌ Service Workers not supported in this browser.");
    return;
  }

  if (!("Notification" in window)) {
    console.warn("❌ Notifications not supported in this browser.");
    return;
  }

  // --- 2️⃣ Ensure Firebase is loaded first ---
  if (!window.firebase) {
    console.error("❌ Firebase SDK missing. Make sure firebase-app-compat.js and firebase-messaging-compat.js load before settings.js");
    return;
  }

  // --- 3️⃣ Initialize Firebase ---
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

  // --- 4️⃣ Define request function ---
  async function requestPushNotifications() {
    console.log("[Push] Requesting permission…");

    try {
      // Ask for permission
      const permission = await Notification.requestPermission();
      console.log("[Push] Permission result:", permission);

      if (permission !== "granted") {
        alert("🚫 Please allow notifications in your browser settings to enable push alerts.");
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      console.log("✅ Service worker registered:", registration);

      // Get FCM token
      const vapidKey = "BKqy5iyBspHj5HoS-bLlMWvIc8F-639K8HWjV3iiqtdnnDDBDUti78CL9RTCiBml16qMRjJ4RqMo9DERbt4C9xc";
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

      // Show a quick test notification
      registration.showNotification("🎉 Notifications Enabled!", {
        body: "You’ll now receive updates from Caleb’s site.",
        icon: "/favicon-32x32.png",
        badge: "/favicon-32x32.png",
      });

      // Listen for foreground messages
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

  // --- 5️⃣ Attach button event listener ---
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

class SettingsManager {
  constructor() {
    /* =============================
       Defaults
    ============================= */
    this.defaultSettings = {
      // Appearance
      appearanceMode: "device",   // "device" | "light" | "dark"
      themeStyle: "clear",
      accentColor: "#3ddc84",
      matchSongAccent: "enabled",

      // Scheduler
      darkModeScheduler: "off",   // "off" | "auto"
      darkModeStart: "20:00",
      darkModeEnd: "06:00",

      // Typography & a11y
      fontSize: 16,
      focusOutline: "enabled",    // enabled | disabled
      motionEffects: "enabled",   // enabled | disabled
      highContrast: "disabled",   // enabled | disabled
      dyslexiaFont: "disabled",   // enabled | disabled
      underlineLinks: "disabled", // enabled | disabled

      // Fun / perf
      loadingScreen: "disabled",  // enabled | disabled
      mouseTrail: "disabled",     // enabled | disabled
      liveStatus: "disabled",     // enabled | disabled

      // Reordering
      rearrangingEnabled: "disabled",

      // Homepage sections visibility
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

      // Accessibility advanced features (new)
      adhdMode: "disabled",
      autismMode: "disabled",
      epilepsySafe: "disabled",
      colorBlindMode: "off",          // off | deuteranopia | protanopia | tritanopia | achromatopsia
      readingMask: "disabled",
      reducedMotion: "disabled",      // maps to motionEffects
      lowVisionMode: "disabled",
      screenReaderEnhancements: "disabled",
      cognitiveMode: "disabled",
      focusLock: "disabled",
      voiceControl: "disabled",
      uiDensity: "default",           // default | compact | comfortable | spacious
      audioFeedback: "disabled",

      // Local-only notifications container (persisted under websiteSettings.notifications)
      // (kept separate so defaultSettings stays stable)
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
      // Initial UI + Settings
      this.initializeControls();
      this.applyAllSettings();
      this.setupEventListeners();

      // Feature setup
      this.initMouseTrail();
      this.initLoadingScreen();
      this.initScrollArrow();

      // Wallpaper
      this.initCustomBackgroundControls();
      this.applyCustomBackground(false);
      this.initWallpaperBlurControl();

      // Scheduler
      this.initSchedulerInterval();

      // System theme listener (for "device" mode)
      if (window.matchMedia) {
        this.deviceThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
        this.deviceThemeMedia.addEventListener("change", () => {
          if (this.settings.appearanceMode === "device") {
            this.applyAppearanceMode();
            this.applyCustomBackground(false);
          }
        });
      }

      // Reduced-motion listener (only seeds if no stored settings)
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

      // Cross-tab synchronization
      window.addEventListener("storage", (e) => {
        // Entire settings changed
        if (e.key === "websiteSettings") {
          this.settings = this.loadSettings();
          this.applyAllSettings();
          this.initializeControls();
          this.applyCustomBackground(false);
          this.toggleScheduleInputs(this.settings.darkModeScheduler);
          this.syncWallpaperUIVisibility();

          // Ensure background controls reflect latest
          this.initCustomBackgroundControls();
          this.initWallpaperBlurControl();

          // Keep Notifications UI synced
          this.applyNotificationUI();
        }

        // Direct bg/blur change sync
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

      // Live Activity (if provided globally)
      if (typeof updateLiveStatus === "function") {
        setTimeout(() => updateLiveStatus(), 500);
      }

      // Footer year helper
      const yearSpan = document.getElementById("year");
      if (yearSpan) yearSpan.textContent = new Date().getFullYear();

      // In-site notifications (no push)
      this.initNotificationSettings();
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
    // Preserve notifications payload if present
    const existing = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
    if (existing.notifications) {
      toSave.notifications = existing.notifications;
    }
    localStorage.setItem("websiteSettings", JSON.stringify(toSave));
  }

  /* =============================
     UI Setup
  ============================= */
  initializeControls() {
    // Segmented appearance control
    this.initSegmentedControl("appearanceModeControl", this.settings.appearanceMode);
    this.updateSegmentedBackground("appearanceModeControl");

    // Accent color
    const accentPicker = document.getElementById("accentColorPicker");
    if (accentPicker) {
      accentPicker.value = this.settings.accentColor;
      this.checkAccentColor(this.settings.accentColor);
    }

    // 🎵 Match Song Accent toggle
    const matchToggle = document.getElementById("matchSongAccentToggle");
    if (matchToggle) matchToggle.checked = this.settings.matchSongAccent === "enabled";

    // Text size
    const slider = document.getElementById("text-size-slider");
    const badge = document.getElementById("textSizeValue");
    if (slider && badge) {
      slider.value = this.settings.fontSize;
      badge.textContent = `${this.settings.fontSize}px`;
      this.updateSliderFill(slider);
    }

    // Scheduler values
    const schedulerSelect = document.getElementById("darkModeScheduler");
    const startInput = document.getElementById("darkModeStart");
    const endInput = document.getElementById("darkModeEnd");
    if (schedulerSelect) schedulerSelect.value = this.settings.darkModeScheduler;
    if (startInput) startInput.value = this.settings.darkModeStart;
    if (endInput) endInput.value = this.settings.darkModeEnd;
    this.toggleScheduleInputs(this.settings.darkModeScheduler);

    // Boolean toggles (enabled/disabled)
    const toggles = Object.keys(this.defaultSettings).filter(
      (k) =>
        typeof this.defaultSettings[k] === "string" &&
        (this.defaultSettings[k] === "enabled" ||
          this.defaultSettings[k] === "disabled")
    );
    toggles.forEach((key) => this.setToggle(key));

    // Wallpaper UI visibility
    this.syncWallpaperUIVisibility();

    /* ------------- Accessibility controls init ------------- */
    // Map simple boolean toggles to checkboxes (IDs must match)
    const mapToggle = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.checked = this.settings[key] === "enabled";
    };

    mapToggle("adhdModeToggle", "adhdMode");
    mapToggle("autismModeToggle", "autismMode");
    mapToggle("epilepsySafeToggle", "epilepsySafe");
    mapToggle("readingMaskToggle", "readingMask");
    // reducedMotion toggle may already exist in UI but we support it here
    const reducedEl = document.getElementById("reducedMotionToggle");
    if (reducedEl) reducedEl.checked = this.settings.reducedMotion === "enabled";

    mapToggle("lowVisionToggle", "lowVisionMode");
    mapToggle("screenReaderToggle", "screenReaderEnhancements");
    mapToggle("cognitiveModeToggle", "cognitiveMode");
    mapToggle("focusLockToggle", "focusLock");
    mapToggle("voiceControlToggle", "voiceControl");
    mapToggle("audioFeedbackToggle", "audioFeedback");

    // selects
    const colorSelect = document.getElementById("colorBlindModeSelect");
    if (colorSelect) colorSelect.value = this.settings.colorBlindMode || "off";

    const uiDensity = document.getElementById("uiDensitySelect");
    if (uiDensity) uiDensity.value = this.settings.uiDensity || "default";

    // Apply classes to page based on accessibility settings
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

  /* =============================
     Event Listeners
  ============================= */
  setupEventListeners() {
    // Appearance segmented control
    const appearanceControl = document.getElementById("appearanceModeControl");
    if (appearanceControl) {
      appearanceControl.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn || !btn.dataset.value) return;

        if (this.settings.darkModeScheduler === "auto") {
          alert(
            "Appearance mode is controlled by the Dark Mode Scheduler. Disable it to make manual changes."
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

    // Accent color
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

    // 🎵 Match Song Accent listener
    const matchToggle = document.getElementById("matchSongAccentToggle");
    if (matchToggle) {
      matchToggle.addEventListener("change", (e) => {
        this.settings.matchSongAccent = e.target.checked ? "enabled" : "disabled";
        this.saveSettings();

        // Optional feedback
        this.showToast(
          "Accent Sync Updated",
          e.target.checked
            ? "Accent color will now match your current Spotify song."
            : "Accent color will use your custom color only."
        );
      });
    }

    // Text size
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

    // Scheduler selects
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

    // All boolean toggles (existing wiring)
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

        // Live Activity hook
        if (key === "showLiveActivity" && typeof updateLiveStatus === "function") {
          setTimeout(() => updateLiveStatus(), 300);
        }

        // play click sound if audio feedback is enabled
        this.playUiClickSound();
      });
    });

    // Resets
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

    /* ------------------------------
       Accessibility: wiring (new)
       ------------------------------ */
    // Accessibility toggle wiring helper
    const wireBool = (id, key, onChangeExtra) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("change", (ev) => {
        this.settings[key] = el.checked ? "enabled" : "disabled";
        // Keep reducedMotion and motionEffects in sync
        if (key === "reducedMotion") {
          this.settings.motionEffects = el.checked ? "disabled" : "enabled";
        }
        this.applyAccessibilityClasses();
        this.saveSettings();
        if (onChangeExtra) onChangeExtra(ev);
        this.playUiClickSound();
        // Announce change for screen readers if enhancements enabled
        if (this.settings.screenReaderEnhancements === "enabled") {
          const nice = id.replace(/([A-Z])/g, " $1").replace("Toggle", "");
          this.announceForA11y(`${nice} ${el.checked ? "enabled" : "disabled"}`);
        }
      });
    };

    // wire all
    wireBool("adhdModeToggle", "adhdMode");
    wireBool("autismModeToggle", "autismMode");
    wireBool("epilepsySafeToggle", "epilepsySafe");
    wireBool("readingMaskToggle", "readingMask");
    wireBool("reducedMotionToggle", "reducedMotion");
    wireBool("lowVisionToggle", "lowVisionMode");
    wireBool("screenReaderToggle", "screenReaderEnhancements");
    wireBool("cognitiveModeToggle", "cognitiveMode");
    wireBool("focusLockToggle", "focusLock");
    wireBool("voiceControlToggle", "voiceControl", (ev) => {
      // small user prompt when enabling voice
      if (ev.target.checked) this.showToast("Voice", "Voice commands enabled — say 'dark mode', 'increase text', or 'home'.");
    });
    wireBool("audioFeedbackToggle", "audioFeedback");

    // selects
    const colorSelectEl = document.getElementById("colorBlindModeSelect");
    if (colorSelectEl) {
      colorSelectEl.addEventListener("change", (e) => {
        this.settings.colorBlindMode = e.target.value;
        this.applyAccessibilityClasses();
        this.saveSettings();
        this.playUiClickSound();
      });
    }

    const uiDensityEl = document.getElementById("uiDensitySelect");
    if (uiDensityEl) {
      uiDensityEl.addEventListener("change", (e) => {
        this.settings.uiDensity = e.target.value;
        this.applyAccessibilityClasses();
        this.saveSettings();
        this.playUiClickSound();
      });
    }
  }

  /* =============================
     Appearance & Theme
  ============================= */
  // Fix: consistent theme classes across pages (esp. settings page)
  setThemeClasses(isDark) {
    // These control the flicker script and page theme
    document.documentElement.classList.toggle("dark-mode", isDark);
    document.documentElement.classList.toggle("light-mode", !isDark);

    // Site themes (two CSS stacks)
    document.body.classList.toggle("dark-mode", isDark); // e.g. settings.css
    document.body.classList.toggle("light-e", !isDark);  // e.g. style.css

    // Important: on the settings page, avoid mixing "light-e"
    if (document.body.classList.contains("settings-page")) {
      if (!isDark) {
        // We’re in light mode on settings page — keep it clean
        document.body.classList.remove("light-e");
      }
    }
  }

  applyAppearanceMode() {
    const isDark =
      this.settings.appearanceMode === "dark" ||
      (this.settings.appearanceMode === "device" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    this.setThemeClasses(isDark);
    this.checkAccentColor(this.settings.accentColor);
  }

  applyAccentColor() {
    const accent = this.settings.accentColor;
    const contrast = this.getContrastColor(accent);
    document.documentElement.style.setProperty("--accent-color", accent);
    document.documentElement.style.setProperty("--accent-text-color", contrast);

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
    warn.style.display = isLightColor && isLight ? "block" : "none";
  }

  /* =============================
     Custom Background & Blur
  ============================= */
  ensureWallpaperLayers() {
    let layer = document.getElementById("wallpaper-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "wallpaper-layer";
      Object.assign(layer.style, {
        position: "fixed",
        inset: "0",
        zIndex: "-1",
        pointerEvents: "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        transition: "opacity 1.2s ease, filter 0.3s ease",
        opacity: "0",
      });
      document.body.prepend(layer);
    }

    let tint = document.getElementById("wallpaper-tint");
    if (!tint) {
      tint = document.createElement("div");
      tint.id = "wallpaper-tint";
      Object.assign(tint.style, {
        position: "fixed",
        inset: "0",
        zIndex: "-1",
        pointerEvents: "none",
        background: "transparent",
        transition: "background 0.5s ease",
      });
      document.body.prepend(tint);
    }
    return { layer, tint };
  }

  initCustomBackgroundControls() {
    const upload = document.getElementById("customBgUpload");
    const remove = document.getElementById("removeCustomBg");
    const fileNameDisplay = document.getElementById("fileNameDisplay");
    const previewContainer = document.getElementById("customBgPreviewContainer");
    const previewImage = document.getElementById("customBgPreview");
    const separator = document.getElementById("customBgSeparator");

    if (!upload || !previewContainer || !previewImage) return;

    // Restore saved background
    const savedBg = localStorage.getItem("customBackground");
    const savedName = localStorage.getItem("customBackgroundName");
    const savedBlur = localStorage.getItem("wallpaperBlur") ?? "0";

    if (savedBg) {
      if (fileNameDisplay) fileNameDisplay.textContent = savedName || "Saved background";
      if (remove) remove.style.display = "inline-block";

      this.toggleWallpaperBlurCard(true);
      previewContainer.classList.add("visible");
      previewImage.src = savedBg;
      previewImage.onload = () => previewImage.classList.add("loaded");

      if (separator) separator.classList.add("visible");
      this.applyWallpaperBlur(savedBlur);

      const blurSlider = document.getElementById("blur-slider");
      const blurBadge = document.getElementById("blurValue");
      if (blurSlider && blurBadge) {
        blurSlider.value = savedBlur;
        blurBadge.textContent = `${savedBlur}px`;
      }
    } else {
      this.toggleWallpaperBlurCard(false);
      if (separator) separator.classList.remove("visible");
    }

    // Upload a new file
    upload.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (fileNameDisplay) fileNameDisplay.textContent = file.name;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const imageData = evt.target.result;
        localStorage.setItem("customBackground", imageData);
        localStorage.setItem("customBackgroundName", file.name);

        const blurSlider = document.getElementById("blur-slider");
        const blurValue = blurSlider ? blurSlider.value : localStorage.getItem("wallpaperBlur") || "0";
        localStorage.setItem("wallpaperBlur", blurValue);

        this.applyCustomBackground(true);
        this.applyWallpaperBlur(blurValue);

        const blurBadge = document.getElementById("blurValue");
        if (blurBadge) blurBadge.textContent = `${blurValue}px`;

        if (remove) remove.style.display = "inline-block";
        this.toggleWallpaperBlurCard(true);

        previewContainer.classList.add("visible");
        previewImage.classList.remove("loaded");
        previewImage.src = imageData;
        previewImage.onload = () => previewImage.classList.add("loaded");
        if (separator) separator.classList.add("visible");
      };
      reader.readAsDataURL(file);
    });

    // Remove custom background
    if (remove) {
      remove.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("customBackground");
        localStorage.removeItem("customBackgroundName");
        localStorage.removeItem("wallpaperBlur");

        const layer = document.getElementById("wallpaper-layer");
        if (layer) {
          layer.style.backgroundImage = "";
          layer.style.opacity = "0";
        }

        this.applyCustomBackground(false);
        this.toggleWallpaperBlurCard(false);

        if (fileNameDisplay) fileNameDisplay.textContent = "No file chosen";
        remove.style.display = "none";

        previewContainer.classList.remove("visible");
        previewImage.classList.remove("loaded");
        previewImage.src = "";
        if (separator) separator.classList.remove("visible");

        const blurSlider = document.getElementById("blur-slider");
        const blurBadge = document.getElementById("blurValue");
        if (blurSlider && blurBadge) {
          blurSlider.value = 0;
          blurBadge.textContent = "0px";
        }
      });
    }
  }

  applyCustomBackground(fade = false) {
    const bg = localStorage.getItem("customBackground");
    const { layer, tint } = this.ensureWallpaperLayers();

    if (bg) {
      document.body.style.backgroundColor = "transparent";
      document.body.style.backgroundImage = "";
      if (fade) {
        layer.style.opacity = "0";
        requestAnimationFrame(() => {
          layer.style.backgroundImage = `url("${bg}")`;
          setTimeout(() => (layer.style.opacity = "1"), 50);
        });
      } else {
        layer.style.backgroundImage = `url("${bg}")`;
        layer.style.opacity = "1";
      }
    } else {
      document.body.style.backgroundColor = "";
      document.body.style.backgroundImage = "";
      layer.style.backgroundImage = "";
      layer.style.opacity = "0";
    }

    // Tint based on theme
    const isDark =
      this.settings.appearanceMode === "dark" ||
      (this.settings.appearanceMode === "device" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    tint.style.background = isDark
      ? "rgba(0, 0, 0, 0.45)"
      : "rgba(255, 255, 255, 0.15)";

    // Ensure blur applied
    const blurValue = localStorage.getItem("wallpaperBlur") ?? "0";
    this.applyWallpaperBlur(blurValue);
  }

  applyWallpaperBlur(value) {
    const layer = document.getElementById("wallpaper-layer");
    if (!layer) return;
    const blurAmount = parseInt(value, 10) || 0;
    layer.style.filter = `blur(${blurAmount}px) brightness(1.03)`;
  }

  initWallpaperBlurControl() {
    const slider = document.getElementById("blur-slider");
    const badge = document.getElementById("blurValue");
    if (!slider || !badge) return;

    const stored = localStorage.getItem("wallpaperBlur") ?? "0";
    slider.value = stored;
    badge.textContent = `${stored}px`;
    this.applyWallpaperBlur(stored);
    this.updateSliderFill(slider);

    slider.addEventListener("input", (e) => {
      const val = e.target.value;
      badge.textContent = `${val}px`;
      localStorage.setItem("wallpaperBlur", val);
      this.applyWallpaperBlur(val);
      this.updateSliderFill(slider);
    });
  }

  toggleWallpaperBlurCard(show) {
    const card = document.getElementById("wallpaperBlurCard");
    if (!card) return;
    card.style.display = show ? "" : "none";
  }

  syncWallpaperUIVisibility() {
    const hasBg = !!localStorage.getItem("customBackground");
    this.toggleWallpaperBlurCard(hasBg);
  }

  /* =============================
     Dark Mode Scheduler
  ============================= */
  initSchedulerInterval() {
    clearInterval(this.schedulerInterval);
    this.checkDarkModeSchedule(true);
    this.schedulerInterval = setInterval(
      () => this.checkDarkModeSchedule(),
      60000
    );
  }

  checkDarkModeSchedule(force = false) {
    const mode = this.settings.darkModeScheduler || "off";
    this.toggleScheduleInputs(mode);

    if (mode !== "auto") {
      if (force) this.applyAppearanceMode();
      return;
    }

    const now = new Date();
    const [startH, startM] = this.settings.darkModeStart.split(":").map(Number);
    const [endH, endM] = this.settings.darkModeEnd.split(":").map(Number);

    const start = new Date();
    start.setHours(startH, startM, 0, 0);
    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    let isDark;
    if (end <= start) {
      // Over midnight
      isDark = now >= start || now < end;
    } else {
      isDark = now >= start && now < end;
    }

    this.setThemeClasses(isDark);
    this.applyCustomBackground(false);
  }

  toggleScheduleInputs(mode) {
    const group = document.querySelector(".schedule-group");
    if (!group) return;
    group.style.display = mode === "auto" ? "" : "none";
  }

  /* =============================
     Apply Settings
  ============================= */
  applyAllSettings() {
    Object.keys(this.defaultSettings).forEach((k) => this.applySetting(k));
    this.applyCustomBackground(false);
    this.toggleScheduleInputs(this.settings.darkModeScheduler);
    this.syncWallpaperUIVisibility();
    // Ensure accessibility classes applied after all settings
    this.applyAccessibilityClasses();
  }

  applySetting(key) {
    // Map of single-key actions
    const actions = {
      appearanceMode: () => this.applyAppearanceMode(),
      accentColor: () => this.applyAccentColor(),
      fontSize: () => this.applyFontSize(),
      focusOutline: () =>
        document.body.classList.toggle(
          "focus-outline-disabled",
          this.settings.focusOutline === "disabled"
        ),
      motionEffects: () => this.applyMotionEffects(),
      highContrast: () =>
        document.body.classList.toggle(
          "high-contrast",
          this.settings.highContrast === "enabled"
        ),
      dyslexiaFont: () =>
        document.body.classList.toggle(
          "dyslexia-font",
          this.settings.dyslexiaFont === "enabled"
        ),
      underlineLinks: () =>
        document.body.classList.toggle(
          "underline-links",
          this.settings.underlineLinks === "enabled"
        ),
      mouseTrail: () =>
        document.body.classList.toggle(
          "mouse-trail-enabled",
          this.settings.mouseTrail === "enabled"
        ),
    };

    // Execute direct action if exists
    actions[key]?.();

    // Universal show/hide behavior for sections (keys beginning with "show")
    if (key.startsWith("show")) {
      const sectionId = key
        .replace(/^show/, "")
        .replace(/^[A-Z]/, (m) => m.toLowerCase())
        .replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

      const el =
        document.getElementById(`${sectionId}-section`) ||
        document.querySelector(`[data-section-id="${sectionId}"]`);

      if (el) {
        const visible = this.settings[key] === "enabled";
        el.style.transition = "opacity 0.3s ease";
        if (visible) {
          el.style.display = "";
          requestAnimationFrame(() => (el.style.opacity = "1"));
        } else {
          el.style.opacity = "0";
          setTimeout(() => (el.style.display = "none"), 300);
        }
      }
    }

    // Special: Live Activity visibility hook
    if (key === "showLiveActivity") {
      const liveActivity = document.getElementById("live-activity");
      if (liveActivity) {
        const visible = this.settings.showLiveActivity === "enabled";
        if (visible) {
          liveActivity.style.display = "";
          requestAnimationFrame(() => (liveActivity.style.opacity = "1"));
          if (typeof updateLiveStatus === "function") {
            setTimeout(() => updateLiveStatus(), 300);
          }
        } else {
          liveActivity.style.opacity = "0";
          setTimeout(() => (liveActivity.style.display = "none"), 250);
        }
      }
    }

    // Ensure accessibility classes and side-effects are applied for new keys
    const accessibilityKeys = [
      "adhdMode","autismMode","epilepsySafe","colorBlindMode","readingMask",
      "reducedMotion","lowVisionMode","screenReaderEnhancements","cognitiveMode",
      "focusLock","voiceControl","uiDensity","audioFeedback"
    ];
    if (accessibilityKeys.includes(key)) {
      this.applyAccessibilityClasses();
    }
  }

  /* =============================
     In-Site Notifications (Toasts)
  ============================= */
  ensureToastContainer() {
    let c = document.getElementById("toast-container");
    if (!c) {
      c = document.createElement("div");
      c.id = "toast-container";
      Object.assign(c.style, {
        position: "fixed",
        bottom: "30px",
        right: "30px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        zIndex: "9999",
        pointerEvents: "none",
      });
      document.body.appendChild(c);
    }
    return c;
  }

  showToast(title, message) {
    const container = this.ensureToastContainer();
    const toast = document.createElement("div");
    toast.className = "toast";
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue("--accent-color") ||
      "#007aff";

    // Basic look; your CSS can style .toast further
    Object.assign(toast.style, {
      background: accent.trim(),
      color: "var(--accent-text-color, #fff)",
      borderRadius: "14px",
      padding: "12px 14px",
      boxShadow: "0 10px 28px rgba(0,0,0,.25)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      maxWidth: "340px",
      fontSize: "14px",
      lineHeight: "1.35",
      pointerEvents: "auto",
      transform: "translateY(10px)",
      opacity: "0",
      transition: "opacity .25s ease, transform .25s ease",
    });

    toast.innerHTML = `<strong style="display:block;margin-bottom:4px;">${title}</strong><span>${message}</span>`;
    container.appendChild(toast);

    // Intro animation
    requestAnimationFrame(() => {
      toast.style.transform = "translateY(0)";
      toast.style.opacity = "1";
    });

    // Auto-remove
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 250);
    }, 4000);
  }

  getNotificationSettings() {
    const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
    return (
      settings.notifications || {
        enabled: false,
        categories: { updates: false, liveActivity: false, creators: false },
      }
    );
  }

  setNotificationSettings(next) {
    const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
    settings.notifications = next;
    localStorage.setItem("websiteSettings", JSON.stringify(settings));
  }

  applyNotificationUI() {
    const state = this.getNotificationSettings();
    const main = document.getElementById("inSiteNotificationsToggle");
    const group = document.getElementById("notificationCategories");
    const upd = document.getElementById("notifUpdatesToggle");
    const live = document.getElementById("notifLiveActivityToggle");
    const cre = document.getElementById("notifCreatorUpdatesToggle");

    if (!main || !group) return;
    main.checked = !!state.enabled;
    group.style.display = state.enabled ? "block" : "none";
    if (upd) upd.checked = !!state.categories?.updates;
    if (live) live.checked = !!state.categories?.liveActivity;
    if (cre) cre.checked = !!state.categories?.creators;
  }

  initNotificationSettings() {
    const main = document.getElementById("inSiteNotificationsToggle");
    if (!main) return;
    const group = document.getElementById("notificationCategories");
    const upd = document.getElementById("notifUpdatesToggle");
    const live = document.getElementById("notifLiveActivityToggle");
    const cre = document.getElementById("notifCreatorUpdatesToggle");

    // Initial UI state
    this.applyNotificationUI();

    // Master toggle
    main.addEventListener("change", () => {
      const state = this.getNotificationSettings();
      state.enabled = main.checked;
      this.setNotificationSettings(state);
      group.style.display = state.enabled ? "block" : "none";

      this.showToast(
        state.enabled ? "In-Site Notifications Enabled" : "Notifications Disabled",
        state.enabled ? "You’ll now see alerts like this one!" : "In-site notifications are now off."
      );
    });

    // Helper to wire category toggles
    const wireCat = (el, key) => {
      if (!el) return;
      el.addEventListener("change", () => {
        const state = this.getNotificationSettings();
        state.categories = state.categories || {
          updates: false,
          liveActivity: false,
          creators: false,
        };
        state.categories[key] = el.checked;
        this.setNotificationSettings(state);
        const label =
          el.closest(".setting-card")?.querySelector(".setting-title")?.textContent || key;
        this.showToast("Preference Saved", `${label} notifications updated.`);
      });
    };

    wireCat(upd, "updates");
    wireCat(live, "liveActivity");
    wireCat(cre, "creators");
  }

  /* =============================
     Reset Controls
  ============================= */
  resetSectionVisibility() {
    if (confirm("Show all homepage sections again?")) {
      const keys = Object.keys(this.defaultSettings).filter((k) => k.startsWith("show"));
      keys.forEach((k) => (this.settings[k] = "enabled"));
      this.saveSettings();
      this.initializeControls();
      this.applyAllSettings();
      alert("All sections are now visible.");
    }
  }

  resetSettings() {
    if (
      confirm(
        "Reset all settings to factory defaults? This will also clear your custom background."
      )
    ) {
      this.settings = { ...this.defaultSettings };
      this.saveSettings();

      // Clear local-only items
      localStorage.removeItem("sectionOrder");
      localStorage.removeItem("customBackground");
      localStorage.removeItem("customBackgroundName");
      localStorage.removeItem("wallpaperBlur");

      const layer = document.getElementById("wallpaper-layer");
      if (layer) {
        layer.style.backgroundImage = "";
        layer.style.opacity = "0";
      }
      const previewContainer = document.getElementById("customBgPreviewContainer");
      const previewImage = document.getElementById("customBgPreview");
      const fileNameDisplay = document.getElementById("fileNameDisplay");
      const removeBtn = document.getElementById("removeCustomBg");

      if (previewContainer && previewImage) {
        previewContainer.classList.remove("visible");
        previewImage.classList.remove("loaded");
        previewImage.src = "";
      }
      if (fileNameDisplay) fileNameDisplay.textContent = "No file chosen";
      if (removeBtn) removeBtn.style.display = "none";

      this.initializeControls();
      this.applyAllSettings();
      alert("All settings have been reset to factory defaults.");
    }
  }

  /* =============================
     Accessibility helper methods
  ============================= */

  applyAccessibilityClasses() {
    // Generic helper that maps settings to body/html classes and CSS variables
    const s = this.settings;

    // Neurodiversity / sensory classes
    document.body.classList.toggle("adhd-mode", s.adhdMode === "enabled");
    document.body.classList.toggle("autism-mode", s.autismMode === "enabled");
    document.body.classList.toggle("epilepsy-safe", s.epilepsySafe === "enabled");
    document.body.classList.toggle("low-vision-mode", s.lowVisionMode === "enabled");
    document.body.classList.toggle("cognitive-mode", s.cognitiveMode === "enabled");
    document.body.classList.toggle("focus-lock", s.focusLock === "enabled");
    document.body.classList.toggle("screenreader-enhanced", s.screenReaderEnhancements === "enabled");
    document.body.classList.toggle("audio-feedback", s.audioFeedback === "enabled");

    // Reduced motion mapping to existing motionEffects
    const reduced = s.reducedMotion === "enabled";
    this.settings.motionEffects = reduced ? "disabled" : "enabled"; // keep older key in sync
    document.body.classList.toggle("reduced-motion", reduced);

    // UI density
    document.body.classList.remove("density-compact", "density-comfortable", "density-spacious", "density-default");
    switch (s.uiDensity) {
      case "compact":
        document.body.classList.add("density-compact");
        break;
      case "comfortable":
        document.body.classList.add("density-comfortable");
        break;
      case "spacious":
        document.body.classList.add("density-spacious");
        break;
      default:
        document.body.classList.add("density-default");
    }

    // Color blind mode -> apply CSS classes
    document.documentElement.classList.remove(
      "cb-deuteranopia",
      "cb-protanopia",
      "cb-tritanopia",
      "cb-achromatopsia"
    );
    switch (s.colorBlindMode) {
      case "deuteranopia":
        document.documentElement.classList.add("cb-deuteranopia");
        break;
      case "protanopia":
        document.documentElement.classList.add("cb-protanopia");
        break;
      case "tritanopia":
        document.documentElement.classList.add("cb-tritanopia");
        break;
      case "achromatopsia":
        document.documentElement.classList.add("cb-achromatopsia");
        break;
      default:
        // off -> nothing to do
        break;
    }

    // Reading mask
    if (s.readingMask === "enabled") this.enableReadingMask();
    else this.disableReadingMask();

    // Voice control
    if (s.voiceControl === "enabled") this.startVoiceControl();
    else this.stopVoiceControl();
  }

  /* ---------------------------
     Reading mask (line highlighter)
     --------------------------- */
  ensureReadingMaskEl() {
    let m = document.getElementById("reading-mask");
    if (!m) {
      m = document.createElement("div");
      m.id = "reading-mask";
      m.setAttribute("aria-hidden", "true");
      Object.assign(m.style, {
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(90%, 900px)",
        height: "3.2rem",
        pointerEvents: "none",
        zIndex: "9998",
        borderRadius: "6px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        transition: "top .18s ease",
        background: "rgba(255,255,255,0.06)",
        mixBlendMode: "normal",
        display: "none"
      });
      document.body.appendChild(m);
    }
    return m;
  }

  enableReadingMask() {
    const mask = this.ensureReadingMaskEl();
    mask.style.display = "block";
    // Move mask to follow keyboard focus or mouse hover over paragraphs
    const moveMask = (target) => {
      if (!target) return;
      const rect = target.getBoundingClientRect();
      // center vertically on target, but stay within viewport
      const maskHeight = parseFloat(getComputedStyle(mask).height) || 52;
      let top = window.scrollY + rect.top + rect.height / 2 - maskHeight / 2;
      // clamp to viewport
      const minTop = window.scrollY + 40;
      const maxTop = window.scrollY + window.innerHeight - maskHeight - 40;
      top = Math.min(Math.max(top, minTop), maxTop);
      mask.style.top = `${top}px`;
    };

    // focus handler
    this._readingMaskHandler = (e) => {
      const target = e.target.closest("p, li, .content-block, article, .post, .setting-card");
      if (target) moveMask(target);
    };

    document.addEventListener("focusin", this._readingMaskHandler, true);
    document.addEventListener("mousemove", this._readingMaskHandler, { passive: true });
  }

  disableReadingMask() {
    const mask = document.getElementById("reading-mask");
    if (mask) mask.style.display = "none";
    if (this._readingMaskHandler) {
      document.removeEventListener("focusin", this._readingMaskHandler, true);
      document.removeEventListener("mousemove", this._readingMaskHandler);
      delete this._readingMaskHandler;
    }
  }

  /* ---------------------------
     Simple voice control (Web Speech API)
     --------------------------- */
  startVoiceControl() {
    if (this._voiceActive) return;
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      console.warn("[Voice] SpeechRecognition not supported.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this._rec = new SpeechRecognition();
    this._rec.continuous = true;
    this._rec.interimResults = false;
    this._rec.lang = "en-US";
    this._rec.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; ++i) {
        const text = ev.results[i][0].transcript.trim().toLowerCase();
        this.handleVoiceCommand(text);
      }
    };
    this._rec.onend = () => {
      if (this.settings.voiceControl === "enabled") {
        // restart automatically
        try { this._rec.start(); } catch (err) {}
      }
    };
    try {
      this._rec.start();
      this._voiceActive = true;
      console.log("[Voice] started");
    } catch (err) {
      console.error("[Voice] start failed:", err);
    }
  }

  stopVoiceControl() {
    if (this._rec && this._voiceActive) {
      try { this._rec.onend = null; this._rec.stop(); } catch (err) {}
    }
    this._voiceActive = false;
  }

  handleVoiceCommand(text) {
    // Small set of commands mapped to actions - expand as desired
    try {
      console.log("[Voice] heard:", text);
      if (text.includes("dark mode")) {
        this.settings.appearanceMode = "dark";
        this.applySetting("appearanceMode");
        this.saveSettings();
        this.showToast("Voice", "Dark mode enabled");
      } else if (text.includes("light mode")) {
        this.settings.appearanceMode = "light";
        this.applySetting("appearanceMode");
        this.saveSettings();
        this.showToast("Voice", "Light mode enabled");
      } else if (text.includes("increase text") || text.includes("bigger text")) {
        this.settings.fontSize = Math.min(28, (this.settings.fontSize || 16) + 2);
        this.applySetting("fontSize");
        this.saveSettings();
        this.showToast("Voice", "Text size increased");
      } else if (text.includes("decrease text") || text.includes("smaller text")) {
        this.settings.fontSize = Math.max(12, (this.settings.fontSize || 16) - 2);
        this.applySetting("fontSize");
        this.saveSettings();
        this.showToast("Voice", "Text size decreased");
      } else if (text.includes("turn off animations") || text.includes("reduce motion")) {
        this.settings.reducedMotion = "enabled";
        this.applyAccessibilityClasses();
        this.saveSettings();
        this.showToast("Voice", "Reduced motion enabled");
      } else if (text.includes("open settings") || text.includes("go to settings")) {
        window.location.href = "/settings.html";
      } else if (text.includes("home")) {
        window.location.href = "/";
      }
    } catch (err) {
      console.error("[Voice] handle error:", err);
    }
  }

  /* ---------------------------
     Audio feedback (short beep)
     --------------------------- */
  playUiClickSound() {
    if (!this.settings.audioFeedback || this.settings.audioFeedback !== "enabled") return;
    try {
      if (!this._audioCtx) this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = this._audioCtx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880; // short high beep
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      o.stop(ctx.currentTime + 0.13);
    } catch (err) {
      // fallback no-op
    }
  }

  /* ---------------------------
     Screen reader announcement
     --------------------------- */
  ensureAnnouncer() {
    let el = document.getElementById("a11y-announcer");
    if (!el) {
      el = document.createElement("div");
      el.id = "a11y-announcer";
      el.setAttribute("aria-live", "polite");
      el.setAttribute("aria-atomic", "true");
      el.style.position = "absolute";
      el.style.width = "1px";
      el.style.height = "1px";
      el.style.margin = "-1px";
      el.style.padding = "0";
      el.style.border = "0";
      el.style.clip = "rect(0 0 0 0)";
      el.style.overflow = "hidden";
      document.body.appendChild(el);
    }
    return el;
  }

  announceForA11y(msg) {
    const el = this.ensureAnnouncer();
    el.textContent = "";
    setTimeout(() => {
      el.textContent = msg;
    }, 50);
  }

  /* =============================
     Misc Stubs (safe no-ops)
  ============================= */
  initScrollArrow() {}
  initLoadingScreen() {}
  initMouseTrail() {}
}

/* =============================
   Initialize (singleton)
============================= */
if (!window.settingsManagerInstance) {
  window.settingsManagerInstance = new SettingsManager();
}
