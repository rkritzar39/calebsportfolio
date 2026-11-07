import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import {
  doc, getDocFromServer, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import {
  EDUCATION_LIST_FIELDS, EDUCATION_PRIVACY_LABELS, EDUCATION_PUBLIC_PATH, makePublishedEducation
} from "./education-public.js";

const draftRef = doc(db, "site_config", "educationPage");
const publicRef = doc(db, ...EDUCATION_PUBLIC_PATH);
const $ = id => document.getElementById(id);
const field = name => $(`education-${name}`);
const escape = value => String(value ?? "").replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const list = value => Array.isArray(value) ? value : [];
const profileFields = {
  institution: "institution", college: "college", program: "program",
  intendedProgram: "intended-program", major: "major", minor: "minor",
  concentration: "concentration", academicYear: "academic-year",
  enrollmentStatus: "enrollment-status", expectedGraduation: "expected-graduation"
};
const originalRows = new WeakMap();
let originalDraft = {};

function status(message, error = false) {
  const element = field("page-status");
  element.textContent = message;
  element.className = `status-message ${error ? "error" : "success"}`;
}

function clearPreview() {
  field("public-preview").hidden = true;
  field("public-preview").open = false;
  field("public-preview-json").value = "";
}

function courseEditor(course = {}) {
  const row = document.createElement("div");
  row.className = "advanced-course-row";
  row.innerHTML = `
    <input class="ec-code" aria-label="Course code" placeholder="Code" value="${escape(course.code)}">
    <input class="ec-name" aria-label="Course title" placeholder="Course title" value="${escape(course.name)}">
    <input class="ec-credits" aria-label="Course credits" type="number" min="0" step=".5" placeholder="Credits" value="${escape(course.credits)}">
    <select class="ec-mode" aria-label="Grading mode">
      <option value="letter">Standard Letter</option><option value="grade-no-credit">Grade / No Credit</option>
      <option value="pass-no-credit">Pass / No Credit</option><option value="satisfactory-unsatisfactory">Satisfactory / Unsatisfactory</option>
      <option value="audit">Audit</option><option value="transfer">Transfer</option><option value="custom">Custom</option>
    </select>
    <input class="ec-grade" aria-label="Grade" placeholder="Grade: A, PS, S, AU…" value="${escape(course.grade)}">
    <select class="ec-status" aria-label="Course status">
      <option>Planned</option><option>In Progress</option><option>Completed</option><option>Transfer</option><option>Withdrawn</option><option>Dropped</option>
    </select>
    <input class="ec-subject" aria-label="Subject" placeholder="Subject / requirement" value="${escape(course.subject ?? course.requirementArea)}">
    <input class="ec-skills" aria-label="Course skills" placeholder="Skills (comma separated)" value="${escape(list(course.skills).join(", ") || course.skills || "")}">
    <select class="ec-visibility" aria-label="Course visibility">
      <option value="private">Private</option><option value="no-grade">Public without grade</option><option value="public">Public</option>
    </select>
    <button type="button" class="danger-btn" aria-label="Remove course">Remove</button>`;
  row.querySelector(".ec-mode").value = course.gradingMode || "letter";
  row.querySelector(".ec-status").value = course.status || "Planned";
  row.querySelector(".ec-visibility").value = ["public", "no-grade"].includes(course.visibility) ? course.visibility : "private";
  row.querySelector("button").onclick = () => { row.remove(); clearPreview(); };
  originalRows.set(row, course);
  return row;
}

function semesterEditor(semester = {}) {
  const row = document.createElement("article");
  row.className = "advanced-semester-editor";
  row.innerHTML = `
    <div class="semester-admin-head">
      <input class="es-name" aria-label="Semester name" placeholder="Fall 2026" value="${escape(semester.name)}">
      <input class="es-dates" aria-label="Semester dates" placeholder="Aug 31 – Dec 18, 2026" value="${escape(semester.dates)}">
      <select class="es-status" aria-label="Semester status"><option>Planned</option><option>Current</option><option>Completed</option><option>Archived</option></select>
      <label><input class="es-current" type="checkbox" ${semester.current ? "checked" : ""}> Current</label>
      <button type="button" class="danger-btn remove-sem">Remove semester</button>
    </div>
    <div class="advanced-course-list"></div>
    <button type="button" class="secondary-button add-course">+ Add Course</button>`;
  row.querySelector(".es-status").value = semester.status || "Planned";
  const courses = row.querySelector(".advanced-course-list");
  courses.replaceChildren(...list(semester.courses).map(courseEditor));
  row.querySelector(".add-course").onclick = () => { courses.append(courseEditor()); clearPreview(); };
  row.querySelector(".remove-sem").onclick = () => { row.remove(); clearPreview(); };
  originalRows.set(row, semester);
  return row;
}

function renderDraft(draft = {}) {
  originalDraft = draft;
  for (const [key, id] of Object.entries(profileFields)) field(id).value = draft.profile?.[key] ?? "";
  field("current-term").value = draft.currentTerm ?? "";
  field("degree-name").value = draft.degree?.name ?? "";
  field("required-credits").value = draft.degree?.requiredCredits ?? 120;
  field("cumulative-gpa").value = draft.cumulativeGpa ?? "";
  field("credits-completed").value = draft.creditsCompleted ?? "";
  field("intro").value = draft.intro ?? "";
  field("privacy-grid").innerHTML = Object.entries(EDUCATION_PRIVACY_LABELS).map(([key, label]) =>
    `<label><input type="checkbox" data-edu-privacy="${key}" ${draft.privacy?.[key] === true ? "checked" : ""}> ${label}</label>`
  ).join("");
  field("semesters-editor").replaceChildren(...list(draft.semesters).map(semesterEditor));
  for (const [key, id] of Object.entries(EDUCATION_LIST_FIELDS)) {
    const value = key === "timeline" ? draft.timeline ?? draft.milestones : draft[key];
    field(`${id}-json`).value = JSON.stringify(list(value), null, 2);
  }
  clearPreview();
}

function collectDraft() {
  const value = id => field(id).value.trim();
  const number = id => value(id) === "" ? null : Number(value(id));
  const { revision, updatedAt, isPublic, publishStatus, ...original } = originalDraft;
  const draft = {
    ...original,
    schemaVersion: 3,
    intro: value("intro"),
    profile: { ...original.profile },
    degree: { ...original.degree, name: value("degree-name"), requiredCredits: number("required-credits") ?? 120 },
    currentTerm: value("current-term"),
    cumulativeGpa: number("cumulative-gpa"),
    creditsCompleted: number("credits-completed"),
    privacy: { ...original.privacy }
  };
  for (const [key, id] of Object.entries(profileFields)) draft.profile[key] = value(id);
  for (const input of field("privacy-grid").querySelectorAll("[data-edu-privacy]")) {
    draft.privacy[input.dataset.eduPrivacy] = input.checked;
  }
  for (const [key, id] of Object.entries(EDUCATION_LIST_FIELDS)) {
    const raw = value(`${id}-json`);
    try {
      draft[key] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(draft[key])) throw new Error("Expected a list");
    } catch {
      throw new Error(`Check the JSON list in the ${field(`${id}-json`).previousElementSibling.textContent} section.`);
    }
  }
  draft.semesters = [...field("semesters-editor").querySelectorAll(".advanced-semester-editor")].map(row => {
    const get = selector => row.querySelector(selector).value.trim();
    const courses = [...row.querySelectorAll(".advanced-course-row")].map(course => {
      const read = selector => course.querySelector(selector).value.trim();
      return {
        ...originalRows.get(course),
        code: read(".ec-code"),
        name: read(".ec-name"),
        credits: read(".ec-credits") === "" ? null : Number(read(".ec-credits")),
        gradingMode: read(".ec-mode"),
        grade: read(".ec-grade"),
        status: read(".ec-status"),
        subject: read(".ec-subject"),
        skills: read(".ec-skills").split(",").map(skill => skill.trim()).filter(Boolean),
        visibility: read(".ec-visibility")
      };
    }).filter(course => course.code || course.name);
    return {
      ...originalRows.get(row), name: get(".es-name"), dates: get(".es-dates"),
      status: get(".es-status"), current: row.querySelector(".es-current").checked, courses
    };
  }).filter(semester => semester.name || semester.courses.length);
  return draft;
}

