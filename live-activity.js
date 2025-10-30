import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

// --- Discord Activity (auto presence)
async function getDiscordActivity() {
  try {
    const res = await fetch("https://api.lanyard.rest/v1/users/YOUR_DISCORD_ID");
    const { data } = await res.json();
    if (!data || data.discord_status === "offline") return null;

    const activity = data.activities.find(a => a.type === 0 || a.type === 2);
    if (!activity) return null;

    if (activity.name === "Spotify" && activity.details && activity.state)
      return `🎵 Listening to “${activity.details}” by ${activity.state}`;
    if (activity.type === 0)
      return `🎮 Playing ${activity.name}`;

    return null;
  } catch (err) {
    console.error("Discord error:", err);
    return null;
  }
}

// --- Live Status Loader
async function updateLiveStatus() {
  const el = document.getElementById("live-activity-text");
  const container = document.getElementById("live-activity");

  try {
    // 1️⃣ Manual Firestore status (if you set one)
    const docSnap = await getDoc(doc(db, "live_status", "current"));
    if (docSnap.exists()) {
      el.textContent = docSnap.data().message;
      container.classList.remove("hidden");
      container.classList.add("active");
      return;
    }

    // 2️⃣ Discord fallback
    const discordStatus = await getDiscordActivity();
    if (discordStatus) {
      el.textContent = discordStatus;
      container.classList.remove("hidden");
      container.classList.add("active");
      return;
    }

    // 3️⃣ Default
    el.textContent = "🛌 Offline";
    container.classList.remove("active");
  } catch (err) {
    console.error("Error updating live status:", err);
    el.textContent = "Status unavailable";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateLiveStatus();
  setInterval(updateLiveStatus, 20000); // refresh every 20s
});
