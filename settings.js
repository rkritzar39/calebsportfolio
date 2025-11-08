/**
 * settings.js
 * Full Settings Manager with live previews, themes, accessibility,
 * custom backgrounds, blur, dark-mode scheduler, in-site notifications,
 * and cross-tab synchronization.
 *
 * Plug directly into your existing settings.html.
 */

// === UNIVERSAL PUSH NOTIFICATIONS (WORKS ON ALL SUPPORTED BROWSERS) ===
(function () {
  console.log("[Push] Universal Notification Setup…");

  // ---- Step 1: Environment checks ----
  if (!("serviceWorker" in navigator)) {
    console.warn("❌ Service workers not supported.");
    return;
  }

  if (!("Notification" in window)) {
    alert("❌ This browser or device does not support notifications.");
    console.warn("Unsupported environment:", navigator.userAgent);
    return;
  }

  // ---- Step 2: Initialize Firebase (Compat SDK) ----
  if (!("firebase" in window)) {
    console.error("Firebase SDK missing! Load firebase-app-compat.js and firebase-messaging-compat.js first.");
    return;
  }

  firebase.initializeApp({
    apiKey: "AIzaSyCIZ0fri5V1E2si1xXpBPQQJqj1F_KuuG0",
    authDomain: "busarmydudewebsite.firebaseapp.com",
    projectId: "busarmydudewebsite",
    storageBucket: "busarmydudewebsite.firebasestorage.app",
    messagingSenderId: "42980404680",
    appId: "1:42980404680:web:f4f1e54789902a4295e4fd",
    measurementId: "G-DQPH8YL789"
  });

  const messaging = firebase.messaging();

  // ---- Step 3: Request Push Notifications ----
  async function requestPushNotifications() {
    console.log("[Push] Button clicked — starting setup…");

    try {
      // Request user permission
      const permission = await Notification.requestPermission();
      console.log("[Push] Permission result:", permission);

      if (permission !== "granted") {
        alert("🚫 Please allow notifications to enable push alerts.");
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      console.log("✅ Service Worker registered:", registration);

      // Get FCM token
      const vapidKey = "BKqy5iyBspHj5HoS-bLlMWvIc8F-639K8HWjV3iiqtdnnDDBDUti78CL9RTCiBml16qMRjJ4RqMo9DERbt4C9xc";
      const token = await messaging.getToken({
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });

      if (!token) {
        alert("⚠️ Failed to get push token. Try again later.");
        return;
      }

      console.log("🔑 Push token received:", token);
      localStorage.setItem("fcmToken", token);

      // Show test notification
      registration.showNotification("🎉 Notifications Enabled!", {
        body: "You’ll now receive updates even when this site is closed.",
        icon: "/favicon-32x32.png",
        badge: "/favicon-32x32.png",
      });

      // Foreground messages
      messaging.onMessage((payload) => {
        console.log("📩 Foreground push received:", payload);
        const { title, body, icon } = payload.notification || {};
        registration.showNotification(title || "Update", {
          body,
          icon: icon || "/favicon-32x32.png"
        });
      });

    } catch (err) {
      console.error("❌ Push setup failed:", err);
      alert("Push setup failed: " + err.message);
    }
  }

  // ---- Step 4: Bind button click ----
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("enablePushNotifications");
    if (btn) {
      btn.addEventListener("click", requestPushNotifications);
      console.log("[Push] Ready — button bound ✅");
    } else {
      console.warn("[Push] Enable button not found.");
    }
  });
})();
});
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

    // All boolean toggles
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
