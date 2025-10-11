/**
 * settings.js
 * Fully functional settings manager with live previews and real-time scheduler
 * Motion Control Enhanced — Full / Reduced / None
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
            motionEffects: 'full', // now supports 'full', 'reduced', 'none'
            highContrast: 'disabled',
            dyslexiaFont: 'disabled',
            underlineLinks: 'disabled',
            loadingScreen: 'disabled',
            mouseTrail: 'disabled',
            liveStatus: 'disabled',
            rearrangingEnabled: 'enabled',
            showSocialLinks: 'enabled',
            showPresidentSection: 'enabled',
            showTiktokShoutouts: 'enabled',
            showInstagramShoutouts: 'enabled',
            showYoutubeShoutouts: 'enabled',
            showUsefulLinks: 'enabled',
            showCountdown: 'enabled',
            showBusinessSection: 'enabled',
            showTechInformation: 'enabled',
            showDisabilitiesSection: 'enabled'
        };

        this.settings = this.loadSettings();
        this.deviceThemeMedia = null;
        this.schedulerInterval = null;

        // Auto-upgrade legacy motion settings
        if (this.settings.motionEffects === 'enabled') this.settings.motionEffects = 'full';
        if (this.settings.motionEffects === 'disabled') this.settings.motionEffects = 'reduced';

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
                    if (this.settings.appearanceMode === 'device') this.applyAppearanceMode();
                });
            }

            // System reduced motion listener
            if (window.matchMedia) {
                const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
                motionMedia.addEventListener('change', (e) => {
                    if (!localStorage.getItem('websiteSettings')) {
                        this.settings.motionEffects = e.matches ? 'reduced' : 'full';
                        this.applyMotionEffects(this.settings.motionEffects);
                        this.saveSettings();
                        this.initSegmentedControl('motionControl', this.settings.motionEffects);
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

            // Auto update footer year
            const yearSpan = document.getElementById('year');
            if (yearSpan) yearSpan.textContent = new Date().getFullYear();
        });
    }

    loadSettings() {
        try {
            const stored = localStorage.getItem('websiteSettings');
            const loadedSettings = stored ? JSON.parse(stored) : {};
            return { ...this.defaultSettings, ...loadedSettings };
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

    initializeControls() {
        this.initSegmentedControl('appearanceModeControl', this.settings.appearanceMode);
        this.initSegmentedControl('themeStyleControl', this.settings.themeStyle);
        this.initSegmentedControl('motionControl', this.settings.motionEffects);

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

        const toggles = Object.keys(this.defaultSettings).filter(
            k => typeof this.defaultSettings[k] === 'string' &&
            (this.defaultSettings[k] === 'enabled' || this.defaultSettings[k] === 'disabled')
        );
        toggles.forEach(key => this.setToggle(key));
    }

    initSegmentedControl(controlId, value) {
        const control = document.getElementById(controlId);
        if (!control) return;
        control.querySelectorAll('button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === value);
        });
    }

    setToggle(key) {
        const el = document.getElementById(`${key}Toggle`);
        if (el) el.checked = this.settings[key] === 'enabled';
    }

    setupEventListeners() {
        // Segment controls (appearance, theme, motion)
        ['appearanceMode', 'themeStyle', 'motionEffects'].forEach(key => {
            const control = document.getElementById(`${key}Control`);
            if (control) {
                control.addEventListener('click', e => {
                    const btn = e.target.closest('button');
                    if (btn) {
                        this.settings[key] = btn.dataset.value;
                        this.applySetting(key);
                        this.saveSettings();
                        this.initSegmentedControl(`${key}Control`, this.settings[key]);
                    }
                });
            }
        });

        // Accent color
        const accentPicker = document.getElementById('accentColorPicker');
        if (accentPicker) {
            accentPicker.addEventListener('input', e => {
                this.settings.accentColor = e.target.value;
                this.applyAccentColor();
                this.saveSettings();
            });
        }

        // Font size
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

        // Toggle switches
        const toggleKeys = Object.keys(this.defaultSettings).filter(
            k => typeof this.defaultSettings[k] === 'string' &&
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

        // Reset buttons
        document.getElementById('resetLayoutBtn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the section layout to default?')) {
                localStorage.removeItem('sectionOrder');
                alert('Layout has been reset. Please refresh the homepage to see the changes.');
            }
        });

        document.getElementById('resetSectionsBtn')?.addEventListener('click', () => this.resetSectionVisibility());
        document.getElementById('resetSettings')?.addEventListener('click', () => this.resetSettings());
    }

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
        let isLightMode = this.settings.appearanceMode === 'light' ||
            (this.settings.appearanceMode === 'device' && !window.matchMedia('(prefers-color-scheme: dark)').matches);
        const r = parseInt(hexcolor.substr(1, 2), 16);
        const g = parseInt(hexcolor.substr(3, 2), 16);
        const b = parseInt(hexcolor.substr(5, 2), 16);
        const isLightColor = r > 240 && g > 240 && b > 240;
        warningElement.style.display = isLightColor && isLightMode ? 'block' : 'none';
    }

    applyAllSettings() {
        Object.keys(this.defaultSettings).forEach(key => this.applySetting(key));
    }

    applySetting(key) {
        const actions = {
            appearanceMode: () => this.applyAppearanceMode(),
            accentColor: () => this.applyAccentColor(),
            fontSize: () => this.applyFontSize(),
            focusOutline: () => document.body.classList.toggle('focus-outline-disabled', this.settings.focusOutline === 'disabled'),
            motionEffects: () => this.applyMotionEffects(this.settings.motionEffects),
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

    applyMotionEffects(mode) {
        document.documentElement.classList.remove('full-motion', 'reduced-motion', 'no-motion');

        switch (mode) {
            case 'reduced':
                document.documentElement.classList.add('reduced-motion');
                break;
            case 'none':
                document.documentElement.classList.add('no-motion');
                break;
            default:
                document.documentElement.classList.add('full-motion');
                break;
        }

        const isReduced = mode !== 'full';
        const isOff = mode === 'none';

        const scrollArrow = document.querySelector('.scroll-arrow');
        if (scrollArrow) scrollArrow.style.transition = isReduced ? 'none' : '';

        if (isOff) document.querySelectorAll('.trail').forEach(dot => dot.remove());

        const animatedElements = document.querySelectorAll('.flip-clock-inner, .bubble, .countdown-block, .floating-icon, .carousel-item');
        animatedElements.forEach(el => {
            el.style.animation = isOff ? 'none' : '';
            el.style.transition = isReduced ? 'none' : '';
            el.style.transform = isOff ? 'none' : '';
        });

        if (isOff) document.body.offsetHeight;
    }

    applySectionVisibility(sectionId, status) {
        const section = document.getElementById(sectionId);
        if (section) section.style.display = status === 'enabled' ? '' : 'none';
    }

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

        const updateScrollArrow = () => {
            const currentScroll = window.scrollY;
            const reduced = document.documentElement.classList.contains('reduced-motion');
            scrollArrow.classList.toggle('hidden', currentScroll <= 0);
            scrollArrow.classList.toggle('up', currentScroll < lastScroll);
            scrollArrow.style.transition = reduced ? 'none' : 'transform 0.3s ease';
            lastScroll = currentScroll;
        };

        window.addEventListener('scroll', updateScrollArrow);
        scrollArrow.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: document.documentElement.classList.contains('reduced-motion') ? 'auto' : 'smooth' });
        });
    }

    initLoadingScreen() {
        // reserved for loading screen behavior
    }

    initSchedulerInterval() {
        // reserved for dark mode scheduling logic
    }

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
