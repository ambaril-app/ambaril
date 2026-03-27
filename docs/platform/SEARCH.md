# Ambaril — Global Search System

> **Version:** 1.0
> **Date:** March 2026
> **Status:** Approved
> **References:** [DS.md](../../DS.md) (section 9.2), [DATABASE.md](../architecture/DATABASE.md) (global.search_index, section 7.2-7.3), [AUTH.md](../architecture/AUTH.md) (RBAC), [STACK.md](../architecture/STACK.md)

---

## 1. Overview

The Global Search bar is a cross-cutting platform feature that allows internal users to search across all modules from a single input. It is positioned at the top of every page in the `(admin)` route group and is accessible via the `/` keyboard shortcut (like GitHub) or by clicking the search input.

**Key characteristics:**

- **Unified search** across all modules — Products, SKUs, Orders, Contacts, Creators, Suppliers, Tasks, B2B Retailers, and Assets
- **Full-text search** powered by PostgreSQL `tsvector` / `tsquery` with the Portuguese language configuration
- **Permission-filtered** results — users only see entities they have RBAC access to (AUTH.md section 3)
- **Grouped results** displayed in a dropdown organized by section headers
- **Sub-200ms response** target via GIN indexes, connection pooling, and optional Redis caching

---

## 2. Searchable Entities

| Entity | Module | Schema.Table | Indexed Fields | Display Format in Results | Weight |
|--------|--------|-------------|---------------|--------------------------|--------|
| Product | ERP | `erp.products` | name, description, category | {name} — {category} — {sku_count} variantes | A (highest) |
| SKU | ERP | `erp.skus` | sku_code, product.name, size, color | {sku_code} — {product_name} — {size}/{color} — {qty} un | A |
| Order | Checkout/ERP | `checkout.orders` | order_number, contact.name, contact.cpf | #{order_number} — {contact_name} — {status_badge} | A |
| Contact | CRM | `crm.contacts` | name, email, cpf, phone | {name} — {email} — {segment} | A |
| Creator | Creators | `creators.creators` | name, instagram_handle, coupon_code | @{instagram} — {coupon} — {tier} — {sales_count} vendas | B |
| Supplier | PCP | `pcp.suppliers` | name, cnpj, contact_name | {name} — {type} — Score: {reliability}% | B |
| Task | Tarefas | `tarefas.tasks` | title, description | {title} — {assignee} — {status} | B |
| B2B Retailer | B2B | `b2b.retailers` | name, cnpj, contact_name | {name} — CNPJ: {cnpj} — {status} | C |
| Asset | DAM | `dam.assets` | filename, tags, collection | {filename} — {type} — {collection} | C |

**Weight legend:**
- **A** = highest relevance boost (core operational entities — searched most frequently)
- **B** = medium relevance (secondary entities)
- **C** = lower relevance (supporting entities — appear after A and B results)

---

## 3. Technical Implementation

### 3.1 Dual Search Strategy

Ambaril uses **two complementary approaches** for search:

1. **Per-table `search_vector` columns** — Each searchable table has its own `tsvector` column maintained by triggers. Used for module-specific search within a single table.
2. **Centralized `global.search_index` table** — A cross-module materialized search view. Used for the global search bar.

The global search bar queries `global.search_index` exclusively. Per-table search vectors are used for in-module search features (e.g., searching within the ERP products list).

### 3.2 tsvector Configuration per Entity

All full-text search uses the `portuguese` text search configuration built into PostgreSQL, which handles Portuguese stemming, stop words, and normalization.

#### Products (`erp.products`)

```sql
ALTER TABLE erp.products ADD COAmbaril search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION erp.products_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.category, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_search_trigger
  BEFORE INSERT OR UPDATE OF name, description, category
  ON erp.products
  FOR EACH ROW
  EXECUTE FUNCTION erp.products_search_update();

CREATE INDEX idx_products_search ON erp.products USING GIN(search_vector);
```

#### SKUs (`erp.skus`)

```sql
ALTER TABLE erp.skus ADD COAmbaril search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION erp.skus_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.sku_code, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.size, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.color, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skus_search_trigger
  BEFORE INSERT OR UPDATE OF sku_code, size, color
  ON erp.skus
  FOR EACH ROW
  EXECUTE FUNCTION erp.skus_search_update();

CREATE INDEX idx_skus_search ON erp.skus USING GIN(search_vector);
```

