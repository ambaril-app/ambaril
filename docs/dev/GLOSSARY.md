# Ambaril — Glossário de Domínio

> **Versão:** 1.0
> **Atualizado:** Março 2026
> **Propósito:** Mapeamento definitivo de termos PT-BR para código EN. Todo código usa as traduções definidas aqui. Nenhum dev traduz por conta própria.

---

## 1. Brand Vocabulary (nomes de marca)

Apenas 4 features têm nome de marca. O resto usa nome descritivo.

| Nome | Tipo | Em código | Descrição |
|------|------|-----------|-----------|
| **Beacon** | Dashboard | `beacon` / `dashboard` | Painel executivo + Drop War Room |
| **Pulse** | Discord Bot | `pulse` / `clawdbot` | Bot do Discord — reports e alertas |
| **Flare** | Alertas | `flare` / `notifications` | Sistema de notificações cross-module |
| **Forge** | PCP + ERP | `forge` | Motor operacional (nome conceitual, não usado em código diretamente) |

---

## 2. Mapeamento PT-BR → Código EN

### 2.1 Entidades Principais

| PT-BR | EN (código) | Tabela | Notas |
|-------|-------------|--------|-------|
| Pedido | `order` | `erp.orders` | Pedido de venda (DTC ou B2B) |
| Item do pedido | `order_item` | `erp.order_items` | Linha individual do pedido |
| Produto | `product` | `erp.products` | Entidade pai (ex: "Camiseta Preta Basic") |
| SKU / Variante | `sku` | `erp.skus` | Produto + tamanho + cor (ex: SKU-0412-P-PRETA) |
| Cliente | `contact` | `crm.contacts` | "Contact" no CRM (unificado: lead + cliente) |
| Fornecedor | `supplier` | `pcp.suppliers` | Fábricas, tecelagens, aviamenteiros |
| Criador / Influenciador | `creator` | `creators.creators` | Nano-influenciador do programa Creators |
| Lojista | `retailer` | `b2b.retailers` | Cliente B2B / atacado |
| Coleção | `collection` | `pcp.collections` | Agrupamento de produtos por temporada/drop |
| Drop | `drop` | `pcp.drops` | Lançamento específico dentro de uma coleção |

### 2.2 Operações e Processos

| PT-BR | EN (código) | Contexto |
|-------|-------------|----------|
| Troca | `exchange` | Troca por tamanho/cor |
| Devolução | `return` | Devolução com reembolso |
| Crédito (loja) | `store_credit` | Crédito para uso futuro |
| Reembolso | `refund` | Devolução de dinheiro |
| Nota Fiscal Eletrônica | `nfe` / `nfe_document` | Documento fiscal brasileiro |
| NF-e de devolução | `nfe_return` | NF-e inversa para trocas/devoluções |
| Emissão de NF-e | `nfe_emission` | Processo de gerar e transmitir NF-e |
| Conciliação financeira | `financial_reconciliation` | Conferência MP vs. sistema |
| Etiqueta de envio | `shipping_label` | Label gerada pelo Melhor Envio |
| Rastreamento | `tracking` | Código de rastreio dos Correios/transportadora |
| Carrinho abandonado | `abandoned_cart` | Cart não finalizado |
| Recuperação de carrinho | `cart_recovery` | Automação para recuperar carrinhos abandonados |

### 2.3 Produção (PCP)

| PT-BR | EN (código) | Contexto |
|-------|-------------|----------|
| Ordem de produção | `production_order` | OP — o pedido de fabricação |
| Etapa de produção | `production_stage` | Fase individual da OP |
| Conceito | `concept_stage` | Etapa: ideia/design inicial |
| Modelagem | `pattern_stage` | Etapa: criação do molde |
| Piloto | `sample_stage` | Etapa: peça piloto para aprovação |
| Aprovação | `approval_stage` | Etapa: ok do Marcus/Tavares |
| Grade | `size_grading` | Etapa: definição de grade de tamanhos |
| Compra de insumos | `material_purchase` | Etapa: aquisição de MP |
| Corte | `cutting_stage` | Etapa: corte do tecido |
| Costura | `sewing_stage` | Etapa: montagem da peça |
| Acabamento | `finishing_stage` | Etapa: arremate, limpeza |
| Controle de qualidade | `qc_stage` | Etapa: inspeção final |
| Entrada no estoque | `stock_entry` | Etapa: produto acabado → ERP |
| Retoque / Correção | `rework` | Ajuste pós-piloto ou pós-produção |
| Insumo | `raw_material` | Matéria-prima (tecido, aviamento, etiqueta) |
| Matéria-prima | `raw_material` | Sinônimo de insumo |
| Tecido | `fabric` | Tipo de insumo |
| Aviamento | `trim` | Zíper, botão, ilhós, elástico |
| Malha 30/1 | `fabric_30_1` | Tipo específico de tecido |
| Tecelagem | `weaving_mill` | Tipo de fornecedor |
| Estamparia | `print_shop` | Tipo de fornecedor |
| Tinturaria | `dyeing_mill` | Tipo de fornecedor |
| Pré-custo | `pre_cost` | Estimativa de custo antes da produção |

