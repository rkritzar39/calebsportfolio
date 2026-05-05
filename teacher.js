/* =========================
   SYSTEM DATA MODEL
========================= */

const DEFAULT_DATA = {
  courses: [
    { id: "c1", name: "Cybersecurity 101" },
    { id: "c2", name: "IT Systems Fundamentals" }
  ],
  assignments: [
    {
      id: "a1",
      title: "Intro to Cybersecurity",
      due: "2026-05-10",
      course: "Cybersecurity 101",
      score: 95
    }
  ]
};

let data = loadData();

/* =========================
   LOAD FROM STORAGE
========================= */

function loadData(){
  const stored = localStorage.getItem("lms_teacher_data");
  return stored ? JSON.parse(stored) : structuredClone(DEFAULT_DATA);
}

/* =========================
   SAVE + SYNC ENGINE
========================= */

function save(){
  localStorage.setItem("lms_teacher_data", JSON.stringify(data));
  localStorage.setItem("lms_sync_signal", Date.now());
  render();
}

function publish(){
  save();
}

/* =========================
   COURSE CREATION
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
   ASSIGNMENT CREATION (GRADEBOOK ENABLED)
========================= */

function addAssignment(){

  const title = document.getElementById("aTitle").value.trim();
  const due = document.getElementById("aDue").value;
  const course = document.getElementById("aCourse").value;
  const scoreInput = document.getElementById("aScore");

  const score = scoreInput ? Number(scoreInput.value) : null;

  if(!title || !due || !course) return;

  data.assignments.push({
    id: "a" + Date.now(),
    title,
    due,
    course,
    score: isNaN(score) ? null : score
  });

  document.getElementById("aTitle").value = "";
  document.getElementById("aDue").value = "";
  if(scoreInput) scoreInput.value = "";

  save();
}

/* =========================
   UI RENDER ENGINE
========================= */

function render(){

  const courseList = document.getElementById("courseList");
  const assignmentList = document.getElementById("assignmentList");
  const dropdown = document.getElementById("aCourse");

  /* =========================
     COURSE LIST
  ========================== */

  if(courseList){
    courseList.innerHTML = data.courses.map(c => `
      <div class="assignment">
        📚 ${c.name}
      </div>
    `).join("");
  }

  /* =========================
     ASSIGNMENT LIST
  ========================== */

  if(assignmentList){
    assignmentList.innerHTML = data.assignments.map(a => `
      <div class="assignment">
        📝 ${a.title}
        <br>
        <small>
          Course: ${a.course} |
          Due: ${a.due} |
          Score: ${a.score ?? "Not graded"}
        </small>
      </div>
    `).join("");
  }

  /* =========================
     DROPDOWN POPULATION
  ========================== */

  if(dropdown){
    dropdown.innerHTML = data.courses.map(c => `
      <option value="${c.name}">${c.name}</option>
    `).join("");
  }
}

/* =========================
   INITIAL RENDER
========================= */

render();

/* =========================
   LIVE SYNC LISTENER
========================= */

window.addEventListener("storage", (event) => {
  if (
    event.key === "lms_teacher_data" ||
    event.key === "lms_sync_signal"
  ) {
    data = loadData();
    render();
  }
});
