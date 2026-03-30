# Ambaril — Mapa Completo de Módulos v3.0

> **Roadmap v3 — Sessao 17. Estrategia: construir ferramentas NOVAS primeiro, substituir existentes depois.**

> **Versão:** 3.0 (roadmap v3 — sessao 17)
> **Data:** Março 2026
> **Status:** Documento definitivo de escopo — base para criação dos .md individuais

---

## RESUMO: 15 módulos confirmados + 15 expansões aprovadas

Todos os itens abaixo foram discutidos e aprovados (ou ajustados) por Marcus. Nada aqui é suposição.

---

## MÓDULOS CORE (substitui ferramentas pagas — economia direta)

### 1. Checkout Custom (`checkout.md`) — substitui Yever
- Checkout brasileiro: CPF, CEP → ViaCEP, parcelamento, PIX com desconto, boleto
- Order bump + upsell one-click pós-pagamento
- Recuperação de carrinho abandonado (integra com CRM via WhatsApp + e-mail)
- A/B testing de layouts
- **Cloud Estoque / Split Delivery:** produtos em pré-venda ou reposição podem ser comprados mesmo sem estoque físico. O checkout separa entregas por prazo de disponibilidade (estilo Mercado Livre): "Seu pedido será entregue em duas remessas — uma chega dia X, outra dia Y". Benefício para cliente (ex: frete grátis no produto cloud). Requer integração profunda com ERP (status de estoque + previsão de entrega do PCP)
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
- **On-Site Widget Engine (Phase 2):** popups, banners, sliders, social proof, widget builder, targeting rules, Shopify theme app extension
- Disparo multicanal: WhatsApp (via WhatsApp Engine) + e-mail (Resend/SES)
- Tracking de cupons de influencer (código único por creator, ex: MIBR10)
- Relatórios: LTV por segmento, churn rate, coortes de recompra, performance de campanhas
- **Cohort Analytics avançado (C2):** análise por coorte de aquisição — "clientes que entraram pelo Drop 10: quantos recompraram no Drop 11? Qual LTV médio dessa coorte?" Queries SQL sobre dados que já existem no CRM. Caio lê esses dados com facilidade
- **Atribuição de Canal (C3):** toda venda rastreada por origem — Instagram orgânico, ad pago, influencer X, WhatsApp VIP, Google, direto. Todos os links UTMzados. Checkout captura UTM + cupom + fonte de tráfego. Urgente
- **Economia:** R$ 1.200/mês
- **UX (DS.md seções 6, 7):**
  - Personalização por role (Caio vê analytics, Slimgust vê tickets)
  - LTV com enquadramento: "R$ 2.400 — Top 10% dos clientes"
  - Progressive disclosure em filtros (básicos visíveis, avançados em expand)

### 3. Mini-ERP + Fiscal (`erp.md`) — substitui Bling
- Gestão de pedidos (status pipeline: pendente → pago → separação → enviado → entregue)
- Controle de estoque (entrada, saída automática, alertas configuráveis por SKU)
- Calculadora de velocidade de depleção (não demand forecasting)
- Emissão de NF-e via API (Focus NFe / PlugNotas) — trigger: Ana Clara marca envio
- NF-e de devolução automática (integração com Trocas)
- Conciliação financeira básica (webhooks Mercado Pago)
- Etiquetas de envio + tracking (Melhor Envio)
- **Calculadora de Margem por SKU (módulo 14 — DENTRO do ERP):**
  - Custo de produção (MP + mão de obra + overhead) por SKU
  - Custo de frete médio por SKU (peso/dimensão)
  - Taxa gateway (Mercado Pago: ~6% cartão, 0% PIX — mix estimado)
  - Impostos (ICMS, PIS, COFINS conforme regime tributário)
  - Output: margem líquida em R$ e % por SKU, por coleção, consolidada
  - Simulador: "se mudo o preço de R$ X para R$ Y, a margem vai para Z%"
  - Ranking de produtos por margem (identificar SKUs que vendem mas não dão lucro)
- **DRE Automatizado (C1):** relatório mensal automático para Pedro — receita bruta → descontos → receita líquida → CMV → margem bruta → despesas operacionais → resultado líquido. Todos os dados já existem no ERP
- Interface 100% responsiva mobile (Ana Clara usa exclusivamente celular)
- **Economia:** R$ 0–50/mês + eficiência operacional massiva
- **UX (DS.md seções 6, 10, 11):**
  - Desktop-first. Mobile funcional para ações de expedição (sticky bottom button "Marcar como enviado")
  - Formulários com mínimo de campos por step
  - Empty state de estoque: "Nenhum produto cadastrado. Importe do Shopify ou crie manualmente."

### 4. PCP — Produção + Fornecedores (`pcp.md`) — O MÓDULO MAIS COMPLETO
**Status:** PRIORIDADE MÁXIMA — maior gargalo da empresa

