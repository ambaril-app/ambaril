# Platform Onboarding & Integration Catalog — Module Spec

> **Module:** Platform Onboarding & Integration Catalog
> **Schema:** `global` (extends existing)
> **Route prefix (admin):** `/api/v1/admin/onboarding`, `/api/v1/admin/integrations`
> **Admin UI route group:** `(admin)/onboarding/*`, `(admin)/settings/integrations/*`
> **Version:** 1.0
> **Date:** March 2026
> **Status:** Approved
> **Replaces:** Nothing (new capability)
> **References:** [DATABASE.md](../../architecture/DATABASE.md), [AUTH.md](../../architecture/AUTH.md), [API.md](../../architecture/API.md), [IMPLEMENTATION.md](../../IMPLEMENTATION.md), [DS.md](../../DS.md)

---

## 1. Purpose & Scope

The Onboarding module is the **entry point** for every tenant in Ambaril. It covers:

**A. Tenant Setup (first admin access)**
- 3-step wizard: Empresa → Equipe → Integrações
- Executed once on the admin's first login
- Result: tenant configured with at least 1 active integration

**B. Integration Catalog (`/admin/settings/integrations`)**
- Grid of providers grouped by capability
- OAuth or API key connection per provider
- Test connection + health monitoring + sync status
- Permanently available (not just during setup)

**C. Module Activation Checklist**
- Each module declares required capabilities
- Setup wizard per module (executed on first access)
- Persistent activation checklist on the dashboard

**D. Adopt Running Operation**
- Detect existing data in connected integrations
- Suggest automatic import
- Link existing entities

**Core responsibilities:**

| Capability | Description |
|---|---|
| Tenant registration | Company data (name, CNPJ, logo, domain) |
| Team setup | Invite members with RBAC roles |
| Integration catalog | Provider catalog organized by capability |
| Provider connection | OAuth / API key flow + test connection |
| Health monitoring | Sync status, last sync, error tracking |
| Module activation | Checklist + setup wizard per module |
| Data discovery | Detect existing data in connected providers |
| Data import | Import entities from providers (coupons, products, orders) |

**Primary users:**
- **Admin (Marcus):** Full setup — company, team, integrations, modules
- **PM (Caio):** Module activation — setup wizard per module
- **System:** Health monitoring, sync jobs, data discovery

**Out of scope:** Onboarding does NOT manage creator registration (Creators module), does NOT process payments (ERP/Checkout), does NOT configure automations (CRM).

---

## 2. User Stories

### 2.1 Admin Stories (Tenant Setup)

| # | As a... | I want to... | So that... | Acceptance Criteria |
|---|---|---|---|---|
| US-01 | Admin | Configurar minha empresa no primeiro acesso | O tenant está pronto para usar a plataforma | Wizard 3 steps: (1) dados empresa, (2) convite equipe, (3) conectar integrações. Ao completar, redireciona para dashboard. |
| US-02 | Admin | Conectar meu Shopify ao Ambaril | Dados de produtos e cupons ficam sincronizados | OAuth flow Shopify: botão "Conectar" → popup OAuth → callback → test connection → status "Conectado" com badge verde |
| US-03 | Admin | Conectar Yever via API key | Vendas por cupom ficam rastreadas | Modal API key: input para token + botão "Testar conexão" → validação → salvar encrypted |
| US-04 | Admin | Ver status de saúde das integrações | Sei se algo está desconectado ou com erro | Grid de cards: logo + nome + status badge (conectado/erro/desconectado) + last sync time |
| US-05 | Admin | Desconectar uma integração | Posso trocar de provider | Botão "Desconectar" com confirmação. Remove credentials. Status → desconectado |
| US-06 | Admin | Configurar frequência de sync por integração | Controlo quando dados são puxados | Select: "A cada 1h", "A cada 6h", "A cada 24h", "Manual" |

### 2.2 Admin Stories (Team)

| # | As a... | I want to... | So that... | Acceptance Criteria |
|---|---|---|---|---|
| US-07 | Admin | Convidar membros da equipe com roles | Cada pessoa tem o acesso correto | Form: email + role select. Envia email com link de convite (token 7 dias). Roles: admin, pm, creative, operations, support, finance, commercial |
| US-08 | Admin | Ver membros da equipe e seus roles | Sei quem tem acesso ao quê | Tabela: nome, email, role, status (ativo/pendente/suspenso), último acesso |