> **Note:** SKU search uses the `simple` configuration for `sku_code` because SKU codes are identifiers (e.g., "SKU-0412") that should not be stemmed.

#### Orders (`checkout.orders`)

```sql
ALTER TABLE checkout.orders ADD COAmbaril search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION checkout.orders_search_update() RETURNS trigger AS $$
DECLARE
  contact_name TEXT;
  contact_cpf TEXT;
BEGIN
  SELECT c.name, c.cpf INTO contact_name, contact_cpf
  FROM crm.contacts c
  WHERE c.id = NEW.contact_id;

  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.order_number, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(contact_name, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(contact_cpf, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_search_trigger
  BEFORE INSERT OR UPDATE OF order_number, contact_id
  ON checkout.orders
  FOR EACH ROW
  EXECUTE FUNCTION checkout.orders_search_update();

CREATE INDEX idx_orders_search ON checkout.orders USING GIN(search_vector);
```

#### Contacts (`crm.contacts`)

```sql
ALTER TABLE crm.contacts ADD COAmbaril search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION crm.contacts_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.email, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.cpf, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.phone, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_search_trigger
  BEFORE INSERT OR UPDATE OF name, email, cpf, phone
  ON crm.contacts
  FOR EACH ROW
  EXECUTE FUNCTION crm.contacts_search_update();

CREATE INDEX idx_contacts_search ON crm.contacts USING GIN(search_vector);
```

#### Creators (`creators.creators`)

```sql
ALTER TABLE creators.creators ADD COAmbaril search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION creators.creators_search_update() RETURNS trigger AS $$
DECLARE
  coupon_code TEXT;
BEGIN
  SELECT c.code INTO coupon_code
  FROM creators.coupons c
  WHERE c.creator_id = NEW.id AND c.is_active = TRUE
  LIMIT 1;

  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.instagram_handle, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(coupon_code, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.email, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER creators_search_trigger
  BEFORE INSERT OR UPDATE OF name, instagram_handle, email
  ON creators.creators
  FOR EACH ROW
  EXECUTE FUNCTION creators.creators_search_update();

CREATE INDEX idx_creators_search ON creators.creators USING GIN(search_vector);
```

#### Suppliers (`pcp.suppliers`)

```sql
ALTER TABLE pcp.suppliers ADD COAmbaril search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION pcp.suppliers_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.cnpj, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.contact_name, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER suppliers_search_trigger
  BEFORE INSERT OR UPDATE OF name, cnpj, contact_name
  ON pcp.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION pcp.suppliers_search_update();

CREATE INDEX idx_suppliers_search ON pcp.suppliers USING GIN(search_vector);
```

#### Tasks (`tarefas.tasks`)

```sql
ALTER TABLE tarefas.tasks ADD COAmbaril search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION tarefas.tasks_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_search_trigger
  BEFORE INSERT OR UPDATE OF title, description
  ON tarefas.tasks
  FOR EACH ROW
  EXECUTE FUNCTION tarefas.tasks_search_update();

CREATE INDEX idx_tasks_search ON tarefas.tasks USING GIN(search_vector);
```

#### B2B Retailers (`b2b.retailers`)

```sql
ALTER TABLE b2b.retailers ADD COAmbaril search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION b2b.retailers_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.cnpj, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.contact_name, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER retailers_search_trigger
  BEFORE INSERT OR UPDATE OF name, cnpj, contact_name
  ON b2b.retailers
  FOR EACH ROW
  EXECUTE FUNCTION b2b.retailers_search_update();

CREATE INDEX idx_retailers_search ON b2b.retailers USING GIN(search_vector);
```

#### Assets (`dam.assets`)

```sql
ALTER TABLE dam.assets ADD COAmbaril search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION dam.assets_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.filename, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.collection, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assets_search_trigger
  BEFORE INSERT OR UPDATE OF filename, tags, collection
  ON dam.assets
  FOR EACH ROW
  EXECUTE FUNCTION dam.assets_search_update();

CREATE INDEX idx_assets_search ON dam.assets USING GIN(search_vector);
```

### 3.3 Global Search Index Population

The `global.search_index` table is populated and kept in sync via application-level hooks that fire on INSERT, UPDATE, and DELETE of searchable entities. See DATABASE.md section 7.3 for the table schema.

