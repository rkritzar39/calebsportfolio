# BusArmyDude.org

<!-- BADGES:START -->
[![Version](https://img.shields.io/badge/version-v27.0--rc.1-blue)](#current-version)
[![Build](https://img.shields.io/badge/build-2026.07.17-purple)](#current-version)
[![Release Track](https://img.shields.io/badge/release%20track-Release%20Candidate-orange)](#release-roadmap)
[![Current Stable](https://img.shields.io/badge/current%20stable-v26.5-green)](#version-history)
[![Next Stable](https://img.shields.io/badge/next%20stable-v27.0-yellow)](#release-roadmap)
[![JavaScript](https://img.shields.io/badge/JavaScript-45.0%25-f1e05a)](#coding-languages-and-technologies)
[![CSS](https://img.shields.io/badge/CSS-36.2%25-663399)](#coding-languages-and-technologies)
[![HTML](https://img.shields.io/badge/HTML-18.9%25-e34c26)](#coding-languages-and-technologies)
<!-- BADGES:END -->

BusArmyDude.org is a responsive personal profile, link-in-bio, live-status, availability, academic portfolio, resume, technology information, accessibility, and content-management website.

The project currently operates as a single-owner public website with an authenticated Admin Portal. Its proposed next major direction is a **multi-user link-in-bio and profile-building platform**: a service in the same broad product category as Linktree, but expanded with optional education, resume, project, skill-evidence, availability, live-activity, creator, and career modules.

The goal is not to copy another product. The goal is to turn the strongest parts of BusArmyDude.org into a reusable platform where each registered user can create one shareable page, organize links and content, choose a visual identity, control privacy, review analytics, and optionally build a deeper academic or professional profile.

> **Current product status:** BusArmyDude.org remains a personal website. Multi-user profiles, employer accounts, opportunity listings, internal applications, and direct messaging are proposed future features and are not part of the current stable release.

---

## Current Version

- **Current development version:** v27.0-rc.1
- **Current build:** 2026.07.17
- **Release track:** Release Candidate
- **Current stable version:** v26.5
- **Next planned stable version:** v27.0
- **Current development focus:** release-candidate testing, Education portfolio development, responsive refinements, accessibility, and Onyx interface consistency
- **Target for v27.0:** Late July 2026, subject to release-candidate testing
- **Planned broader revamp window:** September 2026

v26.5 remains the current stable public version. v27.0-rc.1 is the current release candidate. v27.0 is the next planned stable release.

---

## Table of Contents

- [Overview](#overview)
- [Project Development](#project-development)
- [Current Product Scope](#current-product-scope)
- [Home Page](#home-page)
- [Profile and Live Activity](#profile-and-live-activity)
- [Creator Shoutouts and Useful Links](#creator-shoutouts-and-useful-links)
- [Business and Academic Availability](#business-and-academic-availability)
- [Education Portfolio](#education-portfolio)
- [Technology Information](#technology-information)
- [Settings and Accessibility](#settings-and-accessibility)
- [Resume](#resume)
- [Navigation Dock](#navigation-dock)
- [Admin Portal](#admin-portal)
- [Security and Privacy](#security-and-privacy)
- [Coding Languages and Technologies](#coding-languages-and-technologies)
- [Future Multi-User Link-in-Bio Platform](#future-multi-user-link-in-bio-platform)
- [Complete Proposed Feature Set](#complete-proposed-feature-set)
- [Potential Career and Opportunity Platform](#potential-career-and-opportunity-platform)
- [Estimated Development Timeline](#estimated-development-timeline)
- [Proposed Version Plan](#proposed-version-plan)
- [Release Roadmap](#release-roadmap)
- [Version History](#version-history)
- [Removed and Retired Features](#removed-and-retired-features)
- [Conclusion](#conclusion)

---

## Overview

BusArmyDude.org is a centralized public hub for:

- Profile information
- Social and useful links
- Discord, Spotify, and PreMiD activity
- Creator shoutouts
- Business availability
- Academic availability
- Education and degree progress
- Resume information
- Public technology information
- Accessibility settings
- Website release information
- Legal and maintenance notices

Most public content is managed through an authenticated Admin Portal. Visitors can view published content and adjust local appearance or accessibility preferences but cannot edit owner-managed information.

The website is designed for phones, foldables, tablets, laptops, desktops, large displays, touchscreens, mouse and trackpad input, keyboard navigation, split-screen layouts, and short landscape screens.

---

## Project Development

Development began on **January 2, 2025**.

The project has grown from a link-in-bio website into a broader digital identity and portfolio system with:

- Public profile presentation
- Firebase-backed content management
- Live presence and media activity
- Business and academic availability
- Academic portfolio tools
- Resume presentation
- Technology inventory and planning
- Accessibility and appearance controls
- Responsive liquid-glass navigation

The existing single-owner website may serve as the first prototype for a future reusable profile platform.

---

## Current Product Scope

### Current single-owner capabilities

- Public personal profile
- Optional Discord profile synchronization
- Live Discord, Spotify, and PreMiD activity
- Social and useful links
- TikTok, Instagram, and YouTube creator shoutouts
- Countdown timer
- Business-hours and availability system
- Academic availability and schedule impact
- Education portfolio
- Resume and PDF resume access
- Public technology information
- Disabilities and educational-resource links
- Version and visitor-device information
- Responsive Settings page
- Authenticated Admin Portal
- Firebase persistence
- Onyx liquid-glass design system

### Current product boundaries

The website does not currently provide:

- Public account registration for other users
- Multi-user profile creation
- Employer accounts
- Educational organization accounts
- Public profile search
- Job or internship listings
- Internal applications
- Direct messaging
- Candidate pipelines
- Institution-verified credentials

---

## Home Page

The Home page is the primary public profile and information hub.

### Main sections

1. Profile
2. Live Activity and Status
3. Connect with Me
4. Creator Shoutouts
5. Useful Links
6. Countdown
7. Business Information
8. Holiday Hours
9. Temporary Hours
10. Academic Availability
11. Technology Information
12. Visitor Device and Website Information
13. Disabilities
14. Version Information
15. Notice Information
16. Maintenance Mode

The v27.0 release track focuses on a cleaner profile experience, refined Live Activity styling, Discord profile synchronization, creator-card improvements, device-information refinements, responsive behavior, accessibility, and the Onyx liquid-glass interface.

---

## Profile and Live Activity

### Profile

The Profile section supports:

- Username or display name
- Biography
- Profile image
- Verified badge
- Status indicator
- Responsive profile presentation
- Optional Discord synchronization
- Manual fallback values

### Discord synchronization

Supported synchronization options include:

- Discord display name
- Discord username
- Discord profile image
- Discord presence state
- Saved Discord User ID
- Admin-side preview
- Refresh and apply controls
- Last-synchronized metadata

The homepage biography remains manually managed and is not replaced by Discord synchronization.

### Live Activity

The Live Activity system can display:

- Active, idle, Do Not Disturb, or offline state
- Discord presence
- Spotify activity
- PreMiD activity
- Media artwork
- Activity or song title
- Artist or activity details
- Explicit-content indicator when available
- Real progress timestamps
- Elapsed, remaining, and total time
- Indeterminate progress for supported activities without full timing information
- Dynamic artwork-based accent extraction
- User-selected accent fallback
- Manual Firestore overrides

Manual Firestore status overrides take priority when active.

---

## Creator Shoutouts and Useful Links

### Creator shoutouts

The website supports TikTok, Instagram, and YouTube creator cards with:

- Profile image
- Username
- Display name or nickname
- Platform-specific presentation
- Verification badge when available
- Follower, subscriber, post, like, or video counts when available
- Search and sorting
- Last-updated metadata
- External profile or channel buttons

Supported sorting includes:

- High to low
- Low to high
- A to Z
- Z to A

The retired Latest TikTok embed is not part of the current website. The main creator shoutout sections remain active.

### Useful links

Useful Links supports:

- Personal websites
- Helpful resources
- Tools
- Important references
- External pages
- Merch-store access

Links are managed through the Admin Portal and open externally where configured.

---

## Business and Academic Availability

### Business information

The Business Information system supports:

- Business contact email
- Business timezone
- Visitor-local timezone conversion
- Current business time
- Today's hours
- Next opening time
- Weekly hours
- Multiple time ranges
- Holiday hours
- Temporary schedules
- Manual overrides
- Academic schedule impact
- Current-status chips
- Timeline view
- Copy Today control
- 12-hour and 24-hour time display
- Hide or show full hours

### Business statuses

- Open
- Closed
- Holiday Hours
- Temporary Closure
- Academic Schedule Active
- Manual Override

### Academic availability

Academic availability is integrated into the Business section because school commitments may affect availability.

Supported academic items include:

- Recurring classes
- Exams
- Final exams
- University events
- Academic breaks
- Internships
- Co-ops
- Semester metadata
- Academic profile information

Recurring-class status can display upcoming, in-progress, concluded, and next-class information.

---

## Education Portfolio

The Education system is an advanced public academic portfolio managed through the Admin Portal.

### Academic profile

The profile can contain:

- Institution
- College
- Current program
- Intended program
- Major
- Minor
- Concentration
- Academic year
- Enrollment status
- Current term
- Expected graduation
- Degree name
- Required credits
- Manual cumulative GPA override
- Manual earned-credit override
- Public introduction

### Degree progress

The degree tracker supports:

- Required credits
- Completed credits
- Remaining credits
- Completion percentage
- Progress ring
- Requirement groups
- Planned coursework
- Provisional degree planning

Unofficial or intended programs should be clearly labeled as intended, provisional, planned, or estimated.

### Semesters and courses

Each semester supports:

- Semester name
- Date range
- Status
- Current-term designation
- Courses
- Credits earned
- Semester GPA when applicable

Each course supports:

- Course code
- Course title
- Credits
- Subject or requirement area
- Status
- Grade outcome
- Grading mode
- Connected skills
- Public visibility

### Supported grading modes

- Standard Letter
- Grade / No Credit
- Pass / No Credit
- Satisfactory / Unsatisfactory
- Audit
- Transfer
- Custom

The calculator separates:

- Credits attempted
- Credits earned
- GPA hours
- Quality points
- Semester GPA
- Cumulative GPA

Calculated information is unofficial and should not be presented as an official transcript or degree audit.

### Additional Education modules

- Academic dashboard
- Current-semester view
- Course search and filtering
- Academic analytics
- GPA trend
- Timeline and program history
- Goals and milestones
- Academic roadmap
- Planned coursework
- Achievements
- Certifications
- Project case studies
- Skills and supporting evidence
- Transfer credits
- Grading-mode reference
- JSON export
- Print-friendly unofficial summary
- Last-updated information
- Public/private visibility controls

### Education navigation

The Education page includes:

- Device-friendly sticky section navigation
- Compact Jump to Section menu on phones
- Horizontal section navigation on larger screens
- Active-section highlighting
- Keyboard support
- Safe-area support
- Reduced-motion support
- Shared Onyx dock

---

## Technology Information

The public Tech Information system can describe devices owned, used, tracked, or planned.

### Device information

- Device name and model
- Device type
- Material
- Color
- Storage
- Price
- Battery capacity
- Battery health
- Charge cycles
- Release date
- Purchase date
- Operating-system version

### Operating-system states

- Latest
- Outdated
- Very Outdated
- Beta
- Developer Beta
- Public Beta
- Ahead of Public
- Release Candidate
- Preview
- Canary

### Lifecycle and planning

- Support status
- Estimated support lifespan
- Upgrade recommendation
- Upgrade year or window
- Upgrade priority
- Future-proof score
- Recommended action
- Battery trend
- Device age
- Upgrade triggers
- Future hardware target
- Backup priority
- Cost efficiency
- Recommended future specifications
- Features or specifications to avoid

### Ownership states

Active:

- Owned
- Borrowed
- Loaned out
- School-issued
- Work-issued
- In repair

Planned:

- Planned
- Coming soon
- Future upgrade
- Preordered
- Ordered
- Reserved

Wishlist:

- Wishlist
- Considering
- Researching

Archived:

- Retired
- Sold
- Traded in
- Donated
- Recycled
- Returned
- Lost

> **Privacy requirement:** The Tech Information section is public-facing. Private identifiers, precise location data, account information, serial numbers, and other sensitive device details must not be published.

---

## Settings and Accessibility

### Appearance

- Light mode
- Dark mode
- Match-device mode
- Clear appearance
- Tinted appearance
- Accent colors
- Text-size adjustment
- Factory reset

### Accessibility

- Focus outlines
- Keyboard navigation
- Reduced motion
- High contrast
- Dyslexia-friendly font support
- Underlined links
- Responsive text sizing
- Touch-friendly targets
- Accessible labels and status messages
- Print-specific layouts

Appearance and accessibility preferences are stored locally for visitors unless a future account system adds synchronized preferences.

---

## Resume

The Resume page supports:

- Name and title
- Profile image
- Contact information
- General location
- Website and professional links
- Professional summary
- Skills
- Languages
- Experience
- Education
- Certifications
- Projects
- Resume PDF access

The Resume page uses the shared appearance system and adapts across phones, foldables, tablets, laptops, desktops, printed pages, and browser-generated PDFs.

Print layouts can hide the Onyx dock, footer, and PDF controls while removing unnecessary glass effects and preventing important sections from splitting when possible.

---

## Navigation Dock

The responsive Onyx liquid-glass dock currently provides access to:

- Home
- Release Candidate / Beta
- Education
- Resume
- Settings

### Dock features

- Inline SVG or compatible navigation icons
- Active liquid-glass lens
- Automatic and nested route detection
- Equal-width navigation items
- Balanced spacing
- Fractional-pixel positioning
- Press feedback
- Press-and-drag navigation
- Nearest-item drag targeting
- Release and snap animation
- Settings-only gear rotation
- Pointer reflection on supported devices
- Keyboard navigation
- Safe-area support
- Phone, tablet, laptop, and desktop responsiveness
- Reduced-motion support
- High-contrast support

### Dock interaction

Visitors can click or tap an item. On supported devices, visitors can press and hold, drag the liquid lens to another destination, and release to open the selected destination.

### Keyboard navigation

Supported interactions may include:

- Left Arrow
- Right Arrow
- Up Arrow
- Down Arrow
- Home
- End
- Enter
- Space

Modified browser interactions, such as opening a destination in a new tab, should remain available where supported.

---

## Admin Portal

The Admin Portal is restricted to authorized accounts and manages supported website content.

### Managed content

Profile and identity:

- Profile information
- Profile image
- Biography
- Discord synchronization
- Social links
- Useful links
- Disabilities

Business and academic availability:

- Contact information
- Weekly hours
- Holiday hours
- Temporary schedules
- Manual status overrides
- Classes
- Exams
- Finals
- Events
- Internships
- Co-ops
- Breaks
- Semester metadata

Education portfolio:

- Academic profile
- Degree progress
- Privacy controls
- Semesters
- Courses
- Grading modes
- Timeline
- Goals
- Roadmap
- Achievements
- Certifications
- Projects
- Skills
- Transfer credits
- Publishing and backup

Technology:

- Device identity
- Ownership state
- Lifecycle information
- Operating-system status
- Upgrade planning
- Device lineage
- Future specifications

Website metadata:

- Version
- Build
- Release track
- Revamp status
- Target release
- Maintenance information

### Current Admin model

The current Admin Portal is a website-owner management tool. A future multi-user platform should use a separate user dashboard rather than exposing the entire website administration interface to ordinary users.

---

## Security and Privacy

### Existing safeguards

- Firebase Authentication
- Firestore Security Rules
- Owner-only Admin Portal
- Public/private content separation
- Client-side copying and saving deterrents
- Watermark and legal notices
- Restricted management controls

> Client-side restrictions are deterrents only. Client-side code cannot replace authentication, authorization, secure Firestore rules, backups, moderation, and legal protection.

### Static-hosting requirements

Because the website is hosted through GitHub Pages:

- Do not place private API keys, client secrets, bot tokens, administrative credentials, or server credentials in public JavaScript.
- Do not enforce high-trust roles only by hiding interface elements.
- Do not rely on localStorage for authorization.
- Use Firebase Security Rules and trusted backend functions for protected actions.

### Public data restrictions

Public profiles and pages should not expose:

- Student IDs
- Government IDs
- Home addresses
- Exact class schedules
- Classroom locations
- Exact exam details
- Private assignment links
- Financial information
- Authentication details
- Private academic records
- Device serial numbers
- Private account identifiers

---

## Coding Languages and Technologies

### Core technologies

- HTML
- CSS
- JavaScript
- GitHub Pages
- Firebase Authentication
- Cloud Firestore
- Firebase Cloud Messaging
- Lanyard API
- Luxon
- Font Awesome
- Inline SVG icons
- LocalStorage
- SessionStorage
- Progressive Web App technologies
- Service workers
- SunCalc
- html2pdf.js

### Current language breakdown

- **JavaScript:** approximately 45.0%
- **CSS:** approximately 36.2%
- **HTML:** approximately 18.9%

Language percentages are based on repository analysis and may change as files are added, removed, or reorganized.

---

## Future Multi-User Link-in-Bio Platform

The proposed future product is first and foremost a **multi-user link-in-bio platform**. Every user would receive one customizable, shareable page that can collect links, social profiles, media, projects, contact options, education, credentials, availability, and other selected modules.

### Product statement

> One customizable link for a user's identity, content, work, education, and online presence.

### Platform priorities

1. Fast and simple link-in-bio creation
2. Strong profile customization
3. Mobile-first public pages
4. Accessibility across themes and devices
5. Clear public and private data separation
6. Modular profile sections
7. Useful analytics without invasive tracking
8. Reliable account and content management
9. Evidence-based academic and career profiles as an optional advanced layer
10. Organization and opportunity features only after the profile platform is stable

### Intended audiences

- Individuals who need a simple link page
- Students building academic profiles
- Graduates building career portfolios
- Job seekers collecting work samples and contact links
- Creators sharing content and social channels
- Freelancers sharing services and booking links
- Developers sharing projects and repositories
- Small businesses sharing products, hours, and contact options
- Clubs and organizations sharing resources and events
- Employers and schools in later platform phases

### Core experience

A new user should be able to:

1. Create an account.
2. Choose a unique username.
3. Claim a public profile URL.
4. Add a display name, biography, and profile image.
5. Add and reorder links.
6. Add social icons.
7. Choose a theme and accent.
8. Preview the page on phone, tablet, and desktop layouts.
9. Publish the page.
10. Copy the public URL or QR code.
11. Review basic page and link analytics.
12. Add advanced modules only when needed.

### Public profile URL examples

An initial GitHub Pages-compatible prototype may use:

```text
/profile.html?user=username
```

A later hosting environment with route rewrites may support:

```text
/username
/u/username
/profiles/username
```

Custom domains could be considered after the platform has stable routing, ownership verification, and abuse controls.

---

## Complete Proposed Feature Set

This section describes the full proposed feature inventory. Features are grouped by release priority so the platform can begin as a focused link-in-bio tool and expand without making the first release unmanageable.

### 1. Account registration and onboarding

- Email and password registration
- Email verification
- Sign in and sign out
- Password reset
- Optional supported third-party sign-in providers
- Terms and privacy acceptance
- Age and eligibility checks where required
- Unique username selection
- Username normalization
- Reserved-name protection
- Username change limits
- Account type selection
- Guided onboarding
- Starter-template selection
- Onboarding progress
- Skip and return later options
- Account recovery guidance
- Suspicious-sign-in notices
- Session listing and revocation
- Optional multi-factor authentication
- Account deactivation
- Account deletion
- User-data export

### 2. Profile identity

- Unique username
- Display name
- Pronunciation field if voluntarily provided
- Headline or short title
- Biography
- Profile image
- Cover image or visual header
- Verified-status area
- General location with privacy controls
- Timezone with privacy controls
- Preferred public contact method
- Website URL
- Public email or contact-form option
- Availability status
- Status message
- Profile type
- Profile badges
- Last-updated label
- Profile completion indicator

### 3. Link management

- Unlimited or plan-based link counts
- Link title
- URL
- Optional description
- Icon
- Thumbnail
- Button style
- Link category
- Link tags
- Drag-and-drop ordering
- Keyboard reordering
- Duplicate link
- Archive link
- Draft link
- Publish or unpublish link
- Enable or disable link
- Pin important links
- Featured-link layouts
- Animated emphasis with reduced-motion handling
- Scheduled publishing
- Start and end dates
- Timezone-aware schedules
- Expired-link behavior
- Password-protected links in a later phase
- Link health checks
- Broken-link warnings
- Unsafe-link warnings
- UTM parameter support
- Redirect links in a later phase
- Click-confirmation pages for suspicious external destinations

### 4. Social profile support

- Instagram
- TikTok
- YouTube
- Twitch
- Facebook
- X or Twitter
- Threads
- Bluesky
- Mastodon
- LinkedIn
- GitHub
- GitLab
- Discord
- Reddit
- Pinterest
- Snapchat
- Spotify
- Apple Music
- SoundCloud
- Steam
- Xbox
- PlayStation
- Email
- Phone when voluntarily enabled
- Custom social services
- Per-icon labels for accessibility
- Display-order controls
- Open-in-new-tab settings
- Social-handle validation

### 5. Content blocks

- Heading
- Paragraph
- Divider
- Image
- Image gallery
- Video embed
- Audio or music embed
- Social post embed
- File-download link
- Document link
- Map or general service-area block
- FAQ block
- Quote block
- Announcement
- Countdown
- Event card
- Calendar link
- Product card
- Service card
- Donation link
- Booking link
- Newsletter signup
- Contact form
- Poll in a later phase
- Custom embed with strict safety restrictions

### 6. Modular profile sections

Users could enable only the modules needed for a specific profile.

- About
- Links
- Social profiles
- Featured content
- Creator content
- Live Activity
- Availability
- Business hours
- Education
- Degree progress
- Coursework
- Work experience
- Volunteer experience
- Projects
- Case studies
- Skills
- Skill evidence
- Certifications
- Achievements
- Resume
- Publications
- Services
- Products
- Events
- Contact
- Technology
- Creator recommendations
- Custom links
- Custom text sections

### 7. Themes and visual customization

- Light theme
- Dark theme
- Match-device theme
- Clear glass theme
- Tinted glass theme
- Onyx theme
- Minimal theme
- Professional theme
- Creator theme
- Academic theme
- Technical portfolio theme
- Custom accent color
- Curated color palettes
- Background color
- Gradient background
- Background image
- Video background only if performance and accessibility rules are met
- Button style
- Button radius
- Button shadow
- Button border
- Font choice from an approved library
- Text alignment
- Profile-image shape
- Cover layout
- Section card style
- Spacing density
- Animation preference
- Reduced-motion override
- High-contrast compatibility
- Theme preview
- Reset theme
- Save theme preset
- Duplicate profile design

### 8. Responsive public profiles

- Extra-small phone support
- Standard phone support
- Large-phone support
- Foldable support
- Tablet portrait support
- Tablet landscape support
- Laptop support
- Desktop support
- Large-display support
- Split-screen support
- Short landscape support
- Touch support
- Mouse support
- Trackpad support
- Keyboard support
- Safe-area support
- Dynamic viewport-height support
- Orientation-change handling
- Responsive images
- Lazy loading
- Reduced-data options where practical

### 9. Shared Onyx navigation

- Role-aware destinations
- Active liquid lens
- Tap and click navigation
- Hold-and-drag navigation
- Nearest-item targeting
- Release snapping
- Keyboard navigation
- Safe-area handling
- Reduced-motion behavior
- High-contrast behavior
- Responsive item widths
- Overflow handling
- Settings-only gear animation
- Profile-level navigation
- Dashboard-level navigation
- Optional desktop sidebar for complex dashboards

Potential signed-out dock:

```text
Home
Explore
Templates
About
Sign In
```

Potential signed-in user dock:

```text
Dashboard
Profile
Links
Analytics
Settings
```

Potential employer dock in a later phase:

```text
Dashboard
Organization
Postings
Candidates
Settings
```

### 10. Link-in-bio analytics

- Profile views
- Unique-visitor estimates using privacy-conscious methods
- Total link clicks
- Click-through rate
- Per-link clicks
- Daily, weekly, and monthly trends
- Referring source
- General device category
- Browser category
- Operating-system category
- General country or region only where legally and technically appropriate
- Peak activity periods
- Most popular links
- Least-used links
- Scheduled-link performance
- QR-code traffic
- Exportable analytics in later plans
- Analytics retention controls
- Owner-only analytics
- Clear analytics disclosures
- Bot and obvious-spam filtering
- Do Not Track and consent considerations

Analytics must avoid collecting more information than necessary and must not expose individual visitors to profile owners.

### 11. QR codes and sharing

- Profile QR code
- Individual-link QR code
- Downloadable PNG or SVG where supported
- Share sheet
- Copy-profile-link button
- Copy-link feedback
- Social sharing cards
- Open Graph metadata
- Custom social preview image
- Profile title and description metadata
- Search-engine indexing toggle
- Canonical profile URL
- Shareable profile badge
- Printable mini profile card in a later phase

### 12. Contact and audience growth

- Public contact form
- Contact reason selector
- Spam protection
- Rate limiting
- Email-delivery backend
- Message dashboard
- Message archive
- Message deletion
- Block sender
- Newsletter signup integrations
- Downloadable contact card
- Public email visibility options
- Business inquiry status
- Collaboration status
- Academic availability
- Booking service integrations
- Lead labels in a later phase

Direct messaging between platform users should not be added until moderation and anti-harassment systems are ready.

### 13. Live Activity and integrations

- Optional Discord profile synchronization
- Discord presence
- Spotify activity
- PreMiD activity
- Manual status
- Activity artwork
- Activity progress
- Explicit-content indicator when available
- Dynamic accent extraction
- Manual accent fallback
- Last-updated metadata
- Per-integration privacy controls
- Disable integration instantly
- Data-source disclosure
- Integration error state
- Manual fallback identity

No user should be required to connect an external account to create a profile.

### 14. Business profile features

- Business name
- Business description
- Service categories
- General service area
- Contact methods
- Regular hours
- Multiple daily hour ranges
- Holiday hours
- Temporary hours
- Manual availability override
- Current status
- Next-open time
- Visitor-local timezone conversion
- Booking links
- Menu or service links
- Product links
- Map link
- Business verification in a later phase
- Team access in a later phase

### 15. Education and academic portfolio

- Institution
- College
- Current program
- Intended program
- Major
- Minor
- Concentration
- Academic year
- Enrollment status
- Current term
- Expected graduation
- Degree name
- Required credits
- Completed credits
- Planned credits
- Degree progress
- Requirement groups
- Semesters
- Courses
- Course credits
- Course statuses
- Standard Letter grading
- Grade / No Credit grading
- Pass / No Credit grading
- Satisfactory / Unsatisfactory grading
- Audit outcomes
- Transfer outcomes
- Custom grading
- Semester GPA
- Cumulative GPA
- GPA visibility
- Grade visibility
- Current-semester dashboard
- Course search
- Course filters
- Timeline and program history
- Goals and milestones
- Academic roadmap
- Planned coursework
- Achievements
- Certifications
- Project case studies
- Skills and evidence
- Transfer credits
- Unofficial summary export
- Degree-audit disclaimer
- Institution-verification status if verification is added later

Exact schedules, room locations, student IDs, private course links, and private academic records must not be public-profile fields.

### 16. Resume and career portfolio

- Professional headline
- Summary
- General location
- Public contact options
- Education
- Experience
- Volunteer experience
- Projects
- Skills
- Certifications
- Achievements
- Languages
- Publications
- Services
- Portfolio links
- Resume PDF link
- Browser print layout
- PDF export
- Multiple resume variants in a later phase
- Public and private resume modes
- Profile-to-resume synchronization
- Resume section ordering
- Hide selected dates or details

### 17. Projects and case studies

- Project title
- Project image
- Project status
- Date range
- Description
- Problem
- Goal
- Role
- Technologies
- Skills
- Features
- Challenges
- Solutions
- Learning outcomes
- Reflection
- Future improvements
- Repository link
- Live project link
- Documentation link
- Course connection
- Employer or organization connection
- Team attribution
- Public/private visibility
- Featured-project status

### 18. Skills and evidence

- Skill name
- Category
- Proficiency level
- Description
- Years or period used when voluntarily provided
- Last-used date
- Connected projects
- Connected courses
- Connected experience
- Connected certifications
- Connected achievements
- Evidence links
- Self-reported status
- Verified status
- Endorsements only if abuse protections are implemented

Evidence labels:

- Self-reported
- Portfolio-supported
- Issuer-verified
- Institution-verified
- Employer-verified
- Platform-verified

### 19. Certifications and achievements

- Credential name
- Issuer
- Issue date
- Expiration date
- Status
- Public verification URL
- Related skills
- Related projects
- Renewal reminder
- Private credential ID
- Achievement title
- Achievement type
- Awarding organization
- Date
- Description
- Supporting link
- Verification status

Private candidate IDs, examination receipts, and unredacted personal documents must not be public.

### 20. Creator features

- Creator profile type
- Social-channel links
- Featured videos
- Featured music
- Featured posts
- Creator shoutouts
- Collaboration availability
- Sponsorship inquiry link
- Media kit link
- Store link
- Donation link
- Affiliate disclosure
- Content schedule links
- Audience analytics
- Creator-specific templates

### 21. Profile editor

- Add section
- Remove section
- Hide section
- Publish section
- Save as draft
- Reorder sections
- Duplicate section
- Add item
- Edit item
- Duplicate item
- Reorder item
- Archive item
- Delete item
- Undo recent edit where feasible
- Autosave with clear feedback
- Manual save
- Last-saved timestamp
- Unsaved-change warning
- Validation center
- Mobile preview
- Tablet preview
- Desktop preview
- Light preview
- Dark preview
- High-contrast preview
- Public visitor preview
- Search-engine preview

### 22. Profile privacy

Visibility levels may include:

- Public
- Registered users
- Connections only in a later phase
- Employers only in a later phase
- Unlisted
- Private

Privacy controls should apply to:

- Entire profile
- Individual section
- Individual item
- Contact fields
- Location
- Education dates
- Grades and GPA
- Availability
- Live activity
- Analytics
- Search indexing
- Profile discovery

### 23. Search and discovery

- Search by username
- Search by display name
- Search by profile type
- Search by skill
- Search by project technology
- Search by education area
- Search by career interest
- Search by general location if users opt in
- Search by availability
- Suggested profiles
- Trending public profiles only with anti-gaming controls
- New-profile discovery
- Category directories
- Search visibility toggle
- Blocked-user exclusion
- Reported-content suppression

Search must never expose private or unlisted profiles.

### 24. Templates

- Simple Links
- Creator
- Student
- Graduate
- Job Seeker
- Developer
- Freelancer
- Small Business
- Musician
- Artist
- Organization
- Event
- Academic Portfolio
- Resume Portfolio
- Onyx Showcase

Templates should provide starting layouts, not lock users into one structure.

### 25. Notifications

- Account verification
- Password reset
- Security alert
- Profile published
- Link error
- Scheduled link started
- Scheduled link ended
- Contact-form message
- Credential expiration reminder
- Moderation notice
- Verification update
- Product announcement
- Optional analytics summary

Notification channels may include:

- In-app
- Email
- Browser push after permission

### 26. Subscription and plan possibilities

A free version should remain useful. Potential plans may include:

- Free
- Supporter
- Creator
- Professional
- Organization

Potential paid features, if monetization is introduced:

- More analytics history
- Additional themes
- Custom domains
- More profile variants
- Team access
- Advanced scheduling
- Export formats
- Custom branding removal
- Organization tools
- Priority support

Core accessibility, privacy, account deletion, and security features must not be paywalled.

### 27. Organization and team features

- Organization profile
- Organization verification
- Logo and branding
- Public description
- Website and social links
- Team members
- Role-based access
- Owner
- Administrator
- Editor
- Analyst
- Recruiter in a later phase
- Shared link pages
- Approval workflow
- Audit history
- Organization analytics
- Member removal
- Ownership transfer

### 28. Trust, safety, and moderation

- Report profile
- Report link
- Report organization
- Report impersonation
- Report scam
- Report spam
- Report malicious content
- Block profile
- Suspend account
- Remove content
- Warn account
- Appeal moderation
- Moderator notes
- Moderator audit trail
- Automated rate limits
- Link scanning
- File-type restrictions
- Upload-size restrictions
- Image moderation
- Username abuse prevention
- Reserved brand and institutional names
- Repeat-offender controls
- Emergency platform shutdown controls

### 29. Security architecture

- Firebase Authentication
- Email verification
- Strong Firestore Security Rules
- App Check where appropriate
- Cloud Functions or another trusted backend
- Server-side username reservation
- Server-side role changes
- Server-side organization verification
- Server-side moderation actions
- Rate limiting
- Audit logs
- Secure file uploads
- Content Security Policy
- Referrer policy
- Permission policy
- XSS prevention
- URL sanitization
- Safe external-link handling
- Dependency review
- Backup plan
- Restore testing
- Incident response plan
- Administrative multi-factor authentication

### 30. Data architecture

Private account records:

```text
users/{uid}
users/{uid}/private/settings
users/{uid}/private/sessions
users/{uid}/private/notifications
```

Public profiles:

```text
profiles/{uid}
profiles/{uid}/links/{linkId}
profiles/{uid}/socials/{socialId}
profiles/{uid}/blocks/{blockId}
profiles/{uid}/education/{educationId}
profiles/{uid}/courses/{courseId}
profiles/{uid}/experience/{experienceId}
profiles/{uid}/projects/{projectId}
profiles/{uid}/skills/{skillId}
profiles/{uid}/certifications/{certificationId}
profiles/{uid}/achievements/{achievementId}
```

Platform records:

```text
usernames/{normalizedUsername}
organizations/{organizationId}
opportunities/{opportunityId}
reports/{reportId}
verifications/{verificationId}
audit_logs/{eventId}
feature_flags/{flagId}
```

Analytics may require a separate privacy-conscious event pipeline rather than unrestricted client-written counters.

### 31. Import, export, and portability

- Import links from a structured file
- Import profile backup
- Export JSON backup
- Export link list as CSV
- Export resume as PDF
- Export academic summary
- Export analytics where available
- Download uploaded media
- Full account-data export
- Delete imported data
- Migration tools for future architecture changes

### 32. Progressive Web App support

- Installable app experience
- Offline shell
- Cached public profile where appropriate
- Update notice
- Background sync only where safe
- Push notifications after consent
- App icons
- Theme colors
- Share target in a later phase
- Shortcut actions

### 33. Administration systems

Platform administrators would need a separate interface for:

- User search
- Profile review
- Organization review
- Username management
- Verification requests
- Reports
- Appeals
- Suspensions
- Feature flags
- Platform announcements
- Template management
- Analytics health
- System status
- Audit logs
- Data migration
- Security incidents
- Backup checks

The current BusArmyDude.org Admin Portal should remain dedicated to the personal website until a separate user dashboard and platform-administration system exist.

### 34. Rebranding and coexistence

The platform could begin as an experimental section of BusArmyDude.org:

```text
busarmydude.org/profiles
profiles.busarmydude.org
```

A separate brand and domain should be considered before broad public release because:

- The platform would serve many users rather than one profile.
- A neutral name may be easier to trust and share.
- Legal documents would need to describe the platform separately.
- Search, account, and organization features would need clearer product branding.
- BusArmyDude.org could remain the founder's personal profile and showcase account.

The rebrand should not happen until the profile-platform alpha demonstrates that the concept is sustainable.

---

## Potential Career and Opportunity Platform

After multi-user profiles become stable, the platform could expand into opportunities and career discovery.

### Potential opportunity types

- Jobs
- Internships
- Co-ops
- Campus positions
- Freelance projects
- Volunteer opportunities
- Mentorship opportunities
- Student organizations
- Hackathons
- Competitions

### Initial opportunity features

- Organization profile
- Opportunity title
- Opportunity type
- Location or remote status
- Required skills
- Preferred skills
- Education expectations
- Experience level
- Compensation visibility
- Description
- Deadline
- External application link
- Verification status
- Reporting controls

### Explainable matching

Profile-to-opportunity matching should explain:

- Which listed skills match
- Which projects support those skills
- Which credentials apply
- Which stated requirements are missing
- Whether information is self-reported or verified

The platform should avoid unexplained qualification percentages.

### Later high-complexity features

- Internal applications
- Application status tracking
- Direct messaging
- Interview scheduling
- Candidate pipelines
- Document exchange
- Employer analytics

These features require a trusted backend, stronger moderation, anti-spam controls, legal review, secure storage, audit logs, and clearer data-retention policies.

### Moderation and trust requirements

- Profile reporting
- Opportunity reporting
- Employer verification
- Organization verification
- Impersonation reporting
- Scam reporting
- Spam protection
- Rate limiting
- Link safety checks
- Account suspension
- Content removal
- Appeals
- Moderator audit history
- Role-based access enforced by trusted systems

---

## Estimated Development Timeline

The following estimate assumes one primary developer working part-time while beginning college. It is intentionally conservative. Security, privacy, moderation, design, school responsibilities, hosting changes, and testing could move dates later.

### Phase 0 — Stabilize the personal website

**Estimated duration:** 1–2 months  
**Working window:** July through September 2026

- Complete v27.0 testing
- Stabilize the new Education page
- Finish mobile, tablet, foldable, and desktop testing
- Keep Onyx dock behavior consistent
- Correct documentation
- Publish v27.0
- Complete or rescope the planned September visual revamp

### Phase 1 — Link-in-bio platform foundation

**Estimated duration:** 2–3 months  
**Working window:** October through December 2026

- Separate private account data from public profile data
- Design the multi-user Firestore model
- Create username reservation logic
- Create registration and onboarding
- Build the reusable public-profile renderer
- Build the basic link editor
- Add link ordering and visibility
- Add themes and profile preview
- Create initial security rules

### Phase 2 — Internal alpha

**Estimated duration:** 2–3 months  
**Working window:** January through March 2027

- Public profile URLs
- Profile identity
- Social links
- Content blocks
- QR codes
- Basic analytics
- Link scheduling
- Responsive profile dashboard
- Account export and deletion
- Internal testing with a small number of accounts

### Phase 3 — Expanded profile alpha

**Estimated duration:** 3–4 months  
**Working window:** April through July 2027

- Education module
- Resume module
- Project case studies
- Skills and evidence
- Certifications and achievements
- Business hours and availability
- Live Activity integrations
- Additional templates
- Per-section privacy
- Validation center

### Phase 4 — Closed beta

**Estimated duration:** 3–5 months  
**Working window:** August through December 2027

- Invite system
- Profile discovery
- Search
- Reporting
- Blocking
- Moderation dashboard
- Link safety checks
- Improved analytics
- Performance testing
- Accessibility audit
- Backup and restore testing
- Terms, privacy, and acceptable-use documentation

### Phase 5 — Public link-in-bio beta

**Estimated duration:** 3–5 months  
**Working window:** January through May 2028

- Public signup if safety systems are ready
- Stable username and profile routing
- Public templates
- Contact forms
- Optional integrations
- PWA improvements
- Account recovery refinements
- Support documentation
- Migration and incident-response plans

### Phase 6 — Stable multi-user profile platform

**Estimated duration:** 2–4 additional months  
**Working window:** Summer or Fall 2028

- Stabilize the beta
- Resolve security and abuse issues
- Finalize profile portability
- Improve moderation and appeals
- Finalize a separate brand if needed
- Publish the first stable multi-user platform release

### Phase 7 — Organizations and opportunities

**Estimated duration:** 6–12 additional months  
**Earliest working window:** Late 2028 through 2029

- Organization accounts
- Team permissions
- Organization verification
- Job, internship, and co-op listings
- Saved opportunities
- Explainable profile matching
- External applications
- Scam reporting

### Phase 8 — Internal career-platform workflows

**Estimated duration:** 9–18 additional months  
**Earliest realistic window:** 2029 or later

- Internal applications
- Candidate pipelines
- Messaging
- Interview scheduling
- Document exchange
- Extended moderation
- Data-retention systems
- Employer analytics

### Updated rough-duration summary

- **Basic multi-user link-in-bio prototype:** 3–6 months after active work begins
- **Internal alpha:** 6–9 months
- **Feature-rich closed beta:** 10–16 months
- **Public beta:** 16–22 months
- **Stable link-in-bio platform:** 20–28 months
- **Organization and external opportunity tools:** 28–40 months
- **Full career-platform workflows:** 36–54+ months

### Earliest plausible release windows

- **Personal-site v27.0:** Late July through September 2026
- **Platform foundation preview:** December 2026 through March 2027
- **Invite-only profile alpha:** Spring or Summer 2027
- **Closed link-in-bio beta:** Late 2027
- **Public link-in-bio beta:** Early or mid-2028
- **Stable multi-user link-in-bio platform:** Summer or Fall 2028
- **Opportunity beta:** 2029
- **Advanced job-platform features:** 2029–2030 or later

A deliberately smaller MVP containing accounts, usernames, links, themes, privacy, QR codes, and basic analytics could be released earlier than the complete platform described above.

---

## Proposed Version Plan

The following version sequence is provisional.

### v27.0 — Personal website stable release

**Rough target:** Late July through September 2026

- Current profile and Live Activity improvements
- Discord synchronization
- Creator-card improvements
- Onyx navigation dock
- Resume appearance integration
- Education page if stable
- Responsive and accessibility fixes

### v27.1 — Education and stability update

**Rough target:** September or October 2026

- Education refinements
- Degree-progress corrections
- Semester and course improvements
- Responsive top-bar refinements
- Onyx dock consistency
- Post-v27.0 bug fixes

### v27.5 — Platform foundation preview

**Rough target:** December 2026 through March 2027

- Experimental multi-user data model
- Registration prototype
- Username prototype
- Reusable public profiles
- Basic link editor
- Themes and profile preview
- Private technical preview

### v28.0-alpha.1 — Multi-user link-in-bio alpha

**Rough target:** Spring or Summer 2027

- Accounts
- Usernames
- Public profile URLs
- Profile identity
- Links
- Social icons
- Themes
- QR codes
- Basic analytics
- Privacy controls

### v28.0-alpha.2 — Advanced profile modules

**Rough target:** Summer 2027

- Education
- Resume
- Experience
- Projects
- Skills and evidence
- Certifications
- Achievements
- Availability
- Additional templates

### v28.0-beta.1 — Closed beta

**Rough target:** Late 2027

- Invited testers
- Discovery and search
- Reporting and blocking
- Moderation dashboard
- Link safety
- Improved analytics
- Data export and deletion

### v28.0-beta.2 — Public beta

**Rough target:** Early or mid-2028

- Public registration if ready
- Stable routing
- Contact forms
- PWA refinements
- Improved support and recovery
- Broader performance and accessibility testing

### v28.0 — Stable multi-user link-in-bio platform

**Rough target:** Summer or Fall 2028

- Stable modular profiles
- Reliable privacy controls
- Profile discovery
- Analytics
- Moderation
- Account portability
- Finalized platform identity or rebrand

### v29.0-alpha / beta — Organizations and opportunities

**Rough target:** 2029

- Organization accounts
- Team roles
- Verification
- Jobs, internships, and co-ops
- Saved opportunities
- External applications
- Explainable matching

### v30.0 or later — Career-platform workflows

**Rough target:** 2029–2030 or later

- Internal applications
- Messaging
- Interview scheduling
- Candidate pipelines
- Document exchange
- Employer analytics
- Expanded audit and compliance tools

A separate brand or repository may reset or alter this version sequence.

---

## Release Roadmap

### Current roadmap

- **v26.5** — Current stable website
- **v26.6-beta.1** — Original partial revamp preview
- **v26.6-beta.2** — Business and academic availability improvements
- **v26.6-beta.3** — Retired-feature cleanup
- **v26.6-beta.4** — Responsive Onyx navigation dock
- **v27.0-rc.1** — Current release candidate
- **v27.0** — Next planned stable personal-site release
- **v27.1** — Proposed Education and post-release refinement release
- **v27.5** — Possible platform-foundation preview
- **v28.x** — Proposed multi-user profile platform
- **v29.x** — Proposed organization and opportunity features
- **v30.x or later** — Possible advanced career-platform features

The roadmap may change if additional release candidates, security changes, hosting changes, or scope reductions are needed.

---

## Version History

### v27.0-rc.1

Current release candidate. Promotes completed v26.6 beta work into the v27.0 release track and includes Profile spacing and styling updates, Live Activity refinements, dynamic song accents, Discord display-name, avatar, and status synchronization, creator-card updates, device-information updates, CSS cleanup, release documentation, and final compatibility testing.

### v26.6-beta.4

Added the responsive Onyx liquid-glass navigation dock, inline SVG icons, active-lens movement, press-and-drag navigation, release snapping, balanced spacing, touch improvements, reduced-motion support, high-contrast support, and Resume appearance integration.

### v26.6-beta.3

Removed retired FAQ, Posts, Blog, President, Legislation, Quote of the Day, Latest TikTok embed, Onyx AI assistant, and Project Goal Tracker functionality along with obsolete references and code.

### v26.6-beta.2

Updated Business Status and Hours, improved academic availability, added smarter recurring-class labels, and corrected ended-class behavior.

### v26.6-beta.1

Introduced the partial beta revamp preview, continued liquid-glass and Onyx refinements, and added early roadmap notes.

### v26.5

Current stable release. Updated device information and creator shoutout sections and continued liquid-glass refinement.

### Earlier milestones

- **v26.1.2** — Appearance settings and match-device themes
- **v1.17.0** — Bug fixes
- **v1.16.0** — Admin Portal
- **v1.15.0** — General fixes and improvements
- **v1.14.0** — Theme and performance improvements
- **v1.13.0** — Focus-outline and accessibility improvements
- **v1.12.0** — Merch-store access through Useful Links
- **v1.11.0** — Settings page, font changes, appearance modes, and factory reset
- **v1.10.1** — Current-day highlighting and theme improvements
- **v1.10.0** — Event calendar and fixes
- **v1.9.0** — TikTok shoutouts, tech information, disabilities, version information, and notices
- **v1.8.0** — RedNote support and general enhancements
- **v1.7.0** — Copying and media-saving deterrents
- **v1.6.0** — Instagram and YouTube shoutouts
- **v1.5.0** — Bug fixes and improvements

---

## Removed and Retired Features

The following features were removed because the features were no longer needed or did not match the planned direction:

- FAQ section
- Posts system
- Blog list and individual blog logic
- President information
- Legislation tracker
- Quote of the Day
- Custom quote tools
- Latest TikTok embed
- Onyx AI assistant
- Project Goal Tracker

Cleanup included:

- Unused Firestore references
- Retired realtime listeners
- Obsolete initialization calls
- Feature-specific CSS
- AI chat script references
- Retired routing logic
- Unused frontend helpers

The main TikTok, Instagram, and YouTube creator shoutouts remain active. Device AI compatibility information remains active because the feature evaluates device capabilities and is not an interactive assistant.

---

## Conclusion

BusArmyDude.org is currently a personal digital identity, availability, academic, resume, technology, accessibility, and content-management website.

The existing system has the foundation for a future multi-user profile platform, especially through:

- Modular public content
- Education and degree progress
- Projects and case studies
- Skills and evidence
- Resume support
- Firebase Authentication and Firestore
- Appearance and accessibility controls
- Responsive Onyx navigation
- An established Admin Portal

The recommended strategy is to keep BusArmyDude.org stable as a personal website while building a separate multi-user link-in-bio foundation. The first public product should focus on usernames, links, social profiles, themes, responsive pages, privacy, QR codes, and analytics. Advanced education, resume, project, and evidence modules can follow. Employers, opportunities, applications, and messaging should come much later.

The shortest realistic future product is a modular profile builder. A trustworthy job and opportunity platform would be a multi-year project requiring stronger backend infrastructure, privacy controls, account security, moderation, role enforcement, verification, abuse prevention, and careful testing.

Thanks for visiting and following the project’s development.
