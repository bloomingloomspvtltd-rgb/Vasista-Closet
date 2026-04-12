"use client";

import { useEffect, useState } from "react";

import { useCart } from "@/lib/CartContext";
import { getCustomerSession, setCustomerSession } from "@/lib/customerSession";
import {
  createCustomer,
  createOrder,
  createRazorpayOrder,
  updateCustomerProfile,
  listPublicCoupons,
  validateCoupon,
  verifyRazorpayPayment,
} from "@/lib/storeApi";

const countryOptions = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Singapore",
  "United Arab Emirates",
  "Germany",
  "France",
  "Other",
];

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
};

export default function CheckoutPage() {
  const { cartItems, clearCart, getTotalPrice } = useCart();
  const [form, setForm] = useState(emptyForm);
  const [customer, setCustomer] = useState(null);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(true);
  const [error, setError] = useState("");
  const [clientError, setClientError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [autoApplied, setAutoApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const stored = getCustomerSession();
    if (!stored) return;
    setCustomer(stored);
    const addresses = Array.isArray(stored.addresses) ? stored.addresses : [];
    const firstAddress = addresses[0] || {};
    setSelectedAddressIndex(0);
    setForm({
      first_name: stored.first_name || "",
      last_name: stored.last_name || "",
      email: stored.email || "",
      phone: stored.phone || "",
      address_line1: firstAddress.line1 || firstAddress.address_line1 || "",
      address_line2: firstAddress.line2 || firstAddress.address_line2 || "",
      city: firstAddress.city || "",
      state: firstAddress.state || "",
      postal_code: firstAddress.postal_code || "",
      country: firstAddress.country || "",
    });
    setIsEditing(false);
  }, []);

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const data = await listPublicCoupons();
        setAvailableCoupons(Array.isArray(data) ? data : []);
      } catch (err) {
        setAvailableCoupons([]);
      }
    };
    loadCoupons();
  }, []);

  const computeDiscount = (subtotal, coupon) => {
    if (!coupon) return 0;
    let discount =
      coupon.type === "percentage"
        ? (subtotal * coupon.value) / 100
        : coupon.value;
    if (coupon.max_discount != null) {
      discount = Math.min(discount, coupon.max_discount);
    }
    return Math.min(discount, subtotal);
  };

  useEffect(() => {
    if (!customer || !availableCoupons.length || appliedCoupon) return;
    const subtotal = getTotalPrice();
    const eligible = availableCoupons.filter((coupon) => {
      if (coupon.min_order_value != null && subtotal < coupon.min_order_value) return false;
      return true;
    });
    if (!eligible.length) return;
    const best = eligible.reduce((bestSoFar, coupon) => {
      const value = computeDiscount(subtotal, coupon);
      const bestValue = bestSoFar ? computeDiscount(subtotal, bestSoFar) : 0;
      return value > bestValue ? coupon : bestSoFar;
    }, null);
    if (best) {
      setAppliedCoupon(best);
      setCouponCode(best.code || "");
      setAutoApplied(true);
    }
  }, [customer, availableCoupons, appliedCoupon, cartItems]);

  const handleSelectAddress = (index) => {
    if (!customer) return;
    const addresses = Array.isArray(customer.addresses) ? customer.addresses : [];
    const selected = addresses[index];
    if (!selected) return;
    setSelectedAddressIndex(index);
    setForm((prev) => ({
      ...prev,
      address_line1: selected.line1 || selected.address_line1 || "",
      address_line2: selected.line2 || selected.address_line2 || "",
      city: selected.city || "",
      state: selected.state || "",
      postal_code: selected.postal_code || "",
      country: selected.country || "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setClientError("");
    setSuccess("");
    setLoading(true);

    try {
      if (cartItems.length === 0) {
        setError("Your cart is empty.");
        return;
      }

      const requiredFields = [
        "first_name",
        "email",
        "address_line1",
        "city",
        "state",
        "postal_code",
        "country",
      ];

      const hasMissingRequired = requiredFields.some((field) => !String(form[field] || "").trim());

      if (hasMissingRequired) {
        setClientError("Please fill in all required address and contact fields.");
        return;
      }

      const addressPayload = {
        line1: form.address_line1.trim(),
        line2: form.address_line2.trim() || null,
        city: form.city.trim(),
        state: form.state.trim(),
        postal_code: form.postal_code.trim(),
        country: form.country.trim(),
      };

      let savedCustomer = customer;
      if (customer?.id) {
        const addresses = Array.isArray(customer.addresses) ? [...customer.addresses] : [];
        if (isEditing) {
          if (selectedAddressIndex === null || addresses.length === 0) {
            addresses.push(addressPayload);
            setSelectedAddressIndex(addresses.length - 1);
          } else {
            addresses[selectedAddressIndex] = { ...addresses[selectedAddressIndex], ...addressPayload };
          }
        }
        savedCustomer = await updateCustomerProfile(customer.id, {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          addresses,
        });
        setCustomer(savedCustomer);
        setCustomerSession(savedCustomer);
        setIsEditing(false);
      } else {
        savedCustomer = await createCustomer({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim() || null,
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          addresses: [addressPayload],
        });
        setCustomer(savedCustomer);
        setCustomerSession(savedCustomer);
      }

      const items = cartItems.map((item) => ({
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        sku: item.sku || null,
        size: item.size || null,
        color: item.color || null,
        image:
          (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : item.image) ||
          (Array.isArray(item.colors) && item.colors.length > 0
            ? (item.colors.find((color) => color?.name === item.color)?.images || [])[0] ||
              item.colors.find((color) => color?.name === item.color)?.image
            : null) ||
          null,
      }));

      const subtotal = getTotalPrice();
      const discountAmount = computeDiscount(subtotal, appliedCoupon);
      const total = Math.max(subtotal - discountAmount, 0);

      const orderPayload = {
        customer_id: savedCustomer?.id || null,
        items,
        subtotal,
        discount_id: appliedCoupon?.id || null,
        discount_amount: discountAmount,
        total,
        shipping_address: {
          name: `${form.first_name} ${form.last_name}`.trim() || form.first_name || "Customer",
          email: form.email || null,
          phone: form.phone || null,
          line1: addressPayload.line1,
          line2: addressPayload.line2,
          city: addressPayload.city,
          state: addressPayload.state,
          postal_code: addressPayload.postal_code,
          country: addressPayload.country,
        },
      };

      if (paymentMethod === "cod") {
        await createOrder({
          ...orderPayload,
          payment_method: "cod",
          payment_provider: "cod",
          payment_status: "pending",
        });
        clearCart();
        setSuccess("Order placed with Cash on Delivery. We'll confirm your order shortly.");
        setForm(emptyForm);
        return;
      }

      const razorpayOrder = await createRazorpayOrder(orderPayload);

      const loaded = await loadRazorpay();
      if (!loaded) {
        setError("Unable to load Razorpay checkout. Please try again.");
        return;
      }

      const options = {
        key: razorpayOrder.key_id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Visista Closet",
        description: "Order payment",
        order_id: razorpayOrder.razorpay_order_id,
        prefill: {
          name: `${form.first_name} ${form.last_name}`.trim(),
          email: form.email,
          contact: form.phone || undefined,
        },
        notes: {
          order_id: razorpayOrder.order_id,
        },
        handler: async (response) => {
          try {
            await verifyRazorpayPayment({
              order_id: razorpayOrder.order_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            clearCart();
            setSuccess("Payment successful. Your order is confirmed.");
            setForm(emptyForm);
          } catch (err) {
            setError("Payment verification failed. Please contact support.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        theme: {
          color: "#e91e63",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(err?.message || "Failed to place order. Please try again.");
    } finally {
      // Keep loading state until Razorpay closes or payment completes.
      if (!window.Razorpay) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="checkout-grid">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <h2>Customer details</h2>
            {customer && !isEditing ? (
              <div className="checkout-saved">
                <div>
                  <strong>
                    {[customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Customer"}
                  </strong>
                  <div>{customer.email}</div>
                  {customer.phone ? <div>{customer.phone}</div> : null}
                </div>
                <div className="checkout-saved-actions">
                  <button type="button" className="admin-secondary" onClick={() => setIsEditing(true)}>
                    Edit details
                  </button>
                  <button
                    type="button"
                    className="admin-secondary"
                    onClick={() => {
                      setIsEditing(true);
                      setSelectedAddressIndex(null);
                      setForm((prev) => ({
                        ...prev,
                        address_line1: "",
                        address_line2: "",
                        city: "",
                        state: "",
                        postal_code: "",
                        country: "",
                      }));
                    }}
                  >
                    Add new address
                  </button>
                </div>
                {Array.isArray(customer.addresses) && customer.addresses.length > 0 ? (
                  <div className="checkout-addresses">
                    <label className="admin-field">
                      Select address
                      <select
                        value={selectedAddressIndex}
                        onChange={(event) => handleSelectAddress(Number(event.target.value))}
                      >
                        {customer.addresses.map((address, index) => (
                          <option key={`${address.line1 || "address"}-${index}`} value={index}>
                            {[
                              address.label,
                              address.line1,
                              address.city,
                              address.state,
                              address.postal_code,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}
              </div>
            ) : null}

            {customer && !isEditing ? null : (
              <>
            <label className="admin-field">
              First name
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                autoComplete="given-name"
                required
              />
            </label>
            <label className="admin-field">
              Last name
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                autoComplete="family-name"
              />
            </label>
            <label className="admin-field">
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </label>
            <label className="admin-field">
              Phone
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </label>
            <label className="admin-field">
              Address line 1
              <input
                name="address_line1"
                value={form.address_line1}
                onChange={handleChange}
                autoComplete="address-line1"
                required
              />
            </label>
            <label className="admin-field">
              Address line 2
              <input
                name="address_line2"
                value={form.address_line2}
                onChange={handleChange}
                autoComplete="address-line2"
              />
            </label>
            <label className="admin-field">
              City
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                autoComplete="address-level2"
                required
              />
            </label>
            <label className="admin-field">
              State
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                autoComplete="address-level1"
                required
              />
            </label>
            <label className="admin-field">
              Postal code
              <input
                name="postal_code"
                value={form.postal_code}
                onChange={handleChange}
                autoComplete="postal-code"
                inputMode="numeric"
                required
              />
            </label>
            <label className="admin-field">
              Country
              <select
                name="country"
                value={form.country}
                onChange={handleChange}
                autoComplete="country-name"
                required
              >
                <option value="">Select country</option>
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>
              </>
            )}
            {clientError ? <div className="admin-error">{clientError}</div> : null}
            {error ? <div className="admin-error">{error}</div> : null}
            {success ? <div className="admin-success">{success}</div> : null}
            <div className="checkout-payment">
              <h3>Payment method</h3>
              <div className="checkout-payment-options">
                <label className="checkout-payment-option">
                  <input
                    type="radio"
                    name="payment_method"
                    value="razorpay"
                    checked={paymentMethod === "razorpay"}
                    onChange={() => setPaymentMethod("razorpay")}
                  />
                  <span>Pay online (Razorpay)</span>
                </label>
                <label className="checkout-payment-option">
                  <input
                    type="radio"
                    name="payment_method"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                  />
                  <span>Cash on Delivery (COD)</span>
                </label>
              </div>
              {paymentMethod === "cod" ? (
                <p className="checkout-payment-note">
                  Pay in cash when the order is delivered.
                </p>
              ) : null}
            </div>
            <button className="add-to-cart-btn" type="submit" disabled={loading}>
              {loading
                ? paymentMethod === "cod"
                  ? "Placing order..."
                  : "Opening payment..."
                : paymentMethod === "cod"
                ? "Place order (COD)"
                : "Pay now"}
            </button>
          </form>

          <div className="checkout-summary">
            <h2>Order summary</h2>
            <ul>
              {cartItems.map((item) => (
                <li key={`${item.id}-${item.color || ""}-${item.size || ""}`}>
                  <span>{item.name}</span>
                  <span>
                    {item.quantity} x Rs. {item.price}
                  </span>
                  <span>Rs. {item.price * item.quantity}</span>
                </li>
              ))}
            </ul>
            <div className="checkout-payment-summary">
              <span>Payment method</span>
              <strong>{paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay (Online)"}</strong>
            </div>

              <div className="checkout-coupon">
                <h3>Apply coupon</h3>
                <div className="checkout-coupon-row">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                  />
                  <button
                    type="button"
                    className="admin-secondary"
                    onClick={async () => {
                      setCouponError("");
                      setAppliedCoupon(null);
                      if (!couponCode.trim()) {
                        setCouponError("Enter a coupon code.");
                        return;
                      }
                      try {
                        const coupon = await validateCoupon(couponCode.trim(), getTotalPrice());
                        setAppliedCoupon(coupon);
                        setAutoApplied(false);
                      } catch (err) {
                        setCouponError("Invalid or expired coupon.");
                      }
                    }}
                  >
                    Apply
                  </button>
                  {appliedCoupon ? (
                    <button
                      type="button"
                      className="admin-secondary"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode("");
                        setCouponError("");
                        setAutoApplied(false);
                      }}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                {appliedCoupon ? (
                  <div className="checkout-coupon-success">
                  Applied {appliedCoupon.code} (
                  {appliedCoupon.type === "percentage"
                    ? `${appliedCoupon.value}%`
                    : `Rs. ${appliedCoupon.value}`}
                  )
                  {autoApplied ? (
                    <span className="checkout-coupon-badge">Best coupon applied</span>
                  ) : null}
                  </div>
                ) : null}
                {couponError ? <div className="admin-error">{couponError}</div> : null}
                {availableCoupons.length > 0 ? (
                  <div className="checkout-coupon-list">
                    <div className="checkout-coupon-title">Available coupons</div>
                    {availableCoupons.map((coupon) => (
                      <button
                        type="button"
                        key={coupon.id}
                        className="checkout-coupon-item"
                        onClick={() => {
                          setAppliedCoupon(coupon);
                          setCouponCode(coupon.code || "");
                          setCouponError("");
                        }}
                      >
                        <span>{coupon.code}</span>
                        <span>
                          {coupon.type === "percentage"
                            ? `${coupon.value}% off`
                            : `Rs. ${coupon.value} off`}
                          {coupon.min_order_value != null
                            ? ` · Min Rs. ${coupon.min_order_value}`
                            : ""}
                          {coupon.max_discount != null
                            ? ` · Max Rs. ${coupon.max_discount}`
                            : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

            <div className="checkout-price">
              <div>
                <span>Bag total</span>
                <span>Rs. {getTotalPrice()}</span>
              </div>
              <div>
                <span>Coupon discount</span>
                <span>
                  {appliedCoupon ? `- Rs. ${Math.round(
                    computeDiscount(getTotalPrice(), appliedCoupon)
                  )}` : "- Rs. 0"}
                </span>
              </div>
              <div className="checkout-total">
                <span>Grand total</span>
                <span>
                  Rs. {Math.max(
                    getTotalPrice() -
                      computeDiscount(getTotalPrice(), appliedCoupon),
                    0
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
