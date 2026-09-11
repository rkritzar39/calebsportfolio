(() => {
  "use strict";

  function normalizePath(value) {
    let path = String(value || "/")
      .split("?")[0]
      .split("#")[0]
      .toLowerCase()
      .replace(/\/index\.html$/i, "")
      .replace(/\.html$/i, "")
      .replace(/\/+$/g, "");
    if (!path || path === "/home") path = "/";
    return path.startsWith("/") ? path : `/${path}`;
  }

  function initializeDock(dock) {
    if (!dock || dock.dataset.navReady === "true") return;

    const links = [...dock.querySelectorAll(".dock-item")];
    const lens = dock.querySelector(".dock-active-lens");
    if (!links.length) return;

    dock.dataset.navReady = "true";

    function linkPath(link) {
      try {
        return normalizePath(new URL(link.href, window.location.href).pathname);
      } catch {
        return normalizePath(link.getAttribute("href"));
      }
    }

    function currentLink() {
      const current = normalizePath(window.location.pathname);
      return links.find((link) => linkPath(link) === current) ||
        links.filter((link) => linkPath(link) !== "/" && current.startsWith(`${linkPath(link)}/`))
          .sort((a, b) => linkPath(b).length - linkPath(a).length)[0] ||
        links[0];
    }

    function moveLens(link, animate = true) {
      if (!lens || !link || link.hidden) return;
      const dockRect = dock.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      if (!animate) lens.style.transition = "none";
      dock.style.setProperty("--lens-x", `${linkRect.left - dockRect.left}px`);
      dock.style.setProperty("--lens-width", `${linkRect.width}px`);
      if (!animate) requestAnimationFrame(() => lens.style.removeProperty("transition"));
    }

    function activate(link, animate = true) {
      links.forEach((item) => {
        const active = item === link;
        item.classList.toggle("active", active);
        if (active) item.setAttribute("aria-current", "page");
        else item.removeAttribute("aria-current");
      });
      moveLens(link, animate);
    }

    links.forEach((link, index) => {
      link.addEventListener("pointerenter", () => moveLens(link, true));
      link.addEventListener("focus", () => moveLens(link, true));
      link.addEventListener("keydown", (event) => {
        let nextIndex = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % links.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + links.length) % links.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = links.length - 1;
        if (nextIndex === null) return;
        event.preventDefault();
        links[nextIndex].focus();
      });
    });

    dock.addEventListener("pointerleave", () => moveLens(currentLink(), true));

    const refresh = () => activate(currentLink(), false);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      refresh();
      dock.classList.add("dock-ready");
    }));

    window.addEventListener("resize", refresh, { passive: true });
    window.addEventListener("orientationchange", refresh, { passive: true });
    window.addEventListener("pageshow", refresh);
    window.addEventListener("popstate", refresh);
  }

  function initializeNavigation() {
    document.querySelectorAll(".onyx-dock").forEach(initializeDock);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeNavigation, { once: true });
  } else {
    initializeNavigation();
  }
})();
