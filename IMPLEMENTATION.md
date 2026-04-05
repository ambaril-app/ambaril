# Ambaril — Implementation Roadmap v3.0

> Integration-First. Vertical Slices. Dados reais desde o dia 1. 11 módulos + 2 AI.
> Metodologia completa: ver [GOLD-STANDARD.md](GOLD-STANDARD.md)

## Context

Aprendizados aplicados neste plano:

1. **Phase 1 fracassou** com waves horizontais (~160 arquivos, zero fluxos testáveis)
2. **Avaliação CTO (S33)** identificou: timeline irrealista, providers não-implementados, drizzle config desatualizado, falta de Simulação Dia 1, Dashboard mal posicionado
3. **Princípio Integration-First:** cada módulo começa implementando os providers/webhooks necessários para ter dados reais. Sem dados mock. Sem UI sobre vazio.

**Meta:** 11 módulos + 2 AI MVP implementados, integrados, com dados reais.

**Maior dor atual:** PLM (Tavares) — produção é gargalo #1.

---

## Princípio #1: Integration-First

> **Regra absoluta:** Ao iniciar qualquer módulo novo, o primeiro slice é SEMPRE implementar as integrações necessárias para que dados reais fluam antes de construir UI.

| Módulo         | Integrações necessárias antes de UI                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ERP**        | Shopify (products, orders, inventory webhooks), Mercado Pago (transactions, webhooks), Melhor Envio (cotação, etiqueta, tracking), Loggi (tracking), Focus NFe (sandbox) |
| **PLM**        | Nenhuma nova (dados internos) — mas precisa de ERP sync para inventory                                                                                                   |
| **CRM**        | Shopify (customer data via orders já importados no ERP)                                                                                                                  |
| **Mensageria** | Meta Cloud API WA (connect, templates, send, webhooks), Resend (✅ já existe)                                                                                            |
| **Creators**   | Instagram Graph API (✅ já existe para social tracking)                                                                                                                  |
| **Trocas**     | Melhor Envio (✅ já existe do ERP — reverse labels)                                                                                                                      |
| **DAM**        | Cloudflare R2 (✅ já existe)                                                                                                                                             |
| **Marketing**  | Instagram (✅), Meta Ad Library (public API, sem auth)                                                                                                                   |
| **B2B**        | Nenhuma nova (usa ERP inventory + Mercado Pago do ERP)                                                                                                                   |
| **Dashboard**  | Nenhuma nova (lê dados de todos os módulos)                                                                                                                              |
| **Astro**      | Hermes Agent fork (novo, Python VPS) + Claude API (novo) + apps/mcp-server (novo, TypeScript) — Pulse absorvido pelo Astro                                               |

---

## Arquitetura de Dados

### Fontes de Verdade

```
┌──────────────────────────────────────────────────┐
│              Ambaril (nova fonte única)           │
│                                                    │
│  Shopify ───→ Produtos, Inventário, Pedidos       │
│  Yever ─────→ Dados de venda (leitura, Dashboard) │
│  Loggi ─────→ Rastreio (envios Loggi)             │
│  Melhor Envio → Rastreio + etiquetas              │
│  Mercado Pago → Pagamentos, Conciliação           │
│  Focus NFe ──→ NF-e                               │
│  Meta WA ───→ WhatsApp messaging                  │
│                                                    │
│  Bling ─────→ NADA (bypassado)                    │
└──────────────────────────────────────────────────┘
```

### Estratégia de Coexistência (Parallel Running)

| Módulo     | Substitui            | Coexiste com         | Fonte na coexistência               |
| ---------- | -------------------- | -------------------- | ----------------------------------- |
| ERP        | Bling                | Bling                | Shopify + Loggi + ME + MP           |
| CRM        | Kevi                 | Kevi                 | Shopify orders (clientes)           |
| Creators   | Manual               | Inbazz               | Dados próprios + Inbazz em paralelo |
| Trocas     | TroqueCommerce       | TroqueCommerce       | ERP orders                          |
| Tarefas    | Monday+Trello        | Monday+Trello        | Dados próprios                      |
| DAM        | Google Drive         | Google Drive         | R2                                  |
| Mensageria | Chatwoot + WA manual | Chatwoot + WA manual | Meta WA + Resend                    |

