# Link in Bio Website

![Version](https://img.shields.io/badge/version-v26.6--beta.2-blue)
![Build](https://img.shields.io/badge/build-2026.07.05-purple)
![Release Track](https://img.shields.io/badge/release%20track-Beta%20Revamp%20Preview-orange)
![Stable Base](https://img.shields.io/badge/stable%20base-v26.5-green)
![Planned Revamp](https://img.shields.io/badge/planned%20revamp-v27.0-yellow)
![JavaScript](https://img.shields.io/badge/JavaScript-50.0%25-f1e05a)
![CSS](https://img.shields.io/badge/CSS-36.3%25-663399)
![HTML](https://img.shields.io/badge/HTML-13.7%25-e34c26)

Welcome to the repository for my Link in Bio Website.

This website is a centralized hub for my profile, social links, creator shoutouts, useful links, business availability, academic availability, tech information, accessibility settings, and website updates.

The website is built to be responsive, accessible, secure, and easy to use across phones, tablets, computers, and other devices.

---

## Current Version

| Attribute | Details |
| :--- | :--- |
| **Version** | v26.6-beta.2 |
| **Build** | 2026.07.05 |
| **Release Track** | Beta Revamp Preview |
| **Current Stable Base** | v26.5 |
| **Revamp Status** | Partial beta revamp in progress |
| **Target Release** | September 2026 |
| **Planned Full Revamp** | v27.0 |

---

## Table of Contents

* [Overview](#overview)
* [Features](#features)
  * [Home Page](#home-page)
  * [1. Profile Section](#1-profile-section)
  * [2. Live Activity / Status](#2-live-activity--status)
  * [3. Connect with Me](#3-connect-with-me)
  * [4. TikTok, Instagram, and YouTube Creator Shoutouts](#4-tiktok-instagram-and-youtube-creator-shoutouts)
  * [5. Useful Links](#5-useful-links)
  * [6. Countdown](#6-countdown)
  * [7. Business Information](#7-business-information)
  * [8. Holiday Hours](#8-holiday-hours)
  * [9. Temporary Hours](#9-temporary-hours)
  * [10. Academic Availability](#10-academic-availability)
  * [11. Tech Information](#11-tech-information)
  * [12. Useful Device and Website Information](#12-useful-device-and-website-information)
  * [13. Disabilities](#13-disabilities)
  * [14. Version Information](#14-version-information)
  * [15. Notice Information](#15-notice-information)
  * [16. Maintenance Mode](#16-maintenance-mode)
* [Beta Page](#beta-page)
* [Settings Page](#settings-page)
* [Resume Page](#resume-page)
* [Admin Portal](#admin-portal)
* [Security Features](#security-features)
* [Accessibility and Responsive Design](#accessibility-and-responsive-design)
* [Coding Languages & Technologies](#coding-languages--technologies)
* [Version History](#version-history)
* [Release Roadmap](#release-roadmap)
* [Conclusion](#conclusion)

---

# Overview

The Link in Bio Website is a public-facing profile and information hub.

Visitors can use the website to:
* Learn more about me
* View my social links
* Visit useful links
* View creator shoutouts
* Check business availability
* View academic availability information
* View tech information
* Learn about listed disabilities
* Check version and device information
* Access legal and notice information
* Adjust appearance and accessibility settings

> **Note:** Most public content is managed through the **Admin Portal**, which is only accessible to authorized accounts.

---

# Features

## Home Page
The Home Page contains the main public-facing sections of the website.

---

## 1. Profile Section
The Profile Section displays my main profile information.

### Includes
* Username / display name
* Bio
* Profile image
* Verified badge
* Status indicator
* Navigation buttons to other parts of the website

### Navigation Links
The navigation area can include links such as **Home**, **Beta**, **Resume**, and **Settings**. This section gives visitors a quick overview of who I am and provides access to other important pages.

---

## 2. Live Activity / Status
The website can display a live activity or status area.

### Includes
* Current status or activity text
* Active/offline style indicator
* Optional live media or music-style display
* Updated timestamp
* Dynamic Firestore-powered updates

This helps visitors see current activity or availability without needing to manually refresh the page.

---

## 3. Connect with Me
The Connect with Me section contains links to social media platforms and other ways to connect with me.

### Features
* Social media buttons & platform icons
* Links that open in a new tab
* Admin-managed links
* Visitor-only access (visitors can click, but cannot edit or modify)

---

## 4. TikTok, Instagram, and YouTube Creator Shoutouts
The website includes creator shoutout sections for TikTok, Instagram, and YouTube. These sections list creators that I follow, collaborate with, or want to highlight.

### Features
* Creator profile cards (pictures, usernames/display names)
* Platform-specific card designs
* Verified badges when available
* Follower, subscriber, like, post, or video counts when available
* Visit Profile / Visit Channel buttons
* Search and Sorting support (High to low, Low to high, A to Z, Z to A)
* Last updated timestamps

Visitors can view and visit creator profiles, but only I can modify the creator lists through the Admin Portal.

---

## 5. Useful Links
The Useful Links section displays important links that I want to share with visitors, such as personal websites, helpful resources, tools, and the merch store link.

### Features
* Links open in a new tab as buttons
* Admin-managed
* Visitors can click, but not edit

> **Note:** The merch store is listed under Useful Links instead of being treated as a separate built-in website page.

---

## 6. Countdown
The Countdown section displays a live countdown timer to a selected event.

### Countdown Units
* Years, Months, Days, Hours, Minutes, Seconds

The countdown is based on the visitor’s device/browser timezone.

---

## 7. Business Information
The Business Information section displays business availability and contact information. Business hours are shown in the visitor’s local timezone while still being based on the configured business timezone.

### Includes
* **Business status:** Open, Closed, Holiday Hours, Temporary Closure, Academic Schedule Active, Manual Override
* Contact email
* Timezones (Visitor & Store)
* Today’s hours & next open time
* Weekly business hours & Holiday/Temporary hours
* Academic schedule impact
* Status chip & Traffic light indicator
* Premium status hint & Today timeline
* Copy Today button
* 12-hour / 24-hour time format toggle
* Hide / Show Full Hours toggle

---

## 8. Holiday Hours
The business system supports Holiday Hours, which can override regular weekly business hours for a specific date.

### Display States
* Open with special hours
* Closed all day
* Scheduled holiday
* Active holiday schedule
* Concluded holiday schedule

Holiday hours only appear when holiday entries are configured.

---

## 9. Temporary Hours
The business system supports Temporary Hours for special periods (e.g., events, renovations, short-term closures). 

### Display States
* Scheduled
* Starts soon
* In effect
* Ending soon
* Concluded

Temporary hours can override normal business hours.

---

## 10. Academic Availability
The website includes Academic Availability support because school commitments can affect business availability. This is built into the Business Information section.

### Academic Items Included
* Recurring classes
* Exams & Final exams
* University events
* Academic breaks
* Internships & Co-ops
* Semester information & Academic profile information

When an academic item is active, the business status can show that availability is affected (e.g., *Class in progress*, *Exam in progress*, *Academic break*).

### Smart Recurring Class Status
Recurring classes use smart time-aware labels to prevent classes from incorrectly staying on “In Effect” after the class time has ended:
* Scheduled for Today / Tomorrow / in X days
* Starts in X minutes / X hours
* In Progress
* Concluded Today / Concluded Today • Next class Tuesday
* Not Scheduled Today • Next class Tuesday
* Concluded

### Academic Schedule Dropdown
The Academic Schedule dropdown is part of the business hours display. It hides or shows in tandem with the "Hide/Show Full Hours" toggle if academic data is available.

---

## 11. Tech Information
The Tech Information section displays technology items that I own, use, track, or plan to upgrade.

### Basic Information
* Device name, Model, Material, Storage, Color, Price
* Battery capacity, Battery health, Battery charge cycles
* Date released, Date bought, OS version

### Smart Tech Features
* **OS status:** Latest, Outdated, Very Outdated, Beta, Developer/Public Beta, Ahead of Public
* **Lifecycle & Support:** Device support status, Estimated support lifespan, Upgrade recommendation/priority, Future-proof score
* **Battery & Performance:** Battery trend, Battery cycle evaluation
* **AI & Future Planning:** AI feature support, Future AI target, Backup priority, Cost efficiency
* **Lineage:** Device lineage, Role transition details, Upgrade path

### Ownership States
Tech items support different ownership states, such as *Owned, Borrowed, School-issued, Work-issued, In repair, Planned, Future upgrade, Wishlist, Retired, Sold, Traded in, Donated*, etc.

> **Privacy Note:** The tech section is public-facing, so private or sensitive device information is not exposed.

---

## 12. Useful Device and Website Information
The website displays useful visitor-side information related to the current device and environment.

### Includes
* Browser & OS information
* Device type & Screen resolution
* Connection & Network information
* Weather, Sunrise, and Sunset information

---

## 13. Disabilities
The Disabilities section displays disabilities or conditions that I choose to list publicly.

### Features
* Disability names
* Buttons or links to official informational websites
* Hover animations
* Admin-managed list (visitor-only access)

---

## 14. Version Information
This section displays metadata about the website and the visitor’s device/browser environment.

### Includes
* **Website:** Version number, Build number, Release track, Revamp status, Target release, Synced timestamp
* **Visitor:** OS, Device, Browser, Screen resolution, Connection info, Weather/Sun info

---

## 15. Notice Information
Displays legal and content protection information, including a Watermark notice, Legal notice, Copyright notice, and Protected content message.

---

## 16. Maintenance Mode
The website can show a maintenance message (with a status page link and loading overlay) when maintenance is active.

---

# Beta Page
The Beta Page displays information about beta versions and upcoming changes, including sections being tested and experimental visual styles.

### Beta Notes
* The beta is not the final September revamp.
* Some visual styles (like liquid glass effects) may change before release.
* Mobile and split-screen layouts may still be adjusted.
* The final complete revamp is planned as v27.0.

---

# Settings Page
Allows visitors to adjust appearance and accessibility options.

### Appearance Settings
* Light mode / Dark mode
* Match device appearance
* Text size control
* Reset to default appearance settings

### Accessibility Settings
* Focus outline toggle
* Keyboard navigation support
* Accessibility-friendly display preferences

---

# Resume Page
Provides access to resume-related information, including skills, experience, education, and viewing/download options.

---

# Admin Portal
The Admin Portal is exclusively for authorized accounts to manage website content.

## Admin-Managed Content
* **Profile:** Information, social links, useful links, creator shoutouts, disabilities.
* **Business:** Contact email, weekly hours, holiday/temporary closures, manual status overrides.
* **Academic:** Class schedules, exams, finals, university events, internships, breaks, semester metadata, academic timezone.
* **Tech:** Device tracking, lifecycle, and support information.
* **Metadata:** Website and version information.

### Live Previews & Save State
The portal supports live previews for business and academic updates, powered by Firestore save/load support.

---

# Security Features
The website includes features to discourage casual copying and misuse of content:
* Copy/paste, printing, drag-and-drop, text selection, and right-click disabled
* Image saving deterrents
* Watermark, legal, and copyright notices
* Firebase-backed data with restricted Admin Portal access

> **Disclaimer:** These features act as deterrents and are not a replacement for server-side security or legal protection.

---

# Accessibility and Responsive Design
Designed to work flawlessly across multiple screen sizes and device types:
* Responsive layout & Mobile-friendly sections
* Dark/light appearance support
* Adjustable text size & Keyboard focus options
* Visitor-local timezone support
* Clear labels, status messages, and accessible buttons

---

# Coding Languages & Technologies
This project is built with standard web technologies and Firebase backend services.

### Core Technologies
* HTML, CSS, JavaScript
* Firebase Firestore, Authentication, Cloud Messaging
* Luxon (timezone logic)
* Font Awesome icons
* LocalStorage & SessionStorage

### Language Breakdown

| Language | Percentage | Purpose |
| :--- | :--- | :--- |
| **JavaScript** | 50.0% | Powers dynamic behavior (profiles, sorting, logic, timezones, Firestore updates). |
| **CSS** | 36.3% | Controls visual design (responsive layout, liquid glass styling, animations). |
| **HTML** | 13.7% | Provides website structure and section frameworks. |

---

# Version History

| Version | Highlights |
| :--- | :--- |
| **v26.6-beta.2** | Current beta update. Updated Business Status & Hours. Improved academic availability, added smart recurring class status labels, fixed stuck "In Effect" classes. Improved hide/show full hours behavior. |
| **v26.6-beta.1** | Original partial beta revamp preview. Continued liquid glass / onyx UI refinements. Added beta notes and roadmap. |
| **v26.5** | Current stable base. Updated device info and creator shoutout sections. Continued liquid glass refinement. |
| **v26.1.2** | Introduced appearance settings (match device theme, manual light/dark mode). |
| **v1.17.0** | Bug fixes. |
| **v1.16.0** | Introduced the Admin Portal and owner-only content management tools. |
| **v1.15.0** | Bug fixes. |
| **v1.14.0** | Theme consistency improvements and performance optimization. |
| **v1.13.0** | Added focus outline toggle and accessibility enhancements. |
| **v1.12.0** | Added merch store access under Useful Links. |
| **v1.11.0** | Added settings page, dark/light modes, font adjustments, factory reset. |
| **v1.10.1** | Added current day highlight, enhanced event module and theme. |
| **v1.10.0** | Added event calendar and bug fixes. |
| **v1.9.0** | Added TikTok creator shoutouts, tech info, disabilities, version info, legal notices. |
| **v1.8.0** | Added RedNote support (styled like YouTube and Instagram) and general enhancements. |
| **v1.7.0** | Added security enhancements, media-saving deterrents, and text-copying deterrents. |
| **v1.6.0** | Added Instagram & YouTube creator shoutouts, last updated timestamps, bug fixes. |
| **v1.5.0** | Bug fixes and improvements. |

---

# Release Roadmap

* **v26.5** — Current stable website base.
* **v26.6-beta.1** — Original partial beta revamp preview.
* **v26.6-beta.2** — Current beta update with business and academic section improvements.
* **v26.6-beta.2+** — More beta fixes and section updates.
* **v26.6-rc.1** — Release candidate before the full September launch.
* **v27.0** — Full September 2026 revamp release.

---

# Conclusion

This Link in Bio Website is a centralized and dynamic hub for links, profile information, creator shoutouts, business availability, academic scheduling, technology information, accessibility settings, and public updates.

Visitors can interact with public sections, view links, check business status, view creator shoutouts, read useful information, and adjust basic appearance/accessibility settings. Only I can modify managed content through the Admin Portal. 

Thanks for visiting!
