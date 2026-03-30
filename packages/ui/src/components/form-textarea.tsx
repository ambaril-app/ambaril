"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface FormTextareaProps {
  name?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  /** Alias for error (HeroUI compat) */
  errorMessage?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  value?: string;
  defaultValue?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  maxLength?: number;
  rows?: number;
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      className,
      label,
      placeholder,
      error,
      errorMessage,
      required,
      disabled,
      value,
      defaultValue,
      onChange,
      maxLength,
      rows = 3,
      name,
    },
    ref,
  ) => {
    const textareaId = React.useId();
    const resolvedError = error ?? errorMessage;
    const [charCount, setCharCount] = React.useState(
      () => (value ?? defaultValue ?? "").length,
    );

    React.useEffect(() => {
      if (value !== undefined) {
        setCharCount(value.length);
      }
    }, [value]);

    const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> =
      React.useCallback(
        (e) => {
          setCharCount(e.target.value.length);
          onChange?.(e);
        },
        [onChange],
      );

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
            {required && (
              <span className="ml-0.5 text-danger">*</span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          name={name}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          maxLength={maxLength}
          rows={rows}
          className={cn(
            "rounded-md border border-input-border bg-input-bg px-3 py-2",
            "text-sm text-text-primary placeholder:text-text-ghost",
            "transition-colors",
            "focus:border-input-focus focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "resize-y",
            resolvedError && "border-danger",
          )}
        />
        <div className="flex items-center justify-between">
          {resolvedError && <p className="text-xs text-danger">{resolvedError}</p>}
          {maxLength !== undefined && (
            <span className="ml-auto select-none font-mono text-xs text-text-muted">
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  },
);
FormTextarea.displayName = "FormTextarea";

export { FormTextarea };