```sql
-- Populate search_index from products (with SKU aggregation)
INSERT INTO global.search_index (id, resource_type, resource_id, title, subtitle, metadata, module, search_vector)
SELECT
  gen_random_uuid(),
  'product',
  p.id,
  p.name,
  p.category || ' — ' || COUNT(s.id) || ' variantes',
  jsonb_build_object('category', p.category, 'sku_count', COUNT(s.id)),
  'erp',
  setweight(to_tsvector('portuguese', COALESCE(p.name, '')), 'A') ||
  setweight(to_tsvector('simple', string_agg(COALESCE(s.sku_code, ''), ' ')), 'B') ||
  setweight(to_tsvector('portuguese', COALESCE(p.description, '')), 'C') ||
  setweight(to_tsvector('portuguese', COALESCE(p.category, '')), 'C')
FROM erp.products p
LEFT JOIN erp.skus s ON s.product_id = p.id AND s.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id;

-- Populate search_index from SKUs
INSERT INTO global.search_index (id, resource_type, resource_id, title, subtitle, metadata, module, search_vector)
SELECT
  gen_random_uuid(),
  'sku',
  s.id,
  s.sku_code || ' — ' || p.name,
  s.size || '/' || s.color || ' — ' || COALESCE(i.quantity, 0) || ' un',
  jsonb_build_object('product_id', p.id, 'size', s.size, 'color', s.color, 'quantity', COALESCE(i.quantity, 0)),
  'erp',
  setweight(to_tsvector('simple', COALESCE(s.sku_code, '')), 'A') ||
  setweight(to_tsvector('portuguese', COALESCE(p.name, '')), 'A') ||
  setweight(to_tsvector('portuguese', COALESCE(s.size, '')), 'B') ||
  setweight(to_tsvector('portuguese', COALESCE(s.color, '')), 'B')
FROM erp.skus s
JOIN erp.products p ON p.id = s.product_id
LEFT JOIN erp.inventory i ON i.sku_id = s.id
WHERE s.deleted_at IS NULL AND p.deleted_at IS NULL;

-- Populate search_index from orders
INSERT INTO global.search_index (id, resource_type, resource_id, title, subtitle, metadata, module, search_vector)
SELECT
  gen_random_uuid(),
  'order',
  o.id,
  '#' || o.order_number,
  COALESCE(c.name, 'Cliente nao identificado') || ' — ' || o.status::text,
  jsonb_build_object('status', o.status, 'total', o.total, 'contact_name', c.name),
  'checkout',
  setweight(to_tsvector('simple', COALESCE(o.order_number, '')), 'A') ||
  setweight(to_tsvector('portuguese', COALESCE(c.name, '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE(c.cpf, '')), 'B')
FROM checkout.orders o
LEFT JOIN crm.contacts c ON c.id = o.contact_id
WHERE o.deleted_at IS NULL;

-- Populate search_index from contacts
INSERT INTO global.search_index (id, resource_type, resource_id, title, subtitle, metadata, module, search_vector)
SELECT
  gen_random_uuid(),
  'contact',
  c.id,
  c.name,
  COALESCE(c.email, c.phone, ''),
  jsonb_build_object('email', c.email, 'phone', c.phone, 'segment', COALESCE(c.segment, 'sem segmento')),
  'crm',
  setweight(to_tsvector('portuguese', COALESCE(c.name, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(c.email, '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE(c.cpf, '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE(c.phone, '')), 'C')
FROM crm.contacts c
WHERE c.deleted_at IS NULL;

-- Populate search_index from creators
INSERT INTO global.search_index (id, resource_type, resource_id, title, subtitle, metadata, module, search_vector)
SELECT
  gen_random_uuid(),
  'creator',
  cr.id,
  '@' || cr.instagram_handle || ' — ' || cr.name,
  COALESCE(cp.code, '') || ' — ' || cr.tier::text || ' — ' || COALESCE(sa.sale_count, 0) || ' vendas',
  jsonb_build_object('tier', cr.tier, 'coupon', cp.code, 'sales_count', COALESCE(sa.sale_count, 0)),
  'creators',
  setweight(to_tsvector('portuguese', COALESCE(cr.name, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(cr.instagram_handle, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(cp.code, '')), 'B')
FROM creators.creators cr
LEFT JOIN creators.coupons cp ON cp.creator_id = cr.id AND cp.is_active = TRUE
LEFT JOIN LATERAL (
  SELECT COUNT(*) as sale_count FROM creators.sales_attributions sa WHERE sa.creator_id = cr.id
) sa ON TRUE
WHERE cr.status = 'active';

-- Populate search_index from suppliers
INSERT INTO global.search_index (id, resource_type, resource_id, title, subtitle, metadata, module, search_vector)
SELECT
  gen_random_uuid(),
  'supplier',
  s.id,
  s.name,
  s.type::text || ' — Score: ' || COALESCE(sr.avg_score, 0) || '%',
  jsonb_build_object('type', s.type, 'cnpj', s.cnpj, 'reliability_score', COALESCE(sr.avg_score, 0)),
  'pcp',
  setweight(to_tsvector('portuguese', COALESCE(s.name, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(s.cnpj, '')), 'B') ||
  setweight(to_tsvector('portuguese', COALESCE(s.contact_name, '')), 'B')
FROM pcp.suppliers s
LEFT JOIN LATERAL (
  SELECT AVG(sr.score)::integer as avg_score FROM pcp.supplier_ratings sr WHERE sr.supplier_id = s.id
) sr ON TRUE
WHERE s.deleted_at IS NULL;

-- Populate search_index from tasks
INSERT INTO global.search_index (id, resource_type, resource_id, title, subtitle, metadata, module, search_vector)
SELECT
  gen_random_uuid(),
  'task',
  t.id,
  t.title,
  COALESCE(u.name, 'Nao atribuida') || ' — ' || t.status::text,
  jsonb_build_object('assignee_id', t.assignee_id, 'assignee_name', u.name, 'status', t.status, 'priority', t.priority),
  'tarefas',
  setweight(to_tsvector('portuguese', COALESCE(t.title, '')), 'A') ||
  setweight(to_tsvector('portuguese', COALESCE(t.description, '')), 'C')
FROM tarefas.tasks t
LEFT JOIN global.users u ON u.id = t.assignee_id
WHERE t.deleted_at IS NULL;

-- Populate search_index from B2B retailers
INSERT INTO global.search_index (id, resource_type, resource_id, title, subtitle, metadata, module, search_vector)
SELECT
  gen_random_uuid(),
  'b2b_retailer',
  r.id,
  r.name,
  'CNPJ: ' || COALESCE(r.cnpj, '') || ' — ' || r.status::text,
  jsonb_build_object('cnpj', r.cnpj, 'status', r.status, 'contact_name', r.contact_name),
  'b2b',
  setweight(to_tsvector('portuguese', COALESCE(r.name, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(r.cnpj, '')), 'B') ||
  setweight(to_tsvector('portuguese', COALESCE(r.contact_name, '')), 'B')
FROM b2b.retailers r;

-- Populate search_index from DAM assets
INSERT INTO global.search_index (id, resource_type, resource_id, title, subtitle, metadata, module, search_vector)
SELECT
  gen_random_uuid(),
  'asset',
  a.id,
  a.filename,
  a.mime_type || ' — ' || COALESCE(a.collection, 'sem colecao'),
  jsonb_build_object('mime_type', a.mime_type, 'collection', a.collection, 'tags', a.tags),
  'dam',
  setweight(to_tsvector('portuguese', COALESCE(a.filename, '')), 'A') ||
  setweight(to_tsvector('portuguese', COALESCE(array_to_string(a.tags, ' '), '')), 'B') ||
  setweight(to_tsvector('portuguese', COALESCE(a.collection, '')), 'C')
FROM dam.assets a
WHERE a.deleted_at IS NULL;
```

