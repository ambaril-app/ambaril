# Competitive Intelligence: Colecao.moda

> **Categoria:** PLM (Product Lifecycle Management) para moda — foco em desenvolvimento de coleção
> **Análise baseada em:** Transcrição de call de demo (~25 min, 2 speakers, Março 2026)
> **Módulo Ambaril relacionado:** `PLM`
> **Relação:** Colecao.moda é citado no `plm.md` como "Inspiration" — o PLM do Ambaril foi inspirado nele e adaptado para o modelo de drop streetwear
> **Features extraídas:** 65 | ✅ 10 | ⚠️ 18 | ❌ 37

---

## 1. Visão Geral

Colecao.moda é uma plataforma PLM brasileira focada em **desenvolvimento e gestão de coleções de moda**. Diferencia-se de PLMs genéricos (Jira, Monday) por ter vocabulário e fluxo nativo de moda: coleções, temporadas, fichas técnicas, mix de produto, entregas por ciclo.

**Posicionamento:** "A ferramenta específica para o nicho de moda, diferente de usar Kanban genérico."

### Contexto da demo

- **Cliente:** Marcos (fundador da CIENA) — 9 pessoas, desenvolvimento 100% interno, produção terceirizada
- **Vendedora:** Renata (analista da Colecao.moda)
- Lançou 3 coleções no ano anterior (planejava 4, uma cancelou por atrasos); planeja 8 no ano corrente
- Produz própria malha para camisetas (compra fio → malharia → tinturaria → confecção). Jeans e tactel: mais na mão dos fornecedores
- Dor principal: organização de PCP, não desenvolvimento de coleção
- Não possui ERP nem nenhum software de PLM/ficha técnica

### Pricing

| Item                      | Valor      |
| ------------------------- | ---------- |
| Admin (1 conta)           | R$ 390/mês |
| Usuário adicional         | R$ 120/mês |
| Setup (5 encontros de 1h) | R$ 1.000   |
| Contrato mínimo           | 6 meses    |

---

## 2. Tabela Completa de Features

### 2.1 Estrutura Hierárquica e Navegação

| #   | Feature Colecao.moda                                      | Detalhe                                                                                                                                             | Status Ambaril | Observação                                                                                                                                                                                                       |
| --- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Hierarquia: Marca → Coleção → Produto                     | "Primeiro a gente vai estar enxergando a marca, dentro da marca a gente vai enxergar as coleções e dentro das coleções a gente enxerga os produtos" | ⚠️ Parcial     | Ambaril tem Coleção → Drop → OP (vinculada a SKU). Não tem o nível "Marca" como entidade separada — a marca é o tenant. Para single-brand funciona, mas Colecao.moda permite múltiplas marcas sob a mesma conta. |
| 1.2 | Sem limite de marcas por conta                            | "aqui é importante saber que não tem limite de marca"                                                                                               | ❌ Não existe  | Ambaril é multi-tenant (1 tenant = 1 marca). Não há conceito de múltiplas marcas dentro de um tenant. Seria necessário uma entidade `brands` dentro do tenant.                                                   |
| 1.3 | Tabs de coleções: Em andamento / Finalizadas / Arquivadas | 3 estados visualmente separados em tabs                                                                                                             | ✅ Existe      | `pcp.collection_status`: draft, active, completed, archived — 4 estados. Compatível.                                                                                                                             |
| 1.4 | Copiar/mover produto entre coleções                       | "copiar de uma coleção para outra, mover" — produtividade para carry-over (ex: camiseta básica)                                                     | ❌ Não existe  | Nenhuma funcionalidade de copiar ou mover OPs/produtos entre coleções. Relevante para itens recorrentes.                                                                                                         |
| 1.5 | Coleções arquivadas para reuso                            | "O que é interessante de deixar coleções arquivadas? Eu tenho produtos remanescentes" — arquivar para copiar dados depois                           | ⚠️ Parcial     | Ambaril tem status `archived` para coleções, mas não tem funcionalidade explícita de copiar dados de coleções arquivadas.                                                                                        |

