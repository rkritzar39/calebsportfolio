/**
 * settings.js
 * Fully functional settings manager with live previews and real-time scheduler
 * Fully motion-safe integration
 */
class SettingsManager {
    constructor() {
        this.defaultSettings = {
            appearanceMode: 'device',
            themeStyle: 'clear',
            accentColor: '#3ddc84',

            // === keep your original keys ===
            darkModeScheduler: 'off',   // 'off'|'system'|'dynamic'|'scheduled'|'light'|'dark'
            darkModeStart: '20:00',
            darkModeEnd: '06:00',

            fontSize: 16,
            focusOutline: 'enabled',
            motionEffects: 'enabled', // motion toggle
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

            // Device theme change listener
            if (window.matchMedia) {
                this.deviceThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
                this.deviceThemeMedia.addEventListener('change', () => {
                    if (this.settings.appearanceMode === 'device' ||
                        this.normalizeScheduler(this.settings.darkModeScheduler) === 'system') {
                        this.applyAppearanceMode();
                        this.applyDynamicTheme(); // keep wallpaper in sync too
                    }
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

            // Storage listener for sync across tabs
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

    loadSettings() {
        try {
            const stored = localStorage.getItem('websiteSettings');
            const loadedSettings = stored ? JSON.parse(stored) : {};
            const merged = { ...this.defaultSettings, ...loadedSettings };

            // Back-compat: treat 'off' as 'system'
            merged.darkModeScheduler = this.normalizeScheduler(merged.darkModeScheduler);
            return merged;
        } catch {
            return { ...this.defaultSettings };
        }
    }

    saveSettings() {
        const settingsToSave = {};
        for (const key in this.defaultSettings) {
            if (this.settings.hasOwnProperty(key)) {
                settingsToSave[key] = this.settings[key];
            }
        }
        localStorage.setItem('websiteSettings', JSON.stringify(settingsToSave));
    }

    // Ensure scheduler value is one of the supported tokens
    normalizeScheduler(val) {
        if (!val || val === 'off') return 'system';
        const allowed = ['system', 'dynamic', 'scheduled', 'light', 'dark'];
        return allowed.includes(val) ? val : 'system';
    }

    /* =========================
       UI INITIALIZATION
    ========================= */
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

        // NEW: Dynamic wallpapers / scheduler controls
        const modeSelect = document.getElementById('themeModeSelect');
        const darkStart = document.getElementById('darkStart');
        const darkEnd = document.getElementById('darkEnd');
        const scheduleGroup = document.getElementById('scheduleInputs');

        if (modeSelect) {
            modeSelect.value = this.normalizeScheduler(this.settings.darkModeScheduler);
        }
        if (darkStart) darkStart.value = this.settings.darkModeStart;
        if (darkEnd) darkEnd.value = this.settings.darkModeEnd;
        if (scheduleGroup) {
            scheduleGroup.style.display =
                this.normalizeScheduler(this.settings.darkModeScheduler) === 'scheduled'
                    ? 'block' : 'none';
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

        let active = control.querySelector("button.active");
        let bg = control.querySelector(".seg-bg");
        if (!bg) {
            bg = document.createElement("div");
            bg.className = "seg-bg";
            control.prepend(bg);
        }

        if (active) {
            const rect = active.getBoundingClientRect();
            const parentRect = control.getBoundingClientRect();
            bg.style.left = rect.left - parentRect.left + "px";
            bg.style.width = rect.width + "px";
        }
    }

    setToggle(key) {
        const el = document.getElementById(`${key}Toggle`);
        if (el) el.checked = this.settings[key] === 'enabled';
    }

    /* =========================
       EVENT LISTENERS
    ========================= */
    setupEventListeners() {
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
                        this.updateSegmentedBackground(`${key}Control`); // slide capsule
                        if (key === 'appearanceMode') this.applyDynamicTheme(); // keep in sync
                    }
                });
                // position the capsule on load
                this.updateSegmentedBackground(`${key}Control`);
            }
        });

        const accentPicker = document.getElementById('accentColorPicker');
        if (accentPicker) {
            accentPicker.addEventListener('input', e => {
                this.settings.accentColor = e.target.value;
                this.applyAccentColor();
                this.saveSettings();
            });
        }

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