### 3.4 Global Search Query

The global search bar executes a single query against `global.search_index` with permission filtering:

```sql
-- Global search query with permission-based filtering and ranking
WITH query AS (
  SELECT plainto_tsquery('portuguese', $1) AS q
)
SELECT
  si.resource_type,
  si.resource_id,
  si.title,
  si.subtitle,
  si.metadata,
  si.module,
  ts_rank_cd(si.search_vector, query.q, 32) AS rank
FROM global.search_index si, query
WHERE si.search_vector @@ query.q
  -- Permission filtering (injected dynamically based on user role)
  AND si.resource_type = ANY($2::text[])  -- $2 = allowed resource types for this role
ORDER BY
  -- Primary: weight category (A entities first)
  CASE si.resource_type
    WHEN 'product' THEN 1
    WHEN 'sku' THEN 1
    WHEN 'order' THEN 1
    WHEN 'contact' THEN 1
    WHEN 'creator' THEN 2
    WHEN 'supplier' THEN 2
    WHEN 'task' THEN 2
    WHEN 'b2b_retailer' THEN 3
    WHEN 'asset' THEN 3
    ELSE 4
  END,
  -- Secondary: ts_rank within category
  rank DESC
LIMIT 20;
```

### 3.5 Permission Filtering

Results are filtered based on the requesting user's role. The `$2` parameter in the query above receives the list of allowed `resource_type` values for the current user.