### 2.2 Criação de Coleção

| #   | Feature Colecao.moda                                                                        | Detalhe                                                                                                                         | Status Ambaril | Observação                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | Campos da coleção: nome, temporada, data de entrega final, descrição, imagens de referência | "coloco a temporada, verão. Coloco a data de entrega final da minha coleção... descrição... imagens de referência"              | ⚠️ Parcial     | Ambaril tem: name, season, year, status, planned_launch, notes. **Falta:** campo de imagens de referência da coleção (mood board), descrição rica. |
| 2.2 | Mix de produtos planejados — upload via planilha                                            | "Fiz lá minha pesquisa de tendência, minha análise comercial... Posso subir aqui em forma de planilha"                          | ❌ Não existe  | Ambaril não tem conceito de "mix de produtos planejados" nem import de planilha no contexto de planejamento de coleção.                            |
| 2.3 | Esqueleto de coleção — definir tipos e quantidades de peças                                 | "posso colocar aqui que vou fazer camisetas, estou pensando em desenvolver cinco camisetas... ele já vai explodir as caixinhas" | ❌ Não existe  | Você define "5 camisetas, 5 calças" e ele cria os placeholders. Ambaril não tem planejamento de mix antes de criar OPs.                            |
| 2.4 | Criação sem mix (produto a produto)                                                         | Terceira opção: sem planejamento, criar produto a produto                                                                       | ✅ Existe      | No Ambaril, você cria OPs individualmente.                                                                                                         |
| 2.5 | Planejado vs Executado — medir aderência                                                    | "eu pelo menos ter um esqueleto e medir o que eu tô planejando, o que eu tô executando"                                         | ❌ Não existe  | Ambaril não tem dashboard de aderência ao plano de coleção (mix planejado vs executado).                                                           |

### 2.3 Ficha Técnica do Produto

