    // admin.js (Version includes Preview Prep + Previous Features + Social Links)
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-storage.js";

const MANUAL_DOC = doc(db, "manualStatus", "site");

const $ = (id) => document.getElementById(id);

function showFeedback(msg, ok = true) {
  const el = $("manual-status-feedback");
  if (!el) return;
  el.textContent = msg;
  el.style.color = ok ? "" : "#ff6b6b";
  setTimeout(() => { if (el.textContent === msg) el.textContent = ""; }, 4000);
}

async function loadManualStatusToForm() {
  try {
    const snap = await getDoc(MANUAL_DOC);
    if (!snap.exists()) {
      // defaults
      $("manual-status-text").value = "";
      $("manual-status-icon").value = "manual";
      $("manual-status-duration").value = 15;
      $("manual-status-enabled").checked = false;
      return;
    }
    const data = snap.data();
    $("manual-status-text").value = data.text || "";
    $("manual-status-icon").value = data.icon || "manual";
    // compute remaining minutes if expiresAt exists
    if (data.expiresAt && typeof data.expiresAt === "number") {
      const mins = Math.max(0, Math.ceil((data.expiresAt - Date.now()) / 60000));
      $("manual-status-duration").value = mins;
    } else {
      $("manual-status-duration").value = data.persistent ? 0 : 15;
    }
    $("manual-status-enabled").checked = !!data.enabled;
  } catch (err) {
    console.error("Load manual status error:", err);
    showFeedback("Failed to load manual status", false);
  }
}

async function saveManualStatus(e) {
  e?.preventDefault();
  try {
    const text = $("manual-status-text").value.trim();
    const icon = $("manual-status-icon").value || "manual";
    const duration = Number($("manual-status-duration").value || 0);
    const enabled = !!$("manual-status-enabled").checked;

    const payload = {
      text: text || "",
      icon,
      enabled,
      updated_at: Date.now(),
      persistent: duration === 0,
    };

    if (duration > 0) {
      payload.expiresAt = Date.now() + Math.max(0, duration) * 60_000;
    } else {
      payload.expiresAt = null;
    }

    await setDoc(MANUAL_DOC, payload, { merge: true });
    showFeedback("Manual status saved");
  } catch (err) {
    console.error("Save manual status error:", err);
    showFeedback("Failed to save manual status", false);
  }
}

async function clearManualStatus() {
  try {
    // Disable manual override and clear text
    await setDoc(MANUAL_DOC, {
      text: "",
      icon: "manual",
      enabled: false,
      updated_at: Date.now(),
      expiresAt: null,
      persistent: false
    }, { merge: true });
    await loadManualStatusToForm();
    showFeedback("Manual status cleared");
  } catch (err) {
    console.error("Clear manual status error:", err);
    showFeedback("Failed to clear manual status", false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Form handlers
  const form = $("manual-status-form");
  form?.addEventListener("submit", saveManualStatus);

  $("clear-manual-status-btn")?.addEventListener("click", async () => {
    if (!confirm("Clear manual status? This will disable the manual override.")) return;
    await clearManualStatus();
  });

  // Prefill the form from Firestore
  loadManualStatusToForm();

  // Optional: realtime UI reflection if manual doc updated elsewhere
  (async () => {
    try {
      // dynamic import to avoid initial bundle dependency if not needed:
      const { onSnapshot } = await import("https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js");
      onSnapshot(MANUAL_DOC, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        // If another admin updates the manual status, reflect in the UI
        $("manual-status-text").value = data.text || "";
        $("manual-status-icon").value = data.icon || "manual";
        $("manual-status-enabled").checked = !!data.enabled;
      });
    } catch (e) {
      // not fatal — form still works
      console.warn("Realtime watch for manual status not enabled:", e);
    }
  })();
});

// Load existing Project Goal Data
async function loadGoalTracker() {
  const ref = doc(db, "siteSettings", "goalTracker");
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();

    document.getElementById("goal-title").value = data.goalTitle ?? "";
    document.getElementById("goal-total").value = data.goalTotal ?? 0;
    document.getElementById("goal-raised").value = data.goalRaised ?? 0;
    document.getElementById("goal-remaining").value = data.goalRemaining ?? 0;
  }
}

loadGoalTracker();

const goalTitleInput = document.getElementById("goal-title");
const goalTotalInput = document.getElementById("goal-total");
const goalRaisedInput = document.getElementById("goal-raised");
const goalRemainingInput = document.getElementById("goal-remaining");

function updateRemaining() {
  const total = Number(goalTotalInput.value) || 0;
  const raised = Number(goalRaisedInput.value) || 0;
  goalRemainingInput.value = Math.max(total - raised, 0);
}

goalTotalInput.addEventListener("input", updateRemaining);
goalRaisedInput.addEventListener("input", updateRemaining);


document.getElementById("goal-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = goalTitleInput.value.trim();
  const total = Number(goalTotalInput.value);
  const raised = Number(goalRaisedInput.value);
  const remaining = Math.max(total - raised, 0);

  try {
    // Save to /goals collection with ownerId
    await setDoc(doc(db, "goals", "goalTracker"), {
      goalTitle: title,
      goalTotal: total,
      goalRaised: raised,
      goalRemaining: remaining,
      ownerId: auth.currentUser.uid // ⚡ Required for Firestore rule
    });

    const msg = document.getElementById("goal-status-message");
    msg.textContent = "Goal Tracker Saved!";
    msg.classList.add("success");
  } catch (err) {
    console.error(err); // Log Firestore error
    const msg = document.getElementById("goal-status-message");
    msg.textContent = "Error saving goal tracker.";
    msg.classList.add("error");
  }
});


document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("live-status-input");
  const updateBtn = document.getElementById("update-live-status-btn");
  const clearBtn = document.getElementById("clear-live-status-btn");
  const resultMsg = document.getElementById("live-status-result");

  updateBtn?.addEventListener("click", async () => {
    const message = input.value.trim();
    if (!message) {
      resultMsg.textContent = "Please enter a status first.";
      return;
    }

    try {
      await setDoc(doc(db, "live_status", "current"), { message });
      resultMsg.textContent = "✅ Live status updated successfully!";
      input.value = "";
    } catch (err) {
      console.error("Error updating live status:", err);
      resultMsg.textContent = "❌ Failed to update live status.";
    }
  });

  clearBtn?.addEventListener("click", async () => {
    try {
      await deleteDoc(doc(db, "live_status", "current"));
      resultMsg.textContent = "🧹 Live status cleared.";
    } catch (err) {
      console.error("Error clearing live status:", err);
      resultMsg.textContent = "❌ Failed to clear status.";
    }
  });
});

const storage = getStorage();

// *** Import Firebase services from your corrected init file ***
import { db, auth } from './firebase-init.js'; // Ensure path is correct

