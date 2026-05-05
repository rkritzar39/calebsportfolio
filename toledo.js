/* =========================
   DATA SOURCE (PERSISTENT LMS STATE)
========================= */

const DEFAULT_DATA = {
  courses: [
    { id: "c1", name: "Cybersecurity 101" }
  ],
  assignments: [
    {
      id: "a1",
      title: "Course Introduction Activity",
      due: "2026-05-10",
      course: "Cybersecurity 101"
    }
  ]
};

function getData(){
  const stored = localStorage.getItem("lms_teacher_data");
  return stored ? JSON.parse(stored) : DEFAULT_DATA;
}

/* =========================
   VIEW STATE
========================= */

let currentView = "dashboard";
let selectedCourse = null;

/* =========================
   NAVIGATION FUNCTIONS
========================= */

function showDashboard(){
  currentView = "dashboard";
  selectedCourse = null;
  render();
}

function openCourse(courseName){
  currentView = "course";
  selectedCourse = courseName;
  render();
}

/* =========================
   RESET SYSTEM (CLEAR ALL DATA)
========================= */

function resetDemo(){
  localStorage.removeItem("lms_teacher_data");
  localStorage.removeItem("lms_sync_signal");
  location.reload();
}

/* =========================
   SIDEBAR RENDER (COURSES)
========================= */

function renderSidebar(data){
  const courseList = document.getElementById("courseList");

  if(!courseList) return;

  courseList.innerHTML = data.courses.map(c => `
    <div class="courseItem" onclick="openCourse('${c.name}')">
      ${c.name}
    </div>
  `).join("");
}

/* =========================
   MAIN RENDER ENGINE
========================= */

function render(){

  const data = getData();

  renderSidebar(data);

  const view = document.getElementById("view");

  if(!view) return;

  /* =========================
     DASHBOARD VIEW
  ========================== */

  if(currentView === "dashboard"){

    view.innerHTML = `
      <div class="card">
        <h2>📊 Dashboard</h2>
        <p><strong>Courses:</strong> ${data.courses.length}</p>
        <p><strong>Assignments:</strong> ${data.assignments.length}</p>
      </div>

      <div class="card">
        <h3>📌 Recent Assignments</h3>
        ${
          data.assignments.map(a => `
            <div class="assignment">
              📝 ${a.title} — ${a.course}
              <br>
              <small>Due: ${a.due}</small>
            </div>
          `).join("")
        }
      </div>
    `;
  }

  /* =========================
     COURSE DETAIL VIEW
  ========================== */

  if(currentView === "course"){

    const courseAssignments = data.assignments.filter(
      a => a.course === selectedCourse
    );

    view.innerHTML = `
      <div class="card">
        <h2>📚 ${selectedCourse}</h2>
        <p>Course Overview & Assignments</p>

        <button onclick="showDashboard()">← Back to Dashboard</button>
      </div>

      <div class="card">
        <h3>📝 Assignments</h3>

        ${
          courseAssignments.length > 0
            ? courseAssignments.map(a => `
                <div class="assignment">
                  ${a.title}
                  <br>
                  <small>Due: ${a.due}</small>
                </div>
              `).join("")
            : "<p style='opacity:0.6;'>No assignments in this course</p>"
        }
      </div>
    `;
  }
}

/* =========================
   LIVE SYNC (TEACHER UPDATES)
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
   INIT
========================= */

render();
