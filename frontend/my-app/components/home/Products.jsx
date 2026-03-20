"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getProducts } from "@/lib/storeApi";
import { getRuntimeApiBase } from "@/lib/apiBase";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";
import { normalizeCategoryLabel } from "@/lib/categoryLabel";

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

export default function Products() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProducts();
        setProducts(data.slice(0, 8));
      } catch (err) {
        setProducts([]);
      }
    };
    load();
  }, []);

  return (
    <section className="products-section">
      <div className="products-header">
        <h2>Featured Products</h2>
        <p>Explore our finest collection</p>
      </div>

      <div className="products-grid">
        {products.map((product) => {
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
                  onClick={() => toggleWishlist(product, imageUrl)}
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
                <button className="add-to-cart-btn" onClick={() => addToCart(product, 1)}>
                  Add to cart
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
