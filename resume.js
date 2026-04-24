import { db } from "./firebase-init.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

/* ========================= */
/* STATE CONTROL */
/* ========================= */

let resumeReady = false;

/* ========================= */
/* BASIC HELPERS */
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
    return value.split(/\r?\n/).map((i) => i.trim()).filter(Boolean);
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
  ].filter(Boolean).join(" • ");
}

/* ========================= */
/* RENDERERS */
/* ========================= */

function renderTagList(id, items = []) {
  const container = $(id);
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

    const header = document.createElement("div");
    header.className = "job-header";

    const left = document.createElement("div");
    const right = document.createElement("div");

    const title = document.createElement("h3");
    title.textContent = item.title || "";

    const company = document.createElement("p");
    company.textContent = [item.company, item.location].filter(Boolean).join(" • ");

    const dates = document.createElement("p");
    dates.textContent = item.dates || item.date || "";

    if (title.textContent) left.appendChild(title);
    if (company.textContent) left.appendChild(company);
    if (dates.textContent) right.appendChild(dates);

    header.appendChild(left);
    header.appendChild(right);
    job.appendChild(header);

    const details = Array.isArray(item.details) ? item.details : [];

    if (details.length) {
      const ul = document.createElement("ul");
      details.forEach((d) => {
        const li = document.createElement("li");
        li.textContent = String(d);
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
    if (!item) return;

    const edu = document.createElement("article");
    edu.className = "education-item";

    const school = document.createElement("h3");
    school.textContent = item.school || item.institution || "";

    const degree = document.createElement("p");
    degree.textContent = [item.degree, item.field, item.location]
      .filter(Boolean)
      .join(" • ");

    edu.appendChild(school);
    edu.appendChild(degree);

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
      const url = normalizeUrl(item.link || item.url || "");

      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.textContent = name || url;
        li.appendChild(a);
      } else {
        li.textContent = name;
      }
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
      li.textContent = [
        item.name,
        item.issuer,
        item.date
      ].filter(Boolean).join(" — ");
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
    setText("location", data.location);

    setLinkOrText("email", data.email, `mailto:${data.email}`);
    setLinkOrText("phone", data.phone, normalizePhoneHref(data.phone));
    setLinkOrText("website", data.website, normalizeUrl(data.website), true);
    setLinkOrText("linkedin", data.linkedin, normalizeUrl(data.linkedin), true);

    renderTagList("skills-list", data.skills);
    renderTagList("languages-list", data.languages);
    renderExperience(data.experience);
    renderEducation(data.education);
    renderCertifications(data.certifications);
    renderProjects(data.projects);

    resumeReady = true;

  } catch (err) {
    console.error(err);
  }
}

/* ========================= */
/* PDF DOWNLOAD (FIXED) */
/* ========================= */

function initPDFDownload() {
  const btn = document.getElementById("download-btn");

  if (!btn) return;

  btn.addEventListener("click", () => {
    if (!resumeReady) {
      alert("Resume is still loading. Please wait a moment and try again.");
      return;
    }

    setTimeout(() => {
      window.print();
    }, 250);
  });
}

/* ========================= */
/* INIT */
/* ========================= */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    loadResume();
    initPDFDownload();
  });
} else {
  loadResume();
  initPDFDownload();
}
