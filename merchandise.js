// Make sure to load this script with type="module" in your HTML:
// <script type="module" src="merchandise.js"></script>

import { db } from './firebase-init.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    const productGrid = document.getElementById("product-grid");
    const categorySelect = document.getElementById("categories");
    const sectionTitle = document.getElementById("section-title");
    const productCount = document.getElementById("product-count");

    // Categories for dropdown
    const categories = ["All Products", "Outdoor", "Hats", "Hoodies & Sweatshirts", "T-Shirts", "Baby & Toddler", "Kitchenwear", "Accessories"];

    // Populate category dropdown
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });

    // Fetch products from Firestore
    async function fetchProducts() {
        const merchCol = collection(db, 'merch');
        const q = query(merchCol, orderBy('order', 'asc')); // Optional 'order' field
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    }

    // Render products in the grid
    function renderProducts(products) {
        productGrid.innerHTML = "";
        productCount.textContent = `${products.length} product${products.length !== 1 ? 's' : ''}`;

        products.forEach(product => {
            const productItem = document.createElement("div");
            productItem.classList.add("product-item");

            // Sale and stock ribbons
            const saleRibbon = product.sale ? '<div class="sale-ribbon">Sale</div>' : '';
            const stockRibbon = `<div class="stock-ribbon ${product.stock}">${product.stock.replace("-", " ")}</div>`;

            // Price calculation with discount
            const finalPrice = (product.price * (1 - (product.discount || 0) / 100)).toFixed(2);
            const priceHTML = product.sale
                ? `<span class="original-price">$${Number(product.price).toFixed(2)}</span>
                   <span class="sale-price">$${finalPrice}</span>
                   <span class="discount">-${product.discount || 0}% Off</span>`
                : `<span class="regular-price">$${Number(product.price).toFixed(2)}</span>`;

            // Product card
            productItem.innerHTML = `
                <a href="${product.link}" target="_blank" class="product-image-container">
                    <img src="${product.image}" alt="${product.name}">
                    ${saleRibbon}
                    ${stockRibbon}
                </a>
                <h3>${product.name}</h3>
                <p class="price">${priceHTML}</p>
                <a href="${product.link}" class="buy-now" target="_blank">Buy Now</a>
            `;

            productGrid.appendChild(productItem);
        });
    }

    // Initial fetch and render
    let products = await fetchProducts();
    renderProducts(products);

    // Category filter
    categorySelect.addEventListener("change", () => {
        const selectedCategory = categorySelect.value;
        sectionTitle.textContent = selectedCategory;

        if (selectedCategory === "All Products") {
            renderProducts(products);
        } else {
            const filtered = products.filter(p => p.category === selectedCategory);
            renderProducts(filtered);
        }
    });
});

// Optional: add a fade-in effect after load
window.addEventListener("load", () => {
    document.body.classList.add("loaded");
});