// Import Firebase functions (Includes 'where', 'query', 'orderBy', 'limit')
import {
    getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, setDoc, serverTimestamp, getDoc, query, orderBy, where, limit, Timestamp, deleteField, writeBatch // <<< MAKE SURE Timestamp IS HERE
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithCredential
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
// *** Global Variable for Client-Side Filtering ***
let allShoutouts = { tiktok: [], instagram: [], youtube: [] }; // Stores the full lists for filtering

let allUsefulLinks = [];
let allSocialLinks = [];
let allDisabilities = [];
let allTechItems = []; // For Tech section

document.addEventListener('DOMContentLoaded', () => { //
    // First, check if db and auth were successfully imported/initialized
    if (!db || !auth) { //
         console.error("Firestore (db) or Auth not initialized correctly. Check firebase-init.js and imports."); //
         alert("FATAL ERROR: Firebase services failed to load. Admin panel disabled."); //
         return; // Stop executing if Firebase isn't ready
    }
    console.log("Admin DOM Loaded. Setting up UI and CRUD functions."); //

    // --- Firestore Reference for Profile / Site Config ---
    const profileDocRef = doc(db, "site_config", "mainProfile"); //
    // Reference for Shoutout Metadata (used for timestamps)
    const shoutoutsMetaRef = doc(db, 'siteConfig', 'shoutoutsMetadata'); //
    // *** Firestore Reference for Useful Links ***
    const usefulLinksCollectionRef = collection(db, "useful_links"); // Collection name
    // --- Firestore Reference for Social Links ---
    // IMPORTANT: Assumes you have a Firestore collection named 'social_links'
    const socialLinksCollectionRef = collection(db, "social_links");
    // Reference for President Info
    const presidentDocRef = doc(db, "site_config", "currentPresident"); 
    // Reference for Blog Posts
    const postsCollectionRef = collection(db, "posts"); // Blog collection reference


    // Firestore Reference for Disabilities
    const disabilitiesCollectionRef = collection(db, "disabilities");

    // Firestore Reference for Tech
    const techItemsCollectionRef = collection(db, "tech_items"); // Tech collection ref

    // --- Inactivity Logout Variables ---
    let inactivityTimer; //
    let expirationTime; //
    let displayIntervalId; //
    const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
    const activityEvents = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll']; //

    let isAddingShoutout = false; // Flag to prevent double submissions

    // --- DOM Element References ---
    const loginSection = document.getElementById('login-section'); //
    const adminContent = document.getElementById('admin-content'); //
    const loginForm = document.getElementById('login-form'); //
    const logoutButton = document.getElementById('logout-button'); //
    const authStatus = document.getElementById('auth-status'); //
    const adminGreeting = document.getElementById('admin-greeting'); //
    const emailInput = document.getElementById('email'); //
    const passwordInput = document.getElementById('password'); //
    const adminStatusElement = document.getElementById('admin-status'); //
    const nextButton = document.getElementById('next-button'); //
    const emailGroup = document.getElementById('email-group'); //
    const passwordGroup = document.getElementById('password-group'); //
    const loginButton = document.getElementById('login-button'); //
    const timerDisplayElement = document.getElementById('inactivity-timer-display'); //

    // 1. Add these variable declarations at the top with your other declarations
    const legislationCollectionRef = collection(db, "legislation");
    const addLegislationForm = document.getElementById('add-legislation-form');
    const legislationListAdmin = document.getElementById('legislation-list-admin');
    const legislationCount = document.getElementById('legislation-count');

    // --- Add these with other DOM element references ---
    const countdownTitleInput = document.getElementById('countdown-title-input');
    const countdownDatetimeInput = document.getElementById('countdown-datetime-input');
    const saveCountdownSettingsButton = document.getElementById('save-countdown-settings-button'); // Make sure this is added too
    // ****** ADD THIS LINE FOR THE EXPIRED MESSAGE TEXTAREA ******
    const countdownExpiredMessageInput = document.getElementById('countdown-expired-message-input');
    // ****** END ADD LINE ******

    // --- Business Info Management Elements ---
    const businessInfoForm = document.getElementById('business-info-form');
    const contactEmailInput = document.getElementById('business-contact-email');
    // Timezone select is removed
    const regularHoursContainer = document.getElementById('regular-hours-container');
    const holidayHoursList = document.getElementById('holiday-hours-list');
    const temporaryHoursList = document.getElementById('temporary-hours-list');
    const addHolidayButton = document.getElementById('add-holiday-button');
    const addTemporaryButton = document.getElementById('add-temporary-button');
    const statusOverrideSelect = document.getElementById('business-status-override');
    const businessInfoStatusMessage = document.getElementById('business-info-status-message');

    // Profile Management Elements
    const profileForm = document.getElementById('profile-form'); //
    const profileUsernameInput = document.getElementById('profile-username'); //
    const profilePicUrlInput = document.getElementById('profile-pic-url'); //
    const profileBioInput = document.getElementById('profile-bio'); //
    const profileStatusInput = document.getElementById('profile-status'); //
    const profileStatusMessage = document.getElementById('profile-status-message'); //
    const adminPfpPreview = document.getElementById('admin-pfp-preview'); //

    // Disabilities Management Elements
    const addDisabilityForm = document.getElementById('add-disability-form');
    const disabilitiesListAdmin = document.getElementById('disabilities-list-admin');
    const disabilitiesCount = document.getElementById('disabilities-count'); // Span to show count
    const editDisabilityModal = document.getElementById('edit-disability-modal');
    const editDisabilityForm = document.getElementById('edit-disability-form');
    const cancelEditDisabilityButton = document.getElementById('cancel-edit-disability-button'); // Close X button
    const cancelEditDisabilityButtonSecondary = document.getElementById('cancel-edit-disability-button-secondary'); // Secondary Cancel Button
    const editDisabilityNameInput = document.getElementById('edit-disability-name');
    const editDisabilityUrlInput = document.getElementById('edit-disability-url');
    const editDisabilityOrderInput = document.getElementById('edit-disability-order');
    const editDisabilityStatusMessage = document.getElementById('edit-disability-status-message'); // Status inside edit modal
    
    // Site Settings Elements
    const maintenanceModeToggle = document.getElementById('maintenance-mode-toggle'); //
    const hideTikTokSectionToggle = document.getElementById('hide-tiktok-section-toggle'); //
    const settingsStatusMessage = document.getElementById('settings-status-message'); //

    // Shoutout Elements (Add Forms, Lists, Search)
    const addShoutoutTiktokForm = document.getElementById('add-shoutout-tiktok-form'); //
    const shoutoutsTiktokListAdmin = document.getElementById('shoutouts-tiktok-list-admin'); //
    const addShoutoutInstagramForm = document.getElementById('add-shoutout-instagram-form'); //
    const shoutoutsInstagramListAdmin = document.getElementById('shoutouts-instagram-list-admin'); //
    const addShoutoutYoutubeForm = document.getElementById('add-shoutout-youtube-form'); //
    const shoutoutsYoutubeListAdmin = document.getElementById('shoutouts-youtube-list-admin'); //
    const searchInputTiktok = document.getElementById('search-tiktok'); //
    const searchInputInstagram = document.getElementById('search-instagram'); //
    const searchInputYoutube = document.getElementById('search-youtube'); //

    // Shoutout Edit Modal Elements
    const editModal = document.getElementById('edit-shoutout-modal'); //
    const editForm = document.getElementById('edit-shoutout-form'); //
    const cancelEditButton = document.getElementById('cancel-edit-button'); //
    const editUsernameInput = document.getElementById('edit-username'); //
    const editNicknameInput = document.getElementById('edit-nickname'); //
    const editOrderInput = document.getElementById('edit-order'); //
    const editIsVerifiedInput = document.getElementById('edit-isVerified'); //
    const editBioInput = document.getElementById('edit-bio'); //
    const editProfilePicInput = document.getElementById('edit-profilePic'); //
    const editIsEnabledInput = document.getElementById('edit-isEnabled'); // Reference for per-shoutout enable/disable (if added later)
    const editFollowersInput = document.getElementById('edit-followers'); //
    const editSubscribersInput = document.getElementById('edit-subscribers'); //
    const editCoverPhotoInput = document.getElementById('edit-coverPhoto'); //
    const editPlatformSpecificDiv = document.getElementById('edit-platform-specific'); //

    // Shoutout Preview Area Elements
    const addTiktokPreview = document.getElementById('add-tiktok-preview'); //
    const addInstagramPreview = document.getElementById('add-instagram-preview'); //
    const addYoutubePreview = document.getElementById('add-youtube-preview'); //
    const editShoutoutPreview = document.getElementById('edit-shoutout-preview'); //

    // Tech Management Elements
    const addTechItemForm = document.getElementById('add-tech-item-form'); // Declared
    const techItemsListAdmin = document.getElementById('tech-items-list-admin');
    const techItemsCount = document.getElementById('tech-items-count');
    const searchTechItemsInput = document.getElementById('search-tech-items');
    const editTechItemModal = document.getElementById('edit-tech-item-modal');
    const editTechItemForm = document.getElementById('edit-tech-item-form');
    const cancelEditTechButton = document.getElementById('cancel-edit-tech-button');
    const cancelEditTechButtonSecondary = document.getElementById('cancel-edit-tech-button-secondary');
    const editTechStatusMessage = document.getElementById('edit-tech-status-message');
    const addTechItemPreview = document.getElementById('add-tech-item-preview');
    const editTechItemPreview = document.getElementById('edit-tech-item-preview');

    // Useful Links Elements
    const addUsefulLinkForm = document.getElementById('add-useful-link-form'); //
    const usefulLinksListAdmin = document.getElementById('useful-links-list-admin'); //
    const usefulLinksCount = document.getElementById('useful-links-count'); // Span to show count
    const editUsefulLinkModal = document.getElementById('edit-useful-link-modal'); //
    const editUsefulLinkForm = document.getElementById('edit-useful-link-form'); //
    const cancelEditLinkButton = document.getElementById('cancel-edit-link-button'); // Close X button
    const cancelEditLinkButtonSecondary = document.getElementById('cancel-edit-link-button-secondary'); // Secondary Cancel Button
    const editLinkLabelInput = document.getElementById('edit-link-label'); //
    const editLinkUrlInput = document.getElementById('edit-link-url'); //
    const editLinkOrderInput = document.getElementById('edit-link-order'); //
    const editLinkStatusMessage = document.getElementById('edit-link-status-message'); // Status inside edit modal

    // --- DOM Element References (Ensure these are correct) ---
    const addSocialLinkForm = document.getElementById('add-social-link-form');
    const socialLinksListAdmin = document.getElementById('social-links-list-admin');
    const socialLinksCount = document.getElementById('social-links-count');
    const searchInputSocialLinks = document.getElementById('search-social-links');
    const editSocialLinkModal = document.getElementById('edit-social-link-modal');
    const editSocialLinkForm = document.getElementById('edit-social-link-form');
    const editSocialLinkLabelInput = document.getElementById('edit-social-link-label');
    const editSocialLinkUrlInput = document.getElementById('edit-social-link-url');
    const editSocialLinkOrderInput = document.getElementById('edit-social-link-order');
    const editSocialLinkIconClassInput = document.getElementById('edit-social-link-icon-class');
    const editSocialLinkStatusMessage = document.getElementById('edit-social-link-status-message');
    const cancelEditSocialLinkButton = document.getElementById('cancel-edit-social-link-button');
    const cancelEditSocialLinkButtonSecondary = document.getElementById('cancel-edit-social-link-button-secondary');

    // President Management Elements
    const presidentForm = document.getElementById('president-form');
    const presidentNameInput = document.getElementById('president-name');
    const presidentBornInput = document.getElementById('president-born');
    const presidentHeightInput = document.getElementById('president-height');
    const presidentPartyInput = document.getElementById('president-party');
    const presidentTermInput = document.getElementById('president-term');
    const presidentVpInput = document.getElementById('president-vp');
    const presidentImageUrlInput = document.getElementById('president-image-url');
    const presidentStatusMessage = document.getElementById('president-status-message');
    const presidentPreviewArea = document.getElementById('president-preview');
    
// --- Helper Functions ---
    // Displays status messages in the main admin status area
    function showAdminStatus(message, isError = false) { //
        if (!adminStatusElement) { console.warn("Admin status element not found"); return; } //
        adminStatusElement.textContent = message; //
        adminStatusElement.className = `status-message ${isError ? 'error' : 'success'}`; //
        // Clear message after 5 seconds
        setTimeout(() => { if (adminStatusElement) { adminStatusElement.textContent = ''; adminStatusElement.className = 'status-message'; } }, 5000); //
    }

    // Displays status messages in the profile section's status area
    function showProfileStatus(message, isError = false) { //
        if (!profileStatusMessage) { console.warn("Profile status message element not found"); showAdminStatus(message, isError); return; } // Fallback to admin status
        profileStatusMessage.textContent = message; //
        profileStatusMessage.className = `status-message ${isError ? 'error' : 'success'}`; //
         // Clear message after 5 seconds
        setTimeout(() => { if (profileStatusMessage) { profileStatusMessage.textContent = ''; profileStatusMessage.className = 'status-message'; } }, 5000); //
    }

    // Displays status messages in the site settings section's status area
    function showSettingsStatus(message, isError = false) { //
        if (!settingsStatusMessage) { console.warn("Settings status message element not found"); showAdminStatus(message, isError); return; } // Fallback to admin status
        settingsStatusMessage.textContent = message; //
        settingsStatusMessage.className = `status-message ${isError ? 'error' : 'success'}`; //
         // Clear message after a few seconds
        setTimeout(() => { if (settingsStatusMessage) { settingsStatusMessage.textContent = ''; settingsStatusMessage.style.display = 'none'; } }, 3000); //
        // Ensure success/error message is visible briefly
        settingsStatusMessage.style.display = 'block'; //
    }

    // *** Add this near other status message functions ***
    function showEditLinkStatus(message, isError = false) { //
        if (!editLinkStatusMessage) { console.warn("Edit link status message element not found"); return; } //
        editLinkStatusMessage.textContent = message; //
        editLinkStatusMessage.className = `status-message ${isError ? 'error' : 'success'}`; //
        // Clear message after 3 seconds
        setTimeout(() => { if (editLinkStatusMessage) { editLinkStatusMessage.textContent = ''; editLinkStatusMessage.className = 'status-message'; } }, 3000); //
    }

    // Add Shoutout Forms using the helper
    addSubmitListenerOnce(addShoutoutTiktokForm, () => handleAddShoutout('tiktok', addShoutoutTiktokForm));
    addSubmitListenerOnce(addShoutoutInstagramForm, () => handleAddShoutout('instagram', addShoutoutInstagramForm));
    addSubmitListenerOnce(addShoutoutYoutubeForm, () => handleAddShoutout('youtube', addShoutoutYoutubeForm));


    // --- REVISED + CORRECTED Filtering Function for Useful Links ---
function displayFilteredUsefulLinks() {
    const listContainer = usefulLinksListAdmin;
    const countElement = usefulLinksCount;
    const searchInput = document.getElementById('search-useful-links');

    if (!listContainer || !searchInput || typeof allUsefulLinks === 'undefined') {
        console.error("Useful Links Filter Error: Missing elements/data.");
        if(listContainer) listContainer.innerHTML = `<p class="error">Error displaying list.</p>`;
        return;
    }

    const searchTerm = searchInput.value.trim().toLowerCase();
    // console.log(`Filtering Useful Links: Term = "${searchTerm}"`); // Keep or remove logs

    let listToRender = [];

    if (!searchTerm) {
        // console.log("Useful Links: Search term is empty, using full list.");
        listToRender = allUsefulLinks;
    } else {
        // console.log("Useful Links: Search term found, filtering list...");
        listToRender = allUsefulLinks.filter(link => {
            const label = (link.label || '').toLowerCase();
            // --- Only check the label ---
            return label.includes(searchTerm);
        });
    }

    // console.log(`Rendering ${listToRender.length} useful links.`);

    listContainer.innerHTML = '';

    if (listToRender.length > 0) {
        listToRender.forEach(link => {
            if (typeof renderUsefulLinkAdminListItem === 'function' && typeof handleDeleteUsefulLink === 'function' && typeof openEditUsefulLinkModal === 'function') {
                 renderUsefulLinkAdminListItem(listContainer, link.id, link.label, link.url, link.order, handleDeleteUsefulLink, openEditUsefulLinkModal);
            } else {
                 console.error("Error: renderUsefulLinkAdminListItem or its handlers are missing!");
                 listContainer.innerHTML = '<p class="error">Rendering function error.</p>';
                 return;
            }
        });
    } else {
        if (searchTerm) {
            listContainer.innerHTML = `<p>No useful links found matching "${searchTerm}".</p>`;
        } else {
            listContainer.innerHTML = `<p>No useful links found.</p>`;
        }
    }
    if (countElement) { countElement.textContent = `(${listToRender.length})`; }
}

// --- REVISED + CORRECTED Filtering Function for Disabilities ---
function displayFilteredDisabilities() {
    const listContainer = disabilitiesListAdmin;
    const countElement = disabilitiesCount;
    const searchInput = document.getElementById('search-disabilities');

    if (!listContainer || !searchInput || typeof allDisabilities === 'undefined') {
        console.error("Disabilities Filter Error: Missing elements/data.");
         if(listContainer) listContainer.innerHTML = `<p class="error">Error displaying list.</p>`;
        return;
    }

    const searchTerm = searchInput.value.trim().toLowerCase();
    // console.log(`Filtering Disabilities: Term = "${searchTerm}"`); // Keep or remove logs

    let listToRender = [];

    if (!searchTerm) {
        // console.log("Disabilities: Search term is empty, using full list.");
        listToRender = allDisabilities;
    } else {
        // console.log("Disabilities: Search term found, filtering list...");
        listToRender = allDisabilities.filter(item => {
            const name = (item.name || '').toLowerCase(); // Use 'name' field
             // --- Only check the name ---
            return name.includes(searchTerm);
        });
    }

    // console.log(`Rendering ${listToRender.length} disabilities.`);

    listContainer.innerHTML = '';

    if (listToRender.length > 0) {
        listToRender.forEach(item => {
            if (typeof renderDisabilityAdminListItem === 'function' && typeof handleDeleteDisability === 'function' && typeof openEditDisabilityModal === 'function') {
                renderDisabilityAdminListItem(listContainer, item.id, item.name, item.url, item.order, handleDeleteDisability, openEditDisabilityModal);
            } else {
                 console.error("Error: renderDisabilityAdminListItem or its handlers are missing!");
                 listContainer.innerHTML = '<p class="error">Rendering function error.</p>';
                 return;
            }
        });
    } else {
         if (searchTerm) {
            listContainer.innerHTML = `<p>No disabilities found matching "${searchTerm}".</p>`;
         } else {
            listContainer.innerHTML = `<p>No disabilities found.</p>`;
         }
    }
    if (countElement) { countElement.textContent = `(${listToRender.length})`; }
}

    // Search Listener for Useful Links (NEW)
const searchInputUsefulLinks = document.getElementById('search-useful-links');
if (searchInputUsefulLinks) {
    searchInputUsefulLinks.addEventListener('input', displayFilteredUsefulLinks);
}

// Search Listener for Social Links (NEW)
if (searchInputSocialLinks) {
    searchInputSocialLinks.addEventListener('input', displayFilteredSocialLinks);
}

// Search Listener for Disabilities (NEW)
const searchInputDisabilities = document.getElementById('search-disabilities');
if (searchInputDisabilities) {
    searchInputDisabilities.addEventListener('input', displayFilteredDisabilities);
}

    // --- Add this near other status message functions ---
     function showEditSocialLinkStatus(message, isError = false) {
        const statusMsg = document.getElementById('edit-social-link-status-message'); // Re-select for safety
        if (!statusMsg) { console.warn("Edit social link status message element not found"); return; }
        statusMsg.textContent = message;
        statusMsg.className = `status-message ${isError ? 'error' : 'success'}`;
        // Clear message after 3 seconds unless it's an error
        if (!isError) {
             setTimeout(() => { if (statusMsg && statusMsg.textContent === message) { statusMsg.textContent = ''; statusMsg.className = 'status-message'; } }, 3000);
        }
    }

// --- Edit Modal Logic (UPDATED for Preview) ---
    // Opens the modal and populates it with data for the selected shoutout
    function openEditModal(docId, platform) { //
        if (!editModal || !editForm) { console.error("Edit modal/form not found."); showAdminStatus("UI Error: Cannot open edit form.", true); return; } //
        editForm.setAttribute('data-doc-id', docId); // Store ID and platform on the form
        editForm.setAttribute('data-platform', platform); //
        const docRef = doc(db, 'shoutouts', docId); // Reference to the specific shoutout doc

        getDoc(docRef).then(docSnap => { // Fetch the document
            if (docSnap.exists()) { //
                const data = docSnap.data(); //
                // Populate general fields
                if (editUsernameInput) editUsernameInput.value = data.username || ''; //
                if (editNicknameInput) editNicknameInput.value = data.nickname || ''; //
                if (editOrderInput) editOrderInput.value = data.order ?? ''; //
                if (editIsVerifiedInput) editIsVerifiedInput.checked = data.isVerified || false; //
                if (editBioInput) editBioInput.value = data.bio || ''; //
                if (editProfilePicInput) editProfilePicInput.value = data.profilePic || ''; //
                // Populate enable/disable toggle (for future feature)
                // if (editIsEnabledInput) editIsEnabledInput.checked = data.isEnabled ?? true;

                // Handle platform-specific fields visibility and values
                const followersDiv = editPlatformSpecificDiv?.querySelector('.edit-followers-group'); //
                const subscribersDiv = editPlatformSpecificDiv?.querySelector('.edit-subscribers-group'); //
                const coverPhotoDiv = editPlatformSpecificDiv?.querySelector('.edit-coverphoto-group'); //

                // Hide all platform-specific sections first
                if (followersDiv) followersDiv.style.display = 'none'; //
                if (subscribersDiv) subscribersDiv.style.display = 'none'; //
                if (coverPhotoDiv) coverPhotoDiv.style.display = 'none'; //

                // Show and populate the relevant section
                if (platform === 'youtube') { //
                    if (editSubscribersInput) editSubscribersInput.value = data.subscribers || 'N/A'; //
                    if (editCoverPhotoInput) editCoverPhotoInput.value = data.coverPhoto || ''; //
                    if (subscribersDiv) subscribersDiv.style.display = 'block'; //
                    if (coverPhotoDiv) coverPhotoDiv.style.display = 'block'; //
                } else { // TikTok or Instagram
                    if (editFollowersInput) editFollowersInput.value = data.followers || 'N/A'; //
                    if (followersDiv) followersDiv.style.display = 'block'; //
                }

                // Reset preview area and trigger initial update
                const previewArea = document.getElementById('edit-shoutout-preview'); //
                 if(previewArea) { //
                     previewArea.innerHTML = '<p><small>Generating preview...</small></p>'; // Placeholder
                     // *** ADDED: Trigger initial preview update ***
                     if (typeof updateShoutoutPreview === 'function') { //
                        updateShoutoutPreview('edit', platform); // Call the preview function
                     }
                     // *** END ADDED CODE ***
                 }

                editModal.style.display = 'block'; // Show the modal
            } else { //
                 showAdminStatus("Error: Could not load data for editing. Document not found.", true); //
            }
        }).catch(error => { //
             console.error("Error getting document for edit:", error); //
             showAdminStatus(`Error loading data: ${error.message}`, true); //
         });
    }

    // Closes the edit modal and resets the form
    function closeEditModal() { //
        if (editModal) editModal.style.display = 'none'; //
        if (editForm) editForm.reset(); // Reset form fields
        editForm?.removeAttribute('data-doc-id'); // Clear stored data
        editForm?.removeAttribute('data-platform'); //
         // Also clear the edit preview area
         if(editShoutoutPreview) { //
             editShoutoutPreview.innerHTML = '<p><small>Preview will appear here.</small></p>'; //
         }
    }

    // Event listeners for closing the modal (X button and clicking outside)
    if (cancelEditButton) cancelEditButton.addEventListener('click', closeEditModal); //
    window.addEventListener('click', (event) => { //
        // Close modal only if the direct click target is the modal backdrop itself
        if (event.target === editModal) { //
            closeEditModal(); //
        }
        // Add listener for clicking outside the useful link modal
        if (event.target === editUsefulLinkModal) { //
            closeEditUsefulLinkModal(); //
        }
        // Add listener for clicking outside the social link modal
        if (event.target === editSocialLinkModal) {
           closeEditSocialLinkModal();
        }
    });

    // Helper to safely add submit listener only once
    function addSubmitListenerOnce(formElement, handler) {
      if (!formElement) {
        console.warn("Attempted to add listener to non-existent form:", formElement);
        return;
      }
      // Use a unique property name to avoid potential conflicts
      const listenerAttachedFlag = '__busArmyDudeAdminSubmitListenerAttached__';

      // Get the existing handler reference if it was stored, otherwise create it
      let submitHandlerWrapper = formElement[listenerAttachedFlag + '_handler'];

      if (!submitHandlerWrapper) {
          submitHandlerWrapper = (e) => {
              e.preventDefault(); // Prevent default submission
              console.log(`DEBUG: Submit event triggered for ${formElement.id}`);
              handler();          // Call the original handler logic
          };
          // Store the handler reference on the element
          formElement[listenerAttachedFlag + '_handler'] = submitHandlerWrapper;
          console.log(`DEBUG: Created submit handler wrapper for ${formElement.id}`);
      }

      // --- Logic to add/skip ---
      if (!formElement[listenerAttachedFlag]) { // Check if the flag is NOT set
        formElement.addEventListener('submit', submitHandlerWrapper);
        formElement[listenerAttachedFlag] = true; // Mark listener as attached by setting the flag
        console.log(`DEBUG: Added submit listener to ${formElement.id}`);
      } else {
         console.log(`DEBUG: Submit listener flag already set for ${formElement.id}, skipping addEventListener.`);
      }
    }
/** Renders a single shoutout item in the admin list, including profile picture, follower/subscriber count and verified status */
function renderAdminListItem(container, docId, platform, itemData, deleteHandler, editHandler) {
    if (!container) { console.warn("List container not found for platform:", platform); return; }

    const itemDiv = document.createElement('div');
    itemDiv.className = 'list-item-admin';
    itemDiv.setAttribute('data-id', docId);

    const nickname = itemData.nickname || 'N/A';
    const username = itemData.username || 'N/A';
    const order = itemData.order ?? 'N/A';
    const isVerified = itemData.isVerified || false;
    const profilePicUrl = itemData.profilePic || 'images/default-profile.jpg'; // Assuming 'images/' folder
    let countText = '';

    if (platform === 'youtube') {
        const subscribers = itemData.subscribers || 'N/A';
        countText = `Subs: ${subscribers}`;
    } else if (platform === 'tiktok' || platform === 'instagram') {
        const followers = itemData.followers || 'N/A';
        countText = `Followers: ${followers}`;
    }

    let directLinkUrl = '#';
    let safeUsername = username || '';
    if (platform === 'tiktok' && safeUsername) {
        directLinkUrl = `https://tiktok.com/@${encodeURIComponent(safeUsername)}`;
    } else if (platform === 'instagram' && safeUsername) {
        directLinkUrl = `https://instagram.com/${encodeURIComponent(safeUsername)}`;
    } else if (platform === 'youtube' && safeUsername) {
        let youtubeHandle = safeUsername.startsWith('@') ? safeUsername : `@${safeUsername}`;
        directLinkUrl = `https://www.youtube.com/${encodeURIComponent(youtubeHandle)}`;
    }

    let verifiedIndicatorHTML = ''; // Initialize as empty
    if (isVerified) {
        let badgeSrc = '';
        const altText = 'Verified Badge';
        // Assuming your checkmark images are in the root or an accessible 'images' folder
        // Adjust path if they are in an 'images' subfolder, e.g., 'images/check.png'
        switch (platform) {
            case 'tiktok':
                badgeSrc = 'check.png'; // Or 'images/check.png' if in a subfolder
                break;
            case 'instagram':
                badgeSrc = 'instagramcheck.png'; // Or 'images/instagramcheck.png'
                break;
            case 'youtube':
                badgeSrc = 'youtubecheck.png'; // Or 'images/youtubecheck.png'
                break;
            default:
                // Optional: Fallback if platform is somehow unknown
                // verifiedIndicatorHTML = '<span class="verified-indicator" title="Verified">✓</span>';
                break;
        }
        if (badgeSrc) {
            verifiedIndicatorHTML = `<img src="${badgeSrc}" alt="${altText}" class="verified-badge-admin-list">`;
        }
    }

    // Build inner HTML - Uses the 'name-line' div from the previous fix
    itemDiv.innerHTML = `
        <div class="item-content">
            <div class="admin-list-item-pfp-container">
                <img src="${profilePicUrl}" alt="PFP for ${nickname}" class="admin-list-item-pfp" onerror="this.onerror=null; this.src='images/default-profile.jpg';">
            </div>
            <div class="item-details">
                <div class="name-line">
                    <strong>${nickname}</strong>
                    ${verifiedIndicatorHTML} 
                </div>
                <span>(@${username})</span>
                <small>Order: ${order} | ${countText}</small>
            </div>
        </div>
        <div class="item-actions">
            <a href="${directLinkUrl}" target="_blank" rel="noopener noreferrer" class="direct-link small-button" title="Visit Profile/Channel">
                <i class="fas fa-external-link-alt"></i> Visit
            </a>
            <button type="button" class="edit-button small-button">Edit</button>
            <button type="button" class="delete-button small-button">Delete</button>
        </div>`;

    const editButton = itemDiv.querySelector('.edit-button');
    if (editButton) editButton.addEventListener('click', () => editHandler(docId, platform));

    const deleteButton = itemDiv.querySelector('.delete-button');
    if (deleteButton) deleteButton.addEventListener('click', () => deleteHandler(docId, platform, itemDiv));

    container.appendChild(itemDiv);
}

// --- Copied Shoutout Card Rendering Functions (for Admin Preview) ---
// NOTE: Ensure image paths ('check.png', 'images/default-profile.jpg', etc.)
//       are accessible from the admin page's context.

function renderTikTokCard(account) {
    const profilePic = account.profilePic || 'images/default-profile.jpg';
    const username = account.username || 'N/A';
    const nickname = account.nickname || 'N/A';
    const bio = account.bio || '';
    const followers = account.followers || 'N/A';
    const isVerified = account.isVerified || false; // Read current status
    const profileUrl = username !== 'N/A' ? `https://tiktok.com/@${encodeURIComponent(username)}` : '#';
    // *** This ternary operator is key: returns '' if false ***
    const verifiedBadge = isVerified ? '<img src="check.png" alt="Verified" class="verified-badge">' : '';

    return `
        <div class="creator-card">
            <img src="${profilePic}" alt="@${username}" class="creator-pic" onerror="this.onerror=null; this.src='images/default-profile.jpg';">
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
    const isVerified = account.isVerified || false; // Read current status
    const profileUrl = username !== 'N/A' ? `https://instagram.com/${encodeURIComponent(username)}` : '#';
    // *** This ternary operator is key: returns '' if false ***
    const verifiedBadge = isVerified ? '<img src="instagramcheck.png" alt="Verified" class="instagram-verified-badge">' : '';

    return `
        <div class="instagram-creator-card">
            <img src="${profilePic}" alt="${nickname}" class="instagram-creator-pic" onerror="this.onerror=null; this.src='images/default-profile.jpg';">
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
    const username = account.username || 'N/A'; // YouTube handle
    const nickname = account.nickname || 'N/A'; // Channel name
    const bio = account.bio || '';
    const subscribers = account.subscribers || 'N/A';
    const coverPhoto = account.coverPhoto || null;
    const isVerified = account.isVerified || false; // Read current status
    let safeUsername = username;
    if (username !== 'N/A' && !username.startsWith('@')) {
        safeUsername = `@${username}`;
    }
    const channelUrl = username !== 'N/A' ? `https://www.youtube.com/${encodeURIComponent(safeUsername)}` : '#'; // Corrected URL
    // *** This ternary operator is key: returns '' if false ***
    const verifiedBadge = isVerified ? '<img src="youtubecheck.png" alt="Verified" class="youtube-verified-badge">' : '';

    return `
        <div class="youtube-creator-card">
            ${coverPhoto ? `<img src="${coverPhoto}" alt="${nickname} Cover Photo" class="youtube-cover-photo" onerror="this.style.display='none'">` : ''}
            <img src="${profilePic}" alt="${nickname}" class="youtube-creator-pic" onerror="this.onerror=null; this.src='images/default-profile.jpg';">
            <div class="youtube-creator-info">
                <div class="youtube-creator-header"><h3>${nickname} ${verifiedBadge}</h3></div>
                <div class="username-container"><p class="youtube-creator-username">${safeUsername}</p></div>
                <p class="youtube-creator-bio">${bio}</p>
                <p class="youtube-subscriber-count">${subscribers} Subscribers</p>
                <a href="${channelUrl}" target="_blank" rel="noopener noreferrer" class="youtube-visit-profile"> Visit Channel </a>
            </div>
        </div>`;
}
    
// *** NEW FUNCTION: Updates Shoutout Preview Area ***
    function updateShoutoutPreview(formType, platform) { //
        let formElement; //
        let previewElement; //
        let accountData = {}; // Object to hold current form values

        // 1. Determine which form and preview area to use
        if (formType === 'add') { //
            formElement = document.getElementById(`add-shoutout-${platform}-form`); //
            previewElement = document.getElementById(`add-${platform}-preview`); //
        } else if (formType === 'edit') { //
            formElement = editForm; // Use the existing reference to the edit modal form
            previewElement = editShoutoutPreview; // Use the existing reference
             // Ensure the platform matches the modal's current platform (safety check)
             if (editForm.getAttribute('data-platform') !== platform) { //
                 // console.warn(`Preview update skipped: Platform mismatch (form=${editForm.getAttribute('data-platform')}, requested=${platform})`);
                 // Clear preview if platform mismatches (e.g., modal still open from previous edit)
                 if(previewElement) previewElement.innerHTML = '<p><small>Preview unavailable.</small></p>'; //
                 return; //
             }
        } else { //
            console.error("Invalid formType provided to updateShoutoutPreview:", formType); //
            return; //
        }

        if (!formElement || !previewElement) { //
            console.error(`Preview Error: Could not find form or preview element for ${formType} ${platform}`); //
            return; //
        }

        // 2. Read current values from the determined form's inputs
        try { //
            accountData.username = formElement.querySelector(`[name="username"]`)?.value.trim() || ''; //
            accountData.nickname = formElement.querySelector(`[name="nickname"]`)?.value.trim() || ''; //
            accountData.bio = formElement.querySelector(`[name="bio"]`)?.value.trim() || ''; //
            accountData.profilePic = formElement.querySelector(`[name="profilePic"]`)?.value.trim() || ''; //
            accountData.isVerified = formElement.querySelector(`[name="isVerified"]`)?.checked || false; //
             accountData.order = parseInt(formElement.querySelector(`[name="order"]`)?.value.trim() || 0); // Needed for potential rendering logic, default 0

            // Platform-specific fields
            if (platform === 'youtube') { //
                accountData.subscribers = formElement.querySelector(`[name="subscribers"]`)?.value.trim() || 'N/A'; //
                accountData.coverPhoto = formElement.querySelector(`[name="coverPhoto"]`)?.value.trim() || null; //
            } else { // TikTok or Instagram
                accountData.followers = formElement.querySelector(`[name="followers"]`)?.value.trim() || 'N/A'; //
            }
        } catch(e) { //
             console.error("Error reading form values for preview:", e); //
             previewElement.innerHTML = '<p class="error"><small>Error reading form values.</small></p>'; //
             return; //
        }


        // 3. Select the correct rendering function
        let renderFunction; //
        switch (platform) { //
            case 'tiktok': //
                renderFunction = renderTikTokCard; //
                break; //
            case 'instagram': //
                renderFunction = renderInstagramCard; //
                break; //
            case 'youtube': //
                renderFunction = renderYouTubeCard; //
                break; //
            default: //
                console.error("Invalid platform for preview:", platform); //
                previewElement.innerHTML = '<p class="error"><small>Invalid platform.</small></p>'; //
                return; //
        }

        // 4. Call the rendering function and update the preview area
        if (typeof renderFunction === 'function') { //
            try { //
                const cardHTML = renderFunction(accountData); // Generate the card HTML
                previewElement.innerHTML = cardHTML; // Update the preview div
            } catch (e) { //
                 console.error(`Error rendering preview card for ${platform}:`, e); //
                 previewElement.innerHTML = '<p class="error"><small>Error rendering preview.</small></p>'; //
            }
        } else { //
             console.error(`Rendering function for ${platform} not found!`); //
             previewElement.innerHTML = '<p class="error"><small>Preview engine error.</small></p>'; //
        }
    }
    // *** END updateShoutoutPreview FUNCTION ***

    // Global Click Listener for Modals (Defined ONCE)
    if (!window.adminModalClickListenerAttached) {
        window.addEventListener('click', (event) => {
            // Re-select modals inside the handler for safety
            const editShoutoutModalElem = document.getElementById('edit-shoutout-modal');
            const editUsefulLinkModalElem = document.getElementById('edit-useful-link-modal');
            const editSocialLinkModalElem = document.getElementById('edit-social-link-modal');
            const editDisabilityModalElem = document.getElementById('edit-disability-modal');
            const editTechItemModalElem = document.getElementById('edit-tech-item-modal');

            // Check targets and call appropriate close functions *if they exist*
            if (event.target === editShoutoutModalElem && typeof closeEditModal === 'function') { closeEditModal(); }
            if (event.target === editUsefulLinkModalElem && typeof closeEditUsefulLinkModal === 'function') { closeEditUsefulLinkModal(); }
            if (event.target === editSocialLinkModalElem && typeof closeEditSocialLinkModal === 'function') { closeEditSocialLinkModal(); } // Check added
            if (event.target === editDisabilityModalElem && typeof closeEditDisabilityModal === 'function') { closeEditDisabilityModal(); }
            if (event.target === editTechItemModalElem && typeof closeEditTechItemModal === 'function') { closeEditTechItemModal(); }
        });
        window.adminModalClickListenerAttached = true;
        console.log("Global modal click listener attached.");
    }

 // --- Google Sign-In Handler ---
    async function handleGoogleSignIn(response) {
        console.log("Received response from Google Sign-In...");
        const authStatus = document.getElementById('auth-status');
        
        if (authStatus) {
            authStatus.textContent = 'Verifying with Google...';
            authStatus.className = 'status-message';
            authStatus.style.display = 'block';
        }

        // Get the ID token from the Google response
        const idToken = response.credential;
        // Create a Google Auth provider credential
        const credential = GoogleAuthProvider.credential(idToken);

        try {
            // Sign in to Firebase with the credential
            const result = await signInWithCredential(auth, credential);
            console.log("Successfully signed in with Google:", result.user.displayName);
            // The `onAuthStateChanged` listener will automatically handle showing the admin panel.
        } catch (error) {
            console.error("Firebase Google Sign-In Error:", error);
            if (authStatus) {
                authStatus.textContent = `Login Failed: ${error.message}`;
                authStatus.className = 'status-message error';
            }
        }
    }

// ======================================================
// ===== START: ALL BUSINESS INFO CODE FOR admin.js (v15 - Syntax Fixed & Double Add Fix + Logging) =====
// ======================================================

// --- Business Info Constant & Ref ---
const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']; // Declared once
const businessDocRef = doc(db, "site_config", "businessDetails");

// --- Business Info Helper Functions ---
function showBusinessInfoStatus(message, isError = false) {
    const el = document.getElementById('business-info-status-message'); if (!el) {console.warn("Business info status message element not found!"); return;} el.textContent = message; el.className = `status-message ${isError ? 'error' : 'success'}`; el.style.display='block'; setTimeout(() => { if (el && el.textContent === message) { el.textContent = ''; el.className = 'status-message'; el.style.display='none';} }, 5000);
}

function capitalizeFirstLetter(string) {
    if (!string) return ''; return string.charAt(0).toUpperCase() + string.slice(1);
}

// CORRECTED SYNTAX HERE
function formatTimeForAdminPreview(timeString) { // For display in preview list
    if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) return '';
    try {
        const [hour, minute] = timeString.split(':');
        const hourNum = parseInt(hour, 10);
        if (isNaN(hourNum)) return timeString;
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const hour12 = hourNum % 12 || 12;
        // Corrected return statement using template literal
        return `${hour12}:${minute} ${ampm}`;
    } catch (e) {
        console.error("Error formatting time:", timeString, e);
        return timeString;
    }
}

function timeStringToMinutesBI(timeStr) { // For status calculations
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return null;
    try { const [hours, minutes] = timeStr.split(':').map(Number); if (isNaN(hours) || isNaN(minutes)) return null; return hours * 60 + minutes; }
    catch (e) { console.error("Preview Error: converting time string to minutes:", timeStr, e); return null; }
}

function addListenerSafe(element, eventType, handler, flagSuffix = '') {
    if (!element) { return; }
    const listenerFlag = `__listener_${eventType}${flagSuffix}`;
    if (!element[listenerFlag]) {
        element.addEventListener(eventType, handler);
        element[listenerFlag] = true;
    }
}

// --- Business Info Form Population & Rendering ---
// CORRECTED SYNTAX HERE
function populateRegularHoursForm(hoursData = {}) {
    const container = document.getElementById('regular-hours-container');
    if (!container) { console.error("Regular hours container not found"); return; }
    container.innerHTML = '';
    daysOfWeek.forEach(day => {
        const dayData = hoursData[day] || { open: '', close: '', isClosed: true };
        const groupDiv = document.createElement('div');
        groupDiv.className = 'day-hours-group';
        // Corrected innerHTML using proper template literals
        groupDiv.innerHTML = `
            <label for="${day}-isClosed">${capitalizeFirstLetter(day)}</label>
            <div class="time-inputs">
                <label for="${day}-open" class="sr-only">Open Time:</label>
                <input type="time" id="${day}-open" name="${day}-open" value="${dayData.open || ''}" ${dayData.isClosed ? 'disabled' : ''}>
                <span> - </span>
                <label for="${day}-close" class="sr-only">Close Time:</label>
                <input type="time" id="${day}-close" name="${day}-close" value="${dayData.close || ''}" ${dayData.isClosed ? 'disabled' : ''}>
            </div>
            <div class="form-group checkbox-group">
                <input type="checkbox" id="${day}-isClosed" name="${day}-isClosed" ${dayData.isClosed ? 'checked' : ''} class="regular-hours-input">
                <label for="${day}-isClosed">Closed all day</label>
            </div>`;
        const isClosedCheckbox = groupDiv.querySelector(`#${day}-isClosed`);
        const openInput = groupDiv.querySelector(`#${day}-open`);
        const closeInput = groupDiv.querySelector(`#${day}-close`);
        addListenerSafe(isClosedCheckbox, 'change', (e) => { const isDisabled = e.target.checked; openInput.disabled = isDisabled; closeInput.disabled = isDisabled; if (isDisabled) { openInput.value = ''; closeInput.value = ''; } updateAdminPreview(); }, `reg_${day}_closed`);
        addListenerSafe(openInput, 'input', updateAdminPreview, `reg_${day}_open`);
        addListenerSafe(closeInput, 'input', updateAdminPreview, `reg_${day}_close`);
        container.appendChild(groupDiv);
    });
}

// CORRECTED SYNTAX HERE
function renderHolidayEntry(entry = {}, index) {
    const uniqueId = `holiday-${Date.now()}-${index}`;
    const entryDiv = document.createElement('div');
    entryDiv.className = 'hour-entry holiday-entry';
    entryDiv.setAttribute('data-id', uniqueId);
    // Corrected innerHTML using proper template literals
    entryDiv.innerHTML = `
        <button type="button" class="remove-hour-button" title="Remove Holiday/Specific Date">×</button>
        <div class="form-group">
            <label for="holiday-date-${uniqueId}">Date:</label>
            <input type="date" id="holiday-date-${uniqueId}" class="holiday-input" name="holiday-date-${uniqueId}" value="${entry.date || ''}" required>
        </div>
        <div class="form-group">
            <label for="holiday-label-${uniqueId}">Label (Optional):</label>
            <input type="text" id="holiday-label-${uniqueId}" class="holiday-input" name="holiday-label-${uniqueId}" value="${entry.label || ''}" placeholder="e.g., Christmas Day">
        </div>
        <div class="time-inputs">
            <label for="holiday-open-${uniqueId}" class="sr-only">Open Time:</label>
            <input type="time" id="holiday-open-${uniqueId}" class="holiday-input" name="holiday-open-${uniqueId}" value="${entry.open || ''}" ${entry.isClosed ? 'disabled' : ''}>
            <span> - </span>
            <label for="holiday-close-${uniqueId}" class="sr-only">Close Time:</label>
            <input type="time" id="holiday-close-${uniqueId}" class="holiday-input" name="holiday-close-${uniqueId}" value="${entry.close || ''}" ${entry.isClosed ? 'disabled' : ''}>
        </div>
        <div class="form-group checkbox-group">
            <input type="checkbox" id="holiday-isClosed-${uniqueId}" name="holiday-isClosed-${uniqueId}" class="holiday-input" ${entry.isClosed ? 'checked' : ''}>
            <label for="holiday-isClosed-${uniqueId}">Closed all day</label>
        </div>`;
    // Ensure querySelectors below use the correctly generated uniqueId
    addListenerSafe(entryDiv.querySelector('.remove-hour-button'), 'click', () => { entryDiv.remove(); /* Let observer handle preview update */ }, `rem_hol_${uniqueId}`);
    const isClosedCheckbox = entryDiv.querySelector(`#holiday-isClosed-${uniqueId}`); // Correct selector
    const openInput = entryDiv.querySelector(`#holiday-open-${uniqueId}`); // Correct selector
    const closeInput = entryDiv.querySelector(`#holiday-close-${uniqueId}`); // Correct selector
    addListenerSafe(isClosedCheckbox, 'change', (e) => { const isDisabled = e.target.checked; openInput.disabled = isDisabled; closeInput.disabled = isDisabled; if(isDisabled) { openInput.value = ''; closeInput.value = ''; } updateAdminPreview(); }, `hol_${uniqueId}_closed`);
    entryDiv.querySelectorAll('.holiday-input').forEach(input => addListenerSafe(input, 'input', updateAdminPreview, `hol_${uniqueId}_${input.name}`));
    return entryDiv;
}

// CORRECTED SYNTAX HERE
function renderTemporaryEntry(entry = {}, index) {
    const uniqueId = `temp-${Date.now()}-${index}`;
    const entryDiv = document.createElement('div');
    entryDiv.className = 'hour-entry temporary-entry';
    entryDiv.setAttribute('data-id', uniqueId);
    // Corrected innerHTML using proper template literals
    entryDiv.innerHTML = `
        <button type="button" class="remove-hour-button" title="Remove Temporary Period">×</button>
        <div class="form-group">
            <label for="temp-start-${uniqueId}">Start Date:</label>
            <input type="date" id="temp-start-${uniqueId}" class="temp-input" name="temp-start-${uniqueId}" value="${entry.startDate || ''}" required>
        </div>
        <div class="form-group">
            <label for="temp-end-${uniqueId}">End Date:</label>
            <input type="date" id="temp-end-${uniqueId}" class="temp-input" name="temp-end-${uniqueId}" value="${entry.endDate || ''}" required>
        </div>
        <div class="form-group">
            <label for="temp-label-${uniqueId}">Label (Optional):</label>
            <input type="text" id="temp-label-${uniqueId}" class="temp-input" name="temp-label-${uniqueId}" value="${entry.label || ''}" placeholder="e.g., Summer Event">
        </div>
        <div class="time-inputs">
            <label for="temp-open-${uniqueId}" class="sr-only">Open Time:</label>
            <input type="time" id="temp-open-${uniqueId}" class="temp-input" name="temp-open-${uniqueId}" value="${entry.open || ''}" ${entry.isClosed ? 'disabled' : ''}>
            <span> - </span>
            <label for="temp-close-${uniqueId}" class="sr-only">Close Time:</label>
            <input type="time" id="temp-close-${uniqueId}" class="temp-input" name="temp-close-${uniqueId}" value="${entry.close || ''}" ${entry.isClosed ? 'disabled' : ''}>
        </div>
        <div class="form-group checkbox-group">
            <input type="checkbox" id="temp-isClosed-${uniqueId}" name="temp-isClosed-${uniqueId}" class="temp-input" ${entry.isClosed ? 'checked' : ''}>
            <label for="temp-isClosed-${uniqueId}">Closed all day during this period</label>
        </div>`;
     // Ensure querySelectors below use the correctly generated uniqueId
    addListenerSafe(entryDiv.querySelector('.remove-hour-button'), 'click', () => { entryDiv.remove(); /* Let observer handle preview update */ }, `rem_tmp_${uniqueId}`);
    const isClosedCheckbox = entryDiv.querySelector(`#temp-isClosed-${uniqueId}`); // Correct selector
    const openInput = entryDiv.querySelector(`#temp-open-${uniqueId}`); // Correct selector
    const closeInput = entryDiv.querySelector(`#temp-close-${uniqueId}`); // Correct selector
    addListenerSafe(isClosedCheckbox, 'change', (e) => { const isDisabled = e.target.checked; openInput.disabled = isDisabled; closeInput.disabled = isDisabled; if(isDisabled) { openInput.value = ''; closeInput.value = ''; } updateAdminPreview(); }, `tmp_${uniqueId}_closed`);
    entryDiv.querySelectorAll('.temp-input').forEach(input => addListenerSafe(input, 'input', updateAdminPreview, `tmp_${uniqueId}_${input.name}`));
    return entryDiv;
}


// --- Load Business Info Data ---
async function loadBusinessInfoData() {
    const businessInfoForm = document.getElementById('business-info-form');
    const contactEmailInput = document.getElementById('business-contact-email');
    const statusOverrideSelect = document.getElementById('business-status-override');
    const holidayHoursList = document.getElementById('holiday-hours-list');
    const temporaryHoursList = document.getElementById('temporary-hours-list');

    if (!businessInfoForm) { console.log("Business info form not found."); return; }
    console.log("Attempting to load business info data...");

    try {
        const docSnap = await getDoc(businessDocRef);
        let data = {};
        if (docSnap.exists()) { data = docSnap.data(); } else { console.log("Business info document does not exist."); }

        if (contactEmailInput) contactEmailInput.value = data.contactEmail || '';
        if (statusOverrideSelect) statusOverrideSelect.value = data.statusOverride || 'auto';

        if (typeof populateRegularHoursForm === 'function') { populateRegularHoursForm(data.regularHours); } else { console.error("populateRegularHoursForm function missing!"); }
        // Wrap rendering in try...catch to pinpoint errors during load
        if (holidayHoursList && typeof renderHolidayEntry === 'function') {
             holidayHoursList.innerHTML = ''; // Clear first
             (data.holidayHours || []).forEach((entry, index) => {
                 try {
                     holidayHoursList.appendChild(renderHolidayEntry(entry, index));
                 } catch(renderError) {
                     // Log the specific error during rendering
                     console.error(`Error rendering holiday entry ${index} from loaded data:`, renderError, entry);
                     holidayHoursList.innerHTML += `<li class='error'>Error rendering loaded holiday entry ${index + 1}. Check console.</li>`;
                 }
             });
        } else if (!holidayHoursList) { console.error("holidayHoursList element missing!"); } else { console.error("renderHolidayEntry function missing!"); }

        if (temporaryHoursList && typeof renderTemporaryEntry === 'function') {
            temporaryHoursList.innerHTML = ''; // Clear first
             (data.temporaryHours || []).forEach((entry, index) => {
                 try {
                    temporaryHoursList.appendChild(renderTemporaryEntry(entry, index));
                 } catch(renderError) {
                     // Log the specific error during rendering
                     console.error(`Error rendering temporary entry ${index} from loaded data:`, renderError, entry);
                     temporaryHoursList.innerHTML += `<li class='error'>Error rendering loaded temporary entry ${index + 1}. Check console.</li>`;
                 }
             });
        } else if (!temporaryHoursList) { console.error("temporaryHoursList element missing!"); } else { console.error("renderTemporaryEntry function missing!"); }

        if (typeof updateAdminPreview === 'function') { updateAdminPreview(); console.log("Initial admin preview updated."); }
        else { console.error("updateAdminPreview function missing!"); }

    } catch (error) {
        console.error("Error loading business info:", error);
        showBusinessInfoStatus(`Error loading info: ${error.message || error}`, true);
        if (typeof populateRegularHoursForm === 'function') populateRegularHoursForm();
        if (holidayHoursList) holidayHoursList.innerHTML = '<p class="error">Could not load holiday hours.</p>';
        if (temporaryHoursList) temporaryHoursList.innerHTML = '<p class="error">Could not load temporary hours.</p>';
        if (typeof updateAdminPreview === 'function') updateAdminPreview();
    }
}


// --- Save Business Info Data ---
// CORRECTED SYNTAX IN CONSOLE WARNING
async function saveBusinessInfoData(event) {
    event.preventDefault();
    const businessInfoForm = document.getElementById('business-info-form');
    const contactEmailInput = document.getElementById('business-contact-email');
    const statusOverrideSelect = document.getElementById('business-status-override');

    if (!auth || !auth.currentUser) { showBusinessInfoStatus("Not logged in.", true); return; } if (!businessInfoForm) { return; }
    showBusinessInfoStatus("Saving...");

    const newData = { contactEmail: contactEmailInput?.value.trim() || null, statusOverride: statusOverrideSelect?.value || "auto", regularHours: {}, holidayHours: [], temporaryHours: [], lastUpdated: serverTimestamp() };
    let formIsValid = true;

    daysOfWeek.forEach(day => { const isClosed = document.getElementById(`${day}-isClosed`)?.checked || false; const openTime = document.getElementById(`${day}-open`)?.value || null; const closeTime = document.getElementById(`${day}-close`)?.value || null; newData.regularHours[day] = { open: isClosed ? null : openTime, close: isClosed ? null : closeTime, isClosed: isClosed }; if (!isClosed && (!openTime || !closeTime)) { console.warn(`Missing open/close time for ${day}`); } });
    document.querySelectorAll('#holiday-hours-list .holiday-entry').forEach(entryDiv => { const id = entryDiv.getAttribute('data-id'); if (!id) return; const isClosed = entryDiv.querySelector(`#holiday-isClosed-${id}`)?.checked || false; const date = entryDiv.querySelector(`#holiday-date-${id}`)?.value || null; const openTime = entryDiv.querySelector(`#holiday-open-${id}`)?.value || null; const closeTime = entryDiv.querySelector(`#holiday-close-${id}`)?.value || null; if (date) { const entryData = { date, label: entryDiv.querySelector(`#holiday-label-${id}`)?.value.trim() || null, open: isClosed ? null : openTime, close: isClosed ? null : closeTime, isClosed }; if (!isClosed && (!openTime || !closeTime)) { console.warn(`Missing holiday time ${date}`); } newData.holidayHours.push(entryData); } else { formIsValid = false; } });
    document.querySelectorAll('#temporary-hours-list .temporary-entry').forEach(entryDiv => { const id = entryDiv.getAttribute('data-id'); if (!id) return; const isClosed = entryDiv.querySelector(`#temp-isClosed-${id}`)?.checked || false; const startDate = entryDiv.querySelector(`#temp-start-${id}`)?.value || null; const endDate = entryDiv.querySelector(`#temp-end-${id}`)?.value || null; const openTime = entryDiv.querySelector(`#temp-open-${id}`)?.value || null; const closeTime = entryDiv.querySelector(`#temp-close-${id}`)?.value || null; if (startDate && endDate) { if (endDate < startDate) { showBusinessInfoStatus(`Error: Temp End Date < Start Date.`, true); formIsValid = false; return; } const entryData = { startDate, endDate, label: entryDiv.querySelector(`#temp-label-${id}`)?.value.trim() || null, open: isClosed ? null : openTime, close: isClosed ? null : closeTime, isClosed }; if (!isClosed && (!openTime || !closeTime)) { console.warn(`Missing temp time ${startDate}-${endDate}`); } newData.temporaryHours.push(entryData); } else { formIsValid = false; } }); // Corrected console warning syntax

    if (!formIsValid) { showBusinessInfoStatus("Save failed. Check required dates.", true); return; }
    newData.holidayHours.sort((a, b) => (a.date > b.date ? 1 : -1)); newData.temporaryHours.sort((a, b) => (a.startDate > b.startDate ? 1 : -1));

    try { await setDoc(businessDocRef, newData); console.log("Business info saved."); showBusinessInfoStatus("Business info updated!", false); }
    catch (error) { console.error("Error saving business info:", error); showBusinessInfoStatus(`Error saving: ${error.message}`, true); }
}


// --- Admin Preview Update Function (v13 - Syntax Fixed & Refined Temp Logic) ---
// CORRECTED SYNTAX HERE
function updateAdminPreview() {
    console.log("%cUpdating admin preview (v13)...", "color: blue; font-weight: bold;");

    const adminPreviewStatus = document.getElementById('admin-preview-status');
    const adminPreviewHours = document.getElementById('admin-preview-hours');
    const adminPreviewContact = document.getElementById('admin-preview-contact');
    const businessInfoForm = document.getElementById('business-info-form');
    const statusOverrideSelect = document.getElementById('business-status-override');
    const contactEmailInput = document.getElementById('business-contact-email');

    if (!businessInfoForm || !adminPreviewStatus || !adminPreviewHours || !adminPreviewContact || !statusOverrideSelect || !contactEmailInput) {
        console.error("Admin preview update failed: Missing HTML elements!");
        if(adminPreviewStatus) adminPreviewStatus.innerHTML = `<span class="status-unavailable">Preview Error: UI Missing</span>`;
        return;
    }

    // 1. Read Current Form Values
    const currentFormData = { contactEmail: contactEmailInput.value.trim() || null, statusOverride: statusOverrideSelect.value || "auto", regularHours: {}, holidayHours: [], temporaryHours: [] };
    daysOfWeek.forEach(day => { const el = document.getElementById(`${day}-isClosed`); if (!el) return; const isClosed = el.checked; const openVal = document.getElementById(`${day}-open`)?.value; const closeVal = document.getElementById(`${day}-close`)?.value; currentFormData.regularHours[day] = { open: isClosed ? null : (openVal || null), close: isClosed ? null : (closeVal || null), isClosed: isClosed }; });
    document.querySelectorAll('#holiday-hours-list .holiday-entry').forEach(entryDiv => { const id = entryDiv.getAttribute('data-id'); if (!id) return; const isClosed = entryDiv.querySelector(`#holiday-isClosed-${id}`)?.checked || false; const date = entryDiv.querySelector(`#holiday-date-${id}`)?.value || null; if (date) { currentFormData.holidayHours.push({ date, label: entryDiv.querySelector(`#holiday-label-${id}`)?.value.trim() || null, open: isClosed ? null : (entryDiv.querySelector(`#holiday-open-${id}`)?.value || null), close: isClosed ? null : (entryDiv.querySelector(`#holiday-close-${id}`)?.value || null), isClosed }); } });
    document.querySelectorAll('#temporary-hours-list .temporary-entry').forEach(entryDiv => { const id = entryDiv.getAttribute('data-id'); if (!id) return; const isClosed = entryDiv.querySelector(`#temp-isClosed-${id}`)?.checked || false; const startDate = entryDiv.querySelector(`#temp-start-${id}`)?.value || null; const endDate = entryDiv.querySelector(`#temp-end-${id}`)?.value || null; if (startDate && endDate) { if (endDate < startDate) { /* skip invalid */ return; } currentFormData.temporaryHours.push({ startDate, endDate, label: entryDiv.querySelector(`#temp-label-${id}`)?.value.trim() || null, open: isClosed ? null : (entryDiv.querySelector(`#temp-open-${id}`)?.value || null), close: isClosed ? null : (entryDiv.querySelector(`#temp-close-${id}`)?.value || null), isClosed }); } });
    currentFormData.holidayHours.sort((a, b) => (a.date > b.date ? 1 : -1)); currentFormData.temporaryHours.sort((a, b) => (a.startDate > b.startDate ? 1 : -1));

    // 2. Calculate Preview Status
    let currentStatus = 'Closed';
    let statusReason = 'Default';
    const previewNow = new Date();
    const previewDayName = daysOfWeek[(previewNow.getDay() + 6) % 7];
    const previewDateStr = previewNow.toLocaleDateString('en-CA');
    const previewCurrentMinutes = previewNow.getHours() * 60 + previewNow.getMinutes();
    // Corrected console log syntax
    console.log(`Admin Preview Time Check: Date=${previewDateStr}, Day=${previewDayName}, Mins=${previewCurrentMinutes}`);
    let activeHoursRule = null;
    let ruleApplied = false;

    // Status Calculation Logic (Order: Override > Holiday > Temporary > Regular)
    if (currentFormData.statusOverride !== 'auto') {
        currentStatus = currentFormData.statusOverride === 'open' ? 'Open' : (currentFormData.statusOverride === 'closed' ? 'Closed' : 'Temporarily Unavailable');
        statusReason = 'Manual Override';
        activeHoursRule = { reason: statusReason }; ruleApplied = true;
        console.log("Admin Preview Status determined by: Override");
    }

    if (!ruleApplied) {
        const todayHoliday = currentFormData.holidayHours.find(h => h.date === previewDateStr);
        if (todayHoliday) {
            statusReason = `Holiday (${todayHoliday.label || todayHoliday.date})`;
            activeHoursRule = { ...todayHoliday, reason: statusReason }; ruleApplied = true;
            if (todayHoliday.isClosed || !todayHoliday.open || !todayHoliday.close) { currentStatus = 'Closed'; }
            else { const openMins = timeStringToMinutesBI(todayHoliday.open); const closeMins = timeStringToMinutesBI(todayHoliday.close); currentStatus = (openMins !== null && closeMins !== null && previewCurrentMinutes >= openMins && previewCurrentMinutes < closeMins) ? 'Open' : 'Closed'; }
            activeHoursRule.reason = statusReason + ` (${currentStatus})`;
            console.log(`Admin Preview Status determined by: Holiday (${currentStatus})`);
        }
    }

    // Refined Temporary Hours Check (v12 logic)
    if (!ruleApplied) {
        const activeTemporary = currentFormData.temporaryHours.find(t => previewDateStr >= t.startDate && previewDateStr <= t.endDate);
        if (activeTemporary) {
            console.log("Admin Preview: Found active temporary period:", activeTemporary);
            if (activeTemporary.isClosed) {
                currentStatus = 'Closed'; statusReason = `Temporary Hours (${activeTemporary.label || 'Active'}) - Closed All Day`;
                activeHoursRule = { ...activeTemporary, reason: statusReason }; ruleApplied = true;
                console.log("Admin Preview Status determined by: Temporary Rule (Closed All Day)");
            } else if (activeTemporary.open && activeTemporary.close) {
                const openMins = timeStringToMinutesBI(activeTemporary.open); const closeMins = timeStringToMinutesBI(activeTemporary.close);
                if (openMins !== null && closeMins !== null && previewCurrentMinutes >= openMins && previewCurrentMinutes < closeMins) {
                    currentStatus = 'Temporarily Unavailable'; statusReason = `Temporary Hours (${activeTemporary.label || 'Active'})`;
                    activeHoursRule = { ...activeTemporary, reason: statusReason }; ruleApplied = true;
                    console.log("Admin Preview Status determined by: Temporary Rule (Specific Time - Set to Unavailable)");
                } else { console.log("Admin Preview: Time is outside temporary specific hours. Falling through."); }
            } else { console.log("Admin Preview: Temporary rule found but has no closing/timing info. Falling through."); }
        }
    }

    // Regular Hours Check
    if (!ruleApplied) {
        statusReason = 'Regular Hours'; const todayRegularHours = currentFormData.regularHours[previewDayName];
        if (todayRegularHours && !todayRegularHours.isClosed && todayRegularHours.open && todayRegularHours.close) {
            const openMins = timeStringToMinutesBI(todayRegularHours.open); const closeMins = timeStringToMinutesBI(todayRegularHours.close);
            if (openMins !== null && closeMins !== null && previewCurrentMinutes >= openMins && previewCurrentMinutes < closeMins) {
                currentStatus = 'Open'; activeHoursRule = { ...todayRegularHours, day: previewDayName, reason: statusReason + " (Open)" };
            } else { currentStatus = 'Closed'; activeHoursRule = { ...todayRegularHours, day: previewDayName, reason: statusReason + " (Outside Hours)" }; }
        } else { currentStatus = 'Closed'; activeHoursRule = { ...(todayRegularHours || {}), day: previewDayName, isClosed: true, reason: statusReason + " (Closed Today)" }; }
        console.log(`Admin Preview Status determined by: Regular Hours (${currentStatus})`);
    }

    // 3. Display Status
    let statusClass = 'status-closed';
    if (currentStatus === 'Open') statusClass = 'status-open';
    else if (currentStatus === 'Temporarily Unavailable') statusClass = 'status-unavailable';
    const displayReason = activeHoursRule?.reason || statusReason || 'Unknown';
    // Corrected innerHTML using proper template literals
    adminPreviewStatus.innerHTML = `<span class="${statusClass}">${currentStatus}</span> <span class="status-reason">(${displayReason})</span>`;


    // 4. Display Hours (Regular, Temporary, Holiday)
    adminPreviewHours.innerHTML = ''; // Clear before appending sections
    let hoursHtml = '<h4>Regular Hours</h4><ul>';
    daysOfWeek.forEach(day => {
        const dayData = currentFormData.regularHours[day];
        const isCurrentDay = day === previewDayName;
        const highlightClass = isCurrentDay ? 'current-day-preview' : '';
        // Corrected innerHTML using proper template literals
        hoursHtml += `
            <li class="${highlightClass}">
                <strong>${capitalizeFirstLetter(day)}:</strong>
                ${dayData && !dayData.isClosed && dayData.open && dayData.close ?
                    // Calls the corrected formatTimeForAdminPreview
                    `<span>${formatTimeForAdminPreview(dayData.open)} - ${formatTimeForAdminPreview(dayData.close)} ET</span>` :
                    '<span>Closed</span>'
                }
            </li>`;
    });
    hoursHtml += '</ul>';

    if (currentFormData.temporaryHours && currentFormData.temporaryHours.length > 0) {
        hoursHtml += '<h4>Upcoming/Active Temporary Hours</h4><ul class="special-hours-preview">';
        currentFormData.temporaryHours.forEach(temp => {
            if (temp.startDate && temp.endDate) {
                 // Corrected innerHTML using proper template literals
                 // Now displays times correctly by calling the fixed formatTimeForAdminPreview
                hoursHtml += `
                    <li>
                        <strong>${temp.label || 'Temporary Schedule'}:</strong>
                        <div class="special-hours-details">
                            <span class="dates">${temp.startDate} to ${temp.endDate}</span>
                            ${temp.isClosed ?
                                '<span class="hours">Closed</span>' :
                                `<span class="hours">${formatTimeForAdminPreview(temp.open) || '?'} - ${formatTimeForAdminPreview(temp.close) || '?'} ET</span>`
                            }
                        </div>
                    </li>
                `;
            }
        });
        hoursHtml += '</ul>';
    }

    if (currentFormData.holidayHours && currentFormData.holidayHours.length > 0) {
    hoursHtml += '<h4>Upcoming Holiday Hours</h4><ul class="special-hours-preview">';
    currentFormData.holidayHours.forEach(holiday => {
        if (holiday.date) {
            // Corrected innerHTML using proper template literals
            // Now displays times correctly by calling the fixed formatTimeForAdminPreview
            hoursHtml += `
                <li>
                    <strong>${holiday.label || 'Holiday'}:</strong>
                    <div class="special-hours-details">
                        <span class="date">${holiday.date}</span>
                        ${holiday.isClosed ?
                            '<span class="hours">Closed</span>' :
                            `<span class="hours">${formatTimeForAdminPreview(holiday.open) || '?'} - ${formatTimeForAdminPreview(holiday.close) || '?'} ET</span>`
                        }
                    </div>
                </li>
            `;
        }
    });
    hoursHtml += '</ul>';
}

    hoursHtml += '<p class="preview-timezone-note">Preview based on your browser time. Assumes ET input for hours.</p>';
    adminPreviewHours.innerHTML = hoursHtml;

    // 5. Display Contact
    // Corrected innerHTML using proper template literals
    if (currentFormData.contactEmail) { adminPreviewContact.innerHTML = `Contact: <a href="mailto:${currentFormData.contactEmail}" target="_blank">${currentFormData.contactEmail}</a>`; }
    else { adminPreviewContact.innerHTML = ''; }

    console.log("Admin preview update complete.");
}


// --- Attach Business Info Event Listeners (v15 - Added Logs & Refined Listener Setup) ---
function setupBusinessInfoListeners() {
    console.log("Attempting to set up Business Info Listeners..."); // Log setup attempt

    const businessInfoForm = document.getElementById('business-info-form');
    const addHolidayButton = document.getElementById('add-holiday-button');
    const addTemporaryButton = document.getElementById('add-temporary-button');
    const holidayHoursList = document.getElementById('holiday-hours-list');
    const temporaryHoursList = document.getElementById('temporary-hours-list');

    if (!businessInfoForm || !addHolidayButton || !addTemporaryButton || !holidayHoursList || !temporaryHoursList) {
        console.warn("One or more Business Info elements missing, cannot attach listeners."); return;
    }

    // Check if listeners already seem attached **BEFORE** adding new ones
    if (businessInfoForm.dataset.listenerAttached === 'true') {
        console.warn("Skipping duplicate attachment of Business Info Listeners.");
        return; // Exit if already attached
    }
     // Set the flag **BEFORE** attaching listeners to prevent race conditions
    businessInfoForm.dataset.listenerAttached = 'true';
    console.log("Attaching Business Info Listeners NOW...");

    // Add Buttons: Only append the element. Let the observer handle the preview update.
    // Inside setupBusinessInfoListeners() - THIS IS CORRECT
    addListenerSafe(addHolidayButton, 'click', () => {
        console.log('Holiday Add Button Clicked - Attempting to add DOM element.'); // Debug Log
        if (typeof renderHolidayEntry === 'function') {
            holidayHoursList.appendChild(renderHolidayEntry({ isClosed: true }, holidayHoursList.children.length));
            // REMOVED: updateAdminPreview(); // Let observer handle preview
        } else { console.error("renderHolidayEntry function missing!"); }
    }, '_addHolBtn'); // Unique suffix for addListenerSafe


    addListenerSafe(addTemporaryButton, 'click', () => {
    console.log('Temporary Add Button Clicked - Attempting to add DOM element.'); // Debug Log
    if (typeof renderTemporaryEntry === 'function') {
        temporaryHoursList.appendChild(renderTemporaryEntry({ isClosed: false }, temporaryHoursList.children.length));
        // REMOVED: updateAdminPreview(); // Let observer handle preview
    } else { console.error("renderTemporaryEntry function missing!"); }
}, '_addTempBtn'); // Unique suffix for addListenerSafe
    // Attach form submit listener using addListenerSafe
    addListenerSafe(businessInfoForm, 'submit', saveBusinessInfoData, '_bizSubmit');

    // --- Live Preview Updates (Inputs/Checkboxes & Observer) ---
    if (typeof updateAdminPreview === 'function') {
        // Use event delegation for inputs/changes within the form
        addListenerSafe(businessInfoForm, 'input', (e) => {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) {
                updateAdminPreview(); // Trigger preview update on input
            }
        }, '_preview_input'); // Unique suffix for listener

        addListenerSafe(businessInfoForm, 'change', (e) => {
             if (e.target && e.target.type === 'checkbox') {
                 updateAdminPreview(); // Trigger preview update on checkbox change
             }
        }, '_preview_change'); // Unique suffix for listener


        // Observer for list changes (adding/removing holiday/temp entries)
        const listObserver = new MutationObserver((mutationsList) => {
            // Debounce observer updates slightly
            let observerTimeout;
            clearTimeout(observerTimeout);
            observerTimeout = setTimeout(() => {
                const changed = mutationsList.some(mutation => mutation.type === 'childList' && (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0));
                if (changed) {
                    console.log('Preview update triggered by MutationObserver.');
                    updateAdminPreview(); // Update preview after DOM change
                }
            }, 150); // Small debounce delay
        });

        // Ensure the lists exist before observing
        if (holidayHoursList) listObserver.observe(holidayHoursList, { childList: true });
        if (temporaryHoursList) listObserver.observe(temporaryHoursList, { childList: true });
        console.log("MutationObserver set up for holiday/temporary lists inside setupBusinessInfoListeners.");

    } else {
        console.warn("updateAdminPreview function not found, live preview will not work.");
    }
    // Log moved to before listeners are attached now that flag is set earlier
    // console.log("Business Info Listeners attached successfully.");
}


// ======================================================
// == END: ALL BUSINESS INFO CODE FOR admin.js ==========
// ======================================================

// ======================================
// BLOG MANAGEMENT FUNCTIONS (FULL)
// ======================================

// Initialize Quill with full formatting options
const quill = new Quill('#post-content-editor', {
    theme: 'snow',
    modules: {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'image', 'video'],
            ['clean']
        ]
    }
});
// ----------------------------
// Save or update a blog post
// ----------------------------
async function savePost() {
    const postId = document.getElementById('post-id').value;
    const title = document.getElementById('post-title').value.trim();
    const author = document.getElementById('post-author').value.trim();
    const authorPfpUrl = document.getElementById('post-author-pfp').value.trim();
    const category = document.getElementById('post-category').value.trim();
    const isFeatured = document.getElementById('post-featured').checked;
    const content = quill.root.innerHTML;
    const imageFile = document.getElementById('post-image')?.files[0];

    if (!title || !author || !category) {
        alert('Please fill out Title, Author, and Category.');
        return;
    }
    if (content.trim() === '<p><br></p>' || content.trim() === '') {
        alert('Post Content cannot be empty.');
        return;
    }

    try {
        const batch = writeBatch(db);
        let imageUrl = null;

        // Un-feature other posts if this one is featured
        if (isFeatured) {
            const featuredQuery = query(postsCollectionRef, where('isFeatured', '==', true));
            const featuredSnapshot = await getDocs(featuredQuery);
            featuredSnapshot.forEach(docSnap => {
                if (docSnap.id !== postId) batch.update(docSnap.ref, { isFeatured: false });
            });
        }

        // Handle image upload
        if (imageFile) {
            // Delete old image if editing
            if (postId) {
                const oldDoc = await getDoc(doc(db, 'posts', postId));
                if (oldDoc.exists() && oldDoc.data().imageUrl) {
                    try {
                        const oldRef = ref(storage, oldDoc.data().imageUrl);
                        await deleteObject(oldRef);
                    } catch {}
                }
            }
            const storageRef = ref(storage, `blogImages/${Date.now()}_${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(storageRef);
        }

        // Prepare post data
        const postData = {
            title, author, authorPfpUrl, category, content,
            isFeatured, updatedAt: serverTimestamp()
        };
        if (imageUrl) postData.imageUrl = imageUrl;

        if (postId) {
            const postRef = doc(db, 'posts', postId);
            batch.update(postRef, postData);
        } else {
            postData.createdAt = serverTimestamp();
            const newPostRef = doc(postsCollectionRef);
            batch.set(newPostRef, postData);
        }

        await batch.commit();
        alert(`Post ${postId ? 'updated' : 'saved'} successfully!`);
        resetPostForm();
        loadPosts();

    } catch (error) {
        console.error('Error saving post:', error);
        alert('Error saving post. Check console for details.');
    }
}

// ----------------------------
// Reset post form
// ----------------------------
function resetPostForm() {
    document.getElementById('post-id').value = '';
    document.getElementById('post-title').value = '';
    document.getElementById('post-author').value = '';
    document.getElementById('post-author-pfp').value = '';
    document.getElementById('post-category').value = '';
    document.getElementById('post-featured').checked = false;
    quill.root.innerHTML = '';
    const imgInput = document.getElementById('post-image');
    if (imgInput) imgInput.value = '';
    const previewContainer = document.getElementById('post-image-preview');
    if (previewContainer) previewContainer.innerHTML = '';
}

// ----------------------------
// Load posts for admin
// ----------------------------
async function loadPosts() {
    const postsList = document.getElementById('posts-list');
    if (!postsList) return;

    postsList.innerHTML = '<p>Loading posts...</p>';

    try {
        const postsQuery = query(postsCollectionRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(postsQuery);
        if (snapshot.empty) {
            postsList.innerHTML = '<p>No posts found.</p>';
            return;
        }

        postsList.innerHTML = '';
        snapshot.forEach(docSnap => {
            const post = docSnap.data();
            const postId = docSnap.id;

            const html = `
                <div class="admin-list-item" data-id="${postId}">
                    <div>
                        <strong>${post.title || 'Untitled'}</strong>
                        <small>${post.category || 'Uncategorized'}</small>
                        ${post.isFeatured ? '<span style="color:var(--accent-color,#3ddc84);">Featured</span>' : ''}
                    </div>
                    <div>
                        <button onclick="editPost('${postId}')" class="admin-btn is-secondary">Edit</button>
                        <button onclick="deletePost('${postId}')" class="admin-btn is-secondary">Delete</button>
                    </div>
                </div>
            `;
            postsList.innerHTML += html;
        });

    } catch (error) {
        console.error('Error loading posts:', error);
        postsList.innerHTML = '<p>Error loading posts.</p>';
    }
}

// ----------------------------
// Edit post
// ----------------------------
async function editPost(postId) {
    try {
        const docRef = doc(db, 'posts', postId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return alert('Post not found.');

        const post = docSnap.data();
        document.getElementById('post-id').value = postId;
        document.getElementById('post-title').value = post.title || '';
        document.getElementById('post-author').value = post.author || '';
        document.getElementById('post-author-pfp').value = post.authorPfpUrl || '';
        document.getElementById('post-category').value = post.category || '';
        document.getElementById('post-featured').checked = post.isFeatured || false;
        quill.root.innerHTML = post.content || '';

        const previewContainer = document.getElementById('post-image-preview');
        if (previewContainer) {
            if (post.imageUrl) {
                previewContainer.innerHTML = `
                    <img src="${post.imageUrl}" style="max-width:150px;">
                    <small>Choose a new file below to replace this image.</small>
                `;
            } else previewContainer.innerHTML = `<p>No image uploaded yet.</p>`;
        }

    } catch (error) {
        console.error('Error loading post for edit:', error);
        alert('Error loading post.');
    }
}

// ----------------------------
// Delete post
// ----------------------------
async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
        await deleteDoc(doc(db, 'posts', postId));
        alert('Post deleted successfully!');
        loadPosts();
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post.');
    }
}
    
/** Filters and displays shoutouts in the admin list */
function displayFilteredShoutouts(platform) {
    const listContainer = document.getElementById(`shoutouts-${platform}-list-admin`);
    const countElement = document.getElementById(`${platform}-count`);
    const searchInput = document.getElementById(`search-${platform}`);

    if (!listContainer || !searchInput || !allShoutouts || !allShoutouts[platform]) {
        console.error(`Missing elements or data for filtering platform: ${platform}.`);
        if(listContainer) listContainer.innerHTML = `<p class="error">Error displaying filtered list.</p>`;
        return;
    }

    const searchTerm = searchInput.value.trim().toLowerCase();
    const fullList = allShoutouts[platform];

    const filteredList = fullList.filter(account => {
        if (!searchTerm) return true;
        const nickname = (account.nickname || '').toLowerCase();
        const username = (account.username || '').toLowerCase();
        return nickname.includes(searchTerm) || username.includes(searchTerm);
    });

    listContainer.innerHTML = ''; // Clear the current list

    if (filteredList.length > 0) {
        filteredList.forEach(account => {
            if (typeof renderAdminListItem === 'function') {
                // *** CHANGE HERE: Pass the whole 'account' object as itemData ***
                renderAdminListItem(
                    listContainer,
                    account.id,     // Document ID
                    platform,       // Platform name
                    account,        // <<< Pass the full account data object
                    handleDeleteShoutout, // Pass delete handler
                    openEditModal       // Pass edit handler
                );
            } else {
                console.error("renderAdminListItem function is not defined during filtering!");
                listContainer.innerHTML = `<p class="error">Critical Error: Rendering function missing.</p>`;
                return; // Stop rendering this list
            }
        });
    } else {
        if (searchTerm) {
            listContainer.innerHTML = `<p>No shoutouts found matching "${searchInput.value}".</p>`;
        } else {
            listContainer.innerHTML = `<p>No ${platform} shoutouts found.</p>`;
        }
    }

    if (countElement) {
        countElement.textContent = `(${filteredList.length})`;
    }
}

// --- CORRECTED (v3): Function to Load Profile Data AND All Countdown Settings ---
async function loadProfileData() {
    // Ensure user is logged in
    if (!auth || !auth.currentUser) {
        console.warn("Auth not ready or user not logged in when trying to load profile.");
        return;
    }
    // Check required form elements exist (Add countdownExpiredMessageInput)
    if (!profileForm || !maintenanceModeToggle || !hideTikTokSectionToggle ||
        !countdownTitleInput || !countdownDatetimeInput || !countdownExpiredMessageInput || // Added check
        !adminPfpPreview || !profileStatusInput /* Added check */ ) {
        console.error("One or more profile/settings form elements missing in admin.html!");
        if (profileStatusMessage) showProfileStatus("Error: Page structure incorrect.", true);
        else if(settingsStatusMessage) showSettingsStatus("Error: Page structure incorrect.", true);
        return;
    }

    console.log("Attempting to load profile & countdown data from:", profileDocRef.path);
    try {
        const docSnap = await getDoc(profileDocRef); // Fetch the profile/settings document

        if (docSnap.exists()) {
            const data = docSnap.data(); // <<< 'data' is defined HERE
            console.log("Loaded profile/settings data:", data);

            // --- Populate fields INSIDE this block ---
            // Profile fields
            if(profileUsernameInput) profileUsernameInput.value = data.username || '';
            if(profilePicUrlInput) profilePicUrlInput.value = data.profilePicUrl || '';
            if(profileBioInput) profileBioInput.value = data.bio || '';
            if(profileStatusInput) profileStatusInput.value = data.status || 'offline';

            // Toggles
            maintenanceModeToggle.checked = data.isMaintenanceModeEnabled || false;
            maintenanceModeToggle.disabled = false;
            hideTikTokSectionToggle.checked = data.hideTikTokSection || false;
            hideTikTokSectionToggle.disabled = false;

            // *** Load Countdown Settings ***
            if (countdownTitleInput) {
                countdownTitleInput.value = data.countdownTitle || '';
                countdownTitleInput.disabled = false;
            }
            if (countdownDatetimeInput) {
                // Check if the timestamp exists AND is a Timestamp object
                if (data.countdownTargetDate && data.countdownTargetDate instanceof Timestamp) { // <<< Requires Timestamp import
                    try {
                        const targetDate = data.countdownTargetDate.toDate();
                        const year = targetDate.getFullYear();
                        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
                        const day = String(targetDate.getDate()).padStart(2, '0');
                        const hours = String(targetDate.getHours()).padStart(2, '0');
                        const minutes = String(targetDate.getMinutes()).padStart(2, '0');
                        const seconds = String(targetDate.getSeconds()).padStart(2, '0');
                        // Set value for the text input
                        countdownDatetimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
                        console.log("Loaded existing countdown date/time.");
                    } catch (dateError) {
                        console.error("Error processing countdown timestamp:", dateError);
                        countdownDatetimeInput.value = ''; // Clear on error
                        if (settingsStatusMessage) showSettingsStatus("Error reading existing date.", true);
                    }
                } else {
                    // Clear input if no valid timestamp exists in Firestore
                    countdownDatetimeInput.value = '';
                    if(data.hasOwnProperty('countdownTargetDate')) { // Log if field exists but isn't a Timestamp
                        console.warn("Field 'countdownTargetDate' exists but is not a Timestamp:", data.countdownTargetDate);
                    } else {
                        console.log("No existing countdown date/time found.");
                    }
                }
                countdownDatetimeInput.disabled = false; // Enable input
            }
            // Load Expired Message
            if (countdownExpiredMessageInput) {
                countdownExpiredMessageInput.value = data.countdownExpiredMessage || ''; // Load message
                countdownExpiredMessageInput.disabled = false; // Enable input
            }
            // *** End Countdown Load ***

            // Profile Picture Preview
            if (adminPfpPreview) { // Check if element exists
                 if (data.profilePicUrl) {
                    adminPfpPreview.src = data.profilePicUrl;
                    adminPfpPreview.style.display = 'inline-block';
                    adminPfpPreview.onerror = () => { // Add error handling here
                        console.warn("Admin Preview: Image failed to load from URL:", adminPfpPreview.src);
                        adminPfpPreview.style.display = 'none';
                        if(profilePicUrlInput) profilePicUrlInput.classList.add('input-error');
                    };
                 } else {
                    adminPfpPreview.src = '';
                    adminPfpPreview.style.display = 'none';
                 }
            }
            // --- End populate fields ---

        } else {
            // Handle doc not existing
            console.warn(`Profile document ('${profileDocRef.path}') not found. Displaying defaults.`);
            if (profileForm) profileForm.reset();
            if (profileStatusInput) profileStatusInput.value = 'offline';
            maintenanceModeToggle.checked = false; maintenanceModeToggle.disabled = false;
            hideTikTokSectionToggle.checked = false; hideTikTokSectionToggle.disabled = false;
            // Clear and disable countdown inputs
            if (countdownTitleInput) { countdownTitleInput.value = ''; countdownTitleInput.disabled = true; }
            if (countdownDatetimeInput) { countdownDatetimeInput.value = ''; countdownDatetimeInput.disabled = true; }
            if (countdownExpiredMessageInput) { countdownExpiredMessageInput.value = ''; countdownExpiredMessageInput.disabled = true; } // Clear/disable message
            if(adminPfpPreview) adminPfpPreview.style.display = 'none';
            if(settingsStatusMessage) showSettingsStatus("Settings document missing. Save to create.", true)
        }
    } catch (error) {
        // Handle errors loading doc
        console.error("Error loading profile/settings data:", error);
        if(profileStatusMessage) showProfileStatus("Error loading profile data.", true);
        if(settingsStatusMessage) showSettingsStatus("Error loading site settings.", true);
        // Reset forms and disable inputs on error
        if (profileForm) profileForm.reset();
        if (profileStatusInput) profileStatusInput.value = 'offline';
        maintenanceModeToggle.checked = false; maintenanceModeToggle.disabled = true;
        hideTikTokSectionToggle.checked = false; hideTikTokSectionToggle.disabled = true;
        // Disable countdown inputs on error
        if (countdownTitleInput) { countdownTitleInput.value = ''; countdownTitleInput.disabled = true; }
        if (countdownDatetimeInput) { countdownDatetimeInput.value = ''; countdownDatetimeInput.disabled = true; }
        if (countdownExpiredMessageInput) { countdownExpiredMessageInput.value = ''; countdownExpiredMessageInput.disabled = true; } // Disable message
        if(adminPfpPreview) adminPfpPreview.style.display = 'none';
    }
}


    // --- Function to Save Profile Data (with Logging) ---
    async function saveProfileData(event) {
        event.preventDefault();
        if (!auth || !auth.currentUser) { showProfileStatus("Error: Not logged in.", true); return; }
        if (!profileForm) return;
        console.log("Attempting to save profile data..."); // Debug log

        const newData = {
            username: profileUsernameInput?.value.trim() || "",
            profilePicUrl: profilePicUrlInput?.value.trim() || "",
            bio: profileBioInput?.value.trim() || "",
            status: profileStatusInput?.value || "offline",
            countdownTitle: countdownTitleInput?.value.trim() || "", // Save title
            countdownTargetDateTime: countdownDatetimeInput?.value.trim() || "" // Save date/time string
        };

        // Basic validation for the datetime string format (optional but recommended)
        const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
        if (newData.countdownTargetDateTime && !dateTimeRegex.test(newData.countdownTargetDateTime)) {
             showProfileStatus("Invalid Countdown Date/Time format. Please use YYYY-MM-DDTHH:MM:SS", true);
             return; // Stop saving if format is wrong
        }


        showProfileStatus("Saving profile...");
        try {
            await setDoc(profileDocRef, { ...newData, lastUpdated: serverTimestamp() }, { merge: true });
            console.log("Profile data save successful:", profileDocRef.path);
            showProfileStatus("Profile updated successfully!", false);
            // Update preview image
            if (adminPfpPreview && newData.profilePicUrl) {
                adminPfpPreview.src = newData.profilePicUrl;
                adminPfpPreview.style.display = 'inline-block';
            } else if (adminPfpPreview) {
                adminPfpPreview.src = '';
                adminPfpPreview.style.display = 'none';
            }

        } catch (error) {
            console.error("Error saving profile data:", error);
            showProfileStatus(`Error saving profile: ${error.message}`, true);
        }
    }

    // Event listener for profile picture URL input to update preview (optional but helpful)
    if (profilePicUrlInput && adminPfpPreview) { //
        profilePicUrlInput.addEventListener('input', () => { //
            const url = profilePicUrlInput.value.trim(); //
            if (url) { //
                adminPfpPreview.src = url; //
                adminPfpPreview.style.display = 'inline-block'; //
            } else { //
                adminPfpPreview.style.display = 'none'; //
            }
        });
        // Handle image loading errors for the preview
        adminPfpPreview.onerror = () => { //
            console.warn("Preview image failed to load from URL:", adminPfpPreview.src); //
            // Optionally show a placeholder or hide the preview on error
            // adminPfpPreview.src = 'path/to/error-placeholder.png';
             adminPfpPreview.style.display = 'none'; //
             profilePicUrlInput.classList.add('input-error'); // Add error class to input
        };
         // Remove error class when input changes
         profilePicUrlInput.addEventListener('focus', () => { //
            profilePicUrlInput.classList.remove('input-error'); //
         });
    }

// *** NEW FUNCTION TO SAVE Hide TikTok Section Status ***
    async function saveHideTikTokSectionStatus(isEnabled) {
        // Ensure user is logged in
        if (!auth || !auth.currentUser) {
            showAdminStatus("Error: Not logged in. Cannot save settings.", true); // Use main admin status
            // Revert checkbox state visually if save fails due to auth issue
            if(hideTikTokSectionToggle) hideTikTokSectionToggle.checked = !isEnabled;
            return;
        }

        // Use the specific status message area for settings, fallback to main admin status
        const statusElement = settingsStatusMessage || adminStatusElement; //

        // Show saving message
        if (statusElement) {
            statusElement.textContent = "Saving setting...";
            statusElement.className = "status-message"; // Reset style
            statusElement.style.display = 'block';
        }

        try {
            // Use profileDocRef (site_config/mainProfile) to store the flag
            // Use setDoc with merge: true to update only this field without overwriting others
            await setDoc(profileDocRef, {
                hideTikTokSection: isEnabled // Save the boolean value (true/false)
            }, { merge: true });

            console.log("Hide TikTok Section status saved:", isEnabled);

            // Show success message using the dedicated settings status element or fallback
            const message = `TikTok homepage section set to ${isEnabled ? 'hidden' : 'visible'}.`;
             if (statusElement === settingsStatusMessage && settingsStatusMessage) { // Check if we are using the specific element
                 showSettingsStatus(message, false); // Uses the settings-specific display/clear logic
             } else { // Fallback if specific element wasn't found initially
                 showAdminStatus(message, false);
             }

        } catch (error) {
            console.error("Error saving Hide TikTok Section status:", error);
            // Show error message in the specific status area or fallback
            if (statusElement === settingsStatusMessage && settingsStatusMessage) {
                showSettingsStatus(`Error saving setting: ${error.message}`, true);
            } else {
                showAdminStatus(`Error saving Hide TikTok setting: ${error.message}`, true);
            }
            // Revert checkbox state visually on error
             if(hideTikTokSectionToggle) hideTikTokSectionToggle.checked = !isEnabled;
        }
    }
    // *** END NEW FUNCTION ***

// *** FUNCTION TO SAVE Maintenance Mode Status ***

    async function saveMaintenanceModeStatus(isEnabled) { //

        // Ensure user is logged in

        if (!auth || !auth.currentUser) { //

            showAdminStatus("Error: Not logged in. Cannot save settings.", true); // Use main admin status

            // Revert checkbox state visually if save fails due to auth issue

            if(maintenanceModeToggle) maintenanceModeToggle.checked = !isEnabled; //

            return; //

        }



        // Use the specific status message area for settings, fallback to main admin status

        const statusElement = settingsStatusMessage || adminStatusElement; //



        // Show saving message

        if (statusElement) { //

            statusElement.textContent = "Saving setting..."; //

            statusElement.className = "status-message"; // Reset style

            statusElement.style.display = 'block'; //

        }



        try { //

            // Use profileDocRef (site_config/mainProfile) to store the flag

            // Use setDoc with merge: true to update only this field without overwriting others

            await setDoc(profileDocRef, { //

                isMaintenanceModeEnabled: isEnabled // Save the boolean value (true/false)

            }, { merge: true }); //



            console.log("Maintenance mode status saved:", isEnabled); //



            // Show success message using the dedicated settings status element or fallback

             if (statusElement === settingsStatusMessage && settingsStatusMessage) { // Check if we are using the specific element

                 showSettingsStatus(`Maintenance mode ${isEnabled ? 'enabled' : 'disabled'}.`, false); // Uses the settings-specific display/clear logic

             } else { // Fallback if specific element wasn't found initially

                showAdminStatus(`Maintenance mode ${isEnabled ? 'enabled' : 'disabled'}.`, false); //

             }



        } catch (error) { //

            console.error("Error saving maintenance mode status:", error); //

            // Show error message in the specific status area or fallback

            if (statusElement === settingsStatusMessage && settingsStatusMessage) { //

                 showSettingsStatus(`Error saving setting: ${error.message}`, true); //

            } else { //

                showAdminStatus(`Error saving maintenance mode: ${error.message}`, true); //

            }

            // Revert checkbox state visually on error

             if(maintenanceModeToggle) maintenanceModeToggle.checked = !isEnabled; //

        }

    }
    // *** END FUNCTION ***

// --- Inactivity Logout & Timer Display Functions ---

    // Updates the countdown timer display
    function updateTimerDisplay() { //
        if (!timerDisplayElement) return; // Exit if display element doesn't exist
        const now = Date.now(); //
        const remainingMs = expirationTime - now; // Calculate remaining time

        if (remainingMs <= 0) { // If time is up
            timerDisplayElement.textContent = "00:00"; // Show zero
            clearInterval(displayIntervalId); // Stop the interval timer
        } else { //
            // Calculate remaining minutes and seconds
            const remainingSeconds = Math.round(remainingMs / 1000); //
            const minutes = Math.floor(remainingSeconds / 60); //
            const seconds = remainingSeconds % 60; //
            // Format as MM:SS and update display
            timerDisplayElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`; //
        }
    }

    // Function called when the inactivity timeout is reached
    function logoutDueToInactivity() { //
        console.log("Logging out due to inactivity."); //
        clearTimeout(inactivityTimer); // Clear the master timeout
        clearInterval(displayIntervalId); // Clear the display update interval
        if (timerDisplayElement) timerDisplayElement.textContent = ''; // Clear display
        removeActivityListeners(); // Remove event listeners to prevent resetting timer after logout
        // Sign the user out using Firebase Auth
        signOut(auth).catch((error) => { //
             console.error("Error during inactivity logout:", error); //
             // Optionally show a message, though user might already be gone
             // showAdminStatus("Logged out due to inactivity.", false);
        });
        // Note: The StateChanged listener will handle hiding admin content
    }

    // Resets the inactivity timer whenever user activity is detected
    function resetInactivityTimer() { //
        clearTimeout(inactivityTimer); // Clear existing timeout
        clearInterval(displayIntervalId); // Clear existing display interval

        // Set the new expiration time
        expirationTime = Date.now() + INACTIVITY_TIMEOUT_MS; //
        // Set the main timeout to trigger logout
        inactivityTimer = setTimeout(logoutDueToInactivity, INACTIVITY_TIMEOUT_MS); //

        // Start updating the visual timer display every second
        if (timerDisplayElement) { //
             updateTimerDisplay(); // Update display immediately
             displayIntervalId = setInterval(updateTimerDisplay, 1000); // Update every second
        }
    }

    // Adds event listeners for various user activities
    function addActivityListeners() { //
        console.log("Adding activity listeners for inactivity timer."); //
        // Listen for any specified events on the document
        activityEvents.forEach(eventName => { //
            document.addEventListener(eventName, resetInactivityTimer, true); // Use capture phase
        });
    }

    // Removes the activity event listeners
    function removeActivityListeners() { //
        console.log("Removing activity listeners for inactivity timer."); //
        // Clear timers just in case
        clearTimeout(inactivityTimer); //
        clearInterval(displayIntervalId); //
        if (timerDisplayElement) timerDisplayElement.textContent = ''; // Clear display

        // Remove listeners for specified events
        activityEvents.forEach(eventName => { //
            document.removeEventListener(eventName, resetInactivityTimer, true); // Use capture phase
        });
    }
// --- Optional: Add listeners to update the PREVIEW as the form changes ---
// (Requires the updateAdminPreview function and its helpers from the previous "preview" step)
if (businessInfoForm && typeof updateAdminPreview === 'function') { // Check if preview function exists
    // Listen to changes on inputs, selects, textareas within the business form
    businessInfoForm.addEventListener('input', (e) => {
        // Simple check to avoid triggering on button clicks accidentally caught by input event
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
             updateAdminPreview();
        }
    });
     // Need 'change' for checkboxes specifically
     businessInfoForm.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            updateAdminPreview();
        }
     });

     // Also update preview when holiday/temp hours are added or removed
     const observer = new MutationObserver((mutationsList) => {
         for(let mutation of mutationsList) {
             if (mutation.type === 'childList') { // Check if children were added/removed
                 // Check if the mutation happened within our special hours lists
                 if (mutation.target === holidayHoursList || mutation.target === temporaryHoursList) {
                     updateAdminPreview();
                     break; // Only need to update once per batch of mutations
                 }
             }
         }
     });
     // Observe changes in the holiday and temporary lists
     if (holidayHoursList) observer.observe(holidayHoursList, { childList: true });
     if (temporaryHoursList) observer.observe(temporaryHoursList, { childList: true });

} else if (businessInfoForm) {
     console.warn("updateAdminPreview function not found, live preview will not update.");
}
// --- End Business Info Event Listeners ---

    // Add these functions to your admin.js file

