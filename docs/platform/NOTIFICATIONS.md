# Ambaril — Flare Notification System

> **Version:** 1.0
> **Date:** March 2026
> **Status:** Approved
> **References:** [DS.md](../../DS.md) (section 12), [DATABASE.md](../architecture/DATABASE.md) (global.notifications), [STACK.md](../architecture/STACK.md), [AUTH.md](../architecture/AUTH.md)

---

## 1. Overview

**Flare** is the unified, cross-cutting notification system that connects all 15 modules of Ambaril. Every significant event in the platform — from a paid order to a critical stock alert — flows through Flare before being dispatched to the appropriate channels.

Flare operates across **4 delivery channels:**

| Channel | Technology | Use Case | Audience |
|---------|-----------|----------|----------|
| **In-app** | SSE push + `global.notifications` table | Bell icon + notification panel (DS.md 12.2) | Internal users (9 team members) |
| **Discord** | ClawdBot via Discord API (Bot Token) | `#alertas`, `#report-*` channels — automated reports + real-time alerts | Internal team on Discord |
| **WhatsApp** | Meta Cloud API via WhatsApp Engine | Transactional (order updates, exchange status) + Marketing (campaigns, creator comms) | Customers, Creators |
| **Email** | Resend API | Transactional (receipts, shipping) + Marketing (CRM automation campaigns) | Customers, Creators, B2B Retailers |

**Core principles:**

1. **Event-driven** — Modules emit events; Flare handles routing, templating, and delivery. Modules never send notifications directly.
2. **Channel-agnostic** — Each event has a channel configuration. Adding a new channel requires zero changes to source modules.
3. **LGPD-compliant** — Customer-facing channels (WhatsApp, Email) check `crm.consents` before delivery. No consent = no message.
4. **Idempotent** — Duplicate event emissions (e.g., retry after crash) produce only one notification per recipient per event instance.

---

## 2. Event Catalog

This is the **master table** of all notification-triggering events across the entire Ambaril platform. Every event has a unique key, source module, target channels, recipient logic, priority, and template key.

### 2.1 Checkout Events

| Event | Source Module | Channels | Recipients | Priority | Template Key |
|-------|-------------|----------|------------|----------|--------------|
| `order.created` | Checkout | In-app | `operations` roles | medium | `inapp_order_created` |
| `order.paid` | Checkout | In-app, WhatsApp, Email | In-app: `operations`; WhatsApp/Email: customer (contact) | high | `inapp_order_paid`, `wa_order_confirmed`, `email_order_confirmed` |
| `cart.abandoned` | Checkout | WhatsApp, Email | Customer (contact) — triggered by CRM automation at 30min, 2h, 24h intervals | medium | `wa_cart_recovery`, `email_cart_recovery` |
| `checkout.payment_failed` | Checkout | In-app | `operations` roles — payment attempt failed, may need manual follow-up | medium | `inapp_payment_failed` |

### 2.2 ERP Events

| Event | Source Module | Channels | Recipients | Priority | Template Key |
|-------|-------------|----------|------------|----------|--------------|
| `order.separating` | ERP | In-app | `operations` roles | low | `inapp_order_separating` |
| `order.shipped` | ERP | WhatsApp, Email | Customer (contact) — includes tracking code | high | `wa_order_shipped`, `email_order_shipped` |
| `order.delivered` | ERP | WhatsApp | Customer (contact) — delivery confirmation | medium | `wa_order_delivered` |
| `stock.low` | ERP | In-app, Discord `#alertas` | In-app: `operations`; Discord: channel broadcast | high | `inapp_stock_low`, `discord_stock_low` |
| `stock.critical` | ERP | In-app, Discord `#alertas` (with @mention) | In-app: `operations`; Discord: @operations role mention | critical | `inapp_stock_critical`, `discord_stock_critical` |
| `nfe.authorized` | ERP | In-app | `operations` roles | low | `inapp_nfe_authorized` |
| `nfe.rejected` | ERP | In-app, Discord `#alertas` | In-app: `operations`; Discord: channel broadcast | critical | `inapp_nfe_rejected`, `discord_nfe_rejected` |
| `dre.generated` | ERP | In-app | `finance`, `admin` roles — monthly DRE report ready | medium | `inapp_dre_generated` |
| `chargeback.received` | ERP | In-app, Discord `#alertas` | In-app: `finance`, `admin`; Discord: channel broadcast | critical | `inapp_chargeback`, `discord_chargeback` |

### 2.3 PCP Events

| Event | Source Module | Channels | Recipients | Priority | Template Key |
|-------|-------------|----------|------------|----------|--------------|
| `production.safety_margin_consumed` | PCP | In-app, Discord `#alertas` | In-app: `operations`; Discord: channel broadcast | high | `inapp_safety_margin`, `discord_safety_margin` |
| `production.deadline_tomorrow` | PCP | In-app, Discord `#alertas` (@tavares) | In-app: `operations`; Discord: @tavares mention | high | `inapp_deadline_tomorrow`, `discord_deadline_tomorrow` |
| `production.deadline_overdue` | PCP | In-app, Discord `#alertas` (@tavares, @caio) | In-app: `operations`, `pm`; Discord: @tavares + @caio escalation | critical | `inapp_deadline_overdue`, `discord_deadline_overdue` |
| `production.stage_completed` | PCP | In-app | `operations` roles | low | `inapp_stage_completed` |
| `production.completed` | PCP | In-app, Discord `#report-producao` | In-app: `operations`; Discord: report channel | medium | `inapp_production_completed`, `discord_production_completed` |
| `supplier.delivery_late` | PCP | In-app, Discord `#alertas` | In-app: `operations`; Discord: channel broadcast | high | `inapp_supplier_late`, `discord_supplier_late` |
| `raw_material.low_stock` | PCP | In-app, Discord `#alertas` | In-app: `operations`; Discord: channel broadcast | high | `inapp_raw_material_low`, `discord_raw_material_low` |
| `raw_material.purchase_overdue` | PCP | In-app, Discord `#alertas` (@tavares) | In-app: `operations`; Discord: @tavares mention | critical | `inapp_purchase_overdue`, `discord_purchase_overdue` |
| `rework.overdue` | PCP | In-app, Discord `#alertas` | In-app: `operations`; Discord: channel broadcast | high | `inapp_rework_overdue`, `discord_rework_overdue` |

