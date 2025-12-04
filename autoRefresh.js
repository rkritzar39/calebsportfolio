// versionInfo.js
document.addEventListener("DOMContentLoaded", () => {
  const REFRESH_INTERVAL = 60; // seconds until auto-refresh
  const countdownEl = document.getElementById('refresh-countdown');

  if (!countdownEl) return; // safety check

  // Timestamp for when the page should reload
  const refreshTime = Date.now() + REFRESH_INTERVAL * 1000;

  function updateCountdown() {
    const now = Date.now();
    let remaining = Math.round((refreshTime - now) / 1000);

    if (remaining <= 0) {
      countdownEl.textContent = "0:00";
      setTimeout(() => location.reload(), 0); // reload immediately
      return;
    }

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    countdownEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Initialize immediately
  updateCountdown();
  // Update every 500ms to stay accurate even if the tab is throttled
  setInterval(updateCountdown, 500);
});
