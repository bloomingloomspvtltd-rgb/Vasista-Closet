"use client";

import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";
import Link from "next/link";

export default function WishlistPage() {
  const { addToCart } = useCart();
  const { wishlistItems, removeFromWishlist } = useWishlist();

  return (
    <div className="wishlist-page">
      <header className="wishlist-header">
        <h1>Your wishlist</h1>
        <p>Save favorites now and move them to your cart anytime.</p>
      </header>

      {wishlistItems.length === 0 ? (
        <div className="wishlist-empty">
          <h2>Your wishlist is empty</h2>
          <p>Browse the latest collections and tap the heart to save a look.</p>
          <Link className="outline-btn" href="/">
            Start shopping
          </Link>
        </div>
      ) : (
        <section className="wishlist-grid">
          {wishlistItems.map((item) => {
            const imageUrl =
              item.wishlistImage ||
              item.image ||
              (Array.isArray(item.images) ? item.images[0] : "");
            return (
              <article className="wishlist-card" key={item.id}>
                <div className="wishlist-media">
                  {imageUrl ? (
                    <img src={imageUrl} alt={item.name} loading="lazy" />
                  ) : (
                    <div className="image-fallback">No image</div>
                  )}
                </div>
                <div className="wishlist-info">
                  <h3>{item.name}</h3>
                  <div className="wishlist-price">Rs. {item.price}</div>
                  <button className="add-to-cart-btn" onClick={() => addToCart(item, 1)}>
                    Add to cart
                  </button>
                  <button
                    className="wishlist-remove-btn"
                    type="button"
                    onClick={() => removeFromWishlist(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
