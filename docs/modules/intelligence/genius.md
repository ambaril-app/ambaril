# Genius — Business Knowledge Base

> **Module:** Genius
> **Schema:** `genius`
> **Route prefix:** `/api/v1/genius`
> **Admin UI route group:** `(admin)/genius/*`
> **Version:** 1.0
> **Date:** April 2026
> **Status:** Approved (Grill Review — April 2026)
> **Replaces:** Brand Brain (migrated from Astro as L0)
> **References:** [astro.md](./astro.md), [DATABASE.md](../../architecture/DATABASE.md), [API.md](../../architecture/API.md), [AUTH.md](../../architecture/AUTH.md)

---

## 1. Purpose & Scope

Genius is the **business knowledge base** of Ambaril — the persistent memory that makes AI contextually aware of each tenant's unique business. While Astro is the brain (chat, insights, actions), Genius is the memory (structured knowledge about the business).

**Core concept:** Every tenant has a different business. A streetwear brand operates differently from a restaurant. Genius captures, structures, and maintains this business context so that all AI features across Ambaril (Astro chat, Dashboard insights, PLM suggestions, CRM automations) can deliver relevant, contextual responses.

**Architecture:** Inspired by two approaches:

- **Karpathy's LLM Knowledge Bases** (compilation of raw sources into structured wiki + periodic linting for consistency)
- **Napkin's Progressive Disclosure** (4-level token-efficient retrieval: L0 ~200 tokens → L1 ~2k → L2 ~5k → L3 ~20k)

**Key principle:** Genius is NOT a static configuration wizard. It is a living knowledge base that:

1. Is seeded during onboarding (guided grill interview)
2. Auto-updates from conversations and module activity (distillation)
3. Self-validates against real data from ERP, PLM, CRM (linting)
4. Grows more accurate over time

**Relationship with other modules:**

| Module         | Relationship                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Astro**      | Genius = memory, Astro = brain. Astro consumes Genius context for every AI operation. Brand Brain migrated to Genius L0. |
| **ERP**        | Genius learns financial data (margins, revenue, costs). Linting validates KB claims against real ERP data.               |
| **PLM**        | Genius learns operational data (suppliers, lead times, production patterns).                                             |
| **CRM**        | Genius learns customer data (audience profile, buying patterns, common complaints).                                      |
| **Mensageria** | Support Intelligence: ticket classification feeds Genius with customer pain patterns.                                    |
| **Tarefas**    | Meeting notes and task comments distilled into Genius.                                                                   |
| **Dashboard**  | Dashboard insights contextualized by Genius ("margin of 28% is below your target of 40%").                               |

**Primary users:**

| User                           | Role      | Usage                                                  |
| ------------------------------ | --------- | ------------------------------------------------------ |
| **Marcus**                     | `admin`   | Onboarding grill, reviews KB, adds context             |
| **Any C-level / tenant owner** | `admin`   | Primary knowledge source                               |
| **All users**                  | All roles | Indirect — consume Genius via Astro and module context |

**Out of scope:** Genius does NOT handle AI chat (Astro), AI image/video generation (Astro/DAM), or workflow automation (Astro). Genius only stores and retrieves business knowledge.

---

## 2. Progressive Disclosure Architecture

The core design principle: agents (and modules) should NOT load the entire knowledge base into context. Information is revealed gradually:

| Level  | What                                                                           | Token Budget    | When Used                                                             |
| ------ | ------------------------------------------------------------------------------ | --------------- | --------------------------------------------------------------------- |
| **L0** | Tenant summary — business identity, key metrics, current priorities            | ~200-500 tokens | **Always loaded** in every AI call. Equivalent to former Brand Brain. |
| **L1** | Sector map — list of sectors with TF-IDF keywords per sector                   | ~1-2k tokens    | When Astro needs to decide which sector is relevant to a query        |
| **L2** | Search results — BM25-ranked entries matching a query with match-only snippets | ~2-5k tokens    | When a specific question needs targeted knowledge                     |
| **L3** | Full entry read — complete content of a specific knowledge entry               | ~5-20k tokens   | Deep analysis, complex queries, onboarding review                     |

**Token efficiency:** 90% of AI calls resolve at L0+L1 (~2.5k tokens). Only complex queries escalate to L2/L3. This keeps per-tenant AI cost at ~$5-15/month.

---

## 3. User Stories

### 3.1 Onboarding (Tenant Owner)

| #     | Story                                                                                                                                                   | Acceptance Criteria                                                                                                                                                                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-01 | As a tenant owner, I want to describe my business in 2-3 sentences so the AI proposes relevant knowledge sectors for my business type.                  | Text or audio input. AI analyzes and proposes 7-10 sectors. Owner can add, remove, rename sectors. Template sectors available per niche (fashion, food, tech, services).                                                                                 |
| US-02 | As a tenant owner, I want to record guided audio (or type text) about each sector of my business, with clear prompts telling me what to cover.          | Per-sector blocks with provocative prompts (e.g., "Como nasce um produto novo ate chegar no cliente? Onde trava?"). Audio recording in-app, upload supported. Timer suggestion per block (3-5 min). Blocks are independent — can do 2 today, 3 tomorrow. |
| US-03 | As a tenant owner, I want the system to ask follow-up questions about gaps in my initial answers.                                                       | After Etapa 1 (audio/text), AI analyzes what was covered and generates targeted follow-up questions only for missing information. If Etapa 1 was comprehensive, Etapa 2 has 3 questions. If superficial, 15 questions.                                   |
| US-04 | As a tenant owner, I want to review and correct what the AI understood about my business before it becomes the knowledge base.                          | Summary screen showing key facts per sector in editable cards. Owner confirms, corrects, or adds. KB v1 is created after confirmation.                                                                                                                   |
| US-05 | As a tenant owner, I want AI to pre-fill product names, descriptions, and tags based on PLM development context (moodboard, color palette, brainstorm). | When a product reaches the "approved" stage in PLM, Genius generates draft name + description + tags using PLM context. Creative team reviews and approves.                                                                                              |

### 3.2 Knowledge Management (Admin)

| #     | Story                                                                                                                                              | Acceptance Criteria                                                                                                                                                 |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-06 | As an admin, I want to see the Genius knowledge base organized by sector, with a completeness indicator per sector.                                | Sidebar entry "Base de Conhecimento". Grid of sector cards with fill level (●○○ = low, ●●○ = medium, ●●● = complete). Tap to view entries.                          |
| US-07 | As an admin, I want to view, edit, or delete any entry in the knowledge base.                                                                      | Entry detail view with markdown content, source attribution (onboarding/distill/manual), last updated, edit button. Edit triggers re-distillation.                  |
| US-08 | As an admin, I want to add new context at any time — record audio, upload documents (PDF, spreadsheet), or type text.                              | "Adicionar contexto" button per sector. Supports audio, text, file upload. Audio is transcribed → distilled. Documents are compiled by LLM into structured entries. |
| US-09 | As an admin, I want to see when the AI detected inconsistencies between the KB and real data, and resolve them.                                    | Lint results shown as cards: "KB diz margem ~40%, ERP mostra 28% (Mar/2026)". Options: update KB, dismiss, mark as expected.                                        |
| US-10 | As an admin, I want to upload daily/meeting recordings and have them automatically transcribed, attributed to speakers, and distilled into the KB. | Audio upload with speaker diarization (identifies who said what). Transcription → distill into Genius (knowledge) + Tarefas (suggested tasks) + Meeting notes.      |

