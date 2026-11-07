export const EDUCATION_PUBLIC_PATH = ["education_public", "portfolio"];
export const EDUCATION_PUBLIC_VERSION = 1;

export const EDUCATION_PRIVACY_LABELS = {
  showCumulativeGpa: "Cumulative GPA from published grades",
  showSemesterGpa: "Semester GPA and GPA trend from published grades",
  showCourseGrades: "Grades for courses marked Public",
  showCompletedCredits: "Earned-credit totals and degree progress",
  showAttemptedCredits: "Attempted-credit totals",
  showPlannedCourses: "Planned courses",
  showTransferCredits: "Transfer courses and transfer entries",
  showAchievements: "Achievements",
  showCertifications: "Certifications",
  showProjects: "Projects",
  showGoals: "Goals and milestones",
  showAcademicStanding: "Academic year, standing, and enrollment status"
};

export const EDUCATION_LIST_FIELDS = {
  requirements: "requirements",
  timeline: "timeline",
  goals: "goals",
  plannedCourses: "planned",
  achievements: "achievements",
  certifications: "certifications",
  projects: "projects",
  skills: "skills",
  transferCredits: "transfers"
};

const OPTIONAL_LISTS = {
  goals: "showGoals",
  plannedCourses: "showPlannedCourses",
  achievements: "showAchievements",
  certifications: "showCertifications",
  projects: "showProjects",
  transferCredits: "showTransferCredits"
};

const PROFILE_FIELDS = [
  "institution", "college", "program", "intendedProgram", "major", "minor",
  "concentration", "expectedGraduation"
];
const CARD_FIELDS = ["title", "name", "course", "status", "date", "issuer", "institution", "description"];
const COURSE_FIELDS = ["code", "name", "subject", "requirementArea", "gradingMode", "status"];

function list(value) {
  return Array.isArray(value) ? value : [];
}

function strings(source, keys) {
  return Object.fromEntries(keys.filter(key => typeof source?.[key] === "string")
    .map(key => [key, source[key]]));
}

function safeUrl(value) {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password) return url.href;
  } catch {
    // Unusable URLs are left out of the public copy.
  }
  return undefined;
}

function approvedEntry(entry) {
  return entry && typeof entry === "object" && !Array.isArray(entry) &&
    (entry.visibility == null || entry.visibility === "public" || entry.visibility === "no-grade") &&
    !["draft", "preview", "archived", "private"].includes(String(entry.status || "").trim().toLowerCase());
}

function publicCards(entries) {
  return list(entries).filter(approvedEntry).map(entry => {
    const card = strings(entry, CARD_FIELDS);
    const url = safeUrl(entry.url);
    if (url) card.url = url;
    return card;
  });
}

function publicCourses(courses, privacy) {
  return list(courses).filter(course => {
    if (!["public", "no-grade"].includes(course?.visibility)) return false;
    const status = String(course.status || "Planned").trim().toLowerCase();
    if (status === "planned" && !privacy.showPlannedCourses) return false;
    if ((status === "transfer" || course.gradingMode === "transfer") && !privacy.showTransferCredits) return false;
    return true;
  }).map(course => {
    const result = strings(course, COURSE_FIELDS);
    if (Number.isFinite(course.credits) && course.credits >= 0) result.credits = course.credits;
    result.skills = list(course.skills).filter(skill => typeof skill === "string");
    if (course.visibility === "public" && privacy.showCourseGrades && typeof course.grade === "string" && course.grade.trim()) {
      result.grade = course.grade;
      if (course.gradingMode === "custom") {
        if (typeof course.affectsGpa === "boolean") result.affectsGpa = course.affectsGpa;
        if (typeof course.earnsCredit === "boolean") result.earnsCredit = course.earnsCredit;
        if (Number.isFinite(course.qualityPointsPerCredit)) result.qualityPointsPerCredit = course.qualityPointsPerCredit;
      }
    }
    return result;
  });
}

export function makePublishedEducation(draft) {
  const privacy = Object.fromEntries(Object.keys(EDUCATION_PRIVACY_LABELS)
    .map(key => [key, draft.privacy?.[key] === true]));
  const profile = strings(draft.profile, PROFILE_FIELDS);
  if (privacy.showAcademicStanding) {
    Object.assign(profile, strings(draft.profile, ["academicYear", "academicStanding", "enrollmentStatus"]));
  }
  const degree = strings(draft.degree, ["name"]);
  if (Number.isFinite(draft.degree?.requiredCredits) && draft.degree.requiredCredits > 0) {
    degree.requiredCredits = draft.degree.requiredCredits;
  }

  const semesters = list(draft.semesters).filter(approvedEntry).map(term => ({
    ...strings(term, ["name", "dates", "status"]),
    current: term.current === true,
    courses: publicCourses(term.courses, privacy)
  })).filter(term => term.courses.length > 0);

  const published = {
    schemaVersion: EDUCATION_PUBLIC_VERSION,
    ...strings(draft, ["intro"]),
    profile,
    degree,
    privacy,
    semesters,
    // Manual totals and progress may include private courses. Derive public totals from the public rows.
    requirements: list(draft.requirements).filter(approvedEntry).map(entry => ({
      ...strings(entry, ["name"]),
      ...(Number.isFinite(entry.required) && entry.required > 0 ? { required: entry.required } : {})
    })),
    timeline: publicCards(draft.timeline ?? draft.milestones),
    skills: list(draft.skills).flatMap(skill => {
      if (typeof skill === "string") return [skill];
      return approvedEntry(skill) && typeof skill.name === "string" ? [strings(skill, ["name", "level"])] : [];
    })
  };
  if (typeof draft.currentTerm === "string" && semesters.some(term => term.name === draft.currentTerm)) {
    published.currentTerm = draft.currentTerm;
  }
  for (const [field, setting] of Object.entries(OPTIONAL_LISTS)) {
    if (privacy[setting]) published[field] = publicCards(draft[field]);
  }
  return published;
}
