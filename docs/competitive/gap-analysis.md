# Gap Analysis: Ambaril vs Concorrentes

> **Baseado em:** Transcrições de calls de demo — Inbazz (~55min), Colecao.moda (~25min), Audaces ISA (~3h40)
> **Data:** Abril 2026
> **Módulos Ambaril impactados:** PLM, Creators, Tarefas, DAM, ERP
> **Features extraídas:** ~169 no total (66 Inbazz + 65 Colecao.moda + 38 ISA)

---

## Sumário Executivo

A análise exaustiva de 3 apps concorrentes/referência revelou **53+ features que não existem no Ambaril** e **~56 features parcialmente cobertas**. O Ambaril é significativamente mais completo como plataforma all-in-one (11 módulos integrados vs ferramentas verticais), mas tem **gaps arquiteturais críticos no PLM** que afetam a proposta de valor central para marcas de moda.

**Diagnóstico de fundo:** O Ambaril PLM é um **sistema de tracking de produção** (OP com etapas fixas até estoque). O Colecao.moda e o Audaces ISA são **PLMs de desenvolvimento de produto** (ficha técnica, modelagem, rendimento de tecido, catálogo visual). O Ambaril focou na dor operacional (alertas, prazos, fornecedores) e não no desenvolvimento do produto em si. Para competir nesse território, decisões arquiteturais precisam ser tomadas.

---

## Contagem por app

| App              | Foco                     | Total features | ✅ Existe | ⚠️ Parcial | ❌ Não existe |
| ---------------- | ------------------------ | -------------- | --------- | ---------- | ------------- |
| **Inbazz**       | Creators/Influenciadores | 66             | 32 (48%)  | 22 (33%)   | 12 (18%)      |
| **Colecao.moda** | PLM desenvolvimento      | 65             | 10 (15%)  | 18 (28%)   | 37 (57%)      |
| **Audaces ISA**  | PLM + PCP avançado       | 38             | 15 (39%)  | 14 (37%)   | 9 (24%)       |

---

## GAPS ARQUITETURAIS (requerem mudança de schema/modelo)

Estes são os gaps que afetam a arquitetura do sistema e não podem ser resolvidos com adição simples de features. Requerem decisão de produto.

### A1. Etapas de produção fixas vs customizáveis

|            | Ambaril                                 | Colecao.moda              | Audaces ISA            |
| ---------- | --------------------------------------- | ------------------------- | ---------------------- |
| Etapas     | 11 fixas (enum)                         | 100% livres               | 100% customizáveis     |
| Nomes      | Hardcoded (concept, pattern, sample...) | Definidos pelo usuário    | Definidos pelo usuário |
| Ordem      | Sequencial, sem retrocesso              | Livre, permite retrocesso | Livre                  |
| Quantidade | Fixa                                    | Configurável              | Configurável           |

**Impacto:** Marcas com processos diferentes não encaixam no fluxo de 11 etapas. Uma marca que terceiriza tudo (como a CIENA) pode não usar `cutting` ou `sewing` como etapas separadas. Uma marca de acessórios não precisa de `grading`. O workaround atual é "pular etapa com motivo" (US07), o que é um band-aid.

**Sugestão:** Tabela `pcp.tenant_stages` configurável por tenant. O enum serve como template default, mas o tenant pode renomear, ocultar, reordenar e adicionar etapas.

### A2. Impossibilidade de retroceder etapa (repilotagem)

**Regra atual:** `R2: "a completed stage cannot be reverted to pending."`

**Realidade da moda:** Peças voltam para etapas anteriores constantemente. Piloto reprovada → volta para modelagem. Tecido diferente do esperado → volta para compra de insumos. A Colecao.moda suporta isso nativamente com motivo obrigatório + relatório de repilotagem.

**Impacto:** Deal-breaker para PCP real. O próprio Marcos (CIENA) reagiu com "Isso aí é o que a gente mais sofre hoje" na demo do Colecao.moda ao ver o dashboard de atrasos com repilotagem.

**Sugestão:** Permitir retrocesso com: motivo obrigatório, log de audit, recálculo de datas downstream, contador de repilotagens por OP.

### A3. Ficha técnica inexistente como entidade central

