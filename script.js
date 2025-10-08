// --- HTTPS Redirect ---
// Run this check immediately, before waiting for DOM content.
if (window.location.protocol !== "https:" && window.location.hostname !== "localhost" && !window.location.hostname.startsWith("127.")) {
    console.log("Redirecting to HTTPS...");
    window.location.href = "https://" + window.location.host + window.location.pathname + window.location.search;
}

// --- Page Load Animation ---
// 'load' fires after all resources (images, css) are loaded, which is appropriate for fade-in effects.
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// --- Main script execution after HTML is parsed ---
document.addEventListener('DOMContentLoaded', () => {

    // ===============================================
    // --- Homepage Section Visibility Customization ---
    // ===============================================
    const applyHomepageSettings = () => {
        const settings = JSON.parse(localStorage.getItem('websiteSettings')) || {};

        // Helper function to check the setting and hide/show the element
        const setVisibility = (settingKey, elementId) => {
            const isEnabled = settings[settingKey] !== 'disabled'; // Default to enabled if not set
            const section = document.getElementById(elementId);
            if (section) {
                section.style.display = isEnabled ? '' : 'none';
            }
        };

        // Apply settings for each section you have
        setVisibility('showSocialLinks', 'social-links-section');
        setVisibility('showPresidentSection', 'president-section');
        setVisibility('showTiktokShoutouts', 'tiktok-shoutouts-section');
        setVisibility('showInstagramShoutouts', 'instagram-shoutouts-section');
        setVisibility('showYoutubeShoutouts', 'youtube-shoutouts-section');
        setVisibility('showUsefulLinks', 'useful-links-section');
        setVisibility('showCountdown', 'countdown-section');
        setVisibility('showBusinessSection', 'business-section');
        setVisibility('showTechInformation', 'tech-information-section');
        setVisibility('showDisabilitiesSection', 'disabilities-section');
    };

    // Apply settings on initial page load
    applyHomepageSettings();

    // Listen for changes from the settings page to update live
    window.addEventListener('storage', (e) => {
        if (e.key === 'websiteSettings') {
            applyHomepageSettings();
        }
    });


    // --- Enhanced Interaction Control (Copy Protection, Drag Prevention, Context Menu) ---
    const enhancedInteractionControl = {
        init() {
            // Prevent context menu (right-click/long-press menu)
            document.addEventListener('contextmenu', e => e.preventDefault());

            // Prevent text selection globally, but allow in inputs/textareas
            document.addEventListener('selectstart', e => {
                const target = e.target;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
                    e.preventDefault();
                }
            });

            // Prevent copying globally, but allow from inputs/textareas
            document.addEventListener('copy', e => {
                const target = e.target;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
                    e.preventDefault();
                }
            });

            // Prevent dragging of links and buttons
            document.addEventListener('dragstart', e => {
                if (e.target.closest('a, .social-button, .link-button, .settings-button, .merch-button, .weather-button, .disabilities-section a, .visit-profile')) {
                    e.preventDefault();
                }
            });

            // Attempt to suppress long-press actions on specific links/buttons (mainly for mobile)
            const interactiveElements = document.querySelectorAll(
                'a, .social-button, .link-button, .settings-button, .merch-button, .weather-button, .disabilities-section a, .visit-profile'
            );
            interactiveElements.forEach(element => {
                element.setAttribute('draggable', 'false');
            });
        }
    };
    enhancedInteractionControl.init();

    // --- Live Date & Time Update ---
    function updateTime() {
        const now = new Date();
        const locale = navigator.language || 'en-US';

        const datePart = now.toLocaleDateString(locale, {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        const timePart = now.toLocaleTimeString(locale, {
            hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZoneName: 'short'
        });
        const formattedDateTime = `${datePart} at ${timePart}`;

        // Update main date/time section
        const dateTimeSectionElement = document.querySelector('.datetime-section .current-datetime');
        if (dateTimeSectionElement) {
            dateTimeSectionElement.textContent = formattedDateTime;
        }

        // Update version info section time
        const versionTimeElement = document.querySelector('.version-info-section .update-time .version-value');
        if (versionTimeElement) {
            versionTimeElement.textContent = formattedDateTime;
        }
    }

    updateTime();
    setInterval(updateTime, 1000);

 // ========================
// Scroll to Top Orb Logic – iOS 26 Enhanced Smooth Mode
// ========================
const scrollBtn = document.querySelector('.scroll-to-top');
const arrow = scrollBtn.querySelector('.arrow');
const progressCircle = document.querySelector('.progress-indicator');
const percentage = document.querySelector('.percentage');

const radius = progressCircle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;
progressCircle.style.strokeDasharray = `${circumference}`;
progressCircle.style.strokeDashoffset = `${circumference}`;

let lastScrollY = window.scrollY;
let lastTime = performance.now();
let ticking = false;

function updateProgress() {
	const scrollTop = window.scrollY;
	const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
	const progress = scrollHeight ? (scrollTop / scrollHeight) : 0;

	// Animate progress ring
	progressCircle.style.strokeDashoffset = `${circumference * (1 - progress)}`;

	// Update percentage text
	percentage.textContent = `${Math.round(progress * 100)}%`;

	// Arrow direction toggle
	if (scrollTop > lastScrollY + 2) arrow.classList.replace('up', 'down');
	else if (scrollTop < lastScrollY - 2) arrow.classList.replace('down', 'up');

	// Fade visibility
	if (scrollTop < 100) {
		scrollBtn.classList.remove('visible');
		scrollBtn.classList.add('hidden');
	} else {
		scrollBtn.classList.add('visible');
		scrollBtn.classList.remove('hidden');
	}

	// Dynamic glow based on scroll velocity
	const now = performance.now();
	const delta = Math.abs(scrollTop - lastScrollY) / (now - lastTime + 1);
	const glow = Math.min(1 + delta * 30, 3); // cap intensity
	progressCircle.style.filter = `
		drop-shadow(0 0 ${4 * glow}px var(--accent-color))
		drop-shadow(0 0 ${10 * glow}px var(--accent-color))
	`;

	lastScrollY = scrollTop;
	lastTime = now;
	ticking = false;
}

// Debounce scroll with rAF
window.addEventListener('scroll', () => {
	if (!ticking) {
		requestAnimationFrame(updateProgress);
		ticking = true;
	}
});

// Smooth scroll to top
scrollBtn.addEventListener('click', () => {
	window.scrollTo({ top: 0, behavior: 'smooth' });
	arrow.classList.replace('down', 'up');
});

    // --- Cookie Consent ---
    const cookieConsent = document.getElementById('cookieConsent');
    const acceptCookiesBtn = document.getElementById('cookieAccept');

    if (cookieConsent && acceptCookiesBtn) {
        if (!localStorage.getItem('cookieAccepted')) {
            cookieConsent.style.display = 'block';
        }
        acceptCookiesBtn.addEventListener('click', () => {
            localStorage.setItem('cookieAccepted', 'true');
            cookieConsent.style.display = 'none';
        });
    }

    // --- Update footer year dynamically ---
    function updateFooterYear() {
        const yearElement = document.getElementById('year');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    }
    updateFooterYear();

}); // --- END OF DOMContentLoaded ---
