// displayShoutouts.js

// Use the same Firebase config as in admin.js (Ensure this is correct)
const firebaseConfig = {
    apiKey: "AIzaSyCIZ0fri5V1E2si1xXpBPQQJqj1F_KuuG0", // Use your actual API key
    authDomain: "busarmydudewebsite.firebaseapp.com",
    projectId: "busarmydudewebsite",
    storageBucket: "busarmydudewebsite.firebasestorage.app",
    messagingSenderId: "42980404680",
    appId: "1:42980404680:web:f4f1e54789902a4295e4fd",
    measurementId: "G-DQPH8YL789" // Optional
};

// Import necessary Firebase functions (v9+ modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { 
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  onSnapshot,        // 👈 add this
  Timestamp,
  orderBy,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
let unsubscribeLiveStatus = null;

function watchLiveStatus() {
  if (!db) {
    console.warn("Firestore not ready yet, retrying...");
    setTimeout(watchLiveStatus, 500);
    return;
  }

  const el = document.getElementById("live-activity-text");
  const container = document.getElementById("live-activity");

  if (!el || !container) {
    console.warn("Live activity elements not found.");
    return;
  }

  const liveStatusRef = doc(db, "live_status", "current");

  if (unsubscribeLiveStatus) {
    unsubscribeLiveStatus();
    unsubscribeLiveStatus = null;
  }

  unsubscribeLiveStatus = onSnapshot(
    liveStatusRef,
    (snap) => {
      if (!snap.exists()) {
        el.textContent = "🛌 Offline";
        container.classList.remove("active");
        container.classList.add("hidden");
        return;
      }

      const data = snap.data() || {};
      const message = (data.message || "").trim();
      const isActive = data.isActive === true || message.length > 0;

      if (isActive) {
        el.textContent = message || "🟢 Active";
        container.classList.remove("hidden");
        container.classList.add("active");
      } else {
        el.textContent = "🛌 Offline";
        container.classList.remove("active");
        container.classList.add("hidden");
      }
    },
    (error) => {
      console.error("Live status listener error:", error);
      el.textContent = "🛌 Offline";
      container.classList.remove("active");
      container.classList.add("hidden");
    }
  );
}

document.addEventListener("DOMContentLoaded", watchLiveStatus);

async function loadAndDisplayLegislation() {
    const legislationList = document.getElementById('legislation-list');
    if (!legislationList) return;

    legislationList.innerHTML = '<p>Loading active legislation...</p>';
    const legislationCollectionRef = collection(db, "legislation");

    try {
        const q = query(legislationCollectionRef, orderBy("order", "asc"));
        const querySnapshot = await getDocs(q);

        legislationList.innerHTML = '';
        if (querySnapshot.empty) {
            legislationList.innerHTML = '<p>No bills are currently being tracked.</p>';
        } else {
            querySnapshot.forEach(doc => {
                const item = doc.data();
                const itemDiv = document.createElement('div');
                itemDiv.className = 'legislation-item';

                const status = item.status || {};
                const steps = [
                    { key: 'introduced', label: 'Introduced', completed: status.introduced },
                    { key: 'passedHouse', label: 'Passed House', completed: status.passedHouse },
                    { key: 'passedSenate', label: 'Passed Senate', completed: status.passedSenate },
                    { key: 'toPresident', label: 'To President', completed: status.toPresident },
                    { key: 'becameLaw', label: 'Became Law', completed: status.becameLaw },
                ];
                
                // Find the index of the current (most recent) step
                const currentIndex = steps.map(s => s.completed).lastIndexOf(true);
                
                // Generate the HTML for the vertical steps
                let stepsHtml = '';
                steps.forEach((step, index) => {
                    let stepClass = '';
                    if (step.completed) {
                        stepClass = 'completed';
                    }
                    // The last completed step is the "current" one
                    if (index === currentIndex) {
                        stepClass += ' current';
                    }
                    
                    stepsHtml += `
                        <li class="progress-step-vertical ${stepClass}">
                            <div class="step-dot"></div>
                            <div class="step-details">
                                <span class="step-label">${step.label}</span>
                            </div>
                        </li>
                    `;
                });

                // This is the new two-column HTML structure
                itemDiv.innerHTML = `
                    <div class="bill-info">
                        <div class="bill-header">
                            <span class="bill-id">${item.billId || 'N/A'}</span>
                            <h4>${item.title || 'No Title'}</h4>
                        </div>
                        <div class="bill-details">
                            <p><strong>Sponsor:</strong> ${item.sponsor || 'N/A'}<br>
                               <strong>Introduced:</strong> ${item.date || 'N/A'}
                            </p>
                        </div>
                        <p class="bill-summary">${item.description || 'A summary is in progress.'}</p>
                        ${item.url ? `<div class="bill-actions"><a href="${item.url}" class="button-primary small-button" target="_blank" rel="noopener noreferrer">Read Full Text</a></div>` : ''}
                    </div>
                    <div class="bill-progress">
                        <ol class="progress-tracker-vertical">
                            ${stepsHtml}
                        </ol>
                    </div>
                `;
                legislationList.appendChild(itemDiv);
            });
        }
    } catch (error) {
        console.error("Error loading legislation for display:", error);
        legislationList.innerHTML = '<p class="error">Could not load legislation data.</p>';
    }
}

// --- Initialize Firebase ---
let db;
let firebaseAppInitialized = false;
// Declare references in module scope
let profileDocRef; 
let presidentDocRef;
let usefulLinksCollectionRef;
let socialLinksCollectionRef;
let disabilitiesCollectionRef;
let techItemsCollectionRef;
let shoutoutsMetaRef; 
let faqsCollectionRef;
let businessDocRef; 
let postsCollectionRef; // 🔥 declare this too

// --- NEW: Module-level variables to store all creator data for searching ---
let allTikTokCreators = [], allInstagramCreators = [], allYouTubeCreators = [];


try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    // Assign references
    profileDocRef = doc(db, "site_config", "mainProfile"); 
    businessDocRef = doc(db, "site_config", "businessDetails"); 
    presidentDocRef = doc(db, "site_config", "currentPresident");
    usefulLinksCollectionRef = collection(db, "useful_links");
    socialLinksCollectionRef = collection(db, "social_links");
    disabilitiesCollectionRef = collection(db, "disabilities");
    techItemsCollectionRef = collection(db, "tech_items");
    shoutoutsMetaRef = doc(db, 'siteConfig', 'shoutoutsMetadata');
    faqsCollectionRef = collection(db, "faqs");
    postsCollectionRef = collection(db, "posts");
    firebaseAppInitialized = true;
    console.log("Firebase initialized for display.");
} catch (error) {
    console.error("Firebase initialization failed:", error);
    const body = document.body;
    if (body) {
        body.innerHTML = '<p class="error" style="text-align: center; padding: 50px; color: red; font-size: 1.2em;">Could not connect to required services. Please try again later.</p>';
    }
    firebaseAppInitialized = false;
}

/* ==========================================================
   🔔 FIREBASE CLOUD MESSAGING — PUSH NOTIFICATION SETUP
   ========================================================== */
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging.js";

async function initializePushNotifications() {
  try {
    if (!("Notification" in window)) {
      console.warn("Browser does not support notifications.");
      return;
    }

    // Ask user for permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied by user.");
      return;
    }

    const messaging = getMessaging();
    const vapidKey = "BKqy5iyBspHj5HoS-bLlMWvIc8F-639K8HWjV3iiqtdnnDDBDUti78CL9RTCiBml16qMRjJ4RqMo9DERbt4C9xc"; // 🔑 Replace with your real VAPID key

    // Register your service worker (must be at root)
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("✅ Service Worker registered for push notifications:", registration);

    // Get an FCM token for this device
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration
    });
    console.log("🔑 FCM Token:", token);

    // Optionally save token to Firestore to identify this user later
    // const tokenRef = doc(db, "user_tokens", token);
    // await setDoc(tokenRef, { token, timestamp: Date.now() });

    // Listen for foreground notifications (while site is open)
    onMessage(messaging, (payload) => {
      console.log("📩 Push message received in foreground:", payload);
      const { title, body, icon } = payload.notification || {};
      showSmartToast(title || "Notification", body || "You have a new update!");
    });

  } catch (err) {
    console.error("❌ Push notification setup failed:", err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (firebaseAppInitialized && db) {
    setupSmartRealtimeNotifications();
  }
});

/* ==========================================================
   🔔 SMART FIRESTORE NOTIFICATION SYSTEM (ALL SECTIONS)
   ========================================================== */

// --- Cache system to prevent duplicates ---
const notifiedDocs = new Set(JSON.parse(sessionStorage.getItem('notifiedDocs') || "[]"));

function rememberDoc(id) {
  notifiedDocs.add(id);
  sessionStorage.setItem('notifiedDocs', JSON.stringify([...notifiedDocs]));
}

function hasNotified(id) {
  return notifiedDocs.has(id);
}

// --- Load user notification preferences ---
function getNotifPrefs() {
  const settings = JSON.parse(localStorage.getItem('websiteSettings') || '{}');
  return settings.notifications || { enabled: false, categories: {} };
}

// --- Toast Helper (uses in-site system) ---
function showSmartToast(title, message) {
  const container = document.getElementById('toast-container') || (() => {
    const c = document.createElement('div');
    c.id = 'toast-container';
    Object.assign(c.style, {
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: '9999'
    });
    document.body.appendChild(c);
    return c;
  })();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.cssText = `
    background: var(--accent-color, #007aff);
    color: #fff;
    border-radius: 12px;
    padding: 14px 18px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    backdrop-filter: blur(16px);
    font-size: 15px;
    animation: fadeInCard 0.4s ease forwards;
  `;
  toast.innerHTML = `<strong>${title}</strong><br><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 4000);
}

// --- Initialize smart realtime notifications ---
function setupSmartRealtimeNotifications() {
  const prefs = getNotifPrefs();
  if (!prefs.enabled) return;

  // --- Utility ---
  function setupCollectionListener(ref, sectionName, formatMessage) {
    let firstLoad = false;
    onSnapshot(ref, (snapshot) => {
      if (!firstLoad) {
        snapshot.docs.forEach(doc => rememberDoc(doc.id));
        firstLoad = true;
        return;
      }
      snapshot.docChanges().forEach(change => {
        const id = change.doc.id;
        if (hasNotified(id)) return;
        const data = change.doc.data();
        const { title, message } = formatMessage(change.type, data);
        if (title && message) {
          showSmartToast(title, message);
          rememberDoc(id);
        }
      });
    });
  }

  // === Creators ===
  setupCollectionListener(collection(db, "shoutouts"), "Creators", (action, d) => {
    const platform = d.platform || "Unknown";
    const name = d.nickname || d.username || "Unnamed Creator";
    const verb = action === "added" ? "joined" :
                 action === "modified" ? "was updated" : "was removed";
    return { title: `Creator ${action}`, message: `${name} ${verb} on ${platform}.` };
  });

  // === Social Links ===
  setupCollectionListener(collection(db, "social_links"), "Social", (action, d) => ({
    title: action === "added" ? "New Social Link" : action === "modified" ? "Social Link Updated" : "Social Link Removed",
    message: `${d.label || "Link"} ${action === "removed" ? "was removed" : "has been " + (action === "added" ? "added" : "updated")}.`
  }));

  // === Useful Links ===
  setupCollectionListener(collection(db, "useful_links"), "Links", (action, d) => ({
    title: action === "added" ? "Useful Link Added" : action === "modified" ? "Useful Link Updated" : "Useful Link Removed",
    message: `${d.label || "Link"} ${action === "removed" ? "was removed" : "has been " + (action === "added" ? "added" : "updated")}.`
  }));

  // === Tech Items ===
  setupCollectionListener(collection(db, "tech_items"), "Tech", (action, d) => ({
    title: action === "added" ? "New Tech Item" : action === "modified" ? "Tech Item Updated" : "Tech Item Removed",
    message: `${d.name || "Device"} ${action === "added" ? "added" : action === "modified" ? "updated" : "removed"}.`
  }));

  // === FAQs ===
  setupCollectionListener(collection(db, "faqs"), "FAQs", (action, d) => ({
    title: action === "added" ? "New FAQ" : action === "modified" ? "FAQ Updated" : "FAQ Removed",
    message: `${d.question || "Question"} ${action === "removed" ? "was removed" : "has been " + (action === "added" ? "added" : "updated")}.`
  }));

  // === Posts ===
  setupCollectionListener(collection(db, "posts"), "Posts", (action, d) => ({
    title: action === "added" ? "New Post" : action === "modified" ? "Post Updated" : "Post Removed",
    message: `${d.title || "A post"} ${action === "removed" ? "was removed" : "has been " + (action === "added" ? "added" : "updated")}.`
  }));

  // === Legislation ===
  setupCollectionListener(collection(db, "legislation"), "Legislation", (action, d) => ({
    title: action === "added" ? "New Bill" : action === "modified" ? "Bill Updated" : "Bill Removed",
    message: `${d.title || d.billId || "A bill"} ${action === "removed" ? "was removed" : "has been " + (action === "added" ? "added" : "updated")}.`
  }));

  // === Business Info ===
  const bizRef = doc(db, "site_config", "businessDetails");
  let firstBiz = false;
  onSnapshot(bizRef, (snap) => {
    if (!firstBiz) { firstBiz = true; rememberDoc("bizInfo"); return; }
    showSmartToast("Business Info Updated", "Business hours or contact details changed.");
    rememberDoc("bizInfo");
  });

  // === Main Profile ===
  const mainRef = doc(db, "site_config", "mainProfile");
  let firstMain = false;
  onSnapshot(mainRef, (snap) => {
    if (!firstMain) { firstMain = true; rememberDoc("mainProfile"); return; }
    showSmartToast("Profile Updated", "Site profile or settings were modified.");
    rememberDoc("mainProfile");
  });

  // === President Info ===
  const presRef = doc(db, "site_config", "currentPresident");
  let firstPres = false;
  onSnapshot(presRef, (snap) => {
    if (!firstPres) { firstPres = true; rememberDoc("presInfo"); return; }
    showSmartToast("President Info Updated", "President data has changed.");
    rememberDoc("presInfo");
  });

  console.log("✅ Smart Firestore notifications initialized (all collections).");
}

document.addEventListener('DOMContentLoaded', () => {
  if (firebaseAppInitialized && db) {
    setupSmartRealtimeNotifications();
  }
});
// --- !! MOVED HERE FOR GLOBAL SCOPE !! ---
const assumedBusinessTimezone = 'America/New_York'; // Your business's primary IANA timezone

// --- Helper Functions ---
function formatFirestoreTimestamp(firestoreTimestamp) {
    if (!firestoreTimestamp || !(firestoreTimestamp instanceof Timestamp)) { return 'N/A'; }
    try {
        const date = firestoreTimestamp.toDate();
        // Use the browser's locale and timezone
        const locale = navigator.language || 'en-US';
        // Get the weekday, month, day, year
        const formattedDate = date.toLocaleDateString(locale, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        // Get the time with AM/PM and time zone abbreviation
        // The timeZoneName: 'short' will give you "EDT", "PDT", etc.
        const formattedTime = date.toLocaleTimeString(locale, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'long'
        });
        // Combine for final display
        return `${formattedDate} at ${formattedTime}`;
    } catch (error) {
        console.error("Error formatting timestamp:", error);
        return 'Invalid Date';
    }
}

function formatRelativeTime(createdAt, updatedAt) {
    if (!createdAt) return "Posted (unknown time)";
    const createdDate = createdAt.toDate();
    const now = new Date();
    const diffMs = now - createdDate;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let result = "";
    if (diffMinutes < 60) {
        result = `Posted ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        result = `Posted ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
        result = `Posted ${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
        result = `Posted on ${createdDate.toLocaleDateString()}`;
    }

        if (updatedAt && updatedAt.toDate() > createdDate) {
        const updatedDate = updatedAt.toDate();
        result += ` (Edited on ${updatedDate.toLocaleDateString()} at ${updatedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    }

    return result;
}

/* ============================================================
   CREATOR SHOUTOUT RENDER FUNCTIONS
   TikTok / Instagram / YouTube
   Top-profile-only layouts
============================================================ */

/* ------------------------------------------------------------
   Helper Functions
------------------------------------------------------------ */

function formatShoutoutNumber(value) {
    const num = Number(value);

    if (value === null || value === undefined || value === '') {
        return "0";
    }

    if (isNaN(num)) {
        return String(value);
    }

    if (num >= 1000000) {
        return (num / 1000000)
            .toFixed(num >= 10000000 ? 0 : 1)
            .replace(".0", "") + "M";
    }

    if (num >= 1000) {
        return (num / 1000)
            .toFixed(num >= 10000 ? 0 : 1)
            .replace(".0", "") + "K";
    }

    return num.toLocaleString();
}

function normalizeShoutoutHandle(username) {
    if (!username || username === "N/A") {
        return "";
    }

    return String(username).replace("@", "").trim();
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
    return escapeHTML(value).replaceAll("`", "&#096;");
}

function getShoutoutProfilePic(account) {
    return account.profilePic ||
        account.profileImage ||
        account.avatarUrl ||
        account.imageUrl ||
        "images/default-profile.jpg";
}

function renderShoutoutImage(src, className, altText, fallback = "images/default-profile.jpg") {
    const safeSrc = escapeAttribute(src || fallback);
    const safeClass = escapeAttribute(className || "");
    const safeAlt = escapeAttribute(altText || "Profile image");
    const safeFallback = escapeAttribute(fallback);

    return `<img src="${safeSrc}" alt="${safeAlt}" class="${safeClass}" onerror="this.onerror=null; this.src='${safeFallback}';">`;
}

function renderShoutoutCover(src, className, altText, fallback = "images/default-cover.jpg") {
    const safeSrc = escapeAttribute(src || fallback);
    const safeClass = escapeAttribute(className || "");
    const safeAlt = escapeAttribute(altText || "Cover image");
    const safeFallback = escapeAttribute(fallback);

    return `<img src="${safeSrc}" alt="${safeAlt}" class="${safeClass}" onerror="this.onerror=null; this.src='${safeFallback}';">`;
}

function getPlatformProfileUrl(platform, username) {
    const cleanUsername = normalizeShoutoutHandle(username);

    if (!cleanUsername) {
        return "#";
    }

    if (platform === "tiktok") {
        return `https://tiktok.com/@${encodeURIComponent(cleanUsername)}`;
    }

    if (platform === "instagram") {
        return `https://instagram.com/${encodeURIComponent(cleanUsername)}`;
    }

    if (platform === "youtube") {
        return `https://www.youtube.com/@${encodeURIComponent(cleanUsername)}`;
    }

    return "#";
}

/* ------------------------------------------------------------
   TikTok Card
------------------------------------------------------------ */

function renderTikTokCard(account) {
    const profilePic = getShoutoutProfilePic(account);

    const usernameRaw = normalizeShoutoutHandle(account.username);
    const username = usernameRaw || "N/A";

    const nickname = account.nickname ||
        account.displayName ||
        account.name ||
        "TikTok Creator";

    const bio = account.bio || "";
    const subtitle = account.subtitle || account.extraLine || "";

    const following = formatShoutoutNumber(account.following || 0);
    const followers = formatShoutoutNumber(account.followers || account.followerCount || 0);
    const likes = formatShoutoutNumber(account.likes || account.likeCount || 0);

    const isVerified = account.isVerified || account.verified || false;

    const verifiedBadge = isVerified
        ? '<img src="check.png" alt="Verified" class="verified-badge">'
        : '';

    const profileUrl = getPlatformProfileUrl("tiktok", username);

    return `
    <article class="tiktok-profile-card platform-profile-only">
        <div class="tiktok-profile-main">
            ${renderShoutoutImage(profilePic, "tiktok-avatar", nickname)}

            <h3>${escapeHTML(nickname)}</h3>

            <p class="tiktok-username">
                @${escapeHTML(username)} ${verifiedBadge}
            </p>

            <div class="tiktok-stats">
                <div class="tiktok-stat">
                    <strong>${escapeHTML(following)}</strong>
                    <span>Following</span>
                </div>

                <div class="tiktok-stat">
                    <strong>${escapeHTML(followers)}</strong>
                    <span>Followers</span>
                </div>

                <div class="tiktok-stat">
                    <strong>${escapeHTML(likes)}</strong>
                    <span>Likes</span>
                </div>
            </div>

            <div class="single-visit-button-row center-button">
                <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" class="platform-visit-button tiktok-visit-button">
                    <i class="fab fa-tiktok"></i>
                    Visit Profile
                </a>
            </div>

            ${bio ? `<p class="tiktok-bio">${escapeHTML(bio).replace(/\n/g, "<br>")}</p>` : ""}
            ${subtitle ? `<p class="tiktok-subtitle">${escapeHTML(subtitle)}</p>` : ""}
        </div>
    </article>`;
}

/* ------------------------------------------------------------
   Instagram Card
   Screenshot-style layout:
   Avatar left, username/checkmark top right,
   nickname below username, stats below nickname.
------------------------------------------------------------ */

function renderInstagramCard(account) {
    const profilePic = getShoutoutProfilePic(account);

    const usernameRaw = normalizeShoutoutHandle(account.username);
    const username = usernameRaw || "creator";

    const nickname = account.nickname ||
        account.displayName ||
        account.name ||
        "Instagram Creator";

    const bio = account.bio || account.description || "";
    const website = account.website || account.link || "";

    const category = account.category || account.creatorType || "";
    const pronouns = account.pronouns || "";
    const secondaryHandle = account.secondaryHandle || account.altUsername || "";

    const posts = formatShoutoutNumber(account.posts || account.postCount || 0);
    const followers = formatShoutoutNumber(account.followers || account.followerCount || 0);
    const following = formatShoutoutNumber(account.following || account.followingCount || 0);

    const isVerified = account.isVerified || account.verified || false;

    const verifiedBadge = isVerified
        ? '<img src="instagramcheck.png" alt="Verified" class="instagram-verified-badge">'
        : '';

    const profileUrl = getPlatformProfileUrl("instagram", username);

    return `
    <article class="instagram-profile-card platform-profile-only">
        <div class="instagram-profile-row instagram-profile-row-full">
            ${renderShoutoutImage(profilePic, "instagram-avatar", nickname)}

            <div class="instagram-profile-main">
                <div class="instagram-username-row">
                    <h3>
                        ${escapeHTML(username)}
                        ${verifiedBadge}
                    </h3>
                </div>

                <p class="instagram-name-line">
                    <strong>${escapeHTML(nickname)}</strong>
                    ${pronouns ? `<span>${escapeHTML(pronouns)}</span>` : ""}
                </p>

                <div class="instagram-stats">
                    <div>
                        <strong>${escapeHTML(posts)}</strong>
                        <span>posts</span>
                    </div>

                    <div>
                        <strong>${escapeHTML(followers)}</strong>
                        <span>followers</span>
                    </div>

                    <div>
                        <strong>${escapeHTML(following)}</strong>
                        <span>following</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="instagram-bio-block">
            ${category ? `<p class="instagram-category">${escapeHTML(category)}</p>` : ""}

            ${bio ? `<p>${escapeHTML(bio).replace(/\n/g, "<br>")}</p>` : ""}

            ${website ? `
            <a href="${escapeAttribute(website)}" target="_blank" rel="noopener noreferrer" class="instagram-website">
                <i class="fas fa-link"></i>
                ${escapeHTML(website.replace(/^https?:\/\//, ""))}
            </a>` : ""}

            ${secondaryHandle ? `
            <p class="instagram-secondary-handle">
                <i class="fab fa-instagram"></i>
                @${escapeHTML(normalizeShoutoutHandle(secondaryHandle))}
            </p>` : ""}
        </div>

        <div class="single-visit-button-row instagram-real-button-row">
            <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" class="platform-visit-button instagram-visit-button">
                <i class="fab fa-instagram"></i>
                Visit Profile
            </a>
        </div>
    </article>`;
}

/* ------------------------------------------------------------
   YouTube Card
   Full bio/description shown. No "...more".
------------------------------------------------------------ */

function renderYouTubeCard(account) {
    const profilePic = getShoutoutProfilePic(account);

    const usernameFromDb = account.username || "";
    const usernameRaw = normalizeShoutoutHandle(usernameFromDb);

    const nickname = account.nickname ||
        account.displayName ||
        account.channelName ||
        account.name ||
        "YouTube Creator";

    const bio = account.bio || account.description || "";

    const subscribers = formatShoutoutNumber(account.subscribers || account.followerCount || account.followers || 0);
    const videos = formatShoutoutNumber(account.videos || account.videoCount || 0);

    const coverPhoto = account.coverPhoto ||
        account.bannerImage ||
        account.coverImage ||
        null;

    const isVerified = account.isVerified || account.verified || false;

    const displayHandle = usernameRaw ? `@${usernameRaw}` : "";
    const channelUrl = usernameRaw ? `https://www.youtube.com/@${encodeURIComponent(usernameRaw)}` : "#";

    const verifiedBadge = isVerified
        ? '<img src="youtubecheck.png" alt="Verified" class="youtube-verified-badge">'
        : '';

    return `
    <article class="youtube-channel-card platform-profile-only">
        ${coverPhoto ? `
        <div class="youtube-channel-banner">
            ${renderShoutoutCover(coverPhoto, "youtube-cover-img", `${nickname} cover photo`)}
        </div>` : ""}

        <div class="youtube-channel-info">
            ${renderShoutoutImage(profilePic, "youtube-channel-avatar", nickname)}

            <div class="youtube-channel-text">
                <h3>
                    ${escapeHTML(nickname)}
                    ${verifiedBadge}
                </h3>

                ${displayHandle ? `<p class="youtube-handle">${escapeHTML(displayHandle)}</p>` : ""}

                <p class="youtube-stats">
                    ${escapeHTML(subscribers)} subscribers
                    ${videos && videos !== "0" ? ` · ${escapeHTML(videos)} videos` : ""}
                </p>
            </div>
        </div>

        ${bio ? `
        <p class="youtube-channel-description">
            ${escapeHTML(bio).replace(/\n/g, "<br>")}
        </p>` : ""}

        <div class="single-visit-button-row">
            <a href="${channelUrl}" target="_blank" rel="noopener noreferrer" class="platform-visit-button youtube-visit-button">
                <i class="fab fa-youtube"></i>
                Visit Channel
            </a>
        </div>
    </article>`;
}

const tiktokContainer = document.getElementById("latest-tiktok-section");
const ref = doc(db, "admin", "globalSettings");

onSnapshot(ref, snap => {
  const data = snap.data();
  const url = data.latestTikTok;
  if (!url) {
    tiktokContainer.innerHTML = "";
    return;
  }

  tiktokContainer.innerHTML = `
    <blockquote class="tiktok-embed" cite="${url}" data-video-id="${extractID(url)}">
      <section></section>
    </blockquote>
    <script async src="https://www.tiktok.com/embed.js"></script>
  `;
});

function extractID(url) {
  const match = url.match(/video\/(\d+)/);
  return match ? match[1] : "";
}

/* ------------------------------------------------------------
   LATEST OS CONFIG
   Fallback values are used if JSON fetch fails.
------------------------------------------------------------ */
let latestOSVersions = {
    // Apple
    ios: "26.5.1",
    ipados: "26.5",
    macos: "26.5.1",
    watchos: "26.5",
    tvos: "26.5",
    visionos: "26.5",

    // Android / Google / Samsung
    android: "16",
    pixelui: "16",
    oneui: "8.5",

    // Other Android skins
    oxygenos: "16",
    coloros: "16",
    realmeui: "7",
    miui: "14",
    hyperos: "3",
    magicos: "10",
    emui: "15",
    harmonyos: "5",
    funtouchos: "16",
    originos: "6",
    nothingos: "4",
    motorolahello: "16",
    zenui: "12",
    rogui: "12",
    xos: "15",
    hios: "15",
    flymeos: "11",

    // Windows
    windows: "11",
    windowsphone: "10",
    windowsserver: "2025",

    // Linux / Desktop
    linux: "rolling",
    ubuntu: "26.04",
    debian: "13",
    fedora: "42",
    arch: "rolling",
    manjaro: "rolling",
    linuxmint: "22",
    popos: "24.04",
    elementaryos: "8",
    zorinos: "17",
    opensuse: "15.6",
    kali: "2026.1",
    tails: "6",
    redhat: "10",
    rocky: "10",
    almalinux: "10",

    // Chrome / Google desktop
    chromeos: "latest",
    chromiumos: "latest",

    // BSD / Unix-like
    freebsd: "14",
    openbsd: "7",
    netbsd: "10",

    // Gaming
    steamos: "3",
    playstation: "5",
    xbox: "series",
    nintendoswitch: "18",

    // TV / Smart home
    fireos: "8",
    rokuos: "13",
    webos: "24",
    tizen: "8",
    androidtv: "16",
    googletv: "16",

    // Watches / wearables
    wearos: "6",
    garminos: "latest",
    fitbitos: "latest",
    zeppos: "4",

    // Other
    kindleos: "latest",
    metaquest: "latest",
    unknown: "Unknown"
};

const LATEST_OS_ENDPOINT = "/latest-os-versions.json";

/* ------------------------------------------------------------
   INIT
------------------------------------------------------------ */
function renderFaqItemHomepage(faqData) {
    const question = faqData.question || "No Question Provided";
    const answerHtml = faqData.answer
        ? (faqData.answer.includes("<") ? faqData.answer : `<p>${faqData.answer}</p>`)
        : "<p>No Answer Provided.</p>";

    return `
        <div class="faq-item">
            <button class="faq-question">
                ${question}
                <span class="faq-icon">+</span>
            </button>
            <div class="faq-answer">
                ${answerHtml}
            </div>
        </div>
    `;
}
    
const DISCORD_USER_ID = "850815059093356594";

// ============================
// DISCORD STATUS FETCH
// ============================
async function fetchDiscordStatus() {
    try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
        const json = await res.json();

        return json?.data?.discord_status || null;

    } catch (err) {
        console.warn("Lanyard API failed:", err);
        return null;
    }
}

// ============================
// MAIN PROFILE FUNCTION
// ============================
async function displayProfileData(profileData) {

    const profileUsernameElement = document.getElementById('profile-username-main');
    const profilePicElement = document.getElementById('profile-pic-main');
    const profileBioElement = document.getElementById('profile-bio-main');
    const profileStatusContainerElement = document.getElementById('profile-status-main-container');
    const profileStatusTextElement = document.getElementById('profile-status-text-main');

    if (!profileUsernameElement || !profilePicElement || !profileBioElement) {
        console.warn("Core profile elements missing.");
        return;
    }

    // ============================
    // DEBUG (KEEP THIS WHILE TESTING)
    // ============================
    console.log("PROFILE DATA RECEIVED:", profileData);

    // ============================
    // DEFAULT VALUES
    // ============================
    const defaultUsername = "Username";
    const defaultBio = "";
    const defaultProfilePic = "images/default-profile.jpg";

    // ============================
    // FALLBACK (NO DATA)
    // ============================
    if (!profileData) {
        profileUsernameElement.textContent = defaultUsername;
        profilePicElement.src = defaultProfilePic;
        profileBioElement.textContent = defaultBio;

        applyStatus("offline");
        return;
    }

    // ============================
    // SAFE PROFILE FIELD MAPPING
    // (THIS FIXES YOUR ISSUE)
    // ============================
    profileUsernameElement.textContent =
        profileData?.username ||
        profileData?.displayName ||
        defaultUsername;

    profilePicElement.src =
        profileData?.profilePicUrl ||
        profileData?.profilePic ||
        profileData?.avatar ||
        defaultProfilePic;

    profileBioElement.textContent =
        profileData?.bio ||
        profileData?.about ||
        defaultBio;

    // ============================
    // STATUS LOGIC
    // ============================
    let statusKey = profileData.status || "offline";

    if (profileData.autoStatusEnabled) {
        const discordStatus = await fetchDiscordStatus();
        if (discordStatus) {
            statusKey = discordStatus;
        }
    }

    applyStatus(statusKey);

    // ============================
    // APPLY STATUS UI
    // ============================
    function applyStatus(key) {

        const statusMap = {
            online: "Active",
            idle: "Idle",
            dnd: "Do Not Disturb",
            offline: "Offline"
        };

        const label = statusMap[key] || "Unknown";

        if (profileStatusContainerElement) {
            profileStatusContainerElement.className =
                `profile-status-container status-${key}`;
        }

        if (profileStatusTextElement) {
            profileStatusTextElement.textContent = label;
            profileStatusTextElement.className =
                `profile-status-text status-${key}`;
        }
    }

    console.log("Profile updated successfully:", {
        username: profileUsernameElement.textContent,
        status: statusKey
    });
}

async function displayPresidentData() {
    const placeholderElement = document.getElementById('president-placeholder');
    if (!placeholderElement) { console.warn("President placeholder missing."); return; }
    placeholderElement.innerHTML = '<p style="text-align: center; padding: 20px;">Loading president info...</p>';

    if (!firebaseAppInitialized || !db) { console.error("President display error: Firebase not ready."); placeholderElement.innerHTML = '<p class="error">Could not load (DB Init Error).</p>'; return; }
    if (!presidentDocRef) { console.error("President display error: presidentDocRef missing."); placeholderElement.innerHTML = '<p class="error">Could not load (Config Error).</p>'; return; }

    try {
        const docSnap = await getDoc(presidentDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const presidentHTML = `
                <section id="current-president" class="president-section">
                  <h2 class="section-title">Current U.S. President</h2>
                  <div class="president-info">
                    <img src="${data.imageUrl || 'images/default-president.jpg'}" alt="President ${data.name || 'N/A'}" class="president-photo" onerror="this.src='images/default-president.jpg'; this.alt='Photo Missing';">
                    <div class="president-details">
                      <h3 class="president-name">${data.name || 'N/A'}</h3>
                      <p><strong>Born:</strong> ${data.born || 'N/A'}</p>
                      <p><strong>Height:</strong> ${data.height || 'N/A'}</p>
                      <p><strong>Party:</strong> ${data.party || 'N/A'}</p>
                      <p class="presidential-term"><strong>Term:</strong> ${data.term || 'N/A'}</p>
                      <p><strong>VP:</strong> ${data.vp || 'N/A'}</p>
                    </div>
                  </div>
                </section>`;
            placeholderElement.innerHTML = presidentHTML;
            console.log("President section updated.");
        } else {
            console.warn(`President document ('site_config/currentPresident') missing.`);
            placeholderElement.innerHTML = '<p style="text-align: center; padding: 20px;">President info unavailable.</p>';
        }
    } catch (error) {
        console.error("Error fetching president data:", error);
        placeholderElement.innerHTML = `<p class="error">Error loading president info: ${error.message}</p>`;
    }
}

async function loadAndDisplayUsefulLinks() {
    const containerElement = document.querySelector('.useful-links-section .links-container');
    if (!containerElement) { console.warn("Useful links container missing (.useful-links-section .links-container)."); return; }

    if (!firebaseAppInitialized || !db) { console.error("Useful Links load error: Firebase not ready."); containerElement.innerHTML = '<p class="error">Error loading links (DB Init Error).</p>'; return; }
    if (!usefulLinksCollectionRef) { console.error("Useful Links load error: Collection reference missing."); containerElement.innerHTML = '<p class="error">Error loading links (Config Error).</p>'; return; }

    containerElement.innerHTML = '<p>Loading links...</p>';
    try {
        const linkQuery = query(usefulLinksCollectionRef, orderBy("order", "asc"));
        const querySnapshot = await getDocs(linkQuery);
        containerElement.innerHTML = '';

        if (querySnapshot.empty) {
            containerElement.innerHTML = '<p>No useful links available at this time.</p>';
        } else {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.label && data.url) {
                    const linkElement = document.createElement('a');
                    linkElement.href = data.url;
                    linkElement.textContent = data.label;
                    linkElement.target = '_blank';
                    linkElement.rel = 'noopener noreferrer';
                    linkElement.className = 'link-button';
                    containerElement.appendChild(linkElement);
                } else {
                    console.warn("Skipping useful link item due to missing label or URL:", doc.id);
                }
            });
        }
        console.log(`Displayed ${querySnapshot.size} useful links.`);
    } catch (error) {
        console.error("Error loading useful links:", error);
        let errorMsg = "Could not load useful links.";
        if (error.code === 'failed-precondition') {
            errorMsg = "Error: DB configuration needed for links (order).";
            console.error("Missing Firestore index for useful_links collection, ordered by 'order'.");
        }
        containerElement.innerHTML = `<p class="error">${errorMsg}</p>`;
    }
}

