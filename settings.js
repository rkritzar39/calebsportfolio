/**
 * settings.js
 * Fully functional settings manager with dynamic wallpapers + dark mode scheduler
 * iOS 26 Onyx integration – motion-safe, persistent, and synced
 */
class SettingsManager {
    constructor() {
        this.defaultSettings = {
            appearanceMode: 'device',
            themeStyle: 'clear',
            accentColor: '#3ddc84',
            themeMode: 'system', // NEW – for wallpaper/scheduler control
            darkStart: '22:00',
            darkEnd: '07:00',
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
            this.initSchedulerInterval();
            this.initScrollArrow();

            // Device theme listener
            if (window.matchMedia) {
                this.deviceThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
                this.deviceThemeMedia.addEventListener('change', () => {
                    if (this.settings.appearanceMode === 'device') this.applyAppearanceMode();
                });
            }

            // Motion listener
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
                }
            });

            // Auto update year
            const yearSpan = document.getElementById('year');
            if (yearSpan) yearSpan.textContent = new Date().getFullYear();
        });
    }

    // ===== Core Management =====
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
            if (this.settings.hasOwnProperty(key)) {
                toSave[key] = this.settings[key];
            }
        }
        localStorage.setItem('websiteSettings', JSON.stringify(toSave));
    }

    // ===== UI Initialization =====
    initializeControls() {
        this.initSegmentedControl('appearanceModeControl', this.settings.appearanceMode);
        this.initSegmentedControl('themeStyleControl', this.settings.themeStyle);

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

        const themeModeSelect = document.getElementById('themeModeSelect');
        if (themeModeSelect) themeModeSelect.value = this.settings.themeMode;

        const darkStart = document.getElementById('darkStart');
        const darkEnd = document.getElementById('darkEnd');
        if (darkStart && darkEnd) {
            darkStart.value = this.settings.darkStart;
            darkEnd.value = this.settings.darkEnd;
        }

        const toggles = Object.keys(this.defaultSettings)
            .filter(k => typeof this.defaultSettings[k] === 'string' &&
                (this.defaultSettings[k] === 'enabled' || this.defaultSettings[k] === 'disabled'));
        toggles.forEach(key => this.setToggle(key));
    }

    initSegmentedControl(controlId, value) {
        const control = document.getElementById(controlId);
        if (!control) return;
        control.querySelectorAll('button').forEach(btn => {
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
            const parentRect = control.getBoundingClientRect();
            bg.style.left = rect.left - parentRect.left + 'px';
            bg.style.width = rect.width + 'px';
        }
    }

    setToggle(key) {
        const el = document.getElementById(`${key}Toggle`);
        if (el) el.checked = this.settings[key] === 'enabled';
    }

    // ===== Event Listeners =====
    setupEventListeners() {
        // segmented controls
        ['appearanceMode', 'themeStyle'].forEach(key => {
            const control = document.getElementById(`${key}Control`);
            if (control) {
                control.addEventListener('click', e => {
                    const btn = e.target.closest('button');
                    if (btn) {
                        this.settings[key] = btn.dataset.value;
                        this.applySetting(key);
                        this.saveSettings();
                        this.initSegmentedControl(`${key}Control`, this.settings[key]);
                        this.updateSegmentedBackground(`${key}Control`);
                    }
                });
                this.updateSegmentedBackground(`${key}Control`);
            }
        });

        // accent color
        const accentPicker = document.getElementById('accentColorPicker');
        if (accentPicker) {
            accentPicker.addEventListener('input', e => {
                this.settings.accentColor = e.target.value;
                this.applyAccentColor();
                this.saveSettings();
            });
        }

        // text size
        const slider = document.getElementById('text-size-slider');
        if (slider) {
            slider.addEventListener('input', e => {
                this.settings.fontSize = parseInt(e.target.value, 10);
                this.applyFontSize();
                this.updateSliderFill(slider);
                document.getElementById('textSizeValue').textContent = `${this.settings.fontSize}px`;
                this.saveSettings();
            });
        }

        // toggles
        const toggleKeys = Object.keys(this.defaultSettings)
            .filter(k => typeof this.defaultSettings[k] === 'string' &&
                (this.defaultSettings[k] === 'enabled' || this.defaultSettings[k] === 'disabled'));
        toggleKeys.forEach(key => {
            const el = document.getElementById(`${key}Toggle`);
            if (el) {
                el.addEventListener('change', () => {
                    this.settings[key] = el.checked ? 'enabled' : 'disabled';
                    this.applySetting(key);
                    this.saveSettings();
                });
            }
        });

        // scheduler controls
        const themeModeSelect = document.getElementById('themeModeSelect');
        const darkStart = document.getElementById('darkStart');
        const darkEnd = document.getElementById('darkEnd');
        const scheduleInputs = document.getElementById('scheduleInputs');

        if (themeModeSelect) {
            themeModeSelect.addEventListener('change', e => {
                this.settings.themeMode = e.target.value;
                this.saveSettings();
                scheduleInputs.style.display = (e.target.value === 'scheduled') ? 'block' : 'none';
                this.applyDynamicTheme();
            });
        }

        if (darkStart && darkEnd) {
            darkStart.addEventListener('change', () => {
                this.settings.darkStart = darkStart.value;
                this.saveSettings();
                if (this.settings.themeMode === 'scheduled') this.applyDynamicTheme();
            });
            darkEnd.addEventListener('change', () => {
                this.settings.darkEnd = darkEnd.value;
                this.saveSettings();
                if (this.settings.themeMode === 'scheduled') this.applyDynamicTheme();
            });
        }

        document.getElementById('resetLayoutBtn')?.addEventListener('click', () => {
            if (confirm('Reset the section layout to default?')) {
                localStorage.removeItem('sectionOrder');
                alert('Layout reset. Refresh homepage to see changes.');
            }
        });

        document.getElementById('resetSectionsBtn')?.addEventListener('click', () => this.resetSectionVisibility());
        document.getElementById('resetSettings')?.addEventListener('click', () => this.resetSettings());
    }

    // ===== Utilities =====
    updateSliderFill(slider) {
        if (!slider) return;
        const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.background = `linear-gradient(90deg, var(--accent-color) ${pct}%, var(--slider-track-color) ${pct}%)`;
    }

    getContrastColor(hex) {
        if (!hex) return '#fff';
        const rgb = hex.replace('#', '').match(/.{2}/g).map(v => parseInt(v, 16));
        const yiq = ((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) / 1000;
        return yiq >= 128 ? '#000' : '#fff';
    }

    checkAccentColor(hex) {
        const warn = document.getElementById('whiteAccentWarning');
        if (!warn) return;
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        const light = r > 240 && g > 240 && b > 240;
        const lightMode = this.settings.appearanceMode === 'light' || (this.settings.appearanceMode === 'device' && !window.matchMedia('(prefers-color-scheme: dark)').matches);
        warn.style.display = light && lightMode ? 'block' : 'none';
    }

    // ===== Setting Applications =====
    applyAllSettings() {
        Object.keys(this.defaultSettings).forEach(k => this.applySetting(k));
        this.applyDynamicTheme();
    }

    applySetting(key) {
        const map = {
            appearanceMode: () => this.applyAppearanceMode(),
            accentColor: () => this.applyAccentColor(),
            fontSize: () => this.applyFontSize(),
            focusOutline: () => document.body.classList.toggle('focus-outline-disabled', this.settings.focusOutline === 'disabled'),
            motionEffects: () => this.applyMotionEffects(),
            highContrast: () => document.body.classList.toggle('high-contrast', this.settings.highContrast === 'enabled'),
            dyslexiaFont: () => document.body.classList.toggle('dyslexia-font', this.settings.dyslexiaFont === 'enabled'),
            underlineLinks: () => document.body.classList.toggle('underline-links', this.settings.underlineLinks === 'enabled'),
            mouseTrail: () => document.body.classList.toggle('mouse-trail-enabled', this.settings.mouseTrail === 'enabled'),
        };
        map[key]?.();
    }

    applyAppearanceMode() {
        const dark = this.settings.appearanceMode === 'dark' || (this.settings.appearanceMode === 'device' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.body.classList.toggle('dark-mode', dark);
        document.body.classList.toggle('light-mode', !dark);
        this.checkAccentColor(this.settings.accentColor);
    }

    applyAccentColor() {
        const c = this.settings.accentColor;
        document.documentElement.style.setProperty('--accent-color', c);
        document.documentElement.style.setProperty('--accent-text-color', this.getContrastColor(c));
        this.checkAccentColor(c);
    }

    applyFontSize() {
        document.documentElement.style.setProperty('--font-size-base', `${this.settings.fontSize}px`);
    }

    applyMotionEffects() {
        document.body.classList.toggle('reduced-motion', this.settings.motionEffects === 'disabled');
    }

    // ===== Dynamic Wallpapers & Scheduler =====
    applyDynamicTheme() {
        const root = document.documentElement;
        const mode = this.settings.themeMode;
        root.removeAttribute('data-theme');
        root.removeAttribute('data-wallpaper');

        const hour = new Date().getHours();
        if (mode === 'dynamic') {
            let wp = 'day';
            if (hour >= 5 && hour < 10) wp = 'dawn';
            else if (hour >= 10 && hour < 18) wp = 'day';
            else if (hour >= 18 && hour < 21) wp = 'dusk';
            else wp = 'night';
            root.setAttribute('data-wallpaper', wp);
            root.setAttribute('data-theme', (wp === 'night' || wp === 'dusk') ? 'dark' : 'light');
        } else if (mode === 'scheduled') {
            const now = new Date();
            const [sH, sM] = this.settings.darkStart.split(':').map(Number);
            const [eH, eM] = this.settings.darkEnd.split(':').map(Number);
            const start = new Date(); start.setHours(sH, sM, 0, 0);
            const end = new Date(); end.setHours(eH, eM, 0, 0);
            if (end < start && now < end) start.setDate(start.getDate() - 1);
            const darkActive = now >= start && now <= end;
            root.setAttribute('data-theme', darkActive ? 'dark' : 'light');
            root.setAttribute('data-wallpaper', darkActive ? 'night' : 'day');
        } else if (mode === 'dark') {
            root.setAttribute('data-theme', 'dark');
            root.setAttribute('data-wallpaper', 'night');
        } else if (mode === 'light') {
            root.setAttribute('data-theme', 'light');
            root.setAttribute('data-wallpaper', 'day');
        } else {
            const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', sysDark ? 'dark' : 'light');
            root.setAttribute('data-wallpaper', sysDark ? 'night' : 'day');
        }
    }

    initSchedulerInterval() {
        clearInterval(this.schedulerInterval);
        this.schedulerInterval = setInterval(() => {
            if (this.settings.themeMode === 'dynamic' || this.settings.themeMode === 'scheduled') {
                this.applyDynamicTheme();
            }
        }, 60000); // check every minute
    }

    // ===== Visual Add-ons =====
    initMouseTrail() {
        if (document.getElementById('mouse-trail')) return;
        const c = document.createElement('div');
        c.id = 'mouse-trail';
        document.body.appendChild(c);
        document.addEventListener('mousemove', e => {
            if (this.settings.mouseTrail !== 'enabled') return;
            const dot = document.createElement('div');
            dot.className = 'trail';
            dot.style.left = `${e.clientX - 5}px`;
            dot.style.top = `${e.clientY - 5}px`;
            c.appendChild(dot);
            setTimeout(() => dot.remove(), 800);
        });
    }

    initScrollArrow() {
        const arrow = document.querySelector('.scroll-arrow');
        if (!arrow) return;
        let last = window.scrollY;
        const update = () => {
            const cur = window.scrollY;
            const reduced = document.body.classList.contains('reduced-motion');
            arrow.classList.toggle('hidden', cur <= 0);
            arrow.classList.toggle('up', cur < last);
            arrow.style.transition = reduced ? 'none' : 'transform 0.3s ease';
            last = cur;
        };
        window.addEventListener('scroll', update);
        arrow.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    initLoadingScreen() { /* reserved for future */ }

    // ===== Reset Functions =====
    resetSectionVisibility() {
        if (confirm('Show all homepage sections again?')) {
            const keys = Object.keys(this.defaultSettings).filter(k => k.startsWith('show'));
            keys.forEach(k => this.settings[k] = 'enabled');
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
            alert('All settings restored to default.');
        }
    }
}

if (!window.settingsManagerInstance) {
    window.settingsManagerInstance = new SettingsManager();
}