### Providers — Status

| Provider                | Capability    | Status          | Quando é necessário                           |
| ----------------------- | ------------- | --------------- | --------------------------------------------- |
| Shopify                 | `ecommerce`   | ✅ Implementado | Fase 0 (ERP)                                  |
| Yever                   | `checkout`    | ✅ Implementado | Fase 0 (Dashboard reads)                      |
| Resend                  | `email`       | ✅ Implementado | Fase C (Mensageria)                           |
| Cloudflare R2           | `storage`     | ✅ Implementado | Fase D (DAM)                                  |
| Instagram               | `social`      | ✅ Implementado | Fase D (Marketing)                            |
| **Mercado Pago**        | `payments`    | 🔨 Fase 0       | **ERP — conciliação, DRE**                    |
| **Melhor Envio**        | `shipping`    | 🔨 Fase 0       | **ERP — etiquetas, tracking**                 |
| **Loggi**               | `shipping`    | 🔨 Fase 0       | **ERP — tracking alternativo**                |
| **Focus NFe**           | `fiscal`      | 🔨 Fase 0       | **ERP — NF-e**                                |
| **Meta Cloud API**      | `messaging`   | 🔨 Fase C       | **Mensageria — WhatsApp**                     |
| **Hermes Agent** (fork) | `astro-agent` | 🔨 Fase E       | **Astro** (Discord runtime, VPS por tenant)   |
| **Claude API**          | `llm`         | 🔨 Fase E       | **Astro** (via Hermes multi-provider routing) |

---

## Grafo de Dependências (corrigido S33)

```
Shopify + ME + MP + Loggi + Focus NFe (fontes externas)
                    ↓
             ┌── ERP (coluna vertebral) ──┐
             ↓                             ↓
            PLM                           CRM
             ↓                             ↓
          Tarefas                      Mensageria ←── Meta WA
                                           ↓
                    ┌──────────────────────────────────┐
                    ↓          ↓          ↓            ↓
                 Creators    Trocas      B2B      (DAM + Marketing)
                                                       ↓
                                              Dashboard + Pulse
                                                       ↓
                                                     Astro
```

---

## Pre-Sprint (Dias 1-3) ✓

- [x] Deletar código Creators (~160 arquivos)
- [x] Arquivar creators schema em docs/archive/
- [x] Restaurar creators schema (S33)
- [x] Criar schemas (plm, tarefas, dam, trocas, messaging, b2b, creators)
- [x] Criar GOLD-STANDARD.md
- [x] Atualizar IMPLEMENTATION.md, PLAN.md, MEMORY.md, CLAUDE.md
- [x] Registrar novos providers (Loggi, ME, MP, Focus NFe, Meta WA)
- [ ] **BLOQUEADOR:** Credenciais API — Marcus criar apps (Loggi, ME, MP, Focus NFe, Meta WA)
- [ ] Auditoria de dados: Shopify vs Yever (divergência de vendas)
- [ ] Atualizar drizzle.config.ts com todos os schemas

---

## Fase 0: Integration Sprint (Semana 0)

> **Objetivo:** Todos os providers necessários para o ERP funcionando com dados reais. Webhooks recebendo eventos. Primeira migration rodada.

### Wave 0-1: Infra + Shopify Webhooks (Dias 1-2)

| #   | Slice                      | Jornada                                                                                         |
| --- | -------------------------- | ----------------------------------------------------------------------------------------------- |
| 0.1 | Drizzle config + migration | Atualizar schemaFilter com todos schemas. Rodar primeira migration real no Neon                 |
| 0.2 | Webhook infrastructure     | Endpoint `/api/v1/webhooks/:provider` com signature validation, idempotency, retry queue        |
| 0.3 | Shopify webhooks           | `orders/create`, `orders/updated`, `products/update`, `inventory_levels/update` → ingest no ERP |
| 0.4 | Shopify bulk import        | GraphQL Bulk Operations API: importar todos produtos, SKUs, pedidos históricos (paginado)       |

