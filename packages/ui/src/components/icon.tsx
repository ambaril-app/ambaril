import * as React from "react";
import type { LucideIcon, LucideProps } from "lucide-react";
import { cn } from "../lib/utils";

// ---------------------------------------------------------------------------
// Ambaril Icon wrapper — enforces DS icon standards
// ---------------------------------------------------------------------------
//
// Lucide React defaults: strokeWidth=2, size=24
// Ambaril standard:     strokeWidth=1.75, size varies by context
//
// This wrapper ensures consistent icon rendering across the app.
// Use this instead of importing Lucide icons directly when you
// want DS-compliant sizing and weight.
//
// Sizes by context:
//   "xs"  = 14px (badges, inline text)
//   "sm"  = 16px (buttons, form elements)
//   "md"  = 18px (sidebar items, default)
//   "lg"  = 20px (page headers, KPI cards)
//   "xl"  = 24px (empty states, modals)

type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<IconSize, number> = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 24,
};

export interface IconProps extends Omit<LucideProps, "size" | "ref"> {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Semantic size preset */
  size?: IconSize | number;
}

const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  (
    {
      icon: LucideComponent,
      size = "md",
      strokeWidth = 1.75,
      className,
      ...props
    },
    ref,
  ) => {
    const resolvedSize = typeof size === "number" ? size : SIZE_MAP[size];

    return (
      <LucideComponent
        ref={ref}
        size={resolvedSize}
        strokeWidth={strokeWidth}
        className={cn("shrink-0", className)}
        {...props}
      />
    );
  },
);
Icon.displayName = "Icon";

export { Icon };
