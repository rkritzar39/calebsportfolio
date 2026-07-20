import fs from "node:fs";

const README_PATH = "README.md";
const METADATA_PATH = "website-metadata.json";

function requireFile(path) {
  if (!fs.existsSync(path)) {
    throw new Error(`Required file not found: ${path}`);
  }
}

requireFile(README_PATH);
requireFile(METADATA_PATH);

const originalReadme = fs.readFileSync(README_PATH, "utf8");
const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, "utf8"));
let updatedReadme = originalReadme;

const requiredMetadata = [
  "projectStartDate",
  "websiteVersion",
  "websiteBuild",
  "releaseTrack",
  "currentStableVersion",
  "nextStableVersion",
  "revampStatus",
  "targetRelease"
];

for (const key of requiredMetadata) {
  if (!metadata[key]) {
    throw new Error(`Missing required metadata value: ${key}`);
  }
}

function replaceSection(name, content) {
  const startMarker = `<!-- AUTO:${name}-START -->`;
  const endMarker = `<!-- AUTO:${name}-END -->`;
  const startIndex = updatedReadme.indexOf(startMarker);
  const endIndex = updatedReadme.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Missing README markers for ${name}.`);
  }

  if (endIndex <= startIndex) {
    throw new Error(`README markers for ${name} are in the wrong order.`);
  }

  const contentStart = startIndex + startMarker.length;
  updatedReadme =
    updatedReadme.slice(0, contentStart) +
    `\n${content.trim()}\n` +
    updatedReadme.slice(endIndex);
}

function shieldText(value) {
  return String(value)
    .replaceAll("-", "--")
    .replaceAll("_", "__")
    .replaceAll(" ", "%20");
}

function calculateAge(startDateString) {
  const start = new Date(`${startDateString}T00:00:00Z`);
  const now = new Date();

  if (Number.isNaN(start.getTime())) {
    throw new Error(`Invalid projectStartDate: ${startDateString}`);
  }

  let years = now.getUTCFullYear() - start.getUTCFullYear();
  let months = now.getUTCMonth() - start.getUTCMonth();
  let days = now.getUTCDate() - start.getUTCDate();

  if (days < 0) {
    months -= 1;
    days += new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)).getUTCDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

function plural(value, word) {
  return `${value} ${word}${value === 1 ? "" : "s"}`;
}

function formatAge({ years, months, days }) {
  return `${plural(years, "year")}, ${plural(months, "month")}, and ${plural(days, "day")}`;
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${dateString}T00:00:00Z`));
}

function languageColor(language) {
  const colors = {
    JavaScript: "f1e05a",
    CSS: "663399",
    HTML: "e34c26",
    TypeScript: "3178c6",
    Python: "3572A5",
    Shell: "89e051"
  };
  return colors[language] ?? "6e7781";
}

function languagePurpose(language) {
  const purposes = {
    JavaScript: "Powers dynamic behavior, profile loading, sorting, time logic, Firestore updates, navigation interactions, Discord synchronization, Live Activity, and interactive interface features.",
    CSS: "Controls visual design, responsive layouts, liquid-glass styling, animations, themes, device breakpoints, and hover effects.",
    HTML: "Provides website structure, page sections, navigation, inline SVG icons, and content frameworks."
  };
  return purposes[language] ?? "Supports website functionality and project resources.";
}

async function loadLanguages() {
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;

  if (!repository || !token) {
    console.warn("GitHub environment unavailable; keeping the current language section.");
    return null;
  }

  const response = await fetch(`https://api.github.com/repos/${repository}/languages`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub languages API failed: ${response.status} ${response.statusText}`);
  }

  const bytesByLanguage = await response.json();
  const total = Object.values(bytesByLanguage).reduce((sum, bytes) => sum + bytes, 0);

  if (total === 0) return [];

  return Object.entries(bytesByLanguage)
    .map(([name, bytes]) => ({ name, percentage: (bytes / total) * 100 }))
    .sort((a, b) => b.percentage - a.percentage);
}

const projectAge = calculateAge(metadata.projectStartDate);
const languages = await loadLanguages();

const languageBadges = languages
  ? languages.slice(0, 5).map(({ name, percentage }) =>
      `![${name}](https://img.shields.io/badge/${shieldText(name)}-${percentage.toFixed(1)}%25-${languageColor(name)})`
    )
  : null;

const staticLanguageBadges = [
  "![JavaScript](https://img.shields.io/badge/JavaScript-45.3%25-f1e05a)",
  "![CSS](https://img.shields.io/badge/CSS-37.6%25-663399)",
  "![HTML](https://img.shields.io/badge/HTML-17.1%25-e34c26)"
];

replaceSection(
  "BADGES",
  [
    `![Version](https://img.shields.io/badge/version-${shieldText(metadata.websiteVersion)}-blue)`,
    `![Build](https://img.shields.io/badge/build-${shieldText(metadata.websiteBuild)}-purple)`,
    `![Release Track](https://img.shields.io/badge/release%20track-${shieldText(metadata.releaseTrack)}-orange)`,
    `![Current Stable](https://img.shields.io/badge/current%20stable-${shieldText(metadata.currentStableVersion)}-green)`,
    `![Next Stable](https://img.shields.io/badge/next%20stable-${shieldText(metadata.nextStableVersion)}-yellow)`,
    ...(languageBadges ?? staticLanguageBadges)
  ].join("\n")
);

replaceSection(
  "CURRENT-VERSION",
  `| Attribute | Details |
| :--- | :--- |
| **Version** | ${metadata.websiteVersion} |
| **Build** | ${metadata.websiteBuild} |
| **Release Track** | ${metadata.releaseTrack} |
| **Current Stable Version** | ${metadata.currentStableVersion} |
| **Revamp Status** | ${metadata.revampStatus} |
| **Target Release** | ${metadata.targetRelease} |
| **Next Stable Release** | ${metadata.nextStableVersion} |

> **Release Status:** ${metadata.currentStableVersion} remains the current stable public version. ${metadata.websiteVersion} is the current ${metadata.releaseTrack.toLowerCase()}, and ${metadata.nextStableVersion} is the next planned stable release.`
);

replaceSection(
  "PROJECT-AGE",
  `Development began on **${formatDate(metadata.projectStartDate)}**.

The project has been under development for **${formatAge(projectAge)}**.`
);

replaceSection(
  "RELEASE-METADATA",
  `\`\`\`js
const WEBSITE_VERSION = "${metadata.websiteVersion}";
const WEBSITE_BUILD = "${metadata.websiteBuild}";
const RELEASE_TRACK = "${metadata.releaseTrack}";
const REVAMP_STATUS = "${metadata.revampStatus}";
const TARGET_RELEASE = "${metadata.targetRelease}";
\`\`\``
);

if (languages) {
  const rows = languages.map(({ name, percentage }) =>
    `| **${name}** | ${percentage.toFixed(1)}% | ${languagePurpose(name)} |`
  );

  replaceSection(
    "LANGUAGES",
    `| Language | Percentage | Purpose |
| :--- | :--- | :--- |
${rows.join("\n")}`
  );
}

if (updatedReadme === originalReadme) {
  console.log("README.md is already current.");
} else {
  fs.writeFileSync(README_PATH, updatedReadme, "utf8");
  console.log("README.md was updated successfully.");
}
