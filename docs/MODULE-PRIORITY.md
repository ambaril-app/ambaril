# Ambaril Module Priority

## Implementation Order (as of 2026-04-24)

| Priority | Module     | Justification                                          | Status  |
| -------- | ---------- | ------------------------------------------------------ | ------- |
| 1        | ERP        | Core business — orders, inventory, suppliers, invoices | IDEA    |
| 2        | Dashboard  | Operational visibility — depends on ERP data           | Pending |
| 3        | PLM        | Product management — feeds into ERP                    | Pending |
| 4        | Tarefas    | Team productivity — standalone                         | Pending |
| 5        | CRM        | Customer management — builds on ERP contacts           | Pending |
| 6        | Mensageria | Customer communication — needs CRM contacts            | Pending |
| 7        | Creators   | Creator collaboration — needs PLM products             | Pending |
| 8        | DAM        | Digital assets — supports PLM/Marketing                | Pending |
| 9        | Marketing  | Campaigns — needs CRM + Mensageria                     | Pending |
| 10       | Trocas     | Exchanges/returns — needs ERP orders                   | Pending |
| 11       | B2B        | Wholesale — needs ERP + PLM mature                     | Pending |

## AI Layers

| Layer                  | Depends On              | Status  |
| ---------------------- | ----------------------- | ------- |
| Tino AI (assistant)    | ERP + CRM               | Pending |
| Astro AI (analytics)   | Dashboard + all modules | Pending |
| Genius AI (innovation) | All modules mature      | Pending |

## Rules

- One module at a time through the lifecycle (IDEA → DONE)
- Each module must complete feature-verify before starting the next
- Dependencies noted above are soft — a module can start spec if its dependency is in EXECUTING
- B2B scope is intentionally vague — needs a pitch to define boundaries