| #    | Feature Colecao.moda                                                                                                          | Detalhe                                                                                                                              | Status Ambaril              | Observação                                                                                                                                                                           |
| ---- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 3.1  | Ficha técnica completa com múltiplas abas                                                                                     | Abas: Geral, Modelagem, Tecidos, Aviamentos, Terceiros, Outros Custos, Precificação, Variantes, Histórico, Gráficos                  | ❌ Não existe como entidade | Ambaril não tem "ficha técnica" como conceito central. Tem OP vinculada a SKU. A ficha técnica no Colecao.moda é o PRODUTO em si — muito mais rica que um SKU do ERP.                |
| 3.2  | Aba Geral: descrição, código referência, técnica, fornecedor, grade de tamanho, preço min/max venda, data de entrega, imagens | Campos detalhados do produto                                                                                                         | ❌ Não existe neste nível   | Ambaril tem OP com: name, description, sku_id, quantity, dates, priority. Dados ricos (grade, técnica, imagens de variante) não existem no PLM.                                      |
| 3.3  | Aba Modelagem: medidas por tamanho, gradação automática                                                                       | "Se você coloca a primeira medida da sua piloto e a gradação, ele calcula os outros tamanhos da grade automaticamente"               | ❌ Não existe               | Nenhuma funcionalidade de modelagem/medidas/gradação.                                                                                                                                |
| 3.4  | Aba Tecidos: biblioteca de tecidos reutilizável                                                                               | "seleciono existente, posso deixar cadastrado na plataforma uma biblioteca de tecidos" com imagem, nome, cores, fornecedor, custo    | ⚠️ Parcial                  | Ambaril tem `pcp.raw_materials` com name, category, unit, supplier_id, unit_cost. Sem imagem do tecido, sem cores, sem cálculo de rendimento. Cadastro simplificado.                 |
| 3.5  | Cálculo de rendimento de tecido                                                                                               | "gramatura, a largura, o encolhimento, a construção. E aí ele calcula automático" — cálculo baseado em propriedades físicas          | ❌ Não existe               | Ambaril não tem campos de gramatura, largura de rolo, encolhimento, construção do tecido. Não faz cálculo de rendimento.                                                             |
| 3.6  | Consumo por peça com cálculo automático de custo                                                                              | "consumindo 1,5 metro desse tecido, eu já sei que minha peça está custando R$ 47,00 pra produzir"                                    | ⚠️ Parcial                  | Ambaril tem `pcp.product_bom` com qty_per_unit e `pcp.cost_analyses` com material_cost. Mas cálculo é mais manual — sem cálculo dinâmico em tempo real conforme se adiciona insumos. |
| 3.7  | Aba Aviamentos: biblioteca de aviamentos reutilizável                                                                         | Mesma lógica dos tecidos — biblioteca separada de aviamentos                                                                         | ⚠️ Parcial                  | Ambaril tem raw_materials com category='trim'. Mesma limitação: sem imagem, sem detalhes ricos.                                                                                      |
| 3.8  | Custos fixos automáticos (etiqueta, composição)                                                                               | "todas as peças da minha organização nascem com uma etiqueta de composição e uma etiqueta bordada. Deixo cadastrado na minha gestão" | ❌ Não existe               | Ambaril não tem conceito de custos fixos que se aplicam automaticamente a todos os produtos.                                                                                         |
| 3.9  | Aba Terceiros: custos de serviços terceirizados                                                                               | "estamparia... qual é o fornecedor, qual é o custo da estamparia"                                                                    | ⚠️ Parcial                  | Ambaril tem labor_cost e overhead_cost no cost_analyses, mas não como itens individuais de terceiros vinculados a fornecedores específicos.                                          |
| 3.10 | Aba Outros Custos: corte, costura, pacote plástico, tag                                                                       | Custos fixos por peça                                                                                                                | ⚠️ Parcial                  | Ambaril tem labor_cost como valor agregado, não itemizado (corte separado de costura separado de acabamento).                                                                        |
| 3.11 | Cálculo por quantidade                                                                                                        | "R$ 47,00 é uma peça, para 50 peças eu vou estar gastando R$ 2.396"                                                                  | ✅ Existe                   | cost_per_piece × quantity. Ambaril faz isso no cost_analyses.                                                                                                                        |
| 3.12 | Custo por variante                                                                                                            | "ele traz por variante também, porque eu posso ter insumos diferentes nas minhas variantes"                                          | ❌ Não existe               | Ambaril calcula custo por OP/SKU, não por variante de produto.                                                                                                                       |
| 3.13 | Aba Precificação com multiplicador (markup/margem)                                                                            | "cadastrar um multiplicador... pode ser um markup ou uma margem de lucro" que calcula preço de venda sugerido                        | ❌ Não existe no PLM        | Ambaril sincroniza custo para o ERP (erp.skus.cost_price), onde a Calculadora de Margem existe. Mas não tem markup/margem DENTRO do PLM com cálculo em tempo real.                   |
| 3.14 | Preço aprovado vs preço calculado                                                                                             | "trazer um preço aprovado que eu tenha para essa peça... acompanhamento se o desenvolvimento está dentro do que eu tenho aprovado"   | ❌ Não existe               | Sem conceito de "preço aprovado" para comparar com custo real durante desenvolvimento.                                                                                               |
| 3.15 | Aba Histórico: log de todas as alterações                                                                                     | "tudo que eu quiser dentro do meu produto... vou conseguir acompanhar e ter um histórico" com o quê, quando, e por quem              | ✅ Existe                   | Ambaril usa global.audit_logs para rastrear mudanças. Equivalente funcional.                                                                                                         |
| 3.16 | Aba Gráficos: performance por etapa                                                                                           | "gráficos relacionados ao meu fluxo de trabalho... essa peça ficou em dia na aprovação de piloto... ela atrasou apenas um dia"       | ⚠️ Parcial                  | Ambaril tem timeline Gantt com cores (verde/amarelo/vermelho) e safety_margin_consumed. Mas não tem gráficos dedicados por peça com lead times reais vs planejados em formato chart. |
| 3.17 | Upload de imagens sem limite                                                                                                  | "não tem o limite de imagens aqui" — variantes, referências, desenho técnico                                                         | ❌ Não existe no PLM        | Ambaril PLM não tem upload de imagens. O DAM é módulo separado. Não há integração PLM → DAM especificada.                                                                            |
| 3.18 | Contexto de variantes visuais no produto                                                                                      | "contexto de variante... analisar se eu tiver mais de uma variante por produto"                                                      | ❌ Não existe               | Ambaril PLM trabalha com OP → SKU (1:1). Variantes são SKUs diferentes no ERP. Não há view consolidada de variantes dentro do PLM.                                                   |

