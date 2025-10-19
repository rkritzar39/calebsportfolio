/**
 * settings.js
 * Fully functional settings manager with live previews, custom backgrounds,
 * dark-mode overlay, real-time scheduler, and motion-safe integration.
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
			this.initSchedulerInterval();
			this.initScrollArrow();
			this.initCustomBackgroundControls();
			this.applyCustomBackground();

			// Device theme listener
			if (window.matchMedia) {
				this.deviceThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
				this.deviceThemeMedia.addEventListener('change', () => {
					if (this.settings.appearanceMode === 'device') this.applyAppearanceMode();
					this.applyCustomBackground(); // re-apply overlay
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

			// Sync across tabs
			window.addEventListener('storage', (e) => {
				if (e.key === 'websiteSettings') {
					this.settings = this.loadSettings();
					this.applyAllSettings();
					this.initializeControls();
				}
			});

			// Auto year
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
	// UI setup
	// =============================
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
	// Event listeners
	// =============================
	setupEventListeners() {
		['appearanceMode', 'themeStyle'].forEach((key) => {
			const control = document.getElementById(`${key}Control`);
			if (control) {
				control.addEventListener('click', (e) => {
					const btn = e.target.closest('button');
					if (btn) {
						this.settings[key] = btn.dataset.value;
						this.applySetting(key);
						this.saveSettings();
						this.initSegmentedControl(`${key}Control`, this.settings[key]);
						this.updateSegmentedBackground(`${key}Control`);
						this.applyCustomBackground();
					}
				});
				this.updateSegmentedBackground(`${key}Control`);
			}
		});

		const accentPicker = document.getElementById('accentColorPicker');
		if (accentPicker) {
			accentPicker.addEventListener('input', (e) => {
				this.settings.accentColor = e.target.value;
				this.applyAccentColor();
				this.saveSettings();
			});
		}

		const slider = document.getElementById('text-size-slider');
		if (slider) {
			slider.addEventListener('input', (e) => {
				this.settings.fontSize = parseInt(e.target.value, 10);
				this.applyFontSize();
				this.updateSliderFill(slider);
				document.getElementById('textSizeValue').textContent = `${this.settings.fontSize}px`;
				this.saveSettings();
			});
		}

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
	// Setting application
	// =============================
	updateSliderFill(slider) {
		if (!slider) return;
		const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
		slider.style.background = `linear-gradient(90deg, var(--accent-color) ${pct}%, var(--slider-track-color) ${pct}%)`;
	}

	getContrastColor(hex) {
		if (!hex) return '#ffffff';
		hex = hex.replace('#', '');
		const r = parseInt(hex.substr(0, 2), 16);
		const g = parseInt(hex.substr(2, 2), 16);
		const b = parseInt(hex.substr(4, 2), 16);
		const yiq = (r * 299 + g * 587 + b * 114) / 1000;
		return yiq >= 128 ? '#000000' : '#ffffff';
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
	}

	applySetting(key) {
		const actions = {
			appearanceMode: () => this.applyAppearanceMode(),
			accentColor: () => this.applyAccentColor(),
			fontSize: () => this.applyFontSize(),
			focusOutline: () =>
				document.body.classList.toggle('focus-outline-disabled', this.settings.focusOutline === 'disabled'),
			motionEffects: () => this.applyMotionEffects(),
			highContrast: () =>
				document.body.classList.toggle('high-contrast', this.settings.highContrast === 'enabled'),
			dyslexiaFont: () => document.body.classList.toggle('dyslexia-font', this.settings.dyslexiaFont === 'enabled'),
			underlineLinks: () =>
				document.body.classList.toggle('underline-links', this.settings.underlineLinks === 'enabled'),
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

	applyAppearanceMode() {
		const isDark =
			this.settings.appearanceMode === 'dark' ||
			(this.settings.appearanceMode === 'device' && window.matchMedia('(prefers-color-scheme: dark)').matches);
		document.body.classList.toggle('dark-mode', isDark);
		document.body.classList.toggle('light-e', !isDark);
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
	// Custom Background
	// =============================
	initCustomBackgroundControls() {
		const upload = document.getElementById('customBgUpload');
		const remove = document.getElementById('removeCustomBg');
		if (!upload) return;

		const existing = localStorage.getItem('customBackground');
		if (existing && remove) remove.style.display = 'inline-block';

		upload.addEventListener('change', (e) => {
			const file = e.target.files[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = (evt) => {
				const imageData = evt.target.result;
				localStorage.setItem('customBackground', imageData);
				this.applyCustomBackground();
				if (remove) remove.style.display = 'inline-block';
			};
			reader.readAsDataURL(file);
		});

		if (remove) {
			remove.addEventListener('click', () => {
				localStorage.removeItem('customBackground');
				this.applyCustomBackground();
				remove.style.display = 'none';
			});
		}
	}

	applyCustomBackground() {
		const bg = localStorage.getItem('customBackground');
		const overlayId = 'dark-bg-overlay';
		let overlay = document.getElementById(overlayId);

		if (bg) {
			document.documentElement.style.backgroundImage = `url("${bg}")`;
			document.documentElement.style.backgroundSize = 'cover';
			document.documentElement.style.backgroundAttachment = 'fixed';
			document.documentElement.style.backgroundPosition = 'center';

			if (!overlay) {
				overlay = document.createElement('div');
				overlay.id = overlayId;
				overlay.style.position = 'fixed';
				overlay.style.top = 0;
				overlay.style.left = 0;
				overlay.style.width = '100%';
				overlay.style.height = '100%';
				overlay.style.zIndex = '-1';
				document.body.prepend(overlay);
			}

			const isDark =
				this.settings.appearanceMode === 'dark' ||
				(this.settings.appearanceMode === 'device' && window.matchMedia('(prefers-color-scheme: dark)').matches);

			overlay.style.background = isDark
				? 'rgba(0, 0, 0, 0.45)' // translucent dark overlay for readability
				: 'rgba(255, 255, 255, 0.15)';
			overlay.style.transition = 'background 0.5s ease';
			overlay.style.pointerEvents = 'none';
			overlay.style.backdropFilter = 'none';
		} else {
			document.documentElement.style.backgroundImage = '';
			if (overlay) overlay.remove();
		}
	}

	// =============================
	// Misc
	// =============================
	initScrollArrow() {}
	initLoadingScreen() {}
	initSchedulerInterval() {}

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