| Role | Allowed Resource Types | Rationale |
|------|----------------------|-----------|
| `admin` | product, sku, order, contact, creator, supplier, task, b2b_retailer, asset | Full access |
| `pm` | product, sku, order, contact, creator, supplier, task, asset | All except B2B retailers (Guilherme's domain) |
| `creative` | task, asset | Creative workspace only — no orders, contacts, financial data, PCP data |
| `operations` | product, sku, order, supplier, task | Operational entities |
| `support` | order, contact, task | Customer support context |
| `finance` | product, sku, order, task | Financial context (read-only for products/orders) |
| `commercial` | b2b_retailer, task | B2B management |

**Implementation in application code:**

```typescript
// lib/search/permissions.ts

const SEARCH_PERMISSIONS: Record<RoleCode, string[]> = {
  admin:      ['product', 'sku', 'order', 'contact', 'creator', 'supplier', 'task', 'b2b_retailer', 'asset'],
  pm:         ['product', 'sku', 'order', 'contact', 'creator', 'supplier', 'task', 'asset'],
  creative:   ['task', 'asset'],
  operations: ['product', 'sku', 'order', 'supplier', 'task'],
  support:    ['order', 'contact', 'task'],
  finance:    ['product', 'sku', 'order', 'task'],
  commercial: ['b2b_retailer', 'task'],
};

export function getAllowedSearchTypes(role: RoleCode): string[] {
  return SEARCH_PERMISSIONS[role] ?? [];
}
```

**Additional scoping for restricted roles:**

For the `creative` role, tasks are further filtered to only show tasks assigned to them:

```sql
-- Creative role: additional task scoping
AND (
  si.resource_type != 'task'
  OR (si.metadata->>'assignee_id')::uuid = $3  -- $3 = session.userId
)
```

---

## 4. Search Result Grouping

Per DS.md section 9.2, search results in the dropdown are grouped by section with uppercase headers.

### 4.1 Section Order and Headers

| Section Header | Resource Type(s) | Icon (Lucide) |
|---------------|------------------|-----------------|
| PRODUTOS | product, sku | `Package` |
| PEDIDOS | order | `Receipt` |
| CLIENTES | contact | `Users` |
| CREATORS | creator | `Star` |
| FORNECEDORES | supplier | `Factory` |
| TAREFAS | task | `CheckSquare` |
| VAREJISTAS B2B | b2b_retailer | `Storefront` |
| ASSETS | asset | `Image` |

### 4.2 Grouping Rules

- **Max 3 results per section** in the dropdown — prevents any single entity type from dominating
- **"Ver todos" link** at the bottom of each section if more results exist — navigates to a full search results page filtered to that entity type
- Sections with zero results are **not rendered** (no empty section headers)
- Section headers: 11px, uppercase, `--text-tertiary`, letter-spacing 0.05em (per DS.md)
- Result items: 14px `--text-primary` for title, 13px `--text-secondary` for subtitle

### 4.3 Result Item Layout

```
┌─────────────────────────────────────────────┐
│  🔍 camiseta preta                     [ESC]│
├─────────────────────────────────────────────┤
│  PRODUTOS                                    │
│  [Package]  Camiseta Preta Basic             │
│             Basicos — 4 variantes            │
│  [Package]  Camiseta Preta Drop 12           │
│             Drops — 3 variantes              │
│  [Package]  Camiseta Preta Oversized         │
│             Premium — 6 variantes            │
│             Ver todos (7) →                  │
│                                              │
│  PEDIDOS                                     │
│  [Receipt]  #4521 — Joao Silva               │
│             Enviado                          │
│  [Receipt]  #4487 — Maria Costa              │
│             Pendente                         │
│             Ver todos (3) →                  │
│                                              │
│  CLIENTES                                    │
│  [Users]    Ana Santos                       │
│             ana@email.com — VIP              │
└─────────────────────────────────────────────┘
```

### 4.4 Navigation URLs

When a result is clicked, the user is navigated to the entity's detail page:

| Resource Type | Navigation URL |
|--------------|----------------|
| product | `/erp/products/{resource_id}` |
| sku | `/erp/products/{metadata.product_id}?sku={resource_id}` |
| order | `/erp/orders/{resource_id}` |
| contact | `/crm/contacts/{resource_id}` |
| creator | `/creators/{resource_id}` |
| supplier | `/pcp/suppliers/{resource_id}` |
| task | `/tarefas/{resource_id}` |
| b2b_retailer | `/b2b/retailers/{resource_id}` |
| asset | `/dam/assets/{resource_id}` |

---

## 5. Frontend Implementation

### 5.1 Component Structure

```typescript
// components/search/GlobalSearch.tsx

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { useRouter } from 'next/navigation';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200); // 200ms debounce per DS.md
  const router = useRouter();

  // Keyboard shortcut: "/" to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isInputFocused()) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch results when debounced query changes
  const { data, isLoading } = useSearchQuery(debouncedQuery);

  return (
    <Command>
      <CommandInput
        placeholder="Pressione / para buscar"
        value={query}
        onValueChange={setQuery}
      />
      {open && query.length >= 2 && (
        <CommandList>
          {isLoading && <SearchSkeleton />}
          <CommandEmpty>Nenhum resultado encontrado</CommandEmpty>
          {data?.groups.map((group) => (
            <CommandGroup key={group.type} heading={group.label}>
              {group.items.slice(0, 3).map((item) => (
                <CommandItem
                  key={item.resource_id}
                  onSelect={() => router.push(item.url)}
                >
                  <SearchResultItem item={item} />
                </CommandItem>
              ))}
              {group.total > 3 && (
                <CommandItem onSelect={() => router.push(`/search?q=${query}&type=${group.type}`)}>
                  Ver todos ({group.total}) →
                </CommandItem>
              )}
            </CommandGroup>
          ))}
        </CommandList>
      )}
    </Command>
  );
}
```

### 5.2 Behavior Specifications

| Behavior | Specification |
|----------|--------------|
| **Debounce** | 200ms delay after last keystroke before firing search request (per DS.md) |
| **Minimum query length** | 2 characters — no search fires for single characters |
| **Keyboard shortcut** | `/` key opens search (suppressed when an input/textarea is focused) |
| **Keyboard navigation** | Arrow keys to navigate results, Enter to select, Escape to close |
| **Shortcut hint** | Placeholder text: "Pressione / para buscar" |
| **Loading state** | Skeleton shimmer lines inside the dropdown (3 groups x 2 rows) |
| **Empty state** | "Nenhum resultado encontrado" centered in dropdown |
| **Close triggers** | Escape key, click outside dropdown, or navigate to a result |
| **Result click** | Navigate to entity detail page, close dropdown |
| **Mobile behavior** | Full-width search input at top of page (per DS.md 13.2) |

### 5.3 Search Hook

```typescript
// hooks/useSearchQuery.ts

import { useQuery } from '@tanstack/react-query';

interface SearchResult {
  resource_type: string;
  resource_id: string;
  title: string;
  subtitle: string;
  metadata: Record<string, unknown>;
  module: string;
  rank: number;
}

interface SearchResponse {
  groups: Array<{
    type: string;
    label: string;
    items: Array<SearchResult & { url: string }>;
    total: number;
  }>;
  total: number;
  query: string;
  took_ms: number;
}

export function useSearchQuery(query: string) {
  return useQuery<SearchResponse>({
    queryKey: ['global-search', query],
    queryFn: () => fetch(`/api/search?q=${encodeURIComponent(query)}`).then(r => r.json()),
    enabled: query.length >= 2,
    staleTime: 60_000,       // Cache for 60s
    gcTime: 5 * 60_000,      // Garbage collect after 5min
    placeholderData: (prev) => prev, // Keep previous results while loading
  });
}
```

---

## 6. API Endpoint

### 6.1 Search API

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/search` | Any authenticated internal user | Global search across allowed entities |

### 6.2 Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | — | Search query (min 2 chars) |
| `type` | string | No | _(all)_ | Filter to a specific resource type |
| `limit` | integer | No | 20 | Max results (max 50) |
| `page` | integer | No | 1 | Page number (for full results page) |

### 6.3 Response Format

```json
{
  "groups": [
    {
      "type": "product",
      "label": "PRODUTOS",
      "items": [
        {
          "resource_type": "product",
          "resource_id": "uuid-here",
          "title": "Camiseta Preta Basic",
          "subtitle": "Basicos — 4 variantes",
          "metadata": { "category": "Basicos", "sku_count": 4 },
          "module": "erp",
          "rank": 0.8742,
          "url": "/erp/products/uuid-here"
        }
      ],
      "total": 7
    },
    {
      "type": "order",
      "label": "PEDIDOS",
      "items": [
        {
          "resource_type": "order",
          "resource_id": "uuid-here",
          "title": "#4521",
          "subtitle": "Joao Silva — Enviado",
          "metadata": { "status": "shipped", "total": 280.00, "contact_name": "Joao Silva" },
          "module": "checkout",
          "rank": 0.6510,
          "url": "/erp/orders/uuid-here"
        }
      ],
      "total": 3
    }
  ],
  "total": 10,
  "query": "camiseta preta",
  "took_ms": 42
}
```

### 6.4 Server-Side Implementation

```typescript
// app/api/search/route.ts

import { withAuth } from '@/lib/auth/middleware';
import { getAllowedSearchTypes } from '@/lib/search/permissions';
import { db } from '@packages/db';
import { sql } from 'drizzle-orm';

export const GET = withAuth(async (req, session) => {
  const url = new URL(req.url);
  const query = url.searchParams.get('q');
  const type = url.searchParams.get('type');
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 50);

  if (!query || query.length < 2) {
    return Response.json({ groups: [], total: 0, query: '', took_ms: 0 });
  }

  const start = performance.now();

  // Get allowed types for this role
  let allowedTypes = getAllowedSearchTypes(session.role);
  if (type && allowedTypes.includes(type)) {
    allowedTypes = [type];
  }

  if (allowedTypes.length === 0) {
    return Response.json({ groups: [], total: 0, query, took_ms: 0 });
  }

  // Execute search query
  const results = await db.execute(sql`
    WITH query AS (
      SELECT plainto_tsquery('portuguese', ${query}) AS q
    )
    SELECT
      si.resource_type,
      si.resource_id,
      si.title,
      si.subtitle,
      si.metadata,
      si.module,
      ts_rank_cd(si.search_vector, query.q, 32) AS rank
    FROM global.search_index si, query
    WHERE si.search_vector @@ query.q
      AND si.resource_type = ANY(${allowedTypes}::text[])
      ${session.role === 'creative' ? sql`
        AND (
          si.resource_type != 'task'
          OR (si.metadata->>'assignee_id')::uuid = ${session.userId}::uuid
        )
      ` : sql``}
    ORDER BY
      CASE si.resource_type
        WHEN 'product' THEN 1 WHEN 'sku' THEN 1
        WHEN 'order' THEN 1 WHEN 'contact' THEN 1
        WHEN 'creator' THEN 2 WHEN 'supplier' THEN 2 WHEN 'task' THEN 2
        WHEN 'b2b_retailer' THEN 3 WHEN 'asset' THEN 3
        ELSE 4
      END,
      rank DESC
    LIMIT ${limit}
  `);

  const took_ms = Math.round(performance.now() - start);

  // Group results by type
  const groups = groupResults(results.rows);

  return Response.json({
    groups,
    total: results.rows.length,
    query,
    took_ms,
  });
}, { permission: 'global:notifications:read' });
```

---

## 7. Performance

### 7.1 Target Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Search response time (P95) | < 200ms | Server-side query execution + serialization |
| Search response time (P50) | < 100ms | Typical query |
| Index size | < 500MB | `global.search_index` table + GIN indexes |
| Concurrent searches | 50 req/s | Peak during working hours |

### 7.2 Optimization Strategies

**GIN Indexes:**
Every `tsvector` column has a GIN (Generalized Inverted Index) index. GIN is optimized for full-text search and supports fast `@@` operator queries.

```sql
-- Already created in section 3
CREATE INDEX idx_search_index_fts ON global.search_index USING GIN(search_vector);
```

**Connection Pooling:**
Neon provides built-in connection pooling. The search endpoint uses the pooled connection string to avoid connection overhead per request.

**Redis Cache (Optional):**
For frequently repeated queries, cache the serialized response in Redis with a short TTL:

```typescript
// lib/search/cache.ts