|                    | Ambaril                      | Colecao.moda                                                                                                            | Audaces ISA                   |
| ------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Conceito central   | OP (ordem de produção) → SKU | Ficha Técnica = O Produto                                                                                               | Card com campos customizáveis |
| Abas/seções        | N/A                          | 10 abas (Geral, Modelagem, Tecidos, Aviamentos, Terceiros, Outros Custos, Precificação, Variantes, Histórico, Gráficos) | Campos livres + 3 fixos       |
| Imagens            | Nenhuma                      | Sem limite                                                                                                              | Upload no card                |
| Medidas/gradação   | Não existe                   | Automática (coloca piloto, calcula toda a grade)                                                                        | Tabela de medidas             |
| BOM                | product_bom (qty_per_unit)   | Automático com cálculo de rendimento de tecido                                                                          | Via integração ERP            |
| Custo por variante | Não                          | Sim (aviamentos diferentes por cor)                                                                                     | Não mencionado                |
| Export PDF         | Não                          | PDF formatado com logo, campos selecionáveis (ocultar custo)                                                            | PDF com filtro de campos      |

**Impacto:** Toda marca de moda precisa de fichas técnicas para enviar a fornecedores. Se o Ambaril não gera isso, o usuário volta para planilha/PDF manual, anulando o valor da centralização.

**Sugestão:** Criar entidade `pcp.product_specs` (ficha técnica) vinculada à OP, com: abas de modelagem (medidas por tamanho + gradação), materiais (com cálculo de consumo/rendimento), custos itemizados, imagens/croquis (integração DAM), e geração de PDF com campos selecionáveis por destinatário.

### A4. Sem portal de fornecedor

|                    | Ambaril               | Audaces ISA                                  | Colecao.moda                           |
| ------------------ | --------------------- | -------------------------------------------- | -------------------------------------- |
| Acesso externo     | Não existe            | 4 níveis (Gerente, Visual, Time, Fornecedor) | 3 níveis (Gerente, Time, Visualizador) |
| Fornecedor vê      | N/A                   | Apenas sua etapa, demandas pendentes         | Conforme permissão                     |
| Upload de arquivos | N/A                   | Sim (moldes, modelagens)                     | Sim                                    |
| Role no RBAC       | Não existe `supplier` | Sim                                          | Sim                                    |

**Impacto:** Sem portal, toda comunicação com fornecedor segue por WhatsApp/email. Modelista não pode subir arquivos na plataforma. Facção não vê demandas pendentes. O valor do PLM centralizado é reduzido.

**Sugestão:** Adicionar role `supplier` no AUTH.md com acesso limitado: ver OPs atribuídas ao fornecedor, ver apenas stages pertinentes, upload de arquivos por stage, confirmar entregas. Acessado via link com token (sem cadastro completo).

### A5. Sem campos customizáveis no card de produto/OP

**Ambaril:** Schema fixo (`name, description, sku_id, quantity, dates, priority, notes`).
**ISA:** Campos livres — o usuário adiciona o que quiser (modelista, facção, técnica de estampa, etc.)
**Colecao.moda:** Tags customizáveis + filtros por qualquer campo cadastrado.

**Impacto:** Uma marca que quer rastrear "número do molde", "técnica de estampa", "tipo de acabamento" não tem onde colocar. Usa campo `notes` (texto livre, não filtrável).

**Sugestão:** `custom_fields JSONB` em `pcp.production_orders` + `pcp.custom_field_definitions` configurável por tenant. Ou: tags livres como sistema genérico.

### A6. Comissão rígida por tier (Creators)

**Ambaril:** 4 tiers fixos (8%, 10%, 12%, 15%). OQ-5 reconhece o gap mas adia.
**Inbazz:** Comissão 100% individual por creator (99% pra um, 1% pra outro).

**Impacto:** Impossibilita acordos com mega-influencers e deals customizados. Um artista com contrato de R$ 15k fixo/mês + 3% de comissão não cabe no modelo do Ambaril.

**Sugestão:** Campo `commission_override` na tabela `creators.creators`. Se != NULL, sobrescreve tier rate. + Campo `monthly_fixed_fee` para contratos de influencers pagos.

---

## GAPS FUNCIONAIS — PLM (por prioridade)

### Alta Prioridade

