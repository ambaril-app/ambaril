#!/usr/bin/env bash
# =============================================================================
# IRON CORE — Runner Script
# =============================================================================
# Created: 2026-04-24
# Why: Single command to apply all Iron Core database protections.
#      These are the "Delphi-like" safety nets that make PostgreSQL
#      enforce business rules regardless of app-level bugs.
#
# Usage:
#   cd ~/projects/ambaril-web
#   ./packages/db/sql/iron-core-runner.sh
#
# Requires: DATABASE_URL environment variable or .env file
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}  Iron Core — Database Safety Bootstrap${NC}"
echo -e "${BLUE}  $(date -u '+%Y-%m-%d %H:%M:%S UTC')${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Load .env if DATABASE_URL not set
if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f "$PROJECT_ROOT/.env" ]]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
    echo -e "${YELLOW}Loaded DATABASE_URL from .env${NC}"
  else
    echo -e "${RED}ERROR: DATABASE_URL not set and no .env found${NC}"
    echo "Set DATABASE_URL or create .env with DATABASE_URL=postgresql://..."
    exit 1
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo -e "${RED}ERROR: DATABASE_URL is empty${NC}"
  exit 1
fi

# Pre-flight: verify connection
echo -e "\n${YELLOW}Pre-flight check...${NC}"
if ! psql "${DATABASE_URL}" -c "SELECT 1" > /dev/null 2>&1; then
  echo -e "${RED}ERROR: Cannot connect to database${NC}"
  echo -e "${RED}URL prefix: ${DATABASE_URL:0:40}...${NC}"
  exit 1
fi
echo -e "${GREEN}Database connection OK${NC}"

# Pre-flight: verify critical schemas exist
SCHEMAS=$(psql "${DATABASE_URL}" -t -c "SELECT string_agg(nspname, ', ') FROM pg_namespace WHERE nspname IN ('global', 'erp', 'checkout')")
echo -e "Schemas found: ${SCHEMAS}"

# Run scripts in order
SQL_FILES=(
  "rls-bootstrap.sql"
  "iron-core-constraints.sql"
  "iron-core-audit.sql"
  "iron-core-fsm.sql"
  "iron-core-double-entry.sql"
  "iron-core-v2-fixes.sql"
  "iron-core-v3-column-fix.sql"
)

FAILED=0
for sql_file in "${SQL_FILES[@]}"; do
  SQL_PATH="$SCRIPT_DIR/$sql_file"
  if [[ -f "$SQL_PATH" ]]; then
    echo -e "\n${BLUE}Running: $sql_file${NC}"
    if psql "${DATABASE_URL}" -f "$SQL_PATH" 2>&1; then
      echo -e "${GREEN}OK: $sql_file${NC}"
    else
      echo -e "${RED}FAILED: $sql_file${NC}"
      FAILED=$((FAILED + 1))
    fi
  else
    echo -e "${YELLOW}SKIP: $sql_file (not found)${NC}"
  fi
done

# Final summary
echo -e "\n${BLUE}═══════════════════════════════════════════${NC}"
if [[ $FAILED -eq 0 ]]; then
  echo -e "${GREEN}  Iron Core applied successfully!${NC}"
else
  echo -e "${RED}  $FAILED script(s) failed — review output above${NC}"
fi
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Post-flight: count protections
psql "${DATABASE_URL}" -c "
  SELECT 'CHECK constraints' as type, count(*)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'erp' AND c.conname LIKE 'chk_%'
  UNION ALL
  SELECT 'Iron Core triggers', count(*)
    FROM pg_trigger
    WHERE tgname LIKE 'trg_iron_core_%'
  UNION ALL
  SELECT 'Partial UNIQUE indexes', count(*)
    FROM pg_indexes
    WHERE schemaname = 'erp' AND indexname LIKE 'idx_%unique%active%'
  ORDER BY type;
"

exit $FAILED