### 2.4 Exportação e Relatórios

| #   | Feature Colecao.moda                            | Detalhe                                                                                                                                                                                 | Status Ambaril | Observação                                                                                                                                                    |
| --- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | Exportar ficha técnica em PDF padronizado       | "exportar esse PDF... layout bonitinho, organizado" com logo, info coleção, desenho técnico, tecidos, aviamentos, variantes, grade, modelagem, tabela de medidas, imagens de referência | ❌ Não existe  | Ambaril não especifica exportação de PDF de ficha técnica.                                                                                                    |
| 4.2 | Mapa/Painel de coleção exportável               | "exportar um painel... painel complexo" com todos os produtos e croquis da coleção — equivalente ao "grande PDF com vários croquis"                                                     | ❌ Não existe  | Ambaril tem Collection Overview (tela 4.11) mas é view interna, não exportável como PDF visual.                                                               |
| 4.3 | Filtros no painel de coleção                    | "quero fazer um painel só com o que eu fiz de blazer... só com o que está na piloto"                                                                                                    | ❌ Não existe  | Sem conceito de painel visual filtrável.                                                                                                                      |
| 4.4 | Relatório de histórico de entregas              | "tudo o que eu tenho nas próximas entregas... mede o tempo que eu levo em cada etapa"                                                                                                   | ⚠️ Parcial     | Ambaril tem timeline por OP e daily production report via Pulse. Sem relatório consolidado de "próximas entregas" com análise de lead times.                  |
| 4.5 | Relatório de movimentações                      | "tudo que for movimentado... para qual etapa foi movimentado, qual peça, coleção, quando iniciou, quando deveria finalizar, situação"                                                   | ⚠️ Parcial     | Ambaril tem audit_logs e production_stages com timestamps. Sem tela dedicada de "movimentações" consolidada.                                                  |
| 4.6 | Relatório de próximas entregas (por dia)        | "por dia o que eu tenho para sair de cada etapa"                                                                                                                                        | ❌ Não existe  | Ambaril tem deadline monitor (background job) que gera alertas, mas não calendário visual de entregas por dia.                                                |
| 4.7 | Relatório de repilotagem                        | "toda vez que a peça avançou uma etapa e ela precisa retornar é a repilotagem... preciso colocar o motivo"                                                                              | ❌ Não existe  | Ambaril tem rework_orders mas apenas pós-produção. **Gap significativo:** Ambaril R2 proíbe retrocesso de stages. Colecao.moda permite RETROCESSO com motivo. |
| 4.8 | Relatório de peças (análise do desenvolvimento) | "fazer análise de tudo que eu tô desenvolvendo na minha coleção... diversos filtros"                                                                                                    | ⚠️ Parcial     | Ambaril tem Collection Overview com OPs e status, sem filtros ricos.                                                                                          |
| 4.9 | Relatório de consumo de tecidos e aviamentos    | "consumo que eu tô tendo dos meus tecidos e aviamentos por tipo de peça, por tecido, quando foi consumido"                                                                              | ⚠️ Parcial     | Ambaril tem raw_material_requirements por coleção (tela 4.8) sem análise de consumo por tipo de peça ou histórico temporal.                                   |

### 2.5 Fluxo de Trabalho (Workflow / Etapas)

