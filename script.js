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

(function() {
  const scrollBtn = document.getElementById('scrollToTopBtn');
  const progressIndicator = document.getElementById('progressIndicator');
  const scrollPercent = document.getElementById('scrollPercent');
  const scrollArrow = document.getElementById('scrollArrow');
  if (!scrollBtn || !progressIndicator) return;

  const radius = progressIndicator.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  progressIndicator.style.strokeDasharray = `${circumference}`;
  progressIndicator.style.strokeDashoffset = `${circumference}`;

  let lastScrollTop = 0;

  function updateScrollProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = docHeight > 0 ? scrollTop / docHeight : 0;
    const offset = circumference - scrolled * circumference;
    progressIndicator.style.strokeDashoffset = offset;

    const percent = Math.round(scrolled * 100);
    scrollPercent.textContent = `${percent}%`;

    if (scrollTop > window.innerHeight * 0.2) {
      scrollBtn.classList.remove('hidden');
    } else {
      scrollBtn.classList.add('hidden');
    }

    // Scroll direction detection
    if (scrollTop > lastScrollTop + 5) {
      scrollArrow.classList.add('down');
    } else if (scrollTop < lastScrollTop - 5) {
      scrollArrow.classList.remove('down');
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }

  window.addEventListener('scroll', updateScrollProgress);
  window.addEventListener('resize', updateScrollProgress);
  updateScrollProgress();

  scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    scrollArrow.classList.remove('down'); // force arrow up on click
  });
})();

	/* =================================== */
/* == ONYX GLASS ADD-ONS FUNCTIONS == */
/* =================================== */

/* 🕒 Live Time */
function updateTime() {
  const now = new Date();
  const opts = { weekday: "short", hour: "2-digit", minute: "2-digit" };
  const timeEl = document.getElementById("live-time");
  if (timeEl) timeEl.textContent = now.toLocaleString([], opts);
}
setInterval(updateTime, 1000);
updateTime();

/* 🌤️ Weather Widget */
async function loadWeather() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    try {
      const { latitude, longitude } = coords;
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
      );
      const data = await res.json();
      const w = data.current_weather;
      const emoji =
        w.weathercode < 3 ? "☀️" :
        w.weathercode < 60 ? "⛅" :
        "🌧️";
      const el = document.getElementById("weather-widget");
      if (el) el.textContent = `${emoji} ${Math.round(w.temperature)}°C`;
    } catch (e) {
      console.warn("Weather load failed", e);
    }
  });
}
loadWeather();

/* 💬 Daily Focus */
const focusTips = [
  "Take three deep breaths and relax your shoulders.",
  "Tidy up one small area of your space.",
  "Stretch for 30 seconds.",
  "Go outside for fresh air.",
  "Drink a full glass of water.",
  "Write down one goal for today.",
  "Smile at yourself in the mirror!"
];
const today = new Date().getDate();
const focusText = document.getElementById("focus-text");
if (focusText) focusText.textContent = focusTips[today % focusTips.length];

/* 🔋 Battery Widget */
if (navigator.getBattery) {
  navigator.getBattery().then(battery => {
    const el = document.getElementById("battery-widget");
    function updateBattery() {
      if (!el) return;
      const pct = Math.round(battery.level * 100);
      const icon = battery.charging ? "⚡" : "🔋";
      el.textContent = `${icon} ${pct}%`;
    }
    battery.addEventListener("levelchange", updateBattery);
    battery.addEventListener("chargingchange", updateBattery);
    updateBattery();
  });
}

/* 🪩 Parallax Motion */
document.addEventListener("mousemove", e => {
  const x = (e.clientX / window.innerWidth - 0.5) * 6;
  const y = (e.clientY / window.innerHeight - 0.5) * 6;
  document.body.style.transform = `translate(${x}px, ${y}px)`;
});

/* Percentage fade */
(function() {
  const scrollPercent = document.getElementById('scrollPercent');
  let fadeTimeout;
  window.addEventListener('scroll', () => {
    if (!scrollPercent) return;
    scrollPercent.classList.add('visible');
    clearTimeout(fadeTimeout);
    fadeTimeout = setTimeout(() => scrollPercent.classList.remove('visible'), 1500);
  });
})();
	
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
