# Link in Bio Website

https://img.shields.io/badge/version-v26.6--beta.2-blue
https://img.shields.io/badge/build-2026.07.05-purple
https://img.shields.io/badge/release%20track-Beta%20Revamp%20Preview-orange
https://img.shields.io/badge/stable%20base-v26.5-green
https://img.shields.io/badge/planned%20revamp-v27.0-yellow
https://img.shields.io/badge/JavaScript-50.0%25-f1e05a
https://img.shields.io/badge/CSS-36.3%25-663399
https://img.shields.io/badge/HTML-13.7%25-e34c26

Welcome to the repository for my Link in Bio Website.

This website is a centralized hub for my profile, social links, creator shoutouts, useful links, business availability, academic availability, tech information, accessibility settings, and website updates.

The website is built to be responsive, accessible, secure, and easy to use across phones, tablets, computers, and other devices.

---

## Current Version

| Attribute | Details |
| :--- | :--- |
| Version | v26.6-beta.2 |
| Build | 2026.07.05 |
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
  * #2-live-activity--status
  * #3-connect-with-me
  * #4-tiktok-instagram-and-youtube-creator-shoutouts
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
* #conclusion

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

> Note: Most public content is managed through the Admin Portal, which is only accessible to authorized accounts.

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

The navigation area can include links such as:

* Home
* Beta
* Resume
* Settings

The profile section gives visitors a quick overview of who I am and provides access to other important pages.

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

* Social media buttons and platform icons
* Links that open in a new tab
* Admin-managed links
* Visitor-only access
* Visitors can click the links
* Visitors cannot edit or modify the links

This section allows visitors to quickly access my public social profiles and other connected accounts.

---

## 4. TikTok, Instagram, and YouTube Creator Shoutouts

The website includes creator shoutout sections for:

* TikTok
* Instagram
* YouTube

These sections list creators that I follow, collaborate with, or want to highlight.

### Features

* Creator profile cards
* Profile pictures
* Usernames and display names
* Platform-specific card designs
* Verified badges when available
* Follower, subscriber, like, post, or video counts when available
* Visit Profile / Visit Channel buttons
* Search support
* Sorting support
  * High to low
  * Low to high
  * A to Z
  * Z to A
* Last updated timestamps

Visitors can view and visit creator profiles, but only I can modify the creator lists through the Admin Portal.

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
* Merch store link

### Features

* Links open in a new tab
* Links are displayed as buttons
* Links are managed through the Admin Portal
* Visitors can click the links
* Visitors cannot edit the links

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

The countdown is based on the visitor’s device/browser timezone.

This helps visitors see the time remaining until a configured event using their local time context.

---

## 7. Business Information

The Business Information section displays business availability and contact information.

Business hours are shown in the visitor’s local timezone while still being based on the configured business timezone.

### Includes

* Business status
  * Open
  * Closed
  * Holiday Hours
  * Temporary Closure
  * Academic Schedule Active
  * Manual Override
* Contact email
* Visitor timezone
* Store/business timezone
* Store time
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
* 12-hour / 24-hour time format toggle
* Hide / Show Full Hours toggle

### Status Behavior

The business status can automatically update based on:

* Regular weekly hours
* Holiday hours
* Temporary hours
* Academic availability
* Manual override settings

The business section is designed to show visitors whether availability is currently open, closed, temporarily unavailable, affected by a holiday, or affected by academic scheduling.

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

### Academic Items Included

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
* Final exam
* Academic break

---

### Smart Recurring Class Status

Recurring classes use smart time-aware labels to prevent classes from incorrectly staying on “In Effect” after the class time has ended.

A recurring class can show:

* Scheduled for Today
* Scheduled for Tomorrow
* Scheduled in X days
* Starts in X minutes
* Starts in X hours
* In Progress
* Concluded Today
* Concluded Today • Next class Tuesday
* Not Scheduled Today • Next class Tuesday
* Concluded

This makes recurring classes more accurate and easier for visitors to understand.

---

### Academic Schedule Dropdown

The Academic Schedule dropdown is part of the business hours display.

The dropdown can show academic schedule items such as:

* Recurring classes
* Exams
* Finals
* Academic breaks
* University events
* Internships and co-ops

The Academic Schedule dropdown hides or shows together with the Hide / Show Full Hours toggle if academic data is available.

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
* OS version

---

### Smart Tech Features

The Tech Information section also includes advanced device and lifecycle tracking.

### Advanced Features Include

* OS status
  * Latest
  * Outdated
  * Very Outdated
  * Beta
  * Developer Beta
  * Public Beta
  * Ahead of Public
* Lifecycle and Support
  * Device support status
  * Estimated support lifespan
  * Upgrade recommendation
  * Upgrade priority
  * Future-proof score