**Conceito:** Inspirado no Coleção.Moda (PLM de moda brasileiro — fluxo de etapas, pré-custo, mapa de coleção, gerenciamento de times), mas customizado para a operação CIENA com foco em alertas inteligentes, automação e redução de carga cognitiva do Tavares.

**Sub-módulos:**

**4A. Ordens de Produção**
- Timeline visual (Gantt simplificado) por coleção/drop
- Checklist por etapa: conceito → modelagem → piloto → aprovação → grade → compra de insumos → corte → costura → acabamento → QC → entrada no estoque
- Cada etapa com prazo estimado, prazo real, e margem de segurança configurável
- Alertas automáticos escalonados: "Prazo de segurança consumido" → "Prazo vence amanhã" → "Prazo estourado — requer ação" (via ClawdBot Discord @tavares)
- Status visível no Dashboard, ClawdBot e Gestão de Tarefas
- Histórico de produções anteriores para referência de prazos realistas

**4B. Gestão de Fornecedores (módulo 15 — DENTRO do PCP)**
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

**Integrações:**
- ERP (estoque de MP, entrada de produto acabado, custos)
- Gestão de Tarefas (tarefas de produção viram tasks automaticamente)
- Dashboard Executivo (status de produção, atrasos, custos)
- ClawdBot Discord (#report-producao diário, #alertas para atrasos)
- **UX (DS.md seções 6, 7):**
  - Timeline como view principal (ação > informação)
  - Form de OP com progressive disclosure (dados básicos primeiro, detalhes em accordion)
  - Alertas com contexto: "3 dias para deadline. Fornecedor X não confirmou entrega."

### 5. WhatsApp Engine (`whatsapp.md`)
- Mensagens transacionais (confirmação, envio, rastreamento)
- Disparos segmentados via CRM
- Recuperação de carrinho
- Gestão de grupos VIP (smart rotation links, broadcast)
- Meta Cloud API direta (sem BSP)
- Templates pré-aprovados pela Meta (~5–10 iniciais)
- Notificações para creators (challenge, venda, tier — programa Creators)

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

### 7. Inbox de Atendimento (`inbox.md`)
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

### 9. Creators — Programa de Nano-Influenciadores (`creators.md`)
<!-- Note: "CIENA Creators" é o nome do programa da CIENA (tenant). O módulo é genérico — cada tenant configura o nome do próprio programa. -->
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
- **UX (DS.md seções 4, 6, 11):**
  - Formulário público 3 etapas: inversão de sequência (mostrar benefícios/tier antes de pedir dados pessoais)
  - Portal creator: empty states com checklist ("Poste seu primeiro conteúdo para começar a acumular pontos")
  - Onboarding de creator com 3-5 passos de ativação

### 10. Marketing Intelligence (`marketing-intel.md`)
- **UGC Monitor:** Instagram Graph API — menções/tags @cienalab, métricas de engajamento, identificação de UGC com potencial para Partnership Ads
- **Creator Scout:** descoberta de nano/micro creators de streetwear BR (Instagram Graph API + Creator Marketplace API)
- **Competitor Watch:** Ad Library — monitorar Baw, Approve, High, Disturb. Criativos, formatos, creators usados
- **Ads Reporting:** performance de campanhas Meta/Google — ROAS, CPA, CPM, CTR. Reports no #report-marketing
- Manus AI: usado por Caio no Ads Manager como ferramenta de trabalho (análise, criativos, rebalanceamento). NÃO integrado ao ClawdBot — são ferramentas independentes
- Loop sistematizado: UGC detectado → Caio aprova → vira Partnership Ad

---

## MÓDULOS DE INFRAESTRUTURA (produtividade interna)

### 11. Gestão de Tarefas e Projetos (`tarefas.md`) — substitui Monday + Trello
**Responsável principal:** Caio (controla dinâmica geral: lançamentos, coleções, campanhas — olham nas dailies)

- **Gantt** como view principal (Caio prefere) + **Kanban** como view alternativa
- Atribuição de responsável (9 pessoas)
- Prazos com alertas (integra com ClawdBot)
- Vinculação com fluxo de drop (Fase 0–5)
- Visão por pessoa ("o que eu tenho pra fazer hoje")
- Comentários e anexos por tarefa
- **Templates de projeto** para drops recorrentes (inspirado no Coleção.Moda — estrutura de etapas padronizada)
- **Integração profunda com PCP:** tarefas de produção viram tasks automaticamente. Interface e usabilidade precisam ser excelentes — não pode ser uma integração "gambiarra"
- **Calendário Editorial (E1):** calendário separado do Gantt das dailies, segmentado — conecta datas de drop, posts planejados (IG, TikTok), campanhas de e-mail/WhatsApp, briefings de influencers, deadlines de criativos. Yuri, Sick e Caio são os principais usuários

### 12. ClawdBot Discord (`clawdbot.md`)
**9 canais granulares:**

| Canal | Conteúdo | Frequência |
|-------|----------|------------|
| `#report-vendas` | Vendas, pedidos, ticket médio, top produtos, comparativo | Diário 08:00 + semanal |
| `#report-financeiro` | MP: saldo, aprovação, chargebacks. DRE mensal | Diário 08:30 |
| `#report-estoque` | Níveis, velocidade de depleção, alertas de reorder | Diário 08:15 |
| `#report-producao` | PCP: status produções, gargalos, fornecedores, insumos | Diário 08:45 |
| `#report-marketing` | Instagram analytics, UGC, creators, competitor watch, ads | Diário 09:00 + weekly |
| `#report-comercial` | Wholesale B2B: pedidos, pipeline, faturamento | Semanal segunda 09:30 |
| `#report-suporte` | Volume tickets, tempo resposta, temas recorrentes | Semanal sexta 17:00 |
| `#alertas` | Estoque crítico, atraso PCP, spike vendas, UGC viral, erros checkout | Tempo real |
| `#geral-ia` | Chat interativo — qualquer membro pode perguntar ao bot | On-demand |

- LLM Routing: Haiku para reports estruturados, Sonnet para chat/análise
- SOUL.md como identidade (tom direto, dados primeiro, português BR informal)
- Reports via SQL (LLM formata, não calcula)

### 13. Dashboard Executivo + Drop War Room (`dashboard.md`)
- Painéis: vendas, retenção, estoque, financeiro, marketing, PCP, trocas, checkout, creators
- **Drop War Room:** view de tempo real ativada durante lançamentos — vendas por minuto, estoque em tempo real por SKU, comparativo com drops anteriores. Ativação manual por Marcus ou Caio
- DRE visual mensal (alimentado pelo ERP)
- Alertas automáticos configuráveis
- **UX (DS.md seções 4, 7, 8):**
  - F-pattern: KPI primário top-left por role (ver tabela DS.md seção 7)
  - Personalização por role — painéis default configuráveis por tenant
  - Empty states que vendem módulos inativos (preview + benefício + CTA "Ativar módulo")
  - War Room = modo ativado sobre o dashboard (não painel separado)
  - Dados sempre contextualizados: delta + período de referência

### 14. Repositório de Assets / DAM (`dam.md`)
**Status:** Confirmado — Google Drive é muito caótico

- Biblioteca centralizada: fotos de produto, KVs, mockups, vídeos, UGC aprovado
- Organização por coleção, tipo de asset, formato, status (rascunho/aprovado/publicado)
- Tags e busca
- Versionamento (Sick sobe v1, Yuri comenta, Sick sobe v2)
- UGC aprovado pelo Marketing Intelligence entra automaticamente
- Storage: Cloudflare R2 (egress gratuito) ou S3
- Substituir a bagunça do Google Drive com estrutura real

---

## FUNCIONALIDADES INTEGRADAS (vivem dentro de outros módulos)

Estes não são módulos separados — são funcionalidades que ficam compartimentalizadas dentro dos módulos core.

| Funcionalidade | Vive dentro de | Notas |
|----------------|---------------|-------|
| Calculadora de Margem por SKU | ERP | Custo, frete, taxa, imposto → margem líquida por SKU |
| DRE Automatizado | ERP | Relatório mensal para Pedro |
| Gestão de Fornecedores | PCP | Cadastro, histórico, prazos, avaliação |
| Lista de Insumos/MP | PCP | Vinculada a coleção, estoque e alertas de compra |
| Calendário Editorial | Gestão de Tarefas | Segmentado, separado do Gantt das dailies |
| Cohort Analytics | CRM (Phase 3+) | Análise por coorte de aquisição — requer 3+ meses de dados |
| Atribuição de Canal | CRM + Checkout | UTM + cupom + fonte de tráfego |
| LGPD / Consentimento (F1) | CRM + Checkout | Opt-in para WhatsApp, e-mail, tracking. Registro de consentimento |
| Log de Auditoria (F2) | Ambaril (global) | Middleware em todas as ações. Implementar desde o início |

---

## EXPANSÕES APROVADAS (funcionalidades novas — não substituem nada)

### E1. Waitlist + VIP Whitelist para Drops (A1)
**Vive dentro de:** Checkout + CRM
- Pré-registro no site: clientes se inscrevem para ser notificados de novos drops (captura e-mail/WhatsApp)
- **Nas primeiras 24h do lançamento:** site visível para todos, mas só clientes da whitelist VIP conseguem comprar (login com conta pré-aprovada). Após 24h, libera para público geral
- Dados de pré-registro alimentam PCP: "1.200 pessoas querem a jaqueta preta" → ajuda a calibrar produção
- Notificação de lançamento via WhatsApp Engine para quem se registrou

### E2. Cloud Estoque / Split Delivery (A2)
**Vive dentro de:** Checkout + ERP
- Vender produtos que ainda não estão em estoque físico (novos lançamentos ou reposições a caminho)
- Checkout deixa claro para o cliente: "Este produto será enviado em [prazo estimado]"
- Se pedido tem mix de produtos (estoque + cloud), o checkout separa entregas: "Remessa 1: chega quarta. Remessa 2: chega semana que vem"
- Benefício para incentivar compra cloud: frete grátis ou desconto no produto cloud
- Requer: ERP com status de estoque granular (disponível / em produção / em trânsito) + previsão de entrega do PCP

### E3. Alocação de Estoque por Canal (A3)
**Vive dentro de:** ERP
- **Status:** Aprovado com ressalva — precisa de estudo profundo. Capital de giro apertado = "segurar venda" é difícil
- Reservar estoque: X% DTC, Y% VIP (early access), Z% B2B, W% influencers
- Implementar APÓS B2B escalar e dados de drops serem suficientes para calibrar
- Não é prioridade imediata

### E4. Recomendação de Tamanho (B1)
**Vive dentro de:** Checkout (ou Shopify via app/embed)
- Cliente informa altura, peso, preferência de caimento (justo/regular/oversized) → sistema sugere tamanho
- **Requisito:** muito bom e leve para renderizar no navegador
- **Sugestão técnica:** tabela de medidas por SKU no banco de dados + lógica de matching client-side (JavaScript puro, sem API call — renderiza instantaneamente). Pode usar um modal/drawer leve no checkout. Dados de trocas por tamanho (do módulo de Trocas) alimentam e refinam o modelo ao longo do tempo. Frameworks como Fit Finder são referência mas pesados — melhor construir algo próprio e minimal
- Impacto: reduz trocas por tamanho = reduz custo logístico + melhora NPS

### E5. Página "Meu Pedido" (B2)
**Vive dentro de:** Frontend público (pode ser subdomínio ou página no Shopify)
- Página pública sem login: cliente digita número do pedido ou CPF
- Mostra: status de envio, rastreamento, status de troca se houver, NF-e para download
- Reduz tickets de suporte ("cadê meu pedido?")
- Dados vêm do ERP via API

### E6. Prova Social / UGC no Site (B3)
**Vive dentro de:** Frontend Shopify (embed)
- Exibir UGC de clientes usando produtos CIENA no site
- **Requisito de Marcus:** tem que ser muito cool, com muito "sauce". Não pode parecer marketplace fuleiro
- **Referências de streetwear que fazem isso bem:**
  - Marcas de streetwear usam TikTok para que todo mundo seja creator, publicando UGC que suas audiências confiam — o formato é feed social embedded, não grid de reviews
  - Corteiz e Live Fast Die Young usam o modelo de drops + UGC orgânico como motor principal de marketing
  - Supreme construiu a cultura de unboxing como evento compartilhável
  - O approach correto para CIENA: galeria curada (não automatizada) com estética editorial — Yuri/Sick selecionam os melhores UGCs, aplicam filtro/tratamento da marca, e esses aparecem como lookbook comunitário. NÃO é review de produto. É "a galera CIENA"
- Tecnicamente: Marketing Intelligence coleta UGC → equipe curadoria → DAM → embed no Shopify com design custom
- Shoppable: clicar na foto → ver o produto → ir pro checkout

### E7. Gerador de Descrição de Produto (D1)
**Vive dentro de:** ERP ou ferramenta interna
- Ao cadastrar produto: IA gera descrição SEO, copy para Instagram, copy para WhatsApp VIP, hashtags
- **Requisito de Marcus:** humanização fortíssima — NÃO pode parecer IA (nem IA "cool robotizada")
- Supervisão: Slimgust redige/edita, Caio aprova
- Técnica: Claude API com prompt template + contexto de marca (tom de voz CIENA, vocabulário streetwear BR, referências culturais)

### E8. Precificação Assistida por IA (D2)
**Vive dentro de:** ERP (conectado à Calculadora de Margem)
- Com base em custo de produção, margem desejada, preços de concorrentes (Competitor Watch), performance histórica
- **Output por nível:** "Margem justa", "Arriscado (margem apertada)", "Margem altíssima", "No limite", etc.
- Insights que variam conforme preço setado: "A R$ 229 sua margem é 78% (altíssima). A R$ 199, cai para 62% (justa) mas volume histórico sobe 40%"
- Importante para Tavares (custos), Pedro (financeiro) e Marcus (estratégia)
- Requer dados acumulados — implementar após 2–3 meses de ERP com dados reais

### E11. Reviews & Ratings (B4)
**Vive dentro de:** Checkout + CRM
- Reviews de produto com rating 1-5, fotos, texto
- Review request automatico via WA/email apos entrega (integra com automacao L2)
- Moderacao: auto-approve por threshold, flag para profanidade/URLs, alerta para ratings baixos
- Public API para exibir reviews na product page (Shopify embed)
- Verified purchase badge automatico
- Fotos de review como UGC → DAM
- **Phase:** v1.2

### E9. Automação de Fluxos / Workflow Engine (D3)
**Esclarecimento pedido por Marcus:** quais fluxos automatizaria?
- Exemplos concretos:
  - "SE pedido pago E cliente é VIP → enviar WhatsApp personalizado com nome + prazo de entrega"
  - "SE estoque de SKU X < 10 E tem produção em andamento no PCP → não alertar, apenas logar"
  - "SE creator atingiu 500 pontos → subir de tier automaticamente + enviar WhatsApp de parabéns"
  - "SE pedido não enviado há 48h → alertar Ana Clara no Discord + enviar e-mail de desculpas ao cliente"
  - "SE troca aprovada → gerar etiqueta reversa + enviar WhatsApp com instruções"
- Hoje essas automações seriam hardcoded. Um workflow engine permite que Caio crie novas automações sem dev
- **Prioridade:** baixa-média — muito poderoso mas complexo de construir. Pode entrar na v2 do Ambaril

---

## NOVOS MÓDULOS (Análise Estratégica v2 — Sessão 21)

### N1. CRO Engine — Motor de Otimização de Conversão
**Vive dentro de:** Checkout + Dashboard
- Heatmap & Session Recording via Microsoft Clarity (gratuito, LGPD-compliant com consent)
- A/B Testing automatizado com sugestões AI (complementa A/B do Checkout)
- Conversion Funnel Analysis (evolução do funel do Checkout com comparativos por período)
- Page Speed Monitor (Core Web Vitals — TTFB sub-100ms meta)
- Price Elasticity Calculator (simulação "se mudo preço de X para Y, volume muda Z%")
- Social Proof Engine (notificações reais de compras recentes — usa dados do pipeline)
- **Phase:** 3+ (após Dashboard e Checkout estarem live)

### N2. SEO & AEO — Visibilidade em Buscadores + AI Browsers
**Vive dentro de:** ERP + Shopify
- Product Data Enrichment Score ("seus dados estão 67% prontos para AI shoppers")
- Schema.org / Structured Data Generator (JSON-LD automático para todos produtos)
- AI-Readiness Score (produtos prontos para agentic commerce)
- Content Suggestions (keywords + gaps identificados vs. concorrentes)
- Technical SEO Audit (meta tags, canonical, sitemap, robots.txt)
- AEO Optimization (FAQs estruturadas, atributos granulares para AI browsers)
- **Phase:** 3+ (após ERP com catálogo rico)

### N3. Onsite Tools — Widgets Controlados pelo Painel Ambaril
**Vive dentro de:** CRM (evolução do On-Site Widget Engine Phase 2) + Shopify Theme App Extension
- O1: Smart Popup Builder (targeting por segmento CRM, comportamento, device)
- O2: Social Proof Notifications (dados reais do pipeline — "Maria acabou de comprar X")
- O3: Product Recommendation Widget (collaborative filtering com dados de compra)
- O4: Size Quiz (zero-party data → CRM → recomendação de tamanho)
- O5: Drop Countdown (timer + opt-in WA/email para notificação)
- O6: Creator Showcase (UGC shoppable — galeria curada de posts de creators)
- O7: Back-in-Stock Alert (→ CRM automação R5 Back in Stock)
- O8: Sticky Cart (carrinho persistente em todas as páginas)
- O9: Live Shopping Widget (futuro — streaming + compra em tempo real)
- **Phase:** CRM Phase 2 (On-Site Widget Engine é a base, Onsite Tools são os widgets)

### N4. Astro — O Cérebro do Ambaril (AI Brain)
**Status:** Aprovado. Implementação incremental acompanhando cada módulo.

**Conceito:** AI assistant com contexto completo da operação, memória cumulativa, e capacidade de executar ações. Chat em linguagem natural acessível a todos os usuários do tenant.

**Interfaces:**

| Interface | Quem usa | O que faz |
|-----------|----------|-----------|
| Chat no Dashboard | Marcus, Caio, todos | "Quantas vendas esta semana?" "Qual creator performou melhor?" |
| Discord (ClawdBot) | Time inteiro | Reports automáticos + queries naturais + ações |
| WhatsApp (alertas) | Marcus, Caio | Alertas críticos em tempo real |
| Email (briefs) | Marcus | Weekly Executive Brief automático |
| Portal Creator | Creators | AI Content Coach + sugestões de posts |
| Inbox | Slimgust | AI Draft de resposta + self-service bot |

**Memória cumulativa (3 camadas):**
1. **Event Log** (append-only) — tudo que observou/concluiu. Tabela: `brain.events`
2. **Knowledge Graph** (incremental) — relações entre entidades. Tabela: `brain.knowledge_edges`
3. **Semantic Memory** (pgvector) — embeddings de insights/decisões. Busca por similaridade. PostgreSQL + pgvector (Neon)

**Modelo de custo AI:**

| Modelo | Custo/1M tokens (input) | Uso no Astro |
|--------|-------------------------|-------------|
| Gemini 2.0 Flash | ~$0.10 | Classificação, parsing, tarefas simples (80% volume) |
| Claude Haiku 4.5 | $0.80 | Reports estruturados, anomaly detection |
| Claude Sonnet 4.6 | $3.00 | Chat, análise profunda, insights cross-module |

Estimativa: **$30-80/mês por tenant** (80% tasks baratas + 20% análise profunda).

**Fases incrementais:**

| Fase | Capability | Quando | Custo AI/tenant |
|------|-----------|--------|----------------|
| Astro v0.1 | Anomaly detection (thresholds) + alertas automáticos | Com cada módulo | ~$5/mês |
| Astro v0.2 | Correlações entre 2 módulos + Weekly Brief | Após 3+ módulos live | ~$15/mês |
| Astro v0.3 | Chat natural + memória semântica | Após Dashboard | ~$40/mês |
| Astro v0.4 | Predictive (churn, demand, next-purchase) | 6+ meses de dados | ~$60/mês |
| Astro v0.5 | Autonomous actions (com aprovação) | 12+ meses | ~$80/mês |

**Exemplos cross-module:**

| Insight | Módulos envolvidos | Ação |
|---------|-------------------|------|
| "Creator João vendeu 3x mais, mas 60% trocaram por tamanho errado" | Creators + Trocas + CRM | Briefing para João: comunicar sizing correto |
| "Clientes que recompram em 30 dias pós-drop têm LTV 4.7x maior" | CRM + Checkout + ERP | Automação "look complementar" 15 dias após drop |
| "SKU top-seller com 5 dias de estoque, OP entrega em 15" | ERP + PCP + Dashboard | ALERTA CRÍTICO: revenue leak R$12.4k projetado |

---

### Integrações Faltantes (adições da Análise v2)

| Integração | Status Anterior | Ação | Phase |
|------------|----------------|------|-------|
| Meta CAPI (Conversions API) | NÃO EXISTIA | **ADICIONADO** ao Checkout + CRM | 1A |
| GA4 Measurement Protocol | NÃO EXISTIA (Shopify Analytics como proxy) | **ADICIONADO** como integração direta | 1B |
| GA4 Enhanced Conversions | NÃO EXISTIA | **ADICIONADO** | 1B |
| Server-Side GTM | NÃO EXISTIA | **ADICIONADO** ($100-200/mês) | 2 |
| TikTok Events API | Planejado | **CONFIRMADO** para v1.1 | v1.1 |

---

## TIMELINE CONSOLIDADA (v3 — Roadmap Sessao 17)

> **Estrategia v3:** Construir ferramentas NOVAS primeiro (geram receita), substituir existentes depois (ja funcionam).
> Prioridade: receita nova > produtividade > substituicao de ferramentas existentes.

### Fase 0: Foundation (EM PROGRESSO — quase completa)

| Item | Descrição | Bloqueante para |
|------|-----------|----------------|
| Monorepo scaffold | Next.js 15 + Turborepo (`apps/web`, `apps/discord-bot`, `packages/*`) | Tudo |
| DB setup | Neon PostgreSQL + todos os 15 schemas + migration system (Drizzle) | Tudo |
| Auth system | Custom auth (PostgreSQL sessions + ambaril_session cookie), RBAC middleware, 9 roles | Tudo |
| Flare (básico) | Notification router + in-app queue | CRM, ERP, PCP |
| PostgreSQL queues + Vercel Cron | Background jobs (ADR-012 — Redis eliminado) | CRM, PCP, ClawdBot |
| Audit log middleware | Middleware global de audit trail (compliance desde dia 1) | ERP, PCP, Admin |
| Deploy pipeline | Vercel + staging branch + CI (lint, typecheck, tests) | Tudo |
| Global search | tsvector indexes, search endpoint | Tudo |
| ADR-014 | Multi-tenancy: Shared DB + tenant_id + RLS (B+A) — **APROVADO** | Tudo |

> **Status:** Scaffolding completo, compilando. Neon DB criado (sa-east-1). GitHub repo criado. ADR-014 APROVADO.

> **Regra UX de entrega (DS.md seções 4, 7, 11):** Cada módulo entregue deve incluir: empty states, checklist de ativação por role, e welcome contextual. Módulos não ativados pelo tenant devem ser visíveis mas dimmed com preview + CTA.

> **Regra de integração (Sessão 25):** Módulos consomem **capabilities**, não providers específicos. Tenant escolhe providers no catálogo de integrações. Código do módulo chama `ecommerce.listCoupons()`, nunca `shopify.listDiscountCodes()`. Ver IMPLEMENTATION.md §0.0.

> **Regra de entrega por camadas (Sessão 25):** Cada módulo é entregue em layers priorizados:
> - **Layer 0:** Onboarding do módulo (check integrations → import dados existentes → configurar → ativar)
> - **Layer 1:** Fluxo core (3-5 páginas admin + 3-5 páginas user, com dados reais)
> - **Layer 2:** Engajamento (features que dependem de dados acumulados — progressive disclosure)
> - **Layer 3:** Avançado (compliance, anti-fraud, analytics, automações)
> Ver IMPLEMENTATION.md "Module Delivery Framework".

### Fase 0.5: Tenant Onboarding & Integration Catalog

| Item | Descrição | Bloqueante para |
|------|-----------|----------------|
| **Módulo Onboarding** | Wizard de setup do tenant: criar conta → conectar integrações → configurar módulos | Todos os módulos |
| **Integration Catalog** | Catálogo de providers por capability (ecommerce, checkout, payments, social, fiscal, shipping, messaging). Tenant escolhe quais conectar. UI estilo app store em `/admin/settings/integrations` | Creators, CRM, ERP, todos |
| **Provider Layer** | Interface de abstração: cada capability tem TypeScript interface. Providers implementam interface. Módulos consomem capabilities, nunca providers diretamente | Todos os módulos |
| **Tabelas `global.integration_providers` + `global.tenant_integrations`** | Seed data com providers disponíveis + credenciais criptografadas por tenant | Todos os módulos |
| **CIENA setup** | Conectar Shopify (ecommerce) + Yever (checkout) + Instagram (social) + Resend (messaging) como primeiro tenant | Fase 1 (Creators) |

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

### Fase 1: Creators (PRIORIDADE #1 — ferramenta NOVA, gera receita)

| Módulo | Escopo | Impacto |
|--------|--------|---------|
| **Creators** | Tiers + Commissions + Portal self-service + Gamification (CIENA Points) + Challenges + Anti-fraude + Cupom-only attribution | Canal de crescimento — "vai nos ajudar a faturar mais" (Marcus) |
| **WhatsApp Engine (mínimo)** | Meta Cloud API direta, templates para notificações de creators (challenge, venda, tier) | Canal de entrega para Creators |
| **Dashboard** | Painel creators (primeiro painel do Beacon) | Visibilidade imediata de GMV, top performers |

> **Bridge:** CIENA Creators começa na Moneri nos primeiros 60-90 dias, migra para Ambaril quando este módulo estiver pronto.

### Fase 2: PCP (PRIORIDADE #2 — ferramenta NOVA, desbloqueia bottleneck)

| Módulo | Escopo | Impacto |
|--------|--------|---------|
| **ERP Prep** | Schema + Products + SKUs + Inventory CRUD (Ana Clara precisa) | Base de dados para PCP |
| **PCP** | Production orders + Suppliers + Costs + Raw materials + Rework + Alertas escalonados | Desbloqueia bottleneck #1 (Tavares) |
| **Integração PCP↔ERP** | Cost sync, stock entry automático, inventory movements | Dados de custo fluem para margem |
| **Dashboard** | Painéis estoque + produção | Mais painéis no Beacon |

> **Caminho crítico:** ERP Prep → PCP lê `erp.skus` + `erp.inventory`.

### Fase 3: Ferramentas Novas Restantes (Dashboard, Marketing Intel, Tarefas, DAM)

| Módulo | Escopo | Impacto |
|--------|--------|---------|
| **Dashboard Completo** | War Room + painéis vendas, retenção, financeiro, marketing, PCP, trocas, checkout, creators, comercial | Beacon completo (9 painéis) |
| **Marketing Intelligence** | UGC Monitor + Creator Scout + Competitor Watch + Ads Reporting | Inteligência de marketing |
| **Tarefas** | Gantt + Kanban + Integração PCP + Calendário Editorial | Produtividade interna |
| **DAM** | Biblioteca de assets + R2 + Versionamento + Tags | Substitui Google Drive |
| **ClawdBot** | Discord bot (9 canais) + Reports (Haiku) + Chat (Sonnet) | Interface Discord do Ambaril |

### Fase 4: Substituições (CRM, Checkout, ERP, Trocas, Inbox)

Ferramentas que já existem e funcionam (Kevi, Yever, Bling, TroqueCommerce) — substituir depois que as ferramentas novas estiverem gerando valor.

| Módulo | Escopo | Substitui | Economia |
|--------|--------|-----------|----------|
| **CRM** | Contacts + RFM + Segmentos + Automações + Campaigns (WA+email) + UTM + LGPD + Cohort Analytics + On-Site Widgets | Kevi | R$ 1.200/mês |
| **Checkout** | Cart + Orders + Mercado Pago + ViaCEP + VIP Whitelist + Order bump + Upsell + A/B testing | Yever | R$ 3.060/mês |
| **ERP Completo** | Order pipeline + NF-e (Focus NFe) + Margem por SKU + DRE + Melhor Envio + Conciliação | Bling | R$ 100/mês + eficiência |
| **Trocas** | Exchanges + Reverse logistics + NF-e return + Store credits | TroqueCommerce | Economia direta |
| **Inbox** | Inbox unificado WhatsApp + Email para Slimgust | — | Atendimento centralizado |
| **B2B** | Portal atacado + Catálogo + Price tables + Checkout B2B | — | Habilitação de receita B2B |
| **WhatsApp Engine (completo)** | Templates, broadcast, conversations, rate limiting | — | Canal de entrega para CRM |

### Fase 5: Expansões + Hardening

| Item | Descrição |
|------|-----------|
| **E1–E11** | Waitlist, Cloud Estoque, Alocação Estoque, Recomendação Tamanho, Meu Pedido, Prova Social, Gerador IA, Precificação IA, Workflow Engine, WhatsApp Group Manager, Reviews & Ratings |
| **Hardening** | Testes E2E (Playwright), performance, segurança, LGPD compliance audit |
| **Documentação** | API docs finais, runbooks, onboarding guide |
| **CRM avançado** | Cohort analytics (requer 3+ meses dados), LGPD full erasure com SHA-256, RFM history purge |
| **ML backlog** | Lead scoring preditivo + predição de recompra (requer 6+ meses dados + modelo ML) |

### Resumo de dependências (v3)

```
Fase 0 (Foundation) ─────────────────────────────────────────┐
  │                                                           │
  ├─► Fase 0.5 (Tenant Onboarding + Integration Catalog) ────┤
  │     └─► Provider Layer + Catalog UI + CIENA setup         │
  │                                                           │
  ├─► Fase 1 (Creators — prioridade #1) ─────────────────────┤
  │     └─► Astro v0.1 (anomaly detection)                   │
  │                                                           │
  ├─► Fase 2 (PCP — prioridade #2) ──────────────────────────┤
  │     └─► Astro v0.1 (alertas PCP)                         │
  │                                                           │
  ├─► Fase 3 (Dashboard, Marketing Intel, Tarefas, DAM) ─────┤
  │     └─► Astro v0.2 (correlações) + v0.3 (chat)           │
  │                                                           │
  ├─► Fase 4 (Substituições: CRM, Checkout, ERP, Trocas) ────┤
  │     └─► CRO Engine + SEO/AEO + Onsite Tools              │
  │                                                           │
  ├─► Fase 5 (Expansões + Hardening) ────────────────────────┤
  │     └─► Astro v0.4 (predictive)                          │
  │                                                           │
  └─► Fase 6 (Astro v0.5 — autonomous actions)
```

### Diferenças-chave: roadmap v2 vs. v3

| Aspecto | v2 | v3 (atual) | Motivo |
|---------|-----|------------|--------|
| Prioridade #1 | ERP + CRM (substituições) | **Creators** (ferramenta nova) | Gera receita nova imediata |
| Prioridade #2 | PCP (dentro de Fase 1B) | **PCP** (fase própria) | Desbloqueia bottleneck operacional |
| Substituições | Misturadas nas fases 1-3 | **Agrupadas na Fase 4** | Ferramentas existentes já funcionam |
| Estratégia | Substituir ferramentas pagas + construir novas em paralelo | **Novas primeiro, substituições depois** | Receita nova > economia |

---

## MÓDULOS DESCARTADOS / NÃO APLICÁVEIS

| Item | Motivo |
|------|--------|
| Programa de fidelidade / pontos consumidor | Não faz sentido pro modelo de drops da CIENA |
| Gift cards / vale-presente | Não é relevante pro negócio |
| Multi-moeda / internacional | 100% Brasil |
| App mobile próprio | Não faz sentido pro tamanho atual |
| ~~Reviews/avaliações de produto~~ | ~~Modelo de drops com estoque limitado já cria urgência~~ → **Revertido: adicionado como E11 Reviews & Ratings (v1.2)** após análise Edrone |
| ~~Notificação de restock~~ | ~~Escassez é intencional~~ → **Revertido parcialmente: Back in Stock (R5) como automação CRM Phase 2** para waitlist + visualizadores |

---

## PROXIMO PASSO

Stack aprovada (ADRs 008-014). Fase 0 em progresso.

**Concluido:**
- [x] ADRs 008-013 APROVADOS (sessao 12)
- [x] ADR-014 APROVADO (sessao 17) — B+A: Shared DB + tenant_id + RLS. Project-per-tenant (Neon) planejado para 3+ tenants
- [x] Neon DB criado (sa-east-1, PostgreSQL 17)
- [x] GitHub repo criado (ambaril-app/ambaril)
- [x] Monorepo scaffold compilando
- [x] Auth system implementado (login, sessions, middleware, RBAC)
- [x] Drizzle schemas definidos (79 tabelas, 7 schemas)
- [x] Auditoria completa + correcoes pre-commit (sessao 17)

**Proximos passos (Phase 1 — Creators):**
1. Push first commit to GitHub
2. Phase 1 Wave 1: UI Components + Forms + Zod schemas
3. Phase 1 Wave 2: Server Actions + Service Clients
4. Phase 1 Wave 3: Admin pages + Creator Portal
5. Phase 1 Wave 4: Cron jobs + Instagram polling + E2E test
6. Phase 1 Wave 5: Cross-review + DS compliance

*Este documento e definitivo em escopo macro. Detalhes tecnicos estao nos .md individuais de cada modulo.*
