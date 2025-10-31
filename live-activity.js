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
   DISCORD PRESENCE — Clean version
================================ */
async function getDiscordActivity() {
  const userId = "850815059093356594"; // your Discord ID
  const endpoint = `https://api.lanyard.rest/v1/users/${userId}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) return null;

    const { data } = await res.json();
    if (!data) return null;

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

    // --- Fallback: no game / no Spotify ---
    const status = data.discord_status;
    return statusMap[status] || "💬 Online on Discord";
  } catch (err) {
    console.error("Discord activity error:", err);
    return null;
  }
}

/* ================================
   TWITCH STATUS
================================ */
async function getTwitchStatus() {
  const user = "calebkritzar";
  const clientId = "n7e3lys858u96xlg7v2aohe8vzxha3";
  const token = "wh1m17qfuq5dkh5b78ekk6oh5wc8wm"; // ⚠️ move to server-side in production

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
   USER SETTING CHECK
================================ */
function isLiveActivityEnabled() {
  try {
    const settings = JSON.parse(localStorage.getItem("websiteSettings") || "{}");
    return settings.showLiveActivity === "enabled";
  } catch {
    return true; // default to enabled if missing
  }
}

/* ================================
   UPDATE LIVE ACTIVITY DISPLAY
================================ */
async function updateLiveStatus() {
  const el = document.getElementById("live-activity-text");
  const container = document.getElementById("live-activity");
  if (!el || !container) return;

  // Skip everything if disabled
  if (!isLiveActivityEnabled()) {
    container.style.display = "none";
    console.log("[Live Activity] Disabled by user settings.");
    return;
  }

  // Ensure it's visible
  container.style.display = "";
  container.classList.remove("offline");

  try {
    // --- 1️⃣ Manual override ---
    const manual = await getManualStatus();
    if (manual) return showStatus(manual);

    // --- 2️⃣ Twitch (streaming) ---
    const twitch = await getTwitchStatus();
    if (twitch) return showStatus(twitch);

    // --- 3️⃣ Discord ---
    const discord = await getDiscordActivity();
    if (discord && !discord.includes("Offline")) return showStatus(discord);

    // --- 4️⃣ Offline fallback ---
    showStatus("🛌 Offline", true);
  } catch (err) {
    console.error("Live activity update error:", err);
    showStatus("💬 Discord status unavailable", true);
  }
}

/* ================================
   SHOW STATUS + ICON HANDLER
================================ */
function showStatus(text, isOffline = false) {
  const el = document.getElementById("live-activity-text");
  const container = document.getElementById("live-activity");
  const icon = document.getElementById("activity-icon");
  if (!el || !container || !icon) return;

  el.textContent = text;
  container.classList.toggle("active", !isOffline);
  container.classList.toggle("offline", isOffline);
  container.classList.remove("hidden");

  // --- Determine which icon to show ---
  let iconClass = "discord";
  let iconSrc = "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg";
  let textColor = "var(--accent-color)";

  if (text.includes("Twitch")) {
    iconClass = "twitch";
    iconSrc = "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/twitch.svg";
    textColor = "#9146FF";
  } else if (text.includes("Spotify") || text.includes("Listening")) {
    iconClass = "spotify";
    iconSrc = "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/spotify.svg";
    textColor = "#1DB954";
  } else if (text.includes("Playing")) {
    iconClass = "discord";
    iconSrc = "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/steam.svg";
    textColor = "#5865F2";
  } else if (text.includes("Offline") || isOffline) {
    iconClass = "offline";
    iconSrc = "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg";
    textColor = "gray";
  }

  // Apply updates
  icon.src = iconSrc;
  icon.className = `activity-icon ${iconClass} change`;
  el.style.color = textColor;
  container.style.opacity = isOffline ? "0.8" : "1";

  // Smooth transition animation
  setTimeout(() => icon.classList.remove("change"), 300);
}

/* ================================
   INIT + AUTO REFRESH
================================ */
document.addEventListener("DOMContentLoaded", () => {
  updateLiveStatus();

  // Refresh every 30 seconds
  setInterval(() => {
    if (isLiveActivityEnabled()) updateLiveStatus();
  }, 30000);
});