async function loadAndDisplaySocialLinks() {
    const containerElement = document.querySelector('.social-links-container');
    if (!containerElement) { console.warn("Social links container missing (.social-links-container)."); return; }

    if (!firebaseAppInitialized || !db) { console.error("Social Links load error: Firebase not ready."); containerElement.innerHTML = '<p class="error">Error loading socials (DB Init Error).</p>'; return; }
    if (!socialLinksCollectionRef) { console.error("Social Links load error: Collection reference missing."); containerElement.innerHTML = '<p class="error">Error loading socials (Config Error).</p>'; return;}

    containerElement.innerHTML = '<p>Loading socials...</p>';
    try {
        const linkQuery = query(socialLinksCollectionRef, orderBy("order", "asc"));
        const querySnapshot = await getDocs(linkQuery);
        containerElement.innerHTML = '';

        if (querySnapshot.empty) {
            containerElement.innerHTML = '<p>No social links available.</p>';
        } else {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.label && data.url) {
                    const linkElement = document.createElement('a');
                    linkElement.href = data.url;
                    linkElement.target = '_blank';
                    linkElement.rel = 'noopener noreferrer';
                    linkElement.className = 'social-button';

                    if (data.iconClass) {
                        const iconElement = document.createElement('i');
                        iconElement.className = data.iconClass + ' social-icon';
                        linkElement.appendChild(iconElement);
                    }

                    const textElement = document.createElement('span');
                    textElement.textContent = data.label;
                    linkElement.appendChild(textElement);
                    containerElement.appendChild(linkElement);
                } else {
                    console.warn("Skipping social link item due to missing label or URL:", doc.id);
                }
            });
        }
        console.log(`Displayed ${querySnapshot.size} social links.`);
    } catch (error) {
        console.error("Error loading social links:", error);
        let errorMsg = "Could not load social links.";
        if (error.code === 'failed-precondition') {
            errorMsg = "Error: DB configuration needed for socials (order).";
            console.error("Missing Firestore index for social_links collection, ordered by 'order'.");
        }
        containerElement.innerHTML = `<p class="error">${errorMsg}</p>`;
    }
}

async function loadAndDisplayDisabilities() {
    const placeholderElement = document.getElementById('disabilities-list-placeholder');
    if (!placeholderElement) { console.warn("Disabilities placeholder missing (#disabilities-list-placeholder)."); return; }
    placeholderElement.innerHTML = '<li>Loading...</li>';
    if (!firebaseAppInitialized || !db) { console.error("Disabilities load error: Firebase not ready."); placeholderElement.innerHTML = '<li>Error (DB Init Error).</li>'; return; }
    if (!disabilitiesCollectionRef) { console.error("Disabilities load error: Collection ref missing."); placeholderElement.innerHTML = '<li>Error (Config Error).</li>'; return; }
    try {
        const disabilityQuery = query(disabilitiesCollectionRef, orderBy("order", "asc"));
        const querySnapshot = await getDocs(disabilityQuery);
        placeholderElement.innerHTML = '';
        if (querySnapshot.empty) {
            placeholderElement.innerHTML = '<li>No specific information available at this time.</li>';
        } else {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.name && data.url) {
                    const listItem = document.createElement('li');
                    const linkElement = document.createElement('a');
                    linkElement.href = data.url;
                    linkElement.target = '_blank';
                    linkElement.rel = 'noopener noreferrer';
                    
                    // Create a span for the text and an icon element
                    const textSpan = document.createElement('span');
                    textSpan.classList.add('button-text'); // Add a class for styling
                    textSpan.textContent = data.name;

                    const iconElement = document.createElement('i');
                    iconElement.classList.add('fas', 'fa-arrow-right'); // Changed icon to a generic arrow for better fit, adjust as needed

                    // Append text first, then icon (flexbox will handle the order based on justify-content)
                    linkElement.appendChild(textSpan);
                    linkElement.appendChild(iconElement);
                    
                    listItem.appendChild(linkElement);
                    placeholderElement.appendChild(listItem);
                } else {
                    console.warn("Skipping disability item due to missing name or URL:", doc.id);
                }
            });
        }
        console.log(`Displayed ${querySnapshot.size} disability links.`);
    } catch (error) {
        console.error("Error loading disabilities:", error);
        let errorMsg = "Could not load list.";
        if (error.code === 'failed-precondition') {
            errorMsg = "Error: DB config needed (order).";
            console.error("Missing Firestore index for disabilities collection, ordered by 'order'.");
        }
        placeholderElement.innerHTML = `<li>${errorMsg}</li>`;
    }
}



/* ------------------------------------------------------------
   SMART TECH ITEM SYSTEM
   Restores the full smart tech section: OS status, support status,
   AI support, future AI target, device score, upgrade recommendation,
   support lifespan, battery trend, advanced details, and Android support.
------------------------------------------------------------ */

// ======================
// PERSONAL THRESHOLDS
// ======================
const techThresholds = {
    cycleOld: 1500,
    cycleVeryOld: 2000,
    batteryBad: 85,
    batteryCritical: 75
};

// ======================
// UPGRADE CYCLE DEFAULTS
// ======================
const upgradeCycleDefaults = {
    phone: 4,
    tablet: 5,
    watch: 4,
    computer: 6,
    accessory: 0
};

const minimumUpgradeGapDefaults = {
    phone: 3,
    tablet: 4,
    watch: 3,
    computer: 5,
    accessory: 0
};

// ======================
// SUPPORT LIFESPAN DEFAULTS
// Estimates, not guarantees.
// ======================
const supportLifespanDefaults = {
    phone: {
        majorYears: 6,
        securityYearsAfterMajor: 2
    },
    tablet: {
        majorYears: 7,
        securityYearsAfterMajor: 2
    },
    computer: {
        majorYears: 7,
        securityYearsAfterMajor: 2
    },
    watch: {
        majorYears: 5,
        securityYearsAfterMajor: 1
    },
    accessory: {
        majorYears: 0,
        securityYearsAfterMajor: 0
    }
};

/* ------------------------------------------------------------
   AUTO LATEST OS FETCH
------------------------------------------------------------ */
async function fetchLatestOSVersions() {
    try {
        const response = await fetch(LATEST_OS_ENDPOINT, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`Latest OS fetch failed: ${response.status}`);
        }

        const data = await response.json();

        latestOSVersions = {
            ...latestOSVersions,
            ...data
        };

        console.log("Latest OS versions updated:", latestOSVersions);
    } catch (error) {
        console.warn("Using fallback latest OS versions:", error);
    }
}

// ======================
// OS TYPE DETECTION
// ======================
function detectOSType(osVersion) {
    if (!osVersion) return "unknown";

    const os = String(osVersion).toLowerCase();

    // Apple
    if (os.includes("ipados")) return "ipados";
    if (os.includes("ios")) return "ios";
    if (os.includes("macos")) return "macos";
    if (os.includes("watchos")) return "watchos";
    if (os.includes("tvos")) return "tvos";
    if (os.includes("visionos")) return "visionos";

    // Android skins / OEM software first
    if (os.includes("one ui") || os.includes("oneui")) return "oneui";
    if (os.includes("pixel ui") || os.includes("pixelui")) return "pixelui";
    if (os.includes("oxygenos") || os.includes("oxygen os")) return "oxygenos";
    if (os.includes("coloros") || os.includes("color os")) return "coloros";
    if (os.includes("realme ui") || os.includes("realmeui")) return "realmeui";
    if (os.includes("hyperos")) return "hyperos";
    if (os.includes("miui")) return "miui";
    if (os.includes("magic os") || os.includes("magicos")) return "magicos";
    if (os.includes("emui")) return "emui";
    if (os.includes("harmonyos") || os.includes("harmony os")) return "harmonyos";
    if (os.includes("funtouch")) return "funtouchos";
    if (os.includes("originos") || os.includes("origin os")) return "originos";
    if (os.includes("nothing os") || os.includes("nothingos")) return "nothingos";
    if (os.includes("motorola hello") || os.includes("hello ui")) return "motorolahello";
    if (os.includes("zenui") || os.includes("zen ui")) return "zenui";
    if (os.includes("rog ui") || os.includes("rogui")) return "rogui";
    if (os.includes("xos")) return "xos";
    if (os.includes("hios")) return "hios";
    if (os.includes("flyme")) return "flymeos";

    // Android generic after skins
    if (os.includes("android tv")) return "androidtv";
    if (os.includes("google tv")) return "googletv";
    if (os.includes("android")) return "android";

    // Windows
    if (os.includes("windows server")) return "windowsserver";
    if (os.includes("windows phone")) return "windowsphone";
    if (os.includes("windows")) return "windows";

    // ChromeOS
    if (os.includes("chromeos") || os.includes("chrome os")) return "chromeos";
    if (os.includes("chromiumos") || os.includes("chromium os")) return "chromiumos";

    // Linux
    if (os.includes("ubuntu")) return "ubuntu";
    if (os.includes("debian")) return "debian";
    if (os.includes("fedora")) return "fedora";
    if (os.includes("arch")) return "arch";
    if (os.includes("manjaro")) return "manjaro";
    if (os.includes("mint")) return "linuxmint";
    if (os.includes("pop!_os") || os.includes("pop os")) return "popos";
    if (os.includes("elementary")) return "elementaryos";
    if (os.includes("zorin")) return "zorinos";
    if (os.includes("opensuse") || os.includes("suse")) return "opensuse";
    if (os.includes("kali")) return "kali";
    if (os.includes("tails")) return "tails";
    if (os.includes("red hat") || os.includes("rhel")) return "redhat";
    if (os.includes("rocky")) return "rocky";
    if (os.includes("alma")) return "almalinux";
    if (os.includes("linux")) return "linux";

    // BSD
    if (os.includes("freebsd")) return "freebsd";
    if (os.includes("openbsd")) return "openbsd";
    if (os.includes("netbsd")) return "netbsd";

    // Gaming
    if (os.includes("steamos") || os.includes("steam os")) return "steamos";
    if (os.includes("playstation") || os.includes("ps5") || os.includes("ps4")) return "playstation";
    if (os.includes("xbox")) return "xbox";
    if (os.includes("nintendo switch") || os.includes("switch os")) return "nintendoswitch";

    // TV / streaming
    if (os.includes("fire os") || os.includes("fireos")) return "fireos";
    if (os.includes("roku")) return "rokuos";
    if (os.includes("webos") || os.includes("web os")) return "webos";
    if (os.includes("tizen")) return "tizen";

    // Wearables
    if (os.includes("wear os") || os.includes("wearos")) return "wearos";
    if (os.includes("garmin")) return "garminos";
    if (os.includes("fitbit")) return "fitbitos";
    if (os.includes("zepp")) return "zeppos";

    // Other
    if (os.includes("kindle")) return "kindleos";
    if (os.includes("quest") || os.includes("meta horizon")) return "metaquest";

    return "unknown";
}

function formatOSType(osType) {
    const labels = {
        ios: "iOS",
        ipados: "iPadOS",
        macos: "macOS",
        watchos: "watchOS",
        tvos: "tvOS",
        visionos: "visionOS",

        android: "Android",
        pixelui: "Pixel UI",
        oneui: "One UI",
        oxygenos: "OxygenOS",
        coloros: "ColorOS",
        realmeui: "realme UI",
        miui: "MIUI",
        hyperos: "HyperOS",
        magicos: "MagicOS",
        emui: "EMUI",
        harmonyos: "HarmonyOS",
        funtouchos: "Funtouch OS",
        originos: "OriginOS",
        nothingos: "Nothing OS",
        motorolahello: "Motorola Hello UI",
        zenui: "ZenUI",
        rogui: "ROG UI",
        xos: "XOS",
        hios: "HiOS",
        flymeos: "Flyme OS",

        windows: "Windows",
        windowsphone: "Windows Phone",
        windowsserver: "Windows Server",

        linux: "Linux",
        ubuntu: "Ubuntu",
        debian: "Debian",
        fedora: "Fedora",
        arch: "Arch Linux",
        manjaro: "Manjaro",
        linuxmint: "Linux Mint",
        popos: "Pop!_OS",
        elementaryos: "elementary OS",
        zorinos: "Zorin OS",
        opensuse: "openSUSE",
        kali: "Kali Linux",
        tails: "Tails",
        redhat: "Red Hat Enterprise Linux",
        rocky: "Rocky Linux",
        almalinux: "AlmaLinux",

        chromeos: "ChromeOS",
        chromiumos: "ChromiumOS",

        freebsd: "FreeBSD",
        openbsd: "OpenBSD",
        netbsd: "NetBSD",

        steamos: "SteamOS",
        playstation: "PlayStation System Software",
        xbox: "Xbox System Software",
        nintendoswitch: "Nintendo Switch System Software",

        fireos: "Fire OS",
        rokuos: "Roku OS",
        webos: "webOS",
        tizen: "Tizen",
        androidtv: "Android TV",
        googletv: "Google TV",

        wearos: "Wear OS",
        garminos: "Garmin OS",
        fitbitos: "Fitbit OS",
        zeppos: "Zepp OS",

        kindleos: "Kindle OS",
        metaquest: "Meta Quest System Software",
        unknown: "OS"
    };

    return labels[osType] || "OS";
}

// ======================
// VERSION PARSER
// ======================
function extractVersionString(osVersion, osType = null) {
    if (!osVersion) return null;

    const os = String(osVersion);

    const patterns = {
        ios: /ios\s*(\d+(?:\.\d+){0,5})/i,
        ipados: /ipados\s*(\d+(?:\.\d+){0,5})/i,
        macos: /macos\s*(?:[a-z\s]+)?\s*(\d+(?:\.\d+){0,5})/i,
        watchos: /watchos\s*(\d+(?:\.\d+){0,5})/i,
        tvos: /tvos\s*(\d+(?:\.\d+){0,5})/i,
        visionos: /visionos\s*(\d+(?:\.\d+){0,5})/i,

        android: /android\s*(\d+(?:\.\d+){0,5})/i,
        pixelui: /pixel\s*ui\s*(\d+(?:\.\d+){0,5})/i,
        oneui: /one\s*ui\s*(\d+(?:\.\d+){0,5})/i,
        oxygenos: /oxygen\s*os\s*(\d+(?:\.\d+){0,5})/i,
        coloros: /color\s*os\s*(\d+(?:\.\d+){0,5})/i,
        realmeui: /realme\s*ui\s*(\d+(?:\.\d+){0,5})/i,
        miui: /miui\s*(\d+(?:\.\d+){0,5})/i,
        hyperos: /hyperos\s*(\d+(?:\.\d+){0,5})/i,
        magicos: /magic\s*os\s*(\d+(?:\.\d+){0,5})/i,
        emui: /emui\s*(\d+(?:\.\d+){0,5})/i,
        harmonyos: /harmony\s*os\s*(\d+(?:\.\d+){0,5})/i,
        funtouchos: /funtouch\s*os\s*(\d+(?:\.\d+){0,5})/i,
        originos: /origin\s*os\s*(\d+(?:\.\d+){0,5})/i,
        nothingos: /nothing\s*os\s*(\d+(?:\.\d+){0,5})/i,
        motorolahello: /(?:motorola\s*hello|hello\s*ui)\s*(\d+(?:\.\d+){0,5})/i,
        zenui: /zen\s*ui\s*(\d+(?:\.\d+){0,5})/i,
        rogui: /rog\s*ui\s*(\d+(?:\.\d+){0,5})/i,
        xos: /xos\s*(\d+(?:\.\d+){0,5})/i,
        hios: /hios\s*(\d+(?:\.\d+){0,5})/i,
        flymeos: /flyme\s*os\s*(\d+(?:\.\d+){0,5})/i,

        windows: /windows\s*(\d+(?:\.\d+){0,5})/i,
        windowsphone: /windows\s*phone\s*(\d+(?:\.\d+){0,5})/i,
        windowsserver: /windows\s*server\s*(\d{4})/i,

        chromeos: /chrome\s*os\s*(\d+(?:\.\d+){0,6})/i,
        chromiumos: /chromium\s*os\s*(\d+(?:\.\d+){0,6})/i,

        ubuntu: /ubuntu\s*(\d+(?:\.\d+){0,5})/i,
        debian: /debian\s*(\d+(?:\.\d+){0,5})/i,
        fedora: /fedora\s*(\d+(?:\.\d+){0,5})/i,
        linuxmint: /linux\s*mint\s*(\d+(?:\.\d+){0,5})/i,
        opensuse: /opensuse\s*(\d+(?:\.\d+){0,5})/i,
        kali: /kali\s*(\d+(?:\.\d+){0,5})/i,
        tails: /tails\s*(\d+(?:\.\d+){0,5})/i,
        redhat: /(?:red\s*hat|rhel)\s*(\d+(?:\.\d+){0,5})/i,
        rocky: /rocky\s*(\d+(?:\.\d+){0,5})/i,
        almalinux: /alma(?:linux)?\s*(\d+(?:\.\d+){0,5})/i,

        freebsd: /freebsd\s*(\d+(?:\.\d+){0,5})/i,
        openbsd: /openbsd\s*(\d+(?:\.\d+){0,5})/i,
        netbsd: /netbsd\s*(\d+(?:\.\d+){0,5})/i,

        steamos: /steam\s*os\s*(\d+(?:\.\d+){0,5})/i,
        playstation: /(?:playstation|ps5|ps4)\s*(\d+(?:\.\d+){0,5})/i,
        xbox: /xbox\s*(\d+(?:\.\d+){0,5})/i,
        nintendoswitch: /(?:nintendo\s*switch|switch\s*os)\s*(\d+(?:\.\d+){0,5})/i,

        fireos: /fire\s*os\s*(\d+(?:\.\d+){0,5})/i,
        rokuos: /roku\s*os\s*(\d+(?:\.\d+){0,5})/i,
        webos: /webos\s*(\d+(?:\.\d+){0,5})/i,
        tizen: /tizen\s*(\d+(?:\.\d+){0,5})/i,
        androidtv: /android\s*tv\s*(\d+(?:\.\d+){0,5})/i,
        googletv: /google\s*tv\s*(\d+(?:\.\d+){0,5})/i,

        wearos: /wear\s*os\s*(\d+(?:\.\d+){0,5})/i,
        zeppos: /zepp\s*os\s*(\d+(?:\.\d+){0,5})/i
    };

    if (osType && patterns[osType]) {
        const specificMatch = os.match(patterns[osType]);
        if (specificMatch) return specificMatch[1];
    }

    const genericMatch = os.match(/(\d+(?:\.\d+){0,6})/);
    return genericMatch ? genericMatch[1] : null;
}

function normalizeVersion(version) {
    return String(version)
        .split(".")
        .map(num => parseInt(num, 10))
        .map(num => isNaN(num) ? 0 : num);
}

function compareVersions(a, b) {
    if (a === "latest" || b === "latest") return 0;
    if (a === "rolling" || b === "rolling") return 0;
    if (a === "series" || b === "series") return 0;
    if (a === "Unknown" || b === "Unknown") return 0;

    const versionA = normalizeVersion(a);
    const versionB = normalizeVersion(b);
    const maxLength = Math.max(versionA.length, versionB.length);

    for (let i = 0; i < maxLength; i++) {
        const partA = versionA[i] || 0;
        const partB = versionB[i] || 0;

        if (partA > partB) return 1;
        if (partA < partB) return -1;
    }

    return 0;
}

// ======================
// BETA / CHANNEL DETECTION
// ======================
function detectOSChannel(osVersion) {
    if (!osVersion) return "public";

    const os = String(osVersion).toLowerCase();

    if (os.includes("developer beta") || os.includes("dev beta")) return "developer-beta";
    if (os.includes("public beta")) return "public-beta";
    if (os.includes("beta")) return "beta";
    if (os.includes("canary")) return "canary";
    if (os.includes("preview")) return "preview";
    if (os.includes("rc") || os.includes("release candidate")) return "release-candidate";

    return "public";
}

// ======================
// OS STATUS
// ======================
function checkOSStatus(osVersion) {
    if (!osVersion) return null;

    const osType = detectOSType(osVersion);
    const currentVersion = extractVersionString(osVersion, osType);
    const latestPublicVersion = latestOSVersions[osType] || null;
    const channel = detectOSChannel(osVersion);

    if (!currentVersion) return null;

    if (!latestPublicVersion) {
        return {
            status: "Unknown",
            color: "gray",
            osType,
            currentVersion,
            latestPublicVersion: "Unknown",
            releaseChannel: "Unknown",
            description: "Latest public version is not configured for this OS.",
            isBeta: false,
            isPublicLatest: false,
            isBehindPublic: false
        };
    }

    const comparisonToPublic = compareVersions(currentVersion, latestPublicVersion);

    let status = "Latest";
    let color = "green";
    let releaseChannel = "Public";
    let description = "Running the latest public release.";

    if (channel === "developer-beta") {
        status = "Developer Beta";
        color = "purple";
        releaseChannel = "Developer Beta";
        description = "Running a developer beta ahead of the public release.";
    } else if (channel === "public-beta") {
        status = "Public Beta";
        color = "purple";
        releaseChannel = "Public Beta";
        description = "Running a public beta ahead of the public release.";
    } else if (channel === "beta") {
        status = "Beta";
        color = "purple";
        releaseChannel = "Beta";
        description = "Running a beta build ahead of the public release.";
    } else if (channel === "canary") {
        status = "Canary";
        color = "purple";
        releaseChannel = "Canary";
        description = "Running an experimental canary build.";
    } else if (channel === "preview") {
        status = "Preview";
        color = "purple";
        releaseChannel = "Preview";
        description = "Running a preview build.";
    } else if (channel === "release-candidate") {
        status = "Release Candidate";
        color = "purple";
        releaseChannel = "Release Candidate";
        description = "Running a release candidate build.";
    } else if (comparisonToPublic > 0) {
        status = "Ahead of Public";
        color = "purple";
        releaseChannel = "Pre-release / Beta";
        description = "This version is newer than the latest public release.";
    } else if (comparisonToPublic < 0) {
        status = "Outdated";
        color = "yellow";
        releaseChannel = "Public";
        description = "A newer public release is available.";
    }

    if (comparisonToPublic < 0) {
        const currentMajor = normalizeVersion(currentVersion)[0] || 0;
        const latestMajor = normalizeVersion(latestPublicVersion)[0] || 0;

        if (latestMajor - currentMajor >= 1) {
            status = "Very Outdated";
            color = "red";
            description = "This OS version is significantly behind the latest public release.";
        }
    }

    return {
        status,
        color,
        osType,
        currentVersion,
        latestPublicVersion,
        releaseChannel,
        description,
        isBeta: channel !== "public" || comparisonToPublic > 0,
        isPublicLatest: comparisonToPublic === 0 && channel === "public",
        isBehindPublic: comparisonToPublic < 0
    };
}

// ======================
// DEVICE AGE
// ======================
function calculateDeviceAge(dateBought) {
    if (!dateBought) return null;

    let bought;

    if (dateBought && typeof dateBought.toDate === "function") {
        bought = dateBought.toDate();
    } else {
        bought = new Date(dateBought);
    }

    if (isNaN(bought.getTime())) return null;

    const now = new Date();
    const diffMs = now - bought;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const years = parseFloat((days / 365).toFixed(1));

    return { days, years };
}

// ======================
// DEVICE TYPE DETECTION
// ======================
function detectDeviceType(item) {
    const explicitType = String(item.deviceType || "").toLowerCase();
    if (explicitType) return explicitType;

    const name = String(item.name || "").toLowerCase();
    const model = String(item.model || "").toLowerCase();
    const iconClass = String(item.iconClass || "").toLowerCase();

    if (
        name.includes("iphone") ||
        name.includes("phone") ||
        name.includes("galaxy") ||
        name.includes("pixel") ||
        model.includes("iphone") ||
        model.includes("galaxy") ||
        model.includes("pixel") ||
        iconClass.includes("mobile")
    ) {
        return "phone";
    }

    if (
        name.includes("ipad") ||
        name.includes("tablet") ||
        name.includes("tab") ||
        model.includes("ipad") ||
        model.includes("tablet") ||
        model.includes("tab")
    ) {
        return "tablet";
    }

    if (
        name.includes("mac") ||
        name.includes("macbook") ||
        name.includes("imac") ||
        name.includes("computer") ||
        name.includes("laptop") ||
        name.includes("desktop") ||
        name.includes("pc") ||
        model.includes("mac") ||
        model.includes("macbook") ||
        model.includes("computer") ||
        model.includes("laptop") ||
        model.includes("desktop") ||
        model.includes("pc") ||
        iconClass.includes("desktop") ||
        iconClass.includes("laptop")
    ) {
        return "computer";
    }

    if (name.includes("watch") || model.includes("watch")) {
        return "watch";
    }

    if (
        name.includes("accessory") ||
        model.includes("accessory") ||
        iconClass.includes("keyboard") ||
        iconClass.includes("mouse") ||
        iconClass.includes("headphones")
    ) {
        return "accessory";
    }

    return "computer";
}

// ======================
// CHIP HELPERS
// ======================
function getChipInfo(item) {
    const chipName = String(item.chipName || item.chip || "").trim();
    const chipLower = chipName.toLowerCase();

    return {
        chipName,
        chipLower,

        isA17ProOrNewer:
            chipLower.includes("a17 pro") ||
            chipLower.includes("a18") ||
            chipLower.includes("a19") ||
            chipLower.includes("a20") ||
            chipLower.includes("a21"),

        isA19ProOrNewer:
            chipLower.includes("a19 pro") ||
            chipLower.includes("a20 pro") ||
            chipLower.includes("a21 pro"),

        isAppleSilicon:
            chipLower.includes("m1") ||
            chipLower.includes("m2") ||
            chipLower.includes("m3") ||
            chipLower.includes("m4") ||
            chipLower.includes("m5") ||
            chipLower.includes("m6"),

        isM3OrNewer:
            chipLower.includes("m3") ||
            chipLower.includes("m4") ||
            chipLower.includes("m5") ||
            chipLower.includes("m6"),

        isM4OrNewer:
            chipLower.includes("m4") ||
            chipLower.includes("m5") ||
            chipLower.includes("m6"),

        isSnapdragonAIClass:
            chipLower.includes("snapdragon 8") ||
            chipLower.includes("snapdragon elite"),

        isTensorAIClass:
            chipLower.includes("tensor g3") ||
            chipLower.includes("tensor g4") ||
            chipLower.includes("tensor g5") ||
            chipLower.includes("tensor g6"),

        isExynosAIClass:
            chipLower.includes("exynos 2400") ||
            chipLower.includes("exynos 2500") ||
            chipLower.includes("exynos 2600"),

        isDimensityAIClass:
            chipLower.includes("dimensity 9300") ||
            chipLower.includes("dimensity 9400") ||
            chipLower.includes("dimensity 9500"),

        isProMaxClass:
            chipLower.includes("pro") ||
            chipLower.includes("max") ||
            chipLower.includes("ultra") ||
            chipLower.includes("elite")
    };
}

// ======================
// DEVICE SUPPORT
// ======================
function checkDeviceSupport(item) {
    const currentYear = new Date().getFullYear();

    const parsedModelYear = Number(item.modelYear);
    const modelYear = !isNaN(parsedModelYear) ? parsedModelYear : currentYear;

    const parsedSupportEndYear = Number(item.supportEndYear);
    const supportEndYear = !isNaN(parsedSupportEndYear) && item.supportEndYear
        ? parsedSupportEndYear
        : null;

    const osStatus = checkOSStatus(item.osVersion);
    const deviceType = detectDeviceType(item);
    const condition = String(item.condition || "").toLowerCase();

    const yearsOld = Math.max(0, currentYear - modelYear);

    let supported = true;
    let supportLevel = "Fully Supported";
    let supportColor = "green";

    const ownershipConfig = getOwnershipConfig(item);
    if (ownershipConfig.mode === "archive") {
        return {
            supported: false,
            supportLevel: ownershipConfig.label,
            supportColor: "gray",
            yearsOld,
            deviceType,
            modelYear,
            supportEndYear,
            supportRemaining: supportEndYear ? supportEndYear - currentYear : null
        };
    }

    if (supportEndYear) {
        if (currentYear > supportEndYear) {
            supported = false;
            supportLevel = "Unsupported";
            supportColor = "red";
        } else if (currentYear === supportEndYear) {
            supportLevel = "Support Ending Soon";
            supportColor = "yellow";
        } else if (supportEndYear - currentYear === 1) {
            supportLevel = "Support Ending Next Year";
            supportColor = "yellow";
        }
    }

    if (condition === "retired") {
        supported = false;
        supportLevel = "Retired";
        supportColor = "gray";
    }

    if (condition === "needs repair" && supported) {
        supportLevel = "Needs Repair";
        supportColor = "orange";
    }

    if (osStatus && osStatus.status === "Very Outdated") {
        supported = false;
        supportLevel = "Unsupported";
        supportColor = "red";
    } else if (osStatus && osStatus.isBehindPublic && supported) {
        supportLevel = "Limited Support";
        supportColor = "yellow";
    }

    const limitedSupportAgeByType = {
        phone: 5,
        tablet: 5,
        watch: 4,
        computer: 6,
        accessory: null
    };

    const veryOldAgeByType = {
        phone: 6,
        tablet: 6,
        watch: 5,
        computer: 7,
        accessory: null
    };

    const limitedAge = limitedSupportAgeByType[deviceType];
    const veryOldAge = veryOldAgeByType[deviceType];

    if (supported && limitedAge !== null && yearsOld >= limitedAge) {
        supportLevel = "Limited Support";
        supportColor = "yellow";
    }

    if (supported && veryOldAge !== null && yearsOld >= veryOldAge) {
        supportLevel = "Older Device";
        supportColor = "orange";
    }

    if (deviceType === "accessory" && supported) {
        if (condition === "needs repair") {
            supportLevel = "Needs Repair";
            supportColor = "orange";
        } else if (supportEndYear && currentYear === supportEndYear) {
            supportLevel = "Support Ending Soon";
            supportColor = "yellow";
        } else {
            supportLevel = "Condition-Based";
            supportColor = "green";
        }
    }

    let supportRemaining = null;

    if (supportEndYear) {
        supportRemaining = supportEndYear - currentYear;
    }

    return {
        supported,
        supportLevel,
        supportColor,
        yearsOld,
        deviceType,
        modelYear,
        supportEndYear,
        supportRemaining
    };
}

