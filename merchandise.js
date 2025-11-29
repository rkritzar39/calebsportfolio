// merchandise.js
import { db } from './firebase-init.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// DOM elements
const productGrid = document.getElementById("product-grid");
const categorySelect = document.getElementById("categories");
const sectionTitle = document.getElementById("section-title");
const productCount = document.getElementById("product-count");

// Firestore collection
const productsCol = collection(db, "merch");
const productsQuery = query(productsCol, orderBy("order", "asc"));

// State
let allProducts = [];

// -----------------------------
// Render products in grid
// -----------------------------
function renderProducts(products) {
  productGrid.innerHTML = "";
  productCount.textContent = `${products.length} product${products.length !== 1 ? 's' : ''}`;

  products.forEach(product => {
    const finalPrice = product.discount
      ? (product.price * (1 - product.discount / 100)).toFixed(2)
      : Number(product.price).toFixed(2);

    const priceHTML = product.discount
      ? `<span class="original-price">$${Number(product.price).toFixed(2)}</span>
         <span class="sale-price">$${finalPrice}</span>
         <span class="discount">-${product.discount}% Off</span>`
      : `<span class="regular-price">$${finalPrice}</span>`;

    const productItem = document.createElement("div");
    productItem.classList.add("product-item");
    productItem.innerHTML = `
      <a href="${product.link}" target="_blank">
        <div class="product-image-container">
          <img src="${product.image}" alt="${product.name}">
        </div>
        ${product.sale ? '<div class="sale-ribbon">Sale</div>' : ''}
        <div class="stock-ribbon ${product.stock}">${product.stock.replace("-", " ")}</div>
        <h3>${product.name}</h3>
        <p class="price">${priceHTML}</p>
        <span class="buy-now">Buy Now</span>
      </a>
    `;
    productGrid.appendChild(productItem);
  });
}

// -----------------------------
// Render category dropdown
// -----------------------------
function renderCategories(products) {
  const uniqueCategories = Array.from(new Set(products.map(p => p.category))).sort();
  categorySelect.innerHTML = `<option value="All Products">All Products</option>`;
  uniqueCategories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// -----------------------------
// Filter by category
// -----------------------------
categorySelect.addEventListener("change", () => {
  const selected = categorySelect.value;
  sectionTitle.textContent = selected;
  if (selected === "All Products") {
    renderProducts(allProducts);
  } else {
    renderProducts(allProducts.filter(p => p.category === selected));
  }
});

// -----------------------------
// Fetch products from Firestore
// -----------------------------
async function loadProducts() {
  const snapshot = await getDocs(productsQuery);
  allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  renderCategories(allProducts);
  renderProducts(allProducts);
}

// Initial load
loadProducts();
