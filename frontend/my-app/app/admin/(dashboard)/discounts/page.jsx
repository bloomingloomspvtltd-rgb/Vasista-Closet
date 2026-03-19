"use client";

import { useEffect, useMemo, useState } from "react";

import AdminTopbar from "../../../../components/admin/AdminTopbar";
import { apiFetch } from "../../../../lib/adminApi";

function formatValue(discount) {
  if (!discount) return "-";
  if (discount.type === "fixed") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(discount.value || 0));
  }
  return `${Number(discount.value || 0)}%`;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toDateString(value) {
  if (!value) return null;
  return `${value}T00:00:00`;
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [code, setCode] = useState("");
  const [type, setType] = useState("percentage");
  const [value, setValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [usageLimit, setUsageLimit] = useState("");

  const totalsLabel = useMemo(() => `${discounts.length} total`, [discounts.length]);

  const resetForm = () => {
    setEditingId(null);
    setCode("");
    setType("percentage");
    setValue("");
    setMinOrderValue("");
    setMaxDiscount("");
    setStartsAt("");
    setEndsAt("");
    setIsActive(true);
    setUsageLimit("");
    setFormError("");
  };

  const loadDiscounts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/discounts");
      setDiscounts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load discounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const handleEdit = (discount) => {
    setEditingId(discount.id);
    setCode(discount.code || "");
    setType(discount.type || "percentage");
    setValue(discount.value ?? "");
    setMinOrderValue(discount.min_order_value ?? "");
    setMaxDiscount(discount.max_discount ?? "");
    setStartsAt(discount.starts_at ? String(discount.starts_at).slice(0, 10) : "");
    setEndsAt(discount.ends_at ? String(discount.ends_at).slice(0, 10) : "");
    setIsActive(Boolean(discount.is_active));
    setUsageLimit(discount.usage_limit ?? "");
    setFormError("");
  };

  const handleDelete = async (discount) => {
    if (!confirm(`Delete ${discount.code || "this discount"}?`)) return;
    setError("");
    try {
      await apiFetch(`/discounts/${discount.id}`, { method: "DELETE" });
      await loadDiscounts();
      if (editingId === discount.id) resetForm();
    } catch (err) {
      setError(err?.message || "Failed to delete discount.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!code.trim()) {
      setFormError("Discount code is required.");
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      type,
      value: toNumber(value, 0),
      min_order_value: minOrderValue === "" ? null : toNumber(minOrderValue, 0),
      max_discount: maxDiscount === "" ? null : toNumber(maxDiscount, 0),
      starts_at: toDateString(startsAt),
      ends_at: toDateString(endsAt),
      is_active: Boolean(isActive),
      usage_limit: usageLimit === "" ? null : toNumber(usageLimit, 0),
    };

    setSaving(true);
    try {
      if (editingId) {
        await apiFetch(`/discounts/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/discounts", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      await loadDiscounts();
      resetForm();
    } catch (err) {
      setFormError(err?.message || "Failed to save discount.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <AdminTopbar
        title="Discounts"
        subtitle="Create codes and manage promotions."
      />

      {error ? <div className="admin-error">{error}</div> : null}

      <section className="admin-grid admin-split">
        <div className="admin-card admin-section">
          <div className="admin-section-header">
            <h3>{editingId ? "Edit discount" : "New discount"}</h3>
            <span>{editingId ? "Updating" : "Create offer"}</span>
          </div>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-row">
              <label className="admin-field">
                <span>Code</span>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="FESTIVE25"
                  required
                />
              </label>
              <label className="admin-field">
                <span>Type</span>
                <select value={type} onChange={(event) => setType(event.target.value)}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </label>
            </div>
            <div className="admin-row">
              <label className="admin-field">
                <span>Value</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  required
                />
              </label>
              <label className="admin-field">
                <span>Usage limit</span>
                <input
                  type="number"
                  min="0"
                  value={usageLimit}
                  onChange={(event) => setUsageLimit(event.target.value)}
                />
              </label>
            </div>
            <div className="admin-row">
              <label className="admin-field">
                <span>Minimum order value</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={minOrderValue}
                  onChange={(event) => setMinOrderValue(event.target.value)}
                />
              </label>
              <label className="admin-field">
                <span>Maximum discount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={maxDiscount}
                  onChange={(event) => setMaxDiscount(event.target.value)}
                />
              </label>
            </div>
            <div className="admin-row">
              <label className="admin-field">
                <span>Starts at</span>
                <input
                  type="date"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                />
              </label>
              <label className="admin-field">
                <span>Ends at</span>
                <input
                  type="date"
                  value={endsAt}
                  onChange={(event) => setEndsAt(event.target.value)}
                />
              </label>
            </div>
            <label className="admin-field admin-checkbox">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              <span>Active</span>
            </label>
            {formError ? <div className="admin-error">{formError}</div> : null}
            <div className="admin-actions">
              <button className="admin-action" type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update discount" : "Create discount"}
              </button>
              <button className="admin-secondary" type="button" onClick={resetForm}>
                Reset
              </button>
            </div>
          </form>
        </div>

        <div className="admin-card admin-section">
          <div className="admin-section-header">
            <h3>Discounts</h3>
            <span>{loading ? "Loading" : totalsLabel}</span>
          </div>
          {loading ? (
            <div className="admin-empty">Loading discounts...</div>
          ) : discounts.length === 0 ? (
            <div className="admin-empty">No discounts yet.</div>
          ) : (
            <div className="admin-table">
              <div className="admin-table-row admin-table-head cols-5">
                <div>Code</div>
                <div>Type</div>
                <div>Value</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              {discounts.map((discount) => (
                <div className="admin-table-row cols-5" key={discount.id}>
                  <div>{discount.code}</div>
                  <div>{discount.type || "percentage"}</div>
                  <div>{formatValue(discount)}</div>
                  <div className="admin-pill admin-pill-good">
                    {discount.is_active ? "active" : "inactive"}
                  </div>
                  <div className="admin-table-actions">
                    <button className="admin-link" onClick={() => handleEdit(discount)}>
                      Edit
                    </button>
                    <button
                      className="admin-link danger"
                      onClick={() => handleDelete(discount)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

