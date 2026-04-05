"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

/* ==========================================================================
   Modal — Ambaril Design System

   Referência: modals-2.jpg (Ironclad), modals-5.jpg (collection)

   Uses createPortal to render on document.body, escaping any overflow
   or transform containment from parent layouts.

   Key design decisions:
   - backdrop-blur-md (12px) makes page content UNREADABLE behind modal
   - Strong shadow + ring create unmistakable modal boundary
   - No internal padding — caller controls section padding for full-bleed bands
   ========================================================================== */

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Width preset. sm=380px, md=480px, lg=600px, xl=740px */
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const WIDTHS: Record<string, string> = {
  sm: "w-full max-w-[400px]",
  md: "w-full max-w-[480px]",
  lg: "w-full max-w-[600px]",
  xl: "w-full max-w-[740px]",
};

export function Modal({
  isOpen,
  onClose,
  children,
  size = "md",
  className,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape
  React.useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const modal = (
    <>
      {/* Backdrop — dark overlay matching DS.md (20% opacity) */}
      <div
        className="fixed inset-0 z-50 bg-black/20 animate-backdrop-enter"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "pointer-events-auto relative",
            "rounded-xl bg-bg-elevated overflow-hidden",
            "shadow-[var(--shadow-xl)] ring-1 ring-border-subtle",
            "animate-modal-enter",
            WIDTHS[size ?? "md"],
            className,
          )}
        >
          {children}

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-md text-text-ghost hover:text-text-primary hover:bg-bg-surface transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}