### 2.3 PM Stories (Module Activation)

| # | As a... | I want to... | So that... | Acceptance Criteria |
|---|---|---|---|---|
| US-09 | PM | Ativar o módulo Creators | Posso começar a gerenciar influenciadores | Setup wizard Creators (6 steps): check integrations → configure tiers → import coupons → link creators → account options → review & activate |
| US-10 | PM | Ver quais módulos estão ativos e quais faltam configurar | Sei o próximo passo | Dashboard de módulos: cards com status (ativo/não configurado/pré-requisitos faltando) |
| US-11 | PM | Ver dados descobertos nas integrações | Posso importar dados existentes | "Encontramos 847 produtos e 12 cupons ativos no Shopify. Importar?" com counts reais |

---

## 3. Data Model

### 3.1 Entity Relationship (extends `global` schema)

```
global.tenants (exists)
  │
  ├──→ global.integration_providers (seed, read-only)
  │      │
  │      └──→ global.tenant_integrations (per-tenant credentials)
  │             │
  │             └──→ global.integration_sync_logs (sync history)
  │
  ├──→ global.tenant_modules (module activation state)
  │
  ├──→ global.onboarding_progress (wizard state)
  │
  └──→ global.team_invites (pending invitations)
```

### 3.2 New Enums

| Enum | Values |
|---|---|
| `integration_auth_type` | `oauth`, `api_key` |
| `integration_status` | `active`, `inactive`, `error`, `syncing` |
| `sync_frequency` | `realtime`, `1h`, `6h`, `24h`, `manual` |
| `module_status` | `not_configured`, `setup_in_progress`, `active`, `disabled` |
| `invite_status` | `pending`, `accepted`, `expired`, `revoked` |
| `capability_type` | `ecommerce`, `checkout`, `payments`, `social`, `fiscal`, `shipping`, `messaging` |

### 3.3 Table Definitions

#### 3.3.1 `global.integration_providers` (seed data — read-only)

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | UUID v7 |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | 'shopify', 'nuvemshop', 'yever' |
| name | VARCHAR(255) | NOT NULL | Display name (e.g., "Shopify") |
| description | TEXT | NOT NULL | Short description in PT-BR |
| capability | capability_type | NOT NULL | Which capability this provides |
| logo_url | TEXT | NOT NULL | Provider logo (R2 or static) |
| auth_type | integration_auth_type | NOT NULL | 'oauth' or 'api_key' |
| auth_config | JSONB | NOT NULL | OAuth URLs or API key field definitions |
| config_schema | JSONB | | JSON Schema for provider-specific settings |
| is_active | BOOLEAN | DEFAULT true | Can tenants connect this? |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**auth_config JSONB (OAuth):**
```json
{
  "authorize_url": "https://accounts.shopify.com/oauth/authorize",
  "token_url": "https://accounts.shopify.com/oauth/token",
  "scopes": ["read_products", "read_orders", "read_price_rules"],
  "callback_path": "/api/v1/admin/integrations/callback/shopify"
}
```

**auth_config JSONB (API key):**
```json
{
  "fields": [
    { "name": "api_token", "label": "Token de API", "type": "password", "required": true },
    { "name": "store_url", "label": "URL da loja", "type": "url", "required": false }
  ],
  "test_endpoint": "/api/v1/admin/integrations/test"
}
```

**Seed data (v1):**

| slug | name | capability | auth_type |
|---|---|---|---|
| shopify | Shopify | ecommerce | oauth |
| yever | Yever | checkout | api_key |
| mercado-pago | Mercado Pago | payments | oauth |
| instagram | Instagram | social | oauth |
| focus-nfe | Focus NFe | fiscal | api_key |
| melhor-envio | Melhor Envio | shipping | oauth |
| meta-wa | WhatsApp (Meta) | messaging | api_key |
| resend | Resend | messaging | api_key |

