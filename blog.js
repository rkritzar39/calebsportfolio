// ================================
// blog.js — Full Blog Management & Display
// ================================

// Import Firestore (ensure firebase-init.js is included in your project)
import { db } from './firebase-init.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {

    const postsGrid = document.getElementById('posts-grid');
    const featuredContainer = document.getElementById('featured-post-container');
    const categoryFiltersContainer = document.getElementById('category-filters');
    const searchInput = document.getElementById('search-input');

    let allPosts = []; // store all posts locally for filtering

    // ----------------------------
    // Helper: format Firestore timestamp
    // ----------------------------
    function formatDate(timestamp) {
        if (!timestamp) return 'Date not available';
        return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    // ----------------------------
    // Helper: get short content from HTML
    // ----------------------------
    function getShortContent(content, maxLength = 150) {
        const text = content.replace(/<[^>]+>/g, '');
        return text.length > maxLength ? text.slice(0, maxLength) : text;
    }

    // ----------------------------
    // Fetch posts from Firestore
    // ----------------------------
    async function fetchPosts() {
        try {
            const postsRef = collection(db, 'posts');
            const postsQuery = query(postsRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(postsQuery);

            if (snapshot.empty) {
                if (postsGrid) postsGrid.innerHTML = '<p>No posts found.</p>';
                return;
            }

            allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            displayFeaturedPost(allPosts);
            displayPosts(allPosts);
            populateCategories(allPosts);

        } catch (error) {
            console.error("Error fetching posts:", error);
            if (postsGrid) postsGrid.innerHTML = '<p>Error loading posts. Please try again later.</p>';
        }
    }

    // ----------------------------
    // Display featured post
    // ----------------------------
    function displayFeaturedPost(posts) {
        if (!featuredContainer) return;
        const featuredPost = posts.find(post => post.isFeatured);

        if (featuredPost) {
            featuredContainer.style.display = 'block';
            featuredContainer.innerHTML = `
                <h2 class="section-title">Featured Post</h2>
                <article class="featured-post">
                    <img src="${escapeHTML(featuredPost.imageUrl || 'images/default-post-image.jpg')}" alt="${escapeHTML(featuredPost.title)}" class="post-image-featured" onerror="this.style.display='none';">
                    <div class="post-content-featured">
                        <h2><a href="post.html?id=${escapeHTML(featuredPost.id)}">${escapeHTML(featuredPost.title)}</a></h2>
                        <div class="post-meta">
                            <img src="${escapeHTML(featuredPost.authorPfpUrl || 'images/default-profile.jpg')}" alt="${escapeHTML(featuredPost.author)}" class="author-pfp">
                            <div class="author-details">
                                <span class="author-name"><a href="author.html?name=${encodeURIComponent(featuredPost.author)}">${escapeHTML(featuredPost.author)}</a></span>
                                <span class="post-timestamps">${escapeHTML(formatDate(featuredPost.createdAt))}</span>
                            </div>
                        </div>
                        <p>${escapeHTML(getShortContent(featuredPost.content, 200))}...</p>
                        <a href="post.html?id=${escapeHTML(featuredPost.id)}" class="read-more-btn">Read Post <i class="fas fa-arrow-right"></i></a>
                    </div>
                </article>
            `;
        } else {
            featuredContainer.style.display = 'none';
        }
    }

    // ----------------------------
    // Display all posts
    // ----------------------------
    function displayPosts(posts) {
        if (!postsGrid) return;

        postsGrid.innerHTML = '';
        const otherPosts = posts.filter(post => !post.isFeatured);

        if (otherPosts.length === 0 && posts.length > 0) return;

        if (otherPosts.length === 0) {
            postsGrid.innerHTML = '<p>No posts found.</p>';
            return;
        }

        otherPosts.forEach(post => {
            const postElement = document.createElement('article');
            postElement.className = 'post-item';
            postElement.innerHTML = `
                <img src="${escapeHTML(post.imageUrl || 'images/default-post-image.jpg')}" alt="${escapeHTML(post.title)}" class="post-image" onerror="this.style.display='none';">
                <div class="post-content">
                    <h2><a href="post.html?id=${escapeHTML(post.id)}">${escapeHTML(post.title)}</a></h2>
                    <div class="post-meta">
                        <img src="${escapeHTML(post.authorPfpUrl || 'images/default-profile.jpg')}" alt="${escapeHTML(post.author)}" class="author-pfp">
                        <div class="author-details">
                            <span class="author-name"><a href="author.html?name=${encodeURIComponent(post.author)}">${escapeHTML(post.author)}</a></span>
                            <span class="post-timestamps">${escapeHTML(formatDate(post.createdAt))}</span>
                        </div>
                    </div>
                    <p>${escapeHTML(getShortContent(post.content, 150))}...</p>
                    <a href="post.html?id=${escapeHTML(post.id)}" class="read-more-btn">Read More <i class="fas fa-arrow-right"></i></a>
                </div>
            `;
            postsGrid.appendChild(postElement);
        });
    }

    // ----------------------------
    // Populate category filters
    // ----------------------------
    function populateCategories(posts) {
        if (!categoryFiltersContainer) return;
        const categories = ['All', ...new Set(posts.map(post => post.category))];
        categoryFiltersContainer.innerHTML = categories.map(category =>
            `<button class="category-btn ${category === 'All' ? 'active' : ''}" data-category="${escapeHTML(category)}">${escapeHTML(category)}</button>`
        ).join('');
    }

    // ----------------------------
    // Filter and search posts
    // ----------------------------
    function filterAndSearch() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const activeCategoryButton = categoryFiltersContainer ? categoryFiltersContainer.querySelector('.category-btn.active') : null;
        const activeCategory = activeCategoryButton ? activeCategoryButton.dataset.category : 'All';

        let filteredPosts = allPosts;

        if (activeCategory !== 'All') filteredPosts = filteredPosts.filter(post => post.category === activeCategory);
        if (searchTerm) {
            filteredPosts = filteredPosts.filter(post =>
                post.title.toLowerCase().includes(searchTerm) ||
                post.content.toLowerCase().includes(searchTerm) ||
                post.author.toLowerCase().includes(searchTerm)
            );
        }

        displayPosts(filteredPosts);
    }

    // ----------------------------
    // Event listeners
    // ----------------------------
    if (searchInput) searchInput.addEventListener('input', filterAndSearch);

    if (categoryFiltersContainer) {
        categoryFiltersContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-btn')) {
                const currentActive = categoryFiltersContainer.querySelector('.category-btn.active');
                if (currentActive) currentActive.classList.remove('active');
                e.target.classList.add('active');
                filterAndSearch();
            }
        });
    }

    // Initial fetch
    fetchPosts();

});
