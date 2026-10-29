"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  ExternalLink,
  FileText,
  FolderTree,
  Image,
  LayoutDashboard,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Tags
} from "lucide-react";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/posts", label: "Stories", icon: FileText },
  { href: "/admin/workspace/new", label: "New story", icon: FolderTree },
  { href: "/admin/taxonomy", label: "Taxonomy", icon: Tags },
  { href: "/admin/media", label: "Media", icon: Image },
  { href: "/admin/scheduler", label: "Scheduler", icon: CalendarClock },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export function AdminNav({
  collapsed = false,
  onToggleCollapse
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="admin-sidebar select-none transition-all duration-200">
      {/* Sidebar Header with Collapse Button */}
      <div className="flex items-center justify-between">
        {!collapsed ? (
          <>
            <Link href="/admin" className="serif text-xl font-bold tracking-tight text-zinc-900">
              TekMonk <span className="text-emerald-700">Studio</span>
            </Link>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          </>
        ) : (
          <div className="flex w-full flex-col items-center gap-3">
            <Link
              href="/admin"
              className="serif text-xl font-bold text-emerald-800"
              title="TekMonk Studio"
            >
              T<span className="text-emerald-600">.</span>
            </Link>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <div className={`space-y-1 ${collapsed ? "mt-5" : "mt-6"}`}>
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center rounded-md text-sm transition-colors ${
                collapsed ? "justify-center p-2.5" : "gap-2.5 px-2.5 py-2"
              } ${
                isActive
                  ? "bg-emerald-50 text-emerald-950 font-medium"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
              }`}
            >
              <Icon size={17} className={`shrink-0 ${isActive ? "text-emerald-700" : ""}`} />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Public site link */}
      <div className="mt-8 border-t border-zinc-100 pt-4">
        {!collapsed ? (
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 hover:underline"
          >
            <ExternalLink size={13} />
            <span>View public site</span>
          </Link>
        ) : (
          <Link
            href="/"
            title="View public site"
            className="flex justify-center p-2 text-zinc-400 hover:text-zinc-800"
          >
            <ExternalLink size={16} />
          </Link>
        )}
      </div>
    </nav>
  );
}
