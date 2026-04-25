# Database Migrations

## Strategy

- Drizzle ORM handles schema definitions in `packages/db/src/schema/`
- Migrations generated via `drizzle-kit generate`
- Applied via `drizzle-kit migrate` or `drizzle-kit push` (dev only)

## Rules

1. NEVER use `drizzle-kit push` in production — always use generated migrations
2. Review every generated migration before applying
3. Dangerous DDL (DROP TABLE, TRUNCATE, ALTER COLUMN TYPE) requires MIGRATION_APPROVED=true
4. Always test migrations on a Neon sandbox branch first
5. Keep migration files in version control

## Iron Core

The following SQL files must be applied AFTER schema migrations:

- `../sql/iron-core-constraints.sql` — CHECK constraints (stock >= 0, prices >= 0)
- `../sql/iron-core-fsm.sql` — Order status FSM enforcement
- `../sql/iron-core-double-entry.sql` — Append-only inventory + financial ledger
- `../sql/iron-core-audit.sql` — Audit triggers on financial operations
- `../sql/rls-bootstrap.sql` — Row Level Security + ambaril_app role

## Migration History

| Date                                                 | Migration | Description | Applied By |
| ---------------------------------------------------- | --------- | ----------- | ---------- |
| (migrations will be listed here as they are created) |
