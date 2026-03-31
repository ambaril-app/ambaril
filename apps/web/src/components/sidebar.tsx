"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  ShoppingCart,
  Package,
  MessageCircle,
  LayoutDashboard,
  Settings,
  ChevronRight,
  Menu,
  X,
  Clock,
} from "lucide-react";
import type { TenantSessionData } from "@ambaril/shared/types";
import { MODULES, MODULE_GROUPS } from "@ambaril/shared/constants";
import { hasRole } from "@ambaril/shared/utils";
import { cn } from "@ambaril/ui/lib/utils";

// Map module icon names to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Users,
  ShoppingCart,
  Package,
  MessageCircle,
  LayoutDashboard,
};

interface SidebarProps {
  session: TenantSessionData;
  setupState?: Record<string, boolean>;
}

export function Sidebar({ session, setupState = {} }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);

  // Filter modules by effective role and exclude disabled
  const visibleModules = MODULES.filter(
    (mod) =>
      mod.status !== "disabled" &&
      hasRole(session.effectiveRole, mod.requiredRoles),
  );

  function toggleModule(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-14 items-center px-4">
        <Link href="/admin" className="font-display text-[15px] tracking-[-0.01em] text-text-bright">
          Ambaril
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {/* Static home link */}
        <Link
          href="/admin"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md border-l-2 py-2 pl-[10px] pr-3 text-sm transition-colors",
            pathname === "/admin"
              ? "border-accent bg-sidebar-item-active-bg font-medium text-sidebar-item-active-text"
              : "border-transparent text-text-secondary hover:bg-sidebar-item-hover hover:text-text-primary",
          )}
        >
          <LayoutDashboard size={18} />
          <span className="min-w-0 flex-1 truncate">Início</span>
        </Link>

        {/* Module groups */}
        {MODULE_GROUPS.map((group) => {
          const groupModules = visibleModules.filter((m) =>
            (group.moduleIds as readonly string[]).includes(m.id),
          );
          if (groupModules.length === 0) return null;

          return (
            <div key={group.id} className="mt-1">
              <p className="px-3 pb-1.5 pt-6 text-[10px] uppercase tracking-widest text-text-ghost">
                {group.label}
              </p>

              <div className="space-y-1">
                {groupModules.map((mod) => {
                  const Icon = ICON_MAP[mod.icon];
                  const isComingSoon = mod.status === "coming_soon";
                  const isActive = !isComingSoon && pathname.startsWith(mod.basePath);
                  const isExpanded = expanded[mod.id] ?? isActive;

                  return (
                    <div key={mod.id}>
                      {/* Module item */}
                      {isComingSoon ? (
                        <div className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-text-ghost">
                          {Icon ? <Icon size={18} /> : <Clock size={18} />}
                          <span className="min-w-0 flex-1 truncate text-left">{mod.label}</span>
                          <span className="rounded-full bg-bg-surface px-1.5 py-0.5 text-[10px] text-text-ghost">
                            Em breve
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleModule(mod.id)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md border-l-2 py-2 pr-3 text-sm transition-colors focus:outline-none",
                            isActive
                              ? "border-accent bg-sidebar-item-active-bg pl-[10px] font-medium text-sidebar-item-active-text"
                              : "border-transparent pl-[10px] text-text-secondary hover:bg-sidebar-item-hover hover:text-text-primary",
                          )}
                        >
                          {Icon && <Icon size={18} />}
                          <span className="min-w-0 flex-1 truncate text-left">{mod.label}</span>
                          <ChevronRight
                            size={14}
                            className={cn(
                              "transition-transform",
                              isExpanded && "rotate-90",
                            )}
                          />
                        </button>
                      )}

                      {/* Subroutes (only for active modules) */}
                      {!isComingSoon && isExpanded && (
                        <div className="ml-7 mt-1 space-y-0.5">
                          {mod.subroutes
                            .filter((sub) => {
                              const isSetupComplete = setupState[mod.id] ?? true;
                              if (sub.showOnlyBeforeSetup && isSetupComplete) return false;
                              if (sub.showOnlyAfterSetup && !isSetupComplete) return false;
                              return true;
                            })
                            .map((sub) => {
                              const subActive = pathname === sub.path;
                              return (
                                <Link
                                  key={sub.id}
                                  href={sub.path}
                                  onClick={() => setMobileOpen(false)}
                                  className={cn(
                                    "block rounded-md px-3 py-1.5 text-sm transition-colors",
                                    subActive
                                      ? "font-medium text-text-bright"
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
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/admin/settings"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
        >
          <Settings size={18} />
          <span>Configurações</span>
        </Link>
        <div className="mt-1 flex items-center gap-2 px-3 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border-default bg-bg-surface text-xs font-medium text-text-secondary">
            {session.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-text-bright">{session.name}</p>
            <p className="truncate text-xs text-text-muted">{session.roleDisplayName}</p>
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
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-sidebar-bg shadow-xl transition-transform lg:hidden",
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
      <aside className="hidden w-60 flex-col border-r border-sidebar-border bg-sidebar-bg lg:flex">
        {sidebarContent}
      </aside>
    </>
  );
}
