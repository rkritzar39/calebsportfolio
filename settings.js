/* ===========================================================
 * settings.js — Caleb v26 (Onyx / Liquid Glass Final)
 * ===========================================================
 * Features:
 * - Theme switching (device/light/dark + scheduler)
 * - Custom background with blur, live preview, and persistent save
 * - Accent color + safe visibility warning
 * - Accessibility and font controls
 * - Homepage section visibility (including Time/Weather/Focus/Battery)
 * - Rearranging enabled flag + layout reset
 * - Live battery section compatibility
 * - All settings persist to localStorage
 * =========================================================== */

class SettingsManager {
  constructor() {
    this.defaultSettings = {
      // Appearance
      appearanceMode: "device",
      accentColor: "#3ddc84",

      // Scheduler
      darkModeScheduler: "off",
      darkModeStart: "20:00",
      darkModeEnd: "06:00",

      // Accessibility
      fontSize: 16,
      focusOutline: "enabled",
      motionEffects: "enabled",
      highContrast: "disabled",
      dyslexiaFont: "disabled",
      underlineLinks: "disabled",

      // Misc
      loadingScreen: "disabled",
      mouseTrail: "disabled",
      liveStatus: "disabled",
      rearrangingEnabled: "disabled",

      // Homepage sections
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

      // Mini sections
      showTimeSection: "enabled",
      showWeatherSection: "enabled",
      showFocusSection: "enabled",
      showBatterySection: "enabled",
    };

    this.settings = this.loadSettings();
    this.deviceThemeMedia = null;
    this.schedulerInterval = null;

    document.addEventListener("DOMContentLoaded", () => {
      this.initializeControls();
      this.applyAllSettings();
      this.setupEventListeners();

      this.initCustomBackgroundControls();
      this.applyCustomBackground(true); // ensure instant wallpaper on load
      this.initWallpaperBlurControl();

      this.initSchedulerInterval();

      this.initMouseTrail();
      this.initLoadingScreen();
      this.initScrollArrow();

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

      // Footer year
      const yearSpan = document.getElementById("year");
      if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    });
  }