### 3.3 System (Auto-distill & Linting)

| #     | Story                                                                                                                                       | Acceptance Criteria                                                                                                                                                                                                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-11 | As the system, I want to automatically extract business knowledge from Astro conversations, PLM comments, task comments, and meeting notes. | Distill job runs per source type. Always: Astro chat, meeting notes, Genius audio, PLM comments. Daily digest: task comments, registered decisions. Never: Mensageria inbox, system logs. Uses Gemini Flash (tier `structured`) with template + `NO_DISTILL` when nothing relevant. |
| US-12 | As the system, I want to periodically validate KB claims against real module data and flag inconsistencies.                                 | Lint schedule: Financial (monthly post-DRE), Operational/Support (weekly), Customer profile (monthly), Static business data (quarterly). Inconsistencies create lint_results for admin review.                                                                                      |
| US-13 | As the system, I want to inject relevant Genius context into every AI call based on the active module and query.                            | Module context injection: L0 always loaded. L1 filtered by active module. L2/L3 only on explicit deep queries. Astro receives Genius context transparently.                                                                                                                         |
| US-14 | As the system, I want to classify support tickets and aggregate patterns into the Genius KB.                                                | Support Intelligence pipeline: Mensageria classifies each closed ticket (category, sentiment, product, resolution) via Gemini Flash (tier `structured`). CRM aggregates weekly. Genius distills top patterns.                                                                       |

### 3.4 AutoDream & Temporal Trends

| #     | Story                                                                                                                                                                                                           | Acceptance Criteria                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-15 | As the system, I want to consolidate all daily sources (conversations, comments, meetings, distills) into a nightly holistic analysis so that cross-module patterns are detected that individual distills miss. | AutoDream job runs daily at 03:00 BRT. Reads all `genius_sources` created in the last 24h. Sends to Gemini Flash (tier `structured`) with cross-referencing prompt. Before creating new entries, BM25 search for similar existing entries (score > 0.8 = update, not create). New entries created as `draft` with `source_type = 'autodream_consolidation'`. Example output: "Fornecedor X mencionado negativamente em 4 contextos diferentes esta semana (PLM, Astro chat x2, reuniao)". |
| US-16 | As an admin, I want to see what AutoDream consolidated or reorganized last night so I can review and verify AI-generated insights.                                                                              | Genius Home shows "Consolidacao noturna" card with: date, entries created/updated count, top insights summary (3-5 bullets). Tap expands to full list of affected entries with diff (what changed). Entries link to their sources. Card only appears when AutoDream produced changes.                                                                                                                                                                                                     |
| US-17 | As the system, I want to detect temporal trends when a metric changes 3+ times across lint cycles and automatically generate a `trend` entry.                                                                   | Trend detection runs within existing lint cycles (weekly/monthly). When lint detects a metric divergence for the 3rd+ time on the same entry, creates a `trend` entry with `metadata.datapoints: [{date, value, unit}]`. Example: margin entry linted at 40% (Jan), 35% (Feb), 28% (Mar) → trend entry "Margem bruta — tendencia de queda" with 3 datapoints. Trend entries follow Knowledge Verification Pipeline (created as `draft`).                                                  |
| US-18 | As an admin or PM, I want to visualize trend entries with a sparkline mini-chart so I can see the direction of change at a glance.                                                                              | Trend entries in Genius sector view show inline sparkline (Recharts SparklineChart, ~80x24px) next to the title. Sparkline color: green for upward trends on positive metrics, red for downward on positive metrics (inverted for cost metrics). Hover shows tooltip with datapoints. Full entry view shows larger trend chart with all datapoints labeled.                                                                                                                               |

---

## 4. Data Model

### 4.1 Entity Relationship Diagram

```mermaid
erDiagram
    genius_sectors ||--o{ genius_entries : "contains"
    genius_entries ||--o{ genius_sources : "derived from"
    genius_entries ||--o{ genius_lint_results : "validated by"

    genius_sectors {
        uuid id PK
        uuid tenant_id FK
        varchar name
        varchar slug
        text description
        int display_order
        text ai_keywords
        varchar completeness
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    genius_entries {
        uuid id PK
        uuid tenant_id FK
        uuid sector_id FK
        varchar title
        text content_md
        varchar entry_type
        varchar status
        jsonb metadata
        numeric confidence_score
        timestamptz last_validated_at
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    genius_sources {
        uuid id PK
        uuid tenant_id FK
        uuid entry_id FK
        varchar source_type
        varchar source_module
        uuid source_entity_id
        text raw_content
        text media_url
        timestamptz source_created_at
        timestamptz created_at
    }

    genius_lint_results {
        uuid id PK
        uuid tenant_id FK
        uuid entry_id FK
        varchar lint_type
        text description
        jsonb evidence
        varchar status
        uuid resolved_by FK
        timestamptz resolved_at
        timestamptz created_at
    }

    genius_l0_cache {
        uuid id PK
        uuid tenant_id FK_UK
        text summary_text
        int token_count
        timestamptz generated_at
        timestamptz updated_at
    }
```

### 4.2 Enums

```sql
CREATE TYPE genius.entry_type AS ENUM (
    'fact', 'process', 'preference', 'metric', 'relationship', 'decision', 'pattern', 'trend'
);
CREATE TYPE genius.source_type AS ENUM (
    'onboarding_audio', 'onboarding_text', 'document_upload',
    'astro_conversation', 'meeting_notes', 'plm_comment',
    'task_comment', 'manual_entry', 'support_pattern', 'lint_update',
    'autodream_consolidation'
);
CREATE TYPE genius.completeness AS ENUM ('low', 'medium', 'high');
CREATE TYPE genius.lint_type AS ENUM (
    'data_mismatch', 'outdated_metric', 'missing_context', 'inconsistency'
);
CREATE TYPE genius.lint_status AS ENUM ('pending', 'accepted', 'dismissed', 'auto_resolved');
CREATE TYPE genius.entry_status AS ENUM ('draft', 'verified', 'rejected', 'superseded');
```

### 4.3 genius.sectors

| Column        | Type                | Constraints                     | Description                                                           |
| ------------- | ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| id            | UUID                | PK, DEFAULT gen_random_uuid()   | UUID v7                                                               |
| tenant_id     | UUID                | NOT NULL, FK global.tenants(id) | Tenant isolation                                                      |
| name          | VARCHAR(100)        | NOT NULL                        | Sector display name (PT-BR): "Financeiro", "Produto", "Operacao"      |
| slug          | VARCHAR(100)        | NOT NULL                        | URL-friendly: "financeiro", "produto", "operacao"                     |
| description   | TEXT                | NULL                            | AI-generated description of what this sector covers                   |
| display_order | INTEGER             | NOT NULL DEFAULT 0              | Ordering in UI                                                        |
| ai_keywords   | TEXT                | NULL                            | TF-IDF extracted keywords for L1 overview (updated by background job) |
| completeness  | genius.completeness | NOT NULL DEFAULT 'low'          | Fill level based on entry count and coverage                          |
| created_at    | TIMESTAMPTZ         | NOT NULL DEFAULT NOW()          |                                                                       |
| updated_at    | TIMESTAMPTZ         | NOT NULL DEFAULT NOW()          |                                                                       |
| deleted_at    | TIMESTAMPTZ         | NULL                            | Soft delete                                                           |