* Battery and Performance
  * Battery trend
  * Battery cycle evaluation
* AI and Future Planning
  * AI feature support
  * Future AI target
  * Backup priority
  * Cost efficiency
* Lineage
  * Device lineage
  * Role transition details
  * Upgrade path

---

### Ownership States

Tech items support different ownership states.

### Examples

* Owned
* Borrowed
* Loaned out
* School-issued
* Work-issued
* In repair
* Planned
* Coming soon
* Future upgrade
* Preordered
* Ordered
* Reserved
* Wishlist
* Considering
* Researching
* Retired
* Sold
* Traded in
* Donated
* Recycled
* Returned
* Lost

> Privacy Note: The tech section is public-facing, so private or sensitive device information is not exposed.

---

## 12. Useful Device and Website Information

The website displays useful visitor-side information related to the current device and environment.

### Includes

* Browser information
* Operating system information
* Device type
* Screen resolution
* Connection information
* Network information
* Weather information
* Sunrise information
* Sunset information

This information helps show how the website is being viewed and provides additional context for visitors.

---

## 13. Disabilities

The Disabilities section displays disabilities or conditions that I choose to list publicly.

### Features

* Disability names
* Buttons or links to official informational websites
* Hover animations
* Admin-managed list
* Visitor-only access

Visitors can click each disability link to learn more, but visitors cannot modify the list.

---

## 14. Version Information

The Version Information section displays metadata about the website and the visitor’s device/browser environment.

### Includes

* Website
  * Version number
  * Build number
  * Release track
  * Revamp status
  * Target release
  * Synced timestamp
* Visitor
  * Operating system
  * Device
  * Browser
  * Screen resolution
  * Connection information
  * Weather information
  * Sunrise and sunset information

This section helps show the current site version and visitor environment.

---

## 15. Notice Information

The website displays legal and content protection information.

### Includes

* Watermark notice
* Legal notice
* Copyright notice
* Protected content message

This section helps explain that the website content is protected and should not be copied or reused without permission.

---

## 16. Maintenance Mode

The website can show a maintenance message when maintenance is active.

### Includes

* Maintenance notice
* Status page link
* Loading overlay
* Visitor-friendly maintenance message

Maintenance Mode helps visitors understand when the website may be temporarily unavailable or under active updates.

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

The beta page helps show what is currently being tested before the full revamp release.

---

## Beta Notes

Beta notes can include important information such as:

* The beta is not the final September revamp.
* Some visual styles may change before release.
* Liquid glass effects may still be experimental.
* Mobile and split-screen layouts may still be adjusted.
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

---

## Reset to Factory Settings

The Reset to Factory Settings option restores settings to their default values.

---

# Resume Page

The Resume Page provides access to resume-related information.

### Features May Include

* Resume content
* Skills
* Experience
* Education
* Download or viewing options, when available

---

# Admin Portal

The Admin Portal is exclusively for authorized accounts and is used to manage website content.

---

## Admin-Managed Content

The Admin Portal can manage:

* Profile
  * Profile information
  * Social links
  * Useful links
  * Creator shoutouts
  * Disabilities
* Business
  * Contact email
  * Weekly hours
  * Holiday/date closures
  * Temporary closures
  * Manual status overrides
* Academic
  * Class schedules
  * Exams
  * Finals
  * University events
  * Internships
  * Academic breaks
  * Semester metadata
  * Academic timezone
* Tech
  * Device tracking
  * Lifecycle information
  * Support information
  * Upgrade information
* Metadata
  * Website information
  * Version information

---

## Live Previews and Save State

The Admin Portal supports live previews for business and academic updates.

Admin changes are powered by Firestore save/load support.

---

## Business Admin Features

The business admin area supports:

* Contact email editing
* Regular weekly hours
* Multiple hour ranges per day
* Holiday/date closures
* Temporary schedule periods
* Manual status override
* Live preview
* Firestore save/load support

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
* Academic breaks
* Semester metadata
* Academic profile data
* Academic timezone
* Live preview
* Upcoming breaks preview
* Firestore save/load support

---

## Creator Shoutout Admin Features

The creator shoutout admin area supports:

* TikTok creator management
* Instagram creator management
* YouTube creator management
* Profile image fields
* Username fields
* Display name / nickname fields
* Follower or subscriber count fields
* Verification status
* Platform-specific display information
* Last updated timestamps

---

## Useful Links Admin Features

The useful links admin area supports:

* Link labels
* Link URLs
* Display order
* External link management
* Merch store link management

---

## Disabilities Admin Features

The disabilities admin area supports:

* Disability names
* Educational or official resource links
* Display order
* Visitor-facing button creation

---

## Tech Admin Features

The tech admin area supports management of public tech information.

### Tech Item Fields Can Include

