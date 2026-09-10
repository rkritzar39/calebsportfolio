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
      // ... (rest unchanged) ...
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
    };

    // Safe DOM-ready conditional guard
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", runInitialization);
    } else {
      runInitialization();
    }
  }

  /* ... existing methods unchanged until applyAccentColor ... */

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
  }

  /* ... rest of file unchanged ... */
}

/* =============================
   Initialize Singleton
============================= */
if (!window.settingsManagerInstance) {
  window.settingsManagerInstance = new SettingsManager();
}