### 2.4 CRM Events

| Event | Source Module | Channels | Recipients | Priority | Template Key |
|-------|-------------|----------|------------|----------|--------------|
| `contact.created` | CRM | _(none)_ | _(internal only — no notification by default)_ | — | — |
| `campaign.sent` | CRM | In-app | `pm` role | low | `inapp_campaign_sent` |
| `automation.triggered` | CRM | WhatsApp or Email | Customer (contact) — channel depends on automation configuration | medium | Determined by automation template config |

### 2.5 Trocas Events

| Event | Source Module | Channels | Recipients | Priority | Template Key |
|-------|-------------|----------|------------|----------|--------------|
| `exchange.requested` | Trocas | In-app | `support`, `operations` roles | high | `inapp_exchange_requested` |
| `exchange.approved` | Trocas | WhatsApp, Email | Customer (contact) — with return label instructions | high | `wa_exchange_approved`, `email_exchange_approved` |
| `exchange.product_received` | Trocas | In-app | `operations` roles | medium | `inapp_exchange_received` |
| `exchange.completed` | Trocas | WhatsApp, Email | Customer (contact) — credit or refund issued | high | `wa_exchange_completed`, `email_exchange_completed` |
| `exchange.rate_alert` | Trocas | In-app, Discord `#alertas` | In-app: `operations`, `pm`; Discord: channel broadcast — exchange rate above threshold | high | `inapp_exchange_rate`, `discord_exchange_rate` |

### 2.6 Creators Events

| Event | Source Module | Channels | Recipients | Priority | Template Key |
|-------|-------------|----------|------------|----------|--------------|
| `creator.registered` | Creators | In-app | `pm` role — new creator pending approval | medium | `inapp_creator_registered` |
| `creator.approved` | Creators | WhatsApp, Email | Creator (external user) | high | `wa_creator_welcome`, `email_creator_welcome` |
| `creator.sale` | Creators | In-app | Creator (via Creators portal) — real-time sale notification | high | `inapp_creator_sale` |
| `creator.tier_upgraded` | Creators | WhatsApp, Email, In-app | Creator (external user + portal) | medium | `wa_creator_tier_up`, `email_creator_tier_up`, `inapp_creator_tier_up` |
| `creator.tier_downgraded` | Creators | WhatsApp, Email | Creator (external user) | medium | `wa_creator_tier_down`, `email_creator_tier_down` |
| `creator.payout_ready` | Creators | WhatsApp, Email | Creator (external user) | high | `wa_creator_payout`, `email_creator_payout` |
| `creator.challenge_new` | Creators | WhatsApp, In-app | All active creators — broadcast | medium | `wa_creator_challenge`, `inapp_creator_challenge` |
| `creator.commission_adjustment` | Creators | In-app | Creator (via portal) — commission adjusted due to exchange/return within 7-day window | medium | `inapp_creator_commission_adj` |
| `creator.commission_confirmed` | Creators | In-app | Creator (via portal) — commission confirmed after 7-day window passes | medium | `inapp_creator_commission_confirmed` |

### 2.7 Marketing Intelligence Events

| Event | Source Module | Channels | Recipients | Priority | Template Key |
|-------|-------------|----------|------------|----------|--------------|
| `ugc.viral_detected` | Marketing | Discord `#alertas`, In-app | In-app: `pm`, `creative`; Discord: channel broadcast | high | `discord_ugc_viral`, `inapp_ugc_viral` |
| `ugc.new_mention` | Marketing | In-app | `pm`, `creative` roles | low | `inapp_ugc_mention` |
| `competitor.new_ad` | Marketing | Discord `#report-marketing` | Discord: weekly digest | low | `discord_competitor_ads` |
| `ugc.approved` | Marketing | In-app | `pm` role — UGC post approved for use | low | `inapp_ugc_approved` |
| `ugc.sent_to_dam` | Marketing | In-app | `pm` role — UGC sent to DAM | low | `inapp_ugc_sent_dam` |
| `marketing.report_generated` | Marketing | In-app | `pm` role — weekly marketing report ready | low | `inapp_marketing_report` |
| `marketing.import_completed` | Marketing | In-app | `pm` role — campaign metrics import finished | low | `inapp_import_completed` |
| `marketing.import_failed` | Marketing | In-app, Discord `#alertas` | In-app: `admin`, `pm`; Discord: channel broadcast | high | `inapp_import_failed`, `discord_import_failed` |

### 2.8 Tarefas Events

| Event | Source Module | Channels | Recipients | Priority | Template Key |
|-------|-------------|----------|------------|----------|--------------|
| `task.assigned` | Tarefas | In-app | Assignee (specific user) | medium | `inapp_task_assigned` |
| `task.overdue` | Tarefas | In-app, Discord `#alertas` (@assignee) | In-app: assignee; Discord: @mention assignee | high | `inapp_task_overdue`, `discord_task_overdue` |
| `task.comment` | Tarefas | In-app | All task participants (assignee + watchers) | low | `inapp_task_comment` |

### 2.9 Dashboard / Beacon Events

| Event | Source Module | Channels | Recipients | Priority | Template Key |
|-------|-------------|----------|------------|----------|--------------|
| `war_room.activated` | Dashboard | In-app, Discord `#alertas` | In-app: all internal users; Discord: channel broadcast | critical | `inapp_war_room`, `discord_war_room` |
| `conversion.dropped` | Dashboard | Discord `#alertas` | Discord: channel broadcast — conversion below threshold | high | `discord_conversion_dropped` |
| `sales.spike` | Dashboard | Discord `#alertas` | Discord: channel broadcast — unusual sales volume | medium | `discord_sales_spike` |

### 2.10 B2B Events

