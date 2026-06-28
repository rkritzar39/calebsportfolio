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
// Firebase Config
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
// Init Firebase
// ==============================================

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("✅ Firebase initialized");

// ==============================================
// Messaging Setup (SAFE WRAPPER)
// ==============================================

const VAPID_KEY = "BHRwwN7PbDF6gKdczJdDHTesQdZ-WbXsIpnwtFyy4yPk6ekWCN43upT6nbXD-ONlCIFNPKCLHKanw-Xzw_GmpJQ";

let messaging = null;

async function initMessaging() {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.log("Messaging not supported on this browser");
      return;
    }

    messaging = getMessaging(app);

    // Register SW
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    console.log("✅ Service Worker registered");

    // Ask permission
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.warn("❌ Notification permission denied");
      return;
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log("📱 FCM Token:", token);

      // TODO: store token in Firestore
      // await setDoc(doc(db, "fcmTokens", token), {...});
    } else {
      console.warn("⚠️ No FCM token returned");
    }

    // Foreground messages
    onMessage(messaging, (payload) => {
      console.log("📩 Foreground message:", payload);

      if (Notification.permission === "granted") {
        new Notification(payload?.notification?.title ?? "New Notification", {
          body: payload?.notification?.body ?? "",
          icon: payload?.notification?.icon ?? "/favicon-192.png"
        });
      }
    });

  } catch (err) {
    console.error("❌ Messaging init failed:", err);
  }
}

// Run safely
initMessaging();

// ==============================================
// Export Firebase
// ==============================================

export { app, auth, db, messaging };