**Indexes:**

```sql
CREATE UNIQUE INDEX idx_sectors_tenant_slug ON genius.sectors (tenant_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_sectors_tenant ON genius.sectors (tenant_id) WHERE deleted_at IS NULL;
```

### 4.4 genius.entries

| Column            | Type                | Constraints                     | Description                                                                            |
| ----------------- | ------------------- | ------------------------------- | -------------------------------------------------------------------------------------- |
| id                | UUID                | PK, DEFAULT gen_random_uuid()   | UUID v7                                                                                |
| tenant_id         | UUID                | NOT NULL, FK global.tenants(id) | Tenant isolation                                                                       |
| sector_id         | UUID                | NOT NULL, FK genius.sectors(id) | Parent sector                                                                          |
| title             | VARCHAR(255)        | NOT NULL                        | Entry title (e.g., "Fornecedor principal de malha")                                    |
| content_md        | TEXT                | NOT NULL                        | Markdown content — the actual knowledge                                                |
| entry_type        | genius.entry_type   | NOT NULL                        | Categorization: fact, process, preference, metric, etc.                                |
| status            | genius.entry_status | NOT NULL DEFAULT 'verified'     | Verification status — see Knowledge Verification Pipeline                              |
| metadata          | JSONB               | NOT NULL DEFAULT '{}'           | Flexible metadata: { "related_modules": ["plm", "erp"], "tags": ["supplier", "cost"] } |
| confidence_score  | NUMERIC(3,2)        | NOT NULL DEFAULT 1.00           | 0.00-1.00. Reduced when lint detects mismatch. Reset on validation.                    |
| last_validated_at | TIMESTAMPTZ         | NULL                            | Last time this entry was confirmed by lint or human                                    |
| created_by        | UUID                | NULL, FK global.users(id)       | NULL for system-generated entries                                                      |
| created_at        | TIMESTAMPTZ         | NOT NULL DEFAULT NOW()          |                                                                                        |
| updated_at        | TIMESTAMPTZ         | NOT NULL DEFAULT NOW()          |                                                                                        |
| deleted_at        | TIMESTAMPTZ         | NULL                            | Soft delete                                                                            |

**Indexes:**

```sql
CREATE INDEX idx_entries_tenant_sector ON genius.entries (tenant_id, sector_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_entries_type ON genius.entries (entry_type);
CREATE INDEX idx_entries_status ON genius.entries (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_entries_confidence ON genius.entries (confidence_score) WHERE confidence_score < 0.80;
CREATE INDEX idx_entries_search ON genius.entries USING GIN (to_tsvector('portuguese', title || ' ' || content_md));
```

### 4.5 genius.sources

| Column            | Type               | Constraints                     | Description                                                         |
| ----------------- | ------------------ | ------------------------------- | ------------------------------------------------------------------- |
| id                | UUID               | PK, DEFAULT gen_random_uuid()   | UUID v7                                                             |
| tenant_id         | UUID               | NOT NULL, FK global.tenants(id) | Tenant isolation                                                    |
| entry_id          | UUID               | NOT NULL, FK genius.entries(id) | Which entry this source contributed to                              |
| source_type       | genius.source_type | NOT NULL                        | Origin type                                                         |
| source_module     | VARCHAR(50)        | NULL                            | Module that generated this: 'astro', 'plm', 'tarefas', 'mensageria' |
| source_entity_id  | UUID               | NULL                            | ID of the source entity (conversation_id, task_id, etc.)            |
| raw_content       | TEXT               | NULL                            | Original raw content before distillation                            |
| media_url         | TEXT               | NULL                            | R2 URL for audio/image/document files                               |
| source_created_at | TIMESTAMPTZ        | NOT NULL                        | When the original source was created                                |
| created_at        | TIMESTAMPTZ        | NOT NULL DEFAULT NOW()          |                                                                     |

**Indexes:**

```sql
CREATE INDEX idx_sources_entry ON genius.sources (entry_id);
CREATE INDEX idx_sources_tenant ON genius.sources (tenant_id);
CREATE INDEX idx_sources_module ON genius.sources (source_module) WHERE source_module IS NOT NULL;
```

### 4.6 genius.lint_results

| Column      | Type               | Constraints                     | Description                                                                                                             |
| ----------- | ------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| id          | UUID               | PK, DEFAULT gen_random_uuid()   | UUID v7                                                                                                                 |
| tenant_id   | UUID               | NOT NULL, FK global.tenants(id) | Tenant isolation                                                                                                        |
| entry_id    | UUID               | NOT NULL, FK genius.entries(id) | Which entry has the issue                                                                                               |
| lint_type   | genius.lint_type   | NOT NULL                        | Type of inconsistency                                                                                                   |
| description | TEXT               | NOT NULL                        | Human-readable description: "KB says margin ~40%, ERP shows 28%"                                                        |
| evidence    | JSONB              | NOT NULL                        | Structured evidence: { "kb_value": "40%", "real_value": "28%", "source": "erp.income_statements", "period": "2026-03" } |
| status      | genius.lint_status | NOT NULL DEFAULT 'pending'      | Resolution status                                                                                                       |
| resolved_by | UUID               | NULL, FK global.users(id)       | Who resolved (NULL if auto-resolved)                                                                                    |
| resolved_at | TIMESTAMPTZ        | NULL                            | When resolved                                                                                                           |
| created_at  | TIMESTAMPTZ        | NOT NULL DEFAULT NOW()          |                                                                                                                         |

**Indexes:**

```sql
CREATE INDEX idx_lint_tenant_status ON genius.lint_results (tenant_id, status) WHERE status = 'pending';
CREATE INDEX idx_lint_entry ON genius.lint_results (entry_id);
```

### 4.7 genius.l0_cache

| Column       | Type        | Constraints                             | Description                                                             |
| ------------ | ----------- | --------------------------------------- | ----------------------------------------------------------------------- |
| id           | UUID        | PK, DEFAULT gen_random_uuid()           | UUID v7                                                                 |
| tenant_id    | UUID        | NOT NULL, FK global.tenants(id), UNIQUE | One L0 cache per tenant                                                 |
| summary_text | TEXT        | NOT NULL                                | The compiled L0 summary (~200-500 tokens). Injected into every AI call. |
| token_count  | INTEGER     | NOT NULL                                | Exact token count (must stay under 500)                                 |
| generated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW()                  | When this L0 was last compiled                                          |
| updated_at   | TIMESTAMPTZ | NOT NULL DEFAULT NOW()                  |                                                                         |

