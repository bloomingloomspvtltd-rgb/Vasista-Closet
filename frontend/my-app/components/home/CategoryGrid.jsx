"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getFeaturedCategories } from "@/lib/categoryData";
import { getCategories } from "@/lib/storeApi";

export default function CategoryGrid() {
  const categories = getFeaturedCategories();
  const [backendCategories, setBackendCategories] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCategories();
        setBackendCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        setBackendCategories([]);
      }
    };
    load();
  }, []);

  const normalizedBackend = useMemo(
    () =>
      backendCategories.map((item) => ({
        ...item,
        _normalized: normalizeCategory(item?.name || ""),
      })),
    [backendCategories]
  );

  const backendNameOverrides = {
    "coord-sets": "coordsets",
    "premium-collection": "premium collection",
    "kurta-sets": "kurthasets",
  };

  const connected = categories.map((item) => {
    const matches = new Set([item.title, ...(item.matches || [])].map(normalizeCategory));
    const found = normalizedBackend.find((cat) => matches.has(cat._normalized));
    return {
      ...item,
      backendName: backendNameOverrides[item.slug] || found?.name || null,
    };
  });

  return (
    <section className="category-section">
      <div className="category-container">
        <div className="category-grid">
          {connected.map((item) => (
            <Link
              className="category-card"
              key={item.slug}
              href={`/products/${encodeURIComponent(item.backendName || item.title)}`}
            >
              <div className="category-image-wrapper">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="category-image"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>

              <div className="category-overlay">
                <h3>{item.title}</h3>
                <span className="category-cta">Shop now</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function normalizeCategory(value) {
  return (value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}
