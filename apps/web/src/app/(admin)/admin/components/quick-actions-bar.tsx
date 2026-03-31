import Link from "next/link";
import { Button } from "@ambaril/ui/components/button";
import type { RoleCode } from "@ambaril/shared/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuickActionsBarProps {
  role: RoleCode;
  pendingCount: number;
}

interface ActionConfig {
  label: string;
  href?: string;
  badge?: number;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Actions per role
// ---------------------------------------------------------------------------

function getActions(role: RoleCode, pendingCount: number): ActionConfig[] {
  switch (role) {
    case "admin":
      return [
        {
          label:
            pendingCount > 0
              ? `Aprovar Criadores (${pendingCount})`
              : "Aprovar Criadores",
          href: "/admin/creators?status=pending",
          badge: pendingCount > 0 ? pendingCount : undefined,
        },
        { label: "Anti-Fraude", href: "/admin/creators/anti-fraud" },
        { label: "Analytics", href: "/admin/creators/analytics" },
      ];
    case "pm":
      return [
        {
          label:
            pendingCount > 0
              ? `Aprovar Criadores (${pendingCount})`
              : "Aprovar Criadores",
          href: "/admin/creators?status=pending",
          badge: pendingCount > 0 ? pendingCount : undefined,
        },
        { label: "Criar Desafio", href: "/admin/creators/challenges" },
        { label: "Ver Campanhas", href: "/admin/creators/campaigns" },
      ];
    case "creative":
      return [
        { label: "Ver Briefs Ativos", href: "/admin/creators/campaigns" },
        { label: "Biblioteca DAM", disabled: true },
        { label: "Marketing Intel", disabled: true },
      ];
    case "operations":
      return [
        { label: "Estoque", disabled: true },
        { label: "Produção (PCP)", disabled: true },
        { label: "Logística", disabled: true },
      ];
    case "support":
      return [
        { label: "Caixa de Entrada", disabled: true },
        { label: "Trocas", disabled: true },
        { label: "CRM", disabled: true },
      ];
    case "finance":
      return [
        { label: "Financeiro (ERP)", disabled: true },
        { label: "DRE", disabled: true },
        { label: "Margem", disabled: true },
      ];
    case "commercial":
      return [
        { label: "Portal B2B", disabled: true },
        { label: "Pedidos B2B", disabled: true },
        { label: "Lojistas", disabled: true },
      ];
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuickActionsBar({ role, pendingCount }: QuickActionsBarProps) {
  const actions = getActions(role, pendingCount).filter((a) => !a.disabled);

  if (actions.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.06em] text-text-ghost">
        Ações rápidas
      </h2>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          if (!action.href) return null;

          return (
            <Button key={action.label} variant="secondary" size="sm" asChild>
              <Link href={action.href}>
                {action.label}
                {action.badge !== undefined && action.badge > 0 && (
                  <span className="ml-1.5 rounded-full bg-warning px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    {action.badge}
                  </span>
                )}
              </Link>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