| #   | Feature Colecao.moda                                                  | Detalhe                                                                                                                 | Status Ambaril       | Observação                                                                                                                                             |
| --- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 5.1 | Fluxo de trabalho CUSTOMIZÁVEL                                        | "cadastro o meu fluxo de trabalho... de acordo com o dia a dia de vocês" — etapas, nomes, quantidade e ordem são livres | ❌ Não existe        | **GAP CRÍTICO.** Ambaril tem 11 etapas FIXAS (concept → stock_entry) como enum. Não customizáveis.                                                     |
| 5.2 | Lead time configurável por etapa                                      | "coloco o lead time de cada etapa, que é daqui que vai sair o meu acompanhamento"                                       | ✅ Existe            | Ambaril tem planned_start e planned_end por stage, com duração configurável.                                                                           |
| 5.3 | Pessoa responsável por etapa                                          | "quem é a pessoa responsável por essa etapa" — vinculação de responsável                                                | ⚠️ Parcial           | Ambaril tem assigned_supplier_id por stage (fornecedor). Não tem "responsável interno" — atribuição é de fornecedor externo, não membro da equipe.     |
| 5.4 | Visão Kanban das etapas                                               | "visão de Kanban... bem parecido com Trello... etapas em cima e qual peça está em cada etapa"                           | ❌ Não existe no PLM | Product Development Pipeline Dashboard (tela 4.13) é Kanban de VALIDAÇÃO, não de PRODUÇÃO genérica. View principal do PLM é lista de OPs com timeline. |
| 5.5 | Movimentação via drag-and-drop no Kanban                              | "pessoa teria que vir aqui e mover para a próxima etapa"                                                                | ❌ Não existe        | Ambaril: "Drag-and-drop is NOT supported" no Pipeline Dashboard (4.13). Stage advancement é via dialog.                                                |
| 5.6 | Indicação visual de atraso (vermelho)                                 | "essa peça aqui está em vermelhinho, então ela está atrasada"                                                           | ✅ Existe            | Ambaril usa color coding na lista de OPs: red = overdue, yellow = safety margin consumed.                                                              |
| 5.7 | Dialog de movimentação com etapa destino, responsável e data          | "para qual etapa eu estou movendo, quem é a pessoa responsável e qual é a data prevista"                                | ✅ Existe            | Stage Advancement Dialog (tela 4.4) com fornecedor, datas planejadas, notas + rating.                                                                  |
| 5.8 | Dashboard de etapas com contagem de atrasados                         | "em aprovação da piloto eu tenho 21 peças atrasadas"                                                                    | ⚠️ Parcial           | Collection Overview (4.11) mostra Total OPs, No prazo, Atrasadas, Concluídas. Sem breakdown por ETAPA específica.                                      |
| 5.9 | Retorno de peça a etapa anterior (repilotagem) com motivo obrigatório | "toda vez que a peça avançou uma etapa e ela precisa retornar... preciso colocar o motivo"                              | ❌ Não existe        | **GAP CRÍTICO.** Ambaril R2: "stages cannot go backwards." Colecao.moda suporta retrocesso nativamente.                                                |

### 2.6 Gestão de Equipe / Times

| #   | Feature Colecao.moda                              | Detalhe                                                                | Status Ambaril       | Observação                                                                                  |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| 6.1 | Cadastro de times (estilista, modelista, compras) | "times que eu tenho na minha organização"                              | ❌ Não existe no PLM | RBAC com roles (admin, pm, operations), mas sem "times" customizáveis atribuíveis a etapas. |
| 6.2 | Atribuição de time/pessoa a etapas do fluxo       | "coloco quem são as pessoas responsáveis por cada etapa"               | ⚠️ Parcial           | Ambaril atribui FORNECEDOR por etapa, não pessoa interna.                                   |
| 6.3 | Permissões por usuário                            | "qual a permissão de cada um"                                          | ✅ Existe            | AUTH.md: 9 roles com permission matrix detalhada.                                           |
| 6.4 | Múltiplos usuários no mesmo login                 | "dá para mais de uma pessoa acessar simultaneamente" — perde histórico | ✅ Existe (melhor)   | Ambaril tem usuários individuais com audit trail completo.                                  |

### 2.7 Biblioteca de Materiais e Configurações

