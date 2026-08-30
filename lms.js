/* ============================================================================
   LMS Vanilla JavaScript - Schoology Replica Functionality
   ============================================================================ */

document.addEventListener('DOMContentLoaded', function() {
    initializeLMS();
});

function initializeLMS() {
    // Initialize sidebar tab switching
    const sidebarTabs = document.querySelectorAll('.sidebar-tab');
    const tabContents = document.querySelectorAll('.lms-tab-content');

    sidebarTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            sidebarTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });

    // Initialize folder accordion functionality
    initializeFolderAccordions();

    // Initialize profile dropdown
    initializeProfileDropdown();

    // Initialize modal
    initializeModal();
}

function initializeFolderAccordions() {
    const folders = document.querySelectorAll('.schoology-folder');
    
    folders.forEach(folder => {
        folder.addEventListener('click', function(e) {
            // Prevent event bubbling if clicking on a nested item
            if (e.target.closest('.folder-item')) {
                handleFolderItemClick(e.target.closest('.folder-item'));
                return;
            }

            // Toggle folder expansion
            const contents = this.querySelector('.folder-contents');
            if (contents) {
                e.preventDefault();
                contents.classList.toggle('expanded');
                
                // Update aria-expanded for accessibility
                this.setAttribute('aria-expanded', 
                    contents.classList.contains('expanded') ? 'true' : 'false');
            }
        });

        // Set initial aria-expanded state
        const contents = folder.querySelector('.folder-contents');
        if (contents) {
            folder.setAttribute('aria-expanded', 'false');
        }
    });
}

function handleFolderItemClick(item) {
    const title = item.querySelector('.item-title')?.textContent || 'Item Details';
    const date = item.querySelector('.item-date')?.textContent || 'No date';
    
    openModal(`
        <h2>${title}</h2>
        <p><strong>Date:</strong> ${date}</p>
        <p>Item details and content will appear here when populated by the admin tool.</p>
    `);
}

function initializeProfileDropdown() {
    const profileBtn = document.querySelector('.nav-profile-btn');
    const dropdownMenu = document.querySelector('.profile-dropdown-menu');

    if (profileBtn && dropdownMenu) {
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.nav-profile-dropdown')) {
                dropdownMenu.style.display = 'none';
            }
        });
    }
}

function initializeModal() {
    const modal = document.getElementById('lms-modal');
    const closeBtn = document.querySelector('.modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }
}

function openModal(content) {
    const modal = document.getElementById('lms-modal');
    const modalBody = document.getElementById('modal-body');
    
    if (modal && modalBody) {
        modalBody.innerHTML = content;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('lms-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/* ============================================================================
   Admin Tool Integration Points
   ============================================================================
   
   Your admin portal should inject HTML into these container IDs:
   
   1. Materials: #materials-container
   2. Updates: #updates-container
   3. Grades: #grades-container
   4. Mastery: #mastery-container
   5. Members: #members-container

   EMPTY STATE HANDLING:
   - The empty-state div is shown by default
   - When admin tool injects content, it should:
     a) Remove the empty-state div first
     b) Then append new folder/item HTML
     c) Re-initialize folder accordions by calling initializeFolderAccordions()

   ============================================================================ */

/**
 * Helper function for admin tool to clear a container and remove empty state
 * @param {string} containerId - The ID of the container to clear
 */
function clearContainer(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        container.innerHTML = '';
    }
}

/**
 * Helper function for admin tool to add a folder to materials
 * @param {string} folderName - Name of the folder
 * @param {string} folderColor - Color class: 'folder-blue', 'folder-red', etc.
 * @param {number} itemCount - Number of items in folder
 */
function addFolder(folderName, folderColor, itemCount = 0) {
    const container = document.getElementById('materials-container');
    if (container) {
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        const folderHTML = `
            <div class="schoology-folder ${folderColor}" role="button" tabindex="0" aria-expanded="false">
                <div class="folder-icon">📁</div>
                <div class="folder-name">${folderName}</div>
                <div class="folder-item-count">${itemCount} item${itemCount !== 1 ? 's' : ''}</div>
                <div class="folder-contents"></div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', folderHTML);
        initializeFolderAccordions();
    }
}

/**
 * Helper function for admin tool to add an item to a folder
 * @param {number} folderIndex - Index of the folder (0-based)
 * @param {string} itemTitle - Title of the item
 * @param {string} itemIcon - Emoji or icon for the item
 * @param {string} itemDate - Date string for the item
 */
function addItemToFolder(folderIndex, itemTitle, itemIcon = '📄', itemDate = '') {
    const folders = document.querySelectorAll('.schoology-folder');
    if (folders[folderIndex]) {
        const folderContents = folders[folderIndex].querySelector('.folder-contents');
        if (folderContents) {
            const itemHTML = `
                <div class="folder-item" role="button" tabindex="0">
                    <div class="item-icon">${itemIcon}</div>
                    <div class="item-details">
                        <div class="item-title">${itemTitle}</div>
                        ${itemDate ? `<div class="item-date">${itemDate}</div>` : ''}
                    </div>
                </div>
            `;
            folderContents.insertAdjacentHTML('beforeend', itemHTML);
        }
    }
}

/**
 * Helper function for admin tool to add an update/announcement
 * @param {string} title - Update title
 * @param {string} content - Update content/body
 * @param {string} date - Date of the update
 */
function addUpdate(title, content, date = '') {
    const container = document.getElementById('updates-container');
    if (container) {
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        const updateHTML = `
            <div class="update-item">
                <div class="update-header">
                    <h3 class="update-title">${title}</h3>
                    ${date ? `<span class="update-date">${date}</span>` : ''}
                </div>
                <div class="update-content">${content}</div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', updateHTML);
    }
}

/* ============================================================================
   Export functions for admin tool
   ============================================================================ */

window.LMSAdmin = {
    clearContainer,
    addFolder,
    addItemToFolder,
    addUpdate,
    openModal,
    closeModal
};
