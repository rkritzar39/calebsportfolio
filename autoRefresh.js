document.addEventListener("DOMContentLoaded", () => {
  const REFRESH_INTERVAL = 60; // seconds
  const countdownEl = document.getElementById('refresh-countdown');
  if (!countdownEl) return; // exit if element not found

  // calculate the exact refresh timestamp
  const refreshTimestamp = Date.now() + REFRESH_INTERVAL * 1000;

  function updateCountdown() {
    const now = Date.now();
    let remaining = Math.round((refreshTimestamp - now) / 1000);

    if (remaining <= 0) {
      countdownEl.textContent = "0:00";
      setTimeout(() => location.reload(), 0);
      return;
    }

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    countdownEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // first update immediately
  updateCountdown();
  // keep updating every 500ms
  setInterval(updateCountdown, 500);
});
