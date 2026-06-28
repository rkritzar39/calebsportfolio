// firebase-messaging.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported 
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let messaging = null;

/**
 * Safely initialize Firebase Messaging after checking environment support
 */
async function initMessaging() {
  try {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "Notification" in window) {
      const supported = await isSupported();
      if (supported) {
        messaging = getMessaging(app);
        setupForegroundListener();
      } else {
        console.warn("FCM is not supported in this browser context (e.g., insecure HTTP or private mode).");
      }
    } else {
      console.warn("Push notifications or Service Workers are not supported by this browser.");
    }
  } catch (err) {
    console.error("Failed to initialize FCM:", err);
  }
}

// Trigger initialization
initMessaging();

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission() {
  if (!messaging) {
    await initMessaging();
    if (!messaging) {
      console.error("Cannot request permission: FCM is not supported or initialized.");
      return null;
    }
  }

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

    // Public VAPID key from Firebase console
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

    // Send token to your backend
    await sendTokenToServer(token);

    return token;
  } catch (err) {
    console.error("Error getting FCM token:", err);
    return null;
  }
}

/**
 * Bind the foreground message listener
 */
function setupForegroundListener() {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);

    const title = payload.notification?.title || "New Notification";
    const body = payload.notification?.body || "";

    showInAppNotification(title, body, payload);
  });
}

/**
 * Modern in-app notification UI with a sleek frosted-glass aesthetic
 */
function showInAppNotification(title, body, payload) {
  const notification = document.createElement("div");

  // Modern UI styling with glassmorphism touches
  Object.assign(notification.style, {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    background: "rgba(20, 20, 20, 0.85)",
    backdropFilter: "blur(12px)",
    webkitBackdropFilter: "blur(12px)",
    color: "#ffffff",
    padding: "16px",
    borderRadius: "14px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
    zIndex: "9999",
    maxWidth: "320px",
    width: "100%",
    cursor: "pointer",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease", // Swapped to an intentional ease-out curve
    opacity: "0",
    transform: "translateY(20px)" // FIXED: Changed clientY(20px) to translateY(20px)
  });

  notification.innerHTML = `
    <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; letter-spacing: -0.2px;">${title}</div>
    <div style="font-size: 13px; color: rgba(255, 255, 255, 0.75); line-height: 1.4;">${body}</div>
  `;

  notification.onclick = () => {
    const clickAction = payload.data?.click_action || "/";
    window.location.href = clickAction;
  };

  document.body.appendChild(notification);

  // Fade-in and slide-up animation
  requestAnimationFrame(() => {
    notification.style.opacity = "1";
    notification.style.transform = "translateY(0)";
  });

  // Smooth slide out and removal
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateY(20px)";
    notification.addEventListener("transitionend", () => notification.remove());
  }, 6000);
}

/**
 * Send token to backend
 */
async function sendTokenToServer(token) {
  try {
    const response = await fetch("/api/save-fcm-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token })
    });
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
  } catch (err) {
    console.error("Failed to send token to server:", err);
  }
}
