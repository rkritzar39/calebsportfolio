// ==============================================
// notifications.js
// Firebase Cloud Messaging & Firestore Sync
// ==============================================

import { messaging, db } from "./firebase-init.js";

import {
  getToken,
  onMessage,
  deleteToken
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging.js";

import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const VAPID_KEY = "BHRwwN7PbDF6gKdczJdDHTesQdZ-WbXsIpnwtFyy4yPk6ekWCN43upT6nbXD-ONlCIFNPKCLHKanw-Xzw_GmpJQ";
const toggle = document.getElementById("enableNotificationsToggle");

// Initialize component safely depending on the DOM state
if (toggle) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNotificationToggle);
  } else {
    initNotificationToggle();
  }
}

function initNotificationToggle() {
  loadState();

  toggle.addEventListener("change", async () => {
    // Disable interaction during transit to prevent double-clicks
    toggle.disabled = true; 
    if (toggle.checked) {
      await enableNotifications();
    } else {
      await disableNotifications();
    }
    toggle.disabled = false;
  });
}

// ==============================================
// Enable Notifications
// ==============================================
async function enableNotifications() {
  try {
    if (!messaging || !("Notification" in window)) {
      toast("This browser doesn't support notifications.");
      toggle.checked = false;
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast("Notification permission denied.");
      toggle.checked = false;
      return;
    }

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      toast("Couldn't obtain an FCM token.");
      toggle.checked = false;
      return;
    }

    // Save token to Firestore
    await setDoc(doc(db, "notificationTokens", token), {
      token,
      enabled: true,
      created: serverTimestamp(),
      updated: serverTimestamp(),
      userAgent: navigator.userAgent,
      language: navigator.language
    });

    // Cache local states
    localStorage.setItem("notificationsEnabled", "true");
    localStorage.setItem("fcm_cached_token", token);

    toast("🔔 Notifications Enabled!");
    console.log("FCM Token synchronized:", token);
  } catch (err) {
    console.error("Error enabling notifications:", err);
    toast("Failed to enable notifications.");
    toggle.checked = false;
  }
}

// ==============================================
// Disable Notifications
// ==============================================
async function disableNotifications() {
  try {
    // Retrieve cached token to clean up Firestore even if browser permissions were blocked
    let token = localStorage.getItem("fcm_cached_token");

    if (!token && messaging && "serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration
        });
      } catch (tokenErr) {
        console.warn("Could not fetch active token dynamically:", tokenErr);
      }
    }

    // 1. Clean up Firestore
    if (token) {
      await deleteDoc(doc(db, "notificationTokens", token));
    }

    // 2. Unregister token from Firebase Instance ID backend
    if (messaging) {
      await deleteToken(messaging).catch((err) => 
        console.warn("Token already deleted or invalid on Firebase backend:", err)
      );
    }

    // 3. Clear Local Caches
    localStorage.removeItem("notificationsEnabled");
    localStorage.removeItem("fcm_cached_token");

    toast("Notifications Disabled");
  } catch (err) {
    console.error("Error gracefully disabling notifications:", err);
    toast("Error clearing notification settings.");
  }
}

// ==============================================
// Foreground Notifications
// ==============================================
if (messaging) {
  onMessage(messaging, (payload) => {
    console.log("Foreground Notification received:", payload);

    if (!("Notification" in window) || Notification.permission !== "granted") return;

    // Direct browser notification generation while active in the app
    new Notification(payload.notification?.title || "New Notification", {
      body: payload.notification?.body || "",
      icon: payload.notification?.icon || "/favicon-192.png"
    });
  });
}

// ==============================================
// Load Previous State
// ==============================================
function loadState() {
  const storageEnabled = localStorage.getItem("notificationsEnabled") === "true";
  const actualPermission = "Notification" in window ? Notification.permission : "denied";

  // Auto-correct state if permission was revoked inside browser settings manually
  if (storageEnabled && actualPermission !== "granted") {
    localStorage.removeItem("notificationsEnabled");
    localStorage.removeItem("fcm_cached_token");
    toggle.checked = false;
    return;
  }

  toggle.checked = storageEnabled && actualPermission === "granted";
}

// ==============================================
// Toast UI Helper
// ==============================================
function toast(message) {
  if (typeof showToast === "function") {
    showToast(message);
    return;
  }

  const container = document.getElementById("toast-container");
  if (!container) {
    console.log("Toast fallback:", message);
    return;
  }

  const toastElement = document.createElement("div");
  toastElement.className = "toast";
  toastElement.textContent = message;

  container.appendChild(toastElement);

  // Trigger DOM paint transitions
  requestAnimationFrame(() => {
    toastElement.classList.add("show");
  });

  setTimeout(() => {
    toastElement.classList.remove("show");
    toastElement.addEventListener("transitionend", () => toastElement.remove());
  }, 3500);
}
