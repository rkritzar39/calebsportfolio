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
    const batteryHealth = itemData.batteryHealth !== null && !isNaN(itemData.batteryHealth) ? parseInt(itemData.batteryHealth, 10) : null;
    const batteryCycles = itemData.batteryCycles !== null && !isNaN(itemData.batteryCycles) ? itemData.batteryCycles : null;

    let batteryHtml = '';
    if (batteryHealth !== null) {
        let batteryClass = '';
        if (batteryHealth <= 20) batteryClass = 'critical';
        else if (batteryHealth <= 50) batteryClass = 'low-power';
        const displayHealth = Math.min(batteryHealth, 100);
        batteryHtml = `<div class="tech-detail"><i class="fas fa-heart"></i><span>Battery Health:</span></div>
                      <div class="battery-container">
                        <div class="battery-icon ${batteryClass}">
                          <div class="battery-level" style="width: ${displayHealth}%;"></div>
                          <div class="battery-percentage">${batteryHealth}%</div>
                        </div>
                      </div>`;
    }

    let cyclesHtml = '';
    if (batteryCycles !== null) {
        cyclesHtml = `<div class="tech-detail"><i class="fas fa-sync"></i><span>Battery Charge Cycles:</span> ${batteryCycles}</div>`;
    }

    return `<div class="tech-item">
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

function displayProfileData(profileData) {
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

    // Define default values for when data isn't available
    const defaultUsername = "Username";
    const defaultBio = "";
    const defaultProfilePic = "images/default-profile.jpg";

    if (!profileData) {
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

    // Update the main profile info
    profileUsernameElement.textContent = profileData.username || defaultUsername;
    profilePicElement.src = profileData.profilePicUrl || defaultProfilePic;
    profileBioElement.textContent = profileData.bio || defaultBio;

    // --- Status Update Logic ---
    const statusKey = profileData.status || 'offline';
    let statusText = ''; // Initialize an empty string for the display text

    // Map the status key from the database to the desired full text
    switch (statusKey) {
        case 'online':
            statusText = 'Active';
            break;
        case 'idle':
            statusText = 'Idle';
            break;
        case 'dnd':
            statusText = 'Do Not Disturb'; // This is the change you wanted
            break;
        case 'offline':
            statusText = 'Offline';
            break;
        default:
            // As a fallback, just capitalize any unknown status
            statusText = statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
    }

    // Update the desktop corner status indicator
    if (profileStatusContainerElement) {
        profileStatusContainerElement.className = `profile-status-container status-${statusKey}`;
    }

    // Update the mobile text status indicator
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

// --- BUSINESS INFO HELPER FUNCTIONS (FROM YOUR PROVIDED SCRIPT) ---
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function timeStringToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return null;
    try {
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return null;
        return hours * 60 + minutes;
    } catch (e) {
        console.error("Error converting time string to minutes:", timeStr, e);
        return null;
    }
}

function formatDisplayTimeBI(timeString, visitorTimezone) {
    if (typeof luxon === 'undefined' || !luxon.DateTime) {
        console.error("Luxon library not loaded for formatDisplayTimeBI!");
        const [h, m] = timeString ? timeString.split(':') : ["?", "?"];
        const hourNum = parseInt(h, 10);
        if (isNaN(hourNum) || isNaN(parseInt(m, 10))) return 'Invalid Time';
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const hour12 = hourNum % 12 || 12;
        return `${hour12}:${String(m).padStart(2, '0')} ${ampm} ET (Lib Err)`;
    }

    const { DateTime } = luxon;
    // assumedBusinessTimezone must be globally available
    if (typeof assumedBusinessTimezone === 'undefined') {
        console.error("assumedBusinessTimezone not defined for formatDisplayTimeBI!");
        return "? (TZ Conf Err)";
    }

    if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) return '?';

    try {
        const [hour, minute] = timeString.split(':').map(Number);
        if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            throw new Error("Invalid HH:MM format");
        }
        const nowInBizTZ = DateTime.now().setZone(assumedBusinessTimezone);
        const bizTime = nowInBizTZ.set({ hour: hour, minute: minute, second: 0, millisecond: 0 });
        const visitorTime = bizTime.setZone(visitorTimezone);
        return visitorTime.toFormat('h:mm a ZZZZ');
    } catch (e) {
        console.error("Error formatting display time with Luxon:", timeString, visitorTimezone, e);
        const [h, m] = timeString.split(':');
        const hourNum = parseInt(h, 10);
        if (isNaN(hourNum) || isNaN(parseInt(m, 10))) return 'Invalid Time';
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const hour12 = hourNum % 12 || 12;
        return `${hour12}:${String(m).padStart(2, '0')} ${ampm} ET (LXN Err)`;
    }
}

function formatDate(dateStr) {
    if (typeof luxon === 'undefined' || !luxon.DateTime) {
        console.error("Luxon library not loaded for formatDate!");
        try {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const parts = dateStr.split('-'); // YYYY-MM-DD
            const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])); // Treat as UTC to avoid timezone shift
            return date.toLocaleDateString('en-US', options);
        } catch (e) { return 'Invalid Date'; }
    }
    const { DateTime } = luxon;
    const date = DateTime.fromISO(dateStr); // Assumes dateStr is YYYY-MM-DD
    if (!date.isValid) {
        console.error("Invalid date string passed to Luxon formatDate:", dateStr, date.invalidReason);
        return 'Invalid Date';
    }
    return date.toFormat('cccc, LLLL d, yyyy');
}

// --- Main Business Info Display Logic ---
async function displayBusinessInfo() {
    const localContactEmailDisplay = document.getElementById('contact-email-display');
    const localBusinessHoursDisplay = document.getElementById('business-hours-display');
    const localBusinessStatusDisplay = document.getElementById('business-status-display');
    const localTemporaryHoursDisplay = document.getElementById('temporary-hours-display');
    const localHolidayHoursDisplay = document.getElementById('holiday-hours-display');

    if (!localContactEmailDisplay || !localBusinessHoursDisplay || !localBusinessStatusDisplay || !localTemporaryHoursDisplay || !localHolidayHoursDisplay) {
        console.warn("One or more Business info display elements missing in displayBusinessInfo.");
        return;
    }

    if (!firebaseAppInitialized || !db || !businessDocRef) {
        console.error("Cannot display business info: Firebase not ready or businessDocRef missing.");
        if (localBusinessStatusDisplay) localBusinessStatusDisplay.innerHTML = '<span class="status-unavailable">Status: Error (Config)</span>';
        return;
    }

    try {
        const docSnap = await getDoc(businessDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (localContactEmailDisplay) {
                if (data.contactEmail) {
                    localContactEmailDisplay.innerHTML = `Contact: <a href="mailto:${data.contactEmail}">${data.contactEmail}</a>`;
                } else {
                    localContactEmailDisplay.innerHTML = '';
                }
            }
            calculateAndDisplayStatusConvertedBI(data);
        } else {
            console.warn("Business details document not found in Firestore.");
            if (localBusinessStatusDisplay) localBusinessStatusDisplay.innerHTML = '<span class="status-unavailable">Status: N/A</span>';
            if (localBusinessHoursDisplay) localBusinessHoursDisplay.innerHTML = '<p>Hours not available.</p>';
        }
    } catch (error) {
        console.error("Error fetching business info:", error);
        if (localBusinessStatusDisplay) localBusinessStatusDisplay.innerHTML = '<span class="status-unavailable">Status: Error Loading</span>';
    }
}

// In displayShoutouts.js
// (Ensure 'assumedBusinessTimezone', 'timeStringToMinutes', 'formatDisplayTimeBI', 
// 'capitalizeFirstLetter', and 'formatDate' are correctly defined globally in your file.)

// REPLACE your existing calculateAndDisplayStatusConvertedBI function with THIS ENTIRE VERSION:
function calculateAndDisplayStatusConvertedBI(businessData) {
    const localContactEmailDisplay = document.getElementById('contact-email-display');
    const localBusinessHoursDisplay = document.getElementById('business-hours-display');
    const localBusinessStatusDisplay = document.getElementById('business-status-display');
    const localTemporaryHoursDisplay = document.getElementById('temporary-hours-display');
    const localHolidayHoursDisplay = document.getElementById('holiday-hours-display');

    const statusMainTextEl = localBusinessStatusDisplay ? localBusinessStatusDisplay.querySelector('.status-main-text') : null;
    const statusCountdownTextEl = localBusinessStatusDisplay ? localBusinessStatusDisplay.querySelector('.status-countdown-text') : null;
    const statusReasonEl = localBusinessStatusDisplay ? localBusinessStatusDisplay.querySelector('.status-reason-text') : null;

    if (!localBusinessHoursDisplay || !localBusinessStatusDisplay || !localTemporaryHoursDisplay || !localHolidayHoursDisplay ||
        !statusMainTextEl || !statusCountdownTextEl || !statusReasonEl) {
        console.error("FATAL: Critical business display HTML elements missing.");
        if (localBusinessStatusDisplay) { /* ... error display ... */ }
        return;
    }

    const { DateTime, Duration } = luxon;
    if (typeof assumedBusinessTimezone === 'undefined') {
        console.error("CRITICAL: assumedBusinessTimezone is not defined globally in displayShoutouts.js!");
        statusMainTextEl.textContent = 'Config Error'; statusMainTextEl.className = 'status-main-text status-unavailable';
        statusCountdownTextEl.textContent = '(TZ const missing)'; statusReasonEl.textContent = ''; return;
    }

    const { regularHours = {}, holidayHours = [], temporaryHours = [], statusOverride = 'auto' } = businessData;
    
    let finalCurrentStatus = 'Closed'; 
    let finalActiveRule = null;     
    let preliminaryReasonCategory = 'Scheduled Hours'; 

    let visitorTimezone;
    try {
        visitorTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (!visitorTimezone || !DateTime.now().setZone(visitorTimezone).isValid) throw new Error("TZ detection/validation failed.");
    } catch (e) { /* ... error display ... */ return; }

    const nowInBizTZLuxon = DateTime.now().setZone(assumedBusinessTimezone);
    if (!nowInBizTZLuxon.isValid) { /* ... error display ... */ return; }

    const currentMinutesInBizTZ = nowInBizTZLuxon.hour * 60 + nowInBizTZLuxon.minute;
    const businessDateStr = nowInBizTZLuxon.toISODate();
    const businessDayName = nowInBizTZLuxon.toFormat('cccc').toLowerCase();

    // 1. Determine baseline status from REGULAR hours
    const todayRegularHours = regularHours[businessDayName];
    let baseStatus = 'Closed';
    let baseRule = { ...(todayRegularHours || { isClosed: true, open: null, close: null }), type: 'regular', day: businessDayName, reasonOriginal: 'Regular Hours' };
    if (todayRegularHours && !todayRegularHours.isClosed && todayRegularHours.open && todayRegularHours.close) {
        const openMins = timeStringToMinutes(todayRegularHours.open);
        const closeMins = timeStringToMinutes(todayRegularHours.close);
        if (openMins !== null && closeMins !== null && currentMinutesInBizTZ >= openMins && currentMinutesInBizTZ < closeMins) {
            baseStatus = 'Open';
        }
    }
    finalCurrentStatus = baseStatus;
    finalActiveRule = baseRule;
    preliminaryReasonCategory = 'Regular Hours';

    if (statusOverride !== 'auto') {
        finalCurrentStatus = statusOverride === 'open' ? 'Open' : (statusOverride === 'closed' ? 'Closed' : 'Temporarily Unavailable');
        preliminaryReasonCategory = 'Manual Override';
        finalActiveRule = { type: 'override', reasonOriginal: preliminaryReasonCategory, isClosed: (finalCurrentStatus !== 'Open' && finalCurrentStatus !== 'Temporarily Unavailable'), open: null, close: null };
    } else {
        const todayHoliday = holidayHours.find(h => h.date === businessDateStr);
        if (todayHoliday) {
            preliminaryReasonCategory = `Holiday (${todayHoliday.label || 'Event'})`;
            finalActiveRule = { ...todayHoliday, type: 'holiday', reasonOriginal: preliminaryReasonCategory };
            if (todayHoliday.isClosed || !todayHoliday.open || !todayHoliday.close) finalCurrentStatus = 'Closed';
            else {
                const openMins = timeStringToMinutes(todayHoliday.open); const closeMins = timeStringToMinutes(todayHoliday.close);
                finalCurrentStatus = (openMins !== null && closeMins !== null && currentMinutesInBizTZ >= openMins && currentMinutesInBizTZ < closeMins) ? 'Open' : 'Closed';
            }
        } else {
            const currentlyMidTemporaryPeriod = temporaryHours.find(t => {
                if (t.startDate && t.endDate && businessDateStr >= t.startDate && businessDateStr <= t.endDate) {
                    if (t.isClosed === true) return true; 
                    if (t.open && t.close) {
                        const openMins = timeStringToMinutes(t.open); const closeMins = timeStringToMinutes(t.close);
                        return (openMins !== null && closeMins !== null && currentMinutesInBizTZ >= openMins && currentMinutesInBizTZ < closeMins);
                    }
                }
                return false;
            });

            if (currentlyMidTemporaryPeriod) {
                preliminaryReasonCategory = `Temporary (${currentlyMidTemporaryPeriod.label || 'Schedule'})`;
                finalActiveRule = { ...currentlyMidTemporaryPeriod, type: 'temporary', reasonOriginal: preliminaryReasonCategory };
                if (currentlyMidTemporaryPeriod.isClosed) finalCurrentStatus = 'Closed';
                else finalCurrentStatus = 'Temporarily Unavailable';
            }
        }
    }

    if (finalActiveRule) finalActiveRule.reason = `${finalActiveRule.reasonOriginal} - Currently ${finalCurrentStatus}`;
    else finalActiveRule = { reason: `${preliminaryReasonCategory} - Currently ${finalCurrentStatus}`, type: 'default', isClosed: (finalCurrentStatus === 'Closed'), open: null, close: null };
    
    let statusClass = 'status-closed';
    if (finalCurrentStatus === 'Open') statusClass = 'status-open';
    else if (finalCurrentStatus === 'Temporarily Unavailable') statusClass = 'status-unavailable';

    statusMainTextEl.className = 'status-main-text'; statusMainTextEl.classList.add(statusClass);
    statusMainTextEl.textContent = finalCurrentStatus;
    statusReasonEl.textContent = `(${finalActiveRule?.reason || 'Status Determined'})`;

    // --- REFINED MAIN COUNTDOWN LOGIC with 30-MINUTE WINDOWS & STATIC MESSAGES ---
    let countdownMessage = "";
    let nextEventTargetTime = null; 
    let eventTypeForMsg = "";       
    let displayCountdownMessage = true; // Flag to control if any message (countdown or static) is shown
    const COUNTDOWN_WINDOW_MINUTES = 30;

    if (finalActiveRule.type === 'override') {
        countdownMessage = "Status is manually set";
        displayCountdownMessage = true; 
    } else {
        let upcomingTemporaryEventToday = null;
        if ((finalCurrentStatus === 'Open' && (finalActiveRule.type === 'regular' || finalActiveRule.type === 'holiday'))) {
            const sortedUpcomingTemps = temporaryHours
                .filter(t => t.startDate === businessDateStr && (t.open || t.isClosed === true) && (t.isClosed === true || timeStringToMinutes(t.open) !== null))
                .map(t => ({ ...t, openMinsField: t.isClosed ? 0 : timeStringToMinutes(t.open) }))
                .filter(t => t.openMinsField > currentMinutesInBizTZ)
                .sort((a, b) => a.openMinsField - b.openMinsField);
            if (sortedUpcomingTemps.length > 0) upcomingTemporaryEventToday = sortedUpcomingTemps[0];
        }

        // Scenario 1: Temp ending soon & will Open after
        if (finalCurrentStatus === 'Temporarily Unavailable' && finalActiveRule.type === 'temporary' && finalActiveRule.close) {
            const tempCloseDt = nowInBizTZLuxon.set({
                hour: Math.floor(timeStringToMinutes(finalActiveRule.close) / 60),
                minute: timeStringToMinutes(finalActiveRule.close) % 60, second: 0, millisecond: 0
            });
            if (tempCloseDt > nowInBizTZLuxon) {
                const durationToTempClose = tempCloseDt.diff(nowInBizTZLuxon);
                if (durationToTempClose.as('minutes') <= COUNTDOWN_WINDOW_MINUTES && durationToTempClose.as('milliseconds') > 0) {
                    let statusAfterTemp = 'Closed'; 
                    const timeAtTempCloseMins = timeStringToMinutes(finalActiveRule.close);
                    const regularForToday = regularHours[businessDayName];
                    if (regularForToday && !regularForToday.isClosed && regularForToday.open && regularForToday.close) {
                        const regularOpenMins = timeStringToMinutes(regularForToday.open); const regularCloseMins = timeStringToMinutes(regularForToday.close);
                        if (timeAtTempCloseMins !== null && regularOpenMins !== null && regularCloseMins !== null &&
                            timeAtTempCloseMins >= regularOpenMins && timeAtTempCloseMins < regularCloseMins) {
                            statusAfterTemp = 'Open';
                        }
                    }
                    if (statusAfterTemp === 'Open') {
                        nextEventTargetTime = tempCloseDt;
                        eventTypeForMsg = "opens_after_temp"; 
                    } else { // Will be closed after temp, so count down to temp end
                        nextEventTargetTime = tempCloseDt;
                        eventTypeForMsg = "temp_ends";
                    }
                }
            }
        }

        // Scenario 2: Currently Open (Regular/Holiday) & Temp starts soon
        if (!nextEventTargetTime && finalCurrentStatus === 'Open' && (finalActiveRule.type === 'regular' || finalActiveRule.type === 'holiday') && upcomingTemporaryEventToday) {
            const tempStartTimeToday = nowInBizTZLuxon.set({
                hour: Math.floor(upcomingTemporaryEventToday.openMinsField / 60),
                minute: upcomingTemporaryEventToday.openMinsField % 60, second: 0, millisecond: 0
            });
            if (tempStartTimeToday > nowInBizTZLuxon) {
                const durationToTempStart = tempStartTimeToday.diff(nowInBizTZLuxon);
                if (durationToTempStart.as('minutes') <= COUNTDOWN_WINDOW_MINUTES && durationToTempStart.as('milliseconds') > 0) {
                    nextEventTargetTime = tempStartTimeToday;
                    eventTypeForMsg = upcomingTemporaryEventToday.isClosed ? "temp_closes_soon" : "temp_starts_soon";
                }
            }
        }

        // Scenario 3: Default countdown based on finalActiveRule
        if (!nextEventTargetTime) {
            const ruleOpenTimeStr = finalActiveRule.open;
            const ruleCloseTimeStr = finalActiveRule.close;
            const ruleIsAllDayClosed = finalActiveRule.isClosed;

            if (finalCurrentStatus === 'Open' || finalCurrentStatus === 'Temporarily Unavailable') {
                eventTypeForMsg = finalActiveRule.type === 'temporary' ? "closing_temp" : "closing";
                if (ruleCloseTimeStr) {
                    const [h, m] = ruleCloseTimeStr.split(':').map(Number);
                    if (!isNaN(h) && !isNaN(m)) {
                        nextEventTargetTime = nowInBizTZLuxon.set({ hour: h, minute: m, second: 0, millisecond: 0 });
                        if (nextEventTargetTime < nowInBizTZLuxon) nextEventTargetTime = null;
                    }
                }
            } else if (finalCurrentStatus === 'Closed') {
                eventTypeForMsg = finalActiveRule.type === 'temporary' ? "opening_temp" : (finalActiveRule.type === 'holiday' ? "opening_holiday" : "opening");
                if (!ruleIsAllDayClosed && ruleOpenTimeStr) {
                    const [h, m] = ruleOpenTimeStr.split(':').map(Number);
                    if (!isNaN(h) && !isNaN(m)) {
                        let potentialOpenTime = nowInBizTZLuxon.set({ hour: h, minute: m, second: 0, millisecond: 0 });
                        if (potentialOpenTime < nowInBizTZLuxon) {
                            if (finalActiveRule.type === 'regular') nextEventTargetTime = potentialOpenTime.plus({ days: 1 });
                            else nextEventTargetTime = null;
                        } else {
                            nextEventTargetTime = potentialOpenTime;
                        }
                    }
                } else if (ruleIsAllDayClosed) {
                    let qualifier = "";
                    if (finalActiveRule.type === 'temporary') qualifier = "Temporarily ";
                    else if (finalActiveRule.type === 'holiday') qualifier = "For Holiday ";
                    countdownMessage = `${qualifier}Closed All Day`;
                    displayCountdownMessage = false; 
                }
            }
        }

        // Format the countdownMessage based on nextEventTargetTime and COUNTDOWN_WINDOW_MINUTES
        if (displayCountdownMessage && nextEventTargetTime && nextEventTargetTime >= nowInBizTZLuxon) {
            const durationToEvent = nextEventTargetTime.diff(nowInBizTZLuxon);
            const minutesToEvent = Math.floor(durationToEvent.as('minutes'));

            if (minutesToEvent <= COUNTDOWN_WINDOW_MINUTES && durationToEvent.as('milliseconds') > 0) {
                // Within 30 mins: Show running countdown
                const hours = Math.floor(minutesToEvent / 60);
                const minutes = minutesToEvent % 60;
                let prefix = "";

                switch (eventTypeForMsg) {
                    case "closing":             prefix = "Closes"; break;
                    case "opening":             prefix = "Opens"; break;
                    case "closing_temp":        prefix = "Closes temporarily"; break;
                    case "opening_temp":        prefix = "Opens temporarily"; break;
                    case "opening_holiday":     prefix = "Opens for holiday"; break;
                    case "temp_starts_soon":    prefix = "Temporary schedule starts"; break;
                    case "temp_closes_soon":    prefix = "Temporarily closes"; break;
                    case "opens_after_temp":    prefix = "Opens"; break; 
                    case "temp_ends":           prefix = "Temporary schedule ends"; break;
                    default:                    prefix = "Event"; break;
                }

                if (hours > 0) countdownMessage = `${prefix} in ${hours} hr ${minutes} min`;
                else if (minutes >= 1) countdownMessage = `${prefix} in ${minutes} min`;
                else { 
                    let verb = prefix.trim();
                    if (prefix === "Opens") verb = "Opening"; // For "Opens in..." -> "Opening very soon"
                    else if (verb.endsWith('s')) verb = verb.slice(0, -1) + "ing"; 
                    else if (verb.includes("starts")) verb = verb.replace("starts", "starting");
                    else if (verb.includes("ends")) verb = verb.replace("ends", "ending");
                    countdownMessage = `${capitalizeFirstLetter(verb)} very soon`;
                }
            } else if (minutesToEvent > COUNTDOWN_WINDOW_MINUTES) {
                // More than 30 mins away: Show static "until HH:MM" message
                let eventTimeStr = formatDisplayTimeBI(
                    nextEventTargetTime.toFormat('HH:mm'), // Get HH:mm from the Luxon object
                    visitorTimezone
                );
                switch (eventTypeForMsg) {
                    case "closing":
                    case "closing_temp":
                        countdownMessage = `${capitalizeFirstLetter(finalCurrentStatus)} until ${eventTimeStr}`;
                        break;
                    case "opening":
                    case "opening_temp":
                    case "opening_holiday":
                        countdownMessage = `${capitalizeFirstLetter(finalCurrentStatus)} until ${eventTimeStr}`;
                        break;
                    case "opens_after_temp": // Currently Temporarily Unavailable, will Open after temp period ends
                        countdownMessage = `Unavailable until ${eventTimeStr}, then Opens`;
                        break;
                    case "temp_starts_soon":
                    case "temp_closes_soon":
                         countdownMessage = `${capitalizeFirstLetter(finalCurrentStatus)} until temp. schedule at ${eventTimeStr}`;
                         break;
                    case "temp_ends":
                         countdownMessage = `${capitalizeFirstLetter(finalCurrentStatus)} until ${eventTimeStr}`;
                         break;
                    default:
                        countdownMessage = ""; // No specific static message
                        break;
                }
            }
        } else if (displayCountdownMessage && !countdownMessage && finalCurrentStatus === 'Closed' && finalActiveRule.type !== 'override') {
             if (!finalActiveRule.isClosed || (finalActiveRule.isClosed && finalActiveRule.type === 'regular')) {
                if (!(finalActiveRule.isClosed && (finalActiveRule.type === 'holiday' || finalActiveRule.type === 'temporary'))) {
                     countdownMessage = "Check schedule for next opening";
                }
            }
        }
    }
    statusCountdownTextEl.textContent = countdownMessage;

    // --- REGULAR HOURS DISPLAY --- (Keep your existing logic)
    const displayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const visitorLocalDayName = DateTime.now().setZone(visitorTimezone).toFormat('cccc').toLowerCase();
    let displayHoursListHtml = '<ul>';
    displayOrder.forEach(day => {
        const dayData = regularHours[day];
        const isCurrentDayForVisitorDisplay = day === visitorLocalDayName;
        const highlightClass = isCurrentDayForVisitorDisplay ? 'current-day' : '';
        displayHoursListHtml += `<li class="${highlightClass}"><strong>${capitalizeFirstLetter(day)}:</strong> `;
        if (dayData && !dayData.isClosed && dayData.open && dayData.close) {
            displayHoursListHtml += `<span>${formatDisplayTimeBI(dayData.open, visitorTimezone)} - ${formatDisplayTimeBI(dayData.close, visitorTimezone)}</span>`;
        } else { displayHoursListHtml += '<span>Closed</span>'; }
        displayHoursListHtml += '</li>';
    });
    displayHoursListHtml += '</ul>';
    displayHoursListHtml += `<p class="hours-timezone-note">Hours displayed in your local time zone: ${visitorTimezone.replace(/_/g, ' ')}</p>`;
    if(localBusinessHoursDisplay) localBusinessHoursDisplay.innerHTML = displayHoursListHtml;

    // --- TEMPORARY HOURS DISPLAY (with refined individual countdowns for 30-min windows) ---
    if (localTemporaryHoursDisplay) {
        const relevantTemporaryHours = (temporaryHours || [])
            .filter(t => t.startDate && t.endDate && DateTime.fromISO(t.endDate, { zone: assumedBusinessTimezone }).endOf('day') >= nowInBizTZLuxon.startOf('day'))
            .sort((a, b) => (DateTime.fromISO(a.startDate) > DateTime.fromISO(b.startDate) ? 1 : -1));

        if (relevantTemporaryHours.length > 0) {
            localTemporaryHoursDisplay.className = 'special-hours-list';
            let tempHoursHtml = '<h4>Upcoming/Active Temporary Hours</h4><ul class="special-hours-display">';
            relevantTemporaryHours.forEach(temp => {
                let tempCountdownStr = "";
                const tempStartLuxonDate = DateTime.fromISO(temp.startDate, { zone: assumedBusinessTimezone }).startOf('day');
                const startOfTodayInBiz = nowInBizTZLuxon.startOf('day');
        
                // Check if the temporary schedule is for today, tomorrow, or future
                if (businessDateStr === temp.startDate) {
                    // Today's temporary schedule
                    if (temp.isClosed) {
                        tempCountdownStr = `Closed Today (Temporary: ${temp.label || 'Event'})`;
                    } else if (temp.open && temp.close) {
                        const tempOpenMinutesNum = timeStringToMinutes(temp.open);
                        if (tempOpenMinutesNum !== null) {
                            const tempOpenTimeToday = formatDisplayTimeBI(temp.open, visitorTimezone);
                            const currentMinutes = nowInBizTZLuxon.hour * 60 + nowInBizTZLuxon.minute;
                            
                            if (tempOpenMinutesNum > currentMinutes) {
                                tempCountdownStr = `Today at ${tempOpenTimeToday}`;
                            } else {
                                tempCountdownStr = `Active Today until ${formatDisplayTimeBI(temp.close, visitorTimezone)}`;
                            }
                        }
                    }
                } else {
                    // Check if it's tomorrow or future date
                    const diffInCalendarDays = Math.ceil(tempStartLuxonDate.diff(startOfTodayInBiz, 'days').days);
                    
                    if (diffInCalendarDays === 1) {
                        // Tomorrow's schedule
                        if (temp.isClosed) {
                            tempCountdownStr = "Closed Tomorrow";
                        } else if (temp.open) {
                            tempCountdownStr = `Tomorrow at ${formatDisplayTimeBI(temp.open, visitorTimezone)}`;
                        }
                    } else if (diffInCalendarDays > 1) {
                        // Future date
                        if (diffInCalendarDays <= 7) {
                            // If within a week, show the day name
                            const futureDate = tempStartLuxonDate.toFormat('cccc');
                            tempCountdownStr = `Upcoming on ${futureDate} (in ${diffInCalendarDays} days)`;
                        } else {
                            tempCountdownStr = `Upcoming in ${diffInCalendarDays} days`;
                        }
                        
                        if (!temp.isClosed && temp.open) {
                            tempCountdownStr += ` at ${formatDisplayTimeBI(temp.open, visitorTimezone)}`;
                        }
                    }
                }
                
                tempHoursHtml += `
                    <li>
                        <div class="hours-container">
                            <strong>${temp.label || 'Temporary Schedule'}</strong>
                            <span class="hours">${temp.isClosed ? 'Closed' : `${formatDisplayTimeBI(temp.open, visitorTimezone) || '?'} - ${formatDisplayTimeBI(temp.close, visitorTimezone) || '?'}`}</span>
                        </div>
                        <span class="dates">${formatDate(temp.startDate)} to ${formatDate(temp.endDate)}</span>
                        <div class="temp-status-countdown-text">${tempCountdownStr}</div>
                    </li>`;
            });
            tempHoursHtml += '</ul>';
            localTemporaryHoursDisplay.innerHTML = tempHoursHtml;
            localTemporaryHoursDisplay.style.display = '';
        } else {
            localTemporaryHoursDisplay.innerHTML = '';
            localTemporaryHoursDisplay.style.display = 'none';
            localTemporaryHoursDisplay.className = '';
        }
    }

        // --- HOLIDAY HOURS DISPLAY --- (Keep your existing logic, or adapt list item countdowns similarly if needed)
        if (localHolidayHoursDisplay) {
        const upcomingHolidayHours = (holidayHours || [])
            .filter(h => h.date && DateTime.fromISO(h.date, { zone: assumedBusinessTimezone }).endOf('day') >= nowInBizTZLuxon.startOf('day'))
            .sort((a, b) => (DateTime.fromISO(a.date) > DateTime.fromISO(b.date) ? 1 : -1));
    
        if (upcomingHolidayHours.length > 0) {
            localHolidayHoursDisplay.className = 'special-hours-list';
            let holidayHoursHtml = '<h4>Upcoming Holiday Hours</h4><ul class="special-hours-display">';
            
            upcomingHolidayHours.forEach(holiday => {
                let holidayItemCountdownStr = "";
                const holidayStartLuxonDate = DateTime.fromISO(holiday.date, { zone: assumedBusinessTimezone }).startOf('day');
                const startOfTodayInBiz = nowInBizTZLuxon.startOf('day');
                
                if (holiday.date === businessDateStr) {
                    // Today's holiday
                    if (holiday.isClosed) {
                        holidayItemCountdownStr = "Closed Today (Holiday)";
                    } else if (holiday.open && holiday.close) {
                        const holidayOpenMinutesNum = timeStringToMinutes(holiday.open);
                        if (holidayOpenMinutesNum !== null) {
                            const holidayOpenTimeToday = formatDisplayTimeBI(holiday.open, visitorTimezone);
                            const currentMinutes = nowInBizTZLuxon.hour * 60 + nowInBizTZLuxon.minute;
                            
                            if (holidayOpenMinutesNum > currentMinutes) {
                                holidayItemCountdownStr = `Today at ${holidayOpenTimeToday}`;
                            } else {
                                holidayItemCountdownStr = `Active Today until ${formatDisplayTimeBI(holiday.close, visitorTimezone)}`;
                            }
                        }
                    }
                } else {
                    // Check if it's tomorrow or future date
                    const diffInCalendarDays = Math.ceil(holidayStartLuxonDate.diff(startOfTodayInBiz, 'days').days);
                    
                    if (diffInCalendarDays === 1) {
                        // Tomorrow's holiday
                        if (holiday.isClosed) {
                            holidayItemCountdownStr = "Closed Tomorrow";
                        } else if (holiday.open) {
                            holidayItemCountdownStr = `Tomorrow at ${formatDisplayTimeBI(holiday.open, visitorTimezone)}`;
                        }
                    } else if (diffInCalendarDays > 1) {
                        // Future holiday
                        if (diffInCalendarDays <= 7) {
                            // If within a week, show the day name
                            const futureDate = holidayStartLuxonDate.toFormat('cccc');
                            holidayItemCountdownStr = `Upcoming on ${futureDate} (in ${diffInCalendarDays} days)`;
                        } else {
                            holidayItemCountdownStr = `Upcoming in ${diffInCalendarDays} days`;
                        }
                        
                        if (!holiday.isClosed && holiday.open) {
                            holidayItemCountdownStr += ` at ${formatDisplayTimeBI(holiday.open, visitorTimezone)}`;
                        }
                    }
                }
    
                holidayHoursHtml += `
                    <li>
                        <div class="hours-container">
                            <strong>${holiday.label || 'Holiday'}</strong>
                            <span class="hours">${holiday.isClosed ? 'Closed' : 
                                `${formatDisplayTimeBI(holiday.open, visitorTimezone) || '?'} - ${formatDisplayTimeBI(holiday.close, visitorTimezone) || '?'}`}</span>
                        </div>
                        <span class="dates">${formatDate(holiday.date)}</span>
                        <div class="holiday-status-countdown-text">${holidayItemCountdownStr}</div>
                    </li>`;
            });
            
            holidayHoursHtml += '</ul>';
            localHolidayHoursDisplay.innerHTML = holidayHoursHtml;
            localHolidayHoursDisplay.style.display = '';
        } else {
            localHolidayHoursDisplay.innerHTML = '';
            localHolidayHoursDisplay.style.display = 'none';
            localHolidayHoursDisplay.className = '';
        }
    }
    
    if (localContactEmailDisplay) {
        if (businessData.contactEmail) {
            localContactEmailDisplay.innerHTML = `Contact: <a href="mailto:${businessData.contactEmail}">${businessData.contactEmail}</a>`;
        } else {
            localContactEmailDisplay.innerHTML = '';
        }
   }
} // --- END OF calculateAndDisplayStatusConvertedBI ---

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".search-container.unified .creator-search").forEach(input => {
    const container = input.closest(".search-container.unified");

    const setTyping = () => {
      if (input.value.trim()) {
        container.classList.add("typing");
      } else {
        container.classList.remove("typing");
      }
    };

    // Initialize once on load
    setTyping();

    // Listen for user input
    input.addEventListener("input", setTyping);
    input.addEventListener("change", setTyping);
    input.addEventListener("blur", setTyping);
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



function startEventCountdown(targetTimestamp, countdownTitle, expiredMessageOverride) {

    /* ------------------------------------------------------------ */
    /*  QUERY ALL NODES                                             */
    /* ------------------------------------------------------------ */
    const section = document.querySelector('.countdown-section');
    if (!section) return console.warn("Countdown section not found.");

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
    /*  PARSE DATE                                                  */
    /* ------------------------------------------------------------ */
    let targetDate;
    try { targetDate = targetTimestamp.toDate(); }
    catch { targetDate = targetTimestamp instanceof Date ? targetTimestamp : null; }

    const title = countdownTitle || "Event";
    titleEl.textContent = title;


    /* ------------------------------------------------------------ */
    /*  LOCAL TIME DISPLAY                                          */
    /* ------------------------------------------------------------ */
    function updateLocalTime() {
        if (!targetDate || !localTimeEl) return;

        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const timeString = targetDate.toLocaleString([], {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: tz
        });

        localTimeEl.textContent =
            `${title} begins at ${timeString} (${tz}).`;
    }
    updateLocalTime();


    /* ------------------------------------------------------------ */
    /*  AI-POWERED STATUS MESSAGES                                  */
    /* ------------------------------------------------------------ */
    function generateAIMessages(title) {
        const t = title.trim();

        const base = [
            `Anticipation builds as ${t} approaches…`,
            `Every moment brings us closer to ${t}…`,
            `${t} is shaping up beautifully…`,
            `Final preparations underway for ${t}…`,
            `The world gets ready for ${t}…`,
            `Energy rises in the countdown to ${t}…`,
            `${t} is almost here…`,
            `All paths lead toward ${t}…`,
            `A new moment begins soon: ${t}…`
        ];

        return base.sort(() => Math.random() - 0.5).slice(0, 5);
    }

    const aiMessages = generateAIMessages(title);
    let msgIndex = 0;
    if (statusEl) statusEl.textContent = aiMessages[0];

    const statusInterval = setInterval(() => {
        statusEl.textContent = aiMessages[msgIndex];
        msgIndex = (msgIndex + 1) % aiMessages.length;
    }, 3500);


    /* ------------------------------------------------------------ */
    /*  COUNTDOWN LOGIC                                             */
    /* ------------------------------------------------------------ */
    function clamp(v, min = 0, max = 100) {
        return Math.min(max, Math.max(min, v));
    }

    function updateCountdown() {
        if (!targetDate) return;

        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            clearInterval(loop);
            clearInterval(statusInterval);
            container.style.display = "none";

            const msg = expiredMessageOverride || `${title} has started!`;
            const el = document.createElement('div');
            el.className = "countdown-expired-message";
            el.innerHTML = `<p>${msg}</p>`;
            section.appendChild(el);

            return;
        }

        // Years / Months / Days calculation
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
            const daysInPrev = new Date(temp.getFullYear(), temp.getMonth() + 1, 0).getDate();
            days += daysInPrev;
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

        // max values for percentage
        const yearsMax = Math.max(1, targetDate.getFullYear() - now.getFullYear());
        const monthsMax = 12;
        const daysMax = new Date(temp.getFullYear(), temp.getMonth() + 1, 0).getDate();
        const hoursMax = 24;
        const minutesMax = 60;
        const secondsMax = 60;

        // apply --percent
        yearsCircle.style.setProperty("--percent", clamp((years / yearsMax) * 100));
        monthsCircle.style.setProperty("--percent", clamp((months / monthsMax) * 100));
        daysCircle.style.setProperty("--percent", clamp((days / daysMax) * 100));
        hoursCircle.style.setProperty("--percent", clamp((hours / hoursMax) * 100));
        minutesCircle.style.setProperty("--percent", clamp((minutes / minutesMax) * 100));
        secondsCircle.style.setProperty("--percent", clamp((seconds / secondsMax) * 100));
    }

    if (!targetDate) {
        container.innerHTML =
            `<p class="countdown-expired-message">${expiredMessageOverride || `${title} date has not been set.`}</p>`;
        clearInterval(statusInterval);
        return;
    }

    const loop = setInterval(updateCountdown, 1000);
    updateCountdown();
}

// --- MASTER INITIALIZATION FUNCTION ---
async function initializeHomepageContent() {
    console.log("Initializing homepage content (v_with_countdown_and_biz_refresh)...");
    const mainContentWrapper = document.getElementById('main-content-wrapper');
    const maintenanceOverlay = document.getElementById('maintenanceLoadingOverlay');
    const countdownSection = document.querySelector('.countdown-section'); // For the main event countdown
    const usefulLinksSection = document.querySelector('.useful-links-section');
    const bodyElement = document.body;
    const tiktokHeaderContainer = document.getElementById('tiktok-shoutouts');
    const tiktokGridContainer = document.querySelector('#tiktok-shoutouts ~ .creator-grid');
    const tiktokUnavailableMessage = document.querySelector('#tiktok-shoutouts ~ .creator-grid ~ .unavailable-message');
    
    // Ensure Firebase and necessary Firestore document references are initialized globally before this function runs
    if (!firebaseAppInitialized || !db || !profileDocRef) {
        console.error("Firebase not ready or key Firestore document references (e.g., profileDocRef) are missing. Site cannot load settings properly.");
        if (mainContentWrapper) mainContentWrapper.innerHTML = "<p class='error' style='text-align:center;padding:20px;'>Critical error: Could not initialize site settings.</p>";
        return;
    }

    let siteSettings = {};
    let maintenanceEnabled = false;
    let maintenanceTitle = "Site Under Maintenance";
    let maintenanceMessage = "We are currently performing scheduled maintenance. Please check back later for updates.";
    let hideTikTokSection = false;
    let countdownTargetDate = null; // Will hold Firestore Timestamp or null
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
        console.log("Settings fetched:", { maintenanceEnabled, hideTikTokSection, countdownSet: !!countdownTargetDate });
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
        } else {
            console.error("Maintenance overlay element not found!");
        }
        return; // Stop further content loading
    } else {
        // Maintenance mode OFF
        console.log("Maintenance mode OFF.");
        if (mainContentWrapper) mainContentWrapper.style.display = '';
        if (maintenanceOverlay) maintenanceOverlay.style.display = 'none';
        bodyElement.classList.remove('maintenance-active');

        const savedOrder = JSON.parse(localStorage.getItem('sectionOrder'));
        const rearrangeableContainer = document.getElementById('rearrangeable-container');

        if (savedOrder && rearrangeableContainer) {
            console.log("Applying saved section order:", savedOrder);
            savedOrder.forEach(sectionId => {
                const section = document.querySelector(`[data-section-id="${sectionId}"]`);
                if (section) {
                    rearrangeableContainer.appendChild(section);
                } else {
                    console.warn(`Could not find section with data-section-id: ${sectionId} to reorder.`);
                }
            });
        }
        
        if (countdownTargetDate && typeof startEventCountdown === 'function') {
            if (countdownSection) {
                countdownSection.style.display = 'block'; 
            } else {
                console.warn("HTML element for '.countdown-section' not found.");
            }
            startEventCountdown(countdownTargetDate, countdownTitle, countdownExpiredMessage);
        } else {
            if (countdownSection) {
                countdownSection.style.display = 'none'; 
            }
            if (!countdownTargetDate) console.log("No valid countdown target date set from Firestore. Main event countdown section hidden.");
            if (typeof startEventCountdown !== 'function') console.warn("startEventCountdown function is not defined. Main event countdown will not run.");
        }

        const oldMaintenanceMessageElement = document.getElementById('maintenanceModeMessage');
        if (oldMaintenanceMessageElement) oldMaintenanceMessageElement.style.display = 'none';
        if (usefulLinksSection) {
            usefulLinksSection.style.display = 'block';
        }

        let isTikTokVisible = false;
        if (!tiktokHeaderContainer || !tiktokGridContainer) {
            console.warn("Could not find TikTok header or grid containers for visibility check.");
            if (tiktokUnavailableMessage) tiktokUnavailableMessage.style.display = 'none';
        } else {
            if (hideTikTokSection) {
                console.log("Hiding TikTok section as per settings.");
                tiktokHeaderContainer.style.display = 'none';
                tiktokGridContainer.style.display = 'none';
                if (tiktokUnavailableMessage) {
                    tiktokUnavailableMessage.innerHTML = '<p>TikTok shoutouts are currently hidden by the site administrator.</p>';
                    tiktokUnavailableMessage.style.display = 'block';
                }
                isTikTokVisible = false;
            } else {
                console.log("Showing TikTok section.");
                tiktokHeaderContainer.style.display = ''; 
                tiktokGridContainer.style.display = ''; 
                if (tiktokUnavailableMessage) tiktokUnavailableMessage.style.display = 'none';
                isTikTokVisible = true;
            }
        }

        console.log("Initiating loading of other content sections...");

        if (firebaseAppInitialized && typeof displayBusinessInfo === 'function' && db && businessDocRef) {
            await displayBusinessInfo(); 
            if (window.businessInfoRefreshInterval) { 
                clearInterval(window.businessInfoRefreshInterval);
            }
            window.businessInfoRefreshInterval = setInterval(async () => {
                if (document.hidden) return;
                await displayBusinessInfo();
            }, 60000); 
            console.log("Business info display and periodic refresh initiated.");
        } else {
            console.error("Business info cannot be loaded/refreshed. Checks: firebaseAppInitialized, displayBusinessInfo function, db, businessDocRef.");
            const biContainer = document.getElementById('business-status-display');
            const statusMainTextElLocal = biContainer ? biContainer.querySelector('.status-main-text') : null;
            if(statusMainTextElLocal) {
                 statusMainTextElLocal.textContent = "Info Unavailable";
                 statusMainTextElLocal.className = 'status-main-text status-unavailable';
            } else if (biContainer) {
                biContainer.innerHTML = "<span class='status-unavailable'>Business info could not be loaded.</span>";
            }
        }

        const loadPromises = [
            (typeof displayProfileData === 'function' ? displayProfileData(siteSettings) : Promise.resolve(console.warn("displayProfileData function not defined"))),
            (typeof displayPresidentData === 'function' ? displayPresidentData() : Promise.resolve(console.warn("displayPresidentData function not defined"))),
            (typeof loadShoutoutPlatformData === 'function' ? loadShoutoutPlatformData('instagram', document.getElementById('instagram-last-updated-timestamp')) : Promise.resolve(console.warn("loadShoutoutPlatformData for Instagram not defined"))),
            (typeof loadShoutoutPlatformData === 'function' ? loadShoutoutPlatformData('youtube', document.getElementById('youtube-last-updated-timestamp')) : Promise.resolve(console.warn("loadShoutoutPlatformData for YouTube not defined"))),
            (typeof loadAndDisplayUsefulLinks === 'function' ? loadAndDisplayUsefulLinks() : Promise.resolve(console.warn("loadAndDisplayUsefulLinks function not defined"))),
            (typeof loadAndDisplaySocialLinks === 'function' ? loadAndDisplaySocialLinks() : Promise.resolve(console.warn("loadAndDisplaySocialLinks function not defined"))),
            (typeof loadAndDisplayDisabilities === 'function' ? loadAndDisplayDisabilities() : Promise.resolve(console.warn("loadAndDisplayDisabilities function not defined"))),
            (typeof loadAndDisplayTechItems === 'function' ? loadAndDisplayTechItems() : Promise.resolve(console.warn("loadAndDisplayTechItems function not defined"))),
            (typeof loadAndDisplayFaqs === 'function' ? loadAndDisplayFaqs() : Promise.resolve(console.warn("loadAndDisplayFaqs function not defined")))
        ];

        if (isTikTokVisible && typeof loadShoutoutPlatformData === 'function') {
            loadPromises.push(loadShoutoutPlatformData('tiktok', document.getElementById('tiktok-last-updated-timestamp')));
        } else if (isTikTokVisible) {
            console.warn("TikTok section was intended to be visible but loadShoutoutPlatformData is not defined.");
        }

        const results = await Promise.allSettled(loadPromises);
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`Error loading a content section (promise index ${index}):`, result.reason);
            }
        });

        // --- NEW: Set up the search functionality AFTER all data has been loaded ---
        setupCreatorSearch();
        setupCreatorSorting();
        
        console.log("All other dynamic content loading initiated/completed.");
    }
} // --- End of initializeHomepageContent function ---

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
