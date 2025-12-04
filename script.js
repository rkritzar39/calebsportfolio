// --- HTTPS Redirect ---
if (window.location.protocol !== "https:" && window.location.hostname !== "localhost" && !window.location.hostname.startsWith("127.")) {
    console.log("Redirecting to HTTPS...");
    window.location.href = "https://" + window.location.host + window.location.pathname + window.location.search;
}

// --- Page Load Animation ---
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
            document.addEventListener('contextmenu', e => e.preventDefault());

            document.addEventListener('selectstart', e => {
                const target = e.target;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
                    e.preventDefault();
                }
            });

            document.addEventListener('copy', e => {
                const target = e.target;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
                    e.preventDefault();
                }
            });

            document.addEventListener('dragstart', e => {
                if (e.target.closest('a, .social-button, .link-button, .settings-button, .merch-button, .weather-button, .disabilities-section a, .visit-profile')) {
                    e.preventDefault();
                }
            });

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

        const dateTimeSectionElement = document.querySelector('.datetime-section .current-datetime');
        if (dateTimeSectionElement) {
            dateTimeSectionElement.textContent = formattedDateTime;
        }

        const versionTimeElement = document.querySelector('.version-info-section .update-time .version-value');
        if (versionTimeElement) {
            versionTimeElement.textContent = formattedDateTime;
        }
    }
    updateTime();
    setInterval(updateTime, 1000);

    // --- Back to Top & Scroll Progress ---
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
            if (scrollPercent) scrollPercent.textContent = `${percent}%`;

            if (scrollTop > window.innerHeight * 0.2) {
                scrollBtn.classList.remove('hidden');
            } else {
                scrollBtn.classList.add('hidden');
            }

            if (scrollArrow) {
                if (scrollTop > lastScrollTop + 5) scrollArrow.style.opacity = "0.65";
                else if (scrollTop < lastScrollTop - 5) scrollArrow.style.opacity = "1";
            }

            lastScrollTop = Math.max(scrollTop, 0);
        }

        window.addEventListener('scroll', updateScrollProgress);
        window.addEventListener('resize', updateScrollProgress);
        updateScrollProgress();

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (scrollArrow) scrollArrow.style.opacity = "1";
        });
    })();

    // --- Percentage fade-in & timeout ---
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
        if (yearElement) yearElement.textContent = new Date().getFullYear();
    }
    updateFooterYear();

}); // END OF DOMContentLoaded

// --- Section Jump Menu ---
document.addEventListener("DOMContentLoaded", () => {
    const wrapper = document.querySelector(".section-jump-wrapper");
    const toggle = document.querySelector(".section-jump-toggle");
    const menu = document.querySelector(".section-jump-menu");
    const links = menu.querySelectorAll("a");

    toggle.addEventListener("click", () => wrapper.classList.toggle("active"));

    links.forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            const targetId = link.getAttribute("href").replace("#", "");
            const target = document.getElementById(targetId);

            if (target) {
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: "smooth" });
            }

            if (window.innerWidth < 1024) wrapper.classList.remove("active");
        });
    });

    const sections = Array.from(links).map(link => document.getElementById(link.getAttribute("href").replace("#","")));
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const link = menu.querySelector(`a[href="#${entry.target.id}"]`);
            if (entry.isIntersecting) {
                links.forEach(l => l.classList.remove("active"));
                if (link) link.classList.add("active");
            }
        });
    }, { threshold: 0.4 });

    sections.forEach(section => { if(section) observer.observe(section); });

    document.addEventListener("click", e => {
        if(window.innerWidth < 1024 && !wrapper.contains(e.target)) wrapper.classList.remove("active");
    });

    window.addEventListener("resize", () => { if(window.innerWidth >= 1024) wrapper.classList.remove("active"); });
});

// --- System Health Fetch ---
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

        let colorClass = "green";
        if (status === "major") colorClass = "red";
        else if (status === "minor" || status === "degraded") colorClass = "orange";

        summaryEl.innerHTML = `
            <p><strong>Current Status:</strong></p>
            <div class="status-pill ${colorClass}">${desc}</div>
        `;
        summaryEl.classList.remove("loading");

        if (data.incidents && data.incidents.length > 0) {
            incidentsEl.innerHTML = `<h3>Recent Incidents</h3>` +
                data.incidents.slice(0, 3).map(i => `
                    <div class="incident">
                        <strong>${i.name || "Incident"}</strong>
                        <p>${i.shortlink ? `<a href="${i.shortlink}" target="_blank">View Details</a>` : ""}</p>
                        <small>${new Date(i.created_at).toLocaleString()}</small>
                    </div>
                `).join("");
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

// --- AI Chatbot ---
const chatbot = document.getElementById('ai-chatbot');
const closeBtn = document.getElementById('ai-chatbot-close');
const messagesContainer = document.getElementById('ai-chatbot-messages');
const inputField = document.getElementById('ai-chatbot-input');
const sendBtn = document.getElementById('ai-chatbot-send');

closeBtn.addEventListener('click', () => chatbot.style.display = 'none');

function appendMessage(sender, text) {
    const message = document.createElement('div');
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    message.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
    message.innerHTML = `<span>${text}</span><div style="font-size:10px; color:#555; text-align:right;">${time}</div>`;
    messagesContainer.appendChild(message);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const typing = document.createElement('div');
    typing.classList.add('ai-typing');
    typing.innerHTML = `<span></span><span></span><span></span>`;
    messagesContainer.appendChild(typing);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return typing;
}

async function sendMessage() {
    const text = inputField.value.trim();
    if (!text) return;
    appendMessage('user', text);
    inputField.value = '';

    const typing = showTypingIndicator();

    try {
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

sendBtn.addEventListener('click', sendMessage);
inputField.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });
