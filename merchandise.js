// ====== Configuration ======
const FOURTHWALL_API_URL = "https://api.fourthwall.com/v1/products"; // Replace with your actual API endpoint
const FOURTHWALL_API_KEY = "ptkn_1f3e9e3f-0002-465d-8590-525c92bced98"; // Replace with your actual API key

const productGrid = document.getElementById("product-grid");
const categorySelect = document.getElementById("categories");
const sectionTitle = document.getElementById("section-title");
const productCount = document.getElementById("product-count");

let allProducts = [];

// ====== Fetch Products ======
async function fetchProducts() {
    try {
        const res = await fetch(FOURTHWALL_API_URL, {
            headers: {
                "Authorization": `Bearer ${FOURTHWALL_API_KEY}`,
                "Content-Type": "application/json"
            }
        });
        if (!res.ok) throw new Error("Failed to fetch products");

        const data = await res.json();
        allProducts = data.products || [];
        populateCategories(allProducts);
        renderProducts(allProducts);
    } catch (err) {
        console.error("Error fetching products:", err);
        productGrid.innerHTML = "<p style='color:red;'>Failed to load products.</p>";
    }
}

// ====== Render Products ======
function renderProducts(products) {
    productGrid.innerHTML = "";
    productCount.textContent = `${products.length} product${products.length !== 1 ? "s" : ""}`;

    products.forEach(product => {
        const hasDiscount = product.discount && product.discount > 0;
        const originalPrice = hasDiscount ? product.price.toFixed(2) : null;
        const discountPrice = hasDiscount ? (product.price * (1 - product.discount / 100)).toFixed(2) : product.price.toFixed(2);

        let stockClass = "in-stock";
        if (product.stock === 0) stockClass = "out-of-stock";
        else if (product.stock < 5) stockClass = "low-stock";

        const productHTML = `
            <div class="product-item">
                ${hasDiscount ? `<div class="discount-tag">-${product.discount}%</div>` : ""}
                <div class="stock-ribbon ${stockClass}">${product.stock > 0 ? product.stock + " left" : "Out of stock"}</div>
                <img src="${product.image}" alt="${product.name}" />
                <h3>${product.name}</h3>
                <div class="price">
                    ${hasDiscount ? `<span class="original-price">$${originalPrice}</span>` : ""}
                    <span class="discount-price">$${discountPrice}</span>
                </div>
                <button class="buy-now" ${product.stock === 0 ? "disabled" : ""} onclick="window.open('${product.url}','_blank')">
                    Buy Now
                </button>
            </div>
        `;
        productGrid.insertAdjacentHTML("beforeend", productHTML);
    });
}

// ====== Populate Categories ======
function populateCategories(products) {
    const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];
    categorySelect.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join("");
}

// ====== Filter Products ======
categorySelect.addEventListener("change", () => {
    const selected = categorySelect.value;
    if (selected === "All") {
        renderProducts(allProducts);
        sectionTitle.textContent = "All Products";
    } else {
        const filtered = allProducts.filter(p => p.category === selected);
        renderProducts(filtered);
        sectionTitle.textContent = selected;
    }
});

// ====== Initialize ======
document.addEventListener("DOMContentLoaded", fetchProducts);
