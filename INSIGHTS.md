# INSIGHTS.md — Accumulated Learnings

> Mutable file. Items marked DONE auto-archive after 30 days.
> Max 50 items in Open + In Progress. Prune aggressively.
> All agents MUST read this before starting ambaril-web tasks.

## Open

- [2026-04-24] Sprint watchdog grep -c returns exit 1 on zero matches → false positive stall alerts
  - **Action:** Fixed grep pattern. Monitor for recurrence.
  - **Source:** harness-hardening sprint 2026-04-23

- [2026-04-24] Context overflow at 4.4MB / 241 messages crashes OpenClaw gateway
  - **Action:** CEO Protocol mandatory for 3+ tasks. Never skip.
  - **Source:** Multiple gateway crashes documented in memory

- [2026-04-24] OpenAI Plus plan hit usage limit at ~22:35 during heavy overnight session
  - **Action:** Monitor via check-openrouter-balance.sh. Fallback chain: GPT-5.4 → OpenRouter.
  - **Source:** 2026-04-23 overnight sprint

- [2026-04-24] Aule stray file detection (F8) needed — agents create files outside declared slice scope
  - **Action:** safety-gate.sh blocks .ts/.tsx files outside slice set. Verified working.
  - **Source:** dev-pipeline.sh hardening

- [2026-04-24] money.ts uses integer cents, DB uses NUMERIC(12,2) — conversion boundary must be explicit
  - **Action:** money-boundary.test.ts created. Always use toCents()/fromCents() at boundaries.
  - **Source:** Quality sprint 2026-04-24

## In Progress

- [2026-04-24] SOUL.md files are 150-400 lines — potential context bloat per Viv's attention research
  - **Action:** GROUP 7 will trim to <150 lines each. Extract reference material.
  - **Status:** Planned

## Completed

<!-- Items here auto-archive to INSIGHTS-ARCHIVE.md after 30 days -->
<!-- Format: - [date] ~~description~~ ✓ -->

- [2026-04-24] OpenClaw acumula processos zombie (openclaw-agent) que nunca terminam — consumiram 1.6GB RAM
  - **Action:** Criar cron de cleanup para processos openclaw com >24h de idade. OpenClaw não tem auto-cleanup.
  - **Source:** Manwe travou após 10 processos zombie acumulados de Apr 22-23

- [2026-04-24] Sessão do Manwe atingiu 3.1MB após 38 compactações — limite prático de compactação
  - **Action:** Resetar sessão quando tamanho excede 2.5MB. Toda knowledge está em SOUL.md + MEMORY.md, sessão descartável.
  - **Source:** Gateway travou, compactação não resolveu
