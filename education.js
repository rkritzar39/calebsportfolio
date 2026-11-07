import { db } from "./firebase-init.js";
import { doc, getDocFromServer } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { EDUCATION_PUBLIC_PATH, EDUCATION_PUBLIC_VERSION } from "./education-public.js";
const $=id=>document.getElementById(id), arr=v=>Array.isArray(v)?v:[], esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const POINTS={A:4,"A-":3.67,"B+":3.33,B:3,"B-":2.67,"C+":2.33,C:2,"C-":1.67,"D+":1.33,D:1,"D-":.67,F:0,WF:0};
const MODES={letter:{label:"Standard Letter",grades:"A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F",note:"Earned quality points are included in GPA."},"grade-no-credit":{label:"Grade / No Credit",grades:"A, A-, B+, B, B-, C+, C, C-, D+, D, D-, NC",note:"Successful outcomes retain the posted letter grade; NC earns no credit and is excluded from GPA."},"pass-no-credit":{label:"Pass / No Credit",grades:"PS, NC",note:"PS earns credit; neither PS nor NC affects GPA."},"satisfactory-unsatisfactory":{label:"Satisfactory / Unsatisfactory",grades:"S, U",note:"S earns credit; neither result affects GPA."},audit:{label:"Audit",grades:"AU",note:"No earned credit and no GPA effect."},transfer:{label:"Transfer",grades:"TR / TC",note:"Accepted credit is tracked separately and excluded from institutional GPA by default."},custom:{label:"Custom",grades:"Configured per course",note:"Uses the course's explicit GPA and credit settings."}};

function gradingOutcome(course) {
  const grade = String(course.grade || "").trim().toUpperCase();
  if (!grade) return {};
  switch (course.gradingMode || "letter") {
    case "letter":
    case "grade-no-credit":
      return Object.hasOwn(POINTS, grade) ? { points: POINTS[grade], earned: !["F", "WF"].includes(grade) } : {};
    case "pass-no-credit": return { earned: grade === "PS" };
    case "satisfactory-unsatisfactory": return { earned: grade === "S" };
    case "transfer": return { earned: ["TR", "TC", "ACCEPTED"].includes(grade) };
    case "custom":
      return { earned: course.earnsCredit === true, points: course.affectsGpa === true ? course.qualityPointsPerCredit : undefined };
    default: return {};
  }
}

function metrics(courses) {
  let attempted = 0, earned = 0, gpaHours = 0, quality = 0;
  for (const course of courses) {
    const credits = Number.isFinite(course.credits) ? course.credits : 0;
    if (["planned", "dropped"].includes(String(course.status || "Planned").trim().toLowerCase())) continue;
    attempted += credits;
    const { earned: earnsCredit, points } = gradingOutcome(course);
    if (earnsCredit) earned += credits;
    if (Number.isFinite(points)) {
      gpaHours += credits;
      quality += credits * points;
    }
  }
  return { attempted, earned, gpaHours, gpa: gpaHours ? quality / gpaHours : null };
}

const empty = message => `<p class="empty-state">${esc(message)}</p>`;

function cards(id, items, kind, enabled = true) {
  const element = $(id);
  element.closest("section.glass, article.glass").style.display = enabled ? "" : "none";
  element.innerHTML = enabled && items.length ? items.map(item => {
    const link = /^https?:\/\//i.test(item.url || "")
      ? `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">View details</a>` : "";
    return `<article class="info-card"><div class="card-top">
      <h3>${esc(item.title || item.name || item.course || "Untitled")}</h3>
      ${item.status ? `<span class="badge">${esc(item.status)}</span>` : ""}
    </div><p>${esc([item.date, item.issuer, item.institution, item.description].filter(Boolean).join(" • "))}</p>${link}</article>`;
  }).join("") : empty(`No ${kind} published yet.`);
}