#### 3.3.2 `global.tenant_integrations` (per-tenant connections)

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | UUID v7 |
| tenant_id | UUID | FK → tenants, NOT NULL | Multi-tenancy |
| provider_id | UUID | FK → integration_providers, NOT NULL | Which provider |
| credentials_encrypted | TEXT | NOT NULL | Encrypted JSON (AES-256-GCM, app-level) |
| status | integration_status | DEFAULT 'inactive' | Connection health |
| last_sync_at | TIMESTAMPTZ | | Last successful sync |
| sync_frequency | sync_frequency | DEFAULT '6h' | How often to pull data |
| config | JSONB | DEFAULT '{}' | Provider-specific settings |
| error_message | TEXT | | Last error (if status = error) |
| error_count | INTEGER | DEFAULT 0 | Consecutive errors |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Unique constraint:** `(tenant_id, provider_id)` — one connection per provider per tenant.

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_tenant_integrations_unique
  ON global.tenant_integrations (tenant_id, provider_id);
CREATE INDEX idx_tenant_integrations_status
  ON global.tenant_integrations (tenant_id, status);
CREATE INDEX idx_tenant_integrations_capability
  ON global.tenant_integrations (tenant_id)
  INCLUDE (provider_id, status);
```

#### 3.3.3 `global.integration_sync_logs` (audit trail for syncs)

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | UUID v7 |
| tenant_id | UUID | FK → tenants, NOT NULL | |
| integration_id | UUID | FK → tenant_integrations, NOT NULL | |
| action | VARCHAR(100) | NOT NULL | 'sync_coupons', 'sync_orders', etc. |
| status | VARCHAR(20) | NOT NULL | 'started', 'success', 'error' |
| records_processed | INTEGER | DEFAULT 0 | Count of records |
| error_detail | TEXT | | Error message if failed |
| started_at | TIMESTAMPTZ | DEFAULT NOW() | |
| completed_at | TIMESTAMPTZ | | |

#### 3.3.4 `global.tenant_modules` (module activation state)

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | UUID v7 |
| tenant_id | UUID | FK → tenants, NOT NULL | |
| module_slug | VARCHAR(100) | NOT NULL | 'creators', 'crm', 'erp', etc. |
| status | module_status | DEFAULT 'not_configured' | |
| activated_at | TIMESTAMPTZ | | When first activated |
| activated_by | UUID | FK → users | Who activated |
| setup_state | JSONB | DEFAULT '{}' | Wizard progress (current_step, completed_steps) |
| config | JSONB | DEFAULT '{}' | Module-specific config |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Unique constraint:** `(tenant_id, module_slug)`

#### 3.3.5 `global.onboarding_progress` (tenant setup wizard state)

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | UUID v7 |
| tenant_id | UUID | FK → tenants, NOT NULL, UNIQUE | One per tenant |
| current_step | INTEGER | DEFAULT 1 | 1=empresa, 2=equipe, 3=integracoes |
| completed_steps | INTEGER[] | DEFAULT '{}' | Which steps are done |
| is_complete | BOOLEAN | DEFAULT false | Full wizard done? |
| completed_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

#### 3.3.6 `global.team_invites` (pending team invitations)

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | UUID v7 |
| tenant_id | UUID | FK → tenants, NOT NULL | |
| email | VARCHAR(255) | NOT NULL | Invitee email |
| role | user_role | NOT NULL | Assigned role |
| invited_by | UUID | FK → users, NOT NULL | Who sent |
| token | VARCHAR(64) | UNIQUE, NOT NULL | Cryptographically random |
| status | invite_status | DEFAULT 'pending' | |
| expires_at | TIMESTAMPTZ | NOT NULL | 7-day expiry |
| accepted_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

## 4. Business Rules

### 4.1 Tenant Setup Rules

| # | Rule | Detail |
|---|---|---|
| R1 | **Wizard obrigatório no primeiro login** | Admin vê wizard antes de qualquer outra tela. Pode pular steps 2-3 mas não step 1 (dados empresa). Wizard state salvo em `onboarding_progress`. |
| R2 | **CNPJ único por tenant** | Validação mod-11 no frontend + unique constraint no backend. |
| R3 | **Admin é o primeiro usuário** | O criador da conta recebe role `admin` automaticamente. |
| R4 | **Wizard pode ser retomado** | Se admin fecha o browser no step 2, ao relogar volta no step 2. |
| R5 | **Pós-wizard: checklist no dashboard** | Checklist persistente com items restantes (connect integration, invite team, activate module). Progress bar começa em 20% (Zeigarnik effect). |

### 4.2 Integration Rules

| # | Rule | Detail |
|---|---|---|
| R6 | **Um provider por capability por tenant** | Tenant não pode ter 2 ecommerce providers ativos simultaneamente. UI desabilita "Conectar" se capability já tem provider ativo. |
| R7 | **Test connection obrigatório** | Credentials são testadas antes de salvar. Se falha: não salva, mostra erro. |
| R8 | **Credentials encrypted at rest** | AES-256-GCM com chave em variável de ambiente da plataforma. NUNCA em plaintext. |
| R9 | **Circuit breaker** | Após 5 erros consecutivos: status → 'error', sync pausa, notificação ao admin. Reset manual ou automático após 1h. |
| R10 | **Desconectar requer confirmação** | Modal "Tem certeza? Módulos que dependem desta integração podem parar de funcionar." Lista módulos afetados. |
| R11 | **OAuth tokens refreshed automatically** | Para providers OAuth: refresh token antes de expirar. Se refresh falha: status → 'error'. |
| R12 | **Sync logs retidos 90 dias** | Cleanup via cron job. |

### 4.3 Module Activation Rules

| # | Rule | Detail |
|---|---|---|
| R13 | **Pré-requisitos verificados antes de ativar** | Cada módulo declara capabilities requeridas. Se faltam: "Para ativar Creators, conecte: ecommerce ✓, checkout ✗, social ⚠ (opcional)". |
| R14 | **Setup wizard por módulo** | Cada módulo tem setup wizard específico. Executado no primeiro acesso àquele módulo. |
| R15 | **Módulo pode ser desativado** | Admin pode desabilitar módulo. Dados não são deletados (soft disable). Sidebar esconde o módulo. |
| R16 | **Progressive disclosure** | Sidebar mostra apenas módulos ativos. Dashboard mostra módulos inativos com CTA "Ativar". |

### 4.4 Data Discovery Rules

| # | Rule | Detail |
|---|---|---|
| R17 | **Discovery automática pós-conexão** | Ao conectar provider, sistema roda discovery (count products, coupons, orders, customers). Mostra counts na UI. |
| R18 | **Import é opt-in** | Sistema sugere mas nunca importa automaticamente. Admin confirma: "Importar 847 produtos do Shopify?" |
| R19 | **Import é idempotent** | Se admin importa 2x, não duplica. Matching por external_id do provider. |
| R20 | **Conflict resolution** | Se entidade já existe (ex: cupom com mesmo code), mostra diff e deixa admin escolher: manter local, usar externo, ou merge. |

---

## 5. Screens & Wireframes

### 5.1 Tenant Setup Wizard — Step 1: Empresa

```
+-----------------------------------------------------------------------+
|  Ambaril                                              Step 1 de 3      |
+-----------------------------------------------------------------------+
|                                                                       |
|  Bem-vindo ao Ambaril!                                               |
|  Vamos configurar sua empresa em poucos minutos.                     |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |  DADOS DA EMPRESA                                               |  |
|  +-----------------------------------------------------------------+  |
|  |                                                                 |  |
|  |  Nome da empresa     [____________________________]             |  |
|  |  CNPJ                [__.___.___/____-__]                       |  |
|  |                       (i) Usado para emissão de NF-e            |  |
|  |                                                                 |  |
|  |  Logo                [Arraste ou clique para enviar]            |  |
|  |                       PNG ou SVG, max 2MB                       |  |
|  |                                                                 |  |
|  |  Domínio             [________].ambaril.com                     |  |
|  |                       (i) URL do seu painel administrativo      |  |
|  |                                                                 |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
|  [Pular equipe e integrações]              [Continuar →]             |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 5.2 Tenant Setup Wizard — Step 2: Equipe