| #   | Gap                                                                                                                                    | Origem             | Impacto                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| F1  | **Sem Kanban de produtos por etapa** — o Kanban do Ambaril é de TAREFAS (Todo/In Progress/Done), não de PRODUTOS por ETAPA DE PRODUÇÃO | ISA + Colecao.moda | Tavares não tem view visual de "quantos modelos em cada etapa" como board arrastável                                  |
| F2  | **Sem upload de imagens no PLM** — desenhos técnicos, croquis, variantes visuais. Nenhum campo de imagem no OP                         | ISA + Colecao.moda | Fundamental para desenvolvimento de moda. Sem isso, vai para Google Drive (exatamente o que Ambaril substitui)        |
| F3  | **Sem mapa de coleção visual** — view de produtos por segmento/categoria (camisetas, calças)                                           | ISA + Colecao.moda | Marcos descreveu que hoje fecha "PDFzão com vários croquis" — quer isso digital                                       |
| F4  | **Sem exportação PDF de ficha técnica** — ficha formatada com logo, layout, campos selecionáveis                                       | ISA + Colecao.moda | Todo fornecedor recebe ficha técnica. Sem export, volta para processo manual                                          |
| F5  | **Sem mix de produto como view agregada** — quantas peças por linha/categoria dentro da coleção                                        | ISA + Colecao.moda | Input crítico para PCP. Tavares precisa saber "20 camisetas Linha DNA + 15 calças Linha Basics" para planejar compras |
| F6  | **Sem comentários/chat no OP** — comunicação sobre um modelo está no módulo Tarefas, não no PLM                                        | ISA                | Para comentar sobre um modelo, Tavares tem que ir à tarefa PCP-linkada. Quebra o fluxo                                |
| F7  | **Sem copiar/mover produto entre coleções** — carry-over items (ex: camiseta básica recorrente)                                        | Colecao.moda       | "Aproveitamentos" é workflow fundamental para não recriar ficha técnica do zero                                       |

### Média Prioridade

| #   | Gap                                                                                            | Origem             | Impacto                                                                                                |
| --- | ---------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------ |
| F8  | Sem biblioteca de tecidos rica (gramatura, largura, encolhimento, cálculo de rendimento)       | Colecao.moda       | `raw_materials` é cadastro simplificado sem propriedades físicas do tecido                             |
| F9  | Sem gradação automática de medidas (coloca piloto, calcula grade inteira)                      | Colecao.moda       | Conceito específico de moda inexistente no schema                                                      |
| F10 | Sem custos fixos globais (etiqueta, composição que se aplicam a todos os produtos)             | Colecao.moda       | Usuário tem que adicionar manualmente a cada produto                                                   |
| F11 | Sem custo por variante de cor (aviamentos diferentes por variante)                             | Colecao.moda       | Cost analysis é por OP, não por variante                                                               |
| F12 | Sem preço aprovado vs calculado ("acompanhar se o desenvolvimento está dentro do aprovado")    | Colecao.moda       | Sem referência para saber se custo real excedeu o planejado                                            |
| F13 | Sem markup/margem dentro do PLM (só no ERP)                                                    | Colecao.moda       | Precificação não acontece no fluxo de desenvolvimento, obriga ir ao ERP                                |
| F14 | Sem esqueleto de coleção (mix planejado) — "vou fazer 5 camisetas, 5 calças" cria placeholders | Colecao.moda       | Sem planejado vs executado, não mede aderência ao plano                                                |
| F15 | Sem edição em massa de fichas (atualizar tecido em todas as peças de uma vez)                  | Colecao.moda       | Operação manual por OP                                                                                 |
| F16 | Sem import de planilha (tecidos, mix, produtos)                                                | Colecao.moda       | Migração de dados existentes é manual                                                                  |
| F17 | Sem tags customizáveis / filtros por campo arbitrário                                          | ISA + Colecao.moda | Filtros limitados a campos pré-definidos (status, priority, collection)                                |
| F18 | Sem responsável INTERNO por etapa (apenas fornecedor externo)                                  | Colecao.moda       | `assigned_supplier_id` no stage é para fornecedor, não membro da equipe                                |
| F19 | Sem view catálogo (lookbook com fotos + dados lado a lado, modo fullscreen)                    | ISA                | Visualização tipo catálogo não existe no PLM                                                           |
| F20 | Sem contadores agregados por etapa no collection overview                                      | ISA + Colecao.moda | Collection Overview mostra "total/no prazo/atrasadas" mas não "21 em aprovação de piloto, 5 atrasadas" |
| F21 | Sem propriedades de coleção (paleta de cores global, estampas, imagem de capa)                 | ISA                | `pcp.collections` não tem campos de cor, estampa, ou imagem                                            |
| F22 | Sem tabela de medidas por produto                                                              | ISA                | Conceito fundamental de moda inexistente                                                               |
| F23 | Sem relatório de entregas por dia (calendário visual de prazos)                                | Colecao.moda       | Não há view "por dia, o que tem que sair de cada etapa"                                                |

### Baixa Prioridade

