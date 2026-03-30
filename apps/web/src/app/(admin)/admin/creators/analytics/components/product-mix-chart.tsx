"use client";

import { Package } from "lucide-react";

// ---------------------------------------------------------------------------
// Component — Placeholder until ERP module is implemented
// ---------------------------------------------------------------------------

function ProductMixChart() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-bg-surface">
        <Package className="h-5 w-5 text-text-ghost" />
      </div>
      <p className="text-sm text-text-secondary">
        Dados disponiveis quando modulo ERP for implementado
      </p>
      <p className="text-xs text-text-muted">
        Mix de produtos vendidos por creators
      </p>
    </div>
  );
}

export { ProductMixChart };