```
+-----------------------------------------------------------------------+
|  Ambaril                                              Step 2 de 3      |
+-----------------------------------------------------------------------+
|                                                                       |
|  Convide sua equipe                                                  |
|  Cada pessoa recebe acesso de acordo com sua função.                 |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |  CONVITES                                                       |  |
|  +-----------------------------------------------------------------+  |
|  |                                                                 |  |
|  |  Email                    Função                                |  |
|  |  [__________________]     [Gerente de produto    v]  [Convidar] |  |
|  |                                                                 |  |
|  |  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -   |  |
|  |                                                                 |  |
|  |  CONVITES ENVIADOS                                              |  |
|  |                                                                 |  |
|  |  caio@ciena.com    Gerente de produto   Pendente    [Reenviar]  |  |
|  |  tavares@ciena.com Operações            Pendente    [Reenviar]  |  |
|  |                                                                 |  |
|  |  (i) Você pode convidar mais pessoas depois em                  |  |
|  |      Configurações → Equipe                                     |  |
|  |                                                                 |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
|  [← Voltar]          [Pular]              [Continuar →]             |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 5.3 Tenant Setup Wizard — Step 3: Integrações

```
+-----------------------------------------------------------------------+
|  Ambaril                                              Step 3 de 3      |
+-----------------------------------------------------------------------+
|                                                                       |
|  Conecte suas ferramentas                                            |
|  O Ambaril puxa dados das plataformas que você já usa.               |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |  E-COMMERCE                                                     |  |
|  |                                                                 |  |
|  |  +-------------+  +-------------+  +-------------+              |  |
|  |  | [Shopify]   |  | [Nuvemshop] |  | [VNDA]      |              |  |
|  |  | logo        |  | logo        |  | logo        |              |  |
|  |  | * Conectado |  | [Conectar]  |  | [Conectar]  |              |  |
|  |  +-------------+  +-------------+  +-------------+              |  |
|  |                                                                 |  |
|  |  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -   |  |
|  |                                                                 |  |
|  |  CHECKOUT / PAGAMENTOS                                          |  |
|  |                                                                 |  |
|  |  +-------------+  +-------------+  +-------------+              |  |
|  |  | [Yever]     |  | [Merc.Pago] |  | [Stripe]    |              |  |
|  |  | logo        |  | logo        |  | logo        |              |  |
|  |  | [Conectar]  |  | [Conectar]  |  | Em breve    |              |  |
|  |  +-------------+  +-------------+  +-------------+              |  |
|  |                                                                 |  |
|  |  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -   |  |
|  |                                                                 |  |
|  |  REDES SOCIAIS              FISCAL                              |  |
|  |                                                                 |  |
|  |  +-------------+           +-------------+                      |  |
|  |  | [Instagram] |           | [Focus NFe] |                      |  |
|  |  | logo        |           | logo        |                      |  |
|  |  | [Conectar]  |           | [Conectar]  |                      |  |
|  |  +-------------+           +-------------+                      |  |
|  |                                                                 |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
|  (i) Você precisa de pelo menos 1 integração para ativar módulos.    |
|                                                                       |
|  [← Voltar]                               [Concluir setup →]        |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 5.4 Integration Catalog (`/admin/settings/integrations`)

