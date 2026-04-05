# ADR-016 — Module Profiles: Customização de Módulos por Tenant com AI

**Status:** APPROVED
**Date:** 2026-04-04
**Scope:** Platform (all modules)
**Depends on:** ADR-014 (Multi-tenancy), ADR-015 (Astro Runtime)

---

## 1. Contexto

Ambaril é multi-tenant. CIENA (moda streetwear) é o primeiro tenant. Para escalar para outros nichos de PRODUTO FÍSICO (alimentos, cosméticos, eletrônicos, cervejaria, joalheria), os módulos precisam ser customizáveis por tenant sem fork de código.

Cada nicho tem: campos específicos, etapas de produção diferentes, fórmulas de custo próprias, regras de negócio distintas, e automações particulares. Module Profiles resolvem isso com uma camada de configuração entre o schema base e a UI.

**Escopo**: Negócios de produto físico. Serviços (academia, clínica) ficam FORA deste ADR — requerem módulo Subscriptions separado (futuro).

---

## 2. Decisão

Adotar sistema de **Module Profiles**: configuração JSONB por tenant por módulo que customiza campos, terminologia, stages, fórmulas, regras, views e automações. Inclui **Expression Engine** para fórmulas e **Rule Engine** para automações, ambos com guardrails de segurança.

---

## 3. Arquitetura

### 3.1 Visão Geral

```
┌─────────────────────────────────────────────────────┐
│                    TENANT                            │
│                                                      │
│  Astro (Chat) ─── Genius KB ─── Module Profile      │
│       │            (contexto)    (config JSONB)      │
│       │                              │               │
│       └──── Gera profile ──→ Valida (Zod) ──→ Salva │
│                                      │               │
│                              ┌───────┴───────┐       │
│                              │ Expression    │       │
│                              │ Engine        │       │
│                              │ (fórmulas)    │       │
│                              └───────┬───────┘       │
│                                      │               │
│                              ┌───────┴───────┐       │
│                              │ Rule Engine   │       │
│                              │ (automações)  │       │
│                              └───────┬───────┘       │
│                                      │               │
│                              ┌───────┴───────┐       │
│                              │ Dynamic       │       │
│                              │ Renderer      │       │
│                              │ (UI)          │       │
│                              └───────────────┘       │
└─────────────────────────────────────────────────────┘
```

### 3.2 Schema

```sql
-- Em global schema
CREATE TABLE global.module_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES global.tenants(id),
  module          TEXT NOT NULL,
  profile_name    TEXT NOT NULL,
  base_template   TEXT,                           -- NULL se full custom
  config          JSONB NOT NULL,                 -- validado por meta-schema Zod
  version         INTEGER NOT NULL DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'active'  -- active | draft | archived
                  CHECK (status IN ('active', 'draft', 'archived')),
  created_by      TEXT NOT NULL,                  -- 'system' | 'ai-onboarding' | user_id
  ai_conversation_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,
  UNIQUE(tenant_id, module) WHERE status = 'active' AND deleted_at IS NULL
);

CREATE TABLE global.module_profile_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES global.module_profiles(id),
  version         INTEGER NOT NULL,
  config          JSONB NOT NULL,
  changed_by      TEXT NOT NULL,
  change_summary  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, version)
);

CREATE TABLE global.module_profile_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module          TEXT NOT NULL,
  industry        TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  config          JSONB NOT NULL,
  popularity      INTEGER DEFAULT 0,
  is_system       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(module, industry, name)
);

-- Indexes
CREATE INDEX idx_profiles_tenant_module ON global.module_profiles(tenant_id, module) WHERE deleted_at IS NULL;
CREATE INDEX idx_templates_module ON global.module_profile_templates(module, industry);
```

**RLS**: Mesmas policies de ADR-014. Profiles filtrados por `tenant_id`. Templates com `is_system=true` visíveis para todos.

### 3.3 Config Meta-Schema (Zod)

Cada módulo define seu próprio meta-schema. Todos compartilham estrutura base:

```typescript
// packages/shared/src/profiles/base-schema.ts

const CustomFieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]*$/), // snake_case only
  label: z.string().max(50),
  type: z.enum([
    "text",
    "number",
    "date",
    "select",
    "boolean",
    "currency",
    "url",
  ]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // for type=select
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
  show_in_table: z.boolean().default(true),
  show_in_card: z.boolean().default(true),
  show_condition: z.string().optional(), // Expression: "campo_x == true"
});

const StageSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]*$/),
  label: z.string().max(30),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  order: z.number().int().min(1),
  description: z.string().max(200).optional(),
  gate: z
    .object({
      conditions: z.array(
        z.object({
          field: z.string(),
          operator: z.enum([
            "filled",
            "equals",
            "not_equals",
            ">",
            "<",
            ">=",
            "<=",
            "in",
            "not_in",
            "contains",
          ]),
          value: z.unknown(),
          message: z.string().max(100),
        }),
      ),
    })
    .nullable()
    .default(null),
  skip_condition: z.string().nullable().default(null), // Expression
  skip_reason: z.string().optional(),
  auto_duration_field: z.string().optional(), // custom field key
});

const CalculatedFieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]*$/),
  label: z.string().max(50),
  formula: z.string().max(500), // Expression Engine formula
  description: z.string().optional(),
  show_in_table: z.boolean().default(false),
  color_rules: z
    .array(
      z.object({
        condition: z.string(), // Expression
        color: z.string(),
        badge: z.string().optional(),
      }),
    )
    .optional(),
});

const AutomationRuleSchema = z.object({
  name: z.string().max(60),
  trigger: z.string(), // "stage_changed:X", "field_updated:X", "calculated:X", "cron:X"
  condition: z.string(), // Expression (evaluated to boolean)
  action: z.enum([
    "notify_whatsapp",
    "notify_email",
    "notify_in_app",
    "notify_discord",
    "create_task",
    "update_field",
    "block_transition",
    "sync_erp",
    "create_inventory_movement",
    "escalate_priority",
  ]),
  params: z.record(z.string(), z.unknown()),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  cooldown_minutes: z.number().optional(),
  is_active: z.boolean().default(true),
});

const BaseProfileSchema = z.object({
  terminology: z.record(z.string(), z.string()).default({}),
  custom_fields: z.array(CustomFieldSchema).max(30), // max 30 custom fields per module
  calculated_fields: z.array(CalculatedFieldSchema).max(20),
  automations: z.array(AutomationRuleSchema).max(50),
  hidden_sections: z.array(z.string()).default([]),
});
```

**Module-specific schemas** extend base:

```typescript
// packages/shared/src/profiles/plm-schema.ts
const PlmProfileSchema = BaseProfileSchema.extend({
  stages: z.array(StageSchema).min(3).max(20),
  supplier_types: z.array(z.object({ key: z.string(), label: z.string() })),
  raw_material_categories: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      unit: z.string(),
    }),
  ),
  pilot_rules: z.object({
    enabled: z.boolean(),
    pilot_qty_range: z.tuple([z.number(), z.number()]),
    pilot_qty_unit: z.string().default("unidades"),
    monitoring_window_hours: z.number().default(72),
    champion_threshold: z.number().min(0).max(1).default(0.6),
    discontinue_threshold: z.number().min(0).max(1).default(0.3),
    scale_factor: z.number().default(10),
  }),
  approval_flow: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("binary_vote"),
      min_votes: z.number().default(3),
    }),
    z.object({
      type: z.literal("scoring"),
      min_tasters: z.number(),
      min_avg_score: z.number(),
      score_fields: z.array(CustomFieldSchema),
    }),
  ]),
});

// packages/shared/src/profiles/erp-schema.ts
const ErpProfileSchema = BaseProfileSchema.extend({
  stages: z.array(StageSchema).min(3).max(10), // Order FSM
  inventory_strategy: z.enum(["default", "fifo_by_expiry", "fifo_by_date"]),
  margin_calc: z.object({
    components: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        source: z.enum([
          "plm_cost",
          "manual",
          "avg_shipping_30d",
          "tax_rate",
          "gateway_rate",
        ]),
      }),
    ),
    formula: z.string(), // Expression
  }),
  dre_categories: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      source: z.enum([
        "manual",
        "auto_shipping",
        "auto_marketing",
        "auto_platform_fees",
      ]),
    }),
  ),
});

// Similar schemas for: crm, mensageria, trocas, creators, dam, marketing, b2b, tarefas, dashboard
```

---

## 4. Expression Engine

### 4.1 Propósito

Avaliar fórmulas e condições em calculated fields, automation conditions, stage gates e color rules. Funciona como "Excel formulas" — seguro, sandboxado, sem side effects.

### 4.2 Funções Permitidas (Whitelist)

```typescript
const EXPRESSION_FUNCTIONS = {
  // Matemática
  SUM: "(...args) => sum of arguments or array",
  AVG: "(...args) => average",
  MIN: "(...args) => minimum",
  MAX: "(...args) => maximum",
  ROUND: "(value, decimals) => rounded value",
  ABS: "(value) => absolute value",
  CEIL: "(value) => ceiling",
  FLOOR: "(value) => floor",

  // Lógica
  IF: "(condition, then, else) => conditional",
  AND: "(...conditions) => all true",
  OR: "(...conditions) => any true",
  NOT: "(condition) => negation",
  COALESCE: "(...values) => first non-null",

  // Comparação
  // Operadores: ==, !=, >, <, >=, <=, IN, NOT_IN, CONTAINS

  // Texto
  CONCAT: "(...strings) => concatenated",
  UPPER: "(text) => uppercase",
  LOWER: "(text) => lowercase",
  LEN: "(text) => length",
  CONTAINS: "(text, search) => boolean",
  LEFT: "(text, n) => first n chars",
  RIGHT: "(text, n) => last n chars",

  // Data
  TODAY: "() => current date",
  NOW: "() => current datetime",
  DAYS_BETWEEN: "(date1, date2) => integer days",
  ADD_DAYS: "(date, n) => new date",
  FORMAT_DATE: "(date, format) => string",

  // Agregação (para calculated fields em listas)
  COUNT: "(array) => count",
  COUNT_IF: "(array, condition) => conditional count",
  SUM_IF: "(array, value_field, condition) => conditional sum",
  FILTER: "(array, condition) => filtered array",
} as const;
```

### 4.3 Implementação Técnica

```typescript
// packages/shared/src/expressions/engine.ts

import { parse } from "./parser"; // Recursive descent parser OU expr-eval lib
import { validate } from "./validator";

interface ExpressionContext {
  fields: Record<string, unknown>; // campos do registro atual
  custom_fields: Record<string, unknown>; // custom fields do profile
  functions: typeof EXPRESSION_FUNCTIONS;
}

export function evaluateExpression(
  formula: string,
  context: ExpressionContext,
  options: { timeout_ms?: number; max_depth?: number } = {},
): ExpressionResult {
  const { timeout_ms = 100, max_depth = 10 } = options;

  // 1. Parse formula to AST
  const ast = parse(formula);

  // 2. Validate AST: only whitelisted functions, no loops, max depth
  const validation = validate(ast, {
    allowedFunctions: Object.keys(EXPRESSION_FUNCTIONS),
    allowedFields: [
      ...Object.keys(context.fields),
      ...Object.keys(context.custom_fields),
    ],
    maxDepth: max_depth,
  });
  if (!validation.valid) {
    return { success: false, error: validation.errors };
  }

  // 3. Evaluate with timeout
  const startTime = performance.now();
  try {
    const result = evaluateAST(ast, context, startTime, timeout_ms);
    return { success: true, value: result };
  } catch (e) {
    if (e instanceof TimeoutError) {
      return { success: false, error: "Formula exceeded 100ms timeout" };
    }
    if (e instanceof DivisionByZeroError) {
      return { success: false, error: "Division by zero", value: null };
    }
    return { success: false, error: String(e) };
  }
}
```

### 4.4 Segurança — 6 Camadas

| Camada             | Proteção                            | Como                                                  |
| ------------------ | ----------------------------------- | ----------------------------------------------------- |
| 1. Parser          | Rejeita syntax inválida             | Recursive descent, nunca `eval()` ou `new Function()` |
| 2. Whitelist       | Só funções permitidas               | AST validation contra `EXPRESSION_FUNCTIONS`          |
| 3. Field whitelist | Só campos do módulo + custom fields | AST validation contra `context.fields`                |
| 4. Timeout         | Fórmulas lentas = erro              | 100ms hard limit via `performance.now()` check        |
| 5. Depth limit     | Sem recursão profunda               | Max 10 níveis de nested expressions                   |
| 6. No side effects | Fórmulas só LEEM, nunca ESCREVEM    | Nenhuma função no whitelist faz mutação               |

### 4.5 Decisão de Lib

**Opção recomendada**: `expr-eval` (npm, 0 deps, ~8KB, well-maintained, supports custom functions)

- Alternativa: `mathjs` (mais completo mas 500KB+, overkill)
- Alternativa: Custom recursive descent (máximo controle, mais trabalho)

`expr-eval` precisa de wrapper para:

- Adicionar funções de data (TODAY, DAYS_BETWEEN)
- Adicionar funções de agregação (SUM_IF, COUNT_IF)
- Adicionar field resolution para custom_fields
- Adicionar timeout mechanism

### 4.6 Performance

**Calculated fields em listagens:**

- Problema: 1000 rows × 5 formulas = 5000 evaluations per page
- Solução: **Materialized cache** — cron job avalia fórmulas e grava resultado em coluna `_calc_cache JSONB` da tabela. Invalidação: quando inputs mudam (trigger) ou diário
- Listagem lê do cache. Detail page avalia em real-time
- Se cache não existe: evaluate on-the-fly (degraded mode, timeout per-row = 10ms)

**Automation conditions:**

- Avaliadas no momento do evento (não em batch)
- Single evaluation por evento × automations ativas
- 50 automations × 1 condition = ~50 evaluations (< 5ms total)

---

## 5. Rule Engine

### 5.1 Propósito

Executar automações QUANDO/ENTÃO. Trigger → Condition (Expression Engine) → Action (predefined).

### 5.2 Trigger Types

```typescript
type TriggerType =
  | `stage_changed:${string}` // PLM, ERP, Trocas: stage transitioned
  | `stage_completed:${string}` // PLM: stage completed
  | `field_updated:${string}` // Any: field value changed
  | `calculated:${string}` // Calculated field value meets condition
  | `entity_created:${string}` // New record created
  | `entity_deleted:${string}` // Record soft-deleted
  | `cron:${CronPreset}` // Time-based: daily, weekly, monthly, custom
  | `integration:${string}`; // External webhook received

type CronPreset =
  | "daily_08:00"
  | "daily_18:00"
  | "weekly_monday"
  | "weekly_friday"
  | "monthly_1st"
  | "monthly_15th"
  | `custom:${string}`; // Cron expression (validated)
```

### 5.3 Action Types (Predefined)

```typescript
type ActionType =
  // Notificação
  | "notify_whatsapp" // Send WA template to contact/user
  | "notify_email" // Send email via Resend
  | "notify_in_app" // In-app notification (Flare)
  | "notify_discord" // Discord channel message

  // Criação
  | "create_task" // Create task in Tarefas module
  | "create_inventory_movement" // Create movement in ERP

  // Atualização
  | "update_field" // Update a field on the current entity
  | "escalate_priority" // Increase priority one level

  // Controle de fluxo
  | "block_transition" // Prevent stage advancement (with message)
  | "auto_advance_stage" // Automatically advance to next stage

  // Integração
  | "sync_erp" // Sync data to ERP module
  | "webhook_external"; // POST to external URL (with safeFetch)
```

**Novas ações NÃO podem ser inventadas pelo tenant ou AI.** Só as listadas acima. Cada ação tem um executor server-side com validação própria.

### 5.4 Cross-Module Event Bus

```sql
-- Tabela de eventos do tenant (PostgreSQL-based, não Redis)
CREATE TABLE global.tenant_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  event_type      TEXT NOT NULL,          -- 'erp.stock_low', 'plm.stage_completed', etc.
  source_module   TEXT NOT NULL,          -- 'erp', 'plm', 'crm', etc.
  source_entity_id UUID,
  payload         JSONB NOT NULL,         -- event data
  processed       BOOLEAN DEFAULT false,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_unprocessed ON global.tenant_events(tenant_id, processed, created_at)
  WHERE processed = false;
```

**Flow:**

1. Módulo emite evento: `INSERT INTO tenant_events (...)`
2. PostgreSQL NOTIFY 'tenant_events'
3. Background worker (Vercel Cron, 1min interval) picks up unprocessed events
4. For each event: find matching automation rules across ALL modules for that tenant
5. Evaluate condition (Expression Engine)
6. If true: execute action
7. Mark event as processed

**Retry:** Failed actions retry 3x with exponential backoff. After 3 failures: log to `global.audit_logs` + notify admin.

**Dead letter:** Events unprocessed after 1 hour → alert.

### 5.5 Automation Execution Safety

| Guardrail                                | Why                    | Implementation                                                                           |
| ---------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| Max 50 automations per module per tenant | Prevent abuse          | Zod validation on profile save                                                           |
| Cooldown per automation                  | Prevent spam           | `cooldown_minutes` + check last execution                                                |
| Max 100 actions per hour per tenant      | Rate limit             | Counter in tenant_events                                                                 |
| No circular triggers                     | Prevent infinite loops | `_triggered_by` field in event; if event was triggered by automation, skip re-evaluation |
| Dry run mode                             | Test without sending   | `is_test: true` flag logs action without executing                                       |
| Action audit trail                       | Accountability         | Every action logged in `global.audit_logs`                                               |

---

## 6. Dynamic Rendering

### 6.1 Component Architecture