| Event | Source Module | Channels | Recipients | Priority | Template Key |
|-------|-------------|----------|------------|----------|--------------|
| `b2b_order.created` | B2B | In-app, Email | In-app: `commercial` role; Email: retailer (external) | high | `inapp_b2b_order_created`, `email_b2b_order_created` |
| `b2b_retailer.approved` | B2B | Email | Retailer (external) — welcome + login credentials | high | `email_b2b_retailer_approved` |
| `b2b_payment.overdue` | B2B | In-app, Email | In-app: `commercial`; Email: retailer (reminder) | high | `inapp_b2b_payment_overdue`, `email_b2b_payment_overdue` |
| `b2b_order.shipped` | B2B | Email | Retailer (external) — shipment notification with tracking | high | `email_b2b_order_shipped` |

### 2.11 Inbox Events

| Event | Source Module | Channels | Recipients | Priority | Template Key |
|-------|-------------|----------|------------|----------|--------------|
| `ticket.new` | Inbox | In-app | `support` role | high | `inapp_ticket_new` |
| `ticket.overdue` | Inbox | In-app, Discord `#alertas` | In-app: `support`; Discord: channel broadcast | high | `inapp_ticket_overdue`, `discord_ticket_overdue` |

### 2.12 DAM Events

| Event | Source Module | Channels | Recipients | Priority | Template Key |
|-------|-------------|----------|------------|----------|--------------|
| `asset.new_version` | DAM | In-app | `creative`, `pm` roles — new version uploaded for review | medium | `inapp_asset_new_version` |
| `asset.approved` | DAM | In-app | `creative` role — asset approved by reviewer | low | `inapp_asset_approved` |

### 2.13 WhatsApp Events

| Event | Source Module | Channels | Recipients | Priority | Template Key |
|-------|-------------|----------|------------|----------|--------------|
| `whatsapp.message.inbound` | WhatsApp | In-app | `support` role — new customer message received | medium | `inapp_wa_inbound` |
| `whatsapp.message.failed` | WhatsApp | In-app, Discord `#alertas` | In-app: `pm`; Discord: channel broadcast — message delivery failed | high | `inapp_wa_failed`, `discord_wa_failed` |
| `whatsapp.template.approved` | WhatsApp | In-app | `pm` role — Meta approved template | low | `inapp_wa_template_approved` |
| `whatsapp.template.rejected` | WhatsApp | In-app, Discord `#alertas` | In-app: `pm`; Discord: channel broadcast | high | `inapp_wa_template_rejected`, `discord_wa_template_rejected` |
| `whatsapp.broadcast.completed` | WhatsApp | In-app | `pm` role — broadcast campaign delivery finished | medium | `inapp_wa_broadcast_done` |

### 2.14 ClawdBot Events

| Event | Source Module | Channels | Recipients | Priority | Template Key |
|-------|-------------|----------|------------|----------|--------------|
| `clawdbot.report.completed` | ClawdBot | In-app | `admin` role — scheduled report delivered successfully | low | `inapp_clawdbot_report_ok` |
| `clawdbot.report.failed` | ClawdBot | In-app, Discord `#alertas` | In-app: `admin`; Discord: @admin mention — report generation failed | high | `inapp_clawdbot_report_fail`, `discord_clawdbot_report_fail` |
| `clawdbot.schema_refresh.failed` | ClawdBot | Discord `#alertas` | Discord: @admin mention — daily schema refresh failed | critical | `discord_clawdbot_schema_fail` |

### 2.15 System Events

| Event | Source Module | Channels | Recipients | Priority | Template Key |
|-------|-------------|----------|------------|----------|--------------|
| `system.external_api_down` | Platform | Discord `#alertas` | Discord: @admin mention — circuit breaker opened | critical | `discord_api_down` |
| `system.job_failed` | Platform | Discord `#alertas` | Discord: @admin mention — background job failed after max retries | critical | `discord_job_failed` |

---

## 3. Notification Routing Logic

When an event is emitted by any module, Flare processes it through this routing pipeline:

```
Module emits event
       │
       ▼
┌─────────────────────┐
│ 1. Event Catalog    │  Look up event key in catalog
│    Lookup           │  → channels, recipients, priority, template
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 2. Recipient        │  Resolve abstract recipients to concrete user IDs
│    Resolution       │  e.g., "operations roles" → [tavares_id, ana_clara_id]
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 3. Consent Check    │  For customer-facing channels (WhatsApp, Email):
│    (LGPD)           │  Query crm.consents for each contact+channel
│                     │  No consent → skip that channel for that recipient
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 4. Deduplication    │  Check if this exact event instance was already
│                     │  dispatched to this recipient (idempotency key)
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 5. Template         │  Render the template for each channel with event
│    Rendering        │  payload data (variables interpolated)
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 6. Queue Dispatch   │  Enqueue one job per channel per recipient
│                     │  into the appropriate BullMQ queue
└────────┬────────────┘
         │
         ▼
  Workers process each queue independently
```

### 3.1 Recipient Resolution

Abstract recipient targets are resolved as follows:

| Recipient Target | Resolution Logic |
|-----------------|-----------------|
| `operations` roles | Query `global.users WHERE role = 'operations' AND is_active = TRUE` → Tavares, Ana Clara |
| `pm` role | Query `global.users WHERE role = 'pm' AND is_active = TRUE` → Caio |
| `support` role | Query `global.users WHERE role = 'support' AND is_active = TRUE` → Slimgust |
| `creative` roles | Query `global.users WHERE role = 'creative' AND is_active = TRUE` → Yuri, Sick |
| `commercial` role | Query `global.users WHERE role = 'commercial' AND is_active = TRUE` → Guilherme |
| `finance` role | Query `global.users WHERE role = 'finance' AND is_active = TRUE` → Pedro |
| `admin` role | Query `global.users WHERE role = 'admin' AND is_active = TRUE` → Marcus |
| All internal users | Query `global.users WHERE is_active = TRUE` |
| Customer (contact) | Resolved from event payload: `event.contact_id` → `crm.contacts` |
| Creator (external) | Resolved from event payload: `event.creator_id` → `creators.creators` |
| Retailer (external) | Resolved from event payload: `event.retailer_id` → `b2b.retailers` |
| Task assignee | Resolved from event payload: `event.assignee_id` → `global.users` |
| Task participants | Query task watchers + assignee from `tarefas.tasks` |
| All active creators | Query `creators.creators WHERE status = 'active'` |

