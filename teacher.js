/* =========================
   LMS TEACHER DATA STORE
========================= */

let data = JSON.parse(localStorage.getItem("lms_teacher_data")) || {
  courses: [],
  assignments: [],
  grades: {}
};

function save(){
  localStorage.setItem("lms_teacher_data", JSON.stringify(data));
  updateDashboard();
}

/* =========================
   NAVIGATION
========================= */

function show(page){

  document.querySelectorAll('.page')
    .forEach(p => p.classList.remove('active'));

  document.getElementById(page).classList.add('active');

  if(page === "courses") renderCourses();
  if(page === "assignments") renderAssignments();
  if(page === "gradebook") renderGradebook();
  if(page === "dashboard") updateDashboard();
}

/* =========================
   DASHBOARD
========================= */

function updateDashboard(){

  document.getElementById("courseCount").innerText = data.courses.length;
  document.getElementById("assignmentCount").innerText = data.assignments.length;
}

/* =========================
   COURSES
========================= */

function addCourse(){

  const name = document.getElementById("courseName").value;

  if(!name) return;

  data.courses.push({
    id: Date.now(),
    name
  });

  document.getElementById("courseName").value = "";

  save();
  renderCourses();
  updateCourseDropdown();
}

function renderCourses(){

  document.getElementById("courseList").innerHTML =
    data.courses.map(c => `
      <div class="assignment">${c.name}</div>
    `).join("");
}

function updateCourseDropdown(){

  document.getElementById("aCourse").innerHTML =
    data.courses.map(c =>
      `<option value="${c.name}">${c.name}</option>`
    ).join("");
}

/* =========================
   ASSIGNMENTS
========================= */

function addAssignment(){

  const title = document.getElementById("aTitle").value;
  const due = document.getElementById("aDue").value;
  const course = document.getElementById("aCourse").value;

  if(!title || !due) return;

  data.assignments.push({
    id: Date.now(),
    title,
    due,
    course
  });

  document.getElementById("aTitle").value = "";

  save();
  renderAssignments();
}

function renderAssignments(){

  document.getElementById("assignmentList").innerHTML =
    data.assignments.map(a => `
      <div class="assignment">
        ${a.title} — ${a.course} — ${a.due}
      </div>
    `).join("");
}

/* =========================
   GRADEBOOK
========================= */

function renderGradebook(){

  document.getElementById("gradeList").innerHTML =
    Object.keys(data.grades).length
      ? Object.entries(data.grades).map(([course, grade]) =>
          `<div class="assignment">${course}: ${grade}</div>`
        ).join("")
      : "No grades yet";
}

/* =========================
   PUBLISH TO STUDENTS
========================= */

function publish(){

  localStorage.setItem("lms_teacher_data", JSON.stringify(data));

  document.getElementById("status").innerText =
    "Published successfully to student portal";
}

/* INIT */
updateDashboard();
