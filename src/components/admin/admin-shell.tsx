"use client";

import { ReactNode, useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";

export function AdminShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tekmonk_admin_sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("tekmonk_admin_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className={`admin-grid ${collapsed ? "admin-grid-collapsed" : ""}`}>
      <AdminNav collapsed={collapsed} onToggleCollapse={toggle} />
      <div className="admin-content min-w-0">{children}</div>
    </div>
  );
}

