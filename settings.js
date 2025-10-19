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
      darkModeScheduler: 'off',
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
      this.initCustomBackgroundControls();
      this.applyCustomBackground();
      this.initWallpaperBlurControl();
      this.initSchedulerInterval();

      // Device theme change listener
      if (window.matchMedia) {
        this.deviceThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
        this.deviceThemeMedia.addEventListener('change', () => {
          if (this.settings.appearanceMode === 'device') this.applyAppearanceMode();
          this.applyCustomBackground();
        });
      }

      // System reduced motion listener
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

      // Storage sync across tabs
      window.addEventListener('storage', (e) => {
        if (e.key === 'websiteSettings') {
          this.settings = this.loadSettings();
          this.applyAllSettings();
          this.initializeControls();
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
      if (this.settings.hasOwnProperty(key)) toSave[key] = this.settings[key];
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
            // Re-evaluate overlays/wallpapers on theme change
            this.applyCustomBackground();
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
        this.checkDarkModeSchedule();
      });
    }
    if (startInput) {
      startInput.addEventListener('change', (e) => {
        this.settings.darkModeStart = e.target.value;
        this.saveSettings();
        this.checkDarkModeSchedule();
      });
    }
    if (endInput) {
      endInput.addEventListener('change', (e) => {
        this.settings.darkModeEnd = e.target.value;
        this.saveSettings();
        this.checkDarkModeSchedule();
      });
    }

    // Blur slider updates label + effect
    const blurSlider = document.getElementById('blur-slider');
    const blurBadge = document.getElementById('blurValue');
    if (blurSlider && blurBadge) {
      // Initialize badge background fill like other sliders
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
    this.applyCustomBackground();
    // Also reflect scheduler UI state
    this.toggleScheduleInputs(this.settings.darkModeScheduler);
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
    // Keep <html> and <body> in sync to avoid flicker with your inline script/CSS
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
  // Custom Background + Blur
  // =============================
  initCustomBackgroundControls() {
  const upload = document.getElementById('customBgUpload');
  const remove = document.getElementById('removeCustomBg');
  if (!upload) return;

  const existing = localStorage.getItem('customBackground');
  if (existing && remove) remove.style.display = 'inline-block';
  this.toggleWallpaperBlurCard(!!existing); // 👈 Show blur only if background exists

  upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const imageData = evt.target.result;
      localStorage.setItem('customBackground', imageData);
      this.applyCustomBackground(true);
      if (remove) remove.style.display = 'inline-block';
      this.toggleWallpaperBlurCard(true); // 👈 show blur slider now
    };
    reader.readAsDataURL(file);
  });

  if (remove) {
    remove.addEventListener('click', () => {
      localStorage.removeItem('customBackground');
      this.applyCustomBackground();
      remove.style.display = 'none';
      this.toggleWallpaperBlurCard(false); // 👈 hide blur slider now
    });
  }
}

ensureOverlay() {
  const overlayId = 'dark-bg-overlay';
  let overlay = document.getElementById(overlayId);

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = overlayId;
    Object.assign(overlay.style, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: '-1',          // 👈 pushes it BEHIND all page content
      pointerEvents: 'none',
      transition: 'opacity 0.6s ease, background 0.5s ease',
      backdropFilter: 'blur(0px) saturate(120%)',
      WebkitBackdropFilter: 'blur(0px) saturate(120%)'
    });
    document.body.prepend(overlay);
  }

  return overlay;
}

applyCustomBackground(fade = false) {
  const bg = localStorage.getItem('customBackground');
  const overlay = this.ensureOverlay();

  // place overlay under everything else (critical)
  overlay.style.zIndex = '-1';
  document.body.style.position = 'relative';

  if (bg) {
    document.body.style.backgroundImage = `url("${bg}")`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
    if (fade) {
      overlay.style.opacity = '0';
      requestAnimationFrame(() => setTimeout(() => (overlay.style.opacity = '1'), 50));
    }
  } else {
    document.body.style.backgroundImage = '';
  }

  const isDark =
    this.settings.appearanceMode === 'dark' ||
    (this.settings.appearanceMode === 'device' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  overlay.style.background = isDark
    ? 'rgba(0, 0, 0, 0.45)'
    : 'rgba(255, 255, 255, 0.15)';

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

    // Initialize fill gradient to match accent (consistency)
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
      this.applyWallpaperBlur(val);
      localStorage.setItem('wallpaperBlur', val);
      setFill();
    });
  }

  applyWallpaperBlur(value) {
    const overlay = this.ensureOverlay();
    overlay.style.backdropFilter = `blur(${value}px) saturate(120%)`;
    overlay.style.webkitBackdropFilter = `blur(${value}px) saturate(120%)`;
  }

  // =============================
  // Dark Mode Scheduler
  // =============================
  initSchedulerInterval() {
    clearInterval(this.schedulerInterval);
    const applyScheduler = () => this.checkDarkModeSchedule();
    applyScheduler();
    this.schedulerInterval = setInterval(applyScheduler, 60000);
  }

  checkDarkModeSchedule() {
    const mode = this.settings.darkModeScheduler || 'off';
    this.toggleScheduleInputs(mode);
    if (mode === 'off') return;

    const now = new Date();
    const [startH, startM] = this.settings.darkModeStart.split(':').map(Number);
    const [endH, endM] = this.settings.darkModeEnd.split(':').map(Number);

    const start = new Date();
    start.setHours(startH, startM, 0, 0);

    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    // If end <= start, it crosses midnight
    const isNight = end > start ? now >= start && now < end : now >= start || now < end;

    if (mode === 'auto') {
      this.setThemeClasses(isNight);
      // Re-apply background overlay tone for the new theme
      this.applyCustomBackground();
    }
  }

  toggleScheduleInputs(mode) {
    const group = document.querySelector('.schedule-group');
    if (!group) return;
    group.style.display = mode === 'auto' ? '' : 'none';
  }

 toggleWallpaperBlurCard(show) {
  const card = document.getElementById('wallpaperBlurCard');
  if (!card) return;

  if (show) {
    card.classList.remove('hidden');
    setTimeout(() => (card.style.display = ''), 50);
  } else {
    card.classList.add('hidden');
    // Wait for fade-out before hiding the element
    setTimeout(() => (card.style.display = 'none'), 350);
  }
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
