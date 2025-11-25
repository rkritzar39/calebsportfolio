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

    // Update ring
    const offset = circumference - scrolled * circumference;
    progressIndicator.style.strokeDashoffset = offset;

    // Update percentage text
    const percent = Math.round(scrolled * 100);
    scrollPercent.textContent = `${percent}%`;

    // Show/hide orb
    if (scrollTop > window.innerHeight * 0.2) {
      scrollBtn.classList.remove('hidden');
    } else {
      scrollBtn.classList.add('hidden');
    }

    // Vision Pro arrow:
    // No rotation. No direction class.
    // Just fade the arrow slightly depending on scroll direction.
    if (scrollArrow) {
      if (scrollTop > lastScrollTop + 5) {
        // scrolling down → arrow slightly dim
        scrollArrow.style.opacity = "0.65";
      } else if (scrollTop < lastScrollTop - 5) {
        // scrolling up → arrow full brightness
        scrollArrow.style.opacity = "1";
      }
    }

    lastScrollTop = Math.max(scrollTop, 0);
  }

  window.addEventListener('scroll', updateScrollProgress);
  window.addEventListener('resize', updateScrollProgress);
  updateScrollProgress();

  scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Reset arrow brightness after scroll
    if (scrollArrow) {
      scrollArrow.style.opacity = "1";
    }
  });
})();

/* ============================= */
/*  Percentage fade-in & timeout */
/* ============================= */
(function() {
  const scrollPercent = document.getElementById('scrollPercent');
  let fadeTimeout;
  window.addEventListener('scroll', () => {
    if (!scrollPercent) return;
    scrollPercent.classList.add('visible');

    clearTimeout(fadeTimeout);
    fadeTimeout = setTimeout(() => {
      scrollPercent.classList.remove('visible');
    }, 1500);
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


document.addEventListener("DOMContentLoaded", async () => {
  const summaryEl = document.getElementById("system-health-summary");
  const incidentsEl = document.getElementById("system-health-incidents");
  if (!summaryEl) return;

  const proxyUrl = "https://api.allorigins.win/get?url=";
  const target = encodeURIComponent("https://calebs-status-page.instatus.com/summary.json");
  const apiUrl = `${proxyUrl}${target}`;

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("Network response failed: " + res.status);
    const raw = await res.json();
    const data = JSON.parse(raw.contents);

    const status = data.status.indicator || "unknown";
    const desc = data.status.description || "No status available";

    // Determine color
    let colorClass = "green";
    if (status === "major") colorClass = "red";
    else if (status === "minor" || status === "degraded") colorClass = "orange";

    summaryEl.innerHTML = `
      <p><strong>Current Status:</strong></p>
      <div class="status-pill ${colorClass}">${desc}</div>
    `;
    summaryEl.classList.remove("loading");

    // Render incidents
    if (data.incidents && data.incidents.length > 0) {
      incidentsEl.innerHTML = `<h3>Recent Incidents</h3>` +
        data.incidents
          .slice(0, 3)
          .map(i => `
            <div class="incident">
              <strong>${i.name || "Incident"}</strong>
              <p>${i.shortlink ? `<a href="${i.shortlink}" target="_blank">View Details</a>` : ""}</p>
              <small>${new Date(i.created_at).toLocaleString()}</small>
            </div>
          `)
          .join("");
      incidentsEl.classList.remove("hidden");
    } else {
      incidentsEl.innerHTML = `<p>✅ No active or recent incidents.</p>`;
      incidentsEl.classList.remove("hidden");
    }
  } catch (err) {
    console.error("❌ Failed to fetch system health:", err);
    summaryEl.innerHTML = `<p>⚠️ Could not load system health data.</p>`;
  }
});

// Elements
const chatbot = document.getElementById('ai-chatbot');
const closeBtn = document.getElementById('ai-chatbot-close');
const messagesContainer = document.getElementById('ai-chatbot-messages');
const inputField = document.getElementById('ai-chatbot-input');
const sendBtn = document.getElementById('ai-chatbot-send');

// Close chat
closeBtn.addEventListener('click', () => chatbot.style.display = 'none');

// Append message function
function appendMessage(sender, text) {
    const message = document.createElement('div');
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    message.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
    message.innerHTML = `<span>${text}</span><div style="font-size:10px; color:#555; text-align:right;">${time}</div>`;
    messagesContainer.appendChild(message);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Typing indicator
function showTypingIndicator() {
    const typing = document.createElement('div');
    typing.classList.add('ai-typing');
    typing.innerHTML = `<span></span><span></span><span></span>`;
    messagesContainer.appendChild(typing);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return typing;
}

// Send message function
async function sendMessage() {
    const text = inputField.value.trim();
    if (!text) return;
    appendMessage('user', text);
    inputField.value = '';

    const typing = showTypingIndicator();

    try {
        // Example AI API call
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({message: text})
        });
        const data = await response.json();

        typing.remove();
        appendMessage('ai', data.reply);
    } catch(err) {
        typing.remove();
        appendMessage('ai', '⚠️ Error connecting to AI.');
        console.error(err);
    }
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);
inputField.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });

// -----------------------------
// Robust Auto-Refresh + Countdown
// Paste into script.js (replace older snippet)
// -----------------------------
(function () {
  const DEBUG = true; // set false to silence console logs
  const defaultMinutes = 5; // fallback interval
  // Try to read from HTML data attribute on the countdown element: <span id="refresh-countdown" data-minutes="5">
  function log(...args) { if (DEBUG) console.log("[AutoRefresh]", ...args); }

  let refreshIntervalMinutes = defaultMinutes;
  let countdownEl = null;

  let remainingMs = 0;
  let countdownTimer = null;
  let refreshTimer = null;
  let running = false;

  function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function clearAllTimers() {
    if (countdownTimer) clearInterval(countdownTimer);
    if (refreshTimer) clearInterval(refreshTimer);
    countdownTimer = null;
    refreshTimer = null;
    running = false;
  }

  function updateCountdownDisplay() {
    if (!countdownEl) return;
    countdownEl.textContent = formatTime(remainingMs);
  }

  function tickCountdown() {
    remainingMs -= 1000;
    if (remainingMs < 0) remainingMs = 0;
    updateCountdownDisplay();
    if (remainingMs <= 0) {
      log("Timer reached zero, attempting reload (visible:", document.visibilityState === "visible", ")");
      // double-check visibility at the moment of reload
      if (document.visibilityState === "visible") {
        location.reload();
      } else {
        // If not visible, wait until visible
        log("Tab hidden at zero — waiting for visibility to reload.");
      }
    }
  }

  function startTimers() {
    if (running) {
      log("Auto-refresh already running — skipping start.");
      return;
    }

    remainingMs = refreshIntervalMinutes * 60 * 1000;
    updateCountdownDisplay();

    // Countdown tick every 1s (update display)
    countdownTimer = setInterval(tickCountdown, 1000);

    // Backup refresh: reload on interval boundary, but visibility-checked
    refreshTimer = setInterval(() => {
      if (document.visibilityState === "visible") {
        log("Interval elapsed and document visible → reload");
        location.reload();
      } else {
        log("Interval elapsed but tab not visible; skipping reload.");
      }
    }, refreshIntervalMinutes * 60 * 1000);

    running = true;
    log("Started auto-refresh:", refreshIntervalMinutes, "minutes");
  }

  function stopTimers() {
    clearAllTimers();
    log("Stopped auto-refresh timers.");
  }

  function initAutoRefresh() {
    // Find element
    countdownEl = document.getElementById("refresh-countdown");
    if (!countdownEl) {
      log("No element with id 'refresh-countdown' found. Add this HTML:\n<li id=\"refresh-timer-info\"><span class=\"version-label\">🔁 <strong>Auto-Refresh:</strong></span><span class=\"version-value\" id=\"refresh-countdown\">Starting...</span></li>");
      return;
    }

    // Read optional minutes from data-minutes attribute on the countdown element
    const attr = countdownEl.getAttribute("data-minutes");
    if (attr && !isNaN(Number(attr))) {
      refreshIntervalMinutes = Math.max(0.1, Number(attr));
    }

    // set initial display
    remainingMs = refreshIntervalMinutes * 60 * 1000;
    updateCountdownDisplay();

    // start when page loads and tab is visible
    if (document.visibilityState === "visible") startTimers();

    // Pause when tab hidden; resume when visible (avoid duplicate starts)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        log("visibilitychange → visible");
        startTimers();
        // if timer reached 0 while hidden, reload now
        if (remainingMs <= 0) {
          log("Reloading now because timer reached 0 while hidden.");
          location.reload();
        }
      } else {
        log("visibilitychange → hidden");
        stopTimers();
      }
    });

    // Defensive: stop timers when the page is unloaded
    window.addEventListener("beforeunload", () => clearAllTimers());
  }

  // Public debug helper (call from console)
  window.autoRefreshDebug = function () {
    return {
      running,
      refreshIntervalMinutes,
      remainingMs,
      elementFound: !!countdownEl,
      visibility: document.visibilityState,
    };
  };

  // Initialize once DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAutoRefresh);
  } else {
    initAutoRefresh();
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.querySelector(".section-jump-wrapper");
  const toggle = document.querySelector(".section-jump-toggle");
  const menu = document.querySelector(".section-jump-menu");
  const links = menu.querySelectorAll("a");

  // Toggle mobile menu
  toggle.addEventListener("click", () => wrapper.classList.toggle("active"));

  // Smooth scroll + close menu on mobile
  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const targetId = link.getAttribute("href").slice(1);
      const target = document.getElementById(targetId);
      if(target){
        const offset = 80;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
      }
      if(window.innerWidth < 1024) wrapper.classList.remove("active");
    });
  });

  // Close if clicking outside (mobile)
  document.addEventListener("click", e => {
    if(window.innerWidth < 1024 && !wrapper.contains(e.target)) wrapper.classList.remove("active");
  });

  // Close on resize
  window.addEventListener("resize", () => {
    if(window.innerWidth >= 1024) wrapper.classList.remove("active");
  });
});
