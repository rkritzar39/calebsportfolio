import { db } from './firebase-init.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// DOM Elements
const productGrid = document.getElementById("product-grid");
const categorySelect = document.getElementById("categories");
const sectionTitle = document.getElementById("section-title");
const productCount = document.getElementById("product-count");

// Firestore reference
const productsCol = collection(db, "merch");

// Store all products
let allProducts = [];

// -----------------------------
// Render categories in dropdown
// -----------------------------
function renderCategories(products) {
  const uniqueCategories = Array.from(new Set(products.map(p => p.category))).sort();
  categorySelect.innerHTML = "";

  // All Products option
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
// Render products with variations
// -----------------------------
function renderProducts(products) {
  productGrid.innerHTML = "";
  productCount.textContent = `${products.length} product${products.length !== 1 ? 's' : ''}`;

  products.forEach(product => {
    const productDiv = document.createElement("div");
    productDiv.classList.add("product-item");

    // Default price = lowest variation or product price
    const basePrice = product.variations && product.variations.length
      ? Math.min(...product.variations.map(v => v.price))
      : product.price || 0;

    const finalPrice = product.discount
      ? (basePrice * (1 - (product.discount || 0) / 100)).toFixed(2)
      : basePrice.toFixed(2);

    // Generate variation select if variations exist
    let variationSelectHTML = "";
    if (product.variations && product.variations.length) {
      variationSelectHTML = `<select class="variation-select" data-product-id="${product.id}">`;
      product.variations.forEach((v, idx) => {
        variationSelectHTML += `<option value="${idx}" data-price="${v.price.toFixed(2)}">${v.color} - ${v.size}</option>`;
      });
      variationSelectHTML += `</select>`;
    }

    // Price HTML
    const priceHTML = product.discount
      ? `<span class="original-price">$${basePrice.toFixed(2)}</span>
         <span class="discount-price">$${finalPrice}</span>
         <span class="sale-badge">-${product.discount}% Off</span>`
      : `<span class="regular-price">$${finalPrice}</span>`;

    // Buy Now button
    const isDisabled = product.stock === "out-of-stock";
    const buttonHTML = `<button class="buy-now" ${isDisabled ? 'disabled style="background:#888; cursor:not-allowed;"' : ''}>
                          Buy Now
                        </button>`;

    productDiv.innerHTML = `
      <div class="product-image-container">
        <img src="${product.image}" alt="${product.name}">
        ${product.sale ? '<div class="sale-ribbon">Sale</div>' : ''}
        <div class="stock-ribbon ${product.stock}">${product.stock.replace("-", " ")}</div>
      </div>
      <h3>${product.name}</h3>
      ${variationSelectHTML}
      <p class="price">${priceHTML}</p>
      ${buttonHTML}
    `;

    productGrid.appendChild(productDiv);

    // -----------------------------
    // Event listener: update price on variation change
    // -----------------------------
    if (product.variations && product.variations.length) {
      const select = productDiv.querySelector(".variation-select");
      const priceSpan = productDiv.querySelector(".price .regular-price, .price .discount-price");

      select.addEventListener("change", (e) => {
        const idx = e.target.value;
        const selectedVar = product.variations[idx];
        const newPrice = product.discount
          ? (selectedVar.price * (1 - (product.discount || 0)/100)).toFixed(2)
          : selectedVar.price.toFixed(2);

        if (product.discount) {
          priceSpan.parentElement.innerHTML = `
            <span class="original-price">$${selectedVar.price.toFixed(2)}</span>
            <span class="discount-price">$${newPrice}</span>
            <span class="sale-badge">-${product.discount}% Off</span>
          `;
        } else {
          priceSpan.textContent = `$${newPrice}`;
        }
      });
    }

    // -----------------------------
    // Event listener: Buy Now button
    // -----------------------------
    const buyBtn = productDiv.querySelector(".buy-now");
    buyBtn.addEventListener("click", () => {
      if (isDisabled) return;

      let url = product.link;
      if (product.variations && product.variations.length) {
        const select = productDiv.querySelector(".variation-select");
        const idx = select.value;
        const variation = product.variations[idx];
        url += `?color=${encodeURIComponent(variation.color)}&size=${encodeURIComponent(variation.size)}`;
      }

      window.open(url, "_blank");
    });
  });
}

// -----------------------------
// Filter products by category
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
async function fetchProducts() {
  const q = query(productsCol, orderBy("order", "asc"));
  const snapshot = await getDocs(q);

  allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  renderCategories(allProducts);
  renderProducts(allProducts);
}

// Initial fetch
fetchProducts();
