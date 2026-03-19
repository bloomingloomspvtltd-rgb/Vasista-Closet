export const categories = [
  {
    title: "Co-ord Sets",
    slug: "coord-sets",
    description: "Matched sets with modern cuts, crafted to move from day to night.",
    featured: true,
    image: "/images/topcollection/coord1.jpeg",
    matches: ["Coord Sets", "Co-ord Sets", "Coordsets"],
    tags: ["Sets", "Tailored", "Easy styling"],
  },
  {
    title: "Casual Kurta Sets",
    slug: "kurta-sets",
    description: "Easy-going kurta sets designed for everyday comfort.",
    featured: true,
    image: "/images/topcollection/casualkurtha.jpeg",
    matches: ["Kurta Sets", "Kurta-sets", "Kurta sets", "Kurthasets", "Kurtha Sets"],
    tags: ["Casual", "Comfort", "Daily"],
  },
  {
    title: "Premium Kurtas",
    slug: "premium-collection",
    description: "Elevated kurtas with artisanal detail and refined finishes.",
    featured: true,
    image: "/images/topcollection/pkurthas.jpeg",
    matches: ["Premium Collection", "Premium Collections", "Premium Kurtas"],
    tags: ["Premium", "Heritage", "Occasion"],
  },
  {
    title: "Festive Edit 26",
    slug: "festive-edit-26",
    description: "Occasion-ready pieces with rich textures and luminous finishes.",
    featured: false,
    image: "/categories/festive.png",
    matches: ["Wedding Saga"],
    tags: ["Festive", "Embellished", "Statement"],
  },
  {
    title: "New Arrivals",
    slug: "new-arrivals",
    description: "Fresh drops and recent favorites curated for the season.",
    featured: false,
    image: "/categories/new.png",
    showAll: true,
    tags: ["Latest", "Trending", "Seasonal"],
  },
  {
    title: "Everyday Ethnics",
    slug: "everyday-ethnics",
    description: "Soft fabrics and easy silhouettes for daily elegance.",
    featured: false,
    image: "/categories/everyday.png",
    matches: ["Kurtas"],
    tags: ["Comfort", "Workwear", "Daily"],
  },
  {
    title: "Kurtas",
    slug: "kurtas",
    description: "Classic kurtas updated with refined prints and detailing.",
    featured: false,
    matches: ["Kurtas", "Kurthas"],
    tags: ["Heritage", "Staple", "Versatile"],
  },
  {
    title: "Kurtis",
    slug: "kurtis",
    description: "Everyday kurtis with fresh prints and easy silhouettes.",
    featured: false,
    matches: ["Kurtis", "Kurthis"],
    tags: ["Easy wear", "Essentials", "Daily"],
  },
  {
    title: "Kurta Sets",
    slug: "kurta-sets",
    description: "Coordinated kurta sets curated for festive styling.",
    featured: false,
    matches: ["Kurta Sets", "Kurthasets", "Kurta-sets"],
    tags: ["Coordinated", "Occasion", "Classic"],
  },
  {
    title: "Wedding Saga",
    slug: "wedding-saga",
    description: "Elevated ensembles crafted for grand celebrations.",
    featured: false,
    matches: ["Wedding Saga"],
    tags: ["Occasion", "Luxury", "Festive"],
  },
];

export const getFeaturedCategories = () => categories.filter((category) => category.featured);

export const getCategoryBySlug = (slug) =>
  categories.find((category) => category.slug === slug);

export const getAllCategorySlugs = () => categories.map((category) => category.slug);

export const getCategoryProducts = (category, products) => {
  if (!category) return [];
  if (category.showAll) return products;

  const matches = new Set(category.matches || [category.title]);
  return products.filter((product) => {
    const productCategories = Array.isArray(product?.categories)
      ? product.categories
      : product?.category
        ? [product.category]
        : [];
    return productCategories.some((name) => matches.has(name));
  });
};
