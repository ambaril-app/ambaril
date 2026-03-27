# TODO: Preparação Pré-Implementação — Ambaril

> **Operador:** Marcus (Curupira)
> **Objetivo:** Coletar todo o contexto necessário antes de iniciar a construção de cada módulo
> **Regra:** Nenhum módulo deve ser implementado sem antes completar seu checklist abaixo

---

## PREPARAÇÃO GLOBAL (fazer uma vez, antes de tudo)

- [x] **Criar pasta de screenshots:** `_legacy/bling/screenshots/`, `_legacy/yever/screenshots/`, `_legacy/kevi/screenshots/`, `_legacy/troquecommerce/screenshots/` (+ Monday/Trello se necessario)
- [ ] **Exportar base de dados do Bling:** CSV de pedidos, produtos, estoque, clientes (anonimizar CPFs se necessário)
- [ ] **Exportar base de dados do Kevi:** CSV de contatos, segmentos, histórico de campanhas
- [ ] **Listar todas as integrações ativas:** quais APIs/webhooks conectam Bling, Yever, Kevi, Shopify, Mercado Pago, Focus NFe, Melhor Envio, Loggi entre si
- [ ] **Documentar credenciais/APIs necessárias:** listar (sem expor secrets) quais APIs vocês já têm acesso (Mercado Pago, Focus NFe, Melhor Envio, Loggi, Meta Cloud API, Instagram Graph API, Discord Bot Token, Shopify Admin API, etc.)
- [ ] **Deploy teste do Chatwoot:** subir Docker local, testar integração básica com WhatsApp e email, validar se atende a Slimgust
- [ ] **Deploy teste do Plane:** subir Docker local, testar se Gantt view atende o Caio e se Kanban funciona para o time
- [ ] **Decidir ADRs pendentes** (documentados em STACK.md):
  - [ ] ADR-008: Next.js 15 vs SvelteKit (recomendado: Next.js 15)
  - [ ] ADR-009: Drizzle vs Prisma (recomendado: Drizzle)
  - [ ] ADR-010: Neon vs Supabase vs Railway (recomendado: Neon)
  - [ ] ADR-011: Zustand vs Jotai (recomendado: Zustand)
  - [ ] ADR-012: BullMQ vs Trigger.dev (recomendado: BullMQ)
  - [ ] ADR-013: SSE vs WebSocket (recomendado: SSE)

---

## POR MÓDULO: Checklist de Contexto

### Módulo 1: CRM / Retenção (substitui Kevi) — Fase 1

**Screenshots do Kevi:**
- [ ] Tela principal de contatos/lista de clientes
- [ ] Tela de detalhes de um contato (campos, histórico)
- [ ] Tela de segmentos/listas
- [ ] Tela de criação de automação (se tiver)
- [ ] Tela de disparo de campanha (WhatsApp e/ou email)
- [ ] Tela de relatórios/métricas
- [ ] Configurações gerais do Kevi

**Dados:**
- [ ] Export CSV de contatos com todos os campos
- [ ] Lista de segmentos que vocês usam hoje
- [ ] Lista de automações ativas (descrever: trigger → ação)
- [ ] Volume: quantos contatos, quantas campanhas/mês

**Brief "funciona vs não funciona":**
- [ ] 3-5 bullets: o que funciona bem no Kevi
- [ ] 3-5 bullets: o que é ruim/falta no Kevi
- [ ] O que o Caio mais sente falta (ele é o principal usuário?)

---

### Módulo 2: Mini-ERP + Fiscal (substitui Bling) — Fase 2

**Screenshots do Bling:**
- [ ] Dashboard/tela inicial
- [ ] Lista de pedidos (com status pipeline)
- [ ] Detalhes de um pedido
- [ ] Tela de estoque/produtos
- [ ] Detalhes de um produto/SKU
- [ ] Tela de emissão de NF-e
- [ ] Integração com Melhor Envio (como aparece no Bling)
- [ ] Integração com Loggi (como aparece no Bling)
- [ ] Tela de etiquetas de envio
- [ ] Tela financeira/conciliação (se tiver)
- [ ] Configurações fiscais (regime tributário, CFOP, etc.)