**Gate:** Dados reais do Shopify no banco. Pedidos e produtos importados. Webhooks recebendo eventos live.

### Wave 0-2: Payment + Shipping Providers (Dias 3-5)

| #   | Slice                       | Jornada                                                                                                       |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 0.5 | Mercado Pago provider       | OAuth2, GET /payments (historical import), webhooks (payment.approved, refund, chargeback)                    |
| 0.6 | Mercado Pago reconciliation | Match MP transactions com Shopify orders por reference_id. Criar `erp.financial_transactions`                 |
| 0.7 | Melhor Envio provider       | Auth, cotação de frete (POST /shipment/calculate), gerar etiqueta (POST /shipment/generate), tracking webhook |
| 0.8 | Loggi provider              | Auth, consultar rastreio (GET /tracking). Provider mais simples                                               |
| 0.9 | Focus NFe provider          | Auth sandbox, emitir NF-e (POST /nfe), consultar status. Interface pronta, sandbox para dev                   |

**Gate:** MP transactions importadas e matched com orders. Etiqueta ME gerada em sandbox. Rastreio Loggi consultado. NF-e emitida em sandbox Focus NFe.

**🏁 Milestone S0: Integration Sprint completo. 5 providers implementados. Dados reais fluindo. Webhooks ativos. Pronto para construir ERP com dados de verdade.**

---

## Fase A: ERP Core (Semanas 1-3)

> **Simulação Dia 1:** "Ana Clara abre o Ambaril no celular e vê os pedidos de hoje com status real do Shopify. Ela toca num pedido, vê os itens e pagamento do MP, gera etiqueta do Melhor Envio com 1 toque, e marca como enviado. O cliente recebe o tracking automaticamente. Isso resolve o processo manual atual no Bling onde ela precisa de 3 apps diferentes."

### Wave 1-2: Produtos + Pedidos (Semana 1)

| #   | Slice             | Jornada                                                                            |
| --- | ----------------- | ---------------------------------------------------------------------------------- |
| 1   | ERP setup wizard  | Check Shopify connected, mostrar status de import, dados já existem da Fase 0      |
| 2   | Lista de produtos | Produtos/SKUs do Shopify → grid com estoque, preço, status. Filtros                |
| 3   | Lista de pedidos  | Pedidos do Shopify → lista com status real (dados MP). Filtros por status/data     |
| 4   | Detalhe de pedido | Itens, cliente, pagamento (MP), status, timeline de eventos                        |
| 5   | Marcar enviado    | Mobile-optimized: gerar etiqueta ME → NF-e → marcar enviado. Sticky bottom buttons |

**Gate:** Marcus testa no celular: lista produtos com dados reais, lista pedidos com status MP, gerar etiqueta ME, marcar enviado

### Wave 3-4: Inventário + Pipeline (Semana 2)

| #   | Slice                    | Jornada                                                       |
| --- | ------------------------ | ------------------------------------------------------------- |
| 6   | Dashboard inventário     | Níveis por SKU, alertas baixo estoque, velocity, days-to-zero |
| 7   | Histórico movimentações  | Timeline de movimentações por SKU (venda, entrada, ajuste)    |
| 8   | Rastreio integrado       | Status de entrega Loggi + ME. Timeline no detalhe do pedido   |
| 9   | Pipeline visual (Kanban) | pendente→pago→separação→enviado→entregue. Drag cards          |
| 10  | Tier classification      | SKUs em Ouro/Prata/Bronze por velocity + volume (Pandora96)   |

**Gate:** Marcus testa: inventory com dados reais, rastreio, pipeline visual, tier badges

### Wave 5: DRE + Margem (Semana 3)

