import { Clock } from "lucide-react";
import type { ModuleConfig } from "@ambaril/shared/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModulePreviewGridProps {
  modules: ModuleConfig[];
}

// ---------------------------------------------------------------------------
// Benefit description per module (static copy)
// ---------------------------------------------------------------------------

const MODULE_BENEFITS: Record<string, string> = {
  checkout: "Pedidos, carrinhos abandonados e testes A/B em um lugar.",
  crm: "Unifique clientes, segmentos e automações.",
  erp: "Estoque, notas fiscais e financeiro integrados.",
  whatsapp: "Conversas, templates e atendimento centralizado.",
  dashboard: "Visão executiva com War Room em tempo real.",
  pcp: "Controle produção, fornecedores e gargalos.",
  trocas: "Trocas e devoluções com rastreamento completo.",
  dam: "Biblioteca central de assets criativas.",
  inbox: "Todas as mensagens em uma caixa unificada.",
  creators: "Programa de influenciadores e embaixadores da marca.",
};

// Mock stat labels per module for the blurred preview
const MODULE_MOCK_STATS: Record<string, [string, string, string]> = {
  checkout: ["Pedidos hoje", "Receita hoje", "Conversão"],
  crm: ["Contatos", "Segmentos", "Automações ativas"],
  erp: ["Produtos ativos", "Em estoque", "NFs emitidas"],
  whatsapp: ["Conversas abertas", "Templates", "Mensagens hoje"],
  dashboard: ["Receita mensal", "Pedidos", "CAC médio"],
  pcp: ["Ordens abertas", "Em produção", "Entregas hoje"],
  trocas: ["Trocas abertas", "Em trânsito", "Concluídas"],
  dam: ["Assets", "Pastas", "Usos este mês"],
  inbox: ["Mensagens não lidas", "Conversas abertas", "Resolvidas hoje"],
  creators: ["Criadores ativos", "GMV", "Comissões"],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ModulePreviewGrid({ modules }: ModulePreviewGridProps) {
  if (modules.length === 0) return null;

  return (
    <>
      <style>{`details[open] .details-chevron { transform: rotate(90deg); }`}</style>
      <details>
        <summary className="mb-4 flex cursor-pointer list-none items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-text-ghost hover:text-text-ghost">
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="currentColor"
            className="shrink-0 transition-transform details-chevron"
            aria-hidden="true"
          >
            <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          Em breve — {modules.length} {modules.length === 1 ? "módulo" : "módulos"}
        </summary>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((mod) => {
          const benefit = MODULE_BENEFITS[mod.id] ?? mod.description;
          const mockStats = MODULE_MOCK_STATS[mod.id] ?? [
            "Métrica 1",
            "Métrica 2",
            "Métrica 3",
          ];

          return (
            <div
              key={mod.id}
              className="flex flex-col gap-3 rounded-xl border border-border-default/50 bg-bg-base/60 p-5 opacity-60"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-text-ghost">
                  {mod.label}
                </h3>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-bg-surface px-1.5 py-0.5 text-[10px] text-text-ghost">
                  <Clock size={9} />
                  Em breve
                </span>
              </div>

              {/* Mock stats (blurred) */}
              <div className="space-y-2">
                {mockStats.map((statLabel) => (
                  <div key={statLabel} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-text-ghost">{statLabel}</span>
                    <span
                      className="select-none font-mono text-xs font-medium tabular-nums text-text-ghost"
                      style={{ filter: "blur(4px)" }}
                    >
                      —&nbsp;—&nbsp;—
                    </span>
                  </div>
                ))}
              </div>

              {/* Benefit line */}
              <p className="border-t border-border-default/50 pt-2 text-[11px] leading-relaxed text-text-ghost">
                {benefit}
              </p>
            </div>
          );
          })}
        </div>
      </details>
    </>
  );
}