**Dados:**
- [ ] Export CSV de produtos/SKUs com campos (nome, variantes, preço, custo, estoque)
- [ ] Export CSV de pedidos recentes (30 dias)
- [ ] Estrutura de categorias/coleções no Bling
- [ ] Volume: pedidos/mês, SKUs ativos, NF-es emitidas/mês

**Integrações:**
- [ ] Como o Bling se conecta com Shopify hoje (webhook? API? app?)
- [ ] Como o Bling se conecta com Mercado Pago
- [ ] Como funciona o fluxo Bling → Focus NFe → SEFAZ
- [ ] Como funciona o fluxo Bling → Melhor Envio (etiqueta)
- [ ] Como funciona o fluxo Bling → Loggi

**Brief:**
- [ ] O que a Ana Clara mais usa no Bling (ela é mobile-only)
- [ ] O que funciona bem
- [ ] O que é ruim/travado/confuso
- [ ] Quais campos fiscais vocês preenchem manualmente vs automático

---

### Módulo 3: PCP — Produção + Fornecedores — Fase 3

**Estado atual (não tem ferramenta, é manual):**
- [ ] Como o Tavares gerencia produção hoje? (WhatsApp? Planilha? Cabeça?)
- [ ] Print das planilhas/docs que ele usa (se tiver)
- [ ] Lista de fornecedores atuais (fábricas, tecelagens, aviamentos, estamparias)
- [ ] Exemplo de uma ordem de produção completa (do conceito até entrega)
- [ ] Quais são os atrasos mais comuns? Onde o fluxo trava?
- [ ] Quantas produções simultâneas vocês gerenciam?
- [ ] Print do Coleção.Moda (se vocês têm acesso — é a referência de UX)

**Brief:**
- [ ] Tavares: 3-5 maiores dores no PCP hoje
- [ ] Quais etapas de produção são mais problemáticas
- [ ] Quais fornecedores atrasam mais

---

### Módulo 4: Checkout Custom (substitui Yever) — Fase 4

**Screenshots da Yever:**
- [ ] Checkout completo: cada step (carrinho → identificação → frete → pagamento → confirmação)
- [ ] Tela de configuração do checkout (se acessível)
- [ ] Tela de pedidos/relatórios na Yever
- [ ] Tela de recuperação de carrinho (se tiver)
- [ ] Como aparece o PIX/boleto/cartão
- [ ] Order bump (se tiver configurado)

**Código (se acessível):**
- [ ] DevTools → código-fonte da página de checkout (Ctrl+U)
- [ ] Formulários: quais campos, validações client-side
- [ ] Fluxo de redirect pós-pagamento

**Dados:**
- [ ] Taxa de conversão atual do checkout (se vocês medem)
- [ ] Taxa de abandono de carrinho
- [ ] Split de pagamento: % PIX vs cartão vs boleto
- [ ] Volume: pedidos/mês pelo checkout

**Brief:**
- [ ] O que funciona bem na Yever
- [ ] O que é ruim (por que vocês querem sair?)
- [ ] Features que vocês queriam e a Yever não tem

---

### Módulo 5: WhatsApp Engine — Fase 5

**Estado atual:**
- [ ] Quantos números WhatsApp Business vocês têm?
- [ ] Já têm Meta Cloud API configurada? Business Manager ID?
- [ ] Lista dos templates aprovados pela Meta (se já tiver)
- [ ] Print da interface atual de disparo (se usam alguma ferramenta)
- [ ] Como funcionam os grupos VIP hoje (quantos, como gerenciam, smart rotation?)
- [ ] Volume: mensagens/dia, broadcasts/mês

---

### Módulo 6: Trocas e Devoluções — Fase 6

**Estado atual (TroqueCommerce):**
- [ ] Screenshots do TroqueCommerce (se tiver acesso)
- [ ] Fluxo atual: como o cliente solicita troca? (email? WhatsApp? formulário?)
- [ ] Como a Slimgust processa trocas hoje (passo a passo)
- [ ] Volume: trocas/mês, % sobre total de pedidos
- [ ] Motivos mais comuns de troca (tamanho? defeito? arrependimento?)
- [ ] Como funciona a logística reversa hoje (quem paga? como gera etiqueta?)

---