### 3.2 LGPD Consent Check

For WhatsApp and Email channels targeting customers or external users:

```typescript
async function checkConsent(contactId: string, channel: 'whatsapp' | 'email'): Promise<boolean> {
  const consent = await db.query.consents.findFirst({
    where: and(
      eq(consents.contact_id, contactId),
      eq(consents.consent_type, channel),
      eq(consents.granted, true),
      isNull(consents.revoked_at)
    )
  });
  return !!consent;
}
```

If consent is not found or has been revoked, the channel is **silently skipped** for that recipient. No error is raised — this is expected LGPD behavior.

### 3.3 Escalation Rules

If an in-app notification remains **unread after 4 hours** AND the priority is `high` or `critical`:

1. Flare escalation worker checks `global.notifications` for unread high/critical notifications older than 4 hours
2. If found, dispatch a Discord @mention to the specific user (mapped via Discord user ID in `global.users.metadata`)
3. Mark the notification as `escalated` in metadata to prevent repeated escalation
4. Escalation check runs every 15 minutes via BullMQ scheduled job

```sql
-- Find unread high-priority notifications older than 4 hours, not yet escalated
SELECT n.*
FROM global.notifications n
WHERE n.read_at IS NULL
  AND n.priority IN ('high', 'critical')
  AND n.created_at < NOW() - INTERVAL '4 hours'
  AND (n.metadata->>'escalated')::boolean IS NOT TRUE;
```

---

## 4. Template System

Each channel has its own template format. Templates use variable interpolation with the `{{variable}}` syntax. Variables are populated from the event payload at render time.

### 4.1 In-App Templates

Stored as JSON structures, rendered by the frontend notification panel.

```json
{
  "title": "Pedido #{{order_number}} pago",
  "body": "PIX confirmado — R$ {{amount}}",
  "icon": "CheckCircle",
  "action_url": "/erp/orders/{{order_id}}",
  "priority": "medium"
}
```

**Icon mapping** (Lucide React — Regular weight):

| Event Category | Icon | Color |
|---------------|------|-------|
| Order events | `Package` | `--electric` |
| Payment confirmed | `CheckCircle` | `--success` |
| Stock alerts | `WarningCircle` | `--warning` / `--danger` |
| NF-e events | `FileText` | `--text-secondary` |
| Production events | `Factory` | `--text-secondary` |
| Production overdue | `ClockCountdown` | `--danger` |
| Exchange events | `ArrowsClockwise` | `--sky` |
| Creator events | `Star` | `--warning` |
| Task events | `CheckSquare` | `--electric` |
| War Room | `SirenLight` | `--danger` |
| Support tickets | `ChatCircle` | `--electric` |
| DAM events | `Image` | `--text-secondary` |
| System alerts | `ShieldWarning` | `--danger` |

**Full in-app template examples:**

```json
// order.created
{
  "title": "Novo pedido #{{order_number}}",
  "body": "{{contact_name}} — {{item_count}} itens — R$ {{total}}",
  "icon": "Package",
  "action_url": "/erp/orders/{{order_id}}",
  "priority": "medium"
}

// stock.critical
{
  "title": "Estoque Critico",
  "body": "{{product_name}} {{sku_size}}/{{sku_color}} ({{sku_code}}) — {{quantity}} unidades restantes",
  "icon": "WarningCircle",
  "action_url": "/erp/products/{{product_id}}?tab=inventory",
  "priority": "critical"
}

// production.deadline_overdue
{
  "title": "Producao atrasada — {{drop_name}}",
  "body": "Etapa {{stage_name}} — prazo estourou ha {{days_overdue}} dias",
  "icon": "ClockCountdown",
  "action_url": "/pcp/production/{{production_order_id}}",
  "priority": "critical"
}

// exchange.requested
{
  "title": "Nova troca solicitada",
  "body": "Pedido #{{order_number}} — {{contact_name}} — {{request_type}}",
  "icon": "ArrowsClockwise",
  "action_url": "/trocas/{{exchange_id}}",
  "priority": "high"
}

// creator.sale
{
  "title": "Venda registrada!",
  "body": "Cupom {{coupon_code}} — R$ {{sale_amount}} — {{points_earned}} pts",
  "icon": "Star",
  "action_url": "/creators/dashboard",
  "priority": "high"
}

// task.assigned
{
  "title": "Nova tarefa atribuida",
  "body": "{{task_title}} — projeto {{project_name}}",
  "icon": "CheckSquare",
  "action_url": "/tarefas/{{task_id}}",
  "priority": "medium"
}

// war_room.activated
{
  "title": "War Room ATIVADA",
  "body": "Drop {{drop_name}} — monitoramento em tempo real iniciado",
  "icon": "SirenLight",
  "action_url": "/dashboard/war-room",
  "priority": "critical"
}

// asset.new_version
{
  "title": "Nova versao — {{filename}}",
  "body": "v{{version_number}} enviada por {{uploader_name}} para revisao",
  "icon": "Image",
  "action_url": "/dam/assets/{{asset_id}}",
  "priority": "medium"
}
```

### 4.2 Discord Embed Templates

Discord messages use Rich Embeds via the Discord API. Color is a hex integer.

