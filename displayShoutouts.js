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
function watchLiveStatus() {
  if (!db) {
    console.warn("Firestore not ready yet, retrying...");
    setTimeout(watchLiveStatus, 500);
    return;
  }

  const el = document.getElementById("live-activity-text");
  const container = document.getElementById("live-activity");
  const ref = doc(db, "live_status", "current");

  onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      el.textContent = data.message;
      container.classList.remove("hidden");
      container.classList.add("active");
    } else {
      el.textContent = "🛌 Offline";
      container.classList.remove("active");
    }
  });
}

document.addEventListener("DOMContentLoaded", watchLiveStatus);
// In displayShoutouts.js, REPLACE the loadAndDisplayLegislation function

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

// --- Initialize push notifications when Firebase is ready ---
document.addEventListener("DOMContentLoaded", () => {
  if (firebaseAppInitialized && db) {
    initializePushNotifications();
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

document.addEventListener("DOMContentLoaded", () => {
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

// --- Functions to Render Cards (Shoutouts, Tech, FAQs) ---
// (Your existing renderTikTokCard, renderInstagramCard, renderYouTubeCard, renderTechItemHomepage, renderFaqItemHomepage functions remain here, unchanged from your provided file)
function renderTikTokCard(account) {
    const profilePic = account.profilePic || 'images/default-profile.jpg';
    const username = account.username || 'N/A';
    const nickname = account.nickname || 'N/A';
    const bio = account.bio || '';
    const followers = account.followers || 'N/A';
    const isVerified = account.isVerified || false;
    const profileUrl = username !== 'N/A' ? `https://tiktok.com/@${encodeURIComponent(username)}` : '#';
    const verifiedBadge = isVerified ? '<img src="check.png" alt="Verified" class="verified-badge">' : '';
    return `<div class="creator-card">
              <img src="${profilePic}" alt="@${username}" class="creator-pic" onerror="this.src='images/default-profile.jpg'">
              <div class="creator-info">
                <div class="creator-header"><h3>${nickname}</h3></div>
                <p class="creator-username">@${username} ${verifiedBadge}</p>
                <p class="creator-bio">${bio}</p>
                <p class="follower-count">${followers} Followers</p>
                <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" class="visit-profile"> Visit Profile </a>
              </div>
            </div>`;
}

function renderInstagramCard(account) {
    const profilePic = account.profilePic || 'images/default-profile.jpg';
    const username = account.username || 'N/A';
    const nickname = account.nickname || 'N/A';
    const bio = account.bio || '';
    const followers = account.followers || 'N/A';
    const isVerified = account.isVerified || false;
    const profileUrl = username !== 'N/A' ? `https://instagram.com/${encodeURIComponent(username)}` : '#';
    const verifiedBadge = isVerified ? '<img src="instagramcheck.png" alt="Verified" class="instagram-verified-badge">' : '';
    return `<div class="instagram-creator-card">
              <img src="${profilePic}" alt="${nickname}" class="instagram-creator-pic" onerror="this.src='images/default-profile.jpg'">
              <div class="instagram-creator-info">
                <div class="instagram-creator-header"><h3>${nickname}</h3></div>
                <p class="instagram-creator-username">@${username} ${verifiedBadge}</p>
                <p class="instagram-creator-bio">${bio}</p>
                <p class="instagram-follower-count">${followers} Followers</p>
                <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" class="instagram-visit-profile"> Visit Profile </a>
              </div>
            </div>`;
}

function renderYouTubeCard(account) {
    const profilePic = account.profilePic || 'images/default-profile.jpg';
    const usernameFromDb = account.username || 'N/A'; // Username/handle from Firestore
    const nickname = account.nickname || 'N/A';      // Channel name
    const bio = account.bio || '';
    const subscribers = account.subscribers || 'N/A';
    const coverPhoto = account.coverPhoto || null;
    const isVerified = account.isVerified || false;
    
    let displayHandle = 'N/A';
    let channelUrl = '#';

    if (usernameFromDb !== 'N/A' && usernameFromDb.trim() !== '' && usernameFromDb.trim() !== '@') {
        displayHandle = usernameFromDb.startsWith('@') ? usernameFromDb : `@${usernameFromDb}`;
        channelUrl = `https://www.youtube.com/${displayHandle}`; 
    } else {
        displayHandle = ''; 
    }

    // This log is still useful for debugging the URL if the redirect issue persists later
    // console.log(`[YouTube Card Render] DB Username: "${usernameFromDb}", Display Handle: "${displayHandle}", Channel URL: "${channelUrl}"`);

    const verifiedBadge = isVerified ? '<img src="youtubecheck.png" alt="Verified" class="youtube-verified-badge">' : '';

    // Ensure this entire return statement is enclosed in BACKTICKS (`), not single or double quotes.
    return `<div class="youtube-creator-card">
              ${coverPhoto ? `<img src="${coverPhoto}" alt="${nickname} Cover Photo" class="youtube-cover-photo" onerror="this.style.display='none'">` : ''}
              <img src="${profilePic}" alt="${nickname}" class="youtube-creator-pic" onerror="this.src='images/default-profile.jpg'">
              <div class="youtube-creator-info">
                <div class="youtube-creator-header"><h3>${nickname} ${verifiedBadge}</h3></div>
                <div class="username-container"><p class="youtube-creator-username">${displayHandle}</p></div>
                <p class="youtube-creator-bio">${bio}</p>
                <p class="youtube-subscriber-count">${subscribers} Subscribers</p>
                <a href="${channelUrl}" target="_blank" rel="noopener noreferrer" class="youtube-visit-profile"> Visit Channel </a>
              </div>
            </div>`;
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
   GLOBAL STORAGE
------------------------------------------------------------ */
let allTechItems = [];

/* ------------------------------------------------------------
   RENDER FUNCTION (UNCHANGED)
------------------------------------------------------------ */
function renderTechItemHomepage(itemData) {
    const name = itemData.name || 'Unnamed Device';
    const model = itemData.model || '';
    const iconClass = itemData.iconClass || 'fas fa-question-circle';
    const material = itemData.material || '';
    const storage = itemData.storage || '';
    const batteryCapacity = itemData.batteryCapacity || '';
    const color = itemData.color || '';
    const price = itemData.price ? `$${itemData.price}` : '';
    const dateReleased = itemData.dateReleased || '';
    const dateBought = itemData.dateBought || '';
    const osVersion = itemData.osVersion || '';
    const batteryHealth = itemData.batteryHealth !== null && !isNaN(itemData.batteryHealth)
        ? parseInt(itemData.batteryHealth, 10)
        : null;
    const batteryCycles = itemData.batteryCycles !== null && !isNaN(itemData.batteryCycles)
        ? itemData.batteryCycles
        : null;

    let batteryHtml = '';
    if (batteryHealth !== null) {
        let batteryClass = '';
        if (batteryHealth <= 20) batteryClass = 'critical';
        else if (batteryHealth <= 50) batteryClass = 'low-power';

        const displayHealth = Math.min(batteryHealth, 100);

        batteryHtml = `
            <div class="tech-detail"><i class="fas fa-heart"></i><span>Battery Health:</span></div>
            <div class="battery-container">
                <div class="battery-icon ${batteryClass}">
                    <div class="battery-level" style="width: ${displayHealth}%;"></div>
                    <div class="battery-percentage">${batteryHealth}%</div>
                </div>
            </div>`;
    }

    let cyclesHtml = '';
    if (batteryCycles !== null) {
        cyclesHtml = `
            <div class="tech-detail"><i class="fas fa-sync"></i>
                <span>Battery Charge Cycles:</span> ${batteryCycles}
            </div>`;
    }

    return `
    <div class="tech-item">
        <h3><i class="${iconClass}"></i> ${name}</h3>
        ${model ? `<div class="tech-detail"><i class="fas fa-info-circle"></i><span>Model:</span> ${model}</div>` : ''}
        ${material ? `<div class="tech-detail"><i class="fas fa-layer-group"></i><span>Material:</span> ${material}</div>` : ''}
        ${storage ? `<div class="tech-detail"><i class="fas fa-hdd"></i><span>Storage:</span> ${storage}</div>` : ''}
        ${batteryCapacity ? `<div class="tech-detail"><i class="fas fa-battery-full"></i><span>Battery Capacity:</span> ${batteryCapacity}</div>` : ''}
        ${color ? `<div class="tech-detail"><i class="fas fa-palette"></i><span>Color:</span> ${color}</div>` : ''}
        ${price ? `<div class="tech-detail"><i class="fas fa-tag"></i><span>Price:</span> ${price}</div>` : ''}
        ${dateReleased ? `<div class="tech-detail"><i class="fas fa-calendar-plus"></i><span>Date Released:</span> ${dateReleased}</div>` : ''}
        ${dateBought ? `<div class="tech-detail"><i class="fas fa-shopping-cart"></i><span>Date Bought:</span> ${dateBought}</div>` : ''}
        ${osVersion ? `<div class="tech-detail"><i class="fab fa-apple"></i><span>OS Version:</span> ${osVersion}</div>` : ''}
        ${batteryHtml}
        ${cyclesHtml}
    </div>`;
}

/* ------------------------------------------------------------
   DOM REFERENCES
------------------------------------------------------------ */
const techListContainer = document.getElementById("tech-items-list-dynamic");

/* ------------------------------------------------------------
   RENDER ALL ITEMS (NO SEARCH)
------------------------------------------------------------ */
function renderTechList() {
    techListContainer.innerHTML = allTechItems
        .map(renderTechItemHomepage)
        .join("");
}

/* ------------------------------------------------------------
   FIRESTORE LISTENER
------------------------------------------------------------ */
function loadTechItems() {
    const ref = collection(db, "techItems");

    onSnapshot(ref, snapshot => {
        allTechItems = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));
        renderTechList();
    });
}

/* ------------------------------------------------------------
   INIT
------------------------------------------------------------ */
loadTechItems();



function renderFaqItemHomepage(faqData) {
    const question = faqData.question || 'No Question Provided';
    const answerHtml = faqData.answer ? (faqData.answer.includes('<') ? faqData.answer : `<p>${faqData.answer}</p>`) : '<p>No Answer Provided.</p>';
    return `<div class="faq-item">
              <button class="faq-question">
                ${question}
                <span class="faq-icon">+</span>
              </button>
              <div class="faq-answer">
                ${answerHtml}
              </div>
            </div>`;
}

// [In displayShoutouts.js] - Replace the entire displayProfileData function

const DISCORD_USER_ID = "850815059093356594"; // Your Discord User ID

async function displayProfileData(profileData) {
    const profileUsernameElement = document.getElementById('profile-username-main');
    const profilePicElement = document.getElementById('profile-pic-main');
    const profileBioElement = document.getElementById('profile-bio-main');
    const profileStatusContainerElement = document.getElementById('profile-status-main-container');
    const profileStatusTextElement = document.getElementById('profile-status-text-main');

    // Check for the essential HTML elements
    if (!profileUsernameElement || !profilePicElement || !profileBioElement) {
        console.warn("Core profile display elements missing.");
        return;
    }

    // Define default values
    const defaultUsername = "Username";
    const defaultBio = "";
    const defaultProfilePic = "images/default-profile.jpg";

    if (!profileData) {
        // Fallback if no data provided
        profileUsernameElement.textContent = defaultUsername;
        profilePicElement.src = defaultProfilePic;
        profileBioElement.textContent = defaultBio;
        if (profileStatusContainerElement) profileStatusContainerElement.className = "profile-status-container status-offline";
        if (profileStatusTextElement) {
            profileStatusTextElement.textContent = 'Offline';
            profileStatusTextElement.className = "profile-status-text status-offline";
        }
        return;
    }

    // Update basic text info immediately
    profileUsernameElement.textContent = profileData.username || defaultUsername;
    profilePicElement.src = profileData.profilePicUrl || defaultProfilePic;
    profileBioElement.textContent = profileData.bio || defaultBio;

    // --- Status Logic ---
    let statusKey = profileData.status || 'offline'; // Default to manual status first

    // If Auto-Detect is enabled, fetch real status from Discord
    if (profileData.autoStatusEnabled) {
        try {
            const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
            const json = await response.json();
            
            if (json.success && json.data) {
                // Lanyard returns: 'online', 'idle', 'dnd', or 'offline'
                statusKey = json.data.discord_status;
                console.log("Auto-detect status from Lanyard:", statusKey);
            }
        } catch (error) {
            console.warn("Auto-detect failed (Lanyard API error), falling back to manual status.", error);
            // We keep statusKey as the manual value set above
        }
    } else {
        console.log("Auto-detect disabled. Using manual status:", statusKey);
    }

    // Map status key to display text
    let statusText = '';
    switch (statusKey) {
        case 'online':
            statusText = 'Active';
            break;
        case 'idle':
            statusText = 'Idle';
            break;
        case 'dnd':
            statusText = 'Do Not Disturb';
            break;
        case 'offline':
            statusText = 'Offline';
            break;
        default:
            statusText = statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
    }

    // Update the visual indicators
    if (profileStatusContainerElement) {
        // Reset classes and add the correct status class
        profileStatusContainerElement.className = `profile-status-container status-${statusKey}`;
    }

    if (profileStatusTextElement) {
        profileStatusTextElement.textContent = statusText;
        profileStatusTextElement.className = `profile-status-text status-${statusKey}`;
    }
    
    console.log("Profile section updated with status:", statusKey);
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

async function loadAndDisplayTechItems() {
    const techItemsListContainer = document.getElementById('tech-items-list-dynamic');
    if (!techItemsListContainer) { console.error("Tech Item Load Error: Container element #tech-items-list-dynamic not found."); return; }

    if (!firebaseAppInitialized || !db || !techItemsCollectionRef) { console.error("Tech Item Load Error: Firebase not ready or collection ref missing."); techItemsListContainer.innerHTML = '<p class="error">Error loading tech data (DB connection/Config).</p>'; return; }

    console.log("Fetching tech items for homepage...");
    techItemsListContainer.innerHTML = '<p>Loading Tech Info...</p>';
    try {
        const techQuery = query(techItemsCollectionRef, orderBy("order", "asc"));
        const querySnapshot = await getDocs(techQuery);
        let allItemsHtml = '';

        if (querySnapshot.empty) {
            console.log("No tech items found in Firestore.");
            allItemsHtml = '<p>No tech items to display currently.</p>';
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
        if (error.code === 'failed-precondition') {
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


async function loadRegionalLeader() {
  const subtitleEl = document.getElementById("leader-subtitle");
  const footnoteEl = document.getElementById("leader-footnote");
  const refreshBtn = document.getElementById("leader-refresh");

  // President
  const presNameEl = document.getElementById("president-name");
  const presImgEl = document.getElementById("pres-img");
  const presTermEl = document.getElementById("pres-term");

  // Governor
  const govNameEl = document.getElementById("governor-name");
  const govImgEl = document.getElementById("gov-img");
  const govTermEl = document.getElementById("gov-term");
  const govLabelEl = document.getElementById("gov-label");

  if (!subtitleEl || !footnoteEl || !presNameEl || !presTermEl || !govNameEl || !govTermEl) return;

  const setLoading = () => {
    subtitleEl.textContent = "Detecting your region…";
    footnoteEl.textContent = "";

    presNameEl.textContent = "Loading…";
    presTermEl.textContent = "—";
    if (presImgEl) {
      presImgEl.style.display = "none";
      presImgEl.removeAttribute("src");
      presImgEl.alt = "";
    }

    govNameEl.textContent = "Loading…";
    govTermEl.textContent = "—";
    if (govLabelEl) govLabelEl.textContent = "Governor";
    if (govImgEl) {
      govImgEl.style.display = "none";
      govImgEl.removeAttribute("src");
      govImgEl.alt = "";
    }
  };

  const formatDate = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const formatTerm = (startIso, endIso) => {
    const start = formatDate(startIso);
    const end = formatDate(endIso);
    if (start && end) return `${start} → ${end}`;
    if (start && !end) return `${start} → Present`;
    return "Term: Not listed";
  };

  // Handles BOTH: filename OR URL
  const commonsFileToUrl = (value, width = 256) => {
    if (!value) return null;

    if (/^https?:\/\//i.test(value)) {
      if (value.includes("Special:FilePath/") && !value.includes("width=")) {
        const join = value.includes("?") ? "&" : "?";
        return `${value}${join}width=${width}`;
      }
      return value;
    }

    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(value)}?width=${width}`;
  };

  async function safeFetch(url, options = {}, timeoutMs = 12000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  }

  // Geo detection: returns { countryCode, countryName, stateCode, provider }
  async function detectGeo() {
    // Locale fallback (no network)
    const localeCountry = (() => {
      const lang = navigator.language || "";
      const m = lang.match(/-([A-Z]{2})$/i);
      return m ? m[1].toUpperCase() : null;
    })();

    // Try IP providers (more accurate + state for US)
    const providers = [
      { name: "ipapi", url: "https://ipapi.co/json/" },
      { name: "ipwhois", url: "https://ipwho.is/" },
      { name: "ipinfo", url: "https://ipinfo.io/json" },
    ];

    for (const p of providers) {
      try {
        const res = await safeFetch(p.url, {}, 9000);
        if (!res.ok) continue;
        const j = await res.json();

        const countryCode =
          (j?.country_code || j?.country || localeCountry || "US").toString().toUpperCase();

        const countryName =
          (j?.country_name || j?.country || "United States").toString();

        // US state code attempts:
        // ipapi: region_code (e.g. "OH")
        // ipinfo: region (e.g. "Ohio") -> not code
        // ipwhois: region_code sometimes exists
        const stateCodeRaw = (j?.region_code || j?.region_code_iso || j?.region_code2 || j?.region_code3 || j?.region_code4 || j?.region_code5 || j?.region_code6 || j?.region_code7 || j?.region_code8 || j?.region_code9 || j?.region_code10 || j?.region_code11 || j?.region_code12 || j?.region_code13 || j?.region_code14 || j?.region_code15 || j?.region_code16 || j?.region_code17 || j?.region_code18 || j?.region_code19 || j?.region_code20 || j?.region_code21 || j?.region_code22 || j?.region_code23 || j?.region_code24 || j?.region_code25 || j?.region_code26 || j?.region_code27 || j?.region_code28 || j?.region_code29 || j?.region_code30 || j?.region_code31 || j?.region_code32 || j?.region_code33 || j?.region_code34 || j?.region_code35 || j?.region_code36 || j?.region_code37 || j?.region_code38 || j?.region_code39 || j?.region_code40 || j?.region_code41 || j?.region_code42 || j?.region_code43 || j?.region_code44 || j?.region_code45 || j?.region_code46 || j?.region_code47 || j?.region_code48 || j?.region_code49 || j?.region_code50 || j?.region_code51 || j?.region_code52 || j?.region_code53 || j?.region_code54 || j?.region_code55 || j?.region_code56 || j?.region_code57 || j?.region_code58 || j?.region_code59 || j?.region_code60 || j?.region_code61 || j?.region_code62 || j?.region_code63 || j?.region_code64 || j?.region_code65 || j?.region_code66 || j?.region_code67 || j?.region_code68 || j?.region_code69 || j?.region_code70 || j?.region_code71 || j?.region_code72 || j?.region_code73 || j?.region_code74 || j?.region_code75 || j?.region_code76 || j?.region_code77 || j?.region_code78 || j?.region_code79 || j?.region_code80 || j?.region_code81 || j?.region_code82 || j?.region_code83 || j?.region_code84 || j?.region_code85 || j?.region_code86 || j?.region_code87 || j?.region_code88 || j?.region_code89 || j?.region_code90 || j?.region_code91 || j?.region_code92 || j?.region_code93 || j?.region_code94 || j?.region_code95 || j?.region_code96 || j?.region_code97 || j?.region_code98 || j?.region_code99 || j?.region_code100 || j?.region_code101 || j?.region_code102 || j?.region_code103 || j?.region_code104 || j?.region_code105 || j?.region_code106 || j?.region_code107 || j?.region_code108 || j?.region_code109 || j?.region_code110 || j?.region_code111 || j?.region_code112 || j?.region_code113 || j?.region_code114 || j?.region_code115 || j?.region_code116 || j?.region_code117 || j?.region_code118 || j?.region_code119 || j?.region_code120 || j?.region_code121 || j?.region_code122 || j?.region_code123 || j?.region_code124 || j?.region_code125 || j?.region_code126 || j?.region_code127 || j?.region_code128 || j?.region_code129 || j?.region_code130 || j?.region_code131 || j?.region_code132 || j?.region_code133 || j?.region_code134 || j?.region_code135 || j?.region_code136 || j?.region_code137 || j?.region_code138 || j?.region_code139 || j?.region_code140 || j?.region_code141 || j?.region_code142 || j?.region_code143 || j?.region_code144 || j?.region_code145 || j?.region_code146 || j?.region_code147 || j?.region_code148 || j?.region_code149 || j?.region_code150 || j?.region_code151 || j?.region_code152 || j?.region_code153 || j?.region_code154 || j?.region_code155 || j?.region_code156 || j?.region_code157 || j?.region_code158 || j?.region_code159 || j?.region_code160 || j?.region_code161 || j?.region_code162 || j?.region_code163 || j?.region_code164 || j?.region_code165 || j?.region_code166 || j?.region_code167 || j?.region_code168 || j?.region_code169 || j?.region_code170 || j?.region_code171 || j?.region_code172 || j?.region_code173 || j?.region_code174 || j?.region_code175 || j?.region_code176 || j?.region_code177 || j?.region_code178 || j?.region_code179 || j?.region_code180 || j?.region_code181 || j?.region_code182 || j?.region_code183 || j?.region_code184 || j?.region_code185 || j?.region_code186 || j?.region_code187 || j?.region_code188 || j?.region_code189 || j?.region_code190 || j?.region_code191 || j?.region_code192 || j?.region_code193 || j?.region_code194 || j?.region_code195 || j?.region_code196 || j?.region_code197 || j?.region_code198 || j?.region_code199 || j?.region_code200 || j?.region_code201 || j?.region_code202 || j?.region_code203 || j?.region_code204 || j?.region_code205 || j?.region_code206 || j?.region_code207 || j?.region_code208 || j?.region_code209 || j?.region_code210 || j?.region_code211 || j?.region_code212 || j?.region_code213 || j?.region_code214 || j?.region_code215 || j?.region_code216 || j?.region_code217 || j?.region_code218 || j?.region_code219 || j?.region_code220 || j?.region_code221 || j?.region_code222 || j?.region_code223 || j?.region_code224 || j?.region_code225 || j?.region_code226 || j?.region_code227 || j?.region_code228 || j?.region_code229 || j?.region_code230 || j?.region_code231 || j?.region_code232 || j?.region_code233 || j?.region_code234 || j?.region_code235 || j?.region_code236 || j?.region_code237 || j?.region_code238 || j?.region_code239 || j?.region_code240 || j?.region_code241 || j?.region_code242 || j?.region_code243 || j?.region_code244 || j?.region_code245 || j?.region_code246 || j?.region_code247 || j?.region_code248 || j?.region_code249 || j?.region_code250 || j?.region_code251 || j?.region_code252 || j?.region_code253 || j?.region_code254 || j?.region_code255 || j?.region_code256 || j?.region_code257 || j?.region_code258 || j?.region_code259 || j?.region_code260 || j?.region_code261 || j?.region_code262 || j?.region_code263 || j?.region_code264 || j?.region_code265 || j?.region_code266 || j?.region_code267 || j?.region_code268 || j?.region_code269 || j?.region_code270 || j?.region_code271 || j?.region_code272 || j?.region_code273 || j?.region_code274 || j?.region_code275 || j?.region_code276 || j?.region_code277 || j?.region_code278 || j?.region_code279 || j?.region_code280 || j?.region_code281 || j?.region_code282 || j?.region_code283 || j?.region_code284 || j?.region_code285 || j?.region_code286 || j?.region_code287 || j?.region_code288 || j?.region_code289 || j?.region_code290 || j?.region_code291 || j?.region_code292 || j?.region_code293 || j?.region_code294 || j?.region_code295 || j?.region_code296 || j?.region_code297 || j?.region_code298 || j?.region_code299 || j?.region_code300 || j?.region_code301 || j?.region_code302 || j?.region_code303 || j?.region_code304 || j?.region_code305 || j?.region_code306 || j?.region_code307 || j?.region_code308 || j?.region_code309 || j?.region_code310 || j?.region_code311 || j?.region_code312 || j?.region_code313 || j?.region_code314 || j?.region_code315 || j?.region_code316 || j?.region_code317 || j?.region_code318 || j?.region_code319 || j?.region_code320 || j?.region_code321 || j?.region_code322 || j?.region_code323 || j?.region_code324 || j?.region_code325 || j?.region_code326 || j?.region_code327 || j?.region_code328 || j?.region_code329 || j?.region_code330 || j?.region_code331 || j?.region_code332 || j?.region_code333 || j?.region_code334 || j?.region_code335 || j?.region_code336 || j?.region_code337 || j?.region_code338 || j?.region_code339 || j?.region_code340 || j?.region_code341 || j?.region_code342 || j?.region_code343 || j?.region_code344 || j?.region_code345 || j?.region_code346 || j?.region_code347 || j?.region_code348 || j?.region_code349 || j?.region_code350 || j?.region_code351 || j?.region_code352 || j?.region_code353 || j?.region_code354 || j?.region_code355 || j?.region_code356 || j?.region_code357 || j?.region_code358 || j?.region_code359 || j?.region_code360 || j?.region_code361 || j?.region_code362 || j?.region_code363 || j?.region_code364 || j?.region_code365 || j?.region_code366 || j?.region_code367 || j?.region_code368 || j?.region_code369 || j?.region_code370 || j?.region_code371 || j?.region_code372 || j?.region_code373 || j?.region_code374 || j?.region_code375 || j?.region_code376 || j?.region_code377 || j?.region_code378 || j?.region_code379 || j?.region_code380 || j?.region_code381 || j?.region_code382 || j?.region_code383 || j?.region_code384 || j?.region_code385 || j?.region_code386 || j?.region_code387 || j?.region_code388 || j?.region_code389 || j?.region_code390 || j?.region_code391 || j?.region_code392 || j?.region_code393 || j?.region_code394 || j?.region_code395 || j?.region_code396 || j?.region_code397 || j?.region_code398 || j?.region_code399 || j?.region_code400 || j?.region_code401 || j?.region_code402 || j?.region_code403 || j?.region_code404 || j?.region_code405 || j?.region_code406 || j?.region_code407 || j?.region_code408 || j?.region_code409 || j?.region_code410 || j?.region_code411 || j?.region_code412 || j?.region_code413 || j?.region_code414 || j?.region_code415 || j?.region_code416 || j?.region_code417 || j?.region_code418 || j?.region_code419 || j?.region_code420 || j?.region_code421 || j?.region_code422 || j?.region_code423 || j?.region_code424 || j?.region_code425 || j?.region_code426 || j?.region_code427 || j?.region_code428 || j?.region_code429 || j?.region_code430 || j?.region_code431 || j?.region_code432 || j?.region_code433 || j?.region_code434 || j?.region_code435 || j?.region_code436 || j?.region_code437 || j?.region_code438 || j?.region_code439 || j?.region_code440 || j?.region_code441 || j?.region_code442 || j?.region_code443 || j?.region_code444 || j?.region_code445 || j?.region_code446 || j?.region_code447 || j?.region_code448 || j?.region_code449 || j?.region_code450 || j?.region_code451 || j?.region_code452 || j?.region_code453 || j?.region_code454 || j?.region_code455 || j?.region_code456 || j?.region_code457 || j?.region_code458 || j?.region_code459 || j?.region_code460 || j?.region_code461 || j?.region_code462 || j?.region_code463 || j?.region_code464 || j?.region_code465 || j?.region_code466 || j?.region_code467 || j?.region_code468 || j?.region_code469 || j?.region_code470 || j?.region_code471 || j?.region_code472 || j?.region_code473 || j?.region_code474 || j?.region_code475 || j?.region_code476 || j?.region_code477 || j?.region_code478 || j?.region_code479 || j?.region_code480 || j?.region_code481 || j?.region_code482 || j?.region_code483 || j?.region_code484 || j?.region_code485 || j?.region_code486 || j?.region_code487 || j?.region_code488 || j?.region_code489 || j?.region_code490 || j?.region_code491 || j?.region_code492 || j?.region_code493 || j?.region_code494 || j?.region_code495 || j?.region_code496 || j?.region_code497 || j?.region_code498 || j?.region_code499 || j?.region_code500 || j?.region_code501 || j?.region_code502 || j?.region_code503 || j?.region_code504 || j?.region_code505 || j?.region_code506 || j?.region_code507 || j?.region_code508 || j?.region_code509 || j?.region_code510 || j?.region_code511 || j?.region_code512 || j?.region_code513 || j?.region_code514 || j?.region_code515 || j?.region_code516 || j?.region_code517 || j?.region_code518 || j?.region_code519 || j?.region_code520 || j?.region_code521 || j?.region_code522 || j?.region_code523 || j?.region_code524 || j?.region_code525 || j?.region_code526 || j?.region_code527 || j?.region_code528 || j?.region_code529 || j?.region_code530 || j?.region_code531 || j?.region_code532 || j?.region_code533 || j?.region_code534 || j?.region_code535 || j?.region_code536 || j?.region_code537 || j?.region_code538 || j?.region_code539 || j?.region_code540 || j?.region_code541 || j?.region_code542 || j?.region_code543 || j?.region_code544 || j?.region_code545 || j?.region_code546 || j?.region_code547 || j?.region_code548 || j?.region_code549 || j?.region_code550 || j?.region_code551 || j?.region_code552 || j?.region_code553 || j?.region_code554 || j?.region_code555 || j?.region_code556 || j?.region_code557 || j?.region_code558 || j?.region_code559 || j?.region_code560 || j?.region_code561 || j?.region_code562 || j?.region_code563 || j?.region_code564 || j?.region_code565 || j?.region_code566 || j?.region_code567 || j?.region_code568 || j?.region_code569 || j?.region_code570 || j?.region_code571 || j?.region_code572 || j?.region_code573 || j?.region_code574 || j?.region_code575 || j?.region_code576 || j?.region_code577 || j?.region_code578 || j?.region_code579 || j?.region_code580 || j?.region_code581 || j?.region_code582 || j?.region_code583 || j?.region_code584 || j?.region_code585 || j?.region_code586 || j?.region_code587 || j?.region_code588 || j?.region_code589 || j?.region_code590 || j?.region_code591 || j?.region_code592 || j?.region_code593 || j?.region_code594 || j?.region_code595 || j?.region_code596 || j?.region_code597 || j?.region_code598 || j?.region_code599 || j?.region_code600 || j?.region_code601 || j?.region_code602 || j?.region_code603 || j?.region_code604 || j?.region_code605 || j?.region_code606 || j?.region_code607 || j?.region_code608 || j?.region_code609 || j?.region_code610 || j?.region_code611 || j?.region_code612 || j?.region_code613 || j?.region_code614 || j?.region_code615 || j?.region_code616 || j?.region_code617 || j?.region_code618 || j?.region_code619 || j?.region_code620 || j?.region_code621 || j?.region_code622 || j?.region_code623 || j?.region_code624 || j?.region_code625 || j?.region_code626 || j?.region_code627 || j?.region_code628 || j?.region_code629 || j?.region_code630 || j?.region_code631 || j?.region_code632 || j?.region_code633 || j?.region_code634 || j?.region_code635 || j?.region_code636 || j?.region_code637 || j?.region_code638 || j?.region_code639 || j?.region_code640 || j?.region_code641 || j?.region_code642 || j?.region_code643 || j?.region_code644 || j?.region_code645 || j?.region_code646 || j?.region_code647 || j?.region_code648 || j?.region_code649 || j?.region_code650 || j?.region_code651 || j?.region_code652 || j?.region_code653 || j?.region_code654 || j?.region_code655 || j?.region_code656 || j?.region_code657 || j?.region_code658 || j?.region_code659 || j?.region_code660 || j?.region_code661 || j?.region_code662 || j?.region_code663 || j?.region_code664 || j?.region_code665 || j?.region_code666 || j?.region_code667 || j?.region_code668 || j?.region_code669 || j?.region_code670 || j?.region_code671 || j?.region_code672 || j?.region_code673 || j?.region_code674 || j?.region_code675 || j?.region_code676 || j?.region_code677 || j?.region_code678 || j?.region_code679 || j?.region_code680 || j?.region_code681 || j?.region_code682 || j?.region_code683 || j?.region_code684 || j?.region_code685 || j?.region_code686 || j?.region_code687 || j?.region_code688 || j?.region_code689 || j?.region_code690 || j?.region_code691 || j?.region_code692 || j?.region_code693 || j?.region_code694 || j?.region_code695 || j?.region_code696 || j?.region_code697 || j?.region_code698 || j?.region_code699 || j?.region_code700 || j?.region_code701 || j?.region_code702 || j?.region_code703 || j?.region_code704 || j?.region_code705 || j?.region_code706 || j?.region_code707 || j?.region_code708 || j?.region_code709 || j?.region_code710 || j?.region_code711 || j?.region_code712 || j?.region_code713 || j?.region_code714 || j?.region_code715 || j?.region_code716 || j?.region_code717 || j?.region_code718 || j?.region_code719 || j?.region_code720 || j?.region_code721 || j?.region_code722 || j?.region_code723 || j?.region_code724 || j?.region_code725 || j?.region_code726 || j?.region_code727 || j?.region_code728 || j?.region_code729 || j?.region_code730 || j?.region_code731 || j?.region_code732 || j?.region_code733 || j?.region_code734 || j?.region_code735 || j?.region_code736 || j?.region_code737 || j?.region_code738 || j?.region_code739 || j?.region_code740 || j?.region_code741 || j?.region_code742 || j?.region_code743 || j?.region_code744 || j?.region_code745 || j?.region_code746 || j?.region_code747 || j?.region_code748 || j?.region_code749 || j?.region_code750 || j?.region_code751 || j?.region_code752 || j?.region_code753 || j?.region_code754 || j?.region_code755 || j?.region_code756 || j?.region_code757 || j?.region_code758 || j?.region_code759 || j?.region_code760 || j?.region_code761 || j?.region_code762 || j?.region_code763 || j?.region_code764 || j?.region_code765 || j?.region_code766 || j?.region_code767 || j?.region_code768 || j?.region_code769 || j?.region_code770 || j?.region_code771 || j?.region_code772 || j?.region_code773 || j?.region_code774 || j?.region_code775 || j?.region_code776 || j?.region_code777 || j?.region_code778 || j?.region_code779 || j?.region_code780 || j?.region_code781 || j?.region_code782 || j?.region_code783 || j?.region_code784 || j?.region_code785 || j?.region_code786 || j?.region_code787 || j?.region_code788 || j?.region_code789 || j?.region_code790 || j?.region_code791 || j?.region_code792 || j?.region_code793 || j?.region_code794 || j?.region_code795 || j?.region_code796 || j?.region_code797 || j?.region_code798 || j?.region_code799 || j?.region_code800 || j?.region_code801 || j?.region_code802 || j?.region_code803 || j?.region_code804 || j?.region_code805 || j?.region_code806 || j?.region_code807 || j?.region_code808 || j?.region_code809 || j?.region_code810 || j?.region_code811 || j?.region_code812 || j?.region_code813 || j?.region_code814 || j?.region_code815 || j?.region_code816 || j?.region_code817 || j?.region_code818 || j?.region_code819 || j?.region_code820 || j?.region_code821 || j?.region_code822 || j?.region_code823 || j?.region_code824 || j?.region_code825 || j?.region_code826 || j?.region_code827 || j?.region_code828 || j?.region_code829 || j?.region_code830 || j?.region_code831 || j?.region_code832 || j?.region_code833 || j?.region_code834 || j?.region_code835 || j?.region_code836 || j?.region_code837 || j?.region_code838 || j?.region_code839 || j?.region_code840 || j?.region_code841 || j?.region_code842 || j?.region_code843 || j?.region_code844 || j?.region_code845 || j?.region_code846 || j?.region_code847 || j?.region_code848 || j?.region_code849 || j?.region_code850 || j?.region_code851 || j?.region_code852 || j?.region_code853 || j?.region_code854 || j?.region_code855 || j?.region_code856 || j?.region_code857 || j?.region_code858 || j?.region_code859 || j?.region_code860 || j?.region_code861 || j?.region_code862 || j?.region_code863 || j?.region_code864 || j?.region_code865 || j?.region_code866 || j?.region_code867 || j?.region_code868 || j?.region_code869 || j?.region_code870 || j?.region_code871 || j?.region_code872 || j?.region_code873 || j?.region_code874 || j?.region_code875 || j?.region_code876 || j?.region_code877 || j?.region_code878 || j?.region_code879 || j?.region_code880 || j?.region_code881 || j?.region_code882 || j?.region_code883 || j?.region_code884 || j?.region_code885 || j?.region_code886 || j?.region_code887 || j?.region_code888 || j?.region_code889 || j?.region_code890 || j?.region_code891 || j?.region_code892 || j?.region_code893 || j?.region_code894 || j?.region_code895 || j?.region_code896 || j?.region_code897 || j?.region_code898 || j?.region_code899 || j?.region_code900 || j?.region_code901 || j?.region_code902 || j?.region_code903 || j?.region_code904 || j?.region_code905 || j?.region_code906 || j?.region_code907 || j?.region_code908 || j?.region_code909 || j?.region_code910 || j?.region_code911 || j?.region_code912 || j?.region_code913 || j?.region_code914 || j?.region_code915 || j?.region_code916 || j?.region_code917 || j?.region_code918 || j?.region_code919 || j?.region_code920 || j?.region_code921 || j?.region_code922 || j?.region_code923 || j?.region_code924 || j?.region_code925 || j?.region_code926 || j?.region_code927 || j?.region_code928 || j?.region_code929 || j?.region_code930 || j?.region_code931 || j?.region_code932 || j?.region_code933 || j?.region_code934 || j?.region_code935 || j?.region_code936 || j?.region_code937 || j?.region_code938 || j?.region_code939 || j?.region_code940 || j?.region_code941 || j?.region_code942 || j?.region_code943 || j?.region_code944 || j?.region_code945 || j?.region_code946 || j?.region_code947 || j?.region_code948 || j?.region_code949 || j?.region_code950 || j?.region_code951 || j?.region_code952 || j?.region_code953 || j?.region_code954 || j?.region_code955 || j?.region_code956 || j?.region_code957 || j?.region_code958 || j?.region_code959 || j?.region_code960 || j?.region_code961 || j?.region_code962 || j?.region_code963 || j?.region_code964 || j?.region_code965 || j?.region_code966 || j?.region_code967 || j?.region_code968 || j?.region_code969 || j?.region_code970 || j?.region_code971 || j?.region_code972 || j?.region_code973 || j?.region_code974 || j?.region_code975 || j?.region_code976 || j?.region_code977 || j?.region_code978 || j?.region_code979 || j?.region_code980 || j?.region_code981 || j?.region_code982 || j?.region_code983 || j?.region_code984 || j?.region_code985 || j?.region_code986 || j?.region_code987 || j?.region_code988 || j?.region_code989 || j?.region_code990 || j?.region_code991 || j?.region_code992 || j?.region_code993 || j?.region_code994 || j?.region_code995 || j?.region_code996 || j?.region_code997 || j?.region_code998 || j?.region_code999 || j?.region_code1000 || null);

        // Realistically: just ipapi gives region_code reliably; keep it simple:
        const stateCode =
          (j?.region_code || "").toString().toUpperCase().trim();

        return { countryCode, countryName, stateCode, provider: p.name };
      } catch (e) {}
    }

    return { countryCode: localeCountry || "US", countryName: "United States", stateCode: "", provider: "locale" };
  }

  setLoading();

  try {
    const geo = await detectGeo();
    const countryCode = geo.countryCode || "US";
    const countryName = geo.countryName || "United States";
    const stateCode = (geo.stateCode || "").toUpperCase();
    const stateIso = countryCode === "US" && stateCode ? `US-${stateCode}` : "";

    subtitleEl.textContent = stateIso
      ? `Detected: ${countryName} (${countryCode}) • ${stateIso}`
      : `Detected: ${countryName} (${countryCode})`;

    // President (country head of state) CURRENT ONLY (no end date)
    // Governor (state head of government) CURRENT ONLY (no end date)
    const sparql = `
      SELECT
        ?presLabel ?presImg ?presStart ?presEnd
        ?stateLabel ?govLabel ?govImg ?govStart ?govEnd
      WHERE {
        ?country wdt:P297 "${countryCode}".

        OPTIONAL {
          ?country p:P35 ?presStmt.
          ?presStmt ps:P35 ?pres.
          OPTIONAL { ?pres wdt:P18 ?presImg. }
          OPTIONAL { ?presStmt pq:P580 ?presStart. }
          OPTIONAL { ?presStmt pq:P582 ?presEnd. }
          FILTER(!BOUND(?presEnd))
        }

        ${stateIso ? `
        OPTIONAL {
          ?state wdt:P300 "${stateIso}".
          OPTIONAL { ?state rdfs:label ?stateLabel FILTER (lang(?stateLabel) = "en") }

          OPTIONAL {
            ?state p:P6 ?govStmt.
            ?govStmt ps:P6 ?gov.
            OPTIONAL { ?gov wdt:P18 ?govImg. }
            OPTIONAL { ?govStmt pq:P580 ?govStart. }
            OPTIONAL { ?govStmt pq:P582 ?govEnd. }
            FILTER(!BOUND(?govEnd))
          }
        }` : ``}

        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
      LIMIT 1
    `;

    const wdUrl =
      "https://query.wikidata.org/sparql?format=json&query=" +
      encodeURIComponent(sparql);

    const wdRes = await safeFetch(wdUrl, { headers: { Accept: "application/sparql-results+json" } }, 12000);
    if (!wdRes.ok) throw new Error(`Wikidata HTTP ${wdRes.status}`);

    const data = await wdRes.json();
    const row = data?.results?.bindings?.[0] || {};

    // President
    const presName = row?.presLabel?.value || "Not available";
    const presImg = row?.presImg?.value || null;
    const presStart = row?.presStart?.value || null;
    const presEnd = row?.presEnd?.value || null;

    presNameEl.textContent = presName;
    presTermEl.textContent = formatTerm(presStart, presEnd);

    const presImgUrl = commonsFileToUrl(presImg, 256);
    if (presImgEl && presImgUrl) {
      presImgEl.onerror = () => {
        console.warn("President image failed:", presImgUrl, "raw:", presImg);
        presImgEl.style.display = "none";
      };
      presImgEl.src = presImgUrl;
      presImgEl.alt = `${presName} photo`;
      presImgEl.style.display = "block";
    }

    // Governor
    if (countryCode !== "US") {
      if (govLabelEl) govLabelEl.textContent = "Governor (US only)";
      govNameEl.textContent = "Not available";
      govTermEl.textContent = "—";
      if (govImgEl) govImgEl.style.display = "none";
    } else if (!stateIso) {
      if (govLabelEl) govLabelEl.textContent = "Governor (state unknown)";
      govNameEl.textContent = "Enable location / disable strict blockers";
      govTermEl.textContent = "We need your state to show a governor.";
      if (govImgEl) govImgEl.style.display = "none";
    } else {
      const stateLabel = row?.stateLabel?.value || stateIso;
      const govName = row?.govLabel?.value || "Not available";
      const govImg = row?.govImg?.value || null;
      const govStart = row?.govStart?.value || null;
      const govEnd = row?.govEnd?.value || null;

      if (govLabelEl) govLabelEl.textContent = `Governor (${stateLabel})`;
      govNameEl.textContent = govName;
      govTermEl.textContent = formatTerm(govStart, govEnd);

      const govImgUrl = commonsFileToUrl(govImg, 256);
      if (govImgEl && govImgUrl) {
        govImgEl.onerror = () => {
          console.warn("Governor image failed:", govImgUrl, "raw:", govImg);
          govImgEl.style.display = "none";
        };
        govImgEl.src = govImgUrl;
        govImgEl.alt = `${govName} photo`;
        govImgEl.style.display = "block";
      }
    }

    footnoteEl.textContent = `Live data from Wikidata. (Geo: ${geo.provider})`;
  } catch (err) {
    subtitleEl.textContent = "Leader lookup failed.";
    presNameEl.textContent = "Unavailable";
    govNameEl.textContent = "Unavailable";
    presTermEl.textContent = "—";
    govTermEl.textContent = "—";
    footnoteEl.textContent = `Error: ${err?.name || "Unknown"} — ${err?.message || "Failed to fetch"}`;
    console.warn("Leader widget error:", err);
  }

  if (refreshBtn && !refreshBtn.dataset.bound) {
    refreshBtn.dataset.bound = "1";
    refreshBtn.addEventListener("click", loadRegionalLeader);
  }
}

document.addEventListener("DOMContentLoaded", loadRegionalLeader);

/* ========================================
   displayShoutouts.js - Business Hours & Status
   Full version with dynamic sub-status (NO countdown)
   FINAL: Temp hours apply ONLY during time window and show Temporarily Unavailable (never Closed)
   ======================================== */

/* -------------------------
   HELPER FUNCTIONS
------------------------- */
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function timeStringToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return null;
    const parts = timeStr.split(':');
    if (parts.length < 2) return null;
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
}

function formatTime12hSimple(t) {
    if (!t) return '?';
    const [hStr, mStr] = t.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr || '0', 10);
    if (isNaN(h) || isNaN(m)) return 'Invalid';
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    return `${hh}:${String(m).padStart(2, '0')} ${suffix}`;
}

function formatDisplayTimeBI(timeString, visitorTimezone) {
    if (!timeString) return '?';
    if (typeof luxon === 'undefined' || !luxon.DateTime)
        return `${formatTime12hSimple(timeString)} ET (Lib Err)`;
    if (typeof assumedBusinessTimezone === 'undefined')
        return `${formatTime12hSimple(timeString)} (?)`;

    try {
        const { DateTime } = luxon;
        const [hour, minute] = timeString.split(':').map(Number);
        if (isNaN(hour) || isNaN(minute)) return formatTime12hSimple(timeString);
        const nowBiz = DateTime.now().setZone(assumedBusinessTimezone);
        const bizDt = nowBiz.set({ hour, minute, second: 0, millisecond: 0 });
        const visitorDt = bizDt.setZone(visitorTimezone);
        return visitorDt.toFormat('h:mm a ZZZZ');
    } catch (e) {
        return formatTime12hSimple(timeString) + ' (Err)';
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '?';
    if (typeof luxon === 'undefined' || !luxon.DateTime) {
        try {
            const parts = dateStr.split('-');
            const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
            return d.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch (e) {
            return dateStr;
        }
    }
    const { DateTime } = luxon;
    const dt = DateTime.fromISO(dateStr, { zone: assumedBusinessTimezone || 'UTC' });
    return dt.isValid ? dt.toFormat('cccc, LLLL d, yyyy') : dateStr;
}

/* -------------------------
   SAFE FIRESTORE REF
------------------------- */
let businessDocRefLocal;
try {
    if (typeof businessDocRef !== 'undefined' && businessDocRef)
        businessDocRefLocal = businessDocRef;
    else if (typeof doc !== 'undefined' && typeof db !== 'undefined')
        businessDocRefLocal = doc(db, 'site_config', 'businessDetails');
    else businessDocRefLocal = null;
} catch (e) {
    businessDocRefLocal = null;
}

/* ========================================
   displayShoutouts.js – Business Hours & Status
   FINAL, COMPLETE, WORKING VERSION
   ======================================== */

/* -------------------------
   DISPLAY FUNCTION
------------------------- */
async function displayBusinessInfo() {
    const contactEl = document.getElementById('contact-email-display');
    const hoursEl = document.getElementById('business-hours-display');
    const statusEl = document.getElementById('business-status-display');
    const tempEl = document.getElementById('temporary-hours-display');
    const holidayEl = document.getElementById('holiday-hours-display');

    if (!contactEl || !hoursEl || !statusEl || !tempEl || !holidayEl) return;

    if (!businessDocRefLocal || typeof getDoc !== 'function') {
        const statusMain = statusEl.querySelector('.status-main-text');
        if (statusMain) statusMain.textContent = 'Status: Error';
        return;
    }

    try {
        const docSnap = await getDoc(businessDocRefLocal);
        if (!docSnap.exists()) {
            hoursEl.innerHTML = '<p>Hours not available.</p>';
            return;
        }

        const data = docSnap.data() || {};

        // CONTACT
        if (data.contactEmail) {
            contactEl.innerHTML = `Contact: <a href="mailto:${data.contactEmail}">${data.contactEmail}</a>`;
        } else {
            contactEl.innerHTML = '';
        }

        calculateAndDisplayStatusBI(data);
    } catch (err) {
        const statusMain = statusEl.querySelector('.status-main-text');
        if (statusMain) statusMain.textContent = 'Error Loading';
        console.error(err);
    }
}

/* -------------------------
   CALCULATE & RENDER STATUS
------------------------- */
function calculateAndDisplayStatusBI(businessData = {}) {
    const hoursEl = document.getElementById('business-hours-display');
    const statusEl = document.getElementById('business-status-display');
    const tempEl = document.getElementById('temporary-hours-display');
    const holidayEl = document.getElementById('holiday-hours-display');
    const contactEl = document.getElementById('contact-email-display');

    const statusMainTextEl = statusEl.querySelector('.status-main-text');
    const statusSubTextEl = statusEl.querySelector('.status-countdown-text');
    const statusReasonEl = statusEl.querySelector('.status-reason-text');

    if (!statusMainTextEl || !statusSubTextEl || !statusReasonEl) return;

    if (typeof assumedBusinessTimezone === 'undefined') {
        statusMainTextEl.textContent = 'Config Error';
        statusMainTextEl.className = 'status-main-text status-unavailable';
        statusReasonEl.textContent = 'Missing Timezone';
        return;
    }

    const regularHours = businessData.regularHours || {};
    const holidayHours = Array.isArray(businessData.holidayHours) ? businessData.holidayHours : [];
    const temporaryHours = Array.isArray(businessData.temporaryHours) ? businessData.temporaryHours : [];
    const statusOverride = businessData.statusOverride || 'auto';

    const { DateTime } =
        typeof luxon !== 'undefined' && luxon.DateTime ? luxon : { DateTime: null };

    let visitorTimezone = 'UTC';
    try {
        visitorTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch (e) {}

    const nowInBizTZ = DateTime ? DateTime.now().setZone(assumedBusinessTimezone) : null;

    const currentMinutesInBizTZ = DateTime
        ? nowInBizTZ.hour * 60 + nowInBizTZ.minute
        : new Date().getHours() * 60 + new Date().getMinutes();

    const businessDateStr = DateTime ? nowInBizTZ.toISODate() : new Date().toISOString().slice(0, 10);

    const businessDayName = DateTime
        ? nowInBizTZ.toFormat('cccc').toLowerCase()
        : ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];

    function parseDate(str) {
        if (!str || !DateTime) return null;
        const parts = str.split('-').map((n) => parseInt(n, 10));
        if (parts.length !== 3) return null;
        const [y, m, d] = parts;
        return DateTime.fromObject({ year: y, month: m, day: d }, { zone: assumedBusinessTimezone });
    }

    function normalizeToRanges(obj) {
        if (obj && Array.isArray(obj.ranges)) return obj.ranges;
        if (obj && obj.open && obj.close) return [{ open: obj.open, close: obj.close }];
        return [];
    }

    function isRangeActive(range) {
        if (!range || (!range.open && !range.close)) return false;
        const openM = timeStringToMinutes(range.open);
        const closeM = timeStringToMinutes(range.close);
        if (openM === null || closeM === null) return false;
        if (closeM > openM) {
            return currentMinutesInBizTZ >= openM && currentMinutesInBizTZ < closeM;
        }
        return currentMinutesInBizTZ >= openM || currentMinutesInBizTZ < closeM;
    }

    function dtTodayAt(timeStr) {
        if (!DateTime || !timeStr) return null;
        const [hh, mm] = timeStr.split(':').map((x) => parseInt(x, 10));
        if (isNaN(hh) || isNaN(mm)) return null;
        return nowInBizTZ.set({ hour: hh, minute: mm, second: 0, millisecond: 0 });
    }

    function minutesUntil(dt) {
        if (!DateTime || !dt || !dt.isValid) return null;
        return dt.diff(nowInBizTZ, 'minutes').minutes;
    }

    function formatDuration(mins) {
        const m = Math.max(0, Math.round(mins));
        if (m < 60) return `${m} min`;
        const h = Math.floor(m / 60);
        const r = m % 60;
        return r === 0 ? `${h} hr` : `${h} hr ${r} min`;
    }

    function isInDateWindow(item) {
        const s = parseDate(item.startDate);
        const e = parseDate(item.endDate);
        if (!s || !e) return false;
        return nowInBizTZ >= s.startOf('day') && nowInBizTZ <= e.endOf('day');
    }

    /* -------------------------
       BASE STATUS (regular first)
    ------------------------- */
    const todayRegular = regularHours[businessDayName] || { isClosed: true, ranges: [] };
    const todayRanges = Array.isArray(todayRegular.ranges) ? todayRegular.ranges : [];

    let finalCurrentStatus =
        !todayRegular.isClosed && todayRanges.some((r) => isRangeActive(r))
            ? 'Open'
            : 'Closed';

    let finalActiveRule = {
        ...todayRegular,
        type: 'regular',
        day: businessDayName,
        reasonOriginal: 'Regular Hours',
        ranges: todayRanges
    };

    /* -------------------------
       OVERRIDE / HOLIDAY / TEMP
    ------------------------- */
    if (statusOverride !== 'auto') {
        finalCurrentStatus =
            statusOverride === 'open'
                ? 'Open'
                : statusOverride === 'closed'
                ? 'Closed'
                : 'Temporarily Unavailable';

        finalActiveRule = {
            type: 'override',
            reasonOriginal: 'Manual Override',
            isClosed: finalCurrentStatus !== 'Open',
            ranges: []
        };
    } else {
        // Holiday for today (full-day override)
        const todayHoliday = holidayHours.find((h) => h.date === businessDateStr);
        if (todayHoliday) {
            const hRanges = normalizeToRanges(todayHoliday);

            finalActiveRule = {
                ...todayHoliday,
                type: 'holiday',
                reasonOriginal: `Holiday (${todayHoliday.label || 'Event'})`,
                ranges: hRanges,
                isClosed: !!todayHoliday.isClosed || hRanges.length === 0
            };

            finalCurrentStatus = finalActiveRule.isClosed
                ? 'Closed'
                : hRanges.some((r) => isRangeActive(r))
                ? 'Open'
                : 'Closed';
        } else {
            // Temp ACTIVE only during its open->close window (and in date range)
            const activeTemp = temporaryHours.find((t) => {
                if (!t || !t.open || !t.close) return false;
                if (!isInDateWindow(t)) return false;
                return isRangeActive({ open: t.open, close: t.close });
            });

            if (activeTemp) {
                finalActiveRule = {
                    ...activeTemp,
                    type: 'temporary',
                    reasonOriginal: `Temporary (${activeTemp.label || 'Schedule'})`,
                    isClosed: false,
                    ranges: normalizeToRanges(activeTemp)
                };

                // Always "Temporarily Unavailable" while temp is active
                finalCurrentStatus = 'Temporarily Unavailable';
            }
        }
    }

    // reason text
    finalActiveRule.reason = `${finalActiveRule.reasonOriginal} - Currently ${finalCurrentStatus}`;

    // main status class
    let statusClass = 'status-closed';
    if (finalCurrentStatus === 'Open') statusClass = 'status-open';
    else if (finalCurrentStatus === 'Temporarily Unavailable') statusClass = 'status-unavailable';

    statusMainTextEl.className = 'status-main-text';
    statusMainTextEl.classList.add(statusClass);
    statusMainTextEl.textContent = finalCurrentStatus;

    statusReasonEl.textContent = finalActiveRule.reason;

    /* -------------------------
       SUB-STATUS (30-min logic)
    ------------------------- */
    (function setSubStatus() {
        const THRESHOLD_MIN = 30;

        // 1) If temp is active: "Opens again in" near end, else generic
        if (finalActiveRule.type === 'temporary') {
            const endDT = dtTodayAt(finalActiveRule.close);
            const m = minutesUntil(endDT);

            if (m !== null && m > 0 && m <= THRESHOLD_MIN) {
                statusSubTextEl.textContent = `Opens again in ${formatDuration(m)}`;
                return;
            }

            statusSubTextEl.textContent = 'Temporarily Unavailable';
            return;
        }

        // 2) If a temp window starts within 30 minutes: "Temporarily unavailable in"
        let soonestTempStartMins = null;
        for (const t of temporaryHours) {
            if (!t || !t.open || !t.close) continue;
            if (!isInDateWindow(t)) continue;

            const startDT = dtTodayAt(t.open);
            const m = minutesUntil(startDT);

            // must be future today
            if (m !== null && m > 0 && m <= THRESHOLD_MIN) {
                if (soonestTempStartMins === null || m < soonestTempStartMins) {
                    soonestTempStartMins = m;
                }
            }
        }
        if (soonestTempStartMins !== null) {
            statusSubTextEl.textContent = `Temporarily unavailable in ${formatDuration(soonestTempStartMins)}`;
            return;
        }

        // 3) If open now: "Closes in" within 30 min else "Open till"
        if (finalCurrentStatus === 'Open') {
            const activeRange = todayRanges.find((r) => isRangeActive(r));
            if (activeRange) {
                const closeDT = dtTodayAt(activeRange.close);
                const m = minutesUntil(closeDT);

                if (m !== null && m > 0 && m <= THRESHOLD_MIN) {
                    statusSubTextEl.textContent = `Closes in ${formatDuration(m)}`;
                    return;
                }

                statusSubTextEl.textContent = `Open till ${formatDisplayTimeBI(activeRange.close, visitorTimezone)}`;
                return;
            }
        }

        // 4) If closed now: find next opening in regular/holiday (no future temp counted as “opens”)
        const displayOrder = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
        const todayIndex = displayOrder.indexOf(businessDayName);

        function parseBizDate(str) {
            if (!str) return null;
            const parts = str.split('-').map((n) => parseInt(n, 10));
            if (parts.length !== 3) return null;
            const [y, m, d] = parts;
            return DateTime.fromObject({ year: y, month: m, day: d }, { zone: assumedBusinessTimezone });
        }

        function getDaySchedule(offset) {
            const targetDate = nowInBizTZ.plus({ days: offset }).startOf('day');

            const h = holidayHours.find((x) => {
                const dt = parseBizDate(x.date);
                return dt && dt.hasSame(targetDate, 'day');
            });
            if (h) return { type: 'holiday', schedule: h };

            const dayName = displayOrder[targetDate.weekday % 7];
            return { type: 'regular', schedule: regularHours[dayName] };
        }

        for (let offset = 0; offset < 7; offset++) {
            const { schedule } = getDaySchedule(offset);
            if (!schedule) continue;

            const ranges = normalizeToRanges(schedule);
            const isClosed = !!schedule.isClosed || ranges.length === 0;
            if (isClosed) continue;

            const first = ranges[0];
            if (!first || !first.open) continue;

            // build open dt in biz tz
            const openDT = nowInBizTZ.plus({ days: offset }).set({
                hour: parseInt(first.open.split(':')[0], 10),
                minute: parseInt(first.open.split(':')[1], 10),
                second: 0,
                millisecond: 0,
            });

            const m = minutesUntil(openDT);

            if (offset === 0 && m !== null && m > 0 && m <= THRESHOLD_MIN) {
                statusSubTextEl.textContent = `Opens in ${formatDuration(m)}`;
                return;
            }

            // label
            let label;
            if (offset === 0) label = 'Today';
            else if (offset === 1) label = 'Tomorrow';
            else label = capitalizeFirstLetter(displayOrder[(todayIndex + offset) % 7]);

            statusSubTextEl.textContent = `Opens ${label} at ${formatDisplayTimeBI(first.open, visitorTimezone)}`;
            return;
        }

        statusSubTextEl.textContent = '';
    })();

    /* -------------------------
       REGULAR HOURS RENDER
    ------------------------- */
    const weekOrder = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

    const visitorLocalDayName = DateTime
        ? DateTime.now().setZone(visitorTimezone).toFormat('cccc').toLowerCase()
        : new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

    let displayHoursListHtml = '<ul class="regular-hours-list">';
    weekOrder.forEach((day) => {
        const dayObj = regularHours[day] || { isClosed: true, ranges: [] };
        const isCurrent = day === visitorLocalDayName;

        displayHoursListHtml += `<li class="${isCurrent ? 'current-day' : ''}">
            <strong>${capitalizeFirstLetter(day)}:</strong>`;

        if (dayObj.isClosed) {
            displayHoursListHtml += `<div class="hours-line">Closed</div>`;
        } else if (!Array.isArray(dayObj.ranges) || dayObj.ranges.length === 0) {
            displayHoursListHtml += `<div class="hours-line">No hours added</div>`;
        } else {
            dayObj.ranges.forEach((r) => {
                displayHoursListHtml += `<div class="hours-line additional-hours">
                    ${formatDisplayTimeBI(r.open, visitorTimezone)} - ${formatDisplayTimeBI(r.close, visitorTimezone)}
                </div>`;
            });
        }

        displayHoursListHtml += '</li>';
    });
    displayHoursListHtml += '</ul>';
    displayHoursListHtml += `<p class="hours-timezone-note">Hours displayed in your local time zone: ${visitorTimezone.replace(/_/g, ' ')}</p>`;
    hoursEl.innerHTML = displayHoursListHtml;

    /* -------------------------
       TEMP HOURS RENDER (active/upcoming list)
    ------------------------- */
    if (temporaryHours.length > 0) {
        let tmpHtml = '<h4>Active/Temporary Hours</h4><ul class="special-hours-display">';

        temporaryHours.forEach((t) => {
            let daysUntil = '';
            if (DateTime) {
                const nowDT = DateTime.now().setZone(visitorTimezone);
                const startDT = parseDate(t.startDate);
                if (startDT) {
                    const diff = Math.ceil(startDT.diff(nowDT, 'days').days);
                    daysUntil =
                        diff > 0 ? `(${diff} day${diff > 1 ? 's' : ''} away)`
                        : diff === 0 ? '(Today)'
                        : '(Started)';
                }
            }

            tmpHtml += `<li>
                <strong>${t.label || 'Temporary Schedule'}</strong>
                <span class="hours">${
                    (!t.open || !t.close)
                        ? '—'
                        : `${formatDisplayTimeBI(t.open, visitorTimezone)} - ${formatDisplayTimeBI(t.close, visitorTimezone)}`
                }</span>
                <span class="dates">${formatDate(t.startDate)} to ${formatDate(t.endDate)}</span>
                <span class="days-until">${daysUntil}</span>
            </li>`;
        });

        tmpHtml += '</ul>';
        tempEl.innerHTML = tmpHtml;
        tempEl.style.display = 'block';
    } else {
        tempEl.innerHTML = '';
        tempEl.style.display = 'none';
    }

    /* -------------------------
       HOLIDAY HOURS RENDER (active/upcoming list)
    ------------------------- */
    if (holidayHours.length > 0) {
        let holidayHtml = '<h4>Active/Holiday Hours</h4><ul class="special-hours-display">';

        holidayHours.forEach((h) => {
            let daysUntil = '';
            if (DateTime) {
                const nowDT = DateTime.now().setZone(visitorTimezone);
                const hDT = parseDate(h.date);
                if (hDT) {
                    const diff = Math.ceil(hDT.diff(nowDT, 'days').days);
                    daysUntil =
                        diff > 0 ? `(${diff} day${diff > 1 ? 's' : ''} away)`
                        : diff === 0 ? '(Today)'
                        : '(Started)';
                }
            }

            holidayHtml += `<li>
                <strong>${h.label || 'Holiday'}</strong>
                <span class="hours">${
                    h.isClosed
                        ? 'Closed'
                        : `${formatDisplayTimeBI(h.open || '', visitorTimezone)} - ${formatDisplayTimeBI(h.close || '', visitorTimezone)}`
                }</span>
                <span class="dates">${formatDate(h.date)}</span>
                <span class="days-until">${daysUntil}</span>
            </li>`;
        });

        holidayHtml += '</ul>';
        holidayEl.innerHTML = holidayHtml;
        holidayEl.style.display = 'block';
    } else {
        holidayEl.innerHTML = '';
        holidayEl.style.display = 'none';
    }

    /* CONTACT (keep it synced if doc changes) */
    const contactEmail = businessData.contactEmail || '';
    if (contactEl) {
        contactEl.innerHTML = contactEmail
            ? `Contact: <a href="mailto:${contactEmail}">${contactEmail}</a>`
            : '';
    }
}

/* -------------------------
   INITIAL HOOK
------------------------- */
if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', displayBusinessInfo);
else
    displayBusinessInfo();

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
        return; 
    } else {
        // Maintenance mode OFF
        console.log("Maintenance mode OFF.");
        if (mainContentWrapper) mainContentWrapper.style.display = '';
        if (maintenanceOverlay) maintenanceOverlay.style.display = 'none';
        bodyElement.classList.remove('maintenance-active');

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
            // Store interval ID globally so we don't duplicate it
            if (window.statusPollInterval) clearInterval(window.statusPollInterval);
            
            window.statusPollInterval = setInterval(() => {
                // Re-run displayProfileData to fetch fresh Lanyard data
                displayProfileData(siteSettings); 
            }, 30000); // Check every 30 seconds
        }
        // --------------------------------

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
