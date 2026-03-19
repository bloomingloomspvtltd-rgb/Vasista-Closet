"use client";

import { useState } from "react";

export default function InstagramSection() {
  const instagramReels = [
    {
      id: 1,
      thumbnail: "/images/instagram/post1.jpg",
      video: "/reels/reel.mp4",
      url: "",
    },
    {
      id: 2,
      thumbnail: "/images/instagram/post2.jpg",
      video: "/reels/reel2.mp4",
      url: "",
    },
    {
      id: 3,
      thumbnail: "/images/instagram/post3.jpg",
      video: "/reels/reel3.mp4",
      url: "",
    },
    {
      id: 4,
      thumbnail: "/images/instagram/post4.jpg",
      video: "/reels/reel4.mp4",
      url: "",
    },
    {
      id: 5,
      thumbnail: "/images/instagram/post5.jpg",
      video: "/reels/reel5.mp4",
      url: "",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const total = instagramReels.length;
  const visibleCount = Math.min(5, total);

  const getReelAt = (offset) => {
    if (total === 0) return null;
    const index = (activeIndex + offset + total) % total;
    return instagramReels[index];
  };

  const visibleReels = Array.from({ length: visibleCount }, (_, i) => getReelAt(i)).filter(Boolean);

  return (
    <section className="instagram-section">
      <h2 className="instagram-title">Follow Us on Instagram</h2>

      <div className="reel-stage">
        <button
          type="button"
          className="reel-arrow reel-arrow-left"
          aria-label="Previous reels"
          onClick={() => setActiveIndex((prev) => (prev - 1 + total) % total)}
        >
          ‹
        </button>

        {visibleReels.map((reel, index) => {
          const positionClass =
            index === 0
              ? "reel-center"
              : index === 1
                ? "reel-left"
                : index === 2
                  ? "reel-right"
                  : index === 3
                    ? "reel-far-left"
                    : "reel-far-right";
          const media = reel.video ? (
            <video
              className="reel-media"
              src={reel.video}
              poster={reel.thumbnail}
              muted
              loop
              playsInline
              autoPlay
            />
          ) : (
            <img
              src={reel.thumbnail}
              alt="Instagram reel"
              className="reel-media"
              loading="lazy"
            />
          );

          return (
            <div
              className={`reel-card ${positionClass}`}
              key={reel.id}
              role="button"
              tabIndex={0}
              aria-label="Open Instagram reel"
              onClick={() => {
                if (reel.url) window.open(reel.url, "_blank", "noreferrer");
              }}
              onKeyDown={(event) => {
                if (reel.url && (event.key === "Enter" || event.key === " ")) {
                  window.open(reel.url, "_blank", "noreferrer");
                }
              }}
            >
              {media}
              <div className="reel-overlay">
                <svg
                  className="reel-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.6"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M10 8l6 4-6 4V8z" fill="white" stroke="none"></path>
                </svg>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          className="reel-arrow reel-arrow-right"
          aria-label="Next reels"
          onClick={() => setActiveIndex((prev) => (prev + 1) % total)}
        >
          ›
        </button>
      </div>

      <a
        className="instagram-handle"
        href="https://www.instagram.com/visista_closet/?hl=en"
        target="_blank"
        rel="noreferrer"
      >
        @visista_closet
      </a>
    </section>
  );
}
