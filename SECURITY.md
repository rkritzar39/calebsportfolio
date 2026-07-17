# Security Policy

## Overview

This repository contains a static GitHub Pages website that uses client-side HTML, CSS, JavaScript, Firebase services, and selected third-party APIs.

Security-sensitive controls are enforced through platform configuration, Firebase Authentication, Firestore Security Rules, restricted administrative access, dependency maintenance, and responsible vulnerability disclosure. Client-side interface restrictions are treated only as deterrents and are not considered security boundaries.

## Current Security Status

| Attribute | Details |
| :--- | :--- |
| **Current Stable Version** | v26.5 |
| **Current Release Candidate** | v27.0-rc.1 |
| **Release Candidate Build** | 2026.07.17 |
| **Release Track** | Release Candidate |
| **Development Status** | Release candidate development and testing in progress |
| **Next Stable Release** | v27.0 |
| **Target Release** | Late July 2026 |

## Supported Versions

Security fixes are prioritized for the current stable release and the active release candidate.

| Version | Status | Security Support |
| :--- | :--- | :---: |
| **v27.0-rc.1** | Current release candidate | :white_check_mark: |
| **v26.5** | Current stable release | :white_check_mark: |
| **v26.6-beta.x** | Superseded beta builds | :x: |
| **v26.1.2 and earlier** | Unsupported | :x: |

The release candidate may change during testing. Users who require the most predictable experience should continue using v26.5 until v27.0 is formally released.

---

## Security Architecture

### 1. Static GitHub Pages Hosting

The public website is hosted as a static GitHub Pages site.

The public repository may contain browser-delivered HTML, CSS, JavaScript, images, icons, manifests, and other static assets. Any content shipped to the browser must be treated as publicly readable.

The repository must not contain:

* Passwords
* Private keys
* Discord client secrets
* Discord bot tokens
* Firebase service-account credentials
* OAuth client secrets
* Private API tokens
* Database administrator credentials
* Signing secrets
* Personal device identifiers that are not intended for public display

Server-only secrets cannot be protected inside a static GitHub Pages deployment. Any feature requiring a confidential credential must use a properly secured external backend or managed serverless function.

### 2. Firebase Security

The website uses Firebase services for supported data and administrative functionality.

Security requirements include:

* Firebase Authentication for restricted administrative access
* Firestore Security Rules that enforce authorization server-side
* Public read access only for data intentionally displayed on the public website
* Restricted write access for authenticated and authorized administrative accounts
* Validation of accepted fields and data types where practical
* Separate treatment of public profile data and restricted management operations
* Periodic review of Firebase Authentication users and providers
* Monitoring of Firestore usage, authentication activity, and unexpected request volume

Firebase web configuration values are delivered to the browser by design. Firebase authorization must rely on Authentication, Security Rules, supported API restrictions, and App Check where configured—not on attempting to hide the Firebase web API key.

### 3. Admin Portal Security

The Admin Portal is intended only for authorized accounts.

Administrative protections should include:

* Firebase Authentication
* Server-enforced Firestore Security Rules
* Authorization checks for every protected write
* No reliance on a hidden URL as an access-control mechanism
* Session and sign-in state checks
* Clear sign-out behavior
* Validation and normalization of submitted data
* Safe handling of external URLs
* Restricted profile, business, academic, creator, tech, and metadata updates
* Review of authentication and Firestore activity after suspicious events

Client-side checks improve the interface but do not replace backend authorization rules.

### 4. Discord and Lanyard Integration

The website can retrieve public Discord profile and presence information through Lanyard.

Supported public information can include:

* Discord display name
* Discord username
* Discord avatar
* Discord presence state
* Spotify activity
* PreMiD activity information

Security requirements include:

* No Discord client secret in public JavaScript
* No Discord bot token in public JavaScript
* No private Discord API credentials in the repository
* Validation of Discord User IDs before requests
* Safe fallback to previously saved public profile values when Lanyard is unavailable
* Separation between public profile synchronization and private account authorization

The current Discord synchronization feature is a public profile and presence lookup. It is not a confidential Discord OAuth authorization-code exchange.

### 5. Public Profile and Device Information

Only information intended for public display should be stored in public-facing records.

The public Profile and Tech Information areas must not expose:

* Private account credentials
* Serial numbers
* IMEI or MEID values
* MAC addresses
* Private IP addresses
* Exact device identifiers
* Recovery codes
* Authentication tokens
* Purchase documents containing private information
* Private location history
* Financial information

Visitor-device detection should remain limited to information reasonably available through the browser and should avoid implying that browser-provided values are verified or tamper-proof.