**Indexes:**

```sql
CREATE UNIQUE INDEX idx_l0_tenant ON genius.l0_cache (tenant_id);
```

---

## 5. Screens & Wireframes

### 5.1 Genius Home — Sector Overview

```
+-----------------------------------------------------------------------------+
|  Genius > Base de Conhecimento                    [+ Adicionar contexto]     |
+-----------------------------------------------------------------------------+
|                                                                               |
|  Seu negocio em 9 setores. Quanto mais contexto, melhor a IA entende voce.  |
|                                                                               |
|  +--NEGOCIO--+ +--FINANCEIRO-+ +-PRODUTO----+ +-OPERACAO---+ +-MARKETING-+  |
|  | ●●●       | | ●●○         | | ●●○        | | ●●●        | | ●○○       |  |
|  | 12 entries | | 8 entries   | | 15 entries | | 11 entries | | 4 entries |  |
|  | Atualizado | | 1 alerta    | | Atualizado | | Atualizado | | Incompleto|  |
|  |  ha 2 dias | |             | |  ha 5 dias | |  ontem     | |           |  |
|  +-----------+ +-------------+ +------------+ +------------+ +-----------+  |
|                                                                               |
|  +--ATENDIMENTO+ +-CRIATIVO---+ +--TIME------+ +-LOGISTICA--+               |
|  | ●○○          | | ●○○        | | ●●○        | | ●●○        |               |
|  | 3 entries    | | 2 entries  | | 6 entries  | | 7 entries  |               |
|  | 2 alertas   | | Incompleto | | Atualizado | | Atualizado |               |
|  +--------------+ +------------+ +------------+ +------------+               |
|                                                                               |
|  +--- ALERTAS DE CONSISTENCIA (3) ------------------------------------------+|
|  |  ⚠ Financeiro: KB diz margem ~40%, DRE Mar/2026 mostra 28%     [Revisar]||
|  |  ⚠ Atendimento: 40% dos tickets sobre prazo (novo padrao)      [Revisar]||
|  |  ⚠ Atendimento: SKU-0445 com 3x mais reclamacoes de defeito    [Revisar]||
|  +--------------------------------------------------------------------------+|
|                                                                               |
|  Ultima atualizacao automatica: ha 3 horas                                   |
|  Proximo lint programado: amanha 04:00                                       |
+-----------------------------------------------------------------------------+
```

### 5.1.1 Genius Home — AutoDream Card (conditional, shows only when changes were made)

```
+--- CONSOLIDACAO NOTURNA (03/04/2026) -----------------------------------+
|  AutoDream processou 14 fontes de ontem e encontrou:                     |
|                                                                           |
|  + 2 entries criados (draft)                                             |
|    • "Fornecedor Malha Premium — reclamacoes recorrentes de atraso"      |
|      Fontes: PLM comment, Astro chat x2, reuniao diaria                  |
|    • "Clientes VIP pedindo mais opcoes de tamanho GG"                    |
|      Fontes: Mensageria pattern, Astro chat, CRM segment                 |
|                                                                           |
|  ~ 1 entry atualizado                                                    |
|    • "Processo de devolucao" — adicionado insight sobre prazo medio       |
|                                                                           |
|  [Revisar entries]                                          [Dispensar]  |
+--------------------------------------------------------------------------+
```

### 5.1.2 Genius Sector View — Trend Entry with Sparkline

```
+-----------------------------------------------------------------------------+
|  Genius > Financeiro                                                        |
+-----------------------------------------------------------------------------+
|                                                                               |
|  +--- ENTRIES ---------------------------------------------------------------+
|  |  📊 Margem bruta — tendencia de queda          ▇▅▂  ↓ declining         |
|  |     40% (Jan) → 35% (Fev) → 28% (Mar)          [Ver detalhes]           |
|  |                                                                           |
|  |  ● Faturamento medio mensal: ~R$ 170k                         verified  |
|  |  ● Maiores custos: producao (45%), frete (20%), marketing (15%) verified  |
|  |  ● Meta de margem: 40%                                        verified  |
|  |  ○ Custo de frete subindo com novo transportador               draft    |
|  +--------------------------------------------------------------------------+
```

### 5.2 Onboarding — Etapa 1 (Guided Audio)

```
+-----------------------------------------------------------------------------+
|  Genius > Configurar Base de Conhecimento > Etapa 1                         |
+-----------------------------------------------------------------------------+
|                                                                               |
|  Conte sobre seu negocio. Grave um audio (ou escreva) sobre cada tema.      |
|  Nao precisa ser perfeito — fale como se explicasse pra um socio novo.      |
|                                                                               |
|  +--- 1. O NEGOCIO (3-5 min) -------------------------------------------+  |
|  |  "O que voces vendem, pra quem, e como?"                               |  |
|  |                                                                         |  |
|  |  [Gravar audio]  [Upload audio]  [Escrever texto]                      |  |
|  |                                                                         |  |
|  |  Status: Gravado (4:32)                              [Ouvir] [Refazer] |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
|  +--- 2. O TIME (2-3 min) ----------------------------------------------+  |
|  |  "Quem faz o que na empresa? Quais os gargalos de pessoas?"            |  |
|  |                                                                         |  |
|  |  [Gravar audio]  [Upload audio]  [Escrever texto]                      |  |
|  |                                                                         |  |
|  |  Status: Pendente                                                       |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
|  +--- 3. DINHEIRO (2-3 min) --------------------------------------------+  |
|  |  "Quanto faturam, qual a margem, quais os maiores custos?"             |  |
|  |  [Gravar audio]                                                         |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
|  +--- 4. PRODUCAO (3-5 min) --------------------------------------------+  |
|  |  "Como nasce um produto novo ate chegar no cliente? Onde trava?"        |  |
|  |  [Gravar audio]                                                         |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
|  +--- 5. DORES (2-3 min) -----------------------------------------------+  |
|  |  "O que te tira o sono? O que quebra toda semana?"                      |  |
|  |  [Gravar audio]                                                         |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
|  Tempo total estimado: 15-20 minutos                                        |
|  Progresso: 1/5 temas                                                        |
|                                                                               |
|  [Salvar e continuar depois]                            [Concluir Etapa 1]  |
+-----------------------------------------------------------------------------+
```

### 5.3 Onboarding — Etapa 2 (Adaptive Grill)

```
+-----------------------------------------------------------------------------+
|  Genius > Configurar > Etapa 2: Aprofundamento                              |
+-----------------------------------------------------------------------------+
|                                                                               |
|  Com base no que voce contou, queremos entender melhor alguns pontos.       |
|                                                                               |
|  Setor: Producao                                                             |
|  (seu audio mencionou 3 fornecedores mas nao falou sobre prazos)            |
|                                                                               |
|  "Qual o prazo medio de entrega dos seus fornecedores?                      |
|   Algum atrasa com frequencia?"                                             |
|                                                                               |
|  [Gravar audio]  [Escrever texto]                                           |
|                                                                               |
|  Pergunta 2 de 6 (estimamos mais 8 minutos)                                |
|                                                                               |
|  [Pular]                                                    [Proxima]       |
+-----------------------------------------------------------------------------+
```

