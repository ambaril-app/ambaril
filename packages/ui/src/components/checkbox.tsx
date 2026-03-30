"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "../lib/utils";

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** HeroUI compatibility alias for `checked` */
  isSelected?: boolean;
  /** HeroUI compatibility alias for `onCheckedChange` */
  onValueChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    {
      checked,
      onCheckedChange,
      isSelected,
      onValueChange,
      label,
      disabled,
      className,
      id,
      name,
      ...props
    },
    ref,
  ) => {
    const resolvedChecked = checked ?? isSelected;
    const resolvedOnChange = onCheckedChange ?? onValueChange;
    const checkboxId = id || React.useId();

    return (
      <div className="flex items-center gap-2">
        <CheckboxPrimitive.Root
          ref={ref}
          id={checkboxId}
          name={name}
          checked={resolvedChecked}
          onCheckedChange={(val) => resolvedOnChange?.(val === true)}
          disabled={disabled}
          className={cn(
            "peer flex h-[18px] w-[18px] shrink-0 appearance-none items-center justify-center rounded border border-border-strong bg-transparent transition-colors",
            "data-[state=checked]:border-info data-[state=checked]:bg-info",
            "hover:border-text-muted",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-input-focus focus-visible:ring-offset-1",
            className,
          )}
          {...props}
        >
          <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
            <Check className="h-3 w-3" strokeWidth={3} />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        {label && (
          <label
            htmlFor={checkboxId}
            className="cursor-pointer select-none text-sm text-text-primary"
          >
            {label}
          </label>
        )}
      </div>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