| #   | Slice                  | Jornada                                                                                          |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| 11  | Conciliação financeira | MP transactions matched com orders. Cards: receita, taxas, chargebacks                           |
| 12  | DRE mensal             | P&L agregado: receita bruta → descontos → devoluções → líquida → CMV → margem → despesas → lucro |
| 13  | Margem por SKU         | Custo produção + frete + gateway + imposto. Ranking por margem %                                 |
| 14  | Simulador de preço     | "Se mudo preço de X pra Y, margem vira Z%" — slider interativo                                   |
| 15  | DRE Planejado vs Real  | Pedro cria projeção → toggle Projetado/Real/Comparativo com delta %                              |
| 16  | Cashflow Tracking      | Receita + despesas por mês: Planejado/Real/Pago. Cards: Saldo, A Receber, A Pagar                |
| 17  | Team Costs             | Custo por membro da equipe (salário + benefícios + comissão) → alimenta DRE                      |
| 18  | Revenue Leak           | Perda estimada por SKU out-of-stock (Pandora96)                                                  |

**Gate:** Marcus testa: DRE com dados reais do MP, margem por SKU, simulador, cashflow

**🏁 Milestone S3: ERP MVP — Pedidos, inventário, envio, DRE, margem. TODOS com dados reais de Shopify + MP + ME.**

---

## Fase B: PLM + Tarefas (Semanas 4-6)

> PLM não precisa de integração externa nova (dados internos). Tarefas também não. Foco em funcionalidade.

> **Simulação Dia 1 (PLM):** "Tavares abre o PLM e cria uma OP para o Drop 15. Seleciona um playbook 'Camiseta Básica' que auto-preenche os 11 estágios com deadlines. Vincula fornecedor 'Malharia SP'. Vê timeline Gantt mostrando que QC termina 3 dias antes do lançamento. Isso resolve as planilhas e WhatsApp que ele usa hoje."

> **Simulação Dia 1 (Tarefas):** "Caio abre Tarefas e cria o projeto 'Drop 15' usando template 'Lançamento de Drop'. 15 tarefas auto-criadas com responsáveis e deadlines. Vê tudo no Gantt. Tavares vê tarefas de produção linkadas às etapas do PLM. Isso resolve Monday + Trello."

### PLM Wave 1-2 (Semana 4)

| #   | Slice                | Jornada                                                    |
| --- | -------------------- | ---------------------------------------------------------- |
| 19  | PLM setup + criar OP | Nome, coleção, SKU, deadline, quantidade                   |
| 20  | Etapas da OP         | 11 estágios sequenciais com deadlines configuráveis        |
| 21  | Timeline/Gantt       | Progresso por etapa, cores por status, drag-to-resize      |
| 22  | Fornecedor CRUD      | Cadastro + vincular fornecedor a etapa da OP               |
| 23  | Production Playbooks | Templates por tipo de peça. Selecionar → OP pré-preenchida |

**Gate:** Marcus testa: criar OP com playbook, ver Gantt, vincular fornecedor

### PLM Wave 3-4 + Tarefas Wave 1 (Semana 5)

| #   | Slice                     | Jornada                                                        |
| --- | ------------------------- | -------------------------------------------------------------- |
| 24  | Matérias-primas           | Lista por OP vinculada a ERP inventory                         |
| 25  | Gap analysis              | "Preciso 200m malha, tenho 50m, faltam 150m"                   |
| 26  | Alertas escalonados       | Segurança consumida → deadline amanhã → estourado              |
| 27  | Rework tracking           | Lotes defeituosos → fornecedor → retorno. Custo no OP          |
| 28  | Tarefas: projeto + Kanban | Criar projeto, adicionar tasks, Kanban (Todo/In Progress/Done) |

**Gate:** Marcus testa: gap analysis, alertas, rework, Kanban básico

### PLM Wave 5 + Tarefas Wave 2 (Semana 6)

