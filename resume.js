import { db } from "./firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

function setText(id, value = "") {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderTagList(containerId, items = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  items.forEach(item => {
    const span = document.createElement("span");
    span.textContent = item;
    container.appendChild(span);
  });
}

function renderSimpleList(containerId, items = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  items.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    container.appendChild(li);
  });
}

function renderExperience(items = []) {
  const container = document.getElementById("experience-list");
  if (!container) return;

  container.innerHTML = "";

  items.forEach(item => {
    const job = document.createElement("article");
    job.className = "job";

    const title = document.createElement("h3");
    title.textContent = item.title || "";

    const meta = document.createElement("p");
    meta.className = "job-meta";
    meta.textContent = [item.company, item.dates].filter(Boolean).join(" • ");

    job.appendChild(title);

    if (meta.textContent) {
      job.appendChild(meta);
    }

    if (Array.isArray(item.details) && item.details.length) {
      const ul = document.createElement("ul");

      item.details.forEach(detail => {
        const li = document.createElement("li");
        li.textContent = detail;
        ul.appendChild(li);
      });

      job.appendChild(ul);
    }

    container.appendChild(job);
  });
}

function renderEducation(items = []) {
  const container = document.getElementById("education-list");
  if (!container) return;

  container.innerHTML = "";

  items.forEach(item => {
    const edu = document.createElement("article");
    edu.className = "education-item";

    const school = document.createElement("h3");
    school.textContent = item.school || "";

    const degree = document.createElement("p");
    degree.textContent = item.degree || "";

    const dates = document.createElement("p");
    dates.className = "education-dates";
    dates.textContent = item.dates || "";

    edu.appendChild(school);

    if (degree.textContent) {
      edu.appendChild(degree);
    }

    if (dates.textContent) {
      edu.appendChild(dates);
    }

    container.appendChild(edu);
  });
}

async function loadResume() {
  try {
    const snap = await getDoc(doc(db, "site_config", "mainProfile"));

    if (!snap.exists()) {
      console.warn("Resume data not found.");
      return;
    }

    const data = snap.data();

    setText("name", data.name || "");
    setText("contact", data.contact || "");
    setText("summary", data.summary || "");

    const emailEl = document.getElementById("email");
    if (emailEl) {
      emailEl.textContent = data.email || "";
      emailEl.href = data.email ? `mailto:${data.email}` : "#";
    }

    renderTagList("skills-list", data.skills || []);
    renderTagList("languages-list", data.languages || []);
    renderExperience(data.experience || []);
    renderEducation(data.education || []);
    renderSimpleList("certifications-list", data.certifications || []);
    renderSimpleList("projects-list", data.projects || []);
  } catch (err) {
    console.error("Error loading resume:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  loadResume();
});
