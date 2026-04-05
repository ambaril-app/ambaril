// ---------------------------------------------------------------------------
// PendingApprovalsWidget — placeholder for future modules
// Creators module removed (Inbazz contracted). Will be repurposed for
// other pending approval flows (e.g., B2B orders, exchange requests).
// ---------------------------------------------------------------------------

interface PendingApprovalsWidgetProps {
  total: number;
}

export function PendingApprovalsWidget({ total }: PendingApprovalsWidgetProps) {
  if (total === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-medium text-text-bright">
          Aprovações Pendentes
        </h2>
        <span className="rounded-full bg-warning-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-warning">
          {total}
        </span>
      </div>
    </section>
  );
}
