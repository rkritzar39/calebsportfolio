// sw.js — Base PWA Service Worker
self.addEventListener("install", (event) => {
  console.log("✅ PWA Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("✅ PWA Service Worker activated");
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Just pass through for now — caching optional
});
