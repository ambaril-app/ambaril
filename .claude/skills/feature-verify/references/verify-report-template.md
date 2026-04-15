## Feature Verify Report: {Feature Or Module}

### Decision

- Status: {green | yellow | red}
- Safe to push: {yes | no}
- Safe to open PR: {yes | no}
- Risk tier: {low | medium | high | critical}
- Ceremony level: {light | standard | full}

### Scope

- Plan: {path}
- Spec: {path}
- Base branch: {main | other}
- Diff summary: {files touched, key areas}

### Checks Executed

- Type check: {pass | fail | skipped (not configured)}
- Lint: {pass | fail | skipped (not configured)}
- Build: {pass | fail | skipped (not configured)}
- Fast test gate: {pass | fail | skipped (not configured)}
- Schema baseline gate: {pass | fail | skipped (not configured)}
- Full test gate: {pass | fail | skipped (not configured)}
- Security scan: {pass | fail | skipped (not configured)}
- State scan evidence: {verified | missing | skipped (not configured)}
- Regression set: {executed set}

### Findings

#### [Blocker | High | Medium | Low] {Title}

- Impact: {what can break}
- Evidence: {command output summary or file reference}
- Resolution: {auto-fixed | pending decision | deferred}

### Auto-Fix Log

- Fix cycle count: {N}
- Issues auto-fixed: {count and short list}
- Issues not auto-fixable: {count and short list}

### Security Review

- ASVS coverage: {controls with evidence / total required | N/A — no security checklist}
- Lethal trifecta: {N/A | 0/3 | 1/3 | 2/3 | 3/3→BLOCKED}
- AI helpers gate: {pass | fail | N/A}
- Tenant isolation: {pass | fail | N/A — single tenant}

### UI/DS Validation (if applicable)

- DS compliance: {pass | fail | skipped (not configured)}
- Responsive/mobile checks: {pass | fail | skipped}
- Accessibility baseline: {pass | fail | skipped}

### Release Safety (medium+)

- Release checklist: {ready | missing | skipped (not configured)}
- Release approval package: {ready | missing | skipped (not configured)}
- Rollback path: {defined | missing}
- Observability checks: {defined | missing}

### Recommendation

- Next action: {push | open-pr | block}
- Human decision needed: {yes | no}
- Notes: {short}
