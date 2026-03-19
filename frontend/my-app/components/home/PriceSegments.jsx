// src/components/home/PriceSegments.jsx
export default function PriceSegments() {
  return (
    <section className="price-segments">
      <h2>Our Collections</h2>

      <div className="segment-grid">
        {/* Affordable Luxury */}
        <div className="segment affordable">
          <h3>Affordable Luxury</h3>
          <p className="price">Starting from ₹1,799</p>
          <ul>
            <li>Kurtis</li>
            <li>Kurta Sets</li>
            <li>Coord Sets</li>
          </ul>
          <button>Shop Affordable</button>
        </div>

        {/* Luxe */}
        <div className="segment luxe">
          <h3>Luxe</h3>
          <p className="subtitle">
            Turn heads with showstopper designs
          </p>
          <ul>
            <li>Traditional Wedding Wear</li>
            <li>Premium Kurta Sets</li>
          </ul>
          <button>Explore Luxe</button>
        </div>
      </div>
    </section>
  );
}