function revisionOf(snapshot) {
  if (!snapshot.exists()) return "missing";
  const { revision, updatedAt } = snapshot.data();
  return revision ?? `legacy:${updatedAt?.seconds ?? ""}:${updatedAt?.nanoseconds ?? ""}`;
}

function downloadBackup(draft) {
  const data = { format: "education-private-backup", version: 1, draft };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "education-private-backup.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function readBackup(data) {
  const draft = data?.format === "education-private-backup" && data.version === 1 ? data.draft : data;
  const isRecord = value => value && typeof value === "object" && !Array.isArray(value);
  if (!isRecord(draft) || !isRecord(draft.profile) || !Array.isArray(draft.semesters) ||
      draft.schemaVersion === 1 || draft.semesters.some(term => !isRecord(term) ||
        !Array.isArray(term.courses) || term.courses.some(course => !isRecord(course)))) {
    throw new Error("Choose a private Education backup.");
  }
  return draft;
}

const form = field("page-form");
if (form) {
  const fields = field("editor-fields");
  const publication = field("publication-status");
  let session = 0;
  let revision = null;

  function showPublication(published) {
    publication.textContent = published ? "Education has a published copy." : "Education is unpublished.";
    field("unpublish").disabled = !published;
  }

  onAuthStateChanged(auth, async user => {
    const currentSession = ++session;
    revision = null;
    fields.disabled = true;
    renderDraft();
    if (!user) return;
    status("Loading the private Education record…");
    try {
      const [privateSnapshot, publicSnapshot] = await Promise.all([
        getDocFromServer(draftRef), getDocFromServer(publicRef)
      ]);
      if (currentSession !== session) return;
      renderDraft(privateSnapshot.data());
      revision = revisionOf(privateSnapshot);
      showPublication(publicSnapshot.exists());
      fields.disabled = false;
      status("");
    } catch (error) {
      if (currentSession !== session) return;
      console.error("Education load failed", error);
      publication.textContent = "Education editor unavailable.";
      status("Could not load Education. Check that the updated Firestore rules are active, then reload.", true);
    }
  });

  async function save(action) {
    if (fields.disabled || revision === null || !auth.currentUser) return;
    const currentSession = session;
    const expectedRevision = revision;
    try {
      const draft = action === "unpublish" ? null : collectDraft();
      const published = action === "publish" ? makePublishedEducation(draft) : null;
      const nextRevision = crypto.randomUUID();
      fields.disabled = true;
      status("Saving Education…");
      const result = await runTransaction(db, async transaction => {
        const current = await transaction.get(draftRef);
        if (revisionOf(current) !== expectedRevision) {
          throw new Error("Education was changed in another session. Export your edits as a private backup if needed, then reload.");
        }
        if (draft) transaction.set(draftRef, { ...draft, revision: nextRevision, updatedAt: serverTimestamp() });
        if (action === "publish") transaction.set(publicRef, { ...published, updatedAt: serverTimestamp() });
        if (action === "unpublish") {
          transaction.delete(publicRef);
          if (current.exists()) transaction.update(draftRef, { revision: nextRevision, updatedAt: serverTimestamp() });
          else return "missing";
        }
        return nextRevision;
      });
      if (currentSession !== session) return;
      revision = result;
      if (draft) originalDraft = draft;
      if (action !== "draft") showPublication(action === "publish");
      status({
        draft: "Private draft saved.",
        publish: "Education published.",
        unpublish: "Education unpublished. Your private record is still available here."
      }[action]);
    } catch (error) {
      if (currentSession !== session) return;
      console.error("Education save failed", error);
      status(error.message || "Education could not be saved. Please try again.", true);
    } finally {
      if (currentSession === session) fields.disabled = false;
    }
  }

  $("add-education-semester").onclick = () => { field("semesters-editor").append(semesterEditor()); clearPreview(); };
  form.addEventListener("input", event => {
    if (event.target !== field("public-preview-json")) clearPreview();
  });
  form.onsubmit = event => { event.preventDefault(); void save("draft"); };
  field("preview").onclick = () => {
    if (!form.reportValidity()) return;
    try {
      field("public-preview-json").value = JSON.stringify(makePublishedEducation(collectDraft()), null, 2);
      field("public-preview").hidden = false;
      field("public-preview").open = true;
      field("public-preview-json").focus();
    } catch (error) { status(error.message, true); }
  };
  field("publish").onclick = () => {
    if (form.reportValidity() && confirm("Publish these Education edits? This replaces the public copy.")) void save("publish");
  };
  field("unpublish").onclick = () => {
    if (confirm("Remove Education from the public website? Your private record will be kept.")) void save("unpublish");
  };
  field("export-backup").onclick = () => {
    try { downloadBackup(collectDraft()); } catch (error) { status(error.message, true); }
  };
  field("import-backup").onchange = async event => {
    const file = event.target.files[0];
    const currentSession = session;
    if (!file) return;
    try {
      const draft = readBackup(JSON.parse(await file.text()));
      if (currentSession !== session || fields.disabled) return;
      renderDraft(draft);
      status("Backup loaded into the editor. Review it before saving or publishing.");
    } catch (error) {
      if (currentSession === session) status("Could not import this private Education backup.", true);
    } finally {
      if (currentSession === session) event.target.value = "";
    }
  };
}
