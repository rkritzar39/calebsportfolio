document.addEventListener("DOMContentLoaded", () => {
  const dock = document.querySelector(".onyx-dock");
  const links = document.querySelectorAll(".onyx-dock .dock-item");
  const lens = document.querySelector(".dock-active-lens");

  if (!dock || !links.length || !lens) return;

  function normalizePath(path) {
    let clean = String(path || "/")
      .split("?")[0]
      .split("#")[0]
      .replace(/\/index\.html$/i, "/")
      .replace(/\/$/, "");

    if (!clean) clean = "/";
    if (clean === "/home") clean = "/";

    return clean;
  }

  function moveLensTo(link) {
    const index = Array.from(links).indexOf(link);
    const percentWidth = 100 / links.length;
    
    dock.style.setProperty("--lens-width", `${percentWidth}%`);
    dock.style.setProperty("--lens-x", `${index * 100}%`);
  }

  const currentPath = normalizePath(window.location.pathname);
  let activeLink = null;

  links.forEach((link) => {
    const href = link.getAttribute("href") || "/";
    const targetPath = normalizePath(
      new URL(href, window.location.origin).pathname
    );

    const exactMatch = targetPath === currentPath;
    const nestedMatch = targetPath !== "/" && currentPath.startsWith(targetPath + "/");

    if (exactMatch || nestedMatch) {
      activeLink = link;
    }
  });

  if (!activeLink) {
    activeLink = document.querySelector('.onyx-dock .dock-item[href="/"]') || links[0];
  }

  links.forEach((link) => {
    const isActive = link === activeLink;
    link.classList.toggle("active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  requestAnimationFrame(() => {
    moveLensTo(activeLink);
    dock.classList.add("dock-ready");
  });

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});