### 5.4 Onboarding — Etapa 3 (Validation)

```
+-----------------------------------------------------------------------------+
|  Genius > Configurar > Etapa 3: Validacao                                   |
+-----------------------------------------------------------------------------+
|                                                                               |
|  Entendemos o seguinte sobre seu negocio.                                   |
|  Corrija o que estiver errado:                                              |
|                                                                               |
|  +--- NEGOCIO -------------------------------------------------------+     |
|  |  Segmento: Streetwear masculino                             [Editar]|     |
|  |  Canais: DTC (Shopify) + B2B atacado                        [Editar]|     |
|  |  Diferencial: Drops limitados, comunidade engajada          [Editar]|     |
|  +------------------------------------------------------------------+      |
|                                                                               |
|  +--- FINANCEIRO ----------------------------------------------------+     |
|  |  Faturamento: ~R$ 170k/mes                                  [Editar]|     |
|  |  Margem media: ~35-40%                                      [Editar]|     |
|  |  Maiores custos: producao, frete, marketing                 [Editar]|     |
|  +------------------------------------------------------------------+      |
|                                                                               |
|  +--- PRODUCAO ------------------------------------------------------+     |
|  |  Modelo: 100% terceirizado (faccao)                         [Editar]|     |
|  |  Fornecedores: 3 principais                                 [Editar]|     |
|  |  Lead time medio: 15-20 dias                                [Editar]|     |
|  |  Maior dor: PCP e controle de prazos                        [Editar]|     |
|  +------------------------------------------------------------------+      |
|                                                                               |
|  [Tem mais coisas pra contar]                         [Confirmar tudo]      |
+-----------------------------------------------------------------------------+
```

---

## 6. API Endpoints

All endpoints follow [API.md](../../architecture/API.md). Module prefix: `/api/v1/genius`.

### 6.1 Sectors

| Method | Path           | Auth     | Description                          |
| ------ | -------------- | -------- | ------------------------------------ |
| GET    | `/sectors`     | Internal | List all sectors for tenant          |
| POST   | `/sectors`     | Internal | Create sector (or let AI propose)    |
| PATCH  | `/sectors/:id` | Internal | Update sector name/description/order |
| DELETE | `/sectors/:id` | Internal | Soft-delete sector                   |

### 6.2 Entries

| Method | Path                         | Auth     | Description                   |
| ------ | ---------------------------- | -------- | ----------------------------- |
| GET    | `/sectors/:sectorId/entries` | Internal | List entries in a sector      |
| GET    | `/entries/:id`               | Internal | Get single entry with sources |
| POST   | `/sectors/:sectorId/entries` | Internal | Create entry manually         |
| PATCH  | `/entries/:id`               | Internal | Update entry content          |
| DELETE | `/entries/:id`               | Internal | Soft-delete entry             |

### 6.3 Search & Retrieval (Progressive Disclosure)

| Method | Path                | Auth     | Description                                 |
| ------ | ------------------- | -------- | ------------------------------------------- |
| GET    | `/l0`               | Internal | Get L0 summary for tenant (~200-500 tokens) |
| GET    | `/l1`               | Internal | Get L1 sector map with TF-IDF keywords      |
| GET    | `/search?q=`        | Internal | L2 BM25 search across all entries           |
| GET    | `/entries/:id/full` | Internal | L3 full entry read with sources             |

### 6.4 Onboarding

| Method | Path                          | Auth     | Description                                   |
| ------ | ----------------------------- | -------- | --------------------------------------------- |
| POST   | `/onboarding/propose-sectors` | Internal | AI proposes sectors from business description |
| POST   | `/onboarding/transcribe`      | Internal | Upload audio → transcribe → return text       |
| POST   | `/onboarding/distill`         | Internal | Distill text/transcription into KB entries    |
| POST   | `/onboarding/validate`        | Internal | Generate validation summary for Etapa 3       |
| POST   | `/onboarding/confirm`         | Internal | Confirm KB v1, generate L0 cache              |

### 6.5 Context & Linting

| Method | Path                     | Auth     | Description                             |
| ------ | ------------------------ | -------- | --------------------------------------- |
| POST   | `/context/add`           | Internal | Add new context (audio, text, document) |
| GET    | `/lint-results`          | Internal | List pending lint results               |
| PATCH  | `/lint-results/:id`      | Internal | Resolve lint result (accept/dismiss)    |
| POST   | `/actions/regenerate-l0` | Internal | Force L0 cache regeneration             |

### 6.6 Internal (Module-to-Module)

| Method | Path                           | Auth               | Description                                 |
| ------ | ------------------------------ | ------------------ | ------------------------------------------- |
| POST   | `/internal/distill`            | Service-to-service | Other modules send content for distillation |
| GET    | `/internal/context?module=erp` | Service-to-service | Get relevant Genius context for a module    |

---

## 7. Business Rules

