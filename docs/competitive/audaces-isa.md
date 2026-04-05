# Competitive Intelligence: Audaces ISA

> **Categoria:** PLM avançado para moda — foco em desenvolvimento de coleção + PCP
> **Análise baseada em:** Transcrição de call de demo (~3h40, 3 speakers, Março 2026)
> **Módulo Ambaril relacionado:** `PLM`, `Tarefas`
> **Relação:** Concorrente direto no segmento PLM para marcas de moda brasileiras
> **Features extraídas:** 38 | ✅ 15 | ⚠️ 14 | ❌ 9

---

## 1. Visão Geral

Audaces ISA é o módulo PLM da Audaces (empresa brasileira de software de modelagem têxtil). Foca em **desenvolvimento de coleção + PCP** para marcas com produção terceirizada. Integra com Audaces Digifred (modelagem) e ERPs como TOTS e Bling.

**Participantes:** Marcus (CIENA), Késia (vendedora Audaces), outra vendedora.

### Perfil do cliente na call

- Marca de moda masculina, ~2000 peças/ano, planeja dobrar em 2026
- Produção 100% terceirizada (facção), desenvolvimento criativo 100% interno
- 9 pessoas no time, usa Bling (ERP), Monday, Trello, Jira
- **Dor principal:** PCP — "a gente se perde bastante nessa parte"
- Contrato: **12 meses fidelidade** (ponto de objeção forte)

---

## 2. Tabela Completa de Features

### 1. Gestão de Coleções

| #   | Feature ISA                                               | Status | Ref. Ambaril                            | Notas                                                                         |
| --- | --------------------------------------------------------- | ------ | --------------------------------------- | ----------------------------------------------------------------------------- |
| 1.1 | Painel de coleção — cadastro com nome, estação            | ✅     | PLM §3.3.1 collections                  | Ambaril tem mais campos (year, planned_launch, notes).                        |
| 1.2 | Propriedades da coleção (cores, estampas, imagem de capa) | ⚠️     | collections não tem cores/estampas/capa | **GAP:** Ambaril não tem "propriedades de coleção" (paleta global, estampas). |
| 1.3 | Ciclos dentro de coleção (sub-entregas mensais/semanais)  | ✅     | PLM §3.3.2 drops                        | Drops = Ciclos. Conceito equivalente.                                         |
| 1.4 | Distribuição de mix de produto por segmento               | ⚠️     | PLM sem conceito de "mix"               | **GAP:** Sem agrupamento visual por categoria/segmento dentro da coleção.     |

### 2. Cronograma e Etapas

| #   | Feature ISA                                           | Status | Ref. Ambaril                                    | Notas                                                                |
| --- | ----------------------------------------------------- | ------ | ----------------------------------------------- | -------------------------------------------------------------------- |
| 2.1 | **Etapas personalizáveis** — totalmente customizáveis | ❌     | PLM §R1 — 11 estágios fixos (enum)              | **GAP SIGNIFICATIVO.** ISA = 100% customizável. Ambaril = hardcoded. |
| 2.2 | Mensuração de prazo em dias/meses por etapa           | ✅     | PLM §US05 — planned_start/end, safety_margin    | Ambaril tem mais detalhe (margem de segurança configurável).         |
| 2.3 | Linha vermelha automática no Kanban (atraso)          | ✅     | PLM §4.1 — red badge + 3 tiers de alerta        | Ambaril mais robusto (alertas escalonados + Discord).                |
| 2.4 | Contagem de produtos por etapa no Kanban              | ⚠️     | PLM §4.1 mostra OPs com %, sem Kanban por etapa | **GAP:** Ambaril não tem Kanban de produtos por etapa com contagem.  |

### 3. Visualizações

| #   | Feature ISA                                              | Status | Ref. Ambaril                                     | Notas                                                                           |
| --- | -------------------------------------------------------- | ------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| 3.1 | **Visão Kanban** (board por etapas com cards de produto) | ⚠️     | Tarefas §US-05 — Kanban de TAREFAS, não produtos | **GAP:** Kanban do Ambaril é de tarefas, não de produtos por etapa de produção. |
| 3.2 | **Visão Mapa da Coleção** (por segmentos)                | ❌     | —                                                | **GAP:** Sem view visual por segmento/categoria.                                |
| 3.3 | Visão Geral (arquivos + OK por etapas)                   | ✅     | PLM §4.2 — OP Detail com timeline                | Similar.                                                                        |
| 3.4 | **Visão Catálogo** (modo lookbook, tela cheia)           | ❌     | —                                                | **GAP:** Sem view tipo catálogo visual no PLM.                                  |
| 3.5 | Status da coleção (pendências, revisões, impedimentos)   | ✅     | PLM §4.11 — Collection Overview                  | Ambaril tem menos granularidade de status (sem "impedimentos").                 |

### 4. Card do Modelo / Ficha

