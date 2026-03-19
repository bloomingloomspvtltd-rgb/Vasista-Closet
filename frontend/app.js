const API_BASE = "https://vasista-closet-1.onrender.com";

const productDetailEl = document.getElementById("product-detail");
const similarListEl = document.getElementById("similar-list");
const similarEmptyEl = document.getElementById("similar-empty");
const thumbsEl = document.getElementById("thumbs");
const mainImageEl = document.getElementById("main-image");

let products = [];
let activeId = null;

async function fetchProducts() {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) {
    throw new Error("Failed to load products");
  }
  return res.json();
}

async function fetchProductDetail(id) {
  const res = await fetch(`${API_BASE}/products/${id}`);
  if (!res.ok) {
    throw new Error("Failed to load product detail");
  }
  return res.json();
}

function normalizeImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return `${API_BASE}/${url}`;
}

function setMainImage(url) {
  const finalUrl = normalizeImageUrl(url);
  if (!finalUrl) {
    mainImageEl.removeAttribute("src");
    mainImageEl.alt = "No image available";
    return;
  }
  mainImageEl.src = finalUrl;
  mainImageEl.alt = "Product image";
}

function renderGallery(images) {
  const safeImages = Array.isArray(images) ? images.filter(Boolean) : [];
  thumbsEl.innerHTML = "";
  if (safeImages.length === 0) {
    setMainImage("");
    return;
  }
  setMainImage(safeImages[0]);
  safeImages.forEach((url, idx) => {
    const img = document.createElement("img");
    img.className = "thumb" + (idx === 0 ? " active" : "");
    img.src = normalizeImageUrl(url);
    img.alt = "Thumbnail";
    img.addEventListener("click", () => {
      setMainImage(url);
      document
        .querySelectorAll(".thumb")
        .forEach((el) => el.classList.remove("active"));
      img.classList.add("active");
    });
    thumbsEl.appendChild(img);
  });
}

function renderProductDetail(product) {
  const price = typeof product.price === "number" ? `Rs ${product.price}` : "";
  const category = product.category ? `Category: ${product.category}` : "";
  const tags = Array.isArray(product.tags) ? product.tags : [];
  const description = product.description || "Product description will be updated soon.";
  const sku = product.sku ? `SKU: ${product.sku}` : "";

  productDetailEl.innerHTML = `
    <h1 class="product-title">${product.name || "Untitled"}</h1>
    ${price ? `<div class="price">${price}</div>` : ""}
    <div class="product-meta">
      ${sku ? `<div>${sku}</div>` : ""}
      ${category ? `<div>${category}</div>` : ""}
    </div>
    <p>${description}</p>
    <div>
      ${tags.map((t) => `<span class="tag">${t}</span>`).join(" ")}
    </div>
    <div class="cta">
      <div class="btn outline">Add to Cart</div>
      <div class="btn">Buy Now</div>
    </div>
  `;
}

function renderSimilar(similar) {
  similarListEl.innerHTML = "";
  if (!Array.isArray(similar) || similar.length === 0) {
    similarEmptyEl.hidden = false;
    return;
  }
  similarEmptyEl.hidden = true;
  similar.forEach((p) => {
    const card = document.createElement("div");
    card.className = "similar-card";
    const imageUrl = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : "";
    card.innerHTML = `
      ${
        imageUrl
          ? `<img src="${normalizeImageUrl(imageUrl)}" alt="${p.name || "Product"}" />`
          : ""
      }
      <div class="similar-name">${p.name || "Untitled"}</div>
      ${typeof p.price === "number" ? `<div class="similar-price">Rs ${p.price}</div>` : ""}
    `;
    card.addEventListener("click", () => loadProduct(p.id));
    similarListEl.appendChild(card);
  });
}

async function loadProduct(id) {
  try {
    activeId = id;
    const product = await fetchProductDetail(id);
    renderGallery(product.images || []);
    renderProductDetail(product);
    renderSimilar(product.similar_products || []);
  } catch (err) {
    productDetailEl.innerHTML = `<div class="empty">${err.message}</div>`;
    renderGallery([]);
    renderSimilar([]);
  }
}

async function init() {
  try {
    products = await fetchProducts();
    if (products.length > 0) {
      await loadProduct(products[0].id);
    } else {
      productDetailEl.innerHTML = `<div class="empty">No products found.</div>`;
      renderGallery([]);
    }
  } catch (err) {
    productDetailEl.innerHTML = `<div class="empty">${err.message}</div>`;
  }
}

init();
