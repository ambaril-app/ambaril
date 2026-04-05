"use client";

export interface AiHintProps {
  /** The module this hint appears in */
  module: string;
  /** Contextual hint text (when ClawdBot is active) */
  context?: string;
  /** Additional className */
  className?: string;
}

/**
 * Slot component for inline AI hints.
 * Returns null until ClawdBot module is active.
 * Modules include this from day 1 so the slot is ready.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AiHint(props: AiHintProps) {
  // ClawdBot not yet active — return nothing
  return null;
}