// --- Helper function for formatting time in the preview ---
function formatTimeForPreview(timeString) { // Converts HH:MM to AM/PM format
    if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) return '';
    try {
        const [hour, minute] = timeString.split(':');
        const hourNum = parseInt(hour, 10);
        if (isNaN(hourNum)) return timeString; // Return original if hour isn't a number
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const hour12 = hourNum % 12 || 12; // Convert 0 to 12
        return `${hour12}:${minute} ${ampm}`;
    } catch (e) {
        console.error("Error formatting time:", timeString, e);
        return timeString; // Return original on error
    }
}


// --- 'Next' Button Logic ---
    // Handles the first step of the two-step login
    if (nextButton && emailInput && authStatus && emailGroup && passwordGroup && loginButton) { //
        nextButton.addEventListener('click', () => { //
            const userEmail = emailInput.value.trim(); // Get entered email

            // Check if email field is empty
            if (!userEmail) { //
                 authStatus.textContent = 'Please enter your email address.'; //
                 authStatus.className = 'status-message error'; // Show error style
                 authStatus.style.display = 'block'; // Make sure message is visible
                 return; // Stop processing if email is empty
            }

            // If email is entered:
            // Display welcome message (optional, or clear previous errors)
            authStatus.textContent = `Welcome back, ${userEmail}`; // Shows email
            // Or simply clear status: authStatus.textContent = '';
            authStatus.className = 'status-message'; // Reset style
            authStatus.style.display = 'block'; // Ensure it's visible or use 'none' to hide

            // Hide email field and Next button
            emailGroup.style.display = 'none'; //
            nextButton.style.display = 'none'; //

            // Show password field and the actual Login button
            passwordGroup.style.display = 'block'; //
            loginButton.style.display = 'inline-block'; // Or 'block' depending on layout

            // Focus the password input for better UX
            if(passwordInput) { //
                 passwordInput.focus(); //
            }
        });
    } else { //
         // Log warning if any elements for the two-step login are missing
         console.warn("Could not find all necessary elements for the 'Next' button functionality (Next Button, Email Input, Auth Status, Email Group, Password Group, Login Button)."); //
    }

