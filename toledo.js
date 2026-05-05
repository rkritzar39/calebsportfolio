/* =========================
   SAFE DATA SOURCE
========================= */

const DEFAULT_DATA = {
  courses: [
    { id: "c1", name: "Cybersecurity 101" }
  ],
  assignments: [
    {
      id: "a1",
      title: "Intro to Cybersecurity",
      due: "2026-05-10",
      course: "Cybersecurity 101",
      score: 95
    },
    {
      id: "a2",
      title: "Network Basics Quiz",
      due: "2026-05-15",
      course: "Cybersecurity 101",
      score: 88
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
   NAVIGATION
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
   OPTIONAL RESET (NOT IN UI)
========================= */

function resetDemo(){
  localStorage.removeItem("lms_teacher_data");
  localStorage.removeItem("lms_sync_signal");
  location.reload();
}

/* =========================
   SIDEBAR RENDER
========================= */

function renderSidebar(data){
  const courseList = document.getElementById("courseList");
  if(!courseList) return;

  courseList.innerHTML = data.courses.map(c => `
    <div class="courseItem" onclick="openCourse('${c.name}')">
      📘 ${c.name}
    </div>
  `).join("");
}

/* =========================
   GRADE CALCULATION
========================= */

function calculateAverage(assignments){
  const graded = assignments.filter(a => typeof a.score === "number");

  if(!graded.length) return 0;

  const total = graded.reduce((sum, a) => sum + a.score, 0);

  return (total / graded.length).toFixed(1);
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

    const avgAll = calculateAverage(data.assignments);

    view.innerHTML = `
      <div class="card">
        <h2>📊 Dashboard</h2>
        <p><strong>Courses:</strong> ${data.courses.length}</p>
        <p><strong>Assignments:</strong> ${data.assignments.length}</p>
        <p><strong>Overall Average:</strong> ${avgAll}%</p>
      </div>

      <div class="card">
        <h3>📝 Recent Assignments</h3>

        ${
          data.assignments.length
            ? data.assignments.map(a => `
                <div class="assignment">
                  ${a.title} — ${a.course}
                  <br>
                  <small>
                    Due: ${a.due} |
                    Score: ${a.score ?? "Not graded"}%
                  </small>
                </div>
              `).join("")
            : "<p style='opacity:0.6;'>No assignments available</p>"
        }
      </div>
    `;
  }

  /* =========================
     COURSE VIEW
  ========================== */

  if(currentView === "course"){

    const courseAssignments = data.assignments.filter(
      a => a.course === selectedCourse
    );

    const avg = calculateAverage(courseAssignments);

    view.innerHTML = `
      <div class="card">
        <h2>📚 ${selectedCourse}</h2>
        <p><strong>Class Average:</strong> ${avg}%</p>

        <button onclick="showDashboard()">← Back</button>
      </div>

      <div class="card">
        <h3>📝 Assignments</h3>

        ${
          courseAssignments.length
            ? courseAssignments.map(a => `
                <div class="assignment">
                  ${a.title}
                  <br>
                  <small>
                    Due: ${a.due} |
                    Score: ${a.score ?? "Not graded"}%
                  </small>
                </div>
              `).join("")
            : "<p style='opacity:0.6;'>No assignments in this course</p>"
        }
      </div>
    `;
  }
}

/* =========================
   LIVE SYNC SYSTEM
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