```json
// stock.critical
{
  "title": "Estoque Critico",
  "description": "{{product_name}} {{sku_size}}/{{sku_color}} ({{sku_code}}) — {{quantity}} unidades restantes",
  "color": "#F87171",
  "fields": [
    { "name": "SKU", "value": "{{sku_code}}", "inline": true },
    { "name": "Estoque", "value": "{{quantity}} un", "inline": true },
    { "name": "Reorder Point", "value": "{{reorder_point}} un", "inline": true }
  ],
  "footer": { "text": "Ambaril Flare — {{timestamp}}" }
}

// production.deadline_overdue
{
  "title": "Producao Atrasada — ESCALACAO",
  "description": "{{drop_name}} — etapa **{{stage_name}}** estourou o prazo",
  "color": "#EF4444",
  "fields": [
    { "name": "Prazo original", "value": "{{original_deadline}}", "inline": true },
    { "name": "Dias atrasados", "value": "{{days_overdue}} dias", "inline": true },
    { "name": "Fornecedor", "value": "{{supplier_name}}", "inline": true }
  ],
  "footer": { "text": "Ambaril Flare — {{timestamp}}" },
  "mention": "@tavares @caio"
}

// nfe.rejected
{
  "title": "NF-e Rejeitada",
  "description": "Pedido #{{order_number}} — emissao falhou",
  "color": "#EF4444",
  "fields": [
    { "name": "Motivo", "value": "{{rejection_reason}}", "inline": false },
    { "name": "Provider", "value": "{{nfe_provider}}", "inline": true },
    { "name": "Tentativa", "value": "{{attempt_count}}/3", "inline": true }
  ],
  "footer": { "text": "Ambaril Flare — {{timestamp}}" }
}

// ugc.viral_detected
{
  "title": "UGC Viral Detectado",
  "description": "Post com alto engajamento identificado!",
  "color": "#F59E0B",
  "fields": [
    { "name": "Perfil", "value": "@{{instagram_handle}}", "inline": true },
    { "name": "Likes", "value": "{{like_count}}", "inline": true },
    { "name": "Comments", "value": "{{comment_count}}", "inline": true },
    { "name": "Link", "value": "{{post_url}}", "inline": false }
  ],
  "footer": { "text": "Ambaril Flare — {{timestamp}}" }
}

// war_room.activated
{
  "title": "WAR ROOM ATIVADA",
  "description": "Drop **{{drop_name}}** — monitoramento em tempo real iniciado. Todos no posto!",
  "color": "#EF4444",
  "fields": [
    { "name": "Drop", "value": "{{drop_name}}", "inline": true },
    { "name": "SKUs monitorados", "value": "{{sku_count}}", "inline": true },
    { "name": "Inicio", "value": "{{start_time}}", "inline": true }
  ],
  "footer": { "text": "Ambaril Flare — {{timestamp}}" }
}

// system.external_api_down
{
  "title": "API Externa Indisponivel",
  "description": "Circuit breaker aberto para **{{service_name}}**",
  "color": "#EF4444",
  "fields": [
    { "name": "Servico", "value": "{{service_name}}", "inline": true },
    { "name": "Ultimo erro", "value": "{{last_error}}", "inline": false },
    { "name": "Falhas consecutivas", "value": "{{failure_count}}", "inline": true }
  ],
  "footer": { "text": "Ambaril Flare — {{timestamp}}" },
  "mention": "@admin"
}

// system.job_failed
{
  "title": "Background Job Falhou",
  "description": "Job **{{job_name}}** falhou apos {{max_retries}} tentativas",
  "color": "#EF4444",
  "fields": [
    { "name": "Job", "value": "{{job_name}}", "inline": true },
    { "name": "Queue", "value": "{{queue_name}}", "inline": true },
    { "name": "Erro", "value": "```{{error_message}}```", "inline": false }
  ],
  "footer": { "text": "Ambaril Flare — {{timestamp}}" },
  "mention": "@admin"
}
```

**Discord channel routing:**

| Channel | Events Routed Here |
|---------|--------------------|
| `#alertas` | `stock.low`, `stock.critical`, `nfe.rejected`, `chargeback.received`, `production.safety_margin_consumed`, `production.deadline_tomorrow`, `production.deadline_overdue`, `supplier.delivery_late`, `raw_material.low_stock`, `raw_material.purchase_overdue`, `rework.overdue`, `ugc.viral_detected`, `marketing.import_failed`, `task.overdue`, `war_room.activated`, `conversion.dropped`, `sales.spike`, `ticket.overdue`, `exchange.rate_alert`, `whatsapp.message.failed`, `whatsapp.template.rejected`, `clawdbot.report.failed`, `clawdbot.schema_refresh.failed`, `system.external_api_down`, `system.job_failed` |
| `#report-producao` | `production.completed` |
| `#report-marketing` | `competitor.new_ad` (weekly digest) |

### 4.3 WhatsApp Templates (Meta-Approved, PT-BR)

WhatsApp templates must be pre-approved by Meta. All templates use the Meta Cloud API template message format. Variables are positional: `{{1}}`, `{{2}}`, etc.