// ======================
// ESTIMATED SUPPORT LIFESPAN
// ======================
function estimateSupportLifespan(item) {
    const currentYear = new Date().getFullYear();
    const deviceType = detectDeviceType(item);

    if (deviceType === "accessory") {
        return {
            estimatedMajorSupportEndYear: null,
            estimatedSecuritySupportEndYear: null,
            majorSupportRemaining: null,
            securitySupportRemaining: null,
            supportRating: "Compatibility-Based",
            supportColor: "green"
        };
    }

    const modelYear = Number(item.modelYear || currentYear);
    const supportEndYear = item.supportEndYear ? Number(item.supportEndYear) : null;
    const defaults = supportLifespanDefaults[deviceType] || supportLifespanDefaults.phone;

    const estimatedMajorSupportEndYear = supportEndYear || modelYear + defaults.majorYears;
    const estimatedSecuritySupportEndYear = estimatedMajorSupportEndYear + defaults.securityYearsAfterMajor;
    const majorSupportRemaining = estimatedMajorSupportEndYear - currentYear;
    const securitySupportRemaining = estimatedSecuritySupportEndYear - currentYear;

    let supportRating = "Supported";
    let supportColor = "green";

    if (majorSupportRemaining <= 1 && majorSupportRemaining > 0) {
        supportRating = "Major Support Ending Soon";
        supportColor = "yellow";
    }

    if (majorSupportRemaining <= 0 && securitySupportRemaining > 0) {
        supportRating = "Security Updates Only";
        supportColor = "yellow";
    }

    if (securitySupportRemaining <= 0) {
        supportRating = "Unsupported";
        supportColor = "red";
    }

    return {
        estimatedMajorSupportEndYear,
        estimatedSecuritySupportEndYear,
        majorSupportRemaining,
        securitySupportRemaining,
        supportRating,
        supportColor
    };
}

// ======================
// BATTERY TREND
// ======================
function estimateBatteryTrend(item) {
    const age = calculateDeviceAge(item.dateBought);
    if (!age) return null;

    const currentHealth = Number(item.batteryHealth ?? 100);
    if (isNaN(currentHealth)) return null;

    const degradationRate = 5;
    const estimatedLoss = age.years * degradationRate;
    const estimatedOriginal = Math.min(100, currentHealth + estimatedLoss);
    const declineValue = Math.max(0, estimatedOriginal - currentHealth);
    const decline = declineValue.toFixed(1);

    return {
        decline,
        trend: declineValue > 10 ? "Fast Decline" : "Normal"
    };
}

// ======================
// BATTERY CYCLES HELPER
// Supports both batteryCycles and batteryChargeCycles
// ======================
function getBatteryCycles(item) {
    const cycles = item.batteryCycles ?? item.batteryChargeCycles ?? 0;
    const numberCycles = Number(cycles);
    return isNaN(numberCycles) ? 0 : numberCycles;
}

// ======================
// CURRENT AI FEATURE SUPPORT
// ======================
function calculateAIFeatureSupport(item) {
    const deviceType = detectDeviceType(item);
    const model = String(item.model || "").toLowerCase();
    const ramGB = Number(item.ramGB || 0);
    const storageGB = Number(item.storageGB || 0);
    const chip = getChipInfo(item);

    let level = "None";
    let score = 0;
    let color = "red";
    let reasons = [];
    let weaknesses = [];

    const hasEnoughStorageForAI = storageGB >= 128;

    if (deviceType === "phone") {
        const isIPhone15Pro = model.includes("iphone 15 pro");
        const isIPhone16OrNewer =
            model.includes("iphone 16") ||
            model.includes("iphone 17") ||
            model.includes("iphone 18") ||
            model.includes("iphone 19") ||
            model.includes("iphone 20") ||
            model.includes("iphone 21");

        const isAndroidAIPhone =
            model.includes("galaxy") ||
            model.includes("pixel") ||
            model.includes("ultra") ||
            model.includes("fold") ||
            chip.isSnapdragonAIClass ||
            chip.isTensorAIClass ||
            chip.isExynosAIClass ||
            chip.isDimensityAIClass;

        if (isIPhone15Pro || isIPhone16OrNewer || chip.isA17ProOrNewer || isAndroidAIPhone) {
            level = "Standard";
            score = 70;
            color = "yellow";
            reasons.push("Meets the current AI-capable phone hardware class.");
        }

        if (ramGB >= 12) {
            level = "Advanced";
            score = 88;
            color = "green";
            reasons.push("12GB+ memory gives stronger AI feature headroom.");
        }

        if ((chip.isA19ProOrNewer || chip.isSnapdragonAIClass || chip.isTensorAIClass) && ramGB >= 12) {
            level = "Maximum";
            score = 95;
            color = "green";
            reasons.push("Flagship AI-class chip with 12GB+ memory provides maximum AI headroom.");
        }

        if (level === "Standard" && ramGB > 0 && ramGB < 12) {
            weaknesses.push("Memory supports current AI features but may limit future advanced on-device AI tiers.");
        }
    }

    if (deviceType === "tablet") {
        if (chip.isAppleSilicon || chip.isA17ProOrNewer || chip.isSnapdragonAIClass || chip.isTensorAIClass) {
            level = "Standard";
            score = 72;
            color = "yellow";
            reasons.push("Meets AI-capable tablet hardware class.");
        }

        if ((chip.isM4OrNewer || chip.isSnapdragonAIClass) && ramGB >= 12) {
            level = "Advanced";
            score = 90;
            color = "green";
            reasons.push("Newer chip with 12GB+ memory gives stronger AI headroom.");
        }
    }

    if (deviceType === "computer") {
        if (chip.isAppleSilicon || chip.isSnapdragonAIClass) {
            level = "Standard";
            score = 75;
            color = "yellow";
            reasons.push("Modern AI-capable computer hardware detected.");
        }

        if ((chip.isM3OrNewer || chip.isSnapdragonAIClass) && ramGB >= 12) {
            level = "Advanced";
            score = 90;
            color = "green";
            reasons.push("Newer chip with 12GB+ memory has stronger future AI headroom.");
        }

        if (chip.isProMaxClass && ramGB >= 24) {
            level = "Maximum";
            score = 96;
            color = "green";
            reasons.push("Pro/Max/Ultra/Elite-class chip with high memory headroom.");
        }
    }

    if (deviceType === "watch") {
        if (item.pairedAIPhone === true) {
            level = "Relay";
            score = 55;
            color = "yellow";
            reasons.push("AI features depend on a nearby compatible phone.");
        } else {
            level = "Limited";
            score = 30;
            color = "orange";
            weaknesses.push("Watch AI support depends on paired phone compatibility.");
        }
    }

    if (deviceType === "accessory") {
        level = "Not Applicable";
        score = 0;
        color = "gray";
        reasons.push("Accessories do not need direct AI feature support.");
    }

    if (!hasEnoughStorageForAI && level !== "None" && level !== "Not Applicable") {
        score -= 8;
        weaknesses.push("Lower storage may limit local AI model flexibility.");
    }

    if (reasons.length === 0 && weaknesses.length === 0) {
        weaknesses.push("Does not appear to meet current AI hardware requirements.");
    }

    return {
        aiSupportLevel: level,
        aiSupportScore: Math.max(0, Math.min(100, score)),
        aiSupportColor: color,
        aiSupportReasons: reasons,
        aiSupportWeaknesses: weaknesses
    };
}

// ======================
// FUTURE AI TARGET
// ======================
function calculateFutureAITarget(item, futureTarget) {
    const deviceType = detectDeviceType(item);
    const model = String(item.model || "").toLowerCase();
    const target = String(futureTarget.futureUpgradeTarget || "").toLowerCase();

    if (deviceType === "accessory") {
        return {
            level: "Not Applicable",
            color: "gray",
            reason: "Accessories do not need direct AI feature support."
        };
    }

    if (deviceType === "watch") {
        return {
            level: "Relay",
            color: "yellow",
            reason: "Future watch AI support should depend on a compatible paired phone."
        };
    }

    if (deviceType === "phone") {
        if (
            target.includes("pro") ||
            target.includes("pro max") ||
            target.includes("air") ||
            target.includes("ultra") ||
            target.includes("fold") ||
            model.includes("galaxy") ||
            model.includes("pixel")
        ) {
            return {
                level: "Maximum",
                color: "green",
                reason: "Future target is a flagship phone class, so the goal should be maximum AI headroom."
            };
        }

        return {
            level: "Advanced",
            color: "green",
            reason: "Future target should aim for stronger AI headroom than the current device."
        };
    }

    if (deviceType === "tablet") {
        if (target.includes("pro") || target.includes("ultra")) {
            return {
                level: "Maximum",
                color: "green",
                reason: "Future tablet target should prioritize Pro/Ultra-class chip and memory headroom."
            };
        }

        return {
            level: "Advanced",
            color: "green",
            reason: "Future tablet target should prioritize newer silicon and enough memory."
        };
    }

    if (deviceType === "computer") {
        return {
            level: "Advanced",
            color: "green",
            reason: "Future computer target should prioritize newer silicon with at least 16GB memory."
        };
    }

    return {
        level: "Advanced",
        color: "green",
        reason: "Future target should prioritize stronger AI feature support."
    };
}

// ======================
// DEVICE SCORE
// Higher score = healthier device
// Lower score = more upgrade urgency
// ======================
function calculateUpgradeScore(item) {
    const age = calculateDeviceAge(item.dateBought);
    const battery = Number(item.batteryHealth ?? 100);
    const cycles = getBatteryCycles(item);
    const support = checkDeviceSupport(item);
    const osStatus = checkOSStatus(item.osVersion);

    let score = 100;

    if (age) score -= age.years * 10;
    score -= (100 - battery) * 1.2;
    score -= cycles * 0.008;

    if (cycles >= techThresholds.cycleVeryOld) score -= 10;
    if (osStatus && osStatus.isBehindPublic) score -= 8;
    if (osStatus && osStatus.status === "Very Outdated") score -= 18;

    if (support.supportLevel === "Limited Support") score -= 10;
    if (support.supportLevel === "Older Device") score -= 14;
    if (support.supportLevel === "Support Ending Soon") score -= 12;
    if (support.supportLevel === "Support Ending Next Year") score -= 8;
    if (!support.supported) score -= 25;

    score = Math.max(0, Math.min(100, Math.round(score)));

    let label = "Excellent";
    let color = "green";

    if (score < 80) {
        label = "Good";
        color = "yellow";
    }

    if (score < 60) {
        label = "Aging";
        color = "orange";
    }

    if (score < 40) {
        label = "Needs Attention";
        color = "red";
    }

    return { score, label, color };
}

