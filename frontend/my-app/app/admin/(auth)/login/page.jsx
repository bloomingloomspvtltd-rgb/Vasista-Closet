"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getToken, loginAdmin } from "../../../../lib/adminApi";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace("/admin");
    }
  }, [router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginAdmin(email, password);
      router.replace("/admin");
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <h1>Admin sign in</h1>
        <p>Use your Visista admin credentials to continue.</p>
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-row">
            <label className="admin-field">
              <span>Email</span>
              <input
                type="email"
                placeholder="admin@visista.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
          </div>
          <div className="admin-row">
            <label className="admin-field">
              <span>Password</span>
              <input
                type="password"
                placeholder="********"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
          </div>
          {error ? <div className="admin-error">{error}</div> : null}
          <div className="admin-row admin-actions">
            <button
              className="admin-secondary"
              type="button"
              onClick={() => router.push("/")}
            >
              Back to store
            </button>
            <button className="admin-action" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
