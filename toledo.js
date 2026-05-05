/* =========================
   DATA
========================= */

function getData(){
  return JSON.parse(localStorage.getItem("lms_teacher_data")) || {
    courses: [],
    assignments: []
  };
}

/* =========================
   STATE (CURRENT VIEW)
========================= */

let currentCourse = null;

/* =========================
   RESET DEMO
========================= */

function resetDemo(){
  localStorage.removeItem("lms_teacher_data");
  localStorage.removeItem("lms_sync_signal");
  location.reload();
}

/* =========================
   NAVIGATION
========================= */

function openCourse(courseName){
  currentCourse = courseName;
  render();
}

function backToHome(){
  currentCourse = null;
  render();
}

/* =========================
   MAIN RENDER
========================= */

function render(){

  const data = getData();

  /* =========================
     DASHBOARD VIEW
  ========================= */
  if(!currentCourse){

    const dashboard = document.getElementById("dashboard");

    dashboard.innerHTML = `
      <h3>📊 Overview</h3>
      <p><strong>Courses:</strong> ${data.courses.length}</p>
      <p><strong>Assignments:</strong> ${data.assignments.length}</p>
      <p style="opacity:0.7;">Click a course to view details</p>
    `;

    /* COURSES LIST (CLICKABLE) */
    document.querySelector(".courseGrid").innerHTML =
      data.courses.map(c => `
        <div class="courseCard" onclick="openCourse('${c.name}')">
          📚 ${c.name}
        </div>
      `).join("") || "<p>No courses</p>";

    /* ALL ASSIGNMENTS */
    document.getElementById("assignmentList").innerHTML =
      data.assignments.map(a => `
        <div class="assignment">
          📝 ${a.title} — ${a.course}
        </div>
      `).join("") || "No assignments";

    /* CALENDAR */
    document.querySelector(".calendarGrid").innerHTML =
      data.assignments.map(a => `
        <div class="day">
          ${a.due}<br><small>${a.title}</small>
        </div>
      `).join("");

    return;
  }

  /* =========================
     COURSE DETAIL VIEW
  ========================= */

  const courseAssignments = getData().assignments.filter(
    a => a.course === currentCourse
  );

  document.getElementById("dashboard").innerHTML = `
    <button onclick="backToHome()">← Back</button>
    <h2>📚 ${currentCourse}</h2>
    <p>Course details and assignments</p>
  `;

  document.querySelector(".courseGrid").innerHTML = `
    <div class="courseCard">
      📘 Viewing Course
    </div>
  `;

  document.getElementById("assignmentList").innerHTML =
    courseAssignments.map(a => `
      <div class="assignment">
        📝 ${a.title}<br>
        <small>Due: ${a.due}</small>
      </div>
    `).join("") || "<p>No assignments in this course</p>";

  document.querySelector(".calendarGrid").innerHTML =
    courseAssignments.map(a => `
      <div class="day">
        ${a.due}<br><small>${a.title}</small>
      </div>
    `).join("");
}

/* =========================
   LIVE SYNC
========================= */

window.addEventListener("storage", (e) => {
  if (
    e.key === "lms_teacher_data" ||
    e.key === "lms_sync_signal"
  ) {
    render();
  }
});

/* INIT */
render();