// ======================
// FUTURE-PROOF SCORE
// ======================
function calculateFutureProofScore(item) {
    const deviceType = detectDeviceType(item);
    const ai = calculateAIFeatureSupport(item);
    const support = estimateSupportLifespan(item);

    const ramGB = Number(item.ramGB || 0);
    const storageGB = Number(item.storageGB || 0);
    const batteryHealth = Number(item.batteryHealth ?? 100);
    const compatibilityStatus = String(item.compatibilityStatus || "").toLowerCase();

    let score = 50;
    let reasons = [];
    let weaknesses = [];

    if (deviceType !== "accessory") {
        if (support.majorSupportRemaining >= 4) {
            score += 20;
            reasons.push("Several years of estimated major OS support remain");
        } else if (support.majorSupportRemaining >= 2) {
            score += 10;
            reasons.push("Some major OS support remains");
        } else {
            score -= 15;
            weaknesses.push("Major OS support may be nearing its end");
        }
    }

    if (ai.aiSupportLevel === "Maximum") {
        score += 20;
        reasons.push("Maximum AI feature headroom");
    } else if (ai.aiSupportLevel === "Advanced") {
        score += 15;
        reasons.push("Strong AI feature headroom");
    } else if (ai.aiSupportLevel === "Standard") {
        score += 8;
        reasons.push("Supports current AI feature class");
    } else if (ai.aiSupportLevel === "Limited" || ai.aiSupportLevel === "None") {
        score -= 10;
        weaknesses.push("Limited AI feature support");
    }

    if (deviceType === "phone") {
        if (ramGB >= 12) {
            score += 8;
            reasons.push("Higher RAM improves long-term AI and multitasking headroom");
        } else if (ramGB > 0 && ramGB < 12) {
            weaknesses.push("RAM may limit future advanced AI features");
        }

        if (storageGB >= 512) {
            score += 8;
            reasons.push("Storage is strong for long-term use");
        } else if (storageGB > 0 && storageGB <= 128) {
            score -= 6;
            weaknesses.push("128GB storage may become limiting over time");
        }
    }

    if (deviceType === "tablet") {
        if (ramGB >= 8) {
            score += 6;
            reasons.push("Tablet memory is reasonable for long-term use");
        }

        if (storageGB >= 256) {
            score += 8;
            reasons.push("Tablet storage has good long-term headroom");
        } else if (storageGB > 0 && storageGB < 128) {
            score -= 8;
            weaknesses.push("Low tablet storage may limit long-term usefulness");
        }
    }

    if (deviceType === "computer") {
        if (ramGB >= 16) {
            score += 12;
            reasons.push("16GB+ memory is better for long-term computer use");
        } else if (ramGB > 0) {
            score -= 10;
            weaknesses.push("Low memory may age poorly for a computer");
        }

        if (storageGB >= 512) {
            score += 8;
            reasons.push("512GB+ storage is better for long-term computer use");
        } else if (storageGB > 0) {
            score -= 6;
            weaknesses.push("Base storage may become limiting");
        }
    }

    if (deviceType === "watch") {
        if (batteryHealth >= 85) {
            score += 10;
            reasons.push("Battery health is still strong for a watch");
        } else {
            score -= 12;
            weaknesses.push("Battery health may limit long-term watch usefulness");
        }
    }

    if (deviceType === "accessory") {
        if (compatibilityStatus === "current") {
            score += 20;
            reasons.push("Accessory is compatible with current standards");
        } else if (compatibilityStatus === "limited") {
            score -= 5;
            weaknesses.push("Accessory compatibility is limited");
        } else if (compatibilityStatus === "obsolete") {
            score -= 25;
            weaknesses.push("Accessory standard is obsolete");
        } else {
            reasons.push("Accessory future-proofing depends on compatibility and condition");
        }
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    let rating = "Limited";
    let color = "red";

    if (score >= 85) {
        rating = "Maximum";
        color = "green";
    } else if (score >= 70) {
        rating = "High";
        color = "green";
    } else if (score >= 50) {
        rating = "Balanced";
        color = "yellow";
    } else if (score >= 35) {
        rating = "Limited";
        color = "orange";
    }

    return {
        futureProofScore: score,
        futureProofRating: rating,
        futureProofColor: color,
        futureProofReasons: reasons,
        futureProofWeaknesses: weaknesses,
        aiSupport: ai,
        supportLifespan: support
    };
}

// ======================
// FUTURE UPGRADE TARGET
// ======================
function getRecommendedFutureUpgradeTarget(item) {
    const deviceType = detectDeviceType(item);
    const model = String(item.model || "");
    const modelLower = model.toLowerCase();
    const modelYear = Number(item.modelYear || new Date().getFullYear());
    const expectedKeepYears = Number(item.expectedKeepYears || item.expectedYearsOfUse || 4);
    const targetYear = modelYear + expectedKeepYears;
    const futureProof = calculateFutureProofScore(item);

    let target = "Next meaningful upgrade";
    let recommendedSpecs = "";
    let avoid = "";
    let reason = "";

    if (deviceType === "phone") {
        const iPhoneMatch = model.match(/iPhone\s+(\d+)/i);
        const currentGeneration = iPhoneMatch ? Number(iPhoneMatch[1]) : null;
        const isIPhone = modelLower.includes("iphone");
        const isPro = modelLower.includes("pro");
        const isProMax = modelLower.includes("pro max");
        const isSamsung = modelLower.includes("galaxy") || modelLower.includes("samsung");
        const isPixel = modelLower.includes("pixel");

        if (isIPhone && currentGeneration) {
            const targetGeneration = currentGeneration + expectedKeepYears;
            target = `iPhone ${targetGeneration}${isProMax ? " Pro Max" : isPro ? " Pro" : ""}`;
        } else if (isSamsung) {
            target = "Future Samsung Ultra-class Galaxy phone";
        } else if (isPixel) {
            target = "Future Google Pixel Pro-class phone";
        } else {
            target = "Future flagship phone with strong AI hardware";
        }

        recommendedSpecs = "256GB minimum, 512GB recommended, 12GB+ RAM preferred for long-term AI features";
        avoid = "Avoid low-RAM or 128GB-only models if you plan to keep the next phone long term";
        reason = "Phones age mostly through battery, storage, AI feature headroom, camera needs, and software support.";
    }

    if (deviceType === "tablet") {
        const isAndroidTablet = modelLower.includes("galaxy tab") || modelLower.includes("pixel tablet") || modelLower.includes("android");
        target = isAndroidTablet
            ? "Future Pro/Ultra-class Android tablet"
            : "iPad Air/Pro-class tablet depending on use";
        recommendedSpecs = "256GB minimum, 12GB+ RAM preferred for heavier AI/productivity use, keyboard/Pencil support if needed";
        avoid = "Avoid low storage if using it for school, drawing, content, or productivity";
        reason = "Tablets age through chip support, storage, accessory support, and whether they are used casually or as laptop replacements.";
    }

    if (deviceType === "computer") {
        const isWindowsOrAndroidChip = modelLower.includes("windows") || modelLower.includes("snapdragon");
        target = isWindowsOrAndroidChip
            ? "Modern AI-capable computer with stronger memory and storage headroom"
            : "Apple silicon computer with stronger memory and storage headroom";
        recommendedSpecs = "16GB memory minimum, 24GB+ preferred for heavier use, 512GB+ storage";
        avoid = "Avoid base memory/storage if this will be a main computer";
        reason = "Computers age mostly through memory, storage, processor headroom, ports, thermals, workload, and OS support.";
    }

    if (deviceType === "watch") {
        target = "Newer watch with current health sensors and stronger battery life";
        recommendedSpecs = "Current sensor package, good battery health, preferred case size";
        avoid = "Avoid upgrading yearly unless battery, sensors, or support are limiting";
        reason = "Watches are worth replacing when battery, health sensors, or software support become limiting.";
    }

    if (deviceType === "accessory") {
        target = "Current-standard compatible replacement";
        recommendedSpecs = "USB-C, MagSafe, Qi2, Bluetooth LE, or current standard depending on accessory";
        avoid = "Avoid older connector standards unless needed for legacy devices";
        reason = "Accessories age mostly through compatibility, connector standards, battery condition, and reliability.";
    }

    return {
        futureUpgradeTarget: target,
        targetYear,
        recommendedFutureSpecs: recommendedSpecs,
        avoidRecommendation: avoid,
        futureUpgradeReason: reason,
        futureProofRating: futureProof.futureProofRating,
        futureProofScore: futureProof.futureProofScore,
        futureProofColor: futureProof.futureProofColor
    };
}

// ======================
// UPGRADE PRIORITY LABEL
// ======================
function getUpgradePriorityLabel(item, upgradeScore, support, upgrade) {
    const condition = String(item.condition || "").toLowerCase();
    const ownershipConfig = getOwnershipConfig(item);

    if (ownershipConfig.mode === "archive") {
        return { label: "Not Needed", color: "green", level: "not-needed" };
    }

    if (condition === "retired") {
        return { label: "Not Needed", color: "green", level: "not-needed" };
    }

    if (!support.supported || condition === "needs repair") {
        return { label: "Critical", color: "red", level: "critical" };
    }

    if (upgrade.status === "Upgrade Recommended" && upgradeScore.score <= 40) {
        return { label: "Critical", color: "red", level: "critical" };
    }

    if (upgradeScore.score <= 55) {
        return { label: "Recommended", color: "yellow", level: "recommended" };
    }

    if (upgradeScore.score <= 75) {
        return { label: "Optional", color: "gray", level: "optional" };
    }

    return { label: "Not Needed", color: "green", level: "not-needed" };
}

// ======================
// RECOMMENDED UPGRADE YEAR
// ======================
function calculateRecommendedUpgradeYear(item, priority, support, upgradeScore) {
    const currentYear = new Date().getFullYear();
    const deviceType = detectDeviceType(item);
    const modelYear = Number(item.modelYear || currentYear);
    const condition = String(item.condition || "").toLowerCase();
    const ownershipConfig = getOwnershipConfig(item);

    if (ownershipConfig.mode === "archive") {
        return {
            year: "No active upgrade needed",
            window: ownershipConfig.label,
            timing: `This device is ${ownershipConfig.archiveSummary || ownershipConfig.label.toLowerCase()}.`
        };
    }

    const preferredCycle =
        Number(item.preferredUpgradeCycle) ||
        upgradeCycleDefaults[deviceType] ||
        4;

    const minimumGap =
        Number(item.minimumUpgradeGap) ||
        minimumUpgradeGapDefaults[deviceType] ||
        3;

    const supportEndYear = item.supportEndYear ? Number(item.supportEndYear) : null;
    const batteryHealth = Number(item.batteryHealth ?? 100);
    const cycles = getBatteryCycles(item);

    if (deviceType === "accessory") {
        if (condition === "needs repair") {
            return { year: currentYear, window: `${currentYear}`, timing: "Replace now if this accessory is still needed." };
        }

        return {
            year: "Replace only when needed",
            window: "Condition-based",
            timing: "Accessories should only be replaced when broken, unsupported, or no longer useful."
        };
    }

    if (condition === "retired") {
        return {
            year: "No active upgrade needed",
            window: "Retired",
            timing: "This device is retired, so it does not need an upgrade unless you are replacing its role."
        };
    }

    let recommendedYear = modelYear + preferredCycle;
    const earliestAllowedYear = modelYear + minimumGap;

    if (supportEndYear && supportEndYear < recommendedYear) recommendedYear = supportEndYear;
    if (!support.supported) recommendedYear = currentYear;

    if (batteryHealth < techThresholds.batteryCritical) {
        recommendedYear = Math.min(recommendedYear, currentYear);
    } else if (batteryHealth < techThresholds.batteryBad) {
        recommendedYear = Math.min(recommendedYear, currentYear + 1);
    }

    if (cycles >= techThresholds.cycleVeryOld) {
        recommendedYear = Math.min(recommendedYear, currentYear);
    } else if (cycles >= techThresholds.cycleOld) {
        recommendedYear = Math.min(recommendedYear, currentYear + 1);
    }

    if (condition === "needs repair") recommendedYear = currentYear;

    const hasMajorIssue =
        !support.supported ||
        condition === "needs repair" ||
        batteryHealth < techThresholds.batteryCritical ||
        cycles >= techThresholds.cycleVeryOld ||
        upgradeScore.score <= 40;

    if (!hasMajorIssue && recommendedYear < earliestAllowedYear) {
        recommendedYear = earliestAllowedYear;
    }

    let window = `${recommendedYear}–${recommendedYear + 1}`;
    let timing = `Plan around ${recommendedYear}.`;

    if (priority.level === "critical") {
        window = `${currentYear}`;
        timing = "Upgrade as soon as practical.";
    } else if (priority.level === "recommended") {
        timing = `Upgrade around ${recommendedYear}, especially if battery life, support, or performance gets worse.`;
    } else if (priority.level === "optional") {
        timing = `Consider upgrading around ${recommendedYear}, but it is not urgent.`;
    } else {
        timing = `Keep using this device. A realistic upgrade target is around ${recommendedYear}.`;
    }

    return { year: recommendedYear, window, timing };
}

// ======================
// UPGRADE EXPLANATION
// ======================
function generateUpgradeExplanation(item, priority, recommendedUpgrade, upgrade, support, osStatus, upgradeScore) {
    const triggers = upgrade.triggers || [];
    const deviceType = detectDeviceType(item);
    const condition = item.condition || "Unknown";
    const batteryHealth = Number(item.batteryHealth ?? 100);
    const cycles = getBatteryCycles(item);

    let reasons = [];

    if (triggers.length > 0) reasons = [...triggers];
    if (condition === "Excellent" || condition === "Good") reasons.push(`Condition is ${condition.toLowerCase()}`);
    if (support.supportLevel) reasons.push(`Support status is ${support.supportLevel.toLowerCase()}`);
    if (osStatus && osStatus.isBeta) reasons.push("Running beta software does not count against the device score");
    if (batteryHealth >= techThresholds.batteryBad) reasons.push("Battery health is still acceptable");
    if (cycles < techThresholds.cycleOld) reasons.push("Charge cycles are below your upgrade threshold");

    const reasonText = reasons.length > 0 ? reasons.join(", ") : "No major issues detected";

    if (priority.level === "critical") {
        return `${priority.label} — ${recommendedUpgrade.timing} This ${deviceType} has enough major concerns to justify replacement. Main reasons: ${reasonText}.`;
    }

    if (priority.level === "recommended") {
        return `${priority.label} — ${recommendedUpgrade.timing} This ${deviceType} is still usable, but replacement is becoming the smarter long-term choice. Main reasons: ${reasonText}.`;
    }

    if (priority.level === "optional") {
        return `${priority.label} — ${recommendedUpgrade.timing} This ${deviceType} does not need to be replaced immediately. Upgrade only if you want newer features, better battery life, or better performance. Main reasons: ${reasonText}.`;
    }

    return `${priority.label} — ${recommendedUpgrade.timing} This ${deviceType} is still useful enough to keep. There is not enough reason to replace it right now. Main reasons: ${reasonText}.`;
}

// ======================
// SMART UPGRADE RECOMMENDATION
// ======================
function calculateSmartUpgradeRecommendation(item, upgrade, support, osStatus, upgradeScore) {
    const priority = getUpgradePriorityLabel(item, upgradeScore, support, upgrade);
    const recommendedUpgrade = calculateRecommendedUpgradeYear(item, priority, support, upgradeScore);

    const explanation = generateUpgradeExplanation(
        item,
        priority,
        recommendedUpgrade,
        upgrade,
        support,
        osStatus,
        upgradeScore
    );

    return {
        priority,
        recommendedUpgradeYear: recommendedUpgrade.year,
        upgradeWindow: recommendedUpgrade.window,
        timing: recommendedUpgrade.timing,
        explanation
    };
}

// ======================
// UPGRADE DATA
// ======================
function calculateUpgradeData(item) {
    const now = new Date();
    let boughtDate = null;

    if (item.dateBought && typeof item.dateBought.toDate === "function") {
        boughtDate = item.dateBought.toDate();
    } else if (item.dateBought) {
        boughtDate = new Date(item.dateBought);
    }

    let ageYears = 0;
    if (boughtDate && !isNaN(boughtDate.getTime())) {
        ageYears = (now - boughtDate) / (1000 * 60 * 60 * 24 * 365);
    }

    const batteryHealth = Number(item.batteryHealth ?? 100);
    const cycles = getBatteryCycles(item);
    const osStatus = checkOSStatus(item.osVersion);
    const support = checkDeviceSupport(item);
    const deviceType = detectDeviceType(item);
    const condition = String(item.condition || "").toLowerCase();

    const isPhone = deviceType === "phone";
    const isComputer = deviceType === "computer";

    const batteryBad = batteryHealth < techThresholds.batteryBad;
    const batteryCritical = batteryHealth < techThresholds.batteryCritical;
    const cycleOld = cycles >= techThresholds.cycleOld;
    const cycleVeryOld = cycles >= techThresholds.cycleVeryOld;
    const ageOld = ageYears > 3;
    const ageVeryOld = ageYears > 4;
    const outdatedOS = osStatus && osStatus.isBehindPublic && osStatus.status === "Very Outdated";

    let status = "Great";
    let color = "green";
    let suggestion = "No upgrade needed";
    let triggers = [];

    const ownershipConfig = getOwnershipConfig(item);
    if (ownershipConfig.mode === "archive") {
        return {
            status: ownershipConfig.label,
            color: "gray",
            suggestion: "No active tracking needed",
            triggers: [`Device is ${ownershipConfig.archiveSummary || ownershipConfig.label.toLowerCase()}`]
        };
    }

    if (isPhone && batteryBad) triggers.push("Battery below 85%");
    if (osStatus && osStatus.isBehindPublic) triggers.push("OS is outdated");
    if (isComputer && osStatus && osStatus.isBehindPublic) triggers.push("OS support/update concern");
    if (cycleOld) triggers.push(`Charge cycles over ${techThresholds.cycleOld}`);
    if (cycleVeryOld) triggers.push(`Charge cycles reached ${techThresholds.cycleVeryOld}+`);
    if (ageOld) triggers.push("Device older than 3 years");

    if (condition === "retired") {
        triggers.push("Device is retired");
    } else if (!support.supported) {
        triggers.push("Device no longer supported");
    }

    if (
        batteryCritical ||
        cycleVeryOld ||
        ageVeryOld ||
        outdatedOS ||
        (!support.supported && condition !== "retired")
    ) {
        status = "Upgrade Recommended";
        color = "red";
        suggestion = "Consider upgrading soon";
    } else if (
        batteryBad ||
        cycleOld ||
        ageOld ||
        support.supportLevel === "Limited Support" ||
        support.supportLevel === "Older Device" ||
        support.supportLevel === "Support Ending Soon" ||
        support.supportLevel === "Support Ending Next Year"
    ) {
        status = "Aging";
        color = "yellow";
        suggestion = "Monitor closely";
    }

    if (condition === "retired") {
        status = "Retired";
        color = "gray";
        suggestion = "No active upgrade needed";
    }

    return { status, color, suggestion, triggers };
}

// ======================
// RECOMMENDED ACTION
// ======================
function getRecommendedAction(item, upgrade, support, osStatus) {
    const batteryHealth = Number(item.batteryHealth ?? 100);
    const cycles = getBatteryCycles(item);
    const condition = String(item.condition || "").toLowerCase();
    const ownershipConfig = getOwnershipConfig(item);

    if (ownershipConfig.mode === "archive") return "No active upgrade needed";
    if (condition === "retired" || support.supportLevel === "Retired") return "No active upgrade needed";
    if (condition === "needs repair") return "Repair or replace depending on cost";
    if (!support.supported) return "Plan upgrade soon";

    if (upgrade.status === "Upgrade Recommended") {
        if (cycles >= techThresholds.cycleVeryOld && batteryHealth >= techThresholds.batteryBad) {
            return "Keep for now, but monitor battery cycles closely";
        }

        return "Plan upgrade soon";
    }

    if (batteryHealth < techThresholds.batteryBad && batteryHealth >= techThresholds.batteryCritical) {
        return "Consider battery replacement";
    }

    if (cycles >= techThresholds.cycleVeryOld) return "Monitor battery cycles closely";
    if (upgrade.status === "Aging") return "Monitor closely";

    return "Keep";
}

// ======================
// AUTO DEVICE SUMMARY
// ======================
function generateDeviceSummary(item, upgrade, support, osStatus) {
    const deviceType = detectDeviceType(item);
    const primaryUse = item.primaryUse || "";
    const condition = item.condition || "";
    const batteryHealth = Number(item.batteryHealth ?? 100);
    const cycles = getBatteryCycles(item);
    const ownershipConfig = getOwnershipConfig(item);

    if (ownershipConfig.mode === "archive") {
        return `This ${deviceType} is ${ownershipConfig.archiveSummary || ownershipConfig.label.toLowerCase()}.`;
    }

    let parts = [];

    if (primaryUse) {
        parts.push(`Used for ${String(primaryUse).toLowerCase()}`);
    } else {
        parts.push(`This ${deviceType} is being tracked`);
    }

    if (condition) parts.push(`condition is ${String(condition).toLowerCase()}`);

    if (osStatus && osStatus.isBeta) {
        parts.push("running beta software");
    } else if (osStatus && osStatus.isBehindPublic) {
        parts.push("behind the latest public OS");
    } else if (osStatus && osStatus.isPublicLatest) {
        parts.push("on the latest public OS");
    }

    if (support.supportLevel) parts.push(`support status is ${String(support.supportLevel).toLowerCase()}`);
    if (deviceType === "phone" && batteryHealth < techThresholds.batteryBad) parts.push("battery health is below your preferred threshold");
    if (cycles >= techThresholds.cycleVeryOld) parts.push("battery cycles are at your upgrade-level threshold");
    else if (cycles >= techThresholds.cycleOld) parts.push("battery cycles are worth monitoring");

    if (upgrade.status === "Upgrade Recommended") parts.push("upgrade planning is recommended");
    else if (upgrade.status === "Aging") parts.push("monitoring is recommended");
    else if (upgrade.status === "Retired") parts.push("no active upgrade is needed");
    else parts.push("no major upgrade concern right now");

    return parts.join(", ") + ".";
}


/* ------------------------------------------------------------
   EXTRA TECH HELPERS
------------------------------------------------------------ */
function getFirstField(item, keys, fallback = "") {
    for (const key of keys) {
        const value = item[key];
        if (value !== null && value !== undefined && String(value).trim() !== "") {
            return value;
        }
    }

    return fallback;
}

function getNumberField(item, keys, fallback = 0) {
    for (const key of keys) {
        const value = item[key];
        if (value !== null && value !== undefined && String(value).trim() !== "") {
            const cleaned = String(value).replace(/[$,\s]/g, "");
            const numberValue = Number(cleaned);
            if (!isNaN(numberValue)) return numberValue;
        }
    }

    return fallback;
}

function normalizeTechItem(itemData) {
    const normalized = { ...itemData };

    normalized.name = getFirstField(itemData, ["name", "deviceName", "title"], "Unnamed Device");
    normalized.model = getFirstField(itemData, ["model", "modelName", "deviceModel"], "");
    normalized.primaryUse = getFirstField(itemData, ["primaryUse", "use", "usage", "mainUse"], "");
    normalized.condition = getFirstField(itemData, ["condition", "status", "deviceCondition"], "");
    normalized.deviceType = getFirstField(itemData, ["deviceType", "type", "category"], "");
    normalized.modelYear = getFirstField(itemData, ["modelYear", "year", "releaseYear"], "");
    normalized.supportEndYear = getFirstField(itemData, ["supportEndYear", "endOfSupportYear", "securityEndYear"], "");
    normalized.iconClass = getFirstField(itemData, ["iconClass", "fontAwesomeIcon", "icon"], "fas fa-question-circle");
    normalized.material = getFirstField(itemData, ["material", "buildMaterial", "build"], "");
    normalized.storage = getFirstField(itemData, ["storage", "storageText", "storageLabel"], "");
    normalized.batteryCapacity = getFirstField(itemData, ["batteryCapacity", "batteryCapacityMah", "batteryCapacitymAh"], "");
    normalized.color = getFirstField(itemData, ["color", "colour", "finish"], "");
    normalized.dateReleased = getFirstField(itemData, ["dateReleased", "releaseDate", "released"], "");
    normalized.dateBought = getFirstField(itemData, ["dateBought", "purchaseDate", "datePurchased", "boughtDate"], "");
    normalized.osVersion = getFirstField(itemData, ["osVersion", "operatingSystem", "softwareVersion", "os"], "");
    normalized.chipName = getFirstField(itemData, ["chipName", "chip", "processor", "cpu", "soc"], "");

    normalized.ramGB = getNumberField(itemData, ["ramGB", "ram", "memoryGB", "memory", "ramMemoryGB"], 0);
    normalized.storageGB = getNumberField(itemData, ["storageGB", "storageCapacityGB", "capacityGB", "storageCapacity"], 0);
    normalized.priceNumber = getNumberField(itemData, ["price", "purchasePrice", "cost", "msrp"], 0);

    // Ownership / roadmap fields
    normalized.ownershipState = getFirstField(itemData, ["ownershipState", "state"], "");
    normalized.plannedStatus = getFirstField(itemData, ["plannedStatus"], "");
    normalized.plannedWindow = getFirstField(itemData, ["plannedWindow", "plannedFor"], "");
    normalized.plannedReason = getFirstField(itemData, ["plannedReason", "reason"], "");
    normalized.futureUpgradeTarget = getFirstField(itemData, ["futureUpgradeTarget", "plannedRole"], "");
    normalized.targetYear = getFirstField(itemData, ["targetYear"], "");
    normalized.replacesDevice = getFirstField(itemData, ["replacesDevice", "replaces"], "");
    normalized.expectedChip = getFirstField(itemData, ["expectedChip"], "");
    normalized.expectedStorage = getFirstField(itemData, ["expectedStorage"], "");
    normalized.expectedRam = getFirstField(itemData, ["expectedRam"], "");
    normalized.expectedColor = getFirstField(itemData, ["expectedColor"], "");
    normalized.expectedAILevel = getFirstField(itemData, ["expectedAILevel"], "");
    normalized.expectedFutureProofRating = getFirstField(itemData, ["expectedFutureProofRating"], "");

    // Role / lifecycle automation fields from admin.js
    normalized.currentRole = getFirstField(itemData, ["currentRole", "role", "deviceRole"], "");
    normalized.previousRole = getFirstField(itemData, ["previousRole", "priorRole", "oldRole"], "");
    normalized.roleStatus = getFirstField(itemData, ["roleStatus", "lifecycleStatus"], "");
    normalized.replacedByDevice = getFirstField(itemData, ["replacedByDevice", "replacedBy"], "");
    normalized.successorDevice = getFirstField(itemData, ["successorDevice", "successor"], "");
    normalized.predecessorDevice = getFirstField(itemData, ["predecessorDevice", "predecessor"], "");
    normalized.roleChangedDate = getFirstField(itemData, ["roleChangedDate", "roleUpdatedAt", "roleChangeDate"], "");
    normalized.autoRoleManaged = itemData.autoRoleManaged === true || String(itemData.autoRoleManaged || "").toLowerCase() === "true";

    return normalized;
}

function parseTechDate(value) {
    if (!value) return null;

    let dateValue;

    if (value && typeof value.toDate === "function") {
        dateValue = value.toDate();
    } else {
        dateValue = new Date(value);
    }

    if (isNaN(dateValue.getTime())) return null;
    return dateValue;
}

function formatTechDate(value) {
    const dateValue = parseTechDate(value);
    if (!dateValue) return "";

    return dateValue.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function getOSIconClass(osType) {
    const appleTypes = ["ios", "ipados", "macos", "watchos", "tvos", "visionos"];
    const androidTypes = [
        "android", "oneui", "pixelui", "oxygenos", "coloros", "realmeui", "miui",
        "hyperos", "magicos", "emui", "harmonyos", "funtouchos", "originos",
        "nothingos", "motorolahello", "zenui", "rogui", "xos", "hios", "flymeos",
        "androidtv", "googletv"
    ];
    const linuxTypes = [
        "linux", "ubuntu", "debian", "fedora", "arch", "manjaro", "linuxmint",
        "popos", "elementaryos", "zorinos", "opensuse", "kali", "tails", "redhat",
        "rocky", "almalinux"
    ];

    if (appleTypes.includes(osType)) return "fab fa-apple";
    if (androidTypes.includes(osType)) return "fab fa-android";
    if (osType === "windows" || osType === "windowsphone" || osType === "windowsserver") return "fab fa-windows";
    if (linuxTypes.includes(osType)) return "fab fa-linux";
    if (osType === "chromeos" || osType === "chromiumos") return "fab fa-chrome";
    if (osType === "playstation") return "fab fa-playstation";
    if (osType === "xbox") return "fab fa-xbox";
    if (osType === "steamos") return "fab fa-steam";

    return "fas fa-code-branch";
}

function calculateCoverageStatus(item) {
    const coverageDateRaw = getFirstField(item, [
        "coverageEndDate",
        "warrantyEndDate",
        "appleCareEndDate",
        "insuranceEndDate",
        "protectionPlanEndDate"
    ], "");

    const coverageDate = parseTechDate(coverageDateRaw);

    if (!coverageDate) {
        return {
            hasCoverageData: false,
            label: "Not Listed",
            color: "gray",
            detail: "Coverage end date not listed."
        };
    }

    const now = new Date();
    const daysRemaining = Math.ceil((coverageDate - now) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
        return {
            hasCoverageData: true,
            label: "Expired",
            color: "red",
            detail: `Expired on ${formatTechDate(coverageDateRaw)}`
        };
    }

    if (daysRemaining <= 30) {
        return {
            hasCoverageData: true,
            label: "Ending Soon",
            color: "yellow",
            detail: `Ends ${formatTechDate(coverageDateRaw)} (${daysRemaining} days left)`
        };
    }

    return {
        hasCoverageData: true,
        label: "Active",
        color: "green",
        detail: `Ends ${formatTechDate(coverageDateRaw)} (${daysRemaining} days left)`
    };
}

function calculateCostEfficiency(item) {
    const priceNumber = Number(item.priceNumber || 0);
    const age = calculateDeviceAge(item.dateBought);

    if (!priceNumber || !age || age.days <= 0) {
        return null;
    }

    const costPerDay = priceNumber / Math.max(age.days, 1);
    const costPerYear = priceNumber / Math.max(age.years, 0.1);

    return {
        costPerDay,
        costPerYear,
        label: `$${costPerYear.toFixed(0)}/year • $${costPerDay.toFixed(2)}/day`
    };
}

function calculateBackupPriority(item, osStatus, support) {
    const deviceType = detectDeviceType(item);
    const primaryUse = String(item.primaryUse || "").toLowerCase();
    const storageGB = Number(item.storageGB || 0);

    let label = "Normal";
    let color = "green";
    let reason = "Normal backup priority.";

    if (
        deviceType === "computer" ||
        primaryUse.includes("daily") ||
        primaryUse.includes("main") ||
        primaryUse.includes("school") ||
        primaryUse.includes("work") ||
        storageGB >= 512
    ) {
        label = "High";
        color = "yellow";
        reason = "This device likely holds important daily-use data.";
    }

    if (!support.supported || (osStatus && osStatus.status === "Very Outdated")) {
        label = "Critical";
        color = "red";
        reason = "Back up before repair, retirement, or replacement planning.";
    }

    return { label, color, reason };
}

const ownershipStateConfig = {
    owned: {
        label: "Owned",
        mode: "active",
        badgeClass: "owned",
        archiveSummary: null
    },
    borrowed: {
        label: "Borrowed",
        mode: "active",
        badgeClass: "borrowed",
        archiveSummary: null
    },
    "loaned-out": {
        label: "Loaned Out",
        mode: "active",
        badgeClass: "loaned-out",
        archiveSummary: null
    },
    "school-issued": {
        label: "School-Issued",
        mode: "active",
        badgeClass: "school-issued",
        archiveSummary: null
    },
    "work-issued": {
        label: "Work-Issued",
        mode: "active",
        badgeClass: "work-issued",
        archiveSummary: null
    },
    "in-repair": {
        label: "In Repair",
        mode: "active",
        badgeClass: "in-repair",
        archiveSummary: null
    },
    planned: {
        label: "Planned",
        mode: "roadmap",
        badgeClass: "planned",
        archiveSummary: null
    },
    "coming-soon": {
        label: "Coming Soon",
        mode: "roadmap",
        badgeClass: "coming-soon",
        archiveSummary: null
    },
    "future-upgrade": {
        label: "Future Upgrade",
        mode: "roadmap",
        badgeClass: "future-upgrade",
        archiveSummary: null
    },
    preordered: {
        label: "Preordered",
        mode: "roadmap",
        badgeClass: "preordered",
        archiveSummary: null
    },
    ordered: {
        label: "Ordered",
        mode: "roadmap",
        badgeClass: "ordered",
        archiveSummary: null
    },
    reserved: {
        label: "Reserved",
        mode: "roadmap",
        badgeClass: "reserved",
        archiveSummary: null
    },
    wishlist: {
        label: "Wishlist",
        mode: "wishlist",
        badgeClass: "wishlist",
        archiveSummary: null
    },
    considering: {
        label: "Considering",
        mode: "wishlist",
        badgeClass: "considering",
        archiveSummary: null
    },
    researching: {
        label: "Researching",
        mode: "wishlist",
        badgeClass: "researching",
        archiveSummary: null
    },
    retired: {
        label: "Retired",
        mode: "archive",
        badgeClass: "retired",
        archiveSummary: "retired and kept as an archive entry"
    },
    sold: {
        label: "Sold",
        mode: "archive",
        badgeClass: "sold",
        archiveSummary: "sold and kept as an archive entry"
    },
    "traded-in": {
        label: "Traded In",
        mode: "archive",
        badgeClass: "traded-in",
        archiveSummary: "traded in and kept as an archive entry"
    },
    donated: {
        label: "Donated",
        mode: "archive",
        badgeClass: "donated",
        archiveSummary: "donated and kept as an archive entry"
    },
    recycled: {
        label: "Recycled",
        mode: "archive",
        badgeClass: "recycled",
        archiveSummary: "recycled and kept as an archive entry"
    },
    returned: {
        label: "Returned",
        mode: "archive",
        badgeClass: "returned",
        archiveSummary: "returned and kept as an archive entry"
    },
    lost: {
        label: "Lost",
        mode: "archive",
        badgeClass: "lost",
        archiveSummary: "lost and kept as an archive entry"
    }
};

function normalizeOwnershipStateValue(value) {
    const rawState = String(value || "owned").toLowerCase().trim();
    const normalizedState = rawState
        .replace(/[\s_]+/g, "-")
        .replace(/--+/g, "-");

    const aliases = {
        own: "owned",
        active: "owned",
        current: "owned",
        plan: "planned",
        future: "planned",
        comingsoon: "coming-soon",
        "coming-soon": "coming-soon",
        futureupgrade: "future-upgrade",
        "future-upgrade": "future-upgrade",
        preorder: "preordered",
        "pre-order": "preordered",
        "pre-ordered": "preordered",
        preordered: "preordered",
        order: "ordered",
        ordered: "ordered",
        reserve: "reserved",
        reserved: "reserved",
        wish: "wishlist",
        wishlist: "wishlist",
        considering: "considering",
        research: "researching",
        researching: "researching",
        borrowed: "borrowed",
        loaned: "loaned-out",
        "loaned-out": "loaned-out",
        lent: "loaned-out",
        school: "school-issued",
        "school-issued": "school-issued",
        work: "work-issued",
        "work-issued": "work-issued",
        repair: "in-repair",
        repairing: "in-repair",
        "in-repair": "in-repair",
        retired: "retired",
        archived: "retired",
        sold: "sold",
        tradein: "traded-in",
        "trade-in": "traded-in",
        "traded-in": "traded-in",
        donated: "donated",
        recycled: "recycled",
        returned: "returned",
        lost: "lost"
    };

    return aliases[normalizedState] || normalizedState || "owned";
}

function getOwnershipState(item) {
    return normalizeOwnershipStateValue(item.ownershipState || "owned");
}

function getOwnershipConfig(itemOrState) {
    const state = typeof itemOrState === "string"
        ? normalizeOwnershipStateValue(itemOrState)
        : getOwnershipState(itemOrState || {});

    return ownershipStateConfig[state] || {
        label: state
            .split("-")
            .filter(Boolean)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ") || "Owned",
        mode: "active",
        badgeClass: state || "owned",
        archiveSummary: null
    };
}

function isRoadmapTechItem(item) {
    return getOwnershipConfig(item).mode === "roadmap";
}

function isWishlistTechItem(item) {
    return getOwnershipConfig(item).mode === "wishlist";
}

function isPlannedTechItem(item) {
    const mode = getOwnershipConfig(item).mode;
    return mode === "roadmap" || mode === "wishlist";
}

function isArchivedTechItem(item) {
    return getOwnershipConfig(item).mode === "archive";
}

function getOwnershipLabel(stateOrItem) {
    return getOwnershipConfig(stateOrItem).label;
}

function getOwnershipBadgeClass(stateOrItem) {
    return getOwnershipConfig(stateOrItem).badgeClass;
}


/* ------------------------------------------------------------
   TECH LIFECYCLE / ROLE DISPLAY HELPERS
   Supports admin role automation fields:
   currentRole, previousRole, roleStatus, replacedByDevice,
   successorDevice, predecessorDevice, roleChangedDate,
   autoRoleManaged.
------------------------------------------------------------ */
function hasTechLifecycleValue(value) {
    if (value === null || value === undefined) return false;
    const text = String(value).trim();
    return text !== "" && text.toLowerCase() !== "not set" && text.toLowerCase() !== "n/a";
}

function formatRoleStatusLabel(roleStatus) {
    if (!hasTechLifecycleValue(roleStatus)) return "";

    const labels = {
        primary: "Primary Device",
        secondary: "Secondary Device",
        backup: "Backup Device",
        "future-primary": "Future Primary Device",
        "replaced-owned": "Replaced but Owned",
        "replaced-sold": "Replaced and Sold",
        "replaced-archived": "Replaced and Archived",
        retired: "Retired",
        sold: "Sold",
        "traded-in": "Traded In",
        donated: "Donated",
        recycled: "Recycled",
        returned: "Returned",
        lost: "Lost",
        archived: "Archived"
    };

    const normalized = String(roleStatus).toLowerCase().trim();
    return labels[normalized] || normalized
        .split("-")
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatTechLifecycleDate(value) {
    if (!hasTechLifecycleValue(value)) return "";
    return formatTechDate(value) || String(value);
}

function renderTechAutomationBadge(item) {
    return item.autoRoleManaged
        ? `<span class="support-badge green tech-auto-role-badge"><i class="fas fa-wand-magic-sparkles"></i> Auto-managed</span>`
        : "";
}

function renderTechUpgradePathBlock({ fromDevice, toDevice, note = "", status = "", windowText = "" }) {
    if (!hasTechLifecycleValue(fromDevice) || !hasTechLifecycleValue(toDevice)) return "";

    return `
    <div class="tech-lifecycle-card tech-upgrade-path">
        <div class="tech-lifecycle-title">
            <i class="fas fa-route"></i>
            <span>Upgrade Path</span>
        </div>
        <div class="tech-lifecycle-flow">
            <span class="tech-lifecycle-node tech-lifecycle-from">${escapeHTML(fromDevice)}</span>
            <i class="fas fa-arrow-right"></i>
            <span class="tech-lifecycle-node tech-lifecycle-to">${escapeHTML(toDevice)}</span>
        </div>
        ${hasTechLifecycleValue(note) ? `<div class="tech-lifecycle-note">${escapeHTML(note)}</div>` : ""}
        ${hasTechLifecycleValue(status) || hasTechLifecycleValue(windowText) ? `
        <div class="tech-lifecycle-meta">
            ${hasTechLifecycleValue(status) ? `<span class="support-badge blue">${escapeHTML(status)}</span>` : ""}
            ${hasTechLifecycleValue(windowText) ? `<span>${escapeHTML(windowText)}</span>` : ""}
        </div>` : ""}
    </div>`;
}

function renderTechRoleTransitionBlock({ title, iconClass = "fas fa-right-left", fromRole = "", toRole = "", note = "", changedDate = "", badge = "" }) {
    if (!hasTechLifecycleValue(fromRole) && !hasTechLifecycleValue(toRole) && !hasTechLifecycleValue(note)) return "";

    return `
    <div class="tech-lifecycle-card tech-role-transition">
        <div class="tech-lifecycle-title">
            <i class="${escapeHTML(iconClass)}"></i>
            <span>${escapeHTML(title)}</span>
            ${badge || ""}
        </div>
        ${hasTechLifecycleValue(fromRole) && hasTechLifecycleValue(toRole) ? `
        <div class="tech-lifecycle-flow">
            <span class="tech-lifecycle-node tech-lifecycle-from">${escapeHTML(fromRole)}</span>
            <i class="fas fa-arrow-right"></i>
            <span class="tech-lifecycle-node tech-lifecycle-to">${escapeHTML(toRole)}</span>
        </div>` : ""}
        ${hasTechLifecycleValue(note) ? `<div class="tech-lifecycle-note">${escapeHTML(note)}</div>` : ""}
        ${hasTechLifecycleValue(changedDate) ? `<div class="tech-lifecycle-meta"><i class="fas fa-clock"></i> Updated ${escapeHTML(changedDate)}</div>` : ""}
    </div>`;
}

function renderTechDeviceLineageBlock(item) {
    const predecessor = item.predecessorDevice;
    const successor = item.successorDevice || item.replacedByDevice;
    const name = item.name;

    if (!hasTechLifecycleValue(predecessor) && !hasTechLifecycleValue(successor)) return "";

    const nodes = [];
    if (hasTechLifecycleValue(predecessor)) nodes.push(`<span class="tech-lifecycle-node tech-lifecycle-from">${escapeHTML(predecessor)}</span>`);
    nodes.push(`<span class="tech-lifecycle-node tech-lifecycle-current">${escapeHTML(name)}</span>`);
    if (hasTechLifecycleValue(successor)) nodes.push(`<span class="tech-lifecycle-node tech-lifecycle-to">${escapeHTML(successor)}</span>`);

    return `
    <div class="tech-lifecycle-card tech-device-lineage">
        <div class="tech-lifecycle-title">
            <i class="fas fa-timeline"></i>
            <span>Device Lineage</span>
            ${renderTechAutomationBadge(item)}
        </div>
        <div class="tech-lifecycle-flow">
            ${nodes.join(`<i class="fas fa-arrow-right"></i>`)}
        </div>
    </div>`;
}

function renderTechLifecycleSections(itemData, options = {}) {
    const item = normalizeTechItem(itemData);
    const ownershipConfig = getOwnershipConfig(item);
    const context = options.context || ownershipConfig.mode;

    const name = item.name || "Device";
    const predecessor = item.predecessorDevice || "";
    const successor = item.successorDevice || item.replacedByDevice || "";
    const replacesDevice = item.replacesDevice || "";
    const currentRole = item.currentRole || "";
    const previousRole = item.previousRole || "";
    const roleStatus = item.roleStatus || "";
    const roleStatusLabel = formatRoleStatusLabel(roleStatus);
    const changedDate = formatTechLifecycleDate(item.roleChangedDate);
    const autoBadge = renderTechAutomationBadge(item);

    let html = "";

    if (context === "roadmap" && hasTechLifecycleValue(replacesDevice)) {
        html += renderTechUpgradePathBlock({
            fromDevice: replacesDevice,
            toDevice: name,
            note: item.futureUpgradeTarget ? `Planned role: ${item.futureUpgradeTarget}` : "",
            status: getOwnershipLabel(item),
            windowText: item.plannedWindow ? `Expected: ${item.plannedWindow}` : ""
        });
    }

    if (context !== "roadmap" && hasTechLifecycleValue(predecessor)) {
        html += renderTechUpgradePathBlock({
            fromDevice: predecessor,
            toDevice: name,
            note: currentRole ? `Current role: ${currentRole}` : "",
            status: roleStatusLabel || getOwnershipLabel(item),
            windowText: changedDate ? `Transitioned: ${changedDate}` : ""
        });
    }

    if (hasTechLifecycleValue(successor)) {
        const title = ownershipConfig.mode === "archive" ? "Replaced By" : "Role Changed";
        const note = ownershipConfig.mode === "archive"
            ? `${successor} replaced this device in the lifecycle history.`
            : `${successor} is listed as the successor for this device.`;

        html += renderTechRoleTransitionBlock({
            title,
            iconClass: ownershipConfig.mode === "archive" ? "fas fa-box-archive" : "fas fa-right-left",
            fromRole: name,
            toRole: successor,
            note,
            changedDate,
            badge: autoBadge
        });
    }

    if (hasTechLifecycleValue(previousRole) || hasTechLifecycleValue(currentRole) || hasTechLifecycleValue(roleStatusLabel)) {
        html += `
        <div class="tech-lifecycle-card tech-role-details">
            <div class="tech-lifecycle-title">
                <i class="fas fa-id-card-clip"></i>
                <span>Role Details</span>
                ${autoBadge}
            </div>
            ${hasTechLifecycleValue(roleStatusLabel) ? `<div class="tech-detail"><i class="fas fa-tag"></i><span>Role Status:</span><span class="support-badge blue">${escapeHTML(roleStatusLabel)}</span></div>` : ""}
            ${hasTechLifecycleValue(previousRole) ? `<div class="tech-detail"><i class="fas fa-history"></i><span>Previous Role:</span><span class="tech-value">${escapeHTML(previousRole)}</span></div>` : ""}
            ${hasTechLifecycleValue(currentRole) ? `<div class="tech-detail"><i class="fas fa-location-dot"></i><span>Current Role:</span><span class="tech-value">${escapeHTML(currentRole)}</span></div>` : ""}
            ${hasTechLifecycleValue(changedDate) ? `<div class="tech-detail"><i class="fas fa-clock"></i><span>Role Updated:</span><span class="tech-value">${escapeHTML(changedDate)}</span></div>` : ""}
        </div>`;
    }

    html += renderTechDeviceLineageBlock(item);

    return html;
}

function renderPlannedTechItemHomepage(itemData) {
    const item = normalizeTechItem(itemData);

    const name = item.name || "Upcoming Device";
    const model = item.model || "Not set";
    const primaryUse = item.primaryUse || "Not set";
    const iconClass = item.iconClass || "fas fa-laptop";

    const ownershipState = getOwnershipState(item);
    const ownershipConfig = getOwnershipConfig(ownershipState);
    const ownershipLabel = ownershipConfig.label;
    const ownershipBadgeClass = ownershipConfig.badgeClass;

    const plannedWindow = item.plannedWindow || "Not set";
    const plannedReason = item.plannedReason || "Not set";
    const futureUpgradeTarget = item.futureUpgradeTarget || "Not set";
    const targetYear = item.targetYear || "Not set";
    const replacesDevice = item.replacesDevice || "Not set";

    const expectedChip = item.expectedChip || "Not set";
    const expectedRam = item.expectedRam || "Not set";
    const expectedStorage = item.expectedStorage || "Not set";
    const expectedColor = item.expectedColor || "Not set";
    const expectedAILevel = item.expectedAILevel || "Not set";
    const expectedFutureProofRating = item.expectedFutureProofRating || "Not set";

    const lifecycleSections = renderTechLifecycleSections(item, { context: ownershipConfig.mode });
    const replacesDeviceRow = hasTechLifecycleValue(item.replacesDevice)
        ? ""
        : `
            <div class="tech-detail">
                <i class="fas fa-right-left"></i>
                <span>Replaces Device:</span>
                <span class="tech-value">${escapeHTML(replacesDevice)}</span>
            </div>`;

    if (ownershipConfig.mode === "wishlist") {
        return `
        <div class="tech-item planned-tech-item ownership-${escapeHTML(ownershipBadgeClass)}">
            <h3>
                <i class="${escapeHTML(iconClass)}"></i>
                ${escapeHTML(name)}
            </h3>

            <div class="tech-detail">
                <i class="fas fa-info-circle"></i>
                <span>Model:</span>
                <span class="tech-value">${escapeHTML(model)}</span>
            </div>

            <div class="tech-detail">
                <i class="fas fa-id-badge"></i>
                <span>Ownership:</span>
                <span class="upgrade-badge ${escapeHTML(ownershipBadgeClass)}">
                    ${escapeHTML(ownershipLabel)}
                </span>
            </div>

            <div class="tech-detail">
                <i class="fas fa-bullseye"></i>
                <span>Primary Use:</span>
                <span class="tech-value">${escapeHTML(primaryUse)}</span>
            </div>

            ${lifecycleSections}
        </div>`;
    }

    if (ownershipConfig.mode === "roadmap") {
        return `
        <div class="tech-item planned-tech-item ownership-${escapeHTML(ownershipBadgeClass)}">
            <h3>
                <i class="${escapeHTML(iconClass)}"></i>
                ${escapeHTML(name)}
            </h3>

            <div class="tech-detail">
                <i class="fas fa-info-circle"></i>
                <span>Model:</span>
                <span class="tech-value">${escapeHTML(model)}</span>
            </div>

            <div class="tech-detail">
                <i class="fas fa-id-badge"></i>
                <span>Ownership:</span>
                <span class="upgrade-badge ${escapeHTML(ownershipBadgeClass)}">
                    ${escapeHTML(ownershipLabel)}
                </span>
            </div>

            <div class="tech-detail">
                <i class="fas fa-calendar-alt"></i>
                <span>Planned / Expected Window:</span>
                <span class="tech-value">${escapeHTML(plannedWindow)}</span>
            </div>

            <div class="tech-detail">
                <i class="fas fa-bullseye"></i>
                <span>Primary Use:</span>
                <span class="tech-value">${escapeHTML(primaryUse)}</span>
            </div>

            <div class="tech-detail">
                <i class="fas fa-circle-question"></i>
                <span>Reason:</span>
                <span class="tech-value">${escapeHTML(plannedReason)}</span>
            </div>

            <div class="tech-detail">
                <i class="fas fa-flag-checkered"></i>
                <span>Future Role:</span>
                <span class="tech-value">${escapeHTML(futureUpgradeTarget)}</span>
            </div>

            ${lifecycleSections}
            ${replacesDeviceRow}

            <div class="tech-detail">
                <i class="fas fa-calendar-check"></i>
                <span>Target Year:</span>
                <span class="tech-value">${escapeHTML(targetYear)}</span>
            </div>

            <details class="tech-advanced-details" open>
                <summary>Expected Specs</summary>

                <div class="tech-detail">
                    <i class="fas fa-microchip"></i>
                    <span>Expected Chip:</span>
                    <span class="tech-value">${escapeHTML(expectedChip)}</span>
                </div>

                <div class="tech-detail">
                    <i class="fas fa-memory"></i>
                    <span>Expected RAM:</span>
                    <span class="tech-value">${escapeHTML(expectedRam)}</span>
                </div>

                <div class="tech-detail">
                    <i class="fas fa-hard-drive"></i>
                    <span>Expected Storage:</span>
                    <span class="tech-value">${escapeHTML(expectedStorage)}</span>
                </div>

                <div class="tech-detail">
                    <i class="fas fa-palette"></i>
                    <span>Expected Color:</span>
                    <span class="tech-value">${escapeHTML(expectedColor)}</span>
                </div>

                <div class="tech-detail">
                    <i class="fas fa-brain"></i>
                    <span>Expected AI Support:</span>
                    <span class="tech-value status-green">${escapeHTML(expectedAILevel)}</span>
                </div>

                <div class="tech-detail">
                    <i class="fas fa-seedling"></i>
                    <span>Expected Future-Proofing:</span>
                    <span class="tech-value status-green">${escapeHTML(expectedFutureProofRating)}</span>
                </div>
            </details>
        </div>`;
    }

    return `
    <div class="tech-item planned-tech-item ownership-${escapeHTML(ownershipBadgeClass)}">
        <h3>
            <i class="${escapeHTML(iconClass)}"></i>
            ${escapeHTML(name)}
        </h3>

        <div class="tech-detail">
            <i class="fas fa-info-circle"></i>
            <span>Model:</span>
            <span class="tech-value">${escapeHTML(model)}</span>
        </div>

        <div class="tech-detail">
            <i class="fas fa-id-badge"></i>
            <span>Ownership:</span>
            <span class="upgrade-badge ${escapeHTML(ownershipBadgeClass)}">
                ${escapeHTML(ownershipLabel)}
            </span>
        </div>

        <div class="tech-detail">
            <i class="fas fa-bullseye"></i>
            <span>Primary Use:</span>
            <span class="tech-value">${escapeHTML(primaryUse)}</span>
        </div>

        ${lifecycleSections}
    </div>`;
}


/* ------------------------------------------------------------
   RENDER FUNCTION
------------------------------------------------------------ */
function renderTechItemHomepage(itemData) {
    const item = normalizeTechItem(itemData);

    if (isPlannedTechItem(item)) {
        return renderPlannedTechItemHomepage(item);
    }

    const name = item.name || "Unnamed Device";
    const model = item.model || "";
    const primaryUse = item.primaryUse || "";
    const condition = item.condition || "";
    const deviceType = item.deviceType || "";
    const modelYear = item.modelYear || "";
    const supportEndYear = item.supportEndYear || "";
    const iconClass = item.iconClass || "fas fa-question-circle";
    const material = item.material || "";
    const storage = item.storage || "";
    const batteryCapacity = item.batteryCapacity || "";
    const color = item.color || "";
    const price = item.priceNumber ? `$${item.priceNumber.toLocaleString()}` : "";
    const dateReleased = item.dateReleased || "";
    const dateBought = item.dateBought || "";
    const osVersion = item.osVersion || "";

    const ownershipConfig = getOwnershipConfig(item);
    const ownershipLabel = ownershipConfig.label;
    const ownershipBadgeClass = ownershipConfig.badgeClass;
    const lifecycleSections = renderTechLifecycleSections(item, { context: ownershipConfig.mode });

    const osStatus = checkOSStatus(item.osVersion);
    const support = checkDeviceSupport(item);
    const supportLife = estimateSupportLifespan(item);
    const aiSupport = calculateAIFeatureSupport(item);
    const futureProof = calculateFutureProofScore(item);
    const futureTarget = getRecommendedFutureUpgradeTarget(item);
    const futureAITarget = calculateFutureAITarget(item, futureTarget);
    const coverage = calculateCoverageStatus(item);
    const costEfficiency = calculateCostEfficiency(item);
    const backupPriority = calculateBackupPriority(item, osStatus, support);

    let osUpdateHtml = "";

    if (osStatus) {
        if (osStatus.isBehindPublic) {
            osUpdateHtml = `
            <div class="tech-detail">
                <i class="fas fa-download"></i>
                <span>Update:</span>
                Public software update recommended
            </div>`;
        } else if (osStatus.isBeta) {
            osUpdateHtml = `
            <div class="tech-detail">
                <i class="fas fa-flask"></i>
                <span>Beta Notice:</span>
                Running beta software ahead of public release
            </div>`;
        }
    }

    const supportHtml = `
    <div class="tech-detail">
        <i class="fas fa-shield-check"></i>
        <span>Support Status:</span>
        <span class="support-badge ${support.supportColor || "green"}">
            ${escapeHTML(support.supportLevel || "Fully Supported")}
        </span>
    </div>`;

    const coverageHtml = coverage.hasCoverageData ? `
    <div class="tech-detail">
        <i class="fas fa-file-shield"></i>
        <span>Coverage:</span>
        <span class="support-badge ${coverage.color}">${escapeHTML(coverage.label)}</span>
        ${escapeHTML(coverage.detail)}
    </div>` : "";

    const backupHtml = `
    <div class="tech-detail">
        <i class="fas fa-cloud-arrow-up"></i>
        <span>Backup Priority:</span>
        <span class="support-badge ${backupPriority.color}">${escapeHTML(backupPriority.label)}</span>
        ${escapeHTML(backupPriority.reason)}
    </div>`;

    const costHtml = costEfficiency ? `
    <div class="tech-detail">
        <i class="fas fa-chart-pie"></i>
        <span>Cost Efficiency:</span>
        ${escapeHTML(costEfficiency.label)}
    </div>` : "";

    const batteryHealth = item.batteryHealth !== null &&
        item.batteryHealth !== undefined &&
        !isNaN(item.batteryHealth)
        ? parseInt(item.batteryHealth, 10)
        : null;

    const rawBatteryCycles = item.batteryCycles ?? item.batteryChargeCycles;

    const batteryCycles = rawBatteryCycles !== null &&
        rawBatteryCycles !== undefined &&
        !isNaN(rawBatteryCycles)
        ? Number(rawBatteryCycles)
        : null;

    const upgrade = calculateUpgradeData(item);
    const age = calculateDeviceAge(item.dateBought);
    const batteryTrend = estimateBatteryTrend(item);
    const upgradeScore = calculateUpgradeScore(item);

    if (
        upgradeScore.score < 40 &&
        upgrade.status !== "Upgrade Recommended" &&
        upgrade.status !== "Retired"
    ) {
        upgrade.status = "Upgrade Recommended";
        upgrade.color = "red";
        upgrade.suggestion = "Consider upgrading soon";
    } else if (upgradeScore.score < 60 && upgrade.status === "Great") {
        upgrade.status = "Aging";
        upgrade.color = "yellow";
        upgrade.suggestion = "Monitor closely";
    }

    const recommendedAction = getRecommendedAction(item, upgrade, support, osStatus);

    const smartUpgrade = calculateSmartUpgradeRecommendation(
        item,
        upgrade,
        support,
        osStatus,
        upgradeScore
    );

    const deviceSummary = generateDeviceSummary(item, upgrade, support, osStatus);

    const summaryHtml = `
    <div class="tech-detail tech-summary">
        <i class="fas fa-clipboard-list"></i>
        <span>Device Summary:</span>
        ${escapeHTML(deviceSummary)}
    </div>`;

    const actionHtml = `
    <div class="tech-detail">
        <i class="fas fa-tools"></i>
        <span>Recommended Action:</span>
        ${escapeHTML(recommendedAction)}
    </div>`;

    let batteryHtml = "";

    if (batteryHealth !== null) {
        let batteryClass = "";

        if (batteryHealth <= 20) {
            batteryClass = "critical";
        } else if (batteryHealth <= 50) {
            batteryClass = "low-power";
        }

        const displayHealth = Math.min(Math.max(batteryHealth, 0), 100);

        batteryHtml = `
        <div class="tech-detail">
            <i class="fas fa-heart"></i>
            <span>Battery Health:</span>
        </div>

        <div class="battery-container">
            <div class="battery-icon ${batteryClass}">
                <div class="battery-level" style="width: ${displayHealth}%"></div>
                <div class="battery-percentage">${batteryHealth}%</div>
            </div>
        </div>`;
    }

    let cyclesHtml = "";

    if (batteryCycles !== null) {
        cyclesHtml = `
        <div class="tech-detail">
            <i class="fas fa-sync"></i>
            <span>Battery Charge Cycles:</span> ${batteryCycles}
        </div>`;
    }

    const upgradeHtml = `
    <div class="tech-detail">
        <i class="fas fa-arrow-up"></i>
        <span>Upgrade Status:</span>
        <span class="upgrade-badge ${upgrade.color}">
            ${escapeHTML(upgrade.status)}
        </span>
    </div>

    <div class="tech-detail">
        <i class="fas fa-lightbulb"></i>
        <span>Suggestion:</span>
        ${escapeHTML(upgrade.suggestion)}
    </div>`;

    let triggersHtml = "";

    if (upgrade.triggers && upgrade.triggers.length > 0) {
        triggersHtml = `
        <div class="tech-detail">
            <i class="fas fa-exclamation-circle"></i>
            <span>Upgrade Triggers:</span>
        </div>

        <ul class="upgrade-triggers">
            ${upgrade.triggers.map(t => `<li>${escapeHTML(t)}</li>`).join("")}
        </ul>`;
    }

    const smartUpgradeHtml = `
    <div class="tech-detail smart-upgrade-row">
        <i class="fas fa-calendar-check"></i>
        <span class="tech-label">Recommended Upgrade Year:</span>
        <span class="tech-value">${escapeHTML(smartUpgrade.recommendedUpgradeYear)}</span>
    </div>

    <div class="tech-detail smart-upgrade-row">
        <i class="fas fa-calendar-days"></i>
        <span class="tech-label">Upgrade Window:</span>
        <span class="tech-value">${escapeHTML(smartUpgrade.upgradeWindow)}</span>
    </div>

    <div class="tech-detail smart-upgrade-row">
        <i class="fas fa-ranking-star"></i>
        <span class="tech-label">Upgrade Priority:</span>
        <span class="upgrade-priority-badge ${smartUpgrade.priority.color}">
            ${escapeHTML(smartUpgrade.priority.label)}
        </span>
    </div>

    <div class="tech-detail tech-upgrade-explanation">
        <i class="fas fa-circle-question"></i>
        <span class="tech-label">Why:</span>
        <span class="upgrade-explanation-text">
            ${escapeHTML(smartUpgrade.explanation)}
        </span>
    </div>`;

    const futureProofHtml = `
    <div class="tech-detail smart-upgrade-row">
        <i class="fas fa-brain"></i>
        <span class="tech-label">Current AI Support:</span>
        <span class="support-badge ${aiSupport.aiSupportColor}">
            ${escapeHTML(aiSupport.aiSupportLevel)}
        </span>
    </div>

    <div class="tech-detail smart-upgrade-row">
        <i class="fas fa-wand-magic-sparkles"></i>
        <span class="tech-label">Future AI Target:</span>
        <span class="support-badge ${futureAITarget.color}">
            ${escapeHTML(futureAITarget.level)}
        </span>
    </div>

    <div class="tech-detail smart-upgrade-row">
        <i class="fas fa-hourglass-half"></i>
        <span class="tech-label">Estimated Major Support End:</span>
        <span class="tech-value">
            ${supportLife.estimatedMajorSupportEndYear ? escapeHTML(supportLife.estimatedMajorSupportEndYear) : "N/A"}
        </span>
    </div>

    <div class="tech-detail smart-upgrade-row">
        <i class="fas fa-shield-halved"></i>
        <span class="tech-label">Estimated Security Support End:</span>
        <span class="tech-value">
            ${supportLife.estimatedSecuritySupportEndYear ? escapeHTML(supportLife.estimatedSecuritySupportEndYear) : "N/A"}
        </span>
    </div>

    <div class="tech-detail smart-upgrade-row">
        <i class="fas fa-seedling"></i>
        <span class="tech-label">Future-Proof Rating:</span>
        <span class="support-badge ${futureProof.futureProofColor}">
            ${escapeHTML(futureProof.futureProofRating)} (${futureProof.futureProofScore}/100)
        </span>
    </div>

    <div class="tech-detail smart-upgrade-row">
        <i class="fas fa-bullseye"></i>
        <span class="tech-label">Future Upgrade Target:</span>
        <span class="tech-value">${escapeHTML(futureTarget.futureUpgradeTarget)}</span>
    </div>

    <div class="tech-detail smart-upgrade-row">
        <i class="fas fa-calendar-alt"></i>
        <span class="tech-label">Target Year:</span>
        <span class="tech-value">${escapeHTML(futureTarget.targetYear)}</span>
    </div>

    <div class="tech-detail tech-upgrade-explanation">
        <i class="fas fa-route"></i>
        <span class="tech-label">Future Specs:</span>
        <span class="upgrade-explanation-text">
            ${escapeHTML(futureTarget.recommendedFutureSpecs)}
        </span>
    </div>

    <div class="tech-detail tech-upgrade-explanation">
        <i class="fas fa-ban"></i>
        <span class="tech-label">Avoid:</span>
        <span class="upgrade-explanation-text">
            ${escapeHTML(futureTarget.avoidRecommendation)}
        </span>
    </div>`;

    const ageHtml = age ? `
    <div class="tech-detail">
        <i class="fas fa-clock"></i>
        <span>Device Age:</span>
        ${age.days} days (${age.years} years)
    </div>` : "";

    const trendHtml = batteryTrend && batteryTrend.decline !== undefined ? `
    <div class="tech-detail">
        <i class="fas fa-chart-line"></i>
        <span>Battery Trend:</span>
        ${escapeHTML(batteryTrend.trend)} (-${escapeHTML(batteryTrend.decline)}%)
    </div>` : "";

    const scoreHtml = `
    <div class="tech-detail">
        <i class="fas fa-gauge-high"></i>
        <span>Device Score:</span>
        ${escapeHTML(upgradeScore.label)} (${upgradeScore.score}/100)
    </div>

    <div class="score-bar">
        <div class="score-fill ${upgradeScore.color}" style="width: ${upgradeScore.score}%"></div>
    </div>`;

    const formattedOSType = osStatus ? formatOSType(osStatus.osType) : "";
    const osIconClass = osStatus ? getOSIconClass(osStatus.osType) : "fas fa-code-branch";

    const advancedDetailsContent = `
        ${deviceType ? `<div class="tech-detail"><i class="fas fa-microchip"></i><span>Device Type:</span> ${escapeHTML(deviceType)}</div>` : ""}
        ${modelYear ? `<div class="tech-detail"><i class="fas fa-calendar"></i><span>Model Year:</span> ${escapeHTML(modelYear)}</div>` : ""}
        ${supportEndYear ? `<div class="tech-detail"><i class="fas fa-shield-halved"></i><span>Support End Year:</span> ${escapeHTML(supportEndYear)}</div>` : ""}
        ${item.chipName ? `<div class="tech-detail"><i class="fas fa-microchip"></i><span>Chip:</span> ${escapeHTML(item.chipName)}</div>` : ""}
        ${item.ramGB ? `<div class="tech-detail"><i class="fas fa-memory"></i><span>RAM:</span> ${escapeHTML(item.ramGB)}GB</div>` : ""}
        ${item.storageGB ? `<div class="tech-detail"><i class="fas fa-database"></i><span>Storage Capacity:</span> ${escapeHTML(item.storageGB)}GB</div>` : ""}
        ${material ? `<div class="tech-detail"><i class="fas fa-layer-group"></i><span>Material:</span> ${escapeHTML(material)}</div>` : ""}
        ${batteryCapacity ? `<div class="tech-detail"><i class="fas fa-battery-full"></i><span>Battery Capacity:</span> ${escapeHTML(batteryCapacity)}</div>` : ""}
        ${price ? `<div class="tech-detail"><i class="fas fa-tag"></i><span>Price:</span> ${escapeHTML(price)}</div>` : ""}
        ${dateReleased ? `<div class="tech-detail"><i class="fas fa-calendar-plus"></i><span>Date Released:</span> ${escapeHTML(formatTechDate(dateReleased) || dateReleased)}</div>` : ""}
        ${dateBought ? `<div class="tech-detail"><i class="fas fa-shopping-cart"></i><span>Date Bought:</span> ${escapeHTML(formatTechDate(dateBought) || dateBought)}</div>` : ""}
        ${cyclesHtml}
        ${trendHtml}
        ${coverageHtml}
        ${costHtml}
    `;

    const hasAdvancedDetails =
        deviceType ||
        modelYear ||
        supportEndYear ||
        item.chipName ||
        item.ramGB ||
        item.storageGB ||
        material ||
        batteryCapacity ||
        price ||
        dateReleased ||
        dateBought ||
        cyclesHtml ||
        trendHtml ||
        coverageHtml ||
        costHtml;

    const advancedHtml = hasAdvancedDetails ? `
    <details class="tech-advanced-details">
        <summary>Advanced Details</summary>
        ${advancedDetailsContent}
    </details>` : "";

    return `
    <div class="tech-item">
        <h3><i class="${escapeHTML(iconClass)}"></i> ${escapeHTML(name)}</h3>

        ${model ? `<div class="tech-detail"><i class="fas fa-info-circle"></i><span>Model:</span> ${escapeHTML(model)}</div>` : ""}
        <div class="tech-detail">
            <i class="fas fa-id-badge"></i>
            <span>Ownership:</span>
            <span class="upgrade-badge ${escapeHTML(ownershipBadgeClass)}">${escapeHTML(ownershipLabel)}</span>
        </div>
        ${primaryUse ? `<div class="tech-detail"><i class="fas fa-bullseye"></i><span>Primary Use:</span> ${escapeHTML(primaryUse)}</div>` : ""}
        ${lifecycleSections}
        ${condition ? `<div class="tech-detail"><i class="fas fa-screwdriver-wrench"></i><span>Condition:</span> ${escapeHTML(condition)}</div>` : ""}
        ${storage ? `<div class="tech-detail"><i class="fas fa-hdd"></i><span>Storage:</span> ${escapeHTML(storage)}</div>` : ""}
        ${color ? `<div class="tech-detail"><i class="fas fa-palette"></i><span>Color:</span> ${escapeHTML(color)}</div>` : ""}

        ${summaryHtml}
        ${ageHtml}

        ${osVersion ? `
        <div class="tech-detail">
            <i class="${escapeHTML(osIconClass)}"></i>
            <span>OS Version:</span> ${escapeHTML(osVersion)}
            ${osStatus ? `<span class="os-badge ${osStatus.color}">${escapeHTML(osStatus.status)}</span>` : ""}
        </div>

        ${osStatus ? `
        <div class="tech-detail">
            <i class="fas fa-code-branch"></i>
            <span>Release Channel:</span> ${escapeHTML(osStatus.releaseChannel)}
        </div>

        <div class="tech-detail">
            <i class="fas fa-circle-info"></i>
            <span>Public Latest:</span> ${escapeHTML(formattedOSType)} ${escapeHTML(osStatus.latestPublicVersion)}
        </div>
        ` : ""}
        ` : ""}

        ${osUpdateHtml}
        ${supportHtml}
        ${backupHtml}
        ${batteryHtml}
        ${scoreHtml}
        ${upgradeHtml}
        ${smartUpgradeHtml}
        ${futureProofHtml}
        ${actionHtml}
        ${triggersHtml}
        ${advancedHtml}
    </div>`;
}

async function loadAndDisplayTechItems() {
    const techItemsListContainer = document.getElementById("tech-items-list-dynamic");

    if (!techItemsListContainer) {
        console.error("Tech Item Load Error: Container element #tech-items-list-dynamic not found.");
        return;
    }

    if (!firebaseAppInitialized || !db || !techItemsCollectionRef) {
        console.error("Tech Item Load Error: Firebase not ready or collection ref missing.");
        techItemsListContainer.innerHTML = '<p class="error">Error loading tech data (DB connection/Config).</p>';
        return;
    }

    console.log("Fetching tech items for homepage...");
    techItemsListContainer.innerHTML = "<p>Loading Tech Info...</p>";

    try {
        const techQuery = query(techItemsCollectionRef, orderBy("order", "asc"));
        const querySnapshot = await getDocs(techQuery);

        let allItemsHtml = "";

        if (querySnapshot.empty) {
            console.log("No tech items found in Firestore.");
            allItemsHtml = "<p>No tech items to display currently.</p>";
        } else {
            console.log(`Found ${querySnapshot.size} tech items.`);

            querySnapshot.forEach((doc) => {
                allItemsHtml += renderTechItemHomepage(doc.data());
            });
        }

        techItemsListContainer.innerHTML = allItemsHtml;
        console.log("Tech items list updated on homepage.");
    } catch (error) {
        console.error("Error loading/displaying tech items:", error);

        let errorMsg = "Could not load tech information at this time.";

        if (error.code === "failed-precondition") {
            errorMsg = "Error: DB configuration needed for tech items (order).";
            console.error("Missing Firestore index for tech_items collection, ordered by 'order'.");
        } else {
            errorMsg = `Could not load tech information: ${error.message}`;
        }

        techItemsListContainer.innerHTML = `<p class="error">${errorMsg}</p>`;
    }
}

async function loadAndDisplayFaqs() {
    const faqContainer = document.getElementById('faq-container-dynamic');
    if (!faqContainer) { console.error("FAQ Load Error: Container element #faq-container-dynamic not found."); return; }

    if (!firebaseAppInitialized || !db || !faqsCollectionRef) { console.error("FAQ Load Error: Firebase not ready or collection ref missing."); faqContainer.innerHTML = '<p class="error">Error loading FAQs (DB connection/Config).</p>'; return; }

    console.log("Fetching FAQs for homepage...");
    faqContainer.innerHTML = '<p>Loading FAQs...</p>';
    try {
        const faqQuery = query(faqsCollectionRef, orderBy("order", "asc"));
        const querySnapshot = await getDocs(faqQuery);
        let allItemsHtml = '';

        if (querySnapshot.empty) {
            console.log("No FAQs found in Firestore.");
            allItemsHtml = '<p>No frequently asked questions available yet.</p>';
        } else {
            console.log(`Found ${querySnapshot.size} FAQs.`);
            querySnapshot.forEach((doc) => {
                allItemsHtml += renderFaqItemHomepage(doc.data());
            });
        }
        faqContainer.innerHTML = allItemsHtml;
        attachFaqAccordionListeners(); 
        console.log("FAQ list updated on homepage.");
    } catch (error) {
        console.error("Error loading/displaying FAQs:", error);
        let errorMsg = "Could not load FAQs at this time.";
        if (error.code === 'failed-precondition') {
            errorMsg = "Error: DB configuration needed for FAQs (order).";
            console.error("Missing Firestore index for faqs collection, ordered by 'order'.");
        }
        faqContainer.innerHTML = `<p class="error">${errorMsg}</p>`;
    }
}

function attachFaqAccordionListeners() {
    const container = document.getElementById('faq-container-dynamic');
    if (!container) { console.error("FAQ Accordion Error: Container #faq-container-dynamic not found for listeners."); return; }

    console.log("Attaching FAQ accordion listeners (single open)...");
    if (container.dataset.faqListenersAttached === 'true') {
        console.log("FAQ listeners already attached, skipping.");
        return;
    }
    container.dataset.faqListenersAttached = 'true';

    const allFaqItems = container.querySelectorAll('.faq-item');

    container.addEventListener('click', (event) => {
        const questionButton = event.target.closest('.faq-question');
        if (!questionButton) return; 

        const clickedFaqItem = questionButton.closest('.faq-item');
        if (!clickedFaqItem) return; 

        const answer = clickedFaqItem.querySelector('.faq-answer');
        if (!answer) return; 

        const icon = questionButton.querySelector('.faq-icon');
        const wasActive = clickedFaqItem.classList.contains('active');

        allFaqItems.forEach(item => {
            if (item !== clickedFaqItem && item.classList.contains('active')) {
                item.classList.remove('active'); 
                const otherAnswer = item.querySelector('.faq-answer');
                const otherIcon = item.querySelector('.faq-icon');
                if (otherAnswer) otherAnswer.style.maxHeight = null; 
                if (otherIcon) otherIcon.textContent = '+'; 
            }
        });

        if (wasActive) {
            clickedFaqItem.classList.remove('active');
            answer.style.maxHeight = null;
            if (icon) icon.textContent = '+';
        } else {
            clickedFaqItem.classList.add('active');
            answer.style.maxHeight = answer.scrollHeight + "px";
            if (icon) icon.textContent = '-'; 
        }
    });
    console.log("FAQ accordion listeners attached (single open).");
}

// --- NEW SHOUTOUTS DISPLAY FUNCTION ---
function displayPlatformCreators(platform, creatorsToDisplay) {
    let gridElement, renderFunction;

    switch (platform) {
        case 'tiktok':
            gridElement = document.querySelector('#tiktok-shoutouts-section .creator-grid');
            renderFunction = renderTikTokCard;
            break;
        case 'instagram':
            gridElement = document.querySelector('#instagram-shoutouts-section .instagram-creator-grid');
            renderFunction = renderInstagramCard;
            break;
        case 'youtube':
            gridElement = document.querySelector('#youtube-shoutouts-section .youtube-creator-grid');
            renderFunction = renderYouTubeCard;
            break;
        default:
            console.error("Unknown platform for display:", platform);
            return;
    }

    if (!gridElement) {
        console.error(`Grid element for ${platform} not found.`);
        return;
    }

    if (creatorsToDisplay.length === 0) {
        gridElement.innerHTML = `<p>No creators match your search.</p>`;
    } else {
        gridElement.innerHTML = creatorsToDisplay.map(creator => renderFunction(creator)).join('');
    }
}

/* ==========================================================
   CREATOR SHOUTOUTS SYSTEM (FINAL INTEGRATED VERSION)
   ========================================================== */

// --- Helper: Safely parse follower/subscriber counts ---
function parseCount(value) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  const str = value.toString().replace(/,/g, "").trim().toUpperCase();
  if (str.endsWith("K")) return parseFloat(str) * 1000;
  if (str.endsWith("M")) return parseFloat(str) * 1000000;
  if (str.endsWith("B")) return parseFloat(str) * 1000000000;
  return parseFloat(str) || 0;
}

// --- Generic Sorter Function ---
function sortCreators(creators, method) {
  const sorted = [...creators];
  switch (method) {
    case "followers_desc":
      return sorted.sort(
        (a, b) =>
          parseCount(b.followers || b.subscribers) -
          parseCount(a.followers || a.subscribers)
      );

    case "followers_asc":
      return sorted.sort(
        (a, b) =>
          parseCount(a.followers || a.subscribers) -
          parseCount(b.followers || b.subscribers)
      );

    case "abc_asc":
      return sorted.sort((a, b) =>
        (a.nickname || a.username || "").localeCompare(
          b.nickname || b.username || "",
          undefined,
          { sensitivity: "base" }
        )
      );

    case "abc_desc":
      return sorted.sort((a, b) =>
        (b.nickname || b.username || "").localeCompare(
          a.nickname || a.username || "",
          undefined,
          { sensitivity: "base" }
        )
      );

    default:
      return sorted;
  }
}

// --- LocalStorage Helpers ---
function getSavedSortPreference(platform) {
  return localStorage.getItem(`sortPref_${platform}`) || "followers_desc";
}
function saveSortPreference(platform, value) {
  localStorage.setItem(`sortPref_${platform}`, value);
}

// --- Combined Renderer for Search + Sort ---
function renderFilteredAndSortedCreators(platform, searchTerm = "") {
  let creators;
  switch (platform) {
    case "tiktok":
      creators = allTikTokCreators;
      break;
    case "instagram":
      creators = allInstagramCreators;
      break;
    case "youtube":
      creators = allYouTubeCreators;
      break;
    default:
      return;
  }

  const sortSelect = document.getElementById(`${platform}-sort`);
  const sortMethod = sortSelect
    ? sortSelect.value
    : getSavedSortPreference(platform);

  const filtered = creators.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      (c.username && c.username.toLowerCase().includes(term)) ||
      (c.nickname && c.nickname.toLowerCase().includes(term))
    );
  });

  const sorted = sortCreators(filtered, sortMethod);
  displayPlatformCreators(platform, sorted);
}

