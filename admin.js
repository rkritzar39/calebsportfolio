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
    const duration = Math.max(0, Number($("manual-status-duration").value || 0));
    const enabled = !!$("manual-status-enabled").checked;

    const payload = {
      text: text || "",
      icon,
      enabled,
      updated_at: Date.now(),
      persistent: duration === 0,
    };

    if (duration > 0) {
      payload.expiresAt = Date.now() + duration * 60_000;
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

    // ===== Resume Editor =====
    const resumeFormEl = $("resume-form");
    const resumeStatusEl = $("resume-save-status");

    function setResumeStatus(message = "", type = "info") {
      if (!resumeStatusEl) return;
      resumeStatusEl.textContent = message;
      resumeStatusEl.className = `save-status ${type}`.trim();
    }

    function clearResumeContainer(id) {
      const container = $(id);
      if (container) container.innerHTML = "";
    }

    function resumeBtn(text, className, type = "button") {
      const btn = document.createElement("button");
      btn.type = type;
      btn.className = className;
      btn.textContent = text;
      return btn;
    }

    function resumeValue(id) {
      return $(id)?.value.trim() || "";
    }

    function buildResumeContactLine({
      location = "",
      phone = "",
      website = "",
      linkedin = ""
    } = {}) {
      return [location, phone, website, linkedin].filter(Boolean).join(" • ");
    }

    function fillResumeBasicFields(data = {}) {
      if ($("resume-name-input")) $("resume-name-input").value = data.name || "";
      if ($("resume-title-input")) $("resume-title-input").value = data.title || "";
      if ($("resume-location-input")) $("resume-location-input").value = data.location || data.city || "";
      if ($("resume-phone-input")) $("resume-phone-input").value = data.phone || "";
      if ($("resume-email-input")) $("resume-email-input").value = data.email || "";
      if ($("resume-website-input")) $("resume-website-input").value = data.website || "";
      if ($("resume-linkedin-input")) $("resume-linkedin-input").value = data.linkedin || "";
      if ($("resume-summary-input")) $("resume-summary-input").value = data.summary || "";
    }

    function resetResumeBasicFields() {
      [
        "resume-name-input",
        "resume-title-input",
        "resume-location-input",
        "resume-phone-input",
        "resume-email-input",
        "resume-website-input",
        "resume-linkedin-input",
        "resume-summary-input"
      ].forEach((id) => {
        const field = $(id);
        if (field) field.value = "";
      });
    }

    function createResumeSimpleItem(value = "", placeholder = "Enter item") {
      const wrapper = document.createElement("div");
      wrapper.className = "simple-list-item";

      const input = document.createElement("input");
      input.type = "text";
      input.className = "simple-item-input";
      input.placeholder = placeholder;
      input.value = value;

      const removeBtn = resumeBtn("Remove", "danger-btn");
      removeBtn.addEventListener("click", () => wrapper.remove());

      wrapper.appendChild(input);
      wrapper.appendChild(removeBtn);

      return wrapper;
    }

    function addResumeSimpleItem(containerId, value = "", placeholder = "Enter item") {
      const container = $(containerId);
      if (!container) return;
      container.appendChild(createResumeSimpleItem(value, placeholder));
    }

    function collectResumeSimpleList(containerId) {
      const container = $(containerId);
      if (!container) return [];

      return [...container.querySelectorAll(".simple-item-input")]
        .map((input) => input.value.trim())
        .filter(Boolean);
    }

    function createResumeDetailItem(value = "") {
      const wrapper = document.createElement("div");
      wrapper.className = "detail-item";

      const input = document.createElement("input");
      input.type = "text";
      input.className = "detail-input";
      input.placeholder = "Describe a responsibility or achievement";
      input.value = value;

      const removeBtn = resumeBtn("Remove", "danger-btn");
      removeBtn.addEventListener("click", () => wrapper.remove());

      wrapper.appendChild(input);
      wrapper.appendChild(removeBtn);

      return wrapper;
    }

    function createResumeProjectItem(data = {}) {
      const wrapper = document.createElement("div");
      wrapper.className = "project-item";

      wrapper.innerHTML = `
        <div class="project-grid">
          <div class="form-group">
            <label>Project Name</label>
            <input type="text" class="project-name" placeholder="Portfolio Website" />
          </div>

          <div class="form-group">
            <label>Project Link</label>
            <input type="text" class="project-link" placeholder="https://yourproject.com" />
          </div>

          <div class="form-group full-width">
            <label>Tech Stack</label>
            <input type="text" class="project-stack" placeholder="HTML, CSS, JavaScript" />
          </div>

          <div class="form-group full-width">
            <label>Description</label>
            <textarea class="project-description" rows="4" placeholder="Briefly describe what this project does and your role."></textarea>
          </div>
        </div>

        <div class="item-actions"></div>
      `;

      wrapper.querySelector(".project-name").value = data.name || data.title || "";
      wrapper.querySelector(".project-link").value = data.link || data.url || "";
      wrapper.querySelector(".project-stack").value = data.stack || data.tech || "";
      wrapper.querySelector(".project-description").value = data.description || "";

      const removeBtn = resumeBtn("Remove Project", "danger-btn");
      removeBtn.addEventListener("click", () => wrapper.remove());

      wrapper.querySelector(".item-actions").appendChild(removeBtn);

      return wrapper;
    }

    function collectResumeProjects() {
      return [...document.querySelectorAll("#projects-container .project-item")]
        .map((item) => {
          const name = item.querySelector(".project-name")?.value.trim() || "";
          const link = item.querySelector(".project-link")?.value.trim() || "";
          const stack = item.querySelector(".project-stack")?.value.trim() || "";
          const description = item.querySelector(".project-description")?.value.trim() || "";

          return {
            name,
            link,
            url: link,
            stack,
            description
          };
        })
        .filter((project) => project.name || project.link || project.stack || project.description);
    }

    function createResumeExperienceItem(data = {}) {
      const wrapper = document.createElement("div");
      wrapper.className = "experience-item";

      wrapper.innerHTML = `
        <div class="experience-grid">
          <div class="form-group">
            <label>Job Title</label>
            <input type="text" class="exp-title" placeholder="Frontend Developer" />
          </div>

          <div class="form-group">
            <label>Company</label>
            <input type="text" class="exp-company" placeholder="Company Name" />
          </div>

          <div class="form-group">
            <label>Location</label>
            <input type="text" class="exp-location" placeholder="Dallas, TX" />
          </div>

          <div class="form-group">
            <label>Dates</label>
            <input type="text" class="exp-dates" placeholder="2023 - Present" />
          </div>
        </div>

        <div class="subsection">
          <div class="section-title-row">
            <h4>Responsibilities / Achievements</h4>
            <button type="button" class="ghost-btn add-detail-btn">+ Add Detail</button>
          </div>
          <div class="detail-list"></div>
        </div>

        <div class="item-actions"></div>
      `;

      wrapper.querySelector(".exp-title").value = data.title || "";
      wrapper.querySelector(".exp-company").value = data.company || data.employer || "";
      wrapper.querySelector(".exp-location").value = data.location || data.city || "";
      wrapper.querySelector(".exp-dates").value = data.dates || data.date || "";

      const detailList = wrapper.querySelector(".detail-list");
      const details = Array.isArray(data.details)
        ? data.details
        : Array.isArray(data.bullets)
        ? data.bullets
        : [];

      if (details.length) {
        details.forEach((detail) => detailList.appendChild(createResumeDetailItem(detail)));
      } else {
        detailList.appendChild(createResumeDetailItem(""));
      }

      wrapper.querySelector(".add-detail-btn").addEventListener("click", () => {
        detailList.appendChild(createResumeDetailItem(""));
      });

      const removeBtn = resumeBtn("Remove Experience", "danger-btn");
      removeBtn.addEventListener("click", () => wrapper.remove());

      wrapper.querySelector(".item-actions").appendChild(removeBtn);

      return wrapper;
    }

    function collectResumeExperience() {
      return [...document.querySelectorAll("#experience-container .experience-item")]
        .map((item) => {
          const title = item.querySelector(".exp-title")?.value.trim() || "";
          const company = item.querySelector(".exp-company")?.value.trim() || "";
          const location = item.querySelector(".exp-location")?.value.trim() || "";
          const dates = item.querySelector(".exp-dates")?.value.trim() || "";
          const details = [...item.querySelectorAll(".detail-input")]
            .map((input) => input.value.trim())
            .filter(Boolean);

          return { title, company, location, dates, details };
        })
        .filter((job) => job.title || job.company || job.location || job.dates || job.details.length);
    }

    function createResumeEducationItem(data = {}) {
      const wrapper = document.createElement("div");
      wrapper.className = "education-item";

      wrapper.innerHTML = `
        <div class="education-grid">
          <div class="form-group">
            <label>Education Type</label>
            <select class="edu-type">
              <option value="">Select type</option>
              <option value="High School">High School</option>
              <option value="Vocational School">Vocational School</option>
              <option value="College">College</option>
            </select>
          </div>

          <div class="form-group">
            <label>School Name</label>
            <input type="text" class="edu-school" placeholder="School Name" />
          </div>

          <div class="form-group">
            <label>Program / Degree / Diploma</label>
            <input type="text" class="edu-degree" placeholder="Diploma, Certificate, A.A., B.S., etc." />
          </div>

          <div class="form-group">
            <label>Location</label>
            <input type="text" class="edu-location" placeholder="City, State" />
          </div>

          <div class="form-group full-width">
            <label>Dates</label>
            <input type="text" class="edu-dates" placeholder="2020 - 2024" />
          </div>

          <div class="form-group full-width">
            <label>Notes</label>
            <textarea class="edu-notes" rows="3" placeholder="Honors, GPA, coursework, achievements, or additional details"></textarea>
          </div>
        </div>

        <div class="item-actions"></div>
      `;

      wrapper.querySelector(".edu-type").value = data.type || "";
      wrapper.querySelector(".edu-school").value = data.school || data.institution || "";
      wrapper.querySelector(".edu-degree").value = data.degree || data.program || data.field || "";
      wrapper.querySelector(".edu-location").value = data.location || "";
      wrapper.querySelector(".edu-dates").value = data.dates || data.date || "";

      if (Array.isArray(data.details) && data.details.length) {
        wrapper.querySelector(".edu-notes").value = data.details.join("\n");
      } else {
        wrapper.querySelector(".edu-notes").value = data.notes || "";
      }

      const removeBtn = resumeBtn("Remove Education", "danger-btn");
      removeBtn.addEventListener("click", () => wrapper.remove());

      wrapper.querySelector(".item-actions").appendChild(removeBtn);

      return wrapper;
    }

    function collectResumeEducation() {
      return [...document.querySelectorAll("#education-container .education-item")]
        .map((item) => {
          const type = item.querySelector(".edu-type")?.value.trim() || "";
          const school = item.querySelector(".edu-school")?.value.trim() || "";
          const degree = item.querySelector(".edu-degree")?.value.trim() || "";
          const location = item.querySelector(".edu-location")?.value.trim() || "";
          const dates = item.querySelector(".edu-dates")?.value.trim() || "";
          const notes = item.querySelector(".edu-notes")?.value.trim() || "";

          return { type, school, degree, location, dates, notes };
        })
        .filter((edu) => edu.type || edu.school || edu.degree || edu.location || edu.dates || edu.notes);
    }

    function renderResumeEditorDefaults() {
      clearResumeContainer("skills-container");
      clearResumeContainer("languages-container");
      clearResumeContainer("certifications-container");
      clearResumeContainer("projects-container");
      clearResumeContainer("experience-container");
      clearResumeContainer("education-container");

      addResumeSimpleItem("skills-container", "", "Skill");
      addResumeSimpleItem("languages-container", "", "Language");
      addResumeSimpleItem("certifications-container", "", "Certification");

      $("projects-container")?.appendChild(createResumeProjectItem());
      $("experience-container")?.appendChild(createResumeExperienceItem());
      $("education-container")?.appendChild(createResumeEducationItem());
    }

    async function loadResumeEditor() {
      try {
        const snap = await getDoc(profileDocRef);

        if (!snap.exists()) {
          resetResumeBasicFields();
          renderResumeEditorDefaults();
          setResumeStatus("", "info");
          return;
        }

        const data = snap.data() || {};
        fillResumeBasicFields(data);

        clearResumeContainer("skills-container");
        clearResumeContainer("languages-container");
        clearResumeContainer("certifications-container");
        clearResumeContainer("projects-container");
        clearResumeContainer("experience-container");
        clearResumeContainer("education-container");

        const skills = Array.isArray(data.skills) ? data.skills : [];
        const languages = Array.isArray(data.languages) ? data.languages : [];
        const certifications = Array.isArray(data.certifications) ? data.certifications : [];
        const projects = Array.isArray(data.projects) ? data.projects : [];
        const experience = Array.isArray(data.experience) ? data.experience : [];
        const education = Array.isArray(data.education) ? data.education : [];

        if (skills.length) {
          skills.forEach((item) => addResumeSimpleItem("skills-container", String(item), "Skill"));
        } else {
          addResumeSimpleItem("skills-container", "", "Skill");
        }

        if (languages.length) {
          languages.forEach((item) => addResumeSimpleItem("languages-container", String(item), "Language"));
        } else {
          addResumeSimpleItem("languages-container", "", "Language");
        }

        if (certifications.length) {
          certifications.forEach((item) => {
            if (typeof item === "string") {
              addResumeSimpleItem("certifications-container", item, "Certification");
            } else {
              const label = [
                item.name || item.title || "",
                item.issuer || item.organization || "",
                item.date || ""
              ].filter(Boolean).join(" — ");
              addResumeSimpleItem("certifications-container", label, "Certification");
            }
          });
        } else {
          addResumeSimpleItem("certifications-container", "", "Certification");
        }

        if (projects.length) {
          projects.forEach((project) => {
            if (typeof project === "string") {
              $("projects-container")?.appendChild(createResumeProjectItem({ name: project }));
            } else {
              $("projects-container")?.appendChild(createResumeProjectItem(project || {}));
            }
          });
        } else {
          $("projects-container")?.appendChild(createResumeProjectItem());
        }

        if (experience.length) {
          experience.forEach((job) => {
            $("experience-container")?.appendChild(createResumeExperienceItem(job || {}));
          });
        } else {
          $("experience-container")?.appendChild(createResumeExperienceItem());
        }

        if (education.length) {
          education.forEach((school) => {
            $("education-container")?.appendChild(createResumeEducationItem(school || {}));
          });
        } else {
          $("education-container")?.appendChild(createResumeEducationItem());
        }

        setResumeStatus("", "info");
      } catch (error) {
        console.error("Error loading resume editor:", error);
        setResumeStatus("Failed to load resume data.", "error");
      }
    }

    function bindResumeEditorButtons() {
      $("add-skill-btn")?.addEventListener("click", () => {
        addResumeSimpleItem("skills-container", "", "Skill");
      });

      $("add-language-btn")?.addEventListener("click", () => {
        addResumeSimpleItem("languages-container", "", "Language");
      });

      $("add-certification-btn")?.addEventListener("click", () => {
        addResumeSimpleItem("certifications-container", "", "Certification");
      });

      $("add-project-btn")?.addEventListener("click", () => {
        $("projects-container")?.appendChild(createResumeProjectItem());
      });

      $("add-experience-btn")?.addEventListener("click", () => {
        $("experience-container")?.appendChild(createResumeExperienceItem());
      });

      $("add-education-btn")?.addEventListener("click", () => {
        $("education-container")?.appendChild(createResumeEducationItem());
      });
    }

    async function saveResumeEditor(event) {
      event.preventDefault();

      try {
        setResumeStatus("Saving resume...", "info");

        const location = resumeValue("resume-location-input");
        const phone = resumeValue("resume-phone-input");
        const website = resumeValue("resume-website-input");
        const linkedin = resumeValue("resume-linkedin-input");

        const payload = {
          name: resumeValue("resume-name-input"),
          title: resumeValue("resume-title-input"),
          location,
          city: location,
          phone,
          email: resumeValue("resume-email-input"),
          website,
          linkedin,
          summary: resumeValue("resume-summary-input"),
          contact: buildResumeContactLine({ location, phone, website, linkedin }),
          skills: collectResumeSimpleList("skills-container"),
          languages: collectResumeSimpleList("languages-container"),
          certifications: collectResumeSimpleList("certifications-container"),
          projects: collectResumeProjects(),
          experience: collectResumeExperience(),
          education: collectResumeEducation(),
          updatedAt: serverTimestamp()
        };

        await setDoc(profileDocRef, payload, { merge: true });

        setResumeStatus("Resume saved successfully.", "success");
      } catch (error) {
        console.error("Error saving resume:", error);
        setResumeStatus("Save failed. Please try again.", "error");
      }
    }

    if (resumeFormEl) {
      bindResumeEditorButtons();
      renderResumeEditorDefaults();
      loadResumeEditor();
      resumeFormEl.addEventListener("submit", saveResumeEditor);
    }

    
    // Reference for Shoutout Metadata (used for timestamps)
    const shoutoutsMetaRef = doc(db, 'siteConfig', 'shoutoutsMetadata'); //
    // *** Firestore Reference for Useful Links ***
    const usefulLinksCollectionRef = collection(db, "useful_links"); // Collection name
    // --- Firestore Reference for Social Links ---
    // IMPORTANT: Assumes you have a Firestore collection named 'social_links'
    const socialLinksCollectionRef = collection(db, "social_links");

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

/* ============================================================
   SHOUTOUT ADMIN JS
   TikTok / Instagram / YouTube
   Includes edit modal logic, admin list rendering, and preview
============================================================ */

/* ------------------------------------------------------------
   SHOUTOUT HELPER FUNCTIONS
------------------------------------------------------------ */

function formatShoutoutNumber(value) {
    const num = Number(value);

    if (value === null || value === undefined || value === '') return "0";

    if (isNaN(num)) return String(value);

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
    if (!username || username === "N/A") return "";
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

    if (!cleanUsername) return "#";

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
   SHOUTOUT CARD RENDERERS FOR ADMIN PREVIEW
   These names match your existing preview system.
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

            <p class="tiktok-username">@${escapeHTML(username)} ${verifiedBadge}</p>

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
        <div class="instagram-profile-header">
            <h3>
                ${escapeHTML(username)}
                ${verifiedBadge}
            </h3>
        </div>

        <div class="instagram-profile-row">
            ${renderShoutoutImage(profilePic, "instagram-avatar", nickname)}

            <div class="instagram-profile-main">
                <strong>${escapeHTML(nickname)}</strong>

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
            ${bio ? `<p>${escapeHTML(bio).replace(/\n/g, "<br>")}</p>` : ""}

            ${website ? `
            <a href="${escapeAttribute(website)}" target="_blank" rel="noopener noreferrer" class="instagram-website">
                <i class="fas fa-link"></i>
                ${escapeHTML(website.replace(/^https?:\/\//, ""))}
            </a>` : ""}
        </div>

        <div class="single-visit-button-row">
            <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" class="platform-visit-button instagram-visit-button">
                <i class="fab fa-instagram"></i>
                Visit Profile
            </a>
        </div>
    </article>`;
}

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

/* ------------------------------------------------------------
   EDIT MODAL LOGIC
------------------------------------------------------------ */

function setPlatformGroupVisible(groupElement, shouldShow) {
    if (!groupElement) return;

    groupElement.style.display = shouldShow ? 'block' : 'none';

    const fields = groupElement.querySelectorAll('input, textarea, select');

    fields.forEach(field => {
        field.disabled = !shouldShow;
    });
}

// Opens the modal and populates it with data for the selected shoutout
function openEditModal(docId, platform) {
    if (!editModal || !editForm) {
        console.error("Edit modal/form not found.");
        showAdminStatus("UI Error: Cannot open edit form.", true);
        return;
    }

    editForm.setAttribute('data-doc-id', docId);
    editForm.setAttribute('data-platform', platform);

    const docRef = doc(db, 'shoutouts', docId);

    getDoc(docRef).then(docSnap => {
        if (!docSnap.exists()) {
            showAdminStatus("Error: Could not load data for editing. Document not found.", true);
            return;
        }

        const data = docSnap.data();

        // General fields
        if (editUsernameInput) editUsernameInput.value = data.username || '';
        if (editNicknameInput) editNicknameInput.value = data.nickname || '';
        if (editOrderInput) editOrderInput.value = data.order ?? '';
        if (editIsVerifiedInput) editIsVerifiedInput.checked = data.isVerified || false;
        if (editBioInput) editBioInput.value = data.bio || '';
        if (editProfilePicInput) editProfilePicInput.value = data.profilePic || '';

        // Groups
        const followersDiv = editPlatformSpecificDiv?.querySelector('.edit-followers-group');
        const followingDiv = editPlatformSpecificDiv?.querySelector('.edit-following-group');
        const likesDiv = editPlatformSpecificDiv?.querySelector('.edit-likes-group');
        const postsDiv = editPlatformSpecificDiv?.querySelector('.edit-posts-group');
        const subscribersDiv = editPlatformSpecificDiv?.querySelector('.edit-subscribers-group');
        const videosDiv = editPlatformSpecificDiv?.querySelector('.edit-videos-group');
        const coverPhotoDiv = editPlatformSpecificDiv?.querySelector('.edit-coverphoto-group');

        // Inputs
        const editFollowersInputLocal = editForm.querySelector('[name="followers"]');
        const editFollowingInputLocal = editForm.querySelector('[name="following"]');
        const editLikesInputLocal = editForm.querySelector('[name="likes"]');
        const editPostsInputLocal = editForm.querySelector('[name="posts"]');
        const editSubscribersInputLocal = editForm.querySelector('[name="subscribers"]');
        const editVideosInputLocal = editForm.querySelector('[name="videos"]');
        const editCoverPhotoInputLocal = editForm.querySelector('[name="coverPhoto"]');

        // Hide all groups first
        setPlatformGroupVisible(followersDiv, false);
        setPlatformGroupVisible(followingDiv, false);
        setPlatformGroupVisible(likesDiv, false);
        setPlatformGroupVisible(postsDiv, false);
        setPlatformGroupVisible(subscribersDiv, false);
        setPlatformGroupVisible(videosDiv, false);
        setPlatformGroupVisible(coverPhotoDiv, false);

        // Clear all platform fields
        if (editFollowersInputLocal) editFollowersInputLocal.value = '';
        if (editFollowingInputLocal) editFollowingInputLocal.value = '';
        if (editLikesInputLocal) editLikesInputLocal.value = '';
        if (editPostsInputLocal) editPostsInputLocal.value = '';
        if (editSubscribersInputLocal) editSubscribersInputLocal.value = '';
        if (editVideosInputLocal) editVideosInputLocal.value = '';
        if (editCoverPhotoInputLocal) editCoverPhotoInputLocal.value = '';

        // Show and populate by platform
        if (platform === 'tiktok') {
            if (editFollowersInputLocal) editFollowersInputLocal.value = data.followers || '';
            if (editFollowingInputLocal) editFollowingInputLocal.value = data.following || '';
            if (editLikesInputLocal) editLikesInputLocal.value = data.likes || '';

            setPlatformGroupVisible(followersDiv, true);
            setPlatformGroupVisible(followingDiv, true);
            setPlatformGroupVisible(likesDiv, true);

        } else if (platform === 'instagram') {
            if (editPostsInputLocal) editPostsInputLocal.value = data.posts || '';
            if (editFollowersInputLocal) editFollowersInputLocal.value = data.followers || '';
            if (editFollowingInputLocal) editFollowingInputLocal.value = data.following || '';

            setPlatformGroupVisible(postsDiv, true);
            setPlatformGroupVisible(followersDiv, true);
            setPlatformGroupVisible(followingDiv, true);

        } else if (platform === 'youtube') {
            if (editSubscribersInputLocal) editSubscribersInputLocal.value = data.subscribers || '';
            if (editVideosInputLocal) editVideosInputLocal.value = data.videos || '';
            if (editCoverPhotoInputLocal) editCoverPhotoInputLocal.value = data.coverPhoto || '';

            setPlatformGroupVisible(subscribersDiv, true);
            setPlatformGroupVisible(videosDiv, true);
            setPlatformGroupVisible(coverPhotoDiv, true);
        }

        // Preview
        const previewArea = document.getElementById('edit-shoutout-preview');

        if (previewArea) {
            previewArea.innerHTML = '<p><small>Generating preview...</small></p>';

            if (typeof updateShoutoutPreview === 'function') {
                updateShoutoutPreview('edit', platform);
            }
        }

        editModal.style.display = 'block';

    }).catch(error => {
        console.error("Error getting document for edit:", error);
        showAdminStatus(`Error loading data: ${error.message}`, true);
    });
}

// Closes the edit modal and resets the form
function closeEditModal() {
    if (editModal) editModal.style.display = 'none';

    if (editForm) {
        editForm.reset();
        editForm.removeAttribute('data-doc-id');
        editForm.removeAttribute('data-platform');
    }

    if (editShoutoutPreview) {
        editShoutoutPreview.innerHTML = '<p><small>Preview will appear here.</small></p>';
    }
}

// Event listener for closing the edit modal
if (cancelEditButton) {
    cancelEditButton.addEventListener('click', closeEditModal);
}

/* ------------------------------------------------------------
   SUBMIT LISTENER HELPER
------------------------------------------------------------ */

function addSubmitListenerOnce(formElement, handler) {
    if (!formElement) {
        console.warn("Attempted to add listener to non-existent form:", formElement);
        return;
    }

    const listenerAttachedFlag = '__busArmyDudeAdminSubmitListenerAttached__';
    let submitHandlerWrapper = formElement[listenerAttachedFlag + '_handler'];

    if (!submitHandlerWrapper) {
        submitHandlerWrapper = (e) => {
            e.preventDefault();
            console.log(`DEBUG: Submit event triggered for ${formElement.id}`);
            handler();
        };

        formElement[listenerAttachedFlag + '_handler'] = submitHandlerWrapper;
        console.log(`DEBUG: Created submit handler wrapper for ${formElement.id}`);
    }

    if (!formElement[listenerAttachedFlag]) {
        formElement.addEventListener('submit', submitHandlerWrapper);
        formElement[listenerAttachedFlag] = true;
        console.log(`DEBUG: Added submit listener to ${formElement.id}`);
    } else {
        console.log(`DEBUG: Submit listener flag already set for ${formElement.id}, skipping addEventListener.`);
    }
}

/* ------------------------------------------------------------
   ADMIN LIST ITEM RENDERER
------------------------------------------------------------ */

function renderAdminListItem(container, docId, platform, itemData, deleteHandler, editHandler) {
    if (!container) {
        console.warn("List container not found for platform:", platform);
        return;
    }

    const itemDiv = document.createElement('div');
    itemDiv.className = 'list-item-admin';
    itemDiv.setAttribute('data-id', docId);

    const nickname = itemData.nickname || 'N/A';
    const username = itemData.username || 'N/A';
    const order = itemData.order ?? 'N/A';
    const isVerified = itemData.isVerified || false;
    const profilePicUrl = itemData.profilePic || 'images/default-profile.jpg';

    let countText = '';

    if (platform === 'youtube') {
        const subscribers = itemData.subscribers || 'N/A';
        const videos = itemData.videos || 'N/A';

        countText = `Subs: ${subscribers} | Videos: ${videos}`;

    } else if (platform === 'tiktok') {
        const followers = itemData.followers || 'N/A';
        const following = itemData.following || 'N/A';
        const likes = itemData.likes || 'N/A';

        countText = `Followers: ${followers} | Following: ${following} | Likes: ${likes}`;

    } else if (platform === 'instagram') {
        const posts = itemData.posts || 'N/A';
        const followers = itemData.followers || 'N/A';
        const following = itemData.following || 'N/A';

        countText = `Posts: ${posts} | Followers: ${followers} | Following: ${following}`;
    }

    const directLinkUrl = getPlatformProfileUrl(platform, username);

    let verifiedIndicatorHTML = '';

    if (isVerified) {
        let badgeSrc = '';
        const altText = 'Verified Badge';

        switch (platform) {
            case 'tiktok':
                badgeSrc = 'check.png';
                break;
            case 'instagram':
                badgeSrc = 'instagramcheck.png';
                break;
            case 'youtube':
                badgeSrc = 'youtubecheck.png';
                break;
            default:
                break;
        }

        if (badgeSrc) {
            verifiedIndicatorHTML = renderShoutoutImage(badgeSrc, "verified-badge-admin-list", altText, badgeSrc);
        }
    }

    itemDiv.innerHTML = `
        <div class="item-content">
            <div class="admin-list-item-pfp-container">
                ${renderShoutoutImage(profilePicUrl, "admin-list-item-pfp", `PFP for ${nickname}`)}
            </div>

            <div class="item-details">
                <div class="name-line">
                    <strong>${escapeHTML(nickname)}</strong>
                    ${verifiedIndicatorHTML}
                </div>

                <span>(@${escapeHTML(username)})</span>
                <small>Order: ${escapeHTML(order)} | ${escapeHTML(countText)}</small>
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

/* ------------------------------------------------------------
   SHOUTOUT PREVIEW UPDATER
------------------------------------------------------------ */

function updateShoutoutPreview(formType, platform) {
    let formElement;
    let previewElement;
    let accountData = {};

    if (formType === 'add') {
        formElement = document.getElementById(`add-shoutout-${platform}-form`);
        previewElement = document.getElementById(`add-${platform}-preview`);
    } else if (formType === 'edit') {
        formElement = editForm;
        previewElement = editShoutoutPreview;

        if (editForm.getAttribute('data-platform') !== platform) {
            if (previewElement) {
                previewElement.innerHTML = '<p><small>Preview unavailable.</small></p>';
            }

            return;
        }
    } else {
        console.error("Invalid formType provided to updateShoutoutPreview:", formType);
        return;
    }

    if (!formElement || !previewElement) {
        console.error(`Preview Error: Could not find form or preview element for ${formType} ${platform}`);
        return;
    }

    try {
        accountData.username = formElement.querySelector('[name="username"]')?.value.trim() || '';
        accountData.nickname = formElement.querySelector('[name="nickname"]')?.value.trim() || '';
        accountData.bio = formElement.querySelector('[name="bio"]')?.value.trim() || '';
        accountData.profilePic = formElement.querySelector('[name="profilePic"]')?.value.trim() || '';
        accountData.isVerified = formElement.querySelector('[name="isVerified"]')?.checked || false;
        accountData.order = parseInt(formElement.querySelector('[name="order"]')?.value.trim() || 0, 10);

        if (platform === 'tiktok') {
            accountData.following = formElement.querySelector('[name="following"]')?.value.trim() || '0';
            accountData.followers = formElement.querySelector('[name="followers"]')?.value.trim() || '0';
            accountData.likes = formElement.querySelector('[name="likes"]')?.value.trim() || '0';

        } else if (platform === 'instagram') {
            accountData.posts = formElement.querySelector('[name="posts"]')?.value.trim() || '0';
            accountData.followers = formElement.querySelector('[name="followers"]')?.value.trim() || '0';
            accountData.following = formElement.querySelector('[name="following"]')?.value.trim() || '0';

        } else if (platform === 'youtube') {
            accountData.subscribers = formElement.querySelector('[name="subscribers"]')?.value.trim() || '0';
            accountData.videos = formElement.querySelector('[name="videos"]')?.value.trim() || '0';
            accountData.coverPhoto = formElement.querySelector('[name="coverPhoto"]')?.value.trim() || null;
        }

    } catch (e) {
        console.error("Error reading form values for preview:", e);
        previewElement.innerHTML = '<p class="error"><small>Error reading form values.</small></p>';
        return;
    }

    let renderFunction;

    switch (platform) {
        case 'tiktok':
            renderFunction = renderTikTokCard;
            break;
        case 'instagram':
            renderFunction = renderInstagramCard;
            break;
        case 'youtube':
            renderFunction = renderYouTubeCard;
            break;
        default:
            console.error("Invalid platform for preview:", platform);
            previewElement.innerHTML = '<p class="error"><small>Invalid platform.</small></p>';
            return;
    }

    if (typeof renderFunction === 'function') {
        try {
            const cardHTML = renderFunction(accountData);
            previewElement.innerHTML = cardHTML;
        } catch (e) {
            console.error(`Error rendering preview card for ${platform}:`, e);
            previewElement.innerHTML = '<p class="error"><small>Error rendering preview.</small></p>';
        }
    } else {
        console.error(`Rendering function for ${platform} not found!`);
        previewElement.innerHTML = '<p class="error"><small>Preview engine error.</small></p>';
    }
}

/* ------------------------------------------------------------
   PREVIEW LISTENERS
------------------------------------------------------------ */

function attachShoutoutPreviewListeners(formElement, platform, formType = 'add') {
    if (!formElement) return;

    const inputs = formElement.querySelectorAll('input[name], textarea[name], select[name]');

    inputs.forEach(input => {
        const eventType = input.type === 'checkbox' || input.tagName.toLowerCase() === 'select'
            ? 'change'
            : 'input';

        const listenerFlag = `__shoutoutPreviewListener_${formType}_${platform}_${eventType}`;

        if (!input[listenerFlag]) {
            input.addEventListener(eventType, () => {
                updateShoutoutPreview(formType, platform);
            });

            input[listenerFlag] = true;
        }
    });
}

// Attach add form preview listeners if forms exist
attachShoutoutPreviewListeners(document.getElementById('add-shoutout-tiktok-form'), 'tiktok', 'add');
attachShoutoutPreviewListeners(document.getElementById('add-shoutout-instagram-form'), 'instagram', 'add');
attachShoutoutPreviewListeners(document.getElementById('add-shoutout-youtube-form'), 'youtube', 'add');

// Attach edit form preview listener if edit form exists
if (typeof editForm !== 'undefined' && editForm) {
    const editInputs = editForm.querySelectorAll('input[name], textarea[name], select[name]');

    editInputs.forEach(input => {
        const eventType = input.type === 'checkbox' || input.tagName.toLowerCase() === 'select'
            ? 'change'
            : 'input';

        const listenerFlag = `__shoutoutPreviewListener_edit_${eventType}`;

        if (!input[listenerFlag]) {
            input.addEventListener(eventType, () => {
                const platform = editForm.getAttribute('data-platform');

                if (platform) {
                    updateShoutoutPreview('edit', platform);
                }
            });

            input[listenerFlag] = true;
        }
    });
}

/* ------------------------------------------------------------
   GLOBAL MODAL CLICK LISTENER
------------------------------------------------------------ */

if (!window.adminModalClickListenerAttached) {
    window.addEventListener('click', (event) => {
        const editShoutoutModalElem = document.getElementById('edit-shoutout-modal');
        const editUsefulLinkModalElem = document.getElementById('edit-useful-link-modal');
        const editSocialLinkModalElem = document.getElementById('edit-social-link-modal');
        const editDisabilityModalElem = document.getElementById('edit-disability-modal');
        const editTechItemModalElem = document.getElementById('edit-tech-item-modal');

        if (event.target === editShoutoutModalElem && typeof closeEditModal === 'function') {
            closeEditModal();
        }

        if (event.target === editUsefulLinkModalElem && typeof closeEditUsefulLinkModal === 'function') {
            closeEditUsefulLinkModal();
        }

        if (event.target === editSocialLinkModalElem && typeof closeEditSocialLinkModal === 'function') {
            closeEditSocialLinkModal();
        }

        if (event.target === editDisabilityModalElem && typeof closeEditDisabilityModal === 'function') {
            closeEditDisabilityModal();
        }

        if (event.target === editTechItemModalElem && typeof closeEditTechItemModal === 'function') {
            closeEditTechItemModal();
        }
    });

    window.adminModalClickListenerAttached = true;
    console.log("Global modal click listener attached.");
}

/* ------------------------------------------------------------
   GOOGLE SIGN-IN HANDLER
------------------------------------------------------------ */

async function handleGoogleSignIn(response) {
    console.log("Received response from Google Sign-In...");

    const authStatus = document.getElementById('auth-status');

    if (authStatus) {
        authStatus.textContent = 'Verifying with Google...';
        authStatus.className = 'status-message';
        authStatus.style.display = 'block';
    }

    const idToken = response.credential;
    const credential = GoogleAuthProvider.credential(idToken);

    try {
        const result = await signInWithCredential(auth, credential);
        console.log("Successfully signed in with Google:", result.user.displayName);
    } catch (error) {
        console.error("Firebase Google Sign-In Error:", error);

        if (authStatus) {
            authStatus.textContent = `Login Failed: ${error.message}`;
            authStatus.className = 'status-message error';
        }
    }
}

// admin-business-hours-v16.js
// ======================================================
// ========== BUSINESS HOURS ADMIN (MULTI-RANGE v16) ====
// ======================================================
// - Multi-range regularHours per day (recommended)
// - Single-range holidayHours and temporaryHours
// - Live preview, add/remove, mutation observer
// - Depends on Firestore helpers: db, doc, getDoc, setDoc, serverTimestamp
// - Depends on auth (for save permission checks)
// ======================================================

/* -------------------------
   CONFIG & SHARED HELPERS
   ------------------------- */

// Firestore doc ref (declare once)
const businessDocRef = (typeof doc !== 'undefined' && typeof db !== 'undefined')
    ? doc(db, "site_config", "businessDetails")
    : null;

// Days constants
const daysOfWeek = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

// Small util: safe attach listener (prevents duplicate attachments)
function addListenerSafe(element, eventType, handler, flagSuffix = '') {
    if (!element) return;
    const flag = `__listener_${eventType}_${flagSuffix}`;
    if (!element[flag]) {
        element.addEventListener(eventType, handler);
        element[flag] = true;
    }
}

function showBusinessInfoStatus(message, isError = false) {
    const el = document.getElementById('business-info-status-message');
    if (!el) { console.warn("Business info status message element not found!"); return; }
    el.textContent = message;
    el.className = `status-message ${isError ? 'error' : 'success'}`;
    el.style.display = 'block';
    setTimeout(() => {
        if (el && el.textContent === message) {
            el.textContent = '';
            el.className = 'status-message';
            el.style.display = 'none';
        }
    }, 5000);
}

function capitalizeFirstLetter(s) { if (!s) return ''; return s.charAt(0).toUpperCase() + s.slice(1); }

function timeStringToMinutesBI(timeStr) {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return null;
    const [hh, mm] = timeStr.split(':').map(Number);
    if (isNaN(hh) || isNaN(mm)) return null;
    return hh * 60 + mm;
}

function formatTimeForAdminPreview(timeString) {
    if (!timeString) return '';
    try {
        const [hour, minute] = timeString.split(':');
        const hourNum = parseInt(hour, 10);
        if (isNaN(hourNum)) return timeString;
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const hour12 = hourNum % 12 || 12;
        return `${hour12}:${minute} ${ampm}`;
    } catch (e) {
        return timeString;
    }
}

/* -------------------------
   REGULAR HOURS: Multi-range admin UI
   ------------------------- */

/*
Expected stored format:
regularHours: {
  monday: { isClosed: false, ranges: [ {open: "07:00", close: "09:30"}, {...} ] },
  ...
}
*/

// Template creation helper: creates a DOM fragment for one hours-range row
function createHoursRangeElement(day, open = "", close = "") {
    // Template markup (keeps it self-contained so no separate <template> needed)
    const wrapper = document.createElement('div');
    wrapper.className = 'hours-range';
    wrapper.innerHTML = `
        <input type="time" class="open-time" value="${open || ''}" />
        <span class="range-sep"> — </span>
        <input type="time" class="close-time" value="${close || ''}" />
        <button type="button" class="remove-hours" title="Remove range">×</button>
    `;

    const removeBtn = wrapper.querySelector('.remove-hours');
    addListenerSafe(removeBtn, 'click', (e) => {
        wrapper.remove();
        updateAdminPreview();
    }, `rem_range_${day}`);

    wrapper.querySelectorAll('input').forEach(inp => {
        addListenerSafe(inp, 'input', updateAdminPreview, `range_input_${day}`);
    });

    return wrapper;
}

// Populate the multi-range UI for regular hours
function populateRegularHoursForm(data = {}) {
    const container = document.getElementById('regular-hours-container');
    if (!container) { console.error("regular-hours-container missing"); return; }
    container.innerHTML = '';

    daysOfWeek.forEach(day => {
        const dayData = data[day] || { isClosed: true, ranges: [] };
        const block = document.createElement('div');
        block.className = 'day-block';
        block.dataset.day = day;

        // Header + closed checkbox + ranges container + add-button
        block.innerHTML = `
            <h5>${capitalizeFirstLetter(day)}</h5>
            <label class="checkbox-inline"><input type="checkbox" class="closed-all-day" ${dayData.isClosed ? 'checked' : ''} /> Closed all day</label>
            <div class="hours-list"></div>
            <button type="button" class="add-hours btn-small">+ Add Hours</button>
        `;

        const closedCheckbox = block.querySelector('.closed-all-day');
        const hoursList = block.querySelector('.hours-list');
        const addBtn = block.querySelector('.add-hours');

        // Populate existing ranges (multi-range)
        if (!dayData.isClosed && Array.isArray(dayData.ranges)) {
            dayData.ranges.forEach(r => {
                hoursList.appendChild(createHoursRangeElement(day, r.open || '', r.close || ''));
            });
        }

        // Add button
        addListenerSafe(addBtn, 'click', () => {
            hoursList.appendChild(createHoursRangeElement(day, '', ''));
            updateAdminPreview();
        }, `add_hours_${day}`);

        // Closed toggler
        addListenerSafe(closedCheckbox, 'change', (e) => {
            if (e.target.checked) {
                hoursList.innerHTML = '';
            }
            updateAdminPreview();
        }, `closed_toggle_${day}`);

        container.appendChild(block);
    });

    updateAdminPreview();
}

/* -------------------------
   HOLIDAY / TEMP ENTRY RENDERERS
   (single open/close per entry)
   ------------------------- */

function renderHolidayEntry(entry = {}, index = 0) {
    const uniqueId = `holiday-${Date.now()}-${index}`;
    const div = document.createElement('div');
    div.className = 'hour-entry holiday-entry';
    div.setAttribute('data-id', uniqueId);

    div.innerHTML = `
        <button type="button" class="remove-hour-button" title="Remove">×</button>
        <div class="form-row">
            <label>Date:</label>
            <input type="date" class="holiday-date" value="${entry.date || ''}" required />
        </div>
        <div class="form-row">
            <label>Label (opt):</label>
            <input type="text" class="holiday-label" value="${entry.label || ''}" placeholder="e.g., Christmas Day" />
        </div>
        <div class="form-row time-inputs">
            <input type="time" class="holiday-open" value="${entry.open || ''}" ${entry.isClosed ? 'disabled' : ''} />
            <span> — </span>
            <input type="time" class="holiday-close" value="${entry.close || ''}" ${entry.isClosed ? 'disabled' : ''} />
        </div>
        <div class="form-row">
            <label><input type="checkbox" class="holiday-isClosed" ${entry.isClosed ? 'checked' : ''} /> Closed all day</label>
        </div>
    `;

    const removeBtn = div.querySelector('.remove-hour-button');
    addListenerSafe(removeBtn, 'click', () => { div.remove(); updateAdminPreview(); }, `rem_hol_${uniqueId}`);

    const isClosedCheckbox = div.querySelector('.holiday-isClosed');
    const openInput = div.querySelector('.holiday-open');
    const closeInput = div.querySelector('.holiday-close');
    addListenerSafe(isClosedCheckbox, 'change', (e) => {
        const disabled = e.target.checked;
        if (openInput) openInput.disabled = disabled;
        if (closeInput) closeInput.disabled = disabled;
        if (disabled) { if (openInput) openInput.value = ''; if (closeInput) closeInput.value = ''; }
        updateAdminPreview();
    }, `hol_closed_${uniqueId}`);

    div.querySelectorAll('input').forEach((inp) => addListenerSafe(inp, 'input', updateAdminPreview, `hol_input_${uniqueId}_${inp.className}`));

    return div;
}

function renderTemporaryEntry(entry = {}, index = 0) {
    const uniqueId = `temp-${Date.now()}-${index}`;
    const div = document.createElement('div');
    div.className = 'hour-entry temporary-entry';
    div.setAttribute('data-id', uniqueId);

    div.innerHTML = `
        <button type="button" class="remove-hour-button" title="Remove">×</button>
        <div class="form-row">
            <label>Start:</label>
            <input type="date" class="temp-start" value="${entry.startDate || ''}" required />
        </div>
        <div class="form-row">
            <label>End:</label>
            <input type="date" class="temp-end" value="${entry.endDate || ''}" required />
        </div>
        <div class="form-row">
            <label>Label (opt):</label>
            <input type="text" class="temp-label" value="${entry.label || ''}" placeholder="e.g., Event" />
        </div>
        <div class="form-row time-inputs">
            <input type="time" class="temp-open" value="${entry.open || ''}" ${entry.isClosed ? 'disabled' : ''} />
            <span> — </span>
            <input type="time" class="temp-close" value="${entry.close || ''}" ${entry.isClosed ? 'disabled' : ''} />
        </div>
        <div class="form-row">
            <label><input type="checkbox" class="temp-isClosed" ${entry.isClosed ? 'checked' : ''} /> Closed all day during this period</label>
        </div>
    `;

    const removeBtn = div.querySelector('.remove-hour-button');
    addListenerSafe(removeBtn, 'click', () => { div.remove(); updateAdminPreview(); }, `rem_tmp_${uniqueId}`);

    const isClosedCheckbox = div.querySelector('.temp-isClosed');
    const openInput = div.querySelector('.temp-open');
    const closeInput = div.querySelector('.temp-close');
    addListenerSafe(isClosedCheckbox, 'change', (e) => {
        const disabled = e.target.checked;
        if (openInput) openInput.disabled = disabled;
        if (closeInput) closeInput.disabled = disabled;
        if (disabled) { if (openInput) openInput.value = ''; if (closeInput) closeInput.value = ''; }
        updateAdminPreview();
    }, `tmp_closed_${uniqueId}`);

    div.querySelectorAll('input').forEach((inp) => addListenerSafe(inp, 'input', updateAdminPreview, `tmp_input_${uniqueId}_${inp.className}`));

    return div;
}

/* -------------------------
   LOAD DATA FROM FIRESTORE
   ------------------------- */

async function loadBusinessInfoData() {
    console.log("Loading business info (v16)...");
    const contactEmailInput = document.getElementById('business-contact-email');
    const statusOverrideSelect = document.getElementById('business-status-override');
    const holidayHoursList = document.getElementById('holiday-hours-list');
    const temporaryHoursList = document.getElementById('temporary-hours-list');

    if (!businessDocRef || typeof getDoc !== 'function') {
        console.error("Firestore helpers missing: cannot load business info.");
        return;
    }

    try {
        const snap = await getDoc(businessDocRef);
        const data = snap.exists() ? snap.data() : {};

        if (contactEmailInput) contactEmailInput.value = data.contactEmail || '';
        if (statusOverrideSelect) statusOverrideSelect.value = data.statusOverride || 'auto';

        // Regular hours (multi-range)
        if (typeof populateRegularHoursForm === 'function') {
            populateRegularHoursForm(data.regularHours || {});
        }

        // Holidays
        if (holidayHoursList && typeof renderHolidayEntry === 'function') {
            holidayHoursList.innerHTML = '';
            (data.holidayHours || []).forEach((h, idx) => {
                holidayHoursList.appendChild(renderHolidayEntry(h, idx));
            });
        }

        // Temporary
        if (temporaryHoursList && typeof renderTemporaryEntry === 'function') {
            temporaryHoursList.innerHTML = '';
            (data.temporaryHours || []).forEach((t, idx) => {
                temporaryHoursList.appendChild(renderTemporaryEntry(t, idx));
            });
        }

        updateAdminPreview();
        console.log("Business info loaded.");
    } catch (err) {
        console.error("Error loading business info:", err);
        showBusinessInfoStatus("Error loading business info", true);
    }
}

/* -------------------------
   SAVE DATA TO FIRESTORE
   ------------------------- */

async function saveBusinessInfoData(e) {
    e.preventDefault();

    if (!auth || !auth.currentUser) {
        showBusinessInfoStatus("Not logged in.", true);
        return;
    }

    showBusinessInfoStatus("Saving...");

    // Build payload
    const contactEmail = document.getElementById('business-contact-email')?.value?.trim() || null;
    const statusOverride = document.getElementById('business-status-override')?.value || 'auto';
    const payload = { contactEmail, statusOverride, regularHours: {}, holidayHours: [], temporaryHours: [], lastUpdated: serverTimestamp() };

    // Regular hours: read multi-range form
    document.querySelectorAll('.day-block').forEach(block => {
        const day = block.dataset.day;
        const isClosed = block.querySelector('.closed-all-day')?.checked || false;
        const ranges = [];
        block.querySelectorAll('.hours-range').forEach(hr => {
            const open = hr.querySelector('.open-time')?.value || null;
            const close = hr.querySelector('.close-time')?.value || null;
            if (open && close) ranges.push({ open, close });
        });
        payload.regularHours[day] = { isClosed: !!isClosed, ranges };
    });

    // Holiday entries
    document.querySelectorAll('#holiday-hours-list .holiday-entry').forEach(entryDiv => {
        const date = entryDiv.querySelector('.holiday-date')?.value || null;
        if (!date) return;
        const isClosed = entryDiv.querySelector('.holiday-isClosed')?.checked || false;
        const label = entryDiv.querySelector('.holiday-label')?.value?.trim() || null;
        const open = isClosed ? null : (entryDiv.querySelector('.holiday-open')?.value || null);
        const close = isClosed ? null : (entryDiv.querySelector('.holiday-close')?.value || null);
        payload.holidayHours.push({ date, label, isClosed, open, close });
    });

    // Temporary entries
    let valid = true;
    document.querySelectorAll('#temporary-hours-list .temporary-entry').forEach(entryDiv => {
        const startDate = entryDiv.querySelector('.temp-start')?.value || null;
        const endDate = entryDiv.querySelector('.temp-end')?.value || null;
        if (!startDate || !endDate) { valid = false; return; }
        if (endDate < startDate) { valid = false; return; }
        const isClosed = entryDiv.querySelector('.temp-isClosed')?.checked || false;
        const label = entryDiv.querySelector('.temp-label')?.value?.trim() || null;
        const open = isClosed ? null : (entryDiv.querySelector('.temp-open')?.value || null);
        const close = isClosed ? null : (entryDiv.querySelector('.temp-close')?.value || null);
        payload.temporaryHours.push({ startDate, endDate, label, isClosed, open, close });
    });

    if (!valid) {
        showBusinessInfoStatus("Save failed: check required dates/times.", true);
        return;
    }

    // Sort arrays for consistency
    payload.holidayHours.sort((a,b) => a.date > b.date ? 1 : -1);
    payload.temporaryHours.sort((a,b) => a.startDate > b.startDate ? 1 : -1);

    try {
        await setDoc(businessDocRef, payload, { merge: true });
        showBusinessInfoStatus("Business info updated!");
        updateAdminPreview();
    } catch (err) {
        console.error("Error saving business info:", err);
        showBusinessInfoStatus(`Error saving: ${err.message || err}`, true);
    }
}

/* -------------------------
   ADMIN PREVIEW
   ------------------------- */

function updateAdminPreview() {
    const adminPreviewStatus = document.getElementById('admin-preview-status');
    const adminPreviewHours = document.getElementById('admin-preview-hours');
    const adminPreviewContact = document.getElementById('admin-preview-contact');

    if (!adminPreviewStatus || !adminPreviewHours || !adminPreviewContact) {
        console.warn("Preview elements missing");
        return;
    }

    const contactEmail = document.getElementById('business-contact-email')?.value?.trim() || null;
    const statusOverride = document.getElementById('business-status-override')?.value || 'auto';

    const previewData = { contactEmail, statusOverride, regularHours: {}, holidayHours: [], temporaryHours: [] };

    // REGULAR HOURS READ
    document.querySelectorAll('.day-block').forEach(block => {
        const day = block.dataset.day;
        const isClosed = block.querySelector('.closed-all-day')?.checked || false;
        const ranges = [];
        block.querySelectorAll('.hours-range').forEach(hr => {
            const open = hr.querySelector('.open-time')?.value || null;
            const close = hr.querySelector('.close-time')?.value || null;
            if (open && close) ranges.push({ open, close });
        });
        previewData.regularHours[day] = { isClosed: !!isClosed, ranges };
    });

    // HOLIDAYS READ
    document.querySelectorAll('#holiday-hours-list .holiday-entry').forEach(entryDiv => {
        const date = entryDiv.querySelector('.holiday-date')?.value || null;
        if (!date) return;
        const isClosed = entryDiv.querySelector('.holiday-isClosed')?.checked || false;
        const label = entryDiv.querySelector('.holiday-label')?.value?.trim() || null;
        const open = isClosed ? null : entryDiv.querySelector('.holiday-open')?.value || null;
        const close = isClosed ? null : entryDiv.querySelector('.holiday-close')?.value || null;
        previewData.holidayHours.push({ date, label, isClosed, open, close });
    });

    // TEMPORARY READ
    document.querySelectorAll('#temporary-hours-list .temporary-entry').forEach(entryDiv => {
        const startDate = entryDiv.querySelector('.temp-start')?.value || null;
        const endDate = entryDiv.querySelector('.temp-end')?.value || null;
        if (!startDate || !endDate) return;
        const isClosed = entryDiv.querySelector('.temp-isClosed')?.checked || false;
        const label = entryDiv.querySelector('.temp-label')?.value?.trim() || null;
        const open = isClosed ? null : entryDiv.querySelector('.temp-open')?.value || null;
        const close = isClosed ? null : entryDiv.querySelector('.temp-close')?.value || null;
        previewData.temporaryHours.push({ startDate, endDate, label, isClosed, open, close });
    });

    // TIME + STATUS CALC
    const now = new Date();
    const previewDateStr = now.toISOString().slice(0,10);
    const previewDayName = daysOfWeek[(now.getDay() + 6) % 7];
    const previewMinutes = now.getHours() * 60 + now.getMinutes();

    let currentStatus = 'Closed';
    let reason = 'Regular Hours';

    if (previewData.statusOverride !== 'auto') {
        currentStatus =
            previewData.statusOverride === 'open'
                ? 'Open'
                : previewData.statusOverride === 'closed'
                    ? 'Closed'
                    : 'Temporarily Unavailable';

        reason = 'Manual Override';
    } else {
        const todayHoliday = previewData.holidayHours.find(h => h.date === previewDateStr);
        if (todayHoliday) {
            reason = `Holiday (${todayHoliday.label || todayHoliday.date})`;
            if (todayHoliday.isClosed) currentStatus = 'Closed';
            else if (todayHoliday.open && todayHoliday.close) {
                const o = timeStringToMinutesBI(todayHoliday.open);
                const c = timeStringToMinutesBI(todayHoliday.close);
                currentStatus = (previewMinutes >= o && previewMinutes < c) ? 'Open' : 'Closed';
            }
        } else {
            const activeTemp = previewData.temporaryHours.find(
                t => previewDateStr >= t.startDate && previewDateStr <= t.endDate
            );

            if (activeTemp) {
                if (activeTemp.isClosed) {
                    currentStatus = 'Closed';
                    reason = `Temporary (${activeTemp.label || 'Period'}) - Closed`;
                } else if (activeTemp.open && activeTemp.close) {
                    const o = timeStringToMinutesBI(activeTemp.open);
                    const c = timeStringToMinutesBI(activeTemp.close);
                    if (previewMinutes >= o && previewMinutes < c) {
                        currentStatus = 'Temporarily Unavailable';
                        reason = `Temporary (${activeTemp.label || 'Period'})`;
                    }
                }
            }

            if (reason === 'Regular Hours') {
                const reg = previewData.regularHours[previewDayName];
                if (reg && !reg.isClosed) {
                    const openNow = reg.ranges.some(r => {
                        const o = timeStringToMinutesBI(r.open);
                        const c = timeStringToMinutesBI(r.close);
                        if (o == null || c == null) return false;
                        return c > o
                            ? previewMinutes >= o && previewMinutes < c
                            : previewMinutes >= o || previewMinutes < c;
                    });
                    currentStatus = openNow ? 'Open' : 'Closed';
                }
            }
        }
    }

    // STATUS DISPLAY
    let statusClass = 'status-closed';
    if (currentStatus === 'Open') statusClass = 'status-open';
    else if (currentStatus === 'Temporarily Unavailable') statusClass = 'status-unavailable';

    adminPreviewStatus.innerHTML = `
        <div class="preview-status">
            <span class="status-main-text ${statusClass}">
                ${currentStatus}
            </span>
            <span class="status-reason">(${reason})</span>
        </div>
    `;

    // =============================
    // ONYX REGULAR HOURS LIST (🔥)
    // =============================
    let html = `
        <h4>Regular Hours</h4>
        <ul class="preview-hours">
    `;

    daysOfWeek.forEach(day => {
        const isToday = day === previewDayName;
        const d = previewData.regularHours[day] || { isClosed: true, ranges: [] };

        html += `
            <li class="${isToday ? 'current-day-preview' : ''}">
                <strong>${capitalizeFirstLetter(day)}:</strong>
        `;

        if (d.isClosed) {
            html += `<span class="hours-line">Closed</span>`;
        } else if (!d.ranges.length) {
            html += `<span class="hours-line">No hours added</span>`;
        } else {
            d.ranges.forEach((r, i) => {
                const disp = `${formatTimeForAdminPreview(r.open)} – ${formatTimeForAdminPreview(r.close)} ET`;

                if (i === 0) html += `<span class="hours-line">${disp}</span>`;
                else html += `<span class="hours-line additional-hours">${disp}</span>`;
            });
        }

        html += `</li>`;
    });

    html += `</ul>`;

    // TEMP HOURS
    if (previewData.temporaryHours.length) {
        html += `<h4>Temporary Hours</h4><ul>`;
        previewData.temporaryHours.forEach(t => {
            html += `
                <li>
                    <strong>${t.label || 'Temporary'}:</strong>
                    <span>${t.startDate} → ${t.endDate} 
                        ${t.isClosed ? 'Closed' :
                            `${formatTimeForAdminPreview(t.open)} - ${formatTimeForAdminPreview(t.close)} ET`}
                    </span>
                </li>
            `;
        });
        html += `</ul>`;
    }

    // HOLIDAY HOURS
    if (previewData.holidayHours.length) {
        html += `<h4>Holiday Hours</h4><ul>`;
        previewData.holidayHours.forEach(h => {
            html += `
                <li>
                    <strong>${h.label || 'Holiday'}:</strong>
                    <span>${h.date} 
                        ${h.isClosed ? 'Closed' :
                            `${formatTimeForAdminPreview(h.open)} - ${formatTimeForAdminPreview(h.close)} ET`}
                    </span>
                </li>
            `;
        });
        html += `</ul>`;
    }

    html += `<p class="preview-timezone-note">Preview based on your browser time. Hours entered as ET.</p>`;

    adminPreviewHours.innerHTML = html;

    adminPreviewContact.innerHTML = contactEmail
        ? `Contact: <a href="mailto:${contactEmail}" target="_blank">${contactEmail}</a>`
        : '';
}
/* -------------------------
   LISTENERS & INIT
   ------------------------- */

function setupBusinessInfoListeners() {
    console.log("Setting up admin business info listeners (v16)...");
    const form = document.getElementById('business-info-form');
    const addHolidayBtn = document.getElementById('add-holiday-button');
    const addTempBtn = document.getElementById('add-temporary-button');
    const holidayList = document.getElementById('holiday-hours-list');
    const tempList = document.getElementById('temporary-hours-list');

    if (!form) { console.error("business-info-form missing"); return; }

    // Prevent double-attach
    if (form.dataset.listenersAttached === 'true') {
        console.log("Listeners already attached — skipping.");
        return;
    }
    form.dataset.listenersAttached = 'true';

    addListenerSafe(form, 'submit', saveBusinessInfoData, 'biz_submit');

    if (addHolidayBtn && holidayList) {
        addListenerSafe(addHolidayBtn, 'click', () => {
            holidayList.appendChild(renderHolidayEntry({ isClosed: true }, holidayList.children.length));
        }, 'add_hol_btn');
    }

    if (addTempBtn && tempList) {
        addListenerSafe(addTempBtn, 'click', () => {
            tempList.appendChild(renderTemporaryEntry({ isClosed: false }, tempList.children.length));
        }, 'add_tmp_btn');
    }

    // Live preview on form input/change
    addListenerSafe(form, 'input', (e) => { updateAdminPreview(); }, 'preview_input');
    addListenerSafe(form, 'change', (e) => { updateAdminPreview(); }, 'preview_change');

    // Observe holiday/temp lists to trigger preview on add/remove
    const holidayListEl = document.getElementById('holiday-hours-list');
    const tempListEl = document.getElementById('temporary-hours-list');
    const observer = new MutationObserver((mutationsList) => {
        let shouldUpdate = false;
        for (const m of mutationsList) {
            if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) { shouldUpdate = true; break; }
        }
        if (shouldUpdate) {
            setTimeout(updateAdminPreview, 100); // debounce small
        }
    });
    if (holidayListEl) observer.observe(holidayListEl, { childList: true, subtree: true });
    if (tempListEl) observer.observe(tempListEl, { childList: true, subtree: true });
}

/* -------------------------
   BOOTSTRAP: Attach on DOM ready
   ------------------------- */

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupBusinessInfoListeners();
        loadBusinessInfoData();
    });
} else {
    setupBusinessInfoListeners();
    loadBusinessInfoData();
}

