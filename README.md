# BusArmyDude.org

[![Version](https://img.shields.io/badge/version-v27.0--rc.1-blue)](#current-version)
[![Build](https://img.shields.io/badge/build-2026.07.17-purple)](#current-version)
[![Release Track](https://img.shields.io/badge/release%20track-Release%20Candidate-orange)](#release-roadmap)
[![Current Stable](https://img.shields.io/badge/current%20stable-v26.5-green)](#version-history)
[![Next Stable](https://img.shields.io/badge/next%20stable-v27.0-yellow)](#release-roadmap)
[![JavaScript](https://img.shields.io/badge/JavaScript-45.0%25-f1e05a)](#coding-languages-and-technologies)
[![CSS](https://img.shields.io/badge/CSS-36.2%25-663399)](#coding-languages-and-technologies)
[![HTML](https://img.shields.io/badge/HTML-18.9%25-e34c26)](#coding-languages-and-technologies)

BusArmyDude.org is a responsive personal profile, link-in-bio, live-status, availability, academic portfolio, resume, technology information, accessibility, and content-management website.

The project currently operates as a single-owner public website with an authenticated Admin Portal. A future multi-user profile platform is under consideration. That future direction could allow students, graduates, job seekers, professionals, creators, freelancers, employers, and educational organizations to create modular career and academic profiles.

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
- [Future Multi-User Profile Platform](#future-multi-user-profile-platform)
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

## Future Multi-User Profile Platform

A future product direction is to transform selected systems into a reusable, multi-user career and academic profile platform.

### Product concept

> Create a living career profile that connects education, projects, experience, skills, credentials, and evidence.

### Potential users

- Students
- Graduates
- Job seekers
- Professionals
- Creators
- Freelancers
- Employers
- Educational organizations

### Potential individual profile modules

- Public identity
- Biography
- Education
- Degree progress
- Courses
- Work experience
- Volunteer experience
- Projects
- Project case studies
- Skills
- Skill evidence
- Certifications
- Achievements
- Career goals
- Resume
- Availability
- Social and professional links
- Appearance preferences
- Accessibility preferences
- Section-level privacy

### Profile types

- Student
- Graduate
- Job Seeker
- Professional
- Creator
- Freelancer
- Employer
- Organization

### Example profile routes

A GitHub Pages prototype may initially use:

```text
/profile.html?user=username
```

A future hosting environment with route rewrites could support:

```text
/username
/profiles/username
```

### Modular layouts

Potential layouts include:

- Academic
- Professional
- Technical
- Creative
- Minimal
- Detailed

Users could enable, disable, reorder, hide, publish, or save sections as drafts.

### Evidence-connected skills

Skills should connect to evidence such as:

- Courses
- Projects
- Certifications
- Employment
- Volunteer experience
- Publications
- Portfolio work

Evidence status must be clear:

- Self-reported
- Portfolio-supported
- Issuer-verified
- Institution-verified
- Employer-verified
- Platform-verified

A self-reported item must never receive a misleading verification badge.

### Suggested Firestore architecture

Private account data:

```text
users/{uid}
users/{uid}/private/settings
users/{uid}/private/sessions
```

Public profile data:

```text
profiles/{uid}
profiles/{uid}/education/{educationId}
profiles/{uid}/courses/{courseId}
profiles/{uid}/experience/{experienceId}
profiles/{uid}/projects/{projectId}
profiles/{uid}/skills/{skillId}
profiles/{uid}/certifications/{certificationId}
profiles/{uid}/achievements/{achievementId}
profiles/{uid}/links/{linkId}
```

Platform data:

```text
organizations/{organizationId}
opportunities/{opportunityId}
reports/{reportId}
verifications/{verificationId}
audit_logs/{eventId}
```

Public profile documents and private account documents must remain separate.

### User dashboard

A normal user dashboard could contain:

- Dashboard
- My Profile
- Education
- Experience
- Projects
- Skills
- Certifications
- Achievements
- Resume
- Privacy
- Appearance
- Account

### Platform administration

A separate platform-administration system could contain:

- Platform overview
- Users
- Profiles
- Organizations
- Opportunities
- Reports
- Moderation
- Verification
- Announcements
- Feature flags
- Audit logs
- Platform settings

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

The following timeline is a rough planning estimate for one primary developer working part-time while attending college. It is not a guaranteed schedule. Scope changes, testing, school commitments, security work, hosting changes, and backend requirements could extend the schedule substantially.

### Stage 0 — Finish current personal-site release

**Estimated duration:** 2–6 weeks

**Possible window:** July through September 2026

Includes:

- Complete v27.0 release-candidate testing
- Stabilize the Education page
- Finish responsive testing
- Correct documentation
- Release v27.0
- Complete the broader September 2026 visual revamp if retained in scope

### Stage 1 — Multi-user architecture prototype

**Estimated duration:** 2–4 months

**Possible window:** September 2026 through January 2027

Includes:

- Separate public and private user data
- Account model
- Username model
- Onboarding
- Reusable profile renderer
- Basic profile editor
- Public/private profile states
- Basic security-rule redesign

### Stage 2 — Profile-platform alpha

**Estimated duration:** 3–5 additional months

**Possible window:** January through June 2027

Includes:

- Education
- Experience
- Projects
- Skills
- Certifications
- Achievements
- Resume
- Section ordering
- Privacy controls
- Public preview
- Profile themes
- Evidence-connected skills
- Account export and deletion

### Stage 3 — Closed beta and discovery

**Estimated duration:** 3–6 additional months

**Possible window:** June through December 2027

Includes:

- Limited invitations
- Profile search
- Skill search
- Discoverability controls
- Abuse reporting
- Moderation tools
- Profile quality checks
- Performance testing
- Accessibility audits
- Data migration testing

### Stage 4 — Opportunity listings beta

**Estimated duration:** 4–8 additional months

**Possible window:** Late 2027 through mid-2028

Includes:

- Organization profiles
- Employer onboarding
- External job, internship, and co-op links
- Opportunity search
- Saved opportunities
- Explainable skill matching
- Organization verification
- Scam and link reporting

### Stage 5 — Applications and communication

**Estimated duration:** 6–12 additional months

**Earliest realistic window:** 2028 or later

Includes:

- Internal applications
- Candidate pipelines
- Direct communication
- Interview scheduling
- Application documents
- Notification delivery
- Stronger moderation
- Audit history
- Data-retention controls

### Overall rough estimate

- **Reusable multi-user prototype:** approximately 2–4 months after active development begins
- **Usable profile-platform alpha:** approximately 5–9 months
- **Closed or public profile beta:** approximately 8–15 months
- **Opportunity-listing beta:** approximately 15–24 months
- **Mature job-platform capabilities:** approximately 24–36+ months

A smaller release containing only public profiles, education, projects, skills, and privacy could launch sooner. A trustworthy job platform with employers, moderation, applications, and messaging would take much longer.

---

## Proposed Version Plan

The version plan below is provisional and may change.

### v27.0 — Personal-site stable release

**Rough target:** Late July 2026, subject to testing

Potential scope:

- Promote current release-candidate work
- Finalize Profile and Live Activity refinements
- Keep Discord synchronization
- Keep creator-card improvements
- Keep Onyx dock
- Stabilize Resume integration
- Include the Education page if ready for stable release

### v27.1 — Education and post-release refinements

**Rough target:** August or September 2026

Potential scope:

- Education portfolio refinements
- University of Toledo academic data support
- Improved requirement tracking
- Responsive top-navigation improvements
- Dock consistency
- Accessibility corrections
- Post-v27.0 bug fixes

### v27.5 — Platform foundation preview

**Rough target:** Late 2026 or early 2027

Potential scope:

- Experimental account architecture
- Internal reusable profile components
- Public/private data separation
- Username proof of concept
- Profile route prototype
- No employer or opportunity features

This version may remain an internal or invite-only technical preview.

### v28.0-alpha — Multi-user profiles

**Rough target:** Spring or Summer 2027

Potential scope:

- User registration
- Onboarding
- Unique usernames
- Public and private profiles
- Education
- Experience
- Projects
- Skills
- Certifications
- Achievements
- Resume
- Profile privacy
- Profile preview

### v28.0-beta — Profile discovery

**Rough target:** Late 2027

Potential scope:

- Invite or public beta
- Profile discovery
- Search
- Evidence-connected skills
- Reporting
- Moderation
- Profile themes
- Account export and deletion

### v28.0 — Multi-user profile platform stable release

**Rough target:** Late 2027 or 2028

Potential scope:

- Stable modular profiles
- Strong privacy controls
- Search and discovery
- Moderation workflows
- Accessible and responsive dashboards
- Reusable Onyx navigation

### v29.0-alpha or v29.0-beta — Opportunities

**Rough target:** 2028

Potential scope:

- Organization profiles
- Employer onboarding
- Job, internship, and co-op listings
- External application links
- Saved opportunities
- Explainable profile matching
- Verification and scam reporting

### v30.0 or later — Full career platform

**Rough target:** 2028–2029 or later

Potential scope:

- Internal applications
- Messaging
- Interview scheduling
- Candidate pipelines
- Advanced organization controls
- Application document handling
- Expanded compliance, moderation, and audit systems

> Version numbers represent planning ideas, not commitments. A future rebrand or separate repository may use a different version sequence.

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

The recommended strategy is to keep BusArmyDude.org stable as a personal website while developing reusable profile architecture separately. Multi-user profiles should come before employers, opportunity listings, applications, or messaging.

The shortest realistic future product is a modular profile builder. A trustworthy job and opportunity platform would be a multi-year project requiring stronger backend infrastructure, privacy controls, account security, moderation, role enforcement, verification, abuse prevention, and careful testing.

Thanks for visiting and following the project’s development.
