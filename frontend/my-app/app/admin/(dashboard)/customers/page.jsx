"use client";

import { useEffect, useMemo, useState } from "react";

import AdminTopbar from "../../../../components/admin/AdminTopbar";
import { apiFetch } from "../../../../lib/adminApi";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const totalsLabel = useMemo(() => `${customers.length} total`, [customers.length]);

  const resetForm = () => {
    setEditingId(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setFormError("");
  };

  const loadCustomers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/customers");
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleEdit = (customer) => {
    setEditingId(customer.id);
    setFirstName(customer.first_name || "");
    setLastName(customer.last_name || "");
    setEmail(customer.email || "");
    setPhone(customer.phone || "");
    setFormError("");
  };

  const handleDelete = async (customer) => {
    if (!confirm("Delete this customer?")) return;
    setError("");
    try {
      await apiFetch(`/customers/${customer.id}`, { method: "DELETE" });
      await loadCustomers();
      if (editingId === customer.id) resetForm();
    } catch (err) {
      setError(err?.message || "Failed to delete customer.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!firstName.trim() || !email.trim()) {
      setFormError("First name and email are required.");
      return;
    }

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      email: email.trim(),
      phone: phone.trim() || null,
    };

    setSaving(true);
    try {
      if (editingId) {
        await apiFetch(`/customers/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/customers", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      await loadCustomers();
      resetForm();
    } catch (err) {
      setFormError(err?.message || "Failed to save customer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <AdminTopbar
        title="Customers"
        subtitle="Add and update customer profiles."
      />

      {error ? <div className="admin-error">{error}</div> : null}

      <section className="admin-grid admin-split">
        <div className="admin-card admin-section">
          <div className="admin-section-header">
            <h3>{editingId ? "Edit customer" : "New customer"}</h3>
            <span>{editingId ? "Updating" : "Create profile"}</span>
          </div>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-row">
              <label className="admin-field">
                <span>First name</span>
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Riya"
                  required
                />
              </label>
              <label className="admin-field">
                <span>Last name</span>
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Mehta"
                />
              </label>
            </div>
            <div className="admin-row">
              <label className="admin-field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="customer@email.com"
                  required
                />
              </label>
              <label className="admin-field">
                <span>Phone</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+91 98765 43210"
                />
              </label>
            </div>
            {formError ? <div className="admin-error">{formError}</div> : null}
            <div className="admin-actions">
              <button className="admin-action" type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update customer" : "Create customer"}
              </button>
              <button className="admin-secondary" type="button" onClick={resetForm}>
                Reset
              </button>
            </div>
          </form>
        </div>

        <div className="admin-card admin-section">
          <div className="admin-section-header">
            <h3>Customers</h3>
            <span>{loading ? "Loading" : totalsLabel}</span>
          </div>
          {loading ? (
            <div className="admin-empty">Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className="admin-empty">No customers yet.</div>
          ) : (
            <div className="admin-table">
              <div className="admin-table-row admin-table-head cols-4">
                <div>Name</div>
                <div>Email</div>
                <div>Phone</div>
                <div>Actions</div>
              </div>
              {customers.map((customer) => (
                <div className="admin-table-row cols-4" key={customer.id}>
                  <div>{`${customer.first_name || ""} ${customer.last_name || ""}`.trim() || "-"}</div>
                  <div>{customer.email}</div>
                  <div>{customer.phone || "-"}</div>
                  <div className="admin-table-actions">
                    <button className="admin-link" onClick={() => handleEdit(customer)}>
                      Edit
                    </button>
                    <button
                      className="admin-link danger"
                      onClick={() => handleDelete(customer)}
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

