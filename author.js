// Import the initialized Firebase database instance from your existing file
import { db } from './firebase-init.js';
import { collection, query, where, getDocs, orderBy, Timestamp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Helper function to format time
function formatRelativeTime(createdAt, updatedAt) {
    if (!createdAt) return "Posted (unknown time)";
    const createdDate = createdAt.toDate();
    const now = new Date();
    const diffMs = now - createdDate;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let result = "";
    if (diffMinutes < 60) {
        result = `Posted ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        result = `Posted ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
        result = `Posted on ${createdDate.toLocaleDateString()}`;
    }

    if (updatedAt && updatedAt.toDate() > createdDate) {
        const updatedDate = updatedAt.toDate();
        result += ` (Edited on ${updatedDate.toLocaleDateString()})`;
    }
    return result;
}

document.addEventListener('DOMContentLoaded', () => {
    const postsGrid = document.getElementById('posts-grid');
    // MODIFIED: Get the new h2 element for the author's name
    const authorNameHeader = document.getElementById('author-header-name');
    const authorPfpHeaderElement = document.getElementById('author-header-pfp');

    const params = new URLSearchParams(window.location.search);
    const authorName = params.get('name');

    if (!authorName) {
        // MODIFIED: Update the new header element if author not found
        authorNameHeader.textContent = "Author Not Found";
        postsGrid.innerHTML = '<p>No author was specified in the URL.</p>';
        return;
    }

    // MODIFIED: Update the new header element with the author's name
    authorNameHeader.textContent = authorName;
    document.title = `Posts by ${authorName}`; // Keep the page title the same

    async function fetchPostsByAuthor() {
        postsGrid.innerHTML = `<p>Loading posts by ${authorName}...</p>`;
        try {
            const postsRef = collection(db, 'posts');
            const authorQuery = query(postsRef, where("author", "==", authorName), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(authorQuery);

            if (snapshot.empty) {
                postsGrid.innerHTML = `<p>No posts found for this author.</p>`;
                return;
            }

            const firstPostData = snapshot.docs[0].data();
            const authorPfpUrl = firstPostData.authorPfpUrl || 'images/default-profile.jpg';
           
            if(authorPfpHeaderElement) {
                authorPfpHeaderElement.src = authorPfpUrl;
                authorPfpHeaderElement.alt = authorName;
            }

            postsGrid.innerHTML = ''; 

            snapshot.forEach(doc => {
                const post = { id: doc.id, ...doc.data() };
                const postCard = document.createElement('div');
                postCard.className = 'post-card';

                postCard.innerHTML = `
                    <div class="post-card-content">
                        <span class="post-category">${escapeHTML(post.category)}</span>
                        <h3>${escapeHTML(post.title)}</h3>
                        <p>${escapeHTML(post.content.substring(0, 100))}...</p>
                        <div class="post-meta">
                            <img src="${escapeHTML(authorPfpUrl)}" class="author-pfp" alt="${escapeHTML(authorName)}">
                            <div class="author-details">
                                <span class="author-name">${escapeHTML(authorName)}</span>
                                <span class="post-time">${escapeHTML(formatRelativeTime(post.createdAt, post.updatedAt))}</span>
                            </div>
                        </div>
                        <a href="post.html?id=${escapeHTML(post.id)}" class="read-more-btn">Read More</a>
                    </div>`;
                postsGrid.appendChild(postCard);
            });

        } catch (error) {
            console.error("Error fetching posts by author:", error);
            postsGrid.innerHTML = '<p class="error">Could not load posts. Please check Firestore rules and the console.</p>';
        }
    }

    fetchPostsByAuthor();
});