| #   | Slice                      | Jornada                                                          |
| --- | -------------------------- | ---------------------------------------------------------------- |
| 29  | PLM→ERP sync               | Produção finalizada → inventory entry + margem atualizada        |
| 30  | Tech Packs                 | Ficha técnica: medidas, materiais, notas de construção           |
| 31  | Tarefas: Gantt view        | Barras com duração, dependências, milestones                     |
| 32  | Tarefas: Templates de Drop | Etapas pré-definidas auto-criadas por tipo de drop               |
| 33  | PLM→Tarefas integration    | Etapa PLM criada → task auto-criada para Tavares                 |
| 34  | Calendário Universal       | View mensal/semanal com tags por módulo. PLM contribui deadlines |

**Gate:** Marcus testa: PLM→ERP sync, Gantt com template, PLM→tasks, calendário com eventos PLM

**🏁 Milestone S6: PLM + Tarefas. Produção gerenciável com Gantt. Tarefas integradas. Calendário Universal com eventos de produção.**

---

## Fase C: CRM + Mensageria (Semanas 7-9)

> **Integração necessária: Meta Cloud API WA.** Primeiro slice da Mensageria é conectar Meta WA.

> **Simulação Dia 1 (CRM):** "Caio abre o CRM e vê 3.000 clientes importados do Shopify com RFM score. Filtra 'Champions' → vê 180 clientes que compraram 3+ vezes nos últimos 60 dias. Cria campanha WA para esse segmento. Isso resolve o Kevi onde segmentação era manual."

> **Simulação Dia 1 (Mensageria):** "Ana Clara marca pedido como enviado no ERP. Sistema automaticamente envia WhatsApp para o cliente com tracking code via Meta Cloud API. Slimgust vê a conversa no inbox e responde dúvida do cliente sem sair do Ambaril. Isso resolve Chatwoot + WA manual."

### CRM Wave 1 + Mensageria Integration (Semana 7)

| #   | Slice                                 | Jornada                                                                    |
| --- | ------------------------------------- | -------------------------------------------------------------------------- |
| 35  | **Meta Cloud API WA provider**        | Conectar Meta WA: auth, send message, receive webhook, template submission |
| 36  | CRM: importar clientes                | Shopify orders → contacts com dedup por CPF. Lista com busca               |
| 37  | CRM: detalhe contato                  | Histórico pedidos, total gasto, LTV, último pedido, canal de aquisição     |
| 38  | RFM scoring                           | Cron job: calcular R/F/M scores para todos contatos. Grid visual           |
| 39  | WA transacional (primeiro envio real) | Pedido enviado no ERP → cliente recebe WA com tracking via Meta API        |

**Gate:** Marcus testa: lista clientes com dados reais, RFM scores, WA transacional end-to-end

### CRM Wave 2-3 + Mensageria Wave 2 (Semana 8)

| #   | Slice                   | Jornada                                                                   |
| --- | ----------------------- | ------------------------------------------------------------------------- |
| 40  | Segmentos pré-built     | Champions, At Risk, Hibernating, VIP, First-timers, Churned               |
| 41  | Segmento custom builder | Regras AND/OR com filtros dinâmicos em qualquer campo                     |
| 42  | CRM Clusters            | 6 clusters automáticos com ações por cluster                              |
| 43  | Template CRUD           | Criar/submeter templates Meta. Track approval status                      |
| 44  | WA broadcast            | Enviar template aprovado para segmento CRM (rate limiting, consent check) |
| 45  | Inbox: thread view      | Lista conversas WA+email, thread chronológica, reply                      |

**Gate:** Marcus testa: segmentos RFM, segmento custom, WA broadcast, inbox thread view

### CRM Wave 4 + Mensageria Wave 3 (Semana 9)

