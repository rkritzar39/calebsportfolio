async function loadStatus() {
  const res = await fetch("status-data.json");
  const data = await res.json();

  // INCIDENT BANNER
  const banner = document.getElementById("incident-banner");

  if (data.incident?.active) {
    banner.classList.remove("hide");

    const cls =
      data.incident.status === "major"
        ? "incident-major"
        : "incident-minor";

    banner.classList.add(cls);

    banner.innerHTML = `
      <strong>${data.incident.title}</strong><br>
      ${data.incident.description}
    `;
  }

  // GROUPS + COMPONENTS
  const container = document.getElementById("status-groups");
  container.innerHTML = "";

  data.groups.forEach(group => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "group";
    groupDiv.innerHTML = `
      <div class="group-title">${group.name}</div>
    `;

    group.components.forEach(c => {
      const cEl = document.createElement("div");
      cEl.className = "component";

      cEl.innerHTML = `
        <div>${c.name}</div>
        <div class="status ${c.status}">${formatStatus(c.status)}</div>
      `;

      // Uptime History
      const hist = document.createElement("div");
      hist.className = "history";

      c.history.forEach(h => {
        const hDiv = document.createElement("div");
        hDiv.classList.add(h);
        hist.appendChild(hDiv);
      });

      cEl.appendChild(hist);
      groupDiv.appendChild(cEl);
    });

    container.appendChild(groupDiv);
  });
}

function formatStatus(s) {
  if (s === "operational") return "Operational";
  if (s === "warn") return "Partial Outage";
  if (s === "major") return "Major Outage";
  return s;
}

loadStatus();
