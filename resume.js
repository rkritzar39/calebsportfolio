import { db } from "./firebase-init.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

/* ========================= */
/* STATE CONTROL (IMPORTANT) */
/* ========================= */

let resumeReady = false;

/* ========================= */
/* UTILITIES */
/* ========================= */

const $ = (id) => document.getElementById(id);

function setText(id, value = "") {
  const node = $(id);
  if (node) node.textContent = value || "";
}

function setLinkOrText(id, text = "", href = "", external = false) {
  const node = $(id);
  if (!node) return;

  const cleanText = String(text || "").trim();
  node.textContent = cleanText;

  if ("href" in node) {
    node.href = cleanText ? href : "#";

    if (external) {
      node.target = "_blank";
      node.rel = "noopener noreferrer";
    }
  }
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeUrl(url = "") {
  const clean = String(url || "").trim();
  if (!clean) return "";

  if (/^https?:\/\//i.test(clean)) return clean;
  if (/^\/\//.test(clean)) return `https:${clean}`;

  return `https://${clean}`;
}

function normalizePhoneHref(phone = "") {
  const clean = String(phone || "").trim();
  if (!clean) return "";

  const digits = clean.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

function buildContactLine(data = {}) {
  const directContact = (data.contact || "").trim();
  if (directContact) return directContact;

  return [
    data.location || data.city || "",
    data.phone || "",
    data.website || "",
    data.linkedin || ""
  ]
    .filter(Boolean)
    .join(" • ");
}

/* ========================= */
/* RENDER FUNCTIONS */
/* ========================= */

function renderTagList(containerId, items = []) {
  const container = $(containerId);
  if (!container) return;

  container.innerHTML = "";

  normalizeStringArray(items).forEach((item) => {
    const span = document.createElement("span");
    span.textContent = item;
    container.appendChild(span);
  });
}

function renderExperience(items = []) {
  const container = $("experience-list");
  if (!container) return;

  container.innerHTML = "";

  normalizeArray(items).forEach((item) => {
    if (!item || typeof item !== "object") return;

    const job = document.createElement("article");
    job.className = "job";

    job.innerHTML = `
      <div class="job-header">
        <div class="job-left">
          <h3>${item.title || ""}</h3>
          <p>${item.company || item.employer || ""}</p>
        </div>
        <div class="job-right">
          <p class="job-dates">${item.dates || item.date || ""}</p>
        </div>
      </div>
    `;

    const details = Array.isArray(item.details)
      ? item.details
      : Array.isArray(item.bullets)
      ? item.bullets
      : [];

    if (details.length) {
      const ul = document.createElement("ul");

      details.forEach((d) => {
        const li = document.createElement("li");
        li.textContent = String(d).trim();
        ul.appendChild(li);
      });

      job.appendChild(ul);
    }

    container.appendChild(job);
  });
}

function renderEducation(items = []) {
  const container = $("education-list");
  if (!container) return;

  container.innerHTML = "";

  normalizeArray(items).forEach((item) => {
    if (!item || typeof item !== "object") return;

    const edu = document.createElement("article");
    edu.className = "education-item";

    edu.innerHTML = `
      <h3>${item.school || item.institution || ""}</h3>
      <p>${item.degree || item.program || ""}</p>
      <p class="education-dates">${item.dates || ""}</p>
    `;

    container.appendChild(edu);
  });
}

function renderProjects(items = []) {
  const container = $("projects-list");
  if (!container) return;

  container.innerHTML = "";

  normalizeArray(items).forEach((item) => {
    const li = document.createElement("li");

    if (typeof item === "string") {
      li.textContent = item;
    } else {
      const name = item.name || item.title || "";
      li.textContent = name;
    }

    container.appendChild(li);
  });
}

function renderCertifications(items = []) {
  const container = $("certifications-list");
  if (!container) return;

  container.innerHTML = "";

  normalizeArray(items).forEach((item) => {
    const li = document.createElement("li");

    if (typeof item === "string") {
      li.textContent = item;
    } else {
      li.textContent = item.name || item.title || "";
    }

    container.appendChild(li);
  });
}

/* ========================= */
/* FIREBASE LOAD */
/* ========================= */

async function loadResume() {
  try {
    const snap = await getDoc(doc(db, "site_config", "mainProfile"));

    if (!snap.exists()) return;

    const data = snap.data();

    setText("name", data.name);
    setText("title", data.title);
    setText("professional-title", data.title);
    setText("summary", data.summary);
    setText("location", data.location || data.city);

    setLinkOrText("email", data.email, `mailto:${data.email}`);
    setLinkOrText("phone", data.phone, `tel:${data.phone}`);
    setLinkOrText("website", data.website, normalizeUrl(data.website), true);
    setLinkOrText("linkedin", data.linkedin, normalizeUrl(data.linkedin), true);

    renderTagList("skills-list", data.skills || []);
    renderTagList("languages-list", data.languages || []);
    renderExperience(data.experience || []);
    renderEducation(data.education || []);
    renderCertifications(data.certifications || []);
    renderProjects(data.projects || []);

    /* ✅ CRITICAL FIX: mark fully rendered */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resumeReady = true;
      });
    });

  } catch (err) {
    console.error("Resume load error:", err);
  }
}

/* ========================= */
/* DOWNLOAD HANDLER (FIXED) */
/* ========================= */

function initDownload() {
  const btn = document.getElementById("download-btn");

  btn?.addEventListener("click", () => {
    if (!resumeReady) {
      alert("Resume is still loading. Try again in a moment.");
      return;
    }

    // force full layout paint before print
    document.body.offsetHeight;

    setTimeout(() => {
      window.print();
    }, 300);
  });
}

/* ========================= */
/* INIT */
/* ========================= */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    loadResume();
    initDownload();
  });
} else {
  loadResume();
  initDownload();
}