// --- Main Loader for Firestore Data ---
async function loadShoutoutPlatformData(platform, timestampElement) {
  let gridElement;
  switch (platform) {
    case "tiktok":
      gridElement = document.querySelector(
        "#tiktok-shoutouts-section .creator-grid"
      );
      break;
    case "instagram":
      gridElement = document.querySelector(
        "#instagram-shoutouts-section .instagram-creator-grid"
      );
      break;
    case "youtube":
      gridElement = document.querySelector(
        "#youtube-shoutouts-section .youtube-creator-grid"
      );
      break;
  }

  if (!firebaseAppInitialized || !db) {
    console.error(
      `Shoutout load error (${platform}): Firebase not ready.`
    );
    if (gridElement)
      gridElement.innerHTML = `<p class="error">Error loading ${platform} creators (DB Init).</p>`;
    return;
  }

  if (!gridElement) {
    console.warn(
      `Grid element missing for ${platform}. Cannot display shoutouts.`
    );
    return;
  }

  console.log(`Loading ${platform} shoutout data into:`, gridElement);
  gridElement.innerHTML = `<p>Loading ${platform} Creators...</p>`;
  if (timestampElement)
    timestampElement.textContent = "Last Updated: Loading...";

  try {
    const shoutoutsCol = collection(db, "shoutouts");
    const shoutoutQuery = query(
      shoutoutsCol,
      where("platform", "==", platform)
    );
    const querySnapshot = await getDocs(shoutoutQuery);

    let creatorsData = querySnapshot.docs.map((doc) => doc.data());

    // Apply saved sort initially
    const savedSort = getSavedSortPreference(platform);
    creatorsData = sortCreators(creatorsData, savedSort);

    // Store globally for searches
    switch (platform) {
      case "tiktok":
        allTikTokCreators = creatorsData;
        break;
      case "instagram":
        allInstagramCreators = creatorsData;
        break;
      case "youtube":
        allYouTubeCreators = creatorsData;
        break;
    }

    displayPlatformCreators(platform, creatorsData);

    // Timestamp display
    if (timestampElement && shoutoutsMetaRef) {
      try {
        const metaSnap = await getDoc(shoutoutsMetaRef);
        if (metaSnap.exists()) {
          const tsField = `lastUpdatedTime_${platform}`;
          timestampElement.textContent = `Last Updated: ${formatFirestoreTimestamp(
            metaSnap.data()?.[tsField]
          )}`;
        } else {
          timestampElement.textContent = "Last Updated: N/A";
        }
      } catch (e) {
        console.warn(`Could not fetch timestamp for ${platform}:`, e);
        timestampElement.textContent = "Last Updated: Error";
      }
    } else if (timestampElement) {
      timestampElement.textContent = "Last Updated: N/A";
    }

    console.log(`${platform} shoutouts loaded and displayed (${savedSort}).`);
  } catch (error) {
    console.error(`Error loading ${platform} shoutout data:`, error);
    gridElement.innerHTML = `<p class="error">Error loading ${platform} creators.</p>`;
    if (timestampElement) timestampElement.textContent = "Last Updated: Error";
  }
}

// --- Sorting Dropdown Setup ---
function setupCreatorSorting() {
  const sortConfigs = [
    { id: "tiktok-sort", platform: "tiktok" },
    { id: "instagram-sort", platform: "instagram" },
    { id: "youtube-sort", platform: "youtube" },
  ];

  sortConfigs.forEach(({ id, platform }) => {
    const select = document.getElementById(id);
    if (!select) return;

    const saved = getSavedSortPreference(platform);
    select.value = saved;

    select.addEventListener("change", () => {
      saveSortPreference(platform, select.value);
      const searchInput = document.getElementById(`${platform}-search`);
      const searchTerm = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";
      renderFilteredAndSortedCreators(platform, searchTerm);
    });
  });

  console.log("Creator sorting dropdowns initialized with localStorage memory.");
}

// --- Search Setup (Works with sorting) ---
function setupCreatorSearch() {
  const configs = [
    { id: "tiktok-search", platform: "tiktok" },
    { id: "instagram-search", platform: "instagram" },
    { id: "youtube-search", platform: "youtube" },
  ];

  configs.forEach(({ id, platform }) => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("input", (e) => {
      const term = e.target.value.trim().toLowerCase();
      renderFilteredAndSortedCreators(platform, term);
    });
  });

  console.log("Creator search inputs initialized and synced with sorting.");
}

/* ========================================
   displayShoutouts.js - Business Hours and Status
   Premium Final Version

   Features:
   - Firestore realtime updates with onSnapshot
   - Minute-aligned business status refresh
   - Live local clock display
   - Store-time display
   - Strong schedule normalization
   - Holiday and temporary schedule handling
   - Manual override support
   - Business status chip + traffic light state
   - Premium status hint
   - Today timeline
   - Copy Today button
   - Toggle Hours collapse persistence
   - Segmented 12h / 24h time format persistence
   - Visitor-local time conversion
   - Business visual state themes
======================================== */

/* -------------------------
   CONFIGURATION
------------------------- */
const TEMPORARY_WARNING_MINUTES = 15;
const GENERAL_WARNING_MINUTES = 30;
const BUSINESS_TIME_FORMAT_STORAGE_KEY = 'bizTimeFormat';
const BUSINESS_HOURS_COLLAPSED_STORAGE_KEY = 'biz_hours_collapsed';

/* -------------------------
   GLOBAL STATE
------------------------- */
window.assumedBusinessTimezone = window.assumedBusinessTimezone || 'America/New_York';

let use24HourBusinessTime = localStorage.getItem(BUSINESS_TIME_FORMAT_STORAGE_KEY) === '24';
let cachedBusinessData = null;
let cachedVisitorTimezone = 'UTC';
let unsubscribeBusinessListener = null;
let minuteRefreshTimer = null;
let minuteBoundaryTimeout = null;
let localClockTimer = null;

/* -------------------------
   SAFE FIRESTORE REFERENCE
------------------------- */
let businessDocumentReferenceLocal;

try {
  if (typeof businessDocRef !== 'undefined' && businessDocRef) {
    businessDocumentReferenceLocal = businessDocRef;
  } else if (typeof doc !== 'undefined' && typeof db !== 'undefined') {
    businessDocumentReferenceLocal = doc(db, 'site_config', 'businessDetails');
  } else {
    businessDocumentReferenceLocal = null;
  }
} catch (error) {
  businessDocumentReferenceLocal = null;
}

/* -------------------------
   GENERAL HELPERS
------------------------- */
function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function capitalizeFirstLetter(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getLuxon() {
  if (typeof luxon !== 'undefined' && luxon.DateTime) {
    return luxon;
  }
  return null;
}

function getVisitorTimezoneSafe() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (error) {
    return 'UTC';
  }
}

/* -------------------------
   TIME HELPERS
------------------------- */
function timeStringToMinutes(timeString) {
  if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) return null;

  const parts = timeString.split(':');
  if (parts.length < 2) return null;

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  return (hours * 60) + minutes;
}

