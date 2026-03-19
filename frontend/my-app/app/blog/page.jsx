export const metadata = {
  title: "Blog | Visista Closet",
  description:
    "Style notes, fabric stories, and seasonal edits from Visista Closet.",
};

const posts = [
  {
    title: "Everyday Elegance: Building a Versatile Ethnic Wardrobe",
    date: "March 2026",
    excerpt:
      "Discover how to build a balanced collection of timeless kurtas, soft sets, and festive staples you can style year-round.",
  },
  {
    title: "Festive Styling: From Day Events to Night Celebrations",
    date: "February 2026",
    excerpt:
      "A quick guide to layering, accessories, and color palettes that make festive looks feel elevated yet effortless.",
  },
  {
    title: "Fabric Focus: Comfort-First Textiles You’ll Love",
    date: "January 2026",
    excerpt:
      "A closer look at breathable fabrics and artisan finishes that keep you comfortable without compromising on style.",
  },
];

export default function BlogPage() {
  return (
    <div className="blog-page">
      <section className="blog-hero">
        <div>
          <span className="blog-kicker">Visista Journal</span>
          <h1>Stories, style notes, and crafted essentials.</h1>
          <p>
            Explore the world of Visista Closet—collection highlights, fabric
            stories, and styling ideas for modern Indian ethnic wear.
          </p>
        </div>
      </section>

      <section className="blog-list">
        {posts.map((post) => (
          <article className="blog-card" key={post.title}>
            <span className="blog-date">{post.date}</span>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
            <span className="blog-link">Read more</span>
          </article>
        ))}
      </section>

      <section className="blog-cta">
        <div>
          <h2>Looking for the latest drops?</h2>
          <p>Browse new arrivals curated for everyday elegance.</p>
        </div>
        <a className="blog-cta-link" href="/products">
          Shop now
        </a>
      </section>
    </div>
  );
}
