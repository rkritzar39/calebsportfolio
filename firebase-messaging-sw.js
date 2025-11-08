// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging.js');

// Your same Firebase config
firebase.initializeApp({
  apiKey: "AIzaSyCIZ0fri5V1E2si1xXpBPQQJqj1F_KuuG0",
  authDomain: "busarmydudewebsite.firebaseapp.com",
  projectId: "busarmydudewebsite",
  storageBucket: "busarmydudewebsite.firebasestorage.app",
  messagingSenderId: "42980404680",
  appId: "1:42980404680:web:f4f1e54789902a4295e4fd",
  measurementId: "G-DQPH8YL789"
});

// Initialize messaging
const messaging = firebase.messaging();

// Show push notifications when received in the background
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: icon || '/icons/notification-icon.png',
  });
});
