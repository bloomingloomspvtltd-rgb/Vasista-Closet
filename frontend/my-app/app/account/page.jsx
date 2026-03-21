"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { getCustomerOrders, updateCustomerProfile } from "@/lib/storeApi";
import { clearCustomerSession, getCustomerSession, setCustomerSession } from "@/lib/customerSession";

function isProfileIncomplete(customer) {
  if (!customer) return true;
  const firstName = (customer.first_name || "").trim().toLowerCase();
  if (!firstName || firstName === "customer") return true;
  if (!customer.email) return true;
  if (!Array.isArray(customer.addresses) || customer.addresses.length === 0) return true;
  return false;
}

function formatPaymentMethod(order) {
  const raw = (order.payment_method || order.payment_provider || "").toLowerCase();
  if (raw === "cod") return "Cash on Delivery";
  if (raw === "razorpay") return "Razorpay (Online)";
  return raw ? raw.replace(/_/g, " ").toUpperCase() : "Online";
}

export default function AccountPage() {
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [formState, setFormState] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const [addressState, setAddressState] = useState({
    label: "Home",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = getCustomerSession();
    setCustomer(stored);
    if (stored) {
      setFormState({
        first_name: stored.first_name || "",
        last_name: stored.last_name || "",
        email: stored.email || "",
        phone: stored.phone || "",
      });
      const existingAddress = Array.isArray(stored.addresses) ? stored.addresses[0] : null;
      if (existingAddress) {
        setAddressState({
          label: existingAddress.label || "Home",
          line1: existingAddress.line1 || "",
          line2: existingAddress.line2 || "",
          city: existingAddress.city || "",
          state: existingAddress.state || "",
          postal_code: existingAddress.postal_code || "",
          country: existingAddress.country || "India",
        });
      }
      const loadOrders = async () => {
        try {
          const data = await getCustomerOrders(stored.id);
          setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
          setOrders([]);
        } finally {
          setLoadingOrders(false);
        }
      };
      loadOrders();
    } else {
      setLoadingOrders(false);
    }
  }, []);

  const incomplete = useMemo(() => isProfileIncomplete(customer), [customer]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!customer?.id) return;
    setSaving(true);
    setMessage("");
    try {
      const address = {
        label: addressState.label.trim() || "Home",
        line1: addressState.line1.trim(),
        line2: addressState.line2.trim() || null,
        city: addressState.city.trim(),
        state: addressState.state.trim(),
        postal_code: addressState.postal_code.trim(),
        country: addressState.country.trim() || "India",
      };
      const addresses =
        address.line1 && address.city && address.state && address.postal_code
          ? [address]
          : customer.addresses || [];
      const updated = await updateCustomerProfile(customer.id, {
        first_name: formState.first_name.trim(),
        last_name: formState.last_name.trim() || null,
        email: formState.email.trim() || null,
        phone: formState.phone.trim() || null,
        addresses,
      });
      setCustomer(updated);
      setCustomerSession(updated);
      setMessage("Profile updated.");
    } catch (err) {
      setMessage("Could not update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!customer) {
    return (
      <div className="account-page">
        <div className="account-card">
          <h1>Your account</h1>
          <p>Please sign in to view your profile, addresses, and orders.</p>
          <Link href="/login" className="add-to-cart-btn account-cta">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="account-page">
      <div className="account-card">
        <div className="account-header">
          <div>
            <h1>Welcome, {customer.first_name || "Customer"}</h1>
            <p className="account-subtitle">Manage your profile and orders.</p>
          </div>
          <button
            type="button"
            className="account-logout"
            onClick={() => {
              clearCustomerSession();
              setCustomer(null);
            }}
          >
            Logout
          </button>
        </div>

        {incomplete ? (
          <div className="account-section">
            <h2>Complete your profile</h2>
            <p className="account-subtitle">
              Tell us a bit about you so we can personalize your experience.
            </p>
            <form className="account-form" onSubmit={handleSubmit}>
              <label>
                First name
                <input
                  type="text"
                  value={formState.first_name}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, first_name: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Last name
                <input
                  type="text"
                  value={formState.last_name}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, last_name: event.target.value }))
                  }
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, email: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Phone
                <input
                  type="tel"
                  value={formState.phone}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, phone: event.target.value }))
                  }
                />
              </label>
              <label>
                Address line 1
                <input
                  type="text"
                  value={addressState.line1}
                  onChange={(event) =>
                    setAddressState((prev) => ({ ...prev, line1: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Address line 2
                <input
                  type="text"
                  value={addressState.line2}
                  onChange={(event) =>
                    setAddressState((prev) => ({ ...prev, line2: event.target.value }))
                  }
                />
              </label>
              <label>
                City
                <input
                  type="text"
                  value={addressState.city}
                  onChange={(event) =>
                    setAddressState((prev) => ({ ...prev, city: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                State
                <input
                  type="text"
                  value={addressState.state}
                  onChange={(event) =>
                    setAddressState((prev) => ({ ...prev, state: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Postal code
                <input
                  type="text"
                  value={addressState.postal_code}
                  onChange={(event) =>
                    setAddressState((prev) => ({ ...prev, postal_code: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Country
                <input
                  type="text"
                  value={addressState.country}
                  onChange={(event) =>
                    setAddressState((prev) => ({ ...prev, country: event.target.value }))
                  }
                />
              </label>
              {message ? <div className="account-message">{message}</div> : null}
              <button type="submit" className="add-to-cart-btn" disabled={saving}>
                {saving ? "Saving..." : "Save details"}
              </button>
            </form>
          </div>
        ) : null}

        <div className="account-section">
          <h2>Profile</h2>
          <div className="account-details">
            <div>
              <span>Name</span>
              <strong>
                {[customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Customer"}
              </strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{customer.email || "Not added yet"}</strong>
            </div>
            <div>
              <span>Phone</span>
              <strong>{customer.phone || "Not added yet"}</strong>
            </div>
          </div>
        </div>

        <div className="account-section">
          <h2>Addresses</h2>
          {customer.addresses && customer.addresses.length > 0 ? (
            <div className="account-addresses">
              {customer.addresses.map((address, index) => (
                <div key={`${address.line1 || "address"}-${index}`} className="account-address-card">
                  <strong>{address.label || "Address"}</strong>
                  <span>{address.line1}</span>
                  {address.line2 ? <span>{address.line2}</span> : null}
                  <span>
                    {[address.city, address.state, address.postal_code].filter(Boolean).join(", ")}
                  </span>
                  <span>{address.country}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="account-muted">No addresses saved yet.</p>
          )}
        </div>

        <div className="account-section">
          <h2>Your orders</h2>
          {loadingOrders ? (
            <p className="account-muted">Loading your orders...</p>
          ) : orders.length === 0 ? (
            <p className="account-muted">No orders yet.</p>
          ) : (
            <div className="account-orders">
              {orders.map((order) => (
                <div key={order.id} className="account-order-card">
                  <div>
                    <strong>Order #{order.id.slice(-6)}</strong>
                    <span>{order.status}</span>
                  </div>
                  <div>
                    <span>Items: {order.items?.length || 0}</span>
                    <span>Total: Rs. {order.total}</span>
                    <span>Method: {formatPaymentMethod(order)}</span>
                    <span>Payment: {order.payment_status || "pending"}</span>
                    {order.razorpay_payment_id ? (
                      <span>Payment ID: {order.razorpay_payment_id}</span>
                    ) : null}
                    {order.payment_failure_reason ? (
                      <span>Failure: {order.payment_failure_reason}</span>
                    ) : null}
                    {order.refund_status ? (
                      <span>Refund: {order.refund_status}</span>
                    ) : null}
                    {order.refund_amount ? (
                      <span>Refund amount: Rs. {Number(order.refund_amount) / 100}</span>
                    ) : null}
                    {Array.isArray(order.refunds) && order.refunds.length > 0 ? (
                      <div className="account-order-refunds">
                        <span>Refund history:</span>
                        {order.refunds.map((refund) => (
                          <span key={refund.id}>
                            {refund.id} - {refund.status} - Rs. {Number(refund.amount) / 100}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
