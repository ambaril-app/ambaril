/**
 * Canonical Drizzle query patterns for Ambaril.
 * Reference: CLAUDE.md P6 (Database Query Patterns)
 *
 * RULES:
 * 1. Select specific columns — never db.select().from(table)
 * 2. Use relational queries for joins — never loop + query (N+1)
 * 3. Prepared statements for repeated queries
 * 4. Composite indexes on (tenant_id, ...) for every table
 * 5. neon-http for serverless, pooled for transactions
 */

import { eq, and, desc, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

// ── Pattern 1: Select specific columns ─────────────────────
// CORRECT — only fetches needed columns
// export async function listOrders(tenantId: string) {
//   return db.select({
//     id: orders.id,
//     number: orders.number,
//     status: orders.status,
//     total: orders.total,
//     createdAt: orders.createdAt,
//   })
//   .from(orders)
//   .where(eq(orders.tenantId, tenantId))
//   .orderBy(desc(orders.createdAt))
//   .limit(50);
// }

// ── Pattern 2: Relational queries (avoid N+1) ──────────────
// CORRECT — single query with joins
// export async function getOrderWithItems(tenantId: string, orderId: string) {
//   return db.query.orders.findFirst({
//     where: and(eq(orders.tenantId, tenantId), eq(orders.id, orderId)),
//     with: {
//       lineItems: {
//         columns: { id: true, productName: true, quantity: true, unitPrice: true },
//       },
//       customer: {
//         columns: { id: true, name: true, email: true },
//       },
//     },
//   });
// }

// ── Pattern 3: Prepared statements ─────────────────────────
// CORRECT — prepare once, execute many
// export const getOrderById = db
//   .select({
//     id: orders.id,
//     number: orders.number,
//     status: orders.status,
//     total: orders.total,
//   })
//   .from(orders)
//   .where(
//     and(
//       eq(orders.tenantId, sql.placeholder("tenantId")),
//       eq(orders.id, sql.placeholder("id")),
//     ),
//   )
//   .prepare("get_order_by_id");
//
// Usage: await getOrderById.execute({ tenantId, id: orderId })

// ── Pattern 4: Tenant-scoped cache with request dedup ──────
// import { cache } from 'react'
// import { unstable_cache } from 'next/cache'
//
// // Request-level dedup (same render = same query)
// export const getTenant = cache(async (tenantId: string) => {
//   return db.query.tenants.findFirst({
//     where: eq(tenants.id, tenantId),
//     columns: { id: true, name: true, slug: true, plan: true },
//   });
// });
//
// // Cross-request cache (revalidate every 5min)
// export const getCachedProducts = unstable_cache(
//   async (tenantId: string) => {
//     return db.select({
//       id: products.id,
//       name: products.name,
//       sku: products.sku,
//       price: products.price,
//     })
//     .from(products)
//     .where(eq(products.tenantId, tenantId));
//   },
//   ['products'],
//   { tags: [`products-${tenantId}`], revalidate: 300 }
// );

// ── Pattern 5: Composite index definition ──────────────────
// Every table MUST have (tenant_id, ...) composite index
//
// export const orders = pgTable('orders', {
//   id: uuid('id').defaultRandom().primaryKey(),
//   tenantId: uuid('tenant_id').notNull(),
//   status: varchar('status', { length: 20 }).notNull(),
//   createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
// }, (table) => [
//   index('orders_tenant_idx').on(table.tenantId),
//   index('orders_tenant_status_idx').on(table.tenantId, table.status),
//   index('orders_tenant_created_idx').on(table.tenantId, table.createdAt.desc()),
// ]);

// ── Pattern 6: RLS with STABLE function ────────────────────
// CREATE OR REPLACE FUNCTION current_tenant_id()
// RETURNS uuid AS $$
//   SELECT current_setting('app.tenant_id', true)::uuid;
// $$ LANGUAGE sql STABLE;
//
// -- STABLE = executes ONCE per transaction (not per row)
// CREATE POLICY tenant_isolation ON orders
//   USING (tenant_id = current_tenant_id());

export {};
