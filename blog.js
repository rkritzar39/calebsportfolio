/* ============================================================================
   Blog Vanilla JavaScript - Modern Blog Functionality
   ============================================================================ */

document.addEventListener('DOMContentLoaded', function() {
    initializeBlog();
});

function initializeBlog() {
    // Initialize blog post click handlers
    const blogFeed = document.getElementById('blog-feed');
    if (blogFeed) {
        blogFeed.addEventListener('click', function(e) {
            const post = e.target.closest('.blog-post');
            if (post) {
                handleBlogPostClick(post);
            }
        });
    }

    // Initialize empty state visibility
    updateEmptyStateVisibility();
}

function handleBlogPostClick(postElement) {
    const title = postElement.querySelector('.blog-post-title')?.textContent || 'Blog Post';
    const link = postElement.querySelector('.blog-post-link');
    
    if (link && link.href) {
        window.location.href = link.href;
    }
}

function updateEmptyStateVisibility() {
    const blogFeed = document.getElementById('blog-feed');
    const emptyState = blogFeed?.querySelector('.empty-state');
    
    if (blogFeed && emptyState) {
        // Check if there are any blog posts
        const hasPosts = blogFeed.querySelectorAll('.blog-post').length > 0;
        
        if (hasPosts) {
            emptyState.style.display = 'none';
        } else {
            emptyState.style.display = 'flex';
        }
    }
}

/* ============================================================================
   Admin Tool Integration Points
   ============================================================================
   
   Your admin portal should inject HTML into this container ID:
   - Blog Feed: #blog-feed

   EMPTY STATE HANDLING:
   - The empty-state div is shown by default
   - When admin tool injects content, it should:
     a) Call clearBlogFeed() to remove empty state
     b) Then append new blog post HTML
     c) Call updateEmptyStateVisibility() to refresh visibility

   ============================================================================ */

/**
 * Helper function for admin tool to clear blog feed and remove empty state
 */
function clearBlogFeed() {
    const blogFeed = document.getElementById('blog-feed');
    if (blogFeed) {
        const emptyState = blogFeed.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        blogFeed.innerHTML = '';
    }
}

/**
 * Helper function for admin tool to add a blog post
 * @param {string} title - Blog post title
 * @param {string} excerpt - Blog post excerpt/summary
 * @param {string} date - Publication date
 * @param {string} readMoreLink - URL to full post
 * @param {array} tags - Array of tag strings
 */
function addBlogPost(title, excerpt, date = '', readMoreLink = '#', tags = []) {
    const blogFeed = document.getElementById('blog-feed');
    if (blogFeed) {
        const emptyState = blogFeed.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        const tagsHTML = tags.length > 0 
            ? tags.map(tag => `<span class="blog-post-tag">${tag}</span>`).join('')
            : '';

        const postHTML = `
            <article class="blog-post">
                <div class="blog-post-content">
                    <div class="blog-post-meta">
                        ${date ? `<span class="blog-post-date">📅 ${date}</span>` : ''}
                    </div>
                    <h2 class="blog-post-title">${title}</h2>
                    <p class="blog-post-excerpt">${excerpt}</p>
                    <div class="blog-post-footer">
                        <div class="blog-post-tags">${tagsHTML}</div>
                        <a href="${readMoreLink}" class="blog-post-link">Read More</a>
                    </div>
                </div>
            </article>
        `;

        blogFeed.insertAdjacentHTML('beforeend', postHTML);
        updateEmptyStateVisibility();
    }
}

/**
 * Helper function for admin tool to add multiple blog posts at once
 * @param {array} posts - Array of post objects with: title, excerpt, date, readMoreLink, tags
 */
function addBlogPosts(posts) {
    posts.forEach(post => {
        addBlogPost(
            post.title,
            post.excerpt,
            post.date || '',
            post.readMoreLink || '#',
            post.tags || []
        );
    });
}

/* ============================================================================
   Export functions for admin tool
   ============================================================================ */

window.BlogAdmin = {
    clearBlogFeed,
    addBlogPost,
    addBlogPosts,
    updateEmptyStateVisibility
};