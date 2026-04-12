"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "../../../../../lib/adminApi";
import { createRazorpayRefund } from "../../../../../lib/storeApi";

function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatOrderId(orderId) {
  if (!orderId) return "#----";
  const raw = String(orderId);
  return `#${raw.slice(-6).toUpperCase()}`;
}

function formatDateLong(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getCustomerName(order, customer) {
  return (
    customer?.first_name ||
    order?.customer_name ||
    order?.customer?.name ||
    order?.customer?.full_name ||
    order?.shipping?.name ||
    order?.customer_id ||
    "Customer"
  );
}

function getChannelLabel(order) {
  if (!order) return "Online Store";
  if (order.channel) return order.channel;
  if (order.payment_provider) return order.payment_provider.toUpperCase();
  return "Online Store";
}

function getPaymentStatusLabel(order) {
  const status = (order?.payment_status || "").toLowerCase();
  if (status === "paid") return "Paid";
  if (status === "failed") return "Failed";
  if (status === "pending") return "Pending";
  return "Unpaid";
}

function getPaymentStatusClass(order) {
  const status = (order?.payment_status || "").toLowerCase();
  if (status === "paid") return "admin-status-good";
  if (status === "failed") return "admin-status-bad";
  if (status === "pending") return "admin-status-warn";
  return "admin-status-neutral";
}

function getFulfillmentStatusLabel(order) {
  const status = (order?.status || "").toLowerCase();
  if (status === "fulfilled") return "Fulfilled";
  if (status === "cancelled") return "Cancelled";
  return "Unfulfilled";
}

function getFulfillmentStatusClass(order) {
  const status = (order?.status || "").toLowerCase();
  if (status === "fulfilled") return "admin-status-good";
  if (status === "cancelled") return "admin-status-bad";
  return "admin-status-warn";
}

function getDeliveryStatusLabel(order) {
  const delivery = order?.delivery_status || order?.delhivery?.status || "";
  const normalized = String(delivery).toLowerCase();
  if (normalized === "success") return "Tracking added";
  if (normalized === "error") return "Delivery error";
  if (normalized === "skipped") return "Not shipped";
  if (normalized) return delivery;
  return "Pending";
}

function getDeliveryStatusClass(order) {
  const delivery = order?.delivery_status || order?.delhivery?.status || "";
  const normalized = String(delivery).toLowerCase();
  if (normalized === "success") return "admin-status-info";
  if (normalized === "error") return "admin-status-bad";
  if (normalized === "skipped") return "admin-status-neutral";
  if (normalized === "delivered") return "admin-status-good";
  return "admin-status-warn";
}

function formatAddress(address) {
  if (!address) return [];
  if (typeof address === "string") return [address];
  const parts = [
    address.name,
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code || address.zip,
    address.country,
    address.phone,
  ];
  return parts.filter(Boolean);
}

export default function OrderDetailPage({ params }) {
  const orderId = params?.id;
  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(`/orders/${orderId}`);
      setOrder(data);
      if (data?.customer_id) {
        try {
          const customerData = await apiFetch(`/customers/${data.customer_id}`);
          setCustomer(customerData);
        } catch (err) {
          setCustomer(null);
        }
      }
    } catch (err) {
      setError(err?.message || "Failed to load order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const items = Array.isArray(order?.items) ? order.items : [];
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  }, [items]);

  const discount = Number(order?.discount_amount || 0);
  const total = Number(order?.total ?? subtotal - discount);

  const shippingAddress =
    order?.shipping_address ||
    order?.shipping ||
    order?.delivery_address ||
    order?.address ||
    null;

  const timeline = useMemo(() => {
    if (!order) return [];
    const events = [];
    if (order.created_at) {
      events.push({
        title: "Order placed",
        time: formatDateLong(order.created_at),
        detail: `${formatOrderId(order.id)} placed via ${getChannelLabel(order)}`,
      });
    }
    if (order.payment_status) {
      events.push({
        title: `Payment ${getPaymentStatusLabel(order).toLowerCase()}`,
        time: formatDateLong(order.updated_at || order.created_at),
        detail: order.payment_method || order.payment_provider || "Payment method not recorded",
      });
    }
    if (order.status) {
      events.push({
        title: `Fulfillment ${getFulfillmentStatusLabel(order).toLowerCase()}`,
        time: formatDateLong(order.updated_at || order.created_at),
        detail: getDeliveryStatusLabel(order),
      });
    }
    return events;
  }, [order]);

  const handleRefund = async () => {
    if (!order) return;
    const paymentStatus = order.payment_status || "";
    if (!paymentStatus || paymentStatus === "failed") {
      setError("Only paid orders can be refunded.");
      return;
    }
    const raw = prompt("Refund amount in INR (leave blank for full refund):", "");
    const amount = raw && raw.trim() ? Number(raw) : null;
    if (amount !== null && (Number.isNaN(amount) || amount <= 0)) {
      setError("Invalid refund amount.");
      return;
    }
    setError("");
    try {
      await createRazorpayRefund({ order_id: order.id, amount: amount ?? undefined });
      await loadOrder();
    } catch (err) {
      setError(err?.message || "Failed to create refund.");
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-empty">Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="admin-page">
        {error ? <div className="admin-error">{error}</div> : null}
        <div className="admin-empty">Order not found.</div>
      </div>
    );
  }

  return (
    <div className="admin-page admin-order-page">
      <div className="admin-order-header">
        <div className="admin-order-title">
          <Link className="admin-order-back" href="/admin/orders">
            Orders
          </Link>
          <div className="admin-order-title-row">
            <h1>{formatOrderId(order.id)}</h1>
            <div className="admin-order-badges">
              <span className={`admin-status ${getPaymentStatusClass(order)}`}>
                {getPaymentStatusLabel(order)}
              </span>
              <span className={`admin-status ${getFulfillmentStatusClass(order)}`}>
                {getFulfillmentStatusLabel(order)}
              </span>
              <span className={`admin-status ${getDeliveryStatusClass(order)}`}>
                {getDeliveryStatusLabel(order)}
              </span>
            </div>
          </div>
          <p className="admin-order-subtitle">
            {formatDateLong(order.created_at || order.updated_at)} from {getChannelLabel(order)}
          </p>
        </div>
        <div className="admin-order-actions">
          <button className="admin-secondary" type="button" onClick={handleRefund}>
            Refund
          </button>
          <button className="admin-secondary" type="button">
            Return
          </button>
          <button className="admin-secondary" type="button">
            Edit
          </button>
          <button className="admin-secondary" type="button" onClick={() => window.print()}>
            Print
          </button>
          <button className="admin-secondary" type="button">
            More actions
          </button>
        </div>
      </div>

      {error ? <div className="admin-error">{error}</div> : null}

      <div className="admin-order-grid">
        <div className="admin-order-main">
          <div className="admin-card admin-order-card">
            <div className="admin-order-card-head">
              <span className={`admin-status ${getFulfillmentStatusClass(order)}`}>
                {getFulfillmentStatusLabel(order)}
              </span>
              <span className="admin-order-meta">{formatOrderId(order.id)}-F1</span>
            </div>
            <div className="admin-order-card-body">
              <div className="admin-order-section-title">
                {order.status === "fulfilled" ? "Fulfilled" : "Unfulfilled"}
              </div>
              <div className="admin-order-date">
                {formatDateLong(order.updated_at || order.created_at)}
              </div>
              <div className="admin-order-items">
                {items.length === 0 ? (
                  <div className="admin-muted">No items found.</div>
                ) : (
                  items.map((item, index) => (
                    <div className="admin-order-item" key={`${item.name}-${index}`}>
                      <div className="admin-order-item-info">
                        <div className="admin-strong">{item.name || "Item"}</div>
                        <div className="admin-subtext">
                          Qty {item.quantity || 1}
                        </div>
                      </div>
                      <div className="admin-order-item-price">
                        <span>{formatCurrency(item.price)}</span>
                        <span className="admin-order-item-total">
                          {formatCurrency(Number(item.price || 0) * Number(item.quantity || 1))}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="admin-order-actions-row">
                <button className="admin-secondary" type="button">
                  Add tracking
                </button>
              </div>
            </div>
          </div>

          <div className="admin-card admin-order-card">
            <div className="admin-order-card-head">
              <span className={`admin-status ${getPaymentStatusClass(order)}`}>
                {getPaymentStatusLabel(order)}
              </span>
            </div>
            <div className="admin-order-summary">
              <div className="admin-order-summary-row">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="admin-order-summary-row">
                <span>Discount</span>
                <span>{discount ? `- ${formatCurrency(discount)}` : "—"}</span>
              </div>
              <div className="admin-order-summary-row">
                <span>Shipping</span>
                <span>{formatCurrency(order?.shipping_amount || 0)}</span>
              </div>
              <div className="admin-order-summary-row total">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="admin-order-summary-row">
                <span>Paid</span>
                <span>{getPaymentStatusLabel(order) === "Paid" ? formatCurrency(total) : "—"}</span>
              </div>
            </div>
          </div>

          <div className="admin-card admin-order-card">
            <div className="admin-order-card-head">
              <h3>Timeline</h3>
            </div>
            <div className="admin-order-timeline">
              <div className="admin-order-comment">
                <div className="admin-order-comment-avatar">BP</div>
                <input placeholder="Leave a comment..." />
                <button className="admin-secondary" type="button">
                  Post
                </button>
              </div>
              {timeline.length === 0 ? (
                <div className="admin-muted">Timeline updates will appear here.</div>
              ) : (
                timeline.map((event, index) => (
                  <div className="admin-order-timeline-item" key={`${event.title}-${index}`}>
                    <div className="admin-order-timeline-dot" />
                    <div>
                      <div className="admin-strong">{event.title}</div>
                      <div className="admin-subtext">{event.detail}</div>
                    </div>
                    <div className="admin-order-timeline-time">{event.time}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="admin-order-aside">
          <div className="admin-card admin-order-card">
            <div className="admin-order-card-head">
              <h3>Notes</h3>
            </div>
            <p className="admin-muted">No notes from customer.</p>
          </div>

          <div className="admin-card admin-order-card">
            <div className="admin-order-card-head">
              <h3>Customer</h3>
            </div>
            <div className="admin-order-customer">
              <div className="admin-strong">{getCustomerName(order, customer)}</div>
              <div className="admin-subtext">
                {customer?.email || order?.customer_email || "No email on file"}
              </div>
              <div className="admin-subtext">
                {customer?.phone || order?.customer_phone || "No phone number"}
              </div>
              <div className="admin-order-subsection">
                <div className="admin-order-subtitle">Shipping address</div>
                {formatAddress(shippingAddress).length === 0 ? (
                  <div className="admin-subtext">No address provided.</div>
                ) : (
                  formatAddress(shippingAddress).map((line, index) => (
                    <div className="admin-subtext" key={`${line}-${index}`}>
                      {line}
                    </div>
                  ))
                )}
              </div>
              <div className="admin-order-subsection">
                <div className="admin-order-subtitle">Billing address</div>
                <div className="admin-subtext">
                  {order?.billing_address ? "Same as shipping address" : "Not provided"}
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card admin-order-card">
            <div className="admin-order-card-head">
              <h3>Order risk</h3>
            </div>
            <div className="admin-order-risk">
              <div className="admin-order-risk-bar">
                <span />
              </div>
              <div className="admin-order-risk-labels">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
              <p className="admin-subtext">
                Chargeback risk is low. You can fulfill this order.
              </p>
            </div>
          </div>

          <div className="admin-card admin-order-card">
            <div className="admin-order-card-head">
              <h3>Tags</h3>
            </div>
            <input className="admin-order-tag-input" placeholder="Add tags" />
          </div>
        </div>
      </div>
    </div>
  );
}