function minutesToTimeString(totalMinutes) {
  if (totalMinutes == null || Number.isNaN(totalMinutes)) return null;

  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatTimeTwelveHourSimple(timeString) {
  if (!timeString) return '?';

  const [hourString, minuteString] = String(timeString).split(':');
  const hour = parseInt(hourString, 10);
  const minute = parseInt(minuteString || '0', 10);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return 'Invalid';

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function formatTimeTwentyFourHourSimple(timeString) {
  if (!timeString) return '?';

  const [hourString, minuteString] = String(timeString).split(':');
  const hour = parseInt(hourString, 10);
  const minute = parseInt(minuteString || '0', 10);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return 'Invalid';

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function formatDisplayTimeBusinessInfo(timeString, visitorTimezone) {
  if (!timeString) return '?';

  const fallback = use24HourBusinessTime
    ? formatTimeTwentyFourHourSimple(timeString)
    : formatTimeTwelveHourSimple(timeString);

  const LuxonLibrary = getLuxon();
  if (!LuxonLibrary || !window.assumedBusinessTimezone) {
    return fallback;
  }

  try {
    const { DateTime } = LuxonLibrary;
    const [hour, minute] = String(timeString).split(':').map(Number);

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return fallback;
    }

    const nowInBusinessTimezone = DateTime.now().setZone(window.assumedBusinessTimezone);
    const businessDateTime = nowInBusinessTimezone.set({
      hour,
      minute,
      second: 0,
      millisecond: 0
    });

    const visitorDateTime = businessDateTime.setZone(visitorTimezone);

    return use24HourBusinessTime
      ? visitorDateTime.toFormat('HH:mm')
      : visitorDateTime.toFormat('h:mm a');
  } catch (error) {
    return fallback;
  }
}

function formatDate(dateString) {
  if (!dateString) return '?';

  const LuxonLibrary = getLuxon();

  if (!LuxonLibrary) {
    try {
      const parts = dateString.split('-');
      const date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  }

  const { DateTime } = LuxonLibrary;
  const dateTime = DateTime.fromISO(dateString, {
    zone: window.assumedBusinessTimezone || 'UTC'
  });

  return dateTime.isValid ? dateTime.toFormat('cccc, LLLL d, yyyy') : dateString;
}

function formatDuration(totalMinutes) {
  const roundedMinutes = Math.max(0, Math.round(totalMinutes));

  if (roundedMinutes < 60) {
    return `${roundedMinutes} minute${roundedMinutes === 1 ? '' : 's'}`;
  }

  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;

  if (minutes === 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }

  return `${hours} hour${hours === 1 ? '' : 's'} ${minutes} minute${minutes === 1 ? '' : 's'}`;
}

function getScheduledLabel({
  nowInBusinessTimezone,
  startDateTime,
  endDateTime,
  earliestOpenMinutes,
  latestCloseMinutes,
  isClosedAllDay = false
}) {
  if (!nowInBusinessTimezone || !startDateTime || !endDateTime) {
    return '';
  }

  const todayStart = nowInBusinessTimezone.startOf('day');
  const targetStart = startDateTime.startOf('day');
  const differenceInDays = Math.round(targetStart.diff(todayStart, 'days').days);

  if (differenceInDays > 1) {
    return `Scheduled in ${differenceInDays} days`;
  }

  if (differenceInDays === 1) {
    return 'Scheduled for Tomorrow';
  }

  if (differenceInDays < 0) {
    return 'Concluded';
  }

  if (isClosedAllDay) {
    return 'In Effect Today';
  }

  if (earliestOpenMinutes == null || latestCloseMinutes == null) {
    return 'In Effect Today';
  }

  const startOfSchedule = nowInBusinessTimezone.startOf('day').plus({
    minutes: earliestOpenMinutes
  });

  const endOfSchedule = nowInBusinessTimezone.startOf('day').plus({
    minutes: latestCloseMinutes
  });

  if (nowInBusinessTimezone < startOfSchedule) {
    const minutesUntilStart = minutesUntilLuxon(nowInBusinessTimezone, startOfSchedule);

    if (minutesUntilStart != null && minutesUntilStart > 0) {
      return `Starts in ${formatDuration(minutesUntilStart)}`;
    }

    return 'Scheduled for Today';
  }

  if (nowInBusinessTimezone >= startOfSchedule && nowInBusinessTimezone <= endOfSchedule) {
    return 'In Effect Today';
  }

  return 'Concluded';
}

/* -------------------------
   DATETIME CORE
------------------------- */
function getNowInBusinessTimezone() {
  const LuxonLibrary = getLuxon();

  if (!LuxonLibrary || !window.assumedBusinessTimezone) return null;

  return LuxonLibrary.DateTime.now().setZone(window.assumedBusinessTimezone);
}

function getBusinessDayName(nowInBusinessTimezone) {
  if (nowInBusinessTimezone) {
    return nowInBusinessTimezone.toFormat('cccc').toLowerCase();
  }

  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
}

function getBusinessIsoDate(nowInBusinessTimezone) {
  if (nowInBusinessTimezone) {
    return nowInBusinessTimezone.toISODate();
  }

  return new Date().toISOString().slice(0, 10);
}

function getCurrentBusinessMinutes(nowInBusinessTimezone) {
  if (nowInBusinessTimezone) {
    return (nowInBusinessTimezone.hour * 60) + nowInBusinessTimezone.minute;
  }

  const date = new Date();
  return (date.getHours() * 60) + date.getMinutes();
}

function parseBusinessIsoDate(dateString) {
  const LuxonLibrary = getLuxon();

  if (!LuxonLibrary || !dateString || !window.assumedBusinessTimezone) {
    return null;
  }

  const dateTime = LuxonLibrary.DateTime.fromISO(dateString, {
    zone: window.assumedBusinessTimezone
  });

  return dateTime.isValid ? dateTime : null;
}

function isInDateWindow(nowInBusinessTimezone, startDate, endDate) {
  const start = parseBusinessIsoDate(startDate);
  const end = parseBusinessIsoDate(endDate);

  if (!nowInBusinessTimezone || !start || !end) return false;

  return nowInBusinessTimezone >= start.startOf('day') &&
         nowInBusinessTimezone <= end.endOf('day');
}

function minutesUntilLuxon(nowInBusinessTimezone, targetDateTime) {
  const LuxonLibrary = getLuxon();

  if (!LuxonLibrary || !nowInBusinessTimezone || !targetDateTime || !targetDateTime.isValid) {
    return null;
  }

  return targetDateTime.diff(nowInBusinessTimezone, 'minutes').minutes;
}

/* -------------------------
   RANGE HELPERS
------------------------- */
function isRangeActiveByMinutes(currentMinutes, range) {
  const openMinutes = timeStringToMinutes(range.open);
  const closeMinutes = timeStringToMinutes(range.close);

  if (openMinutes == null || closeMinutes == null) return false;

  if (closeMinutes > openMinutes) {
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }

  return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
}

function findActiveRange(currentMinutes, ranges) {
  return (ranges || []).find((range) => isRangeActiveByMinutes(currentMinutes, range)) || null;
}

function hadAnyOpenEarlierToday(currentMinutes, schedule) {
  const ranges = schedule?.ranges || [];

  for (const range of ranges) {
    const openMinutes = timeStringToMinutes(range.open);
    if (openMinutes != null && openMinutes < currentMinutes) {
      return true;
    }
  }

  return false;
}

/* -------------------------
   NORMALIZATION
------------------------- */
function normalizeRanges(sourceObject) {
  if (!sourceObject) return [];

  if (Array.isArray(sourceObject.ranges)) {
    return sourceObject.ranges
      .map((range) => ({
        open: range?.open || '',
        close: range?.close || ''
      }))
      .filter((range) => range.open && range.close);
  }

  if (sourceObject.open && sourceObject.close) {
    return [{
      open: sourceObject.open,
      close: sourceObject.close
    }];
  }

  return [];
}

function normalizeRegularHours(regularHours) {
  const normalized = {};
  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
  ];

  const source = regularHours && typeof regularHours === 'object' ? regularHours : {};

  for (const day of days) {
    const dayObject = source[day] || {};
    const ranges = normalizeRanges(dayObject);
    const isClosed = !!dayObject.isClosed || ranges.length === 0;

    normalized[day] = {
      isClosed,
      ranges
    };
  }

  return normalized;
}

function normalizeHolidayHours(holidayHours) {
  const sourceArray = Array.isArray(holidayHours) ? holidayHours : [];

  return sourceArray
    .map((holiday) => {
      const ranges = normalizeRanges(holiday);
      const isClosed = !!holiday?.isClosed || ranges.length === 0;

      return {
        date: holiday?.date || '',
        label: holiday?.label || 'Event',
        isClosed,
        ranges
      };
    })
    .filter((holiday) => !!holiday.date);
}

function normalizeTemporaryHours(temporaryHours) {
  const sourceArray = Array.isArray(temporaryHours) ? temporaryHours : [];

  return sourceArray
    .map((temporaryEntry) => {
      const ranges = normalizeRanges(temporaryEntry);

      return {
        startDate: temporaryEntry?.startDate || '',
        endDate: temporaryEntry?.endDate || '',
        label: temporaryEntry?.label || 'Temporary Schedule',
        ranges
      };
    })
    .filter((temporaryEntry) =>
      temporaryEntry.startDate &&
      temporaryEntry.endDate &&
      temporaryEntry.ranges.length > 0
    );
}

/* -------------------------
   NEXT OPENING HELPERS
------------------------- */
function getDayNameFromLuxon(dateTime) {
  const orderedDays = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
  ];

  return orderedDays[(dateTime.weekday - 1) % 7];
}

function getScheduleForOffset(nowInBusinessTimezone, offset, regularHours, holidayHours) {
  const LuxonLibrary = getLuxon();
  if (!LuxonLibrary || !nowInBusinessTimezone) return null;

  const targetDay = nowInBusinessTimezone.plus({ days: offset }).startOf('day');
  const isoDate = targetDay.toISODate();

  const holidaySchedule = holidayHours.find((holiday) => holiday.date === isoDate);

  if (holidaySchedule) {
    return {
      type: 'holiday',
      labelDay: getDayNameFromLuxon(targetDay),
      schedule: holidaySchedule,
      targetDay
    };
  }

  const dayName = getDayNameFromLuxon(targetDay);

  return {
    type: 'regular',
    labelDay: dayName,
    schedule: regularHours[dayName] || { isClosed: true, ranges: [] },
    targetDay
  };
}

function getNextOpenForDay(currentMinutes, offset, scheduleObject) {
  const ranges = scheduleObject?.schedule?.ranges || [];
  if (!ranges.length || scheduleObject.schedule.isClosed) return null;

  if (offset !== 0) {
    return ranges[0].open || null;
  }

  let bestOpen = null;
  let bestOpenMinutes = null;

  for (const range of ranges) {
    const openMinutes = timeStringToMinutes(range.open);
    if (openMinutes == null) continue;

    if (openMinutes > currentMinutes) {
      if (bestOpenMinutes == null || openMinutes < bestOpenMinutes) {
        bestOpenMinutes = openMinutes;
        bestOpen = range.open;
      }
    }
  }

  return bestOpen;
}

function buildOpenDateTimeFromDayAndTime(targetDay, timeString) {
  const totalMinutes = timeStringToMinutes(timeString);
  if (!targetDay || totalMinutes == null) return null;
  return targetDay.plus({ minutes: totalMinutes });
}

function getNextOpeningInfo(
  nowInBusinessTimezone,
  currentMinutes,
  regularHours,
  holidayHours,
  options = {}
) {
  const LuxonLibrary = getLuxon();
  if (!LuxonLibrary || !nowInBusinessTimezone) return null;

  const {
    startOffset = 0,
    minMinutesToday = currentMinutes,
  } = options;

  for (let offset = startOffset; offset < 7; offset += 1) {
    const scheduleObject = getScheduleForOffset(
      nowInBusinessTimezone,
      offset,
      regularHours,
      holidayHours
    );

    if (!scheduleObject) continue;

    const schedule = scheduleObject.schedule;
    if (!schedule || schedule.isClosed || !schedule.ranges?.length) continue;

    let selectedRange = null;
    let selectedOpenTime = null;

    if (offset === 0) {
      for (const range of schedule.ranges) {
        const openMinutes = timeStringToMinutes(range.open);
        if (openMinutes == null) continue;

        if (openMinutes > minMinutesToday) {
          if (!selectedRange || openMinutes < timeStringToMinutes(selectedOpenTime)) {
            selectedRange = range;
            selectedOpenTime = range.open;
          }
        }
      }
    } else {
      selectedRange = schedule.ranges[0];
      selectedOpenTime = selectedRange?.open || null;
    }

    if (!selectedOpenTime) continue;

    const openDateTime = buildOpenDateTimeFromDayAndTime(
      scheduleObject.targetDay,
      selectedOpenTime
    );

    if (!openDateTime || !openDateTime.isValid) continue;

    return {
      offset,
      type: scheduleObject.type,
      labelDay: scheduleObject.labelDay,
      dayLabel:
        offset === 0
          ? 'Today'
          : offset === 1
            ? 'Tomorrow'
            : capitalizeFirstLetter(scheduleObject.labelDay),
      timeString: selectedOpenTime,
      openDateTime,
      schedule,
      scheduleObject
    };
  }

  return null;
}

/* -------------------------
   UI HELPERS
------------------------- */
function setMetaRow(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
}

function setLocalTimeLine(visitorTimezone) {
  const element = document.getElementById('bizLocalTime');
  if (!element) return;

  try {
    const now = new Date();
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: visitorTimezone,
      weekday: 'short',
      hour: use24HourBusinessTime ? '2-digit' : 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: !use24HourBusinessTime
    }).format(now);

    element.textContent = `Local time: ${formatted}`;
  } catch (error) {
    element.textContent = 'Local time: —';
  }
}

function formatStoreLocalTime() {
  const element = document.getElementById('bizStoreTime');
  if (!element) return;

  try {
    const now = new Date();
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: window.assumedBusinessTimezone,
      hour: use24HourBusinessTime ? '2-digit' : 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: !use24HourBusinessTime
    }).format(now);

    element.textContent = formatted;
  } catch (error) {
    element.textContent = '—';
  }
}

function setStatusHint(text = '') {
  const element = document.getElementById('bizStatusHint');
  if (!element) return;
  element.textContent = text;
}

function updateBizTimeFormatToggleUI() {
  const button12 = document.getElementById('bizTime12Btn');
  const button24 = document.getElementById('bizTime24Btn');

  if (!button12 || !button24) return;

  const is24 = use24HourBusinessTime;

  button12.classList.toggle('is-active', !is24);
  button24.classList.toggle('is-active', is24);

  button12.setAttribute('aria-pressed', String(!is24));
  button24.setAttribute('aria-pressed', String(is24));
}

function installBusinessTimeFormatToggle() {
  const button12 = document.getElementById('bizTime12Btn');
  const button24 = document.getElementById('bizTime24Btn');

  if (!button12 || !button24) return;

  updateBizTimeFormatToggleUI();

  if (button12.dataset.bound !== 'true') {
    button12.dataset.bound = 'true';
    button12.addEventListener('click', () => {
      use24HourBusinessTime = false;
      localStorage.setItem(BUSINESS_TIME_FORMAT_STORAGE_KEY, '12');
      updateBizTimeFormatToggleUI();
      renderFromCache();
    });
  }

  if (button24.dataset.bound !== 'true') {
    button24.dataset.bound = 'true';
    button24.addEventListener('click', () => {
      use24HourBusinessTime = true;
      localStorage.setItem(BUSINESS_TIME_FORMAT_STORAGE_KEY, '24');
      updateBizTimeFormatToggleUI();
      renderFromCache();
    });
  }
}

function startLiveLocalClock() {
  if (localClockTimer) {
    clearInterval(localClockTimer);
    localClockTimer = null;
  }

  const tick = () => {
    cachedVisitorTimezone = getVisitorTimezoneSafe();
    setMetaRow('bizUserTz', cachedVisitorTimezone);
    setLocalTimeLine(cachedVisitorTimezone);
    formatStoreLocalTime();
  };

  tick();
  localClockTimer = setInterval(tick, 1000);
}

function startMinuteAlignedRefresh() {
  if (minuteRefreshTimer) {
    clearInterval(minuteRefreshTimer);
    minuteRefreshTimer = null;
  }
  if (minuteBoundaryTimeout) {
    clearTimeout(minuteBoundaryTimeout);
    minuteBoundaryTimeout = null;
  }

  // This checks the status every 5 seconds.
  // This way, when it turns 5:00 PM, the store closes 
  // almost instantly instead of waiting for a 60-second timer.
  minuteRefreshTimer = setInterval(() => {
    renderFromCache();
  }, 5000);
}


function installPanelToggle() {
  const button = document.getElementById('toggleHoursBtn');
  const panel = document.getElementById('hoursPanel');

  if (!button || !panel) return;

  const isCollapsedInitially = localStorage.getItem(BUSINESS_HOURS_COLLAPSED_STORAGE_KEY) === '1';

  if (isCollapsedInitially) {
    panel.classList.add('is-collapsed');
    button.setAttribute('aria-expanded', 'false');
  }

  if (button.dataset.bound === 'true') {
    button.textContent = panel.classList.contains('is-collapsed')
      ? 'Show Full Hours'
      : 'Hide Full Hours';
    return;
  }

  button.dataset.bound = 'true';

  button.addEventListener('click', () => {
    const isCollapsed = panel.classList.toggle('is-collapsed');
    button.setAttribute('aria-expanded', String(!isCollapsed));
    localStorage.setItem(BUSINESS_HOURS_COLLAPSED_STORAGE_KEY, isCollapsed ? '1' : '0');
    button.textContent = isCollapsed ? 'Show Full Hours' : 'Hide Full Hours';
  });

  button.textContent = panel.classList.contains('is-collapsed')
    ? 'Show Full Hours'
    : 'Hide Full Hours';
}

function installCopyToday() {
  const button = document.getElementById('copyTodayBtn');
  if (!button) return;

  if (button.dataset.bound === 'true') return;
  button.dataset.bound = 'true';

  button.addEventListener('click', async () => {
    const statusText =
      document.querySelector('#business-status-display .status-main-text')?.textContent?.trim() || '';

    const reasonText =
      document.querySelector('#business-status-display .status-reason-text')?.textContent?.trim() || '';

    const todayHours =
      document.getElementById('bizTodayHours')?.textContent?.trim() || '';

    const nextOpening =
      document.getElementById('bizNextOpen')?.textContent?.trim() || '';

    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    const textToCopy = [
      'Caleb’s Merch Store',
      `Timezone: ${timezone}`,
      statusText ? `Status: ${statusText}` : '',
      reasonText ? `Schedule: ${reasonText}` : '',
      todayHours ? `Today’s hours: ${todayHours}` : '',
      nextOpening && nextOpening !== '—' ? `Next opening: ${nextOpening}` : ''
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(textToCopy);
      const originalText = button.textContent;
      button.textContent = 'Copied';
      setTimeout(() => {
        button.textContent = originalText;
      }, 900);
    } catch (error) {
      alert(textToCopy);
    }
  });
}

function renderTodayTimeline({
  schedule,
  currentMinutes,
  visitorTimezone
}) {
  const fillElement = document.getElementById('bizTodayTimelineFill');
  const nowElement = document.getElementById('bizTodayTimelineNow');
  const startElement = document.getElementById('bizTimelineStart');
  const endElement = document.getElementById('bizTimelineEnd');

  if (!fillElement || !nowElement || !startElement || !endElement) return;

  if (!schedule || schedule.isClosed || !Array.isArray(schedule.ranges) || !schedule.ranges.length) {
    fillElement.style.width = '0%';
    nowElement.style.left = '0%';
    startElement.textContent = 'Closed';
    endElement.textContent = 'Closed';
    return;
  }

  let earliestOpen = null;
  let latestClose = null;

  schedule.ranges.forEach((range) => {
    const openMinutes = timeStringToMinutes(range.open);
    const closeMinutes = timeStringToMinutes(range.close);

    if (openMinutes != null && (earliestOpen == null || openMinutes < earliestOpen)) {
      earliestOpen = openMinutes;
    }

    if (closeMinutes != null && (latestClose == null || closeMinutes > latestClose)) {
      latestClose = closeMinutes;
    }
  });

  if (earliestOpen == null || latestClose == null || latestClose <= earliestOpen) {
    fillElement.style.width = '0%';
    nowElement.style.left = '0%';
    startElement.textContent = '—';
    endElement.textContent = '—';
    return;
  }

  const totalWindow = latestClose - earliestOpen;
  const clampedCurrent = Math.max(earliestOpen, Math.min(currentMinutes, latestClose));
  const percent = ((clampedCurrent - earliestOpen) / totalWindow) * 100;

  fillElement.style.width = `${percent}%`;
  nowElement.style.left = `${percent}%`;

  startElement.textContent = formatDisplayTimeBusinessInfo(minutesToTimeString(earliestOpen), visitorTimezone);
  endElement.textContent = formatDisplayTimeBusinessInfo(minutesToTimeString(latestClose), visitorTimezone);
}

/* -------------------------
   STATUS / VISUAL HELPERS
------------------------- */
function normalizeDisplayStatus(finalStatus, finalType, finalReason, isManualOverride) {
  let displayStatusText = finalStatus;
  let displayReasonText = finalReason;

  if (finalType === 'holiday') {
    displayStatusText = 'Holiday Hours';
  } else if (finalType === 'temporary') {
    displayStatusText = 'Temporary Closure';
  } else if (finalStatus === 'Open') {
    displayStatusText = 'Open';
  } else {
    displayStatusText = 'Closed';
  }

  if (isManualOverride) {
    if (finalType === 'temporary') {
      displayReasonText = 'Manual override';
    } else if (finalStatus === 'Open') {
      displayReasonText = 'Manually set to open';
    } else if (finalStatus === 'Closed') {
      displayReasonText = 'Manually set to closed';
    } else {
      displayReasonText = 'Manual override';
    }
  } else {
    if (finalType === 'holiday') {
      displayReasonText = 'Holiday schedule';
    } else if (finalType === 'temporary') {
      displayReasonText = 'Temporary change';
    } else {
      displayReasonText = 'Regular schedule';
    }
  }

  return {
    displayStatusText,
    displayReasonText
  };
}

function buildPremiumStatusHint({
  finalStatus,
  finalType,
  isManualOverride,
  isClosingSoon,
  isOpeningSoon,
  isTemporaryStartingSoon,
  isTemporaryEndingSoon,
  statusSubText
}) {
  if (isManualOverride) {
    return 'Manual override is currently active.';
  }

  if (finalType === 'holiday') {
    return 'Holiday hours are affecting today’s schedule.';
  }

  if (finalType === 'temporary') {
    if (isTemporaryEndingSoon) {
      return 'Temporary closure is ending soon.';
    }
    return 'Temporary hours are currently active.';
  }

  if (finalStatus === 'Open' && isClosingSoon) {
    return 'Business is open and approaching closing time.';
  }

  if (finalStatus !== 'Open' && isOpeningSoon) {
    return 'Business is closed but opening soon.';
  }

  if (isTemporaryStartingSoon) {
    return 'A temporary schedule change begins soon.';
  }

  if (typeof statusSubText === 'string' && statusSubText.trim()) {
    return statusSubText;
  }

  if (finalStatus === 'Open') {
    return 'Business is currently open under the regular schedule.';
  }

  return 'Business is currently closed under the regular schedule.';
}

function setStatusChip(statusText, statusType = 'regular', isManualOverride = false) {
  const chip = document.getElementById('bizChip');
  if (!chip) return;

  const openColor = 'var(--status-open-color, #28a745)';
  const closedColor = 'var(--status-closed-color, #dc3545)';
  const temporaryColor = 'var(--status-unavailable-color, #fd7e14)';
  const holidayColor = 'var(--status-holiday-color, #a855f7)';
  const manualColor = 'var(--status-override-color, #0ea5e9)';

  let color = closedColor;
  let label = 'Closed';

  if (statusType === 'holiday') {
    color = holidayColor;
    label = 'Holiday';
  } else if (statusType === 'temporary') {
    color = temporaryColor;
    label = 'Temporary';
  } else if (statusText === 'Open') {
    color = openColor;
    label = 'Open';
  } else {
    color = closedColor;
    label = 'Closed';
  }

  if (isManualOverride) {
    chip.textContent = `${label} • Manual`;
    chip.style.color = manualColor;
    chip.style.borderColor = `color-mix(in srgb, ${manualColor} 40%, transparent)`;
    return;
  }

  chip.textContent = label;
  chip.style.color = color;
  chip.style.borderColor = `color-mix(in srgb, ${color} 40%, transparent)`;
}

function setTrafficLight({
  statusText = 'Closed',
  statusType = 'regular',
  isManualOverride = false,
  isClosingSoon = false,
  isOpeningSoon = false,
  isTemporaryStartingSoon = false,
  isTemporaryEndingSoon = false
} = {}) {
  const greenLight = document.getElementById('bizLightGreen');
  const yellowLight = document.getElementById('bizLightYellow');
  const redLight = document.getElementById('bizLightRed');

  if (!greenLight || !yellowLight || !redLight) return;

  [greenLight, yellowLight, redLight].forEach((light) => {
    light.classList.remove('is-active', 'is-blinking');
  });

  if (isManualOverride) {
    if (statusText === 'Open') {
      greenLight.classList.add('is-active');
      return;
    }

    if (statusText === 'Closed') {
      redLight.classList.add('is-active');
      return;
    }

    if (statusText === 'Temporary Closure' || statusText === 'Temporarily Unavailable') {
      yellowLight.classList.add('is-active');
      return;
    }
  }

  if (statusType === 'holiday' && statusText !== 'Open') {
    redLight.classList.add('is-active', 'is-blinking');
    return;
  }

  if (statusType === 'holiday' && statusText === 'Open') {
    if (isClosingSoon) {
      yellowLight.classList.add('is-active', 'is-blinking');
    } else {
      yellowLight.classList.add('is-active');
    }
    return;
  }

  if (statusType === 'temporary') {
    yellowLight.classList.add('is-active');

    if (isTemporaryEndingSoon) {
      yellowLight.classList.add('is-blinking');
    }

    return;
  }

  if (isTemporaryStartingSoon) {
    yellowLight.classList.add('is-active', 'is-blinking');
    return;
  }

  if (statusText === 'Open') {
    if (isClosingSoon) {
      yellowLight.classList.add('is-active', 'is-blinking');
    } else {
      greenLight.classList.add('is-active');
    }
    return;
  }

  if (statusText !== 'Open') {
    if (isOpeningSoon) {
      yellowLight.classList.add('is-active');
    } else {
      redLight.classList.add('is-active');
    }
    return;
  }

  redLight.classList.add('is-active');
}

function getBusinessTimeTheme(nowInBusinessTimezone) {
  if (!nowInBusinessTimezone) return 'day';

  const hour = nowInBusinessTimezone.hour;

  if (hour < 12) return 'morning';
  if (hour < 19) return 'day';
  return 'night';
}

function applyBusinessVisualState({
  state = 'closed',
  theme = 'day'
} = {}) {
  const businessSection = document.getElementById('business-section');
  if (!businessSection) return;

  businessSection.classList.remove(
    'state-open',
    'state-closing',
    'state-closed',
    'theme-morning',
    'theme-day',
    'theme-night'
  );

  businessSection.classList.add(`state-${state}`);
  businessSection.classList.add(`theme-${theme}`);
}

function getVisualBusinessState({
  finalStatus,
  finalType,
  subStatusText,
  nowInBusinessTimezone,
  baseActiveRange
}) {
  if (finalType === 'temporary') return 'closed';
  if (finalStatus !== 'Open') return 'closed';

  if (
    typeof subStatusText === 'string' &&
    subStatusText.includes('Temporary closure starts in')
  ) {
    return 'closing';
  }

  if (!nowInBusinessTimezone || !baseActiveRange?.close) {
    return 'open';
  }

  const closeMinutes = timeStringToMinutes(baseActiveRange.close);
  if (closeMinutes == null) return 'open';

  const closeDateTime = nowInBusinessTimezone.startOf('day').plus({
    minutes: closeMinutes
  });

  const minutesAway = minutesUntilLuxon(nowInBusinessTimezone, closeDateTime);

  if (minutesAway != null && minutesAway > 0 && minutesAway <= GENERAL_WARNING_MINUTES) {
    return 'closing';
  }

  if (
    typeof subStatusText === 'string' &&
    (
      subStatusText.includes('Closes in') ||
      subStatusText.includes('Closing in') ||
      subStatusText.includes('Opens in') ||
      subStatusText.includes('Opens again today') ||
      subStatusText.includes('Opens again at')
    )
  ) {
    return 'closing';
  }

  return 'open';
}

