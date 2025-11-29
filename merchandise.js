// merchandise.js
import { db } from './firebase-init.js';
import {
  collection,
  query,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// -----------------------------
// DOM Elements
// -----------------------------
const productGrid = document.getElementById("product-grid");
const categorySelect = document.getElementById("categories");
const sectionTitle = document.getElementById("section-title");
const productCount = document.getElementById("product-count");

// -----------------------------
// Firestore collection
// -----------------------------
const productsCol = collection(db, "merch");

// -----------------------------
// All products
// -----------------------------
let allProducts = [];

// -----------------------------
// Render categories dropdown
// -----------------------------
function renderCategories(products) {
  const uniqueCategories = Array.from(new Set(products.map(p => p.category))).sort();
  categorySelect.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "All Products";
  allOption.textContent = "All Products";
  categorySelect.appendChild(allOption);

  uniqueCategories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// -----------------------------
// Render products
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
         <span class="discount-price">$${finalPrice}</span>
         <span class="sale-badge">-${product.discount}% Off</span>`
      : `<span class="regular-price">$${finalPrice}</span>`;

    const isDisabled = product.stock === "out-of-stock";
    const buttonHTML = `<button class="buy-now" 
                          ${isDisabled ? 'disabled style="background:#888; cursor:not-allowed;"' : `onclick="window.open('${product.link}', '_blank')"`}>
                          Buy Now
                        </button>`;

    const productItem = document.createElement("div");
    productItem.classList.add("product-item");
    productItem.innerHTML = `
      <div class="product-image-container">
        <img src="${product.image}" alt="${product.name}">
        ${product.sale ? '<div class="sale-ribbon">Sale</div>' : ''}
        <div class="stock-ribbon ${product.stock}">${product.stock.replace("-", " ")}</div>
      </div>
      <h3>${product.name}</h3>
      <p class="price">${priceHTML}</p>
      ${buttonHTML}
    `;

    productGrid.appendChild(productItem);
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
// Initial Fetch
// -----------------------------
async function fetchProducts() {
  const snapshot = await getDocs(query(productsCol, orderBy("order", "asc")));
  allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderCategories(allProducts);
  renderProducts(allProducts);
}

fetchProducts();
