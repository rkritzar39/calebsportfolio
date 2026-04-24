import { db } from "./firebase-init.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

/* ========================= */
/* STATE LOCK */
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

  const clean = String(text || "").trim();
  node.textContent = clean;

  if ("href" in node) {
    node.href = clean ? href : "#";

    if (external) {
      node.target = "_blank";
      node.rel = "noopener noreferrer";
    }
  }
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/* ========================= */
/* RENDER COMPLETE TRACKING */
/* ========================= */

let renderDone = false;

function markRenderComplete() {
  // forces browser to finish layout painting
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      renderDone = true;
      resumeReady = true;
    });
  });
}

/* ========================= */
/* RENDER FUNCTIONS (UNCHANGED LOGIC) */
/* ========================= */

function renderTagList(id, items = []) {
  const el = $(id);
  if (!el) return;
  el.innerHTML = "";
  items.forEach(i => {
    const s = document.createElement("span");
    s.textContent = i;
    el.appendChild(s);
  });
}

function renderSimpleList(id, items = []) {
  const el = $(id);
  if (!el) return;
  el.innerHTML = "";
  items.forEach(i => {
    const li = document.createElement("li");
    li.textContent = typeof i === "string" ? i : (i?.name || "");
    el.appendChild(li);
  });
}

/* EXPERIENCE */
function renderExperience(items = []) {
  const el = $("experience-list");
  if (!el) return;
  el.innerHTML = "";

  items.forEach(item => {
    const div = document.createElement("article");
    div.className = "job";

    div.innerHTML = `
      <div class="job-header">
        <div class="job-left">
          <h3>${item.title || ""}</h3>
          <p>${item.company || ""}</p>
        </div>
        <div class="job-right">
          <p class="job-dates">${item.dates || ""}</p>
        </div>
      </div>
    `;

    el.appendChild(div);
  });
}

/* EDUCATION */
function renderEducation(items = []) {
  const el = $("education-list");
  if (!el) return;
  el.innerHTML = "";

  items.forEach(item => {
    const div = document.createElement("article");
    div.className = "education-item";

    div.innerHTML = `
      <h3>${item.school || ""}</h3>
      <p>${item.degree || ""}</p>
    `;

    el.appendChild(div);
  });
}

/* PROJECTS */
function renderProjects(items = []) {
  const el = $("projects-list");
  if (!el) return;
  el.innerHTML = "";

  items.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item.name || item.title || "";
    el.appendChild(li);
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
    setText("summary", data.summary);
    setText("location", data.location);

    setLinkOrText("email", data.email, `mailto:${data.email}`);
    setLinkOrText("phone", data.phone, `tel:${data.phone}`);
    setLinkOrText("website", data.website, data.website, true);
    setLinkOrText("linkedin", data.linkedin, data.linkedin, true);

    renderTagList("skills-list", data.skills || []);
    renderTagList("languages-list", data.languages || []);
    renderExperience(data.experience || []);
    renderEducation(data.education || []);
    renderSimpleList("certifications-list", data.certifications || []);
    renderProjects(data.projects || []);

    markRenderComplete();

  } catch (err) {
    console.error(err);
  }
}

/* ========================= */
/* PRINT FIX (THIS IS THE KEY) */
/* ========================= */

function initDownload() {
  const btn = document.getElementById("download-btn");

  btn?.addEventListener("click", () => {

    if (!resumeReady || !renderDone) {
      alert("Resume is still loading. Try again in a second.");
      return;
    }

    // FORCE layout paint BEFORE print
    document.body.offsetHeight;

    setTimeout(() => {
      window.print();
    }, 400);
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
