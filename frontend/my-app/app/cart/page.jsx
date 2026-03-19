"use client";

import Link from "next/link";

import { useCart } from "@/lib/CartContext";

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

function getPrimaryImage(item) {
  const colors = Array.isArray(item?.colors) ? item.colors : [];
  if (colors.length > 0) {
    const colorMatch = item.color
      ? colors.find((color) => color?.name === item.color)
      : null;
    const target = colorMatch || colors[0];
    const colorImages = Array.isArray(target?.images) ? target.images : [];
    if (colorImages.length > 0) return normalizeImageUrl(colorImages[0]);
    if (target?.image) return normalizeImageUrl(target.image);
  }
  const images = Array.isArray(item?.images) ? item.images : [];
  if (images.length > 0) return normalizeImageUrl(images[0]);
  return "";
}

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <h1>Your cart is empty</h1>
        <Link href="/products" className="add-to-cart-btn">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Your cart</h1>
      <div className="cart-items">
        {cartItems.map((item) => (
          <div className="cart-item" key={`${item.id}-${item.color || ""}-${item.size || ""}`}>
            <div className="cart-item-info">
              {getPrimaryImage(item) ? (
                <img
                  className="cart-item-image"
                  src={getPrimaryImage(item)}
                  alt={item.name}
                  loading="lazy"
                />
              ) : (
                <div className="cart-item-image cart-item-image-fallback">No image</div>
              )}
              <strong>{item.name}</strong>
              <div>Rs. {item.price}</div>
            </div>
            <div className="cart-actions">
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(event) =>
                  updateQuantity(item.id, item.color, item.size, parseInt(event.target.value || "1", 10))
                }
              />
              <button className="admin-link danger" onClick={() => removeFromCart(item.id, item.color, item.size)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <div>Total: Rs. {getTotalPrice()}</div>
        <Link href="/checkout" className="add-to-cart-btn">
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
}
