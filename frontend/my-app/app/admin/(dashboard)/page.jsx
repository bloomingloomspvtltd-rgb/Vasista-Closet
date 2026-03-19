"use client";

import { useEffect, useMemo, useState } from "react";

import AdminTopbar from "../../../components/admin/AdminTopbar";
import { apiFetch } from "../../../lib/adminApi";

function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminHomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [categories, setCategories] = useState([]);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [ordersData, productsData, customersData, discountsData, categoriesData] =
        await Promise.all([
          apiFetch("/orders"),
          apiFetch("/products"),
          apiFetch("/customers"),
          apiFetch("/discounts"),
          apiFetch("/categories"),
        ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setDiscounts(Array.isArray(discountsData) ? discountsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      setError(err?.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSeed = async () => {
    setSuccess("");
    setError("");
    setSeeding(true);
    try {
      const result = await apiFetch("/admin/seed", { method: "POST" });
      const inserted = result?.inserted || {};
      const totalInserted = Object.values(inserted).reduce(
        (sum, value) => sum + Number(value || 0),
        0
      );
      await loadAll();
      setSuccess(
        totalInserted > 0
          ? `Seeded ${totalInserted} records.`
          : "Nothing seeded (data already exists)."
      );
    } catch (err) {
      setError(err?.message || "Failed to seed sample data.");
    } finally {
      setSeeding(false);
    }
  };

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  return (
    <div className="admin-page">
      <AdminTopbar
        title="Dashboard"
        subtitle="Live snapshot of your store activity."
        actionLabel={seeding ? "Seeding..." : "Seed sample data"}
        onAction={handleSeed}
      />

      {error ? <div className="admin-error">{error}</div> : null}
      {success ? <div className="admin-success">{success}</div> : null}

      <section className="admin-stats">
        <div className="admin-card">
          <div className="admin-stat-label">Total products</div>
          <div className="admin-stat-value">{loading ? "..." : products.length}</div>
          <div className="admin-stat-trend">Catalog items</div>
        </div>
        <div className="admin-card">
          <div className="admin-stat-label">Total orders</div>
          <div className="admin-stat-value">{loading ? "..." : orders.length}</div>
          <div className="admin-stat-trend">Placed so far</div>
        </div>
        <div className="admin-card">
          <div className="admin-stat-label">Customers</div>
          <div className="admin-stat-value">{loading ? "..." : customers.length}</div>
          <div className="admin-stat-trend">Profiles created</div>
        </div>
        <div className="admin-card">
          <div className="admin-stat-label">Active discounts</div>
          <div className="admin-stat-value">{loading ? "..." : discounts.length}</div>
          <div className="admin-stat-trend">Promotions running</div>
        </div>
      </section>

      <section className="admin-grid">
        <div className="admin-card admin-section">
          <div className="admin-section-header">
            <h3>Recent orders</h3>
            <span>Latest 5</span>
          </div>
          {loading ? (
            <div className="admin-empty">Loading orders...</div>
          ) : recentOrders.length === 0 ? (
            <div className="admin-empty">No orders yet.</div>
          ) : (
            <div className="admin-table">
              <div className="admin-table-row admin-table-head">
                <div>Order</div>
                <div>Status</div>
                <div>Items</div>
                <div>Total</div>
              </div>
              {recentOrders.map((order) => (
                <div className="admin-table-row" key={order.id}>
                  <div>#{String(order.id || "").slice(-6)}</div>
                  <div className="admin-pill admin-pill-pending">{order.status || "pending"}</div>
                  <div>{order.items ? order.items.length : 0}</div>
                  <div>{formatCurrency(order.total)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-card admin-section">
          <div className="admin-section-header">
            <h3>Top categories</h3>
            <span>{loading ? "Loading" : `${categories.length} total`}</span>
          </div>
          {loading ? (
            <div className="admin-empty">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="admin-empty">No categories yet.</div>
          ) : (
            <ul className="admin-list">
              {categories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <span>{category.name}</span>
                  <span className="admin-pill admin-pill-good">{category.status || "active"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