| #   | Slice                  | Jornada                                                                |
| --- | ---------------------- | ---------------------------------------------------------------------- |
| 46  | Automations engine     | trigger→condition→action builder                                       |
| 47  | 5 automações pré-built | Welcome, pós-compra, carrinho (30min/2h/24h), inatividade, aniversário |
| 48  | Email campaign         | Criar campanha, segmentar, enviar via Resend, track opens/clicks       |
| 49  | Inbox: CRM sidebar     | Perfil cliente + quick replies + abrir troca direto da conversa        |
| 50  | Buyer Personas AI      | Gerar personas de dados reais (RFM + compras + trocas). Max 5 ativas   |
| 51  | NPS/Survey Builder     | Pesquisas com link público + dashboard NPS                             |

**Gate:** Marcus testa: automação end-to-end (trigger→WA), email campaign, inbox com sidebar CRM

**🏁 Milestone S9: CRM + Mensageria. Clientes segmentados com RFM. WhatsApp transacional + broadcast. Inbox unificado. Automações rodando.**

---

## Fase D: Creators + Trocas + DAM + Marketing (Semanas 10-11)

> **Integrações:** Trocas usa ME (✅ do ERP). Creators usa Instagram (✅). Marketing usa Meta Ad Library (public, sem auth). DAM usa R2 (✅). Nenhuma integração nova necessária.

> **Simulação Dia 1 (Creators):** "Caio configura o programa: 5 tiers, cupom automático. Um creator acessa o portal, vê dashboard de vendas/comissão, participa de challenges. Isso coexiste com Inbazz."

> **Simulação Dia 1 (Trocas):** "Slimgust recebe mensagem no inbox do Mensageria: cliente quer trocar tamanho. Clica 'Abrir troca' direto da conversa. Seleciona pedido, motivo. Sistema gera etiqueta reversa ME. Ana Clara recebe, inspeciona, marca OK → item volta ao estoque ERP."

### Wave 1: Setup + Core (Semana 10)

| #   | Slice                         | Jornada                                                                   |
| --- | ----------------------------- | ------------------------------------------------------------------------- |
| 52  | Creators: setup + tiers       | Configurar programa, 5 tiers, cupom automático por creator                |
| 53  | Creators: portal self-service | Cadastro público, dashboard vendas/comissão, share coupon                 |
| 54  | Trocas: criar solicitação     | Vincular pedido, motivo, tipo (size/color/credit/refund), pipeline status |
| 55  | Trocas: reverse logistics     | ME return label + tracking. WA notification ao cliente                    |
| 56  | DAM: upload + coleções        | Criar coleção + drag-drop upload para R2. Auto-thumbnail                  |
| 57  | Marketing: UGC Monitor        | Instagram feed de menções @cienalab com engagement metrics                |

**Gate:** Marcus testa: portal Creators, criar troca com etiqueta reversa, upload DAM, UGC feed

### Wave 2: Features + Admin (Semana 11)

| #   | Slice                            | Jornada                                                                              |
| --- | -------------------------------- | ------------------------------------------------------------------------------------ |
| 58  | Creators: gamification           | CIENA Points, challenges, tier progression                                           |
| 59  | Creators: admin dashboard        | GMV, top performers, comissões, anti-fraude flags                                    |
| 60  | Trocas: inspeção + conclusão     | Receber devolução → inspecionar → OK (restock ERP) ou damaged → store credit/refund  |
| 61  | DAM: busca + approval            | Tagging + full-text search + filter. Workflow draft→approved→published               |
| 62  | Marketing: Competitor Watch      | Meta Ad Library, 4 concorrentes (Baw, Approve, High, Disturb)                        |
| 63  | Marketing: Content Calendar      | Calendário editorial IG/TikTok → eventos no Calendário Universal com tag `marketing` |
| 64  | Marketing: Social Metrics        | Métricas IG (followers, reach, clicks) com tendência 30/90d                          |
| 65  | Marketing: Inside Commerce Audit | Checklist e-commerce mensal com score e AI recommendations                           |

**Gate:** Marcus testa: Creators gamification + admin, troca completa end-to-end, busca DAM, competitor ads, content calendar

**🏁 Milestone S11: Creators (coexiste com Inbazz), Trocas, DAM, Marketing. Suporte completo. Programa de creators. Asset management.**

---

