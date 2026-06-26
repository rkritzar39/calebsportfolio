# Stored XSS via unescaped Firestore author/post fields in innerHTML

**Tool:** `mini_audit`
**Severity:** critical
**Category:** security
**Location:** `author.js:78`

## What's wrong

`post.category`, `post.title`, `post.content.substring(0,100)`, `authorPfpUrl`, and `authorName` (taken from the URL query string) are all interpolated into `innerHTML` without escaping. `authorName` comes from `params.get('name')` — attacker-controlled URL input — making this both a reflected and stored XSS vector. Fix: escape all interpolated values with an HTML-escape helper before placing in `innerHTML`, and validate/sanitize `authorName` from the URL.
