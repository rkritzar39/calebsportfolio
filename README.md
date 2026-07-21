# Link in Bio Website

<!-- AUTO:BADGES-START -->
![Version](https://img.shields.io/badge/version-v27.0--rc.1-blue)
![Build](https://img.shields.io/badge/build-2026.07.17-purple)
![Release Track](https://img.shields.io/badge/release%20track-Release%20Candidate-orange)
![Current Stable](https://img.shields.io/badge/current%20stable-v26.5-green)
![Next Stable](https://img.shields.io/badge/next%20stable-v27.0-yellow)
![JavaScript](https://img.shields.io/badge/JavaScript-45.4%25-f1e05a)
![CSS](https://img.shields.io/badge/CSS-36.5%25-663399)
![HTML](https://img.shields.io/badge/HTML-18.1%25-e34c26)
<!-- AUTO:BADGES-END -->

Welcome to the repository for my Link in Bio Website.

This website is a centralized hub for my profile, social links, creator shoutouts, useful links, business availability, academic availability, public tech information, accessibility settings, resume, and website updates.

The website is built to be responsive, accessible, secure, and easy to use across phones, foldables, tablets, laptops, desktop computers, and other supported devices.

---

## Current Version

<!-- AUTO:CURRENT-VERSION-START -->
| Attribute | Details |
| :--- | :--- |
| **Version** | v27.0-rc.1 |
| **Build** | 2026.07.17 |
| **Release Track** | Release Candidate |
| **Current Stable Version** | v26.5 |
| **Revamp Status** | Release candidate development and testing in progress |
| **Target Release** | Late July 2026 |
| **Next Stable Release** | v27.0 |

> **Release Status:** v26.5 remains the current stable public version. v27.0-rc.1 is the current release candidate, and v27.0 is the next planned stable release.
<!-- AUTO:CURRENT-VERSION-END -->

---

## Table of Contents

* [Overview](#overview)
* [Project Development](#project-development)
* [Features](#features)
  * [Home Page](#home-page)
  * [1. Profile Section](#1-profile-section)
  * [2. Live Activity and Status](#2-live-activity-and-status)
  * [3. Connect with Me](#3-connect-with-me)
  * [4. Creator Shoutouts](#4-creator-shoutouts)
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
* [Navigation Dock](#navigation-dock)
* [Release Candidate Page](#release-candidate-page)
* [Settings Page](#settings-page)
* [Resume Page](#resume-page)
* [Admin Portal](#admin-portal)
* [Security Features](#security-features)
* [Accessibility and Responsive Design](#accessibility-and-responsive-design)
* [Coding Languages and Technologies](#coding-languages-and-technologies)
* [Version History](#version-history)
* [Release Roadmap](#release-roadmap)
* [Removed and Retired Features](#removed-and-retired-features)
* [Conclusion](#conclusion)

---

## Overview

The Link in Bio Website is a public-facing profile and information hub.

Visitors can use the website to:

* Learn more about me
* View my social links
* Visit useful links and resources
* View TikTok, Instagram, and YouTube creator shoutouts
* Check current business availability
* View academic availability information
* View public tech information
* Learn about listed disabilities
* Check website version and visitor-device information
* Access legal and notice information
* View resume information
* Adjust appearance and accessibility settings
* Navigate between Home, Release Candidate, Resume, and Settings using the responsive Onyx dock

> **Note:** Most public content is managed through the Admin Portal, which is only accessible to authorized accounts.

## Project Development

<!-- AUTO:PROJECT-AGE-START -->
Development began on **January 2, 2025**.

The project has been under development for **1 year, 6 months, and 19 days**.
<!-- AUTO:PROJECT-AGE-END -->

---

## Features

### Home Page

The Home Page contains the primary public-facing sections of the website.

Version v27.0-rc.1 focuses on a cleaner and more cohesive experience by maintaining actively used sections, refining responsive layouts, improving the Profile and Live Activity systems, expanding Discord synchronization, updating creator cards, and continuing the Onyx liquid-glass visual system.

### 1. Profile Section

The Profile Section displays my main profile information.

#### Includes

* Username or display name
* Bio
* Profile image
* Verified badge
* Status indicator
* Responsive status presentation
* Improved spacing between the profile image and username
* Navigation access to other parts of the website

#### Discord Profile Synchronization

The Profile system supports optional Discord synchronization through the Admin Portal.

Supported synchronization options include:

* Discord display name
* Discord profile picture
* Discord online status
* Saved Discord User ID
* Admin-side profile preview
* Refresh and apply controls
* Last-synchronized metadata
* Manual fallback values when individual synchronization options are disabled

The homepage biography remains manually managed and is not replaced by Discord synchronization.

#### Navigation Links

* Home
* Release Candidate
* Resume
* Settings

The Profile Section gives visitors a quick overview of who I am and provides access to other important pages.

### 2. Live Activity and Status

The website can display a live activity or status area.

#### Includes

* Current status or activity text
* Active, idle, Do Not Disturb, or offline state
* Spotify activity
* PreMiD activity support
* Discord presence
* Optional media artwork
* Song or activity title
* Artist or activity details
* Explicit-content indicator when available
* Real Spotify progress timestamps
* Elapsed, remaining, and total time
* Indeterminate progress for supported activities without complete timestamps
* Updated timestamp
* Manual Firestore status overrides
* Dynamic artwork-based accent extraction
* User-selected accent fallback
* Responsive light and dark mode presentation

The Live Activity system can use Lanyard for Discord, Spotify, and PreMiD information. Manual Firestore status overrides take priority when active.

Dynamic song accent matching can extract a suitable color from current artwork and apply that color to the Live Activity background, progress bar, glow, borders, and supporting interface elements. When song matching is disabled, the website-selected accent color is used instead.

### 3. Connect with Me

The Connect with Me section contains links to social media platforms and other public ways to connect with me.

#### Features

* Social media buttons
* Platform icons
* Links that open in a new tab
* Admin-managed links
* Visitor-only access to public content

Visitors can click public links but cannot edit or modify them.

### 4. Creator Shoutouts

The website includes creator shoutout sections for TikTok, Instagram, and YouTube. These sections list creators that I follow, collaborate with, or want to highlight.

#### Features

* Redesigned creator profile cards
* Profile pictures
* Usernames
* Display names or nicknames
* Platform-specific card designs
* Verified badges when available
* Follower counts when available
* Subscriber counts when available
* Like, post, or video counts when available
* Visit Profile and Visit Channel buttons
* Search and sorting support
* Last updated timestamps
* Responsive phone, tablet, and desktop layouts

#### Sorting Options

* High to low
* Low to high
* A to Z
* Z to A

Visitors can view and visit creator profiles, but only authorized accounts can modify creator lists through the Admin Portal.

> **Note:** The separate Latest TikTok embed feature has been retired. The main TikTok creator shoutout section remains active.

### 5. Useful Links

The Useful Links section displays important links that I want to share with visitors.

#### Examples

* Personal websites
* Helpful resources
* External pages
* Important references
* Tools
* Merch store links

#### Features

* Links open in a new tab
* Links are displayed as buttons
* Links are managed through the Admin Portal
* Visitors can click links but cannot edit them

> **Note:** The merch store is listed under Useful Links instead of being treated as a separate built-in website page.

### 6. Countdown

The Countdown section displays a live countdown timer to a selected event.

#### Countdown Units

* Years
* Months
* Days
* Hours
* Minutes
* Seconds

The countdown is based on the visitor's device or browser timezone.

### 7. Business Information

The Business Information section displays business availability and contact information. Business hours can be shown in the visitor's local timezone while still being based on the configured business timezone.

#### Includes

* Business status and contact email
* Visitor and business timezones
* Current business time
* Today's hours and next open time
* Weekly, holiday, and temporary hours
* Academic schedule impact
* Status chip and traffic light indicator
* Premium status hint
* Today timeline
* Copy Today button
* 12-hour and 24-hour time format toggle
* Hide / Show Full Hours toggle

#### Business Statuses

* Open
* Closed
* Holiday Hours
* Temporary Closure
* Academic Schedule Active
* Manual Override

Business status can automatically update based on regular weekly hours, holiday hours, temporary hours, academic availability, and manual override settings.

### 8. Holiday Hours

Holiday Hours can override regular weekly business hours for a specific date.

#### Display States

* Open with special hours
* Closed all day
* Scheduled holiday
* Active holiday schedule
* Concluded holiday schedule

Holiday hours only appear when holiday entries are configured.

### 9. Temporary Hours

Temporary Hours can be used for events, renovations, short-term closures, special schedule changes, and temporary unavailable periods.

#### Display States

* Scheduled
* Starts soon
* In effect
* Ending soon
* Concluded

Temporary hours can override normal business hours and affect public availability.

### 10. Academic Availability

Academic Availability is built directly into the Business Information section because school commitments can affect business availability.

#### Academic Items

* Recurring classes
* Exams and final exams
* University events
* Academic breaks
* Internships and co-ops
* Semester information
* Academic profile information

When an academic item is active, the business status can show that availability is affected.

#### Smart Recurring Class Status

A recurring class can show:

* Scheduled for Today
* Scheduled for Tomorrow
* Scheduled in X days
* Starts in X minutes
* Starts in X hours
* In Progress
* Concluded Today
* Concluded Today — Next class Tuesday
* Not Scheduled Today — Next class Tuesday
* Concluded

#### Academic Schedule Dropdown

The Academic Schedule dropdown can show recurring classes, exams, finals, academic breaks, university events, internships, and co-ops. It hides or shows together with the Hide / Show Full Hours control when academic data is available.

### 11. Tech Information

The Tech Information section displays technology items that I own, use, track, or plan to upgrade.

#### Basic Information

* Device name and model
* Material, storage, and color
* Price
* Battery capacity, health, and charge cycles
* Date released and date bought
* Operating system version

#### Operating System Status

* Latest
* Outdated
* Very Outdated
* Beta
* Developer Beta
* Public Beta
* Ahead of Public
* Release Candidate
* Preview
* Canary

#### Lifecycle and Support

* Device support status
* Estimated major and security support lifespan
* Upgrade recommendation, year, window, and priority
* Future-proof score
* Recommended action

#### Battery and Performance

* Battery health and charge-cycle evaluation
* Battery trend
* Device age and score
* Upgrade triggers

#### Future Planning

* Current AI feature compatibility
* Future hardware target
* Backup priority
* Cost efficiency
* Recommended future specifications
* Upgrade target
* Features or specifications to avoid

> **Note:** AI feature compatibility is a device-evaluation feature. It is separate from the retired Onyx AI assistant.

#### Device Lineage

* Device lineage
* Role transition details
* Previous and current device roles
* Predecessor and successor devices
* Upgrade path
* Automatically managed role information

#### Ownership States

**Active:** Owned, Borrowed, Loaned out, School-issued, Work-issued, In repair

**Planned and Roadmap:** Planned, Coming soon, Future upgrade, Preordered, Ordered, Reserved

**Wishlist:** Wishlist, Considering, Researching

**Archived:** Retired, Sold, Traded in, Donated, Recycled, Returned, Lost

> **Privacy Note:** The Tech Information section is public-facing. Private or sensitive device information must not be exposed.

### 12. Useful Device and Website Information

The website can display visitor-side browser information, operating system information, device type, screen resolution, connection information, network information when available, weather information, sunrise, and sunset. Availability depends on browser support, permissions, network access, and configured services.

### 13. Disabilities

The Disabilities section displays disabilities or conditions that I choose to list publicly.

#### Features

* Disability names
* Buttons or links to informational websites
* Hover animations
* Admin-managed list
* Visitor-only access

Visitors can open each resource but cannot modify the list.

### 14. Version Information

The Version Information section displays website and visitor-environment metadata.

#### Website Information

* Version and build numbers
* Release track
* Revamp status
* Target release
* Current and next stable versions
* Synced timestamp

#### Current Release Metadata

<!-- AUTO:RELEASE-METADATA-START -->
```js
const WEBSITE_VERSION = "v27.0-rc.1";
const WEBSITE_BUILD = "2026.07.17";
const RELEASE_TRACK = "Release Candidate";
const REVAMP_STATUS = "Release candidate development and testing in progress";
const TARGET_RELEASE = "Late July 2026";
```
<!-- AUTO:RELEASE-METADATA-END -->

#### Visitor Information

* Operating system
* Device
* Browser
* Screen resolution
* Connection information
* Weather information
* Sunrise information
* Sunset information

### 15. Notice Information

The website displays watermark, legal, copyright, and protected-content notices.

### 16. Maintenance Mode

The website can show a maintenance notice, status page link, loading overlay, and visitor-friendly maintenance message when maintenance is active.

---

## Navigation Dock

Version v26.6-beta.4 introduced the responsive Onyx liquid-glass navigation dock. The completed dock is included in v27.0-rc.1.

The dock provides access to Home, Release Candidate, Resume, and Settings.

### Dock Features

* Inline SVG navigation icons
* Active liquid-glass lens
* Automatic and nested route detection
* Equal-width navigation items
* Balanced spacing and fractional-pixel lens positioning
* Press feedback and press-and-drag navigation
* Nearest-item drag targeting
* Release and snap animation
* Settings-only gear rotation
* Pointer reflection on supported mouse devices
* Keyboard navigation
* Safe-area support
* Phone, tablet, laptop, and desktop responsiveness
* Reduced-motion and high-contrast support

### Dock Interaction

Visitors can click or tap an item. On supported devices, visitors can press and hold an item, drag the liquid lens to another destination, then release to snap to and open it. The Settings gear rotates only when Settings is selected.

### Keyboard Navigation

Supported keys include Left Arrow, Right Arrow, Up Arrow, Down Arrow, Home, End, Enter, and Space. Modified browser interactions, such as opening a destination in a new tab, remain supported where available.

---

## Release Candidate Page

The former Beta Page presents the current v27.0 release candidate while continuing to use the `/beta` route for compatibility.

#### Includes

* Current stable, release candidate, build, and next stable versions
* Release candidate notes
* Completed features and final testing areas
* Changelog and removed features
* Release roadmap
* Search support
* Tally feedback form

#### Release Candidate Notes

* v26.5 remains the current stable public version.
* v27.0-rc.1 is the current release candidate.
* Release candidate development and testing are still in progress.
* New changes should be tested carefully before v27.0 becomes stable.
* Liquid-glass effects may vary by browser and device.
* Mobile, foldable, tablet, landscape, desktop, and split-screen layouts continue to be validated.
* v27.0 is targeted for late July 2026.

---

## Settings Page

The Settings Page allows visitors to adjust appearance and accessibility options. Restricted management options remain owner-only.

#### Appearance Settings

* Light, dark, and match-device appearance
* Clear and tinted appearance modes
* Accent color support
* Text size control
* Reset to default appearance settings

#### Accessibility Settings

* Focus outline toggle
* Keyboard navigation support
* Accessibility-friendly display preferences
* Adjusted visual effects where supported
* Readability-focused options
* High-contrast and reduced-motion support

#### Reset to Factory Settings

The Reset to Factory Settings option restores visitor settings to default values.

---

## Resume Page

The Resume Page provides access to resume-related information and uses the shared Settings appearance system.

### Resume Content

* Name and professional title
* Profile image
* Contact information
* Location, phone number, and email address
* Website and LinkedIn profile
* Professional summary
* Skills and languages
* Experience and education
* Certifications and projects
* Resume PDF access

### Resume Appearance Integration

* Light, dark, and match-device appearance
* Clear and tinted appearance modes
* Accent color changes
* High-contrast and reduced-motion modes
* Shared Settings Page theme variables

### Resume Responsiveness

The Resume Page adapts across phones, foldables, tablets, laptops, desktops, large displays, short landscape screens, touchscreen devices, printed pages, and browser-generated PDF layouts.

### Resume PDF

Visitors can use the View Resume PDF button to open the configured PDF in a new browser tab.

### Print Behavior

Printing can hide the Onyx dock, footer, and PDF button; remove glass effects and unnecessary shadows; use a white background with black text; avoid splitting important sections; and optimize content for paper and PDF output.

---

## Admin Portal

The Admin Portal is exclusively for authorized accounts and manages supported website content.

### Admin-Managed Content

**Profile:** Profile information, image, bio, Discord sync and preferences, social links, useful links, creator shoutouts, and disabilities.

**Business:** Contact email, weekly hours, holiday or date-based closures, temporary schedules, and manual status overrides.

**Academic:** Classes, exams, finals, university events, internships, co-ops, breaks, semester metadata, and academic timezone.

**Tech:** Device tracking, ownership states, lifecycle and support information, upgrades, planned devices, wishlist devices, and archived devices.

**Metadata:** Website, version, build, and release information.

### Discord Profile Sync Admin Features

* Sync profile with Discord toggle
* Discord User ID validation
* Discord profile, display-name, username, avatar, and presence previews
* Refresh and Apply Discord Profile buttons
* Individual display-name, avatar, and status synchronization
* Last-synchronized metadata
* Manual homepage biography and fallback profile values
* Firestore persistence

The implementation uses public browser-side Lanyard requests compatible with static GitHub Pages hosting. No Discord client secret or bot token is placed in public JavaScript.

### Live Previews and Save State

Supported Admin Portal sections provide live previews for business, academic, and profile updates. Admin changes use Firebase Firestore save and load support.

### Business Admin Features

* Contact email editing
* Regular weekly hours and multiple ranges per day
* Holiday or date-based closures
* Temporary schedule periods
* Manual status override
* Live preview
* Firestore save and load support

**Manual Override Options:** Automatic, Force Open, Force Closed, Force Unavailable.

### Academic Admin Features

* Weekly classes, exams, finals, events, internships, co-ops, and breaks
* Semester metadata, academic profile data, and timezone
* Live preview and upcoming-breaks preview
* Firestore save and load support

### Creator Shoutout Admin Features

* TikTok, Instagram, and YouTube creator management
* Profile image, username, display name, and nickname fields
* Follower or subscriber counts
* Verification status
* Platform-specific display information
* Last updated timestamps

### Useful Links Admin Features

* Link labels and URLs
* Display order
* External link management
* Merch store link management

### Disabilities Admin Features

* Disability names
* Educational or official resource links
* Display order
* Visitor-facing button creation

### Tech Admin Features

Tech fields can include device identity, type, material, color, storage, battery, price, release and purchase dates, operating system, ownership state, upgrade and support information, lifecycle information, roles, predecessor and successor devices, planned replacement, and expected future specifications.

> **Privacy Note:** Only information intended for public display should be entered into public tech records.

---

## Security Features

The website includes features intended to discourage casual copying and misuse of content.

#### Includes

* Copy-and-paste, printing, drag-and-drop, text-selection, right-click, and image-saving deterrents
* Watermark, legal, and copyright notices
* Firebase-backed data
* Restricted Admin Portal access
* Firebase Authentication
* Firestore Security Rules

> **Disclaimer:** Client-side restrictions act only as deterrents. They are not replacements for authentication, Firestore Security Rules, account security, backups, or legal protection.

Because the site is hosted through GitHub Pages, sensitive credentials, Discord client secrets, bot tokens, and private server credentials must never be placed in public HTML or JavaScript.

---

## Accessibility and Responsive Design

The website is designed to work across multiple screen sizes, input methods, appearance settings, and device types.

### Responsive Device Support

* Extra-small, standard, and large phones
* Foldable devices
* Tablets in portrait and landscape
* Laptops and desktop computers
* Large desktop displays
* Short landscape screens
* Touchscreen, mouse, and trackpad devices
* Keyboard users
* Split-screen and resized browser layouts

### Accessibility Support

* Responsive, mobile-friendly layouts
* Dark, light, and match-device appearance
* Clear and tinted appearance modes
* Adjustable text size
* Keyboard focus and navigation
* Reduced-motion and high-contrast support
* Accessible buttons, links, labels, and status messages
* Dynamic content updates
* Touch-friendly interaction targets
* Visitor-local timezone support
* Print-friendly Resume layouts

Visual effects and layouts may continue to be refined during release candidate development and testing.

---

## Coding Languages and Technologies

This project is built with standard web technologies, Firebase services, and static GitHub Pages hosting.

### Core Technologies

* HTML, CSS, and JavaScript
* GitHub Pages
* Firebase Firestore, Authentication, and Cloud Messaging
* Lanyard API
* Luxon
* Font Awesome and inline SVG icons
* LocalStorage and SessionStorage
* Progressive Web App technologies and service workers
* SunCalc
* html2pdf.js

### Language Breakdown

<!-- AUTO:LANGUAGES-START -->
| Language | Percentage | Purpose |
| :--- | :--- | :--- |
| **JavaScript** | 45.4% | Powers dynamic behavior, profile loading, sorting, time logic, Firestore updates, navigation interactions, Discord synchronization, Live Activity, and interactive interface features. |
| **CSS** | 36.5% | Controls visual design, responsive layouts, liquid-glass styling, animations, themes, device breakpoints, and hover effects. |
| **HTML** | 18.1% | Provides website structure, page sections, navigation, inline SVG icons, and content frameworks. |
<!-- AUTO:LANGUAGES-END -->

> **Note:** Language percentages are based on the current GitHub repository language analysis and may change as files are added, removed, or updated.

### JavaScript

JavaScript handles profile loading, Discord synchronization, Live Activity, Spotify and PreMiD rendering, artwork color extraction, links, creator search and sorting, business and academic logic, countdowns, tech information, device detection, visitor settings, weather and time data, Firestore updates, realtime notifications, Onyx dock interactions, initialization, Resume content, and Resume PDF access.

Unused logic associated with retired sections was removed during the v26.6-beta.3 cleanup.

### CSS

CSS handles layout, responsive design, appearance modes, liquid-glass and Onyx styling, Profile and Live Activity styling, dynamic accents, components, animations, focus styles, device breakpoints, accessibility presentation, business status, creator cards, tech layouts, Resume responsiveness, print/PDF presentation, and dock interaction states.

Duplicate and obsolete Profile and Live Activity styles were consolidated during v27.0 release-candidate development.

### HTML

HTML includes the Profile, Live Activity, social links, creator shoutouts, countdown, business status, academic schedule, tech information, useful links, disabilities, version information, legal notices, Release Candidate page, Resume page, Settings page, Admin Portal, Onyx dock, and inline SVG navigation icons.

---

## Version History

| Version | Highlights |
| :--- | :--- |
| **v27.0-rc.1** | Current release candidate. Promoted the completed v26.6 beta work into the v27.0 release track. Added updated Profile spacing and styling, Live Activity refinements, dynamic song accents, Discord display-name/avatar/status synchronization, creator-card updates, device-information updates, CSS cleanup, release-candidate documentation, and final compatibility testing. |
| **v26.6-beta.4** | Added the responsive Onyx liquid-glass navigation dock, inline SVG icons, active lens movement, press-and-drag navigation, release snapping, balanced spacing, and a Settings-only gear animation. Improved responsive, touch, reduced-motion, and high-contrast support. Updated the Resume Page to use the shared Settings appearance system. |
| **v26.6-beta.3** | Removed retired FAQ, Posts, Blog, President, Legislation, Quote of the Day, Latest TikTok embed, Onyx AI assistant, and Project Goal Tracker features with their obsolete code and references. |
| **v26.6-beta.2** | Updated Business Status and Hours, improved academic availability, added smart recurring-class status labels, and corrected ended-class behavior. |
| **v26.6-beta.1** | Original partial beta revamp preview with continued liquid-glass and Onyx UI refinements, beta notes, and release roadmap. |
| **v26.5** | Current stable version. Updated device information and creator shoutout sections and continued liquid-glass refinement. |
| **v26.1.2** | Introduced appearance settings, match-device theme, and manual light and dark modes. |
| **v1.17.0** | Bug fixes. |
| **v1.16.0** | Introduced the Admin Portal and owner-only content management tools. |
| **v1.15.0** | Bug fixes and general improvements. |
| **v1.14.0** | Theme consistency improvements and performance optimization. |
| **v1.13.0** | Added a focus outline toggle and accessibility enhancements. |
| **v1.12.0** | Added merch store access under Useful Links. |
| **v1.11.0** | Added the Settings Page, appearance modes, font adjustments, and factory reset. |
| **v1.10.1** | Added current-day highlighting and enhanced the website theme. |
| **v1.10.0** | Added an event calendar and bug fixes. |
| **v1.9.0** | Added TikTok creator shoutouts, tech information, disabilities, version information, and legal notices. |
| **v1.8.0** | Added RedNote support styled like YouTube and Instagram, plus general enhancements. |
| **v1.7.0** | Added security enhancements and media/text copying deterrents. |
| **v1.6.0** | Added Instagram and YouTube creator shoutouts, timestamps, and bug fixes. |
| **v1.5.0** | Bug fixes and improvements. |

---

## Release Roadmap

* **v26.5** — Current stable website.
* **v26.6-beta.1** — Original partial beta revamp preview.
* **v26.6-beta.2** — Business and academic availability improvements.
* **v26.6-beta.3** — Cleanup release removing retired sections and obsolete code.
* **v26.6-beta.4** — Responsive Onyx navigation dock, inline SVG icons, press-and-drag interactions, tablet optimization, and Resume appearance improvements.
* **v27.0-rc.1** — Current release candidate with Profile and Live Activity refinements, Discord synchronization, and release-readiness work.
* **v27.0** — Next stable release, targeted for late July 2026.
* **v27.x** — Post-release fixes and focused refinements.

The roadmap may change during release-candidate testing if another candidate is needed before v27.0 becomes stable.

---

## Removed and Retired Features

The following features were removed in v26.6-beta.3 because they were no longer needed or were not part of the planned website direction:

* FAQ section
* Posts system
* Blog list and individual blog post logic
* President information section
* Legislation tracker
* Quote of the Day and custom quote tools
* Latest TikTok embed
* Onyx AI assistant
* Project Goal Tracker

### Cleanup Included

* Unused Firestore collection and document references
* Retired realtime notification listeners and initialization calls
* Unused JavaScript helper functions and feature-specific CSS
* Obsolete AI chat script references
* Retired page-routing logic
* Unused frontend code

The main TikTok, Instagram, and YouTube creator shoutout sections remain active. Device AI compatibility information also remains active because it evaluates device capabilities and is not an interactive AI assistant.

---

## Conclusion

The Link in Bio Website is a centralized and dynamic hub for profile information, social links, creator shoutouts, useful links, business availability, academic scheduling, public technology information, accessibility settings, resume information, and website updates.

Visitors can view public profile information, access social and useful links, check live activity and availability, view creator shoutouts, check business hours and academic impacts, review public tech information, access disability resources, inspect website and visitor-device information, view the Resume or PDF, adjust appearance and accessibility settings, and navigate using the responsive Onyx liquid-glass dock.

Only authorized accounts can modify managed content through the Admin Portal.

Version v27.0-rc.1 builds on the v26.6 beta series by combining the Onyx navigation dock, updated Profile and Live Activity systems, Discord profile synchronization, creator-card redesigns, device-information improvements, Resume appearance integration, responsive refinements, accessibility improvements, and release-candidate documentation.

The current stable public version remains v26.5. The next planned stable release is v27.0, targeted for late July 2026.

Thanks for visiting!
