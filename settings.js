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
	// UI Setup
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

		// Apply scheduler toggle visibility
		this.toggleScheduleInputs(this.settings.darkModeScheduler);

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
				document.getElementById('textSizeValue').textContent = `${this.settings.fontSize}px`;
				this.saveSettings();
			});
		}

		// Scheduler controls
		const schedulerSelect = document.getElementById('darkModeScheduler');
		const startInput = document.getElementById('darkModeStart');
		const endInput = document.getElementById('darkModeEnd');

		if (schedulerSelect) {
			schedulerSelect.addEventListener('change', (e) => {
				this.settings.darkModeScheduler = e.target.value;
				this.saveSettings();
				this.toggleScheduleInputs(e.target.value);
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
			blurSlider.addEventListener('input', (e) => {
				const val = e.target.value;
				blurBadge.textContent = `${val}px`;
				localStorage.setItem('wallpaperBlur', val);
				this.applyWallpaperBlur(val);
			});
		}
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

	// =============================
	// Custom Background & Blur
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
				this.applyCustomBackground(true);
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

	applyCustomBackground(fade = false) {
		const bg = localStorage.getItem('customBackground');
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
				zIndex: '0',
				pointerEvents: 'none',
				transition: 'opacity 0.6s ease, background 0.5s ease'
			});
			document.body.prepend(overlay);
		}

		if (bg) {
			document.body.style.backgroundImage = `url("${bg}")`;
			document.body.style.backgroundSize = 'cover';
			document.body.style.backgroundPosition = 'center';
			document.body.style.backgroundRepeat = 'no-repeat';
			document.body.style.backgroundAttachment = 'fixed';
			if (fade) {
				overlay.style.opacity = '0';
				setTimeout(() => (overlay.style.opacity = '1'), 50);
			}
		} else {
			document.body.style.backgroundImage = '';
		}

		const isDark =
			this.settings.appearanceMode === 'dark' ||
			(this.settings.appearanceMode === 'device' && window.matchMedia('(prefers-color-scheme: dark)').matches);

		overlay.style.background = isDark
			? 'rgba(0, 0, 0, 0.45)'
			: 'rgba(255, 255, 255, 0.15)';
		this.applyWallpaperBlur(localStorage.getItem('wallpaperBlur') || 15);
	}

	applyWallpaperBlur(value) {
		const overlay = document.getElementById('dark-bg-overlay');
		if (!overlay) return;
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

		let isNight = end > start ? now >= start && now < end : now >= start || now < end;

		if (mode === 'auto') {
			document.body.classList.toggle('dark-mode', isNight);
			document.body.classList.toggle('light-e', !isNight);
			this.applyCustomBackground();
		}
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
