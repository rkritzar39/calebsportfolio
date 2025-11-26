// ------------------------------------------
// VisionOS Glass Status Checker (IMG-PING)
// ------------------------------------------

function checkService(card) {
  const url = card.dataset.check;
  const indicator = card.querySelector(".status-indicator");
  const text = card.querySelector(".status-text");

  // Reset to "checking" state
  indicator.style.background = "#888";
  indicator.style.boxShadow = "0 0 8px #444";
  text.textContent = "Checking...";

  // Add a cache-buster to avoid browser caching
  const testURL = `${url}?_=${Date.now()}`;

  const img = new Image();
  const startTime = performance.now();

  img.onload = () => {
    const latency = Math.round(performance.now() - startTime);

    indicator.style.background = "#00ff88";
    indicator.style.boxShadow = "0 0 12px #00ff88";
    text.textContent = `Online • ${latency}ms`;
  };

  img.onerror = () => {
    indicator.style.background = "#ff4444";
    indicator.style.boxShadow = "0 0 12px #ff4444";
    text.textContent = "Offline";
  };

  // Trigger the load
  img.src = testURL;
}

function updateAll() {
  const cards = document.querySelectorAll(".status-card");
  cards.forEach(card => checkService(card));

  const timestamp = new Date().toLocaleTimeString();
  document.getElementById("last-updated").textContent = timestamp;
}

// Run once on load
updateAll();

// Refresh every 30 seconds
setInterval(updateAll, 30000);
