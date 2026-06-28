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

      // Sun scheduler
      darkModeLat: null,
      darkModeLon: null,
      darkModeSunCache: null,

      // Per-day scheduling
      darkModePerDayEnabled: "disabled",
      darkModePerDayRules: {
        weekdays: { mode: "sunset_to_sunrise", start: "20:00", end: "06:00" },
        weekends: { mode: "custom", start: "21:00", end: "07:00" },
        holidays: { mode: "always_dark", start: "20:00", end: "06:00" },
      },
      darkModeHolidayDates: [],

      // Auto-recommend scheduler
      autoRecommendScheduler: "enabled",
      themeBehaviorLog: [],
      dismissedRecommendations: {},
      pendingScheduleRecommendation: null,

      // Typography & accessibility
      fontSize: 16,
      focusOutline: "enabled",
      motionEffects: "enabled",
      highContrast: "disabled",
      dyslexiaFont: "disabled",
      underlineLinks: "disabled",

      // Fun / performance
      loadingScreen: "disabled",
      mouseTrail: "disabled",
      liveStatus: "disabled",

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
      showQuoteSection: "enabled",
      showBusinessSection: "enabled",
      showTechInformation: "enabled",
      showDisabilitiesSection: "enabled",
      showLiveActivity: "enabled",
      showLeader: "enabled",
    };

    /* =============================
       Instance State
    ============================= */
    this.settings = this.loadSettings();
    this.deviceThemeMedia = null;
    this.schedulerInterval = null;

    const runInitialization = () => {
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
          const eff = this.getEffectiveScheduleForNow();
          const schedulerActive = eff.mode && eff.mode !== "off";

          if (this.settings.appearanceMode === "device" && !schedulerActive) {
            this.applyAppearanceMode();
            this.applyCustomBackground(false);
          }
        });

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
          this.toggleScheduleInputs();
          this.syncWallpaperUIVisibility();
          this.initCustomBackgroundControls();
          this.initWallpaperBlurControl();
          this.applyNotificationUI();
          this.updateDarkModeStatusUI();
          this.syncLocationButtonUI();
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
    };

    // Safe DOM-ready conditional guard
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", runInitialization);
    } else {
      runInitialization();
    }
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

    try {
      const existing = JSON.parse(localStorage.getItem("websiteSettings") || "{}");

      if (existing.notifications) {
        toSave.notifications = existing.notifications;
      }
    } catch {
      // Ignore broken localStorage JSON
    }

    localStorage.setItem("websiteSettings", JSON.stringify(toSave));
  }

  /* =============================
     UI Setup
  ============================= */
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

    this.toggleScheduleInputs();

    const toggles = Object.keys(this.defaultSettings).filter(
      (k) =>
        typeof this.defaultSettings[k] === "string" &&
        (this.defaultSettings[k] === "enabled" || this.defaultSettings[k] === "disabled")
    );

    toggles.forEach((key) => this.setToggle(key));

    this.syncWallpaperUIVisibility();
    this.updateDarkModeStatusUI();
    this.syncLocationButtonUI();

    this.initPerDayControlsUI();
    this.initAutoRecommendUI();
    this.renderHolidayListUI();
    this.renderScheduleRecommendationUI();
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
    const appearanceControl = document.getElementById("appearanceModeControl");

    if (appearanceControl) {
      appearanceControl.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn || !btn.dataset.value) return;

        if (!this.isAppearanceManualAllowed()) {
          alert("Appearance mode is controlled by the Scheduler. Turn it OFF to change this.");
          this.checkDarkModeSchedule(true);
          return;
        }

        this.settings.appearanceMode = btn.dataset.value;
        this.applySetting("appearanceMode");
        this.saveSettings();

        if (btn.dataset.value === "dark" || btn.dataset.value === "light") {
          this.logThemeBehavior(btn.dataset.value);
          this.maybeRecommendSchedule();
          this.renderScheduleRecommendationUI();
        }

        appearanceControl
          .querySelectorAll("button")
          .forEach((b) => b.classList.remove("active"));

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
      this.settings.darkModeScheduler = e.target.value;
      this.saveSettings();
      this.toggleScheduleInputs();
      this.syncLocationButtonUI();
      this.updateDarkModeStatusUI();
      this.checkDarkModeSchedule(true);
    });

    startInput?.addEventListener("change", (e) => {
      this.settings.darkModeStart = e.target.value;
      this.saveSettings();
      this.checkDarkModeSchedule(true);
      this.updateDarkModeStatusUI();
    });

    endInput?.addEventListener("change", (e) => {
      this.settings.darkModeEnd = e.target.value;
      this.saveSettings();
      this.checkDarkModeSchedule(true);
      this.updateDarkModeStatusUI();
    });

    document.getElementById("setLocationBtn")?.addEventListener("click", () => {
      this.requestUserLocation();
    });

    document.getElementById("darkModePerDayToggle")?.addEventListener("change", (e) => {
      this.settings.darkModePerDayEnabled = e.target.checked ? "enabled" : "disabled";
      this.saveSettings();
      this.initPerDayControlsUI();
      this.toggleScheduleInputs();
      this.updateDarkModeStatusUI();
      this.syncLocationButtonUI();
      this.checkDarkModeSchedule(true);
    });

    document.getElementById("perDayGroupSelect")?.addEventListener("change", () => {
      this.syncPerDayEditorFromSettings();
    });

    document.getElementById("perDayModeSelect")?.addEventListener("change", (e) => {
      const group = document.getElementById("perDayGroupSelect")?.value || "weekdays";
      this.ensurePerDayRule(group);
      this.settings.darkModePerDayRules[group].mode = e.target.value;
      this.saveSettings();
      this.syncPerDayEditorFromSettings();
      this.toggleScheduleInputs();
      this.updateDarkModeStatusUI();
      this.syncLocationButtonUI();
      this.checkDarkModeSchedule(true);
    });

    document.getElementById("perDayStartTime")?.addEventListener("change", (e) => {
      const group = document.getElementById("perDayGroupSelect")?.value || "weekdays";
      this.ensurePerDayRule(group);
      this.settings.darkModePerDayRules[group].start = e.target.value;
      this.saveSettings();
      this.toggleScheduleInputs();
      this.updateDarkModeStatusUI();
      this.checkDarkModeSchedule(true);
    });

    document.getElementById("perDayEndTime")?.addEventListener("change", (e) => {
      const group = document.getElementById("perDayGroupSelect")?.value || "weekdays";
      this.ensurePerDayRule(group);
      this.settings.darkModePerDayRules[group].end = e.target.value;
      this.saveSettings();
      this.toggleScheduleInputs();
      this.updateDarkModeStatusUI();
      this.checkDarkModeSchedule(true);
    });

    document.getElementById("addHolidayDateBtn")?.addEventListener("click", () => {
      const input = document.getElementById("holidayDateInput");
      const val = input?.value;
      if (!val) return;

      const arr = Array.isArray(this.settings.darkModeHolidayDates)
        ? this.settings.darkModeHolidayDates
        : [];

      if (!arr.includes(val)) arr.push(val);

      arr.sort();
      this.settings.darkModeHolidayDates = arr;
      this.saveSettings();
      this.renderHolidayListUI();
      this.toggleScheduleInputs();
      this.updateDarkModeStatusUI();
      this.checkDarkModeSchedule(true);
    });

    document.getElementById("clearHolidayDatesBtn")?.addEventListener("click", () => {
      this.settings.darkModeHolidayDates = [];
      this.saveSettings();
      this.renderHolidayListUI();
      this.toggleScheduleInputs();
      this.updateDarkModeStatusUI();
      this.checkDarkModeSchedule(true);
    });

    document.getElementById("autoRecommendSchedulerToggle")?.addEventListener("change", (e) => {
      this.settings.autoRecommendScheduler = e.target.checked ? "enabled" : "disabled";
      this.saveSettings();
    });

    document.getElementById("applyScheduleRecommendationBtn")?.addEventListener("click", () => {
      const rec = this.settings.pendingScheduleRecommendation;
      if (!rec) return;

      this.settings.darkModeScheduler = "custom";
      this.settings.darkModeStart = rec.start;
      this.settings.darkModeEnd = rec.end;
      this.settings.pendingScheduleRecommendation = null;
      this.saveSettings();

      const schedulerSelect2 = document.getElementById("darkModeScheduler");
      const startInput2 = document.getElementById("darkModeStart");
      const endInput2 = document.getElementById("darkModeEnd");

      if (schedulerSelect2) schedulerSelect2.value = "custom";
      if (startInput2) startInput2.value = rec.start;
      if (endInput2) endInput2.value = rec.end;

      this.toggleScheduleInputs();
      this.renderScheduleRecommendationUI();
      this.showToast("Schedule Applied", `Dark mode will follow ${rec.start} → ${rec.end}.`);
      this.updateDarkModeStatusUI();
      this.checkDarkModeSchedule(true);
    });

    document.getElementById("dismissScheduleRecommendationBtn")?.addEventListener("click", () => {
      const rec = this.settings.pendingScheduleRecommendation;

      if (rec?.recId) {
        this.settings.dismissedRecommendations = this.settings.dismissedRecommendations || {};
        this.settings.dismissedRecommendations[rec.recId] = true;
      }

      this.settings.pendingScheduleRecommendation = null;
      this.saveSettings();
      this.renderScheduleRecommendationUI();
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

  /* =============================
     Appearance
  ============================= */
  isAppearanceManualAllowed() {
    return (
      this.settings.darkModeScheduler === "off" &&
      this.settings.darkModePerDayEnabled !== "enabled"
    );
  }

  setThemeClasses(isDark) {
    document.documentElement.classList.toggle("dark-mode", isDark);
    document.documentElement.classList.toggle("light-mode", !isDark);

    document.body.classList.toggle("dark-mode", isDark);
    document.body.classList.toggle("light-mode", !isDark);
  }

  applyAppearanceMode() {
    const isDark =
      this.settings.appearanceMode === "dark" ||
      (this.settings.appearanceMode === "device" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    this.setThemeClasses(isDark);
    this.applyAccentColor();
  }

  syncAppearanceModeUIForScheduler(isDark) {
    const effectiveValue = isDark ? "dark" : "light";
    this.initSegmentControl = this.initSegmentedControl("appearanceModeControl", effectiveValue);
    this.updateSegmentedBackground("appearanceModeControl");

    const row = document.getElementById("appearanceModeRow");
    if (row) row.classList.toggle("disabled", true);
  }

  syncAppearanceModeUIForManual() {
    this.initSegmentedControl("appearanceModeControl", this.settings.appearanceMode);
    this.updateSegmentedBackground("appearanceModeControl");

    const row = document.getElementById("appearanceModeRow");
    if (row) row.classList.toggle("disabled", !this.isAppearanceManualAllowed());
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

    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const yiq = (r * 299 + g * 587 + b * 114) / 1000;

    return yiq >= 128 ? "#000" : "#fff";
  }

  checkAccentColor(hex) {
    const warn = document.getElementById("whiteAccentWarning");
    if (!warn || !hex) return;

    const isLight =
      document.documentElement.classList.contains("light-mode") ||
      document.body.classList.contains("light-mode");

    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);

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

        previewContainer.classList.add("visible");
        previewImage.classList.remove("loaded");
        previewImage.src = imageData;
        previewImage.onload = () => previewImage.classList.add("loaded");

        if (separator) separator.classList.add("visible");
      };

      reader.readAsDataURL(file);
    });

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
          setTimeout(() => {
            layer.style.opacity = "1";
          }, 50);
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
      document.documentElement.classList.contains("dark-mode") ||
      document.body.classList.contains("dark-mode");

    tint.style.background = isDark ? "rgba(0, 0, 0, 0.45)" : "rgba(255, 255, 255, 0.15)";

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
     Per-Day Scheduling
  ============================= */
  isWeekend(d = new Date()) {
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  todayISO(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  }

  ensurePerDayRule(groupKey) {
    this.settings.darkModePerDayRules = this.settings.darkModePerDayRules || {};

    if (!this.settings.darkModePerDayRules[groupKey]) {
      this.settings.darkModePerDayRules[groupKey] = {
        mode: "off",
        start: "20:00",
        end: "06:00",
      };
    }
  }

  getEffectiveScheduleForNow() {
    if (this.settings.darkModePerDayEnabled === "enabled") {
      const today = this.todayISO(new Date());
      const holidays = Array.isArray(this.settings.darkModeHolidayDates)
        ? this.settings.darkModeHolidayDates
        : [];

      const isHoliday = holidays.includes(today);
      const groupKey = isHoliday ? "holidays" : this.isWeekend() ? "weekends" : "weekdays";
      const rule = this.settings.darkModePerDayRules?.[groupKey];

      if (rule && rule.mode) {
        return {
          source: `per_day:${groupKey}`,
          mode: rule.mode,
          start: rule.start ?? this.settings.darkModeStart,
          end: rule.end ?? this.settings.darkModeEnd,
        };
      }
    }

    return {
      source: "global",
      mode: this.settings.darkModeScheduler || "off",
      start: this.settings.darkModeStart,
      end: this.settings.darkModeEnd,
    };
  }

  initPerDayControlsUI() {
    const toggle = document.getElementById("darkModePerDayToggle");
    const panel = document.getElementById("perDaySchedulePanel");

    if (toggle) toggle.checked = this.settings.darkModePerDayEnabled === "enabled";
    if (panel) panel.style.display = this.settings.darkModePerDayEnabled === "enabled" ? "" : "none";

    this.syncPerDayEditorFromSettings();
  }

  syncPerDayEditorFromSettings() {
    const groupSel = document.getElementById("perDayGroupSelect");
    const modeSel = document.getElementById("perDayModeSelect");
    const startEl = document.getElementById("perDayStartTime");
    const endEl = document.getElementById("perDayEndTime");
    const customBox = document.getElementById("perDayCustomTimes");

    if (!groupSel || !modeSel) return;

    const group = groupSel.value || "weekdays";
    this.ensurePerDayRule(group);

    const rule = this.settings.darkModePerDayRules[group];

    modeSel.value = rule.mode || "off";

    const showCustom = rule.mode === "custom";
    if (customBox) customBox.style.display = showCustom ? "" : "none";
    if (startEl) startEl.value = rule.start || "20:00";
    if (endEl) endEl.value = rule.end || "06:00";
  }

  renderHolidayListUI() {
    const el = document.getElementById("holidayListText");
    if (!el) return;

    const arr = Array.isArray(this.settings.darkModeHolidayDates)
      ? this.settings.darkModeHolidayDates
      : [];

    el.textContent = arr.length ? arr.join(", ") : "None";
  }

  initAutoRecommendUI() {
    const t = document.getElementById("autoRecommendSchedulerToggle");
    if (t) t.checked = this.settings.autoRecommendScheduler !== "disabled";
  }

  renderScheduleRecommendationUI() {
    const card = document.getElementById("scheduleRecommendationCard");
    const text = document.getElementById("scheduleRecommendationText");

    if (!card || !text) return;

    const rec = this.settings.pendingScheduleRecommendation;

    if (!rec) {
      card.style.display = "none";
      return;
    }

    card.style.display = "";
    text.textContent = `You often switch around the same time. Auto-schedule dark mode from ${rec.start} → ${rec.end}?`;
  }

  logThemeBehavior(newMode) {
    if (newMode !== "dark" && newMode !== "light") return;

    const entry = { t: Date.now(), mode: newMode };
    const log = Array.isArray(this.settings.themeBehaviorLog)
      ? this.settings.themeBehaviorLog
      : [];

    log.push(entry);

    while (log.length > 60) log.shift();

    this.settings.themeBehaviorLog = log;
    this.saveSettings();
  }

  minutesSinceMidnight(ts) {
    const d = new Date(ts);
    return d.getHours() * 60 + d.getMinutes();
  }

  median(nums) {
    const a = [...nums].sort((x, y) => x - y);
    const mid = Math.floor(a.length / 2);

    return a.length % 2 ? a[mid] : Math.round((a[mid - 1] + a[mid]) / 2);
  }

  stddev(nums) {
    const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
    const v = nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length;

    return Math.sqrt(v);
  }

  minutesToHHMM(mins) {
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");

    return `${h}:${m}`;
  }

  maybeRecommendSchedule() {
    if (this.settings.autoRecommendScheduler === "disabled") return;
    if (this.settings.darkModeScheduler !== "off") return;
    if (this.settings.pendingScheduleRecommendation) return;

    const log = Array.isArray(this.settings.themeBehaviorLog)
      ? this.settings.themeBehaviorLog
      : [];

    if (log.length < 6) return;

    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const recent = log.filter((e) => e.t >= cutoff);

    const darkEvents = recent.filter((e) => e.mode === "dark");
    const lightEvents = recent.filter((e) => e.mode === "light");

    if (darkEvents.length < 3 || lightEvents.length < 3) return;

    const darkMins = darkEvents.map((e) => this.minutesSinceMidnight(e.t));
    const lightMins = lightEvents.map((e) => this.minutesSinceMidnight(e.t));

    const darkMed = this.median(darkMins);
    const lightMed = this.median(lightMins);

    const darkSd = this.stddev(darkMins);
    const lightSd = this.stddev(lightMins);

    if (darkSd > 35 || lightSd > 35) return;

    const recId = `autoSched_${darkMed}_${lightMed}`;

    if (this.settings.dismissedRecommendations?.[recId]) return;

    const start = this.minutesToHHMM(darkMed);
    const end = this.minutesToHHMM(lightMed);

    this.settings.pendingScheduleRecommendation = { recId, start, end };
    this.saveSettings();
  }

  /* =============================
     Scheduler
  ============================= */
  initSchedulerInterval() {
    clearInterval(this.schedulerInterval);
    this.checkDarkModeSchedule(true);
    this.schedulerInterval = setInterval(() => this.checkDarkModeSchedule(), 60000);
  }

  dateKey(d = new Date()) {
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  formatTime12h(date) {
    const d = new Date(date);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const hh = ((h + 11) % 12) + 1;
    const mm = String(m).padStart(2, "0");

    return `${hh}:${mm} ${ampm}`;
  }

  ensureSunCache() {
    if (typeof SunCalc === "undefined") return null;

    const lat = this.settings.darkModeLat;
    const lon = this.settings.darkModeLon;

    if (lat == null || lon == null) return null;

    const todayKey = this.dateKey(new Date());
    const cached = this.settings.darkModeSunCache;

    if (cached && cached.dateKey === todayKey && cached.lat === lat && cached.lon === lon) {
      return cached;
    }

    const times = SunCalc.getTimes(new Date(), lat, lon);

    const next = {
      dateKey: todayKey,
      lat,
      lon,
      sunriseISO: times.sunrise.toISOString(),
      sunsetISO: times.sunset.toISOString(),
    };

    this.settings.darkModeSunCache = next;
    this.saveSettings();

    return next;
  }

  syncLocationButtonUI() {
    const btn = document.getElementById("setLocationBtn");
    if (!btn) return;

    const eff = this.getEffectiveScheduleForNow();
    const mode = eff.mode || "off";

    const needsLocation =
      (mode === "sunset_to_sunrise" || mode === "sunrise_to_sunset") &&
      (this.settings.darkModeLat == null || this.settings.darkModeLon == null);

    btn.style.display = needsLocation ? "" : "none";
  }

  updateDarkModeStatusUI() {
    const el = document.getElementById("darkModeStatusText");
    if (!el) return;

    const eff = this.getEffectiveScheduleForNow();
    const mode = eff.mode || "off";
    const now = new Date();

    const tag = eff.source?.startsWith("per_day:")
      ? ` • ${eff.source.replace("per_day:", "").toUpperCase()}`
      : "";

    if (mode === "off") {
      el.textContent = "Scheduler is off.";
      return;
    }

    if (mode === "always_dark") {
      el.textContent = `Dark mode is always on.${tag}`;
      return;
    }

    if (mode === "always_light") {
      el.textContent = `Light mode is always on.${tag}`;
      return;
    }

    if (mode === "custom") {
      const [sh, sm] = (eff.start || this.settings.darkModeStart).split(":").map(Number);
      const [eh, em] = (eff.end || this.settings.darkModeEnd).split(":").map(Number);

      const start = new Date(now);
      start.setHours(sh, sm, 0, 0);

      const end = new Date(now);
      end.setHours(eh, em, 0, 0);

      let isDark;
      let nextSwitch;

      if (end <= start) {
        isDark = now >= start || now < end;

        if (isDark) {
          nextSwitch = new Date(end);
          if (now >= start) nextSwitch.setDate(nextSwitch.getDate() + 1);
        } else {
          nextSwitch = start;
        }
      } else {
        isDark = now >= start && now < end;
        nextSwitch = isDark ? end : start;
      }

      el.textContent = `${isDark ? "Dark mode" : "Light mode"} until ${this.formatTime12h(nextSwitch)}.${tag}`;
      return;
    }

    if (mode === "sunset_to_sunrise" || mode === "sunrise_to_sunset") {
      const lat = this.settings.darkModeLat;
      const lon = this.settings.darkModeLon;

      if (lat == null || lon == null) {
        el.textContent = `Needs location to calculate sunrise/sunset.${tag}`;
        return;
      }

      const sun = this.ensureSunCache();

      if (!sun) {
        el.textContent = `Sun times unavailable. SunCalc may be missing.${tag}`;
        return;
      }

      const sunrise = new Date(sun.sunriseISO);
      const sunset = new Date(sun.sunsetISO);

      let isDark;
      let nextLabel;

      if (mode === "sunset_to_sunrise") {
        isDark = now >= sunset || now < sunrise;
        // FIXED: Stripped the trailing broken template evaluation context wrapper
        nextLabel = isDark ? this.formatTime12h(sunrise) : this.formatTime12h(sunset);
      } else {
        isDark = now >= sunrise && now < sunset;
        nextLabel = isDark ? this.formatTime12h(sunset) : this.formatTime12h(sunrise);
      }

      el.textContent = `${isDark ? "Dark mode" : "Light mode"} until ${nextLabel}.${tag}`;
      return;
    }

    el.textContent = `Unknown scheduler mode.${tag}`;
  }

  requestUserLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation isn’t supported on this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.settings.darkModeLat = pos.coords.latitude;
        this.settings.darkModeLon = pos.coords.longitude;
        this.settings.darkModeSunCache = null;

        this.saveSettings();

        this.showToast("Location Saved", "Sunrise/sunset scheduling is now ready.");
        this.syncLocationButtonUI();
        this.checkDarkModeSchedule(true);
        this.updateDarkModeStatusUI();
      },
      (err) => {
        console.error("Location error:", err);
        alert("Couldn’t get your location. Please allow location permission.");
        this.syncLocationButtonUI();
        this.updateDarkModeStatusUI();
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 3600000,
      }
    );
  }

  checkDarkModeSchedule(force = false) {
    const eff = this.getEffectiveScheduleForNow();
    const mode = eff.mode || "off";

    this.toggleScheduleInputs();
    this.updateDarkModeStatusUI();
    this.syncLocationButtonUI();

    if (mode === "off") {
      this.syncAppearanceModeUIForManual();

      if (force) {
        this.applyAppearanceMode();
        this.applyCustomBackground(false);
      }

      return;
    }

    if (mode === "always_dark") {
      this.setThemeClasses(true);
      this.applyAccentColor();
      this.applyCustomBackground(false);
      this.syncAppearanceModeUIForScheduler(true);
      return;
    }

    if (mode === "always_light") {
      this.setThemeClasses(false);
      this.applyAccentColor();
      this.applyCustomBackground(false);
      this.syncAppearanceModeUIForScheduler(false);
      return;
    }

    if (mode === "custom") {
      const now = new Date();

      const [startH, startM] = (eff.start || this.settings.darkModeStart).split(":").map(Number);
      const [endH, endM] = (eff.end || this.settings.darkModeEnd).split(":").map(Number);

      const start = new Date(now);
      start.setHours(startH, startM, 0, 0);

      const end = new Date(now);
      end.setHours(endH, endM, 0, 0);

      const isDark = end <= start
        ? now >= start || now < end
        : now >= start && now < end;

      this.setThemeClasses(isDark);
      this.applyAccentColor();
      this.applyCustomBackground(false);
      this.syncAppearanceModeUIForScheduler(isDark);
      return;
    }

    if (mode === "sunset_to_sunrise" || mode === "sunrise_to_sunset") {
      const lat = this.settings.darkModeLat;
      const lon = this.settings.darkModeLon;

      if (lat == null || lon == null) {
        this.syncAppearanceModeUIForManual();

        if (force) {
          this.applyAppearanceMode();
          this.applyCustomBackground(false);
        }

        return;
      }

      const sun = this.ensureSunCache();

      if (!sun) {
        this.syncAppearanceModeUIForManual();

        if (force) {
          this.applyAppearanceMode();
          this.applyCustomBackground(false);
        }

        return;
      }

      const now = new Date();
      const sunrise = new Date(sun.sunriseISO);
      const sunset = new Date(sun.sunsetISO);

      const isDark =
        mode === "sunset_to_sunrise"
          ? now >= sunset || now < sunrise
          : now >= sunrise && now < sunset;

      this.setThemeClasses(isDark);
      this.applyAccentColor();
      this.applyCustomBackground(false);
      this.syncAppearanceModeUIForScheduler(isDark);
      return;
    }

    this.syncAppearanceModeUIForManual();

    if (force) {
      this.applyAppearanceMode();
      this.applyCustomBackground(false);
    }
  }

  toggleScheduleInputs() {
    const group = document.getElementById("customScheduleGroup");
    if (!group) return;

    const eff = this.getEffectiveScheduleForNow();
    group.style.display = eff.mode === "custom" ? "" : "none";
  }

  /* =============================
     Apply Settings
  ============================= */
  applyAllSettings() {
    Object.keys(this.defaultSettings).forEach((k) => this.applySetting(k));

    this.applyCustomBackground(false);
    this.toggleScheduleInputs();
    this.syncWallpaperUIVisibility();
    this.checkDarkModeSchedule(true);
    this.updateDarkModeStatusUI();
    this.syncLocationButtonUI();

    this.initPerDayControlsUI();
    this.initAutoRecommendUI();
    this.renderHolidayListUI();
    this.renderScheduleRecommendationUI();
    this.applyNotificationUI();
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
        document.body.classList.toggle("high-contrast", this.settings.highContrast === "enabled"),

      dyslexiaFont: () =>
        document.body.classList.toggle("dyslexia-font", this.settings.dyslexiaFont === "enabled"),

      underlineLinks: () =>
        document.body.classList.toggle("underline-links", this.settings.underlineLinks === "enabled"),

      mouseTrail: () =>
        document.body.classList.toggle("mouse-trail-enabled", this.settings.mouseTrail === "enabled"),
    };

    actions[key]?.();

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

        el.style.transition =
          "opacity 0.3s ease, max-height 0.3s ease, padding 0.3s ease, margin 0.3s ease";
        el.style.overflow = "hidden";

        if (visible) {
          el.style.display = "";
          el.style.maxHeight = "0";
          el.style.opacity = "0";

          const height = el.scrollHeight + "px";

          requestAnimationFrame(() => {
            el.style.maxHeight = height;
            el.style.opacity = "1";
          });

          el.addEventListener(
            "transitionend",
            function handler() {
              el.style.maxHeight = "";
              el.removeEventListener("transitionend", handler);
            }
          );
        } else {
          const height = el.scrollHeight + "px";

          el.style.maxHeight = height;
          el.style.opacity = "1";

          requestAnimationFrame(() => {
            el.style.maxHeight = "0";
            el.style.opacity = "0";
            el.style.paddingTop = "0";
            el.style.paddingBottom = "0";
            el.style.marginTop = "0";
            el.style.marginBottom = "0";
          });

          el.addEventListener(
            "transitionend",
            function handler() {
              el.style.display = "none";
              el.style.paddingTop = "";
              el.style.paddingBottom = "";
              el.style.marginTop = "";
              el.style.marginBottom = "";
              el.removeEventListener("transitionend", handler);
            }
          );
        }
      }
    }

    if (key === "showLiveActivity") {
      const liveActivity = document.getElementById("live-activity");

      if (liveActivity) {
        const visible = this.settings.showLiveActivity === "enabled";

        if (visible) {
          liveActivity.style.display = "";
          requestAnimationFrame(() => {
            liveActivity.style.opacity = "1";
          });

          if (typeof updateLiveStatus === "function") {
            setTimeout(() => updateLiveStatus(), 300);
          }
        } else {
          liveActivity.style.opacity = "0";
          setTimeout(() => {
            liveActivity.style.display = "none";
          }, 250);
        }
      }
    }
  }

  /* =============================
     In-Site Notifications
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

  escapeHTML(value) {
    // FIXED: Corrected mapping values to real entity targets instead of replacing items with themselves
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  showToast(title, message) {
    const container = this.ensureToastContainer();
    const toast = document.createElement("div");

    const accent =
      getComputedStyle(document.body).getPropertyValue("--accent-color") ||
      getComputedStyle(document.documentElement).getPropertyValue("--accent-color") ||
      "#007aff";

    toast.className = "toast";

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

    toast.innerHTML = `
      <strong style="display:block;margin-bottom:4px;">
        ${this.escapeHTML(title)}
      </strong>
      <span>${this.escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform =
