"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getProducts } from "@/lib/storeApi";
import { getRuntimeApiBase } from "@/lib/apiBase";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";
import { normalizeCategoryLabel } from "@/lib/categoryLabel";

export const dynamic = "force-dynamic";

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

export default function ProductsPage() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedSearch = searchTerm.toLowerCase();
  const [products, setProducts] = useState([]);
  const [openFilters, setOpenFilters] = useState({
    price: true,
    size: false,
    color: false,
    cut: false,
  });
  const [selectedPrices, setSelectedPrices] = useState(new Set());
  const [selectedSizes, setSelectedSizes] = useState(new Set());
  const [selectedColors, setSelectedColors] = useState(new Set());
  const [selectedCuts, setSelectedCuts] = useState(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        setProducts([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateSearch = () => {
      const params = new URLSearchParams(window.location.search);
      setSearchTerm((params.get("search") || "").trim());
    };
    updateSearch();
    window.addEventListener("popstate", updateSearch);

    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPush.apply(this, args);
      updateSearch();
    };

    window.history.replaceState = function (...args) {
      originalReplace.apply(this, args);
      updateSearch();
    };

    return () => {
      window.removeEventListener("popstate", updateSearch);
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
    };
  }, []);

  const priceRanges = [
    { id: "under-1000", label: "Under Rs. 1000", min: 0, max: 999 },
    { id: "1000-2000", label: "Rs. 1000 - 2000", min: 1000, max: 2000 },
    { id: "2000-4000", label: "Rs. 2000 - 4000", min: 2000, max: 4000 },
    { id: "4000-plus", label: "Rs. 4000+", min: 4000, max: Infinity },
  ];

  const sizeOptions = Array.from(
    new Set(
      products.flatMap((product) => {
        if (Array.isArray(product?.variants) && product.variants.length > 0) {
          return product.variants.map((variant) => variant?.size).filter(Boolean);
        }
        if (Array.isArray(product?.sizes)) {
          if (product.sizes.length > 0 && typeof product.sizes[0] === "string") {
            return product.sizes;
          }
          return product.sizes.map((size) => size?.name).filter(Boolean);
        }
        return [];
      })
    )
  ).sort();

  const colorOptions = Array.from(
    new Set(
      products.flatMap((product) => {
        if (Array.isArray(product?.colors) && product.colors.length > 0) {
          return product.colors.map((color) => color?.name).filter(Boolean);
        }
        if (Array.isArray(product?.variants) && product.variants.length > 0) {
          return product.variants.map((variant) => variant?.color).filter(Boolean);
        }
        return [];
      })
    )
  ).sort();

  const cutOptions = Array.from(
    new Set(
      products.flatMap((product) => (Array.isArray(product?.tags) ? product.tags : []))
    )
  ).sort();

  const matchesPrice = (price) => {
    if (selectedPrices.size === 0) return true;
    return priceRanges.some((range) => {
      if (!selectedPrices.has(range.id)) return false;
      return price >= range.min && price <= range.max;
    });
  };

  const matchesSizes = (product) => {
    if (selectedSizes.size === 0) return true;
    const sizes = new Set();
    if (Array.isArray(product?.variants) && product.variants.length > 0) {
      product.variants.forEach((variant) => {
        if (variant?.size) sizes.add(variant.size);
      });
    } else if (Array.isArray(product?.sizes)) {
      product.sizes.forEach((size) => {
        if (typeof size === "string") sizes.add(size);
        else if (size?.name) sizes.add(size.name);
      });
    }
    return Array.from(selectedSizes).some((size) => sizes.has(size));
  };

  const matchesColors = (product) => {
    if (selectedColors.size === 0) return true;
    const colors = new Set();
    if (Array.isArray(product?.colors) && product.colors.length > 0) {
      product.colors.forEach((color) => {
        if (color?.name) colors.add(color.name);
      });
    } else if (Array.isArray(product?.variants) && product.variants.length > 0) {
      product.variants.forEach((variant) => {
        if (variant?.color) colors.add(variant.color);
      });
    }
    return Array.from(selectedColors).some((color) => colors.has(color));
  };

  const matchesCuts = (product) => {
    if (selectedCuts.size === 0) return true;
    const tags = new Set(Array.isArray(product?.tags) ? product.tags : []);
    return Array.from(selectedCuts).some((cut) => tags.has(cut));
  };

  const matchesSearch = (product) => {
    if (!normalizedSearch) return true;
    const categories = Array.isArray(product?.categories) ? product.categories : [];
    const tags = Array.isArray(product?.tags) ? product.tags : [];
    const haystack = [
      product?.name,
      product?.category,
      ...categories,
      ...tags,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  };

  const filteredProducts = products.filter(
    (product) =>
      matchesPrice(Number(product?.price || 0)) &&
      matchesSizes(product) &&
      matchesColors(product) &&
      matchesCuts(product) &&
      matchesSearch(product)
  );

  const toggleFilter = (section) => {
    setOpenFilters((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleSelection = (setState, value) => {
    setState((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  return (
    <div className="category-listing-page">
      <section className="category-hero">
        <div className="category-hero-inner">
          <p className="category-kicker">Shop all</p>
          <h1>All Products</h1>
          <p className="category-subtitle">
            Discover every style across our latest Visista collection.
          </p>
        </div>
      </section>

      <section className="products-layout">
        <aside className="products-filters">
          <h2 className="filters-title">Filters</h2>
          <div className="filter-section">
            <button className="filter-row" type="button" onClick={() => toggleFilter("price")}>
              <span>Price</span>
              <span className="filter-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </span>
            </button>
            {openFilters.price ? (
              <div className="filter-options">
                {priceRanges.map((range) => (
                  <label className="filter-option" key={range.id}>
                    <input
                      type="checkbox"
                      checked={selectedPrices.has(range.id)}
                      onChange={() => toggleSelection(setSelectedPrices, range.id)}
                    />
                    <span>{range.label}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>

          <div className="filter-section">
            <button className="filter-row" type="button" onClick={() => toggleFilter("size")}>
              <span>Size</span>
              <span className="filter-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </span>
            </button>
            {openFilters.size ? (
              <div className="filter-options">
                {sizeOptions.length === 0 ? (
                  <div className="filter-empty">No sizes listed</div>
                ) : (
                  sizeOptions.map((size) => (
                    <label className="filter-option" key={size}>
                      <input
                        type="checkbox"
                        checked={selectedSizes.has(size)}
                        onChange={() => toggleSelection(setSelectedSizes, size)}
                      />
                      <span>{size}</span>
                    </label>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <div className="filter-section">
            <button className="filter-row" type="button" onClick={() => toggleFilter("color")}>
              <span>Color</span>
              <span className="filter-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </span>
            </button>
            {openFilters.color ? (
              <div className="filter-options">
                {colorOptions.length === 0 ? (
                  <div className="filter-empty">No colors listed</div>
                ) : (
                  colorOptions.map((color) => (
                    <label className="filter-option" key={color}>
                      <input
                        type="checkbox"
                        checked={selectedColors.has(color)}
                        onChange={() => toggleSelection(setSelectedColors, color)}
                      />
                      <span>{color}</span>
                    </label>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <div className="filter-section">
            <button className="filter-row" type="button" onClick={() => toggleFilter("cut")}>
              <span>Cut</span>
              <span className="filter-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </span>
            </button>
            {openFilters.cut ? (
              <div className="filter-options">
                {cutOptions.length === 0 ? (
                  <div className="filter-empty">No cuts listed</div>
                ) : (
                  cutOptions.map((cut) => (
                    <label className="filter-option" key={cut}>
                      <input
                        type="checkbox"
                        checked={selectedCuts.has(cut)}
                        onChange={() => toggleSelection(setSelectedCuts, cut)}
                      />
                      <span>{cut}</span>
                    </label>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </aside>

        <div className="products-content">
          <section className="products-toolbar products-toolbar-alt">
            <div className="products-count">
              {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
            </div>
            <label className="sort-control">
              <span className="sr-only">Sort products</span>
              <select defaultValue="newest">
                <option value="newest">Date, new to old</option>
                <option value="oldest">Date, old to new</option>
                <option value="price-high">Price, high to low</option>
                <option value="price-low">Price, low to high</option>
              </select>
            </label>
          </section>

          <section className="products-grid category-products-grid">
            {filteredProducts.map((product) => {
              const imageUrl = getPrimaryImage(product);
              const productId = product?.id ?? product?._id ?? product?.slug ?? product?.name;
              const inWishlist = isInWishlist(productId);
              const categoryLabel = getCategoryLabel(product);
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
                    <p className="product-category">{categoryLabel}</p>
                    <h3>{product.name}</h3>
                    <div className="product-price">
                      <span className="price">Rs. {product.price}</span>
                    </div>
                    <button
                      className="add-to-cart-btn"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const hasVariants = Array.isArray(product?.variants) && product.variants.length > 0;
                        const hasSizes = Array.isArray(product?.sizes) && product.sizes.length > 0;
                        if (hasVariants || hasSizes) {
                          router.push(`/product/${productId}`);
                          return;
                        }
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
        </div>
      </section>
    </div>
  );
}
