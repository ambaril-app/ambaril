import * as React from "react";
import { cn } from "../lib/utils";

type StatusVariant = "success" | "warning" | "danger" | "default" | "info";

interface StatusConfig {
  label: string;
  variant: StatusVariant;
}

export interface StatusBadgeProps {
  status: string;
  statusMap?: Record<string, StatusConfig>;
  className?: string;
}

const DEFAULT_STATUS_MAP: Record<string, StatusConfig> = {
  pending: { label: "Pendente", variant: "warning" },
  active: { label: "Ativo", variant: "success" },
  suspended: { label: "Suspenso", variant: "danger" },
  inactive: { label: "Inativo", variant: "default" },
  approved: { label: "Aprovado", variant: "success" },
  rejected: { label: "Rejeitado", variant: "danger" },
};

const VARIANT_STYLES: Record<StatusVariant, { bg: string; dot: string; text: string }> = {
  success: {
    bg: "bg-[var(--success-muted)]",
    dot: "bg-success",
    text: "text-success",
  },
  warning: {
    bg: "bg-[var(--warning-muted)]",
    dot: "bg-warning",
    text: "text-warning",
  },
  danger: {
    bg: "bg-[var(--danger-muted)]",
    dot: "bg-danger",
    text: "text-danger",
  },
  info: {
    bg: "bg-[var(--info-muted)]",
    dot: "bg-info",
    text: "text-info",
  },
  default: {
    bg: "bg-bg-surface",
    dot: "bg-text-ghost",
    text: "text-text-secondary",
  },
};

function StatusBadge({
  status,
  statusMap,
  className,
}: StatusBadgeProps) {
  const map = statusMap ?? DEFAULT_STATUS_MAP;
  const config = map[status] ?? {
    label: status,
    variant: "default" as StatusVariant,
  };
  const styles = VARIANT_STYLES[config.variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        styles.bg,
        styles.text,
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", styles.dot)}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}
StatusBadge.displayName = "StatusBadge";

export { StatusBadge };