### Módulo 7: Creators — Fase 7

**Estado atual (Moneri):**
- [ ] Screenshots do Moneri (dashboard creator, configurações)
- [ ] Lista de creators ativos (quantos, quais tiers)
- [ ] Volume: GMV via creators/mês, comissões pagas/mês
- [ ] Como funciona o tracking de cupom hoje
- [ ] Quais métricas vocês acompanham sobre creators
- [ ] O documento v2.0 do Marcus já cobre tudo ou tem updates?

---

### Módulo 8: Portal B2B / Atacado — Fase 8

**Estado atual:**
- [ ] Como o Guilherme vende atacado hoje (WhatsApp? video call? planilha?)
- [ ] Tabela de preços atacado (markup por categoria)
- [ ] Lista de lojistas/retailers ativos
- [ ] Volume: pedidos B2B/mês, ticket médio B2B
- [ ] Forma de pagamento B2B atual (só PIX? boleto?)
- [ ] Como é feita a NF-e para B2B (diferente da DTC?)

---

### Módulo 9: Gestão de Tarefas — Fase 9

**Estado atual (Monday + Trello):**
- [ ] Screenshots do Monday (boards, Gantt, views)
- [ ] Screenshots do Trello (boards, cards)
- [ ] Como vocês dividem o uso entre Monday e Trello
- [ ] Template de projeto de drop (se tiver no Monday)
- [ ] Quem usa mais: Caio? Tavares? Todos?
- [ ] O que funciona vs o que não funciona

---

### Módulo 10: ClawdBot Discord — Fase 10

**Estado atual:**
- [ ] Print do Discord da CIENA (canais existentes)
- [ ] Quais reports vocês fazem manualmente hoje (se fazem)
- [ ] Quem consulta dados com mais frequência e sobre o quê
- [ ] Tom de voz desejado (SOUL.md já cobre?)

---

### Módulo 11: Marketing Intelligence — Fase 11

**Estado atual:**
- [ ] Como o Caio monitora concorrentes hoje (manual?)
- [ ] Como vocês identificam UGC hoje (manual no Instagram?)
- [ ] Quais métricas de ads o Caio acompanha e onde
- [ ] Ferramentas que o Caio usa (Manus AI, Meta Ads Manager, etc.)

---

### Módulo 12: Dashboard Executivo — Incremental

**Estado atual:**
- [ ] Que relatórios o Marcus/Pedro/Caio olham hoje? Onde?
- [ ] Quais métricas são mais importantes para cada um
- [ ] Print de qualquer dashboard/relatório atual (Bling, Kevi, planilhas)

---

### Módulo 13: DAM / Repositório de Assets — Fase 13

**Estado atual:**
- [ ] Print da estrutura do Google Drive atual
- [ ] Como o Sick/Yuri organizam assets hoje
- [ ] Volume: quantos arquivos, tipos (fotos, vídeos, mockups, KVs)
- [ ] Quais são os problemas com o Drive (duplicatas? desorganização? busca?)

---

## ORDEM RECOMENDADA DE EXECUÇÃO

```
1. Preparação Global (checklist acima)
2. Módulo CRM (maior economia fixa — R$ 1.200/mês)
3. Módulo ERP (base de dados para tudo)
4. Módulo PCP (maior gargalo operacional)
5. Módulo Checkout (maior economia variável — R$ 3.060/mês)
6. Módulo WhatsApp Engine
7. Módulo Trocas
8. Módulo Creators (após 60-90 dias na Moneri)
9. Módulo B2B
10. Módulo Tarefas
11. Módulo ClawdBot
12. Módulo Marketing Intel
13. Módulo Dashboard (cresce incrementalmente)
14. Módulo DAM
```

---

## COMO USAR ESTE DOCUMENTO

1. **Antes de cada módulo:** complete o checklist correspondente
2. **Abra uma conversa com o Claude:** "Vamos construir o módulo [X]. Aqui estão os screenshots e contexto: [cole ou referencie os arquivos]"
3. **O Claude vai:** analisar screenshots + docs planejados + plano de open-source → propor implementação
4. **Itere:** refine com o Claude até aprovar a abordagem → implemente via vibe code
5. **Marque como feito:** risque os itens completados neste doc
