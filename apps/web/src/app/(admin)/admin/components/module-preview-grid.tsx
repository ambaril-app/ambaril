import { ArrowRight } from "lucide-react";
import type { ModuleConfig } from "@ambaril/shared/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModulePreviewGridProps {
  modules: ModuleConfig[];
}

// ---------------------------------------------------------------------------
// Benefit copy per module — loss-aversion framing (DS §5)
// Format: what the tenant is leaving on the table by not activating.
// ---------------------------------------------------------------------------

const MODULE_BENEFITS: Record<string, string> = {
  checkout: "Marcas que ativam recuperam até 12% dos carrinhos abandonados.",
  crm: "Segmentação automática reduz CAC em até 30% no segundo mês.",
  erp: "Estoque, notas fiscais e financeiro integrados — sem planilha.",
  whatsapp: "Tempo médio de resposta cai 4x com templates e fila unificada.",
  dashboard:
    "Decisões baseadas em dados, não intuição. War Room em tempo real.",
  pcp: "Marcas que controlam PCP eliminam atrasos de produção em 60 dias.",
  trocas: "Trocas bem geridas aumentam recompra em até 25%.",
  dam: "Uma biblioteca central elimina retrabalho criativo entre equipes.",
  inbox: "Nenhuma mensagem perdida — todas as conversas em um lugar.",
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
        <summary className="mb-4 flex cursor-pointer list-none items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary">
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="currentColor"
            className="shrink-0 transition-transform details-chevron"
            aria-hidden="true"
          >
            <path
              d="M3 2l4 3-4 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          {modules.length}{" "}
          {modules.length === 1 ? "módulo disponível" : "módulos disponíveis"}{" "}
          para ativar
        </summary>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((mod) => {
            const benefit = MODULE_BENEFITS[mod.id] ?? mod.description;

            return (
              <div
                key={mod.id}
                className="group flex items-start gap-3 rounded-lg border border-dashed border-border-default p-4 transition-colors hover:border-border-strong"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-text-secondary">
                    {mod.label}
                  </h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-text-muted">
                    {benefit}
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="mt-0.5 shrink-0 text-text-ghost transition-colors group-hover:text-text-secondary"
                />
              </div>
            );
          })}
        </div>
      </details>
    </>
  );
}