function semesterHTML(semester, privacy, filteredCourses = semester.courses) {
  const summary = metrics(arr(semester.courses));
  const courses = arr(filteredCourses).map(course => {
    const mode = Object.hasOwn(MODES, course.gradingMode || "letter") ? MODES[course.gradingMode || "letter"] : MODES.custom;
    return `<article class="course-row">
      <div><strong>${esc(course.code)} ${esc(course.name || "Untitled course")}</strong>
      <span>${esc([course.subject, course.requirementArea].filter(Boolean).join(" • "))}</span></div>
      <span>${Number.isFinite(course.credits) ? `${course.credits} cr` : ""}</span>
      <span class="badge">${mode.label}</span><span>${esc(course.status || "Planned")}</span>
      ${privacy.showCourseGrades && course.grade ? `<strong>${esc(course.grade)}</strong>` : ""}
    </article>`;
  }).join("");
  return `<article class="semester-card"><header><div><h3>${esc(semester.name || "Semester")}</h3>
    <p>${esc(semester.dates)} ${semester.status ? `• ${esc(semester.status)}` : ""}</p></div><div>
    ${privacy.showCompletedCredits ? `<strong>${summary.earned} earned credits from published grades</strong>` : ""}
    ${privacy.showSemesterGpa && summary.gpa != null ? `<span>Published GPA ${summary.gpa.toFixed(2)}</span>` : ""}
    </div></header><div class="course-table">${courses || empty("No courses listed.")}</div></article>`;
}

function renderCourses(data) {
  const query = $("course-search").value.trim().toLowerCase();
  const mode = $("course-mode-filter").value;
  const status = $("course-status-filter").value;
  $("semester-list").innerHTML = data.semesters.map(semester => {
    const courses = arr(semester.courses).filter(course =>
      (!query || [course.code, course.name, course.subject, course.skills].join(" ").toLowerCase().includes(query)) &&
      (!mode || (course.gradingMode || "letter") === mode) && (!status || (course.status || "Planned") === status)
    );
    return courses.length ? semesterHTML(semester, data.privacy, courses) : "";
  }).join("") || empty("No matching courses.");
}

