import { db } from "./firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const $ = id => document.getElementById(id);
const arr = v => Array.isArray(v) ? v : [];
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[c]));

const POINTS = {
  "A": 4, "A-": 3.67, "B+": 3.33, "B": 3, "B-": 2.67, 
  "C+": 2.33, "C": 2, "C-": 1.67, "D+": 1.33, "D": 1, 
  "D-": 0.67, "F": 0, "WF": 0
};

const MODES = {
  letter: { 
    label: "A-F Letter Grading", 
    grades: "A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F", 
    note: "Earned quality points are included in GPA." 
  },
  "pass-no-credit": { 
    label: "Pass / No Credit", 
    grades: "PS, NC", 
    note: "PS earns credit; neither PS nor NC affects GPA." 
  },
  "satisfactory-unsatisfactory": { 
    label: "Satisfactory / Unsatisfactory", 
    grades: "S, U", 
    note: "S earns credit; neither result affects GPA." 
  },
  audit: { 
    label: "Audit", 
    grades: "AU", 
    note: "No earned credit and no GPA effect." 
  },
  transfer: { 
    label: "Transfer", 
    grades: "TR / TC", 
    note: "Accepted credit is tracked separately and excluded from institutional GPA by default." 
  },
  custom: { 
    label: "Custom", 
    grades: "Configured per course", 
    note: "Uses the course's explicit GPA and credit settings." 
  }
};

let DATA = {}, allCourses = [];

function rules(c) {
  const m = c.gradingMode || "letter";
  const g = String(c.grade || "").toUpperCase();
  const cr = +c.credits || 0;

  if (m === "custom") {
    return { gpa: c.affectsGpa === true, earned: c.earnsCredit === true, points: Number(c.qualityPointsPerCredit) };
  }
  if (m === "letter") {
    return { gpa: POINTS[g] !== undefined, earned: POINTS[g] !== undefined && g !== "F" && g !== "WF", points: POINTS[g] };
  }
  if (m === "pass-no-credit") {
    return { gpa: false, earned: g === "PS", points: null };
  }
  if (m === "satisfactory-unsatisfactory") {
    return { gpa: false, earned: g === "S", points: null };
  }
  if (m === "transfer") {
    return { gpa: false, earned: ["TR", "TC", "ACCEPTED"].includes(g) || c.status === "Transfer", points: null };
  }
  return { gpa: false, earned: false, points: null };
}

function metrics(courses) {
  let attempted = 0, earned = 0, gpaHours = 0, quality = 0;
  
  courses.forEach(c => {
    const cr = +c.credits || 0;
    const r = rules(c);
    
    if (!["Planned", "Dropped"].includes(c.status)) attempted += cr;
    if (r.earned) earned += cr;
    if (r.gpa && Number.isFinite(r.points)) {
      gpaHours += cr;
      quality += cr * r.points;
    }
  });
  
  return { 
    attempted, 
    earned, 
    gpaHours, 
    quality, 
    gpa: gpaHours ? quality / gpaHours : null 
  };
}

function empty(t) {
  return `<p class="empty-state">${esc(t)}</p>`;
}

function cards(id, items, kind) {
  const e = $(id);
  if (!e) return;
  
  e.innerHTML = items.length ? items.map(x => `
    <article class="info-card">
      <div class="card-top">
        <h3>${esc(x.title || x.name || x.course || "Untitled")}</h3>
        ${x.status ? `<span class="badge">${esc(x.status)}</span>` : ""}
      </div>
      <p>${esc([x.date, x.issuer, x.institution, x.description].filter(Boolean).join(" • "))}</p>
      ${x.progress != null ? `
        <div class="mini-progress">
          <span style="width:${Math.min(100, +x.progress || 0)}%"></span>
        </div>
      ` : ""}
      ${x.url ? `
        <a href="${esc(x.url)}" target="_blank" rel="noopener">
          View details <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
      ` : ""}
    </article>
  `).join("") : empty(`No ${kind} published yet.`);
}

function visible(k) {
  return DATA.privacy?.[k] !== false;
}

