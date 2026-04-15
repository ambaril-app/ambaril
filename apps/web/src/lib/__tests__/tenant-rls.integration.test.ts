/**
 * Row-level tenant isolation proof via RLS on global.module_setup_state.
 *
 * Skips when DATABASE_URL is absent.
 * FAILS HARD when DATABASE_URL is present but security prerequisites are missing.
 *
 * Prerequisites (applied via packages/db/sql/rls-bootstrap.sql):
 * - ambaril_app role exists and is NOT BYPASSRLS
 * - ambaril_app has USAGE + DML on global schema
 * - global.module_setup_state has FORCE ROW LEVEL SECURITY
 * - tenant_isolation policy has non-null USING and WITH CHECK clauses
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() })),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const DATABASE_URL = process.env.DATABASE_URL;
const ts = Date.now();
const SLUG_A = `test-rls-a-${ts}`;
const SLUG_B = `test-rls-b-${ts}`;

async function getTx(): Promise<any> {
  const { getTxDb } = await import("@ambaril/db/client");
  return getTxDb();
}

async function withRlsEnforced<T>(
  tenantId: string,
  callback: (tx: any) => Promise<T>,
): Promise<T> {
  const txDb = await getTx();
  return txDb.transaction(async (tx: any) => {
    await tx.execute(sql`SET LOCAL ROLE ambaril_app`);
    await tx.execute(
      sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
    );
    const result = await callback(tx);
    await tx.execute(sql`RESET ROLE`);
    return result;
  });
}

// ─────────────────────────────────────────────────────────────
// Security prerequisites — FAIL HARD if DB exists but setup is wrong
// ─────────────────────────────────────────────────────────────
describe.skipIf(!DATABASE_URL)("DB security prerequisites (hard-fail)", () => {
  it("ambaril_app role exists", async () => {
    const txDb = await getTx();
    const { rows } = await txDb.transaction(async (tx: any) =>
      tx.execute(
        sql`SELECT count(*)::text as cnt FROM pg_roles WHERE rolname = 'ambaril_app'`,
      ),
    );
    expect(rows[0].cnt).toBe("1");
  });

  it("ambaril_app role is NOT BYPASSRLS", async () => {
    const txDb = await getTx();
    const { rows } = await txDb.transaction(async (tx: any) =>
      tx.execute(
        sql`SELECT rolbypassrls FROM pg_roles WHERE rolname = 'ambaril_app'`,
      ),
    );
    expect(rows[0].rolbypassrls).toBe(false);
  });

  it("module_setup_state has FORCE ROW LEVEL SECURITY", async () => {
    const txDb = await getTx();
    const { rows } = await txDb.transaction(async (tx: any) =>
      tx.execute(
        sql`SELECT relrowsecurity, relforcerowsecurity
              FROM pg_class WHERE relname = 'module_setup_state'`,
      ),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].relrowsecurity).toBe(true);
    expect(rows[0].relforcerowsecurity).toBe(true);
  });

  it("tenant_isolation policy has non-null USING and WITH CHECK", async () => {
    const txDb = await getTx();
    const { rows } = await txDb.transaction(async (tx: any) =>
      tx.execute(
        sql`SELECT p.polname,
                     (p.polqual IS NOT NULL) as has_using,
                     (p.polwithcheck IS NOT NULL) as has_check
              FROM pg_policy p
              JOIN pg_class c ON c.oid = p.polrelid
              WHERE c.relname = 'module_setup_state'
                AND p.polname = 'tenant_isolation'`,
      ),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].has_using).toBe(true);
    expect(rows[0].has_check).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// Row-level isolation proof
// ─────────────────────────────────────────────────────────────
describe.skipIf(!DATABASE_URL)(
  "RLS row-level isolation — module_setup_state (real DB)",
  () => {
    let tenantIdA: string;
    let tenantIdB: string;

    beforeAll(async () => {
      const txDb = await getTx();

      // Create two test tenants (tenants table has no RLS)
      const created = await txDb.transaction(async (tx: any) => {
        const a = (
          await tx.execute(
            sql`INSERT INTO "global"."tenants" (name, slug)
                VALUES (${SLUG_A}, ${SLUG_A}) RETURNING id`,
          )
        ).rows[0]!;
        const b = (
          await tx.execute(
            sql`INSERT INTO "global"."tenants" (name, slug)
                VALUES (${SLUG_B}, ${SLUG_B}) RETURNING id`,
          )
        ).rows[0]!;
        return { a: a.id, b: b.id };
      });
      tenantIdA = created.a;
      tenantIdB = created.b;

      // Seed one module_setup_state row per tenant (under enforced RLS)
      await withRlsEnforced(tenantIdA, async (tx) => {
        await tx.execute(
          sql`INSERT INTO "global"."module_setup_state"
              (tenant_id, module_id, is_setup_complete)
              VALUES (${tenantIdA}, 'erp', true)`,
        );
      });
      await withRlsEnforced(tenantIdB, async (tx) => {
        await tx.execute(
          sql`INSERT INTO "global"."module_setup_state"
              (tenant_id, module_id, is_setup_complete)
              VALUES (${tenantIdB}, 'plm', false)`,
        );
      });
    });

    afterAll(async () => {
      const txDb = await getTx();
      await txDb.transaction(async (tx: any) => {
        await tx.execute(
          sql`DELETE FROM "global"."tenants" WHERE slug IN (${SLUG_A}, ${SLUG_B})`,
        );
      });
    });

    it("tenant A only sees its own rows", async () => {
      const rows = await withRlsEnforced(tenantIdA, async (tx) => {
        return (
          await tx.execute(
            sql`SELECT module_id, tenant_id::text
                FROM "global"."module_setup_state"`,
          )
        ).rows;
      });
      expect(rows).toHaveLength(1);
      expect(rows[0]!.module_id).toBe("erp");
      expect(rows[0]!.tenant_id).toBe(tenantIdA);
    });

    it("tenant B only sees its own rows", async () => {
      const rows = await withRlsEnforced(tenantIdB, async (tx) => {
        return (
          await tx.execute(
            sql`SELECT module_id, tenant_id::text
                FROM "global"."module_setup_state"`,
          )
        ).rows;
      });
      expect(rows).toHaveLength(1);
      expect(rows[0]!.module_id).toBe("plm");
      expect(rows[0]!.tenant_id).toBe(tenantIdB);
    });

    it("tenant A cannot insert a row for tenant B (withCheck blocks)", async () => {
      await expect(
        withRlsEnforced(tenantIdA, async (tx) => {
          await tx.execute(
            sql`INSERT INTO "global"."module_setup_state"
                (tenant_id, module_id, is_setup_complete)
                VALUES (${tenantIdB}, 'crm', false)`,
          );
        }),
      ).rejects.toThrow();
    });
  },
);