function render(data) {
  const { privacy, semesters, profile } = data;
  const courses = semesters.flatMap(term => arr(term.courses));
  const summary = metrics(courses);
  $("education-intro").textContent = data.intro || "My coursework, progress, credentials, projects, and academic journey.";
  const stats = [
    ["Semesters", semesters.length, "calendar"],
    ["Courses", courses.length, "book"],
    ["In progress", courses.filter(course => course.status === "In Progress").length, "spinner"]
  ];
  if (privacy.showCompletedCredits) stats.push(["Credits earned from published grades", summary.earned, "layer-group"]);
  if (privacy.showProjects) stats.push(["Projects", arr(data.projects).length, "diagram-project"]);
  if (privacy.showCertifications) stats.push(["Credentials", arr(data.certifications).length, "certificate"]);
  $("stats-grid").innerHTML = stats.map(([label, value, icon]) =>
    `<article><i class="fa-solid fa-${icon}" aria-hidden="true"></i><strong>${value}</strong><span>${label}</span></article>`
  ).join("");

  const required = data.degree?.requiredCredits || 120;
  const percent = Math.min(100, 100 * summary.earned / required);
  $("degree-name").textContent = data.degree?.name || profile.program || "Degree requirements";
  $("degree-ring").style.display = privacy.showCompletedCredits ? "" : "none";
  $("degree-ring").setAttribute("aria-label", `${percent.toFixed(1)}% complete based on published grades`);
  $("degree-percent").textContent = privacy.showCompletedCredits ? `${percent.toFixed(1)}%` : "";
  $("degree-ring").style.setProperty("--progress", `${privacy.showCompletedCredits ? percent * 3.6 : 0}deg`);
  $("degree-progress-bar").parentElement.style.display = privacy.showCompletedCredits ? "" : "none";
  $("degree-progress-bar").style.width = `${privacy.showCompletedCredits ? percent : 0}%`;
  $("degree-credit-label").textContent = privacy.showCompletedCredits
    ? `${summary.earned} of ${required} credits based on published grades` : `${required} credits required`;
  $("requirement-list").innerHTML = arr(data.requirements).map(item =>
    `<div><span>${esc(item.name)}</span><strong>${Number.isFinite(item.required) ? `${item.required} required` : ""}</strong></div>`
  ).join("") || empty("No requirement groups published.");

  const fields = [
    ["Institution", profile.institution], ["College", profile.college], ["Program", profile.program],
    ["Intended program", profile.intendedProgram], ["Major", profile.major], ["Minor", profile.minor],
    ["Concentration", profile.concentration], ["Expected graduation", profile.expectedGraduation]
  ];
  if (privacy.showAcademicStanding) fields.push(
    ["Academic year", profile.academicYear], ["Academic standing", profile.academicStanding], ["Enrollment", profile.enrollmentStatus]
  );
  $("profile-grid").innerHTML = fields.filter(([, value]) => value).map(([label, value]) =>
    `<article><span>${label}</span><strong>${esc(value)}</strong></article>`
  ).join("") || empty("Academic profile details will appear here.");

  renderCourses(data);
  const current = semesters.find(term => term.current) || semesters.find(term => data.currentTerm && term.name === data.currentTerm);
  $("current-semester").innerHTML = current ? semesterHTML(current, privacy) : empty("No current semester published.");

  const analytics = [];
  if (privacy.showCumulativeGpa) analytics.push(`<article><h3>GPA from published grades</h3>
    <strong>${summary.gpa?.toFixed(2) ?? "—"}</strong><span>${summary.gpaHours} published GPA hours</span></article>`);
  if (privacy.showAttemptedCredits) analytics.push(`<article><h3>Attempted credits</h3>
    <strong>${summary.attempted}</strong><span>From published courses</span></article>`);
  if (privacy.showCompletedCredits && privacy.showAttemptedCredits) analytics.push(`<article>
    <h3>Credit completion from published data</h3><strong>${summary.attempted ? Math.round(100 * summary.earned / summary.attempted) : 0}%</strong>
    <span>${summary.earned} earned of ${summary.attempted} attempted</span></article>`);
  if (privacy.showSemesterGpa) {
    const terms = semesters.map(term => ({ name: term.name, gpa: metrics(arr(term.courses)).gpa }))
      .filter(term => term.gpa != null);
    analytics.push(`<article class="wide"><h3>Semester GPA trend from published grades</h3>
      ${terms.length ? `<ul>${terms.map(term => `<li>${esc(term.name || "Semester")}: ${term.gpa.toFixed(2)}</li>`).join("")}</ul>`
        : empty("No graded coursework published.")}</article>`);
  }
  $("analytics-grid").innerHTML = analytics.join("") || empty("No analytics published.");
  cards("timeline-list", arr(data.timeline), "timeline entries");
  cards("goal-list", arr(data.goals), "goals", privacy.showGoals);
  cards("planned-list", arr(data.plannedCourses), "planned courses", privacy.showPlannedCourses);
  cards("achievement-list", arr(data.achievements), "achievements", privacy.showAchievements);
  cards("certification-list", arr(data.certifications), "certifications", privacy.showCertifications);
  $("credentials").style.display = privacy.showAchievements || privacy.showCertifications ? "" : "none";
  document.querySelector('a[href="#credentials"]').style.display = privacy.showAchievements || privacy.showCertifications ? "" : "none";
  cards("project-list", arr(data.projects), "projects", privacy.showProjects);
  document.querySelector('a[href="#projects"]').style.display = privacy.showProjects ? "" : "none";
  cards("transfer-list", arr(data.transferCredits), "transfer credits", privacy.showTransferCredits);
  $("skill-list").innerHTML = arr(data.skills).map(skill =>
    `<span>${esc(typeof skill === "string" ? skill : skill.name)}${skill.level ? ` · ${esc(skill.level)}` : ""}</span>`
  ).join("") || empty("No skills published.");
  $("grading-modes").innerHTML = Object.values(MODES).map(mode =>
    `<article><h3>${mode.label}</h3><strong>${mode.grades}</strong><p>${mode.note}</p></article>`
  ).join("");
}

function download(data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "unofficial-academic-portfolio.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function init() {
  $("year").textContent = new Date().getFullYear();
  try {
    const snapshot = await getDocFromServer(doc(db, ...EDUCATION_PUBLIC_PATH));
    if (!snapshot.exists()) {
      $("education-unavailable").hidden = false;
      return;
    }
    const data = snapshot.data();
    if (data.schemaVersion !== EDUCATION_PUBLIC_VERSION) throw new Error("Unsupported published Education version.");
    render(data);
    const updated = data.updatedAt?.toDate?.();
    if (updated) $("education-updated").textContent = updated.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    for (const id of ["course-search", "course-mode-filter", "course-status-filter"]) {
      $(id).addEventListener(id === "course-search" ? "input" : "change", () => renderCourses(data));
    }
    $("print-summary").onclick = () => print();
    $("export-json").onclick = () => download(data);
    $("education-content").hidden = false;
    $("education-public-actions").hidden = false;
  } catch (error) {
    console.error("Published Education load failed", error);
    $("education-error").textContent = "Education information could not be loaded.";
    $("education-error").hidden = false;
  } finally {
    $("education-loading").hidden = true;
  }
}

void init();
