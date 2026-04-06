import "../styles/globals.css";
import "../styles/navbar.css";
import "../styles/theme.css";
import "../styles/auth.css";
import "../styles/home-sections.css";
import "../styles/store-locator.css";
import "../styles/footer.css";
import "../styles/products.css";
import "../styles/top-collections.css";
import "../styles/curated-collections.css";
import "../styles/instagram.css";
import "../styles/product-detail.css";
import "../styles/cart.css";
import "../styles/checkout.css";
import "../styles/account.css";
import "../styles/blog.css";
import "../styles/privacy.css";
import "../styles/wishlist.css";
import "../styles/admin.css";
import "../styles/order-tracking.css";
import "../styles/about.css";
import "../styles/toast.css";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import CartToast from "../components/layout/CartToast";
import { CartProvider } from "../lib/CartContext";
import { WishlistProvider } from "../lib/WishlistContext";
import VisitTracker from "../components/analytics/VisitTracker";

export const metadata = {
  title: "Visista | Modern Indian Ethnic Wear",
  description:
    "Visista – Modern Indian ethnic wear from everyday elegance to wedding showstoppers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <CartProvider>
          <WishlistProvider>
            <VisitTracker />
            <Navbar />
            <main>{children}</main>
            <CartToast />
            <Footer />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
