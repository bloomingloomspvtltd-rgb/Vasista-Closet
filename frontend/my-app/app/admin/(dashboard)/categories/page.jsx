"use client";

import { useEffect, useMemo, useState } from "react";

import AdminTopbar from "../../../../components/admin/AdminTopbar";
import { apiFetch } from "../../../../lib/adminApi";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");

  const totalsLabel = useMemo(() => `${categories.length} total`, [categories.length]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setStatus("active");
    setFormError("");
  };

  const loadCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/categories");
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleEdit = (category) => {
    setEditingId(category.id);
    setName(category.name || "");
    setDescription(category.description || "");
    setStatus(category.status || "active");
    setFormError("");
  };

  const handleDelete = async (category) => {
    if (!confirm(`Delete ${category.name || "this category"}?`)) return;
    setError("");
    try {
      await apiFetch(`/categories/${category.id}`, { method: "DELETE" });
      await loadCategories();
      if (editingId === category.id) resetForm();
    } catch (err) {
      setError(err?.message || "Failed to delete category.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      status,
    };

    setSaving(true);
    try {
      if (editingId) {
        await apiFetch(`/categories/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      await loadCategories();
      resetForm();
    } catch (err) {
      setFormError(err?.message || "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <AdminTopbar
        title="Categories"
        subtitle="Organize products into curated stories."
      />

      {error ? <div className="admin-error">{error}</div> : null}

      <section className="admin-grid admin-split">
        <div className="admin-card admin-section">
          <div className="admin-section-header">
            <h3>{editingId ? "Edit category" : "New category"}</h3>
            <span>{editingId ? "Updating" : "Create category"}</span>
          </div>
          <form className="admin-form" onSubmit={handleSubmit}>
            <label className="admin-field">
              <span>Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Wedding Saga"
                required
              />
            </label>
            <label className="admin-field">
              <span>Description</span>
              <textarea
                rows="3"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Short description"
              />
            </label>
            <label className="admin-field">
              <span>Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            {formError ? <div className="admin-error">{formError}</div> : null}
            <div className="admin-actions">
              <button className="admin-action" type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update category" : "Create category"}
              </button>
              <button className="admin-secondary" type="button" onClick={resetForm}>
                Reset
              </button>
            </div>
          </form>
        </div>

        <div className="admin-card admin-section">
          <div className="admin-section-header">
            <h3>Categories</h3>
            <span>{loading ? "Loading" : totalsLabel}</span>
          </div>
          {loading ? (
            <div className="admin-empty">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="admin-empty">No categories yet.</div>
          ) : (
            <div className="admin-table">
              <div className="admin-table-row admin-table-head cols-3">
                <div>Name</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              {categories.map((category) => (
                <div className="admin-table-row cols-3" key={category.id}>
                  <div>{category.name}</div>
                  <div className="admin-pill admin-pill-good">{category.status || "active"}</div>
                  <div className="admin-table-actions">
                    <button className="admin-link" onClick={() => handleEdit(category)}>
                      Edit
                    </button>
                    <button
                      className="admin-link danger"
                      onClick={() => handleDelete(category)}
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