const SEARCH_CACHE_TTL = 60; // 60 seconds

export async function getCachedSearch(query: string, role: string): Promise<SearchResponse | null> {
  const key = `search:${role}:${hashQuery(query)}`;
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedSearch(query: string, role: string, response: SearchResponse): Promise<void> {
  const key = `search:${role}:${hashQuery(query)}`;
  await redis.set(key, JSON.stringify(response), { ex: SEARCH_CACHE_TTL });
}

function hashQuery(query: string): string {
  // Normalize: lowercase, trim, collapse whitespace
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}
```

Cache is keyed by `role` to ensure permission filtering is respected. Cache is invalidated on a TTL basis (60s) rather than on data change, which is acceptable given the search use case.

**Materialized View Fallback:**
If the `UNION ALL` approach across individual tables becomes slow (unlikely with `global.search_index`), consider a materialized view that is refreshed on a schedule:

```sql
-- Only if search_index approach proves insufficient
CREATE MATERIALIZED VIEW global.search_materialized AS
  SELECT * FROM global.search_index;

CREATE UNIQUE INDEX idx_search_materialized_pk ON global.search_materialized (id);
CREATE INDEX idx_search_materialized_fts ON global.search_materialized USING GIN(search_vector);

-- Refresh periodically (every 5 minutes via BullMQ scheduled job)
REFRESH MATERIALIZED VIEW CONCURRENTLY global.search_materialized;
```

### 7.3 Search Index Synchronization

The `global.search_index` table must stay in sync with source tables. Three strategies, from simplest to most robust:

**Strategy 1 — Application-level hooks (recommended for MVP):**
```typescript
// In the product service, after create/update/delete:
await searchIndexService.upsert({
  resource_type: 'product',
  resource_id: product.id,
  title: product.name,
  subtitle: `${product.category} — ${skuCount} variantes`,
  metadata: { category: product.category, sku_count: skuCount },
  module: 'erp',
  search_vector: sql`
    setweight(to_tsvector('portuguese', ${product.name}), 'A') ||
    setweight(to_tsvector('portuguese', ${product.description ?? ''}), 'C')
  `,
});
```

**Strategy 2 — PostgreSQL triggers (for consistency):**
```sql
CREATE OR REPLACE FUNCTION sync_search_index_products() RETURNS trigger AS $$
BEGIN
  INSERT INTO global.search_index (id, resource_type, resource_id, title, module, search_vector, updated_at)
  VALUES (
    gen_random_uuid(), 'product', NEW.id, NEW.name, 'erp',
    setweight(to_tsvector('portuguese', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.description, '')), 'C'),
    NOW()
  )
  ON CONFLICT (resource_type, resource_id) DO UPDATE SET
    title = EXCLUDED.title,
    search_vector = EXCLUDED.search_vector,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Strategy 3 — BullMQ reindex job (for full rebuild):**
