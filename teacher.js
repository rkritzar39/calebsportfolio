let data = JSON.parse(localStorage.getItem("lms_teacher_data")) || {
  courses: [],
  assignments: [],
  grades: {}
};

function save(){
  localStorage.setItem("lms_teacher_data", JSON.stringify(data));

  // 🔥 real-time sync trigger
  localStorage.setItem("lms_sync_signal", Date.now());

  updateStats();
}

/* NAV */
function show(id){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* COURSES */
function addCourse(){
  let name = document.getElementById("courseName").value;
  if(!name) return;

  data.courses.push({ name });
  save();
  renderCourses();
}

function renderCourses(){
  document.getElementById("courseList").innerHTML =
    data.courses.map(c => `<div class="assignment">${c.name}</div>`).join("");

  document.getElementById("aCourse").innerHTML =
    data.courses.map(c => `<option>${c.name}</option>`).join("");
}

/* ASSIGNMENTS */
function addAssignment(){
  let title = document.getElementById("aTitle").value;
  let due = document.getElementById("aDue").value;
  let course = document.getElementById("aCourse").value;

  if(!title || !due) return;

  data.assignments.push({ title, due, course });
  save();
  renderAssignments();
}

function renderAssignments(){
  document.getElementById("assignmentList").innerHTML =
    data.assignments.map(a =>
      `<div class="assignment">${a.title} - ${a.course}</div>`
    ).join("");
}

/* PUBLISH */
function publish(){
  save();
  document.getElementById("status").innerText = "Published ✔";
}

/* STATS */
function updateStats(){
  document.getElementById("stats").innerText =
    `Courses: ${data.courses.length} | Assignments: ${data.assignments.length}`;
}

updateStats();
