"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { clearToken } from "../../lib/adminApi";

const NAV_ITEMS = [
  { href: "/admin", label: "Home", icon: "house" },
  { href: "/admin/orders", label: "Orders", icon: "bag", badge: "1" },
  { href: "/admin/products", label: "Products", icon: "tag" },
  { href: "/admin/categories", label: "Categories", icon: "stack" },
  { href: "/admin/customers", label: "Customers", icon: "user" },
  { href: "/admin/discounts", label: "Discounts", icon: "ticket" },
];

const ICONS = {
  house: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </svg>
  ),
  bag: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 7V6a6 6 0 1 1 12 0v1h2a1 1 0 0 1 1 1v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1zm2 0h8V6a4 4 0 0 0-8 0z" />
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 12 12 20 4 12V4h8l8 8zm-11-2a2 2 0 1 0-2-2 2 2 0 0 0 2 2z" />
    </svg>
  ),
  stack: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 2 9 5-9 5-9-5 9-5zm0 9 9 5-9 5-9-5 9-5zm0 7 6 3-6 3-6-3 6-3z" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" />
    </svg>
  ),
  ticket: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4zm6 1h2v6H9zm4 0h2v6h-2z" />
    </svg>
  ),
};

export default function AdminSidebar() {
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    router.replace("/admin/login");
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <div className="admin-brand-mark">V</div>
        <div>
          <div className="admin-brand-title">Visista</div>
          <div className="admin-brand-sub">Admin Console</div>
        </div>
      </div>
      <nav className="admin-nav">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="admin-nav-item">
            <span className="admin-nav-icon">{ICONS[item.icon]}</span>
            <span>{item.label}</span>
            {item.badge ? <span className="admin-badge">{item.badge}</span> : null}
          </Link>
        ))}
      </nav>
      <div className="admin-sidebar-footer">
        <div className="admin-user">
          <div className="admin-user-avatar">TS</div>
          <div>
            <div className="admin-user-name">Store Owner</div>
            <div className="admin-user-role">Full access</div>
          </div>
        </div>
        <button className="admin-link" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
