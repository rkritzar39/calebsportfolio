/* ===========================================================
 * settings.js — Caleb v26 (Onyx / Liquid Glass Full)
 * ===========================================================
 * Complete functional settings manager with:
 *  - Theme & Scheduler
 *  - Accent Color + Accessibility
 *  - Wallpaper Upload / Preview / Blur
 *  - Section Visibility + Rearranging
 *  - Live Battery + Version Time
 * =========================================================== */

class SettingsManager {
  constructor() {
    this.defaultSettings = {
      /* ---------------- Appearance ---------------- */
      appearanceMode: "device",      // 'device' | 'light' | 'dark'
      themeStyle: "clear",
      accentColor: "#3ddc84",

      /* ---------------- Scheduler ---------------- */
      darkModeScheduler: "off",
      darkModeStart: "20:00",
      darkModeEnd: "06:00",

      /* ---------------- Accessibility ---------------- */
      fontSize: 16,
      focusOutline: "enabled",
      motionEffects: "enabled",
      highContrast: "disabled",
      dyslexiaFont: "disabled",
      underlineLinks: "disabled",

      /* ---------------- Misc ---------------- */
      loadingScreen: "disabled",
      mouseTrail: "disabled",
      liveStatus: "disabled",
      rearrangingEnabled: "disabled",

      /* ---------------- Homepage Sections ---------------- */
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
      showBatterySection: "enabled",
      showTimeSection: "enabled",
      showWeatherSection: "enabled",
      showFocusSection: "enabled",
    };

    this.settings = this.loadSettings();
    this.deviceThemeMedia = null;
    this.schedulerInterval = null;

    document.addEventListener("DOMContentLoaded", () => {
      this.initializeControls();
      this.applyAllSettings();
      this.setupEventListeners();

      // Built-in feature initializers
      this.initMouseTrail();
      this.initLoadingScreen();
      this.initScrollArrow();
      this.initVersionDateTime();

      // Wallpaper system
      this.initCustomBackgroundControls();
      this.applyCustomBackground(true);
      this.initWallpaperBlurControl();

      // Scheduler
      this.initSchedulerInterval();

      /* ---------- Live theme device listener ---------- */
      if (window.matchMedia) {
        this.deviceThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
        this.deviceThemeMedia.addEventListener("change", () => {
          if (this.settings.appearanceMode === "device") {
            this.applyAppearanceMode();
            this.applyCustomBackground(false);
          }
        });
      }

      /* ---------- Reduced motion preference ---------- */
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

      /* ---------- Cross-tab sync ---------- */
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

      /* ---------- Footer year ---------- */
      const yearSpan = document.getElementById("year");
      if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    });
  }

  /* ===================================================
   * Load / Save
   * =================================================== */
  loadSettings() {
    try {
      const stored = localStorage.getItem("websiteSettings");
      return stored
        ? { ...this.defaultSettings, ...JSON.parse(stored) }
        : { ...this.defaultSettings };
    } catch {
      return { ...this.defaultSettings };
    }
  }

  saveSettings() {
    localStorage.setItem("websiteSettings", JSON.stringify(this.settings));
  }

  /* ===================================================
   * UI Setup
   * =================================================== */
  initializeControls() {
    // Segmented controls
    this.initSegmentedControl("appearanceModeControl", this.settings.appearanceMode);
    this.initSegmentedControl("themeStyleControl", this.settings.themeStyle);
    this.updateSegmentedBackground("appearanceModeControl");
    this.updateSegmentedBackground("themeStyleControl");

    // Accent color picker
    const accentPicker = document.getElementById("accentColorPicker");
    if (accentPicker) {
      accentPicker.value = this.settings.accentColor;
      this.checkAccentColor(this.settings.accentColor);
    }

    // Font size slider
    const slider = document.getElementById("text-size-slider");
    const badge = document.getElementById("textSizeValue");
    if (slider && badge) {
      slider.value = this.settings.fontSize;
      badge.textContent = `${this.settings.fontSize}px`;
      this.updateSliderFill(slider);
    }

    // Scheduler selectors
    const schedulerSelect = document.getElementById("darkModeScheduler");
    const startInput = document.getElementById("darkModeStart");
    const endInput = document.getElementById("darkModeEnd");
    if (schedulerSelect) schedulerSelect.value = this.settings.darkModeScheduler;
    if (startInput) startInput.value = this.settings.darkModeStart;
    if (endInput) endInput.value = this.settings.darkModeEnd;
    this.toggleScheduleInputs(this.settings.darkModeScheduler);

    // Toggles
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

  /* ===================================================
   * Event Listeners
   * =================================================== */
  setupEventListeners() {
    /* ---------- Segmented Controls ---------- */
    ["appearanceMode", "themeStyle"].forEach((key) => {
      const control = document.getElementById(`${key}Control`);
      if (!control) return;

      control.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        // Prevent manual theme change while auto-scheduler is active
        if (key === "appearanceMode" && this.settings.darkModeScheduler === "auto") {
          alert(
            "Appearance mode is controlled by the Dark Mode Scheduler. Disable it to make manual changes."
          );
          this.initSegmentedControl(`${key}Control`, this.settings[key]);
          return;
        }

        this.settings[key] = btn.dataset.value;
        this.applySetting(key);
        this.saveSettings();
        this.initSegmentedControl(`${key}Control`, this.settings[key]);
        this.updateSegmentedBackground(`${key}Control`);
        if (key === "appearanceMode") this.applyCustomBackground(false);
      });
      this.updateSegmentedBackground(`${key}Control`);
    });