```
+-----------------------------------------------------------------------+
|  Configurações > Integrações                          [+ Conectar]    |
+-----------------------------------------------------------------------+
|                                                                       |
|  CONECTADAS (3)                                                      |
|                                                                       |
|  +--------------------+  +--------------------+  +------------------+ |
|  | [Shopify logo]     |  | [Yever logo]       |  | [Resend logo]   | |
|  | Shopify            |  | Yever              |  | Resend           | |
|  | E-commerce         |  | Checkout           |  | E-mail           | |
|  | * Conectado        |  | * Conectado        |  | * Conectado      | |
|  | Sync: há 2h        |  | Sync: há 15min     |  | Sync: —          | |
|  | [Configurar]       |  | [Configurar]       |  | [Configurar]     | |
|  +--------------------+  +--------------------+  +------------------+ |
|                                                                       |
|  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  |
|                                                                       |
|  DISPONÍVEIS                                                         |
|                                                                       |
|  [Todos] [E-commerce] [Checkout] [Pagamentos] [Social] [Fiscal]     |
|  [Logística] [Comunicação]                                           |
|                                                                       |
|  +--------------------+  +--------------------+  +------------------+ |
|  | [Instagram logo]   |  | [Focus NFe logo]   |  | [Melhor Envio]  | |
|  | Instagram          |  | Focus NFe          |  | Melhor Envio     | |
|  | Redes sociais      |  | Fiscal             |  | Logística        | |
|  | o Não conectado    |  | o Não conectado    |  | o Não conectado  | |
|  | [Conectar]         |  | [Conectar]         |  | [Conectar]       | |
|  +--------------------+  +--------------------+  +------------------+ |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 5.5 Provider Detail / Config Modal

```
+-----------------------------------------------------------------------+
|  Shopify                                              * Conectado     |
+-----------------------------------------------------------------------+
|                                                                       |
|  Capability: E-commerce                                              |
|  Conectado em: 15/03/2026                                            |
|  Último sync: há 2 horas (1.247 produtos, 42 cupons)                |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |  CONFIGURAÇÃO DE SYNC                                           |  |
|  +-----------------------------------------------------------------+  |
|  |                                                                 |  |
|  |  Frequência:  [A cada 6 horas  v]                              |  |
|  |                                                                 |  |
|  |  Dados sincronizados:                                          |  |
|  |  [x] Produtos (1.247)                                          |  |
|  |  [x] Cupons de desconto (42)                                   |  |
|  |  [x] Pedidos (3.891 nos últimos 90 dias)                       |  |
|  |  [ ] Clientes (desabilitado — ativar com módulo CRM)           |  |
|  |                                                                 |  |
|  |  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  |  |
|  |                                                                 |  |
|  |  LOGS RECENTES                                                  |  |
|  |                                                                 |  |
|  |  30/03 14:00  sync_products  * Sucesso  1.247 registros  1.2s  |  |
|  |  30/03 14:00  sync_coupons   * Sucesso  42 registros     0.8s  |  |
|  |  30/03 08:00  sync_products  * Sucesso  1.246 registros  1.1s  |  |
|  |  29/03 14:00  sync_orders    o Erro     rate_limited     —     |  |
|  |                                                                 |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
|  [Sincronizar agora]    [Desconectar]              [Salvar]          |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 5.6 Module Activation Dashboard (`/admin/settings/modules`)