| # | Template Name | Category | Text (PT-BR) | Variables |
|---|--------------|----------|--------------|-----------|
| 1 | `order_confirmed` | Transactional | Ola {{1}}, seu pedido **#{{2}}** foi confirmado! Estamos preparando tudo com muito carinho. Acompanhe o status: {{3}} | `{{1}}` = contact.name, `{{2}}` = order_number, `{{3}}` = tracking_url |
| 2 | `order_shipped` | Transactional | {{1}}, seu pedido **#{{2}}** foi enviado! Rastreie aqui: {{3}} -- Transportadora: {{4}} | `{{1}}` = contact.name, `{{2}}` = order_number, `{{3}}` = tracking_url, `{{4}}` = carrier_name |
| 3 | `order_delivered` | Transactional | {{1}}, seu pedido **#{{2}}** foi entregue! Esperamos que voce ame as pecas. Compartilhe seu look com a gente no Instagram @cienaoficial | `{{1}}` = contact.name, `{{2}}` = order_number |
| 4 | `exchange_approved` | Transactional | Sua troca para o pedido **#{{1}}** foi aprovada! Envie o produto de volta usando a etiqueta de postagem que enviamos por e-mail. Prazo: ate {{2}}. | `{{1}}` = order_number, `{{2}}` = return_deadline |
| 5 | `exchange_completed` | Transactional | {{1}}, sua troca do pedido **#{{2}}** foi finalizada! {{3}}. Qualquer duvida, estamos aqui. | `{{1}}` = contact.name, `{{2}}` = order_number, `{{3}}` = resolution_text (e.g., "Credito de R$ 180,00 disponivel" or "Reembolso de R$ 180,00 processado") |
| 6 | `cart_recovery` | Marketing | {{1}}, voce esqueceu itens no carrinho! Sua **{{2}}** esta esperando por voce. Finalize sua compra antes que esgote: {{3}} | `{{1}}` = contact.name, `{{2}}` = product_name, `{{3}}` = checkout_url |
| 7 | `creator_welcome` | Transactional | Bem-vindo ao programa **CIENA Creators**, {{1}}! Seu cupom exclusivo e **{{2}}** ({{3}}% de desconto). Compartilhe com sua comunidade e acompanhe suas vendas no portal: {{4}} | `{{1}}` = creator.name, `{{2}}` = coupon_code, `{{3}}` = discount_percent, `{{4}}` = portal_url |
| 8 | `creator_sale` | Transactional | Parabens {{1}}! Venda registrada pelo cupom {{2}}: **R$ {{3}}**. Voce ganhou **{{4}} pontos**. Total acumulado: {{5}} pts. | `{{1}}` = creator.name, `{{2}}` = coupon_code, `{{3}}` = sale_amount, `{{4}}` = points_earned, `{{5}}` = total_points |
| 9 | `creator_tier_up` | Transactional | {{1}}, voce subiu para o tier **{{2}}**! Sua nova comissao e de {{3}}%. Continue representando a CIENA! Veja seus beneficios: {{4}} | `{{1}}` = creator.name, `{{2}}` = tier_name, `{{3}}` = commission_percent, `{{4}}` = portal_url |
| 10 | `creator_payout` | Transactional | {{1}}, seu pagamento de **R$ {{2}}** foi processado e sera creditado na sua chave PIX em ate 2 dias uteis. Referente ao periodo {{3}}. | `{{1}}` = creator.name, `{{2}}` = payout_amount, `{{3}}` = payout_period |
| 11 | `creator_challenge` | Marketing | Novo challenge: **{{1}}**! Participe ate {{2}} e ganhe ate {{3}} pontos extras. Confira os detalhes no portal: {{4}} | `{{1}}` = challenge_name, `{{2}}` = deadline, `{{3}}` = max_points, `{{4}}` = portal_url |
| 12 | `vip_drop_access` | Marketing | {{1}}, acesso VIP liberado! O drop **{{2}}** esta disponivel exclusivamente para voce. Garanta suas pecas antes do lancamento publico: {{3}} | `{{1}}` = contact.name, `{{2}}` = drop_name, `{{3}}` = checkout_url |

### 4.4 Email Templates

Email is sent via **Resend** API. Templates are React Email components (JSX-based), stored in `packages/integrations/resend/templates/`.

#### Transactional Email Templates

| Template | Subject Line | Trigger Event | Key Content |
|----------|-------------|---------------|-------------|
| `order_confirmed` | Pedido #{{order_number}} confirmado! | `order.paid` | Order summary, item list, total, payment method, estimated delivery |
| `order_shipped` | Seu pedido #{{order_number}} foi enviado! | `order.shipped` | Tracking code, carrier, estimated delivery date, tracking link |
| `exchange_approved` | Troca aprovada — Pedido #{{order_number}} | `exchange.approved` | Return label instructions, return deadline, step-by-step guide |
| `exchange_completed` | Troca finalizada — Pedido #{{order_number}} | `exchange.completed` | Resolution details (credit/refund amount), next steps |
| `creator_welcome` | Bem-vindo ao CIENA Creators! | `creator.approved` | Coupon code, commission rate, portal link, quick-start guide |
| `creator_tier_up` | Parabens! Voce subiu de tier. | `creator.tier_upgraded` | New tier name, new commission rate, tier benefits |
| `creator_payout` | Pagamento processado — R$ {{amount}} | `creator.payout_ready` | Payout amount, PIX key used, period, breakdown |
| `b2b_order_created` | Pedido B2B #{{order_number}} recebido | `b2b_order.created` | Order summary, payment instructions, estimated timeline |
| `b2b_retailer_approved` | Sua conta B2B CIENA foi aprovada | `b2b_retailer.approved` | Login credentials, portal link, catalog access, terms |

#### Marketing Email Templates

Marketing emails are sent through the CRM automation engine. Templates are configured per automation:

- **Cart recovery** (30min, 2h, 24h sequences) — abandoned items with images, direct checkout link
- **Post-purchase follow-up** — review request, UGC prompt
- **Repurchase nudge** — personalized product recommendations based on RFM data
- **Birthday campaigns** — personalized discount code
- **Inactivity win-back** — graduated incentives based on days since last purchase

All marketing emails include:
- LGPD-compliant unsubscribe link in footer
- Sender: `CIENA <noreply@ciena.com.br>` (transactional) or `CIENA <ola@ciena.com.br>` (marketing)
- CIENA brand header with dark-mode-compatible logo
- Footer: physical address, CNPJ, unsubscribe link

---

## 5. Delivery Infrastructure

### 5.1 BullMQ Queue Architecture

All notifications are processed asynchronously through BullMQ queues backed by Redis (Upstash). This decouples event emission from delivery, ensures reliability, and enables per-channel rate limiting.

```
Event emitted by module
       │
       ▼
  ┌──────────────┐
  │ Flare Router │  (resolves recipients, checks consent, renders templates)
  └──────┬───────┘
         │
    ┌────┴─────────────────────────────────────┐
    │            │              │               │
    ▼            ▼              ▼               ▼
┌────────┐ ┌──────────┐ ┌───────────┐ ┌────────────┐
│in-app  │ │ discord  │ │ whatsapp  │ │   email    │
│ queue  │ │  queue   │ │  queue    │ │   queue    │
└───┬────┘ └────┬─────┘ └─────┬─────┘ └─────┬──────┘
    │           │              │              │
    ▼           ▼              ▼              ▼
 Worker      Worker         Worker        Worker
 (insert     (Discord       (Meta Cloud   (Resend
  into DB     API post)      API send)     API send)
  + SSE)
```

### 5.2 Queue Configuration

| Queue Name | Concurrency | Rate Limit | Retry | Backoff |
|-----------|-------------|------------|-------|---------|
| `notifications:in-app` | 10 | None | 3 | Exponential (1s, 2s, 4s) |
| `notifications:discord` | 5 | 50 msg/s (Discord API limit) | 3 | Exponential (1s, 2s, 4s) |
| `notifications:whatsapp` | 3 | 80 msg/s (Meta tier 1 limit) | 3 | Exponential (5s, 15s, 45s) |
| `notifications:email` | 5 | Per Resend plan limits | 3 | Exponential (2s, 4s, 8s) |