function render() {
  const sem = arr(DATA.semesters);
  const courses = sem.flatMap(s => arr(s.courses).map(c => ({ ...c, semester: s.name })));
  allCourses = courses;
  
  const m = metrics(courses);
  const required = +DATA.degree?.requiredCredits || 120;
  const earned = DATA.creditsCompleted ?? m.earned;
  const pct = Math.min(100, required ? (earned / required) * 100 : 0);

  $("education-intro").textContent = DATA.intro || "My coursework, progress, credentials, projects, and academic journey.";
  
  $("stats-grid").innerHTML = [
    ["Semesters", sem.length, "calendar"],
    ["Courses", courses.length, "book"],
    ["Credits earned", earned, "layer-group"],
    ["In progress", courses.filter(c => c.status === "In Progress").length, "spinner"],
    ["Projects", arr(DATA.projects).length, "diagram-project"],
    ["Credentials", arr(DATA.certifications).length, "certificate"]
  ].map(x => `
    <article>
      <i class="fa-solid fa-${x[2]}"></i>
      <strong>${x[1]}</strong>
      <span>${x[0]}</span>
    </article>
  `).join("");

  $("degree-percent").textContent = `${pct.toFixed(1)}%`;
  $("degree-progress-bar").style.width = `${pct}%`;
  $("degree-ring").style.setProperty("--progress", `${pct * 3.6}deg`);
  
  $("degree-name").textContent = DATA.degree?.name || DATA.profile?.program || "Degree progress";
  $("degree-credit-label").textContent = `${earned} of ${required} credits • ${Math.max(0, required - earned)} remaining`;
  
  $("requirement-list").innerHTML = arr(DATA.requirements).length 
    ? arr(DATA.requirements).map(r => `
      <div>
        <span>${esc(r.name)}</span>
        <progress max="${+r.required || 1}" value="${+r.completed || 0}"></progress>
        <strong>${+r.completed || 0}/${+r.required || 0}</strong>
      </div>
    `).join("") 
    : empty("No requirement groups published.");

  const p = DATA.profile || {};
  $("profile-grid").innerHTML = [
    ["Institution", p.institution],
    ["College", p.college],
    ["Program", p.program],
    ["Intended program", p.intendedProgram],
    ["Major", p.major],
    ["Minor", p.minor],
    ["Concentration", p.concentration],
    ["Academic year", p.academicYear],
    ["Enrollment", p.enrollmentStatus],
    ["Expected graduation", p.expectedGraduation]
  ].filter(x => x[1]).map(x => `
    <article>
      <span>${x[0]}</span>
      <strong>${esc(x[1])}</strong>
    </article>
  `).join("") || empty("Academic profile details will appear here.");

  renderCourses();
  
  const current = sem.find(s => s.current) || sem.find(s => s.name === DATA.currentTerm);
  $("current-semester").innerHTML = current ? semesterHTML(current, true) : empty("No current semester selected.");

  const gpas = sem.map(s => ({ 
    name: s.name, 
    gpa: metrics(arr(s.courses)).gpa 
  })).filter(x => x.gpa != null);
  
  $("analytics-grid").innerHTML = `
    <article>
      <h3>GPA</h3>
      <strong>${visible("showCumulativeGpa") && m.gpa != null ? m.gpa.toFixed(2) : "Private"}</strong>
      <span>${m.gpaHours} GPA hours</span>
    </article>
    <article>
      <h3>Credit completion</h3>
      <strong>${m.attempted ? Math.round((m.earned / m.attempted) * 100) : 0}%</strong>
      <span>${m.earned} of ${m.attempted} attempted</span>
    </article>
    <article class="wide">
      <h3>GPA trend</h3>
      <div class="bar-chart">
        ${gpas.map(x => `
          <div title="${esc(x.name)}: ${x.gpa.toFixed(2)}">
            <span style="height:${(x.gpa / 4) * 100}%"></span>
            <small>${esc(x.name || "")}</small>
          </div>
        `).join("") || empty("GPA trend appears after letter-graded coursework.")}
      </div>
    </article>
  `;

  cards("timeline-list", arr(DATA.timeline).length ? arr(DATA.timeline) : arr(DATA.milestones), "timeline entries");
  cards("goal-list", arr(DATA.goals), "goals");
  cards("planned-list", arr(DATA.plannedCourses), "planned courses");
  cards("achievement-list", arr(DATA.achievements), "achievements");
  cards("certification-list", arr(DATA.certifications), "certifications");
  cards("project-list", arr(DATA.projects), "projects");
  cards("transfer-list", arr(DATA.transferCredits), "transfer credits");
  
  $("skill-list").innerHTML = arr(DATA.skills).length 
    ? arr(DATA.skills).map(s => `<span>${esc(typeof s === "string" ? s : s.name)}${s.level ? ` · ${esc(s.level)}` : ""}</span>`).join("") 
    : empty("Skills will be connected to courses and projects.");
    
  $("grading-modes").innerHTML = Object.entries(MODES).map(([k, v]) => `
    <article>
      <h3>${v.label}</h3>
      <strong>${v.grades}</strong>
      <p>${v.note}</p>
    </article>
  `).join("");
}

