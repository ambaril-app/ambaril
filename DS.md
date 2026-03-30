# Ambaril Design System

> **Versão:** 3.1
> **Última atualização:** Março 2026
> **Fonte de verdade** para toda decisão visual e comportamental no projeto. Se algo contradiz este arquivo, este arquivo ganha.

---

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
| Tagline | Uso |
|---|---|
| O brilho de ver tudo. | Primária. Hero do site, assinatura de marca |
| Um sistema. Todo o seu negócio. | Funcional. Header, ads de conversão |
| Sem pontos cegos. | Produto. Benefício direto. Campanhas |
| Built by operators, for operators. | Credibilidade. Posicionamento global |
| From dark to data. | Conceitual. Qualquer idioma |

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

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--bg-void` | `#F7F8FA` | `#07080B` | Fundo da página, nível mais profundo |
| `--bg-base` | `#FFFFFF` | `#0C0E13` | Cards de primeiro nível, sidebar |
| `--bg-raised` | `#F3F4F6` | `#101216` | Cards elevados, inputs, dropdowns |
| `--bg-surface` | `#E8EAF0` | `#16181F` | Hover states, popovers, segunda camada |
| `--bg-elevated` | `#FFFFFF` | `#1C1F28` | Tooltips, menus flutuantes, terceira camada |

### 2.2 Borders

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--border-subtle` | `rgba(15,23,42,0.06)` | `#1E2129` | Separadores entre áreas, borders de cards |
| `--border-default` | `rgba(15,23,42,0.10)` | `#262A34` | Borders de inputs, tabelas, divisores |
| `--border-strong` | `rgba(15,23,42,0.18)` | `#333844` | Hover borders, focus rings, separadores fortes |

Light usa `rgba()` baseado em `#0F172A` (slate-900) — borders adaptam a qualquer superfície.

### 2.3 Text

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--text-ghost` | `#94A3B8` | `#3A3F4C` | Disabled, placeholders inativos |
| `--text-muted` | `#64748B` | `#5C6170` | Labels terciários, timestamps, metadados |
| `--text-secondary` | `#475569` | `#7C8293` | Texto de suporte, descrições, sidebar inativo |
| `--text-tertiary` | `#475569` | `#A8AEBB` | Corpo de texto principal |
| `--text-primary` | `#334155` | `#D0D4DE` | Texto de destaque, valores de dados |
| `--text-bright` | `#1E293B` | `#E8EAF0` | Headlines H2/H3, texto enfatizado |
| `--text-white` | `#0F172A` | `#F7F8FA` | Headlines H1, wordmark, valores KPI, máximo contraste |

`--text-white` = "máximo contraste com o fundo". Em light = preto, em dark = branco. Nome semântico, não cor literal.

