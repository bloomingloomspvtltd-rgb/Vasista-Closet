const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function storeFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function getProducts() {
  return storeFetch("/products");
}

export async function getProduct(id) {
  return storeFetch(`/products/${id}`);
}

export async function getCategories() {
  return storeFetch("/categories");
}

export async function createCustomer(payload) {
  return storeFetch("/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createOrder(payload) {
  return storeFetch("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listPublicCoupons() {
  return storeFetch("/discounts/public");
}

export async function validateCoupon(code, subtotal) {
  const query = subtotal != null ? `?subtotal=${encodeURIComponent(subtotal)}` : "";
  return storeFetch(`/discounts/public/${encodeURIComponent(code)}${query}`);
}

export async function createRazorpayOrder(payload) {
  return storeFetch("/payments/razorpay/order", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyRazorpayPayment(payload) {
  return storeFetch("/payments/razorpay/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createRazorpayRefund(payload) {
  return storeFetch("/payments/razorpay/refund", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function upsertCustomerByPhone(payload) {
  return storeFetch("/customers/phone", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function upsertCustomerByEmail(payload) {
  return storeFetch("/customers/email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCustomerProfile(customerId, payload) {
  return storeFetch(`/customers/profile/${customerId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getCustomerOrders(customerId) {
  return storeFetch(`/orders/customer/${customerId}`);
}