  /* =============================
   * Load / Save
   * ============================= */
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
    localStorage.setItem("websiteSettings", JSON.stringify(this.settings));
  }

  /* =============================
   * Initialize Controls
   * ============================= */
  initializeControls() {
    const accent = document.getElementById("accentColorPicker");
    if (accent) {
      accent.value = this.settings.accentColor;
      this.checkAccentColor(this.settings.accentColor);
    }

    const sizeSlider = document.getElementById("text-size-slider");
    const sizeBadge = document.getElementById("textSizeValue");
    if (sizeSlider && sizeBadge) {
      sizeSlider.value = this.settings.fontSize;
      sizeBadge.textContent = `${this.settings.fontSize}px`;
      this.updateSliderFill(sizeSlider);
    }

    const scheduler = document.getElementById("darkModeScheduler");
    if (scheduler) scheduler.value = this.settings.darkModeScheduler;
    const start = document.getElementById("darkModeStart");
    const end = document.getElementById("darkModeEnd");
    if (start) start.value = this.settings.darkModeStart;
    if (end) end.value = this.settings.darkModeEnd;

    this.toggleScheduleInputs(this.settings.darkModeScheduler);

    Object.keys(this.defaultSettings).forEach((k) => this.setToggle(k));
    this.syncWallpaperUIVisibility();
  }

  setToggle(key) {
    const el = document.getElementById(`${key}Toggle`);
    if (el) el.checked = this.settings[key] === "enabled";
  }

  /* =============================
   * Event Listeners
   * ============================= */
  setupEventListeners() {
    const accent = document.getElementById("accentColorPicker");
    if (accent) {
      accent.addEventListener("input", (e) => {
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

    const scheduler = document.getElementById("darkModeScheduler");
    const start = document.getElementById("darkModeStart");
    const end = document.getElementById("darkModeEnd");
    if (scheduler)
      scheduler.addEventListener("change", (e) => {
        this.settings.darkModeScheduler = e.target.value;
        this.saveSettings();
        this.toggleScheduleInputs(e.target.value);
        this.checkDarkModeSchedule(true);
      });
    if (start)
      start.addEventListener("change", (e) => {
        this.settings.darkModeStart = e.target.value;
        this.saveSettings();
        this.checkDarkModeSchedule(true);
      });
    if (end)
      end.addEventListener("change", (e) => {
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
      if (el) {
        el.addEventListener("change", () => {
          this.settings[key] = el.checked ? "enabled" : "disabled";
          this.applySetting(key);
          this.saveSettings();
        });
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
   * Theme & Appearance
   * ============================= */
  applyAllSettings() {
    Object.keys(this.defaultSettings).forEach((k) => this.applySetting(k));
    this.applyCustomBackground(true);
    this.toggleScheduleInputs(this.settings.darkModeScheduler);
    this.syncWallpaperUIVisibility();
  }

  setThemeClasses(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    document.body.classList.toggle("light-e", !isDark);
    document.documentElement.classList.toggle("dark-mode", isDark);
    document.documentElement.classList.toggle("light-e", !isDark);
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
  }

  applyFontSize() {
    document.documentElement.style.setProperty("--font-size-base", `${this.settings.fontSize}px`);
  }

  checkAccentColor(hex) {
    const warn = document.getElementById("whiteAccentWarning");
    if (!warn) return;
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16));
    const isLightColor = r > 240 && g > 240 && b > 240;
    warn.style.display = isLightColor ? "block" : "none";
  }

  updateSliderFill(slider) {
    if (!slider) return;
    const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(90deg, var(--accent-color) ${pct}%, var(--slider-track-color) ${pct}%)`;
  }

  /* =============================
   * Section Visibility
   * ============================= */
  applySetting(key) {
    if (key === "appearanceMode") return this.applyAppearanceMode();
    if (key === "accentColor") return this.applyAccentColor();
    if (key === "fontSize") return this.applyFontSize();

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
        el.style.display = visible ? "" : "none";
      }
    }
  }

  /* =============================
   * Wallpaper + Blur
   * ============================= */
  ensureWallpaperLayers() {
    let layer = document.getElementById("wallpaper-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "wallpaper-layer";
      Object.assign(layer.style, {
        position: "fixed",
        inset: "0",
        zIndex: "-1",
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "opacity 0.8s ease, filter 0.3s ease",
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
        transition: "background 0.5s ease",
      });
      document.body.prepend(tint);
    }
    return { layer, tint };
  }

  applyCustomBackground(fade = false) {
    const bg = localStorage.getItem("customBackground");
    const { layer, tint } = this.ensureWallpaperLayers();

    if (bg) {
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
    tint.style.background = isDark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.15)";

    const blurValue = localStorage.getItem("wallpaperBlur") ?? "0";
    this.applyWallpaperBlur(blurValue);
  }

  applyWallpaperBlur(v) {
    const layer = document.getElementById("wallpaper-layer");
    if (!layer) return;
    layer.style.filter = `blur(${parseInt(v || 0, 10)}px) brightness(1.03)`;
  }

  initWallpaperBlurControl() {
    const slider = document.getElementById("blur-slider");
    const badge = document.getElementById("blurValue");
    if (!slider || !badge) return;
    const stored = localStorage.getItem("wallpaperBlur") ?? "0";
    slider.value = stored;
    badge.textContent = `${stored}px`;
    this.applyWallpaperBlur(stored);

    slider.addEventListener("input", (e) => {
      const val = e.target.value;
      badge.textContent = `${val}px`;
      localStorage.setItem("wallpaperBlur", val);
      this.applyWallpaperBlur(val);
    });
  }

  syncWallpaperUIVisibility() {
    const hasBg = !!localStorage.getItem("customBackground");
    const card = document.getElementById("wallpaperBlurCard");
    if (card) card.style.display = hasBg ? "" : "none";
  }

  /* =============================
   * Scheduler
   * ============================= */
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
    const [sh, sm] = this.settings.darkModeStart.split(":").map(Number);
    const [eh, em] = this.settings.darkModeEnd.split(":").map(Number);
    const start = new Date();
    start.setHours(sh, sm, 0, 0);
    const end = new Date();
    end.setHours(eh, em, 0, 0);
    const isDark = end <= start ? now >= start || now < end : now >= start && now < end;
    this.setThemeClasses(isDark);
    this.applyCustomBackground(false);
  }

  toggleScheduleInputs(mode) {
    const group = document.querySelector(".schedule-group");
    if (group) group.style.display = mode === "auto" ? "" : "none";
  }

  /* =============================
   * Reset
   * ============================= */
  resetSectionVisibility() {
    if (confirm("Show all homepage sections again?")) {
      Object.keys(this.settings).forEach((k) => {
        if (k.startsWith("show")) this.settings[k] = "enabled";
      });
      this.saveSettings();
      this.applyAllSettings();
      alert("All sections are now visible.");
    }
  }

  resetSettings() {
    if (confirm("Reset all settings to factory defaults?")) {
      this.settings = { ...this.defaultSettings };
      this.saveSettings();
      localStorage.removeItem("sectionOrder");
      localStorage.removeItem("customBackground");
      localStorage.removeItem("customBackgroundName");
      localStorage.removeItem("wallpaperBlur");
      this.applyAllSettings();
      alert("All settings reset to default.");
    }
  }

  /* =============================
   * Placeholders for external features
   * ============================= */
  initScrollArrow() {}
  initLoadingScreen() {}
  initMouseTrail() {}
}

if (!window.settingsManagerInstance)
  window.settingsManagerInstance = new SettingsManager();

/* =============================
 * Live Battery Status Handler
 * ============================= */
document.addEventListener("DOMContentLoaded", async () => {
  const batterySection = document.getElementById("battery-section");
  const levelEl = document.getElementById("battery-level");
  const chargeEl = document.getElementById("battery-charging-status");

  if (!batterySection || !navigator.getBattery) return;

  try {
    const battery = await navigator.getBattery();

    function updateBattery() {
      const pct = Math.round(battery.level * 100);
      if (levelEl) levelEl.textContent = `Battery: ${pct}%`;
      if (chargeEl) chargeEl.textContent = battery.charging ? "Charging ⚡" : "Not Charging";
    }

    updateBattery();

    battery.addEventListener("levelchange", updateBattery);
    battery.addEventListener("chargingchange", updateBattery);
  } catch (err) {
    if (levelEl) levelEl.textContent = "Battery info unavailable.";
  }
});
