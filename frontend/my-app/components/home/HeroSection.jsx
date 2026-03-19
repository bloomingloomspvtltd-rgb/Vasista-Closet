// src/components/home/HeroSection.jsx
"use client";

import { useRouter } from "next/navigation";
export default function HeroSection() {
  const router = useRouter();

  return (
    <section className="hero">
      <div className="hero-overlay">
        <h1>Modern Indian Ethnic Wear</h1>
        <p>From everyday elegance to wedding showstoppers</p>

        <div className="hero-actions">
          <button
            className="primary"
            type="button"
            onClick={() => router.push("/products")}
          >
            Shop Affordable Luxury
          </button>
          {/* <button className="secondary">Explore Luxe</button> */}
        </div>
      </div>
    </section>
  );
}
