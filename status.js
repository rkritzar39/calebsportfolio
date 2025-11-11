// === CONFIG — EASY TO EDIT ===
const CONFIG = {
  groups: [
    {
      name: "Core Systems",
      services: [
        { name: "Website", status: "ok" },
        { name: "User Settings", status: "ok" },
        { name: "Feature Portal", status: "warn" }
      ]
    },
    {
      name: "APIs & Integrations",
      services: [
        { name: "Spotify Live", status: "ok" },
        { name: "Weather API", status: "ok" },
        { name: "Firebase Sync", status: "ok" }
      ]
    },
    {
      name: "External Services",
      services: [
        { name: "Discord Lanyard", status: "ok" },
        { name: "GitHub API", status: "ok" }
      ]
    }
  ],
  incidents: [
    {
      title: "Feature Portal Slowdown",
      date: "November 11, 2025",
      details: "Feature Portal had slower responses due to a background sync issue. Fixed."
    },
    {
      title: "Weather API Timeout",
      date: "November 3, 2025",
      details: "Temporary outage caused by upstream provider. Resolved in 15 minutes."
    }
  ]
};

// === THEME DETECTOR ===
function applyTheme() {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
}
applyTheme();

// Update theme dynamically if system changes
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);

// === RENDER FUNCTION ===
function renderStatus() {
  const container = document.getElementById("status-groups");
  const banner = document.getElementById("overall-status");
  const log = document.getElementById("incident-log");
  container.innerHTML = "";
  log.innerHTML = "";

  let allOk = true;

  CONFIG.groups.forEach(group => {
    const groupEl = document.createElement("div");
    groupEl.className = "status-group";
    groupEl.innerHTML = `<h2>${group.name}</h2>`;

    group.services.forEach(service => {
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
      groupEl.appendChild(item);
      if (service.status !== "ok") allOk = false;
    });

    container.appendChild(groupEl);
  });

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

  if (CONFIG.incidents.length === 0) {
    log.innerHTML = "<p>No recent incidents 🎉</p>";
  } else {
    CONFIG.incidents.forEach(incident => {
      const entry = document.createElement("div");
      entry.className = "incident";
      entry.innerHTML = `
        <h3>${incident.title}</h3>
        <p><strong>${incident.date}</strong></p>
        <p>${incident.details}</p>
      `;
      log.appendChild(entry);
    });
  }

  document.getElementById("last-updated").textContent = new Date().toLocaleTimeString();
}

document.getElementById("refresh-btn").addEventListener("click", renderStatus);
setInterval(renderStatus, 5 * 60 * 1000);
renderStatus();
