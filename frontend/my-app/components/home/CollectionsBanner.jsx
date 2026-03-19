// src/components/home/CollectionsBanner.jsx
"use client";

import { useRouter } from "next/navigation";
export default function CollectionsBanner() {
  const router = useRouter();

  return (
    <section className="collections-banner">
      {/* Background image to be added later */}
      <div className="banner-overlay">
        <h2>Discover Your Style</h2>
        <p>Explore our exclusive collections curated for you</p>

        <div className="banner-actions">
          <button
            className="primary"
            type="button"
            onClick={() => router.push("/products")}
          >
            Shop Now
          </button>
          <button
            className="secondary"
            type="button"
            onClick={() => router.push("/blog")}
          >
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}