| #   | Feature ISA                                                                     | Status | Ref. Ambaril                                           | Notas                                                          |
| --- | ------------------------------------------------------------------------------- | ------ | ------------------------------------------------------ | -------------------------------------------------------------- |
| 4.1 | **Campos personalizáveis** (modelista, facção, materiais, custo, piloto, preço) | ⚠️     | PLM production_orders + stages + cost_analyses         | Ambaril tem dados estruturados mas **sem campos arbitrários.** |
| 4.2 | 3 campos fixos (descrição, cores, estampas) para filtros                        | ⚠️     | ERP products tem name, description. SKUs têm variantes | Estampas não são conceito no Ambaril.                          |
| 4.3 | **Fotos do modelo no card**                                                     | ⚠️     | PLM sem foto. DAM separado                             | **GAP:** Sem campo de imagem no OP do PLM.                     |
| 4.4 | Variante de cor visível no card                                                 | ⚠️     | ERP SKUs têm variantes                                 | OPs são per-SKU. Visualização não destaca variantes.           |
| 4.5 | **Filtros inteligentes** (qualquer campo)                                       | ⚠️     | PLM §5.3 — filtro por status/priority/collection       | **GAP:** Filtros limitados a campos pré-definidos.             |
| 4.6 | Dados geram insights para decisão                                               | ✅     | PLM §4.9 Cost Analysis, Dashboard                      | Ambaril analytics mais robustos.                               |

### 5. Ficha Técnica

| #   | Feature ISA                                                       | Status | Ref. Ambaril                    | Notas                                                   |
| --- | ----------------------------------------------------------------- | ------ | ------------------------------- | ------------------------------------------------------- |
| 5.1 | Ficha técnica integrada (nome, coleção, tecidos, custos, medidas) | ⚠️     | PLM product_bom + cost_analyses | **GAP:** Sem ficha técnica formal como documento único. |
| 5.2 | **Tabela de medidas personalizável**                              | ❌     | —                               | **GAP:** Conceito de moda inexistente no schema.        |
| 5.3 | **Layout para impressão/PDF** com logo                            | ❌     | —                               | **GAP:** Sem geração de PDF.                            |
| 5.4 | Sequência operacional na ficha                                    | ❌     | —                               | **GAP:** Sem instruções de costura/montagem.            |
| 5.5 | Imagens de referência na ficha                                    | ❌     | —                               | Sem imagens em documento formatado.                     |
| 5.6 | **Filtro de campos na ficha** (ocultar custo para fornecedor)     | ❌     | —                               | **GAP:** Sem fichas com níveis por destinatário.        |
| 5.7 | Integração ficha ↔ ERP (puxa estoque)                             | ✅     | PLM §7.1 — nativo               | **VANTAGEM AMBARIL.**                                   |

### 6. Upload e Repositório

| #   | Feature ISA                                               | Status | Ref. Ambaril                            | Notas                                            |
| --- | --------------------------------------------------------- | ------ | --------------------------------------- | ------------------------------------------------ |
| 6.1 | Upload de arquivos no card (PDF, planilha, imagens, GIFs) | ⚠️     | Tarefas §US-12 (por tarefa, não por OP) | **GAP:** Attachments no Tarefas, não no PLM.     |
| 6.2 | Backup/acervo de arquivos                                 | ✅     | DAM — Cloudflare R2, versionamento      | Ambaril DAM mais robusto.                        |
| 6.3 | **Modelista com acesso insere moldes**                    | ❌     | —                                       | **GAP SIGNIFICATIVO:** Sem portal de fornecedor. |

### 7-8. Calendário e Histórico

| #   | Feature ISA                           | Status | Ref. Ambaril                               |
| --- | ------------------------------------- | ------ | ------------------------------------------ |
| 7.1 | Calendário integrado (fotos, eventos) | ✅     | Tarefas Calendar Editorial — mais completo |
| 8.1 | Histórico de alterações               | ✅     | global.audit_logs — mais robusto           |
| 8.2 | Histórico por modelo                  | ✅     | PLM §4.2 — seção Histórico                 |
| 8.3 | Só gerente pode excluir               | ✅     | PLM §9 — delete só admin                   |

### 9. Comentários e Notificações

| #   | Feature ISA                                  | Status | Ref. Ambaril                            | Notas                            |
| --- | -------------------------------------------- | ------ | --------------------------------------- | -------------------------------- |
| 9.1 | **Chat por produto** (comentários, @mention) | ⚠️     | Tarefas §US-11 — comentários por TAREFA | **GAP:** Sem comentários no PLM. |
| 9.2 | @mention com notificação                     | ⚠️     | Tarefas §R18 — sem @mention granular    |                                  |
| 9.3 | Sininho de notificações                      | ✅     | Flare — in-app + Discord                | Mais sofisticado.                |
| 9.4 | **Lembretes manuais**                        | ❌     | —                                       | **GAP:** Sem lembretes avulsos.  |

### 10. Controle de Acesso

| #    | Feature ISA                          | Status | Ref. Ambaril            | Notas                            |
| ---- | ------------------------------------ | ------ | ----------------------- | -------------------------------- |
| 10.1 | Acesso Gerente (total)               | ✅     | admin role              |                                  |
| 10.2 | Acesso Visual (só leitura)           | ⚠️     | pm role = read-only PLM | Sem role "viewer-only" genérico. |
| 10.3 | Acesso Time (upload/input)           | ✅     | operations role         |                                  |
| 10.4 | **Acesso Fornecedor** (só sua etapa) | ❌     | Sem role supplier       | **GAP SIGNIFICATIVO.**           |

