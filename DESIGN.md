---
version: "alpha"
name: "Moonstone"
description: "Ambaril dual-theme design system — light-first, no accent colors, premium ERP for Brazilian streetwear"

colors:
  # Backgrounds (light → dark overrides in prose)
  bg-void: "#E2E5EB"
  bg-base: "#F1F3F6"
  bg-raised: "#F7F8FA"
  bg-surface: "#FFFFFF"
  bg-elevated: "#FFFFFF"

  # Text hierarchy (7 levels, all WCAG AA on bg-surface)
  text-ghost: "#94A3B8"
  text-muted: "#64748B"
  text-subtle: "#475569"
  text-body: "#334155"
  text-strong: "#1E293B"
  text-heading: "#0F172A"
  text-white: "#0F172A"

  # Borders
  border-subtle: "#F0F1F3"
  border-default: "#E0E3E8"
  border-strong: "#C8CDD5"

  # Semantic (each with -muted at 8% opacity)
  success: "#16A34A"
  success-muted: "#F0FAF4"
  danger: "#DC2626"
  danger-muted: "#FEF2F2"
  warning: "#D97706"
  warning-muted: "#FFFBEB"
  info: "#2563EB"
  info-muted: "#EFF6FF"

  # Buttons
  btn-primary-bg: "#0F172A"
  btn-primary-text: "#FFFFFF"
  btn-secondary-bg: "#FFFFFF"
  btn-secondary-text: "#1E293B"
  btn-ghost-text: "#475569"

  # Primary role mapping (spec recommended names)
  primary: "#0F172A"
  on-primary: "#FFFFFF"
  surface: "#FFFFFF"
  on-surface: "#334155"
  error: "#DC2626"

  # Organizational palette (8 muted colors for tags/categories)
  org-slate-bg: "#F3F4F6"
  org-slate-text: "#475569"
  org-blue-bg: "#EFF6FF"
  org-blue-text: "#2563EB"
  org-violet-bg: "#F5F3FF"
  org-violet-text: "#7C3AED"
  org-rose-bg: "#FFF1F2"
  org-rose-text: "#E11D48"
  org-amber-bg: "#FFFBEB"
  org-amber-text: "#D97706"
  org-emerald-bg: "#ECFDF5"
  org-emerald-text: "#059669"
  org-cyan-bg: "#ECFEFF"
  org-cyan-text: "#0891B2"
  org-orange-bg: "#FFF7ED"
  org-orange-text: "#EA580C"

  # Chart dataset colors
  chart-1: "#334155"
  chart-2: "#64748B"
  chart-3: "#94A3B8"
  chart-4: "#CBD5E1"
  chart-5: "#E2E8F0"
  chart-6: "#475569"
  chart-7: "#1E293B"
  chart-8: "#0F172A"

typography:
  display:
    fontFamily: "Bricolage Grotesque"
    fontSize: 48px
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: "Bricolage Grotesque"
    fontSize: 32px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: -0.01em
  headline-md:
    fontFamily: "DM Sans"
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: 0em
  headline-sm:
    fontFamily: "DM Sans"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: 0em
  body-md:
    fontFamily: "DM Sans"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: 0em
  body-sm:
    fontFamily: "DM Sans"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0.01em
  label-sm:
    fontFamily: "Bricolage Grotesque"
    fontSize: 10px
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: 0.15em
  mono:
    fontFamily: "DM Mono"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em

rounded:
  none: 0px
  sm: 6px
  md: 8px
  lg: 12px
  full: 9999px

spacing:
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  5: 20px
  6: 24px
  8: 32px
  10: 40px
  16: 64px

