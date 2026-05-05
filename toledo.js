/* =========================
   LMS STUDENT DATA ACCESS
========================= */

function getData(){
  return JSON.parse(localStorage.getItem("lms_teacher_data")) || {
    courses: [],
    assignments: []
  };
}

/* =========================
   RESET DEMO VIEW (OPTIONAL)
========================= */

function resetDemo(){
  localStorage.removeItem("lms_teacher_data");
  localStorage.removeItem("lms_sync_signal");
  location.reload();
}

/* =========================
   MAIN RENDER FUNCTION
========================= */

function render(){

  const data = getData();

  /* =========================
     DASHBOARD
  ========================= */
  const dashboard = document.getElementById("dashboard");
  if(dashboard){
    dashboard.innerHTML = `
      <h3>📊 Overview</h3>
      <p><strong>Courses:</strong> ${data.courses.length}</p>
      <p><strong>Assignments:</strong> ${data.assignments.length}</p>
      <p style="opacity:0.7; margin-top:8px;">
        View-only academic feed. Updates are published by instructor.
      </p>
    `;
  }

  /* =========================
     COURSES GRID
  ========================= */
  const courseGrid = document.querySelector(".courseGrid");
  if(courseGrid){
    courseGrid.innerHTML =
      data.courses.map(course => `
        <div class="courseCard">
          📚 ${course.name}
        </div>
      `).join("") || "<p style='opacity:0.6;'>No courses published</p>";
  }

  /* =========================
     ASSIGNMENTS LIST
  ========================= */
  const assignmentList = document.getElementById("assignmentList");
  if(assignmentList){
    assignmentList.innerHTML =
      data.assignments.map(a => `
        <div class="assignment">
          📝 <strong>${a.title}</strong><br>
          <small>Due: ${a.due} | Course: ${a.course}</small>
        </div>
      `).join("") || "<p style='opacity:0.6;'>No assignments published</p>";
  }

  /* =========================
     CALENDAR VIEW (SIMPLIFIED)
  ========================= */
  const calendar = document.querySelector(".calendarGrid");
  if(calendar){
    calendar.innerHTML =
      data.assignments.map(a => `
        <div class="day">
          ${a.due}<br>
          <small>${a.title}</small>
        </div>
      `).join("") || "<p style='opacity:0.6;'>No calendar events</p>";
  }
}

/* =========================
   REAL-TIME SYNC SYSTEM
========================= */

window.addEventListener("storage", (event) => {
  if (
    event.key === "lms_teacher_data" ||
    event.key === "lms_sync_signal"
  ) {
    render();
  }
});

/* =========================
   OPTIONAL MANUAL INIT SYNC
========================= */

function init(){
  render();
}

/* =========================
   RUN ON LOAD
========================= */

init();