### 5.3 Job Payload

Every notification job follows this standard payload:

```typescript
interface NotificationJob {
  id: string;                     // UUID — deduplication key
  event: string;                  // e.g., 'order.paid'
  channel: 'in-app' | 'discord' | 'whatsapp' | 'email';
  recipient: {
    type: 'internal_user' | 'contact' | 'creator' | 'retailer';
    id: string;                   // UUID of the recipient
    name: string;                 // Display name
    email?: string;               // For email channel
    phone?: string;               // For WhatsApp channel (E.164 format)
    discord_user_id?: string;     // For Discord @mentions
  };
  template: {
    key: string;                  // Template identifier
    variables: Record<string, string>; // Variables to interpolate
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, unknown>; // Extra context for logging/debugging
  emitted_at: string;             // ISO 8601 — when the source event occurred
}
```

### 5.4 Retry and Dead Letter Queue

```typescript
const QUEUE_OPTIONS = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000, // 1s base, then 2s, 4s
    },
    removeOnComplete: { count: 1000 },  // Keep last 1000 completed jobs
    removeOnFail: false,                 // Never auto-remove failed jobs
  },
};
```

After 3 failed attempts, the job is moved to a **dead letter queue** (`notifications:dead-letter`). Dead letter jobs are:
- Visible in the BullMQ Board dashboard (admin only)
- Reviewed manually by admin
- Can be retried manually or discarded
- Trigger a `system.job_failed` event (meta-notification to Discord `#alertas`)

### 5.5 Rate Limiting Details

| Channel | Rate Limit | Implementation |
|---------|-----------|----------------|
| **WhatsApp** | 80 msg/s (Meta Business tier 1), upgrades to 1000 msg/s at higher tiers | BullMQ rate limiter: `limiter: { max: 80, duration: 1000 }` |
| **Discord** | 50 requests/second globally per bot | BullMQ rate limiter: `limiter: { max: 50, duration: 1000 }` |
| **Email** | Per Resend plan (100/day free, unlimited on paid) | BullMQ rate limiter adjusted per plan tier |
| **In-app** | No external rate limit — limited by DB write throughput | No limiter needed |

---

## 6. In-App Notification UI

Reference: DS.md section 12.2.

### 6.1 Bell Icon

