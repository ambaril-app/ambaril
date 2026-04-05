"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToastVariant = "success" | "danger" | "warning" | "info";

interface ToastOptions {
  /** Toast variant determines color accent and icon */
  variant: ToastVariant;
  /** Main message text */
  message: string;
  /** Optional action button label */
  actionLabel?: string;
  /** Callback when action button is clicked */
  onAction?: () => void;
  /** Auto-dismiss duration in ms (default 4000). Set 0 to disable. */
  duration?: number;
}

interface ToastEntry extends ToastOptions {
  id: string;
  exiting: boolean;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 4000;
const EXIT_DURATION = 200; // ms for exit animation

let toastCounter = 0;

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: LucideIcon; border: string; text: string }
> = {
  success: {
    icon: CheckCircle,
    border: "border-l-success",
    text: "text-success",
  },
  danger: {
    icon: XCircle,
    border: "border-l-danger",
    text: "text-danger",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-l-warning",
    text: "text-warning",
  },
  info: {
    icon: Info,
    border: "border-l-info",
    text: "text-info",
  },
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = React.createContext<ToastContextValue | null>(null);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Single Toast Item
// ---------------------------------------------------------------------------

interface ToastItemProps {
  entry: ToastEntry;
  onDismiss: (id: string) => void;
}

function ToastItem({ entry, onDismiss }: ToastItemProps) {
  const config = VARIANT_CONFIG[entry.variant];
  const IconComp = config.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex min-w-[300px] max-w-[420px] gap-3 rounded-lg border-l-[3px] bg-bg-elevated border border-border-default px-4 py-3 shadow-lg",
        config.border,
        entry.exiting ? "animate-slide-out-right" : "animate-slide-in-right",
      )}
    >
      {/* Icon */}
      <div
        className="flex h-5 w-5 shrink-0 items-center justify-center"
        style={{ marginTop: "1px" }}
      >
        <IconComp className={cn("h-4 w-4", config.text)} strokeWidth={1.75} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-[1.5] text-text-primary">
          {entry.message}
        </p>
        {entry.actionLabel && entry.onAction && (
          <button
            type="button"
            onClick={() => {
              entry.onAction?.();
              onDismiss(entry.id);
            }}
            className="mt-1 text-[12px] font-medium text-info hover:underline cursor-pointer"
          >
            {entry.actionLabel} &rarr;
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        aria-label="Fechar notificação"
        onClick={() => onDismiss(entry.id)}
        className="flex h-5 w-5 shrink-0 items-center justify-center text-text-ghost hover:text-text-primary transition-colors cursor-pointer"
        style={{ marginTop: "1px" }}
      >
        <X className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast Container (portal)
// ---------------------------------------------------------------------------

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastEntry[];
  onDismiss: (id: string) => void;
}) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-label="Notificações"
      className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((entry) => (
        <ToastItem key={entry.id} entry={entry} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastEntry[]>([]);
  const timersRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  // Clear all timers on unmount
  React.useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const startExiting = React.useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );

    // Remove after exit animation completes
    const removeTimer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, EXIT_DURATION);
    timersRef.current.set(`${id}-remove`, removeTimer);
  }, []);

  const dismiss = React.useCallback(
    (id: string) => {
      // Clear auto-dismiss timer if exists
      const autoTimer = timersRef.current.get(id);
      if (autoTimer) {
        clearTimeout(autoTimer);
        timersRef.current.delete(id);
      }
      startExiting(id);
    },
    [startExiting],
  );

  const toast = React.useCallback(
    (options: ToastOptions) => {
      const id = `toast-${++toastCounter}`;
      const duration = options.duration ?? DEFAULT_DURATION;

      const newEntry: ToastEntry = { ...options, id, exiting: false };

      setToasts((prev) => {
        let next = [...prev, newEntry];

        // Enforce max visible — dismiss oldest (non-exiting) beyond limit
        const visible = next.filter((t) => !t.exiting);
        if (visible.length > MAX_VISIBLE) {
          const toDismiss = visible.slice(0, visible.length - MAX_VISIBLE);
          for (const old of toDismiss) {
            // Clear any existing timer
            const oldTimer = timersRef.current.get(old.id);
            if (oldTimer) {
              clearTimeout(oldTimer);
              timersRef.current.delete(old.id);
            }
            // Mark as exiting inline
            next = next.map((t) =>
              t.id === old.id ? { ...t, exiting: true } : t,
            );
            // Schedule removal
            const removeTimer = setTimeout(() => {
              setToasts((p) => p.filter((t) => t.id !== old.id));
              timersRef.current.delete(`${old.id}-remove`);
            }, EXIT_DURATION);
            timersRef.current.set(`${old.id}-remove`, removeTimer);
          }
        }

        return next;
      });

      // Auto-dismiss
      if (duration > 0) {
        const timer = setTimeout(() => {
          timersRef.current.delete(id);
          startExiting(id);
        }, duration);
        timersRef.current.set(id, timer);
      }
    },
    [startExiting],
  );

  const contextValue = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { ToastProvider, useToast };
export type { ToastOptions, ToastVariant };
