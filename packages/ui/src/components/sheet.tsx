"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Callback when the sheet requests to close */
  onClose: () => void;
  /** Title displayed in the header */
  title?: string;
  /** Sheet body content */
  children: React.ReactNode;
  /** Width of the sheet panel. Defaults to "md" */
  width?: "sm" | "md" | "lg" | "xl";
  /** Additional className on the sheet content */
  className?: string;
}

// ---------------------------------------------------------------------------
// Width presets
// ---------------------------------------------------------------------------

const WIDTH_MAP: Record<string, string> = {
  sm: "w-[320px]",
  md: "w-[420px]",
  lg: "w-[560px]",
  xl: "w-[720px]",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function Sheet({
  isOpen,
  onClose,
  title,
  children,
  width = "md",
  className,
}: SheetProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed right-0 top-0 z-50 h-full",
            "bg-bg-base border-l border-border-default",
            "shadow-[var(--shadow-xl)] flex flex-col",
            "outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
            WIDTH_MAP[width],
            className,
          )}
        >
          <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
            {title && (
              <Dialog.Title className="text-lg font-medium text-text-bright">
                {title}
              </Dialog.Title>
            )}
            <Dialog.Close asChild>
              <button
                type="button"
                className={cn(
                  "ml-auto",
                  "text-text-muted hover:text-text-primary",
                  "transition-colors duration-150 cursor-pointer",
                  "focus:outline-none",
                )}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { Sheet };
