"use client";

import * as React from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../lib/utils";

// Radix Select forbids value="". We use a sentinel internally so consumers
// can keep passing { value: "", label: "Todos" } without breaking.
const EMPTY_SENTINEL = "__empty__";

function toInternal(v: string): string {
  return v === "" ? EMPTY_SENTINEL : v;
}

function toExternal(v: string): string {
  return v === EMPTY_SENTINEL ? "" : v;
}

export interface FormSelectOption {
  value: string;
  label: string;
}

export interface FormSelectProps {
  name?: string;
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  options: FormSelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

const FormSelect = React.forwardRef<HTMLButtonElement, FormSelectProps>(
  (
    {
      className,
      label,
      placeholder = "Selecione uma opcao",
      errorMessage,
      required,
      disabled,
      options,
      value,
      defaultValue,
      onChange,
      name,
    },
    ref,
  ) => {
    const selectId = React.useId();

    const internalValue = value !== undefined ? toInternal(value) : undefined;
    const internalDefault = defaultValue !== undefined ? toInternal(defaultValue) : undefined;

    function handleChange(v: string) {
      onChange?.(toExternal(v));
    }

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
            {required && <span className="ml-0.5 text-danger">*</span>}
          </label>
        )}

        <Select.Root
          name={name}
          value={internalValue}
          defaultValue={internalDefault}
          onValueChange={handleChange}
          disabled={disabled}
        >
          <Select.Trigger
            ref={ref}
            id={selectId}
            aria-invalid={!!errorMessage}
            className={cn(
              "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input-border bg-input-bg px-3 text-sm",
              "appearance-none text-text-primary",
              "hover:border-border-strong",
              "focus:outline-none focus:ring-2 focus:ring-input-focus",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "data-[placeholder]:text-text-ghost",
              errorMessage && "border-danger",
            )}
          >
            <span className="min-w-0 flex-1 truncate text-left">
              <Select.Value placeholder={placeholder} />
            </span>
            <Select.Icon asChild>
              <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
            </Select.Icon>
          </Select.Trigger>

          <Select.Portal>
            <Select.Content
              position="popper"
              sideOffset={4}
              className={cn(
                "z-50 max-h-60 overflow-hidden rounded-lg border border-border-default bg-bg-base shadow-[var(--shadow-lg)]",
                "min-w-[var(--radix-select-trigger-width)]",
                "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
                "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
              )}
            >
              <Select.Viewport className="p-1">
                {options.map((option) => (
                  <Select.Item
                    key={option.value || EMPTY_SENTINEL}
                    value={toInternal(option.value)}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-3 text-sm outline-none",
                      "text-text-secondary",
                      "data-[highlighted]:bg-bg-surface data-[highlighted]:text-text-primary",
                      "data-[state=checked]:text-text-bright",
                      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    )}
                  >
                    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                      <Select.ItemIndicator>
                        <Check className="h-3.5 w-3.5 text-info" />
                      </Select.ItemIndicator>
                    </span>
                    <Select.ItemText>{option.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        {errorMessage && (
          <p className="text-xs text-danger">{errorMessage}</p>
        )}
      </div>
    );
  },
);
FormSelect.displayName = "FormSelect";

export { FormSelect };
