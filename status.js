// ==== CONFIG ====
const CONFIG = {
  groups: [
    {
      name: "Core Systems",
      services: [
        { name: "Website", status: "ok", uptime: 99.98 },
        { name: "User Settings", status: "ok", uptime: 100 },
        { name: "Feature Portal", status: "warn", uptime: 97.2 }
      ]
    },
    {
      name: "APIs & Integrations",
      services: [
        { name: "Spotify Live", status: "ok", uptime: 99.6 },
        { name: "Weather API", status: "down", uptime: 92.5 },
        { name: "Firebase Sync", status: "ok", uptime: 99.9 }
      ]
    },
    {
      name: "External Services",
      services: [
        { name: "Discord Lanyard", status: "ok", uptime: 100 },
        { name: "GitHub API", status: "ok", uptime: 99.8 }
      ]
    }
  ],
  incidents: [
    {
      title: "Weather API Outage",
      date: "Nov 9, 2025",
      details: "Service unavailable due to upstream downtime. Restored after 15 mins."
    },
    {
      title: "Feature Portal Slowdown",
      date: "Nov 7, 2025",
      details: "Increased latency observed during sync. Fixed in 20 mins."
    }
  ]
};

// ==== THEME DETECT ====
function applyTheme() {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
}
applyTheme();
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);

// ==== RENDER ====
function renderStatus() {
  const container = document.getElementById("status-groups");
  const banner = document.getElementById("overall-status");
  const log = document.getElementById("incident-log");
  container.innerHTML = "";
  log.innerHTML = "";

  let allOk = true;

  CONFIG.groups.forEach((group) => {
    const groupEl = document.createElement("div");
    groupEl.className = "group";

    const header = document.createElement("div");
    header.className = "group-header";
    header.innerHTML = `
      <h2>${group.name}</h2>
      <span class="arrow">▼</span>
    `;

    const grid = document.createElement("div");
    grid.className = "status-grid";

    group.services.forEach((s) => {
      const item = document.createElement("div");
      item.className = `status-item status-${s.status}`;
      item.innerHTML = `
        <div class="status-indicator"><span></span> ${s.name}</div>
        <div class="status-text">
          ${s.status === "ok" ? "Operational ✅" : s.status === "warn" ? "Degraded ⚠️" : "Outage 🔴"}
          <span class="uptime">${s.uptime}% uptime</span>
        </div>
      `;
      grid.appendChild(item);
      if (s.status !== "ok") allOk = false;
    });

    // collapse toggle
    header.addEventListener("click", () => {
      groupEl.classList.toggle("collapsed");
    });

    groupEl.appendChild(header);
    groupEl.appendChild(grid);
    container.appendChild(groupEl);
  });

  // Banner
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

  // Incidents
  if (CONFIG.incidents.length === 0) {
    log.innerHTML = "<p>No recent incidents 🎉</p>";
  } else {
    CONFIG.incidents.forEach((incident) => {
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
