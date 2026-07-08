document.addEventListener("DOMContentLoaded", () => {

    const dock = document.querySelector(".onyx-dock");
    const links = [...document.querySelectorAll(".onyx-dock .dock-item")];
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

    function moveLens(link) {

        const dockRect = dock.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();

        const padding =
            parseFloat(
                getComputedStyle(dock)
                    .paddingLeft
            ) || 0;

        const width = linkRect.width;

        const x =
            linkRect.left -
            dockRect.left -
            padding;

        dock.style.setProperty(
            "--lens-width",
            `${width}px`
        );

        dock.style.setProperty(
            "--lens-x",
            `${x}px`
        );

    }

    const currentPath = normalizePath(window.location.pathname);

    let activeLink = null;

    links.forEach(link => {

        const href = link.getAttribute("href") || "/";

        const target = normalizePath(
            new URL(
                href,
                location.origin
            ).pathname
        );

        const exact = target === currentPath;

        const nested =
            target !== "/" &&
            currentPath.startsWith(target + "/");

        if (exact || nested) {

            activeLink = link;

        }

    });

    if (!activeLink) {

        activeLink =
            document.querySelector(
                '.onyx-dock .dock-item[href="/"]'
            ) || links[0];

    }

    links.forEach(link => {

        const active = link === activeLink;

        link.classList.toggle(
            "active",
            active
        );

        if (active) {

            link.setAttribute(
                "aria-current",
                "page"
            );

        } else {

            link.removeAttribute(
                "aria-current"
            );

        }

    });

    function refresh() {

        requestAnimationFrame(() => {

            moveLens(activeLink);

        });

    }

    refresh();

    dock.classList.add("dock-ready");

    window.addEventListener(
        "resize",
        refresh
    );

    if (window.visualViewport) {

        window.visualViewport.addEventListener(
            "resize",
            refresh
        );

    }

    const year = document.getElementById("year");

    if (year) {

        year.textContent =
            new Date().getFullYear();

    }

});
