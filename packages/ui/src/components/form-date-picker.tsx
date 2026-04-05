"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { cn } from "../lib/utils";

const DATE_FORMAT = "dd/MM/yyyy";

export interface FormDatePickerProps {
  name?: string;
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  value?: Date | string | null;
  defaultValue?: Date | string;
  onChange?: (value: Date | null) => void;
}

function toDate(input: Date | string | null | undefined): Date | undefined {
  if (!input) return undefined;
  if (input instanceof Date) return isValid(input) ? input : undefined;
  if (typeof input === "string") {
    // Try ISO string first (YYYY-MM-DD)
    const isoDate = input.length > 10 ? input.slice(0, 10) : input;
    const parsed = new Date(isoDate + "T00:00:00");
    return isValid(parsed) ? parsed : undefined;
  }
  return undefined;
}

const FormDatePicker = React.forwardRef<HTMLDivElement, FormDatePickerProps>(
  (
    {
      className,
      label,
      placeholder = "dd/mm/aaaa",
      errorMessage,
      required,
      disabled,
      value,
      defaultValue,
      onChange,
      name,
    },
    ref,
  ) => {
    const triggerId = React.useId();
    const [open, setOpen] = React.useState(false);

    // Resolve controlled / uncontrolled
    const [internalDate, setInternalDate] = React.useState<Date | undefined>(
      () => toDate(defaultValue),
    );
    const resolvedDate = value !== undefined ? toDate(value) : internalDate;

    const handleSelect = React.useCallback(
      (day: Date | undefined) => {
        const selected = day ?? null;
        if (value === undefined) {
          setInternalDate(day);
        }
        onChange?.(selected);
        setOpen(false);
      },
      [onChange, value],
    );

    const displayValue = resolvedDate
      ? format(resolvedDate, DATE_FORMAT, { locale: ptBR })
      : "";

    return (
      <div ref={ref} className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <label htmlFor={triggerId} className="text-sm text-text-secondary">
            {label}
            {required && <span className="text-danger ml-0.5">*</span>}
          </label>
        )}

        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button
              id={triggerId}
              type="button"
              disabled={disabled}
              aria-invalid={!!errorMessage}
              className={cn(
                "flex h-9 w-full items-center gap-2 rounded-md border px-3 text-sm text-left",
                "bg-input-bg border-input-border",
                "hover:border-border-strong",
                "focus:outline-none focus:border-input-focus",
                "disabled:cursor-not-allowed disabled:opacity-50",
                errorMessage && "border-danger",
              )}
            >
              <Calendar className="h-4 w-4 shrink-0 text-text-secondary" />
              <span
                className={cn(
                  "flex-1 min-w-0 truncate",
                  displayValue ? "text-text-primary" : "text-text-ghost",
                )}
              >
                {displayValue || placeholder}
              </span>
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              sideOffset={4}
              align="start"
              className={cn(
                "z-50 rounded-md border border-border-default bg-bg-elevated shadow-[var(--shadow-lg)] p-3",
              )}
            >
              <DayPicker
                mode="single"
                selected={resolvedDate}
                onSelect={handleSelect}
                locale={ptBR}
                showOutsideDays
                classNames={{
                  months: "flex flex-col",
                  month: "space-y-4",
                  month_caption:
                    "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium text-text-primary",
                  nav: "space-x-1 flex items-center",
                  button_previous:
                    "absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center text-text-secondary",
                  button_next:
                    "absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center text-text-secondary",
                  month_grid: "w-full border-collapse space-y-1",
                  weekdays: "flex",
                  weekday:
                    "text-text-muted rounded-md w-8 font-normal text-[0.8rem]",
                  week: "flex w-full mt-2",
                  day: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-btn-primary-bg [&:has([aria-selected])]:rounded-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                  day_button:
                    "h-8 w-8 p-0 font-normal inline-flex items-center justify-center rounded-md hover:bg-bg-surface text-text-primary aria-selected:bg-btn-primary-bg aria-selected:text-btn-primary-text aria-selected:opacity-100",
                  outside: "text-text-ghost opacity-50",
                  disabled: "text-text-ghost opacity-50",
                  hidden: "invisible",
                  today: "bg-bg-surface rounded-md",
                }}
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {errorMessage && <p className="text-xs text-danger">{errorMessage}</p>}

        {name && (
          <input
            type="hidden"
            name={name}
            value={resolvedDate ? format(resolvedDate, "yyyy-MM-dd") : ""}
          />
        )}
      </div>
    );
  },
);
FormDatePicker.displayName = "FormDatePicker";

export { FormDatePicker };
