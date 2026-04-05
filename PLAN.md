# Ambaril — Mapa Completo de Módulos v4.0

> **Roadmap v4 — Replanning 2026-03-31. Vertical slices. Creators pausado (Inbazz). ERP-first.**

> **Versão:** 4.1 (replanning v3.0 — sessao 32)
> **Data:** Março 2026
> **Status:** Documento definitivo de escopo — base para criação dos .md individuais

---

## Status (atualizado 2026-03-31)

**Replanning v3.0 + S34 updates + Grill Review Abril 2026:** 11 módulos + 3 camadas AI (Astro, Genius, Pulse). Genius adicionado como KB de negócio. ERP expandido com Cloud Estoque, pedidos manuais, NF-e bonificação.

| Módulo               | Status       | Prioridade                                              |
| -------------------- | ------------ | ------------------------------------------------------- |
| **ERP Core**         | 🔜 Próximo   | #1 — Semanas 1-3                                        |
| **PLM**              | 📋 Planejado | #2 — Semanas 4-6                                        |
| **Dashboard**        | 📋 Planejado | #3 — Semanas 4-6                                        |
| **Tarefas**          | 📋 Planejado | #4 — Semanas 6-7                                        |
| **CRM**              | 📋 Planejado | #5 — Semanas 7-9 (Phase 2 inclui On-Site Widget Engine) |
| **Creators**         | 📋 Planejado | #6 — Semanas 10-11 (coexiste com Inbazz)                |
| **Mensageria**       | 📋 Planejado | #7 — Semanas 8-11 (inclui SMS)                          |
| **Trocas**           | 📋 Planejado | #7 — Semanas 10-11                                      |
| **DAM**              | 📋 Planejado | #8 — Semanas 10-11                                      |
| **Marketing**        | 📋 Planejado | #9 — Semanas 10-11                                      |
| **B2B**              | 📋 Planejado | #10 — Semanas 12-13                                     |
| **Pulse** (Discord)  | 📋 Planejado | #11 — Semanas 12-13                                     |
| **Astro** (AI Brain) | 📋 Planejado | #12 — Semanas 12-13                                     |
| **Genius** (AI KB)   | 📋 Planejado | #12 — Semanas 12-13 (junto com Astro)                   |
| **Checkout**         | 📖 Read-only | Yever continua ativo                                    |

---

## Decisões Estratégicas (2026-03-31)

- **Bling:** BYPASSADO. Dados vêm direto de Shopify + Loggi + Melhor Envio + Mercado Pago
- **Checkout:** Fora como módulo ativo. Yever continua. Ambaril lê dados para Dashboard
- **Creators:** Reativado. Coexiste com Inbazz (provedor externo). Ambaril gerencia programa internamente, Inbazz continua operando em paralelo
- **Metodologia:** Vertical slices (ver GOLD-STANDARD.md). Nunca waves horizontais
- **Coexistência:** Parallel running ~30 dias por módulo de substituição
- **Novos providers:** Loggi, Melhor Envio, Mercado Pago, Focus NFe, Meta Cloud API WA

---

## Fontes de Dados

| Fonte          | Dados                         | Status                   |
| -------------- | ----------------------------- | ------------------------ |
| Shopify        | Produtos, inventário, pedidos | ✅ Provider implementado |
| Yever          | Vendas (leitura)              | ✅ Provider implementado |
| Loggi          | Rastreio envios               | 🆕 Provider registrado   |
| Melhor Envio   | Rastreio + etiquetas          | 🆕 Provider registrado   |
| Mercado Pago   | Pagamentos, conciliação       | 🆕 Provider registrado   |
| Focus NFe      | NF-e (futuro)                 | 🆕 Provider registrado   |
| Meta Cloud API | WhatsApp messaging            | 🆕 Provider registrado   |
| Resend         | Email                         | ✅ Provider implementado |
| Cloudflare R2  | Storage                       | ✅ Provider implementado |
| Instagram      | Social                        | ✅ Provider implementado |
| Bling          | NADA                          | ❌ Bypassado             |

---

## RESUMO: 11 módulos + 3 camadas AI (Astro, Genius, Pulse)

Todos os itens abaixo foram discutidos e aprovados por Marcus. Features vivem dentro dos módulos — cada `docs/modules/{group}/{module}.md` tem a visão completa. IMPLEMENTATION.md dita o QUANDO.

---

## MÓDULOS CORE (substitui ferramentas pagas — economia direta)

### 1. Checkout Custom (`checkout.md`) — ~~substitui Yever~~ 📖 READ-ONLY (Yever continua ativo)

- Checkout brasileiro: CPF, CEP → ViaCEP, parcelamento, PIX com desconto, boleto
- Order bump + upsell one-click pós-pagamento
- Recuperação de carrinho abandonado (integra com CRM via WhatsApp + e-mail)
- A/B testing de layouts
- **Cloud Estoque / Split Delivery:** produtos em pré-venda ou reposição podem ser comprados mesmo sem estoque físico. O checkout separa entregas por prazo de disponibilidade (estilo Mercado Livre): "Seu pedido será entregue em duas remessas — uma chega dia X, outra dia Y". Benefício para cliente (ex: frete grátis no produto cloud). Requer integração profunda com ERP (status de estoque + previsão de entrega do PLM)
- **VIP Whitelist Drop Access:** durante as primeiras 24h de um lançamento, site visível para todos mas apenas clientes da whitelist VIP conseguem comprar (login/conta). Após 24h, libera para público geral
- Tracking de CPF comprador ≠ CPF creator (anti-fraude para programa Creators)
- **Economia:** 1,8% sobre faturamento (~R$ 3.060/mês a R$ 170k)
- **UX (DS.md seções 5, 6):**
  - Cupom como recompensa comportamental (campo recolhido por padrão)
  - Paste nativo obrigatório em todos os campos
  - Steps progressivos (endereço → pagamento → confirmação)
  - Botão "Finalizar compra" como único primário (tudo mais é ghost/terciário)
  - Explicação inline para CPF ("Necessário para emissão da NF-e")

### 2. CRM / Retenção (`crm.md`) — substitui Kevi

