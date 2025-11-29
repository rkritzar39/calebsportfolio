// merchandise.js
import { db } from './firebase-init.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
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

    // Dynamically populate categories from products
    function populateCategories(products) {
        const categories = new Set(products.map(p => p.category).filter(c => c));
        categorySelect.innerHTML = '<option value="All Products">All Products</option>';
        categories.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    }

    // Calculate price HTML based on discount
    function getPriceHTML(product) {
        const original = Number(product.originalPrice || product.price).toFixed(2);
        let finalPrice = Number(product.price || original).toFixed(2);

        if (product.discount && product.discount > 0) {
            finalPrice = (original * (1 - product.discount / 100)).toFixed(2);
            return `
                <span class="original-price">$${original}</span>
                <span class="sale-price">$${finalPrice}</span>
                <span class="discount">-${product.discount}% Off</span>
            `;
        } else {
            return `<span class="regular-price">$${finalPrice}</span>`;
        }
    }

    // Render products
    function renderProducts(productsToRender) {
        productGrid.innerHTML = "";
        productCount.textContent = `${productsToRender.length} product${productsToRender.length !== 1 ? 's' : ''}`;

        productsToRender.forEach(product => {
            const productItem = document.createElement("div");
            productItem.classList.add("product-item");

            const saleRibbon = product.sale ? '<div class="sale-ribbon">Sale</div>' : '';
            const stockRibbon = product.stock ? `<div class="stock-ribbon ${product.stock}">${product.stock.replace("-", " ")}</div>` : '';

            const priceHTML = getPriceHTML(product);

            productItem.innerHTML = `
                <a href="${product.link}" target="_blank" class="product-link">
                    <div class="product-image-container">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
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

    // Initial load
    const products = await fetchProducts();
    populateCategories(products);
    renderProducts(products);

    // Category filtering
    categorySelect.addEventListener("change", () => {
        const selected = categorySelect.value;
        sectionTitle.textContent = selected;
        if (selected === "All Products") renderProducts(products);
        else renderProducts(products.filter(p => p.category === selected));
    });
});

// Optional: fade-in effect once fully loaded
window.addEventListener("load", () => {
    document.body.classList.add("loaded");
});
