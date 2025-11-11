// === MANUAL STATUS CONFIG ===
const services = [
  { name: "Website", status: "ok" },
  { name: "Spotify Live", status: "ok" },
  { name: "Weather API", status: "warn" },
  { name: "Firebase", status: "ok" },
  { name: "Feature Portal", status: "down" }
];

// === RENDER FUNCTION ===
function renderStatus() {
  const grid = document.getElementById("status-grid");
  const banner = document.getElementById("overall-status");
  grid.innerHTML = "";

  let allOk = true;

  services.forEach(service => {
    const item = document.createElement("div");
    item.className = `status-item status-${service.status}`;
    item.innerHTML = `
      <div class="status-indicator ${service.status}">
        <span></span> ${service.name}
      </div>
      <div class="status-text">${
        service.status === "ok" ? "Operational ✅" :
        service.status === "warn" ? "Degraded ⚠️" :
        "Outage 🔴"
      }</div>
    `;
    grid.appendChild(item);
    if (service.status !== "ok") allOk = false;
  });

  document.getElementById("last-updated").textContent = new Date().toLocaleTimeString();

  // Update overall banner
  if (allOk) {
    banner.style.background = "rgba(48,209,88,0.15)";
    banner.style.border = "1px solid rgba(48,209,88,0.4)";
    banner.style.color = "var(--ok)";
    banner.innerHTML = "<p>All systems operational ✅</p>";
  } else {
    banner.style.background = "rgba(255,69,58,0.15)";
    banner.style.border = "1px solid rgba(255,69,58,0.4)";
    banner.style.color = "var(--down)";
    banner.innerHTML = "<p>Some systems experiencing issues ⚠️</p>";
  }
}

// === REFRESH BUTTON ===
document.getElementById("refresh-btn").addEventListener("click", renderStatus);

// === AUTO REFRESH EVERY 5 MINUTES ===
setInterval(renderStatus, 5 * 60 * 1000);

// === INITIAL LOAD ===
renderStatus();