components:
  button-primary:
    backgroundColor: "{colors.btn-primary-bg}"
    textColor: "{colors.btn-primary-text}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 36px
  button-primary-hover:
    backgroundColor: "#1E293B"
  button-secondary:
    backgroundColor: "{colors.btn-secondary-bg}"
    textColor: "{colors.btn-secondary-text}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 36px
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.btn-ghost-text}"
    rounded: "{rounded.md}"
    padding: 12px
  kpi-card:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.lg}"
    padding: 20px
  kpi-card-label:
    typography: "{typography.label-sm}"
    textColor: "{colors.text-muted}"
  kpi-card-value:
    typography: "{typography.headline-lg}"
    textColor: "{colors.text-heading}"
  data-table-header:
    typography: "{typography.label-sm}"
    textColor: "{colors.text-muted}"
    backgroundColor: "{colors.bg-raised}"
    height: 36px
    padding: 12px
  data-table-row:
    typography: "{typography.body-md}"
    textColor: "{colors.text-body}"
    backgroundColor: "{colors.bg-surface}"
    height: 40px
    padding: 12px
  data-table-row-hover:
    backgroundColor: "{colors.bg-raised}"
  input:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-body}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: 36px
    padding: 12px
  card:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.lg}"
    padding: 20px
  sidebar-item:
    textColor: "{colors.text-muted}"
    rounded: "{rounded.md}"
    padding: 8px
  sidebar-item-active:
    backgroundColor: "{colors.bg-raised}"
    textColor: "{colors.text-heading}"
  badge:
    rounded: "{rounded.sm}"
    padding: 4px
    typography: "{typography.body-sm}"
  flare-alert:
    rounded: "{rounded.md}"
    padding: 12px
  sheet:
    backgroundColor: "{colors.bg-surface}"
    rounded: "{rounded.lg}"
    width: 420px
---

# Moonstone Design System

## Overview

Moonstone is a light-first, no-accent-color design system for Ambaril — a multi-tenant ERP serving Brazilian streetwear e-commerces. The visual identity is premium, contained, and data-forward. Think Shopify Admin, never a marketing site.

**Brand voice:** precise, premium, confident, intelligent. Never corporate-generic, theatrical, or cyber/sci-fi.

**Three energy levels govern every route:**

- **L0 Workhorse** — Tables, forms, settings. Zero decoration. Data is protagonist.
- **L1 Ambient** — Dashboards, KPIs, charts. Subtle shadows, staggered fade-ins, 5% landing-page energy.
- **L2 Moment** — Onboarding, empty states, auth. Display typography, generous spacing, 15% landing-page energy.

**Target users:** Brazilian streetwear brand operators. 90% desktop. Shopify-like mental models.

## Colors

Moonstone uses a **neutral-only** palette — no brand accent colors. Differentiation comes from typography weight, spacing, and elevation rather than color.

**Dual-theme:** Light is default and ships first. Dark is opt-in. In light theme, elevation = shadow + border. In dark theme, elevation = background color shift (darker surfaces are lower, lighter surfaces are higher).

**Dark mode overrides** (key differences from YAML tokens above):

| Token            | Light   | Dark    |
| ---------------- | ------- | ------- |
| bg-void          | #E2E5EB | #0B0F1A |
| bg-base          | #F1F3F6 | #0F1629 |
| bg-raised        | #F7F8FA | #162036 |
| bg-surface       | #FFFFFF | #1A2744 |
| bg-elevated      | #FFFFFF | #1E2D52 |
| text-body        | #334155 | #CBD5E1 |
| text-heading     | #0F172A | #F1F5F9 |
| btn-primary-bg   | #0F172A | #F7F8FA |
| btn-primary-text | #FFFFFF | #0F172A |

**Semantic colors** stay the same across themes. Organizational palette backgrounds shift from 8% opacity to 12% opacity in dark mode.

**Transparency tokens:** Border and muted semantic colors use `rgba()` transparency in CSS (see DS.md Section 13). The YAML tokens above show their resolved hex equivalents on white background for validation compatibility. Always use the CSS custom properties (`var(--border-subtle)` etc.), never the hex values directly.