- Base unificada de clientes com histórico completo
- Segmentação automática RFM + segmentos custom
- Engine de automações: pós-compra, carrinho abandonado, recompra, aniversário, inatividade, boas-vindas + 5 automações Phase 2 (recommendations, cross-sell, upsell, price drop, back in stock)
- **Visual Flow Builder:** Editor drag-and-drop de automações customizadas com usabilidade ManyChat. Nodes: mensagem, delay, condição (if/else), A/B split, aguardar evento, ação (tag, segmento, campo). Preview por step, test mode, version history. Vai além das 23 automações pré-construídas
- **On-Site Widget Engine (Phase 2):** popups, banners, sliders, social proof, widget builder, targeting via CRM segments. Gerenciado pelo módulo Onsite (ver abaixo) — CRM é o provedor de dados de targeting
- **Ambaril Tracker / Live Events:** Pixel comportamental provider-agnostic (Shopify, Nuvemshop, qualquer plataforma). Coleta: page views, product views, cart events. Deanonimização multi-camada (cookie, fingerprint, identity injection em links). Journey map por contato. Dashboard de eventos ao vivo + funil macro. Futuro: gravação de sessão
- **Reviews & Ratings (CRM side):** Flow de solicitação de avaliação pós-entrega (Email + SMS + WA opcional). Formulário mobile-first por token assinado. List management + mediation inbox. Review stats dashboard. Backfill de avaliações históricas. Widget de avaliações gerenciado pelo módulo Onsite
- Disparo multicanal: WhatsApp + e-mail + **SMS** (via Mensageria)
- Tracking de cupons de influencer (código único por creator, ex: MIBR10)
- Relatórios: LTV por segmento, churn rate, coortes de recompra, performance de campanhas
- **Cohort Analytics avançado (C2):** análise por coorte de aquisição — "clientes que entraram pelo Drop 10: quantos recompraram no Drop 11? Qual LTV médio dessa coorte?" Queries SQL sobre dados que já existem no CRM. Caio lê esses dados com facilidade
- **Atribuição de Canal (C3):** toda venda rastreada por origem — Instagram orgânico, ad pago, influencer X, WhatsApp VIP, Google, direto. Todos os links UTMzados. Checkout captura UTM + cupom + fonte de tráfego. Urgente
- **NPS / Survey Builder:** Pesquisas de satisfação com link público mobile-first. Dashboard com NPS score + AI insights. Envio via Mensageria
- **Buyer Personas AI:** Gerar personas data-driven a partir de segmentos RFM + histórico de compras + trocas. Max 5 personas ativas
- **CRM por Cluster:** Segmentação automática em 6 clusters (first-timer, returning, VIP, at-risk, churned, whale) com ações pré-definidas por cluster
- **Economia:** R$ 1.200/mês
- **UX (DS.md seções 6, 7):**
  - Personalização por role (Caio vê analytics, Slimgust vê tickets)
  - LTV com enquadramento: "R$ 2.400 — Top 10% dos clientes"
  - Progressive disclosure em filtros (básicos visíveis, avançados em expand)

### 3. Mini-ERP + Fiscal (`erp.md`) — substitui Bling

- Gestão de pedidos multi-canal (status pipeline: pendente → pago → [aguardando produção] → separação → enviado → entregue)
- **Múltiplas origens de pedido:** Shopify DTC, B2B portal, pedido manual, confecção sob demanda (`order_source` enum)
- **Pedidos manuais + link de pagamento:** criar pedido no ERP, gerar link de pagamento via Mercado Pago (PIX, cartão, boleto faturado)
- **NF-e de bonificação:** seeding/presentes com CFOP correto, excluídos do faturamento no DRE
- Controle de estoque (entrada, saída automática, alertas configuráveis por SKU)
- **Sync de estoque Shopify↔ERP:** Shopify é autoridade para decrementos DTC (atômico no checkout). ERP é autoridade para todo o resto (produção, ajuste, B2B). Reconciliação automática com painel.
- Calculadora de velocidade de depleção (não demand forecasting)
- Emissão de NF-e via API (Focus NFe) — auto-emit na separação (default), override manual para B2B
- NF-e de devolução automática (integração com Trocas)
- Conciliação financeira: Mercado Pago (automática via webhooks) + Itaú/Conta Simples (API se disponível, OFX import como fallback)
- Etiquetas de envio + tracking (Melhor Envio). Sync fulfillment ERP→Shopify para tracking nativo.
- **Cloud Estoque (v1):** pré-venda de produtos em produção com badge na página, prazo configurável (manual ou via PLM), desconto opcional, política de frete configurável (marca absorve / cliente paga / frete grátis)
- **Calculadora de Margem Viva:** recálculo automático quando qualquer input muda (custo PLM, frete médio, taxa gateway). Simulador on-demand (what-if). Trend sparkline 90 dias.
- **DRE Mensal + DRE por Coleção + DRE Forecast:**
  - Mensal: receita bruta → descontos → receita líquida → CMV → margem bruta → despesas operacionais → resultado líquido
  - Por coleção (via tag de drop): receita + CMV + custos de desenvolvimento (modelagem, pilotos, silk, fretes, aviamentos do PLM)
  - Forecast: projeções mensais vs real com delta (%)
- **Cashflow Tracking:** Receita + despesas mês a mês com status planejado/real/pago. Cards: Saldo Projetado, A Receber, A Pagar
- **Team Cost Management:** Custo mensal por membro da equipe (salário + benefícios + comissão). Alimenta DRE automaticamente
- **Business Event Log:** todos eventos significativos registrados em `global.business_events` (centralizado cross-module)
- **Product Lifecycle:** produto nasce no PLM → enriquece no ERP → publica na Shopify. Bypass direto no ERP para produtos sem PLM.
- Interface 100% responsiva mobile (Ana Clara usa exclusivamente celular para expedição + entrada de estoque)
- **Economia:** R$ 0–50/mês + eficiência operacional massiva
- **UX (DS.md seções 6, 10, 11):**
  - Desktop-first. Mobile funcional para ações de expedição (sticky bottom button "Marcar como enviado")
  - Formulários com mínimo de campos por step
  - Empty state de estoque: "Nenhum produto cadastrado. Importe do Shopify ou crie manualmente."
- **Todas as 10 Open Questions fechadas** (ver erp.md Appendix B)

### 4. PLM — Product Lifecycle Management (`plm.md`) — O MÓDULO MAIS COMPLETO

**Status:** PRIORIDADE MÁXIMA — maior gargalo da empresa