### 2.4 Financeiro

| PT-BR | EN (código) | Contexto |
|-------|-------------|----------|
| Faturamento | `revenue` | Receita bruta de vendas |
| Receita bruta | `gross_revenue` | Total de vendas sem descontos |
| Receita líquida | `net_revenue` | Após descontos e devoluções |
| Custo de mercadoria vendida (CMV) | `cogs` | Cost of Goods Sold |
| Margem bruta | `gross_margin` | Receita líquida - CMV |
| Margem líquida | `net_margin` | Após todas as despesas |
| DRE | `income_statement` | Demonstrativo de Resultado do Exercício |
| Ticket médio | `average_order_value` / `aov` | Valor médio por pedido |
| Parcelamento | `installments` | Divisão de pagamento em parcelas |
| Desconto PIX | `pix_discount` | Desconto por pagamento via PIX |
| Boleto | `bank_slip` | Forma de pagamento BR |
| Chargeback | `chargeback` | Contestação de pagamento (mesmo em EN) |
| ICMS | `icms` | Imposto sobre circulação |
| PIS | `pis` | Contribuição social |
| COFINS | `cofins` | Contribuição social |
| Regime tributário | `tax_regime` | Simples/Lucro Presumido/Real |

### 2.5 Marketing e CRM

| PT-BR | EN (código) | Contexto |
|-------|-------------|----------|
| Segmentação RFM | `rfm_scoring` | Recency, Frequency, Monetary |
| Coorte | `cohort` | Grupo de clientes por período de aquisição |
| Recompra | `repurchase` | Cliente comprando de novo |
| Churn | `churn` | Perda de clientes (mesmo em EN) |
| LTV | `ltv` | Lifetime Value (mesmo em EN) |
| CAC | `cac` | Custo de Aquisição de Cliente |
| ROAS | `roas` | Return on Ad Spend |
| CPA | `cpa` | Cost per Acquisition |
| UTM | `utm` | Parâmetros de rastreamento de link |
| UGC | `ugc` | User Generated Content |
| Cupom | `coupon` | Código de desconto |
| Disparo | `broadcast` / `campaign_send` | Envio de mensagem em massa |
| Automação | `automation` | Fluxo automático trigger→action |
| Boas-vindas | `welcome` | Automação pós-primeiro-cadastro |
| Pós-compra | `post_purchase` | Automação após pagamento |
| Inatividade | `inactivity` / `win_back` | Automação para clientes inativos |
| Aniversário | `birthday` | Automação de aniversário |

### 2.6 Programa Creators

| PT-BR | EN (código) | Contexto |
|-------|-------------|----------|
| Tier / Nível | `tier` | SEED, GROW, BLOOM, CORE |
| Comissão | `commission` | % sobre venda líquida |
| Pontos CIENA | `points` | Sistema de gamificação |
| Challenge / Desafio | `challenge` | Desafio mensal para creators |
| Payout / Pagamento | `payout` | Transferência de comissão para creator |
| Indicação | `referral` | Creator indicando outro creator |
| Kit digital | `digital_kit` | Benefício do tier SEED |
| Acesso antecipado | `early_access` | Benefício do tier GROW |
| CIENA Box | `ciena_box` | Benefício do tier BLOOM |
| Co-criação | `co_creation` | Benefício do tier CORE |

### 2.7 Interface e UX