## Fase E: Dashboard + B2B + Astro (Semanas 12-14)

> **Dashboard movido para cá** (antes estava em S4-6). Agora com 9 módulos live, os painéis têm dados reais em vez de telas vazias.
> **Integrações:** Hermes Agent fork (VPS por tenant) + Claude API + apps/mcp-server para Astro (inclui Discord runtime ex-Pulse, via ADR-015).

> **Simulação Dia 1 (Dashboard):** "Marcus abre o Dashboard e vê 9 painéis com dados reais de todos os módulos. Vendas do dia (ERP), produção em andamento (PLM), clientes por segmento (CRM), tickets abertos (Mensageria), trocas pendentes (Trocas), GMV de creators. Ativa War Room para o drop e vê vendas/minuto em real-time."

### Dashboard + B2B Wave 1 + Astro Discord setup (Semana 12)

| #   | Slice                    | Jornada                                                                                                       |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 66  | **Hermes Agent setup**   | Fork clonado, profile CIENA criado, SOUL.md configurado, conectado ao Discord                                 |
| 67  | **MCP Server setup**     | `apps/mcp-server` scaffolded. Tools: query_orders, check_inventory, get_plm_status, get_crm_segment           |
| 68  | Dashboard: KPIs + panels | 9 painéis (Vendas, Retenção, Estoque, Financeiro, Marketing, PLM, Trocas, Checkout, Creators) com dados reais |
| 69  | Dashboard: DRE Visual    | Waterfall chart do DRE mensal. Toggle entre meses                                                             |
| 70  | Dashboard: War Room      | Modo drop: vendas/min, estoque por SKU, conversão. SSE real-time                                              |
| 71  | B2B: retailer CRUD       | Admin cria conta, CNPJ validation, approve flow                                                               |
| 72  | B2B: wholesale catalog   | Preços B2B (markup from ERP), toggle disponibilidade                                                          |

**Gate:** Marcus testa: Dashboard com dados reais de 9 módulos, War Room, cadastrar lojista B2B

### Dashboard Wave 2 + B2B Wave 2 + Astro reports (Semana 13)

| #   | Slice                            | Jornada                                                                            |
| --- | -------------------------------- | ---------------------------------------------------------------------------------- |
| 73  | Dashboard: configurable alerts   | Regra: métrica cruza threshold → Flare → Discord + in-app                          |
| 74  | Dashboard: layout customization  | Drag-and-drop reorder, toggle visibility, filtros salvos                           |
| 75  | Dashboard por Role               | Role defaults: admin=tudo, finance=financeiro, operations=estoque+PLM              |
| 76  | Health Score                     | Radar chart 5D (vendas, produção, marketing, atendimento, financeiro). Cron diário |
| 77  | B2B: portal + checkout           | Login retailer, ver catálogo, carrinho, pedido min R$2k, PIX/boleto                |
| 78  | Astro Discord: scheduled reports | #report-vendas (daily), #report-estoque, #report-produção. Haiku formata           |
| 79  | Astro Discord: #alertas          | Flare events → Discord embeds em real-time                                         |

**Gate:** Marcus testa: alertas configurados, dashboard personalizado por role, portal B2B completo, Astro reports no Discord

### Astro + Integration (Semana 14)

| #   | Slice                          | Jornada                                                                            |
| --- | ------------------------------ | ---------------------------------------------------------------------------------- |
| 80  | Brand Brain                    | Wizard 6 etapas: cores, tom de voz, audiência, competidores, produtos, referências |
| 81  | Astro Discord: #geral-ia       | Chat interativo: pergunta → SQL generation (Sonnet) → resposta formatada           |
| 82  | Module Context + Insight Cache | 12+ contextos por módulo. Cache 24h TTL                                            |
| 83  | Rate Limiting AI + Feedback    | 6 categorias com limites. Thumbs up/down em toda resposta                          |
| 84  | Changelog In-App               | Página de novidades com badge no sidebar                                           |
| 85  | Cross-module integration test  | Testing todos 11 módulos + 2 AI integrados                                         |
| 86  | Mobile audit                   | Todos os fluxos da Ana Clara (ERP, Trocas, PLM stock entry)                        |

