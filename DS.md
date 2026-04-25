# Ambaril Design System

> **Versão:** 3.3
> **Última atualização:** Abril 2026
> **Fonte de verdade** para toda decisão visual e comportamental no projeto. Se algo contradiz este arquivo, este arquivo ganha.

---

## 0. Uso Deste Documento

### 0.1 Contrato de documentos

O sistema de design Ambaril agora opera com dois artefatos complementares:

- **`DS.md` (este arquivo):** documento normativo completo para humanos. Explica princípios, contexto, regras visuais, comportamento, responsividade e posicionamento.
- **`../DESIGN.md`:** companion **LLM-first**. Resume as regras operacionais em formato mais rígido para geração consistente de UI por modelos.

**Precedência:**

- Se houver divergência, **`DS.md` vence**.
- `DESIGN.md` simplifica e operacionaliza; não redefine a identidade.
- Mudanças de regra nascem aqui primeiro e depois são refletidas no companion.

### DS.md ↔ DESIGN.md Relationship

| File          | Purpose                                                                                            | Length       | Audience                        |
| ------------- | -------------------------------------------------------------------------------------------------- | ------------ | ------------------------------- |
| **DS.md**     | Source of truth. Brand research, detailed rationale, component recipes, energy levels, do's/don'ts | ~1,500 lines | Human designers, deep reference |
| **DESIGN.md** | LLM-optimized derivative. Google spec format: YAML tokens + 8 concise sections                     | ~200 lines   | AI agents during implementation |

**Workflow:** DS.md → `node scripts/ds-to-design.mjs` → DESIGN.md

- Edit DS.md for brand/design decisions
- Run converter to regenerate DESIGN.md tokens
- DESIGN.md markdown body is hand-maintained (concise summaries)
- On divergence, DS.md wins
- CI runs `node scripts/ds-to-design.mjs --check` to detect drift

### 0.2 Camadas de leitura

Para reduzir ambiguidade entre marca, produto e geração por IA, toda decisão deve identificar em qual camada está operando:

- **Brand:** tom, clima, memória e posicionamento
- **Product UI Rules:** layout, componentes, contraste, motion e responsividade
- **LLM Consumption Notes:** instruções operacionais para agentes, prompts e geração de interface

### 0.3 Regras de consumo por IA

Ao usar este sistema de design como entrada para geração de UI:

- **Sempre** usar tokens semânticos e nomes de papel; evitar hex direto fora da seção de tokens
- **Sempre** aplicar o nível de energia da tela antes de estilizar componentes
- **Sempre** escolher uma ação principal por área
- **Nunca** introduzir uma segunda identidade visual para IA, automações ou insights
- **Nunca** usar metáfora de marca para compensar falta de clareza funcional
- **Quando houver dúvida, preferir** familiaridade operacional, contraste e contenção

### 0.4 Referências visuais

Os screenshots em `../app-design-references/curated` são parte do sistema. Eles não substituem as regras, mas reduzem ambiguidade de composição, densidade e energia visual.

## 1. Marca

### Nome

- **Escrita:** Ambaril
- **Casing:** Title case sempre. Nunca lowercase, nunca ALL CAPS, nunca camelCase.
- **Pronúncia:** am · BA · ril (tônica no meio)
- **Origem:** ambar (mundo, destino) + ril (brilho). "O brilho do mundo."

### Wordmark

- **Fonte:** DM Sans
- **Weight:** 400 (Regular)
- **Letter-spacing:** +0.02em
- **Tamanho mínimo:** 14px em tela, 8pt em impressão
- **Espaço seguro:** a altura do "A" como padding mínimo em todos os lados
- **Sobre fundo claro (light mode):** cor `--text-white` — em light = `#0F172A` (preto). Máximo contraste.
- **Sobre fundo escuro (dark mode):** cor `--text-white` — em dark = `#F7F8FA` (branco). Máximo contraste.
- O token `--text-white` é **semântico**: "máximo contraste com o fundo", não cor literal.

### Taglines aprovadas

| Tagline                            | Uso                                         |
| ---------------------------------- | ------------------------------------------- |
| O brilho de ver tudo.              | Primária. Hero do site, assinatura de marca |
| Um sistema. Todo o seu negócio.    | Funcional. Header, ads de conversão         |
| Sem pontos cegos.                  | Produto. Benefício direto. Campanhas        |
| Built by operators, for operators. | Credibilidade. Posicionamento global        |
| From dark to data.                 | Conceitual. Qualquer idioma                 |

### Linguagem de marca

Ambaril é uma marca de **autoridade operacional com gosto cultural**. A camada simbólica existe, mas fica em segundo plano: ela orienta clima e memória, não fluxo, layout ou legibilidade.

**A marca deve soar:**

- precisa
- premium
- contida
- confiante
- inteligente sem performar "genialidade"

**A marca não deve soar:**

- corporativa-genérica
- fantasiosa
- teatral
- cyber/sci-fi
- editorial-luxo vazia

**Regra de separação:**

- **Brand language** pode usar "brilho", "ver tudo", "sem pontos cegos", "from dark to data".
- **Product UI rules** nunca dependem de metáfora para serem entendidas ou implementadas.
- Se houver conflito entre poesia de marca e clareza de produto, a clareza vence.

---

## 2. Paleta — Moonstone

Filosofia: **sem accent colorido**. O brilho vem do contraste entre superfícies, gradientes sutis e luz/sombra — não de cor. Cores semânticas existem só pra comunicar estado.

### 2.0 Filosofia de tema

- **Light = default** (workhorse diário). Dark = opt-in (preferência pessoal, ambiente escuro).
- **System** = respeita `prefers-color-scheme` do OS.
- Mesmos nomes de token, valores diferentes por tema. Código consome `var(--token)`, nunca hex direto.
- Regra: se funciona em light, funciona em dark — os tokens garantem.

**Stack de tema:**

- `next-themes`: `attribute="class"`, `defaultTheme="light"`, `enableSystem`
- Tailwind v4: `@custom-variant dark (&:where(.dark, .dark *))`
- Cookie `ambaril_theme` + `localStorage` para persistência SSR-safe
- Script bloqueante no `<head>` para prevenir FOWT (Flash of Wrong Theme)
- Seletor: Light | Dark | System — na sidebar (bottom) ou Settings

### 2.1 Backgrounds

| Token           | Light     | Dark      | Uso                                         |
| --------------- | --------- | --------- | ------------------------------------------- |
| `--bg-void`     | `#F7F8FA` | `#07080B` | Fundo da página, nível mais profundo        |
| `--bg-base`     | `#FFFFFF` | `#0C0E13` | Cards de primeiro nível, sidebar            |
| `--bg-raised`   | `#F3F4F6` | `#101216` | Cards elevados, inputs, dropdowns           |
| `--bg-surface`  | `#E8EAF0` | `#16181F` | Hover states, popovers, segunda camada      |
| `--bg-elevated` | `#FFFFFF` | `#1C1F28` | Tooltips, menus flutuantes, terceira camada |

### 2.2 Borders

| Token              | Light                 | Dark      | Uso                                            |
| ------------------ | --------------------- | --------- | ---------------------------------------------- |
| `--border-subtle`  | `rgba(15,23,42,0.06)` | `#1E2129` | Separadores entre áreas, borders de cards      |
| `--border-default` | `rgba(15,23,42,0.10)` | `#262A34` | Borders de inputs, tabelas, divisores          |
| `--border-strong`  | `rgba(15,23,42,0.18)` | `#333844` | Hover borders, focus rings, separadores fortes |

Light usa `rgba()` baseado em `#0F172A` (slate-900) — borders adaptam a qualquer superfície.

### 2.3 Text

| Token              | Light     | Dark      | Uso                                                   |
| ------------------ | --------- | --------- | ----------------------------------------------------- |
| `--text-ghost`     | `#94A3B8` | `#3A3F4C` | Disabled, placeholders inativos                       |
| `--text-muted`     | `#64748B` | `#5C6170` | Labels terciários, timestamps, metadados              |
| `--text-secondary` | `#475569` | `#7C8293` | Texto de suporte, descrições, sidebar inativo         |
| `--text-tertiary`  | `#475569` | `#A8AEBB` | Corpo de texto principal                              |
| `--text-primary`   | `#334155` | `#D0D4DE` | Texto de destaque, valores de dados                   |
| `--text-bright`    | `#1E293B` | `#E8EAF0` | Headlines H2/H3, texto enfatizado                     |
| `--text-white`     | `#0F172A` | `#F7F8FA` | Headlines H1, wordmark, valores KPI, máximo contraste |

`--text-white` = "máximo contraste com o fundo". Em light = preto, em dark = branco. Nome semântico, não cor literal.