        const toggleKeys = Object.keys(this.defaultSettings).filter(k =>
            typeof this.defaultSettings[k] === 'string' &&
            (this.defaultSettings[k] === 'enabled' || this.defaultSettings[k] === 'disabled')
        );
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

        // Scheduler controls
        const modeSelect = document.getElementById('themeModeSelect');
        const darkStart = document.getElementById('darkStart');
        const darkEnd = document.getElementById('darkEnd');
        const scheduleGroup = document.getElementById('scheduleInputs');

        if (modeSelect) {
            modeSelect.addEventListener('change', () => {
                this.settings.darkModeScheduler = this.normalizeScheduler(modeSelect.value);
                if (scheduleGroup) {
                    scheduleGroup.style.display =
                        this.settings.darkModeScheduler === 'scheduled' ? 'block' : 'none';
                }
                this.applyDynamicTheme();
                this.saveSettings();
            });
        }
        if (darkStart) {
            darkStart.addEventListener('change', () => {
                this.settings.darkModeStart = darkStart.value || '20:00';
                this.saveSettings();
                if (this.settings.darkModeScheduler === 'scheduled') this.applyDynamicTheme();
            });
        }
        if (darkEnd) {
            darkEnd.addEventListener('change', () => {
                this.settings.darkModeEnd = darkEnd.value || '06:00';
                this.saveSettings();
                if (this.settings.darkModeScheduler === 'scheduled') this.applyDynamicTheme();
            });
        }

