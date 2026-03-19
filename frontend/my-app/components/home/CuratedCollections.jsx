"use client";

import { useState } from "react";
import Image from "next/image";

export default function CuratedCollections() {
  const collections = [
    {
      id: 1,
      title: "Kalamkari",
      image: "/images/curated/kalamkari.png",
    },
    {
      id: 2,
      title: "Pochampally",
      image: "/images/curated/pochampally.png",
    },
    {
      id: 3,
      title: "Ikkat",
      image: "/images/curated/ikkat.png",
    },
    {
      id: 4,
      title: "Jamdani",
      image: "/images/curated/jamdani.png",
    },
    {
      id: 5,
      title: "Pure Cotton",
      image: "/images/curated/pure-cotton.png",
    },
    {
      id: 6,
      title: "Viscose / Rayon",
      image: "/images/curated/viscose.png",
    },
    {
      id: 7,
      title: "Silk / Raw Silk",
      image: "/images/curated/silk.png",
    },
    {
      id: 8,
      title: "Satin",
      image: "/images/curated/satin.png",
    },
    {
      id: 9,
      title: "Kota",
      image: "/images/curated/kota.png",
    },
    {
      id: 10,
      title: "Net / Super Net",
      image: "/images/curated/net.png",
    },
    {
      id: 11,
      title: "Organza",
      image: "/images/curated/organza.png",
    },
  ];

  const [startIndex, setStartIndex] = useState(0);
  const itemsPerView = 4;

  const canGoPrevious = startIndex > 0;
  const canGoNext = startIndex + itemsPerView < collections.length;

  const handlePrevious = () => {
    if (canGoPrevious) {
      setStartIndex((prev) => Math.max(0, prev - itemsPerView));
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setStartIndex((prev) => prev + itemsPerView);
    }
  };

  const visibleCollections = collections.slice(startIndex, startIndex + itemsPerView);

  return (
    <section className="curated-collections-section">
      <h2 className="curated-title">Curated Collections</h2>
      
      <div className="curated-carousel-wrapper">
        <div className="curated-grid">
          {visibleCollections.map((collection) => (
            <div className="curated-card" key={collection.id}>
              {/* <Image
                src={collection.image}
                alt={collection.title}
                fill
                className="curated-image"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              /> */}

              <div className="curated-overlay">
                <h3>{collection.title}</h3>
                <button className="shop-now-btn">SHOP NOW</button>
              </div>
            </div>
          ))}
        </div>

        {canGoPrevious && (
          <button className="arrow arrow-left" onClick={handlePrevious}>
            ◀
          </button>
        )}
        {canGoNext && (
          <button className="arrow arrow-right" onClick={handleNext}>
            ▶
          </button>
        )}
      </div>
    </section>
  );
}