### 6. External Links and Embedded Content

External links that open a new tab should use:

```html
rel="noopener noreferrer"
```

External URLs should be validated before being saved through the Admin Portal. The website should avoid injecting untrusted HTML into the DOM.

Embedded third-party content, including feedback forms, fonts, icons, and APIs, is subject to the privacy, availability, and security behavior of the corresponding provider.

### 7. Local Storage and Browser Storage

The website uses LocalStorage and SessionStorage for supported preferences and interface state.

Browser storage must not be used for:

* Passwords
* Private authentication credentials
* OAuth client secrets
* Long-lived administrative tokens
* Financial information
* Sensitive personal records

Appearance preferences stored in LocalStorage should be treated as readable and modifiable by scripts running on the same origin. LocalStorage values are not assumed to be encrypted or tamper-proof.

### 8. Content-Saving and Copying Deterrents

The website can include interface behaviors intended to discourage casual copying, such as:

* Context-menu restrictions
* Text-selection restrictions
* Copy-event restrictions
* Drag-and-drop restrictions
* Image-drag restrictions
* Media-control restrictions
* Watermark and copyright notices

These measures are deterrents only. They do not prevent a visitor from inspecting network responses, browser source, cached assets, developer tools, screenshots, or the public GitHub repository.

These measures must not be described as encryption, access control, or guaranteed content protection.

### 9. DOM, CSS, and Interface Integrity

CSS variables, class names, HTML attributes, and client-side DOM changes are not security controls. Visitors can modify client-side presentation in their own browser.

Security decisions must not rely on:

* Hidden elements
* Disabled form controls alone
* Obfuscated JavaScript
* Protected-looking class names
* Client-side role labels
* Client-side status values
* CSS-based visibility

Authorization and data validation must be enforced by Firebase Security Rules or another trusted backend service.

### 10. Dependency and Third-Party Script Security

The project uses browser libraries and services that may include Firebase, Font Awesome, Luxon, SunCalc, Tally, html2pdf.js, Lanyard, and other configured resources.

Maintenance practices should include:

* Keeping dependencies updated
* Reviewing release notes before major upgrades
* Removing unused scripts and retired integrations
* Avoiding untrusted CDN sources
* Pinning dependency versions where practical
* Reviewing Dependabot and GitHub security alerts
* Testing updates before release
* Monitoring third-party outages and breaking API changes

### 11. Progressive Web App and Service Worker Security

If a service worker is enabled, changes should be tested to prevent stale, broken, or unsafe cached assets.

Recommended practices include:

* Versioning caches
* Removing obsolete caches during activation
* Avoiding caching authenticated or sensitive responses
* Using HTTPS
* Verifying update behavior before release
* Providing cache-busting for important CSS and JavaScript updates

### 12. Content Security Policy and Browser Protections

Where compatible with GitHub Pages and the website’s third-party integrations, security headers or equivalent controls should be considered, including:

* Content Security Policy
* Referrer Policy
* Permissions Policy
* MIME-type protections
* Frame restrictions where appropriate

Any policy must be tested carefully because the website currently uses multiple external scripts, APIs, fonts, icons, and embedded content.

---

## Security Features

The project’s meaningful security features and practices include:

* Firebase Authentication for restricted administrative access
* Firestore Security Rules for server-enforced database authorization
* Restricted Admin Portal functionality
* Public and administrative data separation
* Input validation and normalization
* Safe external-link attributes
* No confidential Discord credentials in public code
* No Firebase service-account credentials in public code
* Static HTTPS hosting through GitHub Pages
* Dependency and advisory monitoring
* Responsible vulnerability disclosure
* Public device-information privacy requirements
* Manual fallback behavior for third-party API failures
* Accessibility-aware and reduced-motion-compatible interfaces

---

## Reporting a Vulnerability

Please report suspected vulnerabilities privately.

### Do Not

* Do not create a public GitHub issue containing vulnerability details.
* Do not publicly disclose an unpatched vulnerability.
* Do not access, alter, delete, or download data that does not belong to you.
* Do not attempt to disrupt the website, Firebase project, third-party APIs, or other users.
* Do not perform denial-of-service testing.
* Do not use automated scanning that creates excessive traffic.
* Do not attempt social engineering, phishing, or credential theft.

### Preferred Reporting Method

Use GitHub’s private vulnerability reporting or repository security advisory feature:

