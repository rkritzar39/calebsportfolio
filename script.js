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

    // --- NEW: Highlight Active Navigation Link ---
    const highlightActiveNavLink = () => {
        // Get the current page's path (e.g., "/blog.html")
        const currentPath = window.location.pathname;
        
        // Normalize paths to treat "/" and "/index.html" as the same page
        const normalize = (path) => path.replace(/\/index\.html$/, '/');
        const normalizedCurrentPath = normalize(currentPath);

        // Select all links in your main navigation.
        // If your "tool bar" has a more specific ID, like '#main-nav', you can use
        // document.querySelectorAll('#main-nav a') for better performance.
        const navLinks = document.querySelectorAll('nav a');

        let foundActiveLink = false;

        navLinks.forEach(link => {
            // Remove any 'active' class from all links first
            link.classList.remove('active');
            
            let linkPath;
            try {
                // Use new URL() to reliably get the pathname from the link's href
                linkPath = new URL(link.href).pathname;
            } catch (e) {
                // Fallback for relative paths or invalid URLs
                linkPath = link.getAttribute('href');
            }
            
            const normalizedLinkPath = normalize(linkPath);

            // Check for an exact match
            if (normalizedLinkPath === normalizedCurrentPath) {
                link.classList.add('active');
                foundActiveLink = true;
            }
        });

        // --- Special Case for Child Pages (like a blog post) ---
        // If no exact match was found, we check if we're on a page that
        // should have a "parent" link highlighted.
        if (!foundActiveLink) {
            // Based on your displayShoutouts.js, you use 'post-content-area' for single posts.
            if (document.getElementById('post-content-area')) {
                // Find the link to the main blog page (assuming it contains "blog" in its href)
                const blogLink = document.querySelector('nav a[href*="blog"]');
                if (blogLink) {
                    blogLink.classList.add('active');
                }
            }
            
            // You can add more 'else if' blocks here for other child pages
            // else if (document.getElementById('some-other-child-page')) {
            //     const parentLink = document.querySelector('nav a[href*="parent"]');
            //     if (parentLink) parentLink.classList.add('active');
            // }
        }
    };

    // Run the new function to highlight the link
    highlightActiveNavLink();

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


document.addEventListener("DOMContentLoaded", async () => {
  const summaryEl = document.getElementById("system-health-summary");
  const incidentsEl = document.getElementById("system-health-incidents");
  if (!summaryEl) return;

  const proxyUrl = "https://api.allorigins.win/get?url=";
  const target = encodeURIComponent("https://calebs-status-page.instatus.com/summary.json");
  const apiUrl = `${proxyUrl}${target}`;

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("Network response failed: "_ + res.status);
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