**Conceito:** Inspirado no Coleção.Moda (PLM de moda brasileiro — fluxo de etapas, pré-custo, mapa de coleção, gerenciamento de times), mas customizado para a operação CIENA com foco em alertas inteligentes, automação e redução de carga cognitiva do Tavares.

**Sub-módulos:**

**4A. Ordens de Produção**

- Timeline visual (Gantt simplificado) por coleção/drop
- Checklist por etapa: conceito → modelagem → piloto → aprovação → grade → compra de insumos → corte → costura → acabamento → QC → entrada no estoque
- Cada etapa com prazo estimado, prazo real, e margem de segurança configurável
- Alertas automáticos escalonados: "Prazo de segurança consumido" → "Prazo vence amanhã" → "Prazo estourado — requer ação" (via Pulse Discord @tavares)
- Status visível no Dashboard, Pulse e Gestão de Tarefas
- Histórico de produções anteriores para referência de prazos realistas

**4B. Gestão de Fornecedores (módulo 15 — DENTRO do PLM)**

- Cadastro completo: fábricas, tecelagens, aviamentos, estamparias, tinturarias
- Histórico de pedidos por fornecedor (o que foi pedido, quando, valor)
- Histórico de contato (log de comunicações — datas, assuntos, acordos)
- Controle de prazos de entrega: prometido vs real (cálculo automático de confiabilidade)
- Briefings vinculados (especificação técnica da peça → ordem de produção)
- Avaliação de qualidade (rating interno: prazo, qualidade, comunicação, custo)
- Alertas: "Fornecedor X atrasou 3 das últimas 5 entregas"
- Contratos e condições comerciais armazenados

**4C. Lista de Insumos e Matéria-Prima**

- Para cada coleção/drop: lista de insumos necessários (tecidos, aviamentos, etiquetas, embalagens)
- Vinculação com estoque do ERP: "precisamos de 200m de malha 30/1 — temos 50m em estoque, faltam 150m"
- Alertas de compra por período: "Para cumprir o prazo do Drop 13, a compra de malha precisa ser feita até dia X"
- Cotações de fornecedores por insumo
- Alertas de reposição: itens que estão acabando e são recorrentes (etiquetas, embalagens, linhas)

**4D. Análise de Custos de Produção**

- Custo por peça (matéria-prima + mão de obra + overhead de fábrica)
- Comparativo de custos entre fornecedores para mesma peça/serviço
- Histórico de preços de insumos (tendência de alta/baixa)
- Alimenta diretamente a Calculadora de Margem do ERP

**4E. Retoque e Correções**

- Registro de necessidades de retoque/ajuste pós-piloto ou pós-produção
- Vinculação com fornecedor responsável
- Tracking de envio e retorno de peças para retoque
- Alertas de prazo (retoque que atrasa = drop que atrasa)

**4F. Production Playbooks**

- Templates de OP pré-configurados por tipo de peça ("Camiseta Básica" → estágios, tempos, fornecedores pré-preenchidos)
- Tavares seleciona playbook ao criar OP → ajusta quantidades e datas → confirma
- Admin cria/edita playbooks em PLM → Configurações → Playbooks

**4G. Ficha Técnica de Produto (NEW — Competitive Gap)**

- Entidade central do desenvolvimento de produto (inspirado Colecao.moda + Audaces ISA)
- Abas: modelagem (medidas + gradação automática), materiais (rendimento de tecido), custos itemizados, imagens/croquis, precificação com markup
- Export PDF com campos selecionáveis (ocultar custo para fornecedor)
- Preço aprovado vs calculado
- Custo por variante de cor

**4H. Portal de Fornecedor (NEW — Competitive Gap)**

- Role `supplier` com acesso por link/token
- Vê apenas stages atribuídas, upload de arquivos, confirmar entregas
- Inspirado no Audaces ISA (modelista sobe moldes direto na plataforma)

**Mudanças estruturais no PLM (Competitive Gap):**

- Etapas configuráveis por tenant (vs 11 fixas) — template default + customização
- Retrocesso de etapa (repilotagem) com motivo obrigatório
- Campos customizáveis no card de OP (custom_fields JSONB)
- 4 views: Lista (atual), Kanban de produtos por etapa, Mapa de coleção, Catálogo visual
- Mix de produto planejado vs executado
- Biblioteca de materiais enriquecida (gramatura, rendimento, imagem)
- Comentários/chat direto no OP
- Copy/move de produtos entre coleções (aproveitamentos)
- Tags customizáveis + filtros por qualquer campo
- Edição em massa + import via planilha

**Integrações:**

