# Link in Bio Website

![Version](https://img.shields.io/badge/version-v26.6--beta.4-blue)
![Build](https://img.shields.io/badge/build-2026.07.13-purple)
![Release Track](https://img.shields.io/badge/release%20track-Beta%20Revamp%20Preview-orange)
![Stable Base](https://img.shields.io/badge/stable%20base-v26.5-green)
![Planned Revamp](https://img.shields.io/badge/planned%20revamp-v27.0-yellow)
![JavaScript](https://img.shields.io/badge/JavaScript-48.7%25-f1e05a)
![CSS](https://img.shields.io/badge/CSS-37.9%25-663399)
![HTML](https://img.shields.io/badge/HTML-13.4%25-e34c26)

Welcome to the repository for my Link in Bio Website. This project serves as a centralized, dynamic hub for my profile, social links, creator shoutouts, business and academic availability, tech information, and digital resume. 

The website is built to be responsive, accessible, secure, and intuitive across phones, foldables, tablets, laptops, desktop computers, and other supported devices.

---

## 📋 Table of Contents

* [Overview & Current Status](#-overview--current-status)
* [Core Features](#-core-features)
* [Navigation & Pages](#-navigation--pages)
* [Admin Portal](#-admin-portal)
* [Security & Accessibility](#️-security--accessibility)
* [Tech Stack](#-tech-stack)
* [Version History & Roadmap](#-version-history--roadmap)
* [Removed & Retired Features](#️-removed--retired-features)

---

## 📊 Overview & Current Status

The Link in Bio Website is a public-facing profile and information hub. Most public content is driven dynamically and managed through a secure Admin Portal accessible only to authorized accounts.

### Current Release Details

| Attribute | Details |
| :--- | :--- |
| **Version** | v26.6-beta.4 |
| **Build** | 2026.07.13 |
| **Release Track** | Beta Revamp Preview |
| **Current Stable Base** | v26.5 |
| **Revamp Status** | Partial beta revamp in progress |
| **Target Release** | September 2026 (v27.0) |

---

## ✨ Core Features

The Home Page focuses on a clean experience, housing all actively used sections with improved responsive layouts.

### Profile & Connections
* **Profile:** Displays my username, bio, profile image, verified badge, and current status indicator.
* **Connect with Me:** Features public social media buttons and platform links (opened in new tabs).
* **Useful Links:** A curated list of helpful resources, personal websites, tools, and merch store links.
* **Creator Shoutouts:** Dedicated profile cards highlighting creators I follow or collaborate with across TikTok, Instagram, and YouTube. Includes follower/subscriber counts, platform verification, and sorting options (A-Z, High-to-Low).

### Business & Academic Availability
* **Business Information:** Displays real-time business status (Open, Closed, Holiday, Temp Closure) converted to the visitor's local timezone. Includes a traffic light indicator, daily timeline, and a 12/24-hour toggle.
* **Holiday & Temporary Hours:** Automatically overrides normal weekly hours for specific dates, special events, or renovations.
* **Academic Availability:** Integrates school commitments (classes, exams, university events, internships) directly into the business status. Features smart, time-aware labels for recurring classes (e.g., "In Progress", "Starts in X minutes").

### Tech & Device Information
* **Public Tech Roster:** Lists owned, planned, or retired technology with details like model, battery health, charge cycles, and OS version.
* **Lifecycle & Support:** Evaluates device future-proof scores, security support lifespans, and upgrade recommendations.
* **Visitor Device Context:** Displays non-sensitive visitor data (browser, OS, screen resolution, local weather, and sunrise/sunset times) to provide a tailored viewing context.

### Status & Utilities
* **Live Activity:** A Firestore-powered live status area indicating current offline/active status or media playback.
* **Countdown:** A localized countdown timer to specific upcoming events.
* **Disabilities:** A public list of conditions with links to educational resources.
* **Maintenance Mode:** A friendly overlay and status page link displayed during active website updates.

---

## 🧭 Navigation & Pages

Version `v26.6-beta.4` introduces advanced navigation mechanics and refined secondary pages.

### Onyx Navigation Dock
The liquid-glass Onyx dock provides seamless routing between the Home, Beta, Resume, and Settings pages.
* **Interactions:** Supports tap/click, keyboard navigation (arrows, Enter, Space), and press-and-drag targeting with release-and-snap animations.
* **Visuals:** Features inline SVG icons, an active liquid-glass lens, balanced left/right spacing, and safe-area support for modern mobile displays.

### Settings Page
Allows visitors to customize their viewing experience.
* **Appearance:** Light mode, dark mode, match-device, clear/tinted appearance modes, text size control, and custom accent colors.
* **Accessibility:** Focus outline toggles, keyboard navigation enhancements, high-contrast support, and reduced-motion preferences.

### Resume Page
A digital, highly responsive version of my professional resume sharing the same appearance system as the Settings page.
* **Content:** Contact info, professional summary, skills, experience, education, certifications, and projects.
* **Print/PDF Optimization:** Automatically strips glass effects, hides the navigation dock/footer, and enforces high-contrast black-and-white text for clean printing and PDF generation.

### Beta Page
Displays transparent release roadmaps, beta notes, and planned version paths to keep visitors informed of upcoming visual and functional changes.

---

## 🔒 Admin Portal

The Admin Portal is a restricted, owner-only dashboard utilized to manage the website's dynamic content via Firebase Firestore. It features live previews for business/academic updates and robust save/load state support.

| Admin Section | Capabilities |
| :--- | :--- |
| **Profile & Links** | Update bio, profile images, social/useful links, creator shoutouts, and disability lists. |
| **Business Data** | Modify weekly hours, schedule holidays/temporary closures, and apply manual override statuses (e.g., "Force Open"). |
| **Academic Data** | Manage class schedules, exams, academic breaks, semester metadata, and timezone rules. |
| **Tech Data** | Update device lineages, battery health, OS versions, upgrade targets, and ownership states. |
| **Metadata** | Sync website versions, build numbers, and release track information. |

---

## 🛡️ Security & Accessibility

### Deterrents & Protections
While client-side restrictions do not replace proper backend security (Firestore Rules, authentication), the front end includes copy/paste deterrents, drag-and-drop restrictions, right-click disabling, and explicit copyright/watermark notices to discourage content scraping.

### Responsive Design
The UI adapts effortlessly across extra-small phones, foldables, tablets (portrait/landscape), and massive desktop displays. It includes split-screen browser support and touch-friendly interaction targets.

---

## 💻 Tech Stack

This project is built without heavy frontend frameworks, relying on optimized core web technologies and serverless backend infrastructure.

| Language / Tool | Percentage | Purpose |
| :--- | :--- | :--- |
| **JavaScript** | 48.7% | Logic, time/timezone math (Luxon), Firestore listeners, UI interactivity, and route detection. |
| **CSS** | 37.9% | Responsive layouts, liquid-glass/Onyx styling, dark/light themes, animations, and print media queries. |
| **HTML** | 13.4% | Semantic structure, inline SVG icons, and page architecture. |
| **Firebase** | Backend | Firestore (Database), Authentication, and Cloud Messaging. |
| **Libraries** | Utils | Luxon, Font Awesome, SunCalc, and html2pdf.js. |

> **Note:** Language percentages reflect current GitHub repository data.

---

## 📅 Version History & Roadmap

### Recent Releases

| Version | Highlights |
| :--- | :--- |
| **v26.6-beta.4** | Added Onyx liquid-glass dock, press-and-drag navigation, cross-device layout improvements, and Resume theme integration. |
| **v26.6-beta.3** | Cleanup release. Stripped out retired features, unused JavaScript/CSS, and obsolete Firestore listeners. |
| **v26.6-beta.2** | Academic availability logic upgrades, smart recurring class labels, and full-hours toggle fixes. |
| **v26.6-beta.1** | Initial partial revamp preview. Introduced liquid-glass UI foundations and beta roadmap notes. |
| **v26.5** | Current stable base. Refined creator shoutouts and device information data. |

### Release Roadmap
* **v26.5** — Current stable website base.
* **v26.6-beta.1 to .4** — Incremental UI revamps, navigation overhauls, and codebase cleanups.
* **v26.6-beta.5+** — Ongoing beta fixes, accessibility audits, and responsive refinements.
* **v26.6-rc.1** — Final release candidate.
* **v27.0** — Full September 2026 revamp release.

---

## 🗑️ Removed & Retired Features

To streamline the codebase and focus the website's purpose, the following features (and their associated CSS/JS/Firestore logic) were entirely removed in `v26.6-beta.3`:

* FAQ, Posts, and Blog systems
* President and Legislation tracking sections
* Quote of the Day (and custom quote manager)
* Embedded Latest TikTok player (Main shoutouts remain)
* Onyx AI Assistant (Device AI evaluation metrics remain in Tech Section)
* Project Goal Tracker

---

> *Thank you for visiting the Link in Bio Website repository!*
