-- =============================================================================
-- RLS Security Bootstrap
-- =============================================================================
-- This script establishes the database security baseline for tenant isolation.
-- It is idempotent — safe to re-run on any environment.
--
-- Run manually after db:push or db:migrate:
--   psql $DATABASE_URL -f packages/db/sql/rls-bootstrap.sql
--
-- What it does:
-- 1. Creates ambaril_app role (non-BYPASSRLS) for application connections
-- 2. Grants schema USAGE + DML to ambaril_app
-- 3. Applies FORCE ROW LEVEL SECURITY to all RLS-enabled tables
-- 4. Repairs any tenant_isolation policies with empty USING/WITH CHECK clauses
--
-- Why this exists:
-- - Neon's default neondb_owner has BYPASSRLS — RLS is decoration without FORCE
-- - Drizzle db:push can create policies with empty clauses (known issue)
-- - These fixes are not expressible in standard Drizzle migrations
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Application role (non-BYPASSRLS)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ambaril_app') THEN
    CREATE ROLE ambaril_app NOLOGIN;
    RAISE NOTICE 'Created role ambaril_app';
  ELSE
    RAISE NOTICE 'Role ambaril_app already exists';
  END IF;
END $$;

-- Ensure the connection role can assume ambaril_app
DO $$
BEGIN
  EXECUTE format('GRANT ambaril_app TO %I', current_user);
  RAISE NOTICE 'Granted ambaril_app to %', current_user;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'ambaril_app already granted to %', current_user;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Schema USAGE + DML grants
-- ---------------------------------------------------------------------------
-- All schemas that contain tenant-scoped tables
DO $$
DECLARE
  schema_name text;
  schemas text[] := ARRAY[
    'global', 'checkout', 'crm', 'erp', 'messaging',
    'dashboard', 'creators', 'plm', 'tarefas', 'b2b', 'dam', 'marketing'
  ];
BEGIN
  FOREACH schema_name IN ARRAY schemas LOOP
    -- Only grant if schema exists
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = schema_name) THEN
      EXECUTE format('GRANT USAGE ON SCHEMA %I TO ambaril_app', schema_name);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO ambaril_app', schema_name);
      -- Future tables too
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ambaril_app', schema_name);
      RAISE NOTICE 'Granted permissions on schema %', schema_name;
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. FORCE ROW LEVEL SECURITY on all RLS-enabled tables
-- ---------------------------------------------------------------------------
-- Without FORCE, the table owner (neondb_owner) bypasses all policies.
DO $$
DECLARE
  r RECORD;
  applied int := 0;
BEGIN
  FOR r IN
    SELECT n.nspname, c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relrowsecurity = true
      AND c.relforcerowsecurity = false
  LOOP
    EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', r.nspname, r.relname);
    applied := applied + 1;
    RAISE NOTICE 'FORCE RLS applied to %.%', r.nspname, r.relname;
  END LOOP;
  RAISE NOTICE 'FORCE RLS: % tables updated (already-forced tables skipped)', applied;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Repair tenant_isolation policies with empty USING/WITH CHECK
-- ---------------------------------------------------------------------------
-- Drizzle db:push can create policies without the expression clauses.
-- This drops and recreates them with the canonical tenant isolation pattern.
DO $$
DECLARE
  r RECORD;
  repaired int := 0;
BEGIN
  FOR r IN
    SELECT n.nspname, c.relname, p.polname
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE p.polname = 'tenant_isolation'
      AND (p.polqual IS NULL OR p.polwithcheck IS NULL)
  LOOP
    EXECUTE format(
      'DROP POLICY "tenant_isolation" ON %I.%I',
      r.nspname, r.relname
    );
    EXECUTE format(
      $pol$CREATE POLICY "tenant_isolation" ON %I.%I
        AS PERMISSIVE FOR ALL TO public
        USING (tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid)
        WITH CHECK (tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid)$pol$,
      r.nspname, r.relname
    );
    repaired := repaired + 1;
    RAISE NOTICE 'Repaired policy on %.%', r.nspname, r.relname;
  END LOOP;
  RAISE NOTICE 'Policy repair: % policies fixed (valid policies untouched)', repaired;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Summary
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  role_ok boolean;
  force_count int;
  policy_ok int;
  policy_broken int;
BEGIN
  SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname = 'ambaril_app' AND NOT rolbypassrls)
    INTO role_ok;

  SELECT count(*) INTO force_count
    FROM pg_class WHERE relrowsecurity = true AND relforcerowsecurity = false;

  SELECT count(*) INTO policy_ok
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    WHERE p.polname = 'tenant_isolation'
      AND p.polqual IS NOT NULL
      AND p.polwithcheck IS NOT NULL;

  SELECT count(*) INTO policy_broken
    FROM pg_policy p
    WHERE p.polname = 'tenant_isolation'
      AND (p.polqual IS NULL OR p.polwithcheck IS NULL);

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '  RLS Bootstrap Summary';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '  ambaril_app role (non-BYPASSRLS): %', CASE WHEN role_ok THEN 'OK' ELSE 'MISSING' END;
  RAISE NOTICE '  Tables missing FORCE RLS:         %', force_count;
  RAISE NOTICE '  Valid tenant_isolation policies:   %', policy_ok;
  RAISE NOTICE '  Broken policies (NULL clauses):    %', policy_broken;
  RAISE NOTICE '═══════════════════════════════════════════';
END $$;