- ERP (estoque de MP, entrada de produto acabado, custos)
- Gestão de Tarefas (tarefas de produção viram tasks automaticamente)
- Dashboard Executivo (status de produção, atrasos, custos)
- Pulse Discord (#report-producao diário, #alertas para atrasos)
- **UX (DS.md seções 6, 7):**
  - Timeline como view principal (ação > informação)
  - Form de OP com progressive disclosure (dados básicos primeiro, detalhes em accordion)
  - Alertas com contexto: "3 dias para deadline. Fornecedor X não confirmou entrega."

### 5. Mensageria (WhatsApp + Email + SMS + Inbox) (`mensageria.md`)

- Mensagens transacionais (confirmação, envio, rastreamento)
- Disparos segmentados via CRM
- Recuperação de carrinho
- Gestão de grupos VIP (smart rotation links, broadcast)
- Meta Cloud API direta (sem BSP)
- Templates pré-aprovados pela Meta (~5–10 iniciais)
- Notificações para creators (challenge, venda, tier — programa Creators)
- **Content Calendar WhatsApp:** Calendário visual de mensagens planejadas (broadcasts, grupos VIP). Drag-drop para reagendar. Anti-spam: max 1 broadcast/dia por segmento
- **SMS:** Terceiro canal de disparo (Zenvia como provider primário). Consent `consent_sms` separado. Uso: review requests, fallback transacional, marketing. ANATEL quiet hours enforced. Opt-out via "SAIR"/"STOP"

### 6. Trocas e Devoluções (`trocas.md`) — substitui TroqueCommerce

- Troca por tamanho/cor, troca por crédito, devolução com reembolso
- Logística reversa (etiqueta automática via Melhor Envio)
- NF-e de devolução automática (API fiscal)
- Estoque atualizado ao receber produto de volta
- Integração com Inbox (Slimgust abre solicitação direto da conversa)
- Comissões do programa Creators: só sobre vendas confirmadas após 7 dias (janela de troca)
- **UX (DS.md seções 6, 11):**
  - Fluxo simples: máximo 3 steps (motivo → tipo de troca → confirmação)
  - Explicar por quê ao pedir dados de devolução
  - Empty state: "Nenhuma troca solicitada. Quando um cliente solicitar, o fluxo aparece aqui."

### 7. ~~Inbox de Atendimento~~ (merged into Mensageria — `mensageria.md`)

- Inbox unificado WhatsApp + e-mail para Slimgust
- Conversa vinculada ao perfil do cliente no CRM
- Tags, status, respostas rápidas, templates
- Integração nativa com Trocas
- Métricas: tempo de resposta, volume, taxa de resolução
- **UX (DS.md seções 5, 7):**
  - Ação-first: responder > ler metadata
  - Thread view com zero ruído (dados do cliente em sidebar colapsável, não no corpo)
  - Template de resposta rápida como ação primária

---

## MÓDULOS DE CRESCIMENTO (habilitam receita e inteligência)

### 8. Portal B2B / Atacado (`b2b.md`)

- Catálogo atacado (markup 2x–2.5x)
- Login de lojista aprovado (Guilherme cadastra)
- Checkout B2B (mínimo R$ 2–3k, apenas à vista — PIX/boleto)
- Self-service para reposição
- Dashboard B2B para Guilherme

### 9. Creators — Programa de Nano-Influenciadores (`creators.md`) — coexiste com Inbazz

<!-- Note: "CIENA Creators" é o nome do programa da CIENA (tenant). O módulo é genérico — cada tenant configura o nome do próprio programa. -->

> **Reativado:** Módulo Creators volta ao roadmap. Coexiste com Inbazz (provedor externo contratado pela CIENA). Ambaril gerencia programa de creators internamente enquanto Inbazz opera em paralelo. Schema restaurado de `docs/archive/`.

**Escopo COMPLETO definido por Marcus (documento v2.0)**

- 4 tiers: SEED (8%), GROW (10%), BLOOM (12%), CORE (15%)
- Cupom com 10% de desconto ao comprador
- Comissão sobre receita líquida (após desconto)
- Portal self-service: cadastro, cupom automático, dashboard de vendas/comissão/pontos
- Gamificação: CIENA Points (posts, vendas, challenges, indicações, engajamento)
- Challenges mensais (drop, estilo, comunidade, viralização, surpresa)
- Benefícios progressivos por tier (kit digital → acesso antecipado → CIENA Box → co-criação)
- Pagamento automático (PIX, até dia 15 do mês seguinte, mínimo R$ 50)
- Anti-fraude: CPF comprador ≠ CPF creator, cap R$ 3k/mês, monitoramento de sites de cupom
- Progressão/regressão automática mensal
- Detecção de posts via Instagram Graph API (alimenta sistema de pontos)
- **Bridge:** Moneri nos primeiros 60–90 dias → migrar para Ambaril
- Dashboard admin: GMV, top performers, CAC, ROAS, mix de produtos por creator
- **Evoluções futuras (C1-C7):** Content Studio, AI Content Coach, Shoppable Creator Feed, Creator Matchmaking AI, Real-time Sales Toast, Briefing Automatizado, Micro-Affiliate Links (ver `creators.md` seção 18)
- **Novas features (Competitive Gap — Abril 2026):**
  - Comissão individual por creator (override de tier) — necessário para mega-influencers
  - Pagamento fixo mensal por creator (contratos de influencers pagos)
  - Storage de mídia de posts em R2 (stories, UGC para tráfego pago)
  - AI Content Analysis (compliance check vs briefing via Astro)
  - Landing page do programa (/creators — benefícios, tiers, como funciona)
  - Ranking com pontuação oculta (configurável por tenant)
  - Mapa geográfico de creators/vendas por estado
  - Voucher como mecanismo de seeding
  - Saque ativo pelo creator (alternativa ao pagamento passivo)
- **UX (DS.md seções 4, 6, 11):**
  - Formulário público 3 etapas: inversão de sequência (mostrar benefícios/tier antes de pedir dados pessoais)
  - Portal creator: empty states com checklist ("Poste seu primeiro conteúdo para começar a acumular pontos")
  - Onboarding de creator com 3-5 passos de ativação

### 10. Marketing (`marketing.md`)

- **UGC Monitor:** Instagram Graph API — menções/tags @cienalab, métricas de engajamento, identificação de UGC com potencial para Partnership Ads
- **Creator Scout:** descoberta de nano/micro creators de streetwear BR (Instagram Graph API + Creator Marketplace API)
- **Competitor Watch:** Ad Library — monitorar Baw, Approve, High, Disturb. Criativos, formatos, creators usados
- **Ads Reporting:** performance de campanhas Meta/Google — ROAS, CPA, CPM, CTR. Reports no #report-marketing
- Manus AI: usado por Caio no Ads Manager como ferramenta de trabalho (análise, criativos, rebalanceamento). NÃO integrado ao Pulse/Astro — são ferramentas independentes
- Loop sistematizado: UGC detectado → Caio aprova → vira Partnership Ad
- **Content Calendar Social:** Calendário editorial para Instagram/TikTok. Posts planejados por semana com status (Planejado → Em Produção → Pronto → Publicado). AI gera copy via Brand Brain + Personas
- **Stories Calendar:** Calendário específico para Stories (sequência, elementos interativos). View dentro do Content Calendar
- **Meta Ads Library Cache:** Cache estruturado de anúncios de concorrentes com AI insights (evolução do Competitor Watch)
- **Ads Budget Planning:** Planejamento de budget Meta/Google por mês com target ROAS/CPA e projeção de receita
- **Social Consulting Metrics:** Métricas Instagram (seguidores, alcance, visitas perfil, cliques bio) com tendência e AI insights
- **Inside Commerce Audit:** Checklist estruturado para auditoria periódica do e-commerce (UX, oferta, copy, SEO). Score mensal comparativo

---

## MÓDULOS DE INFRAESTRUTURA (produtividade interna)

### 11. Gestão de Tarefas e Projetos (`tarefas.md`) — substitui Monday + Trello

**Responsável principal:** Caio (controla dinâmica geral: lançamentos, coleções, campanhas — olham nas dailies)

- **Gantt** como view principal (Caio prefere) + **Kanban** como view alternativa
- Atribuição de responsável (9 pessoas)
- Prazos com alertas (integra com Pulse)
- Vinculação com fluxo de drop (Fase 0–5)
- Visão por pessoa ("o que eu tenho pra fazer hoje")
- Comentários e anexos por tarefa
- **Templates de projeto** para drops recorrentes (inspirado no Coleção.Moda — estrutura de etapas padronizada)
- **Integração profunda com PLM:** tarefas de produção viram tasks automaticamente. Interface e usabilidade precisam ser excelentes — não pode ser uma integração "gambiarra"
- **Calendário Editorial (E1):** calendário separado do Gantt das dailies, segmentado — conecta datas de drop, posts planejados (IG, TikTok), campanhas de e-mail/WhatsApp, briefings de influencers, deadlines de criativos. Yuri, Sick e Caio são os principais usuários
- **Task Playbooks:** Templates de conjuntos de tarefas por área ("Lançar Drop" cria 15 tarefas automaticamente). Padroniza processos e onboarding
- **Meeting Management:** Notas de reunião com AI summary + tarefas sugeridas. Integração com Pulse + Astro
- **Pomodoro Timer:** Timer de foco no workspace (client-side, localStorage). Low priority
- **Nota (Competitive Gap — Abril 2026):** Módulo mais completo vs concorrentes. Sem gaps críticos identificados na análise competitiva. ISA não tem gestão de tarefas; clientes usam Monday/Trello. A integração PCP↔Tarefas é o principal diferencial do Ambaril vs Monday/Asana/ClickUp para moda.

### 12. Pulse (Discord Bot) (`pulse.md`)

**9 canais granulares:**

| Canal                | Conteúdo                                                             | Frequência             |
| -------------------- | -------------------------------------------------------------------- | ---------------------- |
| `#report-vendas`     | Vendas, pedidos, ticket médio, top produtos, comparativo             | Diário 08:00 + semanal |
| `#report-financeiro` | MP: saldo, aprovação, chargebacks. DRE mensal                        | Diário 08:30           |
| `#report-estoque`    | Níveis, velocidade de depleção, alertas de reorder                   | Diário 08:15           |
| `#report-producao`   | PLM: status produções, gargalos, fornecedores, insumos               | Diário 08:45           |
| `#report-marketing`  | Instagram analytics, UGC, creators, competitor watch, ads            | Diário 09:00 + weekly  |
| `#report-comercial`  | Wholesale B2B: pedidos, pipeline, faturamento                        | Semanal segunda 09:30  |
| `#report-suporte`    | Volume tickets, tempo resposta, temas recorrentes                    | Semanal sexta 17:00    |
| `#alertas`           | Estoque crítico, atraso PLM, spike vendas, UGC viral, erros checkout | Tempo real             |
| `#geral-ia`          | Chat interativo — qualquer membro pode perguntar ao bot              | On-demand              |

- LLM Routing: Haiku para reports estruturados, Sonnet para chat/análise
- SOUL.md como identidade (tom direto, dados primeiro, português BR informal)
- Reports via SQL (LLM formata, não calcula)

### 12b. Astro (AI Brain) (`astro.md`)

- **Astro = cérebro.** Chat AI, insights, anomaly detection, geração de conteúdo, automação inteligente
- **Genius = memória.** Base de conhecimento do negócio. Astro consome Genius em toda operação AI. Ver `genius.md`
- **Brand Brain migrado para Genius L0** — o wizard de 6 etapas (cores, tom, público, concorrentes) agora faz parte do onboarding do Genius
- **Module Context:** 12+ strings de contexto por módulo. Astro sabe onde o usuário está e adapta respostas
- **Insight Cache:** Cache de insights AI no banco (24h TTL). Reduz custo e latência
- **Rate Limiting por Categoria:** 6 tiers de uso AI (chat, insights, heavy gen, images, videos, light gen) com limites diários configuráveis
- **AI Feedback:** Thumbs up/down em toda resposta AI + comentário opcional. Dashboard de qualidade
- **Canais de ativação:** P0 web (v1), P1 Discord/Pulse (v1), P2 canais business Telegram/Slack (v2). Sem WA pessoal.

### 12c. Genius (Business Knowledge Base) (`genius.md`) — NEW

- **Base de conhecimento viva do negócio** — cada tenant tem sua própria KB estruturada por setores
- **Onboarding em 3 etapas:** (1) Áudio guiado por setor com prompts provocativos, (2) Grill adaptativo (só gaps), (3) Validação pelo empresário
- **Setores configuráveis:** AI propõe com base na descrição do negócio + template do nicho. Empresário ajusta.
- **Progressive Disclosure (4 níveis):** L0 ~200 tokens (sempre carregado) → L1 ~2k (mapa + keywords) → L2 ~5k (BM25 search) → L3 ~20k (read completo). 90% dos queries resolvem em L0+L1.
- **Auto-distill:** conversas com Astro, meeting notes, comentários PLM/tarefas → extraídos automaticamente para KB
- **Linting com dados reais:** cruza KB vs ERP/PLM/CRM periodicamente. Detecta inconsistências ("KB diz margem 40%, ERP mostra 28%")
- **Support Intelligence:** tickets de suporte classificados → padrões agregados → distilled na KB
- **Transcrição de áudio:** Whisper (default) / AssemblyAI (fallback + speaker diarization para dailies)
- **AI Gateway:** Provider pattern — Anthropic API agora, self-hosted futuro, BYOK como opção avançada
- **Custo estimado:** ~$5-15/tenant/mês (95% Haiku, 5% Sonnet). Sem Opus.

### 13. Dashboard Executivo + Drop War Room (`dashboard.md`)

- Painéis: vendas, retenção, estoque, financeiro, marketing, PLM, trocas, checkout, creators
- **Drop War Room:** view de tempo real ativada durante lançamentos — vendas por minuto, estoque em tempo real por SKU, comparativo com drops anteriores. Ativação manual por Marcus ou Caio
- DRE visual mensal (alimentado pelo ERP)
- Alertas automáticos configuráveis
- **UX (DS.md seções 4, 7, 8):**
  - F-pattern: KPI primário top-left por role (ver tabela DS.md seção 7)
  - Personalização por role — painéis default configuráveis por tenant
- **Dashboard por Role:** Cada role vê painéis diferentes por default (admin=tudo, finance=financeiro, operations=estoque+PLM)
- **CRO Panel:** Painel de funil de conversão (visitors→cart→checkout→payment→confirmed) com dados Shopify/Yever
- **Health Score da Marca:** Score 0-100 em 5 dimensões (vendas, produção, marketing, atendimento, financeiro) como radar chart
- **Custom Widgets:** Evolução do layout system — widgets individuais drag-and-drop (v2 do US-11/12/13)
  - Empty states que vendem módulos inativos (preview + benefício + CTA "Ativar módulo")
  - War Room = modo ativado sobre o dashboard (não painel separado)
  - Dados sempre contextualizados: delta + período de referência

### 14. Repositório de Assets / DAM (`dam.md`)

**Status:** Confirmado — Google Drive é muito caótico

- Biblioteca centralizada: fotos de produto, KVs, mockups, vídeos, UGC aprovado
- Organização por coleção, tipo de asset, formato, status (rascunho/aprovado/publicado)
- Tags e busca
- Versionamento (Sick sobe v1, Yuri comenta, Sick sobe v2)
- UGC aprovado pelo Marketing entra automaticamente
- Storage: Cloudflare R2 (egress gratuito) ou S3
- Substituir a bagunça do Google Drive com estrutura real
- **AI Image Generation / AI Studio:** Gerar imagens fotorealistas de produto com AI (briefing → DALL-E/FLUX). 20 gerações/dia
- **AI Video Generation:** Gerar vídeos curtos (5-10s) via Luma AI Ray 2. Image-to-video para reels/stories/ads. 5/dia
- **Creative Script Generation:** AI gera roteiros/briefings para criativos de vídeo e imagem via Brand Brain + Personas. Streaming (SSE)

---

> **Nota:** Todas as features (incluindo as antigas "expansões" E1-E12 e "módulos futuros" N1-N4) agora vivem dentro dos specs dos módulos em `docs/modules/`. Não existem mais categorias separadas de "expansão" ou "futuro" — cada feature pertence a um módulo. IMPLEMENTATION.md decide o que entra no sprint de 13 semanas vs. depois.

### Integrações Adicionais

| Integração                  | Módulo         | Nota                    |
| --------------------------- | -------------- | ----------------------- |
| Meta CAPI (Conversions API) | Checkout + CRM | Server-side tracking    |
| GA4 Measurement Protocol    | CRM            | Integração direta       |
| GA4 Enhanced Conversions    | CRM            | Conversão melhorada     |
| TikTok Events API           | Marketing      | Tracking cross-platform |

---

## Análise Competitiva (Abril 2026)

> Baseado em transcrições de calls de demo: Inbazz (creators), Colecao.moda (PLM), Audaces ISA (PLM+PCP).
> Docs completos em `docs/competitive/`.

**Diagnóstico:** Ambaril é significativamente mais completo como all-in-one, mas o PLM era tracking de produção, não desenvolvimento de produto. Features adicionadas para competir no mercado de PLM de moda:

- Ficha técnica rica (4G), portal de fornecedor (4H), etapas configuráveis, views visuais (Kanban/Catálogo/Mapa)
- Creators: comissão custom, storage de UGC, AI compliance
- Ver `docs/competitive/gap-analysis.md` para gaps detalhados e prioridades

---

## TIMELINE CONSOLIDADA (v4 — Replanning 2026-03-31)

> **Estrategia v4:** ERP-first. Creators reativado (coexiste com Inbazz). 11 módulos + 2 AI em 13 semanas. Vertical slices.
> **Metodologia:** Vertical slices — uma jornada completa por vez (ver GOLD-STANDARD.md e IMPLEMENTATION.md).
> **Ordem:** ERP → PLM → Dashboard → Tarefas → CRM → Mensageria → Trocas + Creators → DAM → Marketing → B2B → Pulse → Astro.
> Ver IMPLEMENTATION.md para detailed slices por módulo.

### Fase 0: Foundation (EM PROGRESSO — quase completa)

| Item                            | Descrição                                                                            | Bloqueante para |
| ------------------------------- | ------------------------------------------------------------------------------------ | --------------- |
| Monorepo scaffold               | Next.js 15 + Turborepo (`apps/web`, `apps/discord-bot`, `packages/*`)                | Tudo            |
| DB setup                        | Neon PostgreSQL + todos os 15 schemas + migration system (Drizzle)                   | Tudo            |
| Auth system                     | Custom auth (PostgreSQL sessions + ambaril_session cookie), RBAC middleware, 9 roles | Tudo            |
| Flare (básico)                  | Notification router + in-app queue                                                   | CRM, ERP, PLM   |
| PostgreSQL queues + Vercel Cron | Background jobs (ADR-012 — Redis eliminado)                                          | CRM, PLM, Pulse |
| Audit log middleware            | Middleware global de audit trail (compliance desde dia 1)                            | ERP, PLM, Admin |
| Deploy pipeline                 | Vercel + staging branch + CI (lint, typecheck, tests)                                | Tudo            |
| Global search                   | tsvector indexes, search endpoint                                                    | Tudo            |
| ADR-014                         | Multi-tenancy: Shared DB + tenant_id + RLS (B+A) — **APROVADO**                      | Tudo            |

> **Status:** Scaffolding completo, compilando. Neon DB criado (sa-east-1). GitHub repo criado. ADR-014 APROVADO.

> **Regra UX de entrega (DS.md seções 4, 7, 11):** Cada módulo entregue deve incluir: empty states, checklist de ativação por role, e welcome contextual. Módulos não ativados pelo tenant devem ser visíveis mas dimmed com preview + CTA.

> **Regra de integração (Sessão 25):** Módulos consomem **capabilities**, não providers específicos. Tenant escolhe providers no catálogo de integrações. Código do módulo chama `ecommerce.listCoupons()`, nunca `shopify.listDiscountCodes()`. Ver IMPLEMENTATION.md §0.0.

> **Regra de entrega por camadas (Sessão 25):** Cada módulo é entregue em layers priorizados:
>
> - **Layer 0:** Onboarding do módulo (check integrations → import dados existentes → configurar → ativar)
> - **Layer 1:** Fluxo core (3-5 páginas admin + 3-5 páginas user, com dados reais)
> - **Layer 2:** Engajamento (features que dependem de dados acumulados — progressive disclosure)
> - **Layer 3:** Avançado (compliance, anti-fraud, analytics, automações)
>   Ver IMPLEMENTATION.md "Module Delivery Framework".

### Fase 0.5: Tenant Onboarding & Integration Catalog

| Item                                                                      | Descrição                                                                                                                                                                                       | Bloqueante para           |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **Módulo Onboarding**                                                     | Wizard de setup do tenant: criar conta → conectar integrações → configurar módulos                                                                                                              | Todos os módulos          |
| **Integration Catalog**                                                   | Catálogo de providers por capability (ecommerce, checkout, payments, social, fiscal, shipping, messaging). Tenant escolhe quais conectar. UI estilo app store em `/admin/settings/integrations` | Creators, CRM, ERP, todos |
| **Provider Layer**                                                        | Interface de abstração: cada capability tem TypeScript interface. Providers implementam interface. Módulos consomem capabilities, nunca providers diretamente                                   | Todos os módulos          |
| **Tabelas `global.integration_providers` + `global.tenant_integrations`** | Seed data com providers disponíveis + credenciais criptografadas por tenant                                                                                                                     | Todos os módulos          |
| **CIENA setup**                                                           | Conectar Shopify (ecommerce) + Yever (checkout) + Instagram (social) + Resend (messaging) como primeiro tenant                                                                                  | Fase 1 (Creators)         |

> **Capabilities e providers iniciais:**
> | Capability | Providers v1 | Futuro |
> |------------|-------------|--------|
> | `ecommerce` | Shopify | Nuvemshop, VNDA, WooCommerce |
> | `checkout` | Yever | Shopify Checkout, Mercado Pago |
> | `payments` | Mercado Pago | PagSeguro, Stripe |
> | `social` | Instagram Graph API | TikTok API |
> | `fiscal` | Focus NFe | Bling (fiscal only) |
> | `shipping` | Melhor Envio | Correios direto |
> | `messaging` | Meta Cloud API (WA), Resend (email) | Twilio |
> | `storage` | Cloudflare R2 | — (infraestrutura, não por tenant) |

### ~~Fase 1: Creators~~ Reativada (coexiste com Inbazz) — movida para Fase 4

> **Creators reativado.** Coexiste com Inbazz (provedor externo). Implementação na Fase 4 (Semanas 10-11) junto com Trocas, Tarefas e B2B.

| Módulo                              | Escopo                                                                 | Status                             |
| ----------------------------------- | ---------------------------------------------------------------------- | ---------------------------------- |
| **Creators**                        | Tiers + Commissions + Portal self-service + Gamification + Anti-fraude | 📋 Planejado — coexiste com Inbazz |
| **Mensageria (ex-WhatsApp Engine)** | Meta Cloud API direta, templates para notificações de creators         | Semanas 8-11                       |
| **Dashboard**                       | Painel creators                                                        | Semanas 4-6 (standalone)           |

### Fase 1 (nova): ERP Core (PRIORIDADE #1 — Semanas 1-3)

| Módulo       | Escopo                                                                                                                       | Impacto                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **ERP Core** | Pedidos (Shopify sync) + Estoque + NF-e (Focus NFe) + Etiquetas (Melhor Envio) + Conciliação (Mercado Pago) + Margem por SKU | Substitui Bling. Base de dados para tudo |

> **Bling bypassado.** Dados vêm direto de Shopify + Loggi + Melhor Envio + Mercado Pago.

### Fase 2: PLM + Dashboard (PRIORIDADE #2 — Semanas 4-6)

| Módulo                 | Escopo                                                                               | Impacto                             |
| ---------------------- | ------------------------------------------------------------------------------------ | ----------------------------------- |
| **PLM**                | Production orders + Suppliers + Costs + Raw materials + Rework + Alertas escalonados | Desbloqueia bottleneck #1 (Tavares) |
| **Dashboard**          | Painéis vendas + estoque + produção + financeiro                                     | Beacon standalone                   |
| **Integração PLM↔ERP** | Cost sync, stock entry automático, inventory movements                               | Dados de custo fluem para margem    |

> **Caminho crítico:** ERP Core → PLM lê `erp.skus` + `erp.inventory`.

### Fase 3: Tarefas + CRM + Mensageria (Semanas 6-11)

| Módulo         | Escopo                                                                                    | Impacto                                                       |
| -------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Tarefas**    | Gantt + Kanban + Integração PLM + Calendário Universal (Semanas 6-7)                      | Produtividade interna — substitui Monday+Trello               |
| **CRM**        | Contacts + RFM + Segmentos + Automações + Campaigns (WA+email) + UTM + LGPD (Semanas 7-9) | Substitui Kevi (R$ 1.200/mês)                                 |
| **Mensageria** | Meta Cloud API + templates + broadcast + conversations + Inbox unificado (Semanas 8-11)   | Canal de entrega para CRM + Trocas + Atendimento centralizado |

### Fase 4: Trocas + Creators + DAM + Marketing (Semanas 10-11)

| Módulo        | Escopo                                                                 | Impacto                                                |
| ------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| **Trocas**    | Exchanges + Reverse logistics + NF-e return + Store credits            | Substitui TroqueCommerce                               |
| **Creators**  | Tiers + Commissions + Portal self-service + Gamification + Anti-fraude | Programa de nano-influenciadores (coexiste com Inbazz) |
| **DAM**       | Biblioteca de assets + R2 + Versionamento + Tags                       | Substitui Google Drive                                 |
| **Marketing** | UGC Monitor + Creator Scout + Competitor Watch + Ads Reporting         | Inteligência de marketing                              |

### Fase 5: B2B + Pulse + Astro + Genius (Semanas 12-13)

| Módulo     | Escopo                                                                                                | Impacto                                             |
| ---------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **B2B**    | Portal atacado + Catálogo + Price tables + Checkout B2B                                               | Habilitação de receita B2B                          |
| **Pulse**  | Discord bot (9 canais) + Reports (Haiku) + Chat (Sonnet)                                              | Interface Discord do Ambaril                        |
| **Astro**  | AI Brain — anomaly detection, correlações, chat natural                                               | Inteligência cross-module. Consome Genius como KB.  |
| **Genius** | Business KB — onboarding grill, progressive disclosure (L0-L3), auto-distill, linting com dados reais | Memória do negócio. Alimenta Astro + todos módulos. |

### Módulos fora do sprint de 13 semanas

| Módulo       | Status       | Nota                                                  |
| ------------ | ------------ | ----------------------------------------------------- |
| **Checkout** | 📖 Read-only | Yever continua ativo. Ambaril lê dados para Dashboard |

### Pós-sprint: Hardening + Features data-dependent

| Item                        | Descrição                                                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hardening**               | Testes E2E (Playwright), performance, segurança, LGPD compliance audit                                                                       |
| **Documentação**            | API docs finais, runbooks, onboarding guide                                                                                                  |
| **Features data-dependent** | Cohort analytics (requer 3+ meses), AI pricing (requer 2-3 meses), lead scoring preditivo (requer 6+ meses). Descritas nos specs dos módulos |

### Resumo de dependências (v4 — Replanning 2026-03-31)

```
Fase 0 (Foundation) ─────────────────────────────────────────┐
  │                                                           │
  ├─► Fase 0.5 (Tenant Onboarding + Integration Catalog) ────┤
  │     └─► Provider Layer + Catalog UI + CIENA setup         │
  │                                                           │
  ├─► Fase 1 (ERP Core — Semanas 1-3) ─────────────────────┤
  │     └─► Shopify + Melhor Envio + Mercado Pago providers   │
  │                                                           │
  ├─► Fase 2 (PLM + Dashboard — Semanas 4-6) ──────────────┤
  │     └─► Depende de ERP Core (skus + inventory)            │
  │                                                           │
  ├─► Fase 3 (Tarefas + CRM + Mensageria — Semanas 6-11) ───┤
  │     └─► Mensageria depende de Meta Cloud API provider     │
  │                                                           │
  ├─► Fase 4 (Trocas + Creators + DAM + Marketing — S10-11) ┤
  │     └─► Creators coexiste com Inbazz. Marketing depende de Social providers │
  │                                                           │
  ├─► Fase 5 (B2B + Pulse + Astro — Semanas 12-13) ─────────┤
  │     └─► Pulse/Astro dependem de Dashboard data            │
  │                                                           │
  │                                                           │
  └─► 📖 Checkout (READ-ONLY — Yever)
```

### Diferenças-chave: roadmap v3 vs. v4

| Aspecto       | v3                                | v4 (atual)                      | Motivo                                 |
| ------------- | --------------------------------- | ------------------------------- | -------------------------------------- |
| Prioridade #1 | **Creators** (ferramenta nova)    | **ERP Core** (substitui Bling)  | ERP é base para tudo                   |
| Prioridade #2 | **PCP** (fase própria)            | **PLM + Dashboard** (paralelos) | Dashboard não depende mais de Creators |
| Creators      | Fase 1 — prioridade máxima        | **Fase 4 (Semanas 10-11)**      | Reativado, coexiste com Inbazz         |
| Checkout      | Fase 4 — substituição Yever       | **Read-only**                   | Yever continua ativo                   |
| Bling         | Provider de ERP                   | **Bypassado**                   | Dados direto de Shopify+Loggi+ME+MP    |
| Metodologia   | Waves horizontais (160+ arquivos) | **Vertical slices**             | Uma jornada completa por vez           |
| Timeline      | Sem prazo definido                | **13 semanas**                  | Sprint concentrado, accountability     |

---

## MÓDULOS DESCARTADOS / NÃO APLICÁVEIS

| Item                                       | Motivo                                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Programa de fidelidade / pontos consumidor | Não faz sentido pro modelo de drops da CIENA                                                                                   |
| Gift cards / vale-presente                 | Não é relevante pro negócio                                                                                                    |
| Multi-moeda / internacional                | 100% Brasil                                                                                                                    |
| App mobile próprio                         | Não faz sentido pro tamanho atual                                                                                              |
| ~~Reviews/avaliações de produto~~          | ~~Modelo de drops com estoque limitado já cria urgência~~ → **Revertido: Reviews & Ratings agora é feature do CRM + Checkout** |
| ~~Notificação de restock~~                 | ~~Escassez é intencional~~ → **Revertido parcialmente: Back in Stock é automação no CRM** para waitlist + visualizadores       |

---

## PROXIMO PASSO

Stack aprovada (ADRs 008-014). Fase 0 completa. Replanning v2.0 em execução.

**Concluido:**

- [x] ADRs 008-013 APROVADOS (sessao 12)
- [x] ADR-014 APROVADO (sessao 17) — B+A: Shared DB + tenant_id + RLS. Project-per-tenant (Neon) planejado para 3+ tenants
- [x] Neon DB criado (sa-east-1, PostgreSQL 17)
- [x] GitHub repo criado (ambaril-app/ambaril)
- [x] Monorepo scaffold compilando
- [x] Auth system implementado (login, sessions, middleware, RBAC)
- [x] Drizzle schemas definidos (79 tabelas, 7 schemas)
- [x] Auditoria completa + correcoes pre-commit (sessao 17)
- [x] Phase 1 Creators — 160+ arquivos, ~30k LOC (PAUSADO — Inbazz contratado)
- [x] Replanning v2.0 — Creators pausado, ERP-first, vertical slices (sessao 29)
- [x] GOLD-STANDARD.md criado — template de vertical slices
- [x] Creators code removido, schema arquivado em `docs/archive/`

**Proximos passos (Fase 1 — ERP Core, Semanas 1-3):**

1. Skeleton schemas para ERP (orders, inventory, shipping, fiscal)
2. Provider implementations: Loggi, Melhor Envio, Mercado Pago, Focus NFe
3. Vertical slice 1: Pedido chega do Shopify → pipeline de status → Ana Clara marca envio
4. Vertical slice 2: Estoque sync Shopify → alertas de depleção
5. Vertical slice 3: NF-e (Focus NFe) + etiqueta (Melhor Envio) + rastreio
6. Ver IMPLEMENTATION.md para detailed slices

_Este documento e definitivo em escopo macro. Detalhes tecnicos estao nos .md individuais de cada modulo e em IMPLEMENTATION.md._