```typescript
// packages/ui/src/dynamic/DynamicField.tsx
// Renders a single field based on profile config
interface DynamicFieldProps {
  config: CustomFieldSchema; // from module profile
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
}

// Renders: text input, number input, date picker, select, boolean toggle,
// currency input, URL input — based on config.type
// Validation: config.validation applied on blur
// Visibility: config.show_condition evaluated by Expression Engine

// packages/ui/src/dynamic/DynamicTable.tsx
// Renders a data table with custom columns from profile
interface DynamicTableProps {
  data: Record<string, unknown>[];
  baseColumns: ColumnDef[]; // standard module columns
  customFields: CustomFieldSchema[]; // from profile
  calculatedFields: CalculatedFieldSchema[];
  sortable?: boolean;
  filterable?: boolean;
}

// Merges base columns + custom field columns + calculated field columns
// Calculated columns evaluate formula per row (from cache if available)
// Color rules applied to calculated columns

// packages/ui/src/dynamic/DynamicKanban.tsx
// Renders kanban board with dynamic stages from profile
interface DynamicKanbanProps {
  items: Record<string, unknown>[];
  stages: StageSchema[]; // from profile
  currentStageField: string;
  onStageChange: (itemId: string, newStage: string) => void;
  gates?: Record<string, GateConfig>; // from profile
}

// Renders columns for each stage in profile
// Gate evaluation: before drag-drop, evaluate gate conditions
// If gate fails: show toast with gate.condition.message, prevent move
```

### 6.2 Hidden Sections

```typescript
// packages/shared/src/profiles/section-visibility.ts

// Each module defines its hideable sections
const PLM_SECTIONS = ['suppliers', 'raw_materials', 'bom', 'rework', 'pilot', 'cost_analysis'] as const
const ERP_SECTIONS = ['shipping', 'nfe', 'margin_calc', 'dre', 'tier_classification'] as const
// etc.

// Hook
function useSectionVisible(module: string, section: string): boolean {
  const profile = useModuleProfile(module)
  return !profile.hidden_sections.includes(section)
}

// Usage in component
function PlmDetailPage() {
  const showBom = useSectionVisible('plm', 'bom')
  const showSuppliers = useSectionVisible('plm', 'suppliers')

  return (
    <>
      <StagesTimeline />
      {showBom && <BomSection />}
      {showSuppliers && <SuppliersSection />}
      <CostSection fallback={!showBom} /> {/* simplified cost if no BOM */}
    </>
  )
}
```

**Regra**: Quando uma section é hidden, todas as referências a ela devem degradar graciosamente:

- Cost analysis sem BOM = inputs manuais (não calculados do BOM)
- PLM sem suppliers = fornecedores não trackados (campo texto livre)
- ERP sem shipping = pedido vai de "paid" direto para "delivered" (sem separating/shipped)

### 6.3 Profile Loading

```typescript
// packages/shared/src/profiles/use-profile.ts

// Server-side: load profile per request
async function getModuleProfile(
  tenantId: string,
  module: string,
): Promise<ModuleProfile> {
  // 1. Check in-memory cache (per-request, via React cache())
  // 2. If miss: SELECT FROM module_profiles WHERE tenant_id AND module AND status='active'
  // 3. If no profile: return DEFAULT_PROFILE[module] (CIENA's current config)
  // 4. Validate with Zod meta-schema (runtime safety)
  // 5. Return typed profile
}

// Client-side: React context
const ModuleProfileContext = createContext<ModuleProfile>(DEFAULT_PROFILE);

function useModuleProfile(module?: string): ModuleProfile {
  return useContext(ModuleProfileContext);
}
```

**Default profiles**: CIENA's current configuration becomes the "default" profile for each module. Tenants without custom profiles get CIENA's layout. This ensures backward compatibility.

---

## 7. Dynamic Stages (PLM + ERP + Trocas)

### 7.1 Migration: Enum → TEXT

**Problema**: `pcp.stage_type` é um PostgreSQL enum com 11 valores fixos. Tenants customizados precisam de stages diferentes.

**Solução**: Migrar de enum para TEXT com CHECK constraint dinâmico.

```sql
-- Migration step 1: Add new column
ALTER TABLE pcp.production_stages ADD COLUMN stage_key TEXT;

-- Migration step 2: Copy data
UPDATE pcp.production_stages SET stage_key = stage_type::TEXT;

-- Migration step 3: Drop enum column, rename
ALTER TABLE pcp.production_stages DROP COLUMN stage_type;
ALTER TABLE pcp.production_stages RENAME COLUMN stage_key TO stage_type;
ALTER TABLE pcp.production_stages ALTER COLUMN stage_type SET NOT NULL;

-- Migration step 4: Add CHECK that validates against profile
-- (This is a runtime check, not a static constraint)
-- Validation happens in server action, not in DB constraint
-- DB only enforces NOT NULL
```