/* -------------------------
   MAIN RENDER
------------------------- */
function calculateAndDisplayStatusBusinessInfo(businessData = {}, visitorTimezone = 'UTC') {
  const regularHoursElement = document.getElementById('business-hours-display');
  const statusElement = document.getElementById('business-status-display');
  const temporaryHoursElement = document.getElementById('temporary-hours-display');
  const holidayHoursElement = document.getElementById('holiday-hours-display');
  const contactElement = document.getElementById('contact-email-display');

  if (!regularHoursElement || !statusElement || !temporaryHoursElement || !holidayHoursElement) {
    return;
  }

  const statusMainTextElement = statusElement.querySelector('.status-main-text');
  const statusSubTextElement = statusElement.querySelector('.status-countdown-text');
  const statusReasonElement = statusElement.querySelector('.status-reason-text');

  if (!statusMainTextElement || !statusSubTextElement || !statusReasonElement) {
    return;
  }

  setMetaRow('bizUserTz', visitorTimezone);
  setLocalTimeLine(visitorTimezone);
  formatStoreLocalTime();
  setMetaRow('bizNextOpen', '—');
  setMetaRow('bizTodayHours', '—');

  if (!window.assumedBusinessTimezone) {
    statusMainTextElement.textContent = 'Configuration Error';
    statusMainTextElement.className = 'status-main-text status-unavailable';
    statusReasonElement.textContent = 'Missing timezone';
    statusSubTextElement.textContent = '';
    setStatusHint('Business timezone configuration is missing.');
    setStatusChip('Temporarily Unavailable', 'temporary', true);
    setTrafficLight({
      statusText: 'Temporarily Unavailable',
      statusType: 'temporary',
      isManualOverride: true
    });
    applyBusinessVisualState({
      state: 'closed',
      theme: 'day'
    });
    renderTodayTimeline({
      schedule: { isClosed: true, ranges: [] },
      currentMinutes: 0,
      visitorTimezone
    });
    return;
  }

  const LuxonLibrary = getLuxon();
  const nowInBusinessTimezone = getNowInBusinessTimezone();
  const currentMinutes = getCurrentBusinessMinutes(nowInBusinessTimezone);
  const businessIsoDate = getBusinessIsoDate(nowInBusinessTimezone);
  const businessDayName = getBusinessDayName(nowInBusinessTimezone);

  const regularHours = normalizeRegularHours(businessData.regularHours || {});
  const holidayHours = normalizeHolidayHours(businessData.holidayHours || []);
  const temporaryHours = normalizeTemporaryHours(businessData.temporaryHours || []);
  const statusOverride = (businessData.statusOverride || 'auto').toLowerCase();

  const contactEmail = businessData.contactEmail || '';
  if (contactElement) {
    if (contactEmail) {
      const safeEmail = escapeHtml(contactEmail);
      contactElement.innerHTML = `<span class="contact-label">Email</span><a href="mailto:${safeEmail}">${safeEmail}</a>`;
    } else {
      contactElement.innerHTML = '';
    }
  }

  const todayRegular = regularHours[businessDayName] || { isClosed: true, ranges: [] };
  const todayHoliday = holidayHours.find((holiday) => holiday.date === businessIsoDate) || null;

  const baseSchedule = todayHoliday ? todayHoliday : todayRegular;
  const baseType = todayHoliday ? 'holiday' : 'regular';
  const baseReason = todayHoliday
    ? `Holiday (${todayHoliday.label || 'Event'})`
    : 'Regular Hours';

  const baseActiveRange = findActiveRange(currentMinutes, baseSchedule.ranges);
  const baseStatus = (!baseSchedule.isClosed && !!baseActiveRange) ? 'Open' : 'Closed';

  let activeTemporarySchedule = null;

  for (const temporarySchedule of temporaryHours) {
    if (!isInDateWindow(nowInBusinessTimezone, temporarySchedule.startDate, temporarySchedule.endDate)) {
      continue;
    }

    const activeRange = findActiveRange(currentMinutes, temporarySchedule.ranges);
    if (activeRange) {
      activeTemporarySchedule = {
        ...temporarySchedule,
        activeRange
      };
      break;
    }
  }

  let finalStatus = baseStatus;
  let finalType = baseType;
  let finalReason = baseReason;
  let isManualOverride = false;

  if (statusOverride !== 'auto') {
    isManualOverride = true;

    if (statusOverride === 'open') {
      finalStatus = 'Open';
      finalType = 'regular';
      finalReason = 'Manual Override';
    } else if (statusOverride === 'closed') {
      finalStatus = 'Closed';
      finalType = 'regular';
      finalReason = 'Manual Override';
    } else {
      finalStatus = 'Temporarily Unavailable';
      finalType = 'temporary';
      finalReason = 'Manual Override';
    }
  } else if (activeTemporarySchedule) {
    finalStatus = 'Temporarily Unavailable';
    finalType = 'temporary';
    finalReason = `Temporary (${activeTemporarySchedule.label || 'Schedule'})`;
  }

  let statusClass = 'status-closed';
  if (finalStatus === 'Open') {
    statusClass = 'status-open';
  } else if (finalStatus === 'Temporarily Unavailable') {
    statusClass = 'status-unavailable';
  }

  statusMainTextElement.className = 'status-main-text';
  statusMainTextElement.classList.add(statusClass);

  const normalizedDisplay = normalizeDisplayStatus(
    finalStatus,
    finalType,
    finalReason,
    isManualOverride
  );

  statusMainTextElement.textContent = normalizedDisplay.displayStatusText;
  statusReasonElement.textContent = normalizedDisplay.displayReasonText;

  let isClosingSoon = false;
  let isOpeningSoon = false;
  let isTemporaryStartingSoon = false;
  let isTemporaryEndingSoon = false;

  (function setTodayMeta() {
    if (finalType === 'temporary') {
      const todaySourceSchedule = baseSchedule;

      if (todaySourceSchedule.isClosed || !todaySourceSchedule.ranges.length) {
        setMetaRow('bizTodayHours', 'Temporarily Unavailable');
      } else if (todaySourceSchedule.ranges.length === 1) {
        const range = todaySourceSchedule.ranges[0];
        setMetaRow(
          'bizTodayHours',
          `${formatDisplayTimeBusinessInfo(range.open, visitorTimezone)} – ${formatDisplayTimeBusinessInfo(range.close, visitorTimezone)}`
        );
      } else {
        const joinedRanges = todaySourceSchedule.ranges
          .map((range) =>
            `${formatDisplayTimeBusinessInfo(range.open, visitorTimezone)}–${formatDisplayTimeBusinessInfo(range.close, visitorTimezone)}`
          )
          .join(', ');

        setMetaRow('bizTodayHours', joinedRanges);
      }
      return;
    }

    const schedule = baseSchedule;

    if (schedule.isClosed || !schedule.ranges.length) {
      setMetaRow('bizTodayHours', 'Closed');
      return;
    }

    if (schedule.ranges.length === 1) {
      const range = schedule.ranges[0];
      setMetaRow(
        'bizTodayHours',
        `${formatDisplayTimeBusinessInfo(range.open, visitorTimezone)} – ${formatDisplayTimeBusinessInfo(range.close, visitorTimezone)}`
      );
      return;
    }

    const joinedRanges = schedule.ranges
      .map((range) =>
        `${formatDisplayTimeBusinessInfo(range.open, visitorTimezone)}–${formatDisplayTimeBusinessInfo(range.close, visitorTimezone)}`
      )
      .join(', ');

    setMetaRow('bizTodayHours', joinedRanges);
  })();

  (function setSubStatusAndNextOpen() {
    statusSubTextElement.textContent = '';
    setMetaRow('bizNextOpen', '—');

    const formatDayLabelFromDateTime = (dateTime) => {
      if (!LuxonLibrary || !nowInBusinessTimezone || !dateTime) return 'Today';

      if (dateTime.hasSame(nowInBusinessTimezone, 'day')) {
        return 'Today';
      }

      if (dateTime.hasSame(nowInBusinessTimezone.plus({ days: 1 }), 'day')) {
        return 'Tomorrow';
      }

      return dateTime.toFormat('cccc');
    };

    if (finalType === 'temporary' && isManualOverride) {
      statusSubTextElement.textContent = 'Manual temporary override is active';
      setMetaRow('bizNextOpen', '—');
      return;
    }

    if (finalType === 'temporary' && !isManualOverride) {
      const activeRange = activeTemporarySchedule?.activeRange;

      if (!LuxonLibrary || !nowInBusinessTimezone || !activeRange?.close) {
        statusSubTextElement.textContent = 'Temporarily unavailable';
        setMetaRow('bizNextOpen', '—');
        return;
      }

      const temporaryCloseMinutes = timeStringToMinutes(activeRange.close);

      if (temporaryCloseMinutes == null) {
        statusSubTextElement.textContent = 'Temporarily unavailable';
        setMetaRow('bizNextOpen', '—');
        return;
      }

      const reopeningDateTime = nowInBusinessTimezone.startOf('day').plus({
        minutes: temporaryCloseMinutes
      });

      const minutesAway = minutesUntilLuxon(nowInBusinessTimezone, reopeningDateTime);

      if (minutesAway != null && minutesAway > 0) {
        const reopeningTimeText = formatDisplayTimeBusinessInfo(
          activeRange.close,
          visitorTimezone
        );

        const nextOpenLabel = formatDayLabelFromDateTime(reopeningDateTime);

        setMetaRow('bizNextOpen', `${nextOpenLabel} • ${reopeningTimeText}`);

        if (minutesAway <= TEMPORARY_WARNING_MINUTES) {
          isTemporaryEndingSoon = true;
          statusSubTextElement.textContent = `Reopens in ${formatDuration(minutesAway)}`;
        } else if (nextOpenLabel === 'Today') {
          statusSubTextElement.textContent = `Reopens today at ${reopeningTimeText}`;
        } else if (nextOpenLabel === 'Tomorrow') {
          statusSubTextElement.textContent = `Reopens tomorrow at ${reopeningTimeText}`;
        } else {
          statusSubTextElement.textContent = `Reopens ${nextOpenLabel} at ${reopeningTimeText}`;
        }

        return;
      }

      const nextOpeningAfterTemporary = getNextOpeningInfo(
        nowInBusinessTimezone,
        currentMinutes,
        regularHours,
        holidayHours,
        {
          startOffset: 0,
          minMinutesToday: currentMinutes
        }
      );

      if (nextOpeningAfterTemporary) {
        const prettyTime = formatDisplayTimeBusinessInfo(
          nextOpeningAfterTemporary.timeString,
          visitorTimezone
        );

        setMetaRow('bizNextOpen', `${nextOpeningAfterTemporary.dayLabel} • ${prettyTime}`);

        if (nextOpeningAfterTemporary.offset === 0) {
          statusSubTextElement.textContent = `Reopens today at ${prettyTime}`;
        } else if (nextOpeningAfterTemporary.offset === 1) {
          statusSubTextElement.textContent = `Reopens tomorrow at ${prettyTime}`;
        } else {
          statusSubTextElement.textContent = `Reopens ${nextOpeningAfterTemporary.dayLabel} at ${prettyTime}`;
        }
      } else {
        statusSubTextElement.textContent = '';
        setMetaRow('bizNextOpen', '—');
      }

      return;
    }

    if (finalType === 'holiday') {
      if (!LuxonLibrary || !nowInBusinessTimezone) {
        statusSubTextElement.textContent = '';
        setMetaRow('bizNextOpen', '—');
        return;
      }

      const holidaySchedule = baseSchedule;
      const holidayActiveRange = findActiveRange(currentMinutes, holidaySchedule.ranges);

      if (finalStatus === 'Open' && holidayActiveRange) {
        const closeMinutes = timeStringToMinutes(holidayActiveRange.close);

        if (closeMinutes != null) {
          const closeDateTime = nowInBusinessTimezone.startOf('day').plus({
            minutes: closeMinutes
          });

          const minutesAway = minutesUntilLuxon(nowInBusinessTimezone, closeDateTime);

          const nextHolidayOpeningToday = getNextOpenForDay(
            currentMinutes,
            0,
            {
              schedule: holidaySchedule,
              targetDay: nowInBusinessTimezone.startOf('day'),
              labelDay: getBusinessDayName(nowInBusinessTimezone),
              type: 'holiday'
            }
          );

          if (minutesAway != null && minutesAway > 0 && minutesAway <= GENERAL_WARNING_MINUTES) {
            isClosingSoon = true;
            statusSubTextElement.textContent = `Closes in ${formatDuration(minutesAway)}`;
          } else {
            statusSubTextElement.textContent =
              `Until ${formatDisplayTimeBusinessInfo(holidayActiveRange.close, visitorTimezone)}`;
          }

          if (nextHolidayOpeningToday) {
            const openMinutes = timeStringToMinutes(nextHolidayOpeningToday);
            const nextHolidayOpenDateTime = nowInBusinessTimezone.startOf('day').plus({
              minutes: openMinutes == null ? 0 : openMinutes
            });
            const prettyNextTime = formatDisplayTimeBusinessInfo(nextHolidayOpeningToday, visitorTimezone);
            const nextOpenLabel = formatDayLabelFromDateTime(nextHolidayOpenDateTime);

            setMetaRow('bizNextOpen', `${nextOpenLabel} • ${prettyNextTime}`);
          } else {
            setMetaRow('bizNextOpen', '—');
          }
        } else {
          statusSubTextElement.textContent = '';
          setMetaRow('bizNextOpen', '—');
        }

        return;
      }

      if (!holidaySchedule.isClosed && holidaySchedule.ranges.length) {
        const nextHolidayOpeningToday = getNextOpenForDay(
          currentMinutes,
          0,
          {
            schedule: holidaySchedule,
            targetDay: nowInBusinessTimezone.startOf('day'),
            labelDay: getBusinessDayName(nowInBusinessTimezone),
            type: 'holiday'
          }
        );

        if (nextHolidayOpeningToday) {
          const prettyTime = formatDisplayTimeBusinessInfo(nextHolidayOpeningToday, visitorTimezone);
          const openingMinutes = timeStringToMinutes(nextHolidayOpeningToday);
          const openingDateTime = nowInBusinessTimezone.startOf('day').plus({
            minutes: openingMinutes == null ? 0 : openingMinutes
          });

          const minutesAway = minutesUntilLuxon(nowInBusinessTimezone, openingDateTime);
          const nextOpenLabel = formatDayLabelFromDateTime(openingDateTime);

          setMetaRow('bizNextOpen', `${nextOpenLabel} • ${prettyTime}`);

          if (minutesAway != null && minutesAway > 0 && minutesAway <= GENERAL_WARNING_MINUTES) {
            isOpeningSoon = true;
            statusSubTextElement.textContent = `Opens in ${formatDuration(minutesAway)}`;
          } else if (hadAnyOpenEarlierToday(currentMinutes, holidaySchedule)) {
            statusSubTextElement.textContent = `Opens again today at ${prettyTime}`;
          } else if (nextOpenLabel === 'Today') {
            statusSubTextElement.textContent = `Opens today at ${prettyTime}`;
          } else if (nextOpenLabel === 'Tomorrow') {
            statusSubTextElement.textContent = `Opens tomorrow at ${prettyTime}`;
          } else {
            statusSubTextElement.textContent = `Opens ${nextOpenLabel} at ${prettyTime}`;
          }

          return;
        }
      }

      const nextOpeningAfterHoliday = getNextOpeningInfo(
        nowInBusinessTimezone,
        currentMinutes,
        regularHours,
        holidayHours,
        {
          startOffset: 1,
          minMinutesToday: currentMinutes
        }
      );

      if (nextOpeningAfterHoliday) {
        const prettyTime = formatDisplayTimeBusinessInfo(
          nextOpeningAfterHoliday.timeString,
          visitorTimezone
        );

        setMetaRow('bizNextOpen', `${nextOpeningAfterHoliday.dayLabel} • ${prettyTime}`);

        if (nextOpeningAfterHoliday.offset === 1) {
          statusSubTextElement.textContent = `Reopens tomorrow at ${prettyTime}`;
        } else {
          statusSubTextElement.textContent = `Reopens ${nextOpeningAfterHoliday.dayLabel} at ${prettyTime}`;
        }
      } else {
        statusSubTextElement.textContent = '';
        setMetaRow('bizNextOpen', '—');
      }

      return;
    }

    let soonestTemporaryStart = null;

    if (LuxonLibrary && nowInBusinessTimezone) {
      for (const temporarySchedule of temporaryHours) {
        if (!isInDateWindow(nowInBusinessTimezone, temporarySchedule.startDate, temporarySchedule.endDate)) {
          continue;
        }

        for (const range of temporarySchedule.ranges) {
          const openMinutes = timeStringToMinutes(range.open);
          if (openMinutes == null) continue;

          const startDateTime = nowInBusinessTimezone.startOf('day').plus({
            minutes: openMinutes
          });

          const minutesAway = minutesUntilLuxon(nowInBusinessTimezone, startDateTime);

          if (minutesAway != null && minutesAway > 0 && minutesAway <= TEMPORARY_WARNING_MINUTES) {
            if (soonestTemporaryStart == null || minutesAway < soonestTemporaryStart) {
              soonestTemporaryStart = minutesAway;
            }
          }
        }
      }
    }

    if (soonestTemporaryStart != null) {
      isTemporaryStartingSoon = true;
      statusSubTextElement.textContent = `Temporarily unavailable in ${formatDuration(soonestTemporaryStart)}`;
      return;
    }

    if (finalStatus === 'Open') {
      const activeRange = baseActiveRange;

      if (activeRange && LuxonLibrary && nowInBusinessTimezone) {
        const closeMinutes = timeStringToMinutes(activeRange.close);

        if (closeMinutes != null) {
          const closeDateTime = nowInBusinessTimezone.startOf('day').plus({
            minutes: closeMinutes
          });

          const minutesAway = minutesUntilLuxon(nowInBusinessTimezone, closeDateTime);

          if (minutesAway != null && minutesAway > 0 && minutesAway <= GENERAL_WARNING_MINUTES) {
            isClosingSoon = true;
            statusSubTextElement.textContent = `Closes in ${formatDuration(minutesAway)}`;
          } else {
            statusSubTextElement.textContent =
              `Until ${formatDisplayTimeBusinessInfo(activeRange.close, visitorTimezone)}`;
          }
        } else {
          statusSubTextElement.textContent = '';
        }
      }

      setMetaRow('bizNextOpen', '—');
      return;
    }

    if (!LuxonLibrary || !nowInBusinessTimezone) {
      statusSubTextElement.textContent = '';
      setMetaRow('bizNextOpen', '—');
      return;
    }

    for (let offset = 0; offset < 7; offset += 1) {
      const scheduleObject = getScheduleForOffset(
        nowInBusinessTimezone,
        offset,
        regularHours,
        holidayHours
      );

      if (!scheduleObject) continue;

      const schedule = scheduleObject.schedule;
      if (!schedule || schedule.isClosed || !schedule.ranges.length) continue;

      const nextOpenTime = getNextOpenForDay(currentMinutes, offset, scheduleObject);
      if (!nextOpenTime) continue;

      const prettyTime = formatDisplayTimeBusinessInfo(nextOpenTime, visitorTimezone);

      if (offset === 0) {
        setMetaRow('bizNextOpen', `Today • ${prettyTime}`);
      } else if (offset === 1) {
        setMetaRow('bizNextOpen', `Tomorrow • ${prettyTime}`);
      } else {
        setMetaRow('bizNextOpen', `${capitalizeFirstLetter(scheduleObject.labelDay)} • ${prettyTime}`);
      }

      const openMinutes = timeStringToMinutes(nextOpenTime);
      const openDateTime = scheduleObject.targetDay.plus({
        minutes: openMinutes == null ? 0 : openMinutes
      });

      const minutesAway = minutesUntilLuxon(nowInBusinessTimezone, openDateTime);

      if (offset === 0 && minutesAway != null && minutesAway > 0 && minutesAway <= GENERAL_WARNING_MINUTES) {
        isOpeningSoon = true;
        statusSubTextElement.textContent = `Opens in ${formatDuration(minutesAway)}`;
        return;
      }

      if (offset === 0) {
        const reopensLaterToday = hadAnyOpenEarlierToday(currentMinutes, schedule);
        statusSubTextElement.textContent = reopensLaterToday
          ? `Opens again at ${prettyTime}`
          : `Opens today at ${prettyTime}`;
        return;
      }

      if (offset === 1) {
        statusSubTextElement.textContent = `Opens tomorrow at ${prettyTime}`;
        return;
      }

      statusSubTextElement.textContent =
        `Opens ${capitalizeFirstLetter(scheduleObject.labelDay)} at ${prettyTime}`;
      return;
    }

    statusSubTextElement.textContent = '';
    setMetaRow('bizNextOpen', '—');
  })();

  const subStatusText = statusSubTextElement.textContent || '';
  const visualTheme = getBusinessTimeTheme(nowInBusinessTimezone);
  const visualState = getVisualBusinessState({
    finalStatus,
    finalType,
    subStatusText,
    nowInBusinessTimezone,
    baseActiveRange
  });

  setStatusHint(
    buildPremiumStatusHint({
      finalStatus,
      finalType,
      isManualOverride,
      isClosingSoon,
      isOpeningSoon,
      isTemporaryStartingSoon,
      isTemporaryEndingSoon,
      statusSubText: statusSubTextElement.textContent || ''
    })
  );

  renderTodayTimeline({
    schedule: baseSchedule,
    currentMinutes,
    visitorTimezone
  });

  setStatusChip(finalStatus, finalType, isManualOverride);
  setTrafficLight({
    statusText: finalStatus,
    statusType: finalType,
    isManualOverride,
    isClosingSoon,
    isOpeningSoon,
    isTemporaryStartingSoon,
    isTemporaryEndingSoon
  });
  applyBusinessVisualState({
    state: visualState,
    theme: visualTheme
  });

  (function renderRegularHours() {
    const weekOrder = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday'
    ];

    const visitorLocalDayName = LuxonLibrary
      ? LuxonLibrary.DateTime.now().setZone(visitorTimezone).toFormat('cccc').toLowerCase()
      : new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

    let html = '<ul class="regular-hours-list">';

    weekOrder.forEach((day) => {
      const dayObject = regularHours[day] || { isClosed: true, ranges: [] };
      const isCurrentDay = day === visitorLocalDayName;

      html += `<li class="${isCurrentDay ? 'current-day' : ''}">
        <strong>${capitalizeFirstLetter(day)}:</strong>`;

      if (dayObject.isClosed) {
        html += '<div class="hours-line">Closed</div>';
      } else if (!dayObject.ranges.length) {
        html += '<div class="hours-line">No hours added</div>';
      } else {
        dayObject.ranges.forEach((range) => {
          html += `<div class="hours-line additional-hours">
            ${formatDisplayTimeBusinessInfo(range.open, visitorTimezone)} - ${formatDisplayTimeBusinessInfo(range.close, visitorTimezone)}
          </div>`;
        });
      }

      html += '</li>';
    });

    html += '</ul>';
    html += `<p class="hours-timezone-note">Hours displayed in your local time zone: ${escapeHtml(String(visitorTimezone).replace(/_/g, ' '))}</p>`;

    regularHoursElement.innerHTML = html;
  })();

  (function renderTemporaryHours() {
    if (!temporaryHours.length) {
      temporaryHoursElement.innerHTML = '';
      temporaryHoursElement.style.display = 'none';
      return;
    }

    let html = '<h4>Active and Temporary Hours</h4><ul class="special-hours-display">';

    for (const temporarySchedule of temporaryHours) {
      let statusLabel = '';

      if (LuxonLibrary && nowInBusinessTimezone) {
        const startDateTime = parseBusinessIsoDate(temporarySchedule.startDate);
        const endDateTime = parseBusinessIsoDate(temporarySchedule.endDate);

        if (startDateTime && endDateTime) {
          let earliestOpenMinutes = null;
          let latestCloseMinutes = null;

          temporarySchedule.ranges.forEach((range) => {
            const openMinutes = timeStringToMinutes(range.open);
            const closeMinutes = timeStringToMinutes(range.close);

            if (openMinutes != null && (earliestOpenMinutes == null || openMinutes < earliestOpenMinutes)) {
              earliestOpenMinutes = openMinutes;
            }

            if (closeMinutes != null && (latestCloseMinutes == null || closeMinutes > latestCloseMinutes)) {
              latestCloseMinutes = closeMinutes;
            }
          });

          const isSingleDaySchedule =
            temporarySchedule.startDate === temporarySchedule.endDate;

          if (isSingleDaySchedule) {
            statusLabel = getScheduledLabel({
              nowInBusinessTimezone,
              startDateTime,
              endDateTime,
              earliestOpenMinutes,
              latestCloseMinutes,
              isClosedAllDay: temporarySchedule.ranges.length === 0
            });
          } else {
            const differenceInDays = Math.round(
              startDateTime.startOf('day').diff(nowInBusinessTimezone.startOf('day'), 'days').days
            );

            if (differenceInDays > 1) {
              statusLabel = `Scheduled in ${differenceInDays} days`;
            } else if (differenceInDays === 1) {
              statusLabel = 'Scheduled for Tomorrow';
            } else if (nowInBusinessTimezone > endDateTime.endOf('day')) {
              statusLabel = 'Concluded';
            } else {
              statusLabel = 'In Effect';
            }
          }
        }
      }

      const rangeText = temporarySchedule.ranges
        .map((range) =>
          `${formatDisplayTimeBusinessInfo(range.open, visitorTimezone)} - ${formatDisplayTimeBusinessInfo(range.close, visitorTimezone)}`
        )
        .join(', ');

      html += `<li>
        <strong>${escapeHtml(temporarySchedule.label || 'Temporary Schedule')}</strong>
        <span class="hours">${escapeHtml(rangeText || '—')}</span>
        <span class="dates">${escapeHtml(formatDate(temporarySchedule.startDate))} to ${escapeHtml(formatDate(temporarySchedule.endDate))}</span>
        <span class="days-until">${escapeHtml(statusLabel)}</span>
      </li>`;
    }

    html += '</ul>';
    temporaryHoursElement.innerHTML = html;
    temporaryHoursElement.style.display = 'block';
  })();

  (function renderHolidayHours() {
    if (!holidayHours.length) {
      holidayHoursElement.innerHTML = '';
      holidayHoursElement.style.display = 'none';
      return;
    }

    let html = '<h4>Active and Holiday Hours</h4><ul class="special-hours-display">';

    for (const holiday of holidayHours) {
      let statusLabel = '';

      if (LuxonLibrary && nowInBusinessTimezone) {
        const holidayDateTime = parseBusinessIsoDate(holiday.date);

        if (holidayDateTime) {
          let earliestOpenMinutes = null;
          let latestCloseMinutes = null;

          if (holiday.ranges && holiday.ranges.length) {
            holiday.ranges.forEach((range) => {
              const openMinutes = timeStringToMinutes(range.open);
              const closeMinutes = timeStringToMinutes(range.close);

              if (openMinutes != null && (earliestOpenMinutes == null || openMinutes < earliestOpenMinutes)) {
                earliestOpenMinutes = openMinutes;
              }

              if (closeMinutes != null && (latestCloseMinutes == null || closeMinutes > latestCloseMinutes)) {
                latestCloseMinutes = closeMinutes;
              }
            });
          }

          statusLabel = getScheduledLabel({
            nowInBusinessTimezone,
            startDateTime: holidayDateTime,
            endDateTime: holidayDateTime,
            earliestOpenMinutes,
            latestCloseMinutes,
            isClosedAllDay: !!holiday.isClosed
          });
        }
      }

      const rangeText = holiday.isClosed
        ? 'Closed'
        : holiday.ranges
            .map((range) =>
              `${formatDisplayTimeBusinessInfo(range.open, visitorTimezone)} - ${formatDisplayTimeBusinessInfo(range.close, visitorTimezone)}`
            )
            .join(', ');

      html += `<li>
        <strong>${escapeHtml(holiday.label || 'Holiday')}</strong>
        <span class="hours">${escapeHtml(rangeText || '—')}</span>
        <span class="dates">${escapeHtml(formatDate(holiday.date))}</span>
        <span class="days-until">${escapeHtml(statusLabel)}</span>
      </li>`;
    }

    html += '</ul>';
    holidayHoursElement.innerHTML = html;
    holidayHoursElement.style.display = 'block';
  })();
}

/* -------------------------
   ERROR / CACHE RENDER
------------------------- */
function renderErrorState(message = 'Error Loading') {
  const statusElement = document.getElementById('business-status-display');
  if (!statusElement) return;

  const statusMainElement = statusElement.querySelector('.status-main-text');
  const statusSubElement = statusElement.querySelector('.status-countdown-text');
  const reasonElement = statusElement.querySelector('.status-reason-text');

  if (statusMainElement) {
    statusMainElement.textContent = message;
    statusMainElement.className = 'status-main-text status-unavailable';
  }

  if (statusSubElement) {
    statusSubElement.textContent = '';
  }

  if (reasonElement) {
    reasonElement.textContent = '';
  }

  setStatusHint('Business information is temporarily unavailable.');
  setMetaRow('bizNextOpen', '—');
  setMetaRow('bizTodayHours', '—');
  setStatusChip('Temporary Closure', 'temporary', true);
  setTrafficLight({
    statusText: 'Temporary Closure',
    statusType: 'temporary',
    isManualOverride: true
  });
  applyBusinessVisualState({
    state: 'closed',
    theme: 'day'
  });
  renderTodayTimeline({
    schedule: { isClosed: true, ranges: [] },
    currentMinutes: 0,
    visitorTimezone: cachedVisitorTimezone || 'UTC'
  });
}

function renderFromCache() {
  cachedVisitorTimezone = getVisitorTimezoneSafe();
  setMetaRow('bizUserTz', cachedVisitorTimezone);
  setLocalTimeLine(cachedVisitorTimezone);
  formatStoreLocalTime();
  updateBizTimeFormatToggleUI();

  if (!cachedBusinessData) return;

  calculateAndDisplayStatusBusinessInfo(cachedBusinessData, cachedVisitorTimezone);
}

/* -------------------------
   FIRESTORE LOADING
------------------------- */
async function oneTimeFetchFallback() {
  setMetaRow('bizNextOpen', '—');
  setMetaRow('bizTodayHours', '—');

  if (!businessDocumentReferenceLocal || typeof getDoc !== 'function') {
    renderErrorState('Status Error');
    return;
  }

  try {
    const documentSnapshot = await getDoc(businessDocumentReferenceLocal);

    if (!documentSnapshot.exists()) {
      const regularHoursElement = document.getElementById('business-hours-display');
      if (regularHoursElement) {
        regularHoursElement.innerHTML = '<p>Hours not available.</p>';
      }

      cachedBusinessData = null;
      renderErrorState('Not Available');
      return;
    }

    cachedBusinessData = documentSnapshot.data() || {};
    renderFromCache();
  } catch (error) {
    console.error(error);
    cachedBusinessData = null;
    renderErrorState('Error Loading');
  }
}

function stopBusinessInfoRefresh() {
  if (typeof unsubscribeBusinessListener === 'function') {
    unsubscribeBusinessListener();
    unsubscribeBusinessListener = null;
  }

  if (minuteRefreshTimer) {
    clearInterval(minuteRefreshTimer);
    minuteRefreshTimer = null;
  }

  if (minuteBoundaryTimeout) {
    clearTimeout(minuteBoundaryTimeout);
    minuteBoundaryTimeout = null;
  }

  if (localClockTimer) {
    clearInterval(localClockTimer);
    localClockTimer = null;
  }
}

function startBusinessInfoRefresh() {
  installPanelToggle();
  installCopyToday();
  installBusinessTimeFormatToggle();

  cachedVisitorTimezone = getVisitorTimezoneSafe();
  setMetaRow('bizUserTz', cachedVisitorTimezone);
  setLocalTimeLine(cachedVisitorTimezone);
  formatStoreLocalTime();
  setMetaRow('bizNextOpen', '—');
  setMetaRow('bizTodayHours', '—');
  updateBizTimeFormatToggleUI();

  startLiveLocalClock();

  if (businessDocumentReferenceLocal && typeof onSnapshot === 'function') {
    try {
      unsubscribeBusinessListener = onSnapshot(
        businessDocumentReferenceLocal,
        (documentSnapshot) => {
          cachedBusinessData = documentSnapshot.exists()
            ? (documentSnapshot.data() || {})
            : null;

          renderFromCache();
        },
        (error) => {
          console.error(error);
          cachedBusinessData = null;
          renderErrorState('Error Loading');
        }
      );
    } catch (error) {
      console.error(error);
      oneTimeFetchFallback();
    }
  } else {
    oneTimeFetchFallback();
  }

  startMinuteAlignedRefresh();
}

/* -------------------------
   OPTIONAL COMPATIBILITY WRAPPER
------------------------- */
async function displayBusinessInfo() {
  renderFromCache();

  if (!cachedBusinessData) {
    await oneTimeFetchFallback();
  }
}

/* -------------------------
   INITIAL HOOK
------------------------- */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startBusinessInfoRefresh);
} else {
  startBusinessInfoRefresh();
}

document.addEventListener("DOMContentLoaded", () => {
  // === GLOW TYPING LOGIC (your original) ===
  document.querySelectorAll(".search-container.unified .creator-search").forEach(input => {
    const container = input.closest(".search-container.unified");

    const setTyping = () => {
      if (input.value.trim()) {
        container.classList.add("typing");
      } else {
        container.classList.remove("typing");
      }
    };

    setTyping();

    input.addEventListener("input", setTyping);
    input.addEventListener("change", setTyping);
    input.addEventListener("blur", setTyping);
  });

  // === SEARCH + NO RESULTS LOGIC ===
  document.querySelectorAll(".creator-search").forEach(input => {
    input.addEventListener("input", () => {
      const targetId = input.dataset.target;
      const container = document.getElementById(targetId);
      if (!container) return;

      const filter = input.value.toLowerCase().trim();
      const items = container.querySelectorAll("li, a, p, div");

      let visibleCount = 0;

      items.forEach(item => {
        const text = item.textContent.toLowerCase();

        if (text.includes(filter)) {
          item.style.display = "";
          visibleCount++;
        } else {
          item.style.display = "none";
        }
      });

      // Which "no results" message to update?
      let msgId = {
        "social-links-container": "no-results-social",
        "useful-links-container": "no-results-useful",
        "disabilities-list-placeholder": "no-results-disabilities"
      }[targetId];

      const msg = document.getElementById(msgId);

      if (msg) {
        msg.style.display = visibleCount === 0 ? "block" : "none";
      }
    });
  });
});

/* ========================================================= */
/* == QUOTE OF THE DAY MODULE (Local + Custom + Manager) == */
/* ========================================================= */

