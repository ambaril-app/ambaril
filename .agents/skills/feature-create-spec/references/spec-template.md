# Spec: {Module Or Feature Name}

---

status: draft
owner: {name}
source_artifact: {approved pitch path or cycle path}
approved_by: pending
supersedes: null

---

**Appetite:** {1-2 weeks | 6 weeks}

## 1. Vision

{Proposito, usuarios, ferramenta que substitui, resultado de negocio.}

## 2. User Journeys

### {Role 1}

1. {passo a passo}

### {Role 2}

1. ...

## 3. Data Model

{Entidades novas ou extensoes. Convencoes: tenant_id, UUIDs v7, NUMERIC(12,2), timestamps, soft delete, nomes EN.}

## 4. Business Rules

1. {Regra testavel e sem ambiguidade}
2. ...

## 5. Permissions

| Role   | Permissions                  |
| ------ | ---------------------------- |
| admin  | {module}:\*                  |
| {role} | {module}:{resource}:{action} |

## 6. Integrations

| Provider | Capability | Data In | Data Out | Sync   |
| -------- | ---------- | ------- | -------- | ------ |
| {name}   | {cap}      | {reads} | {writes} | {mode} |

## 7. Interfaces

{Server actions, endpoints, jobs, events, UI contracts.}

| Action / Route | Input        | Output     | Permission        |
| -------------- | ------------ | ---------- | ----------------- |
| {name}         | {Zod schema} | {response} | {resource:action} |

## 8. UI Notes

{Se houver UI: declarar archetype, energy level, role principal, acao principal, baseline do Design Lab, copy/tom, estados obrigatorios, mobile constraints, empty states. ASCII wireframes para telas principais.}

- **Archetype:** {dashboard | table | form | detail | chat | kanban | calendar | gantt | notifications | empty-state | settings | outro justificado}
- **Energy level:** {Level 0 | Level 1 | Level 2}
- **Primary role:** {who}
- **Primary action:** {verb + object}
- **Design Lab baseline:** {path or N/A with justification}
- **States:** {loading | empty | error | success | permission}
- **Copy contract notes:** {PT-BR factual / motivational exceptions / prohibited hype}

## 9. Security

### Security Checklist

- [ ] Sandbox vs production strategy para cada provider
- [ ] Campos PII identificados (quais, retencao, acesso)
- [ ] Rate limiting para endpoints publicos
- [ ] Permissoes auditadas (menor privilegio)
- [ ] Audit logging para operacoes sensiveis
- [ ] Validacao Zod em todo input externo

## 10. Cross-Module Dependencies

| Direction | Module   | Data/Event | Contract  |
| --------- | -------- | ---------- | --------- |
| consumes  | {module} | {data}     | {como}    |
| publishes | {module} | {event}    | {formato} |

## 11. Tracking And Analytics

### Events

| Event             | Trigger | Properties | Module   |
| ----------------- | ------- | ---------- | -------- |
| {module}.{action} | {when}  | {fields}   | {module} |

### Funnels

- {step 1} → {step 2} → {conversion}

### Success Metrics

- {KPI}: {definition}

## 12. Change Safety Notes

- **Change class:** {ui-local | module | cross-module | auth-tenant | schema-migration | provider-webhook | financial-fiscal}
- **Risk tier:** {low | medium | high | critical}
- **Blast radius:** {who/what affected}
- **Regression requirements:** {what to test beyond the slice}
- **Release strategy:** {direct | feature-flag | tenant-allowlist | staged-rollout | manual-only}
- **Rollback strategy:** {how to disable, revert, handle written data}
- **Observability checks:** {logs, metrics, alerts, abort signals}

## State Scan Index

- Module: `{module-slug}`
- Tables: `{table_a}`, `{table_b}` | `none`
- Routes: `{GET /path}`, `{POST /path}` | `none`
- Permissions: `{module}:{resource}:{action}` | `none`
- Events: `{module.event_name}` | `none`
- Providers: `{provider_name}` | `none`
