// ==============================================
// ✅ SAFE FIREBASE INITIALIZATION (v10 Modular)
// ==============================================

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging.js";

// ==============================================
// Firebase Configuration
// ==============================================

const firebaseConfig = {
  apiKey: "AIzaSyCIZ0fri5V1E2si1xXpBPQQJqj1F_KuuG0",
  authDomain: "busarmydudewebsite.firebaseapp.com",
  projectId: "busarmydudewebsite",
  storageBucket: "busarmydudewebsite.appspot.com",
  messagingSenderId: "42980404680",
  appId: "1:42980404680:web:f4f1e54789902a4295e4fd",
  measurementId: "G-DQPH8YL789"
};

// ==============================================
// Initialize Firebase
// ==============================================

let app;
let auth;
let db;

try {

  app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

  auth = getAuth(app);
  db = getFirestore(app);

  console.log("✅ Firebase initialized.");

} catch (error) {

  console.error(error);
  throw error;

}

// ==============================================
// Firebase Cloud Messaging
// ==============================================

let messaging = null;

if (await isSupported()) {

  messaging = getMessaging(app);

  try {

    const registration =
      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

    console.log("✅ Service Worker registered.");

    const permission =
      await Notification.requestPermission();

    if (permission === "granted") {

      const token = await getToken(messaging, {

        vapidKey: "M9gA6JaPNqk2iUjcMctwxly91RJJJzor1Lr9ohJo6Js",

        serviceWorkerRegistration: registration

      });

      if (token) {

        console.log("📱 FCM Token:");
        console.log(token);

        // TODO:
        // Save token to Firestore
        // so your admin panel can send notifications.

      }

    } else {

      console.warn("❌ Notifications denied.");

    }

  } catch (error) {

    console.error("Messaging Error:", error);

  }

  // Foreground notifications

  onMessage(messaging, (payload) => {

    console.log("📩 Foreground notification:", payload);

    if (Notification.permission === "granted") {

      new Notification(
        payload.notification?.title || "New Notification",
        {
          body: payload.notification?.body,
          icon:
            payload.notification?.icon ||
            "/favicon-192.png"
        }
      );

    }

  });

} else {

  console.log("Messaging not supported.");

}

// ==============================================
// Export Firebase
// ==============================================

export {
  app,
  auth,
  db,
  messaging
};
