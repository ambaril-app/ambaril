"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Settings,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import type { TenantSessionData } from "@ambaril/shared/types";
import { MODULES } from "@ambaril/shared/constants";
import { hasRole } from "@ambaril/shared/utils";
import { cn } from "@ambaril/ui/lib/utils";

// Map module icon names to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  Users: Users,
};

interface SidebarProps {
  session: TenantSessionData;
}

export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);

  // Filter modules by role
  const visibleModules = MODULES.filter((mod) =>
    hasRole(session.role, mod.requiredRoles),
  );

  function toggleModule(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-14 items-center px-4">
        <Link href="/admin/creators" className="text-lg font-medium text-text-bright">
          Ambaril
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {visibleModules.map((mod) => {
          const Icon = ICON_MAP[mod.icon];
          const isActive = pathname.startsWith(mod.basePath);
          const isExpanded = expanded[mod.id] ?? isActive;

          return (
            <div key={mod.id}>
              {/* Module item */}
              <button
                onClick={() => toggleModule(mod.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-info-muted text-info"
                    : "text-text-secondary hover:bg-bg-surface hover:text-text-primary",
                )}
              >
                {Icon && <Icon size={18} />}
                <span className="flex-1 text-left">{mod.label}</span>
                <ChevronRight
                  size={14}
                  className={cn(
                    "transition-transform",
                    isExpanded && "rotate-90",
                  )}
                />
              </button>

              {/* Subroutes */}
              {isExpanded && (
                <div className="ml-7 mt-0.5 space-y-0.5">
                  {mod.subroutes.map((sub) => {
                    const subActive = pathname === sub.path;
                    return (
                      <Link
                        key={sub.id}
                        href={sub.path}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "block rounded-md px-3 py-1.5 text-sm transition-colors",
                          subActive
                            ? "text-info"
                            : "text-text-secondary hover:text-text-primary",
                        )}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border-default p-3">
        <Link
          href="/admin/settings"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
        >
          <Settings size={18} />
          <span>Configuracoes</span>
        </Link>
        <div className="mt-1 flex items-center gap-2 px-3 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-border-strong text-xs font-medium text-text-white">
            {session.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-text-bright">{session.name}</p>
            <p className="truncate text-xs text-text-muted">{session.role}</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-md bg-bg-base p-2 text-text-primary lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-bg-base transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-4 text-text-secondary"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-col border-r border-border-default bg-bg-base lg:flex">
        {sidebarContent}
      </aside>
    </>
  );
}
