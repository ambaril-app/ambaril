"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** Alias for error (HeroUI compat) */
  errorMessage?: string;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, errorMessage, startContent, endContent, id, ...props },
    ref,
  ) => {
    const inputId = id || React.useId();
    const resolvedError = error ?? errorMessage;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "flex items-center gap-2 rounded-md border border-input-border bg-input-bg px-3",
            "min-h-9 transition-colors",
            "focus-within:border-input-focus",
            resolvedError && "border-danger",
            className,
          )}
        >
          {startContent}
          <input
            ref={ref}
            id={inputId}
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-text-primary placeholder:text-text-ghost outline-none"
            {...props}
          />
          {endContent}
        </div>
        {resolvedError && <p className="text-xs text-danger">{resolvedError}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
