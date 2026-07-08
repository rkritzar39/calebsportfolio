document.addEventListener("DOMContentLoaded", () => {

    const dock = document.querySelector(".onyx-dock");
    const links = [...document.querySelectorAll(".onyx-dock .dock-item")];
    const lens = document.querySelector(".dock-active-lens");

    if (!dock || !links.length || !lens) return;

    function normalizePath(path) {

        let clean = String(path || "/")
            .split("?")[0]
            .split("#")[0]
            .replace(//index.html$/i, "/")
            .replace(//$/, "");

        if (!clean) clean = "/";
        if (clean === "/home") clean = "/";

        return clean;

    }

    function moveLens(link) {

        if (!link) return;

        const styles = getComputedStyle(dock);

        const paddingLeft =
            parseFloat(styles.paddingLeft) || 0;

        const paddingRight =
            parseFloat(styles.paddingRight) || paddingLeft;

        const dockWidth = dock.clientWidth;

        const width = link.offsetWidth;

        /*
            CSS lens starts at:
            left: var(--dock-padding);

            So subtract paddingLeft here.
        */
        let x =
            link.offsetLeft -
            paddingLeft;

        const minX = 0;

        const maxX =
            dockWidth -
            paddingLeft -
            paddingRight -
            width;

        x = Math.max(
            minX,
            Math.min(x, maxX)
        );

        dock.style.setProperty(
            "--lens-width",
            ${Math.round(width)}px
        );

        dock.style.setProperty(
            "--lens-x",
            ${Math.round(x)}px
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

        const exact =
            target === currentPath;

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

        const active =
            link === activeLink;

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

    window.addEventListener(
        "load",
        refresh
    );

    if (window.visualViewport) {

        window.visualViewport.addEventListener(
            "resize",
            refresh
        );

    }

    if (document.fonts) {

        document.fonts.ready.then(refresh);

    }

    const year = document.getElementById("year");

    if (year) {

        year.textContent =
            new Date().getFullYear();

    }

});
