# Ambaril — Gold Standard de Implementação com IA

> Documento permanente. Toda sessão de implementação DEVE seguir estas regras.
> Baseado em 25+ fontes: Anthropic Agentic Coding 2026, Addy Osmani, Thoughtworks SDD, Blake Crosley (50 sessions), Continue.dev, StackOne, CodeRabbit.

## 1. Metodologia: Vertical Slices + Waves + Gates

### O Problema do Phase 1 (o que NÃO fazer)

```
Wave 1: TODOS os schemas → Wave 2: TODOS os backends → Wave 3: TODAS as pages
Resultado: 160 arquivos, ZERO fluxos testáveis. Marcus não conseguiu avaliar nada.
```

### O Padrão Ouro (o que fazer)

```
Slice 1: "Ana Clara vê pedidos e marca como enviado"
  → schema (só tabelas necessárias) + action + 1 página
  → FUNCIONA. Marcus testa. Commit.

Slice 2: "Ana Clara vê estoque com alertas"
  → schema (adiciona o necessário) + action + 1 página
  → FUNCIONA. Marcus testa. Commit.
```

### Definições

| Conceito       | Definição                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------- |
| **Slice**      | 1 jornada completa de usuário (DB→backend→UI). Testável isoladamente. 20-45 min de AI coding. |
| **Wave**       | Grupo de 3-5 slices de um mesmo módulo. Gate de teste no final.                               |
| **Gate**       | Marcus testa no browser após cada wave. Sem aprovação = não avança.                           |
| **Module MVP** | 3-5 waves que cobrem as jornadas essenciais. Dados reais. Usável.                             |

### Ciclo por Slice

```
Marcus descreve jornada (1 frase)
  → AI implementa slice (schema + action + page, 20-45 min)
  → Marcus testa no browser (~5-10 min)
  → OK → commit | NOK → feedback texto → AI ajusta → re-teste
```

## 2. Parâmetros de Sessão

| Parâmetro                | Valor                         | Fonte                |
| ------------------------ | ----------------------------- | -------------------- |
| Tasks por wave           | 3-5                           | Consenso indústria   |
| Duração máxima de sessão | 45 min antes de compactar     | Blake Crosley        |
| Degradação de qualidade  | ~60% utilização do contexto   | Stanford/UC Berkeley |
| Max agentes paralelos    | 3-5 (3 focados > 5 dispersos) | Addy Osmani          |

### Ralph Loop (anti-saturação)

```
Pick task → Implement → Validate (tsc+lint) → Commit → Reset context → Repeat
```

Nunca acumular múltiplas tarefas sem commit intermediário. Cada slice termina com validação e commit.

## 3. Quality Gates

| Gate       | Verifica                                        | Quando               |
| ---------- | ----------------------------------------------- | -------------------- |
| **Gate 0** | Spec com Simulação Dia 1 existe                 | Antes de cada módulo |
| **Gate 1** | `tsc --noEmit` + `eslint --quiet` + sem secrets | Cada commit          |
| **Gate 2** | Diffs revisados + integration check             | Cada wave            |
| **Gate 3** | **Marcus testa no browser**                     | Fim de cada wave     |

**Fato crítico:** AI gera 1.7x mais bugs que humanos (CodeRabbit 2025). Gates NÃO são opcionais.

### Definition of Done

- ❌ `tsc --noEmit` passa — necessário mas **NÃO SUFICIENTE**
- ✅ Marcus testou no browser com dados reais — **ÚNICO critério real**

## 4. Anti-Patterns Proibidos

| Anti-Pattern                          | Correção                                                    |
| ------------------------------------- | ----------------------------------------------------------- |
| Waves horizontais (schema→backend→UI) | **Fatias verticais** (1 jornada completa por vez)           |
| Type-check como Definition of Done    | **Marcus testou no browser**                                |
| Páginas vazias visíveis               | **Progressive disclosure** — página só aparece se tem dados |
| Mega-session (tudo de uma vez)        | **1 sessão = 1 propósito**, max 45 min                      |
| Pushing through context decay         | **Reset com handoff document**                              |
| Kitchen sink session                  | **Não misturar** research + coding + debug na mesma sessão  |
| Implementar sem spec                  | **Gate 0** — Simulação Dia 1 existe antes de codar          |
| Ignorar feedback do Marcus            | **Gate 3** é bloqueante — sem aprovação = não avança        |

## 5. Regras de Implementação

### 5.1 Simulação Dia 1 (obrigatória por módulo)

Antes de implementar qualquer módulo, documentar em 1 parágrafo:

> "No primeiro dia, [PERSONA] abre o Ambaril e vê [O QUE]. Ela [FAZ O QUE] e o resultado é [RESULTADO]. Isso resolve [DOR ATUAL] que hoje é feito via [FERRAMENTA ATUAL]."

### 5.2 Fatias Verticais

Cada slice DEVE conter:

1. **Schema** — apenas as tabelas necessárias para esta jornada
2. **Server Action/API** — lógica de negócio para esta jornada
3. **UI** — 1 página funcional com dados reais
4. **Validação** — `tsc --noEmit` + `eslint --quiet`

### 5.3 Progressive Disclosure

- Página só aparece no sidebar se o módulo tem dados
- Setup wizard guia o primeiro uso
- Empty states com call-to-action claros ("Conecte o Shopify para importar produtos")

### 5.4 Mobile-First para Operações

Fluxos da Ana Clara (logistics) e Tavares (PCP) DEVEM ser mobile-optimized:

- Sticky bottom buttons
- Large touch targets (min 44px)
- Simplified views para celular

### 5.5 Integration-First

- Camada 0: importar dados existentes do tenant (Shopify, Yever, etc.)
- Nunca começar com formulários manuais se dados já existem em outra ferramenta
- "Adopt Running Operation" — tenant já tem loja rodando

## 6. Workflow com Marcus

### Antes da Sessão

1. Marcus descreve jornada em texto (1-3 frases)
2. AI confirma entendimento e estima 1-3 slices

### Durante a Sessão

1. AI implementa slice (20-45 min)
2. AI roda Gate 1 (`tsc` + `eslint`)
3. AI reporta: "Slice pronto, teste em [URL]"
4. Marcus testa (~5-10 min)
5. OK → commit | NOK → feedback → ajuste → re-teste

### Fim da Sessão

1. AI cria handoff document se necessário
2. Git status limpo (tudo commitado ou stashed)
3. Próximas tarefas documentadas

## 7. Checklist Rápido (copiar para cada sessão)

```
□ Simulação Dia 1 existe para o módulo?
□ Slice está descrito em 1 frase?
□ Schema contém APENAS tabelas necessárias?
□ Server action + página implementados?
□ tsc --noEmit sem erros?
□ eslint --quiet sem erros?
□ Nenhum secret hardcoded?
□ Marcus testou no browser?
□ Commit feito com mensagem descritiva?
□ Contexto <60% utilizado? (se não, reset)
```

---

_Criado em 2026-03-31. Baseado nos aprendizados do Phase 1 Creators e 25+ fontes de best practices._
