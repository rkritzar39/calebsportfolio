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
        const q = query(merchCol, orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    }

    // Render categories dropdown dynamically
    function populateCategories(products) {
        const categories = ["All Products"];
        products.forEach(p => {
            if (p.category && !categories.includes(p.category)) {
                categories.push(p.category);
            }
        });
        categorySelect.innerHTML = "";
        categories.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    }

    // Render products in the grid
    function renderProducts(productsToRender) {
        productGrid.innerHTML = "";
        productCount.textContent = `${productsToRender.length} product${productsToRender.length !== 1 ? 's' : ''}`;

        productsToRender.forEach(product => {
            const discountedPrice = (product.price * (1 - (product.discount || 0)/100)).toFixed(2);
            const saleRibbon = product.sale ? '<div class="sale-ribbon">Sale</div>' : '';
            const stockRibbon = `<div class="stock-ribbon ${product.stock}">${product.stock.replace("-", " ")}</div>`;
            const priceHTML = product.sale
                ? `<span class="original-price">$${Number(product.price).toFixed(2)}</span>
                   <span class="sale-price">$${discountedPrice}</span>
                   <span class="discount">-${product.discount || 0}% Off</span>`
                : `<span class="regular-price">$${discountedPrice}</span>`;

            const productItem = document.createElement("div");
            productItem.classList.add("product-item");
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
    populateCategories(products);
    renderProducts(products);

    // Filter products by category
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

// Optional fade-in effect
window.addEventListener("load", () => {
    document.body.classList.add("loaded");
});
