function getData(){
  return JSON.parse(localStorage.getItem("lms_teacher_data")) || {
    courses: [],
    assignments: []
  };
}

/* NAV */
function show(page){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(page).classList.add("active");
  render();
}

/* RENDER SYSTEM */
function render(){

  const data = getData();

  document.getElementById("dashboard").innerHTML = `
    <div class="card">
      <h3>Welcome</h3>
      <p>Courses: ${data.courses.length}</p>
      <p>Assignments: ${data.assignments.length}</p>
    </div>
  `;

  document.querySelector(".courseGrid").innerHTML =
    data.courses.map(c =>
      `<div class="courseCard">${c.name}</div>`
    ).join("") || "<p>No courses</p>";

  document.getElementById("assignmentList").innerHTML =
    data.assignments.map(a =>
      `<div class="assignment">${a.title} — ${a.due}</div>`
    ).join("") || "No assignments";

  document.querySelector(".calendarGrid").innerHTML =
    data.assignments.map(a =>
      `<div class="day">${a.due}<br>${a.title}</div>`
    ).join("") || "No events";
}

/* REAL-TIME SYNC */
window.addEventListener("storage", (e) => {
  if (e.key === "lms_teacher_data" || e.key === "lms_sync_signal") {
    render();
  }
});

/* INIT */
render();
