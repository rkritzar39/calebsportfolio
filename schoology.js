/* =========================
   TEACHER DATA SOURCE
========================= */
function getLMSData() {
  return JSON.parse(localStorage.getItem("lms_teacher_data")) || {
    courses: [],
    assignments: [],
    grades: {}
  };
}

/* =========================
   NAVIGATION
========================= */
function show(page) {
  document.querySelectorAll('.page')
    .forEach(p => p.classList.remove('active'));

  document.getElementById(page).classList.add('active');

  if (page === "dashboard") renderDashboard();
  if (page === "courses") renderCourses();
  if (page === "assignments") renderAssignments();
  if (page === "calendar") renderCalendar();
  if (page === "grades") renderGrades();
}

/* =========================
   DASHBOARD
========================= */
function renderDashboard() {
  const data = getLMSData();

  document.getElementById("dashboard").innerHTML = `
    <h2>Welcome Back</h2>

    <div class="card">
      <h3>Recent Activity</h3>
      <p>
        ${(data.assignments || [])
          .slice(-3)
          .map(a => "• " + a.title)
          .join("<br>") || "No activity yet"}
      </p>
    </div>

    <div class="card">
      <h3>Upcoming</h3>
      <p>${data.assignments?.[0]?.title || "No assignments yet"}</p>
    </div>
  `;
}

/* =========================
   COURSES
========================= */
function renderCourses() {
  const data = getLMSData();

  document.querySelector(".courseGrid").innerHTML =
    (data.courses || []).map(c => `
      <div class="courseCard" onclick="openCourse('${c.name}')">
        ${c.name}
      </div>
    `).join("") || "<p>No courses yet</p>";

  document.getElementById("courseView").classList.add("hidden");
}

/* =========================
   COURSE VIEW
========================= */
function openCourse(name) {
  const data = getLMSData();

  const list = (data.assignments || [])
    .filter(a => a.course === name)
    .map(a => `<div class="assignment">${a.title}</div>`)
    .join("");

  const view = document.getElementById("courseView");

  view.classList.remove("hidden");

  view.innerHTML = `
    <h3>${name}</h3>

    <div class="card">
      <h4>Assignments</h4>
      ${list || "<p>No assignments</p>"}
    </div>
  `;
}

/* =========================
   ASSIGNMENTS
========================= */
function renderAssignments() {
  const data = getLMSData();

  document.getElementById("assignmentList").innerHTML =
    (data.assignments || [])
      .map(a => `<div class="assignment">${a.title} — ${a.due}</div>`)
      .join("") || "No assignments";
}

/* =========================
   CALENDAR
========================= */
function renderCalendar() {
  const data = getLMSData();

  document.querySelector(".calendarGrid").innerHTML =
    (data.assignments || [])
      .map(a => `
        <div class="day">
          <b>${a.due}</b><br>
          ${a.title}
        </div>
      `).join("") || "<p>No events</p>";
}

/* =========================
   GRADES
========================= */
function renderGrades() {
  const data = getLMSData();

  let html = Object.entries(data.grades || {})
    .map(([course, grade]) =>
      `<p>${course}: ${grade}</p>`
    ).join("");

  document.getElementById("grades").innerHTML =
    `<h2>Grades</h2><div class="card">${html || "No grades yet"}</div>`;
}
