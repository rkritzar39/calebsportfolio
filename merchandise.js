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

    const variations = product.variations || [];
    const hasVariations = variations.length > 0;

    // Determine base price for display
    const inStockVariations = variations.filter(v => v.stock !== "out-of-stock");
    const basePrice = inStockVariations.length
      ? Math.min(...inStockVariations.map(v => v.price))
      : product.price || 0;

    const finalPrice = product.discount
      ? (basePrice * (1 - (product.discount || 0) / 100)).toFixed(2)
      : basePrice.toFixed(2);

    // Generate variation selector if multiple variations
    let variationSelectHTML = "";
    if (hasVariations && variations.length > 1) {
      variationSelectHTML = `<select class="variation-select" data-product-id="${product.id}">`;
      variations.forEach((v, idx) => {
        const disabled = v.stock === "out-of-stock" ? "disabled" : "";
        const label = `${v.color} - ${v.size}${v.stock === "out-of-stock" ? " (Out of Stock)" : v.stock === "low-stock" ? " (Low Stock)" : ""}`;
        variationSelectHTML += `<option value="${idx}" data-price="${v.price.toFixed(2)}" ${disabled}>${label}</option>`;
      });
      variationSelectHTML += `</select>`;
    }

    // Price HTML for initial render
    const priceHTML = product.discount
      ? `<span class="original-price">$${basePrice.toFixed(2)}</span>
         <span class="discount-price">$${finalPrice}</span>
         <span class="sale-badge">-${product.discount}% Off</span>`
      : `<span class="regular-price">$${finalPrice}</span>`;

    // Determine if Buy Now button should be disabled
    const overallOutOfStock = (!hasVariations && product.stock === "out-of-stock") || (hasVariations && inStockVariations.length === 0);
    const buttonHTML = `<button class="buy-now" ${overallOutOfStock ? 'disabled style="background:#888; cursor:not-allowed;"' : ''}>Buy Now</button>`;

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
    // Update price & button when variation changes
    // -----------------------------
    const select = productDiv.querySelector(".variation-select");
    const buyBtn = productDiv.querySelector(".buy-now");
    const priceSpan = productDiv.querySelector(".price");

    const updatePriceAndButton = () => {
      if (!select) {
        // Single variation
        const singleVar = variations[0] || { price: product.price || 0, stock: product.stock };
        const newPrice = product.discount
          ? (singleVar.price * (1 - (product.discount || 0)/100)).toFixed(2)
          : singleVar.price.toFixed(2);

        if (product.discount) {
          priceSpan.innerHTML = `
            <span class="original-price">$${singleVar.price.toFixed(2)}</span>
            <span class="discount-price">$${newPrice}</span>
            <span class="sale-badge">-${product.discount}% Off</span>
          `;
        } else {
          priceSpan.innerHTML = `<span class="regular-price">$${newPrice}</span>`;
        }

        buyBtn.disabled = singleVar.stock === "out-of-stock";
        buyBtn.style.background = singleVar.stock === "out-of-stock" ? "#888" : "";
        buyBtn.style.cursor = singleVar.stock === "out-of-stock" ? "not-allowed" : "";
        return;
      }

      const idx = select.value;
      const selectedVar = variations[idx];
      const newPrice = product.discount
        ? (selectedVar.price * (1 - (product.discount || 0)/100)).toFixed(2)
        : selectedVar.price.toFixed(2);

      if (product.discount) {
        priceSpan.innerHTML = `
          <span class="original-price">$${selectedVar.price.toFixed(2)}</span>
          <span class="discount-price">$${newPrice}</span>
          <span class="sale-badge">-${product.discount}% Off</span>
        `;
      } else {
        priceSpan.innerHTML = `<span class="regular-price">$${newPrice}</span>`;
      }

      buyBtn.disabled = selectedVar.stock === "out-of-stock";
      buyBtn.style.background = selectedVar.stock === "out-of-stock" ? "#888" : "";
      buyBtn.style.cursor = selectedVar.stock === "out-of-stock" ? "not-allowed" : "";
    };

    if (select) select.addEventListener("change", updatePriceAndButton);
    updatePriceAndButton(); // Initial trigger

    // -----------------------------
    // Buy Now click event
    // -----------------------------
    buyBtn.addEventListener("click", () => {
      if (buyBtn.disabled) return;

      let url = product.link;
      let selectedVar = variations[0];
      if (select) selectedVar = variations[select.value];
      if (selectedVar) url += `?color=${encodeURIComponent(selectedVar.color)}&size=${encodeURIComponent(selectedVar.size)}`;
      window.open(url, "_blank");
    });
  });
}

// -----------------------------
// Category filter
// -----------------------------
categorySelect.addEventListener("change", () => {
  const selected = categorySelect.value;
  sectionTitle.textContent = selected;
  if (selected === "All Products") renderProducts(allProducts);
  else renderProducts(allProducts.filter(p => p.category === selected));
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