| #   | Rule                                        | Detail                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **L0 token limit**                          | L0 cache must stay under 500 tokens. Regenerated when entries are added/modified. Uses Gemini Flash (tier `structured`) for compression.                                                                                                                                                                                                                                                            |
| R2  | **Distill filter**                          | Distill prompt includes: "Extract only business decisions, quantitative data, process changes, and strategic context. Ignore greetings, social conversation, routine operations. Return NO_DISTILL if nothing relevant."                                                                                                                                                                            |
| R3  | **Distill sources — Always**                | Astro chat conversations, meeting notes, Genius audio/text input, PLM comments. Distilled on every interaction.                                                                                                                                                                                                                                                                                     |
| R4  | **Distill sources — Daily digest**          | Task comments, registered decisions. Batch distilled daily.                                                                                                                                                                                                                                                                                                                                         |
| R5  | **Distill sources — Never**                 | Mensageria inbox conversations, system logs. These feed other modules (Support Intelligence), not direct distill.                                                                                                                                                                                                                                                                                   |
| R6  | **Support Intelligence pipeline**           | Mensageria classifies each closed ticket (category, sentiment, product, resolution) via Gemini Flash (~200 tokens/ticket). CRM aggregates weekly. Top patterns distilled into Genius Atendimento sector.                                                                                                                                                                                            |
| R7  | **Lint schedule**                           | Financial: monthly (after DRE generation). Operational + Support: weekly. Customer profile: monthly. Static business data: quarterly.                                                                                                                                                                                                                                                               |
| R8  | **Lint cross-reference**                    | Financial lint queries: `erp.income_statements`, `erp.margin_calculations`. Operational lint queries: `pcp.production_orders`, `pcp.suppliers`. Customer lint queries: `crm.segments`, `crm.contacts` aggregates.                                                                                                                                                                                   |
| R9  | **Confidence decay**                        | Entries not validated for 2x their lint cycle lose 0.1 confidence per missed cycle. Entries below 0.5 confidence are flagged for review.                                                                                                                                                                                                                                                            |
| R10 | **Sector proposal**                         | AI proposes sectors from initial business description + niche template. Niche templates: fashion, food, tech, services, general. Templates define default sectors + grill questions.                                                                                                                                                                                                                |
| R11 | **Speaker diarization**                     | Daily/meeting audio transcribed with speaker identification. Requires initial voice profile setup (one-time per team member). Uses AssemblyAI speaker diarization.                                                                                                                                                                                                                                  |
| R12 | **RBAC on Genius output**                   | Genius stores all data regardless of sensitivity. Astro filters output by user permissions. User without `erp:margin_calculations:read` cannot receive margin data from Genius via Astro. Response: "Voce nao tem acesso a informacoes sensiveis deste setor."                                                                                                                                      |
| R13 | **Onboarding is optional but incentivized** | Tenant can skip onboarding. Module shows completeness indicators and contextualizes: "Com mais contexto, a IA pode te ajudar com X." Progressive disclosure of value.                                                                                                                                                                                                                               |
| R14 | **Astro consome apenas verified**           | Por default, Astro lê apenas entries com `status = 'verified'`. Entries `draft` podem ser acessadas com flag explícito e aviso ao usuário de que o conteúdo não está verificado. L0 cache é compilado apenas de entries `verified`.                                                                                                                                                                 |
| R15 | **Live data override KB**                   | Se SQL ao vivo diverge de entry `verified`, Astro prioriza o dado live, inclui aviso na resposta, e sinaliza o entry para re-verificação no próximo ciclo de linting.                                                                                                                                                                                                                               |
| R16 | **AutoDream schedule**                      | AutoDream roda 1x/dia às 03:00 BRT via Vercel Cron. Processa todas as `genius_sources` criadas nas últimas 24h. Se nenhuma source nova no dia, job encerra sem chamada LLM (custo zero).                                                                                                                                                                                                            |
| R17 | **AutoDream model & cost**                  | Usa Gemini Flash (tier `structured`) para consolidação. Custo estimado: ~$0.003/run. Mensal: ~$0.09/tenant. Prompt template inclui: "Cruze todas as fontes do dia. Identifique padrões cross-module, contradições internas, e insights que nenhuma fonte individual revela. Retorne NO_CONSOLIDATION se não houver padrões relevantes."                                                             |
| R18 | **AutoDream entry lifecycle**               | Entries criadas pelo AutoDream nascem como `draft` com `source_type = 'autodream_consolidation'`. Seguem o Knowledge Verification Pipeline existente (seção 7.5). Nunca são promovidas automaticamente — requerem lint ou revisão humana.                                                                                                                                                           |
| R19 | **AutoDream dedup**                         | Antes de criar nova entry, AutoDream faz BM25 search por entries existentes. Se score > 0.8 em entry existente: atualiza `content_md` (append de novo insight) em vez de criar entry nova. Update preserva `status` atual da entry existente. Nova source é adicionada com `source_type = 'autodream_consolidation'`.                                                                               |
| R20 | **Trend entry requirements**                | Trend entries requerem mínimo 3 datapoints para serem criadas. Metadata formato: `{ "datapoints": [{"date": "2026-01", "value": 40, "unit": "%"}, ...], "direction": "declining", "metric_source": "erp.income_statements" }`. Direction: `rising`, `declining`, `volatile`, `stable`. Trend entries são atualizadas in-place (novo datapoint adicionado) em vez de criar entry nova a cada ciclo.  |
| R21 | **Trend detection trigger**                 | Trend detection roda dentro dos ciclos de lint existentes (semanal/mensal). Quando lint detecta divergência na mesma métrica pela 3ª+ vez (contada via `genius_lint_results` histórico da mesma entry), cria entry tipo `trend` com datapoints extraídos dos `evidence` JSONBs dos lint_results anteriores. Não requer chamada LLM adicional — é lógica SQL/app sobre dados já coletados pelo lint. |

---

## 7.5 Knowledge Verification Pipeline

Todo conhecimento passa por: **raw evidence → candidate (draft) → verified → promoted (consumível)**.

### Regras de criação de entries

| Origem                                                       | status inicial | Justificativa                                 |
| ------------------------------------------------------------ | -------------- | --------------------------------------------- |
| Onboarding (áudio/texto guiado)                              | `verified`     | Humano validou diretamente durante onboarding |
| Edição manual por admin/pm                                   | `verified`     | Humano editou com intenção explícita          |
| Distill automático (Astro chat, meeting notes, PLM comments) | `draft`        | Origem automática — requer verificação        |
| Linting `auto_resolved`                                      | `verified`     | Lint confirmou com dados reais                |
| Entrada criada via `/context/add` por admin                  | `verified`     | Humano adicionou diretamente                  |

### Regras de promoção

- Linting system (existente) valida `draft` entries contra dados reais
- Se lint passa sem inconsistência: `draft` → `verified` (auto, dentro do ciclo de lint)
- Se lint detecta problema: `draft` → `rejected` + lint_result criado para revisão
- Claims financeiras (entry_type = 'metric' com dados numéricos): requerem lint financeiro (mensal) antes de promoção
- Claims operacionais: requerem lint operacional (semanal) antes de promoção

### Regras de deprecação

- Quando nova versão de um entry é verificada, a versão anterior recebe `status = 'superseded'`
- Entries `superseded` são mantidas por 90 dias antes de serem arquivadas (soft delete)
- Entries `rejected` são mantidas por 30 dias para auditoria
- Política: nunca deletar permanentemente — sempre mover para `superseded` ou `rejected`

### Consumo por Astro

| Contexto               | Comportamento                                       |
| ---------------------- | --------------------------------------------------- |
| Default (toda query)   | WHERE status = 'verified'                           |
| L0 cache compilation   | WHERE status = 'verified'                           |
| L1/L2 search           | WHERE status = 'verified' (drafts não aparecem)     |
| Flag explícito (admin) | Pode ler drafts com aviso "conteúdo não verificado" |

---

## 8. Integrations

### 8.1 Inbound (feeds INTO Genius)

| Source         | Data                                                       | Trigger                           |
| -------------- | ---------------------------------------------------------- | --------------------------------- |
| **Onboarding** | Audio/text from grill interview                            | Manual (tenant owner)             |
| **Astro**      | Chat conversations with business context                   | Per conversation (always distill) |
| **PLM**        | Comments on production orders, supplier notes              | Per comment (always distill)      |
| **Tarefas**    | Task comments, meeting notes                               | Daily digest batch                |
| **CRM**        | Support Intelligence patterns (aggregated from Mensageria) | Weekly batch                      |
| **ERP**        | Financial metrics for lint validation                      | Monthly (post-DRE)                |
| **Documents**  | PDF, spreadsheet, text uploads                             | Manual (admin uploads)            |

### 8.2 Outbound (Genius provides TO)

| Consumer        | Data                                            | Pattern                                               |
| --------------- | ----------------------------------------------- | ----------------------------------------------------- |
| **Astro**       | L0 (always) + L1/L2/L3 (on demand)              | Every AI call includes L0. Search on complex queries. |
| **All modules** | Module-relevant context via `/internal/context` | Module requests context filtered by relevance         |
| **Dashboard**   | Contextual annotations for KPIs                 | "Margin 28% — below your target of 40% (Genius)"      |
| **PLM**         | AI pre-fill for product names/descriptions      | On product approval stage                             |