// End of admin-business-hours-v16.js

    
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

// ============================
// GLOBAL DISCORD STATE
// ============================
let discordData = {
    id: null,
    username: "",
    avatar: "",
    bio: ""
};

// ============================
// FETCH DISCORD PROFILE
// ============================
async function fetchDiscordData() {
    try {
        const res = await fetch("/api/discord/profile");
        if (!res.ok) return;

        const data = await res.json();

        discordData = {
            id: data.id,
            username: data.username,
            avatar: `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`,
            bio: ""
        };

    } catch (err) {
        console.warn("Discord fetch failed:", err);
    }
}

// ============================
// LOAD PROFILE DATA
// ============================
async function loadProfileData() {

    if (!auth || !auth.currentUser) {
        console.warn("Auth not ready or user not logged in.");
        return;
    }

    if (!profileForm || !maintenanceModeToggle || !hideTikTokSectionToggle ||
        !countdownTitleInput || !countdownDatetimeInput || !countdownExpiredMessageInput ||
        !adminPfpPreview || !profileStatusInput) {
        console.error("Missing admin.html elements!");
        if (profileStatusMessage) showProfileStatus("Error: Page structure incorrect.", true);
        return;
    }

    console.log("Loading profile from:", profileDocRef.path);

    try {

        // 🔥 Fetch Discord FIRST
        await fetchDiscordData();

        const docSnap = await getDoc(profileDocRef);

        if (!docSnap.exists()) {
            console.warn("Profile document not found.");
            profileForm.reset();
            return;
        }

        const data = docSnap.data();
        console.log("Loaded data:", data);

        // ============================
        // SYNC TOGGLE
        // ============================
        const syncToggle = document.getElementById("discord-sync-toggle");
        const isSync = data.syncWithDiscord || false;

        if (syncToggle) syncToggle.checked = isSync;

        // ============================
        // APPLY PROFILE VALUES
        // ============================
        if (isSync && discordData.username) {

            if (profileUsernameInput) profileUsernameInput.value = discordData.username;
            if (profilePicUrlInput) profilePicUrlInput.value = discordData.avatar;
            if (profileBioInput) profileBioInput.value = data.bio || "";

        } else {

            if (profileUsernameInput) profileUsernameInput.value = data.username || "";
            if (profilePicUrlInput) profilePicUrlInput.value = data.profilePicUrl || "";
            if (profileBioInput) profileBioInput.value = data.bio || "";
        }

        if (profileStatusInput) profileStatusInput.value = data.status || "offline";

        // ============================
        // AUTO STATUS TOGGLE
        // ============================
        const autoStatusToggle = document.getElementById("auto-status-toggle");

        if (autoStatusToggle) {

            autoStatusToggle.checked = data.autoStatusEnabled || false;

            profileStatusInput.disabled = autoStatusToggle.checked;

            const newToggle = autoStatusToggle.cloneNode(true);
            autoStatusToggle.parentNode.replaceChild(newToggle, autoStatusToggle);

            newToggle.addEventListener("change", (e) => {
                if (profileStatusInput) {
                    profileStatusInput.disabled = e.target.checked;
                }
            });
        }

        // ============================
        // OTHER SETTINGS
        // ============================
        maintenanceModeToggle.checked = data.isMaintenanceModeEnabled || false;
        hideTikTokSectionToggle.checked = data.hideTikTokSection || false;

        // ============================
        // COUNTDOWN
        // ============================
        countdownTitleInput.value = data.countdownTitle || "";

        if (data.countdownTargetDate && data.countdownTargetDate.toDate) {
            const d = data.countdownTargetDate.toDate();
            const formatted =
                d.getFullYear() + "-" +
                String(d.getMonth() + 1).padStart(2, "0") + "-" +
                String(d.getDate()).padStart(2, "0") + "T" +
                String(d.getHours()).padStart(2, "0") + ":" +
                String(d.getMinutes()).padStart(2, "0") + ":" +
                String(d.getSeconds()).padStart(2, "0");

            countdownDatetimeInput.value = formatted;
        }

        countdownExpiredMessageInput.value = data.countdownExpiredMessage || "";

        // ============================
        // PROFILE IMAGE PREVIEW
        // ============================
        if (adminPfpPreview) {
            const url = profilePicUrlInput?.value;

            if (url) {
                adminPfpPreview.src = url;
                adminPfpPreview.style.display = "inline-block";
            } else {
                adminPfpPreview.style.display = "none";
            }
        }

        // ============================
        // LOCK MANUAL FIELDS IF SYNC
        // ============================
        const manualFields = document.querySelectorAll("[data-manual]");
        const syncToggleEl = document.getElementById("discord-sync-toggle");

        if (syncToggleEl) {

            const applyLock = (state) => {
                manualFields.forEach(el => {
                    el.disabled = state;
                });
            };

            applyLock(syncToggleEl.checked);

            syncToggleEl.addEventListener("change", (e) => {
                applyLock(e.target.checked);

                if (e.target.checked) {
                    if (discordData.username) {
                        profileUsernameInput.value = discordData.username;
                        profilePicUrlInput.value = discordData.avatar;
                    }
                }
            });
        }

    } catch (error) {
        console.error("Load error:", error);
        if (profileStatusMessage) {
            showProfileStatus("Error loading profile data.", true);
        }
    }
}

