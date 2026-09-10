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
      showEducationPage: "enabled",
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

      // Ensure theme assets (logo/icons) are applied on init
      this.applyThemeAssets();
      // Make icons themed (inline SVGs, wrap rasters)
      this.applyThemeToIcons();

      // mark page ready to avoid layout flash
      document.documentElement.classList.add('js-ready');
      document.body.classList.add('page-ready');
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

    // Re-apply theme assets (icons/logos) because accent or theme may have changed
    this.applyThemeAssets();
  }

  /* New method: apply theme-aware assets and icon variables */
  applyThemeAssets() {
    // set icon color variable
    const iconColor = getComputedStyle(document.documentElement).getPropertyValue('--icon-color') || getComputedStyle(document.body).getPropertyValue('--icon-color');
    if (iconColor) {
      document.documentElement.style.setProperty('--icon-color', iconColor.trim());
    }

    // Swap site logo if present
    try {
      const logo = document.getElementById('site-logo');
      if (logo) {
        const isLight = document.documentElement.classList.contains('light-mode') || document.body.classList.contains('light-mode') || document.documentElement.classList.contains('light-e') || document.body.classList.contains('light-e');
        const lightLogo = '/assets/logo-light.svg';
        const darkLogo = '/assets/logo-dark.svg';
        logo.src = isLight ? lightLogo : darkLogo;
        logo.alt = logo.alt || 'Caleb';
      }
    } catch (e) {
      // fail silently
    }

    // Attempt to theme icons as well
    this.applyThemeToIcons();
  }

  /* New: Inline SVGs and wrap raster icons to make them theme-aware without uploads */
  async applyThemeToIcons() {
    // Inline SVG images marked with .themed-icon (src ends with .svg)
    const svgImgs = Array.from(document.querySelectorAll('img.themed-icon'));
    for (const img of svgImgs) {
      try {
        const src = img.getAttribute('src');
        if (!src || !src.endsWith('.svg')) continue;
        const res = await fetch(src, { cache: 'no-store' });
        if (!res.ok) continue;
        const text = await res.text();
        const container = document.createElement('span');
        container.className = 'themed-icon-wrapper';
        container.innerHTML = text;
        const svg = container.querySelector('svg');
        if (!svg) continue;
        svg.setAttribute('role', img.getAttribute('role') || 'img');
        svg.setAttribute('aria-hidden', img.getAttribute('aria-hidden') || 'true');
        // Set sizes if present
        if (img.width) svg.style.width = img.width + 'px';
        if (img.height) svg.style.height = img.height + 'px';
        // Replace common fill values with currentColor when safe
        svg.querySelectorAll('[fill]').forEach(node => {
          const fill = node.getAttribute('fill');
          if (fill && fill !== 'none') {
            // avoid overwriting gradients or urls
            if (!fill.startsWith('url(') && !/^rgba?\(/.test(fill)) node.setAttribute('fill', 'currentColor');
          }
        });
        img.replaceWith(svg);
        svg.classList.add('icon-svg');
      } catch (e) {
        // ignore and leave original
      }
    }

    // Wrap raster icons (PNG/JPG) marked with .themed-icon-raster
    const rasterImgs = Array.from(document.querySelectorAll('img.themed-icon-raster'));
    rasterImgs.forEach(img => {
      const parent = img.parentElement;
      if (parent && parent.classList.contains('raster-icon-wrap')) return;
      const wrap = document.createElement('span');
      wrap.className = 'raster-icon-wrap';
      // size inherit
      const size = img.getAttribute('data-size') || img.width || img.height || 28;
      wrap.style.width = typeof size === 'number' ? `${size}px` : size;
      wrap.style.height = typeof size === 'number' ? `${size}px` : size;
      img.style.width = '70%';
      img.style.height = '70%';
      img.style.objectFit = 'contain';
      img.style.display = 'inline-block';
      img.style.verticalAlign = 'middle';
      parent.replaceChild(wrap, img);
      wrap.appendChild(img);
    });
  }

  /* =============================
     Misc (rest of class follows — unchanged)
  ============================= */

  /* ... the rest of settings.js stays unchanged and is included in repo ... */
}

/* =============================
   Initialize Singleton
============================= */
if (!window.settingsManagerInstance) {
  window.settingsManagerInstance = new SettingsManager();
}
