import { db } from "/firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const esc = (value = "") => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const list = value => Array.isArray(value) ? value : [];

function gradePoints(grade) {
  const map = {"A+":4,"A":4,"A-":3.7,"B+":3.3,"B":3,"B-":2.7,"C+":2.3,"C":2,"C-":1.7,"D+":1.3,"D":1,"D-":0.7,"F":0};
  return map[String(grade || "").toUpperCase()];
}
function semesterGpa(semester) {
  let quality = 0, attempted = 0;
  list(semester.courses).forEach(course => {
    const points = gradePoints(course.grade);
    const credits = Number(course.credits) || 0;
    if (points !== undefined && credits > 0) { quality += points * credits; attempted += credits; }
  });
  return attempted ? quality / attempted : null;
}
function completedCredits(semesters) {
  return semesters.reduce((sum, semester) => sum + list(semester.courses).reduce((s, c) => {
    const completed = ["completed", "passed", "transfer"].includes(String(c.status || "").toLowerCase()) || gradePoints(c.grade) !== undefined;
    return s + (completed && String(c.grade || "").toUpperCase() !== "F" ? Number(c.credits) || 0 : 0);
  }, 0), 0);
}
function cumulativeGpa(semesters) {
  let quality = 0, credits = 0;
  semesters.forEach(semester => list(semester.courses).forEach(course => {
    const points = gradePoints(course.grade), hours = Number(course.credits) || 0;
    if (points !== undefined && hours > 0) { quality += points * hours; credits += hours; }
  }));
  return credits ? quality / credits : null;
}
function setText(id, value, fallback = "—") { const el = $(id); if (el) el.textContent = value || fallback; }
function empty(message) { return `<p class="empty-state">${esc(message)}</p>`; }

function renderSemesters(semesters) {
  const el = $("semester-list");
  if (!semesters.length) { el.innerHTML = empty("No semesters have been published yet."); return; }
  el.innerHTML = semesters.map(semester => {
    const courses = list(semester.courses);
    const gpa = semester.gpa !== undefined && semester.gpa !== "" ? Number(semester.gpa) : semesterGpa(semester);
    const totalCredits = courses.reduce((s, c) => s + (Number(c.credits) || 0), 0);
    const rows = courses.length ? courses.map(c => `<tr>
      <td data-label="Course"><strong>${esc(c.code || "")}</strong>${c.code && c.name ? " — " : ""}${esc(c.name || "Untitled course")}</td>
      <td data-label="Credits">${esc(c.credits ?? "—")}</td><td data-label="Status"><span class="status-pill">${esc(c.status || "Planned")}</span></td>
      <td data-label="Grade">${esc(c.grade || "—")}</td></tr>`).join("") : `<tr><td colspan="4">${empty("No courses listed for this semester.")}</td></tr>`;
    return `<article class="semester-card"><header class="semester-header"><div><h3>${esc(semester.name || "Semester")}</h3><span>${esc(semester.dates || "")}</span></div><div class="semester-meta">${totalCredits} credits<br>${gpa === null || Number.isNaN(gpa) ? "GPA —" : `GPA ${gpa.toFixed(2)}`}</div></header>
      <table class="course-list"><thead><tr><th>Course</th><th>Credits</th><th>Status</th><th>Grade</th></tr></thead><tbody>${rows}</tbody></table></article>`;
  }).join("");
}
function renderCards(id, items, type) {
  const el = $(id);
  if (!items.length) { el.innerHTML = empty(`No ${type} have been published yet.`); return; }
  el.innerHTML = items.map(item => `<article class="${type === "achievements" ? "achievement-item" : "timeline-item"}"><h3>${esc(item.title || item.name || "Untitled")}</h3><p>${esc([item.date, item.description].filter(Boolean).join(" • "))}</p></article>`).join("");
}
function renderProjects(projects) {
  const el = $("project-list");
  if (!projects.length) { el.innerHTML = empty("No academic projects have been published yet."); return; }
  el.innerHTML = projects.map(p => `<article class="education-project"><h3>${esc(p.name || p.title || "Untitled project")}</h3>${p.course ? `<p><strong>Course:</strong> ${esc(p.course)}</p>` : ""}${p.technologies ? `<p>${esc(p.technologies)}</p>` : ""}${p.description ? `<p>${esc(p.description)}</p>` : ""}${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">View project <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ""}</article>`).join("");
}
function applyLocalSettings() {
  try {
    const s = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
    document.body.classList.toggle("high-contrast", s.highContrast === "enabled");
    document.body.classList.toggle("dyslexia-font", s.dyslexiaFont === "enabled");
    document.body.classList.toggle("underline-links", s.underlineLinks === "enabled");
    document.body.classList.toggle("reduced-motion", s.motionEffects === "disabled");
    if (s.accentColor) document.documentElement.style.setProperty("--accent-color", s.accentColor);
  } catch (_) {}
}
async function loadEducation() {
  applyLocalSettings();
  $("year").textContent = new Date().getFullYear();
  try {
    const snap = await getDoc(doc(db, "site_config", "educationPage"));
    $("education-loading").hidden = true;
    if (!snap.exists() || snap.data()?.isPublic === false) { $("education-unavailable").hidden = false; return; }
    const data = snap.data() || {}, semesters = list(data.semesters);
    setText("edu-institution", data.profile?.institution);
    setText("edu-program", data.profile?.program);
    setText("edu-year", data.profile?.academicYear);
    setText("edu-current-term", data.currentTerm || semesters.find(s => s.current)?.name);
    setText("edu-credits", String(data.creditsCompleted ?? completedCredits(semesters)), "0");
    const gpa = data.cumulativeGpa !== undefined && data.cumulativeGpa !== "" ? Number(data.cumulativeGpa) : cumulativeGpa(semesters);
    setText("edu-gpa", gpa === null || Number.isNaN(gpa) ? "—" : gpa.toFixed(2));
    if (data.intro) setText("education-intro", data.intro);
    renderSemesters(semesters); renderCards("milestone-list", list(data.milestones), "milestones");
    renderCards("achievement-list", list(data.achievements), "achievements"); renderProjects(list(data.projects));
    $("education-content").hidden = false;
  } catch (error) {
    console.error("Education load failed:", error); $("education-loading").hidden = true; $("education-error").hidden = false;
    $("education-error").textContent = "Education information could not be loaded. Please try again later.";
  }
}
loadEducation();
