# Link in Bio Website

https://img.shields.io/badge/version-v26.6--beta.3-blue
https://img.shields.io/badge/build-2026.07.11-purple
https://img.shields.io/badge/release%20track-Beta%20Revamp%20Preview-orange
https://img.shields.io/badge/stable%20base-v26.5-green
https://img.shields.io/badge/planned%20revamp-v27.0-yellow
https://img.shields.io/badge/JavaScript-48.7%25-f1e05a
https://img.shields.io/badge/CSS-37.9%25-663399
https://img.shields.io/badge/HTML-13.4%25-e34c26

Welcome to the repository for my Link in Bio Website.

This website is a centralized hub for my profile, social links, creator shoutouts, useful links, business availability, academic availability, tech information, accessibility settings, and website updates.

The website is built to be responsive, accessible, secure, and easy to use across phones, tablets, computers, and other supported devices.

---

## Current Version

| Attribute | Details |
| :--- | :--- |
| Version | v26.6-beta.3 |
| Build | 2026.07.11 |
| Release Track | Beta Revamp Preview |
| Current Stable Base | v26.5 |
| Revamp Status | Partial beta revamp in progress |
| Target Release | September 2026 |
| Planned Full Revamp | v27.0 |

---

## Table of Contents

* #overview
* #features
  * #home-page
  * #1-profile-section
  * #2-live-activity-and-status
  * #3-connect-with-me
  * #4-creator-shoutouts
  * #5-useful-links
  * #6-countdown
  * #7-business-information
  * #8-holiday-hours
  * #9-temporary-hours
  * #10-academic-availability
  * #11-tech-information
  * #12-useful-device-and-website-information
  * #13-disabilities
  * #14-version-information
  * #15-notice-information
  * #16-maintenance-mode
* #beta-page
* #settings-page
* #resume-page
* #admin-portal
* #security-features
* #accessibility-and-responsive-design
* #coding-languages-and-technologies
* #version-history
* #release-roadmap
* #removed-and-retired-features
* #conclusion

---

# Overview

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
* Check website version and device information
* Access legal and notice information
* Adjust appearance and accessibility settings

> Note: Most public content is managed through the Admin Portal, which is only accessible to authorized accounts.

---

# Features

## Home Page

The Home Page contains the main public-facing sections of the website.

The current beta focuses on a cleaner experience by maintaining actively used sections and removing retired or unnecessary features.

---

## 1. Profile Section

The Profile Section displays my main profile information.

### Includes

* Username or display name
* Bio
* Profile image
* Verified badge
* Status indicator
* Navigation buttons to other parts of the website

### Navigation Links

The navigation area can include links such as:

* Home
* Beta
* Resume
* Settings

The Profile Section gives visitors a quick overview of who I am and provides access to other important pages.

---

## 2. Live Activity and Status

The website can display a live activity or status area.

### Includes

* Current status or activity text
* Active or offline indicator
* Optional live media or music-style display
* Updated timestamp
* Dynamic Firestore-powered updates

The live status system helps visitors see current activity or availability without needing to manually refresh the page.

---

## 3. Connect with Me

The Connect with Me section contains links to social media platforms and other public ways to connect with me.

### Features

* Social media buttons
* Platform icons
* Links that open in a new tab
* Admin-managed links
* Visitor-only access to public content
* Visitors can click links
* Visitors cannot edit or modify links

This section allows visitors to quickly access my public social profiles and connected accounts.

---

## 4. Creator Shoutouts

The website includes creator shoutout sections for:

* TikTok
* Instagram
* YouTube

These sections list creators that I follow, collaborate with, or want to highlight.

### Features

* Creator profile cards
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

### Sorting Options

Creator lists can be sorted by:

* High to low
* Low to high
* A to Z
* Z to A

Visitors can view and visit creator profiles, but only authorized accounts can modify creator lists through the Admin Portal.

> Note: The separate Latest TikTok embed feature has been retired. The main TikTok creator shoutout section remains active.

---

## 5. Useful Links

The Useful Links section displays important links that I want to share with visitors.

### Examples

Useful links may include:

* Personal websites
* Helpful resources
* External pages
* Important references
* Tools
* Merch store links

### Features

* Links open in a new tab
* Links are displayed as buttons
* Links are managed through the Admin Portal
* Visitors can click links
* Visitors cannot edit links

> Note: The merch store is listed under Useful Links instead of being treated as a separate built-in website page.

---

## 6. Countdown

The Countdown section displays a live countdown timer to a selected event.

### Countdown Units

* Years
* Months
* Days
* Hours
* Minutes
* Seconds

The countdown is based on the visitor’s device or browser timezone.

This helps visitors see the time remaining until a configured event using their local time context.

---

## 7. Business Information

The Business Information section displays business availability and contact information.

Business hours can be shown in the visitor’s local timezone while still being based on the configured business timezone.

### Includes

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
* Hide or Show Full Hours toggle

### Business Statuses

The Business Information section can display statuses such as:

* Open
* Closed
* Holiday Hours
* Temporary Closure
* Academic Schedule Active
* Manual Override

### Status Behavior

The business status can automatically update based on:

* Regular weekly hours
* Holiday hours
* Temporary hours
* Academic availability
* Manual override settings

The Business Information section is designed to show whether availability is currently open, closed, temporarily unavailable, affected by a holiday, or affected by an academic schedule.

---

## 8. Holiday Hours

The business system supports Holiday Hours, which can override regular weekly business hours for a specific date.

### Display States

Holiday hours can show:

* Open with special hours
* Closed all day
* Scheduled holiday
* Active holiday schedule
* Concluded holiday schedule

Holiday hours only appear when holiday entries are configured.

Holiday hours can affect the displayed business status and the next available opening time.

---

## 9. Temporary Hours

The business system supports Temporary Hours for special periods.

Temporary hours can be used for:

* Events
* Renovations
* Short-term closures
* Special schedule changes
* Temporary unavailable periods

### Display States

Temporary hours can show:

* Scheduled
* Starts soon
* In effect
* Ending soon
* Concluded

Temporary hours can override normal business hours and affect the public availability status.

---

## 10. Academic Availability

The website includes Academic Availability support because school commitments can affect business availability.

Academic availability is built into the Business Information section.

### Academic Items

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

### Examples

Academic availability can display or affect status for:

* Class in progress
* Exam in progress
* Final exam in progress
* Academic break
* University event
* Internship or co-op schedule

---

### Smart Recurring Class Status

Recurring classes use smart time-aware labels to prevent classes from incorrectly remaining marked as active after the scheduled class time has ended.

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

This makes recurring class information more accurate and easier for visitors to understand.

---

### Academic Schedule Dropdown

The Academic Schedule dropdown is part of the Business Information display.

The dropdown can show academic schedule items such as:

* Recurring classes
* Exams
* Finals
* Academic breaks
* University events
* Internships
* Co-ops

The Academic Schedule dropdown hides or shows together with the Hide or Show Full Hours toggle when academic data is available.

---

## 11. Tech Information

The Tech Information section displays technology items that I own, use, track, or plan to upgrade.

### Basic Information

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

---

### Smart Tech Features

The Tech Information section includes advanced device and lifecycle tracking.

### Operating System Status

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

### Lifecycle and Support

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

### Battery and Performance

Battery features can include:

* Battery health evaluation
* Battery charge cycle evaluation
* Battery trend
* Device age
* Device score
* Upgrade triggers

### Future Planning

Future-planning features can include:

* Current AI feature compatibility
* Future hardware target
* Backup priority
* Cost efficiency
* Recommended future specifications
* Upgrade target
* Features or specifications to avoid

> Note: AI feature compatibility in the Tech Information section is a device-evaluation feature. It is separate from the retired Onyx AI assistant.

### Device Lineage

Device lineage features can include:

* Device lineage
* Role transition details
* Previous device role
* Current device role
* Predecessor device
* Successor device
* Upgrade path
* Automatically managed role information

---

### Ownership States

Tech items support different ownership states.

### Active Ownership States

* Owned
* Borrowed
* Loaned out
* School-issued
* Work-issued
* In repair