---

## 9. Background Jobs

| Job Name                         | Schedule                          | Priority | Description                                                                                                                                                                                                                                                 |
| -------------------------------- | --------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `genius:daily-distill`           | Daily 05:00 BRT                   | Medium   | Batch distill from daily-digest sources (task comments, decisions).                                                                                                                                                                                         |
| `genius:weekly-lint-operational` | Weekly Mon 04:00 BRT              | Medium   | Lint operational + support entries against PLM and CRM data.                                                                                                                                                                                                |
| `genius:monthly-lint-financial`  | Monthly 2nd at 04:00 BRT          | Medium   | Lint financial entries against DRE and margin data. Post-DRE (DRE generates on 1st).                                                                                                                                                                        |
| `genius:quarterly-lint-static`   | Quarterly 1st at 04:00 BRT        | Low      | Lint static business data (niche, model, channels).                                                                                                                                                                                                         |
| `genius:l0-regeneration`         | On entry change + daily 06:00 BRT | High     | Recompile L0 cache. Triggered by entry CRUD or daily refresh.                                                                                                                                                                                               |
| `genius:keyword-extraction`      | Daily 06:30 BRT                   | Low      | Recalculate TF-IDF keywords per sector for L1 overview.                                                                                                                                                                                                     |
| `genius:support-intelligence`    | Weekly Fri 04:00 BRT              | Medium   | Aggregate support ticket classifications from CRM → distill top patterns into Genius.                                                                                                                                                                       |
| `genius:confidence-decay`        | Weekly Mon 05:00 BRT              | Low      | Reduce confidence score for entries past their validation cycle. Flag entries below 0.5.                                                                                                                                                                    |
| `genius:autodream`               | Daily 03:00 BRT                   | High     | Nightly consolidation inspired by KAIROS AutoDream. Reads all sources from last 24h, sends cross-referencing prompt to Gemini Flash (tier `structured`), generates/updates entries as `draft`. Skips if no new sources. Dedup via BM25 before insert (R19). |
| `genius:trend-detection`         | Within weekly/monthly lint cycles | Medium   | After lint completes, checks `genius_lint_results` history per entry. If same metric diverged 3+ times, creates/updates `trend` entry with datapoints from lint evidence. No extra LLM call — pure SQL/app logic (R21).                                     |

---

## 10. Permissions

| Permission                  | admin | pm  | creative | operations | support | finance | commercial | b2b | creator |
| --------------------------- | ----- | --- | -------- | ---------- | ------- | ------- | ---------- | --- | ------- |
| `genius:sectors:read`       | Y     | Y   | --       | --         | --      | --      | --         | --  | --      |
| `genius:sectors:write`      | Y     | --  | --       | --         | --      | --      | --         | --  | --      |
| `genius:entries:read`       | Y     | Y   | --       | --         | --      | --      | --         | --  | --      |
| `genius:entries:write`      | Y     | --  | --       | --         | --      | --      | --         | --  | --      |
| `genius:onboarding:execute` | Y     | --  | --       | --         | --      | --      | --         | --  | --      |
| `genius:lint:read`          | Y     | Y   | --       | --         | --      | --      | --         | --  | --      |
| `genius:lint:resolve`       | Y     | --  | --       | --         | --      | --      | --         | --  | --      |
| `genius:context:add`        | Y     | Y   | --       | --         | --      | --      | --         | --  | --      |

**Notes:**

- Only `admin` can execute onboarding and write to the KB.
- `pm` can read and add context but not modify existing entries.
- All other roles consume Genius indirectly via Astro (filtered by RBAC).

---

## 11. Notifications (Flare Events)

| Event Key                         | Trigger                                    | Channels        | Recipients         | Priority |
| --------------------------------- | ------------------------------------------ | --------------- | ------------------ | -------- |
| `genius.lint_inconsistency`       | Lint detects data mismatch                 | In-app          | `admin`            | Medium   |
| `genius.onboarding_complete`      | Tenant completes onboarding                | In-app          | `admin`            | Low      |
| `genius.sector_incomplete`        | Sector has < 3 entries after 7 days        | In-app          | `admin`            | Low      |
| `genius.confidence_low`           | Entry confidence drops below 0.5           | In-app          | `admin`            | Medium   |
| `genius.support_pattern_detected` | New significant support pattern identified | In-app, Discord | `admin`, `support` | High     |

---

## 12. Error Handling

| Error Code                    | HTTP | When                     | User-facing Message                                          |
| ----------------------------- | ---- | ------------------------ | ------------------------------------------------------------ |
| `GENIUS_SECTOR_NOT_FOUND`     | 404  | Sector ID not found      | "Setor nao encontrado."                                      |
| `GENIUS_ENTRY_NOT_FOUND`      | 404  | Entry ID not found       | "Entrada nao encontrada."                                    |
| `GENIUS_TRANSCRIPTION_FAILED` | 502  | Whisper/AssemblyAI error | "Falha na transcricao. Tente novamente ou envie como texto." |
| `GENIUS_AUDIO_TOO_LONG`       | 422  | Audio exceeds 60 minutes | "Audio muito longo. Maximo 60 minutos por gravacao."         |
| `GENIUS_L0_GENERATION_FAILED` | 500  | L0 compilation failed    | "Falha ao gerar resumo. Tentando novamente automaticamente." |
| `GENIUS_DISTILL_FAILED`       | 500  | Distill LLM call failed  | _(not user-facing — logged, retried)_                        |
| `GENIUS_DOCUMENT_UNSUPPORTED` | 422  | Unsupported file type    | "Formato nao suportado. Envie PDF, XLSX, CSV ou TXT."        |

---

## 13. AI Infrastructure

### 13.1 AI Gateway (Provider Pattern)

Genius uses the same Provider abstraction as all Ambaril integrations:

```
genius.distill(text)     → ai.complete(prompt)     → GoogleProvider (Gemini 2.5 Flash)
genius.compileSources()  → ai.complete(prompt)     → AnthropicProvider (Claude Sonnet)
genius.transcribe(audio) → transcription.transcribe → WhisperProvider / AssemblyAIProvider
```

**Multi-model strategy (ADR decision — Anthropic + Google only):**

Ambaril usa dois fornecedores de LLM, cada um no que faz melhor:

| Tier             | Modelo                        | Quando usar                                                                                                                                               |
| ---------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`reasoning`**  | Claude Sonnet 4.6 (Anthropic) | Chat interativo, geração criativa, onboarding grill, document compilation — tarefas que exigem raciocínio, nuance em PT-BR, ou qualidade criativa         |
| **`structured`** | Gemini 2.5 Flash (Google)     | Distill, lint, classificação, L0 compilation, AutoDream, report formatting — tarefas estruturadas de alto volume onde custo importa mais que criatividade |

**Por que esses dois:**

- **Sonnet** é superior em instrução following, raciocínio e qualidade criativa em PT-BR (geração de copy, chat, entrevista adaptativa)
- **Gemini Flash** é ~70% mais barato que Haiku e excelente em tarefas estruturadas (extração, classificação, comparação). 1M tokens de contexto

