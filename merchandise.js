import { db } from './firebase-init.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async function() {
    // Set the current year dynamically in the footer
    document.getElementById("year").textContent = new Date().getFullYear();

    // Categories for filtering
    const categories = ["All Products", "Outdoor", "Hats", "Hoodies & Sweatshirts", "T-Shirts", "Baby & Toddler", "Kitchenwear", "Accessories"];
    const categorySelect = document.getElementById("categories");
    const sectionTitle = document.getElementById("section-title");
    const productCount = document.getElementById("product-count");
    const productGrid = document.getElementById("product-grid");

    // Populate category dropdown
    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });

    // Fetch products from Firestore
    const merchCol = collection(db, 'merch');
    const q = query(merchCol, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(docSnap => docSnap.data());

    // Render products
    function renderProducts(productsToRender) {
        productGrid.innerHTML = "";
        productCount.textContent = `${productsToRender.length} product${productsToRender.length !== 1 ? 's' : ''}`;

        productsToRender.forEach(product => {
            const productItem = document.createElement("div");
            productItem.classList.add("product-item");

            // Sale ribbon
            const saleRibbon = product.sale ? '<div class="sale-ribbon">Sale</div>' : '';
            const stockRibbon = `<div class="stock-ribbon ${product.stock}">${product.stock.replace("-", " ")}</div>`;

            // Price rendering
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

    // Initial render
    renderProducts(products);

    // Category filtering
    categorySelect.addEventListener("change", function() {
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

window.addEventListener("load", function() {
    document.body.classList.add("loaded");
});
