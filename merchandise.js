// merchandise.js
import { db } from './firebase-init.js';
import { collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const productGrid = document.getElementById("product-grid");
const categorySelect = document.getElementById("categories");
const sectionTitle = document.getElementById("section-title");
const productCount = document.getElementById("product-count");

const productsCol = collection(db, "merch");

// -----------------------------
// Fetch and render products in real-time
// -----------------------------
let products = [];

onSnapshot(query(productsCol, orderBy("order", "asc")), (snapshot) => {
    products = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    updateCategoryDropdown();
    renderProducts(products);
});

// -----------------------------
// Update Category Dropdown
// -----------------------------
function updateCategoryDropdown() {
    const uniqueCategories = ["All Products", ...new Set(products.map(p => p.category))];
    categorySelect.innerHTML = "";
    uniqueCategories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

// -----------------------------
// Render Products
// -----------------------------
function renderProducts(productsToRender) {
    productGrid.innerHTML = "";
    productCount.textContent = `${productsToRender.length} product${productsToRender.length !== 1 ? 's' : ''}`;

    productsToRender.forEach(product => {
        const finalPrice = product.discount
            ? (product.price * (1 - product.discount / 100)).toFixed(2)
            : Number(product.price).toFixed(2);

        const saleRibbon = product.sale ? '<div class="sale-ribbon">Sale</div>' : '';
        const stockRibbon = `<div class="stock-ribbon ${product.stock}">${product.stock.replace("-", " ")}</div>`;

        const priceHTML = product.sale
            ? `<span class="original-price">$${Number(product.price).toFixed(2)}</span>
               <span class="sale-price">$${finalPrice}</span>
               <span class="discount">-${product.discount}% Off</span>`
            : `<span class="regular-price">$${finalPrice}</span>`;

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

// -----------------------------
// Category Filtering
// -----------------------------
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

// Optional: fade-in effect once fully loaded
window.addEventListener("load", () => {
    document.body.classList.add("loaded");
});