**Drizzle ORM change**: `stage_type` goes from `pgEnum(...)` to `text('stage_type').notNull()`. TypeScript type becomes `string` validated at runtime against profile.

**Same approach for**: `erp.orders.status` (order FSM) and `trocas.exchange_requests.status` (exchange FSM).

### 7.2 Stage Transition Validation

```typescript
// packages/shared/src/profiles/stage-engine.ts

async function validateStageTransition(
  profile: ModuleProfile,
  currentStage: string,
  targetStage: string,
  entityData: Record<string, unknown>,
): Promise<{ allowed: boolean; errors: string[] }> {
  const stages = profile.stages;
  const currentIdx = stages.findIndex((s) => s.key === currentStage);
  const targetIdx = stages.findIndex((s) => s.key === targetStage);

  // 1. Target must exist in profile
  if (targetIdx === -1)
    return { allowed: false, errors: ["Stage não existe no profile"] };

  // 2. Target must be next in sequence (or regression if allowed)
  const isForward = targetIdx === currentIdx + 1;
  const isRegression = targetIdx < currentIdx; // allowed in PLM with reason
  if (!isForward && !isRegression) {
    return {
      allowed: false,
      errors: ["Transição inválida: deve ser próximo stage ou regressão"],
    };
  }

  // 3. Evaluate gate conditions (if target stage has gate)
  const targetConfig = stages[targetIdx];
  if (targetConfig.gate) {
    const errors: string[] = [];
    for (const condition of targetConfig.gate.conditions) {
      const fieldValue =
        entityData[condition.field] ??
        entityData.custom_fields?.[condition.field];
      const result = evaluateGateCondition(condition, fieldValue);
      if (!result) errors.push(condition.message);
    }
    if (errors.length > 0) return { allowed: false, errors };
  }

  // 4. Check skip_condition for auto-skipping
  if (targetConfig.skip_condition) {
    const shouldSkip = evaluateExpression(targetConfig.skip_condition, {
      fields: entityData,
    });
    if (shouldSkip.success && shouldSkip.value === true) {
      // Auto-skip this stage, try next one
      const nextStage = stages[targetIdx + 1];
      if (nextStage) {
        return validateStageTransition(
          profile,
          currentStage,
          nextStage.key,
          entityData,
        );
      }
    }
  }

  return { allowed: true, errors: [] };
}
```

---

## 8. Inventory Strategies (ERP)

### 8.1 Strategies

```typescript
type InventoryStrategy = "default" | "fifo_by_expiry" | "fifo_by_date";

// default: any unit of the SKU can fulfill the order (current behavior)
// fifo_by_expiry: select lot with earliest expiry date
// fifo_by_date: select lot with earliest entry date (FIFO by arrival)
```

### 8.2 Implementation

```typescript
// Server action: fulfill order line item
async function selectInventoryForFulfillment(
  tenantId: string,
  skuId: string,
  quantity: number,
  strategy: InventoryStrategy,
): Promise<InventoryAllocation[]> {
  switch (strategy) {
    case "default":
      // Current behavior: just check total available >= quantity
      return [{ skuId, quantity, lot: null }];

    case "fifo_by_expiry":
      // Select lots ordered by custom_fields.validade ASC
      const lots = await db
        .select()
        .from(erp.inventory_movements)
        .where(and(eq(tenantId), eq(skuId), gt(quantityAvailable, 0)))
        .orderBy(asc(sql`custom_fields->>'validade'`));

      return allocateFromLots(lots, quantity);

    case "fifo_by_date":
    // Select lots ordered by created_at ASC
    // Similar but ordered by entry date
  }
}
```

**Lot tracking**: When `inventory_strategy != 'default'`, each inventory movement tracks `lot_id` in its `notes` or a new `lot_reference` TEXT field. This enables lot-level traceability.

---

## 9. Profile Migrations

### 9.1 Quando Profile Muda

Tenant edita profile (adiciona campo, remove stage, muda fórmula). Dados existentes precisam ser compatíveis.

### 9.2 Regras de Migração