```
+-----------------------------------------------------------------------+
|  Configurações > Módulos                                              |
+-----------------------------------------------------------------------+
|                                                                       |
|  Gerencie os módulos ativos da sua empresa.                          |
|                                                                       |
|  ATIVOS (1)                                                          |
|                                                                       |
|  +------------------------------+                                     |
|  | Creators                     |                                     |
|  | Programa de influenciadores  |                                     |
|  | * Ativo desde 15/03/2026     |                                     |
|  | 12 criadores - 156 vendas    |                                     |
|  | [Gerenciar →]                |                                     |
|  +------------------------------+                                     |
|                                                                       |
|  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  |
|                                                                       |
|  DISPONÍVEIS                                                         |
|                                                                       |
|  +------------------------------+  +------------------------------+   |
|  | Dashboard                    |  | PCP                          |   |
|  | Painel executivo             |  | Produção e fornecedores      |   |
|  | Pré-requisitos: todos ok     |  | Pré-requisitos: todos ok     |   |
|  | [Ativar módulo]              |  | [Ativar módulo]              |   |
|  +------------------------------+  +------------------------------+   |
|                                                                       |
|  +------------------------------+  +------------------------------+   |
|  | CRM                          |  | Checkout                     |   |
|  | Gestão de clientes           |  | Checkout customizado         |   |
|  | Pré-requisitos:              |  | Pré-requisitos:              |   |
|  |   ecommerce ok               |  |   ecommerce ok               |   |
|  |   messaging X Conectar       |  |   payments X Conectar        |   |
|  | [Configurar integrações]     |  | [Configurar integrações]     |   |
|  +------------------------------+  +------------------------------+   |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 5.7 Post-Setup Dashboard Checklist

```
+-----------------------------------------------------------------------+
|  Dashboard                                                            |
+-----------------------------------------------------------------------+
|                                                                       |
|  Olá, Marcus!                                                        |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |  SEU PROGRESSO DE CONFIGURAÇÃO                    60% completo  |  |
|  |  ████████████████████░░░░░░░░░░░░                              |  |
|  |                                                                 |  |
|  |  ok  Dados da empresa configurados                             |  |
|  |  ok  Shopify conectado                                         |  |
|  |  ok  Módulo Creators ativado                                   |  |
|  |  --  Conectar plataforma de checkout  [Conectar Yever →]       |  |
|  |  --  Convidar equipe (0/8)            [Convidar →]             |  |
|  |                                                                 |  |
|  |  [Dispensar checklist]                                          |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
|  ... (rest of dashboard)                                             |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 5.8 Data Discovery Modal (pós-conexão)

