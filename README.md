# Link in Bio Website

![Version](https://img.shields.io/badge/version-v27.0--rc.1-blue)
![Build](https://img.shields.io/badge/build-2026.07.17-purple)
![Release Track](https://img.shields.io/badge/release%20track-Release%20Candidate-orange)
![Current Stable](https://img.shields.io/badge/current%20stable-v26.5-green)
![Next Stable](https://img.shields.io/badge/next%20stable-v27.0-yellow)
![JavaScript](https://img.shields.io/badge/JavaScript-45.3%25-f1e05a)
![CSS](https://img.shields.io/badge/CSS-37.6%25-663399)
![HTML](https://img.shields.io/badge/HTML-17.1%25-e34c26)

Welcome to the repository for my Link in Bio Website.

This website is a centralized hub for my profile, social links, creator shoutouts, useful links, business availability, academic availability, public tech information, accessibility settings, resume, and website updates.

The website is built to be responsive, accessible, secure, and easy to use across phones, foldables, tablets, laptops, desktop computers, and other supported devices.

---

## Current Version

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

---

## Table of Contents

* [Overview](#overview)
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

The navigation area includes links such as:

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

The website includes creator shoutout sections for:

* TikTok
* Instagram
* YouTube

These sections list creators that I follow, collaborate with, or want to highlight.

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
* Visit Profile buttons
* Visit Channel buttons
* Search support
* Sorting support
* Last updated timestamps
* Responsive phone, tablet, and desktop layouts

#### Sorting Options

Creator lists can be sorted by:

* High to low
* Low to high
* A to Z
* Z to A

Visitors can view and visit creator profiles, but only authorized accounts can modify creator lists through the Admin Portal.

> **Note:** The separate Latest TikTok embed feature has been retired. The main TikTok creator shoutout section remains active.

### 5. Useful Links

The Useful Links section displays important links that I want to share with visitors.

#### Examples

Useful links may include:

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

The countdown is based on the visitor’s device or browser timezone.

### 7. Business Information

The Business Information section displays business availability and contact information. Business hours can be shown in the visitor’s local timezone while still being based on the configured business timezone.

#### Includes

* Business status
* Contact email
* Visitor timezone
* Business timezone
* Current business time
* Today’s hours
* Next open time
* Weekly business hours
* Holiday hours
* Temporary hours
* Academic schedule impact
* Status chip
* Traffic light indicator
* Premium status hint
* Today timeline
* Copy Today button
* 12-hour and 24-hour time format toggle
* Hide / Show Full Hours toggle

#### Business Statuses

The Business Information section can display statuses such as:

* Open
* Closed
* Holiday Hours
* Temporary Closure
* Academic Schedule Active
* Manual Override

#### Status Behavior

The business status can automatically update based on:

* Regular weekly hours
* Holiday hours
* Temporary hours
* Academic availability
* Manual override settings

### 8. Holiday Hours

The business system supports Holiday Hours, which can override regular weekly business hours for a specific date.

#### Display States

Holiday hours can show:

* Open with special hours
* Closed all day
* Scheduled holiday
* Active holiday schedule
* Concluded holiday schedule

Holiday hours only appear when holiday entries are configured.

### 9. Temporary Hours

The business system supports Temporary Hours for special periods.

Temporary hours can be used for:

* Events
* Renovations
* Short-term closures
* Special schedule changes
* Temporary unavailable periods

#### Display States

Temporary hours can show:

* Scheduled
* Starts soon
* In effect
* Ending soon
* Concluded

Temporary hours can override normal business hours and affect public availability.

### 10. Academic Availability

The website includes Academic Availability support because school commitments can affect business availability. Academic availability is built directly into the Business Information section.

#### Academic Items

Academic availability can include:

* Recurring classes
* Exams
* Final exams
* University events
* Academic breaks
* Internships
* Co-ops
* Semester information
* Academic profile information

When an academic item is active, the business status can show that availability is affected.

#### Smart Recurring Class Status

Recurring classes use time-aware labels to prevent classes from incorrectly remaining active after their scheduled time has ended.

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

The Academic Schedule dropdown can show:

* Recurring classes
* Exams
* Finals
* Academic breaks
* University events
* Internships
* Co-ops

The dropdown hides or shows together with the Hide / Show Full Hours control when academic data is available.

### 11. Tech Information

The Tech Information section displays technology items that I own, use, track, or plan to upgrade.

#### Basic Information

Tech items can include:

* Device name
* Model
* Material
* Storage
* Color
* Price
* Battery capacity
* Battery health
* Battery charge cycles
* Date released
* Date bought
* Operating system version

#### Operating System Status

Operating system statuses can include:

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

Lifecycle and support features can include:

* Device support status
* Estimated major support lifespan
* Estimated security support lifespan
* Upgrade recommendation
* Recommended upgrade year
* Upgrade window
* Upgrade priority
* Future-proof score
* Recommended action

#### Battery and Performance

Battery features can include:

* Battery health evaluation
* Battery charge cycle evaluation
* Battery trend
* Device age
* Device score
* Upgrade triggers

#### Future Planning

Future-planning features can include:

* Current AI feature compatibility
* Future hardware target
* Backup priority
* Cost efficiency
* Recommended future specifications
* Upgrade target
* Features or specifications to avoid

> **Note:** AI feature compatibility in the Tech Information section is a device-evaluation feature. It is separate from the retired Onyx AI assistant.

#### Device Lineage

Device lineage features can include:

* Device lineage
* Role transition details
* Previous device role
* Current device role
* Predecessor device
* Successor device
* Upgrade path
* Automatically managed role information

#### Ownership States

**Active Ownership States**

* Owned
* Borrowed
* Loaned out
* School-issued
* Work-issued
* In repair

**Planned and Roadmap States**

* Planned
* Coming soon
* Future upgrade
* Preordered
* Ordered
* Reserved

**Wishlist States**

* Wishlist
* Considering
* Researching

**Archived States**

* Retired
* Sold
* Traded in
* Donated
* Recycled
* Returned
* Lost

> **Privacy Note:** The Tech Information section is public-facing. Private or sensitive device information must not be exposed.

### 12. Useful Device and Website Information

The website displays useful visitor-side information related to the current device and environment.

#### Includes

* Browser information
* Operating system information
* Device type
* Screen resolution
* Connection information
* Network information when available
* Weather information
* Sunrise information
* Sunset information

Availability can depend on browser support, permissions, network access, and configured services.

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

The website portion can include:

* Version number
* Build number
* Release track
* Revamp status
* Target release
* Current stable version
* Next stable version
* Synced timestamp

#### Current Release Metadata

```js
const WEBSITE_VERSION = "v27.0-rc.1";
const WEBSITE_BUILD = "2026.07.17";
const RELEASE_TRACK = "Release Candidate";
const REVAMP_STATUS = "Release candidate development and testing in progress";
const TARGET_RELEASE = "Late July 2026";
```

#### Visitor Information

The visitor portion can include:

* Operating system
* Device
* Browser
* Screen resolution
* Connection information
* Weather information
* Sunrise information
* Sunset information

### 15. Notice Information

The website displays legal and content-protection information.

#### Includes

* Watermark notice
* Legal notice
* Copyright notice
* Protected content message

### 16. Maintenance Mode

The website can show a maintenance message when maintenance is active.

#### Includes

* Maintenance notice
* Status page link
* Loading overlay
* Visitor-friendly maintenance message

---

## Navigation Dock

Version v26.6-beta.4 introduced the responsive Onyx liquid-glass navigation dock. The completed dock is included in v27.0-rc.1.

The dock provides access to:

* Home
* Release Candidate
* Resume
* Settings

### Dock Features

* Inline SVG navigation icons
* Active liquid-glass lens
* Automatic route detection
* Nested route support
* Equal-width navigation items
* Balanced left and right spacing
* Fractional-pixel lens positioning
* Press feedback
* Press-and-drag navigation
* Nearest-item drag targeting
* Release and snap animation
* Settings-only gear rotation
* Pointer reflection on supported mouse devices
* Keyboard navigation
* Safe-area support
* Phone responsiveness
* Tablet portrait support
* Tablet landscape support
* Laptop and desktop support
* Reduced-motion support
* High-contrast support

### Dock Interaction

Visitors can select a destination by clicking or tapping an item.

On supported pointer and touch devices, visitors can also:

1. Press and hold a navigation item.
2. Drag the liquid lens across the dock.
3. Move over another navigation destination.
4. Release to snap to and open the selected destination.

The Settings gear rotates only when Settings is selected.

### Keyboard Navigation

Supported keys can include:

* Left Arrow
* Right Arrow
* Up Arrow
* Down Arrow
* Home
* End
* Enter
* Space

Modified browser interactions, such as opening a destination in a new tab, remain supported where available.

---

## Release Candidate Page

The former Beta Page now presents the current v27.0 release candidate while continuing to use the `/beta` route for compatibility.

#### Includes

* Current stable version
* Current release candidate version
* Current build
* Next stable release
* Release candidate notes
* Completed features
* Final testing areas
* Changelog
* Removed features
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

The Settings Page allows visitors to adjust appearance and accessibility options. Some settings are available to visitors, while restricted management options remain owner-only.

#### Appearance Settings

* Light mode
* Dark mode
* Match device appearance
* Clear appearance mode
* Tinted appearance mode
* Accent color support
* Text size control
* Reset to default appearance settings

#### Accessibility Settings

* Focus outline toggle
* Keyboard navigation support
* Accessibility-friendly display preferences
* Reduced or adjusted visual effects when supported
* Readability-focused options
* High-contrast presentation support
* Reduced-motion support

#### Reset to Factory Settings

The Reset to Factory Settings option restores visitor settings to their default values.

---

## Resume Page

The Resume Page provides access to resume-related information and uses the shared Settings appearance system.

### Resume Content

The Resume Page can include:

* Name
* Professional title
* Profile image
* Contact information
* Location
* Phone number
* Email address
* Website
* LinkedIn profile
* Professional summary
* Skills
* Languages
* Experience
* Education
* Certifications
* Projects
* Resume PDF access

### Resume Appearance Integration

* Light mode
* Dark mode
* Match-device appearance
* Clear appearance mode
* Tinted appearance mode
* Accent color changes
* High-contrast mode
* Reduced-motion mode
* Shared Settings Page theme variables

### Resume Responsiveness

The Resume Page is designed to adapt across:

* Extra-small phones
* Standard phones
* Large phones
* Foldable devices
* Tablets in portrait orientation
* Tablets in landscape orientation
* Laptops
* Desktop computers
* Large desktop displays
* Short landscape screens
* Touchscreen devices
* Printed pages
* Browser-generated PDF layouts

### Resume PDF

Visitors can use the View Resume PDF button to open the configured PDF version in a new browser tab.

### Print Behavior

When printed, the Resume Page can:

* Hide the Onyx navigation dock
* Hide the website footer
* Hide the PDF button
* Remove glass effects
* Remove unnecessary shadows
* Use a white background
* Use black text
* Avoid splitting important sections when possible
* Optimize content for paper and PDF output

---

## Admin Portal

The Admin Portal is exclusively for authorized accounts and is used to manage supported website content.

### Admin-Managed Content

**Profile**

* Profile information
* Profile image
* Bio
* Discord profile synchronization
* Discord synchronization preferences
* Social links
* Useful links
* Creator shoutouts
* Disabilities

**Business**

* Contact email
* Weekly business hours
* Holiday or date-based closures
* Temporary closures
* Temporary schedules
* Manual status overrides

**Academic**

* Class schedules
* Exams
* Finals
* University events
* Internships
* Co-ops
* Academic breaks
* Semester metadata
* Academic timezone

**Tech**

* Device tracking
* Ownership states
* Lifecycle information
* Support information
* Upgrade information
* Planned devices
* Wishlist devices
* Archived devices

**Metadata**

* Website information
* Version information
* Build information
* Release information

### Discord Profile Sync Admin Features

The Profile management area supports:

* Sync profile with Discord toggle
* Discord User ID validation
* Discord profile preview
* Discord display-name preview
* Discord username preview
* Discord avatar preview
* Discord presence preview
* Refresh Discord Profile button
* Apply Discord Profile button
* Individual display-name synchronization
* Individual avatar synchronization
* Individual status synchronization
* Last-synchronized metadata
* Manual homepage biography
* Manual fallback profile values
* Firestore persistence

The implementation uses public browser-side Lanyard requests, which are compatible with static GitHub Pages hosting. No Discord client secret or bot token is placed in public JavaScript.

### Live Previews and Save State

Supported Admin Portal sections can provide live previews for business, academic, and profile updates. Admin changes use Firebase Firestore save and load support.

### Business Admin Features

* Contact email editing
* Regular weekly hours
* Multiple hour ranges per day
* Holiday or date-based closures
* Temporary schedule periods
* Manual status override
* Live preview
* Firestore save and load support

**Manual Status Override Options:**

* Automatic
* Force Open
* Force Closed
* Force Unavailable

### Academic Admin Features

* Weekly class schedules
* Exams
* Finals
* University events
* Internships
* Co-ops
* Academic breaks
* Semester metadata
* Academic profile data
* Academic timezone
* Live preview
* Upcoming breaks preview
* Firestore save and load support

### Creator Shoutout Admin Features

* TikTok, Instagram, and YouTube creator management
* Profile image fields
* Username fields
* Display name or nickname fields
* Follower or subscriber count fields
* Verification status
* Platform-specific display information
* Last updated timestamps

### Useful Links Admin Features

* Link labels
* Link URLs
* Display order
* External link management
* Merch store link management

### Disabilities Admin Features

* Disability names
* Educational or official resource links
* Display order
* Visitor-facing button creation

### Tech Admin Features

**Tech Item Fields Can Include:**

* Device name and model
* Device type
* Material and color
* Storage and battery capacity
* Price
* Date released and date bought
* Operating system version
* Battery health and battery charge cycles
* Ownership state
* Upgrade information
* Support information
* Lifecycle information
* Current role and previous role
* Predecessor device and successor device
* Planned replacement
* Expected future specifications

> **Privacy Note:** Only information intended for public display should be entered into public tech records.

---

## Security Features

The website includes features intended to discourage casual copying and misuse of content.

#### Includes

* Copy and paste deterrents
* Printing deterrents
* Drag-and-drop restrictions
* Text-selection restrictions
* Right-click restrictions
* Image-saving deterrents
* Watermark notice
* Legal notice
* Copyright notices
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

* Extra-small phones
* Standard phones
* Large phones
* Foldable devices
* Tablets in portrait orientation
* Tablets in landscape orientation
* Laptops
* Desktop computers
* Large desktop displays
* Short landscape screens
* Touchscreen devices
* Mouse and trackpad devices
* Keyboard users
* Split-screen and resized browser layouts

### Accessibility Support

* Responsive layouts
* Mobile-friendly sections
* Tablet and desktop support
* Dark and light appearance support
* Match-device appearance
* Clear and tinted appearance modes
* Adjustable text size
* Keyboard focus options
* Keyboard navigation
* Reduced-motion support
* High-contrast support
* Accessible buttons and links
* Clear labels
* Status messages
* Dynamic content updates
* Touch-friendly interaction targets
* Visitor-local timezone support
* Print-friendly Resume layouts

Visual effects and layouts may continue to be refined during release candidate development and testing.

---

## Coding Languages and Technologies

This project is built with standard web technologies, Firebase services, and static GitHub Pages hosting.

### Core Technologies

* HTML
* CSS
* JavaScript
* GitHub Pages
* Firebase Firestore
* Firebase Authentication
* Firebase Cloud Messaging
* Lanyard API
* Luxon for timezone logic
* Font Awesome icons
* Inline SVG icons
* LocalStorage
* SessionStorage
* Progressive Web App technologies
* Service workers
* SunCalc
* html2pdf.js

### Language Breakdown

| Language | Percentage | Purpose |
| :--- | :--- | :--- |
| **JavaScript** | 45.3% | Powers dynamic behavior, profile loading, sorting, time logic, Firestore updates, navigation interactions, Discord synchronization, Live Activity, and interactive interface features. |
| **CSS** | 37.6% | Controls visual design, responsive layouts, liquid-glass styling, animations, themes, device breakpoints, and hover effects. |
| **HTML** | 17.1% | Provides website structure, page sections, navigation, inline SVG icons, and content frameworks. |

> **Note:** Language percentages are based on the current GitHub repository language analysis and may change as files are added, removed, or updated.

### JavaScript

JavaScript handles:

* Profile loading
* Discord profile synchronization
* Live activity and status
* Spotify and PreMiD activity rendering
* Dynamic artwork color extraction
* Social links
* Useful links
* Creator shoutouts
* Creator search and sorting
* Business status
* Holiday hours
* Temporary hours
* Academic availability
* Countdown
* Tech information
* Device and version detection
* Visitor settings
* Weather and time data
* Firestore updates
* Realtime notifications
* Page initialization
* Onyx dock route detection
* Onyx dock press-and-drag interaction
* Onyx dock lens positioning
* Onyx dock keyboard navigation
* Settings gear animation
* Resume content loading
* Resume PDF access

Unused logic associated with retired sections was removed during the v26.6-beta.3 cleanup.

### CSS

CSS handles:

* Page layout
* Responsive design
* Light and dark themes
* Clear and tinted appearance modes
* Liquid-glass and Onyx styling
* Profile and Live Activity styling
* Dynamic accent presentation
* Buttons
* Cards
* Animations
* Hover effects
* Focus styles
* Phone, foldable, tablet, laptop, and desktop layouts
* Accessibility presentation
* Business status presentation
* Creator profile card designs
* Tech information layouts
* Resume responsiveness
* Print and PDF presentation
* Onyx dock responsiveness
* Onyx dock press-and-drag states

Duplicate and obsolete Profile and Live Activity styles were consolidated during v27.0 release-candidate development.

### HTML

HTML includes sections for:

* Profile
* Live activity
* Social links
* Creator shoutouts
* Countdown
* Business status
* Academic schedule
* Tech information
* Useful links
* Disabilities
* Version information
* Legal notices
* Release Candidate page
* Resume page
* Settings page
* Admin Portal
* Onyx navigation dock
* Inline SVG navigation icons

---

## Version History

| Version | Highlights |
| :--- | :--- |
| **v27.0-rc.1** | Current release candidate. Promoted the completed v26.6 beta work into the v27.0 release track. Added updated Profile spacing and styling, Live Activity refinements, dynamic song accents, Discord display-name/avatar/status synchronization, creator-card updates, device-information updates, CSS cleanup, release-candidate documentation, and final compatibility testing. |
| **v26.6-beta.4** | Added the responsive Onyx liquid-glass navigation dock with inline SVG icons, active lens movement, press-and-drag navigation, release snapping, balanced dock spacing, and a Settings-only gear animation. Improved phone, foldable, tablet, laptop, desktop, landscape, touch, reduced-motion, and high-contrast support. Updated the Resume Page to use the shared Settings appearance system and improved light, dark, clear, tinted, print, and PDF layouts. |
| **v26.6-beta.3** | Cleanup release. Removed retired FAQ, Posts, Blog, President, Legislation, Quote of the Day, Latest TikTok embed, Onyx AI assistant, and Project Goal Tracker features. Removed associated JavaScript, CSS, Firestore references, listeners, initialization calls, and obsolete script references. |
| **v26.6-beta.2** | Updated Business Status and Hours. Improved academic availability. Added smart recurring class status labels. Fixed recurring classes so ended classes no longer stay stuck on “In Effect.” Improved Hide / Show Full Hours behavior. |
| **v26.6-beta.1** | Original partial beta revamp preview. Continued liquid-glass and Onyx UI refinements. Added beta notes and the release roadmap. |
| **v26.5** | Current stable version. Updated device information and creator shoutout sections. Continued liquid-glass refinement. |
| **v26.1.2** | Introduced appearance settings, match-device theme, and manual light and dark modes. |
| **v1.17.0** | Bug fixes. |
| **v1.16.0** | Introduced the Admin Portal and owner-only content management tools. |
| **v1.15.0** | Bug fixes and general improvements. |
| **v1.14.0** | Theme consistency improvements and performance optimization. |
| **v1.13.0** | Added a focus outline toggle and accessibility enhancements. |
| **v1.12.0** | Added merch store access under Useful Links. |
| **v1.11.0** | Added the Settings Page, dark and light modes, font adjustments, and factory reset. |
| **v1.10.1** | Added current-day highlighting and enhanced the website theme. |
| **v1.10.0** | Added an event calendar and bug fixes. |
| **v1.9.0** | Added TikTok creator shoutouts, tech information, disabilities, version information, and legal notices. |
| **v1.8.0** | Added RedNote support styled like YouTube and Instagram, plus general enhancements. |
| **v1.7.0** | Added security enhancements, media-saving deterrents, and text-copying deterrents. |
| **v1.6.0** | Added Instagram and YouTube creator shoutouts, last updated timestamps, and bug fixes. |
| **v1.5.0** | Bug fixes and improvements. |

---

## Release Roadmap

* **v26.5** — Current stable website.
* **v26.6-beta.1** — Original partial beta revamp preview.
* **v26.6-beta.2** — Business and academic availability improvements.
* **v26.6-beta.3** — Cleanup release removing retired sections and obsolete code.
* **v26.6-beta.4** — Responsive Onyx navigation dock, inline SVG icons, press-and-drag interactions, tablet optimization, and Resume appearance improvements.
* **v27.0-rc.1** — Current release candidate with continued development, testing, Profile and Live Activity refinements, Discord synchronization, and release readiness work.
* **v27.0** — Next stable release, targeted for late July 2026.
* **v27.x** — Post-release fixes and focused refinements.

The roadmap may change during release-candidate testing if another candidate is needed before v27.0 becomes stable.

---

## Removed and Retired Features

The following features were removed in v26.6-beta.3 because they were no longer needed or were not part of the planned website direction:

* FAQ section
* Posts system
* Blog list page logic
* Individual blog post page logic
* President information section
* Legislation tracker
* Quote of the Day
* Custom quote categories
* Custom quote manager
* Latest TikTok embed
* Onyx AI assistant
* Project Goal Tracker

### Cleanup Included

* Unused Firestore collection references
* Unused Firestore document references
* Retired realtime notification listeners
* Retired page initialization calls
* Unused JavaScript helper functions
* Feature-specific CSS
* Obsolete AI chat script references
* Retired page-routing logic
* Unused frontend code

The main TikTok, Instagram, and YouTube creator shoutout sections remain active. Device AI compatibility information in the Tech Information section also remains active because it evaluates device capabilities and is not an interactive AI assistant.

---

## Conclusion

The Link in Bio Website is a centralized and dynamic hub for profile information, social links, creator shoutouts, useful links, business availability, academic scheduling, public technology information, accessibility settings, resume information, and website updates.

Visitors can:

* View public profile information
* Access social and useful links
* Check live activity and availability
* View creator shoutouts
* Check business hours
* View academic schedule impacts
* Review public tech information
* Access disability resources
* Review website and visitor-device information
* View resume information
* Open the Resume PDF
* Adjust appearance and accessibility settings
* Navigate using the responsive Onyx liquid-glass dock

Only authorized accounts can modify managed content through the Admin Portal.

Version v27.0-rc.1 builds on the v26.6 beta series by combining the Onyx navigation dock, updated Profile and Live Activity systems, Discord profile synchronization, creator-card redesigns, device-information improvements, Resume appearance integration, responsive refinements, accessibility improvements, and release-candidate documentation.

The update improves usability across phones, foldables, tablets, laptops, desktop computers, touchscreen devices, keyboard navigation, high-contrast mode, reduced-motion mode, custom backgrounds, and printed or PDF Resume layouts.

The current stable public version remains v26.5. The next planned stable release is v27.0, targeted for late July 2026.

Thanks for visiting!
