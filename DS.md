# Ambaril Design System

> **Versão:** 2.0  
> **Última atualização:** Março 2026  
> **Fonte de verdade** para toda decisão visual no projeto. Se algo contradiz este arquivo, este arquivo ganha.

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
- **Sobre fundo escuro:** cor --text-white (#F7F8FA)
- **Sobre fundo claro:** cor --bg-void (#07080B)

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

### Backgrounds (escuro → claro)

| Token | Hex | Uso |
|---|---|---|
| `--bg-void` | `#07080B` | Fundo da página, nível mais profundo |
| `--bg-base` | `#0C0E13` | Cards de primeiro nível, sidebar |
| `--bg-raised` | `#101216` | Cards elevados, inputs, dropdowns |
| `--bg-surface` | `#16181F` | Hover states, popovers, segunda camada de cards |
| `--bg-elevated` | `#1C1F28` | Tooltips, menus flutuantes, terceira camada |

### Borders

| Token | Hex | Uso |
|---|---|---|
| `--border-subtle` | `#1E2129` | Separadores entre áreas, borders de cards |
| `--border-default` | `#262A34` | Borders de inputs, tabelas, divisores |
| `--border-strong` | `#333844` | Hover borders, focus rings, separadores fortes |

### Text (fantasma → branco)

| Token | Hex | Uso |
|---|---|---|
| `--text-ghost` | `#3A3F4C` | Disabled, placeholders inativos |
| `--text-muted` | `#5C6170` | Labels terciários, timestamps, metadados |
| `--text-secondary` | `#7C8293` | Texto de suporte, descrições, sidebar inativo |
| `--text-tertiary` | `#A8AEBB` | Corpo de texto principal |
| `--text-primary` | `#D0D4DE` | Texto de destaque, valores de dados |
| `--text-bright` | `#E8EAF0` | Headlines H2/H3, texto enfatizado |
| `--text-white` | `#F7F8FA` | Headlines H1, wordmark, valores KPI, texto máximo contraste |

### Semânticas

| Token | Hex | Uso |
|---|---|---|
| `--success` | `#3ECF8E` | Entregue, positivo, crescimento |
| `--success-muted` | `rgba(62,207,142,0.08)` | Background de badges de sucesso |
| `--warning` | `#F5A524` | Preparando, atenção, alerta |
| `--warning-muted` | `rgba(245,165,36,0.08)` | Background de badges de alerta |
| `--danger` | `#EF4444` | Erro, pendência crítica, queda |
| `--danger-muted` | `rgba(239,68,68,0.08)` | Background de badges de erro |
| `--info` | `#60A5FA` | Informacional, link, destaque neutro |
| `--info-muted` | `rgba(96,165,250,0.08)` | Background de badges info |

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

---

## 4. Componentes

### Library: HeroUI
- **Base:** HeroUI (React + Tailwind CSS + React Aria)
- **Dark mode:** nativo, via Tailwind `dark:` classes e CSS vars Moonstone
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

---

## 5. Charts

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

---

## 6. Navegação

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

---

## 7. Responsividade

- **Approach:** Desktop-first. Mobile igualmente bom onde possível.
- **Breakpoints:** `sm: 640px` · `md: 768px` · `lg: 1024px` · `xl: 1280px`
- **Módulos mobile-first:** Logística/Expedição (Ana Clara usa mobile), Atendimento/WhatsApp (Slimgust), Aprovações rápidas
- **Módulos desktop-first:** Dashboard, Analytics, PCP, Fiscal, CRM bulk actions
- **KPI grid:** 4 colunas desktop → 2 colunas tablet → 1 coluna mobile
- **Charts:** manter proporção via ResponsiveContainer. Em mobile, charts empilham (1 coluna)
- **Tabelas:** scroll horizontal em mobile com coluna fixa (Pedido sempre visível)
- **Sidebar:** oculta em mobile, substituída por bottom tab bar

---

## 8. Tom de Voz

Ambaril fala como um parceiro sênior — calmo, direto, sem decoração. Mostra os dados. Nunca vende. Nunca exclama. Nunca usa emoji em contexto operacional.

### Princípios
- Fatos antes de opinião
- Números antes de adjetivos
- Ação antes de explicação
- Sem diminutivos
- Sem exclamação em dados
- Emoji só em contextos sociais (WhatsApp com cliente), nunca em dashboard ou notificação interna

### Exemplos

| ✓ Sim | ✗ Não |
|---|---|
| Ticket médio caiu 12% nos últimos 7 dias. As 3 coleções mais afetadas estão marcadas. | Opa! Parece que seus clientes estão gastando menos! Vamos investigar juntos? 🔍 |
| 3 pedidos aguardando NF-e. Ana Clara precisa liberar. | Você tem algumas notinhas fiscais pendentes! Que tal dar uma olhadinha? |
| Coleção Verão esgotou em 4 dias. Velocidade 2.3x acima da média. | Parabéns! Sua coleção de Verão foi um SUCESSO! 🎉🚀 |
| Estoque de Camiseta Preta M: 12 unidades. Reposição sugerida: 50. | Cuidado! Seu estoque está acabando! Corre pra repor! |

---

## 9. Design Tokens (CSS)

Copiar e colar no `:root` do projeto:

```css
:root {
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
  --warning: #F5A524;
  --danger: #EF4444;
  --info: #60A5FA;

  /* Typography */
  --font: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'DM Mono', 'SF Mono', 'Fira Code', monospace;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 99px;

  /* Shadows (brilho contido) */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.2);
  --shadow-md: 0 2px 10px rgba(0,0,0,0.2);
  --shadow-lg: 0 4px 20px rgba(0,0,0,0.3);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
}
```

---

## 10. Posicionamento

**Para** operadores de e-commerce que precisam de controle total sobre o negócio.

**Ambaril é** o sistema operacional que substitui 5+ ferramentas por uma plataforma integrada — CRM, checkout, ERP, PCP, WhatsApp, analytics.

**Diferente de** ERPs burocráticos (Bling, Tiny) e ferramentas fragmentadas (Kevi + Yever + planilhas) que criam pontos cegos.

**Porque** nenhuma plataforma no Brasil dá ao operador de e-commerce a visão total que ele precisa pra dominar o negócio. Ambaril é esse lugar.