* Device name
* Model
* Material
* Storage
* Battery capacity
* Color
* Price
* Date released
* Date bought
* OS version
* Battery health
* Battery charge cycles
* Ownership state
* Upgrade information
* Support information
* Lifecycle information

---

# Security Features

The website includes features to discourage casual copying and misuse of content.

### Includes

* Copy and paste prevention
* Printing prevention
* Drag-and-drop disabled
* Text selection disabled
* Right-click disabled
* Image saving deterrents
* Watermark notice
* Legal notice
* Copyright notices
* Firebase-backed data
* Restricted Admin Portal access

> Disclaimer: These features act as deterrents and are not a replacement for server-side security or legal protection.

---

# Accessibility and Responsive Design

The website is designed to work across multiple screen sizes and device types.

### Includes

* Responsive layout
* Mobile-friendly sections
* Dark/light appearance support
* Adjustable text size
* Keyboard focus options
* Visitor-local timezone support
* Clear labels
* Status messages
* Accessible buttons and links
* Dynamic content updates

---

# Coding Languages and Technologies

This project is built with standard web technologies and Firebase backend services.

### Core Technologies

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

---

## Language Breakdown

| Language | Percentage | Purpose |
| :--- | :--- | :--- |
| JavaScript | 50.0% | Powers dynamic behavior, profile loading, sorting, time logic, Firestore updates, and interactive UI features. |
| CSS | 36.3% | Controls visual design, responsive layouts, liquid glass styling, animations, themes, and hover effects. |
| HTML | 13.7% | Provides website structure, page sections, and content frameworks. |

---

## JavaScript

JavaScript powers most of the dynamic website behavior.

### JavaScript Handles

* Profile loading
* Social links
* Creator shoutouts
* Search and sorting
* Business status
* Holiday hours
* Temporary hours
* Academic availability
* Countdown
* Tech information
* Device/version detection
* Settings
* Weather/time data
* Firestore realtime updates

---

## CSS

CSS controls the visual design and layout.

### CSS Handles

* Page layout
* Responsive design
* Light and dark themes
* Liquid glass / onyx styling
* Buttons
* Cards
* Animations
* Hover effects
* Focus styles
* Mobile layouts

---

## HTML

HTML provides the website structure.

### HTML Includes Sections For

* Profile
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
* Admin portal

---

# Version History

| Version | Highlights |
| :--- | :--- |
| v26.6-beta.2 | Current beta update. Updated Business Status & Hours. Improved academic availability. Added smart recurring class status labels. Fixed recurring classes so ended classes no longer stay stuck on “In Effect.” Improved hide/show full hours behavior. |
| v26.6-beta.1 | Original partial beta revamp preview. Continued liquid glass / onyx UI refinements. Added beta notes and roadmap. |
| v26.5 | Current stable base. Updated device info and creator shoutout sections. Continued liquid glass refinement. |
| v26.1.2 | Introduced appearance settings, match device theme, and manual light/dark mode. |
| v1.17.0 | Bug fixes. |
| v1.16.0 | Introduced the Admin Portal and owner-only content management tools. |
| v1.15.0 | Bug fixes. |
| v1.14.0 | Theme consistency improvements and performance optimization. |
| v1.13.0 | Added focus outline toggle and accessibility enhancements. |
| v1.12.0 | Added merch store access under Useful Links. |
| v1.11.0 | Added settings page, dark/light modes, font adjustments, and factory reset. |
| v1.10.1 | Added current day highlight and enhanced the theme. |
| v1.10.0 | Added event calendar and bug fixes. |
| v1.9.0 | Added TikTok creator shoutouts, tech info, disabilities, version info, legal notices. |
| v1.8.0 | Added RedNote support styled like YouTube and Instagram, plus general enhancements. |
| v1.7.0 | Added security enhancements, media-saving deterrents, and text-copying deterrents. |
| v1.6.0 | Added Instagram and YouTube creator shoutouts, last updated timestamps, and bug fixes. |
| v1.5.0 | Bug fixes and improvements. |

---

# Release Roadmap

* v26.5 — Current stable website base.
* v26.6-beta.1 — Original partial beta revamp preview.
* v26.6-beta.2 — Current beta update with business and academic section improvements.
* v26.6-beta.2+ — More beta fixes and section updates.
* v26.6-rc.1 — Release candidate before the full September launch.
* v27.0 — Full September 2026 revamp release.

---

# Conclusion

This Link in Bio Website is a centralized and dynamic hub for links, profile information, creator shoutouts, business availability, academic scheduling, technology information, accessibility settings, and public updates.

Visitors can interact with public sections, view links, check business status, view creator shoutouts, read useful information, and adjust basic appearance/accessibility settings.

Only I can modify managed content through the Admin Portal.

Thanks for visiting!
