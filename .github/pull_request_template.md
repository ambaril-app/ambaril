## Summary

<!-- 1-3 bullet points describing what this PR does -->

## Module

<!-- Which Ambaril module does this affect? (ERP, PLM, Dashboard, etc.) -->

## Type

- [ ] Feature (new functionality)
- [ ] Bug fix
- [ ] Refactor (no behavior change)
- [ ] Infrastructure / CI
- [ ] Documentation

## Checklist

- [ ] TypeScript strict — no `any`, no `@ts-ignore`
- [ ] Tests written for new business logic
- [ ] Cross-tenant isolation verified (tenant_id in all queries)
- [ ] DS.md compliance checked (if UI changes)
- [ ] Security directives followed (S1-S12)
- [ ] No hardcoded secrets or PII in code/logs
- [ ] Money handled in integer cents (money.ts)
- [ ] Interface text in PT-BR

## Test Plan

<!-- How to verify this works? Include manual testing steps if applicable -->

## Rollback Plan

<!-- How to undo this if something goes wrong? Feature flag? Git revert? -->

## Screenshots

<!-- If UI changes, include before/after screenshots -->
