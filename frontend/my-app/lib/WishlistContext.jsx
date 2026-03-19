"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const WishlistContext = createContext();
const STORAGE_KEY = "wishlist";

function getProductId(product) {
  return product?.id ?? product?._id ?? product?.slug ?? product?.name;
}

function normalizeWishlistItem(product, imageUrl) {
  if (!product) return null;
  const resolvedId = getProductId(product);
  return {
    ...product,
    id: resolvedId,
    wishlistImage:
      imageUrl ||
      product?.wishlistImage ||
      product?.image ||
      (Array.isArray(product?.images) ? product.images[0] : "") ||
      "",
  };
}

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setWishlistItems(parsed);
        }
      }
    } catch (err) {
      console.error("Failed to load wishlist:", err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlistItems));
    } catch (err) {
      console.error("Failed to save wishlist:", err);
    }
  }, [wishlistItems]);

  const addToWishlist = (product, imageUrl) => {
    if (!product) return;
    const productId = getProductId(product);
    if (!productId) return;
    setWishlistItems((prev) => {
      const exists = prev.some((item) => item.id === productId);
      if (exists) return prev;
      const normalized = normalizeWishlistItem(product, imageUrl);
      return normalized ? [...prev, normalized] : prev;
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const toggleWishlist = (product, imageUrl) => {
    if (!product) return;
    const productId = getProductId(product);
    if (!productId) return;
    setWishlistItems((prev) => {
      const exists = prev.some((item) => item.id === productId);
      if (exists) {
        return prev.filter((item) => item.id !== productId);
      }
      const normalized = normalizeWishlistItem(product, imageUrl);
      return normalized ? [...prev, normalized] : prev;
    });
  };

  const isInWishlist = (productId) => {
    if (!productId) return false;
    return wishlistItems.some((item) => item.id === productId);
  };

  const value = useMemo(
    () => ({
      wishlistItems,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      isInWishlist,
    }),
    [wishlistItems]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
};