### Planned and Roadmap States

* Planned
* Coming soon
* Future upgrade
* Preordered
* Ordered
* Reserved

### Wishlist States

* Wishlist
* Considering
* Researching

### Archived States

* Retired
* Sold
* Traded in
* Donated
* Recycled
* Returned
* Lost

> Privacy Note: The Tech Information section is public-facing, so private or sensitive device information should not be exposed.

---

## 12. Useful Device and Website Information

The website displays useful visitor-side information related to the current device and environment.

### Includes

* Browser information
* Operating system information
* Device type
* Screen resolution
* Connection information
* Network information when available
* Weather information
* Sunrise information
* Sunset information

This information helps show how the website is being viewed and provides additional context for visitors.

Availability can depend on browser support, permissions, network access, and configured services.

---

## 13. Disabilities

The Disabilities section displays disabilities or conditions that I choose to list publicly.

### Features

* Disability names
* Buttons or links to informational websites
* Hover animations
* Admin-managed list
* Visitor-only access

Visitors can click each disability link to learn more, but visitors cannot modify the list.

---

## 14. Version Information

The Version Information section displays metadata about the website and the visitor’s device or browser environment.

### Website Information

The website portion can include:

* Version number
* Build number
* Release track
* Revamp status
* Target release
* Synced timestamp

### Visitor Information

The visitor portion can include:

* Operating system
* Device
* Browser
* Screen resolution
* Connection information
* Weather information
* Sunrise information
* Sunset information

This section helps show the current website version and visitor environment.

---

## 15. Notice Information

The website displays legal and content-protection information.

### Includes

* Watermark notice
* Legal notice
* Copyright notice
* Protected content message

This section helps explain that website content is protected and should not be copied or reused without permission.

---

## 16. Maintenance Mode

The website can show a maintenance message when maintenance is active.

### Includes

* Maintenance notice
* Status page link
* Loading overlay
* Visitor-friendly maintenance message

Maintenance Mode helps visitors understand when the website may be temporarily unavailable or undergoing active updates.

---

# Beta Page

The Beta Page displays information about beta versions and upcoming changes.

### Includes

* Current beta version information
* Beta notes
* Release roadmap
* Planned version path
* Sections being tested
* Notes about experimental visual styles

The Beta Page helps show what is currently being tested before the full revamp release.

---

## Beta Notes

Beta notes can include important information such as:

* The beta is not the final September revamp.
* Some visual styles may change before release.
* Liquid glass effects may still be experimental.
* Mobile and split-screen layouts may still be adjusted.
* Additional features may be changed or removed during cleanup.
* The final complete revamp is planned as v27.0.

---

# Settings Page

The Settings Page allows visitors to adjust appearance and accessibility options.

Some settings are available to visitors, while restricted management options remain owner-only.

---

## Appearance Settings

Appearance settings allow visitors to customize how the website looks.

### Includes

* Light mode
* Dark mode
* Match device appearance
* Text size control
* Reset to default appearance settings

---

## Accessibility Settings

Accessibility settings help improve usability.

### Includes

* Focus outline toggle
* Keyboard navigation support
* Accessibility-friendly display preferences
* Reduced or adjusted visual effects when supported
* Readability-focused options

---

## Reset to Factory Settings

The Reset to Factory Settings option restores visitor settings to their default values.

---

# Resume Page

The Resume Page provides access to resume-related information.

### Features May Include

* Resume content
* Skills
* Experience
* Education
* Download options when available
* Browser-based viewing options when available

---

# Admin Portal

The Admin Portal is exclusively for authorized accounts and is used to manage supported website content.

---

## Admin-Managed Content

The Admin Portal can manage:

### Profile

* Profile information
* Profile image
* Bio
* Social links
* Useful links
* Creator shoutouts
* Disabilities

### Business

* Contact email
* Weekly business hours
* Holiday or date-based closures
* Temporary closures
* Temporary schedules
* Manual status overrides

### Academic

* Class schedules
* Exams
* Finals
* University events
* Internships
* Co-ops
* Academic breaks
* Semester metadata
* Academic timezone

