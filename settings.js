/**
 * settings.js
 * Fully functional settings manager with live previews,
 * custom backgrounds, blur control, dark-mode scheduler,
 * and dynamic wallpapers.
 */
class SettingsManager {
  constructor() {
    this.defaultSettings = {
      appearanceMode: 'device',
      themeStyle: 'clear',
      accentColor: '#3ddc84',
      darkModeScheduler: 'off', // 'off' | 'auto'
      darkModeStart: '20:00',
      darkModeEnd: '06:00',
      fontSize: 16,
      focusOutline: 'enabled',
      motionEffects: 'enabled',
      highContrast: 'disabled',
      dyslexiaFont: 'disabled',
      underlineLinks: 'disabled',
      loadingScreen: 'disabled',
      mouseTrail: 'disabled',
      liveStatus: 'disabled',
      rearrangingEnabled: 'disabled',
      showSocialLinks: 'enabled',
      showPresidentSection: 'enabled',
      showTiktokShoutouts: 'enabled',
      showInstagramShoutouts: 'enabled',
      showYoutubeShoutouts: 'enabled',
      showUsefulLinks: 'enabled',
      showCountdown: 'enabled',
      showBusinessSection: 'enabled',
      showTechInformation: 'enabled',
      showDisabilitiesSection: 'enabled',
      showQuoteSection: 'enabled'
    };

    this.settings = this.loadSettings();
    this.deviceThemeMedia = null;
    this.schedulerInterval = null;

    document.addEventListener('DOMContentLoaded', () => {
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
        this.deviceThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
        this.deviceThemeMedia.addEventListener('change', () => {
          if (this.settings.appearanceMode === 'device') {
            this.applyAppearanceMode();
            this.applyCustomBackground(false);
          }
        });
      }

      // Reduced motion listener (only if no explicit settings saved yet)
      if (window.matchMedia) {
        const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
        motionMedia.addEventListener('change', (e) => {
          if (!localStorage.getItem('websiteSettings')) {
            this.settings.motionEffects = e.matches ? 'disabled' : 'enabled';
            this.applyMotionEffects();
            this.saveSettings();
            this.setToggle('motionEffects');
          }
        });
      }

      // Cross-tab sync
      window.addEventListener('storage', (e) => {
        if (e.key === 'websiteSettings') {
          this.settings = this.loadSettings();
          this.applyAllSettings();
          this.initializeControls();
          this.applyCustomBackground(false);
          this.toggleScheduleInputs(this.settings.darkModeScheduler);
          this.syncWallpaperUIVisibility();
        }
      });

      // Footer year
      const yearSpan = document.getElementById('year');
      if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    });
  }

  // =============================
  // Load / Save
  // =============================
  loadSettings() {
    try {
      const stored = localStorage.getItem('websiteSettings');
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
    localStorage.setItem('websiteSettings', JSON.stringify(toSave));
  }

  // =============================
  // UI Setup
  // =============================
  initializeControls() {
    // Segmented controls
    this.initSegmentedControl('appearanceModeControl', this.settings.appearanceMode);
    this.initSegmentedControl('themeStyleControl', this.settings.themeStyle);
    this.updateSegmentedBackground('appearanceModeControl');
    this.updateSegmentedBackground('themeStyleControl');

    // Accent color
    const accentPicker = document.getElementById('accentColorPicker');
    if (accentPicker) {
      accentPicker.value = this.settings.accentColor;
      this.checkAccentColor(this.settings.accentColor);
    }

    // Font size
    const slider = document.getElementById('text-size-slider');
    const badge = document.getElementById('textSizeValue');
    if (slider && badge) {
      slider.value = this.settings.fontSize;
      badge.textContent = `${this.settings.fontSize}px`;
      this.updateSliderFill(slider);
    }

    // Dark mode scheduler controls (reflect saved state)
    const schedulerSelect = document.getElementById('darkModeScheduler');
    const startInput = document.getElementById('darkModeStart');
    const endInput = document.getElementById('darkModeEnd');
    if (schedulerSelect) schedulerSelect.value = this.settings.darkModeScheduler;
    if (startInput) startInput.value = this.settings.darkModeStart;
    if (endInput) endInput.value = this.settings.darkModeEnd;

    // Show/hide schedule inputs based on current mode
    this.toggleScheduleInputs(this.settings.darkModeScheduler);

    // All toggle switches
    const toggles = Object.keys(this.defaultSettings).filter(
      (k) =>
        typeof this.defaultSettings[k] === 'string' &&
        (this.defaultSettings[k] === 'enabled' || this.defaultSettings[k] === 'disabled')
    );
    toggles.forEach((key) => this.setToggle(key));

    // Wallpaper UI visibility on first load
    this.syncWallpaperUIVisibility();
  }

  initSegmentedControl(controlId, value) {
    const control = document.getElementById(controlId);
    if (!control) return;
    control.querySelectorAll('button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.value === value);
    });
  }

  updateSegmentedBackground(controlId) {
    const control = document.getElementById(controlId);
    if (!control) return;
    let active = control.querySelector('button.active');
    let bg = control.querySelector('.seg-bg');
    if (!bg) {
      bg = document.createElement('div');
      bg.className = 'seg-bg';
      control.prepend(bg);
    }
    if (active) {
      const rect = active.getBoundingClientRect();
      const parent = control.getBoundingClientRect();
      bg.style.left = rect.left - parent.left + 'px';
      bg.style.width = rect.width + 'px';
    }
  }

  setToggle(key) {
    const el = document.getElementById(`${key}Toggle`);
    if (el) el.checked = this.settings[key] === 'enabled';
  }

  // =============================
  // Event Listeners
  // =============================
  setupEventListeners() {
    // Segmented: appearance + theme style
    ['appearanceMode', 'themeStyle'].forEach((key) => {
      const control = document.getElementById(`${key}Control`);
      if (control) {
        control.addEventListener('click', (e) => {
          const btn = e.target.closest('button');
          if (!btn) return;
          this.settings[key] = btn.dataset.value;
          this.applySetting(key);
          this.saveSettings();
          this.initSegmentedControl(`${key}Control`, this.settings[key]);
          this.updateSegmentedBackground(`${key}Control`);
          if (key === 'appearanceMode') {
            this.applyCustomBackground(false); // retint wallpaper tint for theme
          }
        });
        // On load, ensure capsule is positioned
        this.updateSegmentedBackground(`${key}Control`);
      }
    });

    // Accent color
    const accentPicker = document.getElementById('accentColorPicker');
    if (accentPicker) {
      accentPicker.addEventListener('input', (e) => {
        this.settings.accentColor = e.target.value;
        this.applyAccentColor();
        this.saveSettings();
      });
    }

    // Font size
    const slider = document.getElementById('text-size-slider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        this.settings.fontSize = parseInt(e.target.value, 10);
        this.applyFontSize();
        this.updateSliderFill(slider);
        const badge = document.getElementById('textSizeValue');
        if (badge) badge.textContent = `${this.settings.fontSize}px`;
        this.saveSettings();
      });
    }

    // Scheduler controls
    const schedulerSelect = document.getElementById('darkModeScheduler');
    const startInput = document.getElementById('darkModeStart');
    const endInput = document.getElementById('darkModeEnd');

    if (schedulerSelect) {
      schedulerSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        this.settings.darkModeScheduler = val;
        this.saveSettings();
        this.toggleScheduleInputs(val);
        this.checkDarkModeSchedule(true); // apply immediately
      });
    }
    if (startInput) {
      startInput.addEventListener('change', (e) => {
        this.settings.darkModeStart = e.target.value;
        this.saveSettings();
        this.checkDarkModeSchedule(true);
      });
    }
    if (endInput) {
      endInput.addEventListener('change', (e) => {
        this.settings.darkModeEnd = e.target.value;
        this.saveSettings();
        this.checkDarkModeSchedule(true);
      });
    }

    // Blur slider updates label + effect
    const blurSlider = document.getElementById('blur-slider');
    const blurBadge = document.getElementById('blurValue');
    if (blurSlider && blurBadge) {
      const setBlurFill = () => {
        const min = parseFloat(blurSlider.min || '0');
        const max = parseFloat(blurSlider.max || '40');
        const val = parseFloat(blurSlider.value || '15');
        const pct = ((val - min) / (max - min)) * 100;
        blurSlider.style.background = `linear-gradient(90deg, var(--accent-color) ${pct}%, var(--slider-track-color) ${pct}%)`;
      };
      setBlurFill();

      blurSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        blurBadge.textContent = `${val}px`;
        localStorage.setItem('wallpaperBlur', val);
        this.applyWallpaperBlur(val);
        setBlurFill();
      });
    }

    // Generic toggles
    const toggleKeys = Object.keys(this.defaultSettings).filter(
      (k) =>
        typeof this.defaultSettings[k] === 'string' &&
        (this.defaultSettings[k] === 'enabled' || this.defaultSettings[k] === 'disabled')
    );
    toggleKeys.forEach((key) => {
      const el = document.getElementById(`${key}Toggle`);
      if (el) {
        el.addEventListener('change', () => {
          this.settings[key] = el.checked ? 'enabled' : 'disabled';
          this.applySetting(key);
          this.saveSettings();
        });
      }
    });

    // Layout/sections reset
    document.getElementById('resetLayoutBtn')?.addEventListener('click', () => {
      if (confirm('Reset the section layout to default?')) {
        localStorage.removeItem('sectionOrder');
        alert('Layout reset. Refresh homepage to see changes.');
      }
    });

    document.getElementById('resetSectionsBtn')?.addEventListener('click', () => this.resetSectionVisibility());
    document.getElementById('resetSettings')?.addEventListener('click', () => this.resetSettings());

    // Mobile orientation/resize: keep wallpaper covering viewport
    window.addEventListener('resize', () => this.fitWallpaperLayer());
    window.addEventListener('orientationchange', () => this.fitWallpaperLayer());
  }

  // =============================
  // Appearance & Color
  // =============================
  updateSliderFill(slider) {
    if (!slider) return;
    const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(90deg, var(--accent-color) ${pct}%, var(--slider-track-color) ${pct}%)`;
  }

  getContrastColor(hex) {
    if (!hex) return '#fff';
    hex = hex.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16),
      g = parseInt(hex.substr(2, 2), 16),
      b = parseInt(hex.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000' : '#fff';
  }

  checkAccentColor(hex) {
    const warn = document.getElementById('whiteAccentWarning');
    if (!warn) return;
    let isLight =
      this.settings.appearanceMode === 'light' ||
      (this.settings.appearanceMode === 'device' && !window.matchMedia('(prefers-color-scheme: dark)').matches);
    const r = parseInt(hex.substr(1, 2), 16),
      g = parseInt(hex.substr(3, 2), 16),
      b = parseInt(hex.substr(5, 2), 16);
    const isLightColor = r > 240 && g > 240 && b > 240;
    warn.style.display = isLightColor && isLight ? 'block' : 'none';
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
        document.body.classList.toggle('focus-outline-disabled', this.settings.focusOutline === 'disabled'),
      motionEffects: () => this.applyMotionEffects(),
      highContrast: () => document.body.classList.toggle('high-contrast', this.settings.highContrast === 'enabled'),
      dyslexiaFont: () => document.body.classList.toggle('dyslexia-font', this.settings.dyslexiaFont === 'enabled'),
      underlineLinks: () => document.body.classList.toggle('underline-links', this.settings.underlineLinks === 'enabled'),
      mouseTrail: () => document.body.classList.toggle('mouse-trail-enabled', this.settings.mouseTrail === 'enabled'),
      showSocialLinks: () => this.applySectionVisibility('social-links-section', this.settings.showSocialLinks),
      showPresidentSection: () => this.applySectionVisibility('president-section', this.settings.showPresidentSection),
      showTiktokShoutouts: () =>
        this.applySectionVisibility('tiktok-shoutouts-section', this.settings.showTiktokShoutouts),
      showInstagramShoutouts: () =>
        this.applySectionVisibility('instagram-shoutouts-section', this.settings.showInstagramShoutouts),
      showYoutubeShoutouts: () =>
        this.applySectionVisibility('youtube-shoutouts-section', this.settings.showYoutubeShoutouts),
      showUsefulLinks: () => this.applySectionVisibility('useful-links-section', this.settings.showUsefulLinks),
      showCountdown: () => this.applySectionVisibility('countdown-section', this.settings.showCountdown),
      showBusinessSection: () => this.applySectionVisibility('business-section', this.settings.showBusinessSection),
      showTechInformation: () =>
        this.applySectionVisibility('tech-information-section', this.settings.showTechInformation),
      showDisabilitiesSection: () =>
        this.applySectionVisibility('disabilities-section', this.settings.showDisabilitiesSection),
      showQuoteSection: () => this.applySectionVisibility('quote-section', this.settings.showQuoteSection)
    };
    actions[key]?.();
  }

  setThemeClasses(isDark) {
    // Keep <html> and <body> in sync to avoid flicker
    document.documentElement.classList.toggle('dark-mode', isDark);
    document.documentElement.classList.toggle('light-mode', !isDark);
    document.body.classList.toggle('dark-mode', isDark);
    document.body.classList.toggle('light-e', !isDark);
  }

  applyAppearanceMode() {
    const isDark =
      this.settings.appearanceMode === 'dark' ||
      (this.settings.appearanceMode === 'device' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    this.setThemeClasses(isDark);
    this.checkAccentColor(this.settings.accentColor);
  }

  applyAccentColor() {
    const accent = this.settings.accentColor;
    document.documentElement.style.setProperty('--accent-color', accent);
    document.documentElement.style.setProperty('--accent-text-color', this.getContrastColor(accent));
    this.checkAccentColor(accent);
  }

  applyFontSize() {
    document.documentElement.style.setProperty('--font-size-base', `${this.settings.fontSize}px`);
  }

  applyMotionEffects() {
    const reduced = this.settings.motionEffects === 'disabled';
    document.body.classList.toggle('reduced-motion', reduced);
  }

  applySectionVisibility(id, status) {
    const el = document.getElementById(id);
    if (el) el.style.display = status === 'enabled' ? '' : 'none';
  }

  // =============================
  // Wallpaper Layers (mobile + desktop safe)
  // =============================
  ensureWallpaperLayers() {
    // Fixed full-viewport layer for image
    let layer = document.getElementById('wallpaper-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'wallpaper-layer';
      Object.assign(layer.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '-1',              // behind all content
        pointerEvents: 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'opacity 0.4s ease, filter 0.3s ease'
      });
      document.body.prepend(layer);
    }

    // Separate tint layer above the image (still behind content)
    let tint = document.getElementById('wallpaper-tint');
    if (!tint) {
      tint = document.createElement('div');
      tint.id = 'wallpaper-tint';
      Object.assign(tint.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '-1',
        pointerEvents: 'none',
        background: 'transparent',
        transition: 'background 0.3s ease'
      });
      document.body.prepend(tint); // tint above the image, both behind content
    }

    // Make sure the body itself doesn't cover layers with a solid paint
    // If a custom wallpaper exists, we make body bg transparent so layers show through
    return { layer, tint };
  }

  fitWallpaperLayer() {
    // No-op for now; fixed with inset:0 covers viewport across orientation changes
    // Left for future tweaks if needed on specific devices.
  }

  // =============================
  // Custom Background + Blur
  // =============================
  initCustomBackgroundControls() {
  const upload = document.getElementById('customBgUpload');
  const remove = document.getElementById('removeCustomBg');
  if (!upload) return;

  const existing = localStorage.getItem('customBackground');
  if (existing && remove) remove.style.display = 'inline-block';
  this.toggleWallpaperBlurCard(!!existing);

  // Upload handler
  upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = (evt) => {
      const imageData = evt.target.result;
      localStorage.setItem('customBackground', imageData);
      this.applyCustomBackground(true);
      if (remove) remove.style.display = 'inline-block';
      this.toggleWallpaperBlurCard(true);

      // ✅ Add iOS-26 accent pulse animation feedback
      upload.classList.add('pulse');
      setTimeout(() => upload.classList.remove('pulse'), 1000);
    };

    reader.readAsDataURL(file);
  });

  // Remove handler
  if (remove) {
    remove.addEventListener('click', () => {
      localStorage.removeItem('customBackground');
      this.applyCustomBackground();
      remove.style.display = 'none';
      this.toggleWallpaperBlurCard(false);
    });
  }
}

  applyCustomBackground(fade = false) {
    const bg = localStorage.getItem('customBackground');
    const { layer, tint } = this.ensureWallpaperLayers();

    if (bg) {
      // Show wallpaper through the body; keep panels/cards controlling their own backgrounds.
      document.body.style.backgroundColor = 'transparent';
      document.body.style.backgroundImage = ''; // we only use the fixed layer for mobile reliability

      layer.style.backgroundImage = `url("${bg}")`;
      if (fade) {
        layer.style.opacity = '0';
        requestAnimationFrame(() => setTimeout(() => (layer.style.opacity = '1'), 50));
      } else {
        layer.style.opacity = '1';
      }
    } else {
      // No wallpaper — restore body color from CSS and clear layer
      document.body.style.backgroundColor = '';
      document.body.style.backgroundImage = '';
      layer.style.backgroundImage = '';
      layer.style.opacity = '0';
    }

    // Tint based on theme
    const isDark =
      this.settings.appearanceMode === 'dark' ||
      (this.settings.appearanceMode === 'device' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    tint.style.background = isDark
      ? 'rgba(0, 0, 0, 0.40)'
      : 'rgba(255, 255, 255, 0.15)';

    // Apply stored blur level
    const blurValue = localStorage.getItem('wallpaperBlur') || 15;
    this.applyWallpaperBlur(blurValue);
  }

  initWallpaperBlurControl() {
    const slider = document.getElementById('blur-slider');
    const badge = document.getElementById('blurValue');
    if (!slider || !badge) return;

    const stored = localStorage.getItem('wallpaperBlur') || 15;
    slider.value = stored;
    badge.textContent = `${stored}px`;
    this.applyWallpaperBlur(stored);

    const setFill = () => {
      const min = parseFloat(slider.min || '0');
      const max = parseFloat(slider.max || '40');
      const val = parseFloat(slider.value || stored);
      const pct = ((val - min) / (max - min)) * 100;
      slider.style.background = `linear-gradient(90deg, var(--accent-color) ${pct}%, var(--slider-track-color) ${pct}%)`;
    };
    setFill();

    slider.addEventListener('input', (e) => {
      const val = e.target.value;
      badge.textContent = `${val}px`;
      localStorage.setItem('wallpaperBlur', val);
      this.applyWallpaperBlur(val);
      setFill();
    });
  }

  applyWallpaperBlur(value) {
    const layer = document.getElementById('wallpaper-layer');
    if (!layer) return;
    // Blur ONLY the wallpaper layer; UI remains crisp
    layer.style.filter = `blur(${value}px) brightness(1.03)`;
  }

  syncWallpaperUIVisibility() {
    const hasBg = !!localStorage.getItem('customBackground');
    const card = document.getElementById('wallpaperBlurCard');
    if (!card) return;
    card.style.display = hasBg ? '' : 'none';
  }

  // =============================
  // Dark Mode Scheduler
  // =============================
  initSchedulerInterval() {
    clearInterval(this.schedulerInterval);
    // Apply immediately on page load
    this.checkDarkModeSchedule(true);
    // Recheck every minute automatically
    this.schedulerInterval = setInterval(() => this.checkDarkModeSchedule(), 60000);
  }

  checkDarkModeSchedule(force = false) {
    const mode = this.settings.darkModeScheduler || 'off';
    this.toggleScheduleInputs(mode);

    // Only control theme if user chose Scheduled (auto)
    if (mode !== 'auto') {
      if (force) this.applyAppearanceMode(); // respect manual/device mode when forcing once
      return;
    }

    const now = new Date();
    const [startH, startM] = this.settings.darkModeStart.split(':').map(Number);
    const [endH, endM] = this.settings.darkModeEnd.split(':').map(Number);

    const start = new Date();
    start.setHours(startH, startM, 0, 0);
    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    // Works across midnight (e.g., 20:00–06:00)
    let isNight;
    if (end > start) {
      isNight = now >= start && now < end;
    } else {
      isNight = now >= start || now < end;
    }

    this.setThemeClasses(isNight);
    // Retint wallpaper overlay for new theme
    this.applyCustomBackground(false);
  }

  toggleScheduleInputs(mode) {
    const group = document.querySelector('.schedule-group');
    if (!group) return;
    group.style.display = mode === 'auto' ? '' : 'none';
  }

  // =============================
  // Misc
  // =============================
  initScrollArrow() {}
  initLoadingScreen() {}
  initMouseTrail() {}

  resetSectionVisibility() {
    if (confirm('Show all homepage sections again?')) {
      const keys = Object.keys(this.defaultSettings).filter((k) => k.startsWith('show'));
      keys.forEach((k) => (this.settings[k] = 'enabled'));
      this.saveSettings();
      this.initializeControls();
      this.applyAllSettings();
      alert('All sections are now visible.');
    }
  }

  resetSettings() {
    if (confirm('Reset all settings to default values?')) {
      this.settings = { ...this.defaultSettings };
      this.saveSettings();
      localStorage.removeItem('sectionOrder');
      this.initializeControls();
      this.applyAllSettings();
      alert('Settings and layout have been reset to default.');
    }
  }
}

// Initialize
if (!window.settingsManagerInstance) {
  window.settingsManagerInstance = new SettingsManager();
}