    /* ---------- Accent Picker ---------- */
    const accentPicker = document.getElementById("accentColorPicker");
    if (accentPicker) {
      accentPicker.addEventListener("input", (e) => {
        this.settings.accentColor = e.target.value;
        this.applyAccentColor();
        this.saveSettings();
      });
    }

    /* ---------- Font Size Slider ---------- */
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

    /* ---------- Dark Mode Scheduler ---------- */
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

    /* ---------- Blur Slider ---------- */
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

    /* ---------- Toggle Switches ---------- */
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

    /* ---------- Reset Buttons ---------- */
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

    /* ---------- Resize / Orientation ---------- */
    window.addEventListener("resize", () => this.fitWallpaperLayer());
    window.addEventListener("orientationchange", () => this.fitWallpaperLayer());
  }

  /* ===================================================
   * Appearance & Color
   * =================================================== */
  updateSliderFill(slider) {
    if (!slider) return;
    const pct =
      ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(90deg, var(--accent-color) ${pct}%, var(--slider-track-color) ${pct}%)`;
  }

  getContrastColor(hex) {
    if (!hex) return "#fff";
    hex = hex.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
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
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
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

    actions[key]?.();

    /* ---------- Section Visibility ---------- */
    if (key.startsWith("show")) {
      const sectionId = key
        .replace(/^show/, "")
        .replace(/^[A-Z]/, (m) => m.toLowerCase())
        .replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

      const el =
        document.getElementById(`${sectionId}-section`) ||
        document.querySelector(`[data-section-id="${sectionId}"]`);
      if (!el) return;

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

  /* ===================================================
   * Custom Background + Blur
   * =================================================== */
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
        transition: "opacity 1.2s ease, filter 0.3s ease"
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
        transition: "background 0.5s ease"
      });
      document.body.prepend(tint);
    }
    return { layer, tint };
  }

  initCustomBackgroundControls() {
    const upload = document.getElementById("customBgUpload");
    const remove = document.getElementById("removeCustomBg");
    const nameEl = document.getElementById("fileNameDisplay");
    const previewBox = document.getElementById("customBgPreviewContainer");
    const previewImg = document.getElementById("customBgPreview");
    const separator = document.getElementById("customBgSeparator");
    if (!upload || !previewBox || !previewImg) return;

    const savedBg = localStorage.getItem("customBackground");
    const savedName = localStorage.getItem("customBackgroundName");
    const savedBlur = localStorage.getItem("wallpaperBlur") ?? "0";

    if (savedBg) {
      if (nameEl) nameEl.textContent = savedName || "Saved background";
      if (remove) remove.style.display = "inline-block";
      this.toggleWallpaperBlurCard(true);
      previewBox.classList.add("visible");
      previewImg.src = savedBg;
      previewImg.onload = () => previewImg.classList.add("loaded");
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

    upload.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (nameEl) nameEl.textContent = file.name;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = evt.target.result;
        localStorage.setItem("customBackground", data);
        localStorage.setItem("customBackgroundName", file.name);

        const blurSlider = document.getElementById("blur-slider");
        const blurValue = blurSlider
          ? blurSlider.value
          : localStorage.getItem("wallpaperBlur") || "0";
        localStorage.setItem("wallpaperBlur", blurValue);

        this.applyCustomBackground(true);
        this.applyWallpaperBlur(blurValue);
        const blurBadge = document.getElementById("blurValue");
        if (blurBadge) blurBadge.textContent = `${blurValue}px`;

        if (remove) remove.style.display = "inline-block";
        this.toggleWallpaperBlurCard(true);

        previewBox.classList.add("visible");
        previewImg.classList.remove("loaded");
        previewImg.src = data;
        previewImg.onload = () => previewImg.classList.add("loaded");
        if (separator) separator.classList.add("visible");
      };
      reader.readAsDataURL(file);
    });

    if (remove) {
      remove.addEventListener("click", (e) => {
        e.preventDefault();
        ["customBackground", "customBackgroundName", "wallpaperBlur"].forEach((k) =>
          localStorage.removeItem(k)
        );
        const { layer } = this.ensureWallpaperLayers();
        layer.style.backgroundImage = "";
        layer.style.opacity = "0";
        this.applyCustomBackground(false);
        this.toggleWallpaperBlurCard(false);
        if (nameEl) nameEl.textContent = "No file chosen";
        remove.style.display = "none";
        previewBox.classList.remove("visible");
        previewImg.classList.remove("loaded");
        previewImg.src = "";
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
      document.body.style.background = "transparent";
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
      layer.style.backgroundImage = "";
      layer.style.opacity = "0";
    }

    const isDark =
      this.settings.appearanceMode === "dark" ||
      (this.settings.appearanceMode === "device" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    tint.style.background = isDark
      ? "rgba(0,0,0,0.45)"
      : "rgba(255,255,255,0.15)";

    const blurValue = localStorage.getItem("wallpaperBlur") ?? "0";
    this.applyWallpaperBlur(blurValue);
  }

  applyWallpaperBlur(value) {
    const layer = document.getElementById("wallpaper-layer");
    if (!layer) return;
    const blur = parseInt(value, 10) || 0;
    layer.style.filter = `blur(${blur}px) brightness(1.03)`;
  }

  initWallpaperBlurControl() {
    const slider = document.getElementById("blur-slider");
    const badge = document.getElementById("blurValue");
    if (!slider || !badge) return;

    const stored = localStorage.getItem("wallpaperBlur") ?? "0";
    slider.value = stored;
    badge.textContent = `${stored}px`;
    this.applyWallpaperBlur(stored);

    const fill = () => {
      const min = parseFloat(slider.min || "0");
      const max = parseFloat(slider.max || "40");
      const val = parseFloat(slider.value || stored);
      const pct = ((val - min) / (max - min)) * 100;
      slider.style.background = `linear-gradient(90deg, var(--accent-color) ${pct}%, var(--slider-track-color) ${pct}%)`;
    };
    fill();

    slider.addEventListener("input", (e) => {
      const val = e.target.value;
      badge.textContent = `${val}px`;
      localStorage.setItem("wallpaperBlur", val);
      this.applyWallpaperBlur(val);
      fill();
    });
  }

  toggleWallpaperBlurCard(show) {
    const card = document.getElementById("wallpaperBlurCard");
    if (card) card.style.display = show ? "" : "none";
  }

  syncWallpaperUIVisibility() {
    const hasBg = !!localStorage.getItem("customBackground");
    this.toggleWallpaperBlurCard(hasBg);
  }

  fitWallpaperLayer() {
    /* reserved for viewport adjustments if needed later */
  }

  /* ===================================================
   * Dark-Mode Scheduler
   * =================================================== */
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
    const [sH, sM] = this.settings.darkModeStart.split(":").map(Number);
    const [eH, eM] = this.settings.darkModeEnd.split(":").map(Number);
    const start = new Date();
    const end = new Date();
    start.setHours(sH, sM, 0, 0);
    end.setHours(eH, eM, 0, 0);

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
    if (group) group.style.display = mode === "auto" ? "" : "none";
  }

  /* ===================================================
   * Reset Controls
   * =================================================== */
  resetSectionVisibility() {
    if (confirm("Show all homepage sections again?")) {
      Object.keys(this.defaultSettings)
        .filter((k) => k.startsWith("show"))
        .forEach((k) => (this.settings[k] = "enabled"));
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
      ["sectionOrder", "customBackground", "customBackgroundName", "wallpaperBlur"].forEach((k) =>
        localStorage.removeItem(k)
      );
      const { layer } = this.ensureWallpaperLayers();
      layer.style.backgroundImage = "";
      layer.style.opacity = "0";
      const previewBox = document.getElementById("customBgPreviewContainer");
      const previewImg = document.getElementById("customBgPreview");
      const nameEl = document.getElementById("fileNameDisplay");
      const remove = document.getElementById("removeCustomBg");
      if (previewBox && previewImg) {
        previewBox.classList.remove("visible");
        previewImg.classList.remove("loaded");
        previewImg.src = "";
      }
      if (nameEl) nameEl.textContent = "No file chosen";
      if (remove) remove.style.display = "none";
      this.initializeControls();
      this.applyAllSettings();
      alert("All settings have been reset to factory defaults.");
    }
  }

  /* ===================================================
   * Live Battery + Version Info Time
   * =================================================== */
  initVersionDateTime() {
    const dateEl = document.getElementById("version-date");
    const timeEl = document.getElementById("version-time");
    if (!dateEl && !timeEl) return;

    const updateDateTime = () => {
      const now = new Date();
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      const dateStr = now.toLocaleDateString(undefined, options);
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (dateEl) dateEl.textContent = dateStr;
      if (timeEl) timeEl.textContent = timeStr;
    };

    updateDateTime();
    setInterval(updateDateTime, 60000);
  }

  initBatteryStatus() {
    const batterySection = document.getElementById("battery-section");
    const batteryLevel = document.getElementById("battery-level");
    const batteryStatus = document.getElementById("battery-charging-status");
    if (!batterySection || !navigator.getBattery) return;

    navigator.getBattery().then((battery) => {
      const updateBattery = () => {
        const level = Math.round(battery.level * 100);
        const charging = battery.charging ? "⚡ Charging" : "🔋 Not Charging";
        if (batteryLevel) batteryLevel.textContent = `Battery: ${level}%`;
        if (batteryStatus) batteryStatus.textContent = charging;
      };
      updateBattery();
      battery.addEventListener("levelchange", updateBattery);
      battery.addEventListener("chargingchange", updateBattery);
    }).catch(() => {
      if (batteryLevel) batteryLevel.textContent = "Battery info unavailable.";
    });
  }

  /* ===================================================
   * Misc Placeholder Initializers
   * =================================================== */
  initScrollArrow() {
    const btn = document.getElementById("scrollToTopBtn");
    if (!btn) return;

    const circle = btn.querySelector("#progressIndicator");
    const arrow = btn.querySelector("#scrollArrow");
    const percent = btn.querySelector("#scrollPercent");
    const radius = circle?.r?.baseVal?.value || 20;
    const circumference = 2 * Math.PI * radius;
    if (circle) {
      circle.style.strokeDasharray = `${circumference} ${circumference}`;
      circle.style.strokeDashoffset = circumference;
    }

    let lastScroll = 0;
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollTop / docHeight, 1);
      const offset = circumference - progress * circumference;
      if (circle) circle.style.strokeDashoffset = offset;
      if (percent) percent.textContent = `${Math.round(progress * 100)}%`;

      if (scrollTop > 200) btn.classList.add("visible");
      else btn.classList.remove("visible");

      // Flip arrow depending on scroll direction
      if (arrow) {
        if (scrollTop > lastScroll) arrow.classList.add("down");
        else arrow.classList.remove("down");
      }

      lastScroll = scrollTop <= 0 ? 0 : scrollTop;
    };

    window.addEventListener("scroll", update);
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    update();
  }

  initLoadingScreen() {
    const loadingEl = document.getElementById("loading-screen");
    if (!loadingEl) return;
    window.addEventListener("load", () => {
      loadingEl.classList.add("fade-out");
      setTimeout(() => loadingEl.remove(), 600);
    });
  }

  initMouseTrail() {
    if (this.settings.mouseTrail !== "enabled") return;
    const trail = document.createElement("div");
    trail.id = "mouse-trail";
    Object.assign(trail.style, {
      position: "fixed",
      width: "12px",
      height: "12px",
      borderRadius: "50%",
      background: "var(--accent-color)",
      pointerEvents: "none",
      mixBlendMode: "difference",
      opacity: "0.6",
      transition: "transform 0.1s ease",
      zIndex: "9999",
    });
    document.body.appendChild(trail);
    document.addEventListener("mousemove", (e) => {
      trail.style.transform = `translate(${e.clientX - 6}px, ${e.clientY - 6}px)`;
    });
  }

  /* ===================================================
   * Final Initialization Helpers
   * =================================================== */
  startLiveFeatures() {
    this.initBatteryStatus();
    this.initVersionDateTime();
  }
}

/* ===================================================
 * Initialize Singleton
 * =================================================== */
if (!window.settingsManagerInstance) {
  window.settingsManagerInstance = new SettingsManager();
  window.settingsManagerInstance.startLiveFeatures();
}
