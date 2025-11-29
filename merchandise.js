// merchandise.js
import { db } from './firebase-init.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    const productGrid = document.getElementById("product-grid");
    const categorySelect = document.getElementById("categories");
    const sectionTitle = document.getElementById("section-title");
    const productCount = document.getElementById("product-count");

    // Define categories
    const categories = ["All Products", "Outdoor", "Hats", "Hoodies & Sweatshirts", "T-Shirts", "Baby & Toddler", "Kitchenwear", "Accessories"];
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });

    // Fetch products from Firestore
    async function fetchProducts() {
        const merchCol = collection(db, 'merch');
        const q = query(merchCol, orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    }

    // Render products into the grid
    function renderProducts(products) {
        productGrid.innerHTML = "";
        productCount.textContent = `${products.length} product${products.length !== 1 ? 's' : ''}`;

        products.forEach(product => {
            const productItem = document.createElement("div");
            productItem.classList.add("product-item");

            // Sale & stock ribbons
            const saleRibbon = product.sale ? '<div class="sale-ribbon">Sale</div>' : '';
            const stockRibbon = `<div class="stock-ribbon ${product.stock}">${product.stock.replace("-", " ")}</div>`;

            // Price HTML
            const priceHTML = product.sale
                ? `<span class="original-price">$${Number(product.originalPrice).toFixed(2)}</span>
                   <span class="sale-price">$${Number(product.price).toFixed(2)}</span>
                   <span class="discount">-${product.discount}% Off</span>`
                : `<span class="regular-price">$${Number(product.price).toFixed(2)}</span>`;

            // Product template
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

    // Fetch and render all products
    const products = await fetchProducts();
    renderProducts(products);

    // Filter products by category
    categorySelect.addEventListener("change", () => {
        const selected = categorySelect.value;
        sectionTitle.textContent = selected;

        if (selected === "All Products") {
            renderProducts(products);
        } else {
            const filtered = products.filter(p => p.category === selected);
            renderProducts(filtered);
        }
    });
});

// Optional: fade-in effect
window.addEventListener("load", () => {
    document.body.classList.add("loaded");
});
