# Ambaril — Design & Copywriting Policy
## Landing Page (ambaril.com) + Login Page (app.ambaril.com)

> **Versão:** 1.0 · Março 2026
> Definido via sessão de design com /grill-me + /overdrive.
> Complementa o DS.md — quando houver conflito, este arquivo ganha para estes dois contextos.

---

## Parte I — Landing Page (ambaril.com)

### 1. Postura

O Ambaril não está aberto ao público e não está sendo comercializado. A landing page não vende — **gera desejo**.

| Decisão | Definição |
|---|---|
| Modelo de acesso | Invite-only. Próximos tenants vêm por indicação (modelo Nubank early days) |
| Objetivo da página | Descrever o produto com precisão suficiente para criar desejo + capturar leads qualificados |
| O que a página NÃO faz | Não onboarda, não precifica, não converte em cadastro aberto |
| Público | Donos de marca DTC brasileira, R$100k–2M/mês, indicados por alguém da rede |

---

### 2. Narrativa Visual

A landing usa **escuridão e luz como metáfora do antes e depois** do Ambaril.

| Zona | Cor | Significado |
|---|---|---|
| Hero | Dark (`#07080B`) | O estado atual do operador: fragmentado, sem visão total, no escuro |
| Transição | Gradiente `#07080B → #F7F8FA` | O scroll como ato de iluminação — o operador literalmente arrasta a luz |
| Seções de produto | Light (Moonstone `--bg-void`) | O estado com Ambaril: clareza, controle, visão total |
| Seção final / CTA | Light ou dark (a definir por seção) | Convite para entrar nesse estado |

**Regra:** A landing não é toda dark. Dark é o ponto de partida narrativo, não a identidade visual da página.

---

### 3. Hero

#### Conceito visual
O artefato central é o **Silmaril** — uma joia auto-luminosa que contém o espectro de luz dentro de si. Não é iluminada por fora: ela *é* a fonte. O espectro prismático existe dentro da esfera; fora dela, a página é Moonstone puro.

| Elemento | Definição |
|---|---|
| Fundo | `#07080B` (Moonstone dark `--bg-void`) |
| Artefato | Esfera com glow radial cristalino (frio → quente) + iris prismática conic-gradient rotacionando |
| Temperatura | Centro: `oklch(99% 0.003 215)` (branco-cristal) → borda: `oklch(60% 0.062 222)` (slate-cristal) |
| Interação | Two-body spring: o Silmaril deriva lentamente com o cursor (stiffness 0.022); cursor abre segunda fonte de luz (stiffness 0.065) |
| Referência de implementação | `hero-overdrive.html` · variante V3 Dark Silmaril |

#### Tipografia do hero
| Elemento | Spec |
|---|---|
| Wordmark | DM Sans, 12px, letter-spacing 0.14em, uppercase, `oklch(36% 0.018 220)` |
| H1 | Bricolage Grotesque, 72–82px, weight 500, letter-spacing -0.026em, `#E8EAF0` |
| Tagline primária | "O brilho de ver tudo." |
| Subtítulo | DM Sans, 16px, `oklch(50% 0.018 220)` |

#### CTA do hero
| Elemento | Spec |
|---|---|
| Texto | "Solicitar acesso" ou "Tem um código de acesso?" |
| Botão | Max contrast dark: `#F7F8FA` background, `#07080B` text |
| Sub-nota | "Acesso por convite. Exclusivo." · 11px · `oklch(34% 0.015 220)` |

---

### 4. Transição dark → light

Uma seção dedicada de transição — gradiente vertical de `#07080B` para `#F7F8FA`. Sem conteúdo textual ou mínimo. O scroll é a narrativa: o operador arrasta a luz para cima enquanto desce a página. Não precisa de copy para explicar.

---

### 5. Seções de produto (features)

#### Estrutura geral
- **Hero (dark)** → transição → **seções de produto (light)** → **seção de convite (light/dark)**
- Quantidade de seções: a definir conforme módulos selecionados para destaque (curadoria dos 15 planejados)