// Listener for changes in authentication state (login/logout)
onAuthStateChanged(auth, user => {
    // --- User is signed IN ---
    if (user) {
        const adminEmails = ["ckritzar53@busarmydude.org", "rkritzar53@gmail.com"]; // Your authorized email

        // Check if the signed-in user is on the admin list
        if (adminEmails.includes(user.email)) {
            console.log(`✅ Access GRANTED for admin: ${user.email}`);

            // 1. Immediately show the admin panel
            const loginSection = document.getElementById('login-section');
            const adminContent = document.getElementById('admin-content');
            const logoutButton = document.getElementById('logout-button');
            const adminGreeting = document.getElementById('admin-greeting');
            const authStatus = document.getElementById('auth-status');
            const adminStatusElement = document.getElementById('admin-status');

            if (loginSection) loginSection.style.display = 'none';
            if (adminContent) adminContent.style.display = 'block';
            if (logoutButton) logoutButton.style.display = 'inline-block';
            if (adminGreeting) {
                adminGreeting.textContent = `Logged in as: ${user.displayName || user.email}`;
            }
            if (authStatus) authStatus.textContent = '';
            if (adminStatusElement) adminStatusElement.textContent = '';
            
            // 2. Safely load all data
            try {
                console.log("Loading all admin panel data...");
                loadPosts(); // Load blog posts
                loadProfileData();
                loadBusinessInfoData();
                setupBusinessInfoListeners();
                loadShoutoutsAdmin('tiktok');
                loadShoutoutsAdmin('instagram');
                loadShoutoutsAdmin('youtube');
                loadUsefulLinksAdmin();
                loadSocialLinksAdmin();
                loadDisabilitiesAdmin();
                loadPresidentData();
                loadTechItemsAdmin();
                loadLegislationAdmin();

                // ===============================================
                // == THIS IS THE NEW CODE TO ADD ================
                // ===============================================
                
                console.log("Initializing Rich Text Editor...");
                window.quill = quill;
                console.log("✅ Rich Text Editor initialized.");
                // ===============================================
                // == THIS IS THE FIX: CONNECT THE FORM TO THE SCRIPT ==
                // ===============================================
                const blogForm = document.getElementById('blog-management-form'); // Use the CORRECT ID
                if (blogForm) {
                    // This prevents adding the same listener multiple times
                    if (!blogForm.dataset.listenerAttached) {
                        blogForm.addEventListener('submit', (e) => {
                            e.preventDefault(); // CRITICAL: stops the page from reloading
                            console.log("Save Post form submitted via listener.");
                            savePost();
                        });
                        blogForm.dataset.listenerAttached = 'true';
                    }
                } else {
                    console.error("CRITICAL ERROR: Blog management form with ID 'blog-management-form' not found!");
                }

                resetInactivityTimer();
                addActivityListeners();
            } catch (error) {
                // If any data-loading function fails, it will be caught here
                console.error("❌ CRITICAL ERROR during data loading:", error);
                showAdminStatus(`Error loading admin data: ${error.message}. Check console.`, true);
            }

        } else {
            // --- User is NOT an authorized admin ---
            console.warn(`❌ Access DENIED for user: ${user.email}. Not in the admin list.`);
            alert("Access Denied. This account is not authorized to access the admin panel.");
            signOut(auth);
        }

    } else {
        // --- User is signed OUT ---
        console.log("User is signed out. Displaying login screen.");
        const loginSection = document.getElementById('login-section');
        const adminContent = document.getElementById('admin-content');
        if (loginSection) loginSection.style.display = 'block';
        if (adminContent) adminContent.style.display = 'none';
        
        removeActivityListeners();
    }
});
    
    // Login Form Submission (Handles the final step after password entry)
    if (loginForm) { //
        loginForm.addEventListener('submit', (e) => { //
            e.preventDefault(); // Prevent default form submission
            const email = emailInput.value; //
            const password = passwordInput.value; //

            // Re-validate inputs (especially password as email was checked by 'Next')
            if (!email || !password) { //
                 // Check which field is missing in the current state
                 if (passwordGroup && passwordGroup.style.display !== 'none' && !password) { //
                     if (authStatus) { authStatus.textContent = 'Please enter your password.'; authStatus.className = 'status-message error'; authStatus.style.display = 'block';} //
                 } else if (!email) { // Should ideally not happen in two-step flow, but check anyway
                     if (authStatus) { authStatus.textContent = 'Please enter your email.'; authStatus.className = 'status-message error'; authStatus.style.display = 'block';} //
                 } else { // Generic message if validation fails unexpectedly
                     if (authStatus) { authStatus.textContent = 'Please enter email and password.'; authStatus.className = 'status-message error'; authStatus.style.display = 'block';} //
                 }
                 return; // Stop if validation fails
            }

            // Show "Logging in..." message
            if (authStatus) { //
                authStatus.textContent = 'Logging in...'; //
                authStatus.className = 'status-message'; // Reset style
                authStatus.style.display = 'block'; //
            }

            // Attempt Firebase sign-in
            signInWithEmailAndPassword(auth, email, password) //
                .then((userCredential) => { //
                    // Login successful - onAuthStateChanged will handle the UI updates
                    console.log("Login successful via form submission."); //
                    // No need to clear authStatus here, onAuthStateChanged does it.
                 })
                .catch((error) => { //
                    // Handle login errors
                    console.error("Login failed:", error.code, error.message); //
                    let errorMessage = 'Invalid email or password.'; // Default error
                    // Map specific Firebase Auth error codes to user-friendly messages
                    if (error.code === 'auth/invalid-email') { errorMessage = 'Invalid email format.'; } //
                    else if (error.code === 'auth/user-disabled') { errorMessage = 'This account has been disabled.'; } //
                    else if (error.code === 'auth/invalid-credential') { errorMessage = 'Invalid email or password.'; } // Covers wrong password, user not found
                    else if (error.code === 'auth/too-many-requests') { errorMessage = 'Access temporarily disabled due to too many failed login attempts. Please try again later.'; } //
                    else { errorMessage = `An unexpected error occurred (${error.code}).`; } // Fallback

                    // Display the specific error message
                    if (authStatus) { //
                        authStatus.textContent = `Login Failed: ${errorMessage}`; //
                        authStatus.className = 'status-message error'; //
                        authStatus.style.display = 'block'; //
                    }
                });
        });
    }

    // Logout Button Event Listener
    if (logoutButton) { //
        logoutButton.addEventListener('click', () => { //
            console.log("Logout button clicked."); //
            removeActivityListeners(); // Stop inactivity timer first
            signOut(auth).then(() => { //
                 // Sign-out successful - onAuthStateChanged handles UI updates
                 console.log("User signed out via button."); //
             }).catch((error) => { //
                 // Handle potential logout errors
                 console.error("Logout failed:", error); //
                 showAdminStatus(`Logout Failed: ${error.message}`, true); // Show error in admin area
             });
        });
    }

