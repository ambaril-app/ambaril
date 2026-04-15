# Tracking — Wave {N}

## Events

- [ ] `{module}.{action}` — trigger: {quando} | properties: {campos}

## Verification

```bash
grep -r "analytics.track\|posthog.capture" apps/web/app/admin/{module}/ --include="*.ts" --include="*.tsx"
```

Cada evento da spec §11 pertencente a esta wave DEVE ter chamada correspondente.
Evento ausente = fix antes de review.
