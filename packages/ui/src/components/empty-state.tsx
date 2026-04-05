import * as React from "react";
import { Button } from "./button";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmptyStateAction {
  /** Button label */
  label: string;
  /** Callback when the button is pressed */
  onPress: () => void;
}

export interface EmptyStateProps {
  /** Optional icon component from lucide-react */
  icon?: LucideIcon;
  /** Primary title text */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional call-to-action button */
  action?: EmptyStateAction;
  /** Optional secondary action button (ghost variant) */
  secondaryAction?: EmptyStateAction;
  /** Optional loss-aversion / social-proof line */
  proofLine?: string;
  /** Additional className */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component — Level 2 (Moment)
// ---------------------------------------------------------------------------

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  proofLine,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        "animate-[fade-in_400ms_ease-out]",
        className,
      )}
    >
      {Icon && (
        <div className="mb-1">
          <Icon
            className="h-12 w-12 text-text-muted opacity-60"
            strokeWidth={1.25}
          />
        </div>
      )}

      <h3 className="font-display text-2xl font-medium tracking-[-0.01em] text-text-white text-balance">
        {title}
      </h3>

      {description && (
        <p className="max-w-[360px] text-sm leading-relaxed text-text-secondary text-pretty">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-3 flex items-center gap-2">
          {action && (
            <Button variant="default" size="default" onPress={action.onPress}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" size="sm" onPress={secondaryAction.onPress}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {proofLine && (
        <p className="mt-1 max-w-xs text-xs italic text-text-muted">
          {proofLine}
        </p>
      )}
    </div>
  );
}

export { EmptyState };