### Tech

* Device tracking
* Ownership states
* Lifecycle information
* Support information
* Upgrade information
* Planned devices
* Wishlist devices
* Archived devices

### Metadata

* Website information
* Version information
* Build information
* Release information

---

## Live Previews and Save State

Supported Admin Portal sections can provide live previews for business and academic updates.

Admin changes use Firebase Firestore save and load support.

---

## Business Admin Features

The business admin area supports:

* Contact email editing
* Regular weekly hours
* Multiple hour ranges per day
* Holiday or date-based closures
* Temporary schedule periods
* Manual status override
* Live preview
* Firestore save and load support

### Manual Status Override Options

* Automatic
* Force Open
* Force Closed
* Force Unavailable

---

## Academic Admin Features

The academic admin area supports:

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

---

## Creator Shoutout Admin Features

The creator shoutout admin area supports:

* TikTok creator management
* Instagram creator management
* YouTube creator management
* Profile image fields
* Username fields
* Display name or nickname fields
* Follower or subscriber count fields
* Verification status
* Platform-specific display information
* Last updated timestamps

---

## Useful Links Admin Features

The Useful Links admin area supports:

* Link labels
* Link URLs
* Display order
* External link management
* Merch store link management

---

## Disabilities Admin Features

The Disabilities admin area supports:

* Disability names
* Educational or official resource links
* Display order
* Visitor-facing button creation

---

## Tech Admin Features

The Tech admin area supports management of public tech information.

### Tech Item Fields Can Include

* Device name
* Model
* Device type
* Material
* Storage
* Battery capacity
* Color
* Price
* Date released
* Date bought
* Operating system version
* Battery health
* Battery charge cycles
* Ownership state
* Upgrade information
* Support information
* Lifecycle information
* Current role
* Previous role
* Predecessor device
* Successor device
* Planned replacement
* Expected future specifications

> Privacy Note: Only information intended for public display should be entered into public tech records.

---

# Security Features

The website includes features intended to discourage casual copying and misuse of content.

### Includes

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

> Disclaimer: Client-side restrictions act only as deterrents. They are not replacements for proper authentication, Firestore Security Rules, server-side security, account security, backups, or legal protection.

---

# Accessibility and Responsive Design

The website is designed to work across multiple screen sizes and device types.

### Includes

* Responsive layout
* Mobile-friendly sections
* Tablet and desktop support
* Dark and light appearance support
* Adjustable text size
* Keyboard focus options
* Visitor-local timezone support
* Clear labels
* Status messages
* Accessible buttons and links
* Dynamic content updates

Visual effects and layouts may continue to be refined during the beta period.

---

# Coding Languages and Technologies

This project is built with standard web technologies and Firebase backend services.

## Core Technologies

* HTML
* CSS
* JavaScript
* Firebase Firestore
* Firebase Authentication
* Firebase Cloud Messaging
* Luxon for timezone logic
* Font Awesome icons
* LocalStorage
* SessionStorage
* Progressive Web App technologies
* Service workers

---

## Language Breakdown

| Language | Percentage | Purpose |
| :--- | :--- | :--- |
| JavaScript | 48.7% | Powers dynamic behavior, profile loading, sorting, time logic, Firestore updates, and interactive user-interface features. |
| CSS | 37.9% | Controls visual design, responsive layouts, liquid glass styling, animations, themes, and hover effects. |
| HTML | 13.4% | Provides website structure, page sections, navigation, and content frameworks. |

> Language percentages are based on the current GitHub repository language analysis and may change as files are added, removed, or updated.

---

## JavaScript

JavaScript powers most of the dynamic website behavior.

### JavaScript Handles

* Profile loading
* Live activity and status
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

Unused logic associated with retired sections is removed as part of the v26.6-beta.3 cleanup.

---

## CSS

CSS controls the visual design and layout.

### CSS Handles

* Page layout
* Responsive design
* Light and dark themes
* Liquid glass and Onyx styling
* Buttons
* Cards
* Animations
* Hover effects
* Focus styles
* Mobile layouts
* Accessibility presentation
* Business status presentation
* Creator profile card designs
* Tech information layouts