// --- Shoutouts Load/Add/Delete/Update ---

    // Helper function to get the reference to the metadata document
    // Used for storing last updated timestamps
    function getShoutoutsMetadataRef() { //
        // Using 'siteConfig' collection and 'shoutoutsMetadata' document ID
        // Ensure this document exists or is created if needed
        return doc(db, 'siteConfig', 'shoutoutsMetadata'); //
    }

    // Updates the 'lastUpdatedTime' field in the metadata document for a specific platform
    async function updateMetadataTimestamp(platform) { //
         const metaRef = getShoutoutsMetadataRef(); //
         try { //
             await setDoc(metaRef, { //
                 [`lastUpdatedTime_${platform}`]: serverTimestamp() //
             }, { merge: true }); //
             console.log(`Metadata timestamp updated for ${platform}.`); //
         } catch (error) { //
             console.error(`Error updating timestamp for ${platform}:`, error); //
             showAdminStatus(`Warning: Could not update site timestamp for ${platform}.`, true); //
         }
    }

    // --- UPDATED: loadShoutoutsAdmin Function (Stores data, calls filter function) ---
    async function loadShoutoutsAdmin(platform) { //
        const listContainer = document.getElementById(`shoutouts-${platform}-list-admin`); //
        const countElement = document.getElementById(`${platform}-count`); //
        console.log(`DEBUG: loadShoutoutsAdmin called for ${platform} at ${new Date().toLocaleTimeString()}`); // <-- ADD THIS LINE


        if (!listContainer) { //
            console.error(`List container not found for platform: ${platform}`); //
            return; //
        }
        if (countElement) countElement.textContent = ''; //
        listContainer.innerHTML = `<p>Loading ${platform} shoutouts...</p>`; //

        // Ensure the global storage for this platform exists and is clear
        if (typeof allShoutouts !== 'undefined' && allShoutouts && allShoutouts.hasOwnProperty(platform)) { //
             allShoutouts[platform] = []; //
        } else { //
            console.error(`allShoutouts variable or platform key '${platform}' is missing or not initialized.`); //
             if (typeof allShoutouts === 'undefined' || !allShoutouts) { //
                 allShoutouts = { tiktok: [], instagram: [], youtube: [] }; //
             } else if (!allShoutouts.hasOwnProperty(platform)) { //
                 allShoutouts[platform] = []; //
             }
        }

        try { //
            const shoutoutsCol = collection(db, 'shoutouts'); //
            // Query requires composite index (platform, order)
            const shoutoutQuery = query( //
                shoutoutsCol, //
                where("platform", "==", platform), //
                orderBy("order", "asc") //
            );

            const querySnapshot = await getDocs(shoutoutQuery); //
            console.log(`Loaded ${querySnapshot.size} ${platform} documents.`); //

            // Store fetched data in the global variable 'allShoutouts'
            querySnapshot.forEach((docSnapshot) => { //
                allShoutouts[platform].push({ id: docSnapshot.id, ...docSnapshot.data() }); //
            });

            // Call the filtering/display function to initially render the list
            if (typeof displayFilteredShoutouts === 'function') { //
                displayFilteredShoutouts(platform); //
            } else { //
                 console.error(`displayFilteredShoutouts function is not yet defined when loading ${platform}`); //
                 listContainer.innerHTML = `<p class="error">Error initializing display function.</p>`; //
                 if (countElement) countElement.textContent = '(Error)'; //
            }

        } catch (error) { //
            console.error(`Error loading ${platform} shoutouts:`, error); //
            if (error.code === 'failed-precondition') { //
                 listContainer.innerHTML = `<p class="error">Error: Missing Firestore index for this query. Please create it using the link in the developer console (F12).</p>`; //
                 showAdminStatus(`Error loading ${platform}: Missing database index. Check console.`, true); //
            } else { //
                 listContainer.innerHTML = `<p class="error">Error loading ${platform} shoutouts.</p>`; //
                 showAdminStatus(`Failed to load ${platform} data: ${error.message}`, true); //
            }
            if (countElement) countElement.textContent = '(Error)'; //
        }
    }
    // --- END UPDATED: loadShoutoutsAdmin Function ---

async function handleAddShoutout(platform, formElement) {
    console.log(`DEBUG: handleAddShoutout triggered for ${platform}.`);

    if (isAddingShoutout) {
        console.warn(`DEBUG: handleAddShoutout already running for ${platform}, ignoring duplicate call.`);
        return;
    }
    isAddingShoutout = true;
    console.log(`DEBUG: Set isAddingShoutout = true for ${platform}`);

    if (!formElement) {
        console.error("Form element not provided to handleAddShoutout");
        isAddingShoutout = false;
        return;
    }

    // Get form values (ensure all relevant fields are captured)
    const username = formElement.querySelector(`#${platform}-username`)?.value.trim();
    const nickname = formElement.querySelector(`#${platform}-nickname`)?.value.trim();
    const orderStr = formElement.querySelector(`#${platform}-order`)?.value.trim();
    const order = parseInt(orderStr);
    const isVerified = formElement.querySelector(`#${platform}-isVerified`)?.checked || false;
    const bio = formElement.querySelector(`#${platform}-bio`)?.value.trim() || null;
    const profilePic = formElement.querySelector(`#${platform}-profilePic`)?.value.trim() || null;
    let followers = 'N/A';
    let subscribers = 'N/A';
    let coverPhoto = null;
    if (platform === 'youtube') {
        subscribers = formElement.querySelector(`#${platform}-subscribers`)?.value.trim() || 'N/A';
        coverPhoto = formElement.querySelector(`#${platform}-coverPhoto`)?.value.trim() || null;
    } else {
        followers = formElement.querySelector(`#${platform}-followers`)?.value.trim() || 'N/A';
    }


    // Basic validation
    if (!username || !nickname || !orderStr || isNaN(order) || order < 0) {
        showAdminStatus(`Invalid input for ${platform}. Check required fields and ensure Order is a non-negative number.`, true);
        isAddingShoutout = false; // Reset flag
        return;
    }

    // Duplicate Check Logic
    try {
        const shoutoutsCol = collection(db, 'shoutouts');
        const duplicateCheckQuery = query(shoutoutsCol, where("platform", "==", platform), where("username", "==", username), limit(1));
        const querySnapshot = await getDocs(duplicateCheckQuery);

        if (!querySnapshot.empty) {
            console.warn("Duplicate found for", platform, username);
            showAdminStatus(`Error: A shoutout for username '@${username}' on platform '${platform}' already exists.`, true);
            isAddingShoutout = false; // Reset flag
            return;
        }
        console.log("No duplicate found. Proceeding to add.");

        // Prepare data
        const accountData = {
            platform: platform, username: username, nickname: nickname, order: order,
            isVerified: isVerified, bio: bio, profilePic: profilePic,
            createdAt: serverTimestamp(), isEnabled: true // Default to enabled
        };
        if (platform === 'youtube') {
            accountData.subscribers = subscribers;
            accountData.coverPhoto = coverPhoto;
        } else {
            accountData.followers = followers;
        }

        // Add document
        console.log(`DEBUG: Attempting addDoc for ${username}...`);
        const docRef = await addDoc(collection(db, 'shoutouts'), accountData);
        console.log(`DEBUG: addDoc SUCCESS for ${username}. New ID: ${docRef.id}`);


        // ******************

        await updateMetadataTimestamp(platform); // Update timestamp
        showAdminStatus(`${platform.charAt(0).toUpperCase() + platform.slice(1)} shoutout added successfully.`, false);
        formElement.reset();

        // Reset preview area
        const previewArea = formElement.querySelector(`#add-${platform}-preview`);
        if (previewArea) { previewArea.innerHTML = '<p><small>Preview will appear here as you type.</small></p>'; }

        if (typeof loadShoutoutsAdmin === 'function') {
            loadShoutoutsAdmin(platform); // Reload list
        } else { console.error("loadShoutoutsAdmin function missing after add!"); }

    } catch (error) {
        console.error(`Error during handleAddShoutout for ${platform}:`, error);
        showAdminStatus(`Error adding ${platform} shoutout: ${error.message}`, true);
        // Optionally log failure here too if desired
         if (typeof logAdminActivity === 'function') {
             logAdminActivity('SHOUTOUT_ADD_FAILED', { platform: platform, username: username, error: error.message });
         }
    } finally {
        setTimeout(() => {
            isAddingShoutout = false;
            console.log(`DEBUG: Reset isAddingShoutout = false for ${platform}`);
        }, 1500);
        console.log(`DEBUG: handleAddShoutout processing END for ${platform} at ${new Date().toLocaleTimeString()}`);
    }
}

    // --- Function to Handle Updates from Edit Modal (with DETAILED Logging) ---
    async function handleUpdateShoutout(event) {
        event.preventDefault();
        if (!editForm) return;
        const docId = editForm.getAttribute('data-doc-id');
        const platform = editForm.getAttribute('data-platform');
        if (!docId || !platform) { showAdminStatus("Error: Missing doc ID or platform for update.", true); return; }
        console.log(`Attempting to update shoutout (detailed log): ${platform} - ${docId}`);

        // 1. Get NEW data from form
        const username = editUsernameInput?.value.trim();
        const nickname = editNicknameInput?.value.trim();
        const orderStr = editOrderInput?.value.trim();
        const order = parseInt(orderStr);

        if (!username || !nickname || !orderStr || isNaN(order) || order < 0) {
             showAdminStatus(`Update Error: Invalid input...`, true); return;
        }

        const newDataFromForm = {
            username: username,
            nickname: nickname,
            order: order,
            isVerified: editIsVerifiedInput?.checked || false,
            bio: editBioInput?.value.trim() || null,
            profilePic: editProfilePicInput?.value.trim() || null,
        };
        if (platform === 'youtube') {
            newDataFromForm.subscribers = editSubscribersInput?.value.trim() || 'N/A';
            newDataFromForm.coverPhoto = editCoverPhotoInput?.value.trim() || null;
        } else {
            newDataFromForm.followers = editFollowersInput?.value.trim() || 'N/A';
        }

        showAdminStatus("Updating shoutout...");
        const docRef = doc(db, 'shoutouts', docId); // Define docRef once

        try {
            // 2. Get OLD data BEFORE saving
            let oldData = {};
            const oldDataSnap = await getDoc(docRef);
            if (oldDataSnap.exists()) {
                oldData = oldDataSnap.data();
                 console.log("DEBUG: Fetched old shoutout data:", oldData);
            } else {
                console.warn("Old shoutout data not found for comparison - this shouldn't happen on an update.");
            }

            // 3. Save NEW data
            await updateDoc(docRef, { ...newDataFromForm, lastModified: serverTimestamp() });
            console.log("Shoutout update successful:", docId);
            await updateMetadataTimestamp(platform);
            showAdminStatus(`${platform.charAt(0).toUpperCase() + platform.slice(1)} shoutout updated successfully.`, false);

            // 4. Compare and find changes
            const changes = {};
            let hasChanges = false;
            for (const key in newDataFromForm) {
                // Special check for null/empty string equivalence if needed, otherwise direct compare
                if (oldData[key] !== newDataFromForm[key]) {
                    // Handle null/undefined vs empty string if necessary, e.g.:
                    // if ((oldData[key] ?? "") !== (newDataFromForm[key] ?? "")) {
                    changes[key] = { to: newDataFromForm[key] }; // Log only the new value for simplicity
                    hasChanges = true;
                }
            }

            // 5. Log ONLY actual changes
            if (hasChanges) {
                 console.log("DEBUG: Detected shoutout changes:", changes);
                 if (typeof logAdminActivity === 'function') {
                     logAdminActivity('SHOUTOUT_UPDATE', { id: docId, platform: platform, username: username, changes: changes });
                 } else { console.error("logAdminActivity function not found!");}
            } else {
                 console.log("DEBUG: Shoutout update saved, but no values actually changed.");
            }

            if (typeof closeEditModal === 'function') closeEditModal();
            if (typeof loadShoutoutsAdmin === 'function') loadShoutoutsAdmin(platform);

        } catch (error) {
            console.error(`Error updating ${platform} shoutout (ID: ${docId}):`, error);
            showAdminStatus(`Error updating ${platform} shoutout: ${error.message}`, true);
        }
    }


   // --- MODIFIED: Function to Handle Deleting a Shoutout (with Logging) ---
    async function handleDeleteShoutout(docId, platform, listItemElement) {
        // Confirm deletion with the user
        if (!confirm(`Are you sure you want to permanently delete this ${platform} shoutout? This cannot be undone.`)) {
            return; // Do nothing if user cancels
        }

        showAdminStatus("Deleting shoutout..."); // Feedback
        const docRef = doc(db, 'shoutouts', docId); // Define docRef once for fetching and deleting

        try {
            // *** Step 1: Fetch the data BEFORE deleting (for logging details) ***
            let detailsToLog = { platform: platform, id: docId, username: 'N/A', nickname: 'N/A' }; // Default info
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    detailsToLog.username = data.username || 'N/A'; // Get username if available
                    detailsToLog.nickname = data.nickname || 'N/A'; // Get nickname if available
                    console.log(`Preparing to delete shoutout: ${detailsToLog.nickname} (@${detailsToLog.username})`);
                } else {
                    // Document might already be gone? Log what we know.
                    console.warn(`Document ${docId} not found before deletion, logging ID and platform only.`);
                }
            } catch (fetchError) {
                 console.error(`Error fetching shoutout ${docId} data before deletion:`, fetchError);
                 // Continue with deletion attempt, log will have less detail
            }
            // *** End Fetch Data ***

            // *** Step 2: Delete the document from Firestore ***
            await deleteDoc(docRef);
            await updateMetadataTimestamp(platform); // Update site timestamp
            showAdminStatus(`${platform.charAt(0).toUpperCase() + platform.slice(1)} shoutout deleted successfully.`, false);

            // *** Step 3: Log the Deletion Activity AFTER successful deletion ***
            if (typeof logAdminActivity === 'function') {
                logAdminActivity('SHOUTOUT_DELETE', detailsToLog); // Log the details gathered before deletion
            } else {
                console.error("logAdminActivity function not found! Cannot log deletion.");
            }
            // *** End Log Activity ***


            // Step 4: Reload the list to update UI and internal 'allShoutouts' array.
            if (typeof loadShoutoutsAdmin === 'function') {
                loadShoutoutsAdmin(platform);
            }

        } catch (error) {
            console.error(`Error deleting ${platform} shoutout (ID: ${docId}):`, error);
            showAdminStatus(`Error deleting ${platform} shoutout: ${error.message}`, true);

            // *** Optionally log the FAILED delete attempt ***
             if (typeof logAdminActivity === 'function') {
                 // Log failure with details gathered before attempting delete (if fetch worked)
                 logAdminActivity('SHOUTOUT_DELETE_FAILED', { ...detailsToLog, error: error.message });
             }
        }
    }

    
// *** Function to render a single Useful Link item in the admin list ***
function renderUsefulLinkAdminListItem(container, docId, label, url, order, deleteHandler, editHandler) { //
    if (!container) return; //

    const itemDiv = document.createElement('div'); //
    itemDiv.className = 'list-item-admin'; //
    itemDiv.setAttribute('data-id', docId); //

    itemDiv.innerHTML = `
        <div class="item-content">
             <div class="item-details">
                <strong>${label || 'N/A'}</strong>
                <span>(${url || 'N/A'})</span>
                <small>Order: ${order ?? 'N/A'}</small>
             </div>
        </div>
        <div class="item-actions">
            <a href="${url || '#'}" target="_blank" rel="noopener noreferrer" class="direct-link small-button" title="Visit Link">
                 <i class="fas fa-external-link-alt"></i> Visit
            </a>
            <button type="button" class="edit-button small-button">Edit</button>
            <button type="button" class="delete-button small-button">Delete</button>
        </div>`; //

    // Add event listeners
    const editButton = itemDiv.querySelector('.edit-button'); //
    if (editButton) editButton.addEventListener('click', () => editHandler(docId)); // Pass only docId

    const deleteButton = itemDiv.querySelector('.delete-button'); //
    if (deleteButton) deleteButton.addEventListener('click', () => deleteHandler(docId, itemDiv)); // Pass docId and the item element

    container.appendChild(itemDiv); //
}


// *** CORRECTED Function to Load Useful Links ***
async function loadUsefulLinksAdmin() {
    if (!usefulLinksListAdmin) { console.error("Useful links list container missing."); return; }
    if (usefulLinksCount) usefulLinksCount.textContent = '';
    usefulLinksListAdmin.innerHTML = `<p>Loading useful links...</p>`;
    allUsefulLinks = []; // Clear the global array

    try {
        const linkQuery = query(usefulLinksCollectionRef, orderBy("order", "asc"));
        const querySnapshot = await getDocs(linkQuery);

        // Populate the global array
        querySnapshot.forEach((doc) => {
            allUsefulLinks.push({ id: doc.id, ...doc.data() }); // Store data in the array
        });
        console.log(`Stored ${allUsefulLinks.length} useful links.`);

        // Call the filter function to display initially (will show all)
        displayFilteredUsefulLinks();

    } catch (error) {
        console.error("Error loading useful links:", error);
        usefulLinksListAdmin.innerHTML = `<p class="error">Error loading links.</p>`;
        if (usefulLinksCount) usefulLinksCount.textContent = '(Error)';
        showAdminStatus("Error loading useful links.", true);
    }
}

// *** Function to Handle Adding a New Useful Link ***
async function handleAddUsefulLink(event) { //
    event.preventDefault(); //
    if (!addUsefulLinkForm) return; //

    const labelInput = addUsefulLinkForm.querySelector('#link-label'); //
    const urlInput = addUsefulLinkForm.querySelector('#link-url'); //
    const orderInput = addUsefulLinkForm.querySelector('#link-order'); //

    const label = labelInput?.value.trim(); //
    const url = urlInput?.value.trim(); //
    const orderStr = orderInput?.value.trim(); //
    const order = parseInt(orderStr); //

    if (!label || !url || !orderStr || isNaN(order) || order < 0) { //
        showAdminStatus("Invalid input for Useful Link. Check required fields and ensure Order is a non-negative number.", true); //
        return; //
    }

    // Simple check for valid URL structure (basic)
    try { //
        new URL(url); // This will throw an error if the URL is invalid
    } catch (_) { //
        showAdminStatus("Invalid URL format. Please enter a valid URL starting with http:// or https://", true); //
        return; //
    }

    const linkData = { //
        label: label, //
        url: url, //
        order: order, //
        createdAt: serverTimestamp() //
    };

    showAdminStatus("Adding useful link..."); //
    try { //
        const docRef = await addDoc(usefulLinksCollectionRef, linkData); //
        console.log("Useful link added with ID:", docRef.id); //
        // await updateMetadataTimestamp('usefulLinks'); // Optional: if tracking metadata
        showAdminStatus("Useful link added successfully.", false); //
        addUsefulLinkForm.reset(); // Reset the form
        loadUsefulLinksAdmin(); // Reload the list

    } catch (error) { //
        console.error("Error adding useful link:", error); //
        showAdminStatus(`Error adding useful link: ${error.message}`, true); //
    }
}

// *** Function to Handle Deleting a Useful Link ***
async function handleDeleteUsefulLink(docId, listItemElement) { //
    if (!confirm("Are you sure you want to permanently delete this useful link?")) { //
        return; //
    }

    showAdminStatus("Deleting useful link..."); //
    try { //
        await deleteDoc(doc(db, 'useful_links', docId)); //
        // await updateMetadataTimestamp('usefulLinks'); // Optional
        showAdminStatus("Useful link deleted successfully.", false); //
        loadUsefulLinksAdmin(); // Reload list is simplest

    } catch (error) { //
        console.error(`Error deleting useful link (ID: ${docId}):`, error); //
        showAdminStatus(`Error deleting useful link: ${error.message}`, true); //
    }
}


