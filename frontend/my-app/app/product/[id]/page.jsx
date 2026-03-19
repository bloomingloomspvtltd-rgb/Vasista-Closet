"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProduct } from "@/lib/storeApi";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getRuntimeApiBase() {
  if (typeof window === "undefined") return API_URL;
  const host = window.location.hostname;
  if (!host || host === "localhost" || host === "127.0.0.1") return API_URL;
  try {
    const parsed = new URL(API_URL);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      const port = parsed.port || "8000";
      return `${parsed.protocol}//${host}:${port}`;
    }
  } catch (err) {
    return API_URL;
  }
  return API_URL;
}

const fallbackImages = [
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&h=1600&fit=crop",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&h=1600&fit=crop",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=1600&fit=crop",
];

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

function getCategoryLabel(product) {
  const categories = Array.isArray(product?.categories) ? product.categories : [];
  const primary = product?.category || categories[0];
  return primary || "Collection";
}

function getPrimaryImage(product) {
  if (!product) return "";
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  if (colors.length > 0) {
    const match = colors.find((color) => Array.isArray(color?.images) && color.images.length > 0);
    if (match?.images?.[0]) return normalizeImageUrl(match.images[0]);
    if (match?.image) return normalizeImageUrl(match.image);
  }
  const images = Array.isArray(product?.images) ? product.images : [];
  if (images.length > 0) return normalizeImageUrl(images[0]);
  return "";
}