**Font smoothing:** Light uses `auto`, Dark uses `antialiased`.

## Typography

Three families, each with a distinct role:

- **Bricolage Grotesque** — Identity and status: H1, KPI heroes, display numbers, section labels (uppercase wide), status grades
- **DM Sans** — Interface: H2, H3, body text, buttons, inputs, tooltips — the workhorse
- **DM Mono** — Precision: R$ values, order IDs, codes, dates, agent logs

The scale uses 8 levels (see YAML tokens). Never use a size outside the scale. Bricolage labels are always uppercase with `letter-spacing: 0.15em`.

**Number formatting:** Always use `font-variant-numeric: tabular-nums` for columns of numbers. R$ values use DM Mono with non-breaking space after the symbol.

## Layout & Spacing

**Base unit:** 4px. Nine spacing tokens from space-1 (4px) to space-16 (64px). Never use arbitrary pixel values.

**Dense-first philosophy:** 80% of the interface is dense (12-16px card padding, 36-40px row height, 8-12px gaps). 20% is spacious (empty states, onboarding). ERP operators scan data fast — density respects their time.

**Grid rules:** Dashboards use asymmetric grids — col-span-2 beside col-span-1, never perfectly symmetric. Forms follow Shopify's grid-cols-[1fr_320px] pattern with a sticky summary sidebar.

**Overflow:** All flex children get `min-width: 0`. Long text gets `text-overflow: ellipsis`. Use `text-wrap: pretty` for prose, `text-wrap: balance` for headings.

## Elevation & Depth

**Light theme:** Differentiate via `box-shadow` + `border` — 4 shadow levels from sm (subtle) to xl (floating modals).

**Dark theme:** Differentiate via `background-color` shift — no shadows. Deeper = darker (#0B0F1A), higher = lighter (#1E2D52).

Shadows use slate-900 with opacity: sm (3%+2%), md (6%+3%), lg (10%+4%), xl (16%+6%).

## Shapes

Corner radii follow a consistent language:

- **12px** — Cards, modals, sheets (container-level)
- **8px** — Inputs, buttons, dropdowns (interactive elements)
- **5-6px** — Bars, badges, small chips (detail-level)
- **9999px** — Pills, avatar circles

Never mix radii at the same nesting level. Inner radius = outer radius - padding.

## Components

Built on **shadcn/ui** (Radix + cva + Tailwind). Components copied to `packages/ui`.

**Icons:** Lucide React, `strokeWidth={1.75}`, sizes: 14px inline, 16px default, 18px prominent, 20px navigation, 24px hero.

**Interaction patterns:**

- List item click → Sheet (lateral slide-in, 420px or 560px)
- Edit action → Full page
- Create action → Full page
- Confirm/delete → Modal (centered, max 480px)
- Complex config → Dual-pane modal

**Brilho (light-point emphasis):**

- Dark theme: gradient border + radial glow on `bg-surface`
- Light theme: `shadow-md` + `border-default` — never glow

**One primary CTA per visible area.** Secondary actions use ghost or secondary buttons. Never two primary buttons in the same section.

## Do's and Don'ts

**Always:**

- Light theme default, dark opt-in
- Apply energy level before any styling decision
- Use sidebar as spatial map (not just menu)
- Follow Shopify-like form patterns
- Use `tabular-nums` for number columns
- R$ with non-breaking space after symbol

**Never:**

- Invent accent colors — Moonstone is neutral-only
- Add glow, gradient, or animation at L0 (Workhorse)
- Create symmetric dashboard grids
- Center-align operational cards (except empty states)
- Create a parallel visual identity for AI features
- Use brand metaphors to compensate for functional ambiguity
- Use a font size outside the 8-level type scale

**Use sheet for:** quick inspect, preview, detail view
**Use full page for:** create, edit, complex workflows
**Use modal for:** confirmation, deletion, short input
**Do not use for data tables:** glow, blur, excess Bricolage, prolonged motion