| #   | Feature Colecao.moda                  | Detalhe                                                                               | Status Ambaril       | Observação                                                                             |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------- |
| 7.1 | Biblioteca de tecidos centralizada    | Cadastro com imagem, nome, cores, fornecedor, custo, gramatura, largura, encolhimento | ⚠️ Parcial           | raw_materials category='fabric' — sem imagem, cores, gramatura, largura, encolhimento. |
| 7.2 | Biblioteca de aviamentos centralizada | Idem para aviamentos                                                                  | ⚠️ Parcial           | raw_materials category='trim' — mesmo gap.                                             |
| 7.3 | Cadastro de modelagens padrão         | "deixar cadastrado as modelagens que eu tenho padrão, só para replicá-las"            | ❌ Não existe        |                                                                                        |
| 7.4 | Custos fixos globais                  | "custos fixos como corte, costura... já deixar para todos os meus produtos"           | ❌ Não existe        |                                                                                        |
| 7.5 | Precificação (markup/margem)          | "criar markup ou margem de lucro"                                                     | ❌ Não existe no PLM | Existe na Calculadora de Margem do ERP, sem integração no fluxo PLM.                   |
| 7.6 | Tipos de peças padronizados           | "Tipos de peças para padronizar as peças que eu desenvolvo"                           | ❌ Não existe        |                                                                                        |
| 7.7 | Catálogo de fornecedores              | "fornecedores de tecido e aviamentos. Posso cadastrar meus outros fornecedores"       | ✅ Existe            | pcp.suppliers com 6 tipos.                                                             |
| 7.8 | Tags/filtros customizáveis            | "posso criar novos filtros" — sistema de tags livre                                   | ❌ Não existe        | Filtros pré-definidos (status, priority, collection). Sem tags livres.                 |
| 7.9 | Fluxos de trabalho múltiplos          | "tenho fluxos de exemplo" — múltiplos fluxos para contextos diferentes                | ❌ Não existe        | UM fluxo fixo de 11 etapas.                                                            |

### 2.8 Integrações

| #   | Feature Colecao.moda                                  | Status Ambaril                                 |
| --- | ----------------------------------------------------- | ---------------------------------------------- |
| 8.1 | Plugin Illustrator para salvar direto na ficha        | ❌ Não existe                                  |
| 8.2 | Upload de arquivos Corel, Illustrator, Photoshop, PDF | ❌ Não existe no PLM (DAM sim, sem integração) |
| 8.3 | Import de planilha de tecidos                         | ❌ Não existe                                  |

### 2.9 Ações em Massa

| #   | Feature Colecao.moda               | Status Ambaril                                   |
| --- | ---------------------------------- | ------------------------------------------------ |
| 9.1 | Edição em massa de fichas técnicas | ❌ Não existe (OQ2 reconhece mas não especifica) |

### 2.10 Precificação

| #    | Feature Colecao.moda                              | Status Ambaril                                          |
| ---- | ------------------------------------------------- | ------------------------------------------------------- |
| 10.1 | Pré-custo em tempo real durante desenvolvimento   | ⚠️ Parcial (cost_analyses manual, sem cálculo dinâmico) |
| 10.2 | Markup editável por peça                          | ❌ Não existe no PLM (só ERP)                           |
| 10.3 | Preço de venda sugerido calculado automaticamente | ❌ Não existe no PLM (só ERP)                           |

---

## 3. Features do Ambaril que Colecao.moda Não Tem