export default function ProductDetailPage() {
  const params = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState("details");
  const [showSizeChart, setShowSizeChart] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    let active = true;
    setLoading(true);
    getProduct(params.id)
      .then((data) => {
        if (!active) return;
        setProduct(data);
        const initialColor = Array.isArray(data?.colors) && data.colors.length > 0
          ? data.colors[0]?.name
          : Array.isArray(data?.variants) && data.variants.length > 0
            ? data.variants[0]?.color
            : "";
        setSelectedColor(initialColor || "");
        const initialSize = Array.isArray(data?.variants) && data.variants.length > 0
          ? data.variants.find((variant) => variant?.color === initialColor)?.size || data.variants[0]?.size
          : Array.isArray(data?.sizes) && data.sizes.length > 0
            ? typeof data.sizes[0] === "string"
              ? data.sizes[0]
              : data.sizes[0]?.name
            : "M";
        setSelectedSize(initialSize || "M");
        setActiveImage(0);
      })
      .catch(() => {
        if (!active) return;
        setProduct(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params]);

  const images = useMemo(() => {
    const colors = product?.colors;
    if (Array.isArray(colors) && selectedColor) {
      const match = colors.find((color) => color?.name === selectedColor);
      const colorImages = Array.isArray(match?.images)
        ? match.images.filter(Boolean).map(normalizeImageUrl)
        : [];
      if (colorImages.length > 0) return colorImages;
      if (match?.image) return [normalizeImageUrl(match.image)];
    }
    if (product?.images && product.images.length > 0) {
      return product.images.filter(Boolean).map(normalizeImageUrl);
    }
    return fallbackImages;
  }, [product, selectedColor]);

  const colorOptions = useMemo(() => {
    const colors = product?.colors;
    if (Array.isArray(colors) && colors.length > 0) {
      return colors.map((color) => color?.name).filter(Boolean);
    }
    const variants = product?.variants;
    if (!Array.isArray(variants)) return [];
    return Array.from(new Set(variants.map((variant) => variant?.color).filter(Boolean)));
  }, [product]);

  useEffect(() => {
    if (colorOptions.length === 0) return;
    if (!selectedColor || !colorOptions.includes(selectedColor)) {
      setSelectedColor(colorOptions[0]);
    }
  }, [colorOptions, selectedColor]);

  useEffect(() => {
    setActiveImage(0);
  }, [selectedColor]);

  const sizeOptions = useMemo(() => {
    const variants = product?.variants;
    if (Array.isArray(variants) && variants.length > 0) {
      const filtered = selectedColor
        ? variants.filter((variant) => variant?.color === selectedColor)
        : variants;
      return Array.from(new Set(filtered.map((variant) => variant?.size).filter(Boolean)));
    }
    const sizes = product?.sizes;
    if (!Array.isArray(sizes) || sizes.length === 0) return [];
    if (typeof sizes[0] === "string") return sizes;
    return sizes.map((size) => size?.name).filter(Boolean);
  }, [product, selectedColor]);

  useEffect(() => {
    if (sizeOptions.length === 0) return;
    if (!selectedSize || !sizeOptions.includes(selectedSize)) {
      setSelectedSize(sizeOptions[0]);
    }
  }, [sizeOptions, selectedSize]);

  const sizeCounts = useMemo(() => {
    const variants = product?.variants;
    if (Array.isArray(variants) && variants.length > 0) {
      return variants.reduce((acc, variant) => {
        if (!variant || typeof variant !== "object") return acc;
        if (selectedColor && variant.color !== selectedColor) return acc;
        if (variant.size) acc[variant.size] = variant.count ?? 0;
        return acc;
      }, {});
    }
    const sizes = product?.sizes;
    if (!Array.isArray(sizes)) return {};
    return sizes.reduce((acc, size) => {
      if (size && typeof size === "object") {
        const name = size.name;
        if (name) acc[name] = size.count ?? 0;
      }
      return acc;
    }, {});
  }, [product, selectedColor]);

  const allSizesOut = useMemo(() => {
    if (sizeOptions.length === 0) return false;
    return sizeOptions.every((size) => {
      if (!Object.prototype.hasOwnProperty.call(sizeCounts, size)) return false;
      return (sizeCounts[size] ?? 0) <= 0;
    });
  }, [sizeOptions, sizeCounts]);

  const anyVariantInStock = useMemo(() => {
    if (sizeOptions.length === 0) return false;
    if (Array.isArray(product?.variants) && product.variants.length > 0) {
      return product.variants.some((variant) => (variant?.count ?? 0) > 0);
    }
    return sizeOptions.some((size) => (sizeCounts[size] ?? 0) > 0);
  }, [product, sizeOptions, sizeCounts]);

  const displayName = product?.name || "Product";
  const category = getCategoryLabel(product);
  const price = product?.price ?? "-";
  const productId = product?.id ?? product?._id ?? product?.slug ?? product?.name;
  const inWishlist = isInWishlist(productId);
  const selectedColorDescription = useMemo(() => {
    const colors = product?.colors;
    if (!Array.isArray(colors) || !selectedColor) return "";
    const match = colors.find((color) => color?.name === selectedColor);
    return match?.description || "";
  }, [product, selectedColor]);
  const productDescription = (product?.description || "").trim();
  const accordionItems = useMemo(
    () => [
      {
        key: "details",
        title: "Product Details",
        body: productDescription || "Product description will be updated soon.",
      },
      {
        key: "shipping",
        title: "Shipping & Returns",
        body:
          "Most orders ship in 3-5 days and deliver in 5-7 days.\n" +
          "In certain locations, delivery may take longer depending on accessibility and courier partner operations.\n" +
          "International Orders: Estimated delivery time is 15–20 working days after processing.\n" +
          "Clink on the link HERE to know more about refunds.",
      },
      {
        key: "faqs",
        title: "FAQs",
        body:
          "What if I want to exchange or return my order?\n" +
          "Exchange and returns are available for products within 5 days of delivery. Items must be in original condition with all tags intact.\n\n" +
          "Will I Receive a Quality Product by visista closet?\n" +
          "At visista, we take pride in offering premium quality ethnic wear. Every product is carefully crafted and dispatched only after a thorough quality video check.",
      },
    ],
    [productDescription]
  );
  const toggleAccordion = (key) => {
    setOpenAccordion((current) => (current === key ? "" : key));
  };
  const similarProducts = Array.isArray(product?.similar_products)
    ? product.similar_products
    : [];

  return (
    <div className="product-detail-page">
      <section className="product-detail-layout">
        <div className="product-media">
          <div className="product-thumbs">
            {images.map((src, index) => (
              <button
                className={`thumb ${index === activeImage ? "active" : ""}`}
                key={`${src}-${index}`}
                onClick={() => setActiveImage(index)}
                type="button"
              >
                <img src={src} alt={`${displayName} view ${index + 1}`} />
              </button>
            ))}
          </div>
          <div
            className="product-hero-image"
            onMouseMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const x = ((event.clientX - rect.left) / rect.width) * 100;
              const y = ((event.clientY - rect.top) / rect.height) * 100;
              event.currentTarget.style.setProperty("--zoom-x", `${x}%`);
              event.currentTarget.style.setProperty("--zoom-y", `${y}%`);
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.setProperty("--zoom-x", "50%");
              event.currentTarget.style.setProperty("--zoom-y", "50%");
            }}
          >
            <img src={images[activeImage]} alt={displayName} />
            <button className="hero-icon" type="button" aria-label="Share">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M12 3v12m0 0l4-4m-4 4l-4-4M6 21h12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="product-panel">
          <div className="product-breadcrumb">Home / {category} /</div>
          <div className="product-title-row">
            <h1>{displayName}</h1>
            <button
              className={`heart-btn ${inWishlist ? "is-active" : ""}`}
              type="button"
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={inWishlist}
              onClick={() => toggleWishlist(product, images[activeImage])}
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
          <p className="style-code">Style Code: 469513800RAMA</p>
          {selectedColorDescription ? (
            <p className="product-color-description">{selectedColorDescription}</p>
          ) : null}
          <div className="product-price">
            <span className="price">MRP Rs. {price}</span>
            {!anyVariantInStock ? <span className="stock-badge">Out of stock</span> : null}
          </div>

          <div className="product-divider" />

          {colorOptions.length > 0 ? (
            <div className="size-row">
              <div className="size-row-header">
                <span>Color</span>
              </div>
              <div className="size-options">
                {colorOptions.map((color) => (
                  <button
                    className={`size-pill ${color === selectedColor ? "active" : ""}`}
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    type="button"
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="size-row">
          <div className="size-row-header">
            <span>Size</span>
            <button
              className="size-chart"
              type="button"
              onClick={() => setShowSizeChart(true)}
            >
              Size chart
            </button>
          </div>
            <div className="size-options">
              {sizeOptions.length === 0 ? (
                <span className="size-empty">No sizes listed</span>
              ) : (
                sizeOptions.map((size) => {
                  const count =
                    Object.prototype.hasOwnProperty.call(sizeCounts, size)
                      ? sizeCounts[size]
                      : null;
                  const isSoldOut = count !== null && count <= 0;
                  return (
                    <button
                      className={`size-pill ${size === selectedSize ? "active" : ""}`}
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      type="button"
                      disabled={isSoldOut}
                      title={isSoldOut ? "Sold out" : undefined}
                    >
                      {size}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="cta-row">
            <button
              className="outline-btn"
              type="button"
              onClick={() => product && addToCart(product, quantity, selectedColor, selectedSize)}
              disabled={!product || loading || !anyVariantInStock || allSizesOut}
            >
              Add to cart
            </button>
            <button
              className="primary-btn"
              type="button"
              disabled={!product || loading || !anyVariantInStock || allSizesOut}
            >
              Buy it now
            </button>
          </div>

          <div className="shipping-copy">Free Shipping within India - Easy Returns</div>

          <div className="assurance-row">
            {[
              "100% Purchase Protection",
              "5 Days Easy Returns",
              "Assured Quality",
              "Free Shipping",
            ].map((label) => (
              <div className="assurance-item" key={label}>
                <span className="assurance-icon" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="accordion-list">
            {accordionItems.map((item) => {
              const isOpen = openAccordion === item.key;
              return (
                <div className="accordion-section" key={item.key}>
                  <button
                    className={`accordion-item ${isOpen ? "is-open" : ""}`}
                    type="button"
                    onClick={() => toggleAccordion(item.key)}
                    aria-expanded={isOpen}
                    aria-controls={`accordion-${item.key}`}
                  >
                    <span>{item.title}</span>
                    <span className="accordion-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path
                          d="M6 9l6 6 6-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                      </svg>
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="accordion-content" id={`accordion-${item.key}`}>
                      {item.body.split("\n").map((line, index) => (
                        <p key={`${item.key}-${index}`}>{line}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="share-row">
            <span>Share</span>
            <span>Share</span>
            <span>Pin it</span>
          </div>
        </div>
      </section>

      {similarProducts.length > 0 ? (
        <section className="similar-products">
          <h2>Similar Products</h2>
          <div className="products-grid products-grid-compact">
            {similarProducts.map((item) => {
              const imageUrl = getPrimaryImage(item);
              const similarId = item?.id ?? item?._id ?? item?.slug ?? item?.name;
              const categoryLabel = getCategoryLabel(item);
              if (!similarId) return null;
              return (
                <div className="product-card product-card-flat" key={similarId}>
                  <div className="product-image-wrap">
                    <Link href={`/product/${similarId}`} className="product-image-placeholder">
                      {imageUrl ? (
                        <img src={imageUrl} alt={item?.name || "Product"} loading="lazy" />
                      ) : (
                        <div className="image-fallback">No image</div>
                      )}
                    </Link>
                  </div>
                  <div className="product-info product-info-compact">
                    <p className="product-category">{categoryLabel}</p>
                    <h3 className="product-title">{item?.name || "Product"}</h3>
                    <div className="product-price">
                      <span className="price">Rs. {item?.price ?? "-"}</span>
                    </div>
                    <div className="ready-tag">Ready to Ship</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {showSizeChart ? (
        <div className="sizechart-overlay" role="dialog" aria-modal="true">
          <div className="sizechart-modal">
            <button
              className="sizechart-close"
              type="button"
              aria-label="Close size chart"
              onClick={() => setShowSizeChart(false)}
            >
              ×
            </button>
            <div className="sizechart-content">
              <div className="sizechart-figure">
                <img
                  className="sizechart-figure-image"
                  src="/size-chart-figure.png"
                  alt="Size measurement guide"
                />
                <ul className="sizechart-notes">
                  <li>Chest/Bust: Measure around the fullest part of your chest.</li>
                  <li>Drop Waist: Measure just below your natural waist line.</li>
                  <li>Hips: Measure around the fullest part of your hips.</li>
                  <li>Height: Measure your height with heels.</li>
                </ul>
              </div>
              <div className="sizechart-table">
                <h3>Size Chart</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>Bust</th>
                      <th>Drop Waist</th>
                      <th>Hips</th>
                      <th>Armhole</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>S</td>
                      <td>36&quot;</td>
                      <td>34&quot;</td>
                      <td>38.5&quot;</td>
                      <td>17&quot;</td>
                    </tr>
                    <tr>
                      <td>M</td>
                      <td>38&quot;</td>
                      <td>36&quot;</td>
                      <td>42&quot;</td>
                      <td>18&quot;</td>
                    </tr>
                    <tr>
                      <td>L</td>
                      <td>40&quot;</td>
                      <td>38&quot;</td>
                      <td>44&quot;</td>
                      <td>19&quot;</td>
                    </tr>
                    <tr>
                      <td>XL</td>
                      <td>42&quot;</td>
                      <td>40&quot;</td>
                      <td>46&quot;</td>
                      <td>20&quot;</td>
                    </tr>
                    <tr>
                      <td>XXL</td>
                      <td>44&quot;</td>
                      <td>43&quot;</td>
                      <td>50&quot;</td>
                      <td>21.5&quot;</td>
                    </tr>
                    <tr>
                      <td>XXXL</td>
                      <td>46&quot;-48&quot;</td>
                      <td>44&quot;-45&quot;</td>
                      <td>51&quot;-53&quot;</td>
                      <td>22.5&quot;</td>
                    </tr>
                  </tbody>
                </table>
                <p className="sizechart-footnote">
                  All ready-to-wear styles consist of 2&quot; (2 inches) margin for alterations.
                </p>
              </div>
            </div>
          </div>
          <button
            className="sizechart-backdrop"
            type="button"
            aria-label="Close size chart"
            onClick={() => setShowSizeChart(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