```
+-----------------------------------------------------------------------+
|  Dados encontrados no Shopify                                         |
+-----------------------------------------------------------------------+
|                                                                       |
|  Conectamos com sucesso! Encontramos os seguintes dados:             |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |  DADOS DISPONÍVEIS                                              |  |
|  +-----------------------------------------------------------------+  |
|  |                                                                 |  |
|  |  847 produtos                             [Ver detalhes]        |  |
|  |  12 cupons de desconto ativos             [Ver detalhes]        |  |
|  |  3.241 pedidos (últimos 90 dias)          [Ver detalhes]        |  |
|  |  2.156 clientes                           [Ver detalhes]        |  |
|  |                                                                 |  |
|  |  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  |  |
|  |                                                                 |  |
|  |  (i) Esses dados serão importados quando você ativar            |  |
|  |  os módulos que precisam deles. Nenhuma importação é            |  |
|  |  feita automaticamente.                                         |  |
|  |                                                                 |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
|  [Fechar]                                                            |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## 6. API Endpoints

### 6.1 Admin Onboarding

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/admin/onboarding/progress` | Get wizard state | admin |
| PUT | `/api/v1/admin/onboarding/step/:step` | Complete wizard step | admin |
| POST | `/api/v1/admin/onboarding/skip` | Skip remaining wizard | admin |

### 6.2 Integration Catalog

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/admin/integrations/providers` | List all providers | admin, pm |
| GET | `/api/v1/admin/integrations` | List tenant's integrations | admin, pm |
| POST | `/api/v1/admin/integrations/connect/:slug` | Start connection flow | admin |
| POST | `/api/v1/admin/integrations/callback/:slug` | OAuth callback | system |
| POST | `/api/v1/admin/integrations/:id/test` | Test connection | admin |
| PUT | `/api/v1/admin/integrations/:id/config` | Update sync config | admin |
| POST | `/api/v1/admin/integrations/:id/sync` | Trigger manual sync | admin |
| DELETE | `/api/v1/admin/integrations/:id` | Disconnect provider | admin |
| GET | `/api/v1/admin/integrations/:id/logs` | Sync logs | admin, pm |
| GET | `/api/v1/admin/integrations/:id/discovery` | Data discovery counts | admin, pm |

### 6.3 Module Activation

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/admin/modules` | List all modules + status | admin, pm |
| GET | `/api/v1/admin/modules/:slug` | Module detail + prerequisites | admin, pm |
| POST | `/api/v1/admin/modules/:slug/activate` | Start module activation | admin |
| PUT | `/api/v1/admin/modules/:slug/setup` | Save module setup wizard progress | admin, pm |
| POST | `/api/v1/admin/modules/:slug/disable` | Disable module | admin |

### 6.4 Team Management

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/admin/team` | List team members | admin |
| POST | `/api/v1/admin/team/invite` | Send invite | admin |
| DELETE | `/api/v1/admin/team/invite/:id` | Revoke invite | admin |
| POST | `/api/v1/admin/team/invite/:token/accept` | Accept invite | public (token) |

---

## 7. Integrations

The Onboarding module is the **owner** of the integration layer. It manages:

**OAuth Providers (Shopify, Mercado Pago, Instagram, Melhor Envio):**
- Authorization Code flow with PKCE
- Automatic token refresh (cron job)
- Revocation on disconnect

**API Key Providers (Yever, Focus NFe, Resend, Meta WA):**
- Encrypted storage (AES-256-GCM)
- Test endpoint validation
- Key rotation support

**Provider Interface Pattern:**
```
packages/shared/src/integrations/
  types.ts          — Capability interfaces (EcommerceProvider, CheckoutProvider, etc.)
  registry.ts       — Resolve tenant → provider at runtime
  providers/
    shopify.ts      — implements EcommerceProvider
    yever.ts        — implements CheckoutProvider
    instagram.ts    — implements SocialProvider
    ...
