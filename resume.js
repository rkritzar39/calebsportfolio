import { db } from "./firebase-init.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

/* ========================= */
/* HELPERS & NORMALIZATION   */
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
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function normalizeUrl(url = "") {
  const clean = String(url || "").trim();
  if (!clean) return "";
  if (/^https?:\/\//i.test(clean)) return clean;
  return `https://${clean}`;
}

function normalizePhoneHref(phone = "") {
  const digits = String(phone || "").replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

/* ========================= */
/* RENDERING LOGIC           */
/* ========================= */

// Renders Skills & Languages as Pills
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

// Renders Experience using the Bento/Logo structure
function renderExperience(items = []) {
  const container = $("experience-list");
  if (!container) return;
  container.innerHTML = "";

  normalizeArray(items).forEach((item) => {
    const job = document.createElement("div");
    job.className = "job";

    const wrapper = document.createElement("div");
    wrapper.className = "item-wrapper";

    // Logo support
    if (item.logo) {
      const img = document.createElement("img");
      img.src = item.logo;
      img.className = "item-logo";
      img.alt = `${item.company || 'Company'} logo`;
      wrapper.appendChild(img);
    }

    const info = document.createElement("div");
    info.className = "item-info";

    const title = document.createElement("h3");
    title.textContent = item.title || "";

    const meta = document.createElement("p");
    const company = item.company || item.employer || "";
    const dates = item.dates || item.date || "";
    meta.textContent = [company, dates].filter(Boolean).join(" • ");

    info.appendChild(title);
    info.appendChild(meta);
    wrapper.appendChild(info);
    job.appendChild(wrapper);

    // Bullets
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

// Renders Education using the Bento/Logo structure
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
    const program = item.degree || item.program || "";
    const dates = item.dates || item.date || "";
    degree.textContent = [program, dates].filter(Boolean).join(" • ");

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
      const parts = [item.name || item.title, item.issuer || item.organization, item.date].filter(Boolean);
      li.textContent = parts.join(" — ");
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
    const name = item.name || item.title || "";
    const stack = item.stack || item.tech || "";
    const desc = item.description || "";
    const url = normalizeUrl(item.link || item.url || "");

    if (url) {
      li.innerHTML = `<a href="${url}" target="_blank"><strong>${name}</strong></a> ${stack ? `<em>(${stack})</em>` : ""} — ${desc}`;
    } else {
      li.innerHTML = `<strong>${name}</strong> ${stack ? `<em>(${stack})</em>` : ""} — ${desc}`;
    }
    container.appendChild(li);
  });
}

/* ========================= */
/* DATA LOADING              */
/* ========================= */

async function loadResume() {
  try {
    const snap = await getDoc(doc(db, "site_config", "mainProfile"));
    if (!snap.exists()) return;

    const data = snap.data() || {};

    // Basic Header Info
    setText("name", data.name);
    setText("professional-title", data.title || "IT & Cybersecurity Student");
    setText("summary", data.summary);
    setText("location", data.location || data.city);

    // Links
    setLinkOrText("email", data.email, data.email ? `mailto:${data.email}` : "");
    setLinkOrText("phone", data.phone, normalizePhoneHref(data.phone));
    setLinkOrText("website", data.website, normalizeUrl(data.website), true);
    setLinkOrText("linkedin", "LinkedIn", normalizeUrl(data.linkedin), true);

    // Bento Sections
    renderTagList("skills-list", data.skills);
    renderTagList("languages-list", data.languages);
    renderExperience(data.experience);
    renderEducation(data.education);
    renderCertifications(data.certifications);
    renderProjects(data.projects);

    // Footer Year
    if ($("year")) $("year").textContent = new Date().getFullYear();

  } catch (error) {
    console.error("Error loading resume:", error);
  }
}

// Bootstrap
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadResume);
} else {
  loadResume();
}