// ============================
// SAVE PROFILE DATA
// ============================
async function saveProfileData(event) {
    event.preventDefault();

    if (!auth || !auth.currentUser) {
        showProfileStatus("Error: Not logged in.", true);
        return;
    }

    const syncToggle = document.getElementById("discord-sync-toggle");
    const autoStatusToggle = document.getElementById("auto-status-toggle");

    const isSync = syncToggle ? syncToggle.checked : false;

    const newData = {
        syncWithDiscord: isSync,

        username: isSync
            ? discordData.username
            : profileUsernameInput?.value.trim(),

        profilePicUrl: isSync
            ? discordData.avatar
            : profilePicUrlInput?.value.trim(),

        bio: profileBioInput?.value.trim() || "",
        status: profileStatusInput?.value || "offline",

        autoStatusEnabled: autoStatusToggle ? autoStatusToggle.checked : false,

        countdownTitle: countdownTitleInput?.value.trim() || "",
        countdownTargetDateTime: countdownDatetimeInput?.value.trim() || "",
        countdownExpiredMessage: countdownExpiredMessageInput?.value.trim() || ""
    };

    const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

    if (newData.countdownTargetDateTime &&
        !dateTimeRegex.test(newData.countdownTargetDateTime)) {
        showProfileStatus("Invalid date format.", true);
        return;
    }

    try {

        await setDoc(
            profileDocRef,
            { ...newData, lastUpdated: serverTimestamp() },
            { merge: true }
        );

        showProfileStatus("Profile updated successfully!", false);

        if (adminPfpPreview && newData.profilePicUrl) {
            adminPfpPreview.src = newData.profilePicUrl;
            adminPfpPreview.style.display = "inline-block";
        }

    } catch (error) {
        console.error("Save error:", error);
        showProfileStatus("Error saving profile.", true);
    }
}

    document.addEventListener("DOMContentLoaded", () => {
    const autoStatusToggle = document.getElementById('auto-status-toggle');
    const profileStatusDropdown = document.getElementById('profile-status');
    const discordToggle = document.getElementById('discord-sync-toggle');

    // 1. Handle Auto-detect logic
    if (autoStatusToggle && profileStatusDropdown) {
        const updateStatusDropdown = () => {
            // Disable dropdown if toggle is ON
            profileStatusDropdown.disabled = autoStatusToggle.checked;
            
            // Optional: Visual styling for disabled state
            if (autoStatusToggle.checked) {
                profileStatusDropdown.style.opacity = "0.6";
                profileStatusDropdown.style.cursor = "not-allowed";
            } else {
                profileStatusDropdown.style.opacity = "1";
                profileStatusDropdown.style.cursor = "default";
            }
        };

        // Run on load and whenever toggled
        autoStatusToggle.addEventListener('change', updateStatusDropdown);
        updateStatusDropdown(); 
    }

    // 2. Discord Sync "Coming Soon" behavior
    if (discordToggle) {
        discordToggle.addEventListener('click', (e) => {
            // Prevent the user from checking it since it's not ready
            if (!discordToggle.checked) return; 
            
            e.preventDefault();
            discordToggle.checked = false;
            alert("The Discord Sync feature is coming soon!");
        });
    }
});


