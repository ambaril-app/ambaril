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
  /** Additional className */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function EmptyState({ icon: Icon, title, description, action, secondaryAction, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="mb-1">
          <Icon className="h-10 w-10 text-text-muted" strokeWidth={1.5} />
        </div>
      )}

      <h3 className="text-base font-medium text-text-bright">{title}</h3>

      {description && (
        <p className="max-w-sm text-sm text-text-secondary">{description}</p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-2 flex items-center gap-2">
          {action && (
            <Button variant="secondary" size="sm" onPress={action.onPress}>
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
    </div>
  );
}

export { EmptyState };