Unused styles associated with retired sections are removed as part of the v26.6-beta.3 cleanup.

---

## HTML

HTML provides the website structure.

### HTML Includes Sections For

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
* Beta page
* Resume page
* Settings page
* Admin Portal

---

# Version History

| Version | Highlights |
| :--- | :--- |
| v26.6-beta.3 | Current cleanup release. Removed retired FAQ, Posts, Blog, President, Legislation, Quote of the Day, Latest TikTok embed, Onyx AI assistant, and Project Goal Tracker features. Removed associated JavaScript, CSS, Firestore references, listeners, initialization calls, and obsolete script references. |
| v26.6-beta.2 | Updated Business Status and Hours. Improved academic availability. Added smart recurring class status labels. Fixed recurring classes so ended classes no longer stay stuck on “In Effect.” Improved hide and show full hours behavior. |
| v26.6-beta.1 | Original partial beta revamp preview. Continued liquid glass and Onyx UI refinements. Added beta notes and the release roadmap. |
| v26.5 | Current stable base. Updated device information and creator shoutout sections. Continued liquid glass refinement. |
| v26.1.2 | Introduced appearance settings, match-device theme, and manual light and dark modes. |
| v1.17.0 | Bug fixes. |
| v1.16.0 | Introduced the Admin Portal and owner-only content management tools. |
| v1.15.0 | Bug fixes and general improvements. |
| v1.14.0 | Theme consistency improvements and performance optimization. |
| v1.13.0 | Added a focus outline toggle and accessibility enhancements. |
| v1.12.0 | Added merch store access under Useful Links. |
| v1.11.0 | Added the Settings Page, dark and light modes, font adjustments, and factory reset. |
| v1.10.1 | Added current-day highlighting and enhanced the website theme. |
| v1.10.0 | Added an event calendar and bug fixes. |
| v1.9.0 | Added TikTok creator shoutouts, tech information, disabilities, version information, and legal notices. |
| v1.8.0 | Added RedNote support styled like YouTube and Instagram, plus general enhancements. |
| v1.7.0 | Added security enhancements, media-saving deterrents, and text-copying deterrents. |
| v1.6.0 | Added Instagram and YouTube creator shoutouts, last updated timestamps, and bug fixes. |
| v1.5.0 | Bug fixes and improvements. |

---

# Release Roadmap

* v26.5 — Current stable website base.
* v26.6-beta.1 — Original partial beta revamp preview.
* v26.6-beta.2 — Business and academic availability improvements.
* v26.6-beta.3 — Current cleanup release removing retired and unused website sections.
* v26.6-beta.4+ — Additional beta fixes and revamp updates, if needed.
* v26.6-rc.1 — Release candidate before the complete September launch.
* v27.0 — Full September 2026 revamp release.

The roadmap may change during testing if additional beta builds or release candidates are needed.

---

# Removed and Retired Features

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

The cleanup also removed:

* Unused Firestore collection references
* Unused Firestore document references
* Retired realtime notification listeners
* Retired page initialization calls
* Unused JavaScript helper functions
* Feature-specific CSS
* Obsolete AI chat script references
* Retired page-routing logic
* Unused frontend code

The main TikTok, Instagram, and YouTube creator shoutout sections remain active.

Device AI compatibility information in the Tech Information section also remains active because it evaluates device capabilities and is not an interactive AI assistant.

---

# Conclusion

The Link in Bio Website is a centralized and dynamic hub for profile information, social links, creator shoutouts, useful links, business availability, academic scheduling, technology information, accessibility settings, and public website updates.

Visitors can:

* View public profile information
* Access social and useful links
* Check live activity and availability
* View creator shoutouts
* Check business hours
* View academic schedule impacts
* Review public tech information
* Access disability resources
* Review website and device information
* Adjust basic appearance and accessibility settings

Only authorized accounts can modify managed content through the Admin Portal.

Version v26.6-beta.3 focuses on cleaning up the website by removing retired features and reducing unnecessary frontend code while preserving the primary public-facing experience.

Thanks for visiting!