| PT-BR | EN (código) | Contexto |
|-------|-------------|----------|
| Barra lateral | `sidebar` | Navegação principal |
| Busca rápida | `global_search` / `command_palette` | Barra de busca "/" |
| Painel | `panel` / `dashboard_panel` | Seção do dashboard |
| Cartão métrico | `metric_card` | Card com KPI no Beacon |
| Sino de notificação | `notification_bell` | Ícone no header |
| Migalha de pão | `breadcrumb` | Navegação hierárquica |
| Gaveta | `drawer` / `sheet` | Painel lateral deslizante |
| Toast | `toast` | Feedback de ação (sucesso/erro) |

---

## 3. Siglas

| Sigla | Significado | Contexto |
|-------|-------------|----------|
| LGPD | Lei Geral de Proteção de Dados | Privacidade BR |
| NF-e | Nota Fiscal Eletrônica | Documento fiscal |
| ICMS | Imposto sobre Circulação de Mercadorias e Serviços | Imposto estadual |
| PIS | Programa de Integração Social | Contribuição federal |
| COFINS | Contribuição para Financiamento da Seguridade Social | Contribuição federal |
| CPF | Cadastro de Pessoa Física | Identificação pessoal BR |
| CNPJ | Cadastro Nacional de Pessoa Jurídica | Identificação empresarial BR |
| CEP | Código de Endereçamento Postal | Código postal BR |
| PIX | — (nome próprio) | Sistema de pagamento instantâneo BR |
| RFM | Recency, Frequency, Monetary | Modelo de segmentação |
| LTV | Lifetime Value | Valor do ciclo de vida do cliente |
| CAC | Customer Acquisition Cost | Custo de aquisição |
| ROAS | Return on Ad Spend | Retorno sobre investimento em ads |
| CPA | Cost per Acquisition | Custo por aquisição |
| DRE | Demonstrativo de Resultado do Exercício | Relatório financeiro |
| CMV | Custo de Mercadoria Vendida | COGS em português |
| SKU | Stock Keeping Unit | Identificador de variante |
| UGC | User Generated Content | Conteúdo gerado por usuário |
| UTM | Urchin Tracking Module | Parâmetros de link tracking |
| BSP | Business Solution Provider | Intermediário WhatsApp (não usado) |
| FSM | Finite State Machine | Máquina de estados |
| PLM | Product Lifecycle Management | Gestão do ciclo de vida do produto |
| PCP | Planejamento e Controle de Produção | Módulo de produção |
| ERP | Enterprise Resource Planning | Módulo operacional/fiscal |
| CRM | Customer Relationship Management | Módulo de retenção |
| DAM | Digital Asset Management | Repositório de assets |
| DTC | Direct to Consumer | Venda direta ao consumidor |
| B2B | Business to Business | Venda atacado |
| QC | Quality Control | Controle de qualidade |
| MP | Matéria-prima OU Mercado Pago | Contexto define |
| OP | Ordem de Produção | Pedido de fabricação |
| KV | Key Visual | Imagem principal de campanha |

---

## 4. Time CIENA — Referência Rápida

| Nome | Role (código) | Área | Dispositivo principal |
|------|--------------|------|----------------------|
| Marcus | `admin` | Fundador, decisão final sobre tudo | Desktop |
| Caio | `pm` | PM, marketing, estratégia | Desktop |
| Tavares | `operations` | Produção, PCP, fornecedores | Desktop |
| Ana Clara | `operations` | Logística, envios, estoque | **Mobile only** |
| Slimgust | `support` | Atendimento ao cliente | Desktop |
| Sick | `creative` | Design, identidade visual | Desktop |
| Yuri | `creative` | Conteúdo, social media | Desktop + Mobile |
| Pedro | `finance` | Financeiro, contabilidade | Desktop |
| Guilherme | `commercial` | Comercial, B2B/atacado | Desktop |

---

## 5. Regras de Tradução

1. **Código sempre em inglês.** Variáveis, funções, componentes, tabelas, colunas, rotas — tudo EN.
2. **Interface sempre em PT-BR.** Labels, buttons, mensagens, tooltips — tudo PT-BR.
3. **Comentários em inglês.** Para consistência com o código.
4. **Enums em inglês.** Status: `pending`, `paid`, `shipped`, `delivered` — não `pendente`, `pago`, `enviado`.
5. **Nomes de arquivo em inglês.** `order-list.tsx`, não `lista-pedidos.tsx`.
6. **Dúvida?** Consulte esta tabela. Se o termo não existe aqui, abra uma PR para adicionar.

---

*Este glossário é um documento vivo. Atualizar sempre que um novo termo surgir durante o desenvolvimento.*