| Feature Ambaril                                        | Detalhe                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| Alertas escalonados (3 tiers) via Discord              | Tier 1: margem consumida → Tier 2: prazo amanhã → Tier 3: prazo estourado |
| Integração com ERP (sync de estoque e custo)           | Stock entry → ERP inventory, cost → ERP pricing                           |
| Produção piloto com monitoramento automático de vendas | 50–100 unidades, champion detection automático                            |
| Votação interna de produto                             | Sim/Não/Talvez com mínimo de votos                                        |
| Product Development Pipeline (Kanban de validação)     | Conceito → Votação → Preview Social → Piloto → Dados Venda → Escala       |
| Rework orders com tracking de envio/retorno            | Status flow: pending → sent → in_rework → returned → completed            |
| Reliability score com fórmula ponderada                | on_time_rate × 40 + quality × 30 + communication × 20 + cost × 10         |
| Production Playbooks (templates de OP)                 | Templates pré-configurados por tipo de peça                               |
| Daily production report automático via Discord         | Cron diário com resumo de OPs ativas, atrasadas, deadlines                |
| Background jobs de monitoramento                       | Hourly deadline monitor, daily supplier recalc, champion detection        |
| Pause/resume de OP com shift de datas                  | Pausar OP com motivo, retomar com recálculo de datas                      |
| BOM (Bill of Materials) por produto                    | qty_per_unit de cada matéria-prima por produto                            |
| Mobile stock entry para logística                      | Tela dedicada para Ana Clara no almoxarifado                              |

---

## 4. Resumo de Gaps com Prioridades

### 4.1 Gaps Arquiteturais Críticos

| #   | Gap                                                 | Impacto                                                                                                                |
| --- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| A1  | **Fluxo de etapas fixo vs customizável**            | Ambaril: 11 etapas fixas. Colecao.moda: 100% customizáveis. Deal-breaker para multi-tenant.                            |
| A2  | **Impossibilidade de retroceder etapa**             | Ambaril R2 proíbe retrocesso. Na moda, peças voltam para etapas anteriores constantemente. Deal-breaker para PCP real. |
| A3  | **Ausência de ficha técnica como entidade central** | No Colecao.moda, a ficha técnica É o produto, com 10 abas. No Ambaril, é OP+SKU simples.                               |
| A4  | **Sem upload de imagens no PLM**                    | Desenhos técnicos, croquis, referências visuais. PLM não tem upload; DAM separado sem integração.                      |

### 4.2 Gaps Funcionais de Alta Prioridade

| #   | Gap                                                                           |
| --- | ----------------------------------------------------------------------------- |
| F1  | Sem mapa de coleção exportável / PDF de ficha técnica                         |
| F2  | Sem biblioteca de tecidos rica (gramatura, largura, encolhimento, rendimento) |
| F3  | Sem gradação automática / modelagem                                           |
| F4  | Sem ações em massa (editar tecido em todas as peças)                          |
| F5  | Sem custos fixos globais                                                      |
| F6  | Sem sistema de tags customizáveis                                             |

### 4.3 Gaps Menores

| #      | Gap                                                                                                                                                                                                                                       |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1-G10 | Múltiplas marcas por conta, mix planejado, copiar/mover entre coleções, custo por variante, preço aprovado vs calculado, import de planilha, integração Illustrator, entregas por dia, times customizáveis, responsável interno por etapa |

---

## 5. Diagnóstico: PLM de Desenvolvimento vs PLM de Produção

O Colecao.moda é fundamentalmente um **PLM de desenvolvimento de produto** (da ficha técnica até a piloto). O Ambaril PLM é fundamentalmente um **sistema de tracking de produção** (da OP com etapas fixas até a entrada em estoque).

Embora inspirado no Colecao.moda, o Ambaril divergiu significativamente para focar na dor operacional do Tavares (acompanhamento de prazos, alertas, fornecedores) e não no desenvolvimento do produto em si.

### Pain points do Marcos/CIENA — trechos da call:

> **Atrasos que cancelam coleções:** "Eram para ser quatro, mas uma não saiu por conta desses problemas... Tivemos que cancelar a coleção."

> **Escala crescente:** "esse ano já lançou duas e deve lançar oito até o final do ano... mais do que dobrar"

> **Cadeia complexa:** "compra o fio → entrega na malharia → acompanhar prazo → tinturaria → acompanhar prazo → pagamentos picotadinhos etapa por etapa"

> **Sem catálogo histórico:** "a gente não tem isso catalogado hoje... não tem um painel para conseguir olhar o que deu certo e o que deu errado"

> **Reação mais entusiasmada:** "Isso aí é o que a gente mais sofre hoje" — ao ver dashboard de etapas com contagem de atrasados.
