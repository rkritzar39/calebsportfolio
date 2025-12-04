document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. AUTO-UPDATE TIMESTAMP
    // ==========================================
    // Status pages need to show when they were last checked.
    // This grabs the current time and puts it in the header.
    const lastUpdatedElement = document.getElementById("last-updated");
    if (lastUpdatedElement) {
        const now = new Date();
        // Format: "Last Updated: 12/4/2023, 10:30:00 AM"
        lastUpdatedElement.textContent = `Last Updated: ${now.toLocaleString()}`;
    }


    // ==========================================
    // 2. INCIDENT / STATUS COLLAPSIBLES
    // ==========================================
    const collapsibles = document.querySelectorAll(".collapsible");

    collapsibles.forEach((button) => {
        button.addEventListener("click", function() {
            // Toggle the visual "active" state of the button (the +/- rotation)
            this.classList.toggle("active");
            
            // Get the details panel (the content div)
            const content = this.nextElementSibling;

            // Logic: Is it currently showing incident details?
            if (content.style.maxHeight) {
                // CLOSE IT
                content.style.maxHeight = null;
                content.classList.remove("open");
            } else {
                // OPEN IT (Show details)
                content.classList.add("open");
                content.style.maxHeight = content.scrollHeight + "px";
                
                // IMPORTANT: If this status is nested inside another category
                // (e.g., Spotify inside Live Status), resize the parent too.
                updateParentHeight(content);
            }
        });
    });

    // Helper function to prevent nested incident reports from being cut off
    function updateParentHeight(element) {
        let parentContent = element.parentElement.closest('.content');
        
        while (parentContent) {
            if (parentContent.style.maxHeight) {
                // Add the child's height to the parent's current height
                const currentHeight = parseInt(parentContent.style.maxHeight);
                const additionalHeight = element.scrollHeight;
                
                parentContent.style.maxHeight = (currentHeight + additionalHeight) + "px";
            }
            // Keep moving up to the main container
            parentContent = parentContent.parentElement.closest('.content');
        }
    }
});