**Regra:** Toda operação AI tem um `modelTier` (`'reasoning'` ou `'structured'`). O registry resolve qual provider usar. Troca de provider = zero mudança na lógica de negócio.

Providers are swappable. Future: SelfHostedProvider (vLLM), BYOKProvider (tenant brings own key — advanced setting, never default).

### 13.2 Model Usage

| Operation                              | Model Tier   | Model            | Cost Estimate                         |
| -------------------------------------- | ------------ | ---------------- | ------------------------------------- |
| Distill (per conversation/comment)     | `structured` | Gemini 2.5 Flash | ~$0.0003                              |
| L0 compilation                         | `structured` | Gemini 2.5 Flash | ~$0.0005                              |
| Onboarding grill (adaptive questions)  | `reasoning`  | Claude Sonnet    | ~$0.05 per session                    |
| Document compilation (PDF/spreadsheet) | `reasoning`  | Claude Sonnet    | ~$0.02 per document                   |
| Lint validation                        | `structured` | Gemini 2.5 Flash | ~$0.001 per lint cycle                |
| Support ticket classification          | `structured` | Gemini 2.5 Flash | ~$0.0001 per ticket                   |
| Transcription (Whisper)                | —            | Whisper          | ~$0.006/min audio                     |
| AutoDream nightly consolidation        | `structured` | Gemini 2.5 Flash | ~$0.003 per run (daily, ~$0.09/month) |

**Estimated total cost per tenant/month:** $3-8 (85% Gemini Flash, 15% Sonnet). ~55% cheaper than all-Anthropic. Trend detection has zero LLM cost (SQL logic only).

### 13.3 Transcription

| Provider                 | Role                           | Quality PT-BR |
| ------------------------ | ------------------------------ | ------------- |
| **Whisper (OpenAI API)** | Default                        | Very good     |
| **AssemblyAI**           | Fallback + speaker diarization | Very good     |

Speaker diarization for dailies/meetings requires AssemblyAI (native support). Regular onboarding audio uses Whisper (cheaper, sufficient without diarization).

---

## 14. Testing Checklist

### 14.1 Unit Tests

- [ ] L0 cache generation stays under 500 tokens
- [ ] BM25 search returns relevant results for PT-BR queries
- [ ] TF-IDF keyword extraction produces meaningful sector keywords
- [ ] Distill prompt correctly returns NO_DISTILL for irrelevant content
- [ ] Confidence decay calculation (0.1 per missed cycle, floor at 0.0)
- [ ] RBAC filtering: user without erp:read cannot get financial entries via Astro

### 14.2 Integration Tests

- [ ] Onboarding flow: describe business → propose sectors → accept → grill → distill → L0 generated
- [ ] Audio upload → transcription → distill → entry created with source attribution
- [ ] Document upload (PDF) → LLM compilation → entries created in correct sector
- [ ] Lint: inject known ERP data diverging from KB → lint detects and creates result
- [ ] Support Intelligence: mock ticket classifications → weekly aggregate → Genius entry created
- [ ] Module context injection: ERP requests context → receives relevant entries only
- [ ] RBAC: creative role asks Astro about margins → Astro blocks with permission message

### 14.3 AutoDream Tests

- [ ] AutoDream skips when no sources in last 24h (zero LLM calls, zero cost)
- [ ] AutoDream consolidates 5+ sources from different modules into cross-module insight entry
- [ ] AutoDream dedup: when similar entry exists (BM25 > 0.8), updates instead of creating new
- [ ] AutoDream entries created as `draft` with `source_type = 'autodream_consolidation'`
- [ ] AutoDream summary card appears on Genius Home only when changes were made
- [ ] AutoDream respects tenant isolation (never cross-tenant consolidation)

### 14.4 Trend Detection Tests

- [ ] Trend entry NOT created with fewer than 3 datapoints
- [ ] Trend entry created when same metric diverges 3+ times across lint cycles
- [ ] Trend `metadata.datapoints` matches format: `[{date, value, unit}]` with correct `direction`
- [ ] Trend entry updated in-place when new datapoint detected (not duplicated)
- [ ] Sparkline renders correctly for rising, declining, volatile, and stable trends
- [ ] Sparkline color logic: green for positive direction on positive metrics, red for negative

### 14.5 E2E Tests

- [ ] Full onboarding: Etapa 1 (5 audio blocks) → Etapa 2 (adaptive) → Etapa 3 (validate) → KB created
- [ ] Genius home: sectors display with correct completeness, lint alerts visible
- [ ] Add context: record audio → entry appears in sector → L0 updates
- [ ] Lint resolution: admin reviews inconsistency → accepts update → entry modified → confidence restored
- [ ] Full AutoDream cycle: sources created during day → 03:00 job → draft entries appear → admin reviews → verified
- [ ] Full trend cycle: 3 monthly lints with margin change → trend entry created → sparkline visible on Genius Home

---

## 15. Feature Roadmap

### v1 (Launch — with Astro)

- Onboarding grill (3 etapas: guided audio, adaptive follow-up, validation)
- Sector management (AI-proposed, configurable)
- Progressive disclosure (L0/L1/L2/L3)
- Manual context addition (audio, text, documents)
- L0 cache (always-loaded tenant summary)
- BM25 search
- Auto-distill from Astro conversations
- Basic linting (financial post-DRE, operational weekly)
- RBAC-filtered output via Astro
- **AutoDream nightly consolidation** (cross-module pattern detection, inspired by KAIROS)
- **Trend detection** (within linting — auto-generates `trend` entries with datapoints)
- **Trend sparkline visualization** (inline mini-charts on trend entries)

### v2

- Speaker diarization for dailies/meetings (AssemblyAI)
- Support Intelligence pipeline (Mensageria → CRM → Genius)
- Document compilation (PDF, spreadsheet → structured entries)
- Advanced linting (cross-module validation with evidence)
- Confidence scoring and decay
- Niche templates (fashion, food, tech, services)

### v3

- Self-hosted AI models (SelfHostedProvider)
- BYOK option (advanced tenants)
- Genius-powered automation suggestions
- Knowledge graph visualization
- Export to Obsidian-compatible markdown

---

## Appendix A: Niche Templates

### Fashion (Default — CIENA)

**Default sectors:** Negocio, Financeiro, Produto, Operacao, Marketing, Atendimento, Criativo, Time, Logistica
**Grill emphasis:** Suppliers, lead times, fabric/trims, sizing, drops/collections, production flow

### Food (Future)

**Default sectors:** Negocio, Financeiro, Cardapio & Produto, Cozinha & Operacao, Espaco Fisico, Delivery, Marketing, Atendimento, Time
**Grill emphasis:** Perishability, health regulations, kitchen flow, delivery logistics, location impact

### General (Fallback)

**Default sectors:** Negocio, Financeiro, Produto/Servico, Operacao, Marketing, Atendimento, Time
**Grill emphasis:** Generic business questions, adaptable to any niche

---

_This module spec is the source of truth for Genius implementation. Changes require review from Marcus (admin)._