#### Tratamento visual dos módulos
| Decisão | Definição |
|---|---|
| Representação visual | Mockups abstratos — evocam o produto sem ser screenshots reais. Evoluir para screenshots quando a UI estiver apresentável |
| Fundo das seções | Moonstone light (`--bg-void`, `--bg-base`) |
| Alternância dark/light | Permitida entre seções para ritmo visual — desde que narrativamente justificada |

#### Copywriting das features
| Nível | Regra | Exemplo |
|---|---|---|
| Título da feature | **Benefit-led** — nomeia o estado criado, não a feature | "Você sabe exatamente por onde vazam suas margens." |
| Subtítulo | **Feature-led** — âncora técnica com o nome do módulo | "DRE em tempo real · Módulo Financeiro" |
| Corpo (se houver) | Máximo 2 linhas · fatos antes de adjetivos · sem exclamação | |

**Regra de copy:** O operador não se move por nome de feature. Ele se move pela dor que reconhece. Nomeie a dor, depois apresente a solução.

---

### 6. Mecanismo de convite

O único CTA de conversão da landing. Fluxo completo:

#### Tela de código de acesso
- CTA principal na última seção: **"Tem um código de acesso?"** (ou variação)
- Ao clicar: tela para inserir o código de convite
- Visual: Moonstone puro, form centralizado, sem ruído

#### Path secundário (menos proeminente)
- Botão com menos destaque visual: **"Não tenho convite mas quero aumentar minhas chances"**
- Copy comunica escassez e concorrência implícita — nunca "entrar na lista de espera"

#### Formulário de interesse
| Campo | Tipo | Regra |
|---|---|---|
| Email | Input | **Apenas emails comerciais** — bloquear Gmail, Outlook, Hotmail, Yahoo e similares. Email pessoal = não é o público |
| Nome completo | Input | Obrigatório |
| Nome da marca/empresa | Input | Obrigatório |
| Plataforma atual | Select | Shopify, Nuvemshop, VNDA, WooCommerce, Outra |
| Faturamento mensal estimado | Select (ranges) | Ranges: até R$50k / R$50k–200k / R$200k–500k / R$500k–2M / acima de R$2M |
| Maior dor operacional hoje | Textarea | Opcional — dado qualitativo de alto valor para product discovery |

**Design do formulário:** Deve ser visualmente distinto — não um form genérico. Aplicar máxima qualidade de craft (Bricolage no título, espaçamento generoso, feedback inline).

#### Página de confirmação
Não agradece. Tom de marca exclusiva/luxo:

> *"Recebemos."*
> Quando houver uma abertura compatível com o seu perfil, você será o primeiro a saber. Não há prazo definido.

Sem emoji. Sem urgência artificial. Sem promessa de prazo. A ausência de entusiasmo *é* a mensagem.

---

### 7. Sistema de cores na landing

| Elemento | Light sections | Dark sections |
|---|---|---|
| Fundo | `--bg-void: #F7F8FA` | `#07080B` |
| Texto principal | `--text-white: #0F172A` | `#E8EAF0` |
| Botão primário | `#0F172A` bg · `#F8FAFC` text | `#F7F8FA` bg · `#07080B` text |
| Accent colorido | **Nenhum** | **Nenhum** |

**Regra:** Zero accent colorido na landing. O brilho vem do contraste entre superfícies, da tipografia e do artefato Silmaril — não de cor.

---

### 8. Copywriting — tom de voz na landing

Mesmo tom do DS.md (parceiro sênior, calmo, direto) com **maior latitude narrativa** — a landing pode contar uma história que o produto não conta.

| Regra | Aplicação |
|---|---|
| Fatos antes de opinião | Números reais onde possível, estados concretos onde não |
| Dor antes de solução | Nomear o problema do operador antes de apresentar o módulo |
| Sem exclamação | Nunca. Nem na landing. |
| Sem emoji | Zero em qualquer contexto da landing |
| Sem urgência artificial | "Exclusivo" e "por convite" comunicam escassez sem precisar de countdown ou "vagas limitadas" |
| Taglines aprovadas | Ver DS.md §1 — usar as 5 taglines aprovadas, não criar novas sem revisão |

---

## Parte II — Login Page (app.ambaril.com)

### 1. Postura

