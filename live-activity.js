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
   DISCORD PRESENCE — clean version
   Shows only real activities (game / Spotify)
================================ */
async function getDiscordActivity() {
  const userId = "850815059093356594"; // your Discord ID
  const endpoint = `https://api.lanyard.rest/v1/users/${userId}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) return "💬 Discord status unavailable";

    const { data } = await res.json();
    if (!data) return "💬 Discord status unavailable";

    const statusMap = {
      online: "🟢 Online on Discord",
      idle: "🌙 Idle on Discord",
      dnd: "⛔ Do Not Disturb",
      offline: "🔘 Offline",
    };

    const activities = data.activities || [];

    // --- Spotify (type 2) ---
    const spotify = activities.find(a => a.name === "Spotify");
    if (spotify && spotify.details && spotify.state)
      return `🎵 Listening to “${spotify.details}” by ${spotify.state}`;

    // --- Game / Application (type 0) ---
    const game = activities.find(a => a.type === 0);
    if (game && game.name)
      return `🎮 Playing ${game.name}`;

    // --- Fallback: no game / no Spotify, but user is online ---
    const status = data.discord_status;
    return statusMap[status] || "💬 Online on Discord";
  } catch (err) {
    console.error("Discord activity error:", err);
    return "💬 Discord status unavailable";
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

function isLiveActivityEnabled() {
  try {
    const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
    return settings.showLiveActivity === "enabled";
  } catch {
    return true; // default to enabled if settings missing
  }
}

/* ================================
   MAIN STATUS UPDATER
================================ */
async function updateLiveStatus() {
  const el = document.getElementById("live-activity-text");
  const container = document.getElementById("live-activity");
  if (!el || !container) return;

  // 🧠 Skip everything if Live Activity is disabled
  if (!isLiveActivityEnabled()) {
    container.style.display = "none";
    console.log("[Live Activity] Disabled by user settings.");
    return;
  }

  // Ensure it's visible
  container.style.display = "";

  try {
    // --- Manual override ---
    const manual = await getManualStatus();
    if (manual) return showStatus(manual);

    // --- Twitch ---
    const twitch = await getTwitchStatus();
    if (twitch) return showStatus(twitch);

    // --- Discord ---
    const discord = await getDiscordActivity();
    if (discord && !discord.includes("Offline")) return showStatus(discord);

    // --- Offline fallback ---
    showStatus("🛌 Offline", true);
  } catch (err) {
    console.error("Live activity update error:", err);
    showStatus("💬 Discord status unavailable", true);
  }
}

function showStatus(text, isOffline = false) {
  const el = document.getElementById("live-activity-text");
  const container = document.getElementById("live-activity");
  if (!el || !container) return;

  el.textContent = text;
  container.classList.toggle("active", !isOffline);
  container.classList.toggle("offline", isOffline);
  container.style.display = isOffline ? "" : "";
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
