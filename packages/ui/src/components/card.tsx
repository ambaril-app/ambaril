import * as React from "react";
import { cn } from "../lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-border-subtle bg-bg-base p-4 shadow-[var(--shadow-sm)] transition-all duration-200",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-base font-medium text-text-bright", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-text-secondary", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardContent.displayName = "CardContent";

// ---------------------------------------------------------------------------
// KpiCard — Level 1 Ambient variant for dashboards
// ---------------------------------------------------------------------------

export interface KpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Small uppercase label (e.g. "GMV HOJE") */
  label: string;
  /** Main value (e.g. "R$ 34.820") */
  value: string;
  /** Delta string (e.g. "+12.4%") */
  delta?: string;
  /** Whether delta is positive, negative, or neutral */
  deltaType?: "positive" | "negative" | "neutral";
  /** Period reference (e.g. "vs ontem") */
  deltaPeriod?: string;
}

const KpiCard = React.forwardRef<HTMLDivElement, KpiCardProps>(
  (
    {
      className,
      label,
      value,
      delta,
      deltaType = "neutral",
      deltaPeriod,
      ...props
    },
    ref,
  ) => {
    const deltaColor =
      deltaType === "positive"
        ? "text-success"
        : deltaType === "negative"
          ? "text-danger"
          : "text-text-secondary";
    const deltaArrow =
      deltaType === "positive"
        ? "\u25B2"
        : deltaType === "negative"
          ? "\u25BC"
          : "";

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border border-border-subtle bg-bg-base p-5",
          "shadow-[var(--shadow-md)]",
          "transition-all duration-200",
          "hover:shadow-[var(--shadow-lg)] hover:-translate-y-px hover:border-border-default",
          className,
        )}
        {...props}
      >
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
          {label}
        </p>
        <p className="mt-1 font-mono text-[32px] font-medium leading-tight tracking-tight text-text-white tabular-nums">
          {value}
        </p>
        {delta && (
          <p className={cn("mt-1.5 text-xs font-medium", deltaColor)}>
            {deltaArrow && <span className="mr-0.5">{deltaArrow}</span>}
            {delta}
            {deltaPeriod && (
              <span className="ml-1 font-normal text-text-muted">
                {deltaPeriod}
              </span>
            )}
          </p>
        )}
      </div>
    );
  },
);
KpiCard.displayName = "KpiCard";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, KpiCard };