A login page é o corredor entre a landing e o produto. Não é marketing — não precisa impressionar. Não é produto — não precisa ser neutra. É a **transição**: o visitante que virou usuário entrando no cockpit.

---

### 2. Tratamento visual de fundo

| Decisão | Definição |
|---|---|
| Base | Moonstone light (`--bg-void: #F7F8FA`) |
| Elemento de fundo | O Silmaril da landing, muito apagado (~8% de opacidade), centralizado |
| Função | Presença de marca sem distração — a luz existe mas o foco é o form |
| O que NÃO fazer | Split layout (branding esquerda + form direita). Proibido. |

---

### 3. Animação do fundo

| Decisão | Definição |
|---|---|
| Tipo | Respiração autônoma — o Silmaril pulsa suavemente sozinho |
| Parâmetros | `opacity` e `scale` · ciclo de 5–6s · amplitude mínima (scale 1.0 → 1.04, opacity 8% → 12%) |
| Interação com cursor | **Nenhuma** — o usuário está entrando no modo trabalho. A luz não o segue aqui |
| Redução de movimento | Estático com `prefers-reduced-motion: reduce` |

**Razão:** Cursor tracking na landing é convite à exploração. Cursor tracking no login seria distração. A respiração autônoma diz "estou aqui" sem pedir atenção.

---

### 4. Card de login

| Elemento | Spec |
|---|---|
| Layout | Card centralizado · `max-width: 384px` · `border-radius: 12px` · `--shadow-lg` |
| Fundo do card | `--bg-base: #FFFFFF` |
| Wordmark | "Ambaril" · Bricolage Grotesque · 24px · weight 500 · `--text-white` |
| Subtítulo | **Nenhum** — quem chega ao login foi convidado. Não precisa de explicação |
| Campos | Email + Senha + "Lembrar de mim" (checkbox) |
| Botão primário | Max contrast: `#0F172A` bg · `#F8FAFC` text · sem accent colorido |
| Estado de erro | `--danger-muted` background · `--danger` text · mensagem específica (ex: "Email ou senha incorretos.") |

---

### 5. Copywriting do login

| Elemento | Copy | Regra |
|---|---|---|
| Wordmark | "Ambaril" | Title case. Nunca lowercase, CAPS ou camelCase |
| Label email | "Email" | Simples |
| Label senha | "Senha" | Simples |
| Checkbox | "Lembrar de mim" | Sem ponto final |
| Botão | "Entrar" | Sem ícone obrigatório, sem "→" decorativo |
| Erro genérico | "Email ou senha incorretos." | Específico, sem julgamento, sem ponto de exclamação |
| Erro de rede | "Não foi possível conectar. Tente novamente." | Factual |

---

## Parte III — Decisões de sistema

### Remoção do accent colorido

Esta sessão de design resulta em uma mudança de sistema que deve ser propagada ao DS.md:

| Token | Antes | Depois |
|---|---|---|
| `--accent` | `oklch(65% 0.12 60)` (âmbar) | **Removido** |
| `--btn-primary-bg` | `var(--accent)` | `#0F172A` (light) / `#F7F8FA` (dark) |
| Navigation active state | `border-left: 2px solid var(--accent)` | `border-left: 2px solid var(--border-strong)` + background shift |
| `--accent-hover`, `--accent-muted`, `--accent-text` | Definidos | **Removidos** |

**Razão:** "A ausência de cor enquanto todos usam cor é uma posição, não timidez." O botão `#0F172A` sobre fundo branco é o elemento mais contrастante da tela — mais distinto que qualquer accent.

**Impacto:** Atualizar `DS.md §2.4`, `globals.css`, e qualquer componente que referencia `var(--accent)`.

---

## Arquivos de referência

| Arquivo | Conteúdo |
|---|---|
| `hero-overdrive.html` | 4 variações de hero com spring physics, drifting spheres, dark Silmaril (V3), gradient text |
| `hero-cta-preview.html` | Comparação de opções A/B/C de CTA (arquivo anterior, superseded) |
| `DS.md` | Design system completo — consultar para tokens, tipografia, componentes |
| `.impeccable.md` | Contexto de design para todos os skills do ecossistema |
