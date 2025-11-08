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

messaging.onBackgroundMessage((payload) => {
  console.log("📩 Background message received:", payload);
  const notificationTitle = payload.notification?.title || "New update";
  const notificationOptions = {
    body: payload.notification?.body,
    icon: payload.notification?.icon || "/favicon-32x32.png"
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
