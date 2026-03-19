"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AdminSidebar from "../../../components/admin/AdminSidebar";
import { getToken } from "../../../lib/adminApi";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="admin-shell">
        <div className="admin-main">
          <div className="admin-page">
            <div className="admin-empty">Checking access...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">{children}</div>
    </div>
  );
}