// *** Function to Open and Populate the Edit Useful Link Modal ***
function openEditUsefulLinkModal(docId) { //
    if (!editUsefulLinkModal || !editUsefulLinkForm) { //
        console.error("Edit useful link modal elements not found."); //
        showAdminStatus("UI Error: Cannot open edit form.", true); //
        return; //
    }

    const docRef = doc(db, 'useful_links', docId); //
    showEditLinkStatus("Loading link data..."); // Show status inside modal

    getDoc(docRef).then(docSnap => { //
        if (docSnap.exists()) { //
            const data = docSnap.data(); //
            editUsefulLinkForm.setAttribute('data-doc-id', docId); // Store doc ID on the form
            if (editLinkLabelInput) editLinkLabelInput.value = data.label || ''; //
            if (editLinkUrlInput) editLinkUrlInput.value = data.url || ''; //
            if (editLinkOrderInput) editLinkOrderInput.value = data.order ?? ''; //

            editUsefulLinkModal.style.display = 'block'; //
            showEditLinkStatus(""); // Clear loading message
        } else { //
            showAdminStatus("Error: Could not load link data for editing.", true); //
             showEditLinkStatus("Error: Link not found.", true); // Show error inside modal
        }
    }).catch(error => { //
        console.error("Error getting link document for edit:", error); //
        showAdminStatus(`Error loading link data: ${error.message}`, true); //
        showEditLinkStatus(`Error: ${error.message}`, true); //
    });
}

// *** Function to Close the Edit Useful Link Modal ***
function closeEditUsefulLinkModal() { //
    if (editUsefulLinkModal) editUsefulLinkModal.style.display = 'none'; //
    if (editUsefulLinkForm) editUsefulLinkForm.reset(); //
    editUsefulLinkForm?.removeAttribute('data-doc-id'); //
    if (editLinkStatusMessage) editLinkStatusMessage.textContent = ''; // Clear status message inside modal
}

// --- Function to Handle Updating a Useful Link (with DETAILED Logging) ---
    async function handleUpdateUsefulLink(event) {
        event.preventDefault();
        if (!editUsefulLinkForm) return;
        const docId = editUsefulLinkForm.getAttribute('data-doc-id');
        if (!docId) { showEditLinkStatus("Error: Missing document ID...", true); return; }
        console.log("Attempting to update useful link (detailed log):", docId);

        // 1. Get NEW data from form
        const label = editLinkLabelInput?.value.trim();
        const url = editLinkUrlInput?.value.trim();
        const orderStr = editLinkOrderInput?.value.trim();
        const order = parseInt(orderStr);

        if (!label || !url || !orderStr || isNaN(order) || order < 0) { showEditLinkStatus("Invalid input...", true); return; }
        try { new URL(url); } catch (_) { showEditLinkStatus("Invalid URL format.", true); return; }

        const newDataFromForm = { label: label, url: url, order: order };

        showEditLinkStatus("Saving changes...");
        const docRef = doc(db, 'useful_links', docId); // Define once

        try {
            // 2. Get OLD data BEFORE saving
            let oldData = {};
            const oldDataSnap = await getDoc(docRef);
            if (oldDataSnap.exists()) { oldData = oldDataSnap.data(); }

            // 3. Save NEW data
            await updateDoc(docRef, { ...newDataFromForm, lastModified: serverTimestamp() });
            console.log("Useful link update successful:", docId);

            // 4. Compare and find changes
            const changes = {};
            let hasChanges = false;
            for (const key in newDataFromForm) {
                if (oldData[key] !== newDataFromForm[key]) {
                    changes[key] = { to: newDataFromForm[key] };
                    hasChanges = true;
                }
            }

            // 5. Log ONLY actual changes
            if (hasChanges) {
                 console.log("DEBUG: Detected useful link changes:", changes);
                 if (typeof logAdminActivity === 'function') {
                    logAdminActivity('USEFUL_LINK_UPDATE', { id: docId, label: label, changes: changes });
                 } else { console.error("logAdminActivity function not found!");}
            } else {
                 console.log("DEBUG: Useful link update saved, but no values changed.");
            }

            showAdminStatus("Useful link updated successfully.", false);
            closeEditUsefulLinkModal();
            loadUsefulLinksAdmin();

        } catch (error) {
            console.error(`Error updating useful link (ID: ${docId}):`, error);
            showEditLinkStatus(`Error saving: ${error.message}`, true);
            showAdminStatus(`Error updating useful link: ${error.message}`, true);
        }
    }

// ========================================================
    // START: All Social Link Functions (Place INSIDE DOMContentLoaded)
    // ========================================================

    /**
     * Renders a single Social Link item in the admin list view.
     */
    function renderSocialLinkAdminListItem(container, docId, label, url, order, deleteHandler, editHandler) {
       if (!container) { console.warn("Social link list container missing during render."); return; }
       const itemDiv = document.createElement('div');
       itemDiv.className = 'list-item-admin';
       itemDiv.setAttribute('data-id', docId);
       let displayUrl = url || 'N/A'; let visitUrl = '#';
       try {
           if (url && (url.startsWith('http://') || url.startsWith('https://'))) { visitUrl = new URL(url).href; }
           else if (url) { visitUrl = `https://${url}`; try { new URL(visitUrl); } catch { visitUrl = '#'; displayUrl += " (Invalid URL)"; } }
       } catch (e) { console.warn(`Invalid URL skipped for visit button: ${url}`); displayUrl += " (Invalid URL)"; visitUrl = '#'; }

       itemDiv.innerHTML = `
           <div class="item-content"><div class="item-details">
               <strong>${label || 'N/A'}</strong><span>(${displayUrl})</span><small>Order: ${order ?? 'N/A'}</small>
           </div></div>
           <div class="item-actions">
               <a href="${visitUrl}" target="_blank" rel="noopener noreferrer" class="direct-link small-button" title="Visit Link" ${visitUrl === '#' ? 'style="pointer-events: none; opacity: 0.5;"' : ''}>
                   <i class="fas fa-external-link-alt"></i> Visit</a>
               <button type="button" class="edit-button small-button">Edit</button>
               <button type="button" class="delete-button small-button">Delete</button>
           </div>`;

       const editButton = itemDiv.querySelector('.edit-button');
       if (editButton && typeof editHandler === 'function') { editButton.addEventListener('click', () => editHandler(docId)); }
       else if (editButton) { console.warn("Edit handler missing for social link:", docId); editButton.disabled = true; }

       const deleteButton = itemDiv.querySelector('.delete-button');
       if (deleteButton && typeof deleteHandler === 'function') { deleteButton.addEventListener('click', () => deleteHandler(docId, itemDiv)); }
       else if (deleteButton) { console.warn("Delete handler missing for social link:", docId); deleteButton.disabled = true; }

       container.appendChild(itemDiv);
   }

    /**
     * Loads social links from Firestore, stores them, and triggers display.
     */
    async function loadSocialLinksAdmin() {
        // Re-select elements inside function for safety
        const listContainer = document.getElementById('social-links-list-admin');
        const countElement = document.getElementById('social-links-count');
        if (!listContainer) { console.error("Social links list container missing."); return; }
        if (countElement) countElement.textContent = '';
        listContainer.innerHTML = `<p>Loading social links...</p>`;
        allSocialLinks = []; // Clear global array

        try {
            const linkQuery = query(socialLinksCollectionRef, orderBy("order", "asc"));
            const querySnapshot = await getDocs(linkQuery);
            querySnapshot.forEach((doc) => { allSocialLinks.push({ id: doc.id, ...doc.data() }); });
            console.log(`Stored ${allSocialLinks.length} social links.`);
            displayFilteredSocialLinks(); // Call the filter function
        } catch (error) {
            console.error("Error loading social links:", error);
            let errorMsg = "Error loading social links.";
            if (error.code === 'failed-precondition') { errorMsg = "Error: Missing Firestore index (social_links/order)."; }
            showAdminStatus(errorMsg, true);
            listContainer.innerHTML = `<p class="error">${errorMsg}</p>`;
            if (countElement) countElement.textContent = '(Error)';
        }
    }

    /**
     * Filters and displays the social links based on the search input.
     */
    function displayFilteredSocialLinks() {
        const listContainer = document.getElementById('social-links-list-admin');
        const countElement = document.getElementById('social-links-count');
        const searchInput = document.getElementById('search-social-links');

        if (!listContainer || !searchInput || !countElement) { console.error("Social Links Filter Error: Crucial display elements missing."); if(listContainer) listContainer.innerHTML = `<p class="error">UI Error.</p>`; return; }
        if (typeof allSocialLinks === 'undefined') { console.error("Social Links Filter Error: Data array 'allSocialLinks' is undefined."); listContainer.innerHTML = `<p class="error">Data error.</p>`; if (countElement) countElement.textContent = '(Error)'; return; }

        const searchTerm = searchInput.value.trim().toLowerCase();
        listContainer.innerHTML = '';

        const listToRender = !searchTerm ? allSocialLinks : allSocialLinks.filter(link =>
            (link.label || '').toLowerCase().includes(searchTerm) ||
            (link.url || '').toLowerCase().includes(searchTerm)
        );

        if (listToRender.length > 0) {
            // Check handlers BEFORE loop
            if (typeof renderSocialLinkAdminListItem !== 'function' || typeof handleDeleteSocialLink !== 'function' || typeof openEditSocialLinkModal !== 'function') {
                 console.error("CRITICAL Error: Social link handlers (render, delete, edit) not defined!");
                 listContainer.innerHTML = '<p class="error">Rendering function error.</p>';
                 if (countElement) countElement.textContent = '(Error)';
                 return;
            }
            listToRender.forEach(link => {
                renderSocialLinkAdminListItem(listContainer, link.id, link.label, link.url, link.order, handleDeleteSocialLink, openEditSocialLinkModal);
            });
        } else {
            listContainer.innerHTML = searchTerm ? `<p>No social links found matching "${searchTerm}".</p>` : `<p>No social links found.</p>`;
        }
        if (countElement) { countElement.textContent = `(${listToRender.length})`; }
    }

    /**
     * Handles adding a new social link from the form.
     */
    async function handleAddSocialLink(event) {
        event.preventDefault();
        const form = document.getElementById('add-social-link-form'); // Use local var
        if (!form) { console.error("Add Social Link form not found!"); return; }

        const labelInput = form.querySelector('#social-link-label');
        const urlInput = form.querySelector('#social-link-url');
        const orderInput = form.querySelector('#social-link-order');
        const iconClassInput = form.querySelector('#social-link-icon-class');

        const label = labelInput?.value.trim(); const url = urlInput?.value.trim();
        const orderStr = orderInput?.value.trim(); const order = parseInt(orderStr);
        const iconClassValue = iconClassInput?.value.trim();

        if (!label || !url || !orderStr || isNaN(order) || order < 0) { showAdminStatus("Invalid input: Label, URL, and non-negative Order required.", true); return; }
        try { new URL(url); } catch (_) { showAdminStatus("Invalid URL format.", true); return; }

        const linkData = { label, url, order, createdAt: serverTimestamp() };
        if (iconClassValue) { linkData.iconClass = iconClassValue; }

        showAdminStatus("Adding social link...");
        try {
            const docRef = await addDoc(socialLinksCollectionRef, linkData);
            console.log("Social link added with ID:", docRef.id);
            showAdminStatus("Social link added successfully.", false);
            form.reset();
            loadSocialLinksAdmin();
        } catch (error) {
            console.error("Error adding social link:", error);
            showAdminStatus(`Error adding social link: ${error.message}`, true);
        }
    }

    /**
     * Handles deleting a specified social link.
     */
    async function handleDeleteSocialLink(docId, listItemElement) {
        if (!confirm("Are you sure you want to permanently delete this social link?")) { return; }
        showAdminStatus("Deleting social link...");
        try {
            await deleteDoc(doc(db, 'social_links', docId));
            showAdminStatus("Social link deleted successfully.", false);
            loadSocialLinksAdmin();
        } catch (error) {
            console.error(`Error deleting social link (ID: ${docId}):`, error);
            showAdminStatus(`Error deleting social link: ${error.message}`, true);
        }
    }

    /**
     * Opens and populates the Edit Social Link modal.
     */
    function openEditSocialLinkModal(docId) {
        // Re-select elements inside for safety
        const modal = document.getElementById('edit-social-link-modal');
        const form = document.getElementById('edit-social-link-form');
        const labelInput = document.getElementById('edit-social-link-label');
        const urlInput = document.getElementById('edit-social-link-url');
        const orderInput = document.getElementById('edit-social-link-order');
        const iconInput = document.getElementById('edit-social-link-icon-class');

        if (!modal || !form || !labelInput || !urlInput || !orderInput || !iconInput) {
            console.error("Edit social link modal elements not found.");
            showAdminStatus("UI Error: Cannot open edit form.", true);
            return;
        }
        const docRef = doc(db, 'social_links', docId);
        showEditSocialLinkStatus("Loading link data...");

        getDoc(docRef).then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                form.setAttribute('data-doc-id', docId);
                labelInput.value = data.label || '';
                urlInput.value = data.url || '';
                orderInput.value = data.order ?? '';
                iconInput.value = data.iconClass || ''; // Populate icon class

                modal.style.display = 'block';
                showEditSocialLinkStatus("");
            } else {
                showAdminStatus("Error loading link data (not found).", true);
                showEditSocialLinkStatus("Error: Link not found.", true);
            }
        }).catch(error => {
            console.error("Error getting link document for edit:", error);
            showAdminStatus(`Error loading link data: ${error.message}`, true);
            showEditSocialLinkStatus(`Error: ${error.message}`, true);
        });
    }

    /**
     * Closes the Edit Social Link modal and resets the form.
     */
    function closeEditSocialLinkModal() {
       // Re-select elements inside for safety
       const modal = document.getElementById('edit-social-link-modal');
       const form = document.getElementById('edit-social-link-form');
       const statusMsg = document.getElementById('edit-social-link-status-message');

       if (modal) modal.style.display = 'none';
       if (form) { form.reset(); form.removeAttribute('data-doc-id'); }
       if (statusMsg) statusMsg.textContent = '';
    }

    /**
     * Handles updating a social link from the edit modal form.
     */
    async function handleUpdateSocialLink(event) {
        event.preventDefault();
        const form = document.getElementById('edit-social-link-form'); // Use local var
        if (!form) { console.error("Edit social link form not found!"); return; }
        const docId = form.getAttribute('data-doc-id');
        if (!docId) { showEditSocialLinkStatus("Error: Missing document ID.", true); return; }

        const labelInput = document.getElementById('edit-social-link-label');
        const urlInput = document.getElementById('edit-social-link-url');
        const orderInput = document.getElementById('edit-social-link-order');
        const iconClassInput = document.getElementById('edit-social-link-icon-class');

        const label = labelInput?.value.trim(); const url = urlInput?.value.trim();
        const orderStr = orderInput?.value.trim(); const order = parseInt(orderStr);
        const iconClassValue = iconClassInput?.value.trim();

        if (!label || !url || !orderStr || isNaN(order) || order < 0) { showEditSocialLinkStatus("Invalid input.", true); return; }
        try { new URL(url); } catch (_) { showEditSocialLinkStatus("Invalid URL format.", true); return; }

        const newData = { label, url, order };
        if (iconClassValue) { newData.iconClass = iconClassValue; }
        // else { newData.iconClass = deleteField(); } // Optional: Uncomment to remove field if input is empty

        showEditSocialLinkStatus("Saving changes...");
        const docRef = doc(db, 'social_links', docId);

        try {
            await updateDoc(docRef, { ...newData, lastModified: serverTimestamp() });
            console.log("Social link update successful:", docId);
            // --- Logging (Optional but recommended) ---
            // You can add the detailed logging logic from previous steps here if needed
            // --- End Logging ---
            showAdminStatus("Social link updated successfully.", false);
            closeEditSocialLinkModal();
            loadSocialLinksAdmin();
        } catch (error) {
            console.error(`Error updating social link (ID: ${docId}):`, error);
            showEditSocialLinkStatus(`Error saving: ${error.message}`, true);
            showAdminStatus(`Error updating social link: ${error.message}`, true);
            // Log failure if needed
        }
    }

    // ========================================================
    // END: All Social Link Functions
    // ========================================================

// --- NEW: LOGIC FOR SMART CHECKBOXES ---
function setupLegislationCheckboxLogic() {
    const checkboxes = [
        document.getElementById('status-introduced'),
        document.getElementById('status-passed-house'),
        document.getElementById('status-passed-senate'),
        document.getElementById('status-to-president'),
        document.getElementById('status-became-law')
    ];

    checkboxes.forEach((checkbox, index) => {
        if (!checkbox) return;
        checkbox.addEventListener('change', () => {
            const isChecked = checkbox.checked;
            if (isChecked) {
                // When a box is checked, check all PREVIOUS boxes
                for (let i = 0; i < index; i++) {
                    checkboxes[i].checked = true;
                }
            } else {
                // When a box is unchecked, uncheck all SUBSEQUENT boxes
                for (let i = index + 1; i < checkboxes.length; i++) {
                    checkboxes[i].checked = false;
                }
            }
        });
    });
}
// --- END OF NEW LOGIC ---

async function loadLegislationAdmin() {
    if (!legislationListAdmin) return;
    legislationListAdmin.innerHTML = `<p>Loading items...</p>`;
    try {
        const q = query(legislationCollectionRef, orderBy("order", "asc"));
        const querySnapshot = await getDocs(q);
        const allItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        legislationListAdmin.innerHTML = '';
        if (allItems.length > 0) {
            allItems.forEach(item => renderLegislationAdminListItem(item));
        } else {
            legislationListAdmin.innerHTML = '<p>No bills found.</p>';
        }
        if (legislationCount) legislationCount.textContent = `(${allItems.length})`;
    } catch (error) {
        console.error("Error loading legislation items:", error);
        legislationListAdmin.innerHTML = `<p class="error">Error loading items.</p>`;
    }
}

function renderLegislationAdminListItem(itemData) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'list-item-admin';
    itemDiv.setAttribute('data-id', itemData.id);

    let currentStatus = "Introduced";
    if (itemData.status?.becameLaw) currentStatus = "Became Law";
    else if (itemData.status?.toPresident) currentStatus = "To President";
    else if (itemData.status?.passedSenate) currentStatus = "Passed Senate";
    else if (itemData.status?.passedHouse) currentStatus = "Passed House";

    itemDiv.innerHTML = `
        <div class="item-content">
            <div class="item-details">
                <strong>${itemData.billId || 'N/A'}: ${itemData.title || 'N/A'}</strong>
                <span>Sponsor: ${itemData.sponsor || 'N/A'}</span>
                <small>Current Status: ${currentStatus}</small>
            </div>
        </div>
        <div class="item-actions">
            <button type="button" class="edit-button small-button">Edit</button>
            <button type="button" class="delete-button small-button">Delete</button>
        </div>`;

    itemDiv.querySelector('.edit-button').addEventListener('click', () => populateLegislationForm(itemData));
    itemDiv.querySelector('.delete-button').addEventListener('click', () => handleDeleteLegislation(itemData.id));
    legislationListAdmin.appendChild(itemDiv);
}

function populateLegislationForm(itemData) {
    document.getElementById('legislation-id').value = itemData.id;
    document.getElementById('legislation-bill-id').value = itemData.billId || '';
    document.getElementById('legislation-title').value = itemData.title || '';
    document.getElementById('legislation-sponsor').value = itemData.sponsor || '';
    document.getElementById('legislation-date').value = itemData.date || '';
    document.getElementById('legislation-url').value = itemData.url || '';
    document.getElementById('legislation-description').value = itemData.description || '';
    document.getElementById('legislation-order').value = itemData.order || 0;

    document.getElementById('status-introduced').checked = itemData.status?.introduced || false;
    document.getElementById('status-passed-house').checked = itemData.status?.passedHouse || false;
    document.getElementById('status-passed-senate').checked = itemData.status?.passedSenate || false;
    document.getElementById('status-to-president').checked = itemData.status?.toPresident || false;
    document.getElementById('status-became-law').checked = itemData.status?.becameLaw || false;
    
    window.scrollTo(0, addLegislationForm.offsetTop);
}

function clearLegislationForm() {
    addLegislationForm.reset();
    document.getElementById('legislation-id').value = '';
}

async function handleSaveLegislation(event) {
    event.preventDefault();
    const docId = document.getElementById('legislation-id').value;
    const billId = document.getElementById('legislation-bill-id').value.trim();
    const title = document.getElementById('legislation-title').value.trim();
    
    if (!billId || !title) {
        showAdminStatus("Bill ID and Title are required.", true);
        return;
    }

    const billData = {
        billId: billId,
        title: title,
        sponsor: document.getElementById('legislation-sponsor').value.trim(),
        date: document.getElementById('legislation-date').value,
        url: document.getElementById('legislation-url').value.trim(),
        description: document.getElementById('legislation-description').value.trim(),
        order: parseInt(document.getElementById('legislation-order').value) || 0,
        status: {
            introduced: document.getElementById('status-introduced').checked,
            passedHouse: document.getElementById('status-passed-house').checked,
            passedSenate: document.getElementById('status-passed-senate').checked,
            toPresident: document.getElementById('status-to-president').checked,
            becameLaw: document.getElementById('status-became-law').checked,
        },
        lastUpdatedAt: serverTimestamp()
    };
    
    showAdminStatus(docId ? "Updating bill..." : "Adding bill...");
    try {
        if (docId) {
            await setDoc(doc(db, 'legislation', docId), billData);
            showAdminStatus("Bill updated successfully.", false);
        } else {
            billData.createdAt = serverTimestamp();
            await addDoc(legislationCollectionRef, billData);
            showAdminStatus("Bill added successfully.", false);
        }
        clearLegislationForm();
        loadLegislationAdmin();
    } catch (error) {
        console.error("Error saving bill:", error);
        showAdminStatus(`Error: ${error.message}`, true);
    }
}

async function handleDeleteLegislation(docId) {
    if (!confirm("Are you sure you want to delete this bill? This cannot be undone.")) return;
    showAdminStatus("Deleting bill...");
    try {
        await deleteDoc(doc(db, 'legislation', docId));
        showAdminStatus("Bill deleted successfully.", false);
        loadLegislationAdmin();
    } catch (error) {
        console.error("Error deleting bill:", error);
        showAdminStatus(`Error: ${error.message}`, true);
    }
}

    // Add Shoutout Forms
    if (addShoutoutTiktokForm) { //
        addShoutoutTiktokForm.addEventListener('submit', (e) => { //
            e.preventDefault(); // Prevent default submission
            handleAddShoutout('tiktok', addShoutoutTiktokForm); // Call handler
        });
    }
    if (addShoutoutInstagramForm) { //
        addShoutoutInstagramForm.addEventListener('submit', (e) => { //
            e.preventDefault(); //
            handleAddShoutout('instagram', addShoutoutInstagramForm); //
        });
    }
    if (addShoutoutYoutubeForm) { //
        addShoutoutYoutubeForm.addEventListener('submit', (e) => { //
            e.preventDefault(); //
            handleAddShoutout('youtube', addShoutoutYoutubeForm); //
        });
    }

    // Profile Save Form
    if (profileForm) { //
        profileForm.addEventListener('submit', saveProfileData); // Call handler on submit
    }

    // Edit Shoutout Form (in the modal)
    if (editForm) { //
        editForm.addEventListener('submit', handleUpdateShoutout); // Call handler on submit
    }

    // Maintenance Mode Toggle Listener (with defensive removal)
if (maintenanceModeToggle) {
    console.log("DEBUG: Preparing maintenance mode listener for:", maintenanceModeToggle);

    // Define the handler function separately so we can refer to it
    const handleMaintenanceToggle = (e) => {
        // console.log(`DEBUG: Maintenance 'change' event fired! Checked: ${e.target.checked}`); // You can remove this debug line later
        saveMaintenanceModeStatus(e.target.checked);
    };

    // Remove any potentially existing listener first to prevent duplicates
    maintenanceModeToggle.removeEventListener('change', handleMaintenanceToggle);

    // Add the listener using the named handler function
    maintenanceModeToggle.addEventListener('change', handleMaintenanceToggle);
    console.log("DEBUG: Added/Re-added maintenance mode listener."); // You can remove this debug line later

} else {
    console.log("DEBUG: Maintenance toggle element not found.");
}

    // *** Search Input Event Listeners ***
    if (searchInputTiktok) { //
        searchInputTiktok.addEventListener('input', () => { //
            if (typeof displayFilteredShoutouts === 'function') { //
                displayFilteredShoutouts('tiktok'); // Filter TikTok list as user types
            }
        });
    }
     if (searchInputInstagram) { //
        searchInputInstagram.addEventListener('input', () => { //
            if (typeof displayFilteredShoutouts === 'function') { //
                displayFilteredShoutouts('instagram'); // Filter Instagram list as user types
            }
        });
    }
    if (searchInputYoutube) { //
        searchInputYoutube.addEventListener('input', () => { //
            if (typeof displayFilteredShoutouts === 'function') { //
                displayFilteredShoutouts('youtube'); // Filter YouTube list as user types
            }
        });
    }
    // *** END Search Listeners ***

