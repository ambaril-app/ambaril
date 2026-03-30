"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "../lib/utils";

export interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  children: React.ReactNode;
  className?: string;
  name?: string;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, orientation = "vertical", ...props }, ref) => (
    <RadioGroupPrimitive.Root
      ref={ref}
      className={cn(
        "flex",
        orientation === "vertical" ? "flex-col gap-3" : "flex-row gap-4",
        className,
      )}
      orientation={orientation}
      {...props}
    />
  ),
);
RadioGroup.displayName = "RadioGroup";

export interface RadioGroupItemProps {
  value: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  children?: React.ReactNode;
}

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ value, label, description, disabled, className, id, children, ...props }, ref) => {
    const itemId = id || React.useId();
    return (
      <div className="flex items-start gap-2">
        <RadioGroupPrimitive.Item
          ref={ref}
          id={itemId}
          value={value}
          disabled={disabled}
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border mt-0.5",
            "border-border-default",
            "data-[state=checked]:border-btn-primary-bg",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-input-focus",
            className,
          )}
          {...props}
        >
          <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
            <span className="h-2 w-2 rounded-full bg-btn-primary-bg" />
          </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
        {(label || children) && (
          <div className="flex flex-col gap-0.5">
            <label
              htmlFor={itemId}
              className="text-sm text-text-primary cursor-pointer select-none leading-none"
            >
              {label || children}
            </label>
            {description && (
              <p className="text-xs text-text-muted">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  },
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
