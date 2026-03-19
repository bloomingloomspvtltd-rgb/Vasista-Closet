export const metadata = {
  title: "About Us | Visista Closet",
  description:
    "Learn about Visista Closet, our craft-first approach to modern Indian ethnic wear, and the values behind every piece.",
};

export default function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="about-kicker">About Visista Closet</span>
          <h1>Modern Indian ethnic wear, made with care.</h1>
          <p>
            Visista Closet is built on a simple belief: everyday elegance should
            feel effortless, and occasionwear should feel personal. We bring
            together timeless silhouettes and thoughtful craftsmanship to create
            pieces you reach for again and again.
          </p>
        </div>
      </section>

      <section className="about-section about-grid">
        <div className="about-card">
          <h2>Our Story</h2>
          <p>
            We started Visista Closet to celebrate the richness of Indian
            textiles and translate it for the modern wardrobe. Every collection
            blends tradition with clean, wearable design so you can move from
            workdays to weddings with confidence.
          </p>
        </div>
        <div className="about-card">
          <h2>Our Craft</h2>
          <p>
            From fabric selection to finishing touches, we obsess over the
            details. Each garment is inspected and packed with care so you
            receive a product that feels premium, comfortable, and long-lasting.
          </p>
        </div>
        <div className="about-card">
          <h2>Our Promise</h2>
          <p>
            We prioritize quality, honest pricing, and a seamless experience.
            Whether you&apos;re shopping for a festive statement or a daily
            classic, we&apos;re here to make it easy and reliable.
          </p>
        </div>
      </section>

      <section className="about-section about-values">
        <h2>What We Stand For</h2>
        <div className="about-values-grid">
          <div>
            <h3>Authentic Design</h3>
            <p>
              Modern silhouettes rooted in Indian heritage, refined for
              today&apos;s lifestyle.
            </p>
          </div>
          <div>
            <h3>Quality First</h3>
            <p>
              Premium fabrics and careful finishing so every piece looks and
              feels exceptional.
            </p>
          </div>
          <div>
            <h3>Customer Care</h3>
            <p>
              Transparent policies, responsive support, and an experience built
              around trust.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section about-cta">
        <div>
          <h2>Ready to explore?</h2>
          <p>
            Discover curated collections made for everyday elegance and
            unforgettable moments.
          </p>
        </div>
        <a className="about-cta-link" href="/products">
          Shop the collection
        </a>
      </section>
    </div>
  );
}
