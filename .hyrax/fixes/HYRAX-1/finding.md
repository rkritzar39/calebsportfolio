# Stored XSS via unescaped Firestore post fields rendered as innerHTML

**Tool:** `mini_audit`
**Severity:** critical
**Category:** security
**Location:** `post.js:38`

## What's wrong

All Firestore post fields (`post.title`, `post.author`, `post.authorPfpUrl`, `post.content`) are interpolated directly into `innerHTML` without any HTML escaping or sanitization. An attacker (or compromised Firestore document) can inject arbitrary HTML/JS. `post.content` is especially dangerous as it is inserted verbatim as HTML inside a `div`. Fix: sanitize every field with a library like DOMPurify before setting `innerHTML`, or build the DOM with `textContent`/`setAttribute` for field values and restrict `post.content` to a trusted markup subset via `DOMPurify.sanitize()`.