```typescript
interface ProfileMigration {
  fields_added: Array<{ key: string; default_value: unknown }>;
  // → Existing records: custom_fields[key] = NULL (or default)
  // → New records: normal validation

  fields_removed: Array<{ key: string }>;
  // → Existing records: custom_fields[key] moved to custom_fields._archived
  // → Existing records NOT deleted (data preservation)
  // → Field stops showing in UI

  fields_type_changed: Array<{ key: string; from: string; to: string }>;
  // → BLOCKED unless data is compatible (e.g., text→number only if all values are numeric)
  // → UI shows warning: "X records have incompatible data"

  stages_added: Array<{ key: string; after: string }>;
  // → Existing records in later stages: unaffected (already past new stage)
  // → Records in stage before new stage: new stage appears as "skipped"

  stages_removed: Array<{ key: string; move_to: string }>;
  // → Records currently in removed stage: moved to move_to stage
  // → Historical records: stage_type preserved but marked "(removed)"

  stages_renamed: Array<{ from: string; to: string }>;
  // → UPDATE all records with old key → new key

  automations_broken: Array<{ name: string; reason: string }>;
  // → Deactivated with reason
  // → Tenant notified: "Automation X was deactivated because field Y was removed"
}
```

### 9.3 Migration Flow

```
Tenant edits profile → System generates migration plan
  → Show migration preview to tenant
  → Tenant approves ("Entendo que 5 automações serão desativadas")
  → Execute migration in transaction
  → Save new profile version
  → Log in audit_logs
```

---

## 10. AI Onboarding (Genius + Astro)

### 10.1 Genius Etapa 4: Module Profiling

Extension of existing onboarding grill (Etapas 1-3):

```
Etapa 4 — Module Profiling (per module activated by tenant)

PLM Interview (8 perguntas):
1. "Quantas etapas tem seu processo de fabricação? Descreva cada uma."
2. "Você trabalha com lotes? Cada lote tem validade?"
3. "Que matérias-primas você usa? (ex: tecidos, ingredientes, componentes)"
4. "Você faz testes/amostras antes de produzir em escala?"
5. "Como você aprova um produto novo? Voto da equipe? Teste com clientes?"
6. "Que informações você precisa rastrear por produto que não são padrão?"
7. "Quando algo dá errado na produção, como você lida? (retrabalho, descarte)"
8. "Quais alertas seriam urgentes pra você? (atraso, qualidade, custo)"

ERP Interview (6 perguntas):
1. "Seus produtos têm validade? Precisam de controle de lote?"
2. "Tem alguma etapa especial entre pagamento e envio?"
3. "Quais custos compõem o preço do seu produto?"
4. "Que categorias de despesa você acompanha no financeiro?"
5. "Que alertas de estoque seriam críticos?"
6. "Você vende em que canais? (site, marketplace, loja física)"

CRM Interview (5 perguntas):
1. "Que informações extras você gostaria de saber sobre seus clientes?"
2. "O que define um 'bom cliente' no seu negócio?"
3. "Que mensagens automáticas fariam sentido? (aniversário, volta de produto)"
4. "Seus clientes lidam com dados sensíveis? (saúde, financeiro)"
5. "Como você segmenta seus clientes hoje?"

// Similar scripts for each module
```

### 10.2 Astro Profile Generation

```
1. Astro (Claude Sonnet) conducts interview
2. Genius stores responses as entries (sector: "module_profiling")
3. Astro (Gemini Flash) generates profile config JSON
4. System validates with Zod meta-schema
5. If invalid: Astro re-generates with error context
6. If valid: show preview to tenant
7. Tenant reviews:
   - "Seus stages de produção serão: receita → compra → brassagem → fermentação → ..."
   - "Campos extras: ABV, IBU, OG, FG, lote, validade"
   - "Alertas: validade próxima, fermentação atrasada"
8. Tenant approves or requests changes
9. Profile saved to module_profiles
```

### 10.3 UX: 3 Níveis de Customização

```
Nível 1 — Template (1 clique)
  "Escolha seu perfil: [Moda] [Alimentos] [Cosméticos] [Eletrônicos] [Outro]"
  → Aplica template pré-built. Done.
  → 80% dos tenants ficam aqui.

Nível 2 — Tweak (5 minutos)
  Template aplicado + formulário de edição
  → Adicionar/remover custom fields
  → Renomear stages
  → Ajustar thresholds
  → 15% dos tenants.

Nível 3 — AI-Assisted (10-15 minutos)
  "Meu nicho é diferente" → Chat com Astro
  → Interview completa
  → Profile gerado + preview
  → 5% dos tenants.
```

---

## 11. Pre-built Templates (Phase 1)