```

**Rate Limiting:**
- Per-provider rate limit tracking
- Exponential backoff on 429
- Circuit breaker after 5 consecutive errors (R9)

---

## 8. Background Jobs

| Job | Schedule | Priority | Description |
|---|---|---|---|
| `integration-health-check` | Every 1h | medium | Test all active connections, update status |
| `token-refresh` | Every 6h | high | Refresh OAuth tokens expiring in <12h |
| `scheduled-sync` | Per-integration config | medium | Execute sync for integrations due |
| `sync-log-cleanup` | Daily 03:00 | low | Delete sync logs older than 90 days |
| `expired-invites-cleanup` | Daily 04:00 | low | Expire invites older than 7 days |

---

## 9. Permissions (RBAC)

| Resource | admin | pm | operations | support | finance | creative | commercial |
|---|---|---|---|---|---|---|---|
| `onboarding:wizard:write` | Y | | | | | | |
| `integrations:providers:read` | Y | Y | | | | | |
| `integrations:connections:write` | Y | | | | | | |
| `integrations:connections:read` | Y | Y | Y | | | | |
| `integrations:sync:execute` | Y | | | | | | |
| `modules:activate` | Y | | | | | | |
| `modules:setup:write` | Y | Y | | | | | |
| `modules:read` | Y | Y | Y | Y | Y | Y | Y |
| `team:invite` | Y | | | | | | |
| `team:read` | Y | Y | | | | | |

---

## 10. Notifications (Flare Events)

| Event | Trigger | Channels | Template |
|---|---|---|---|
| `integration.connected` | Provider connected | In-app | "Integração {provider} conectada com sucesso." |
| `integration.error` | Sync fails 3x | In-app + Email | "A integração com {provider} está com problemas. Verifique as credenciais." |
| `integration.disconnected` | Provider disconnected | In-app | "Integração {provider} desconectada." |
| `team.invite_sent` | Invite created | Email (to invitee) | "Você foi convidado para o Ambaril por {name}. Clique para aceitar." |
| `team.invite_accepted` | Invite accepted | In-app (to admin) | "{name} aceitou o convite e entrou na equipe como {role}." |
| `module.activated` | Module activated | In-app | "Módulo {name} ativado com sucesso!" |
| `onboarding.completed` | Wizard finished | In-app | "Parabéns! Sua empresa está configurada." |

---

## 11. Error Handling

| Code | HTTP | Message | Handling |
|---|---|---|---|
| PROVIDER_NOT_FOUND | 404 | "Integração não encontrada" | Invalid slug |
| CAPABILITY_ALREADY_CONNECTED | 409 | "Já existe uma integração de {capability} conectada" | Desconectar primeiro |
| CONNECTION_TEST_FAILED | 422 | "Não foi possível conectar. Verifique suas credenciais." | Show provider-specific help |
| OAUTH_CALLBACK_FAILED | 422 | "Falha na autorização. Tente novamente." | Retry OAuth flow |
| CREDENTIALS_EXPIRED | 401 | "Credenciais expiradas. Reconecte a integração." | Trigger reconnect |
| SYNC_RATE_LIMITED | 429 | "Muitas requisições. Tentaremos novamente em breve." | Exponential backoff |
| CNPJ_INVALID | 422 | "CNPJ inválido. Verifique os dígitos." | Frontend validation |
| CNPJ_ALREADY_EXISTS | 409 | "Já existe uma empresa com este CNPJ." | Contact support |
| INVITE_EXPIRED | 410 | "Este convite expirou. Peça ao administrador para reenviar." | New invite |
| INVITE_ALREADY_ACCEPTED | 409 | "Este convite já foi aceito." | Login |

---

## 12. Testing Checklist

| Feature | Unit | Integration | E2E |
|---|---|---|---|
| Tenant wizard (3 steps) | [ ] | [ ] | [ ] |
| CNPJ validation (mod-11) | [x] | | |
| OAuth flow (Shopify) | | [ ] | [ ] |
| API key connection (Yever) | | [ ] | [ ] |
| Test connection endpoint | [ ] | [ ] | |
| Credentials encryption/decryption | [x] | | |
| Sync execution (per provider) | | [ ] | |
| Circuit breaker (5 errors) | [x] | | |
| Token refresh (OAuth) | | [ ] | |
| Data discovery counts | | [ ] | |
| Module activation prerequisites | [x] | [ ] | |
| Module setup wizard (Creators) | | | [ ] |
| Team invite flow | [ ] | [ ] | [ ] |
| Invite expiry (7 days) | [x] | | |
| Progressive sidebar | [x] | | [ ] |
| Dashboard checklist | | | [ ] |
| RLS policies (tenant isolation) | [x] | [x] | |
| Sync log cleanup (90 days) | [x] | | |