        document.getElementById('resetLayoutBtn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the section layout to default?')) {
                localStorage.removeItem('sectionOrder');
                alert('Layout has been reset. Please refresh the homepage to see the changes.');
            }
        });

        document.getElementById('resetSectionsBtn')?.addEventListener('click', () => this.resetSectionVisibility());
        document.getElementById('resetSettings')?.addEventListener('click', () => this.resetSettings());
    }

    /* =========================
       SMALL UTILITIES
    ========================= */
    updateSliderFill(slider) {
        if (!slider) return;
        const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.background = `linear-gradient(90deg, var(--accent-color) ${pct}%, var(--slider-track-color) ${pct}%)`;
    }

    getContrastColor(hexcolor) {
        if (!hexcolor) return '#ffffff';
        hexcolor = hexcolor.replace("#", "");
        const r = parseInt(hexcolor.substr(0, 2), 16);
        const g = parseInt(hexcolor.substr(2, 2), 16);
        const b = parseInt(hexcolor.substr(4, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#ffffff';
    }

    checkAccentColor(hexcolor) {
        const warningElement = document.getElementById('whiteAccentWarning');
        if (!warningElement) return;
        const isLightMode =
            this.settings.appearanceMode === 'light' ||
            (this.settings.appearanceMode === 'device' &&
             !window.matchMedia('(prefers-color-scheme: dark)').matches);

        const r = parseInt(hexcolor.substr(1, 2), 16);
        const g = parseInt(hexcolor.substr(3, 2), 16);
        const b = parseInt(hexcolor.substr(5, 2), 16);
        const isLightColor = r > 240 && g > 240 && b > 240;
        warningElement.style.display = isLightColor && isLightMode ? 'block' : 'none';
    }

    /* =========================
       APPLY SETTINGS
    ========================= */
    applyAllSettings() {
        Object.keys(this.defaultSettings).forEach(key => this.applySetting(key));
        // last step so dynamic scheduler can override body theme if needed
        this.applyDynamicTheme();
    }

    applySetting(key) {
        const actions = {
            appearanceMode: () => this.applyAppearanceMode(),
            accentColor: () => this.applyAccentColor(),
            fontSize: () => this.applyFontSize(),
            focusOutline: () => document.body.classList.toggle('focus-outline-disabled', this.settings.focusOutline === 'disabled'),
            motionEffects: () => this.applyMotionEffects(),
            highContrast: () => document.body.classList.toggle('high-contrast', this.settings.highContrast === 'enabled'),
            dyslexiaFont: () => document.body.classList.toggle('dyslexia-font', this.settings.dyslexiaFont === 'enabled'),
            underlineLinks: () => document.body.classList.toggle('underline-links', this.settings.underlineLinks === 'enabled'),
            mouseTrail: () => document.body.classList.toggle('mouse-trail-enabled', this.settings.mouseTrail === 'enabled'),
            showSocialLinks: () => this.applySectionVisibility('social-links-section', this.settings.showSocialLinks),
            showPresidentSection: () => this.applySectionVisibility('president-section', this.settings.showPresidentSection),
            showTiktokShoutouts: () => this.applySectionVisibility('tiktok-shoutouts-section', this.settings.showTiktokShoutouts),
            showInstagramShoutouts: () => this.applySectionVisibility('instagram-shoutouts-section', this.settings.showInstagramShoutouts),
            showYoutubeShoutouts: () => this.applySectionVisibility('youtube-shoutouts-section', this.settings.showYoutubeShoutouts),
            showUsefulLinks: () => this.applySectionVisibility('useful-links-section', this.settings.showUsefulLinks),
            showCountdown: () => this.applySectionVisibility('countdown-section', this.settings.showCountdown),
            showBusinessSection: () => this.applySectionVisibility('business-section', this.settings.showBusinessSection),
            showTechInformation: () => this.applySectionVisibility('tech-information-section', this.settings.showTechInformation),
            showDisabilitiesSection: () => this.applySectionVisibility('disabilities-section', this.settings.showDisabilitiesSection),
            showQuoteSection: () => this.applySectionVisibility('quote-section', this.settings.showQuoteSection),
        };
        actions[key]?.();
    }

    applyAppearanceMode() {
        const isDark = this.settings.appearanceMode === 'dark' ||
            (this.settings.appearanceMode === 'device' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        document.body.classList.toggle('dark-mode', isDark);
        document.body.classList.toggle('light-e', !isDark);
        this.checkAccentColor(this.settings.accentColor);
    }

    applyAccentColor() {
        const accentColor = this.settings.accentColor;
        document.documentElement.style.setProperty('--accent-color', accentColor);
        document.documentElement.style.setProperty('--accent-text-color', this.getContrastColor(accentColor));
        this.checkAccentColor(accentColor);
    }

    applyFontSize() {
        document.documentElement.style.setProperty('--font-size-base', `${this.settings.fontSize}px`);
    }

    applyMotionEffects() {
        const reduced = this.settings.motionEffects === 'disabled';
        document.body.classList.toggle('reduced-motion', reduced);

        // Stop scroll arrow transitions immediately
        const scrollArrow = document.querySelector('.scroll-arrow');
        if (scrollArrow) scrollArrow.style.transition = reduced ? 'none' : '';

        // Remove mouse trail dots
        const trails = document.querySelectorAll('.trail');
        trails.forEach(dot => dot.remove());

        // Stop flip clocks, bubbles, countdowns, floating icons, carousels
        const animatedElements = document.querySelectorAll('.flip-clock-inner, .bubble, .countdown-block, .floating-icon, .carousel-item');
        animatedElements.forEach(el => {
            el.style.animation = 'none';
            el.style.transition = 'none';
            el.style.transform = 'none';
        });

        // Force reflow to stop any ongoing animations immediately
        if (reduced) document.body.offsetHeight;
    }

    applySectionVisibility(sectionId, status) {
        const section = document.getElementById(sectionId);
        if (section) section.style.display = status === 'enabled' ? '' : 'none';
    }

    /* =========================
       DYNAMIC WALLPAPERS / SCHEDULER
    ========================= */
    applyDynamicTheme() {
        const root = document.documentElement;
        const mode = this.normalizeScheduler(this.settings.darkModeScheduler);

        // Clear previous attrs
        root.removeAttribute('data-theme');
        root.removeAttribute('data-wallpaper');

        let isDarkTarget = null; // null => do not override body theme

        const hour = new Date().getHours();
        if (mode === 'dynamic') {
            let wp = 'day';
            if (hour >= 5 && hour < 10) wp = 'dawn';
            else if (hour >= 10 && hour < 18) wp = 'day';
            else if (hour >= 18 && hour < 21) wp = 'dusk';
            else wp = 'night';

            root.setAttribute('data-wallpaper', wp);
            isDarkTarget = (wp === 'night' || wp === 'dusk');
        } else if (mode === 'scheduled') {
            const now = new Date();
            const [sH, sM] = (this.settings.darkModeStart || '20:00').split(':').map(Number);
            const [eH, eM] = (this.settings.darkModeEnd || '06:00').split(':').map(Number);
            const start = new Date(); start.setHours(sH, sM, 0, 0);
            const end = new Date();   end.setHours(eH, eM, 0, 0);

            // Handle overnight window (e.g., 20:00 → 06:00)
            if (end < start && now < end) start.setDate(start.getDate() - 1);

            const darkActive = now >= start && now <= end;
            isDarkTarget = darkActive;
            root.setAttribute('data-wallpaper', darkActive ? 'night' : 'day');
        } else if (mode === 'dark') {
            isDarkTarget = true;
            root.setAttribute('data-wallpaper', 'night');
        } else if (mode === 'light') {
            isDarkTarget = false;
            root.setAttribute('data-wallpaper', 'day');
        } else { // 'system'
            const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-wallpaper', sysDark ? 'night' : 'day');
            // in 'system', don't override body if user explicitly set appearanceMode light/dark
            if (this.settings.appearanceMode === 'device') {
                isDarkTarget = sysDark;
            } else {
                isDarkTarget = null; // let appearanceMode rule
            }
        }

        // If scheduler should control theme, override body class
        if (isDarkTarget !== null) {
            document.body.classList.toggle('dark-mode', isDarkTarget);
            document.body.classList.toggle('light-e', !isDarkTarget);
        }
    }

    initSchedulerInterval() {
        clearInterval(this.schedulerInterval);
        // Recompute every minute for dynamic/scheduled modes
        this.schedulerInterval = setInterval(() => {
            const mode = this.normalizeScheduler(this.settings.darkModeScheduler);
            if (mode === 'dynamic' || mode === 'scheduled' || mode === 'system') {
                this.applyDynamicTheme();
            }
        }, 60 * 1000);
    }

    /* =========================
       VISUAL ADD-ONS
    ========================= */
    initMouseTrail() {
        if (document.getElementById('mouse-trail')) return;
        const trailContainer = document.createElement('div');
        trailContainer.id = 'mouse-trail';
        document.body.appendChild(trailContainer);

        document.addEventListener('mousemove', e => {
            if (this.settings.mouseTrail !== 'enabled') return;
            const dot = document.createElement('div');
            dot.className = 'trail';
            dot.style.left = `${e.clientX - 5}px`;
            dot.style.top = `${e.clientY - 5}px`;
            trailContainer.appendChild(dot);
            setTimeout(() => dot.remove(), 800);
        });
    }

    initScrollArrow() {
        const scrollArrow = document.querySelector('.scroll-arrow');
        if (!scrollArrow) return;
        let lastScroll = window.scrollY;

        function updateScrollArrow() {
            const currentScroll = window.scrollY;
            const reduced = document.body.classList.contains('reduced-motion');

            scrollArrow.classList.toggle('hidden', currentScroll <= 0);
            scrollArrow.classList.toggle('up', currentScroll < lastScroll);
            scrollArrow.style.transition = reduced ? 'none' : 'transform 0.3s ease';

            lastScroll = currentScroll;
        }

        window.addEventListener('scroll', updateScrollArrow);
        scrollArrow.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: document.body.classList.contains('reduced-motion') ? 'auto' : 'smooth' });
        });
    }

    initLoadingScreen() {
        // ... implementation ...
    }

    /* =========================
       RESET HELPERS
    ========================= */
    resetSectionVisibility() {
        if (confirm('Are you sure you want to make all homepage sections visible again?')) {
            const sectionKeys = Object.keys(this.defaultSettings).filter(k => k.startsWith('show'));
            sectionKeys.forEach(key => this.settings[key] = 'enabled');
            this.saveSettings();
            this.initializeControls();
            this.applyAllSettings();
            alert('All homepage sections have been made visible.');
        }
    }

    resetSettings() {
        if (confirm('Reset all settings to default values?')) {
            this.settings = { ...this.defaultSettings };
            this.saveSettings();
            localStorage.removeItem('sectionOrder');
            this.initializeControls();
            this.applyAllSettings();
            alert('All settings and the layout have been reset to default.');
        }
    }
}

if (!window.settingsManagerInstance) {
    window.settingsManagerInstance = new SettingsManager();
}
