"use client";

import { useCart } from "@/lib/CartContext";

export default function CartToast() {
  const { toast } = useCart();

  return (
    <div
      className={`cart-toast${toast ? " show" : ""}`}
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      {toast ? <div className="cart-toast-inner">{toast.message}</div> : null}
    </div>
  );
}
