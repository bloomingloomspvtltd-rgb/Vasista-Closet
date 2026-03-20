"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { getCategories, getProducts } from "@/lib/storeApi";
import { getRuntimeApiBase } from "@/lib/apiBase";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";
import { normalizeCategoryLabel } from "@/lib/categoryLabel";

const CATEGORY_ALIASES = {
  kurtas: ["kurthas"],
  kurtis: ["kurthis"],
  kurtasets: ["kurta sets", "kurta-sets", "kurthasets"],
  kurthasets: ["kurta sets", "kurta-sets", "kurtasets"],
  casualkurthasets: ["kurta sets", "kurta-sets", "kurthasets", "kurtasets"],
  coordsets: ["coord sets", "coord-sets", "co-ord sets", "co ord sets", "coorsets", "coordsets"],
  coorsets: ["coord sets", "coord-sets", "co-ord sets", "co ord sets", "coordsets"],
  premiumcollection: ["premium collection", "premium collections", "premium kurtas"],
  newarrivals: ["new arrivals", "new"],
};

function normalizeImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  const base = getRuntimeApiBase();
  if (url.startsWith("/")) return `${base}${url}`;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        return `${base}${parsed.pathname}${parsed.search}`;
      }
      if (parsed.pathname.startsWith("/uploads/")) {
        return `${base}${parsed.pathname}`;
      }
    } catch (err) {
      return url;
    }
    return url;
  }
  return `${base}/${url}`;
}

function getPrimaryImage(product) {
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  if (colors.length > 0) {
    const firstColor = colors[0];
    const colorImages = Array.isArray(firstColor?.images) ? firstColor.images : [];
    if (colorImages.length > 0) return normalizeImageUrl(colorImages[0]);
    if (firstColor?.image) return normalizeImageUrl(firstColor.image);
  }
  const images = Array.isArray(product?.images) ? product.images : [];
  if (images.length > 0) return normalizeImageUrl(images[0]);
  return "";
}

function getCategoryLabel(product) {
  const categories = Array.isArray(product?.categories) ? product.categories : [];
  const primary = product?.category || categories[0];
  return normalizeCategoryLabel(primary) || "Uncategorized";
}

function normalizeCategory(value) {
  return (value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

function getCategoryMatchSet(categoryParam) {
  const key = normalizeCategory(categoryParam);
  const aliases = CATEGORY_ALIASES[key] || [];
  const variants = [categoryParam, ...aliases];
  return new Set(variants.map(normalizeCategory));
}

function isShowAllCategory(categoryParam) {
  const key = normalizeCategory(categoryParam);
  return key === "new" || key === "newarrivals";
}

function productMatchesCategory(product, categoryName) {
  if (isShowAllCategory(categoryName)) return true;
  const matchSet = getCategoryMatchSet(categoryName);
  if (matchSet.size === 0) return false;
  const categories = Array.isArray(product?.categories)
    ? product.categories
    : product?.category
      ? [product.category]
      : [];
  return categories.some((name) => matchSet.has(normalizeCategory(name)));
}

export default function CategoryPage() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const params = useParams();
  const categoryParam = decodeURIComponent(params.category || "");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [categoryData, productData] = await Promise.all([
          getCategories(),
          getProducts(),
        ]);
        setCategories(categoryData);
        setProducts(productData);
      } catch (err) {
        setCategories([]);
        setProducts([]);
      }
    };
    load();
  }, []);

  const category = useMemo(() => {
    const matchSet = getCategoryMatchSet(categoryParam);
    return categories.find((item) => matchSet.has(normalizeCategory(item.name)));
  }, [categories, categoryParam]);

  const filteredProducts = useMemo(
    () => products.filter((product) => productMatchesCategory(product, categoryParam)),
    [products, categoryParam]
  );

  const otherCategories = categories.filter((item) => item.name !== category?.name);

  return (
    <div className="category-listing-page">
      <section className="category-hero">
        <div className="category-hero-inner">
          <p className="category-kicker">Category</p>
          <h1>{category?.name || categoryParam}</h1>
          {category?.description && category.description.trim().toLowerCase() !== "coming soon" ? (
            <p className="category-subtitle">{category.description}</p>
          ) : (
            <p className="category-subtitle">Curated pieces in this category.</p>
          )}
        </div>
      </section>

      <section className="products-toolbar">
        <div className="products-count">
          {filteredProducts.length} {filteredProducts.length === 1 ? "style" : "styles"}
        </div>
        <div className="products-hint">Handpicked for this edit</div>
      </section>

      {filteredProducts.length === 0 ? (
        <section className="category-empty">
          <h2>No products in this edit yet</h2>
          <p>
            We are curating this collection. Explore other categories while we
            add new pieces.
          </p>
          <div className="category-empty-links">
            {otherCategories.slice(0, 3).map((item) => (
              <Link className="category-chip" href={`/products/${encodeURIComponent(item.name)}`} key={item.id}>
                {item.name}
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="products-grid category-products-grid">
          {filteredProducts.map((product) => {
            const imageUrl = getPrimaryImage(product);
            const productId = product?.id ?? product?._id ?? product?.slug ?? product?.name;
            const inWishlist = isInWishlist(productId);
            return (
              <div className="product-card" key={productId}>
                <div className="product-image-wrap">
                  <Link href={`/product/${productId}`} className="product-image-placeholder">
                    {imageUrl ? (
                      <img src={imageUrl} alt={product.name} loading="lazy" />
                    ) : (
                      <div className="image-fallback">No image</div>
                    )}
                  </Link>
                  <button
                    className={`wishlist-btn ${inWishlist ? "is-active" : ""}`}
                    type="button"
                    aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                    aria-pressed={inWishlist}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      toggleWishlist(product, imageUrl);
                    }}
                    disabled={!productId}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="M11.995 20.15l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.55 11.33l-1.455 1.32z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                <div className="product-info">
                  <p className="product-category">{getCategoryLabel(product)}</p>
                  <h3>{product.name}</h3>
                  <div className="product-price">
                    <span className="price">Rs. {product.price}</span>
                  </div>
                  <button
                    className="add-to-cart-btn"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      addToCart(product, 1);
                    }}
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      <section className="category-more">
        <h2>More categories</h2>
        <div className="category-more-grid">
          {otherCategories.slice(0, 4).map((item) => (
            <Link className="category-mini" href={`/products/${encodeURIComponent(item.name)}`} key={item.id}>
              <span>{item.name}</span>
              <span className="category-mini-count">
                {products.filter((product) => productMatchesCategory(product, item.name)).length} styles
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