- **Position:** Top-right of the header bar, to the left of the user avatar
- **Icon:** Lucide `Bell` (Regular weight)
- **Unread badge:** Red circle with count (max display: `99+`), positioned top-right of the bell icon
- **Badge color:** `--danger` (#EF4444) background, white text, 10px font, min-width 18px
- **Zero unread:** No badge shown, bell icon in `--text-secondary` color
- **Animation:** Subtle shake animation on new notification arrival (200ms, 1 cycle)

### 6.2 Notification Panel (Sheet)

Click on the bell icon opens a **Sheet** component (right-side slide-in panel per DS.md section 9.1):

```
┌──────────────────────────────────┐
│  Notificacoes              [Mark all]│
│                                   │
│  HOJE                             │  ← Date group header
│                                   │
│  ● Estoque critico               │  ← Red dot = unread
│    Camiseta Preta P — 2 unidades │
│    ha 12 min                     │
│                                   │
│  ● Producao atrasada             │
│    Drop 13 — etapa Costura       │
│    prazo estourou ha 2 dias      │
│                                   │
│  ONTEM                            │  ← Date group header
│                                   │
│  ○ Troca aprovada                │  ← Gray dot = read
│    Pedido #4521 — Joao Silva     │
│    ha 1 dia                      │
│                                   │
│  ESTA SEMANA                      │
│                                   │
│  ○ Nova tarefa atribuida         │
│    Atualizar fotos Drop 14       │
│    ha 3 dias                     │
│                                   │
└──────────────────────────────────┘
```

### 6.3 UI Specifications

| Element | Style |
|---------|-------|
| Panel width | 380px (desktop), full-width (mobile) |
| Header | "Notificacoes" — 16px semibold, `--text-primary` |
| "Mark all" button | Ghost button, 13px, `--text-tertiary`, right-aligned |
| Date group headers | 11px uppercase, `--text-tertiary`, letter-spacing 0.05em |
| Notification item | Padding 12px 16px, border-bottom `--border-default` |
| Unread dot | 8px circle, `--danger` (#EF4444) |
| Read dot | 8px circle, `--text-tertiary` at 30% opacity |
| Title | 14px medium, `--text-primary` |
| Body | 13px regular, `--text-secondary`, max 2 lines (text-overflow ellipsis) |
| Timestamp | 12px, `--text-tertiary`, relative format ("ha 12 min", "ha 1 dia") |
| Hover state | `--surface-hover` background |
| Click action | Navigate to `action_url`, mark as read |
| Empty state | Illustration + "Nenhuma notificacao" text, centered |

### 6.4 Date Grouping Logic

Notifications are grouped by these date buckets:
- **Hoje** — notifications from today (BRT timezone)
- **Ontem** — notifications from yesterday
- **Esta semana** — notifications from this week (Mon-Sun), excluding today/yesterday
- **Anterior** — all notifications older than this week

### 6.5 Real-Time Updates

New notifications are pushed to the frontend via **Server-Sent Events (SSE)**:

```typescript
// API route: /api/notifications/stream
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Subscribe to user's notification channel
      const subscriber = subscribeToNotifications(session.userId, (notification) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(notification)}\n\n`)
        );
      });

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 30000);

      req.signal.addEventListener('abort', () => {
        subscriber.unsubscribe();
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 6.6 Mark as Read

| Action | Behavior |
|--------|----------|
| Click notification | Mark that notification as read (`read_at = NOW()`) + navigate to `action_url` |
| "Mark all" button | Batch update: `UPDATE global.notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL` |
| Auto-read on panel open | No auto-read — user must explicitly click or use "Mark all" |

---

## 7. Preference Management

Users can configure per-channel notification preferences.

### 7.1 In-App

- **Always on** — cannot be disabled
- All internal users receive in-app notifications for events configured for their role
- There is no per-event toggle for in-app (to avoid missed critical alerts)

### 7.2 Discord

- **Default:** On for all configured channels
- ClawdBot settings allow toggling notifications per Discord channel
- Individual @mention preferences can be configured in ClawdBot settings
- Discord-only events (reports, weekly digests) are configured in `clawdbot.report_schedules`

### 7.3 WhatsApp (Customer-Facing)

- **Governed by LGPD consent** stored in `crm.consents`
- Consent is collected at checkout (opt-in checkbox) or via CRM contact management
- Transactional messages (order updates, exchange status) require `whatsapp` consent type
- Marketing messages (cart recovery, campaigns) require `whatsapp` consent type AND the specific campaign opt-in
- Customers can revoke consent at any time via:
  - Reply "SAIR" to any WhatsApp message (auto-processed by WhatsApp Engine)
  - Contact support to request removal
  - Future: self-service preference center (expansion E5)
- Revoking consent sets `crm.consents.revoked_at = NOW()` and immediately stops all WhatsApp delivery

### 7.4 Email (Customer-Facing)

- **Governed by LGPD consent** stored in `crm.consents`
- Every marketing email includes a one-click **unsubscribe link** in the footer
- Unsubscribe link hits `/api/unsubscribe?token={signed_token}` which revokes `email` consent
- Transactional emails (order confirmations, exchange updates) are sent regardless of marketing consent (they are legally required communications)
- Resend handles bounce and complaint management automatically
- List-Unsubscribe header is included in all marketing emails (per RFC 8058)

### 7.5 Preference Storage

For internal users, notification preferences are stored in `global.users.metadata` JSONB:

```json
{
  "notification_preferences": {
    "discord_mentions": true,
    "discord_dnd_hours": { "start": "22:00", "end": "08:00" }
  }
}
```

For customers, all consent data lives in `crm.consents` (see DATABASE.md section 4.3).

---

## 8. Database Schema Reference

The `global.notifications` table stores all in-app notifications. See [DATABASE.md](../architecture/DATABASE.md) for the full schema.

**Key columns:**

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `user_id` | UUID (FK) | Recipient internal user |
| `title` | VARCHAR(255) | Notification headline |
| `body` | TEXT | Detail text |
| `icon` | VARCHAR(50) | Lucide icon name |
| `action_url` | TEXT | Deep link destination |
| `priority` | ENUM | low, medium, high, critical |
| `read_at` | TIMESTAMPTZ | NULL = unread |
| `module` | VARCHAR(50) | Source module (for filtering) |
| `event_type` | VARCHAR(100) | Event key (e.g., `stock.critical`) |
| `metadata` | JSONB | Extra context (escalation status, source data) |
| `created_at` | TIMESTAMPTZ | When the notification was created |

**Key indexes:**

```sql
-- Fast unread count per user (partial index)
CREATE INDEX idx_notifications_user_unread
  ON global.notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

-- Full notification history per user
CREATE INDEX idx_notifications_user
  ON global.notifications (user_id, created_at DESC);

-- Filter by source module
CREATE INDEX idx_notifications_module
  ON global.notifications (module);
```

---

## 9. API Endpoints

### 9.1 Notification REST API

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/notifications` | `global:notifications:read` | List notifications for current user (paginated, newest first) |
| GET | `/api/notifications/unread-count` | `global:notifications:read` | Return unread notification count for badge |
| GET | `/api/notifications/stream` | `global:notifications:read` | SSE stream for real-time push |
| PATCH | `/api/notifications/:id/read` | `global:notifications:read` | Mark a single notification as read |
| POST | `/api/notifications/mark-all-read` | `global:notifications:read` | Mark all unread notifications as read |

### 9.2 Query Parameters for GET `/api/notifications`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max 50) |
| `module` | string | _(all)_ | Filter by source module |
| `unread_only` | boolean | false | Show only unread notifications |

### 9.3 Event Emission API (Internal)

Modules emit events via an internal service function, not a public API:

```typescript
// packages/notifications/emit.ts
import { flareRouter } from './router';

export async function emitEvent(event: FlareEvent): Promise<void> {
  await flareRouter.process(event);
}

// Usage in any module:
await emitEvent({
  type: 'order.paid',
  payload: {
    order_id: order.id,
    order_number: order.order_number,
    contact_id: order.contact_id,
    amount: order.total,
    payment_method: order.payment_method,
  },
  emitted_at: new Date().toISOString(),
});
```

---

## 10. Implementation Checklist

| # | Task | Priority | Dependencies |
|---|------|----------|-------------|
| 1 | Create `packages/notifications/` package with Flare router | P0 | BullMQ, Redis |
| 2 | Implement event catalog as typed configuration | P0 | — |
| 3 | Build recipient resolution service | P0 | global.users, crm.contacts |
| 4 | Build LGPD consent check service | P0 | crm.consents |
| 5 | Set up 4 BullMQ queues with workers | P0 | Redis (Upstash) |
| 6 | Build in-app notification worker (DB insert + SSE push) | P0 | global.notifications table |
| 7 | Build Discord worker (embed posting via Discord API) | P1 | ClawdBot integration |
| 8 | Build WhatsApp worker (Meta Cloud API template sends) | P1 | WhatsApp Engine integration |
| 9 | Build Email worker (Resend API) | P1 | Resend integration |
| 10 | Implement SSE endpoint for real-time in-app push | P1 | Auth middleware |
| 11 | Build notification panel UI (Sheet component) | P1 | DS.md compliance |
| 12 | Implement mark-as-read API endpoints | P1 | global.notifications |
| 13 | Build escalation worker (unread high-priority check) | P2 | Discord worker |
| 14 | Implement dead letter queue monitoring | P2 | BullMQ Board |
| 15 | Submit WhatsApp templates for Meta approval | P1 | WhatsApp Business account |
| 16 | Build React Email templates for transactional emails | P1 | Resend |
| 17 | Implement preference management for Discord DND hours | P2 | global.users.metadata |
| 18 | Build admin notification settings UI | P2 | Settings module |

---

*This document is the single source of truth for the Flare notification system. Every notification-triggering event in Ambaril must be registered in the Event Catalog (section 2) before implementation. No module should send notifications directly — all delivery flows through Flare.*