// ============================
// PROFILE PICTURE LIVE PREVIEW
// ============================
if (profilePicUrlInput && adminPfpPreview) {

    profilePicUrlInput.addEventListener("input", () => {

        const url = profilePicUrlInput.value.trim();

        if (url) {
            adminPfpPreview.src = url;
            adminPfpPreview.style.display = "inline-block";
        } else {
            adminPfpPreview.style.display = "none";
        }
    });

    adminPfpPreview.onerror = () => {
        adminPfpPreview.style.display = "none";
    };
}

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

            // --- START: ADD THIS CODE ---
            const adminProfilePic = document.getElementById('admin-profile-pic');
            if (adminProfilePic) {
                if (user.photoURL) {
                    // If the user has a Google photo URL, use it
                    adminProfilePic.src = user.photoURL;
                    adminProfilePic.style.display = 'inline-block'; // Or 'block' based on your CSS
                } else {
                    // Optional: Use a default image if they logged in via email/pass
                    // or if their Google account has no photo.
                    adminProfilePic.src = 'images/default-profile.jpg'; // Make sure this path is correct
                    adminProfilePic.style.display = 'inline-block';
                }
            }
            // --- END: ADD THIS CODE ---
            if (authStatus) authStatus.textContent = '';
            if (adminStatusElement) adminStatusElement.textContent = '';
            
            // 2. Safely load all data
            try {
                console.log("Loading all admin panel data...");
                loadProfileData();
                loadBusinessInfoData();
                setupBusinessInfoListeners();
                loadShoutoutsAdmin('tiktok');
                loadShoutoutsAdmin('instagram');
                loadShoutoutsAdmin('youtube');
                loadUsefulLinksAdmin();
                loadSocialLinksAdmin();
                loadDisabilitiesAdmin();
                loadTechItemsAdmin();
                loadLegislationAdmin();

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
        
        // --- START: ADD THIS CODE ---
        // Hide the profile picture on logout
        const adminProfilePic = document.getElementById('admin-profile-pic');
        if (adminProfilePic) {
            adminProfilePic.src = '';
            adminProfilePic.style.display = 'none';
        }
        // --- END: ADD THIS CODE ---

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

// ======================
// PREVIEW HELPERS
// ======================
function getTechPreviewThresholds() {
    return {
        cycleOld: 1500,
        cycleVeryOld: 2000,
        batteryBad: 85,
        batteryCritical: 75
    };
}

function detectPreviewOSType(osVersion) {
    if (!osVersion) return "unknown";

    const os = String(osVersion).toLowerCase();

    if (os.includes("ipados")) return "ipados";
    if (os.includes("ios")) return "ios";
    if (os.includes("macos")) return "macos";

    return "ios";
}

function formatPreviewOSType(osType) {
    if (osType === "ios") return "iOS";
    if (osType === "ipados") return "iPadOS";
    if (osType === "macos") return "macOS";
    return "OS";
}

function extractPreviewVersionString(osVersion) {
    if (!osVersion) return null;

    const match = String(osVersion).match(/(\d+(?:\.\d+){0,2})/);
    return match ? match[1] : null;
}

function normalizePreviewVersion(version) {
    return String(version)
        .split(".")
        .map(num => parseInt(num, 10))
        .map(num => isNaN(num) ? 0 : num);
}

function comparePreviewVersions(a, b) {
    const versionA = normalizePreviewVersion(a);
    const versionB = normalizePreviewVersion(b);

    const maxLength = Math.max(versionA.length, versionB.length);

    for (let i = 0; i < maxLength; i++) {
        const partA = versionA[i] || 0;
        const partB = versionB[i] || 0;

        if (partA > partB) return 1;
        if (partA < partB) return -1;
    }

    return 0;
}

function detectPreviewOSChannel(osVersion) {
    if (!osVersion) return "public";

    const os = String(osVersion).toLowerCase();

    if (os.includes("developer beta") || os.includes("dev beta")) {
        return "developer-beta";
    }

    if (os.includes("public beta")) {
        return "public-beta";
    }

    if (os.includes("beta")) {
        return "beta";
    }

    return "public";
}

function checkPreviewOSStatus(osVersion) {
    if (!osVersion) return null;

    const latestOSVersions = {
        ios: "26.5.1",
        ipados: "26.5",
        macos: "26.5.1"
    };

    const osType = detectPreviewOSType(osVersion);
    const currentVersion = extractPreviewVersionString(osVersion);
    const latestPublicVersion = latestOSVersions[osType] || latestOSVersions.ios;
    const channel = detectPreviewOSChannel(osVersion);

    if (!currentVersion) return null;

    const comparisonToPublic = comparePreviewVersions(currentVersion, latestPublicVersion);

    let status = "Latest";
    let color = "green";
    let releaseChannel = "Public";

    if (channel === "developer-beta") {
        status = "Developer Beta";
        color = "purple";
        releaseChannel = "Developer Beta";
    } else if (channel === "public-beta") {
        status = "Public Beta";
        color = "purple";
        releaseChannel = "Public Beta";
    } else if (channel === "beta") {
        status = "Beta";
        color = "purple";
        releaseChannel = "Beta";
    } else if (comparisonToPublic > 0) {
        status = "Ahead of Public";
        color = "purple";
        releaseChannel = "Pre-release / Beta";
    } else if (comparisonToPublic < 0) {
        status = "Outdated";
        color = "yellow";
        releaseChannel = "Public";
    }

    if (comparisonToPublic < 0) {
        const currentMajor = normalizePreviewVersion(currentVersion)[0] || 0;
        const latestMajor = normalizePreviewVersion(latestPublicVersion)[0] || 0;

        if (latestMajor - currentMajor >= 1) {
            status = "Very Outdated";
            color = "red";
        }
    }

    return {
        status,
        color,
        osType,
        currentVersion,
        latestPublicVersion,
        releaseChannel,
        isBeta: channel !== "public" || comparisonToPublic > 0,
        isPublicLatest: comparisonToPublic === 0 && channel === "public",
        isBehindPublic: comparisonToPublic < 0
    };
}

function calculatePreviewDeviceAge(dateBought) {
    if (!dateBought) return null;

    const bought = new Date(dateBought);
    if (isNaN(bought.getTime())) return null;

    const now = new Date();
    const diffMs = now - bought;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const years = parseFloat((days / 365).toFixed(1));

    return { days, years };
}

function detectPreviewDeviceType(item) {
    const explicitType = (item.deviceType || "").toLowerCase();
    if (explicitType) return explicitType;

    const name = (item.name || "").toLowerCase();
    const model = (item.model || "").toLowerCase();
    const iconClass = (item.iconClass || "").toLowerCase();

    if (
        name.includes("iphone") ||
        name.includes("phone") ||
        model.includes("iphone") ||
        iconClass.includes("mobile")
    ) {
        return "phone";
    }

    if (
        name.includes("ipad") ||
        name.includes("tablet") ||
        model.includes("ipad")
    ) {
        return "tablet";
    }

    if (
        name.includes("mac") ||
        name.includes("macbook") ||
        name.includes("imac") ||
        name.includes("computer") ||
        model.includes("mac") ||
        iconClass.includes("desktop") ||
        iconClass.includes("laptop")
    ) {
        return "computer";
    }

    if (
        name.includes("watch") ||
        model.includes("watch")
    ) {
        return "watch";
    }

    return "computer";
}

function checkPreviewDeviceSupport(item) {
    const currentYear = new Date().getFullYear();
    const modelYear = Number(item.modelYear ?? currentYear);
    const supportEndYear = item.supportEndYear ? Number(item.supportEndYear) : null;

    const osStatus = checkPreviewOSStatus(item.osVersion);
    const deviceType = detectPreviewDeviceType(item);

    const yearsOld = currentYear - modelYear;

    let supported = true;
    let supportLevel = "Fully Supported";
    let supportColor = "green";

    if (supportEndYear) {
        if (currentYear > supportEndYear) {
            supported = false;
            supportLevel = "Unsupported";
            supportColor = "red";
        } else if (currentYear === supportEndYear) {
            supportLevel = "Support Ending Soon";
            supportColor = "yellow";
        }
    }

    if (deviceType === "phone") {
        if (yearsOld >= 5 || osStatus?.status === "Very Outdated") {
            supported = false;
            supportLevel = "Unsupported";
            supportColor = "red";
        } else if (yearsOld >= 4 || osStatus?.isBehindPublic) {
            if (supported) {
                supportLevel = "Limited Support";
                supportColor = "yellow";
            }
        }
    }

    if (deviceType === "computer") {
        if (yearsOld >= 6 || osStatus?.status === "Very Outdated") {
            supported = false;
            supportLevel = "Unsupported";
            supportColor = "red";
        } else if (yearsOld >= 5 || osStatus?.isBehindPublic) {
            if (supported) {
                supportLevel = "Limited Support";
                supportColor = "yellow";
            }
        }
    }

    if (deviceType === "tablet") {
        if (yearsOld >= 5 || osStatus?.status === "Very Outdated") {
            supported = false;
            supportLevel = "Unsupported";
            supportColor = "red";
        } else if (yearsOld >= 4 || osStatus?.isBehindPublic) {
            if (supported) {
                supportLevel = "Limited Support";
                supportColor = "yellow";
            }
        }
    }

    if (deviceType === "watch" || deviceType === "accessory") {
        if (yearsOld >= 5) {
            supported = false;
            supportLevel = "Unsupported";
            supportColor = "red";
        } else if (yearsOld >= 4) {
            if (supported) {
                supportLevel = "Limited Support";
                supportColor = "yellow";
            }
        }
    }

    return {
        supported,
        supportLevel,
        supportColor,
        yearsOld,
        deviceType,
        modelYear,
        supportEndYear
    };
}

function estimatePreviewBatteryTrend(item) {
    const age = calculatePreviewDeviceAge(item.dateBought);
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

function calculatePreviewUpgradeScore(item) {
    const thresholds = getTechPreviewThresholds();

    const age = calculatePreviewDeviceAge(item.dateBought);
    const battery = Number(item.batteryHealth ?? 100);
    const cycles = Number(item.batteryCycles ?? 0);
    const support = checkPreviewDeviceSupport(item);
    const osStatus = checkPreviewOSStatus(item.osVersion);

    let score = 100;

    if (age) score -= age.years * 10;

    score -= (100 - battery) * 1.2;
    score -= cycles * 0.008;

    if (cycles >= thresholds.cycleVeryOld) {
        score -= 10;
    }

    if (osStatus?.isBehindPublic) {
        score -= 8;
    }

    if (osStatus?.status === "Very Outdated") {
        score -= 18;
    }

    if (support.supportLevel === "Limited Support") {
        score -= 10;
    }

    if (!support.supported) {
        score -= 25;
    }

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
        label = "Upgrade Soon";
        color = "red";
    }

    return { score, label, color };
}

function calculatePreviewUpgradeData(item) {
    const thresholds = getTechPreviewThresholds();

    const now = new Date();

    let boughtDate = null;

    if (item.dateBought) {
        boughtDate = new Date(item.dateBought);
    }

    let ageYears = 0;
    if (boughtDate && !isNaN(boughtDate.getTime())) {
        ageYears = (now - boughtDate) / (1000 * 60 * 60 * 24 * 365);
    }

    const batteryHealth = Number(item.batteryHealth ?? 100);
    const cycles = Number(item.batteryCycles ?? 0);
    const osStatus = checkPreviewOSStatus(item.osVersion);
    const support = checkPreviewDeviceSupport(item);

    const deviceType = detectPreviewDeviceType(item);
    const isPhone = deviceType === "phone";
    const isComputer = deviceType === "computer";

    const batteryBad = batteryHealth < thresholds.batteryBad;
    const batteryCritical = batteryHealth < thresholds.batteryCritical;

    const cycleOld = cycles >= thresholds.cycleOld;
    const cycleVeryOld = cycles >= thresholds.cycleVeryOld;

    const ageOld = ageYears > 3;
    const ageVeryOld = ageYears > 4;

    const outdatedOS = osStatus?.isBehindPublic && osStatus.status === "Very Outdated";

    let status = "Great";
    let color = "green";
    let suggestion = "No upgrade needed";

    let triggers = [];

    if (isPhone && batteryBad) {
        triggers.push("Battery below 85%");
    }

    if (osStatus?.isBehindPublic) {
        triggers.push("OS is outdated");
    }

    if (isComputer && osStatus?.isBehindPublic) {
        triggers.push("macOS support/update concern");
    }

    if (cycleOld) {
        triggers.push(`Charge cycles over ${thresholds.cycleOld}`);
    }

    if (cycleVeryOld) {
        triggers.push(`Charge cycles reached ${thresholds.cycleVeryOld}+`);
    }

    if (ageOld) {
        triggers.push("Device older than 3 years");
    }

    if (!support.supported) {
        triggers.push("Device no longer supported");
    }

    if (
        batteryCritical ||
        cycleVeryOld ||
        ageVeryOld ||
        outdatedOS ||
        !support.supported
    ) {
        status = "Upgrade Recommended";
        color = "red";
        suggestion = "Consider upgrading soon";
    } else if (
        batteryBad ||
        cycleOld ||
        ageOld ||
        support.supportLevel === "Limited Support" ||
        support.supportLevel === "Support Ending Soon"
    ) {
        status = "Aging";
        color = "yellow";
        suggestion = "Monitor closely";
    }

    return { status, color, suggestion, triggers };
}

function getPreviewRecommendedAction(item, upgrade, support) {
    const thresholds = getTechPreviewThresholds();

    const batteryHealth = Number(item.batteryHealth ?? 100);
    const cycles = Number(item.batteryCycles ?? 0);

    if (!support.supported) {
        return "Plan upgrade soon";
    }

    if (upgrade.status === "Upgrade Recommended") {
        if (cycles >= thresholds.cycleVeryOld && batteryHealth >= thresholds.batteryBad) {
            return "Keep for now, but monitor battery cycles closely";
        }

        return "Plan upgrade soon";
    }

    if (batteryHealth < thresholds.batteryBad && batteryHealth >= thresholds.batteryCritical) {
        return "Consider battery replacement";
    }

    if (cycles >= thresholds.cycleVeryOld) {
        return "Monitor battery cycles closely";
    }

    if (upgrade.status === "Aging") {
        return "Monitor closely";
    }

    return "Keep";
}

function generatePreviewDeviceSummary(item, upgrade, support, osStatus) {
    const thresholds = getTechPreviewThresholds();

    const deviceType = detectPreviewDeviceType(item);
    const primaryUse = item.primaryUse || '';
    const condition = item.condition || '';
    const batteryHealth = Number(item.batteryHealth ?? 100);
    const cycles = Number(item.batteryCycles ?? 0);

    let parts = [];

    if (primaryUse) {
        parts.push(`Used for ${primaryUse.toLowerCase()}`);
    } else {
        parts.push(`This ${deviceType} is being tracked`);
    }

    if (condition) {
        parts.push(`condition is ${condition.toLowerCase()}`);
    }

    if (osStatus?.isBeta) {
        parts.push("running beta software");
    } else if (osStatus?.isBehindPublic) {
        parts.push("behind the latest public OS");
    } else if (osStatus?.isPublicLatest) {
        parts.push("on the latest public OS");
    }

    if (support.supportLevel) {
        parts.push(`support status is ${support.supportLevel.toLowerCase()}`);
    }

    if (deviceType === "phone" && batteryHealth < thresholds.batteryBad) {
        parts.push("battery health is below your preferred threshold");
    }

    if (cycles >= thresholds.cycleVeryOld) {
        parts.push("battery cycles are at your upgrade-level threshold");
    } else if (cycles >= thresholds.cycleOld) {
        parts.push("battery cycles are worth monitoring");
    }

    if (upgrade.status === "Upgrade Recommended") {
        parts.push("upgrade planning is recommended");
    } else if (upgrade.status === "Aging") {
        parts.push("monitoring is recommended");
    } else {
        parts.push("no major upgrade concern right now");
    }

    return parts.join(", ") + ".";
}

/** Generates HTML for the tech item preview based on data object */
function renderTechItemPreview(data) {
    const name = data.name || 'Device Name';
    const model = data.model || '';
    const primaryUse = data.primaryUse || '';
    const condition = data.condition || '';
    const deviceType = data.deviceType || '';
    const modelYear = data.modelYear || '';
    const supportEndYear = data.supportEndYear || '';
    const iconClass = data.iconClass || 'fas fa-question-circle';
    const material = data.material || '';
    const storage = data.storage || '';
    const batteryCapacity = data.batteryCapacity || '';
    const color = data.color || '';
    const price = data.price ? `$${data.price}` : '';
    const dateReleased = data.dateReleased || '';
    const dateBought = data.dateBought || '';
    const osVersion = data.osVersion || '';

    const osStatus = checkPreviewOSStatus(osVersion);
    const support = checkPreviewDeviceSupport(data);

    let osUpdateHtml = '';

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
        <span class="support-badge ${support.supportColor || 'green'}">
            ${support.supportLevel || 'Fully Supported'}
        </span>
    </div>`;

    const batteryHealth = data.batteryHealth !== null &&
        data.batteryHealth !== undefined &&
        !isNaN(data.batteryHealth)
        ? parseInt(data.batteryHealth, 10)
        : null;

    const batteryCycles = data.batteryCycles !== null &&
        data.batteryCycles !== undefined &&
        !isNaN(data.batteryCycles)
        ? Number(data.batteryCycles)
        : null;

    const upgrade = calculatePreviewUpgradeData(data);
    const age = calculatePreviewDeviceAge(data.dateBought);
    const batteryTrend = estimatePreviewBatteryTrend(data);
    const upgradeScore = calculatePreviewUpgradeScore(data);

    if (upgradeScore.score < 40 && upgrade.status !== "Upgrade Recommended") {
        upgrade.status = "Upgrade Recommended";
        upgrade.color = "red";
        upgrade.suggestion = "Consider upgrading soon";
    } else if (upgradeScore.score < 60 && upgrade.status === "Great") {
        upgrade.status = "Aging";
        upgrade.color = "yellow";
        upgrade.suggestion = "Monitor closely";
    }

    const recommendedAction = getPreviewRecommendedAction(data, upgrade, support);

    const deviceSummary = generatePreviewDeviceSummary(data, upgrade, support, osStatus);

    const summaryHtml = `
    <div class="tech-detail tech-summary">
        <i class="fas fa-clipboard-list"></i>
        <span>Device Summary:</span>
        ${deviceSummary}
    </div>`;

    const actionHtml = `
    <div class="tech-detail">
        <i class="fas fa-tools"></i>
        <span>Recommended Action:</span>
        ${recommendedAction}
    </div>`;

    let batteryHtml = '';

    if (batteryHealth !== null) {
        let batteryClass = '';

        if (batteryHealth <= 20) {
            batteryClass = 'critical';
        } else if (batteryHealth <= 50) {
            batteryClass = 'low-power';
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

    let cyclesHtml = '';

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
            ${upgrade.status}
        </span>
    </div>

    <div class="tech-detail">
        <i class="fas fa-lightbulb"></i>
        <span>Suggestion:</span>
        ${upgrade.suggestion}
    </div>`;

    let triggersHtml = '';

    if (upgrade.triggers && upgrade.triggers.length > 0) {
        triggersHtml = `
        <div class="tech-detail">
            <i class="fas fa-exclamation-circle"></i>
            <span>Upgrade Triggers:</span>
        </div>

        <ul class="upgrade-triggers">
            ${upgrade.triggers.map(t => `<li>${t}</li>`).join('')}
        </ul>`;
    }

    const ageHtml = age ? `
    <div class="tech-detail">
        <i class="fas fa-clock"></i>
        <span>Device Age:</span>
        ${age.days} days (${age.years} years)
    </div>` : '';

    const trendHtml = batteryTrend && batteryTrend.decline !== undefined ? `
    <div class="tech-detail">
        <i class="fas fa-chart-line"></i>
        <span>Battery Trend:</span>
        ${batteryTrend.trend} (-${batteryTrend.decline}%)
    </div>` : '';

    const scoreHtml = `
    <div class="tech-detail">
        <i class="fas fa-gauge-high"></i>
        <span>Upgrade Score:</span>
        ${upgradeScore.label} (${upgradeScore.score}/100)
    </div>

    <div class="score-bar">
        <div class="score-fill ${upgradeScore.color}" style="width: ${upgradeScore.score}%"></div>
    </div>`;

    const formattedOSType = osStatus
        ? formatPreviewOSType(osStatus.osType)
        : '';

    const advancedDetailsContent = `
        ${deviceType ? `<div class="tech-detail"><i class="fas fa-microchip"></i><span>Device Type:</span> ${deviceType}</div>` : ''}
        ${modelYear ? `<div class="tech-detail"><i class="fas fa-calendar"></i><span>Model Year:</span> ${modelYear}</div>` : ''}
        ${supportEndYear ? `<div class="tech-detail"><i class="fas fa-shield-halved"></i><span>Support End Year:</span> ${supportEndYear}</div>` : ''}
        ${material ? `<div class="tech-detail"><i class="fas fa-layer-group"></i><span>Material:</span> ${material}</div>` : ''}
        ${batteryCapacity ? `<div class="tech-detail"><i class="fas fa-battery-full"></i><span>Battery Capacity:</span> ${batteryCapacity}</div>` : ''}
        ${price ? `<div class="tech-detail"><i class="fas fa-tag"></i><span>Price:</span> ${price}</div>` : ''}
        ${dateReleased ? `<div class="tech-detail"><i class="fas fa-calendar-plus"></i><span>Date Released:</span> ${dateReleased}</div>` : ''}
        ${dateBought ? `<div class="tech-detail"><i class="fas fa-shopping-cart"></i><span>Date Bought:</span> ${dateBought}</div>` : ''}
        ${cyclesHtml}
        ${trendHtml}
    `;

    const hasAdvancedDetails =
        deviceType ||
        modelYear ||
        supportEndYear ||
        material ||
        batteryCapacity ||
        price ||
        dateReleased ||
        dateBought ||
        cyclesHtml ||
        trendHtml;

    const advancedHtml = hasAdvancedDetails ? `
    <details class="tech-advanced-details">
        <summary>Advanced Details</summary>
        ${advancedDetailsContent}
    </details>` : '';

    return `
    <div class="tech-item">
        <h3><i class="${iconClass}"></i> ${name}</h3>

        ${model ? `<div class="tech-detail"><i class="fas fa-info-circle"></i><span>Model:</span> ${model}</div>` : ''}
        ${primaryUse ? `<div class="tech-detail"><i class="fas fa-bullseye"></i><span>Primary Use:</span> ${primaryUse}</div>` : ''}
        ${condition ? `<div class="tech-detail"><i class="fas fa-screwdriver-wrench"></i><span>Condition:</span> ${condition}</div>` : ''}
        ${storage ? `<div class="tech-detail"><i class="fas fa-hdd"></i><span>Storage:</span> ${storage}</div>` : ''}
        ${color ? `<div class="tech-detail"><i class="fas fa-palette"></i><span>Color:</span> ${color}</div>` : ''}

        ${summaryHtml}
        ${ageHtml}

        ${osVersion ? `
        <div class="tech-detail">
            <i class="fab fa-apple"></i>
            <span>OS Version:</span> ${osVersion}
            ${osStatus ? `<span class="os-badge ${osStatus.color}">${osStatus.status}</span>` : ''}
        </div>

        ${osStatus ? `
        <div class="tech-detail">
            <i class="fas fa-code-branch"></i>
            <span>Release Channel:</span> ${osStatus.releaseChannel}
        </div>

        <div class="tech-detail">
            <i class="fas fa-circle-info"></i>
            <span>Public Latest:</span> ${formattedOSType} ${osStatus.latestPublicVersion}
        </div>
        ` : ''}
        ` : ''}

        ${osUpdateHtml}
        ${supportHtml}
        ${batteryHtml}
        ${scoreHtml}
        ${upgradeHtml}
        ${actionHtml}
        ${triggersHtml}
        ${advancedHtml}
    </div>`;
}

/** Reads form data and updates the corresponding tech preview area */
function updateTechItemPreview(formType) {
    let formElement;
    let previewElement;

    if (formType === 'add') {
        formElement = addTechItemForm;
        previewElement = addTechItemPreview;
    } else if (formType === 'edit') {
        formElement = editTechItemForm;
        previewElement = editTechItemPreview;
    } else {
        return;
    }

    if (!formElement || !previewElement) {
        return;
    }

    const techData = {};
    const inputs = formElement.querySelectorAll('input[name], select[name], textarea[name]');

    inputs.forEach(input => {
        const name = input.name;
        let value = input.value.trim();

        if (input.type === 'number') {
            value = input.value === '' ? null : parseFloat(input.value);
            if (isNaN(value)) value = null;
        }

        techData[name] = value === '' ? null : value;
    });

    try {
        const previewHTML = renderTechItemPreview(techData);
        previewElement.innerHTML = previewHTML;
    } catch (e) {
        console.error("Error rendering tech preview:", e);
        previewElement.innerHTML = '<p class="error"><small>Error generating preview.</small></p>';
    }
}

/** Attaches input/change listeners to tech form inputs to trigger preview updates */
function attachTechPreviewListeners(formElement, formType) {
    if (!formElement) return;

    const inputs = formElement.querySelectorAll('input[name], select[name], textarea[name]');
    console.log(`Attaching preview listeners to ${inputs.length} inputs for ${formType} tech form.`);

    inputs.forEach(input => {
        const eventType = (input.type === 'checkbox' || input.tagName.toLowerCase() === 'select')
            ? 'change'
            : 'input';

        const listenerFlag = `__techPreviewListener_${eventType}`;

        if (!input[listenerFlag]) {
            input.addEventListener(eventType, () => {
                updateTechItemPreview(formType);
            });

            input[listenerFlag] = true;
        }
    });
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
    // It MUST be INSIDE the DOMContentLoaded listener, after the functions are defined

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