### 11-12. Assistente e ERP

| #    | Feature ISA                            | Status      | Ref. Ambaril                | Notas                 |
| ---- | -------------------------------------- | ----------- | --------------------------- | --------------------- |
| 11.1 | ZISA chatbot (help/onboarding)         | ⚠️          | Astro = analítica, não help | Falta help system.    |
| 11.2 | Base de conhecimento (artigos, vídeos) | ❌          | —                           |                       |
| 12.1 | Integração ERP para estoque            | ✅ (nativo) | PLM §7.1                    | **VANTAGEM AMBARIL.** |

---

## 3. Features Exclusivas do Ambaril (21)

| #   | Feature                                       | Módulo      |
| --- | --------------------------------------------- | ----------- |
| A1  | 11 estágios com validação e auto-advance      | PLM         |
| A2  | 3 tiers de alerta escalonados + Discord       | PLM         |
| A3  | Score de confiabilidade de fornecedor         | PLM         |
| A4  | Rating de fornecedor (4 dimensões)            | PLM         |
| A5  | Log de contatos com fornecedores              | PLM         |
| A6  | Gestão de matéria-prima com alertas de compra | PLM         |
| A7  | Análise de custos detalhada                   | PLM         |
| A8  | Rework tracking                               | PLM         |
| A9  | Pilot production + champion detection         | PLM         |
| A10 | Votação interna de produto                    | PLM         |
| A11 | Pipeline de validação (4 camadas)             | PLM         |
| A12 | Production Playbooks                          | PLM         |
| A13 | Gantt como view principal                     | Tarefas     |
| A14 | "My Day" view                                 | Tarefas     |
| A15 | Modo Foco                                     | Tarefas     |
| A16 | PCP↔Tarefas bidirecional                      | Tarefas     |
| A17 | Task Playbooks                                | Tarefas     |
| A18 | Meeting Management + AI summary               | Tarefas     |
| A19 | Stock entry mobile                            | PLM         |
| A20 | Daily summary Discord                         | PLM+Tarefas |
| A21 | Subtarefas e dependências                     | Tarefas     |

---

## 4. Gaps por Prioridade

### Alta (4)

| #   | Gap                              | Sugestão                                |
| --- | -------------------------------- | --------------------------------------- |
| G1  | Etapas NÃO personalizáveis       | tenant_stages table                     |
| G2  | Sem portal de fornecedor         | Role supplier com acesso por link/token |
| G3  | Sem ficha técnica como documento | pcp.product_specs + PDF generator       |
| G4  | Sem campos customizáveis         | custom_fields JSONB                     |

### Média (7)

G5 Kanban de produtos por etapa, G6 Mapa de coleção, G7 View catálogo, G8 Comentários no OP, G9 Propriedades de coleção, G10 Tabela de medidas, G11 Lembretes manuais

### Baixa (3)

G12 Mix agregado, G13 Help integrado, G14 Role viewer-only

---

## 5. Workflow do Marcus → Ambaril

| Etapa                          | Módulo Ambaril              | Status                   |
| ------------------------------ | --------------------------- | ------------------------ |
| 1. Brainstorm/moodboard/paleta | Tarefas (Fase 0) + DAM      | ✅                       |
| 2. Desenvolvimento peça a peça | Tarefas                     | ✅                       |
| 3. PDF de coleção              | PLM + DAM                   | ⚠️ Não gera PDF          |
| 4. Envio para modelista        | PLM stage 2                 | ⚠️ Sem portal fornecedor |
| 5. Piloto                      | PLM stage 3 + Pilot OPs     | ✅ Superior à ISA        |
| 6. Aprovação                   | PLM stage 4 + votação       | ✅ ISA não tem           |
| 7. Produção terceirizada       | PLM stages 7-9              | ✅                       |
| 8. **PCP (dor principal)**     | PLM timeline + alertas + MP | ✅ Resolve diretamente   |
| 9. Recebimento + lançamento    | PLM mobile + ERP            | ✅                       |

## 6. Perguntas do Marcus

| Pergunta                                                  | Resposta Ambaril                                                     |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| "A gente tá simbolando com os prazos... comprar material" | PLM §R25 — purchase_deadline automática + alertas                    |
| "Controle de estoque, matéria-prima, rendimento"          | PLM §4.7/4.8 — "200m necessários, 50m em estoque, comprar até dia X" |
| "A gente usa Monday, Trello, Jira"                        | Tarefas substitui com Gantt+Kanban+PCP integration                   |
| "Preciso de ERP focado em moda"                           | Ambaril ERP projetado para streetwear DTC                            |

## 7. Vantagem Estratégica

ISA é APENAS PLM. Marcus precisaria ISA + TOTS + Monday = 3 ferramentas sem integração. Ambaril = tudo integrado. **Sem contrato de fidelidade** (ISA = 12 meses).