function getAllLocalQuotes() {
  const baseQuotes = {
    inspirational: [
      { content: "The best way to get started is to quit talking and begin doing.", author: "Walt Disney" },
      { content: "Don’t watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
      { content: "Success is not final; failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" }
    ],
    life: [
      { content: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
      { content: "The purpose of life is to live it, to taste experience to the utmost.", author: "Eleanor Roosevelt" }
    ],
    technology: [
      { content: "Technology is best when it brings people together.", author: "Matt Mullenweg" },
      { content: "Any sufficiently advanced technology is indistinguishable from magic.", author: "Arthur C. Clarke" },
      { content: "The real problem is not whether machines think but whether men do.", author: "B.F. Skinner" }
    ],
    programming: [
      { content: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
      { content: "First, solve the problem. Then, write the code.", author: "John Johnson" },
      { content: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson" }
    ],
    cybersecurity: [
      { content: "Security is not a product, but a process.", author: "Bruce Schneier" },
      { content: "The only truly secure system is one that is powered off.", author: "Gene Spafford" },
      { content: "Amateurs hack systems, professionals hack people.", author: "Bruce Schneier" }
    ],
    ai: [
      { content: "Artificial Intelligence is the new electricity.", author: "Andrew Ng" },
      { content: "The question is not whether intelligent machines can have emotions, but whether machines can be intelligent without emotions.", author: "Marvin Minsky" }
    ],
    business: [
      { content: "Opportunities don’t happen. You create them.", author: "Chris Grosser" },
      { content: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" }
    ]
  };

  const customQuotes = JSON.parse(localStorage.getItem("customQuotes") || "{}");
  for (const cat in customQuotes) {
    if (!baseQuotes[cat]) baseQuotes[cat] = [];
    baseQuotes[cat] = baseQuotes[cat].concat(customQuotes[cat]);
  }

  return baseQuotes;
}

/* ========================================================= */
/* == MAIN QUOTE LOADER == */
/* ========================================================= */

async function loadQuoteOfTheDay(forceRefresh = false) {
  const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
  const quoteSection = document.getElementById("quote-section");
  if (!quoteSection) return;

  const showQuote =
    settings.showQuoteSection === "enabled" ||
    settings.showQuoteSection === undefined ||
    settings.showQuoteSection === null;
  quoteSection.style.display = showQuote ? "" : "none";
  if (!showQuote) return;

  const quoteText = document.getElementById("quote-text");
  const quoteAuthor = document.getElementById("quote-author");
  const quoteDateEl = document.getElementById("quote-date");
  if (!quoteText || !quoteAuthor) return;

  const now = new Date();
  const formattedDate = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  if (quoteDateEl) quoteDateEl.textContent = formattedDate;

  const today = now.toDateString();
  const category = settings.quoteCategory || "inspirational";
  const storedDate = localStorage.getItem("quoteDate");
  const storedCategory = localStorage.getItem("quoteCategory");
  const storedQuote = localStorage.getItem("quoteOfTheDay");

  if (!forceRefresh && storedDate === today && storedQuote && storedCategory === category) {
    try {
      const { content, author } = JSON.parse(storedQuote);
      quoteText.textContent = `“${content}”`;
      quoteAuthor.textContent = `— ${author || "Unknown"}`;
      quoteSection.classList.add("loaded");
      return;
    } catch (err) {
      console.warn("Cached quote parse failed:", err);
    }
  }

  const allQuotes = getAllLocalQuotes();
  let quotes = allQuotes[category];
  if (!quotes || quotes.length === 0) quotes = allQuotes.inspirational;

  const chosen = quotes[Math.floor(Math.random() * quotes.length)];

  quoteText.textContent = `“${chosen.content}”`;
  quoteAuthor.textContent = `— ${chosen.author || "Unknown"}`;

  localStorage.setItem("quoteOfTheDay", JSON.stringify(chosen));
  localStorage.setItem("quoteDate", today);
  localStorage.setItem("quoteCategory", category);

  quoteSection.classList.add("loaded");
}

/* ========================================================= */
/* == CATEGORY HANDLING == */
/* ========================================================= */

function setupQuoteCategorySelector() {
  const categorySelect = document.getElementById("quote-category");
  const customContainer = document.getElementById("custom-category-container");
  const customInput = document.getElementById("custom-category-input");
  const saveCustomBtn = document.getElementById("save-custom-category");

  if (!categorySelect || !customInput || !saveCustomBtn) return;

  const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
  const savedCategories = JSON.parse(localStorage.getItem("customQuoteCategories") || "[]");
  const currentCategory = settings.quoteCategory || "inspirational";

  const baseCategories = [
    "inspirational", "life", "technology", "programming", "cybersecurity", "ai", "business"
  ];

  categorySelect.innerHTML = "";

  baseCategories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    categorySelect.appendChild(opt);
  });

  if (savedCategories.length > 0) {
    const optGroup = document.createElement("optgroup");
    optGroup.label = "Custom Categories";
    savedCategories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = `🌟 ${cat}`;
      optGroup.appendChild(opt);
    });
    categorySelect.appendChild(optGroup);
  }

  const customOpt = document.createElement("option");
  customOpt.value = "custom";
  customOpt.textContent = "➕ Add new category…";
  categorySelect.appendChild(customOpt);

  categorySelect.value =
    (baseCategories.includes(currentCategory) || savedCategories.includes(currentCategory))
      ? currentCategory
      : "inspirational";

  categorySelect.addEventListener("change", () => {
    if (categorySelect.value === "custom") {
      customContainer.style.display = "flex";
      customInput.focus();
    } else {
      customContainer.style.display = "none";
      updateQuoteCategory(categorySelect.value);
    }
  });

  saveCustomBtn.addEventListener("click", () => {
    const newCategory = customInput.value
      .trim()
      .replace(/[^a-z0-9-_\s]/gi, '')
      .toLowerCase();
    if (!newCategory) {
      alert("Please enter a valid category name!");
      return;
    }

    const saved = JSON.parse(localStorage.getItem("customQuoteCategories") || "[]");
    if (!saved.includes(newCategory)) saved.push(newCategory);
    localStorage.setItem("customQuoteCategories", JSON.stringify(saved));

    updateQuoteCategory(newCategory, true);
    setupQuoteCategorySelector();
    customContainer.style.display = "none";
    customInput.value = "";
  });
}

function updateQuoteCategory(category, forceReload = false) {
  const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
  settings.quoteCategory = category;
  localStorage.setItem("websiteSettings", JSON.stringify(settings));

  localStorage.removeItem("quoteOfTheDay");
  localStorage.setItem("quoteCategory", category);

  loadQuoteOfTheDay(true);
}

/* ========================================================= */
/* == CUSTOM QUOTE ADDER & MANAGER == */
/* ========================================================= */

function setupCustomQuoteAdder() {
  const addQuoteBtn = document.getElementById("add-custom-quote-btn");
  const customQuoteModal = document.getElementById("custom-quote-modal");
  const saveQuoteBtn = document.getElementById("save-custom-quote");
  const cancelQuoteBtn = document.getElementById("cancel-custom-quote");
  const quoteInput = document.getElementById("new-quote-text");
  const authorInput = document.getElementById("new-quote-author");
  const categorySelect = document.getElementById("new-quote-category");

  if (!addQuoteBtn || !customQuoteModal) return;

  addQuoteBtn.addEventListener("click", () => {
    updateQuoteCategoryOptions(categorySelect);
    customQuoteModal.classList.remove("hidden");
  });

  cancelQuoteBtn.addEventListener("click", () => {
    customQuoteModal.classList.add("hidden");
    quoteInput.value = "";
    authorInput.value = "";
  });

  saveQuoteBtn.addEventListener("click", () => {
    const quoteText = quoteInput.value.trim();
    const author = authorInput.value.trim() || "Unknown";
    const category = categorySelect.value;

    if (!quoteText) {
      alert("Please enter a quote!");
      return;
    }

    const customQuotes = JSON.parse(localStorage.getItem("customQuotes") || "{}");
    if (!customQuotes[category]) customQuotes[category] = [];
    customQuotes[category].push({ content: quoteText, author });
    localStorage.setItem("customQuotes", JSON.stringify(customQuotes));

    alert(`Quote added to "${category}"!`);
    customQuoteModal.classList.add("hidden");
    quoteInput.value = "";
    authorInput.value = "";

    loadQuoteOfTheDay(true);
  });
}

function updateQuoteCategoryOptions(select) {
  if (!select) return;
  select.innerHTML = "";

  const baseCategories = [
    "inspirational", "life", "technology", "programming", "cybersecurity", "ai", "business"
  ];
  const customCategories = JSON.parse(localStorage.getItem("customQuoteCategories") || "[]");
  [...baseCategories, ...customCategories].forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    select.appendChild(opt);
  });
}

/* ========================================================= */
/* == VIEW & DELETE CUSTOM QUOTES == */
/* ========================================================= */

function setupCustomQuoteManager() {
  const manageBtn = document.getElementById("manage-custom-quotes-btn");
  const managerModal = document.getElementById("custom-quotes-manager");
  const closeManagerBtn = document.getElementById("close-manager-btn");
  const quoteList = document.getElementById("custom-quote-list");
  const categorySelect = document.getElementById("manager-category-select");

  if (!manageBtn) return;

  manageBtn.addEventListener("click", () => {
    updateQuoteCategoryOptions(categorySelect);
    loadCustomQuotesIntoList(categorySelect.value);
    managerModal.classList.remove("hidden");
  });

  closeManagerBtn.addEventListener("click", () => {
    managerModal.classList.add("hidden");
  });

  categorySelect.addEventListener("change", () => {
    loadCustomQuotesIntoList(categorySelect.value);
  });

  function loadCustomQuotesIntoList(category) {
    quoteList.innerHTML = "";
    const customQuotes = JSON.parse(localStorage.getItem("customQuotes") || "{}");
    const quotes = (customQuotes[category] || []);
    if (quotes.length === 0) {
      quoteList.innerHTML = "<li>No custom quotes for this category.</li>";
      return;
    }

    quotes.forEach((q, idx) => {
      const li = document.createElement("li");
      li.textContent = `"${q.content}" — ${q.author}`;
      const del = document.createElement("button");
      del.textContent = "🗑️";
      del.addEventListener("click", () => {
        if (confirm("Delete this quote?")) {
          quotes.splice(idx, 1);
          customQuotes[category] = quotes;
          localStorage.setItem("customQuotes", JSON.stringify(customQuotes));
          loadCustomQuotesIntoList(category);
        }
      });
      li.appendChild(del);
      quoteList.appendChild(li);
    });
  }
}

/* ========================================================= */
/* == NEXT QUOTE BUTTON == */
/* ========================================================= */

function setupNextQuoteButton() {
  const btn = document.getElementById("next-quote-btn");
  if (!btn) return;
  btn.addEventListener("click", () => loadQuoteOfTheDay(true));
}

/* ========================================================= */
/* == INIT on DOMContentLoaded == */
/* ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  loadQuoteOfTheDay();
  setupQuoteCategorySelector();
  setupNextQuoteButton();
  setupCustomQuoteAdder();
  setupCustomQuoteManager();
});

// ======================================================
// ===== BLOG LIST PAGE SPECIFIC FUNCTIONS
// ======================================================
async function initializeBlogListPageContent() {
    if (!firebaseAppInitialized) return;
    console.log("Initializing Blog List Page...");

    const postsGrid = document.getElementById('posts-grid');
    const featuredContainer = document.getElementById('featured-post-container');
    const categoryFiltersContainer = document.getElementById('category-filters');
    const searchInput = document.getElementById('search-input');
    let allPosts = [];

    // --- Helper: relative time formatting ---

    async function fetchPosts() {
        postsGrid.innerHTML = '<p>Loading latest posts...</p>';
        try {
            const postsQuery = query(postsCollectionRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(postsQuery);
            if (snapshot.empty) {
                postsGrid.innerHTML = '<p>No posts have been published yet.</p>';
                return;
            }
            allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            displayPosts(allPosts);
            populateCategories(allPosts);
            displayFeaturedPost(allPosts);
        } catch (error) {
            console.error("Error fetching posts:", error);
            postsGrid.innerHTML = `<p class="error">Error loading posts. Check Firestore rules and console.</p>`;
        }
    }

   function displayFeaturedPost(posts) {
    const featuredPost = posts.find(post => post.isFeatured);
    if (featuredPost && featuredContainer) {
        const authorLink = `author.html?name=${encodeURIComponent(featuredPost.author)}`;
        featuredContainer.innerHTML = `
            <article class="featured-post">
                <h2>${featuredPost.title}</h2>
                <div class="post-meta">
                    ${featuredPost.authorPfpUrl ? `<img src="${featuredPost.authorPfpUrl}" class="author-pfp" alt="${featuredPost.author}">` : ""}
                    <div class="author-details">
                        <span class="author-name"><a href="${authorLink}">${featuredPost.author}</a></span>
                        <span class="post-time">${formatRelativeTime(featuredPost.createdAt, featuredPost.updatedAt)}</span>
                    </div>
                </div>
                <p>${featuredPost.content.substring(0, 200)}...</p>
                <a href="post.html?id=${featuredPost.id}" class="read-more-btn">Read Full Story <i class="fas fa-arrow-right"></i></a>
            </article>`;
    }
}

function displayPosts(posts) {
    postsGrid.innerHTML = '';
    const postsToDisplay = posts.filter(post => !post.isFeatured);
    if (postsToDisplay.length === 0) {
        postsGrid.innerHTML = posts.find(p => p.isFeatured) ? '<p>No other posts to display.</p>' : '<p>No posts match your search or filter.</p>';
        return;
    }
    postsToDisplay.forEach(post => {
        const authorLink = `author.html?name=${encodeURIComponent(post.author)}`;
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        // The <p> tag for content is now moved above the post-meta for correct layout
        postCard.innerHTML = `
            <div class="post-card-content">
                <span class="post-category">${post.category}</span>
                <h3>${post.title}</h3>
                <p>${post.content.substring(0, 100)}...</p>
                <div class="post-meta">
                    ${post.authorPfpUrl ? `<img src="${post.authorPfpUrl}" class="author-pfp" alt="${post.author}">` : ""}
                    <div class="author-details">
                        <span class="author-name"><a href="${authorLink}">${post.author}</a></span>
                        <span class="post-time">${formatRelativeTime(post.createdAt, post.updatedAt)}</span>
                    </div>
                </div>
                <a href="post.html?id=${post.id}" class="read-more-btn">Read More</a>
            </div>`;
        postsGrid.appendChild(postCard);
    });
}
    
    function populateCategories(posts) {
        categoryFiltersContainer.innerHTML = '<button class="category-btn active" data-category="all">All</button>';
        const categories = [...new Set(posts.map(post => post.category))];
        categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.dataset.category = category;
            btn.textContent = category;
            categoryFiltersContainer.appendChild(btn);
        });
    }

    function filterAndSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        const activeCategory = categoryFiltersContainer.querySelector('.category-btn.active').dataset.category;
        let filteredPosts = allPosts;
        if (activeCategory !== 'all') {
            filteredPosts = filteredPosts.filter(post => post.category === activeCategory);
        }
        if (searchTerm) {
            filteredPosts = filteredPosts.filter(post =>
                post.title.toLowerCase().includes(searchTerm) ||
                post.content.toLowerCase().includes(searchTerm) ||
                post.author.toLowerCase().includes(searchTerm)
            );
        }
        displayPosts(filteredPosts);
    }
    
    searchInput.addEventListener('input', filterAndSearch);
    categoryFiltersContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            categoryFiltersContainer.querySelector('.category-btn.active').classList.remove('active');
            e.target.classList.add('active');
            filterAndSearch();
        }
    });

    fetchPosts();
}


// ======================================================
// ===== SINGLE POST PAGE SPECIFIC FUNCTIONS (CORRECTED)
// ======================================================
async function initializePostPageContent() {
    if (!firebaseAppInitialized) return;
    console.log("Initializing Single Post Page...");

    const postContentArea = document.getElementById('post-content-area');
    const postTitleHeader = document.getElementById('post-title-header');
    
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
        postContentArea.innerHTML = '<h1>Post not found</h1><p>No post ID was provided.</p>';
        return;
    }

    try {
        const docRef = doc(db, 'posts', postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const post = docSnap.data();
            document.title = post.title;
            // Use textContent for security, as title is user-generated
            if (postTitleHeader) postTitleHeader.textContent = post.title;

            let timestampsHTML = `<span class="post-date">${formatRelativeTime(post.createdAt, post.updatedAt)}</span>`;

            // This is the corrected innerHTML structure
            postContentArea.innerHTML = `
                <div class="post-author-info">
                    ${post.authorPfpUrl ? `<img src="${post.authorPfpUrl}" alt="${post.author}" class="author-pfp">` : ''}
                    <div class="author-details">
                        <span class="author-name"><a href="author.html?name=${encodeURIComponent(post.author)}">${post.author}</a></span>
                        <div class="post-timestamps">${timestampsHTML}</div>
                    </div>
                </div>
                <div class="post-main-content">
                    ${post.content}
                </div>`;
        } else {
            postContentArea.innerHTML = '<h1>Post not found</h1><p>The requested post does not exist.</p>';
        }
    } catch (error) {
        console.error("Error fetching post:", error);
        postContentArea.innerHTML = '<h1>Error</h1><p>Could not load the post.</p>';
    }
}

// ======================================================
// ===== PAGE ROUTER (This decides what to run) ======
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the blog list page
    if (document.getElementById('posts-grid')) {
        initializeBlogListPageContent();
    } 
    // Check if we are on the single post page
    else if (document.getElementById('post-content-area')) {
        initializePostPageContent();
    }
    // --- THIS IS THE FIX for the "Loading..." issue ---
    // Check if we are on the legislation tracker page
    else if (document.getElementById('legislation-list')) {
        console.log("Initializing Legislation Tracker Page...");
        loadAndDisplayLegislation();
    }
    // Otherwise, assume we are on the main homepage
    else if (document.getElementById('main-content-wrapper')) {
        initializeHomepageContent();
    }
});



/* ------------------------------------------------------------ */
/*  START EVENT COUNTDOWN (SINGLETON + CLEAN SHUTDOWN)           */
/* ------------------------------------------------------------ */
function startEventCountdown(targetTimestamp, countdownTitle, expiredMessageOverride) {

    /* ------------------------------------------------------------ */
    /*  QUERY ALL NODES                                             */
    /* ------------------------------------------------------------ */
    const section = document.querySelector('.countdown-section');
    if (!section) return console.warn("Countdown section not found.");

    // 🔒 Prevent multiple countdown instances
    if (section.dataset.countdownInitialized === "true") return;
    section.dataset.countdownInitialized = "true";

    const titleEl = section.querySelector('.countdown-title');
    const container = section.querySelector('.countdown-container');

    const yearsEl = document.getElementById('countdown-years');
    const monthsEl = document.getElementById('countdown-months');
    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const minutesEl = document.getElementById('countdown-minutes');
    const secondsEl = document.getElementById('countdown-seconds');

    const yearsCircle = document.getElementById('years-circle');
    const monthsCircle = document.getElementById('months-circle');
    const daysCircle = document.getElementById('days-circle');
    const hoursCircle = document.getElementById('hours-circle');
    const minutesCircle = document.getElementById('minutes-circle');
    const secondsCircle = document.getElementById('seconds-circle');

    const localTimeEl = document.getElementById('local-time-display');
    const statusEl = document.getElementById('status-message');

    /* ------------------------------------------------------------ */
    /*  PARSE DATE (LOCAL TIME SAFE)                                */
    /* ------------------------------------------------------------ */
    let targetDate = null;

    if (typeof targetTimestamp === "string") {
        const parts = targetTimestamp.split(/[-T:]/);
        targetDate = new Date(
            parts[0],
            (parts[1] || 1) - 1,
            parts[2] || 1,
            parts[3] || 0,
            parts[4] || 0,
            parts[5] || 0
        );
    } else {
        try {
            targetDate = targetTimestamp.toDate();
        } catch {
            targetDate = targetTimestamp instanceof Date ? targetTimestamp : null;
        }
    }

    const title = countdownTitle || "Event";
    titleEl.textContent = title;

    /* ------------------------------------------------------------ */
    /*  LOCAL TIME DISPLAY                                          */
    /* ------------------------------------------------------------ */
    function updateLocalTime() {
        if (!targetDate || !localTimeEl) return;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        localTimeEl.textContent =
            `${title} begins at ${targetDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            })} (${tz}).`;
    }
    updateLocalTime();

    /* ------------------------------------------------------------ */
    /*  STATUS MESSAGES                                             */
    /* ------------------------------------------------------------ */
    function generateMessages(t) {
        return [
            `Anticipation builds as ${t} approaches…`,
            `Every moment brings us closer to ${t}…`,
            `${t} is almost here…`,
            `Final preparations underway for ${t}…`,
            `All paths lead toward ${t}…`
        ].sort(() => Math.random() - 0.5);
    }

    const messages = generateMessages(title);
    let msgIndex = 0;

    if (statusEl) statusEl.textContent = messages[0];

    const statusInterval = setInterval(() => {
        if (section.dataset.expired === "true") return;
        if (!statusEl) return;
        statusEl.textContent = messages[msgIndex];
        msgIndex = (msgIndex + 1) % messages.length;
    }, 3500);

    /* ------------------------------------------------------------ */
    /*  COUNTDOWN LOGIC                                             */
    /* ------------------------------------------------------------ */
    function clamp(v, min = 0, max = 100) {
        return Math.min(max, Math.max(min, v));
    }

    function updateCountdown() {

        if (section.dataset.expired === "true") return;
        if (!targetDate) return;

        const now = new Date();
        const diff = targetDate - now;

        /* ---------------- EXPIRED ---------------- */
        if (diff <= 0) {
            section.dataset.expired = "true";

            clearInterval(loop);
            clearInterval(statusInterval);

            // 🔕 Kill status messages completely
            if (statusEl) {
                statusEl.textContent = "";
                statusEl.style.display = "none";
            }

            container.style.display = "none";

            section.querySelectorAll('.countdown-expired-message')
                .forEach(e => e.remove());

            const msg = expiredMessageOverride || `${title} has started!`;
            const el = document.createElement('div');
            el.className = "countdown-expired-message";
            el.innerHTML = `<p>${msg}</p>`;
            section.appendChild(el);

            return;
        }

        /* ---------------- ACTIVE ---------------- */
        let temp = new Date(now);
        let years = targetDate.getFullYear() - temp.getFullYear();
        let months = targetDate.getMonth() - temp.getMonth();
        let days = targetDate.getDate() - temp.getDate();

        if (months < 0 || (months === 0 && days < 0)) {
            years--;
            months += 12;
        }
        if (days < 0) {
            months--;
            days += new Date(temp.getFullYear(), temp.getMonth() + 1, 0).getDate();
        }

        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        yearsEl.textContent = years;
        monthsEl.textContent = months;
        daysEl.textContent = days;
        hoursEl.textContent = hours;
        minutesEl.textContent = minutes;
        secondsEl.textContent = seconds;

        yearsCircle.style.setProperty("--percent", clamp(years * 10));
        monthsCircle.style.setProperty("--percent", clamp((months / 12) * 100));
        daysCircle.style.setProperty("--percent", clamp((days / 31) * 100));
        hoursCircle.style.setProperty("--percent", clamp((hours / 24) * 100));
        minutesCircle.style.setProperty("--percent", clamp((minutes / 60) * 100));
        secondsCircle.style.setProperty("--percent", clamp((seconds / 60) * 100));
    }

    /* ------------------------------------------------------------ */
    /*  FAILSAFE                                                    */
    /* ------------------------------------------------------------ */
    if (!targetDate) {
        container.innerHTML =
            `<p class="countdown-expired-message">${expiredMessageOverride || `${title} date has not been set.`}</p>`;
        clearInterval(statusInterval);
        return;
    }

    const loop = setInterval(updateCountdown, 1000);
    updateCountdown();
}


async function initializeHomepageContent() {
    console.log("Initializing homepage content (v_with_countdown_and_biz_refresh)...");
    const mainContentWrapper = document.getElementById('main-content-wrapper');
    const maintenanceOverlay = document.getElementById('maintenanceLoadingOverlay');
    const countdownSection = document.querySelector('.countdown-section');
    const usefulLinksSection = document.querySelector('.useful-links-section');
    const bodyElement = document.body;
    const tiktokHeaderContainer = document.getElementById('tiktok-shoutouts');
    const tiktokGridContainer = document.querySelector('#tiktok-shoutouts ~ .creator-grid');
    const tiktokUnavailableMessage = document.querySelector('#tiktok-shoutouts ~ .creator-grid ~ .unavailable-message');
    const onyxDock = document.querySelector('.onyx-dock');
    
    if (!firebaseAppInitialized || !db || !profileDocRef) {
        console.error("Firebase not ready or key Firestore document references missing.");
        if (mainContentWrapper) mainContentWrapper.innerHTML = "<p class='error' style='text-align:center;padding:20px;'>Critical error: Could not initialize site settings.</p>";
        return;
    }

    let siteSettings = {};
    let maintenanceEnabled = false;
    let maintenanceTitle = "Site Under Maintenance";
    let maintenanceMessage = "We are currently performing scheduled maintenance. Please check back later for updates.";
    let hideTikTokSection = false;
    let countdownTargetDate = null;
    let countdownTitle = null;
    let countdownExpiredMessage = null;

    try {
        console.log("Fetching site settings from site_config/mainProfile...");
        const configSnap = await getDoc(profileDocRef);
        if (configSnap.exists()) {
            siteSettings = configSnap.data() || {};
            maintenanceEnabled = siteSettings.isMaintenanceModeEnabled || false;
            maintenanceTitle = siteSettings.maintenanceTitle || maintenanceTitle;
            maintenanceMessage = siteSettings.maintenanceMessage || maintenanceMessage;
            hideTikTokSection = siteSettings.hideTikTokSection || false;
            countdownTargetDate = siteSettings.countdownTargetDate instanceof Timestamp ? siteSettings.countdownTargetDate : null;
            countdownTitle = siteSettings.countdownTitle;
            countdownExpiredMessage = siteSettings.countdownExpiredMessage;
        } else {
            console.warn("Site settings document ('site_config/mainProfile') not found. Using defaults.");
        }
    } catch (error) {
        console.error("Critical Error fetching site settings:", error);
        if (mainContentWrapper) mainContentWrapper.innerHTML = "<p class='error' style='text-align:center;padding:20px;'>Error loading site configuration.</p>";
        return;
    }

    if (maintenanceEnabled) {
        console.log("Maintenance mode ON. Activating overlay...");
        if (maintenanceOverlay) {
            const titleElement = maintenanceOverlay.querySelector('h1');
            const messageElement = maintenanceOverlay.querySelector('p');
            if (titleElement) titleElement.textContent = maintenanceTitle;
            if (messageElement) messageElement.textContent = maintenanceMessage;
            maintenanceOverlay.style.display = 'flex';
            maintenanceOverlay.classList.add('active');
            document.body.classList.add('maintenance-active');
            if (mainContentWrapper) mainContentWrapper.style.display = 'none';
        }

        if (onyxDock) {
           onyxDock.style.display = 'none';
           onyxDock.hidden = true;
         }

        return; 
    } else {
        // Maintenance mode OFF
        console.log("Maintenance mode OFF.");
        if (mainContentWrapper) mainContentWrapper.style.display = '';
        if (maintenanceOverlay) maintenanceOverlay.style.display = 'none';
        bodyElement.classList.remove('maintenance-active');

        if (onyxDock) {
    onyxDock.style.display = '';
    onyxDock.hidden = false;
}

        const savedOrder = JSON.parse(localStorage.getItem('sectionOrder'));
        const rearrangeableContainer = document.getElementById('rearrangeable-container');

        if (savedOrder && rearrangeableContainer) {
            savedOrder.forEach(sectionId => {
                const section = document.querySelector(`[data-section-id="${sectionId}"]`);
                if (section) rearrangeableContainer.appendChild(section);
            });
        }
        
        if (countdownTargetDate && typeof startEventCountdown === 'function') {
            if (countdownSection) countdownSection.style.display = 'block'; 
            startEventCountdown(countdownTargetDate, countdownTitle, countdownExpiredMessage);
        } else {
            if (countdownSection) countdownSection.style.display = 'none'; 
        }

        if (usefulLinksSection) usefulLinksSection.style.display = 'block';

        let isTikTokVisible = false;
        if (!tiktokHeaderContainer || !tiktokGridContainer) {
            if (tiktokUnavailableMessage) tiktokUnavailableMessage.style.display = 'none';
        } else {
            if (hideTikTokSection) {
                tiktokHeaderContainer.style.display = 'none';
                tiktokGridContainer.style.display = 'none';
                if (tiktokUnavailableMessage) {
                    tiktokUnavailableMessage.innerHTML = '<p>TikTok shoutouts are currently hidden by the site administrator.</p>';
                    tiktokUnavailableMessage.style.display = 'block';
                }
                isTikTokVisible = false;
            } else {
                tiktokHeaderContainer.style.display = ''; 
                tiktokGridContainer.style.display = ''; 
                if (tiktokUnavailableMessage) tiktokUnavailableMessage.style.display = 'none';
                isTikTokVisible = true;
            }
        }

        console.log("Initiating loading of other content sections...");

        // Setup Business Hours
        if (firebaseAppInitialized && typeof displayBusinessInfo === 'function' && db && businessDocRef) {
            await displayBusinessInfo(); 
            if (window.businessInfoRefreshInterval) clearInterval(window.businessInfoRefreshInterval);
            window.businessInfoRefreshInterval = setInterval(async () => {
                if (document.hidden) return;
                await displayBusinessInfo();
            }, 60000); 
        }

        // --- LOAD ALL CONTENT ---
        const loadPromises = [
            (typeof displayProfileData === 'function' ? displayProfileData(siteSettings) : Promise.resolve()),
            (typeof displayPresidentData === 'function' ? displayPresidentData() : Promise.resolve()),
            (typeof loadShoutoutPlatformData === 'function' ? loadShoutoutPlatformData('instagram', document.getElementById('instagram-last-updated-timestamp')) : Promise.resolve()),
            (typeof loadShoutoutPlatformData === 'function' ? loadShoutoutPlatformData('youtube', document.getElementById('youtube-last-updated-timestamp')) : Promise.resolve()),
            (typeof loadAndDisplayUsefulLinks === 'function' ? loadAndDisplayUsefulLinks() : Promise.resolve()),
            (typeof loadAndDisplaySocialLinks === 'function' ? loadAndDisplaySocialLinks() : Promise.resolve()),
            (typeof loadAndDisplayDisabilities === 'function' ? loadAndDisplayDisabilities() : Promise.resolve()),
            (typeof loadAndDisplayTechItems === 'function' ? loadAndDisplayTechItems() : Promise.resolve()),
            (typeof loadAndDisplayFaqs === 'function' ? loadAndDisplayFaqs() : Promise.resolve())
        ];

        if (isTikTokVisible && typeof loadShoutoutPlatformData === 'function') {
            loadPromises.push(loadShoutoutPlatformData('tiktok', document.getElementById('tiktok-last-updated-timestamp')));
        }

        await Promise.allSettled(loadPromises);

        // --- NEW: AUTO-STATUS POLLING ---
        if (siteSettings.autoStatusEnabled && typeof displayProfileData === 'function') {
            console.log("Auto-status enabled. Starting 30s polling...");
            if (window.statusPollInterval) clearInterval(window.statusPollInterval);
            
            window.statusPollInterval = setInterval(() => {
                displayProfileData(siteSettings); 
            }, 30000);
        }

        setupCreatorSearch();
        setupCreatorSorting();
        
        console.log("All content loaded.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
  if (firebaseAppInitialized && db) {
    setupRealtimeNotifications();
  }
});

// --- Call the main initialization function when the DOM is ready ---
document.addEventListener('DOMContentLoaded', initializeHomepageContent);

/* =============================================== */
/* == ONYX AI ASSISTANT LOGIC (Integrated v1.0) == */
/* =============================================== */
document.addEventListener("DOMContentLoaded", () => {
  const aiToggleBtn = document.getElementById("ai-toggle-btn");
  const aiAssistant = document.getElementById("onyx-ai-assistant");
  const aiCloseBtn = document.getElementById("ai-close-btn");
  const aiForm = document.getElementById("ai-form");
  const aiInput = document.getElementById("ai-input");
  const aiMessages = document.getElementById("ai-messages");

  // If AI elements aren’t found, exit early (prevents errors if section is hidden)
  if (!aiToggleBtn || !aiAssistant) return;

  // === Open / Close Assistant ===
  aiToggleBtn.addEventListener("click", () => {
    aiAssistant.classList.toggle("hidden");
  });
  aiCloseBtn.addEventListener("click", () => {
    aiAssistant.classList.add("hidden");
  });

  // === Message Handling ===
  aiForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const userMsg = aiInput.value.trim();
    if (!userMsg) return;

    appendMessage("user", userMsg);
    aiInput.value = "";
    aiMessages.scrollTop = aiMessages.scrollHeight;

    // Simulated AI reply for now
    setTimeout(() => {
      appendMessage("ai", generateReply(userMsg));
      aiMessages.scrollTop = aiMessages.scrollHeight;
    }, 600);
  });

  // === Append Message Utility ===
  function appendMessage(sender, text) {
    const msg = document.createElement("div");
    msg.className = `message ${sender}`;
    msg.textContent = text;
    aiMessages.appendChild(msg);
  }

  // === Placeholder AI Logic (to be replaced with API later) ===
  function generateReply(input) {
    const lower = input.toLowerCase();
    if (lower.includes("hello") || lower.includes("hi")) {
      return "Hey there! 👋 What can I help you with today?";
    }
    if (lower.includes("theme") || lower.includes("color")) {
      return "You can change my color using the Accent Color picker in your settings!";
    }
    if (lower.includes("who are you")) {
      return "I’m Onyx — your personal glass assistant, designed just for this site.";
    }
    if (lower.includes("settings")) {
      return "You can access all settings in your admin panel under 'Site Settings'.";
    }
    return "I'm still learning! Try asking about your theme, layout, or sections.";
  }
});

// --------------------------------------
// LOAD PROJECT GOAL TRACKER ON HOMEPAGE
// --------------------------------------
async function loadGoalTrackerHomepage() {
  try {
    const ref = doc(db, "siteSettings", "goalTracker");
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.warn("No goalTracker document found.");
      return;
    }

    const data = snap.data();

    // Set title
    const titleEl = document.querySelector(".goals-title");
    if (titleEl) titleEl.textContent = data.goalTitle || "Project Goal";

    // Set numbers
    const totalEl = document.getElementById("goalTotal");
    const raisedEl = document.getElementById("goalRaised");
    const remainingEl = document.getElementById("goalRemaining");

    if (totalEl) totalEl.textContent = data.goalTotal ?? 0;
    if (raisedEl) raisedEl.textContent = data.goalRaised ?? 0;
    if (remainingEl) remainingEl.textContent = data.goalRemaining ?? 0;

    // Progress bar
    const fill = document.getElementById("goalFill");
    if (fill && data.goalTotal > 0) {
      const pct = Math.min((data.goalRaised / data.goalTotal) * 100, 100);
      fill.style.width = pct + "%";
    }

    // Message
    const msg = document.getElementById("goalMessage");
    if (msg && data.goalTotal > 0) {
      const pct = Math.min((data.goalRaised / data.goalTotal) * 100, 100);
      msg.textContent = `You are ${pct.toFixed(1)}% of the way there!`;
    }

  } catch (err) {
    console.error("Error loading goal tracker:", err);
  }
}

// Load on page render
document.addEventListener("DOMContentLoaded", loadGoalTrackerHomepage);
