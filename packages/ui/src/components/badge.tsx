import * as React from "react";
import { Chip } from "@heroui/react";
import type { ChipProps } from "@heroui/react";
import { cn } from "../lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "secondary";

export interface BadgeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  variant?: BadgeVariant;
}

const VARIANT_MAP: Record<BadgeVariant, ChipProps["color"]> = {
  default: "primary",
  success: "success",
  warning: "warning",
  danger: "danger",
  secondary: "default",
};

function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <Chip
      color={VARIANT_MAP[variant]}
      variant="flat"
      size="sm"
      className={cn(className)}
      {...props}
    >
      {children}
    </Chip>
  );
}

export { Badge };
