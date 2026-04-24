import { db } from "./firebase-init.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebasejs-firestore.js";

const $ = (id) => document.getElementById(id);

/* ========================= */
/* HELPERS                   */
/* ========================= */
function setText(id, value = "") {
  const node = $(id);
  if (node) node.textContent = value || "";
}

function setLinkOrText(id, text = "", href = "", external = false) {
  const node = $(id);
  if (!node) return;

  const cleanText = String(text || "").trim();
  node.textContent = cleanText;

  if (node.tagName === "A") {
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
  if (Array.isArray(value)) return value.map(i => String(i).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/\r?\n/).map(i => i.trim()).filter(Boolean);
  return [];
}

function normalizeUrl(url = "") {
  const clean = String(url || "").trim();
  if (!clean) return "";
  if (/^https?:\/\//i.test(clean)) return clean;
  return `https://${clean}`;
}

function normalizePhoneHref(phone = "") {
  const digits = String(phone).replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

/* ========================= */
/* RENDERING FUNCTIONS       */
/* ========================= */

// Renders Skill/Language Pills
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

// Renders Experience with Logo Support
function renderExperience(items = []) {
  const container = $("experience-list");
  if (!container) return;
  container.innerHTML = "";

  normalizeArray(items).forEach((item) => {
    const job = document.createElement("div");
    job.className = "job";

    // Create the wrapper for Logo + Info
    const wrapper = document.createElement("div");
    wrapper.className = "item-wrapper";

    // Add Logo if exists in Firebase
    if (item.logo) {
      const img = document.createElement("img");
      img.src = item.logo;
      img.className = "item-logo";
      img.alt = `${item.company} logo`;
      wrapper.appendChild(img);
    }

    const info = document.createElement("div");
    info.className = "item-info";

    const title = document.createElement("h3");
    title.textContent = item.title || "";

    const company = document.createElement("p");
    company.textContent = `${item.company || item.employer || ""} • ${item.dates || ""}`;

    info.appendChild(title);
    info.appendChild(company);
    wrapper.appendChild(info);
    job.appendChild(wrapper);

    // Bullet points
    const details = item.details || item.bullets || [];
    if (details.length) {
      const ul = document.createElement("ul");
      normalizeStringArray(details).forEach((detail) => {
        const li = document.createElement("li");
        li.textContent = detail;
        ul.appendChild(li);
      });
      job.appendChild(ul);
    }
    container.appendChild(job);
  });
}

// Renders Education with Logo Support
function renderEducation(items = []) {
  const container = $("education-list");
  if (!container) return;
  container.innerHTML = "";

  normalizeArray(items).forEach((item) => {
    const edu = document.createElement("div");
    edu.className = "education-item";

    const wrapper = document.createElement("div");
    wrapper.className = "item-wrapper";

    if (item.logo) {
      const img = document.createElement("img");
      img.src = item.logo;
      img.className = "item-logo";
      wrapper.appendChild(img);
    }

    const info = document.createElement("div");
    info.className = "item-info";

    const school = document.createElement("h3");
    school.textContent = item.school || item.institution || "";

    const degree = document.createElement("p");
    degree.textContent = `${item.degree || item.program || ""} • ${item.dates || ""}`;

    info.appendChild(school);
    info.appendChild(degree);
    wrapper.appendChild(info);
    edu.appendChild(wrapper);

    container.appendChild(edu);
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
      li.textContent = `${item.name || item.title} — ${item.issuer || ""}`;
    }
    container.appendChild(li);
  });
}

function renderProjects(items = []) {
  const container = $("projects-list");
  if (!container) return;
  container.innerHTML = "";

  normalizeArray(items).forEach((item) => {
    const li = document.createElement("li");
    const name = item.name || item.title || "Project";
    const stack = item.stack || item.tech || "";
    const desc = item.description || "";
    
    li.innerHTML = `<strong>${name}</strong> ${stack ? `<em>(${stack})</em>` : ""} — ${desc}`;
    container.appendChild(li);
  });
}

/* ========================= */
/* CORE LOAD LOGIC           */
/* ========================= */
async function loadResume() {
  try {
    const snap = await getDoc(doc(db, "site_config", "mainProfile"));
    if (!snap.exists()) return;

    const data = snap.data();

    // Basic Info
    setText("name", data.name);
    setText("professional-title", data.title || "IT & Cybersecurity Student");
    setText("summary", data.summary);
    setText("location", data.location || "Toledo, OH");

    // Contact Links
    setLinkOrText("email", data.email, `mailto:${data.email}`);
    setLinkOrText("phone", data.phone, normalizePhoneHref(data.phone));
    setLinkOrText("website", data.website, normalizeUrl(data.website), true);
    setLinkOrText("linkedin", "LinkedIn", normalizeUrl(data.linkedin), true);

    // Lists
    renderTagList("skills-list", data.skills);
    renderTagList("languages-list", data.languages);
    renderExperience(data.experience);
    renderEducation(data.education);
    renderCertifications(data.certifications);
    renderProjects(data.projects);

    // Set Footer Year
    const yearNode = $("year");
    if (yearNode) yearNode.textContent = new Date().getFullYear();

  } catch (error) {
    console.error("Error loading resume:", error);
  }
}

// Initial Run
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadResume);
} else {
  loadResume();
}