| Módulo | Template             | Indústria                    | Priority   |
| ------ | -------------------- | ---------------------------- | ---------- |
| PLM    | streetwear-default   | Moda streetwear              | P0 (CIENA) |
| PLM    | fashion-generic      | Moda genérica                | P1         |
| PLM    | food-artisanal       | Alimentos artesanais         | P1         |
| PLM    | cosmetics            | Cosméticos/skincare          | P1         |
| PLM    | electronics          | Eletrônicos/acessórios       | P2         |
| ERP    | ecommerce-default    | E-commerce geral             | P0         |
| ERP    | food-perishable      | Perecíveis (FIFO)            | P1         |
| ERP    | electronics-warranty | Eletrônicos (garantia)       | P2         |
| CRM    | fashion-brand        | Marca de moda                | P0         |
| CRM    | food-brand           | Marca de alimentos           | P1         |
| CRM    | general-ecommerce    | E-commerce genérico          | P1         |
| Trocas | standard-30d         | 30 dias, devolução física    | P0         |
| Trocas | perishable-7d        | 7 dias, sem devolução        | P1         |
| Trocas | electronics-90d      | 90 dias, assistência técnica | P2         |

---

## 12. Integration Contracts (Cross-Module Safety)

### 12.1 Problema

Quando PLM profile muda stages, Tarefas (que auto-cria tasks por stage) pode quebrar. Dashboard (que mostra métricas por stage) pode quebrar. Mensageria (que envia notificação por stage) pode quebrar.

### 12.2 Solução

Cada module profile declara seus **Integration Points**:

```typescript
interface IntegrationContract {
  events_emitted: Array<{
    event_type: string;
    payload_schema: z.ZodSchema;
  }>;
  fields_exposed: Array<{
    field_key: string;
    type: string;
    description: string;
  }>;
  stages_exposed: Array<{
    stage_key: string;
    label: string;
  }>;
}
```

Quando um profile é editado, o sistema valida:

1. Quais outros módulos referenciam os events/fields/stages deste profile
2. Se alguma referência seria quebrada pela mudança
3. Mostra warning: "Mudar o stage 'fermentacao' para 'maturacao' vai afetar: 2 automações no Mensageria, 1 widget no Dashboard"
4. Tenant decide se continua

---

## 13. Timing

**Pre-requisitos**: Módulos base (ERP, PLM, Dashboard) estáveis com CIENA.

**Phase A (S14-16, ~310h):**

1. Expression Engine (30h)
2. Rule Engine + Event Bus (50h)
3. Dynamic Stages migration (20h)
4. Dynamic FSM (30h)
5. FIFO inventory (15h)
6. Module Profiles table + CRUD (20h)
7. Dynamic Rendering components (50h)
8. Approval flow abstraction (15h)
9. AI Onboarding (30h)
10. 10 profile templates (20h)
11. Integration Contracts (15h)
12. Recurring tasks (Tarefas) (15h)

**Definition of Done**: Marcus testa onboarding de tenant "cervejaria artesanal" no browser, com PLM customizado, ERP FIFO, e Dashboard com widgets de validade. Tudo funcional.

---

## 14. Decisões Explícitas

| #   | Decisão                                                              | Razão                                                       |
| --- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| D1  | Fórmulas via Expression Engine, NUNCA eval()/Function()              | Segurança. Sandbox total.                                   |
| D2  | Actions predefinidas (whitelist), tenant NÃO inventa ações           | Controlabilidade. Novas ações = PR no código.               |
| D3  | Enum→TEXT para stages dinâmicos                                      | Flexibilidade > type safety estática (Zod cobre runtime)    |
| D4  | PostgreSQL event bus, NÃO Redis/Kafka                                | Simplicity. 100 tenants não justifica infra adicional       |
| D5  | FIFO como strategy, não como default                                 | Backward compat. CIENA não precisa de FIFO.                 |
| D6  | Max 30 custom fields por módulo                                      | Performance (GIN index) + UX (formulário não vira infinito) |
| D7  | Max 50 automations por módulo por tenant                             | Prevent abuse + facilitar debugging                         |
| D8  | Profile versioning obrigatório                                       | Rollback. Nunca perder config anterior.                     |
| D9  | Default profile = CIENA's config                                     | Backward compat. Zero mudança para CIENA.                   |
| D10 | Serviços (assinatura) FORA deste ADR                                 | Escopo. Requer módulo Subscriptions separado (futuro).      |
| D11 | Fiscal (CFOP, ICMS) delegado para provider                           | Complexidade fiscal > escopo Ambaril. Focus NFe calcula.    |
| D12 | `expr-eval` como lib de expressões (subject to prototype validation) | Zero deps, 8KB, customizável, well-maintained               |
