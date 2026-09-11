import { db } from "./firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

function setStatus(message, isError = false) {
  const node = $("resume-loading-status");
  if (!node) return;
  node.textContent = message;
  node.classList.toggle("error", isError);
  node.hidden = !message;
}

function setText(id, value = "") {
  const node = $(id);
  if (node && String(value || "").trim()) node.textContent = String(value).trim();
}

function safeUrl(value = "") {
  const input = String(value || "").trim();
  if (!input) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function setLinkOrText(id, text = "", href = "", external = false) {
  const node = $(id);
  if (!node) return;
  const label = String(text || "").trim();
  if (!label) return;
  node.textContent = label;
  if (!("href" in node) || !href) return;
  node.href = href;
  if (external) {
    node.target = "_blank";
    node.rel = "noopener noreferrer";
  }
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  }
}

function normalizeStringArray(value) {
  return normalizeArray(value).map((item) => String(item).trim()).filter(Boolean);
}

function phoneHref(value = "") {
  const cleaned = String(value).replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : "";
}

function buildContactLine(data = {}) {
  return [data.location || data.city, data.phone, data.website, data.linkedin]
    .filter(Boolean)
    .join(" • ");
}

function renderTagList(containerId, items) {
  const container = $(containerId);
  if (!container) return;
  const values = normalizeStringArray(items);
  if (!values.length) return;
  container.replaceChildren(...values.map((value) => {
    const span = document.createElement("span");
    span.textContent = value;
    return span;
  }));
}

function renderSimpleList(containerId, items) {
  const container = $(containerId);
  if (!container) return;
  const nodes = normalizeArray(items).map((item) => {
    const li = document.createElement("li");
    if (typeof item === "string") li.textContent = item;
    else if (item && typeof item === "object") {
      li.textContent = [item.name || item.title, item.issuer || item.organization, item.date]
        .filter(Boolean).join(" — ");
    }
    return li;
  }).filter((node) => node.textContent.trim());
  if (nodes.length) container.replaceChildren(...nodes);
}

function renderExperience(items) {
  const container = $("experience-list");
  if (!container) return;
  const nodes = normalizeArray(items).filter((item) => item && typeof item === "object").map((item) => {
    const article = document.createElement("article");
    article.className = "job";
    const heading = document.createElement("h3");
    heading.textContent = item.title || "";
    const meta = document.createElement("p");
    meta.className = "job-company";
    meta.textContent = [item.company || item.employer, item.location || item.city, item.dates || item.date]
      .filter(Boolean).join(" • ");
    if (heading.textContent) article.appendChild(heading);
    if (meta.textContent) article.appendChild(meta);
    const details = normalizeStringArray(item.details || item.bullets);
    if (details.length) {
      const list = document.createElement("ul");
      details.forEach((detail) => {
        const li = document.createElement("li");
        li.textContent = detail;
        list.appendChild(li);
      });
      article.appendChild(list);
    }
    return article;
  }).filter((node) => node.children.length);
  if (nodes.length) container.replaceChildren(...nodes);
}

function renderEducation(items) {
  const container = $("education-list");
  if (!container) return;
  const nodes = normalizeArray(items).filter((item) => item && typeof item === "object").map((item) => {
    const article = document.createElement("article");
    article.className = "education-item";
    const heading = document.createElement("h3");
    heading.textContent = item.school || item.institution || "";
    const meta = document.createElement("p");
    meta.className = "education-degree";
    meta.textContent = [item.type, item.degree || item.program || item.field, item.location, item.dates || item.date]
      .filter(Boolean).join(" • ");
    if (heading.textContent) article.appendChild(heading);
    if (meta.textContent) article.appendChild(meta);
    const details = [...normalizeStringArray(item.details), ...normalizeStringArray(item.notes)];
    if (details.length) {
      const list = document.createElement("ul");
      details.forEach((detail) => {
        const li = document.createElement("li");
        li.textContent = detail;
        list.appendChild(li);
      });
      article.appendChild(list);
    }
    return article;
  }).filter((node) => node.children.length);
  if (nodes.length) container.replaceChildren(...nodes);
}

function renderProjects(items) {
  const container = $("projects-list");
  if (!container) return;
  const nodes = normalizeArray(items).map((item) => {
    const li = document.createElement("li");
    if (typeof item === "string") {
      li.textContent = item;
      return li;
    }
    if (!item || typeof item !== "object") return li;
    const name = item.name || item.title || "";
    const url = safeUrl(item.link || item.url || item.website);
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = name || url;
      li.appendChild(link);
    } else {
      li.textContent = name;
    }
    const extras = [item.stack || item.tech ? `Tech: ${item.stack || item.tech}` : "", item.description]
      .filter(Boolean);
    if (extras.length) li.appendChild(document.createTextNode(` — ${extras.join(" • ")}`));
    return li;
  }).filter((node) => node.textContent.trim());
  if (nodes.length) container.replaceChildren(...nodes);
}

async function loadResume() {
  setStatus("Loading résumé details…");
  try {
    const snapshot = await getDoc(doc(db, "site_config", "mainProfile"));
    if (!snapshot.exists()) {
      setStatus("Résumé details are temporarily unavailable. Please use the PDF résumé link.", true);
      return;
    }
    const data = snapshot.data() || {};
    setText("name", data.name);
    setText("title", data.title);
    setText("professional-title", data.title);
    setText("contact", data.contact || buildContactLine(data));
    setText("location", data.location || data.city);
    setText("summary", data.summary);
    setLinkOrText("email", data.email, data.email ? `mailto:${data.email}` : "");
    setLinkOrText("phone", data.phone, phoneHref(data.phone));
    setLinkOrText("website", data.website, safeUrl(data.website), true);
    setLinkOrText("linkedin", data.linkedin, safeUrl(data.linkedin), true);
    renderTagList("skills-list", data.skills);
    renderTagList("languages-list", data.languages);
    renderExperience(data.experience);
    renderEducation(data.education);
    renderSimpleList("certifications-list", data.certifications);
    renderProjects(data.projects);
    setStatus("");
  } catch (error) {
    console.error("Error loading resume:", error);
    setStatus("Résumé details could not be loaded. Please use the PDF résumé link.", true);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadResume, { once: true });
} else {
  loadResume();
}
