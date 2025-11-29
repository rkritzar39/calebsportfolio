// merchandise.js
import { db } from './firebase-init.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async function() {
    const productGrid = document.getElementById("product-grid");
    const categorySelect = document.getElementById("categories");
    const sectionTitle = document.getElementById("section-title");
    const productCount = document.getElementById("product-count");

    // Fetch products from Firestore
    async function fetchProducts() {
        const merchCol = collection(db, 'merch');
        const q = query(merchCol, orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    }

    // Render products in the grid
    function renderProducts(productsToRender) {
        productGrid.innerHTML = "";

        productCount.textContent = `${productsToRender.length} product${productsToRender.length !== 1 ? 's' : ''}`;

        productsToRender.forEach(product => {
            const productItem = document.createElement("div");
            productItem.classList.add("product-item");

            const saleRibbon = product.sale ? '<div class="sale-ribbon">Sale</div>' : '';
            const stockRibbon = `<div class="stock-ribbon ${product.stock}">${product.stock.replace("-", " ")}</div>`;

            const priceHTML = product.sale
                ? `<span class="original-price">$${Number(product.originalPrice).toFixed(2)}</span>
                   <span class="sale-price">$${Number(product.price).toFixed(2)}</span>
                   <span class="discount">-${product.discount}% Off</span>`
                : `<span class="regular-price">$${Number(product.price).toFixed(2)}</span>`;

            productItem.innerHTML = `
                <a href="${product.link}" target="_blank">
                    <img src="${product.image}" alt="${product.name}">
                    ${saleRibbon}
                    ${stockRibbon}
                    <h3>${product.name}</h3>
                    <p class="price">${priceHTML}</p>
                    <span class="buy-now">Buy Now</span>
                </a>
            `;

            productGrid.appendChild(productItem);
        });
    }

    // Initial fetch and render
    const products = await fetchProducts();
    renderProducts(products);

    // Category filtering
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

// Optional: fade-in effect once fully loaded
window.addEventListener("load", () => {
    document.body.classList.add("loaded");
});