// --- ADD THESE FUNCTIONS ---

    // Renders the HTML for the president section preview (NO INLINE STYLES)
    function renderPresidentPreview(data) {
        // Use default values if data is missing
        const name = data.name || 'N/A';
        const born = data.born || 'N/A';
        const height = data.height || 'N/A';
        const party = data.party || 'N/A';
        const term = data.term || 'N/A';
        const vp = data.vp || 'N/A';
        const imageUrl = data.imageUrl || 'images/default-president.jpg'; // Use a default image path

        // Construct the HTML using only classes defined in admin.css (or your main css)
        return `
            <section class="president-section">
                <div class="president-info">
                    <img src="${imageUrl}" alt="President ${name}" class="president-photo" onerror="this.src='images/default-president.jpg'; this.alt='Photo Missing';">
                    <div class="president-details">
                        <h3 class="president-name">${name}</h3>
                        <p><strong>Born:</strong> ${born}</p>
                        <p><strong>Height:</strong> ${height}</p>
                        <p><strong>Party:</strong> ${party}</p>
                        <p class="presidential-term"><strong>Term:</strong> ${term}</p>
                        <p><strong>VP:</strong> ${vp}</p>
                    </div>
                </div>
            </section>`;
    }

    // Reads president form inputs and updates the preview area
    function updatePresidentPreview() {
        // Use the previously defined constants for the input elements and preview area
        if (!presidentForm || !presidentPreviewArea) return; // Exit if elements aren't found

        const presidentData = {
            name: presidentNameInput?.value.trim() || "",
            born: presidentBornInput?.value.trim() || "",
            height: presidentHeightInput?.value.trim() || "",
            party: presidentPartyInput?.value.trim() || "",
            term: presidentTermInput?.value.trim() || "",
            vp: presidentVpInput?.value.trim() || "",
            imageUrl: presidentImageUrlInput?.value.trim() || ""
        };

        try {
            // Ensure the rendering function exists before calling it
            if (typeof renderPresidentPreview === 'function') {
                 const previewHTML = renderPresidentPreview(presidentData);
                 presidentPreviewArea.innerHTML = previewHTML;
            } else {
                 console.error("renderPresidentPreview function is not defined!");
                 presidentPreviewArea.innerHTML = '<p class="error"><small>Preview engine error.</small></p>';
            }
        } catch (e) {
            console.error("Error rendering president preview:", e);
            presidentPreviewArea.innerHTML = '<p class="error"><small>Error generating preview.</small></p>';
        }
    }
    // -------------

    // --- ADD THESE FUNCTIONS ---

    // Function to Load President Data into Admin Form
    async function loadPresidentData() {
        // Use the constants defined earlier for the form and input elements
        if (!auth || !auth.currentUser) { console.warn("Auth not ready for loading president data."); return; }
        if (!presidentForm) { console.log("President form element not found."); return; }

        console.log("Attempting to load president data from:", presidentDocRef.path);
        try {
            const docSnap = await getDoc(presidentDocRef); // Use presidentDocRef
            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log("Loaded president data:", data);
                // Populate the form fields
                if(presidentNameInput) presidentNameInput.value = data.name || '';
                if(presidentBornInput) presidentBornInput.value = data.born || '';
                if(presidentHeightInput) presidentHeightInput.value = data.height || '';
                if(presidentPartyInput) presidentPartyInput.value = data.party || '';
                if(presidentTermInput) presidentTermInput.value = data.term || '';
                if(presidentVpInput) presidentVpInput.value = data.vp || '';
                if(presidentImageUrlInput) presidentImageUrlInput.value = data.imageUrl || '';
            } else {
                console.warn(`President document ('${presidentDocRef.path}') not found. Form cleared.`);
                if (presidentForm) presidentForm.reset(); // Clear form if no data
            }
            // Update the preview after loading/clearing data
            if (typeof updatePresidentPreview === 'function') {
                updatePresidentPreview();
            }
        } catch (error) {
            console.error("Error loading president data:", error);
            showPresidentStatus("Error loading president data.", true); // Use the specific status func
            if (presidentForm) presidentForm.reset();
             // Update preview even on error (shows default/empty)
            if (typeof updatePresidentPreview === 'function') {
                updatePresidentPreview();
            }
        }
    }

   // --- Function to Save President Data (with DETAILED Logging) ---
    async function savePresidentData(event) {
        event.preventDefault();
        if (!auth || !auth.currentUser) { showPresidentStatus("Error: Not logged in.", true); return; }
        if (!presidentForm) return;
        console.log("Attempting to save president data (detailed log version)...");

        // 1. Get NEW data from form
        const newDataFromForm = {
            name: presidentNameInput?.value.trim() || "",
            born: presidentBornInput?.value.trim() || "",
            height: presidentHeightInput?.value.trim() || "",
            party: presidentPartyInput?.value.trim() || "",
            term: presidentTermInput?.value.trim() || "",
            vp: presidentVpInput?.value.trim() || "",
            imageUrl: presidentImageUrlInput?.value.trim() || "",
        };

        showPresidentStatus("Saving president info...");
        try {
            // 2. Get OLD data BEFORE saving
            let oldData = {};
            const oldDataSnap = await getDoc(presidentDocRef);
            if (oldDataSnap.exists()) {
                oldData = oldDataSnap.data();
                 console.log("DEBUG: Fetched old president data for comparison:", oldData);
            }

            // 3. Save NEW data
            await setDoc(presidentDocRef, { ...newDataFromForm, lastModified: serverTimestamp() }, { merge: true });
            console.log("President data save successful:", presidentDocRef.path);
            showPresidentStatus("President info updated successfully!", false);

            // 4. Compare old and new
            const changes = {};
            let hasChanges = false;
            for (const key in newDataFromForm) {
                if (oldData[key] !== newDataFromForm[key]) {
                    changes[key] = { to: newDataFromForm[key] };
                    hasChanges = true;
                }
            }

            // 5. Log ONLY actual changes
            if (hasChanges) {
                 console.log("DEBUG: Detected president info changes:", changes);
                 if (typeof logAdminActivity === 'function') {
                     logAdminActivity('UPDATE_PRESIDENT_INFO', { name: newDataFromForm.name, changes: changes });
                 } else { console.error("logAdminActivity function not found!");}
            } else {
                 console.log("DEBUG: President info save submitted, but no values changed.");
            }

        } catch (error) {
            console.error("Error saving president data:", error);
            showPresidentStatus(`Error saving president info: ${error.message}`, true);
        }
    }
    // -------------

     // Attach Event Listeners for President Form Preview and Submission
    if (presidentForm) {
        const presidentPreviewInputs = [
            presidentNameInput, presidentBornInput, presidentHeightInput,
            presidentPartyInput, presidentTermInput, presidentVpInput, presidentImageUrlInput
        ];
        // Add listeners to update preview on input
        presidentPreviewInputs.forEach(inputElement => {
            if (inputElement) {
                inputElement.addEventListener('input', () => {
                    if (typeof updatePresidentPreview === 'function') {
                        updatePresidentPreview();
                    } else {
                        console.error("updatePresidentPreview function is not defined!");
                    }
                });
            }
        });

        // Add listener for form submission (Save)
        presidentForm.addEventListener('submit', savePresidentData);
    }
    // -------------

    async function loadActivityLog() {
    // Ensure necessary DOM elements are defined earlier or get them here
    const logListContainer = document.getElementById('activity-log-list');
    const logCountElement = document.getElementById('activity-log-count');
    const searchInput = document.getElementById('search-activity-log');

    if (!logListContainer || !logCountElement || !searchInput) {
        console.error("Required elements for loadActivityLog are missing.");
        return;
    }

    // Reset search input visually when refreshing
    searchInput.value = '';

    logListContainer.innerHTML = '<p>Loading activity log...</p>';
    logCountElement.textContent = '(...)'; // Indicate loading count
    allActivityLogEntries = []; // Clear global store before fetching

    try {
        // Ensure Firestore functions (collection, query, orderBy, limit, getDocs) are imported
        const logCollectionRef = collection(db, "activity_log");
        const logQuery = query(logCollectionRef, orderBy("timestamp", "desc"), limit(50)); // Load recent 50
        const querySnapshot = await getDocs(logQuery);

        querySnapshot.forEach(doc => {
            allActivityLogEntries.push({ id: doc.id, ...doc.data() });
        });

        console.log(`Loaded ${allActivityLogEntries.length} log entries.`);
        // Call the display function initially (which will show all since search is cleared)
        displayFilteredActivityLog();

    } catch (error) {
        console.error("Error loading activity log:", error);
        logListContainer.innerHTML = '<p class="error">Error loading activity log.</p>';
        logCountElement.textContent = '(Error)';
        // Use showAdminStatus if available and desired
        if (typeof showAdminStatus === 'function') {
             showAdminStatus("Failed to load activity log.", true);
        }
    }
}   

function displayFilteredActivityLog() {
    // Ensure necessary DOM elements are defined earlier or get them here
    const logListContainer = document.getElementById('activity-log-list');
    const searchInput = document.getElementById('search-activity-log');
    const logCountElement = document.getElementById('activity-log-count');

    if (!logListContainer || !searchInput || !logCountElement) {
        console.error("Log display/search elements missing in displayFilteredActivityLog.");
        return;
    }

    const searchTerm = searchInput.value.trim().toLowerCase();
    logListContainer.innerHTML = ''; // Clear previous entries

    const filteredLogs = allActivityLogEntries.filter(log => {
        if (!searchTerm) return true; // Show all if search is empty

        const timestampStr = log.timestamp?.toDate?.().toLocaleString()?.toLowerCase() ?? '';
        const email = (log.adminEmail || '').toLowerCase();
        const action = (log.actionType || '').toLowerCase();
        const details = JSON.stringify(log.details || {}).toLowerCase(); // Search within stringified details

        return email.includes(searchTerm) ||
               action.includes(searchTerm) ||
               details.includes(searchTerm) ||
               timestampStr.includes(searchTerm);
    });

    if (filteredLogs.length === 0) {
        if (searchTerm) {
            logListContainer.innerHTML = `<p>No log entries found matching "${searchTerm}".</p>`;
        } else {
            logListContainer.innerHTML = '<p>No activity log entries found.</p>';
        }
    } else {
        filteredLogs.forEach(logData => {
            if (typeof renderLogEntry === 'function') {
                const entryElement = renderLogEntry(logData);
                logListContainer.appendChild(entryElement);
            } else {
                 console.error("renderLogEntry function is missing!");
                 logListContainer.innerHTML = '<p class="error">Error rendering log entries.</p>';
                 // Break the loop if rendering fails
                 return false;
            }
        });
    }

    // Update count
    logCountElement.textContent = `(${filteredLogs.length})`;
}

    // ========================================
    // == Tech Item Management Functions V2 ===
    // ========================================
    // (Add ALL the Tech functions here: renderTechItemAdminListItem, displayFilteredTechItems, loadTechItemsAdmin,
    //  handleAddTechItem, handleDeleteTechItem, openEditTechItemModal, closeEditTechItemModal, handleUpdateTechItem,
    //  renderTechItemPreview, updateTechItemPreview, attachTechPreviewListeners)

    /** Renders a single tech item in the admin list view */
    function renderTechItemAdminListItem(container, docId, itemData, deleteHandler, editHandler) {
        // ... (function code from previous response) ...
         if (!container) { console.warn("Tech list container missing for render"); return; }
         const itemDiv = document.createElement('div');
         itemDiv.className = 'list-item-admin';
         itemDiv.setAttribute('data-id', docId);
         itemDiv.innerHTML = `
             <div class="item-content">
                 <div class="item-details">
                     <strong>${itemData.name || 'N/A'}</strong>
                     <span>(${itemData.model || 'N/A'})</span>
                     <small>Order: ${itemData.order ?? 'N/A'} | OS: ${itemData.osVersion || '?'}</small>
                 </div>
             </div>
             <div class="item-actions">
                 <button type="button" class="edit-button small-button">Edit</button>
                 <button type="button" class="delete-button small-button">Delete</button>
             </div>`;
         const editButton = itemDiv.querySelector('.edit-button');
         if (editButton) editButton.addEventListener('click', () => editHandler(docId));
         const deleteButton = itemDiv.querySelector('.delete-button');
         if (deleteButton) deleteButton.addEventListener('click', () => deleteHandler(docId, itemDiv));
         container.appendChild(itemDiv);
    }

     /** Filters and displays tech items in the admin list based on search */
    function displayFilteredTechItems() {
        // ... (function code from previous response) ...
         if (!techItemsListAdmin || !searchTechItemsInput || typeof allTechItems === 'undefined') {
             console.error("Tech Items Filter Error: Missing elements/data.");
             if(techItemsListAdmin) techItemsListAdmin.innerHTML = `<p class="error">Error displaying tech list.</p>`;
             return;
         }
         const searchTerm = searchTechItemsInput.value.trim().toLowerCase();
         techItemsListAdmin.innerHTML = ''; // Clear list
         const filteredList = allTechItems.filter(item => {
             if (!searchTerm) return true;
             const name = (item.name || '').toLowerCase();
             const model = (item.model || '').toLowerCase();
             return name.includes(searchTerm) || model.includes(searchTerm);
         });
         if (filteredList.length > 0) {
             filteredList.forEach(item => {
                 renderTechItemAdminListItem(techItemsListAdmin, item.id, item, handleDeleteTechItem, openEditTechItemModal);
             });
         } else {
              techItemsListAdmin.innerHTML = searchTerm ? `<p>No tech items found matching "${searchTerm}".</p>` : '<p>No tech items added yet.</p>';
         }
         if (techItemsCount) { techItemsCount.textContent = `(${filteredList.length})`; }
    }

    /** Loads all tech items from Firestore, stores them globally, and triggers display */
    async function loadTechItemsAdmin() {
        // ... (function code from previous response) ...
         if (!techItemsListAdmin) { console.error("Tech items list container element missing."); return; }
         console.log("Loading tech items for admin...");
         if (techItemsCount) techItemsCount.textContent = '(...)'; // Indicate loading count
         techItemsListAdmin.innerHTML = `<p>Loading tech items...</p>`; // Loading message
         allTechItems = []; // Clear global array before fetching
         try {
             const techQuery = query(techItemsCollectionRef, orderBy("order", "asc")); // Order by display order
             const querySnapshot = await getDocs(techQuery);
             querySnapshot.forEach((doc) => {
                 allTechItems.push({ id: doc.id, ...doc.data() }); // Store ID with data
             });
             console.log(`Loaded ${allTechItems.length} tech items.`);
             displayFilteredTechItems(); // Initial display
         } catch (error) {
             console.error("Error loading tech items:", error);
              let errorMsg = "Error loading tech items.";
              if (error.code === 'failed-precondition') {
                  errorMsg = "Error: Missing Firestore index for tech items (order). Check console (F12) for link to create it.";
                  showAdminStatus(errorMsg, true);
              } else {
                  showAdminStatus(errorMsg + `: ${error.message}`, true);
              }
             techItemsListAdmin.innerHTML = `<p class="error">${errorMsg}</p>`;
             if (techItemsCount) techItemsCount.textContent = '(Error)';
         }
    }

    /** Handles adding a new tech item via the form */
    async function handleAddTechItem(event) {
        // ... (function code from previous response, INCLUDING activity log) ...
        event.preventDefault();
        if (!addTechItemForm) { console.error("Add tech form not found"); return; }
        const techData = {};
        const inputs = addTechItemForm.querySelectorAll('input[name], select[name], textarea[name]');
        let isValid = true;
        inputs.forEach(input => {
             const name = input.name; let value = input.value.trim();
             if (input.type === 'number') { value = input.value === '' ? null : parseFloat(input.value); if (input.value !== '' && isNaN(value)) { value = null; if (input.name === 'order' || input.name === 'batteryHealth' || input.name === 'batteryCycles') { showAdminStatus(`Invalid number entered for ${name}.`, true); isValid = false; } } else if (value !== null && value < 0 && (input.name === 'order' || input.name === 'batteryHealth' || input.name === 'batteryCycles')) { showAdminStatus(`${name} cannot be negative.`, true); isValid = false; } }
             techData[name] = value === '' ? null : value;
         });
         if (!techData.name || techData.order === null || techData.order < 0 || isNaN(techData.order)) { showAdminStatus("Device Name and a valid non-negative Order are required.", true); isValid = false; }
         if (!isValid) return;
         techData.createdAt = serverTimestamp();
         showAdminStatus("Adding tech item...");
         try {
             const docRef = await addDoc(techItemsCollectionRef, techData);
             console.log("Tech item added with ID:", docRef.id);
              if (typeof logAdminActivity === 'function') { logAdminActivity('TECH_ITEM_ADD', { name: techData.name, id: docRef.id }); } else { console.warn("logAdminActivity function not found!"); }
             showAdminStatus("Tech item added successfully.", false);
             addTechItemForm.reset();
             if (addTechItemPreview) { addTechItemPreview.innerHTML = '<p><small>Preview will appear here as you type.</small></p>'; }
             loadTechItemsAdmin();
         } catch (error) { console.error("Error adding tech item:", error); showAdminStatus(`Error adding tech item: ${error.message}`, true); }
    }

     /** Handles deleting a specified tech item */
    async function handleDeleteTechItem(docId, listItemElement) {
        // ... (function code from previous response, INCLUDING activity log) ...
        if (!confirm("Are you sure you want to permanently delete this tech item? This action cannot be undone.")) return;
         showAdminStatus("Deleting tech item...");
         let itemNameToLog = 'Unknown Item';
         try {
              const itemSnap = await getDoc(doc(db, 'tech_items', docId));
              if (itemSnap.exists()) itemNameToLog = itemSnap.data().name || 'Unknown Item';
             await deleteDoc(doc(db, 'tech_items', docId));
              if (typeof logAdminActivity === 'function') { logAdminActivity('TECH_ITEM_DELETE', { name: itemNameToLog, id: docId }); } else { console.warn("logAdminActivity function not found!"); }
             showAdminStatus("Tech item deleted successfully.", false);
             loadTechItemsAdmin();
         } catch (error) {
             console.error(`Error deleting tech item (ID: ${docId}):`, error);
              if (typeof logAdminActivity === 'function') { logAdminActivity('TECH_ITEM_DELETE_FAILED', { name: itemNameToLog, id: docId, error: error.message }); }
             showAdminStatus(`Error deleting tech item: ${error.message}`, true);
         }
    }

    /** Opens the Edit Tech Item modal and populates it with data */
    async function openEditTechItemModal(docId) {
        // ... (function code from previous response, INCLUDING triggering preview/listener attach) ...
         if (!editTechItemModal || !editTechItemForm) { console.error("Edit tech item modal elements not found."); showAdminStatus("UI Error: Cannot open edit form.", true); return; }
         showEditTechItemStatus("Loading item data...");
         if(editTechItemPreview) editTechItemPreview.innerHTML = '<p><small>Loading preview...</small></p>';
         try {
             const docRef = doc(db, 'tech_items', docId); const docSnap = await getDoc(docRef);
             if (docSnap.exists()) {
                 const data = docSnap.data(); editTechItemForm.setAttribute('data-doc-id', docId);
                 const inputs = editTechItemForm.querySelectorAll('input[name], select[name], textarea[name]');
                 inputs.forEach(input => { const name = input.name; if (data.hasOwnProperty(name)) { input.value = data[name] ?? ''; } else { input.value = ''; } });
                 editTechItemModal.style.display = 'block'; showEditTechItemStatus("");
                 updateTechItemPreview('edit'); attachTechPreviewListeners(editTechItemForm, 'edit');
             } else { showAdminStatus("Error: Could not load tech item data for editing (not found).", true); showEditTechItemStatus("Error: Item not found.", true); if(editTechItemPreview) editTechItemPreview.innerHTML = '<p class="error"><small>Item not found.</small></p>'; }
         } catch (error) { console.error("Error getting tech item document for edit:", error); showAdminStatus(`Error loading tech item data: ${error.message}`, true); showEditTechItemStatus(`Error: ${error.message}`, true); if(editTechItemPreview) editTechItemPreview.innerHTML = `<p class="error"><small>Error loading preview: ${error.message}</small></p>`; }
    }

     /** Closes the Edit Tech Item modal */
    function closeEditTechItemModal() {
        // ... (function code from previous response, INCLUDING resetting preview) ...
         if (editTechItemModal) editTechItemModal.style.display = 'none'; if (editTechItemForm) editTechItemForm.reset(); editTechItemForm?.removeAttribute('data-doc-id'); if (editTechStatusMessage) editTechStatusMessage.textContent = ''; if (editTechItemPreview) { editTechItemPreview.innerHTML = '<p><small>Preview will load when modal opens.</small></p>'; }
    }

     /** Handles updating a tech item from the edit modal */
    async function handleUpdateTechItem(event) {
        // ... (function code from previous response, INCLUDING activity log) ...
         event.preventDefault(); if (!editTechItemForm) {console.error("Edit tech form not found"); return;} const docId = editTechItemForm.getAttribute('data-doc-id'); if (!docId) { showEditTechItemStatus("Error: Missing document ID. Cannot save.", true); return; }
         const updatedData = {}; const inputs = editTechItemForm.querySelectorAll('input[name], select[name], textarea[name]'); let isValid = true; let techNameForLog = '';
          inputs.forEach(input => { const name = input.name; let value = input.value.trim(); if (input.type === 'number') { value = input.value === '' ? null : parseFloat(input.value); if (input.value !== '' && isNaN(value)) { value = null; if (input.name === 'order' || input.name === 'batteryHealth' || input.name === 'batteryCycles') { showEditTechItemStatus(`Invalid number entered for ${name}.`, true); isValid = false; } } else if (value !== null && value < 0 && (input.name === 'order' || input.name === 'batteryHealth' || input.name === 'batteryCycles')) { showEditTechItemStatus(`${name} cannot be negative.`, true); isValid = false; } } updatedData[name] = value === '' ? null : value; if (name === 'name') techNameForLog = value; });
          if (!updatedData.name || updatedData.order === null || updatedData.order < 0 || isNaN(updatedData.order)) { showEditTechItemStatus("Device Name and a valid non-negative Order are required.", true); isValid = false; } if (!isValid) return;
         updatedData.lastModified = serverTimestamp();
         showEditTechItemStatus("Saving changes...");
         try {
              const docRef = doc(db, 'tech_items', docId); let oldData = {}; const oldDataSnap = await getDoc(docRef); if (oldDataSnap.exists()) oldData = oldDataSnap.data();
             await updateDoc(docRef, updatedData);
              const changes = {}; let hasChanges = false;
              for (const key in updatedData) { if (key !== 'lastModified' && oldData[key] !== updatedData[key]) { changes[key] = { from: oldData[key] ?? null, to: updatedData[key] }; hasChanges = true; } }
              if (hasChanges && typeof logAdminActivity === 'function') { logAdminActivity('TECH_ITEM_UPDATE', { name: techNameForLog, id: docId, changes: changes }); } else if (hasChanges) { console.warn("logAdminActivity function not found!"); } else { console.log("Tech item updated, but no data fields changed value."); }
             showAdminStatus("Tech item updated successfully.", false); closeEditTechItemModal(); loadTechItemsAdmin();
         } catch (error) { console.error(`Error updating tech item (ID: ${docId}):`, error); showEditTechItemStatus(`Error saving: ${error.message}`, true); if (typeof logAdminActivity === 'function') { logAdminActivity('TECH_ITEM_UPDATE_FAILED', { name: techNameForLog, id: docId, error: error.message }); } }
    }

    // --- Tech Preview Rendering Functions ---
     /** Generates HTML for the tech item preview based on data object */
     function renderTechItemPreview(data) {
        // ... (function code from previous response) ...
         const name = data.name || 'Device Name'; const model = data.model || ''; const iconClass = data.iconClass || 'fas fa-question-circle'; const material = data.material || ''; const storage = data.storage || ''; const batteryCapacity = data.batteryCapacity || ''; const color = data.color || ''; const price = data.price ? `$${data.price}` : ''; const dateReleased = data.dateReleased || ''; const dateBought = data.dateBought || ''; const osVersion = data.osVersion || ''; const batteryHealth = data.batteryHealth !== null && !isNaN(data.batteryHealth) ? parseInt(data.batteryHealth, 10) : null; const batteryCycles = data.batteryCycles !== null && !isNaN(data.batteryCycles) ? data.batteryCycles : null; let batteryHtml = ''; if (batteryHealth !== null) { let batteryClass = ''; if (batteryHealth <= 20) batteryClass = 'critical'; else if (batteryHealth <= 50) batteryClass = 'low-power'; batteryHtml = `<div class="tech-detail"><i class="fas fa-heart"></i><span>Battery Health:</span></div><div class="battery-container"><div class="battery-icon ${batteryClass}"><div class="battery-level" style="width: ${batteryHealth}%;"></div><div class="battery-percentage">${batteryHealth}%</div></div></div>`; } let cyclesHtml = ''; if (batteryCycles !== null) { cyclesHtml = `<div class="tech-detail"><i class="fas fa-sync"></i><span>Battery Charge Cycles:</span> ${batteryCycles}</div>`; } return `<div class="tech-item"><h3><i class="${iconClass}"></i> ${name}</h3> ${model ? `<div class="tech-detail"><i class="fas fa-info-circle"></i><span>Model:</span> ${model}</div>` : ''} ${material ? `<div class="tech-detail"><i class="fas fa-layer-group"></i><span>Material:</span> ${material}</div>` : ''} ${storage ? `<div class="tech-detail"><i class="fas fa-hdd"></i><span>Storage:</span> ${storage}</div>` : ''} ${batteryCapacity ? `<div class="tech-detail"><i class="fas fa-battery-full"></i><span>Battery Capacity:</span> ${batteryCapacity}</div>` : ''} ${color ? `<div class="tech-detail"><i class="fas fa-palette"></i><span>Color:</span> ${color}</div>` : ''} ${price ? `<div class="tech-detail"><i class="fas fa-tag"></i><span>Price:</span> ${price}</div>` : ''} ${dateReleased ? `<div class="tech-detail"><i class="fas fa-calendar-plus"></i><span>Date Released:</span> ${dateReleased}</div>` : ''} ${dateBought ? `<div class="tech-detail"><i class="fas fa-shopping-cart"></i><span>Date Bought:</span> ${dateBought}</div>` : ''} ${osVersion ? `<div class="tech-detail"><i class="fab fa-apple"></i><span>OS Version:</span> ${osVersion}</div>` : ''} ${batteryHtml} ${cyclesHtml} </div>`;
     }

     /** Reads form data and updates the corresponding tech preview area */
     function updateTechItemPreview(formType) {
         // ... (function code from previous response) ...
          let formElement; let previewElement; if (formType === 'add') { formElement = addTechItemForm; previewElement = addTechItemPreview; } else if (formType === 'edit') { formElement = editTechItemForm; previewElement = editTechItemPreview; } else { return; } if (!formElement || !previewElement) { return; } const techData = {}; const inputs = formElement.querySelectorAll('input[name], select[name], textarea[name]'); inputs.forEach(input => { const name = input.name; let value = input.value.trim(); if (input.type === 'number') { value = input.value === '' ? null : parseFloat(input.value); if (isNaN(value)) value = null; } techData[name] = value === '' ? null : value; }); try { const previewHTML = renderTechItemPreview(techData); previewElement.innerHTML = previewHTML; } catch (e) { console.error("Error rendering tech preview:", e); previewElement.innerHTML = '<p class="error"><small>Error generating preview.</small></p>'; }
     }

     /** Attaches input/change listeners to tech form inputs to trigger preview updates */
     function attachTechPreviewListeners(formElement, formType) {
         // ... (function code from previous response) ...
          if (!formElement) return; const inputs = formElement.querySelectorAll('input[name], select[name], textarea[name]'); console.log(`Attaching preview listeners to ${inputs.length} inputs for ${formType} tech form.`); inputs.forEach(input => { const eventType = (input.type === 'checkbox' || input.type === 'select-one') ? 'change' : 'input'; const listenerFlag = `__techPreviewListener_${eventType}`; if (!input[listenerFlag]) { input.addEventListener(eventType, () => { updateTechItemPreview(formType); }); input[listenerFlag] = true; } });
     }


    // ==================================
    // == END Tech Item Functions =======
    // ==================================


    // --- *** Event Listener for Saving ONLY Countdown Settings (WITH EXTRA LOGGING) *** ---
    if (saveCountdownSettingsButton) {
        saveCountdownSettingsButton.addEventListener('click', async () => {
            // --- LOG 1: Button Clicked ---
            console.log(">>> SAVE COUNTDOWN BUTTON CLICKED at", new Date().toLocaleTimeString());

            // Check required elements exist first
            if (!countdownTitleInput || !countdownDatetimeInput || !countdownExpiredMessageInput || !settingsStatusMessage) {
                 console.error(">>> ERROR: Cannot save - one or more countdown input elements are missing!");
                 showSettingsStatus("Error: Page structure problem. Cannot save countdown.", true);
                 return;
             }
            if (!profileDocRef) {
                 console.error(">>> ERROR: profileDocRef not defined. Cannot save countdown settings.");
                 showSettingsStatus("Error: Config reference missing.", true);
                 return;
            }

            // --- Read values ---
            const title = countdownTitleInput.value.trim();
            const dateTimeString = countdownDatetimeInput.value.trim();
            const expiredMessage = countdownExpiredMessageInput.value.trim();
            console.log(`>>> Read Values: Title='${title}', DateTime='${dateTimeString}', ExpiredMsg='${expiredMessage}'`);

            showSettingsStatus("Saving countdown settings...", false);

            // Prepare data object
            const updateData = {
                countdownTitle: title,
                countdownExpiredMessage: expiredMessage
                // countdownTargetDate added below conditionally
            };
            let isValid = true;
            let targetTimestamp = null;

            // --- Handle Date/Time conversion ---
            if (dateTimeString) {
                console.log(">>> Processing DateTime String...");
                if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dateTimeString)) {
                     console.error(">>> ERROR: Invalid DateTime format.");
                     showSettingsStatus('Invalid Date/Time format. Use YYYY-MM-DDTHH:MM:SS', true);
                     isValid = false;
                } else {
                    try {
                        const localDate = new Date(dateTimeString);
                        if (isNaN(localDate.getTime())) {
                            throw new Error("Invalid date or time value resulted in an invalid Date object.");
                        }
                        // *** Ensure Timestamp is imported: import { Timestamp } from '...' ***
                        targetTimestamp = Timestamp.fromDate(localDate);
                        updateData.countdownTargetDate = targetTimestamp;
                        console.log(">>> SUCCESS: Converted input string to Timestamp:", targetTimestamp);
                    } catch (error) {
                        console.error(">>> ERROR: Parsing date/time input:", error);
                        let errorText = `Error parsing date/time: ${error.message}`;
                         if (error instanceof ReferenceError && error.message.includes("Timestamp is not defined")) {
                            errorText += " (Import Timestamp from Firestore library at top of admin.js!)";
                         }
                        showSettingsStatus(errorText, true);
                        isValid = false;
                    }
                }
            } else {
                 updateData.countdownTargetDate = null; // Set date to null if input is empty
                 console.log(">>> DateTime field empty. Setting target date to null.");
            }

            if (!isValid) {
                console.log(">>> Validation failed. Aborting save.");
                return; // Stop if validation failed
            }

            // --- Update Firestore Document ---
            try {
                // --- LOG 2: Data being sent ---
                console.log(">>> PRE-UPDATE CHECK <<<");
                console.log(">>> profileDocRef Path:", profileDocRef.path);
                console.log(">>> Data being sent:", JSON.stringify(updateData, null, 2)); // Stringify for clear view

                await updateDoc(profileDocRef, updateData); // Attempt the update

                // --- LOG 3: Success ---
                console.log(">>> updateDoc SUCCEEDED <<<");
                showSettingsStatus("Countdown settings saved successfully!", false);
                console.log("Countdown settings updated in Firestore successfully.");

                // Log activity
                 if (typeof logAdminActivity === 'function') {
                      logAdminActivity('UPDATE_COUNTDOWN_SETTINGS', { title: title, targetSet: !!updateData.countdownTargetDate, messageSet: !!expiredMessage });
                 } else { console.warn("logAdminActivity function not found!"); }

            } catch (error) {
                 // --- LOG 4: Failure ---
                console.error(">>> updateDoc FAILED <<<", error);
                showSettingsStatus(`Error saving countdown settings: ${error.message}`, true);
                 if (typeof logAdminActivity === 'function') {
                      logAdminActivity('UPDATE_COUNTDOWN_SETTINGS_FAILED', { error: error.message });
                 }
            }
        });
    } else {
         console.error("Save Countdown Settings button (#save-countdown-settings-button) not found!");
         if(settingsStatusMessage) { showSettingsStatus("Error: Save Countdown button missing from page.", true); }
    }
    // --- *** END Event Listener with Logging *** ---
    
