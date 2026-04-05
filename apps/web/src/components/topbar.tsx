"use client";

import { useState, useEffect, useTransition } from "react";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Eye, Check, ArrowLeft } from "lucide-react";
import type { TenantSessionData } from "@ambaril/shared/types";
import { logout } from "@/app/(auth)/login/logout-action";
import {
  startImpersonation,
  stopImpersonation,
  loadRoles,
} from "@/app/actions/impersonate";

interface TopbarProps {
  session: TenantSessionData;
}

// Derive breadcrumbs from pathname
function getBreadcrumbs(pathname: string): { label: string; path: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; path: string }[] = [];

  const labels: Record<string, string> = {
    admin: "Admin",
    analytics: "Analytics",
    settings: "Configurações",
    new: "Novo",
    edit: "Editar",
    checkout: "Checkout",
    crm: "CRM",
    erp: "ERP",
    whatsapp: "WhatsApp",
    dashboard: "Dashboard",
    tiers: "Tiers",
    "anti-fraud": "Anti-Fraude",
    setup: "Configuração",
    brief: "Brief",
    integrations: "Integrações",
    profile: "Perfil",
    coupons: "Cupons",
    content: "Conteúdo",
    briefings: "Briefings",
    earnings: "Ganhos",
    ranking: "Ranking",
    sales: "Vendas",
    products: "Produtos",
    materials: "Materiais",
    points: "Pontos",
  };

  let path = "";
  for (const seg of segments) {
    path += `/${seg}`;
    const label = labels[seg] ?? seg;
    crumbs.push({ label, path });
  }

  return crumbs;
}

export function Topbar({ session }: TopbarProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<
    { name: string; displayName: string }[]
  >([]);
  const [isPending, startTransition] = useTransition();

  const canImpersonate =
    session.role === "admin" ||
    session.permissions.includes("system:impersonate");

  // Load roles when dropdown opens
  useEffect(() => {
    if (dropdownOpen && availableRoles.length === 0) {
      loadRoles().then(setAvailableRoles);
    }
  }, [dropdownOpen, availableRoles.length]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick() {
      setDropdownOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [dropdownOpen]);

  function handleImpersonate(roleName: string) {
    setDropdownOpen(false);
    startTransition(async () => {
      await startImpersonation(roleName);
    });
  }

  function handleStopImpersonation() {
    startTransition(async () => {
      await stopImpersonation();
    });
  }

  return (
    <>
      {/* Impersonation banner */}
      {session.isImpersonating && (
        <div className="flex h-9 items-center justify-center gap-2 border-b border-warning bg-warning-muted px-4 text-xs text-warning">
          <Eye size={14} />
          <span>
            Visualizando como{" "}
            <strong>
              {availableRoles.find((r) => r.name === session.impersonatingRole)
                ?.displayName ?? session.impersonatingRole}
            </strong>
          </span>
          <button
            onClick={handleStopImpersonation}
            disabled={isPending}
            className="ml-2 underline transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            Voltar
          </button>
        </div>
      )}

      {/* Main topbar */}
      {/* pl-14 compensates for the hamburger button (visible below lg). lg:px-6 overrides when sidebar is visible. */}
      <header className="flex h-14 items-center justify-between border-b border-border-default bg-bg-base pl-14 pr-3 sm:pr-4 lg:px-6">
        {/* Breadcrumbs — truncate on narrow screens */}
        <nav className="flex min-w-0 items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1">
              {i > 0 && <span className="text-text-muted">/</span>}
              <span
                className={
                  i === breadcrumbs.length - 1
                    ? "text-text-bright"
                    : "text-text-secondary"
                }
              >
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Role badge */}
          <span className="hidden rounded-full bg-bg-surface px-2 py-0.5 text-xs text-text-secondary sm:inline-block">
            {session.roleDisplayName}
          </span>

          {/* Impersonation dropdown */}
          {canImpersonate && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen((prev) => !prev);
                }}
                className="rounded-md p-2 text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
                aria-label="Visualizar como"
                title="Visualizar como"
              >
                <Eye size={18} />
              </button>

              {dropdownOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-lg border border-border-default bg-bg-base shadow-[var(--shadow-lg)]"
                >
                  <div className="border-b border-border-default px-3 py-2">
                    <p className="text-xs font-medium text-text-muted">
                      Visualizar como
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {availableRoles.map((role) => {
                      const isCurrentReal = role.name === session.role;
                      const isCurrentEffective =
                        role.name === session.effectiveRole;

                      return (
                        <button
                          key={role.name}
                          onClick={() => {
                            if (isCurrentReal && session.isImpersonating) {
                              // Clicking own role = stop impersonation
                              handleStopImpersonation();
                              setDropdownOpen(false);
                            } else if (!isCurrentEffective) {
                              handleImpersonate(role.name);
                            } else {
                              setDropdownOpen(false);
                            }
                          }}
                          disabled={isPending}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary disabled:opacity-50"
                        >
                          {isCurrentEffective ? (
                            <Check size={14} className="text-info" />
                          ) : (
                            <span className="w-3.5" />
                          )}
                          <span className="flex-1 text-left">
                            {role.displayName}
                          </span>
                          {isCurrentReal && (
                            <span className="text-xs text-text-ghost">
                              (Você)
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {session.isImpersonating && (
                    <div className="border-t border-border-default py-1">
                      <button
                        onClick={() => {
                          handleStopImpersonation();
                          setDropdownOpen(false);
                        }}
                        disabled={isPending}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary disabled:opacity-50"
                      >
                        <ArrowLeft size={14} />
                        Voltar a minha view
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            className="rounded-md p-2 text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
            aria-label="Notificações"
          >
            <Bell size={18} />
          </button>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md p-2 text-text-secondary transition-colors hover:bg-bg-surface hover:text-danger"
              aria-label="Sair"
            >
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </header>
    </>
  );
}