[Report a vulnerability privately](https://github.com/BusArmyDude/busarmydude/security/advisories/new)

If private vulnerability reporting is unavailable, contact the repository owner through the GitHub profile listed below and request a private reporting channel without including exploit details publicly.

### Include

Please include as much of the following information as possible:

* Vulnerability type
* Affected page, file, feature, or endpoint
* Affected version or commit
* Steps to reproduce
* Expected behavior
* Actual behavior
* Potential impact
* Proof of concept, if safe and necessary
* Browser, operating system, and device type
* Screenshots or recordings with sensitive information removed
* Suggested remediation, if available

### Response Process

After receiving a report, the maintainer will attempt to:

1. Acknowledge the report.
2. Review and reproduce the issue.
3. Assess severity and affected versions.
4. Develop and test a fix.
5. Coordinate disclosure when appropriate.
6. Publish an update or advisory if necessary.
7. Credit the reporter when requested and appropriate.

Response and remediation times depend on severity, reproducibility, project availability, and third-party dependencies. No specific response time is guaranteed.

---

## Safe Harbor

Security research conducted in good faith and within this policy is welcomed.

Good-faith research should:

* Avoid privacy violations
* Avoid data destruction
* Avoid service disruption
* Use the minimum testing necessary to demonstrate an issue
* Stop immediately if sensitive data is encountered
* Report findings privately
* Allow reasonable time for investigation and remediation before disclosure

This policy does not authorize testing against third-party services such as GitHub, Firebase, Discord, Lanyard, Tally, CDN providers, weather providers, or other external systems. Follow each provider’s own security and acceptable-use policies.

---

## Security Updates

* Security fixes are prioritized according to impact and severity.
* Significant security-related changes may be documented in the Version Information section, repository releases, commit history, or GitHub Security Advisories.
* The current stable version is v26.5.
* The current release candidate is v27.0-rc.1.
* The next stable version is v27.0.
* Unsupported versions may not receive fixes.

---

## Security Best Practices

### For Visitors

* Keep the browser and operating system updated.
* Use a trusted network and device.
* Report suspicious behavior privately.
* Review external destinations before leaving the website.
* Do not enter passwords or private credentials into public feedback forms.
* Grant optional permissions, such as location, only when comfortable doing so.
* JavaScript and cookies may be required for some interactive website features.

For weather features in an in-app browser that blocks location access, opening the website in the device’s regular browser may provide better permission support. Location access remains optional and depends on browser and device settings.

### For Contributors

* Follow secure coding practices.
* Never commit secrets or private credentials.
* Validate and sanitize untrusted data.
* Avoid unsafe HTML injection.
* Use `textContent` for plain text where possible.
* Use safe external-link attributes.
* Keep dependencies updated.
* Review changes for privacy exposure.
* Test Firebase Security Rules.
* Test authentication and authorization behavior.
* Test service-worker and cache behavior.
* Review browser-console errors and failed network requests.
* Use pull requests and code review where practical.
* Report potential vulnerabilities privately.

### For Maintainers

* Enable GitHub private vulnerability reporting.
* Review GitHub security alerts and Dependabot notifications.
* Restrict Firebase web API keys to required Firebase APIs.
* Maintain Firestore Security Rules.
* Consider Firebase App Check for supported services.
* Review authorized Firebase users regularly.
* Monitor Firebase usage and billing alerts.
* Rotate any credential immediately if accidentally exposed.
* Remove secrets from Git history when necessary.
* Keep backups of important configuration and content.
* Test release candidates before promoting them to stable.

---

## Repository Information

* **Repository:** `BusArmyDude/busarmydude`
* **Hosting:** GitHub Pages
* **Current Stable Version:** v26.5
* **Current Release Candidate:** v27.0-rc.1
* **Next Stable Version:** v27.0

### Language Composition

* **JavaScript:** 45.3%
* **CSS:** 37.6%
* **HTML:** 17.1%

Language percentages are based on the current GitHub repository language analysis and may change as files are added, removed, or updated.

---

## Security Contact

For security-related concerns:

* **GitHub:** [@BusArmyDude](https://github.com/BusArmyDude)
* **Private Security Advisory:** [Report a vulnerability](https://github.com/BusArmyDude/busarmydude/security/advisories/new)

Do not include vulnerability details in a public issue, discussion, pull request, social-media post, or public comment.

---

## Acknowledgments

Responsible security researchers help improve the safety and reliability of this project. Reports submitted privately, clearly, and in good faith are appreciated.

Reporter credit may be included in a security advisory or release note when requested and appropriate.

---

## Version Control

This security policy is version **27.0-rc.1** and was last updated on **July 17, 2026**.

The policy may be revised as the website, hosting configuration, Firebase services, integrations, and supported versions change.

---

*This document is maintained by Caleb Kritzar (@BusArmyDude).*