A scheduled job that rebuilds the entire `global.search_index` table. Runs nightly as a safety net.

---

## 8. Full Search Results Page

When the user clicks "Ver todos" in a section or navigates to `/search?q=...`, a dedicated full results page is rendered.

### 8.1 Route

`/search` — accessible to all authenticated internal users.

### 8.2 Layout

- Full-page search with the query pre-filled in a large search input
- Left sidebar with entity type filters (checkboxes)
- Results list with pagination (20 results per page)
- Each result shows full title, subtitle, module badge, and relative timestamp
- Keyboard navigation supported (arrow keys + Enter)

### 8.3 URL Structure

```
/search?q=camiseta+preta&type=product&page=1
```

---

## 9. Implementation Checklist

| # | Task | Priority | Dependencies |
|---|------|----------|-------------|
| 1 | Add `search_vector` columns and triggers to all 9 searchable tables | P0 | DATABASE.md migrations |
| 2 | Create `global.search_index` table with GIN index | P0 | Migration 0020 |
| 3 | Build initial population scripts for `global.search_index` | P0 | All source tables seeded |
| 4 | Implement search index sync hooks in application services | P0 | Service layer |
| 5 | Build `/api/search` endpoint with permission filtering | P0 | Auth middleware, RBAC |
| 6 | Build `GlobalSearch` component using HeroUI Command | P1 | DS.md compliance |
| 7 | Implement keyboard shortcut (`/`) handler | P1 | GlobalSearch component |
| 8 | Implement result grouping and "Ver todos" links | P1 | API response format |
| 9 | Add Redis caching layer for frequent queries | P2 | Upstash Redis |
| 10 | Build full search results page (`/search`) | P2 | GlobalSearch, API |
| 11 | Add creative role task scoping in search query | P1 | Auth scoping |
| 12 | Build nightly reindex job as safety net | P2 | BullMQ |
| 13 | Performance testing: verify < 200ms P95 with realistic data | P1 | Seeded database |

---

*This document is the single source of truth for the Ambaril global search system. All searchable entities must be registered here before implementation. The search index must be kept in sync with source data at all times — stale search results degrade user trust in the platform.*
