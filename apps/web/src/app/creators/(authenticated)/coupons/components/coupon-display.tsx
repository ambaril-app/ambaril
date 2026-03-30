"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CouponDisplayProps {
  code: string;
  discountPercent: string | null;
  totalUses: number;
  totalRevenue: string;
}

export function CouponDisplay({
  code,
  discountPercent,
  totalUses,
  totalRevenue,
}: CouponDisplayProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const revenueFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(parseFloat(totalRevenue));

  return (
    <div className="rounded-xl border border-border-default bg-bg-base p-6">
      {/* Discount info */}
      {discountPercent && (
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.04em] text-text-muted">
          {discountPercent}% de desconto
        </p>
      )}

      {/* Large coupon code */}
      <button
        onClick={handleCopy}
        className="group relative mx-auto flex min-h-[64px] w-full max-w-md items-center justify-center gap-3 rounded-xl border border-border-strong bg-bg-raised px-6 py-4 transition-[border-color,box-shadow] hover:border-text-muted hover:shadow-[var(--shadow-md)]"
        aria-label={`Copiar cupom ${code}`}
      >
        <span
          className="font-mono text-[32px] font-medium tracking-wider text-text-white"
        >
          {code}
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors group-hover:text-text-primary">
          {copied ? <Check size={18} className="text-success" /> : <Copy size={18} />}
        </span>
      </button>

      {copied && (
        <p className="mt-2 text-center text-xs text-success">Copiado</p>
      )}

      {/* Metrics */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-bg-raised px-4 py-3 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-text-muted">
            Total de usos
          </p>
          <p className="mt-1 font-mono text-xl font-medium tabular-nums text-text-white">
            {totalUses.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded-lg bg-bg-raised px-4 py-3 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-text-muted">
            Receita gerada
          </p>
          <p className="mt-1 font-mono text-xl font-medium tabular-nums text-text-white">
            {revenueFormatted}
          </p>
        </div>
      </div>
    </div>
  );
}
