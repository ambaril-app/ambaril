"use server";

import { db } from "@ambaril/db";
import { sql } from "drizzle-orm";
import { getTenantSession } from "@/lib/tenant";

// ─── LGPD Data Subject Rights ───────────────────────────

/**
 * Export all personal data for a given contact (LGPD Art. 18, III — Portability).
 * Returns a JSON object with all PII associated with the contact.
 */
export async function exportContactData(contactId: string): Promise<{
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const session = await getTenantSession();

    // Permission check: admin only
    if (
      session.effectiveRole !== "admin" &&
      !session.effectivePermissions.includes("*")
    ) {
      return {
        success: false,
        error: "Permissão negada — apenas admin pode exportar dados",
      };
    }

    if (!contactId || typeof contactId !== "string") {
      return { success: false, error: "ID do contato inválido" };
    }

    // Collect data from all relevant tables
    // Using raw SQL for flexibility across schemas
    const contactData = await db.execute(
      sql`SELECT id, email, name, phone, cpf, created_at, updated_at
          FROM crm.contacts
          WHERE id = ${contactId} AND tenant_id = ${session.tenantId}`,
    );

    const personalData = await db.execute(
      sql`SELECT full_name, cpf, email, phone, birth_date, gender, address
          FROM crm.personal_data
          WHERE contact_id = ${contactId} AND tenant_id = ${session.tenantId}`,
    );

    const orders = await db.execute(
      sql`SELECT id, status, total, created_at
          FROM checkout.orders
          WHERE customer_email = (
            SELECT email FROM crm.contacts WHERE id = ${contactId} AND tenant_id = ${session.tenantId}
          ) AND tenant_id = ${session.tenantId}`,
    );

    const consents = await db.execute(
      sql`SELECT purpose, granted, granted_at, revoked_at, ip_address
          FROM crm.consents
          WHERE contact_id = ${contactId} AND tenant_id = ${session.tenantId}`,
    );

    // Audit: data export event
    const { audit } = await import("@/lib/audit");
    audit(session, {
      action: "export_data",
      resourceType: "contact",
      resourceId: contactId,
    });

    return {
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        tenantId: session.tenantId,
        contact: contactData.rows?.[0] ?? null,
        personalData: personalData.rows?.[0] ?? null,
        orders: orders.rows ?? [],
        consents: consents.rows ?? [],
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao exportar dados",
    };
  }
}

/**
 * Anonymize/delete personal data for a contact (LGPD Art. 18, VI — Elimination).
 * Replaces PII with anonymized values. Does NOT delete business records (orders, financial).
 */
export async function deleteContactData(
  contactId: string,
  reason: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getTenantSession();

    // Permission check: admin only
    if (
      session.effectiveRole !== "admin" &&
      !session.effectivePermissions.includes("*")
    ) {
      return {
        success: false,
        error: "Permissão negada — apenas admin pode deletar dados",
      };
    }

    if (!contactId || typeof contactId !== "string") {
      return { success: false, error: "ID do contato inválido" };
    }

    if (!reason || reason.trim().length < 3) {
      return { success: false, error: "Motivo da exclusão é obrigatório" };
    }

    const anonymizedHash = `anon_${contactId.slice(0, 8)}`;

    // Anonymize contact in crm.contacts
    await db.execute(
      sql`UPDATE crm.contacts SET
            name = ${`[REDACTED] ${anonymizedHash}`},
            email = ${`${anonymizedHash}@deleted.ambaril.app`},
            phone = NULL,
            cpf = NULL,
            address = NULL,
            notes = NULL,
            deleted_at = NOW()
          WHERE id = ${contactId} AND tenant_id = ${session.tenantId}`,
    );

    // Anonymize personal_data
    await db.execute(
      sql`UPDATE crm.personal_data SET
            full_name = ${`[REDACTED] ${anonymizedHash}`},
            cpf = NULL,
            email = ${`${anonymizedHash}@deleted.ambaril.app`},
            phone = NULL,
            birth_date = NULL,
            gender = NULL,
            address = NULL,
            deleted_at = NOW()
          WHERE contact_id = ${contactId} AND tenant_id = ${session.tenantId}`,
    );

    // Revoke all consents
    await db.execute(
      sql`UPDATE crm.consents SET
            revoked_at = NOW()
          WHERE contact_id = ${contactId} AND tenant_id = ${session.tenantId} AND revoked_at IS NULL`,
    );

    // Audit: data deletion event
    const { audit } = await import("@/lib/audit");
    audit(session, {
      action: "delete_data",
      resourceType: "contact",
      resourceId: contactId,
      details: { reason: reason.trim() },
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao deletar dados",
    };
  }
}
