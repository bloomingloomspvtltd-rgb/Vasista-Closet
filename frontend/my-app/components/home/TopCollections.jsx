import Image from "next/image";

export default function TopCollections() {
  const collections = [
    {
      id: 1,
      title: "Anarkali",
      image: "/images/topcollection/coord.png",
    },
    {
      id: 2,
      title: "Readymade Suits",
      image: "/images/topcollection/everyday.png",
    },
    {
      id: 3,
      title: "Casual Kurtas",
      image: "/images/topcollection/festive.png",
    },
    {
      id: 4,
      title: "Straight Kurtas",
      image: "/images/topcollection/new.png",
    },
  ];

  return (
    <section className="top-collections-section">
      <h2 className="collections-title">Top Collections</h2>
      
      <div className="collections-grid">
        {collections.map((collection) => (
          <div className="collection-card" key={collection.id}>
            <Image
              src={collection.image}
              alt={collection.title}
              fill
              className="collection-image"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />

            <div className="collection-overlay">
              <h3>{collection.title}</h3>
              <button className="shop-now-btn">SHOP NOW</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
