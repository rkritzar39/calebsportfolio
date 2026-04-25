import { db } from "./firebase-init.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

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

function renderSimpleList(containerId, items = []) {
  const container = $(containerId);
  if (!container) return;

  container.innerHTML = "";

  normalizeArray(items).forEach((item) => {
    const li = document.createElement("li");

    if (typeof item === "string") {
      li.textContent = item;
    } else if (item && typeof item === "object") {
      const parts = [
        item.name || item.title || "",
        item.issuer || item.organization || "",
        item.date || ""
      ].filter(Boolean);

      li.textContent = parts.join(" — ");
    }

    if (li.textContent.trim()) {
      container.appendChild(li);
    }
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
    left.className = "job-left";

    const right = document.createElement("div");
    right.className = "job-right";

    const title = document.createElement("h3");
    title.textContent = item.title || "";

    const companyLine = document.createElement("p");
    companyLine.className = "job-company";
    companyLine.textContent = [item.company || item.employer || "", item.location || item.city || ""]
      .filter(Boolean)
      .join(" • ");

    const dates = document.createElement("p");
    dates.className = "job-dates";
    dates.textContent = item.dates || item.date || "";

    if (title.textContent.trim()) left.appendChild(title);
    if (companyLine.textContent.trim()) left.appendChild(companyLine);
    if (dates.textContent.trim()) right.appendChild(dates);

    if (left.children.length || right.children.length) {
      header.appendChild(left);
      header.appendChild(right);
      job.appendChild(header);
    }

    const details = Array.isArray(item.details)
      ? item.details
      : Array.isArray(item.bullets)
      ? item.bullets
      : [];

    if (details.length) {
      const ul = document.createElement("ul");

      details
        .map((detail) => String(detail).trim())
        .filter(Boolean)
        .forEach((detail) => {
          const li = document.createElement("li");
          li.textContent = detail;
          ul.appendChild(li);
        });

      if (ul.children.length) {
        job.appendChild(ul);
      }
    }

    if (job.children.length) {
      container.appendChild(job);
    }
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

    const header = document.createElement("div");
    header.className = "education-header";

    const left = document.createElement("div");
    left.className = "education-left";

    const right = document.createElement("div");
    right.className = "education-right";

    const school = document.createElement("h3");
    school.textContent = item.school || item.institution || "";

    const degreeLine = document.createElement("p");
    degreeLine.className = "education-degree";

    const degreeParts = [
      item.type || "",
      item.degree || item.program || item.field || "",
      item.location || ""
    ].filter(Boolean);

    degreeLine.textContent = degreeParts.join(" • ");

    const dates = document.createElement("p");
    dates.className = "education-dates";
    dates.textContent = item.dates || item.date || "";

    if (school.textContent.trim()) left.appendChild(school);
    if (degreeLine.textContent.trim()) left.appendChild(degreeLine);
    if (dates.textContent.trim()) right.appendChild(dates);

    if (left.children.length || right.children.length) {
      header.appendChild(left);
      header.appendChild(right);
      edu.appendChild(header);
    }

    if (item.gpa) {
      const gpa = document.createElement("p");
      gpa.className = "education-gpa";
      gpa.textContent = `GPA: ${item.gpa}`;
      edu.appendChild(gpa);
    }

    const extraDetails = [
      ...normalizeStringArray(item.details),
      ...normalizeStringArray(item.notes)
    ];

    if (extraDetails.length) {
      const ul = document.createElement("ul");

      extraDetails.forEach((detail) => {
        const li = document.createElement("li");
        li.textContent = detail;
        ul.appendChild(li);
      });

      if (ul.children.length) {
        edu.appendChild(ul);
      }
    }

    if (edu.children.length) {
      container.appendChild(edu);
    }
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
    } else if (item && typeof item === "object") {
      const name = item.name || item.title || "";
      const description = item.description || "";
      const stack = item.stack || item.tech || "";
      const url = normalizeUrl(item.link || item.url || item.website || "");

      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = name || url;
        li.appendChild(link);

        const extras = [];
        if (stack) extras.push(`Tech: ${stack}`);
        if (description) extras.push(description);

        if (extras.length) {
          li.appendChild(document.createTextNode(` — ${extras.join(" • ")}`));
        }
      } else {
        const parts = [name];
        if (stack) parts.push(`Tech: ${stack}`);
        if (description) parts.push(description);

        li.textContent = parts.filter(Boolean).join(" — ");
      }
    }

    if (li.textContent.trim() || li.querySelector("a")) {
      container.appendChild(li);
    }
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
    } else if (item && typeof item === "object") {
      const parts = [
        item.name || item.title || "",
        item.issuer || item.organization || "",
        item.date || ""
      ].filter(Boolean);

      li.textContent = parts.join(" — ");
    }

    if (li.textContent.trim()) {
      container.appendChild(li);
    }
  });
}

async function loadResume() {
  try {
    const snap = await getDoc(doc(db, "site_config", "mainProfile"));

    if (!snap.exists()) {
      console.warn("Resume document not found: site_config/mainProfile");
      return;
    }

    const data = snap.data() || {};

    setText("name", data.name || "");
    setText("title", data.title || "");
    setText("professional-title", data.title || "");
    setText("contact", buildContactLine(data));
    setText("location", data.location || data.city || "");
    setText("summary", data.summary || "");

    setLinkOrText("email", data.email || "", data.email ? `mailto:${data.email}` : "");
    setLinkOrText("phone", data.phone || "", normalizePhoneHref(data.phone || ""));
    setLinkOrText("website", data.website || "", normalizeUrl(data.website || ""), true);
    setLinkOrText("linkedin", data.linkedin || "", normalizeUrl(data.linkedin || ""), true);

    renderTagList("skills-list", data.skills || []);
    renderTagList("languages-list", data.languages || []);
    renderExperience(data.experience || []);
    renderEducation(data.education || []);
    renderCertifications(data.certifications || []);
    renderProjects(data.projects || []);
  } catch (error) {
    console.error("Error loading resume:", error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadResume);
} else {
  loadResume();
}
