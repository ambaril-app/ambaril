"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ModalSize = "sm" | "md" | "lg" | "xl";

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal requests to close */
  onClose: () => void;
  /** Modal title displayed in the header */
  title?: string;
  /** Modal body content */
  children: React.ReactNode;
  /** Size preset */
  size?: ModalSize;
  /** Additional className on the modal content */
  className?: string;
}

// ---------------------------------------------------------------------------
// Size mapping
// ---------------------------------------------------------------------------

const SIZE_MAP: Record<ModalSize, string> = {
  sm: "max-w-[400px]",
  md: "max-w-[500px]",
  lg: "max-w-[640px]",
  xl: "max-w-[800px]",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function Modal({ isOpen, onClose, title, children, size = "md", className }: ModalProps) {
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
            "fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2",
            "bg-bg-base border border-border-default",
            "rounded-lg shadow-[var(--shadow-xl)] p-6",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
            SIZE_MAP[size],
            className,
          )}
        >
          {title && (
            <Dialog.Title className="text-lg font-medium text-text-bright mb-4">
              {title}
            </Dialog.Title>
          )}

          {children}

          <Dialog.Close asChild>
            <button
              type="button"
              className={cn(
                "absolute top-4 right-4",
                "text-text-muted hover:text-text-primary",
                "transition-colors duration-150 cursor-pointer",
              )}
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { Modal };
