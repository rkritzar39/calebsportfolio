// ==============================================
// ✅ SAFE FIREBASE INITIALIZATION (v9+ Modular)
// ==============================================
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// --- Your Firebase config ---
const firebaseConfig = {
  apiKey: "AIzaSyCIZ0fri5V1E2si1xXpBPQQJqj1F_KuuG0",
  authDomain: "busarmydudewebsite.firebaseapp.com",
  projectId: "busarmydudewebsite",
  storageBucket: "busarmydudewebsite.appspot.com",
  messagingSenderId: "42980404680",
  appId: "1:42980404680:web:f4f1e54789902a4295e4fd",
  measurementId: "G-DQPH8YL789"
};

// --- Initialize only once ---
let app;
let auth;
let db;

try {
  // ✅ Prevent duplicate initialization
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log("✅ Firebase initialized successfully (firebase-init.js).");
} catch (error) {
  console.error("🔥 Firebase initialization error in firebase-init.js:", error);
  alert("FATAL ERROR: Firebase could not initialize. Check console for details.");
  throw error;
}

// --- Export instances for use in other scripts ---
export { app, auth, db };
