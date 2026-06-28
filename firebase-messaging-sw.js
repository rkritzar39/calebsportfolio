// firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCIZ0fri5V1E2si1xXpBPQQJqj1F_KuuG0",
  authDomain: "busarmydudewebsite.firebaseapp.com",
  projectId: "busarmydudewebsite",
  storageBucket: "busarmydudewebsite.firebasestorage.app",
  messagingSenderId: "42980404680",
  appId: "1:42980404680:web:f4f1e54789902a4295e4fd",
  measurementId: "G-DQPH8YL789"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("📩 Background message received:", payload);

  const notificationTitle =
    payload.notification?.title || "New Update";

  const notificationOptions = {
    body: payload.notification?.body || "You have a new notification.",
    icon: payload.notification?.icon || "/favicon-192.png",
    badge: "/favicon-32x32.png",

    image: payload.notification?.image,

    vibrate: [200, 100, 200],

    tag: payload.data?.tag || "website-update",
    renotify: true,

    requireInteraction: false,

    data: {
      url: payload.data?.url || "/"
    },

    actions: [
      {
        action: "open",
        title: "Open Website"
      }
    ]
  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("🔔 Notification clicked");

  event.notification.close();

  const url =
    event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {

      // Focus existing tab if already open
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }

      // Otherwise open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Activate immediately after installation
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Install immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
});
