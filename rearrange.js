// rearrange.js — FINAL, FIXED, MOBILE READY VERSION (LOCKED SECTIONS FIX)

document.addEventListener("DOMContentLoaded", () => {
  initRearranging();

  window.addEventListener("storage", (e) => {
    if (e.key === "websiteSettings") initRearranging();
  });
});

function initRearranging() {
  console.log("🔄 Checking rearrangingEnabled setting…");

  // Match your settings.js default: "disabled"
  let rearrangingEnabled = false;

  try {
    const stored = localStorage.getItem("websiteSettings");
    if (stored) {
      const settings = JSON.parse(stored);
      rearrangingEnabled = settings.rearrangingEnabled === "enabled";
    }
  } catch (error) {
    console.error("⚠ Failed to read rearranging setting. Defaulting to disabled.", error);
  }

  const container = document.getElementById("rearrangeable-container");
  if (!container) {
    console.warn("⚠ No #rearrangeable-container found — rearranging disabled on this page.");
    return;
  }

  if (typeof Sortable === "undefined") {
    console.error("❌ SortableJS is NOT loaded. Rearranging will NOT work.");
    return;
  }

  // ENABLED
  if (rearrangingEnabled) {
    console.log("✅ Rearranging is ENABLED.");

    if (!container._sortableInstance) {
      container._sortableInstance = new Sortable(container, {
        animation: 160,
        ghostClass: "sortable-ghost",

        // ✅ ONLY allow dragging real moveable sections:
        // - must be a .section
        // - must have data-section-id
        // - must NOT have .no-rearrange
        draggable: ".section[data-section-id]:not(.no-rearrange)",

        // ✅ Extra safety: never move these if something weird matches
        filter: ".no-rearrange",

        // Keep clicks working inside filtered elements
        preventOnFilter: false,

        // Better touch behavior
        forceFallback: true,
        touchStartThreshold: 3,

        // ✅ Hard stop: if either side is locked, block the move
        onMove(evt) {
          const dragged = evt.dragged;
          const related = evt.related;

          if (dragged?.classList?.contains("no-rearrange")) return false;
          if (related?.classList?.contains("no-rearrange")) return false;

          return true;
        },

        onEnd() {
          // Save only the movable sections
          const newOrder = Array.from(
            container.querySelectorAll(".section[data-section-id]")
          ).map((el) => el.dataset.sectionId);

          localStorage.setItem("sectionOrder", JSON.stringify(newOrder));
          console.log("💾 Saved new section order:", newOrder);
        },
      });
    }

    return;
  }

  // DISABLED
  console.log("🚫 Rearranging is DISABLED by user setting.");

  if (container._sortableInstance) {
    container._sortableInstance.destroy();
    container._sortableInstance = null;
    console.log("🧹 Removed SortableJS instance.");
  }
}
