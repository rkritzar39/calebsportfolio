// ==============================================
// notifications.js
// Firebase Cloud Messaging
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

const VAPID_KEY = "YOUR_PUBLIC_VAPID_KEY";

const toggle = document.getElementById("enableNotificationsToggle");

document.addEventListener("DOMContentLoaded", () => {

  if (!toggle) return;

  loadState();

  toggle.addEventListener("change", async () => {

    if (toggle.checked) {

      await enableNotifications();

    } else {

      await disableNotifications();

    }

  });

});

// ==============================================
// Enable Notifications
// ==============================================

async function enableNotifications() {

  try {

    if (!("Notification" in window)) {

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

    const registration =
      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

    const token = await getToken(messaging, {

      vapidKey: VAPID_KEY,

      serviceWorkerRegistration: registration

    });

    if (!token) {

      toast("Couldn't obtain an FCM token.");
      toggle.checked = false;
      return;

    }

    await setDoc(doc(db, "notificationTokens", token), {

      token,

      enabled: true,

      created: serverTimestamp(),

      updated: serverTimestamp(),

      userAgent: navigator.userAgent,

      language: navigator.language,

      platform: navigator.platform

    });

    localStorage.setItem(
      "notificationsEnabled",
      "true"
    );

    toast("🔔 Notifications Enabled!");

    console.log("FCM Token:", token);

  }

  catch (err) {

    console.error(err);

    toast("Failed to enable notifications.");

    toggle.checked = false;

  }

}

// ==============================================
// Disable Notifications
// ==============================================

async function disableNotifications() {

  try {

    const registration =
      await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {

      vapidKey: VAPID_KEY,

      serviceWorkerRegistration: registration

    });

    if (token) {

      await deleteDoc(doc(db, "notificationTokens", token));

      await deleteToken(messaging);

    }

    localStorage.removeItem(
      "notificationsEnabled"
    );

    toast("Notifications Disabled");

  }

  catch (err) {

    console.error(err);

  }

}

// ==============================================
// Foreground Notifications
// ==============================================

if (messaging) {

  onMessage(messaging, (payload) => {

    console.log("Foreground Notification", payload);

    if (Notification.permission !== "granted")
      return;

    new Notification(

      payload.notification?.title ||
      "New Notification",

      {

        body:

          payload.notification?.body ||

          "",

        icon:

          payload.notification?.icon ||

          "/favicon-192.png"

      }

    );

  });

}

// ==============================================
// Load Previous State
// ==============================================

function loadState() {

  const enabled =

    localStorage.getItem(
      "notificationsEnabled"
    ) === "true";

  toggle.checked = enabled;

}

// ==============================================
// Toast
// ==============================================

function toast(message) {

  if (typeof showToast === "function") {

    showToast(message);

    return;

  }

  const container =
    document.getElementById(
      "toast-container"
    );

  if (!container) {

    console.log(message);

    return;

  }

  const toast =
    document.createElement("div");

  toast.className = "toast";

  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {

    toast.classList.add("show");

  }, 10);

  setTimeout(() => {

    toast.classList.remove("show");

    setTimeout(() => {

      toast.remove();

    }, 300);

  }, 3500);

}
