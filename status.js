// ------------------------------
// VisionOS Glass Status Checker
// ------------------------------

async function checkService(card) {
  const url = card.dataset.check;
  const indicator = card.querySelector(".status-indicator");
  const text = card.querySelector(".status-text");

  // Set to "checking" state
  indicator.style.background = "#888";
  indicator.style.boxShadow = "0 0 8px #444";
  text.textContent = "Checking...";

  try {
    // Timeout: 5 seconds
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const start = performance.now();
    const response = await fetch(url, { signal: controller.signal });
    const latency = Math.round(performance.now() - start);

    clearTimeout(timeout);

    // Response OK → Online
    if (response.ok) {
      indicator.style.background = "#00ff88";
      indicator.style.boxShadow = "0 0 12px #00ff88";
      text.textContent = `Online • ${latency}ms`;
    }

    // Response NOT OK → Partial outage
    else {
      indicator.style.background = "#ffcc00";
      indicator.style.boxShadow = "0 0 12px #ffcc00";
      text.textContent = `Degraded • ${latency}ms`;
    }

  } catch (err) {
    // If it fails → Offline
    indicator.style.background = "#ff4444";
    indicator.style.boxShadow = "0 0 12px #ff4444";
    text.textContent = "Offline";
  }
}

function updateAll() {
  const cards = document.querySelectorAll(".status-card");
  cards.forEach(card => checkService(card));

  const timestamp = new Date().toLocaleTimeString();
  document.getElementById("last-updated").textContent = timestamp;
}

// Run once on page load
updateAll();

// Auto-refresh every 30 seconds
setInterval(updateAll, 30000);
