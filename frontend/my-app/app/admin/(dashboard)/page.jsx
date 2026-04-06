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
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [analyticsSeries, setAnalyticsSeries] = useState([]);
  const [activeStats, setActiveStats] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(30);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - rangeDays);
      const rangeStart = start.toISOString().slice(0, 10);
      const rangeEnd = now.toISOString().slice(0, 10);
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const [
        ordersData,
        productsData,
        customersData,
        discountsData,
        categoriesData,
        summaryData,
        visitsData,
      ] = await Promise.all([
        apiFetch("/orders"),
        apiFetch("/products"),
        apiFetch("/customers"),
        apiFetch("/discounts"),
        apiFetch("/categories"),
        apiFetch(`/analytics/summary?start=${rangeStart}&end=${rangeEnd}`),
        apiFetch(`/analytics/visits?start=${rangeStart}&end=${rangeEnd}&tz=${timezone}`),
      ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setDiscounts(Array.isArray(discountsData) ? discountsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setAnalyticsSummary(summaryData || null);
      setAnalyticsSeries(Array.isArray(visitsData?.series) ? visitsData.series : []);
      setAnalyticsLoading(false);
    } catch (err) {
      setError(err?.message || "Failed to load admin data.");
      setAnalyticsLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [rangeDays]);

  useEffect(() => {
    let isMounted = true;
    const loadActive = async () => {
      try {
        const data = await apiFetch("/analytics/active");
        if (isMounted) setActiveStats(data || null);
      } catch (err) {
        if (isMounted) setActiveStats(null);
      }
    };
    loadActive();
    const interval = setInterval(loadActive, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
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
  const activeWindow = activeStats?.window_minutes || 5;
  const activeSessions = activeStats?.active_sessions ?? 0;
  const activeMembers = activeStats?.active_members ?? 0;
  const totalVisits = analyticsSummary?.total_visits ?? 0;
  const deviceSessions = analyticsSummary?.device_sessions || {};
  const deviceMobile = deviceSessions.mobile ?? 0;
  const deviceDesktop = deviceSessions.desktop ?? 0;
  const deviceOther = (deviceSessions.other ?? 0) + (deviceSessions.tablet ?? 0);
  const memberVisits = analyticsSeries.reduce(
    (sum, item) => sum + Number(item?.unique_members || 0),
    0
  );
  const todayKey = useMemo(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
  }, []);
  const todayEntry = analyticsSeries.find((row) => row.date === todayKey);
  const todayVisits = todayEntry?.visits ?? 0;
  const lastSevenDays = analyticsSeries.slice(-7);
  const maxVisits = Math.max(1, ...lastSevenDays.map((row) => row.visits || 0));

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
        <div className="admin-card">
          <div className="admin-stat-label">Active visitors</div>
          <div className="admin-stat-value">
            {analyticsLoading ? "..." : activeSessions}
          </div>
          <div className="admin-stat-trend">{`In last ${activeWindow} minutes`}</div>
        </div>
        <div className="admin-card">
          <div className="admin-stat-label">Active members</div>
          <div className="admin-stat-value">
            {analyticsLoading ? "..." : activeMembers}
          </div>
          <div className="admin-stat-trend">Logged-in visitors</div>
        </div>
      </section>

      <section className="admin-grid admin-split">
        <div className="admin-card admin-section">
          <div className="admin-section-header">
            <h3>Traffic snapshot</h3>
            <div className="admin-filter">
              <button
                type="button"
                className={`admin-filter-btn ${rangeDays === 30 ? "active" : ""}`}
                onClick={() => setRangeDays(30)}
              >
                <span className="admin-filter-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <rect x="3" y="5" width="18" height="16" rx="3" ry="3" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="8" y1="3" x2="8" y2="7" />
                    <line x1="16" y1="3" x2="16" y2="7" />
                  </svg>
                </span>
                30 days
              </button>
              <button
                type="button"
                className={`admin-filter-btn ${rangeDays === 7 ? "active" : ""}`}
                onClick={() => setRangeDays(7)}
              >
                7 days
              </button>
            </div>
          </div>
          <div className="admin-traffic-metrics">
            <div>
              <div className="admin-stat-label">Visits</div>
              <div className="admin-stat-value">{analyticsLoading ? "..." : totalVisits}</div>
            </div>
            <div>
              <div className="admin-stat-label">Member visits</div>
              <div className="admin-stat-value">
                {analyticsLoading ? "..." : memberVisits}
              </div>
            </div>
            <div>
              <div className="admin-stat-label">Visits today</div>
              <div className="admin-stat-value">{analyticsLoading ? "..." : todayVisits}</div>
            </div>
          </div>
          <div className="admin-device-breakdown">
            <div className="admin-device-title">Sessions by Device Type</div>
            {analyticsLoading ? (
              <div className="admin-empty">Loading device data...</div>
            ) : (
              <div className="admin-device-row">
                <span className="admin-device-pill">
                  <strong>{deviceMobile}</strong> Mobile
                </span>
                <span className="admin-device-pill">
                  <strong>{deviceDesktop}</strong> Desktop
                </span>
                <span className="admin-device-pill">
                  <strong>{deviceOther}</strong> Other
                </span>
              </div>
            )}
          </div>
          {analyticsLoading ? (
            <div className="admin-empty">Loading visits trend...</div>
          ) : lastSevenDays.length === 0 ? (
            <div className="admin-empty">No visit data yet.</div>
          ) : (
            <div className="admin-chart">
              {lastSevenDays.map((row) => (
                <div className="admin-chart-row" key={row.date}>
                  <span className="admin-chart-label">{row.date.slice(5)}</span>
                  <div className="admin-chart-bar">
                    <span
                      style={{
                        width: `${Math.max(6, Math.round((row.visits / maxVisits) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="admin-chart-value">{row.visits}</span>
                </div>
              ))}
            </div>
          )}
        </div>

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

