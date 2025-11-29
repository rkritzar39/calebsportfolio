/**
 * settings.js
 * (Updated: Fixes Light Mode Accent Color Override + Full Custom Background Drag & Zoom)
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
    console.error("❌ Firebase SDK missing. Make sure firebase-app-compat.js and firebase-messaging-compat.js load before settings.js");
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
      console.log("[Push] Permission result:", permission);

      if (permission !== "granted") {
        alert("🚫 Please allow notifications in your browser settings to enable push alerts.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      console.log("✅ Service worker registered:", registration);

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

// ==============================
// SettingsManager
// ==============================
class SettingsManager {
  constructor() {
    // --------------------------
    // Defaults
    // --------------------------
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

    // --------------------------
    // Instance State
    // --------------------------
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
      this.initWallpaperDragZoom();
      this.initSchedulerInterval();

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

      // Reduced motion listener
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

      // Cross-tab sync
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
          e.key === "wallpaperBlur" ||
          e.key === "customBackgroundPosX" ||
          e.key === "customBackgroundPosY" ||
          e.key === "customBackgroundZoom"
        ) {
          this.applyCustomBackground(false);
          this.initCustomBackgroundControls();
          this.initWallpaperBlurControl();
          this.initWallpaperDragZoom();
          this.syncWallpaperUIVisibility();
        }
      });

      // Live Activity
      if (typeof updateLiveStatus === "function") {
        setTimeout(() => updateLiveStatus(), 500);
      }

      const yearSpan = document.getElementById("year");
      if (yearSpan) yearSpan.textContent = new Date().getFullYear();

      this.initNotificationSettings();
    });
  }

  // --------------------------
  // Load / Save
  // --------------------------
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

  // --------------------------
  // UI Setup
  // --------------------------
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
      (k) => typeof this.defaultSettings[k] === "string" &&
        (this.defaultSettings[k] === "enabled" || this.defaultSettings[k] === "disabled")
    );
    toggles.forEach((key) => this.setToggle(key));

    this.syncWallpaperUIVisibility();
  }

  // ---------- Segmented Controls ----------
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

  // ---------- Event Listeners ----------
  setupEventListeners() {
    const appearanceControl = document.getElementById("appearanceModeControl");
    if (appearanceControl) {
      appearanceControl.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn || !btn.dataset.value) return;

        if (this.settings.darkModeScheduler === "auto") {
          alert("Appearance mode is controlled by the Scheduler. Disable it to make manual changes.");
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

    // Accent, slider, toggles...
    const accentPicker = document.getElementById("accentColorPicker");
    if (accentPicker) accentPicker.addEventListener("input", (e) => {
      this.settings.accentColor = e.target.value;
      this.applyAccentColor();
      this.saveSettings();
      this.updateSliderFill(document.getElementById("text-size-slider"));
      this.updateSliderFill(document.getElementById("blur-slider"));
    });

    const matchToggle = document.getElementById("matchSongAccentToggle");
    if (matchToggle) matchToggle.addEventListener("change", (e) => {
      this.settings.matchSongAccent = e.target.checked ? "enabled" : "disabled";
      this.saveSettings();
      this.showToast(
        "Accent Sync Updated",
        e.target.checked
          ? "Accent color will now match your current Spotify song."
          : "Accent color will use your custom color only."
      );
    });

    const slider = document.getElementById("text-size-slider");
    if (slider) slider.addEventListener("input", (e) => {
      this.settings.fontSize = parseInt(e.target.value, 10);
      this.applyFontSize();
      this.updateSliderFill(slider);
      const badge = document.getElementById("textSizeValue");
      if (badge) badge.textContent = `${this.settings.fontSize}px`;
      this.saveSettings();
    });

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
      (k) => typeof this.defaultSettings[k] === "string" &&
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

  // ==============================
  // Appearance & Theme
  // ==============================
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
    document.documentElement.style.setProperty("--font-size-base", `${this.settings.fontSize}px`);
  }

  applyMotionEffects() {
    document.body.classList.toggle("reduced-motion", this.settings.motionEffects === "disabled");
  }

  updateSliderFill(slider) {
    if (!slider) return;
    const min = slider.min || 0;
    const max = slider.max || 100;
    const val = slider.value;
    slider.style.setProperty("--_fill", `${((val - min) / (max - min)) * 100}%`);
  }

  getContrastColor(hex) {
    if (!hex) return "#fff";
    hex = hex.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16),
      g = parseInt(hex.substr(2, 2), 16),
      b = parseInt(hex.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? "#000" : "#fff";
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

  // ==============================
  // Custom Background & Blur
  // ==============================
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
    const zoomSlider = document.getElementById("bgZoomSlider");
    const zoomLabel = document.querySelector('label[for="bgZoomSlider"]');
    const customBgCard = document.querySelector(".custom-background");

    if (!upload || !previewContainer || !previewImage) return;

    // Utility to toggle zoom controls
    const toggleZoomControls = (show) => {
      if (zoomSlider) zoomSlider.style.display = show ? "inline-block" : "none";
      if (zoomLabel) zoomLabel.style.display = show ? "block" : "none";
    };

    const savedBg = localStorage.getItem("customBackground");
    const savedName = localStorage.getItem("customBackgroundName");
    const savedBlur = localStorage.getItem("wallpaperBlur") ?? "0";

    // If a saved image exists, show preview and controls
    if (savedBg) {
      if (fileNameDisplay) fileNameDisplay.textContent = savedName || "Saved background";
      if (remove) remove.style.display = "inline-block";
      if (customBgCard) customBgCard.style.display = "flex";
      toggleZoomControls(true);

      previewContainer.classList.add("visible");
      previewImage.style.backgroundImage = `url("${savedBg}")`;
      previewImage.classList.add("loaded");

      if (separator) separator.classList.add("visible");
      this.applyCustomBackground(true);
      this.applyWallpaperBlur(savedBlur);

      if (zoomSlider) {
        zoomSlider.value = localStorage.getItem("customBackgroundZoom") || 100;
      }
    } else {
      if (customBgCard) customBgCard.style.display = "none";
      toggleZoomControls(false);
      if (separator) separator.classList.remove("visible");
    }

    // Handle image upload
    upload.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (fileNameDisplay) fileNameDisplay.textContent = file.name;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        let imageData = evt.target.result;

        // Optional: call AI to extend the image
        try {
          imageData = await this.extendBackgroundWithAI(imageData);
        } catch (err) {
          console.warn("AI extension failed, using original image:", err);
        }

        localStorage.setItem("customBackground", imageData);
        localStorage.setItem("customBackgroundName", file.name);

        if (customBgCard) customBgCard.style.display = "flex";
        toggleZoomControls(true);

        const blurValue = zoomSlider ? zoomSlider.value : localStorage.getItem("wallpaperBlur") || "0";
        localStorage.setItem("wallpaperBlur", blurValue);

        previewContainer.classList.add("visible");
        previewImage.classList.remove("loaded");
        previewImage.style.backgroundImage = `url("${imageData}")`;
        previewImage.onload = () => previewImage.classList.add("loaded");
        if (separator) separator.classList.add("visible");

        if (remove) remove.style.display = "inline-block";
        this.applyCustomBackground(true);
        this.applyWallpaperBlur(blurValue);
      };
      reader.readAsDataURL(file);
    });

    // Handle removal
    if (remove) {
      remove.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("customBackground");
        localStorage.removeItem("customBackgroundName");
        localStorage.removeItem("wallpaperBlur");
        localStorage.removeItem("customBackgroundPosX");
        localStorage.removeItem("customBackgroundPosY");
        localStorage.removeItem("customBackgroundZoom");

        if (customBgCard) customBgCard.style.display = "none";
        toggleZoomControls(false);

        const layer = document.getElementById("wallpaper-layer");
        if (layer) {
          layer.style.backgroundImage = "";
          layer.style.opacity = "0";
        }

        previewContainer.classList.remove("visible");
        previewImage.classList.remove("loaded");
        previewImage.style.backgroundImage = "";
        if (fileNameDisplay) fileNameDisplay.textContent = "No file chosen";
        remove.style.display = "none";
        if (separator) separator.classList.remove("visible");

        const blurBadge = document.getElementById("blurValue");
        if (zoomSlider && blurBadge) {
          zoomSlider.value = 100;
          blurBadge.textContent = "0px";
        }
      });
    }

    // --- Drag & Zoom ---
    let isDragging = false;
    let startX, startY;
    let posX = parseFloat(localStorage.getItem("customBackgroundPosX") || 50);
    let posY = parseFloat(localStorage.getItem("customBackgroundPosY") || 50);
    let zoomVal = parseFloat(localStorage.getItem("customBackgroundZoom") || 100);

    // Initialize transform
    this.applyCustomBackgroundTransform(previewImage, posX, posY, zoomVal);

    previewImage?.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      previewImage.classList.add("dragging");
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const dx = ((e.clientX - startX) / previewImage.offsetWidth) * 100;
      const dy = ((e.clientY - startY) / previewImage.offsetHeight) * 100;
      startX = e.clientX;
      startY = e.clientY;

      posX = Math.max(0, Math.min(100, posX + dx));
      posY = Math.max(0, Math.min(100, posY + dy));

      localStorage.setItem("customBackgroundPosX", posX);
      localStorage.setItem("customBackgroundPosY", posY);

      this.applyCustomBackgroundTransform(previewImage, posX, posY, zoomVal);
      this.applyCustomBackground(true);
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      previewImage?.classList.remove("dragging");
    });

    // Zoom slider
    zoomSlider?.addEventListener("input", (e) => {
      zoomVal = e.target.value;
      localStorage.setItem("customBackgroundZoom", zoomVal);
      this.applyCustomBackgroundTransform(previewImage, posX, posY, zoomVal);
      this.applyCustomBackground(true);
    });
  }

  applyCustomBackgroundTransform(previewEl, posX, posY, zoom) {
    if (!previewEl) return;
    previewEl.style.backgroundPosition = `${posX}% ${posY}%`;
    previewEl.style.backgroundSize = `${zoom}% auto`;

    const { layer } = this.ensureWallpaperLayers();
    layer.style.backgroundPosition = `${posX}% ${posY}%`;
    layer.style.backgroundSize = `${zoom}% auto`;
  }

  async extendBackgroundWithAI(imageData) {
    // Example: call your server-side endpoint that uses OpenAI or Stable Diffusion
    try {
      const response = await fetch("/api/extend-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });
      const data = await response.json();
      if (data.extendedImage) return data.extendedImage;
      return imageData; // fallback
    } catch (err) {
      console.error("AI background extension failed:", err);
      return imageData; // fallback
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

    const isDark =
      this.settings.appearanceMode === "dark" ||
      (this.settings.appearanceMode === "device" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    tint.style.background = isDark
      ? "rgba(0, 0, 0, 0.45)"
      : "rgba(255, 255, 255, 0.15)";

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

  // ==============================
  // Dark Mode Scheduler
  // ==============================
  initSchedulerInterval() {
    clearInterval(this.schedulerInterval);
    this.checkDarkModeSchedule(true);
    this.schedulerInterval = setInterval(() => this.checkDarkModeSchedule(), 60000);
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

  // ==============================
  // Apply Settings
  // ==============================
  applyAllSettings() {
    Object.keys(this.defaultSettings).forEach((k) => this.applySetting(k));
    this.applyCustomBackground(false);
    this.toggleScheduleInputs(this.settings.darkModeScheduler);
    this.syncWallpaperUIVisibility();
  }

  applySetting(key) {
    const actions = {
      appearanceMode: () => this.applyAppearanceMode(),
      accentColor: () => this.applyAccentColor(),
      fontSize: () => this.applyFontSize(),
      focusOutline: () => document.body.classList.toggle("focus-outline-disabled", this.settings.focusOutline === "disabled"),
      motionEffects: () => this.applyMotionEffects(),
      highContrast: () => document.body.classList.toggle("high-contrast", this.settings.highContrast === "enabled"),
      dyslexiaFont: () => document.body.classList.toggle("dyslexia-font", this.settings.dyslexiaFont === "enabled"),
      underlineLinks: () => document.body.classList.toggle("underline-links", this.settings.underlineLinks === "enabled"),
      mouseTrail: () => document.body.classList.toggle("mouse-trail-enabled", this.settings.mouseTrail === "enabled")
    };
    actions[key]?.();

    // Sections
    if (key.startsWith("show")) {
      const sectionId = key.replace(/^show/, "").replace(/^[A-Z]/, (m) => m.toLowerCase()).replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
      const el = document.getElementById(`${sectionId}-section`) || document.querySelector(`[data-section-id="${sectionId}"]`);
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

    if (key === "showLiveActivity") {
      const liveActivity = document.getElementById("live-activity");
      if (liveActivity) {
        const visible = this.settings.showLiveActivity === "enabled";
        if (visible) {
          liveActivity.style.display = "";
          requestAnimationFrame(() => (liveActivity.style.opacity = "1"));
          if (typeof updateLiveStatus === "function") setTimeout(() => updateLiveStatus(), 300);
        } else {
          liveActivity.style.opacity = "0";
          setTimeout(() => (liveActivity.style.display = "none"), 250);
        }
      }
    }
  }

  // ==============================
  // Notifications
  // ==============================
  ensureToastContainer() {
    let c = document.getElementById("toast-container");
    if (!c) {
      c = document.createElement("div");
      c.id = "toast-container";
      Object.assign(c.style, {position:"fixed", bottom:"30px", right:"30px", display:"flex", flexDirection:"column", gap:"12px", zIndex:"9999", pointerEvents:"none"});
      document.body.appendChild(c);
    }
    return c;
  }

  showToast(title, message) {
    const container = this.ensureToastContainer();
    const toast = document.createElement("div");
    toast.className = "toast";
    const accent = getComputedStyle(document.body).getPropertyValue("--accent-color") || "#007aff";
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
      transition: "opacity .25s ease, transform .25s ease"
    });
    toast.innerHTML = `<strong style="display:block;margin-bottom:4px;">${title}</strong><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = "translateY(0)"; toast.style.opacity = "1"; });
    setTimeout(() => { toast.style.opacity = "0"; toast.style.transform = "translateY(10px)"; setTimeout(() => toast.remove(), 250); }, 4000);
  }

  getNotificationSettings() {
    const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
    return settings.notifications || {enabled:false, categories:{updates:false, liveActivity:false, creators:false}};
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

    this.applyNotificationUI();

    main.addEventListener("change", () => {
      const state = this.getNotificationSettings();
      state.enabled = main.checked;
      this.setNotificationSettings(state);
      group.style.display = state.enabled ? "block" : "none";
      this.showToast(state.enabled?"In-Site Notifications Enabled":"Notifications Disabled",
                    state.enabled?"You’ll now see alerts like this one!":"In-site notifications are now off.");
    });

    const wireCat = (el, key) => {
      if (!el) return;
      el.addEventListener("change", () => {
        const state = this.getNotificationSettings();
        state.categories = state.categories || {updates:false, liveActivity:false, creators:false};
        state.categories[key] = el.checked;
        this.setNotificationSettings(state);
        const label = el.closest(".setting-card")?.querySelector(".setting-title")?.textContent || key;
        this.showToast("Preference Saved", `${label} notifications updated.`);
      });
    };
    wireCat(upd,"updates");
    wireCat(live,"liveActivity");
    wireCat(cre,"creators");
  }

  // ==============================
  // Reset Controls
  // ==============================
  resetSectionVisibility() {
    if (confirm("Show all homepage sections again?")) {
      Object.keys(this.defaultSettings).filter(k=>k.startsWith("show")).forEach(k=>this.settings[k]="enabled");
      this.saveSettings();
      this.initializeControls();
      this.applyAllSettings();
      alert("All sections are now visible.");
    }
  }

  resetSettings() {
    if (confirm("Reset all settings to factory defaults? This will also clear your custom background.")) {
      this.settings = {...this.defaultSettings};
      this.saveSettings();
      localStorage.removeItem("sectionOrder");
      localStorage.removeItem("customBackground");
      localStorage.removeItem("customBackgroundName");
      localStorage.removeItem("wallpaperBlur");
      localStorage.removeItem("customBackgroundPosX");
      localStorage.removeItem("customBackgroundPosY");
      localStorage.removeItem("customBackgroundZoom");

      const layer = document.getElementById("wallpaper-layer");
      if(layer){ layer.style.backgroundImage=""; layer.style.opacity="0"; }
      const previewContainer = document.getElementById("customBgPreviewContainer");
      const previewImage = document.getElementById("customBgPreview");
      const fileNameDisplay = document.getElementById("fileNameDisplay");
      const removeBtn = document.getElementById("removeCustomBg");

      if(previewContainer && previewImage){ previewContainer.classList.remove("visible"); previewImage.classList.remove("loaded"); previewImage.src=""; }
      if(fileNameDisplay) fileNameDisplay.textContent="No file chosen";
      if(removeBtn) removeBtn.style.display="none";

      this.initializeControls();
      this.applyAllSettings();
      alert("All settings have been reset to factory defaults.");
    }
  }

  // ==============================
  // Misc Stubs
  // ==============================
  initScrollArrow() {}
  initLoadingScreen() {}
  initMouseTrail() {}
}

// ==============================
// Initialize singleton
// ==============================
if (!window.settingsManagerInstance) window.settingsManagerInstance = new SettingsManager();
