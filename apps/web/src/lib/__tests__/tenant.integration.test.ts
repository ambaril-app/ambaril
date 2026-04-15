/**
 * Integration tests for withTenantContext — set_config transaction scoping.
 *
 * Tests against a REAL Neon database — not mocked.
 * Skips automatically when DATABASE_URL is not set.
 *
 * What these tests prove:
 * - set_config('app.tenant_id', ..., true) works inside a transaction
 * - The setting is readable within the same transaction
 * - Separate calls with different tenant IDs do not bleed into each other
 *
 * What these tests do NOT prove:
 * - RLS policies actually filter rows (needs seeded tables + policies applied)
 * - Cross-tenant data isolation at query level (needs test data + cleanup harness)
 */
import { describe, it, expect, vi } from "vitest";
import { sql } from "drizzle-orm";

// Mock Next.js server-only modules (unavailable in Vitest)
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() })),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)(
  "withTenantContext — set_config scoping (real DB)",
  () => {
    it("sets app.tenant_id readable within the transaction", async () => {
      const { withTenantContext } = await import("@/lib/tenant");

      const tenantId = `test-tenant-${Date.now()}`;
      const result = await withTenantContext(tenantId, async (tx) => {
        const rows = await tx.execute<{ tid: string }>(
          sql`SELECT current_setting('app.tenant_id') as tid`,
        );
        return rows.rows[0]!.tid;
      });

      expect(result).toBe(tenantId);
    });

    it("consecutive calls with different tenant IDs do not bleed", async () => {
      const { withTenantContext } = await import("@/lib/tenant");

      const tenantA = `tenant-a-${Date.now()}`;
      const tenantB = `tenant-b-${Date.now()}`;

      // Call A
      const resultA = await withTenantContext(tenantA, async (tx) => {
        const rows = await tx.execute<{ tid: string }>(
          sql`SELECT current_setting('app.tenant_id') as tid`,
        );
        return rows.rows[0]!.tid;
      });

      // Call B — must NOT see tenant A's ID
      const resultB = await withTenantContext(tenantB, async (tx) => {
        const rows = await tx.execute<{ tid: string }>(
          sql`SELECT current_setting('app.tenant_id') as tid`,
        );
        return rows.rows[0]!.tid;
      });

      expect(resultA).toBe(tenantA);
      expect(resultB).toBe(tenantB);
      expect(resultA).not.toBe(resultB);
    });
  },
);