| #   | Gap                                                                       | Origem       |
| --- | ------------------------------------------------------------------------- | ------------ |
| F24 | Sem lembretes manuais (avulsos, definidos pelo usuário)                   | ISA          |
| F25 | Sem integração com Illustrator/Corel (plugin para salvar direto na ficha) | Colecao.moda |
| F26 | Sem conceito de múltiplas marcas por tenant                               | Colecao.moda |
| F27 | Sem base de conhecimento / help integrado (tipo ZISA da Audaces)          | ISA          |
| F28 | Sem role genérico "viewer-only"                                           | ISA          |
| F29 | Sem @mention granular em comentários (apenas notifica participantes)      | ISA          |

---

## GAPS FUNCIONAIS — CREATORS (por prioridade)

### Alta Prioridade

| #   | Gap                                                                                                                                  | Origem | Impacto                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------- |
| C1  | **Storage de mídia de posts** — Inbazz baixa e arquiva conteúdo (stories inclusive) com qualidade original. Ambaril só armazena URLs | Inbazz | Se story some em 24h, perde-se o UGC para tráfego pago. Bloqueia fluxo UGC→Partnership Ad |
| C2  | **AI Content Analysis** — verificação automática de compliance com briefing (do's/don'ts)                                            | Inbazz | Review de conteúdo não escala sem automação. 100% manual hoje                             |
| C3  | **Pagamento fixo mensal por creator** — contratos de influencers pagos (R$ 500/mês + comissão)                                       | Inbazz | Impossibilita trabalhar com influencers maiores que cobram fee fixo                       |
| C4  | **NF centralizada** — Inbazz absorve complexidade fiscal (marca paga Inbazz, recebe uma NF)                                          | Inbazz | Ambaril obriga marca a emitir RPA pra cada PF ou receber NF-e de cada PJ/MEI              |

### Média Prioridade

| #   | Gap                                                                          | Origem |
| --- | ---------------------------------------------------------------------------- | ------ |
| C5  | Sem app nativo (web-only). Creators pequenos preferem app                    | Inbazz |
| C6  | Ranking com pontuação oculta (evita desistência de quem está atrás)          | Inbazz |
| C7  | Mapa geográfico de creators/vendas por estado                                | Inbazz |
| C8  | Landing page de marketing do programa (benefícios, tiers) — separada do form | Inbazz |
| C9  | Saque ativo pelo creator vs pagamento passivo processado pelo admin          | Inbazz |
| C10 | Filtro "mínimo de compras anteriores" como requisito de entrada              | Inbazz |
| C11 | Múltiplos padrões de cupom configuráveis (NOME10, CIENANOME, etc.)           | Inbazz |
| C12 | Produtos mais vendidos por creator individual (no admin e no portal)         | Inbazz |
| C13 | Gráfico de correlação posts vs vendas por período                            | Inbazz |
| C14 | Competição dentro de campanha (leaderboard temporário de campanha)           | Inbazz |
| C15 | Voucher para creator escolher peça no site (mecanismo de seeding)            | Inbazz |

---

## DIFERENCIAIS COMPETITIVOS DO AMBARIL (o que nenhum concorrente tem)

### vs Todos os concorrentes

| Diferencial                            | Detalhe                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| **All-in-one sem integrações frágeis** | PLM + ERP + CRM + Checkout + Creators + Tarefas + DAM + Mensageria num único banco de dados |
| **Sem contrato de fidelidade**         | ISA = 12 meses obrigatórios. Colecao.moda = 6 meses. Ambaril = SaaS sem lock-in             |
| **Multi-tenant**                       | Qualquer marca de streetwear pode usar, não só CIENA                                        |

### vs Audaces ISA e Colecao.moda (PLM)

