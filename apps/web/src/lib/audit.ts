import { db } from "@ambaril/db";
import { auditLogs } from "@ambaril/db/schema";
import type { TenantSessionData } from "@ambaril/shared/types";
import { createLogger } from "./logger";

const logger = createLogger("audit");

/**
 * Audit action types.
 *
 * NOTE: The DB enum `audit_action` currently only supports "create" | "update" | "delete".
 * Actions that don't fit the DB enum (login, integration_connect, etc.) are logged
 * via `auditAnonymous` to structured console output only. When the DB enum is expanded
 * via migration, these can be persisted to the audit_logs table as well.
 */
type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "login_failed"
  | "password_reset"
  | "permission_change"
  | "integration_connect"
  | "integration_disconnect"
  | "impersonate_start"
  | "impersonate_stop"
  | "export_data"
  | "delete_data";

/** Actions that fit the current DB enum and can be persisted. */
type PersistableAction = "create" | "update" | "delete";

function isPersistable(action: AuditAction): action is PersistableAction {
  return action === "create" || action === "update" || action === "delete";
}

interface AuditEntry {
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  module?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Record an audit log entry. Fire-and-forget — never blocks the caller.
 *
 * For actions that fit the DB enum ("create" | "update" | "delete"), the entry
 * is persisted to the `global.audit_logs` table. Other actions are logged
 * via structured console output.
 */
export function audit(session: TenantSessionData, entry: AuditEntry): void {
  if (isPersistable(entry.action)) {
    // Persist to DB — fire and forget
    db.insert(auditLogs)
      .values({
        tenantId: session.tenantId,
        userId: session.userId,
        userRole: session.role as typeof auditLogs.$inferInsert.userRole,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? session.userId,
        module: entry.module ?? entry.resourceType,
        changes: entry.details ?? {},
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
      })
      .then(() => {})
      .catch((err: unknown) => {
        logger.error("Failed to write audit log", {
          error: err instanceof Error ? err.message : String(err),
          action: entry.action,
          resourceType: entry.resourceType,
        });
      });
  } else {
    // Actions not in DB enum — structured log only
    logger.info("audit_event", {
      tenantId: session.tenantId,
      userId: session.userId,
      userRole: session.role,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      details: entry.details,
    });
  }
}

/**
 * Record an audit event without a session (e.g., failed login, public actions).
 *
 * The `global.audit_logs` table requires non-null tenantId, userId, and userRole,
 * so anonymous events are recorded via structured console logging only.
 * When the schema is expanded to support nullable auth fields, these can
 * be persisted to DB as well.
 */
export function auditAnonymous(
  tenantId: string | null,
  entry: AuditEntry & { email?: string },
): void {
  logger.info("audit_event_anonymous", {
    tenantId: tenantId ?? undefined,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    email: entry.email,
    details: entry.details,
  });
}