**WCAG AA (light mode, contra #FFFFFF):**
`--text-white` 15.4:1 · `--text-bright` 12.6:1 · `--text-primary` 8.6:1 · `--text-secondary` 5.9:1 · `--text-muted` 4.6:1 · `--text-ghost` 3.0:1 (decorativo)

### 2.4 Botão Primário & Contraste Local

| Token                 | Light     | Dark      | Uso                                 |
| --------------------- | --------- | --------- | ----------------------------------- |
| `--btn-primary-bg`    | `#0F172A` | `#F7F8FA` | Fill do Button primary (Slate dark) |
| `--btn-primary-text`  | `#FFFFFF` | `#0C0E13` | Texto sobre btn-primary             |
| `--btn-primary-hover` | `#1E293B` | `#FFFFFF` | Hover state do Button primary       |

**Regras de uso:**

- **Contraste Local:** Botão primário = elemento mais escuro em light / mais claro em dark. Slate dark (#0F172A) mantido.
- Botões de ação tipada usam cores semânticas: verde (`--success`) para confirmar/aprovar, vermelho (`--danger`) para destruir/excluir, etc.
- **Paleta Moonstone:** A interface é puramente guiada pela paleta Moonstone, sem cores de sotaque (accent) além das semânticas. O brilho vem do contraste e da precisão, não da cor.

### 2.x Sistema Dual de Cor

O Ambaril usa dois sistemas de cor complementares. Cores = técnicas, não estéticas.

#### Sistema Semântico (vívido, consequência)

Cores de alta saturação para comunicar estado e consequência de ação.

| Token       | Light     | Dark      | Papel                                   |
| ----------- | --------- | --------- | --------------------------------------- |
| `--success` | `#16A34A` | `#3ECF8E` | Confirmar, aprovar, completar, positivo |
| `--danger`  | `#DC2626` | `#EF4444` | Destruir, erro, negativo                |
| `--warning` | `#D97706` | `#F5A524` | Atenção, urgente, review                |
| `--info`    | `#2563EB` | `#60A5FA` | Link, informacional, focus              |

Uso: botões de ação tipada, alertas, KPI deltas, status indicators.

#### Sistema Organizacional (muted, segmentação)

Paleta de 8 cores muted para categorização. Saturação baixa (~0.04-0.08 oklch) para não conflitar com semânticas vívidas. Cores NÃO vinculadas a módulos específicos — são livres para segmentação contextual.

| Nome            | Light bg  | Light text | Dark bg   | Dark text | Papel típico        |
| --------------- | --------- | ---------- | --------- | --------- | ------------------- |
| `--org-slate`   | `#F1F5F9` | `#475569`  | `#1E293B` | `#94A3B8` | Default/neutral     |
| `--org-blue`    | `#EFF6FF` | `#1D4ED8`  | `#1E3A5F` | `#93C5FD` | Info category       |
| `--org-violet`  | `#F5F3FF` | `#6D28D9`  | `#2E1065` | `#C4B5FD` | Creative/design     |
| `--org-rose`    | `#FFF1F2` | `#BE123C`  | `#4C0519` | `#FDA4AF` | Hot/urgent category |
| `--org-amber`   | `#FFFBEB` | `#B45309`  | `#451A03` | `#FCD34D` | Warning category    |
| `--org-emerald` | `#ECFDF5` | `#047857`  | `#064E3B` | `#6EE7B7` | Done/shipped        |
| `--org-cyan`    | `#ECFEFF` | `#0E7490`  | `#164E63` | `#67E8F9` | Communication       |
| `--org-orange`  | `#FFF7ED` | `#C2410C`  | `#431407` | `#FDBA74` | Priority            |

Uso: tags (Lead Hot/Cold/New), ícones de categoria, event colors em calendário, status de pipeline, badges de tipo.
Todas usáveis livremente — nenhuma "pertence" a um módulo.

### 2.5 Semânticas

| Token             | Light                  | Dark                    | Uso                                  |
| ----------------- | ---------------------- | ----------------------- | ------------------------------------ |
| `--success`       | `#16A34A`              | `#3ECF8E`               | Entregue, positivo, crescimento      |
| `--success-muted` | `rgba(22,163,74,0.08)` | `rgba(62,207,142,0.08)` | Background badges sucesso            |
| `--warning`       | `#D97706`              | `#F5A524`               | Preparando, atenção, alerta          |
| `--warning-muted` | `rgba(217,119,6,0.08)` | `rgba(245,165,36,0.08)` | Background badges alerta             |
| `--danger`        | `#DC2626`              | `#EF4444`               | Erro, pendência crítica, queda       |
| `--danger-muted`  | `rgba(220,38,38,0.08)` | `rgba(239,68,68,0.08)`  | Background badges erro               |
| `--info`          | `#2563EB`              | `#60A5FA`               | Informacional, link, destaque neutro |
| `--info-muted`    | `rgba(37,99,235,0.08)` | `rgba(96,165,250,0.08)` | Background badges info               |

Light usa tons 600-level (mais saturados, contraste em branco). Dark usa 400-level (brilhantes em fundo escuro).

### 2.6 Sombras

| Token         | Light                            | Dark                         |
| ------------- | -------------------------------- | ---------------------------- |
| `--shadow-sm` | `0 1px 2px rgba(15,23,42,0.04)`  | `0 1px 2px rgba(0,0,0,0.2)`  |
| `--shadow-md` | `0 2px 8px rgba(15,23,42,0.06)`  | `0 2px 10px rgba(0,0,0,0.2)` |
| `--shadow-lg` | `0 4px 16px rgba(15,23,42,0.08)` | `0 4px 20px rgba(0,0,0,0.3)` |
| `--shadow-xl` | `0 8px 32px rgba(15,23,42,0.12)` | `0 8px 32px rgba(0,0,0,0.4)` |

Light: sombras suaves com base slate. Dark: sombras profundas com base preta.

### 2.7 Elevação

| Tema  | Mecanismo                                    | Exemplo                                                |
| ----- | -------------------------------------------- | ------------------------------------------------------ |
| Light | Shadow + border sutil                        | Card: `--shadow-md` + `--border-subtle`                |
| Dark  | Surface color shift (mais claro = mais alto) | Card: `--bg-raised` → `--bg-surface` → `--bg-elevated` |

Em light, `--bg-base` e `--bg-elevated` são ambos `#FFFFFF` — diferenciação vem da sombra, não da cor. Em dark, cada nível de elevação muda a cor da superfície.

---

## 3. Tipografia

### Papéis das Famílias

| Família                 | Papel             | Onde aparece                                                                                         |
| ----------------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| **Bricolage Grotesque** | **Alma & Status** | H1 de módulo, KPI heroes, Display Numbers, **Labels de Seção (Uppercase Wide)**, Status Grades (A-F) |
| **DM Sans**             | **Interface**     | H2, H3, body, botões, inputs, tooltips, metadados secundários                                        |
| **DM Mono**             | **Precisão**      | Valores R$, IDs, códigos, datas, **Logs de Agentes**                                                 |

**Regra de scope do Bricolage (Opção A — Presença cirúrgica):**
Bricolage aparece em momentos de identidade e status — onde o impacto visual justifica a distinção. DM Sans assume a estrutura da interface. A raridade é intencional: frequência menor = impacto maior.

**Onde Bricolage APARECE:**

- H1 de cada módulo/página
- KPI heroes e Display Numbers (grandes)
- **Labels de Seção:** Uppercase, 10px, spacing 0.15em (Vibe técnica)
- **Status Grades:** Notas A-F de saúde dos setores
- Títulos de empty states

**Onde Bricolage NÃO aparece:**

- Corpo de texto, metadados
- Tabelas operacionais (exceto IDs se necessário)
- Sidebar links

**Importar:**

```html
<link
  href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400&display=swap"
  rel="stylesheet"
/>
```

### Escala tipográfica

| Nível   | Tamanho | Família             | Weight | Letter-spacing | Line-height | Uso                          |
| ------- | ------- | ------------------- | ------ | -------------- | ----------- | ---------------------------- |
| Display | 48px    | Bricolage Grotesque | 500    | -0.02em        | 1.1         | KPI heroes, Status Grades    |
| H1      | 32px    | Bricolage Grotesque | 500    | -0.01em        | 1.2         | Título de módulo/página      |
| H2      | 24px    | DM Sans             | 500    | 0              | 1.25        | Título de seção              |
| H3      | 18px    | DM Sans             | 500    | 0              | 1.35        | Título de card, subtítulo    |
| Body    | 14px    | DM Sans             | 400    | 0              | 1.65        | Texto corrido, descrições    |
| Small   | 12px    | DM Sans             | 400    | +0.01em        | 1.5         | Timestamps, metadados        |
| Label   | 10px    | Bricolage Grotesque | 600    | +0.15em        | 1.0         | Labels de seção (UPPERCASE)  |
| Mono    | 13px    | DM Mono             | 400    | 0              | 1.5         | Valores numéricos, IDs, Logs |

### Regras

- **H1 e Display** usam Bricolage Grotesque. Todo o resto usa DM Sans.
- **Labels de seção** são sempre uppercase com letter-spacing +0.04em em --text-muted
- **Valores numéricos** (R$, quantidades, IDs de pedido) usam DM Mono
- **Font smoothing per-theme:** Light mode usa `-webkit-font-smoothing: auto`. Dark mode usa `-webkit-font-smoothing: antialiased`.

---

## 4. ICP & Filosofia de Interface

### 4.1 ICP (Ideal Customer Profile)

O Ambaril é usado por e-commerces DTC brasileiros (qualquer vertical), R$100k–2M/mês, 5–30 pessoas. O dono decide a compra; o time operacional usa diariamente. Nível técnico intermediário (vêm de Shopify Admin + apps avulsos). 90% desktop, mobile é bônus.

Regras derivadas:

- Padrões **familiares** (tipo Shopify Admin): sidebar, cards, tabelas. Curva de aprendizado zero.
- Sensible defaults > customização avançada. O usuário não quer configurar — quer que funcione.
- **Cada módulo funciona standalone.** Onboarding, empty states e value delivery devem funcionar com 1 módulo ativo.
- Módulos inativos são visíveis mas dimmed — mostrar o que o cliente ganha ao ativar (loss aversion).

### 4.2 Princípios-guarda

Toda decisão de UI/UX deve passar por estes filtros. Se uma solução viola um deles, precisa de justificativa explícita.

1. **Design é alavanca de negócio** — cada tela impacta churn, TTV, LTV e eficiência operacional. Medir antes de decorar.
2. **Contraste cria prioridade** — o que tem mais contraste visual recebe a atenção primeiro. Se o usuário não sabe onde clicar, a hierarquia falhou.
3. **Uma ação principal por área** — dois CTAs com o mesmo peso geram indecisão. A interface sempre escolhe o foco.
4. **Carga cognitiva mínima** — menos escolhas, menos erro. Remover opções, texto e estados concorrentes é parte do trabalho.
5. **Bater o olho e agir** — operador de e-commerce decide em menos de 3 segundos. Dados vêm contextualizados e acionáveis.
6. **Progressive disclosure, nunca poder escondido** — complexidade pode ser progressiva, mas funcionalidades importantes não podem desaparecer.
7. **Familiaridade vence novidade em fluxos de trabalho** — padrões conhecidos (Shopify-like) reduzem curva de aprendizado e aumentam confiança.
8. **Color é semântico, não decorativo** — cor forte comunica estado, risco ou categoria. Nunca existe só para "embelezar".
9. **Personalização por role** — dashboard para todos = dashboard para ninguém. Cada role vê o que consegue influenciar.
10. **Modular com incentivo** — cada módulo funciona standalone, mas a interface mostra com clareza o valor dos módulos não ativados.

### 4.3 Anti-padrões

Evitar sistematicamente:

- UI enterprise genérica com gradientes SaaS previsíveis
- fantasia/lore vazando para fluxos operacionais
- glow, blur ou animação como decoração recorrente
- dashboards "bonitos" mas lentos de ler
- hero screens vazias que sacrificam clareza por atmosfera
- múltiplos elementos disputando atenção na mesma área
- usar IA como desculpa para criar uma segunda identidade visual fora do Moonstone

---

## 5. Componentes

### Library: shadcn/ui (Radix UI + cva + Tailwind)

- **Base:** Componentes Radix UI headless, estilizados com Tailwind e tokens Moonstone
- **Variantes:** class-variance-authority (cva) para variant/size mapping
- **Dark mode:** Tailwind `dark:` via `@custom-variant` + CSS vars Moonstone
- **Padrão:** Código copiado para `packages/ui`, não instalado como dependência runtime
- **Cantos:** 12px padrão para cards e modals, 8px para inputs e botões, 5-6px para barras e badges
- **Ícones:** Lucide React com `strokeWidth={1.75}` (mais refinado que o default 2). Sizes: 14px (badges, inline), 16px (buttons), 18px (sidebar, default), 20px (headers), 24px (empty states). Wrapper component: `@ambaril/ui/components/icon`

### Brilho (a centelha do -ril)

O painel tem 10-20% da energia visual da landing page. O brilho existe mas é contido e mecânico.

**Onde o brilho vive:**

| Elemento       | Técnica                                                   | Vibe                      |
| -------------- | --------------------------------------------------------- | ------------------------- |
| Astro Pulse    | Círculo de 6px com `animation: pulse`                     | Sistema está "respirando" |
| Status Grades  | Bricolage Display + Glow semântico                        | Nota como entidade viva   |
| KPI cards      | `linear-gradient` + radial-gradient (Light) / Halo (Dark) | Profundidade técnica      |
| Botão Primário | Halo periférico + Borda 1px luminosa                      | Peça física no cockpit    |
| Hover em cards | `box-shadow` profundo + border-color shift                | Foco tátil                |
| Charts (linha) | Curva bezier monotone, stroke 1.5px, luminous data point  | Precisão de sensor        |
| Sidebar ativo  | Border-left prata + Background shift sutil                | Orientação firme          |

**Onde o brilho NÃO vive:**

- Texto (nunca glow em parágrafos)
- Ícones (opacity change apenas)
- Backgrounds de página (sempre flat --bg-void)
- Borders normais (sempre sólidas, nunca gradiente)

**Limites de implementação:**

- No produto, brilho é exceção, não textura base.
- Motion padrão: 150-400ms. Só exceder isso quando a leitura do estado melhorar.
- Máximo de 1 elemento visualmente dominante por seção.
- Em telas Level 0, beleza vem de ritmo, contraste e ordem. Nunca de efeito.
- Se um efeito não melhora prioridade, orientação ou feedback, ele não entra.

### Padrões de Interação

| Ação do usuário               | Padrão                          | Detalhe                                                  |
| ----------------------------- | ------------------------------- | -------------------------------------------------------- |
| Click em item na lista/tabela | **Sheet lateral** (right slide) | Resumo/detalhes do item. Width: md (420px) ou lg (560px) |
| "Editar" dentro da sheet      | **Page full**                   | Navegação para página de edição completa                 |
| Criar novo item               | **Page full**                   | Formulário full-page com sidebar cards (Shopify-style)   |
| Confirmação/form curto        | **Modal centrado**              | Diálogo centralizado, max 3-5 campos                     |
| Configuração complexa         | **Modal dual-pane**             | Painel esquerdo (nav) + direito (conteúdo)               |
| Mobile sheet                  | **Fullscreen**                  | Sheet se adapta automaticamente para fullscreen          |

### Brilho per-theme

O brilho muda de **mecanismo** entre temas. Em dark, vem de gradientes claros sobre fundo escuro. Em light, vem de **sombras** e **borders sutis** que criam profundidade. A intensidade visual permanece 10-20% (painel) — só o mecanismo muda.

| Elemento            | Dark mode                                               | Light mode                                              |
| ------------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| KPI cards           | Gradiente `bg-raised → bg-surface` + radial branco 2.5% | `--shadow-md` + `--border-subtle` + bg `--bg-base`      |
| Hover em cards      | Shadow + border-color change                            | Shadow mais profunda (`--shadow-lg`)                    |
| Hover em table rows | `rgba(247,248,250, 0.015)`                              | `--bg-raised` (#F3F4F6)                                 |
| Botão primário      | `bg: #F7F8FA`, text `#0C0E13`, shadow-sm                | `bg: #0F172A`, text `#FFFFFF`, shadow-sm                |
| Sidebar ativo       | border-left `--border-strong` + 3% branco bg            | border-left `--border-strong` + bg `--bg-base` (branco) |
| Tooltips            | `--bg-elevated`, text `--text-primary`                  | Invertido: bg #0F172A, text #F7F8FA                     |

### Hierarquia Visual & Contraste

| Nível             | Light                                                             | Dark                                                             | Uso                         |
| ----------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------- |
| Primário          | bg `#0F172A`, text `#FFFFFF`, shadow-sm                           | bg `#F7F8FA`, text `#0C0E13`, shadow-sm                          | Ação principal (1 por área) |
| Secundário        | bg `#FFFFFF`, text `--text-primary`, border `rgba(15,23,42,0.15)` | bg transparent, text `--text-primary`, border `--border-default` | Ação complementar           |
| Terciário (ghost) | text `--text-secondary`, sem border                               | text `--text-secondary`, sem border                              | Cancelar, voltar            |

Em light, o botão primário é o **elemento mais escuro da tela** (#0F172A no branco). Em dark, é o **elemento mais luminoso da zona**. Princípio: máximo contraste local.

Regras adicionais:

- Fundo e sidebar são SEMPRE nível visual inferior ao conteúdo principal. Conteúdo é protagonista.
- Cards de ação (com CTA) > cards informativos (só display) na hierarquia visual.
- Problema de priorização visual = problema de contraste. Se o usuário não sabe onde clicar, o contraste está errado.

### Exceção controlada para AI

Astro, Genius e Pulse podem introduzir um **highlight state** adicional para insights urgentes, anomalias ou recomendações decisivas, mas sob regras estritas:

- O highlight não cria uma segunda identidade visual.
- A estrutura base continua Moonstone.
- A cor extra deve continuar semântica e contextual.
- O destaque deve parecer um sinal, não uma decoração.
- Se o insight não muda decisão, não merece exceção visual.

---

## 5.1 Energy Levels — Níveis de Energia Visual

Toda página do app tem um nível de energia visual definido. Isso elimina ambiguidade na implementação — cada tipo de tela sabe exatamente quanto "brilho" aplicar.

### Level 0 — Workhorse

**Onde:** Tabelas, forms, settings, listas, detail sheets, modais de confirmação.

**Regras:**

- Zero glow, zero gradiente, zero animação decorativa
- Borders `--border-subtle` em cards, `--border-default` em inputs
- Hover em rows: `--table-row-hover`
- Hover em cards: border `--border-default` → `--border-strong`
- Focus: `--input-focus-border` (ring 2px)
- Tipografia: DM Sans para tudo, DM Mono para valores numéricos
- **Dados são protagonistas. Interface é invisível.**
- **Boring by design:** beleza aqui vem de ordem, ritmo e legibilidade, nunca de efeito.

**Refs galeria:** `tables-1` (Ironclad contracts), `tables-2` (Setter performance), `enterprise-grade-3` (roles & activities), `great-shadcn-usage-2` (inbox dark)

### Level 1 — Ambient

**Onde:** Dashboards, KPI cards, sidebar ativa, navigation, chart cards, inbox/chat views.

**Regras:**

- Cards KPI: `--shadow-md` + border `--border-subtle`
- Hover em cards: `--shadow-lg` + `translateY(-1px)` + border `--border-default`. Transition `var(--transition-normal)`
- Active sidebar: border-left `--border-strong` + bg `--sidebar-item-active-bg`
- Charts: stroke 1.5px, area gradients, tooltip escuro (light) / elevado (dark)
- Greeting headers: Bricolage H1 + DM Sans body
- Page entrance: staggered fade-in (50ms increments entre elementos)
- **5% da energia visual da landing page.** Sombras e profundidade, nunca glow.

**Refs galeria:** `dashboards-1` (Mochi campaign detail), `dashboards-2` (Discovery Call stats), `dashboards-4` (links overview), `great-shadcn-usage-1` (Setter dashboard), `analytics-app-1` (prompts table)

### Level 2 — Moment

**Onde:** Empty states, onboarding wizard, status grades (A-F), first-run, auth (login/signup), módulo não ativado (upsell).

**Regras:**

- Títulos: Bricolage Grotesque Display (48px, weight 500)
- Ícone ou ilustração grande centralizada (48-64px)
- Gradiente sutil em card de destaque (radial-gradient 2-3% opacity)
- Glow semântico em status grades: `text-shadow` com cor semântica, 6-8px blur
- Espaçamento generoso: `--space-12` (48px) padding
- CTA único e inconfundível (botão primário com `--shadow-sm`)
- Animação: fade-in suave (400ms) — sem stagger complexo
- **15% da energia visual da landing page.** Gradientes sutis e tipografia display.

### Marketing surfaces

Landing pages, waitlist gates e páginas institucionais podem operar com energia visual acima do produto, mas seguem esta proporção:

- **60% autoridade de sistema**
- **25% gosto/aspiração**
- **15% atmosfera controlada**

Isso impede que a marca escorregue para fantasia, sci-fi ou "luxo vazio". Clareza comercial vem antes da ambientação.

**Refs galeria:** `dashboards-5-empty-state` (zero state com placeholders), `great-shadcn-usage-5` (Welcome page, Measured), `onboarding-2` (step wizard), `sign-in` (auth page)

### Mapeamento página → level

| Tipo de página                            | Level | Exemplo                                   |
| ----------------------------------------- | ----- | ----------------------------------------- |
| Data tables (pedidos, clientes, produtos) | 0     | Lista de pedidos do ERP                   |
| Forms (criar/editar entidades)            | 0     | Formulário de produto Shopify-style       |
| Settings, integrações                     | 0     | Página de configuração de providers       |
| Detail sheets (lateral 420/560px)         | 0     | Detalhes de um pedido                     |
| Modais de confirmação                     | 0     | "Confirmar exclusão?"                     |
| Dashboard/Beacon (KPI view)               | 1     | War Room do admin                         |
| Sidebar e navigation                      | 1     | Rail + hover expand                       |
| Chart cards e analytics                   | 1     | Gráfico de GMV 30 dias                    |
| Inbox/Chat view                           | 1     | Thread de WhatsApp/email                  |
| Calendário (mês/semana)                   | 1     | Calendário editorial                      |
| Empty states ("ative este módulo")        | 2     | "CRM disponível. Unifique sua base."      |
| Onboarding wizard                         | 2     | 4 steps de setup inicial                  |
| Auth (login, signup)                      | 2     | Tela de login com artefato de luz contido |
| Status grades e health scores             | 2     | Nota A-F de saúde do setor                |
| First-run welcome                         | 2     | "Bem-vindo ao Ambaril, Marcus."           |

### Energy Level → Page/Route Mapping

| Route/Page Type                              | Energy | Rationale                             |
| -------------------------------------------- | ------ | ------------------------------------- |
| `/app/erp/*` (orders, inventory, suppliers)  | L0     | Workhorse — data-heavy CRUD           |
| `/app/plm/*` (products, variants, materials) | L0     | Workhorse — structured data           |
| `/app/crm/*` (contacts, segments)            | L0     | Workhorse — lists and forms           |
| `/app/tarefas/*` (tasks, kanban)             | L0-L1  | Mostly workhorse, kanban gets ambient |
| `/app/dashboard`                             | L1     | Ambient — KPI cards, charts, overview |
| `/app/mensageria/*` (messages, campaigns)    | L1     | Ambient — conversational UI           |
| `/app/marketing/*` (campaigns, analytics)    | L1     | Ambient — visual data                 |
| `/app/creators/*`                            | L1     | Ambient — profile-centric             |
| `/app/dam/*` (digital assets)                | L1     | Ambient — gallery/grid layouts        |
| `/app/trocas/*` (exchanges/returns)          | L0     | Workhorse — transactional             |
| `/app/b2b/*` (wholesale)                     | L0     | Workhorse — B2B is functional         |
| `/onboarding/*`                              | L2     | Moments — first-run experience        |
| Empty states (any module)                    | L2     | Moments — encourage action            |
| Success/celebration screens                  | L2     | Moments — reinforce positive action   |
| `/auth/*` (login, register)                  | L1-L2  | Between ambient and moments           |

---

## 5.2 Component Recipes — Composições de Referência

Receitas concretas de como compor elementos do DS. Cada recipe define tokens, spacing, componentes e energy level. Claude deve consultar estas recipes antes de implementar qualquer composição similar.

### Recipe 1: KPI Card (Level 1)

```
┌─────────────────────────────┐
│ ·label (10px, Bricolage,    │  bg: --bg-base
│  uppercase, --text-muted)   │  border: --border-subtle
│                             │  shadow: --shadow-md
│  R$ 34.820                  │  radius: --radius-lg (12px)
│  (32px, DM Mono, --text-white, │  padding: --space-5 (20px)
│   tabular-nums)             │  hover: shadow-lg + translateY(-1px)
│                             │
│  ▲ +12.4% vs ontem          │  delta positivo: --success
│  (12px, DM Sans, semántica) │  delta negativo: --danger
└─────────────────────────────┘
```

- Grid de KPIs: `grid-cols-3` desktop, `grid-cols-2` tablet, `grid-cols-1` mobile
- Gap: `--space-4` (16px)
- Valor sempre em DM Mono com `font-variant-numeric: tabular-nums`
- Delta com seta (▲/▼) + cor semântica + período de referência

### Recipe 2: Data Table Row (Level 0)

```
┌──────┬────────────┬────────────┬──────────┬──────────┬─────────┐
│ □    │ #AM-4821   │ Lucas F.   │ 23/03/26 │ R$ 189   │ ● Entregue│
│      │ DM Mono    │ DM Sans    │ DM Mono  │ DM Mono  │ badge    │
│      │ --text-muted│ --text-primary│ --text-secondary│ --text-white│ --success│
└──────┴────────────┴────────────┴──────────┴──────────┴─────────┘
```

- Row height: 36-40px (`py-2 px-3`)
- Hover: `--table-row-hover`
- Header: 9-10px uppercase Bricolage, `--text-muted`, `letter-spacing: 0.12em`
- Checkbox: 16px, `--radius-sm` (6px)
- Status badge: pill com cores semânticas (bg muted + text vívido)
- Click em row → Sheet lateral (420px)
- Bulk selection: toolbar fixa top com contagem + ações

### Recipe 3: Form Shopify-style (Level 0)

```
┌─────────────────────────────────┬──────────────┐
│ SEÇÃO 1 (Bricolage label 10px)  │ STATUS       │
│ ┌─────────────────────────────┐ │ ┌──────────┐ │
│ │ Label (DM Sans 12px)       │ │ │ Rascunho▼│ │
│ │ [input, bg-raised, r-md]   │ │ └──────────┘ │
│ │                            │ │              │
│ │ Label                      │ │ TAGS         │
│ │ [input]                    │ │ ┌──────────┐ │
│ └─────────────────────────────┘ │ │ + tag    │ │
│ gap: --space-3 entre campos     │ └──────────┘ │
│ gap: --space-6 entre seções     │              │
│                                 │ METADATA     │
│ SEÇÃO 2                         │ ┌──────────┐ │
│ ┌─────────────────────────────┐ │ │ Criado em│ │
│ │ ...                        │ │ │ DM Mono  │ │
│ └─────────────────────────────┘ │ └──────────┘ │
└─────────────────────────────────┴──────────────┘
```

- Grid: `grid-cols-1 lg:grid-cols-[1fr_320px]` gap `--space-6`
- Sidebar cards: `sticky top-6`, gap `--space-4`
- Input bg: `--input-bg`, border: `--input-border`, focus: `--input-focus-border`
- Labels: DM Sans 12px, `--text-secondary`
- Section labels: Bricolage 10px uppercase, `--text-muted`, spacing 0.15em
- Validação inline: border `--danger` + mensagem 12px `--danger`

### Recipe 4: Empty State com Upsell (Level 2)

```
┌─────────────────────────────────────┐
│            (centro)                 │  bg: --bg-base
│                                     │  border: --border-subtle
│         [ícone 48px]                │  radius: --radius-lg
│     --text-muted, opacity 0.6       │  padding: --space-12 (48px)
│                                     │
│   CRM disponível.                   │  Bricolage 24px, --text-white
│   Unifique sua base de              │  DM Sans 14px, --text-secondary
│   clientes em um lugar.             │
│                                     │
│   [■ Ativar módulo]                 │  btn-primary, --shadow-sm
│                                     │
│   "Clientes que ativam CRM          │  DM Sans 12px, --text-muted
│    reduzem churn em 23%"            │  italic
└─────────────────────────────────────┘
```

- Sempre centralizado (exceção da regra de §14.4)
- Ícone: Lucide React, 48px, `--text-muted`, `opacity: 0.6`
- Título: Bricolage H2 (24px), sem ponto final
- Descrição: DM Sans body (14px), max-width 360px, `text-wrap: balance`
- CTA: único botão primário
- Loss aversion: frase curta em itálico com dado percentual

### Recipe 5: Chart Card (Level 1)

```
┌─────────────────────────────────────┐
│ FATURAMENTO ÚLTIMOS 30 DIAS         │  label: Bricolage 10px uppercase
│                                     │  bg: --bg-base
│  R$ 523.400                         │  shadow: --shadow-md
│  ▲ +8.2% vs mês anterior           │  padding: --space-5
│                                     │
│  ┌─────────────────────────────┐    │
│  │   ~~~~~/\~~~~~/\~~~~~       │    │  Recharts ResponsiveContainer
│  │  ~/         \/              │    │  type="monotone"
│  │ ~/                          │    │  stroke: --chart-line, 1.5px
│  │/                            │    │  area: --chart-area gradient
│  └─────────────────────────────┘    │  aspect-ratio com min-h/max-h
│  Jan    Fev    Mar    Abr           │  axis labels: DM Mono 9px
└─────────────────────────────────────┘
```

- Header: mesmo pattern do KPI card (label + valor + delta)
- Chart: `<ResponsiveContainer>`, `aspect-ratio: 16/9`, `min-height: 200px`
- Grid lines: `--chart-grid`, stroke 0.5px horizontal only
- Tooltip: bg `--chart-tooltip-bg`, text `--chart-tooltip-text`, radius 8px
- Multi-dataset: cores `--chart-1` a `--chart-8` para cada série

### Recipe 6: Flare Alert (Level 1)

```
┌─ ● ─────────────────────────────────┐
│ ⚠ Estoque crítico: Camiseta Preta  │  bg: --warning-muted
│   P — 3 unidades restantes.         │  border-left: 3px --warning
│   Ver produto →                     │  radius: --radius-md (8px)
└─────────────────────────────────────┘
```

- Borda esquerda 3px com cor semântica (warning/danger/info/success)
- Background: cor semântica muted (8% opacity)
- Ícone: Lucide correspondente (AlertTriangle, XCircle, Info, CheckCircle)
- Texto: DM Sans 13px, `--text-primary`
- Link: `--info`, underline on hover
- Dot animado (pulse 2s) para alertas ativos

### Recipe 7: Sidebar Active State (Level 1)

```
Rail (64px):
┌────────┐
│  [ic]  │  inactive: --text-secondary, opacity 0.7
│  [IC]  │  active: --sidebar-item-active-text, opacity 1.0
│  [ic]  │  hover: --sidebar-item-hover bg
└────────┘

Expanded (240px, on hover):
┌──────────────────────┐
│  [ic] Dashboard      │  active: bg --sidebar-item-active-bg
│  [ic] Pedidos        │          text --sidebar-item-active-text
│  [ic] Estoque        │          font-weight 500
│  [ic] CRM            │  inactive: text --text-secondary
└──────────────────────┘
```

- Rail: ícones centralizados, tooltip com label no hover
- Expand: transition `--sidebar-transition` (200ms cubic-bezier)
- Group labels: 9px uppercase, `--text-ghost`, visible only when expanded
- Dimmed modules (não ativados): opacity 0.4, badge "Novo" ou lock icon

### Recipe 8: Sheet Detail Lateral (Level 0)

```
                    ┌──────────────────────┐
                    │ ← Pedido #AM-4821    │  width: 420px (md) ou 560px (lg)
                    │                      │  bg: --bg-base
                    │ STATUS               │  border-left: --border-subtle
                    │ ● Entregue           │  shadow: --shadow-xl
                    │                      │
                    │ CLIENTE              │  section labels: Bricolage 10px
                    │ Lucas Ferreira       │  uppercase, --text-muted
                    │ lucas@email.com      │
                    │                      │
                    │ ITENS                │  values: DM Sans 14px
                    │ Camiseta Preta P  ×1 │  moneys: DM Mono 13px
                    │ Cap Khaki         ×1 │
                    │ ─────────────────    │
                    │ Total: R$ 287,00     │
                    │                      │
                    │ [Editar pedido]       │  btn secondary
                    └──────────────────────┘
```

- Slide-in da direita com transition 200ms
- Backdrop: overlay escuro 20% opacity (click fecha)
- Close: botão ← no header ou Escape
- Scroll interno independente do body
- Mobile: fullscreen (não lateral)

---

## 6. Formulários & Inputs

8 regras para todo formulário no Ambaril:

1. **Pergunte menos** — só o estritamente necessário por etapa. Steps progressivos para fluxos > 5 campos.
2. **Evite digitação** — priorizar seleção, auto-complete, toggles, paste nativo. Paste NUNCA bloqueado.
3. **Explique dados sensíveis** — CPF, CNPJ, dados fiscais: tooltip inline ou texto curto explicando "por quê". Aumenta taxa de preenchimento.
4. **Feedback inline** — validação em tempo real (onChange), sem esperar submit. Cores semânticas (`--success` / `--danger`).
5. **Progressive disclosure** — campos avançados sob expand/accordion. Valor antes da fricção.
6. **Inversão de sequência** — entregar valor antes do passo mais pesado. Mostrar resultado antes de pedir cadastro completo.
7. **Botão principal inconfundível** — hierarquia primária (seção 5). Shadow-sm. Botão secundário = terciário/ghost.
8. **Padrões de checkout** — cupons como recompensa comportamental (campo recolhido por padrão, não input fixo visível). Máxima redução de fricção em VIP Whitelist, order bump, split delivery.

### Layout de Form (Shopify-style)

**Forms complexos (criação/edição de entidades):**

```
┌────────────────────────────────┬──────────────┐
│ Form principal (2/3 width)     │ Sidebar cards│
│                                │ (1/3 width)  │
│ ┌ Seção 1 ─────────────────┐  │ ┌ Status ──┐ │
│ │ Campo 1                  │  │ │ Draft ▼  │ │
│ │ Campo 2                  │  │ └──────────┘ │
│ │ Campo 3                  │  │ ┌ Tags ────┐ │
│ └──────────────────────────┘  │ │ + tag    │ │
│ ┌ Seção 2 ─────────────────┐  │ └──────────┘ │
│ │ ...                      │  │ ┌ Metadata ┐ │
│ └──────────────────────────┘  │ │ Criado em│ │
│                                │ └──────────┘ │
└────────────────────────────────┴──────────────┘
```

- Grid: `grid-cols-1 lg:grid-cols-[1fr_320px]` com `gap-6`
- Form principal: seções verticais com `gap-6` entre seções
- Sidebar cards: sticky (`sticky top-6`) com `gap-4` entre cards
- Mobile: sidebar cards empilham abaixo do form (single column)

**Forms simples (configs, settings):**

- Seções verticais compactas, sem sidebar
- Seções com sticky anchor nav em forms longos (scroll-spy)

---

## 7. Dashboards

7 regras para todo dashboard e painel no Ambaril:

1. **Painel de carro** — foco na ação, não nos números. Mostrar o que importa ao bater o olho.
2. **Padrão F** — KPI principal no canto superior esquerdo. Leitura ocidental segue F-pattern.
3. **Ruído zero** — elemento não útil = carga cognitiva. Fundo/menu sempre subordinados ao conteúdo.
4. **Contextualização** — todo número com significado + enquadramento: "R$ 45k (+12% vs semana passada)", "Top 20% do segmento", "3 dias acima da meta".
5. **Personalização por role** — painéis default por role (tabela abaixo). Cada role vê seu KPI primário no top-left.
6. **Conduza para ação** — só o acionável pelo perfil. Não mostrar KPIs que o role não pode influenciar.
7. **Empty states que vendem** — módulo não ativado mostra preview + benefício + CTA "Ativar módulo". Nunca tela vazia. Dashboard com 1 módulo ativo ainda é útil.

### Painéis default por role (configurável por tenant)

| Role         | Painel default       | KPI primário (top-left)       |
| ------------ | -------------------- | ----------------------------- |
| `admin`      | War Room             | Faturamento hoje vs meta      |
| `pm`         | Marketing + Creators | GMV Creators + ROAS           |
| `operations` | PCP Timeline         | Ordens atrasadas              |
| `support`    | Inbox                | Tickets abertos + tempo médio |
| `finance`    | Financeiro           | DRE do mês + margem           |
| `creative`   | Marketing            | UGC pendente + calendário     |
| `commercial` | B2B                  | Pipeline atacado              |

---

## 8. Charts

### Library: Recharts

- **Tipo de linha:** `type="monotone"` (curvas bezier, nunca angular)
- **Stroke:** 1.5px, cor --text-primary para linha principal
- **Área:** gradiente 3-stop: 12% opacidade no topo → 4% no meio → 0% embaixo
- **Grid:** linhas horizontais em --border-subtle, stroke 0.5px, sem pontilhado
- **Labels de eixo:** DM Mono, 9px, cor --text-ghost
- **Data points:** só no valor mais recente (último ponto). Circle com fill --text-white, stroke --bg-raised, 2px
- **Barras:** gradiente vertical (mais escuro embaixo, mais claro em cima). Border-radius 5px no topo
- **Tooltips:** background --bg-elevated, border --border-default, text --text-primary, radius 8px
- **Responsivo:** usar `<ResponsiveContainer>` sempre

### Regras de charts

- Charts devem ser **bonitos e informativos**, não pálidos
- **Multi-dataset:** cores distintas para cada dataset — nunca monochrome
- Valores em DM Mono acima de cada barra quando há espaço
- Legendas em --text-secondary, dot de 8px com border-radius 2px
- Cores semânticas (verde/vermelho) para indicar direção (↑↓) em deltas
- KPIs: Numbers hero (Bricolage Grotesque) + sparkline sutil. Click expande para chart completo

### Paleta de chart colors (8 cores)

Baseadas no sistema organizacional mas com saturação adequada para legibilidade em chart. Cada dataset usa uma cor distinta.

| Token       | Light     | Dark      | Série                 |
| ----------- | --------- | --------- | --------------------- |
| `--chart-1` | `#2563EB` | `#60A5FA` | Primária (azul)       |
| `--chart-2` | `#7C3AED` | `#A78BFA` | Secundária (violeta)  |
| `--chart-3` | `#059669` | `#34D399` | Terciária (esmeralda) |
| `--chart-4` | `#EA580C` | `#FB923C` | Quarta (laranja)      |
| `--chart-5` | `#E11D48` | `#FB7185` | Quinta (rosa)         |
| `--chart-6` | `#0891B2` | `#22D3EE` | Sexta (ciano)         |
| `--chart-7` | `#CA8A04` | `#FACC15` | Sétima (âmbar)        |
| `--chart-8` | `#4F46E5` | `#818CF8` | Oitava (índigo)       |

### Tokens de chart per-theme

| Token                  | Light                 | Dark                     | Uso                         |
| ---------------------- | --------------------- | ------------------------ | --------------------------- |
| `--chart-line`         | `#334155`             | `#D0D4DE`                | Linha principal             |
| `--chart-area`         | `rgba(15,23,42,0.04)` | `rgba(247,248,250,0.04)` | Fill sob curva              |
| `--chart-grid`         | `rgba(15,23,42,0.06)` | `#1E2129`                | Linhas de grid              |
| `--chart-bar-top`      | `#64748B`             | `#A8AEBB`                | Topo do gradiente de barras |
| `--chart-bar-bottom`   | `#CBD5E1`             | `#262A34`                | Base do gradiente de barras |
| `--chart-tooltip-bg`   | `#0F172A`             | `#1C1F28`                | Tooltip background          |
| `--chart-tooltip-text` | `#F7F8FA`             | `#D0D4DE`                | Tooltip text                |

Em light mode, tooltips de chart são **escuros** (fundo #0F172A, texto claro) — inversão intencional para destaque. Em dark, seguem superfície elevada.

### Contextualização de dados

- Todo valor principal acompanhado de delta (% ou absoluto) + período de referência
- Tooltips com enquadramento: "R$ 12.400 — 15% acima da média dos últimos 30 dias"
- Legendas acionáveis quando possível: clicar na legenda filtra o dataset
- Números em DM Mono (já existente), deltas em cor semântica: `--success` para positivo, `--danger` para negativo

---

## 8.1 Tabelas — Padrões Avançados

### Modelo base: Shopify + CDO patterns

| Feature              | Detalhe                                                   |
| -------------------- | --------------------------------------------------------- |
| Filtros salváveis    | Pill chips acima da tabela, presets por role              |
| Inline row expand    | Click na row expande detalhes contextuais sem navegar     |
| Bulk actions         | Checkbox + toolbar fixa no topo com ações em lote         |
| Keyboard navigation  | `j`/`k` para navegar entre rows, `Enter` para abrir sheet |
| Sorting por coluna   | Click no header alterna asc/desc                          |
| Status badges inline | Cores semânticas vívidas (§2.5)                           |
| Tags inline          | Cores organizacionais muted (§2.x)                        |
| Avatar + name combos | Para colunas de pessoas/clientes                          |
| Expandable rows      | Detalhes contextuais sem sair da view                     |

### Dense table rows

- Height: 36-40px (`py-2 px-3`)
- Font: 13px (entre Body 14px e Small 12px)
- Header: 9-10px uppercase, `--text-muted`, Bricolage Grotesque
- Dividers: `--border-subtle` entre rows
- Hover: `--table-row-hover`

---

## 9. Navegação

### Desktop: Sidebar Rail + Hover Expand (Linear-style)

- **Rail (default):** 64px — só ícones Lucide (20px), centralizado
- **Expanded (on hover):** 240px — ícone + label com transição suave (200ms cubic-bezier)
- **Background:** --bg-base
- **Border direita:** 0.5px --border-subtle
- **Ícones:** Lucide React, 20px no rail (centralizado), 18px quando expanded
- **Item ativo:** background `--sidebar-item-active-bg` + font-weight 500 + text `--sidebar-item-active-text`. Sem border-left colored
- **Item hover:** background `--sidebar-item-hover`
- **Labels de grupo:** 9px, uppercase, --text-ghost, letter-spacing 0.12em — visíveis APENAS quando expanded
- **Agrupamento:** Principal (Dashboard, Pedidos, Estoque, CRM) → Operações (PCP, Fiscal, WhatsApp) → Comercial (Atacado, B2B) → Config
- **Role-adaptive:** sidebar mostra APENAS módulos relevantes para o role ativo. Admin vê tudo
- **Transição:** `width` transition com `overflow: hidden` nos labels. Tooltip mostra label no rail

### Command Palette (⌘K)

- **Trigger:** `Cmd+K` (macOS) / `Ctrl+K` (Windows/Linux)
- **Library:** cmdk (shadcn-style command dialog)
- **Funcionalidades:** buscar módulos, navegar entre páginas, ações rápidas por role
- **Visual:** Dialog centrado, input com ícone Search, lista de resultados com ícones + labels
- **Keyboard:** Arrow keys para navegar, Enter para selecionar, Escape para fechar
- **Bônus desktop:** nunca bloquear workflow mobile sem ⌘K

### Mobile: Bottom tab bar

- **Posição:** fixa no bottom
- **Items visíveis:** 5 (os mais usados pelo role do usuário)
- **Overflow:** ícone de menu (hamburger) no 5º slot abre drawer com todos os módulos
- **Adaptativa por role:** Ana Clara vê Logística primeiro, Slimgust vê Atendimento primeiro, Marcus vê Dashboard primeiro

### Tokens de sidebar per-theme

| Token                        | Light                 | Dark                     | Uso                 |
| ---------------------------- | --------------------- | ------------------------ | ------------------- |
| `--sidebar-bg`               | `#F7F8FA`             | `#0C0E13`                | Fundo da sidebar    |
| `--sidebar-item-hover`       | `#F3F4F6`             | `rgba(247,248,250,0.02)` | Hover state         |
| `--sidebar-item-active-bg`   | `#FFFFFF`             | `rgba(247,248,250,0.03)` | Item selecionado    |
| `--sidebar-item-active-text` | `#0F172A`             | `#E8EAF0`                | Texto do item ativo |
| `--sidebar-border`           | `rgba(15,23,42,0.08)` | `#1E2129`                | Border direita      |

Em light: sidebar cinza claro, item ativo branco — destaca por ser mais claro que o entorno. Em dark: item ativo por background sutil mais claro que vizinhos.

**Rail-specific tokens:**

| Token                      | Valor                                 | Uso                          |
| -------------------------- | ------------------------------------- | ---------------------------- |
| `--sidebar-rail-width`     | `64px`                                | Largura do rail (collapsed)  |
| `--sidebar-expanded-width` | `240px`                               | Largura expandida (on hover) |
| `--sidebar-transition`     | `200ms cubic-bezier(0.16, 1, 0.3, 1)` | Transição de expand/collapse |

### Princípios de navegação

- **Sidebar subordinada** — fundo e menu SEMPRE em nível visual inferior ao conteúdo. Conteúdo é protagonista, sidebar é mapa.
- **Fixa durante scroll** — sidebar desktop e bottom tab mobile fixos para manter orientação em conteúdo longo.
- **Progressive disclosure** — grupos colapsáveis. Módulos raramente usados pelo role ficam colapsados por padrão. Módulos não ativados pelo tenant ficam visíveis mas dimmed com badge "Novo" ou lock icon.
- **Layout admin padrão** — sidebar fixa + conteúdo com scroll independente. Padrão familiar para quem vem de Shopify Admin.

---

## 10. Responsividade

- **Approach:** Desktop-first. 90% do uso é desktop. Mobile funciona como bônus, não como requisito.
- **Breakpoints:** `sm: 640px` · `md: 768px` · `lg: 1024px` · `xl: 1280px`
- **Módulos mobile-functional (não mobile-first):** Logística/Expedição, Atendimento/Inbox, Aprovações rápidas.
- **Módulos desktop-only na v1:** Dashboard completo, Analytics, PCP timeline, Fiscal, CRM bulk actions, DAM.
- **KPI grid:** 4 colunas desktop → 2 colunas tablet → 1 coluna mobile
- **Charts:** manter proporção via ResponsiveContainer. Em mobile, charts empilham (1 coluna)
- **Tabelas:** scroll horizontal em mobile com coluna fixa (Pedido sempre visível)
- **Sidebar:** oculta em mobile, substituída por bottom tab bar
- **Complexidade proporcional ao device** — desktop mostra informação completa, mobile mostra ação principal. Só contar features visíveis/interativas no mobile.
- **Touch targets** — mínimo 44px, espaçamento mínimo 8px entre targets.
- **Ação sticky em mobile** — botão de ação principal sempre visível (sticky bottom). Não enterrar em menus.

---

## 11. Onboarding & Empty States

6 regras:

1. **Onboarding mal projetado = churn calculável** — cada dia extra de TTV é receita perdida. Tratar como alavanca de LTV/TTV.
2. **Onboarding por módulo** — cada módulo tem seu próprio checklist de ativação (3-5 passos). Não exigir onboarding de plataforma inteira.
3. **Empty states como oportunidade** — nunca tela vazia. Ilustração minimalista + texto direto + CTA único ("Criar primeiro X"). Tom: parceiro calmo.
4. **Módulos não ativados** — mostrar preview visual (screenshot/mockup) + 1 frase de benefício + CTA "Ativar". Loss aversion: "Clientes que ativam [módulo] reduzem X em Y%."
5. **Welcome contextual por role** — primeiro login mostra painel do role com guia inline (não modal bloqueante). Guia desaparece após completar checklist.
6. **Value-first + inversão de sequência** — mostrar valor antes de pedir dados. Se um setup tem 15 campos, pedir os 3 que geram valor visível primeiro, depois progressivamente pedir o resto.

---

## 12. Tom de Voz

Ambaril fala como um parceiro sênior — calmo, direto, sem decoração. Mostra os dados. Nunca vende. Nunca exclama. Nunca usa emoji em contexto operacional.

### Tom dual

| Modo                   | Quando                                           | Exemplo                                     |
| ---------------------- | ------------------------------------------------ | ------------------------------------------- |
| **Factual** (80%)      | Dados, alertas, operação, tabelas, forms         | "Ticket médio caiu 12% nos últimos 7 dias." |
| **Motivacional** (20%) | Conquistas, milestones, empty states, onboarding | "Primeiro envio feito." + leaderboard       |

- Streetwear só em easter eggs sutis (nunca no tom padrão)
- Micro-animações (staggered fades, sparkles, pulse) nos 20% de momentos spacious
- Sem ilustrações custom

### Princípios

- Fatos antes de opinião
- Números antes de adjetivos
- Ação antes de explicação
- Sem diminutivos
- Sem exclamação em dados
- Emoji só em contextos sociais (WhatsApp com cliente), nunca em dashboard ou notificação interna

### Exemplos

| Sim                                                                                   | Não                                                                          |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Ticket médio caiu 12% nos últimos 7 dias. As 3 coleções mais afetadas estão marcadas. | Opa! Parece que seus clientes estão gastando menos! Vamos investigar juntos? |
| 3 pedidos aguardando NF-e. Ana Clara precisa liberar.                                 | Você tem algumas notinhas fiscais pendentes! Que tal dar uma olhadinha?      |
| Coleção Verão esgotou em 4 dias. Velocidade 2.3x acima da média.                      | Parabéns! Sua coleção de Verão foi um SUCESSO!                               |
| Estoque de Camiseta Preta M: 12 unidades. Reposição sugerida: 50.                     | Cuidado! Seu estoque está acabando! Corre pra repor!                         |

### Tom em contextos especiais

| Contexto                | Exemplo                                                                  | Tom                            |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------------ |
| Empty state Dashboard   | "Sem dados ainda. Conecte sua primeira integração para ver o painel."    | Direto, sem emoji, com CTA     |
| Empty state lista vazia | "Nenhum pedido registrado. Quando o primeiro entrar, aparece aqui."      | Calmo, sem urgência artificial |
| Onboarding checklist    | "3 de 5 passos concluídos. Próximo: configurar alertas de estoque."      | Progresso, sem comemoração     |
| Feature não configurada | "Alertas de PCP desativados. Ative para receber notificações de atraso." | Factual, benefício claro       |
| Módulo não ativado      | "CRM disponível. Unifique sua base de clientes em um lugar."             | Benefício, sem pressão         |
| Erro de formulário      | "CPF inválido. Verifique os 11 dígitos."                                 | Específico, sem julgamento     |

---

## 13. Design Tokens (CSS)

Dois blocos: `:root` é Moonstone Light (default), `.dark` é Moonstone Dark (override). Tokens de font, radius e transition não mudam entre temas — ficam só em `:root`.

```css
:root {
  /* ===== MOONSTONE LIGHT (DEFAULT) ===== */

  /* Backgrounds */
  --bg-void: #f7f8fa;
  --bg-base: #ffffff;
  --bg-raised: #f3f4f6;
  --bg-surface: #e8eaf0;
  --bg-elevated: #ffffff;

  /* Borders */
  --border-subtle: rgba(15, 23, 42, 0.06);
  --border-default: rgba(15, 23, 42, 0.1);
  --border-strong: rgba(15, 23, 42, 0.18);

  /* Text */
  --text-ghost: #94a3b8;
  --text-muted: #64748b;
  --text-secondary: #475569;
  --text-tertiary: #475569;
  --text-primary: #334155;
  --text-bright: #1e293b;
  --text-white: #0f172a;

  /* Semantic */
  --success: #16a34a;
  --success-muted: rgba(22, 163, 74, 0.08);
  --warning: #d97706;
  --warning-muted: rgba(217, 119, 6, 0.08);
  --danger: #dc2626;
  --danger-muted: rgba(220, 38, 38, 0.08);
  --info: #2563eb;
  --info-muted: rgba(37, 99, 235, 0.08);

  /* Typography */
  --font-display: "Bricolage Grotesque", "DM Sans", -apple-system, sans-serif;
  --font: "DM Sans", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: "DM Mono", "SF Mono", "Fira Code", monospace;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 99px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 2px 8px rgba(15, 23, 42, 0.06);
  --shadow-lg: 0 4px 16px rgba(15, 23, 42, 0.08);
  --shadow-xl: 0 8px 32px rgba(15, 23, 42, 0.12);

  /* Sidebar */
  --sidebar-bg: #f7f8fa;
  --sidebar-item-hover: #f3f4f6;
  --sidebar-item-active-bg: #ffffff;
  --sidebar-item-active-text: #0f172a;
  --sidebar-border: rgba(15, 23, 42, 0.08);

  /* Buttons */
  --btn-primary-bg: #0f172a;
  --btn-primary-text: #ffffff;
  --btn-primary-hover: #1e293b;
  --btn-secondary-bg: #ffffff;
  --btn-secondary-text: #334155;
  --btn-secondary-border: rgba(15, 23, 42, 0.15);
  --btn-ghost-text: #475569;
  --btn-ghost-hover: #f3f4f6;

  /* Charts (base) */
  --chart-line: #334155;
  --chart-area: rgba(15, 23, 42, 0.04);
  --chart-grid: rgba(15, 23, 42, 0.06);
  --chart-bar-top: #64748b;
  --chart-bar-bottom: #cbd5e1;
  --chart-tooltip-bg: #0f172a;
  --chart-tooltip-text: #f7f8fa;

  /* Chart colors (multi-dataset) */
  --chart-1: #2563eb;
  --chart-2: #7c3aed;
  --chart-3: #059669;
  --chart-4: #ea580c;
  --chart-5: #e11d48;
  --chart-6: #0891b2;
  --chart-7: #ca8a04;
  --chart-8: #4f46e5;

  /* Organizational palette (muted, segmentation) */
  --org-slate-bg: #f1f5f9;
  --org-slate-text: #475569;
  --org-blue-bg: #eff6ff;
  --org-blue-text: #1d4ed8;
  --org-violet-bg: #f5f3ff;
  --org-violet-text: #6d28d9;
  --org-rose-bg: #fff1f2;
  --org-rose-text: #be123c;
  --org-amber-bg: #fffbeb;
  --org-amber-text: #b45309;
  --org-emerald-bg: #ecfdf5;
  --org-emerald-text: #047857;
  --org-cyan-bg: #ecfeff;
  --org-cyan-text: #0e7490;
  --org-orange-bg: #fff7ed;
  --org-orange-text: #c2410c;

  /* Tables */
  --table-header-bg: #f9fafb;
  --table-row-hover: #f9fafb;
  --table-border: rgba(15, 23, 42, 0.06);

  /* Inputs */
  --input-bg: #f3f4f6;
  --input-border: rgba(15, 23, 42, 0.12);
  --input-focus-border: #2563eb;

  /* Badge */
  --badge-bg: #f3f4f6;
  --badge-text: #334155;

  /* Spacing (base 4px) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;

  /* Sidebar rail */
  --sidebar-rail-width: 64px;
  --sidebar-expanded-width: 240px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;

  /* Font smoothing */
  -webkit-font-smoothing: auto;
  -moz-osx-font-smoothing: auto;
}

.dark {
  /* ===== MOONSTONE DARK ===== */

  /* Backgrounds */
  --bg-void: #07080b;
  --bg-base: #0c0e13;
  --bg-raised: #101216;
  --bg-surface: #16181f;
  --bg-elevated: #1c1f28;

  /* Borders */
  --border-subtle: #1e2129;
  --border-default: #262a34;
  --border-strong: #333844;

  /* Text */
  --text-ghost: #3a3f4c;
  --text-muted: #5c6170;
  --text-secondary: #7c8293;
  --text-tertiary: #a8aebb;
  --text-primary: #d0d4de;
  --text-bright: #e8eaf0;
  --text-white: #f7f8fa;

  /* Semantic */
  --success: #3ecf8e;
  --success-muted: rgba(62, 207, 142, 0.08);
  --warning: #f5a524;
  --warning-muted: rgba(245, 165, 36, 0.08);
  --danger: #ef4444;
  --danger-muted: rgba(239, 68, 68, 0.08);
  --info: #60a5fa;
  --info-muted: rgba(96, 165, 250, 0.08);

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 2px 10px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 4px 20px rgba(0, 0, 0, 0.3);
  --shadow-xl: 0 8px 32px rgba(0, 0, 0, 0.4);

  /* Sidebar */
  --sidebar-bg: #0c0e13;
  --sidebar-item-hover: rgba(247, 248, 250, 0.02);
  --sidebar-item-active-bg: rgba(247, 248, 250, 0.03);
  --sidebar-item-active-text: #e8eaf0;
  --sidebar-border: #1e2129;

  /* Buttons */
  --btn-primary-bg: #f7f8fa;
  --btn-primary-text: #0c0e13;
  --btn-primary-hover: #ffffff;
  --btn-secondary-bg: transparent;
  --btn-secondary-text: #d0d4de;
  --btn-secondary-border: #262a34;
  --btn-ghost-text: #7c8293;
  --btn-ghost-hover: rgba(247, 248, 250, 0.03);

  /* Charts (base) */
  --chart-line: #d0d4de;
  --chart-area: rgba(247, 248, 250, 0.04);
  --chart-grid: #1e2129;
  --chart-bar-top: #a8aebb;
  --chart-bar-bottom: #262a34;
  --chart-tooltip-bg: #1c1f28;
  --chart-tooltip-text: #d0d4de;

  /* Chart colors (multi-dataset) */
  --chart-1: #60a5fa;
  --chart-2: #a78bfa;
  --chart-3: #34d399;
  --chart-4: #fb923c;
  --chart-5: #fb7185;
  --chart-6: #22d3ee;
  --chart-7: #facc15;
  --chart-8: #818cf8;

  /* Organizational palette (muted, segmentation) */
  --org-slate-bg: #1e293b;
  --org-slate-text: #94a3b8;
  --org-blue-bg: #1e3a5f;
  --org-blue-text: #93c5fd;
  --org-violet-bg: #2e1065;
  --org-violet-text: #c4b5fd;
  --org-rose-bg: #4c0519;
  --org-rose-text: #fda4af;
  --org-amber-bg: #451a03;
  --org-amber-text: #fcd34d;
  --org-emerald-bg: #064e3b;
  --org-emerald-text: #6ee7b7;
  --org-cyan-bg: #164e63;
  --org-cyan-text: #67e8f9;
  --org-orange-bg: #431407;
  --org-orange-text: #fdba74;

  /* Tables */
  --table-header-bg: #101216;
  --table-row-hover: rgba(247, 248, 250, 0.015);
  --table-border: #1e2129;

  /* Inputs */
  --input-bg: #101216;
  --input-border: #262a34;
  --input-focus-border: #60a5fa;

  /* Badge */
  --badge-bg: #16181f;
  --badge-text: #a8aebb;

  /* Font smoothing */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Regra anti-flash (FOWT prevention)

Script bloqueante no `<head>`, antes de qualquer CSS/render:

```html
<script>
  (function () {
    var t =
      localStorage.getItem("ambaril_theme") ||
      document.cookie.match(/ambaril_theme=(\w+)/)?.[1];
    if (
      t === "dark" ||
      (!t && matchMedia("(prefers-color-scheme:dark)").matches)
    )
      document.documentElement.classList.add("dark");
  })();
</script>
```

---

## 14. Robustez de Layout

Regras obrigatórias para todo componente visual. Previnem quebra, sobreposição e inconsistência em diferentes viewports e tamanhos de conteúdo.

### 14.1 Spacing scale (base 4px) — Dense-first

**Filosofia: "Dense is home. Spacious is the breath."**
80% do app é dense (tabelas, forms, sidebar, filas). 20% é spacious (dashboard KPIs, onboarding, empty states, transições).

| Token        | Valor  | Uso típico                                                  |
| ------------ | ------ | ----------------------------------------------------------- |
| `--space-1`  | `4px`  | Gap entre ícone e texto, padding mínimo                     |
| `--space-2`  | `8px`  | **Default gap** entre elementos, padding badges             |
| `--space-3`  | `12px` | **Padding de cards** (dense), gap label-input, tooltips     |
| `--space-4`  | `16px` | **Padding de cards** (standard), gap de grid                |
| `--space-5`  | `20px` | Spacious mode: padding de cards em dashboard/empty          |
| `--space-6`  | `24px` | Spacious mode: padding de main content, margin entre seções |
| `--space-8`  | `32px` | Padding de main content (desktop lg+)                       |
| `--space-12` | `48px` | Padding de empty states                                     |
| `--space-16` | `64px` | Margin bottom para clearance do toggle/sticky               |

**Dense defaults (80% do app):**

| Contexto         | Antes        | Agora          |
| ---------------- | ------------ | -------------- |
| Card padding     | 20px         | 12-16px        |
| Table row height | ~48px (py-3) | 36-40px (py-2) |
| Default gap      | 16px         | 8-12px         |
| Sidebar item     | py-2         | py-1.5         |
| Form field gap   | 16px         | 12px           |

**Spacious exceptions (20% — dashboards, empty states, onboarding):**

| Contexto               | Valor           |
| ---------------------- | --------------- |
| Dashboard KPI cards    | 20-24px padding |
| Empty state containers | 48px padding    |
| Onboarding wizard      | 24-32px spacing |
| Confirmação dialogs    | 20px padding    |

**Regra:** usar APENAS estes valores. Nunca valores arbitrários (28px, 15px, 22px). Se um valor não encaixa, usar o mais próximo para baixo.

### 14.2 Overflow e truncamento

| Regra                                                                                                      | Aplicação                                                               |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Todo texto em container flex/grid** precisa de `min-width: 0`                                            | Flex children que contêm texto                                          |
| **Textos em espaço limitado** precisam de `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` | KPI labels, KPI values, card titles, sidebar items, table cells, badges |
| **Textos longos de corpo** usam `text-wrap: pretty`                                                        | Descrições, empty state text, form hints                                |
| **Headlines** usam `text-wrap: balance`                                                                    | H1, H2, page titles                                                     |
| **Tabelas** precisam de `min-width` + wrapper com `overflow-x: auto`                                       | Toda tabela com mais de 3 colunas                                       |
| **Tabela cells com dados variáveis** precisam de `max-width`                                               | Nomes de clientes, descrições (max-width: 160-200px)                    |

### 14.3 SVG e Charts

- **Sempre** usar `vector-effect: non-scaling-stroke` em linhas SVG — garante stroke consistente independente de viewBox
- Charts usam `aspect-ratio` com `min-height` e `max-height` — nunca altura fixa
- Gradientes de área via `<defs>` + `<linearGradient>` — não cor flat
- Grid lines: stroke 1px (non-scaling). Linhas de dados: stroke 1.5px (non-scaling)

### 14.4 Layout de componentes

| Regra                                     | Aplicação                                                      |
| ----------------------------------------- | -------------------------------------------------------------- |
| **Cards nunca centralizam conteúdo**      | Exceto empty states (§11). Todo o resto é left-aligned         |
| **Alertas/notificações nunca full-width** | Usar grid 2 colunas ou `max-width`. Não parecer banner         |
| **Bar charts preenchem o container**      | `flex: 1` ou `height: 100%`, nunca altura fixa isolada         |
| **Interativos têm min-height**            | Desktop: `36px`. Mobile touch: `44px`                          |
| **Usar `dvh` não `vh`**                   | `100dvh` para layouts full-height                              |
| **Valores monetários usam `&nbsp;`**      | `R$&nbsp;12.400` — non-breaking space entre símbolo e valor    |
| **Dados numéricos usam `tabular-nums`**   | `font-variant-numeric: tabular-nums` em tabelas, KPIs, valores |

### 14.5 Formulários

- Todo `<input>` precisa de `<label>` com `for`/`htmlFor`
- Atributos obrigatórios: `name`, `autocomplete` (ou `autocomplete="off"`), `type` correto
- CPF/CNPJ/CEP: `inputmode="numeric"`
- Email/username: `spellcheck="false"`
- Placeholder com `…` (ellipsis real), não `...`
- **Nunca bloquear paste** (`onPaste` com `preventDefault` é proibido)

### 14.6 Processo

**Antes de implementar qualquer componente visual**, consultar o skill `/audit` do ecossistema impeccable para checklist de robustez técnica (acessibilidade, performance, theming, responsividade, anti-patterns). O `/audit` cobre padrões genéricos que complementam as regras Ambaril-específicas acima. Após implementação, rodar `/polish` para o pass final de qualidade.

### 14.7 Asimetria Intencional (Quebra de Grid)

**Regra de Ouro:** Dashboards e telas de visão geral **NUNCA** devem ser grids simétricos perfeitos. Grids perfeitos criam cegueira visual e diluem a hierarquia.

- **Foco por Tamanho:** O elemento mais importante (KPI primário ou Chart principal) deve ocupar uma proporção assimétrica (ex: 2/3 da largura ou 1.5x a altura dos vizinhos).
- **Ritmo Visual:** Alternar entre cards de larguras diferentes (`col-span-2` ao lado de `col-span-1`).
- **Respiro Lateral:** Deixar espaços vazios ou metadados deslocados para criar tensão visual e guiar o olho.
- **Linear-style:** Bordas finas, sombras quase imperceptíveis e tipografia Bricolage em labels UPPERCASE 10px são os guias de navegação, não grids rígidos.
- **Gráficos:** Evitar gráficos _full-width_ que ocupam toda a largura da tela sem justificativa. Gráficos devem ser contidos em cards que equilibram a composição com outros dados.

---

## 15. Posicionamento

**Para** operadores de e-commerce que precisam de controle total sobre o negócio.

**Ambaril é** o sistema operacional que substitui 5+ ferramentas por uma plataforma integrada — CRM, checkout, ERP, PCP, WhatsApp, analytics.

**Diferente de** ERPs burocráticos (Bling, Tiny) e ferramentas fragmentadas (Kevi + Yever + planilhas) que criam pontos cegos.

**Porque** nenhuma plataforma no Brasil dá ao operador de e-commerce a visão total que ele precisa pra dominar o negócio. Ambaril é esse lugar.

---

## 16. Notas Operacionais Para LLMs

Esta seção não substitui `../DESIGN.md`. Ela existe para registrar, dentro da fonte de verdade, as simplificações autorizadas para consumo por modelos.

### 16.1 Sempre

- Usar `Light` como default e `Dark` como opt-in
- Tratar a sidebar como mapa, nunca como protagonista
- Aplicar `Level 0`, `Level 1` ou `Level 2` antes de decidir brilho, gradiente ou motion
- Manter **1 CTA primário por área**
- Usar DM Sans para interface, DM Mono para precisão e Bricolage apenas nos pontos de identidade/status definidos neste documento
- Favorecer padrões Shopify-like: sidebar, cards, tabelas, sheet lateral, form full-page

### 16.2 Nunca

- Inventar accent colors fora das cores semânticas e organizacionais já definidas
- Usar glow decorativo em páginas `Level 0`
- Criar grids perfeitamente simétricos em dashboards e telas de overview
- Centralizar conteúdo em cards operacionais
- Aumentar energia visual de componentes de IA a ponto de criar uma nova linguagem paralela

### 16.3 Use when

- **Sheet lateral:** inspeção rápida, detalhes e contexto de item
- **Page full:** criação, edição e configuração com maior densidade
- **Modal curto:** confirmação e formulários pequenos
- **Modal dual-pane:** configuração complexa
- **Bottom tab bar:** navegação mobile funcional, nunca como regra desktop

### 16.4 Do not use for

- **Glow, blur e gradientes fortes:** tabelas, settings, formulários operacionais
- **Bricolage em excesso:** corpo, metadados, sidebar, tabelas densas
- **Motion prolongado:** qualquer ação em que o atraso prejudique leitura de estado
- **Metáforas de marca:** labels, comandos, ações, tabelas e regras de navegação

### 16.5 Índice de referências canônicas

Use estes arquivos para reduzir liberdade excessiva de composição:

| Área                                | Referências                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| Tabelas / listas `Level 0`          | `tables-1.jpg`, `tables-2.jpg`, `enterprise-grade-3.jpg`, `great-shadcn-usage-2.jpg`  |
| Dashboards / KPI `Level 1`          | `dashboards-1.jpg`, `dashboards-2.jpg`, `dashboards-4.jpg`, `analytics-app-1.jpg`     |
| Navigation / inbox                  | `side-menu-icon.jpg`, `inbox-1.jpg`, `chat-and-inbox-1.jpg`, `chat-and-inbox-4.jpg`   |
| Onboarding / empty / auth `Level 2` | `dashboards-5-empty-state.jpg`, `onboarding-2.jpg`, `onboarding-5.jpg`, `sign-in.jpg` |
| Modals / sheets                     | `modals-1.jpg`, `modals-4.jpg`, `modals-5.jpg`                                        |
| Cards / panels                      | `cards.jpg`, `automation-panel-2.jpg`, `automation-panel-4.jpg`                       |