| Diferencial                                                         | Detalhe                                                              |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Pipeline de produção física completo (11 estágios)                  | Concorrentes focam desenvolvimento, não produção (corte/costura/QC)  |
| 3 tiers de alerta escalonados (safety→deadline→overdue) com Discord | Concorrentes têm notificações básicas                                |
| Score de confiabilidade de fornecedor calculado automaticamente     | Concorrentes têm acesso de fornecedor mas sem avaliação quantitativa |
| Rework tracking (peças defeituosas)                                 | Não mencionado em nenhum concorrente                                 |
| Pilot production com sell-through e detecção de campeão             | Não mencionado em nenhum concorrente                                 |
| Votação interna de produto (a equipe vota se compraria)             | Não mencionado em nenhum concorrente                                 |
| Product Development Pipeline (4 camadas de validação)               | Não mencionado em nenhum concorrente                                 |
| Production Playbooks (templates de OP por tipo de peça)             | Não mencionado em nenhum concorrente                                 |
| Daily summary no Discord (#report-producao)                         | Não mencionado em nenhum concorrente                                 |
| Entrada de estoque mobile (Ana Clara)                               | Não mencionado em nenhum concorrente                                 |
| ERP integrado nativamente (NF-e, shipping, Mercado Pago, DRE)       | ISA depende de TOTS/Bling. Colecao.moda não tem ERP                  |
| Gestão de matérias-primas com alertas de compra por período         | Colecao.moda tem biblioteca de materiais mas sem gestão de estoque   |

### vs Inbazz (Creators)

| Diferencial                                                                     | Detalhe                             |
| ------------------------------------------------------------------------------- | ----------------------------------- |
| White-glove mode para artistas/mega-influencers que nunca logam                 | Inbazz obriga todos a usar o app    |
| 5 tiers nomeados com progressão automática                                      | Inbazz tem % simples                |
| CIENA Points — gamificação completa (challenges, referral, hashtag, tier bonus) | Inbazz mencionou gamificação básica |
| Multi-platform tracking (IG + TikTok + YouTube + Pinterest + Twitter)           | Inbazz foca IG/Meta                 |
| Creator self-service portal (10 páginas web)                                    | Inbazz é app-only                   |
| Referral program (creator traz creator)                                         | Não mencionado                      |
| Post-purchase creator invite via WA                                             | Não mencionado                      |
| Integração nativa com CRM + Checkout (atribuição, anti-fraude CPF)              | Inbazz depende de APIs externas     |
| 23 automações pré-construídas no CRM para lifecycle do creator                  | Inbazz não mencionou automações CRM |

---

## RECOMENDAÇÃO: Próximos passos por módulo

### PLM — Decisões necessárias antes da implementação

| Decisão                            | Opções                                                                                       | Recomendação                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Etapas fixas ou configuráveis?     | A) Manter 11 fixas com skip. B) Configuráveis por tenant. C) Template default + customização | **C** — template de 11 como default, tenant pode renomear/ocultar/adicionar          |
| Permitir retrocesso de etapa?      | A) Manter proibição. B) Permitir com motivo + audit                                          | **B** — essencial para PCP real. Com motivo obrigatório e contador de repilotagens   |
| Criar ficha técnica como entidade? | A) Não (manter OP + SKU). B) Sim, rica (abas, medidas, rendimento, PDF)                      | **B** — sem ficha técnica, o PLM não compete com ISA/Colecao.moda no mercado de moda |
| Portal de fornecedor?              | A) Não na v1. B) Sim, com acesso por link/token                                              | **B para v1.1** — v1 sem portal, comunicação por WA. v1.1 adiciona portal            |
| Campos customizáveis?              | A) Não. B) JSONB genérico. C) Custom field definitions por tenant                            | **B** — `custom_fields JSONB` na OP é rápido e resolve 80% dos casos                 |

### Creators — Features a adicionar no spec

| Feature                                      | Prioridade | Esforço                              |
| -------------------------------------------- | ---------- | ------------------------------------ |
| `commission_override` por creator            | Alta       | Baixo (1 campo + lógica de override) |
| `monthly_fixed_fee` por creator              | Alta       | Baixo (1 campo + inclusão no payout) |
| Storage de mídia via DAM/R2 ao detectar post | Alta       | Médio (job de download + storage)    |
| AI Content Analysis via Astro                | Média      | Alto (novo pipeline)                 |
| Landing page do programa (pré-form)          | Média      | Baixo (1 página estática)            |

### Tarefas — Sem gaps críticos

O módulo Tarefas é o mais completo vs concorrentes. ISA não tem gestão de tarefas. Clientes da ISA usam Monday/Trello por falta de alternativa. A integração PCP↔Tarefas é o principal diferencial do Ambaril.

---

## Pricing dos concorrentes (extraído das calls)

| App              | Modelo         | Preço                                                             | Contrato              |
| ---------------- | -------------- | ----------------------------------------------------------------- | --------------------- |
| **Inbazz**       | Pacote bundled | "Caríssimo" (valor não dito)                                      | Não mencionado        |
| **Colecao.moda** | Per-seat       | R$ 390 (admin) + R$ 120/usuário. Setup: R$ 1.000 (5 encontros 1h) | Mínimo 6 meses        |
| **Audaces ISA**  | Não divulgado  | Não divulgado                                                     | 12 meses obrigatórios |
