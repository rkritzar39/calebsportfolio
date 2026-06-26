document.addEventListener('DOMContentLoaded', () => {
    const postContentArea = document.getElementById('post-content-area');
    const db = firebase.firestore();

    // Get post ID from URL
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
        postContentArea.innerHTML = '<h1>Post not found</h1><p>No post ID was provided.</p>';
        return;
    }

    // Helper to format dates
    function formatTimestamp(timestamp) {
        if (!timestamp) return '';
        return new Date(timestamp.seconds * 1000).toLocaleString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    // Fetch the single post from Firebase
    async function fetchPost() {
        try {
            const doc = await db.collection('posts').doc(postId).get();

            if (doc.exists) {
                const post = doc.data();
                document.title = post.title; // Update page title

                let timestampsHTML = `<span class="post-date">Posted on ${escapeHTML(formatTimestamp(post.createdAt))}</span>`;
                // Check if updatedAt is significantly different from createdAt
                if (post.updatedAt && post.createdAt && post.updatedAt.seconds - post.createdAt.seconds > 60) {
                     timestampsHTML += `<br><span class="update-date">Last updated on ${escapeHTML(formatTimestamp(post.updatedAt))}</span>`;
                }

                // Sanitize the rich-HTML content field with DOMPurify to allow
                // legitimate markup while stripping any injected scripts or event handlers.
                const safeContent = (typeof DOMPurify !== 'undefined')
                    ? DOMPurify.sanitize(post.content || '')
                    : escapeHTML(post.content);

                postContentArea.innerHTML = `
                    <h1 class="post-title">${escapeHTML(post.title)}</h1>
                    <div class="post-author-info">
                        ${post.authorPfpUrl ? `<img src="${escapeHTML(post.authorPfpUrl)}" alt="${escapeHTML(post.author)}" class="author-pfp">` : ''}
                        <div class="author-details">
                            <span class="author-name">${escapeHTML(post.author)}</span>
                            <div class="post-timestamps">${timestampsHTML}</div>
                        </div>
                    </div>
                    <div class="post-main-content">
                        ${safeContent}
                    </div>
                `;
            } else {
                postContentArea.innerHTML = '<h1>Post not found</h1><p>The requested blog post does not exist.</p>';
            }
        } catch (error) {
            console.error("Error fetching post:", error);
            postContentArea.innerHTML = '<h1>Error</h1><p>Could not load the post. Please try again later.</p>';
        }
    }

    fetchPost();
});
