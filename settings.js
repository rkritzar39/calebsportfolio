/**
 * settings.js
 * Fully functional settings manager with live previews,
 * custom backgrounds, blur control, dark-mode scheduler,
 * and dynamic wallpapers.
 */
class SettingsManager {
  constructor() {
    this.defaultSettings = {
      appearanceMode: "device",
      themeStyle: "clear",
      accentColor: "#3ddc84",
      darkModeScheduler: "off", // 'off' | 'auto'
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

      // Wallpaper + blur
      this.initCustomBackgroundControls();
      this.applyCustomBackground(false);
      this.initWallpaperBlurControl();

      // Scheduler
      this.initSchedulerInterval();

      // Device theme listener
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
        }
      });

      // Footer year
      const yearSpan = document.getElementById("year");
      if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    });
  }

  // =============================
  // Load / Save
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
    localStorage.setItem("websiteSettings", JSON.stringify(toSave));
  }

  // =============================
  // UI Setup
  // =============================
  initializeControls() {
    this.initSegmentedControl("appearanceModeControl", this.settings.appearanceMode);
    this.initSegmentedControl("themeStyleControl", this.settings.themeStyle);
    this.updateSegmentedBackground("appearanceModeControl");
    this.updateSegmentedBackground("themeStyleControl");

    const accentPicker = document.getElementById("accentColorPicker");
    if (accentPicker) {
      accentPicker.value = this.settings.accentColor;
      this.checkAccentColor(this.settings.accentColor);
    }

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
        (this.defaultSettings[k] === "enabled" ||
          this.defaultSettings[k] === "disabled")
    );
    toggles.forEach((key) => this.setToggle(key));

    this.syncWallpaperUIVisibility();
  }

  initSegmentedControl(controlId, value) {
    const control = document.getElementById(controlId);
    if (!control) return;
    control.querySelectorAll("button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.value === value);
    });
  }

  updateSegmentedBackground(controlId) {
    const control = document.getElementById(controlId);
    if (!control) return;
    let active = control.querySelector("button.active");
    let bg = control.querySelector(".seg-bg");
    if (!bg) {
      bg = document.createElement("div");
      bg.className = "seg-bg";
      control.prepend(bg);
    }
    if (active) {
      const rect = active.getBoundingClientRect();
      const parent = control.getBoundingClientRect();
      bg.style.left = rect.left - parent.left + "px";
      bg.style.width = rect.width + "px";
    }
  }

  setToggle(key) {
    const el = document.getElementById(`${key}Toggle`);
    if (el) el.checked = this.settings[key] === "enabled";
  }

  // =============================
  // Event Listeners
  // =============================
  setupEventListeners() {
    ["appearanceMode", "themeStyle"].forEach((key) => {
      const control = document.getElementById(`${key}Control`);
      if (control) {
        control.addEventListener("click", (e) => {
          const btn = e.target.closest("button");
          if (!btn) return;
          this.settings[key] = btn.dataset.value;
          this.applySetting(key);
          this.saveSettings();
          this.initSegmentedControl(`${key}Control`, this.settings[key]);
          this.updateSegmentedBackground(`${key}Control`);
          if (key === "appearanceMode") {
            this.applyCustomBackground(false);
          }
        });
        this.updateSegmentedBackground(`${key}Control`);
      }
    });

    const accentPicker = document.getElementById("accentColorPicker");
    if (accentPicker) {
      accentPicker.addEventListener("input", (e) => {
        this.settings.accentColor = e.target.value;
        this.applyAccentColor();
        this.saveSettings();
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

    if (schedulerSelect) {
      schedulerSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        this.settings.darkModeScheduler = val;
        this.saveSettings();
        this.toggleScheduleInputs(val);
        this.checkDarkModeSchedule(true);
      });
    }
    if (startInput) {
      startInput.addEventListener("change", (e) => {
        this.settings.darkModeStart = e.target.value;
        this.saveSettings();
        this.checkDarkModeSchedule(true);
      });
    }
    if (endInput) {
      endInput.addEventListener("change", (e) => {
        this.settings.darkModeEnd = e.target.value;
        this.saveSettings();
        this.checkDarkModeSchedule(true);
      });
    }

    const blurSlider = document.getElementById("blur-slider");
    const blurBadge = document.getElementById("blurValue");
    if (blurSlider && blurBadge) {
      const setBlurFill = () => {
        const min = parseFloat(blurSlider.min || "0");
        const max = parseFloat(blurSlider.max || "40");
        const val = parseFloat(blurSlider.value || "15");
        const pct = ((val - min) / (max - min)) * 100;
        blurSlider.style.background = `linear-gradient(90deg, var(--accent-color) ${pct}%, var(--slider-track-color) ${pct}%)`;
      };
      setBlurFill();

      blurSlider.addEventListener("input", (e) => {
        const val = e.target.value;
        blurBadge.textContent = `${val}px`;
        localStorage.setItem("wallpaperBlur", val);
        this.applyWallpaperBlur(val);
        setBlurFill();
      });
    }

    const toggleKeys = Object.keys(this.defaultSettings).filter(
      (k) =>
        typeof this.defaultSettings[k] === "string" &&
        (this.defaultSettings[k] === "enabled" ||
          this.defaultSettings[k] === "disabled")
    );
    toggleKeys.forEach((key) => {
      const el = document.getElementById(`${key}Toggle`);
      if (el) {
        el.addEventListener("change", () => {
          this.settings[key] = el.checked ? "enabled" : "disabled";
          this.applySetting(key);
          this.saveSettings();
        });
      }
    });

    document
      .getElementById("resetLayoutBtn")
      ?.addEventListener("click", () => {
        if (confirm("Reset the section layout to default?")) {
          localStorage.removeItem("sectionOrder");
          alert("Layout reset. Refresh homepage to see changes.");
        }
      });

    document
      .getElementById("resetSectionsBtn")
      ?.addEventListener("click", () => this.resetSectionVisibility());
    document
      .getElementById("resetSettings")
      ?.addEventListener("click", () => this.resetSettings());

    window.addEventListener("resize", () => this.fitWallpaperLayer());
    window.addEventListener("orientationchange", () => this.fitWallpaperLayer());
  }

  // =============================
  // Appearance & Color
  // =============================
  updateSliderFill(slider) {
    if (!slider) return;
    const pct =
      ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(90deg, var(--accent-color) ${pct}%, var(--slider-track-color) ${pct}%)`;
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
    let isLight =
      this.settings.appearanceMode === "light" ||
      (this.settings.appearanceMode === "device" &&
        !window.matchMedia("(prefers-color-scheme: dark)").matches);
    const r = parseInt(hex.substr(1, 2), 16),
      g = parseInt(hex.substr(3, 2), 16),
      b = parseInt(hex.substr(5, 2), 16);
    const isLightColor = r > 240 && g > 240 && b > 240;
    warn.style.display = isLightColor && isLight ? "block" : "none";
  }

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

  // Apply core settings
  actions[key]?.();

  // === NEW: Universal show/hide for homepage sections ===
  if (key.startsWith("show")) {
    // Convert "showUsefulLinks" → "useful-links"
    const sectionId = key
      .replace(/^show/, "")
      .replace(/^[A-Z]/, (m) => m.toLowerCase())
      .replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

    // Match both ID and data-section-id (for safety)
    const el =
      document.getElementById(`${sectionId}-section`) ||
      document.querySelector(`[data-section-id="${sectionId}"]`);

    if (el) {
      const visible = this.settings[key] === "enabled";

      // Smooth fade transition
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
}

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
    this.checkAccentColor(this.settings.accentColor);
  }

  applyAccentColor() {
    const accent = this.settings.accentColor;
    document.documentElement.style.setProperty("--accent-color", accent);
    document.documentElement.style.setProperty(
      "--accent-text-color",
      this.getContrastColor(accent)
    );
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

  // =============================
  // Custom Background + Blur
  // =============================
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
    if (!upload) return;

    const existing = !!localStorage.getItem("customBackground");
    if (existing && remove) remove.style.display = "inline-block";
    this.toggleWallpaperBlurCard(existing);

    const fileNameDisplay = document.getElementById("fileNameDisplay");

    upload.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (fileNameDisplay) fileNameDisplay.textContent = file.name;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const imageData = evt.target.result;
        localStorage.setItem("customBackground", imageData);
        this.applyCustomBackground(true);
        if (remove) remove.style.display = "inline-block";
        this.toggleWallpaperBlurCard(true);

        upload.classList.remove("pulse");
        upload.offsetHeight;
        upload.classList.add("pulse");
        setTimeout(() => upload.classList.remove("pulse"), 900);
      };
      reader.readAsDataURL(file);
    });

    if (remove) {
      remove.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        localStorage.removeItem("customBackground");

        const layer = document.getElementById("wallpaper-layer");
        if (layer) {
          layer.style.backgroundImage = "";
          layer.style.opacity = "0";
        }
        this.applyCustomBackground();
        this.toggleWallpaperBlurCard(false);
        remove.style.display = "none";
        if (fileNameDisplay) fileNameDisplay.textContent = "No file chosen";
      });
    }
  }

applyCustomBackground(fade = false) {
  const bg = localStorage.getItem("customBackground");
  const { layer, tint } = this.ensureWallpaperLayers();

  const hasBg = !!bg;
  document.body.classList.toggle("has-custom-background", hasBg);

  // === Wallpaper handling ===
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

  // === Tint handling based on theme ===
  const isDark =
    this.settings.appearanceMode === "dark" ||
    (this.settings.appearanceMode === "device" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  tint.style.background = isDark
    ? "rgba(0, 0, 0, 0.45)"
    : "rgba(255, 255, 255, 0.15)";

  // === Apply blur ===
  const blurValue = localStorage.getItem("wallpaperBlur") || 15;
  this.applyWallpaperBlur(blurValue);

  // === NEW: Frosted content activation (robust) ===
  const frostedTargets = [
    document.getElementById("profile-section"),
    document.getElementById("president-section"),
    document.getElementById("quote-section"),
    ...document.querySelectorAll(
      ".card, .creator-card, .instagram-creator-card, .youtube-creator-card, .useful-links-section, .social-links-section, .version-info-section, .business-info-section, .tech-section, .disabilities-section, .shoutouts-section"
    )
  ];

  frostedTargets.forEach(section => {
    if (!section) return;
    if (hasBg) {
      section.classList.add("frosted");
      section.classList.add("frosted-inner");
    } else {
      section.classList.remove("frosted");
      section.classList.remove("frosted-inner");
    }
  });
}

  applyWallpaperBlur(value) {
    const layer = document.getElementById("wallpaper-layer");
    if (!layer) return;
    layer.style.filter = `blur(${value}px) brightness(1.03)`;
  }

  initWallpaperBlurControl() {
    const slider = document.getElementById("blur-slider");
    const badge = document.getElementById("blurValue");
    if (!slider || !badge) return;

    const stored = localStorage.getItem("wallpaperBlur") || 15;
    slider.value = stored;
    badge.textContent = `${stored}px`;
    this.applyWallpaperBlur(stored);

    const setFill = () => {
      const min = parseFloat(slider.min || "0");
      const max = parseFloat(slider.max || "40");
      const val = parseFloat(slider.value || stored);
      const pct = ((val - min) / (max - min)) * 100;
      slider.style.background = `linear-gradient(90deg, var(--accent-color) ${pct}%, var(--slider-track-color) ${pct}%)`;
    };
    setFill();

    slider.addEventListener("input", (e) => {
      const val = e.target.value;
      badge.textContent = `${val}px`;
      localStorage.setItem("wallpaperBlur", val);
      this.applyWallpaperBlur(val);
      setFill();
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

  // =============================
  // Dark Mode Scheduler
  // =============================
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

    const isNight = end > start ? now >= start && now < end : now >= start || now < end;
    this.setThemeClasses(isNight);
    this.applyCustomBackground(false);
  }

  toggleScheduleInputs(mode) {
    const group = document.querySelector(".schedule-group");
    if (!group) return;
    group.style.display = mode === "auto" ? "" : "none";
  }

  // =============================
  // Reset Controls
  // =============================
  resetSectionVisibility() {
    if (confirm("Show all homepage sections again?")) {
      const keys = Object.keys(this.defaultSettings).filter((k) =>
        k.startsWith("show")
      );
      keys.forEach((k) => (this.settings[k] = "enabled"));
      this.saveSettings();
      this.initializeControls();
      this.applyAllSettings();
      alert("All sections are now visible.");
    }
  }

  resetSettings() {
    if (confirm("Reset all settings to default values?")) {
      this.settings = { ...this.defaultSettings };
      this.saveSettings();
      localStorage.removeItem("sectionOrder");
      this.initializeControls();
      this.applyAllSettings();
      alert("Settings and layout have been reset to default.");
    }
  }

  // =============================
  // Misc
  // =============================
  initScrollArrow() {}
  initLoadingScreen() {}
  initMouseTrail() {}
}

// Initialize
if (!window.settingsManagerInstance) {
  window.settingsManagerInstance = new SettingsManager();
}
