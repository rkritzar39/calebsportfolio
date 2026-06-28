// firebase-messaging.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getMessaging,
  getToken,
  onMessage
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging.js";

/**
 * Firebase configuration
 */
const firebaseConfig = {
  apiKey: "AIzaSyCIZ0fri5V1E2si1xXpBPQQJqj1F_KuuG0",
  authDomain: "busarmydudewebsite.firebaseapp.com",
  projectId: "busarmydudewebsite",
  storageBucket: "busarmydudewebsite.appspot.com",
  messagingSenderId: "42980404680",
  appId: "1:42980404680:web:f4f1e54789902a4295e4fd",
  measurementId: "G-DQPH8YL789"
};

/**
 * Initialize Firebase
 */
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.warn("Notification permission not granted");
      return null;
    }

    return await registerServiceWorkerAndGetToken();
  } catch (err) {
    console.error("Permission request failed:", err);
    return null;
  }
}

/**
 * Register SW + get FCM token
 */
async function registerServiceWorkerAndGetToken() {
  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    // Your public VAPID key from Firebase console
    const vapidKey = "BHRwwN7PbDF6gKdczJdDHTesQdZ-WbXsIpnwtFyy4yPk6ekWCN43upT6nbXD-ONlCIFNPKCLHKanw-Xzw_GmpJQ";

    // Get device token
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      console.warn("No registration token available");
      return null;
    }

    console.log("FCM Token:", token);

    // Send token to your backend (important)
    await sendTokenToServer(token);

    return token;
  } catch (err) {
    console.error("Error getting FCM token:", err);
    return null;
  }
}

/**
 * Handle foreground messages (when app is open)
 */
onMessage(messaging, (payload) => {
  console.log("Foreground message received:", payload);

  const title = payload.notification?.title || "New Notification";
  const body = payload.notification?.body || "";

  showInAppNotification(title, body, payload);
});

/**
 * Simple in-app notification UI
 */
function showInAppNotification(title, body, payload) {
  const notification = document.createElement("div");

  notification.style.position = "fixed";
  notification.style.bottom = "20px";
  notification.style.right = "20px";
  notification.style.background = "#111";
  notification.style.color = "#fff";
  notification.style.padding = "12px 16px";
  notification.style.borderRadius = "10px";
  notification.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
  notification.style.zIndex = "9999";
  notification.style.maxWidth = "300px";
  notification.style.cursor = "pointer";

  notification.innerHTML = `
    <strong>${title}</strong><br/>
    <span style="font-size: 13px;">${body}</span>
  `;

  notification.onclick = () => {
    const clickAction = payload.data?.click_action || "/";
    window.location.href = clickAction;
  };

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 6000);
}

/**
 * Send token to backend (replace with your API)
 */
async function sendTokenToServer(token) {
  try {
    await fetch("/api/save-fcm-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token })
    });
  } catch (err) {
    console.error("Failed to send token to server:", err);
  }
}
