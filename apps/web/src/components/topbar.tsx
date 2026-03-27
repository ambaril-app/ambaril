"use client";

import { usePathname } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import type { TenantSessionData } from "@ambaril/shared/types";
import { logout } from "@/app/(auth)/login/logout-action";

interface TopbarProps {
  session: TenantSessionData;
}

// Derive breadcrumbs from pathname
function getBreadcrumbs(pathname: string): { label: string; path: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; path: string }[] = [];

  // Map known segments to PT-BR labels
  const labels: Record<string, string> = {
    admin: "Admin",
    creators: "Creators",
    challenges: "Desafios",
    campaigns: "Campanhas",
    payouts: "Pagamentos",
    analytics: "Analytics",
    settings: "Configuracoes",
    new: "Novo",
    edit: "Editar",
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

  return (
    <header className="flex h-14 items-center justify-between border-b border-border-default bg-bg-base px-4 lg:px-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
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
      <div className="flex items-center gap-3">
        <button
          className="rounded-md p-2 text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
          aria-label="Notificacoes"
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
  );
}
