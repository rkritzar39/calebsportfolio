// rearrange.js — FINAL, FIXED, MOBILE READY VERSION

document.addEventListener("DOMContentLoaded", () => {
    initRearranging(); // Run once on page load

    // Detect settings changed from Settings page or other tabs
    window.addEventListener("storage", (e) => {
        if (e.key === "websiteSettings") {
            initRearranging();
        }
    });
});

function initRearranging() {
    console.log("🔄 Checking rearrangingEnabled setting…");

    let rearrangingEnabled = true;

    // Load the setting from settings.js via localStorage
    try {
        const stored = localStorage.getItem("websiteSettings");
        if (stored) {
            const settings = JSON.parse(stored);

            // Setting is stored as "enabled" or "disabled"
            if (settings.rearrangingEnabled === "disabled") {
                rearrangingEnabled = false;
            }
        }
    } catch (error) {
        console.error("⚠ Failed to read rearranging setting. Defaulting to enabled.", error);
    }

    const container = document.getElementById("rearrangeable-container");

    if (!container) {
        console.warn("⚠ No #rearrangeable-container found — rearranging disabled on this page.");
        return;
    }

    // Ensure SortableJS is loaded
    if (typeof Sortable === "undefined") {
        console.error("❌ SortableJS is NOT loaded. Rearranging will NOT work.");
        return;
    }

    // REARRANGING ENABLED
    if (rearrangingEnabled) {
        console.log("✅ Rearranging is ENABLED.");

        // Prevent multiple Sortable instances
        if (!container._sortableInstance) {
            container._sortableInstance = new Sortable(container, {
                animation: 160,
                ghostClass: "sortable-ghost",

                // Make mobile & tablet dragging work better
                forceFallback: true,
                touchStartThreshold: 3,

                onEnd() {
                    // Save new layout order
                    const newOrder = Array.from(
                        container.querySelectorAll("[data-section-id]")
                    ).map(el => el.dataset.sectionId);

                    localStorage.setItem("sectionOrder", JSON.stringify(newOrder));
                    console.log("💾 Saved new section order:", newOrder);
                }
            });
        }

        return; // done
    }

    // REARRANGING DISABLED
    console.log("🚫 Rearranging is DISABLED by user setting.");

    // Destroy Sortable instance if it exists
    if (container._sortableInstance) {
        container._sortableInstance.destroy();
        container._sortableInstance = null;
        console.log("🧹 Removed SortableJS instance.");
    }
}
