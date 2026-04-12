"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import AdminTopbar from "../../../../components/admin/AdminTopbar";
import { apiFetch } from "../../../../lib/adminApi";
import { createRazorpayRefund } from "../../../../lib/storeApi";

function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function createEmptyItem() {
  return { name: "", price: "", quantity: 1 };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState([createEmptyItem()]);
  const [discountId, setDiscountId] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [refunds, setRefunds] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState("");

  const totalsLabel = useMemo(() => `${orders.length} total`, [orders.length]);
  const tabs = useMemo(
    () => [
      { id: "all", label: "All" },
      { id: "unfulfilled", label: "Unfulfilled" },
      { id: "unpaid", label: "Unpaid" },
      { id: "open", label: "Open" },
      { id: "archived", label: "Archived" },
      { id: "return", label: "Return requests" },
    ],
    []
  );

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = toNumber(item.price, 0);
      const quantity = toNumber(item.quantity, 1);
      return sum + price * quantity;
    }, 0);
  }, [items]);

  const total = useMemo(() => {
    const discount = toNumber(discountAmount, 0);
    return Math.max(subtotal - discount, 0);
  }, [subtotal, discountAmount]);

  const resetForm = () => {
    setEditingId(null);
    setCustomerId("");
    setStatus("pending");
    setItems([createEmptyItem()]);
    setDiscountId("");
    setDiscountAmount("");
    setRefunds([]);
    setPaymentStatus("");
    setFormError("");
    setShowForm(false);
  };

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleEdit = (order) => {
    setShowForm(true);
    setEditingId(order.id);
    setCustomerId(order.customer_id || "");
    setStatus(order.status || "pending");
    setPaymentStatus(order.payment_status || "");
    setRefunds(Array.isArray(order.refunds) ? order.refunds : []);
    setItems(
      (order.items || []).map((item) => ({
        name: item.name || "",
        price: item.price ?? "",
        quantity: item.quantity ?? 1,
      }))
    );
    if (!order.items || order.items.length === 0) {
      setItems([createEmptyItem()]);
    }
    setDiscountId(order.discount_id || "");
    setDiscountAmount(order.discount_amount ?? "");
    setFormError("");
  };

  const handleDelete = async (order) => {
    if (!confirm("Delete this order?")) return;
    setError("");
    try {
      await apiFetch(`/orders/${order.id}`, { method: "DELETE" });
      await loadOrders();
      if (editingId === order.id) resetForm();
    } catch (err) {
      setError(err?.message || "Failed to delete order.");
    }
  };

  const handleRefund = async (order) => {
    const paymentStatus = order.payment_status || "";
    if (!paymentStatus || paymentStatus === "failed") {
      setError("Only paid orders can be refunded.");
      return;
    }
    const raw = prompt(
      "Refund amount in INR (leave blank for full refund):",
      ""
    );
    const amount = raw && raw.trim() ? Number(raw) : null;
    if (amount !== null && (Number.isNaN(amount) || amount <= 0)) {
      setError("Invalid refund amount.");
      return;
    }
    setError("");
    try {
      await createRazorpayRefund({ order_id: order.id, amount: amount ?? undefined });
      await loadOrders();
    } catch (err) {
      setError(err?.message || "Failed to create refund.");
    }
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const cleanedItems = items
      .map((item) => ({
        name: item.name.trim(),
        price: toNumber(item.price, 0),
        quantity: toNumber(item.quantity, 1),
      }))
      .filter((item) => item.name && item.quantity > 0);

    if (cleanedItems.length === 0) {
      setFormError("Add at least one order item.");
      return;
    }

    const payload = {
      customer_id: customerId.trim() || null,
      items: cleanedItems,
      status,
      subtotal,
      discount_id: discountId.trim() || null,
      discount_amount: toNumber(discountAmount, 0),
      total,
    };

    setSaving(true);
    try {
      if (editingId) {
        await apiFetch(`/orders/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/orders", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      await loadOrders();
      resetForm();
    } catch (err) {
      setFormError(err?.message || "Failed to save order.");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = (checked, list) => {
    if (checked) {
      setSelectedIds(list.map((order) => order.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelection = (orderId) => {
    setSelectedIds((prev) => {
      if (prev.includes(orderId)) {
        return prev.filter((id) => id !== orderId);
      }
      return [...prev, orderId];
    });
  };

  const filteredOrders = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    const matchesTab = (order) => {
      const fulfillment = (order.status || "").toLowerCase();
      const payment = (order.payment_status || "").toLowerCase();
      const hasRefund = Array.isArray(order.refunds) && order.refunds.length > 0;
      if (activeTab === "unfulfilled") return fulfillment !== "fulfilled";
      if (activeTab === "unpaid") return payment !== "paid";
      if (activeTab === "open") return fulfillment !== "cancelled";
      if (activeTab === "archived") return fulfillment === "cancelled";
      if (activeTab === "return") return hasRefund;
      return true;
    };

    const matchesSearch = (order) => {
      if (!normalized) return true;
      const candidates = [
        String(order.id || ""),
        String(order.customer_id || ""),
        String(order.payment_status || ""),
        String(order.payment_method || ""),
        String(order.payment_provider || ""),
        String(order.status || ""),
      ];
      const customerName = getCustomerName(order);
      if (customerName) candidates.push(customerName);
      return candidates.some((value) => value.toLowerCase().includes(normalized));
    };

    return orders.filter((order) => matchesTab(order) && matchesSearch(order));
  }, [orders, activeTab, searchQuery]);

  const selectedAll =
    filteredOrders.length > 0 &&
    filteredOrders.every((order) => selectedIds.includes(order.id));

  return (
    <div className="admin-page">
      <AdminTopbar
        title="Orders"
        subtitle="Create, update, and fulfill customer purchases."
      />

      {error ? <div className="admin-error">{error}</div> : null}

      <section className="admin-grid admin-stack">
        <div className="admin-card admin-orders-card">
          <div className="admin-orders-toolbar">
            <div className="admin-orders-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`admin-orders-tab ${activeTab === tab.id ? "active" : ""}`}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="admin-orders-actions">
              <label className="admin-search">
                <span className="sr-only">Search orders</span>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search orders, customers, or payment status"
                />
              </label>
              <button className="admin-secondary" type="button" onClick={loadOrders}>
                Refresh
              </button>
              <button className="admin-action" type="button" onClick={() => setShowForm(true)}>
                New order
              </button>
            </div>
          </div>
          <div className="admin-orders-summary">
            <div>{loading ? "Loading orders..." : `${filteredOrders.length} of ${totalsLabel}`}</div>
            {selectedIds.length > 0 ? (
              <div className="admin-muted">{selectedIds.length} selected</div>
            ) : null}
          </div>
          {loading ? (
            <div className="admin-empty">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="admin-empty">No orders match this view.</div>
          ) : (
            <div className="admin-orders-table">
              <div className="admin-orders-row admin-orders-head">
                <div className="admin-orders-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedAll}
                    onChange={(event) => handleSelectAll(event.target.checked, filteredOrders)}
                    aria-label="Select all orders"
                  />
                </div>
                <div>Order</div>
                <div>Date</div>
                <div>Customer</div>
                <div>Channel</div>
                <div>Total</div>
                <div>Payment status</div>
                <div>Fulfillment status</div>
                <div>Items</div>
                <div>Delivery status</div>
                <div>Actions</div>
              </div>
              {filteredOrders.map((order) => (
                <div className="admin-orders-row" key={order.id}>
                  <div className="admin-orders-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(order.id)}
                      onChange={() => toggleSelection(order.id)}
                      aria-label={`Select order ${formatOrderId(order.id)}`}
                    />
                  </div>
                  <div className="admin-orders-id">
                    <Link className="admin-orders-link" href={`/admin/orders/${order.id}`}>
                      {formatOrderId(order.id)}
                    </Link>
                  </div>
                  <div>{formatOrderDate(order.created_at || order.updated_at)}</div>
                  <div className="admin-orders-customer">
                    <div className="admin-strong">
                      <Link className="admin-orders-link" href={`/admin/orders/${order.id}`}>
                        {getCustomerName(order)}
                      </Link>
                    </div>
                    {order.customer_id ? (
                      <div className="admin-subtext">{order.customer_id}</div>
                    ) : null}
                  </div>
                  <div>{getChannelLabel(order)}</div>
                  <div>{formatCurrency(order.total)}</div>
                  <div className={`admin-status ${getPaymentStatusClass(order)}`}>
                    {getPaymentStatusLabel(order)}
                  </div>
                  <div className={`admin-status ${getFulfillmentStatusClass(order)}`}>
                    {getFulfillmentStatusLabel(order)}
                  </div>
                  <div>{formatItemCount(order.items)}</div>
                  <div className={`admin-status ${getDeliveryStatusClass(order)}`}>
                    {getDeliveryStatusLabel(order)}
                  </div>
                  <div className="admin-orders-row-actions">
                    <button className="admin-link" onClick={() => handleEdit(order)}>
                      Edit
                    </button>
                    <button className="admin-link" onClick={() => handleRefund(order)}>
                      Refund
                    </button>
                    <button className="admin-link danger" onClick={() => handleDelete(order)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showForm ? (
          <div className="admin-card admin-section admin-orders-form">
            <div className="admin-section-header">
              <h3>{editingId ? "Edit order" : "New order"}</h3>
              <span>{editingId ? "Updating" : "Create order"}</span>
            </div>
            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-row">
                <label className="admin-field">
                  <span>Customer ID</span>
                  <input
                    value={customerId}
                    onChange={(event) => setCustomerId(event.target.value)}
                    placeholder="Optional"
                  />
                </label>
                <label className="admin-field">
                  <span>Status</span>
                  <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
              </div>

              <div className="admin-section">
                <div className="admin-section-header">
                  <h3>Items</h3>
                  <span>{items.length} line items</span>
                </div>
                {items.map((item, index) => (
                  <div className="admin-row" key={index}>
                    <label className="admin-field">
                      <span>Item name</span>
                      <input
                        value={item.name}
                        onChange={(event) => handleItemChange(index, "name", event.target.value)}
                        placeholder="Product name"
                        required
                      />
                    </label>
                    <label className="admin-field">
                      <span>Price</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(event) => handleItemChange(index, "price", event.target.value)}
                        required
                      />
                    </label>
                    <label className="admin-field">
                      <span>Qty</span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) => handleItemChange(index, "quantity", event.target.value)}
                        required
                      />
                    </label>
                    <div className="admin-row-actions">
                      <button
                        className="admin-link danger"
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button className="admin-secondary" type="button" onClick={handleAddItem}>
                  Add item
                </button>
              </div>

              <div className="admin-row">
                <label className="admin-field">
                  <span>Discount ID</span>
                  <input
                    value={discountId}
                    onChange={(event) => setDiscountId(event.target.value)}
                    placeholder="Optional"
                  />
                </label>
                <label className="admin-field">
                  <span>Discount amount</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountAmount}
                    onChange={(event) => setDiscountAmount(event.target.value)}
                  />
                </label>
              </div>

              <div className="admin-row">
                <label className="admin-field">
                  <span>Subtotal</span>
                  <input value={formatCurrency(subtotal)} readOnly />
                </label>
                <label className="admin-field">
                  <span>Total</span>
                  <input value={formatCurrency(total)} readOnly />
                </label>
              </div>

              {editingId ? (
                <div className="admin-section">
                  <div className="admin-section-header">
                    <h3>Payment</h3>
                    <span>{paymentStatus || "unknown"}</span>
                  </div>
                  {refunds.length > 0 ? (
                    <div className="admin-muted">
                      {refunds.map((refund) => (
                        <div key={refund.id}>
                          {refund.id} - {refund.status} - Rs. {Number(refund.amount) / 100}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="admin-muted">No refunds yet.</div>
                  )}
                </div>
              ) : null}

              {formError ? <div className="admin-error">{formError}</div> : null}
              <div className="admin-actions">
                <button className="admin-action" type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update order" : "Create order"}
                </button>
                <button className="admin-secondary" type="button" onClick={resetForm}>
                  Close
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function formatOrderId(orderId) {
  if (!orderId) return "#----";
  const raw = String(orderId);
  return `#${raw.slice(-6).toUpperCase()}`;
}

function formatOrderDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatItemCount(items) {
  const count = Array.isArray(items) ? items.length : 0;
  return count === 1 ? "1 item" : `${count} items`;
}

function getCustomerName(order) {
  if (!order) return "Customer";
  return (
    order.customer_name ||
    order.customer?.name ||
    order.customer?.full_name ||
    order.shipping?.name ||
    order.customer_id ||
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

