#!/bin/bash
# ESAA-Security Quick Check — runs after implementation to catch common violations
# Usage: bash scripts/security-check.sh
# Exit code: 0 = clean, 1 = violations found

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

VIOLATIONS=0
WARNINGS=0

check_pass() { echo -e "  ${GREEN}✓${NC} $1"; }
check_fail() { echo -e "  ${RED}✗${NC} $1"; VIOLATIONS=$((VIOLATIONS + 1)); }
check_warn() { echo -e "  ${YELLOW}!${NC} $1"; WARNINGS=$((WARNINGS + 1)); }

echo ""
echo "══════════════════════════════════════════════"
echo "  ESAA-Security Quick Check"
echo "══════════════════════════════════════════════"
echo ""

# ── S1: Server Actions without auth ──────────────────────
echo "S1. Server Actions — Auth + Permission check"
ACTIONS_WITHOUT_AUTH=$(grep -rl '"use server"' apps/web/src/app/ 2>/dev/null | while read f; do
  # Skip public auth routes — these are intentionally unauthenticated
  if echo "$f" | grep -q '(auth)'; then continue; fi
  # Skip if file has getTenantSession or getSession
  if ! grep -q 'getTenantSession\|getSession' "$f" 2>/dev/null; then
    # Check if it's a real action file (has exported async functions)
    if grep -q 'export async function' "$f" 2>/dev/null; then
      echo "$f"
    fi
  fi
done)

if [ -z "$ACTIONS_WITHOUT_AUTH" ]; then
  check_pass "All server actions call getTenantSession() or getSession()"
else
  check_fail "Server actions WITHOUT auth check:"
  echo "$ACTIONS_WITHOUT_AUTH" | while read f; do echo "         $f"; done
fi

# ── S2: Bare .select() without columns ──────────────────
echo "S2. Queries — Explicit column selection"
BARE_SELECTS=$(grep -rn '\.select()' apps/web/src/ --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v 'node_modules' | grep -v '\.select({' | grep -v '// ' | grep -v 'test' || true)

if [ -z "$BARE_SELECTS" ]; then
  check_pass "No bare .select() calls (all have explicit columns)"
else
  check_warn "Bare .select() calls found (should specify columns):"
  echo "$BARE_SELECTS" | head -5 | while read line; do echo "         $line"; done
fi

# ── S3: Console.log with sensitive data ──────────────────
echo "S3. Secrets — No sensitive data in logs"
SENSITIVE_LOGS=$(grep -rn 'console\.\(log\|info\|debug\|warn\)' apps/web/src/ --include='*.ts' --include='*.tsx' 2>/dev/null | grep -iE 'password|secret|token|key|credential|apiKey' | grep -v 'node_modules' | grep -v '// ' || true)

if [ -z "$SENSITIVE_LOGS" ]; then
  check_pass "No sensitive data in console output"
else
  check_fail "Potential sensitive data in logs:"
  echo "$SENSITIVE_LOGS" | head -5 | while read line; do echo "         $line"; done
fi

# ── S4: dangerouslySetInnerHTML with user data ───────────
echo "S4. XSS — dangerouslySetInnerHTML usage"
DANGEROUS_HTML=$(grep -rn 'dangerouslySetInnerHTML' apps/web/src/ --include='*.tsx' --include='*.ts' 2>/dev/null | grep -v 'node_modules' || true)
DANGEROUS_COUNT=$(echo "$DANGEROUS_HTML" | grep -c '.' || true)

if [ "$DANGEROUS_COUNT" -le 1 ]; then
  check_pass "dangerouslySetInnerHTML usage minimal ($DANGEROUS_COUNT instance — layout theme script)"
else
  check_warn "Multiple dangerouslySetInnerHTML usages ($DANGEROUS_COUNT):"
  echo "$DANGEROUS_HTML" | while read line; do echo "         $line"; done
fi

# ── S5: Direct fetch() with variable URLs ────────────────
echo "S5. SSRF — Direct fetch() usage"
DIRECT_FETCH=$(grep -rn 'fetch(' apps/web/src/lib/providers/ apps/web/src/lib/shopify* apps/web/src/lib/yever* 2>/dev/null | grep -v 'safeFetch' | grep -v 'node_modules' | grep -v '// ' | grep -v 'import' || true)

if [ -z "$DIRECT_FETCH" ]; then
  check_pass "No direct fetch() in provider code (using safeFetch)"
else
  check_warn "Direct fetch() calls (consider safeFetch for SSRF protection):"
  echo "$DIRECT_FETCH" | head -5 | while read line; do echo "         $line"; done
fi

# ── S6: Security headers in next.config ──────────────────
echo "S6. Headers — Security headers present"
if grep -q 'Strict-Transport-Security' apps/web/next.config.ts 2>/dev/null; then
  check_pass "HSTS header configured"
else
  check_fail "HSTS header missing in next.config.ts"
fi

if grep -q 'Content-Security-Policy' apps/web/next.config.ts 2>/dev/null; then
  check_pass "CSP header configured"
else
  check_fail "CSP header missing in next.config.ts"
fi

# ── S7: .env files not committed ─────────────────────────
echo "S7. Secrets — .env not in git"
if [ -d ".git" ]; then
  ENV_IN_GIT=$(git ls-files '*.env' '.env.*' 2>/dev/null | grep -v '.example' || true)
  if [ -z "$ENV_IN_GIT" ]; then
    check_pass ".env files not tracked by git"
  else
    check_fail ".env files tracked by git: $ENV_IN_GIT"
  fi
else
  check_warn "Not a git repo — cannot verify .env tracking"
fi

# ── S8: Source maps disabled ─────────────────────────────
echo "S8. Build — Source maps disabled"
if grep -q 'productionBrowserSourceMaps.*false' apps/web/next.config.ts 2>/dev/null; then
  check_pass "Production source maps disabled"
else
  check_warn "productionBrowserSourceMaps not explicitly set to false"
fi

# ── Summary ──────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════"
if [ "$VIOLATIONS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo -e "  ${GREEN}ALL CLEAR${NC} — No violations, no warnings"
elif [ "$VIOLATIONS" -eq 0 ]; then
  echo -e "  ${YELLOW}$WARNINGS warning(s)${NC} — Review recommended"
else
  echo -e "  ${RED}$VIOLATIONS violation(s)${NC}, ${YELLOW}$WARNINGS warning(s)${NC}"
fi
echo "══════════════════════════════════════════════"
echo ""

exit $VIOLATIONS
