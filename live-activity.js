/* =======================================================
   Live Activity System (Twitch + Discord + Manual Status)
   ======================================================= */

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/* ================================
   DISCORD PRESENCE
================================ */
async function getDiscordActivity() {
  try {
    const res = await fetch("https://api.lanyard.rest/v1/users/850815059093356594");
    const { data } = await res.json();
    if (!data || data.discord_status === "offline") return null;

    const activity = data.activities.find(a => a.type === 0 || a.type === 2);
    if (!activity) return null;

    // Spotify / Game
    if (activity.name === "Spotify" && activity.details && activity.state)
      return `🎵 Listening to “${activity.details}” by ${activity.state}`;
    if (activity.type === 0)
      return `🎮 Playing ${activity.name}`;

    return null;
  } catch (err) {
    console.error("Discord activity error:", err);
    return null;
  }
}

/* ================================
   TWITCH STATUS
   (For production, use a server-side proxy to keep tokens private)
================================ */
async function getTwitchStatus() {
  const user = "calebkritzar";
  const clientId = "n7e3lys858u96xlg7v2aohe8vzxha3";
  const token = "wh1m17qfuq5dkh5b78ekk6oh5wc8wm";

  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${user}`,
      {
        headers: {
          "Client-ID": clientId,
          "Authorization": `Bearer ${token}`
        }
      }
    );
    const data = await res.json();

    if (data.data && data.data.length > 0) {
      const title = data.data[0].title;
      return `🟣 Streaming on Twitch — ${title}`;
    }
    return null;
  } catch (err) {
    console.error("Twitch API error:", err);
    return null;
  }
}

/* ================================
   MANUAL STATUS (Firestore)
================================ */
async function getManualStatus() {
  try {
    const docSnap = await getDoc(doc(db, "live_status", "current"));
    if (docSnap.exists()) return docSnap.data().message;
    return null;
  } catch (err) {
    console.error("Manual status error:", err);
    return null;
  }
}

/* ================================
   MAIN STATUS UPDATER
================================ */
async function updateLiveStatus() {
  const el = document.getElementById("live-activity-text");
  const container = document.getElementById("live-activity");
  if (!el || !container) return;

  try {
    // 1️⃣ Manual (highest priority)
    const manual = await getManualStatus();
    if (manual) return showStatus(manual);

    // 2️⃣ Twitch
    const twitch = await getTwitchStatus();
    if (twitch) return showStatus(twitch);

    // 3️⃣ Discord
    const discord = await getDiscordActivity();
    if (discord) return showStatus(discord);

    // 4️⃣ Offline fallback
    return showStatus("🛌 Offline");
  } catch (err) {
    console.error("Live activity update error:", err);
    showStatus("Status unavailable");
  }
}

/* ================================
   RENDER
================================ */
function showStatus(text) {
  const el = document.getElementById("live-activity-text");
  const container = document.getElementById("live-activity");
  el.textContent = text;
  container.classList.remove("hidden");
  container.classList.add("active");
}

/* ================================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", () => {
  updateLiveStatus();
  // Refresh every 30 seconds
  setInterval(updateLiveStatus, 30000);
});