**WCAG AA (light mode, contra #FFFFFF):**
`--text-white` 15.4:1 · `--text-bright` 12.6:1 · `--text-primary` 8.6:1 · `--text-secondary` 5.9:1 · `--text-muted` 4.6:1 · `--text-ghost` 3.0:1 (decorativo)

### 2.4 Semânticas

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--success` | `#16A34A` | `#3ECF8E` | Entregue, positivo, crescimento |
| `--success-muted` | `rgba(22,163,74,0.08)` | `rgba(62,207,142,0.08)` | Background badges sucesso |
| `--warning` | `#D97706` | `#F5A524` | Preparando, atenção, alerta |
| `--warning-muted` | `rgba(217,119,6,0.08)` | `rgba(245,165,36,0.08)` | Background badges alerta |
| `--danger` | `#DC2626` | `#EF4444` | Erro, pendência crítica, queda |
| `--danger-muted` | `rgba(220,38,38,0.08)` | `rgba(239,68,68,0.08)` | Background badges erro |
| `--info` | `#2563EB` | `#60A5FA` | Informacional, link, destaque neutro |
| `--info-muted` | `rgba(37,99,235,0.08)` | `rgba(96,165,250,0.08)` | Background badges info |

Light usa tons 600-level (mais saturados, contraste em branco). Dark usa 400-level (brilhantes em fundo escuro).

### 2.5 Sombras

| Token | Light | Dark |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(15,23,42,0.04)` | `0 1px 2px rgba(0,0,0,0.2)` |
| `--shadow-md` | `0 2px 8px rgba(15,23,42,0.06)` | `0 2px 10px rgba(0,0,0,0.2)` |
| `--shadow-lg` | `0 4px 16px rgba(15,23,42,0.08)` | `0 4px 20px rgba(0,0,0,0.3)` |
| `--shadow-xl` | `0 8px 32px rgba(15,23,42,0.12)` | `0 8px 32px rgba(0,0,0,0.4)` |

Light: sombras suaves com base slate. Dark: sombras profundas com base preta.

### 2.6 Elevação

| Tema | Mecanismo | Exemplo |
|---|---|---|
| Light | Shadow + border sutil | Card: `--shadow-md` + `--border-subtle` |
| Dark | Surface color shift (mais claro = mais alto) | Card: `--bg-raised` → `--bg-surface` → `--bg-elevated` |

Em light, `--bg-base` e `--bg-elevated` são ambos `#FFFFFF` — diferenciação vem da sombra, não da cor. Em dark, cada nível de elevação muda a cor da superfície.

---

## 3. Tipografia

### Família única: DM Sans
Uma família para tudo. Sem mistura. DM Sans com optical sizing se adapta automaticamente ao tamanho.

**Importar:**
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400&display=swap" rel="stylesheet">
```

### Escala tipográfica

| Nível | Tamanho | Weight | Letter-spacing | Line-height | Uso |
|---|---|---|---|---|---|
| Display | 48px | 500 | -0.02em | 1.1 | Hero sections, números grandes |
| H1 | 32px | 500 | -0.01em | 1.2 | Título de página |
| H2 | 24px | 500 | 0 | 1.25 | Título de seção |
| H3 | 18px | 500 | 0 | 1.35 | Título de card, subtítulo |
| Body | 14px | 400 | 0 | 1.65 | Texto corrido, descrições |
| Small | 12px | 400 | +0.01em | 1.5 | Timestamps, metadados, captions |
| Label | 11px | 500 | +0.04em | 1.0 | Labels de seção (uppercase) |
| Mono | 13px (DM Mono) | 400 | 0 | 1.5 | Valores numéricos, IDs, códigos, datas |

### Regras
- **Labels de seção** são sempre uppercase com letter-spacing +0.04em em --text-muted
- **Valores numéricos** (R$, quantidades, IDs de pedido) usam DM Mono
- **Nunca** usar outra família tipográfica. Nem em marketing, nem em emails, nem em docs
- **Font smoothing per-theme:** Light mode usa `-webkit-font-smoothing: auto` (subpixel rendering, texto mais nítido em fundo claro). Dark mode usa `-webkit-font-smoothing: antialiased` (reduz halation de texto claro em fundo escuro).

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

Toda decisão de UI/UX deve passar por estes 8 filtros:

1. **Design é alavanca de negócio** — cada tela impacta churn, LTV e TTV. Medir antes de decorar.
2. **Carga cognitiva mínima (Hick's Law)** — cada opção extra aumenta tempo de decisão e abandono exponencialmente. Menos escolhas = menos erros.
3. **Contraste é priorização** — o que tem mais contraste visual recebe atenção primeiro. Reduzir contraste de secundários para que CTAs primários dominem.
4. **Interface nunca é neutra** — toda tela guia comportamento. Dois botões com mesmo peso = indecisão. Priorize UMA ação.
5. **Bater o olho e agir** — operador de e-commerce decide em < 3 segundos. Dados contextualizados, ações óbvias.
6. **Personalização por role** — dashboard para todos = dashboard para ninguém. Cada role vê o que precisa agir.
7. **Feature escondida = receita não capturada** — progressive disclosure > esconder. Se o usuário não encontra, não existe.
8. **Modular com incentivo** — cada módulo é produto standalone, mas a interface mostra claramente o que o cliente está perdendo ao não ativar os demais.

---

## 5. Componentes

### Library: shadcn/ui (Radix UI + cva + Tailwind)
- **Base:** Componentes Radix UI headless, estilizados com Tailwind e tokens Moonstone
- **Variantes:** class-variance-authority (cva) para variant/size mapping
- **Dark mode:** Tailwind `dark:` via `@custom-variant` + CSS vars Moonstone
- **Padrão:** Código copiado para `packages/ui`, não instalado como dependência runtime
- **Cantos:** 12px padrão para cards e modals, 8px para inputs e botões, 5-6px para barras e badges

### Brilho (a centelha do -ril)
O painel tem 10-20% da energia visual da landing page. O brilho existe mas é contido.

**Onde o brilho vive:**

| Elemento | Técnica | Intensidade |
|---|---|---|
| KPI cards | `background: linear-gradient(150deg, var(--bg-raised) 40%, var(--bg-surface))` | Gradiente começa flat por 40%, depois vira sutil |
| KPI cards | `::after` com radial-gradient branco | 2.5% opacidade, canto superior direito |
| KPI cards | Sparkline de 30 dias dentro do card | Bezier, stroke 1.5px, cor --text-secondary |
| Hover em cards | `box-shadow: 0 2px 10px rgba(0,0,0,0.2)` + border-color change | Sem translateY. Só sombra e border |
| Hover em table rows | `background: rgba(247,248,250,0.015)` | 1.5% branco |
| Botão primário | `box-shadow: 0 1px 2px rgba(0,0,0,0.2)` | Shadow leve. Hover: shadow levemente mais profunda |
| Charts (área) | Gradiente sob a curva: 12% → 4% → 0% | Fade em 3 stops |
| Charts (linha) | Curva bezier monotone, stroke 1.5px, cor --text-primary | Data point luminoso só no último valor |
| Barras | `linear-gradient(to top, var(--border), var(--text-tertiary))` | Gradiente vertical, mais escuro embaixo |
| Sidebar ativo | `border-left: 2px solid var(--text-tertiary)` + `background: rgba(247,248,250,0.03)` | Border em prata, não branco |

**Onde o brilho NÃO vive:**
- Texto (nunca glow em texto)
- Ícones (opacity change, não glow)
- Backgrounds de página (sempre flat --bg-void)
- Borders normais (sempre sólidas, nunca gradiente)

### Brilho per-theme

O brilho muda de **mecanismo** entre temas. Em dark, vem de gradientes claros sobre fundo escuro. Em light, vem de **sombras** e **borders sutis** que criam profundidade. A intensidade visual permanece 10-20% (painel) — só o mecanismo muda.

| Elemento | Dark mode | Light mode |
|---|---|---|
| KPI cards | Gradiente `bg-raised → bg-surface` + radial branco 2.5% | `--shadow-md` + `--border-subtle` + bg `--bg-base` |
| Hover em cards | Shadow + border-color change | Shadow mais profunda (`--shadow-lg`) |
| Hover em table rows | `rgba(247,248,250, 0.015)` | `--bg-raised` (#F3F4F6) |
| Botão primário | `bg: --bg-surface`, shadow leve | `bg: #0F172A` (darkest), text white, shadow-sm |
| Sidebar ativo | border-left + 3% branco bg | border-left + bg `--bg-base` (branco) |
| Tooltips | `--bg-elevated`, text `--text-primary` | Invertido: bg #0F172A, text #F7F8FA |

### Hierarquia Visual & Contraste

| Nível | Light | Dark | Uso |
|---|---|---|---|
| Primário | bg `#0F172A`, text `#FFFFFF`, shadow-sm | bg `--bg-surface`, text `--text-white`, shadow-sm | Ação principal (1 por área) |
| Secundário | bg `#FFFFFF`, text `--text-primary`, border `rgba(15,23,42,0.15)` | bg transparent, text `--text-primary`, border `--border-default` | Ação complementar |
| Terciário (ghost) | text `--text-secondary`, sem border | text `--text-secondary`, sem border | Cancelar, voltar |

Em light, o botão primário é o **elemento mais escuro da tela** (#0F172A no branco). Em dark, é o **elemento mais luminoso da zona**. Princípio: máximo contraste local.

Regras adicionais:
- Fundo e sidebar são SEMPRE nível visual inferior ao conteúdo principal. Conteúdo é protagonista.
- Cards de ação (com CTA) > cards informativos (só display) na hierarquia visual.
- Problema de priorização visual = problema de contraste. Se o usuário não sabe onde clicar, o contraste está errado.

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

| Role | Painel default | KPI primário (top-left) |
|---|---|---|
| `admin` | War Room | Faturamento hoje vs meta |
| `pm` | Marketing + Creators | GMV Creators + ROAS |
| `operations` | PCP Timeline | Ordens atrasadas |
| `support` | Inbox | Tickets abertos + tempo médio |
| `finance` | Financeiro | DRE do mês + margem |
| `creative` | Marketing | UGC pendente + calendário |
| `commercial` | B2B | Pipeline atacado |

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
- Monocromático Moonstone: escala de cinzas com gradientes pra dar profundidade
- Valores em DM Mono acima de cada barra quando há espaço
- Legendas em --text-secondary, dot de 8px com border-radius 2px
- Cores semânticas (verde/vermelho) SÓ pra indicar direção (↑↓), nunca como cor primária do chart

### Tokens de chart per-theme

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--chart-line` | `#334155` | `#D0D4DE` | Linha principal |
| `--chart-area` | `rgba(15,23,42,0.04)` | `rgba(247,248,250,0.04)` | Fill sob curva |
| `--chart-grid` | `rgba(15,23,42,0.06)` | `#1E2129` | Linhas de grid |
| `--chart-bar-top` | `#64748B` | `#A8AEBB` | Topo do gradiente de barras |
| `--chart-bar-bottom` | `#CBD5E1` | `#262A34` | Base do gradiente de barras |
| `--chart-tooltip-bg` | `#0F172A` | `#1C1F28` | Tooltip background |
| `--chart-tooltip-text` | `#F7F8FA` | `#D0D4DE` | Tooltip text |

Em light mode, tooltips de chart são **escuros** (fundo #0F172A, texto claro) — inversão intencional para destaque. Em dark, seguem superfície elevada.

### Contextualização de dados
- Todo valor principal acompanhado de delta (% ou absoluto) + período de referência
- Tooltips com enquadramento: "R$ 12.400 — 15% acima da média dos últimos 30 dias"
- Legendas acionáveis quando possível: clicar na legenda filtra o dataset
- Números em DM Mono (já existente), deltas em cor semântica: `--success` para positivo, `--danger` para negativo

---

## 9. Navegação

### Desktop: Sidebar colapsável
- **Largura aberta:** 210px
- **Largura colapsada:** 56px (só ícones)
- **Background:** --bg-base
- **Border direita:** 0.5px --border-subtle
- **Ícones:** Lucide React, 14px, opacity 0.6 normal → 1.0 ativo
- **Item ativo:** border-left 2px --text-tertiary + background 3% branco
- **Item hover:** background 2% branco
- **Labels de grupo:** 9px, uppercase, --text-ghost, letter-spacing 0.12em
- **Agrupamento:** Principal (Dashboard, Pedidos, Estoque, CRM) → Operações (PCP, Fiscal, WhatsApp) → Comercial (Atacado, Creators) → Config

### Mobile: Bottom tab bar
- **Posição:** fixa no bottom
- **Items visíveis:** 5 (os mais usados pelo role do usuário)
- **Overflow:** ícone de menu (hamburger) no 5º slot abre drawer com todos os módulos
- **Adaptativa por role:** Ana Clara vê Logística primeiro, Slimgust vê Atendimento primeiro, Marcus vê Dashboard primeiro

### Tokens de sidebar per-theme

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--sidebar-bg` | `#F7F8FA` | `#0C0E13` | Fundo da sidebar |
| `--sidebar-item-hover` | `#F3F4F6` | `rgba(247,248,250,0.02)` | Hover state |
| `--sidebar-item-active-bg` | `#FFFFFF` | `rgba(247,248,250,0.03)` | Item selecionado |
| `--sidebar-item-active-text` | `#0F172A` | `#E8EAF0` | Texto do item ativo |
| `--sidebar-border` | `rgba(15,23,42,0.08)` | `#1E2129` | Border direita |

Em light: sidebar cinza claro, item ativo branco — destaca por ser mais claro que o entorno. Em dark: item ativo por border-left + background sutil.

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

### Princípios
- Fatos antes de opinião
- Números antes de adjetivos
- Ação antes de explicação
- Sem diminutivos
- Sem exclamação em dados
- Emoji só em contextos sociais (WhatsApp com cliente), nunca em dashboard ou notificação interna

### Exemplos

| Sim | Não |
|---|---|
| Ticket médio caiu 12% nos últimos 7 dias. As 3 coleções mais afetadas estão marcadas. | Opa! Parece que seus clientes estão gastando menos! Vamos investigar juntos? |
| 3 pedidos aguardando NF-e. Ana Clara precisa liberar. | Você tem algumas notinhas fiscais pendentes! Que tal dar uma olhadinha? |
| Coleção Verão esgotou em 4 dias. Velocidade 2.3x acima da média. | Parabéns! Sua coleção de Verão foi um SUCESSO! |
| Estoque de Camiseta Preta M: 12 unidades. Reposição sugerida: 50. | Cuidado! Seu estoque está acabando! Corre pra repor! |

### Tom em contextos especiais

| Contexto | Exemplo | Tom |
|---|---|---|
| Empty state Dashboard | "Sem dados ainda. Conecte sua primeira integração para ver o painel." | Direto, sem emoji, com CTA |
| Empty state lista vazia | "Nenhum pedido registrado. Quando o primeiro entrar, aparece aqui." | Calmo, sem urgência artificial |
| Onboarding checklist | "3 de 5 passos concluídos. Próximo: configurar alertas de estoque." | Progresso, sem comemoração |
| Feature não configurada | "Alertas de PCP desativados. Ative para receber notificações de atraso." | Factual, benefício claro |
| Módulo não ativado | "CRM disponível. Unifique sua base de clientes em um lugar." | Benefício, sem pressão |
| Erro de formulário | "CPF inválido. Verifique os 11 dígitos." | Específico, sem julgamento |

---

## 13. Design Tokens (CSS)

Dois blocos: `:root` é Moonstone Light (default), `.dark` é Moonstone Dark (override). Tokens de font, radius e transition não mudam entre temas — ficam só em `:root`.

```css
:root {
  /* ===== MOONSTONE LIGHT (DEFAULT) ===== */

  /* Backgrounds */
  --bg-void: #F7F8FA;
  --bg-base: #FFFFFF;
  --bg-raised: #F3F4F6;
  --bg-surface: #E8EAF0;
  --bg-elevated: #FFFFFF;

  /* Borders */
  --border-subtle: rgba(15,23,42,0.06);
  --border-default: rgba(15,23,42,0.10);
  --border-strong: rgba(15,23,42,0.18);

  /* Text */
  --text-ghost: #94A3B8;
  --text-muted: #64748B;
  --text-secondary: #475569;
  --text-tertiary: #475569;
  --text-primary: #334155;
  --text-bright: #1E293B;
  --text-white: #0F172A;

  /* Semantic */
  --success: #16A34A;
  --success-muted: rgba(22,163,74,0.08);
  --warning: #D97706;
  --warning-muted: rgba(217,119,6,0.08);
  --danger: #DC2626;
  --danger-muted: rgba(220,38,38,0.08);
  --info: #2563EB;
  --info-muted: rgba(37,99,235,0.08);

  /* Typography */
  --font: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'DM Mono', 'SF Mono', 'Fira Code', monospace;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 99px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(15,23,42,0.04);
  --shadow-md: 0 2px 8px rgba(15,23,42,0.06);
  --shadow-lg: 0 4px 16px rgba(15,23,42,0.08);
  --shadow-xl: 0 8px 32px rgba(15,23,42,0.12);

  /* Sidebar */
  --sidebar-bg: #F7F8FA;
  --sidebar-item-hover: #F3F4F6;
  --sidebar-item-active-bg: #FFFFFF;
  --sidebar-item-active-text: #0F172A;
  --sidebar-border: rgba(15,23,42,0.08);

  /* Buttons */
  --btn-primary-bg: #0F172A;
  --btn-primary-text: #FFFFFF;
  --btn-secondary-bg: #FFFFFF;
  --btn-secondary-text: #334155;
  --btn-secondary-border: rgba(15,23,42,0.15);
  --btn-ghost-text: #475569;
  --btn-ghost-hover: #F3F4F6;

  /* Charts */
  --chart-line: #334155;
  --chart-area: rgba(15,23,42,0.04);
  --chart-grid: rgba(15,23,42,0.06);
  --chart-bar-top: #64748B;
  --chart-bar-bottom: #CBD5E1;
  --chart-tooltip-bg: #0F172A;
  --chart-tooltip-text: #F7F8FA;

  /* Tables */
  --table-header-bg: #F9FAFB;
  --table-row-hover: #F9FAFB;
  --table-border: rgba(15,23,42,0.06);

  /* Inputs */
  --input-bg: #F3F4F6;
  --input-border: rgba(15,23,42,0.12);
  --input-focus-border: #2563EB;

  /* Badge */
  --badge-bg: #F3F4F6;
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
  --bg-void: #07080B;
  --bg-base: #0C0E13;
  --bg-raised: #101216;
  --bg-surface: #16181F;
  --bg-elevated: #1C1F28;

  /* Borders */
  --border-subtle: #1E2129;
  --border-default: #262A34;
  --border-strong: #333844;

  /* Text */
  --text-ghost: #3A3F4C;
  --text-muted: #5C6170;
  --text-secondary: #7C8293;
  --text-tertiary: #A8AEBB;
  --text-primary: #D0D4DE;
  --text-bright: #E8EAF0;
  --text-white: #F7F8FA;

  /* Semantic */
  --success: #3ECF8E;
  --success-muted: rgba(62,207,142,0.08);
  --warning: #F5A524;
  --warning-muted: rgba(245,165,36,0.08);
  --danger: #EF4444;
  --danger-muted: rgba(239,68,68,0.08);
  --info: #60A5FA;
  --info-muted: rgba(96,165,250,0.08);

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.2);
  --shadow-md: 0 2px 10px rgba(0,0,0,0.2);
  --shadow-lg: 0 4px 20px rgba(0,0,0,0.3);
  --shadow-xl: 0 8px 32px rgba(0,0,0,0.4);

  /* Sidebar */
  --sidebar-bg: #0C0E13;
  --sidebar-item-hover: rgba(247,248,250,0.02);
  --sidebar-item-active-bg: rgba(247,248,250,0.03);
  --sidebar-item-active-text: #E8EAF0;
  --sidebar-border: #1E2129;

  /* Buttons */
  --btn-primary-bg: #16181F;
  --btn-primary-text: #F7F8FA;
  --btn-secondary-bg: transparent;
  --btn-secondary-text: #D0D4DE;
  --btn-secondary-border: #262A34;
  --btn-ghost-text: #7C8293;
  --btn-ghost-hover: rgba(247,248,250,0.03);

  /* Charts */
  --chart-line: #D0D4DE;
  --chart-area: rgba(247,248,250,0.04);
  --chart-grid: #1E2129;
  --chart-bar-top: #A8AEBB;
  --chart-bar-bottom: #262A34;
  --chart-tooltip-bg: #1C1F28;
  --chart-tooltip-text: #D0D4DE;

  /* Tables */
  --table-header-bg: #101216;
  --table-row-hover: rgba(247,248,250,0.015);
  --table-border: #1E2129;

  /* Inputs */
  --input-bg: #101216;
  --input-border: #262A34;
  --input-focus-border: #60A5FA;

  /* Badge */
  --badge-bg: #16181F;
  --badge-text: #A8AEBB;

  /* Font smoothing */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Regra anti-flash (FOWT prevention)

Script bloqueante no `<head>`, antes de qualquer CSS/render:

```html
<script>
  (function(){
    var t = localStorage.getItem('ambaril_theme') ||
            document.cookie.match(/ambaril_theme=(\w+)/)?.[1];
    if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme:dark)').matches))
      document.documentElement.classList.add('dark');
  })();
</script>
```

---

## 14. Robustez de Layout

Regras obrigatórias para todo componente visual. Previnem quebra, sobreposição e inconsistência em diferentes viewports e tamanhos de conteúdo.

### 14.1 Spacing scale (base 4px)

| Token | Valor | Uso típico |
|---|---|---|
| `--space-1` | `4px` | Gap entre ícone e texto, padding mínimo |
| `--space-2` | `8px` | Gap entre badges, padding interno de badges |
| `--space-3` | `12px` | Gap entre label e input, padding de tooltips |
| `--space-4` | `16px` | Gap de grid, margin entre seções pequenas |
| `--space-5` | `20px` | Padding interno de cards |
| `--space-6` | `24px` | Padding de main content, margin entre seções |
| `--space-8` | `32px` | Padding de main content (desktop lg+) |
| `--space-12` | `48px` | Padding de empty states |
| `--space-16` | `64px` | Margin bottom para clearance do toggle/sticky |

**Regra:** usar APENAS estes valores. Nunca valores arbitrários (28px, 15px, 22px). Se um valor não encaixa, usar o mais próximo para baixo.

### 14.2 Overflow e truncamento

| Regra | Aplicação |
|---|---|
| **Todo texto em container flex/grid** precisa de `min-width: 0` | Flex children que contêm texto |
| **Textos em espaço limitado** precisam de `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` | KPI labels, KPI values, card titles, sidebar items, table cells, badges |
| **Textos longos de corpo** usam `text-wrap: pretty` | Descrições, empty state text, form hints |
| **Headlines** usam `text-wrap: balance` | H1, H2, page titles |
| **Tabelas** precisam de `min-width` + wrapper com `overflow-x: auto` | Toda tabela com mais de 3 colunas |
| **Tabela cells com dados variáveis** precisam de `max-width` | Nomes de clientes, descrições (max-width: 160-200px) |

### 14.3 SVG e Charts

- **Sempre** usar `vector-effect: non-scaling-stroke` em linhas SVG — garante stroke consistente independente de viewBox
- Charts usam `aspect-ratio` com `min-height` e `max-height` — nunca altura fixa
- Gradientes de área via `<defs>` + `<linearGradient>` — não cor flat
- Grid lines: stroke 1px (non-scaling). Linhas de dados: stroke 1.5px (non-scaling)

### 14.4 Layout de componentes

| Regra | Aplicação |
|---|---|
| **Cards nunca centralizam conteúdo** | Exceto empty states (§11). Todo o resto é left-aligned |
| **Alertas/notificações nunca full-width** | Usar grid 2 colunas ou `max-width`. Não parecer banner |
| **Bar charts preenchem o container** | `flex: 1` ou `height: 100%`, nunca altura fixa isolada |
| **Interativos têm min-height** | Desktop: `36px`. Mobile touch: `44px` |
| **Usar `dvh` não `vh`** | `100dvh` para layouts full-height |
| **Valores monetários usam `&nbsp;`** | `R$&nbsp;12.400` — non-breaking space entre símbolo e valor |
| **Dados numéricos usam `tabular-nums`** | `font-variant-numeric: tabular-nums` em tabelas, KPIs, valores |

### 14.5 Formulários

- Todo `<input>` precisa de `<label>` com `for`/`htmlFor`
- Atributos obrigatórios: `name`, `autocomplete` (ou `autocomplete="off"`), `type` correto
- CPF/CNPJ/CEP: `inputmode="numeric"`
- Email/username: `spellcheck="false"`
- Placeholder com `…` (ellipsis real), não `...`
- **Nunca bloquear paste** (`onPaste` com `preventDefault` é proibido)

### 14.6 Processo

**Antes de implementar qualquer componente visual**, consultar a skill `baseline-ui` para checklist de robustez. A skill cobre padrões genéricos (acessibilidade, overflow, animação) que complementam as regras Ambaril-específicas acima.

---

## 15. Posicionamento

**Para** operadores de e-commerce que precisam de controle total sobre o negócio.

**Ambaril é** o sistema operacional que substitui 5+ ferramentas por uma plataforma integrada — CRM, checkout, ERP, PCP, WhatsApp, analytics.

**Diferente de** ERPs burocráticos (Bling, Tiny) e ferramentas fragmentadas (Kevi + Yever + planilhas) que criam pontos cegos.

**Porque** nenhuma plataforma no Brasil dá ao operador de e-commerce a visão total que ele precisa pra dominar o negócio. Ambaril é esse lugar.
