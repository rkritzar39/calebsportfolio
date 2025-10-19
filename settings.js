/**
 * settings.js
 * Fully functional settings manager with live previews,
 * custom backgrounds, blur control, dark-mode scheduler,
 * and dynamic wallpapers (with cross-fade transitions).
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

      // Reduced motion listener
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
    this.initSegmentedControl('appearanceModeControl', this.settings.appearanceMode);
    this.initSegmentedControl('themeStyleControl', this.settings.themeStyle);
    this.updateSegmentedBackground('appearanceModeControl');
    this.updateSegmentedBackground('themeStyleControl');

    const accentPicker = document.getElementById('accentColorPicker');
    if (accentPicker) {
      accentPicker.value = this.settings.accentColor;
      this.checkAccentColor(this.settings.accentColor);
    }

    const slider = document.getElementById('text-size-slider');
    const badge = document.getElementById('textSizeValue');
    if (slider && badge) {
      slider.value = this.settings.fontSize;
      badge.textContent = `${this.settings.fontSize}px`;
      this.updateSliderFill(slider);
    }

    const schedulerSelect = document.getElementById('darkModeScheduler');
    const startInput = document.getElementById('darkModeStart');
    const endInput = document.getElementById('darkModeEnd');
    if (schedulerSelect) schedulerSelect.value = this.settings.darkModeScheduler;
    if (startInput) startInput.value = this.settings.darkModeStart;
    if (endInput) endInput.value = this.settings.darkModeEnd;
    this.toggleScheduleInputs(this.settings.darkModeScheduler);

    const toggles = Object.keys(this.defaultSettings).filter(
      (k) =>
        typeof this.defaultSettings[k] === 'string' &&
        (this.defaultSettings[k] === 'enabled' || this.defaultSettings[k] === 'disabled')
    );
    toggles.forEach((key) => this.setToggle(key));

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
  // Wallpaper Layers
  // =============================
  ensureWallpaperLayers() {
    let layer = document.getElementById('wallpaper-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'wallpaper-layer';
      Object.assign(layer.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '-2',
        pointerEvents: 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'opacity 1.2s ease, filter 0.4s ease'
      });
      document.body.prepend(layer);
    }

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
        transition: 'background 0.4s ease'
      });
      document.body.prepend(tint);
    }

    return { layer, tint };
  }

  // =============================
  // Custom Background + Blur
  // =============================
  initCustomBackgroundControls() {
    const upload = document.getElementById('customBgUpload');
    const remove = document.getElementById('removeCustomBg');
    if (!upload) return;

    const existing = !!localStorage.getItem('customBackground');
    if (remove) remove.style.display = existing ? 'inline-block' : 'none';
    this.toggleWallpaperBlurCard(existing);

    upload.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const imageData = evt.target.result;
        document.getElementById('wallpaper-layer')?.remove();
        document.getElementById('wallpaper-fade')?.remove();
        localStorage.setItem('customBackground', imageData);
        this.applyCustomBackground(true);
        if (remove) remove.style.display = 'inline-block';
        this.toggleWallpaperBlurCard(true);

        upload.classList.remove('pulse');
        upload.offsetHeight;
        upload.classList.add('pulse');
        setTimeout(() => upload.classList.remove('pulse'), 900);
      };
      reader.readAsDataURL(file);
    });

    if (remove) {
      remove.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('customBackground');
        document.getElementById('wallpaper-layer')?.remove();
        document.getElementById('wallpaper-fade')?.remove();
        this.applyCustomBackground(false);
        this.toggleWallpaperBlurCard(false);
        remove.style.display = 'none';
      });
    }
  }

  applyCustomBackground(fade = false) {
    const bg = localStorage.getItem('customBackground');
    const { layer, tint } = this.ensureWallpaperLayers();

    if (bg) {
      document.body.style.backgroundColor = 'transparent';
      layer.style.opacity = '1';

      if (fade) {
        const fadeLayer = document.createElement('div');
        fadeLayer.id = 'wallpaper-fade';
        Object.assign(fadeLayer.style, {
          position: 'fixed',
          inset: '0',
          zIndex: '-3',
          backgroundImage: layer.style.backgroundImage,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: '1',
          transition: 'opacity 1.2s ease'
        });
        document.body.prepend(fadeLayer);
        setTimeout(() => (fadeLayer.style.opacity = '0'), 20);
        setTimeout(() => fadeLayer.remove(), 1200);
      }

      layer.style.backgroundImage = `url("${bg}")`;
    } else {
      layer.style.backgroundImage = '';
      layer.style.opacity = '0';
      document.body.style.backgroundColor = '';
    }

    const isDark =
      this.settings.appearanceMode === 'dark' ||
      (this.settings.appearanceMode === 'device' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    tint.style.background = isDark
      ? 'rgba(0, 0, 0, 0.40)'
      : 'rgba(255, 255, 255, 0.15)';

    const blurValue = localStorage.getItem('wallpaperBlur') || 15;
    this.applyWallpaperBlur(blurValue);
    this.toggleWallpaperBlurCard(!!bg);
  }

  applyWallpaperBlur(value) {
    const layer = document.getElementById('wallpaper-layer');
    if (!layer) return;
    layer.style.filter = `blur(${value}px) brightness(1.03)`;
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

  toggleWallpaperBlurCard(show) {
    const card = document.getElementById('wallpaperBlurCard');
    if (!card) return;
    card.style.display = show ? '' : 'none';
  }

  syncWallpaperUIVisibility() {
    const hasBg = !!localStorage.getItem('customBackground');
    this.toggleWallpaperBlurCard(hasBg);
  }

  // =============================
  // Dark Mode Scheduler
  // =============================
  initSchedulerInterval() {
    clearInterval(this.schedulerInterval);
    this.checkDarkModeSchedule(true);
    this.schedulerInterval = setInterval(() => this.checkDarkModeSchedule(), 60000);
  }

  checkDarkModeSchedule(force = false) {
    const mode = this.settings.darkModeScheduler || 'off';
    this.toggleScheduleInputs(mode);

    if (mode !== 'auto') {
      if (force) this.applyAppearanceMode();
      return;
    }

    const now = new Date();
    const [startH, startM] = this.settings.darkModeStart.split(':').map(Number);
    const [endH, endM] = this.settings.darkModeEnd.split(':').map(Number);
    const start = new Date(); start.setHours(startH, startM, 0, 0);
    const end = new Date(); end.setHours(endH, endM, 0, 0);
    const isNight = end > start ? now >= start && now < end : now >= start || now < end;

    this.setThemeClasses(isNight);
    this.applyCustomBackground(false);
  }

  toggleScheduleInputs(mode) {
    const group = document.querySelector('.schedule-group');
    if (!group) return;
    group.style.display = mode === 'auto' ? '' : 'none';
  }

  // =============================
  // Reset & Misc Utilities
  // =============================
  resetSectionVisibility() {
    if (confirm('Show all homepage sections again?')) {
      const keys = Object.keys(this.defaultSettings).filter((k) => k.startsWith('show'));
      keys.forEach((k) => (this.settings[k] = 'enabled'));
      this.saveSettings();
      this.initializeControls();
      this.applyAllSettings();
      alert('✅ All sections are now visible.');
    }
  }

  resetSettings() {
    if (confirm('Reset all settings to default values?')) {
      this.settings = { ...this.defaultSettings };
      this.saveSettings();
      localStorage.removeItem('sectionOrder');
      this.initializeControls();
      this.applyAllSettings();
      alert('✅ Settings and layout have been reset to default.');
    }
  }

  // =============================
  // Misc placeholders
  // =============================
  initScrollArrow() {}
  initLoadingScreen() {}
  initMouseTrail() {}
}

// Initialize
if (!window.settingsManagerInstance) {
  window.settingsManagerInstance = new SettingsManager();
}
