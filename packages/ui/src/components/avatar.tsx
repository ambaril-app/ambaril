"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "../lib/utils";

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, name, size = "md", className }, ref) => {
    return (
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full",
          sizeMap[size],
          className,
        )}
      >
        {src && (
          <AvatarPrimitive.Image
            src={src}
            alt={name || ""}
            className="aspect-square h-full w-full object-cover"
          />
        )}
        <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center bg-bg-surface font-medium text-text-secondary">
          {name ? getInitials(name) : "?"}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
    );
  },
);
Avatar.displayName = "Avatar";

export { Avatar };
