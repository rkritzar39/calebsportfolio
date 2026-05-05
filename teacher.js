/* =========================
   LMS TEACHER DATA MODEL
========================= */

let data = JSON.parse(localStorage.getItem("lms_teacher_data")) || {
  courses: [
    { id: "c1", name: "Cybersecurity 101" },
    { id: "c2", name: "IT Systems Design" }
  ],
  assignments: [
    {
      id: "a1",
      title: "Intro Quiz",
      due: "2026-05-10",
      course: "Cybersecurity 101"
    }
  ]
};

/* =========================
   SAVE + PUBLISH SYSTEM
========================= */

function save(){
  localStorage.setItem("lms_teacher_data", JSON.stringify(data));

  // triggers student live update
  localStorage.setItem("lms_sync_signal", Date.now());

  render();
}

/* optional explicit publish button (UI clarity) */
function publish(){
  save();
}

/* =========================
   RESET SYSTEM
========================= */

function resetDemo(){
  localStorage.removeItem("lms_teacher_data");
  localStorage.removeItem("lms_sync_signal");
  location.reload();
}

/* =========================
   COURSE SYSTEM
========================= */

function addCourse(){

  const input = document.getElementById("courseName");
  const name = input.value.trim();

  if(!name) return;

  data.courses.push({
    id: "c" + Date.now(),
    name
  });

  input.value = "";

  save();
}

/* =========================
   ASSIGNMENT SYSTEM
========================= */

function addAssignment(){

  const title = document.getElementById("aTitle").value.trim();
  const due = document.getElementById("aDue").value;
  const course = document.getElementById("aCourse").value;

  if(!title || !due || !course) return;

  data.assignments.push({
    id: "a" + Date.now(),
    title,
    due,
    course
  });

  document.getElementById("aTitle").value = "";
  document.getElementById("aDue").value = "";

  save();
}

/* =========================
   RENDER SYSTEM (TEACHER UI)
========================= */

function render(){

  /* COURSE LIST */
  const courseList = document.getElementById("courseList");
  if(courseList){
    courseList.innerHTML = data.courses.map(c =>
      `<div class="assignment">📚 ${c.name}</div>`
    ).join("");
  }

  /* ASSIGNMENT LIST */
  const assignmentList = document.getElementById("assignmentList");
  if(assignmentList){
    assignmentList.innerHTML = data.assignments.map(a =>
      `<div class="assignment">
        📝 ${a.title} <br>
        <small>Due: ${a.due} | Course: ${a.course}</small>
      </div>`
    ).join("");
  }

  /* COURSE DROPDOWN */
  const dropdown = document.getElementById("aCourse");
  if(dropdown){
    dropdown.innerHTML = data.courses.map(c =>
      `<option value="${c.name}">${c.name}</option>`
    ).join("");
  }
}

/* =========================
   INIT
========================= */

render();

/* auto-sync if multiple tabs open */
window.addEventListener("storage", (e) => {
  if (e.key === "lms_sync_signal") {
    data = JSON.parse(localStorage.getItem("lms_teacher_data")) || data;
    render();
  }
});
