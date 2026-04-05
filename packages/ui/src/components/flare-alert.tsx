"use client";

import * as React from "react";
import {
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FlareVariant = "warning" | "danger" | "info" | "success";

export interface FlareAlertProps {
  /** Alert variant determines color and icon */
  variant: FlareVariant;
  /** Main message text */
  message: string;
  /** Optional action link text */
  actionLabel?: string;
  /** Callback when action link is clicked */
  onAction?: () => void;
  /** Whether the alert is actively pulsing (for urgent alerts) */
  pulse?: boolean;
  /** Additional className */
  className?: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const VARIANT_CONFIG: Record<
  FlareVariant,
  { icon: LucideIcon; border: string; bg: string; text: string; dotBg: string }
> = {
  warning: {
    icon: AlertTriangle,
    border: "border-l-warning",
    bg: "bg-warning-muted",
    text: "text-warning",
    dotBg: "bg-warning",
  },
  danger: {
    icon: XCircle,
    border: "border-l-danger",
    bg: "bg-danger-muted",
    text: "text-danger",
    dotBg: "bg-danger",
  },
  info: {
    icon: Info,
    border: "border-l-info",
    bg: "bg-info-muted",
    text: "text-info",
    dotBg: "bg-info",
  },
  success: {
    icon: CheckCircle,
    border: "border-l-success",
    bg: "bg-success-muted",
    text: "text-success",
    dotBg: "bg-success",
  },
};

// ---------------------------------------------------------------------------
// Component — Level 1 (Ambient)
// ---------------------------------------------------------------------------

function FlareAlert({
  variant,
  message,
  actionLabel,
  onAction,
  pulse = false,
  className,
}: FlareAlertProps) {
  const config = VARIANT_CONFIG[variant];
  const IconComp = config.icon;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border-l-[3px] px-4 py-3",
        config.border,
        config.bg,
        className,
      )}
    >
      {/* Icon — fixed 20px box, vertically centered with first line of text */}
      <div
        className="relative flex h-5 w-5 shrink-0 items-center justify-center"
        style={{ marginTop: "1px" }}
      >
        <IconComp
          className={cn("h-[16px] w-[16px]", config.text)}
          strokeWidth={1.75}
        />
        {pulse && (
          <span
            className={cn(
              "absolute -top-1 -right-1 h-2 w-2 rounded-full",
              config.dotBg,
              "animate-pulse",
            )}
          />
        )}
      </div>
      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-[1.5] text-text-primary">{message}</p>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-1.5 text-[12px] font-medium text-info hover:underline cursor-pointer"
          >
            {actionLabel} &rarr;
          </button>
        )}
      </div>
    </div>
  );
}

export { FlareAlert };