function semesterHTML(s, compact = false) {
  const mm = metrics(arr(s.courses));
  
  return `
    <article class="semester-card">
      <header>
        <div>
          <h3>${esc(s.name || "Semester")}</h3>
          <p>${esc(s.dates || "")} ${s.status ? `• ${esc(s.status)}` : ""}</p>
        </div>
        <div>
          <strong>${mm.earned} earned credits</strong>
          ${visible("showSemesterGpa") ? `<span>GPA ${mm.gpa == null ? "—" : mm.gpa.toFixed(2)}</span>` : ""}
        </div>
      </header>
      <div class="course-table">
        ${arr(s.courses).map(c => {
          const mode = MODES[c.gradingMode || "letter"] || MODES.custom;
          return `
            <article class="course-row" data-mode="${esc(c.gradingMode || "letter")}" data-status="${esc(c.status || "")}" data-search="${esc([c.code, c.name, c.subject, c.skills].join(" ").toLowerCase())}">
              <div>
                <strong>${esc(c.code || "")} ${esc(c.name || "Untitled course")}</strong>
                <span>${esc([c.subject, c.requirementArea].filter(Boolean).join(" • "))}</span>
              </div>
              <span>${+c.credits || 0} cr</span>
              <span class="badge">${esc(mode.label)}</span>
              <span>${esc(c.status || "Planned")}</span>
              <strong>${visible("showCourseGrades") ? esc(c.grade || "—") : "Private"}</strong>
            </article>
          `;
        }).join("") || empty("No courses listed.")}
      </div>
    </article>
  `;
}

function renderCourses() {
  const q = ($("course-search")?.value || "").toLowerCase();
  const mode = $("course-mode-filter")?.value || "";
  const status = $("course-status-filter")?.value || "";
  
  $("semester-list").innerHTML = arr(DATA.semesters).map(s => {
    const filtered = arr(s.courses).filter(c => 
      (!q || [c.code, c.name, c.subject, c.skills].join(" ").toLowerCase().includes(q)) &&
      (!mode || (c.gradingMode || "letter") === mode) &&
      (!status || c.status === status)
    );
    return filtered.length ? semesterHTML({ ...s, courses: filtered }) : "";
  }).join("") || empty("No matching courses.");
}

function download() {
  const blob = new Blob([JSON.stringify(DATA, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  
  a.href = URL.createObjectURL(blob);
  a.download = "unofficial-academic-portfolio.json";
  a.click();
  
  URL.revokeObjectURL(a.href);
}

async function init() {
  try {
    $("year").textContent = new Date().getFullYear();
    const snap = await getDoc(doc(db, "site_config", "educationPage"));
    $("education-loading").hidden = true;
    
    if (!snap.exists() || snap.data().isPublic === false) {
      $("education-unavailable").hidden = false;
      return;
    }
    
    DATA = snap.data();
    render();
    $("education-content").hidden = false;
    
    ["course-search", "course-mode-filter", "course-status-filter"].forEach(id => {
      $(id)?.addEventListener(id === "course-search" ? "input" : "change", renderCourses);
    });
    
    $("print-summary").onclick = () => print();
    $("export-json").onclick = download;
    
  } catch (e) {
    console.error(e);
    $("education-loading").hidden = true;
    $("education-error").hidden = false;
    $("education-error").textContent = "Education information could not be loaded.";
  }
}

init();
