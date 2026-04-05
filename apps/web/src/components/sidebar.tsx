"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
  Bell,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Search,
  ClipboardList,
  CheckSquare,
  RefreshCw,
  Star,
  Image as ImageIcon,
  Megaphone,
  Briefcase,
  Radio,
  Sparkles,
} from "lucide-react";
import type { TenantSessionData } from "@ambaril/shared/types";
import { MODULES, MODULE_GROUPS } from "@ambaril/shared/constants";
import { hasRole } from "@ambaril/shared/utils";
import { cn } from "@ambaril/ui/lib/utils";
import { logout } from "@/app/(auth)/login/logout-action";

// Map module icon names to Lucide components
const ICON_MAP: Record<
  string,
  React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>
> = {
  Users,
  ShoppingCart,
  Package,
  MessageCircle,
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  RefreshCw,
  Star,
  Image: ImageIcon,
  Megaphone,
  Briefcase,
  Radio,
  Sparkles,
};

interface SidebarProps {
  session: TenantSessionData;
  setupState?: Record<string, boolean>;
}

export function Sidebar({ session, setupState = {} }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

  const visibleModules = MODULES.filter(
    (mod) =>
      mod.status !== "disabled" &&
      hasRole(session.effectiveRole, mod.requiredRoles),
  );

  // Build flat search results: all subroutes from visible modules + home
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { label: string; path: string; moduleLabel: string }[] = [];

    // Home
    if ("inicio".includes(q) || "home".includes(q)) {
      results.push({ label: "Inicio", path: "/admin", moduleLabel: "" });
    }

    for (const mod of visibleModules) {
      // Match module name
      const modMatches = mod.label.toLowerCase().includes(q);
      for (const sub of mod.subroutes) {
        if (modMatches || sub.label.toLowerCase().includes(q)) {
          results.push({
            label: sub.label,
            path: sub.path,
            moduleLabel: mod.label,
          });
        }
      }
    }
    return results.slice(0, 10);
  }, [searchQuery, visibleModules]);

  // ⌘K shortcut to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSearchQuery("");
        setSearchFocused(false);
        searchInputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function toggleModule(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function cycleTheme() {
    const next =
      theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
    // Apply theme
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else if (next === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    localStorage.setItem("ambaril_theme", next);
  }

  const ThemeIcon =
    theme === "dark" ? Moon : theme === "system" ? Monitor : Sun;
  const themeLabel =
    theme === "dark" ? "Escuro" : theme === "system" ? "Sistema" : "Claro";

  // ---------------------------------------------------------------------------
  // Shared sidebar content (used for both mobile drawer and desktop)
  // ---------------------------------------------------------------------------
  function SidebarContent({ isMobile = false }: { isMobile?: boolean }) {
    return (
      <>
        {/* Brand header */}
        <div className="flex h-14 items-center px-4">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-btn-primary-bg text-[14px] font-semibold text-btn-primary-text shadow-[var(--shadow-sm)]">
              A
            </span>
            <span className="font-display text-[15px] font-medium tracking-[0.02em] text-text-white">
              Ambaril
            </span>
          </Link>
        </div>

        {/* Search input */}
        <div className="relative px-3 pb-2">
          <div className="relative flex items-center">
            <Search
              size={14}
              strokeWidth={1.75}
              className="pointer-events-none absolute left-3 shrink-0 text-text-muted"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                // Delay blur to allow clicking results
                setTimeout(() => setSearchFocused(false), 200);
              }}
              placeholder="Buscar..."
              className="w-full rounded-md border border-border-subtle bg-bg-raised/50 py-2 pl-8 pr-10 text-[12px] text-text-primary placeholder:text-text-muted hover:border-border-default focus:border-border-default focus:outline-none transition-colors"
            />
            {searchQuery ? (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 flex h-5 w-5 items-center justify-center rounded text-text-ghost hover:text-text-primary cursor-pointer"
              >
                <X size={12} />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-2 rounded border border-border-subtle bg-bg-base px-1 py-0.5 text-[10px] font-mono text-text-ghost">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Search results dropdown */}
          {searchFocused && searchQuery.trim() && (
            <div className="absolute left-3 right-3 top-full z-50 mt-1 max-h-[240px] overflow-y-auto rounded-md border border-border-subtle bg-sidebar-bg shadow-[var(--shadow-md)]">
              {searchResults.length === 0 ? (
                <p className="px-3 py-3 text-[12px] text-text-muted">
                  Nenhum resultado
                </p>
              ) : (
                searchResults.map((result) => (
                  <Link
                    key={result.path}
                    href={result.path}
                    onClick={() => {
                      setSearchQuery("");
                      setSearchFocused(false);
                      if (isMobile) setMobileOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-[12px] text-text-secondary hover:bg-sidebar-item-hover hover:text-text-primary transition-colors"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {result.label}
                    </span>
                    {result.moduleLabel && (
                      <span className="shrink-0 text-[10px] text-text-ghost">
                        {result.moduleLabel}
                      </span>
                    )}
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-1 scrollbar-thin">
          {/* Home */}
          <Link
            href="/admin"
            onClick={isMobile ? () => setMobileOpen(false) : undefined}
            title="Inicio"
            className={cn(
              "flex w-full items-center gap-3 rounded-lg py-1.5 px-3 text-[13px] transition-colors border-l-2 border-transparent",
              pathname === "/admin"
                ? "bg-sidebar-item-active-bg font-medium text-sidebar-item-active-text border-border-strong"
                : "text-text-secondary hover:bg-sidebar-item-hover hover:text-text-primary",
            )}
          >
            <LayoutDashboard size={18} strokeWidth={1.5} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">Inicio</span>
          </Link>

          {/* Module groups */}
          {MODULE_GROUPS.map((group) => {
            const groupModules = visibleModules.filter((m) =>
              (group.moduleIds as readonly string[]).includes(m.id),
            );
            if (groupModules.length === 0) return null;

            return (
              <div key={group.id} className="mt-4">
                <p className="px-3 pb-1.5 pt-6 font-display text-[9px] font-semibold uppercase tracking-[0.12em] text-text-ghost">
                  {group.label}
                </p>

                <div className="space-y-0.5">
                  {groupModules.map((mod) => {
                    const Icon = ICON_MAP[mod.icon];
                    const isComingSoon = mod.status === "coming_soon";
                    const isActive =
                      !isComingSoon && pathname.startsWith(mod.basePath);
                    const isExp = expanded[mod.id] ?? isActive;

                    return (
                      <div key={mod.id}>
                        {isComingSoon ? (
                          <div
                            title={mod.label}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] text-text-ghost border-l-2 border-transparent"
                          >
                            {Icon ? (
                              <Icon
                                size={18}
                                strokeWidth={1.5}
                                className="shrink-0 opacity-40"
                              />
                            ) : (
                              <Clock
                                size={18}
                                strokeWidth={1.5}
                                className="shrink-0 opacity-40"
                              />
                            )}
                            <span className="min-w-0 flex-1 truncate text-left opacity-50">
                              {mod.label}
                            </span>
                            <span className="rounded-full bg-bg-surface px-1.5 py-0.5 text-[9px] font-medium text-text-ghost">
                              Em breve
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleModule(mod.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg py-1.5 px-3 text-[13px] transition-colors focus:outline-none cursor-pointer border-l-2 border-transparent",
                              isActive
                                ? "bg-sidebar-item-active-bg font-medium text-sidebar-item-active-text border-border-strong"
                                : "text-text-secondary hover:bg-sidebar-item-hover hover:text-text-primary",
                            )}
                          >
                            {Icon && (
                              <Icon
                                size={18}
                                strokeWidth={1.5}
                                className="shrink-0"
                              />
                            )}
                            <span className="min-w-0 flex-1 truncate text-left">
                              {mod.label}
                            </span>
                            <ChevronRight
                              size={14}
                              className={cn(
                                "shrink-0 text-text-ghost transition-transform",
                                isExp && "rotate-90",
                              )}
                            />
                          </button>
                        )}

                        {/* Subroutes — animated expand/collapse */}
                        {!isComingSoon && (
                          <div
                            className={cn("sidebar-expand", isExp && "open")}
                          >
                            <div>
                              <div className="ml-8 mt-0.5 space-y-0.5 border-l border-border-subtle pl-3 sidebar-subroutes">
                                {mod.subroutes
                                  .filter((sub) => {
                                    const isSetupComplete =
                                      setupState[mod.id] ?? true;
                                    if (
                                      sub.showOnlyBeforeSetup &&
                                      isSetupComplete
                                    )
                                      return false;
                                    if (
                                      sub.showOnlyAfterSetup &&
                                      !isSetupComplete
                                    )
                                      return false;
                                    return true;
                                  })
                                  .map((sub) => {
                                    const subActive = pathname === sub.path;
                                    return (
                                      <Link
                                        key={sub.id}
                                        href={sub.path}
                                        onClick={
                                          isMobile
                                            ? () => setMobileOpen(false)
                                            : undefined
                                        }
                                        className={cn(
                                          "block rounded-md px-3 py-2 text-[12px] transition-colors",
                                          subActive
                                            ? "font-medium text-text-white"
                                            : "text-text-muted hover:text-text-primary",
                                        )}
                                      >
                                        {sub.label}
                                      </Link>
                                    );
                                  })}
                              </div>
                            </div>
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
          {/* Theme toggle */}
          <button
            type="button"
            onClick={cycleTheme}
            title={`Tema: ${themeLabel}`}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary cursor-pointer"
          >
            <ThemeIcon size={18} strokeWidth={1.75} className="shrink-0" />
            <span>{themeLabel}</span>
          </button>

          {/* Notifications */}
          <button
            type="button"
            title="Notificacoes"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary cursor-pointer"
          >
            <Bell size={18} strokeWidth={1.75} className="shrink-0" />
            <span>Notificacoes</span>
          </button>

          {/* Settings */}
          <Link
            href="/admin/settings"
            title="Configuracoes"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
          >
            <Settings size={18} strokeWidth={1.75} className="shrink-0" />
            <span>Configuracoes</span>
          </Link>

          {/* User + logout */}
          <div className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-surface text-[12px] font-medium text-text-secondary">
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-text-white">
                {session.name}
              </p>
              <p className="truncate text-[11px] text-text-muted">
                {session.roleDisplayName}
              </p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="flex h-7 w-7 items-center justify-center rounded-md text-text-ghost hover:text-danger hover:bg-danger-muted transition-colors cursor-pointer"
                title="Sair"
              >
                <LogOut size={14} strokeWidth={1.75} />
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-md bg-bg-base p-2 text-text-primary shadow-[var(--shadow-sm)] lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar (drawer) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-sidebar-bg shadow-[var(--shadow-xl)] transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-4 flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-raised transition-colors cursor-pointer"
          aria-label="Fechar menu"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
        <SidebarContent isMobile />
      </aside>

      {/* Desktop sidebar — always 240px */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-[240px] flex-col border-r border-sidebar-border bg-sidebar-bg">
        <SidebarContent />
      </aside>
    </>
  );
}