**Gate:** Marcus faz walkthrough completo de todos os 11 módulos + 2 AI

**🏁 Milestone S14: TODOS OS 11 MÓDULOS + 2 AI MVP LIVE. Dashboard com dados reais de tudo. Astro reportando no Discord e respondendo via chat.**

---

## Timeline Visual

```
Sem:  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14
      |S0|
      |INT|
          |------- ERP -------|
                          |---- PLM ----|
                                  |Tarefas|
                                        |--- CRM ---|
                                        |Mensageria-|
                                                  |Creators+Trocas|
                                                  |--DAM+Mktng---|
                                                            |Dashboard-|
                                                            |---B2B----|
                                                            |----Astro---|

S0  = Integration Sprint (providers + webhooks + data import)
S1-3  = Fase A: ERP com dados reais
S4-6  = Fase B: PLM + Tarefas
S7-9  = Fase C: CRM + Mensageria (Meta WA integration primeiro)
S10-11 = Fase D: Creators + Trocas + DAM + Marketing
S12-14 = Fase E: Dashboard + B2B + Astro (inclui Discord runtime ex-Pulse)
```

---

## Milestones de Teste

| Quando    | O que Marcus testa                                                      | Dados reais de                    |
| --------- | ----------------------------------------------------------------------- | --------------------------------- |
| Semana 0  | Providers conectados, webhooks recebendo, dados importados              | Shopify, MP, ME, Loggi, Focus NFe |
| Semana 3  | ERP: pedidos no celular, DRE, margem, cashflow, etiqueta ME             | Shopify + MP + ME                 |
| Semana 6  | PLM: OP com Gantt. Tarefas: Kanban + Gantt + templates                  | ERP sync                          |
| Semana 9  | CRM: segmentos RFM. Mensageria: WA transacional + broadcast + inbox     | Meta WA API real                  |
| Semana 11 | Creators: portal + gamification. Trocas: fluxo completo. DAM. Marketing | Instagram, ME                     |
| Semana 14 | Dashboard: 9 painéis. B2B: portal. Astro: Discord reports + chat        | TODOS os módulos                  |

---

## Riscos e Mitigação

| Risco                              | Mitigação                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| **Credenciais API não criadas**    | **BLOQUEADOR.** Marcus precisa criar apps antes da Semana 0. Sem isso, nada começa |
| APIs mal documentadas (Loggi, ME)  | Semana 0 é pra isso — testar conexão, entender quirks, documentar                  |
| Meta WA API aprovação de templates | Submeter templates no início da Semana 7. Sandbox para dev enquanto aguarda        |
| 11 módulos + 2 AI                  | Buffer na S14. Astro e B2B são cortáveis se necessário                             |
| Shopify data quality               | Auditoria no Pre-Sprint. Yever como cross-reference                                |
| PLM scope creep                    | MVP estreito: OP + etapas + 1 fornecedor + playbooks                               |
| Context decay                      | Max 45 min/sessão. Ralph Loop. Handoff docs                                        |
| AI gera 1.7x mais bugs             | Gate obrigatório: Marcus testa cada wave                                           |
| Dashboard vazio                    | **Resolvido:** Dashboard movido para S12 (depois de 9 módulos com dados)           |

---

## Checkout (Fora do Escopo Ativo)

Checkout NÃO é módulo ativo. Yever continua processando vendas. Ambaril lê dados da Yever via API para exibir no Dashboard. Checkout será implementado em fase futura.

## Creators (Reativado — coexiste com Inbazz)

Creators reativado. Coexiste com Inbazz (provedor externo contratado pela CIENA). Implementação na Fase D (Semanas 10-11). Schema restaurado na S33.

---

_v3.0 — 2026-04-02. Integration-First. Dashboard movido para S12. 15 semanas (S0-S14). CTO audit applied. Substitui v2.2._
