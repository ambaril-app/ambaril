"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-badge-bg text-badge-text",
        success: "bg-success-muted text-success",
        warning: "bg-warning-muted text-warning",
        danger: "bg-danger-muted text-danger",
        info: "bg-info-muted text-info",
        secondary: "bg-bg-surface text-text-secondary",
        // Organizational colors (muted, for categorization)
        slate: "bg-org-slate-bg text-org-slate-text",
        blue: "bg-org-blue-bg text-org-blue-text",
        violet: "bg-org-violet-bg text-org-violet-text",
        rose: "bg-org-rose-bg text-org-rose-text",
        emerald: "bg-org-emerald-bg text-org-emerald-text",
        cyan: "bg-org-cyan-bg text-org-cyan-text",
        orange: "bg-org-orange-bg text-org-orange-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
