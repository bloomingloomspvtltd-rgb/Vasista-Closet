export const mockProducts = [
  {
    id: 1,
    name: "Embroidered Silk Kurta",
    category: "Kurtas",
    subcategory: "Kurtis",
    price: 4999,
    originalPrice: 6999,
    image: "https://images.unsplash.com/photo-1629082927389-403501193d69?w=500&h=600&fit=crop",
    craftType: "Kalamkari",
    fabric: "Silk",
    rating: 4.5,
    reviews: 324,
    colors: ["Emerald", "Burgundy", "Navy"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    inStock: true,
    description: "Beautiful embroidered silk kurta",
    longDescription: "This stunning embroidered silk kurta features intricate Kalamkari hand-painted designs.",
    specifications: { material: "Pure Silk", care: "Dry clean recommended", origin: "India", craftType: "Hand-painted Kalamkari" }
  },
  {
    id: 2,
    name: "Pochampally Cotton Kurti",
    category: "Kurtas",
    price: 2499,
    originalPrice: 3499,
    image: "https://images.unsplash.com/photo-1596070735210-172995a99b74?w=500&h=600&fit=crop",
    craftType: "Pochampally",
    fabric: "Cotton",
    rating: 4.8,
    reviews: 156,
    colors: ["Blue", "Red", "Green"],
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
    description: "Traditional Pochampally cotton kurti",
    longDescription: "An everyday essential with the elegance of traditional Pochampally weaving.",
    specifications: { material: "100% Cotton", care: "Machine wash", origin: "Telangana, India", craftType: "Pochampally Weaving" }
  },
  {
    id: 3,
    name: "Ikkat Silk Saree",
    category: "Wedding Saga",
    price: 8999,
    originalPrice: 12999,
    image: "https://images.unsplash.com/photo-1590350716159-e389f8712fda?w=500&h=600&fit=crop",
    craftType: "Ikkat",
    fabric: "Silk",
    rating: 4.9,
    reviews: 89,
    colors: ["Purple", "Gold", "Maroon"],
    sizes: ["Free"],
    inStock: true,
    description: "Exquisite Ikkat silk saree",
    longDescription: "A timeless Ikkat silk saree with intricate patterns.",
    specifications: { material: "Pure Silk", care: "Dry clean only", origin: "Andhra Pradesh", craftType: "Ikkat Weaving" }
  },
  {
    id: 4,
    name: "Premium Kurta Set",
    category: "Wedding Saga",
    price: 5999,
    originalPrice: 8999,
    image: "https://images.unsplash.com/photo-1618519214302-b539c50a763e?w=500&h=600&fit=crop",
    craftType: "Kalamkari",
    fabric: "Silk",
    rating: 4.7,
    reviews: 234,
    colors: ["Gold", "Silver", "Copper"],
    sizes: ["M", "L", "XL"],
    inStock: true,
    description: "Complete kurta set",
    longDescription: "An elegant set including kurta and dupatta.",
    specifications: { material: "Silk with Embroidery", care: "Dry clean recommended", origin: "India", craftType: "Hand-embroidered" }
  },
  {
    id: 5,
    name: "Jamdani Cotton Coord Set",
    category: "Coord Sets",
    price: 3499,
    originalPrice: 4999,
    image: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=500&h=600&fit=crop",
    craftType: "Jamdani",
    fabric: "Cotton",
    rating: 4.6,
    reviews: 178,
    colors: ["Cream", "Sky Blue", "Mint"],
    sizes: ["XS", "S", "M", "L", "XL"],
    inStock: true,
    description: "Coord set",
    longDescription: "A versatile coord set with traditional weaving.",
    specifications: { material: "100% Cotton", care: "Machine wash", origin: "Bengal", craftType: "Jamdani Weaving" }
  },
  {
    id: 6,
    name: "Rayon Festival Kurti",
    category: "Kurtas",
    price: 1899,
    originalPrice: 2699,
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&h=600&fit=crop",
    craftType: "Printed",
    fabric: "Rayon",
    rating: 4.4,
    reviews: 412,
    colors: ["Red", "Orange", "Purple"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    inStock: true,
    description: "Festival kurti",
    longDescription: "A festive kurti with bright prints.",
    specifications: { material: "100% Rayon", care: "Machine wash", origin: "India", craftType: "Digital Print" }
  },
  {
    id: 7,
    name: "Organza Evening Gown",
    category: "Wedding Saga",
    price: 7999,
    originalPrice: 11999,
    image: "https://images.unsplash.com/photo-1595777712802-e2d2edd9bbd3?w=500&h=600&fit=crop",
    craftType: "Embroidered",
    fabric: "Organza",
    rating: 4.8,
    reviews: 95,
    colors: ["Blush", "Champagne", "Ivory"],
    sizes: ["S", "M", "L"],
    inStock: true,
    description: "Evening gown",
    longDescription: "A breathtaking gown with embroidery.",
    specifications: { material: "Organza with Embroidery", care: "Dry clean only", origin: "India", craftType: "Hand-embroidered" }
  },
  {
    id: 8,
    name: "Cotton Dhoti Kurta",
    category: "Kurtas",
    price: 2999,
    originalPrice: 3999,
    image: "https://images.unsplash.com/photo-1515562141207-6811bcb33eaf?w=500&h=600&fit=crop",
    craftType: "Woven",
    fabric: "Cotton",
    rating: 4.5,
    reviews: 267,
    colors: ["White", "Cream", "Grey"],
    sizes: ["M", "L", "XL"],
    inStock: true,
    description: "Dhoti kurta set",
    longDescription: "A traditional kurta set.",
    specifications: { material: "100% Cotton", care: "Machine wash", origin: "India", craftType: "Traditional Weaving" }
  },
];

export const mockBlogs = [
  {
    id: 1,
    title: "The Art of Kalamkari",
    excerpt: "Discover the ancient technique.",
    date: "2024-02-20",
    author: "Priya Sharma",
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&h=400&fit=crop",
    content: "Kalamkari is a traditional hand-painting technique."
  },
  {
    id: 2,
    title: "Styling Traditional Kurtas",
    excerpt: "Learn styling tips.",
    date: "2024-02-15",
    author: "Anjali Kumar",
    image: "https://images.unsplash.com/photo-1609709228159-0da9b4aeffa8?w=600&h=400&fit=crop",
    content: "Traditional kurtas for modern occasions."
  },
];

export const mockOrders = [
  {
    id: "ORD001",
    date: "2024-02-15",
    total: 9998,
    status: "Delivered",
    items: [
      { name: "Embroidered Silk Kurta", price: 4999, quantity: 1 },
      { name: "Pochampally Cotton Kurti", price: 2499, quantity: 2 }
    ]
  },
  {
    id: "ORD002",
    date: "2024-02-20",
    total: 8999,
    status: "In Transit",
    items: [
      { name: "Ikkat Silk Saree", price: 8999, quantity: 1 }
    ]
  },
];

export const mockFAQs = [
  { id: 1, question: "What is your return policy?", answer: "30 days return from purchase." },
  { id: 2, question: "International shipping?", answer: "Yes, we ship worldwide." },
  { id: 3, question: "Delivery time?", answer: "5-7 business days." },
  { id: 4, question: "Size info?", answer: "Size charts available." },
  { id: 5, question: "Customization?", answer: "Yes, custom tailoring available." },
];

export const mockReviews = [
  { id: 1, productId: 1, author: "Meera Patel", rating: 5, date: "2024-02-18", title: "Stunning!", content: "Beautiful kurta!" },
  { id: 2, productId: 1, author: "Priya Singh", rating: 4, date: "2024-02-10", title: "Great quality", content: "Happy with purchase!" },
];
