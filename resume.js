import { db } from "./firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

function setText(id, value = "") {
  const el = $(id);
  if (el) el.textContent = value || "";
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeObjectArray(value) {
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

function buildContactLine(data) {
  const directContact = (data.contact || "").trim();
  if (directContact) return directContact;

  return [
    data.city || "",
    data.phone || "",
    data.website || ""
  ].filter(Boolean).join(" • ");
}

function renderTagList(containerId, items = []) {
  const container = $(containerId);
  if (!container) return;

  container.innerHTML = "";

  normalizeStringArray(items).forEach(item => {
    const span = document.createElement("span");
    span.textContent = item;
    container.appendChild(span);
  });
}

function renderSimpleList(containerId, items = []) {
  const container = $(containerId);
  if (!container) return;

  container.innerHTML = "";

  items.forEach(item => {
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

  normalizeObjectArray(items).forEach(item => {
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

    const companyLocation = [
      item.company || item.employer || "",
      item.location || item.city || ""
    ].filter(Boolean).join(" • ");

    companyLine.textContent = companyLocation;

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

      details.forEach(detail => {
        const li = document.createElement("li");
        li.textContent = detail;
        ul.appendChild(li);
      });

      job.appendChild(ul);
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

  normalizeObjectArray(items).forEach(item => {
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
      item.degree || "",
      item.field || "",
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

    const details = Array.isArray(item.details) ? item.details : [];
    if (details.length) {
      const ul = document.createElement("ul");

      details.forEach(detail => {
        const li = document.createElement("li");
        li.textContent = detail;
        ul.appendChild(li);
      });

      edu.appendChild(ul);
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

  items.forEach(item => {
    const li = document.createElement("li");

    if (typeof item === "string") {
      li.textContent = item;
    } else if (item && typeof item === "object") {
      const name = item.name || item.title || "";
      const description = item.description || "";
      const url = item.url || "";

      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = name || url;
        li.appendChild(link);

        if (description) {
          li.appendChild(document.createTextNode(` — ${description}`));
        }
      } else {
        li.textContent = [name, description].filter(Boolean).join(" — ");
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

  items.forEach(item => {
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
    setText("contact", buildContactLine(data));
    setText("summary", data.summary || "");

    const emailEl = $("email");
    if (emailEl) {
      const email = (data.email || "").trim();
      emailEl.textContent = email;
      emailEl.href = email ? `mailto:${email}` : "#";
    }

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

function createPrintClone() {
  const dedicatedPrintArea = document.getElementById("resume-print-area");
  if (dedicatedPrintArea) {
    return dedicatedPrintArea.cloneNode(true);
  }

  const header = document.querySelector(".site-header");
  const resumeContainer = document.querySelector(".resume-container");

  if (!header && !resumeContainer) return null;

  const wrapper = document.createElement("div");
  wrapper.id = "resume-print-area-clone";

  if (header) wrapper.appendChild(header.cloneNode(true));
  if (resumeContainer) wrapper.appendChild(resumeContainer.cloneNode(true));

  return wrapper;
}

function prepareCloneForPdf(clone) {
  const downloadBtn = clone.querySelector("#download-btn");
  if (downloadBtn) downloadBtn.remove();

  clone.querySelectorAll(".onyx-dock, footer").forEach(el => el.remove());

  clone.style.width = "210mm";
  clone.style.minHeight = "297mm";
  clone.style.background = "#ffffff";
  clone.style.color = "#000000";
  clone.style.padding = "10mm";
  clone.style.margin = "0";
  clone.style.boxSizing = "border-box";
  clone.style.boxShadow = "none";
  clone.style.borderRadius = "0";

  clone.querySelectorAll("*").forEach(el => {
    el.style.boxShadow = "none";
    el.style.textShadow = "none";
    el.style.filter = "none";
    el.style.backdropFilter = "none";
  });

  clone.querySelectorAll("section").forEach(section => {
    section.style.pageBreakInside = "avoid";
    section.style.breakInside = "avoid";
  });

  clone.querySelectorAll(".job, .education-item, ul li").forEach(el => {
    el.style.pageBreakInside = "avoid";
    el.style.breakInside = "avoid";
  });

  clone.querySelectorAll("a").forEach(link => {
    link.style.color = "#000000";
    link.style.textDecoration = "none";
  });

  const header = clone.querySelector(".site-header");
  if (header) {
    header.style.background = "#ffffff";
    header.style.color = "#000000";
    header.style.boxShadow = "none";
  }
}

function setupDownloadButton() {
  const downloadBtn = $("download-btn");
  if (!downloadBtn) return;

  downloadBtn.addEventListener("click", async () => {
    if (typeof html2pdf === "undefined") {
      alert("html2pdf is not loaded.");
      return;
    }

    const clone = createPrintClone();
    if (!clone) {
      alert("Could not find resume content to print.");
      return;
    }

    prepareCloneForPdf(clone);

    const offscreen = document.createElement("div");
    offscreen.style.position = "fixed";
    offscreen.style.left = "-99999px";
    offscreen.style.top = "0";
    offscreen.style.width = "210mm";
    offscreen.style.background = "#ffffff";
    offscreen.style.zIndex = "-1";

    offscreen.appendChild(clone);
    document.body.appendChild(offscreen);

    try {
      await html2pdf()
        .from(clone)
        .set({
          margin: [10, 10, 10, 10],
          filename: "Caleb_Kritzar_Resume.pdf",
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff"
          },
          jsPDF: {
            orientation: "portrait",
            unit: "mm",
            format: "a4"
          }
        })
        .save();
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF.");
    } finally {
      offscreen.remove();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = $("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  loadResume();
  setupDownloadButton();
});