// --- ADD THIS FUNCTION ---
    // Displays status messages in the president section's status area
    function showPresidentStatus(message, isError = false) {
        if (!presidentStatusMessage) { console.warn("President status message element not found"); showAdminStatus(message, isError); return; } // Fallback to main admin status
        presidentStatusMessage.textContent = message;
        presidentStatusMessage.className = `status-message ${isError ? 'error' : 'success'}`;
        // Clear message after 5 seconds
        setTimeout(() => { if (presidentStatusMessage) { presidentStatusMessage.textContent = ''; presidentStatusMessage.className = 'status-message'; } }, 5000);
    }
    
   // --- Useful Links Event Listeners ---
    if (addUsefulLinkForm) { //
        addUsefulLinkForm.addEventListener('submit', handleAddUsefulLink); //
    }
    if (editUsefulLinkForm) { //
        editUsefulLinkForm.addEventListener('submit', handleUpdateUsefulLink); //
    }
    if (cancelEditLinkButton) { // X close button
        cancelEditLinkButton.addEventListener('click', closeEditUsefulLinkModal); //
    }
    if (cancelEditLinkButtonSecondary) { // Secondary Cancel button
        cancelEditLinkButtonSecondary.addEventListener('click', closeEditUsefulLinkModal); //
    }

   // --- Attach Event Listeners ---
    if (addSocialLinkForm) {
        addSocialLinkForm.addEventListener('submit', handleAddSocialLink);
    }
    if (editSocialLinkForm) {
        editSocialLinkForm.addEventListener('submit', handleUpdateSocialLink);
    }
    if (cancelEditSocialLinkButton) {
        cancelEditSocialLinkButton.addEventListener('click', closeEditSocialLinkModal);
    }
    if (cancelEditSocialLinkButtonSecondary) {
        cancelEditSocialLinkButtonSecondary.addEventListener('click', closeEditSocialLinkModal);
    }
    if (searchInputSocialLinks) {
        searchInputSocialLinks.addEventListener('input', displayFilteredSocialLinks);
    }


    // Function to render a single Disability Link item in the admin list
    function renderDisabilityAdminListItem(container, docId, name, url, order, deleteHandler, editHandler) {
        if (!container) {
             console.warn("Disabilities list container not found during render.");
             return;
        }

        const itemDiv = document.createElement('div');
        itemDiv.className = 'list-item-admin'; // Use the same class as other list items
        itemDiv.setAttribute('data-id', docId);

        // Basic validation for URL before creating the visit link
        let displayUrl = url || 'N/A';
        let visitUrl = '#';
        try {
            if (url) {
                visitUrl = new URL(url).href; // Ensures it's a valid structure
            }
        } catch (e) {
            console.warn(`Invalid URL for disability link ${docId}: ${url}`);
            displayUrl += " (Invalid URL)";
        }

        itemDiv.innerHTML = `
            <div class="item-content">
                <div class="item-details">
                    <strong>${name || 'N/A'}</strong>
                    <span>(${displayUrl})</span>
                    <small>Order: ${order ?? 'N/A'}</small>
                </div>
            </div>
            <div class="item-actions">
                <a href="${visitUrl}" target="_blank" rel="noopener noreferrer" class="direct-link small-button" title="Visit Info Link" ${visitUrl === '#' ? 'style="pointer-events: none; opacity: 0.5;"' : ''}>
                    <i class="fas fa-external-link-alt"></i> Visit
                </a>
                <button type="button" class="edit-button small-button">Edit</button>
                <button type="button" class="delete-button small-button">Delete</button>
            </div>`;

        // Add event listeners for Edit and Delete buttons
        const editButton = itemDiv.querySelector('.edit-button');
        if (editButton) editButton.addEventListener('click', () => editHandler(docId)); // Pass docId to edit handler

        const deleteButton = itemDiv.querySelector('.delete-button');
        if (deleteButton) deleteButton.addEventListener('click', () => deleteHandler(docId, itemDiv)); // Pass docId and the element to delete handler

        container.appendChild(itemDiv);
    }

    // Function to show status messages inside the Edit Disability modal
    function showEditDisabilityStatus(message, isError = false) {
        // Uses the 'editDisabilityStatusMessage' element const defined earlier
        if (!editDisabilityStatusMessage) { console.warn("Edit disability status message element not found"); return; }
        editDisabilityStatusMessage.textContent = message;
        editDisabilityStatusMessage.className = `status-message ${isError ? 'error' : 'success'}`;
        // Clear message after 3 seconds
        setTimeout(() => { if (editDisabilityStatusMessage) { editDisabilityStatusMessage.textContent = ''; editDisabilityStatusMessage.className = 'status-message'; } }, 3000);
    }

    /** Displays status messages in the tech edit modal */
     function showEditTechItemStatus(message, isError = false) {
         if (!editTechStatusMessage) { console.warn("Edit tech status message element not found"); return; }
         editTechStatusMessage.textContent = message;
         editTechStatusMessage.className = `status-message ${isError ? 'error' : 'success'}`;
         if (!isError) setTimeout(() => { if (editTechStatusMessage && editTechStatusMessage.textContent === message) { editTechStatusMessage.textContent = ''; editTechStatusMessage.className = 'status-message'; } }, 3000);
     }

    // *** CORRECTED Function to Load Disabilities ***
async function loadDisabilitiesAdmin() {
    if (!disabilitiesListAdmin) { console.error("Disabilities list container missing."); return; }
    if (disabilitiesCount) disabilitiesCount.textContent = '';
    disabilitiesListAdmin.innerHTML = `<p>Loading disability links...</p>`;
    allDisabilities = []; // Clear the global array

    try {
        const disabilityQuery = query(disabilitiesCollectionRef, orderBy("order", "asc"));
        const querySnapshot = await getDocs(disabilityQuery);

        // Populate the global array
        querySnapshot.forEach((doc) => {
            allDisabilities.push({ id: doc.id, ...doc.data() }); // Store data in the array
        });
        console.log(`Stored ${allDisabilities.length} disability links.`);

        // Call the filter function to display initially (will show all)
        displayFilteredDisabilities();

    } catch (error) {
        console.error("Error loading disabilities:", error);
        let errorMsg = "Error loading disabilities.";
        if (error.code === 'failed-precondition') {
            errorMsg = "Error: Missing Firestore index for disabilities (order).";
            showAdminStatus(errorMsg, true);
        } else {
            showAdminStatus(errorMsg + `: ${error.message}`, true);
        }
        disabilitiesListAdmin.innerHTML = `<p class="error">${errorMsg}</p>`;
        if (disabilitiesCount) disabilitiesCount.textContent = '(Error)';
    }
}

    // Function to Handle Adding a New Disability Link
    async function handleAddDisability(event) {
        event.preventDefault(); // Prevent default form submission
        // Use const defined earlier for the add form
        if (!addDisabilityForm) return;

        // Get values from the add disability form
        const nameInput = addDisabilityForm.querySelector('#disability-name');
        const urlInput = addDisabilityForm.querySelector('#disability-url');
        const orderInput = addDisabilityForm.querySelector('#disability-order');

        const name = nameInput?.value.trim();
        const url = urlInput?.value.trim();
        const orderStr = orderInput?.value.trim();
        const order = parseInt(orderStr);

        // Basic validation
        if (!name || !url || !orderStr || isNaN(order) || order < 0) {
            showAdminStatus("Invalid input for Disability Link. Check required fields and ensure Order is non-negative.", true);
            return;
        }
        // Basic URL validation
        try {
            new URL(url);
        } catch (_) {
            showAdminStatus("Invalid URL format. Please enter a valid URL.", true);
            return;
        }

        const disabilityData = {
            name: name,
            url: url,
            order: order,
            createdAt: serverTimestamp() // Add a timestamp
        };

        showAdminStatus("Adding disability link...");
        try {
            // Use the disabilitiesCollectionRef defined earlier
            const docRef = await addDoc(disabilitiesCollectionRef, disabilityData);
            console.log("Disability link added with ID:", docRef.id);
            showAdminStatus("Disability link added successfully.", false);
            addDisabilityForm.reset(); // Reset the form
            loadDisabilitiesAdmin(); // Reload the list

        } catch (error) {
            console.error("Error adding disability link:", error);
            showAdminStatus(`Error adding disability link: ${error.message}`, true);
        }
    }

    // Function to Handle Deleting a Disability Link
    async function handleDeleteDisability(docId, listItemElement) {
        if (!confirm("Are you sure you want to permanently delete this disability link?")) {
            return; // Do nothing if user cancels
        }

        showAdminStatus("Deleting disability link...");
        try {
             // Use the disabilitiesCollectionRef defined earlier
            await deleteDoc(doc(db, 'disabilities', docId));
            showAdminStatus("Disability link deleted successfully.", false);
            loadDisabilitiesAdmin(); // Reload list is simplest

        } catch (error) {
            console.error(`Error deleting disability link (ID: ${docId}):`, error);
            showAdminStatus(`Error deleting disability link: ${error.message}`, true);
        }
    }

     // Function to Open and Populate the Edit Disability Modal
    function openEditDisabilityModal(docId) {
        // Use consts defined earlier for modal elements
        if (!editDisabilityModal || !editDisabilityForm) {
            console.error("Edit disability modal elements not found.");
            showAdminStatus("UI Error: Cannot open edit form.", true);
            return;
        }

        // Use the disabilitiesCollectionRef defined earlier
        const docRef = doc(db, 'disabilities', docId);
        showEditDisabilityStatus("Loading disability data..."); // Use specific status func

        getDoc(docRef).then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                editDisabilityForm.setAttribute('data-doc-id', docId); // Store doc ID on the form
                // Populate modal inputs using consts defined earlier
                if (editDisabilityNameInput) editDisabilityNameInput.value = data.name || '';
                if (editDisabilityUrlInput) editDisabilityUrlInput.value = data.url || '';
                if (editDisabilityOrderInput) editDisabilityOrderInput.value = data.order ?? '';

                editDisabilityModal.style.display = 'block'; // Show the modal
                showEditDisabilityStatus(""); // Clear loading message
            } else {
                showAdminStatus("Error: Could not load disability data for editing.", true);
                showEditDisabilityStatus("Error: Link not found.", true); // Show error inside modal
            }
        }).catch(error => {
            console.error("Error getting disability document for edit:", error);
            showAdminStatus(`Error loading disability data: ${error.message}`, true);
            showEditDisabilityStatus(`Error: ${error.message}`, true);
        });
    }

    // Function to Close the Edit Disability Modal
    function closeEditDisabilityModal() {
        // Use consts defined earlier
        if (editDisabilityModal) editDisabilityModal.style.display = 'none';
        if (editDisabilityForm) editDisabilityForm.reset();
        editDisabilityForm?.removeAttribute('data-doc-id');
        if (editDisabilityStatusMessage) editDisabilityStatusMessage.textContent = ''; // Clear status message inside modal
    }

    // --- Function to Handle Updating a Disability Link (with DETAILED Logging) ---
    async function handleUpdateDisability(event) {
        event.preventDefault();
        if (!editDisabilityForm) return;
        const docId = editDisabilityForm.getAttribute('data-doc-id');
        if (!docId) { showEditDisabilityStatus("Error: Missing document ID...", true); return; }
        console.log("Attempting to update disability link (detailed log):", docId);

        // 1. Get NEW data from form
        const name = editDisabilityNameInput?.value.trim();
        const url = editDisabilityUrlInput?.value.trim();
        const orderStr = editDisabilityOrderInput?.value.trim();
        const order = parseInt(orderStr);

        if (!name || !url || !orderStr || isNaN(order) || order < 0) { showEditDisabilityStatus("Invalid input...", true); return; }
        try { new URL(url); } catch (_) { showEditDisabilityStatus("Invalid URL format.", true); return; }

        const newDataFromForm = { name: name, url: url, order: order };
        showEditDisabilityStatus("Saving changes...");
        const docRef = doc(db, 'disabilities', docId); // Define once

        try {
            // 2. Get OLD data BEFORE saving
            let oldData = {};
            const oldDataSnap = await getDoc(docRef);
            if (oldDataSnap.exists()) { oldData = oldDataSnap.data(); }

            // 3. Save NEW data
            await updateDoc(docRef, { ...newDataFromForm, lastModified: serverTimestamp() });
            console.log("Disability link update successful:", docId);

            // 4. Compare and find changes
            const changes = {};
            let hasChanges = false;
            for (const key in newDataFromForm) {
                if (oldData[key] !== newDataFromForm[key]) {
                    changes[key] = { to: newDataFromForm[key] };
                    hasChanges = true;
                }
            }

             // 5. Log ONLY actual changes
            if (hasChanges) {
                console.log("DEBUG: Detected disability link changes:", changes);
                 if (typeof logAdminActivity === 'function') {
                    logAdminActivity('DISABILITY_LINK_UPDATE', { id: docId, name: name, changes: changes });
                 } else { console.error("logAdminActivity function not found!");}
            } else {
                 console.log("DEBUG: Disability link update saved, but no values changed.");
            }

            showAdminStatus("Disability link updated successfully.", false);
            closeEditDisabilityModal();
            loadDisabilitiesAdmin();

        } catch (error) {
            console.error(`Error updating disability link (ID: ${docId}):`, error);
            showEditDisabilityStatus(`Error saving: ${error.message}`, true);
            showAdminStatus(`Error updating disability link: ${error.message}`, true);
        }
    }
// --- Attach Event Listeners for Section Forms & Modals ---

    // Profile Save Form
    if (profileForm) { profileForm.addEventListener('submit', saveProfileData); }

    // Maintenance Mode Toggle
    if (maintenanceModeToggle) { maintenanceModeToggle.addEventListener('change', (e) => { saveMaintenanceModeStatus(e.target.checked); }); }

    // Hide TikTok Toggle
    if (hideTikTokSectionToggle) { hideTikTokSectionToggle.addEventListener('change', (e) => { saveHideTikTokSectionStatus(e.target.checked); }); }
    
    // President Form & Preview (Added)
    if (presidentForm) {
        const presidentPreviewInputs = [ presidentNameInput, presidentBornInput, presidentHeightInput, presidentPartyInput, presidentTermInput, presidentVpInput, presidentImageUrlInput ];
        // Add listeners to update preview on input
        presidentPreviewInputs.forEach(inputElement => {
            if (inputElement) {
                inputElement.addEventListener('input', () => {
                    if (typeof updatePresidentPreview === 'function') {
                        updatePresidentPreview();
                    } else { console.error("updatePresidentPreview function missing!"); }
                });
            }
        });
        // Add listener for form submission (Save)
        presidentForm.addEventListener('submit', savePresidentData);
    }

    // Add Shoutout Forms
    if (addShoutoutTiktokForm) { addShoutoutTiktokForm.addEventListener('submit', (e) => { e.preventDefault(); handleAddShoutout('tiktok', addShoutoutTiktokForm); }); }
    if (addShoutoutInstagramForm) { addShoutoutInstagramForm.addEventListener('submit', (e) => { e.preventDefault(); handleAddShoutout('instagram', addShoutoutInstagramForm); }); }
    if (addShoutoutYoutubeForm) { addShoutoutYoutubeForm.addEventListener('submit', (e) => { e.preventDefault(); handleAddShoutout('youtube', addShoutoutYoutubeForm); }); }

    // Edit Shoutout Form (in modal) & Close Button
    if (editForm) { editForm.addEventListener('submit', handleUpdateShoutout); }
    if (cancelEditButton) { cancelEditButton.addEventListener('click', closeEditModal); }

    // --- Tech Management Listeners ---
     if (addTechItemForm) {
        addTechItemForm.addEventListener('submit', handleAddTechItem);
        // Attach preview listeners for the add form on initial load
        attachTechPreviewListeners(addTechItemForm, 'add');
     }
     if (editTechItemForm) {
        editTechItemForm.addEventListener('submit', handleUpdateTechItem);
        // Note: Preview listeners for edit form are attached in openEditTechItemModal
     }
      if (cancelEditTechButton) {
        cancelEditTechButton.addEventListener('click', closeEditTechItemModal);
     }
     if (cancelEditTechButtonSecondary) {
        cancelEditTechButtonSecondary.addEventListener('click', closeEditTechItemModal);
     }
     if (searchTechItemsInput) {
        searchTechItemsInput.addEventListener('input', displayFilteredTechItems);
     }

    // --- Activity Log Listeners ---
    const clearLogBtn = document.getElementById('clear-log-button');
    if (clearLogBtn) {
        clearLogBtn.addEventListener('click', () => { 
            // In a real app, you would have a function here like handleClearActivityLog()
            console.warn("Clear activity log functionality not yet implemented.");
        });
    } else {
        console.warn("Clear log button not found.");
    }

    // Useful Links Forms & Modals
    if (addUsefulLinkForm) { addUsefulLinkForm.addEventListener('submit', handleAddUsefulLink); }
    if (editUsefulLinkForm) { editUsefulLinkForm.addEventListener('submit', handleUpdateUsefulLink); }
    if (cancelEditLinkButton) { cancelEditLinkButton.addEventListener('click', closeEditUsefulLinkModal); }
    if (cancelEditLinkButtonSecondary) { cancelEditLinkButtonSecondary.addEventListener('click', closeEditUsefulLinkModal); }

    // Social Links Forms & Modals
    if (addSocialLinkForm) { addSocialLinkForm.addEventListener('submit', handleAddSocialLink); }
    if (editSocialLinkForm) { editSocialLinkForm.addEventListener('submit', handleUpdateSocialLink); }
    if (cancelEditSocialLinkButton) { cancelEditSocialLinkButton.addEventListener('click', closeEditSocialLinkModal); }
    if (cancelEditSocialLinkButtonSecondary) { cancelEditSocialLinkButtonSecondary.addEventListener('click', closeEditSocialLinkModal); }

    // Disabilities Forms & Modals (Added)
    if (addDisabilityForm) { addDisabilityForm.addEventListener('submit', handleAddDisability); }
    if (editDisabilityForm) { editDisabilityForm.addEventListener('submit', handleUpdateDisability); }
    if (cancelEditDisabilityButton) { cancelEditDisabilityButton.addEventListener('click', closeEditDisabilityModal); }
    if (cancelEditDisabilityButtonSecondary) { cancelEditDisabilityButtonSecondary.addEventListener('click', closeEditDisabilityModal); }


    // --- Attach Event Listeners for Search & Previews ---

    // Search Input Listeners
    if (searchInputTiktok) { searchInputTiktok.addEventListener('input', () => { if (typeof displayFilteredShoutouts === 'function') { displayFilteredShoutouts('tiktok'); } }); }
    if (searchInputInstagram) { searchInputInstagram.addEventListener('input', () => { if (typeof displayFilteredShoutouts === 'function') { displayFilteredShoutouts('instagram'); } }); }
    if (searchInputYoutube) { searchInputYoutube.addEventListener('input', () => { if (typeof displayFilteredShoutouts === 'function') { displayFilteredShoutouts('youtube'); } }); }

    // Helper function to attach preview listeners (Shoutouts)
    function attachPreviewListeners(formElement, platform, formType) { if (!formElement) return; const previewInputs = [ 'username', 'nickname', 'bio', 'profilePic', 'isVerified', 'followers', 'subscribers', 'coverPhoto' ]; previewInputs.forEach(name => { const inputElement = formElement.querySelector(`[name="${name}"]`); if (inputElement) { const eventType = (inputElement.type === 'checkbox') ? 'change' : 'input'; inputElement.addEventListener(eventType, () => { if (typeof updateShoutoutPreview === 'function') { updateShoutoutPreview(formType, platform); } else { console.error("updateShoutoutPreview missing!"); } }); } }); }
    // Attach shoutout preview listeners
    if (addShoutoutTiktokForm) attachPreviewListeners(addShoutoutTiktokForm, 'tiktok', 'add');
    if (addShoutoutInstagramForm) attachPreviewListeners(addShoutoutInstagramForm, 'instagram', 'add');
    if (addShoutoutYoutubeForm) attachPreviewListeners(addShoutoutYoutubeForm, 'youtube', 'add');
    if (editForm) { const editPreviewInputs = [ editUsernameInput, editNicknameInput, editBioInput, editProfilePicInput, editIsVerifiedInput, editFollowersInput, editSubscribersInput, editCoverPhotoInput ]; editPreviewInputs.forEach(el => { if (el) { const eventType = (el.type === 'checkbox') ? 'change' : 'input'; el.addEventListener(eventType, () => { const currentPlatform = editForm.getAttribute('data-platform'); if (currentPlatform && typeof updateShoutoutPreview === 'function') { updateShoutoutPreview('edit', currentPlatform); } else if (!currentPlatform) { console.warn("Edit form platform not set."); } else { console.error("updateShoutoutPreview missing!"); } }); } }); }

  if (addLegislationForm) {
    addLegislationForm.addEventListener('submit', handleSaveLegislation);
    document.getElementById('clear-legislation-form').addEventListener('click', clearLegislationForm);
    // Initialize the smart checkbox logic
    setupLegislationCheckboxLogic();
}
    
    // Profile Pic URL Preview Listener
    if (profilePicUrlInput && adminPfpPreview) { profilePicUrlInput.addEventListener('input', () => { const url = profilePicUrlInput.value.trim(); if (url) { adminPfpPreview.src = url; adminPfpPreview.style.display = 'inline-block'; } else { adminPfpPreview.style.display = 'none'; } }); adminPfpPreview.onerror = () => { console.warn("Preview image load failed:", adminPfpPreview.src); adminPfpPreview.style.display = 'none'; profilePicUrlInput.classList.add('input-error'); }; profilePicUrlInput.addEventListener('focus', () => { profilePicUrlInput.classList.remove('input-error'); }); }

    // Combined Window Click Listener for Closing Modals
    window.addEventListener('click', (event) => {
        if (event.target === editModal) { closeEditModal(); }
        if (event.target === editUsefulLinkModal) { closeEditUsefulLinkModal(); }
        if (event.target === editSocialLinkModal) { closeEditSocialLinkModal(); }
        if (event.target === editDisabilityModal) { closeEditDisabilityModal(); }
        if (event.target === editTechItemModal) { closeEditTechItemModal(); }
    });

    // ======================================================
    // ===== GLOBAL HANDLERS (THE CORRECT LOCATION) ======
    // ======================================================
    // This section makes functions inside the module accessible to the HTML's onclick attributes.
    // It MUST be INSIDE the DOMContentLoaded listener, after the functions are defined.
    
    // Blog Functions
    window.savePost = savePost;
    window.editPost = editPost;
    window.deletePost = deletePost;

    // Google Sign-In
    window.handleGoogleSignIn = handleGoogleSignIn;

    // You MUST add any other functions called by 'onclick' in your HTML here.
    // For example:
    // window.openEditShoutoutModal = openEditShoutoutModal;
    // window.handleDeleteTechItem = handleDeleteTechItem;


}); // <-- END OF THE DOMContentLoaded LISTENER


// This special handler for Google's library must remain outside and global.
// It calls the `handleGoogleSignIn` function that we made global above.
window.handleCredentialResponse = (response) => {
    if (typeof window.handleGoogleSignIn === 'function') {
        window.handleGoogleSignIn(response);
    } else {
        console.error("Critical Error: handleGoogleSignIn is not globally available for the Google callback.");
    }
};
