# ESAA-Security Audit Report — Ambaril

> **Report ID:** RPT-SEC-20260402-001
> **Generated:** 2026-04-02T00:00:00Z
> **Agent Model:** Claude Opus 4.6
> **Protocol:** ESAA-Security v1.0.0 (95 checks, 16 domains, 4 phases)
> **Target:** /Users/boromarl/Downloads/Ambaril/ambaril
> **Stack:** Next.js 15 + React 19 + Drizzle ORM + Neon PostgreSQL + Vercel

---

## 1. Resumo Executivo

### Security Score: 52.7 / 100 — REGULAR (Fair)

O Ambaril demonstra **fundamentos arquiteturais sólidos** (multi-tenancy com RLS, Argon2id, AES-256-GCM, Server Actions com CSRF nativo), mas possui **lacunas significativas na camada operacional**: security headers não implementados, pipeline DevSecOps ausente, rate limiting incompleto, e conformidade LGPD apenas documentada.

**O gap principal é entre documentação e implementação.** AUTH.md, LGPD.md e AUDIT-LOG.md descrevem controles robustos que não existem no código.

### Score por Dominio

| #   | Dominio              | Prioridade | Score    | Pass | Partial | Fail | N/A |
| --- | -------------------- | ---------- | -------- | ---- | ------- | ---- | --- |
| 1   | Secrets & Config     | Critical   | **87.5** | 7    | 0       | 1    | 0   |
| 2   | Authentication       | Critical   | **56.3** | 5    | 1       | 2    | 0   |
| 3   | Authorization        | Critical   | **41.7** | 1    | 4       | 0    | 1   |
| 4   | Input Validation     | Critical   | **50.0** | 3    | 4       | 0    | 0   |
| 5   | Data Security        | Critical   | **40.0** | 1    | 3       | 1    | 0   |
| 6   | Dependencies         | High       | **58.3** | 3    | 2       | 1    | 0   |
| 7   | API Security         | High       | **21.4** | 0    | 5       | 0    | 2   |
| 8   | File Upload          | High       | **N/A**  | 0    | 1       | 0    | 5   |
| 9   | Session Security     | High       | **91.7** | 5    | 1       | 0    | 0   |
| 10  | Cryptography         | High       | **60.0** | 3    | 1       | 1    | 0   |
| 11  | Infrastructure       | High       | **60.0** | 3    | 2       | 0    | 1   |
| 12  | AI/LLM Security      | High       | **N/A**  | 0    | 0       | 0    | 5   |
| 13  | Security Headers     | Medium     | **0.0**  | 0    | 0       | 5    | 0   |
| 14  | Logging & Monitoring | Medium     | **20.0** | 0    | 2       | 3    | 0   |
| 15  | DevSecOps            | Medium     | **8.3**  | 0    | 1       | 5    | 0   |
| 16  | Frontend Security    | Medium     | **87.5** | 3    | 1       | 0    | 0   |

> **Score global** = media ponderada (critical x3, high x2, medium x1)
> **Penalty rules aplicadas:** 1 finding CRITICAL (IV-006 IDOR) → score capped em 70

### Estatisticas

| Metrica                    | Valor |
| -------------------------- | ----- |
| Total de checks executados | 95    |
| Pass                       | 37    |
| Partial                    | 28    |
| Fail                       | 19    |
| Not Applicable             | 11    |
| Dominios auditados         | 16    |
| Findings CRITICAL          | 1     |
| Findings HIGH              | 13    |
| Findings MEDIUM            | 17    |
| Findings LOW               | 3     |
| Findings INFO              | 0     |

### Top 5 Riscos Prioritarios

| #   | Check      | Vulnerabilidade                                                                          | Dominio          | Severidade   | Acao Imediata                                           |
| --- | ---------- | ---------------------------------------------------------------------------------------- | ---------------- | ------------ | ------------------------------------------------------- |
| 1   | IV-006     | **IDOR em resetPasswordAction** — userId vem de hidden field do client                   | Input Validation | **CRITICAL** | Revalidar token server-side; nao aceitar userId do form |
| 2   | AU-006     | **Zero brute force protection** em login por senha                                       | Authentication   | HIGH         | Adicionar rate limit (5/min por email)                  |
| 3   | AZ-003     | **Server actions sem permission check** — qualquer user autenticado modifica integracoes | Authorization    | HIGH         | Adicionar requirePermission() em todas as actions       |
| 4   | SH-001-005 | **Todos os 5 security headers documentados mas nao implementados**                       | Sec. Headers     | HIGH         | Copiar bloco de AUTH.md Section 7 para next.config.ts   |
| 5   | DO-002/003 | **Zero pipeline de seguranca** — sem CI, sem pre-commit hooks, sem SAST                  | DevSecOps        | HIGH         | Instalar husky + gitleaks + pnpm audit no CI            |

---

## 2. Matriz de Vulnerabilidades

| FIND-ID  | Check  | Vulnerabilidade                                                           | Dominio          | Severidade   | CIA Impact               | Status  | Remediacao                                                   |
| -------- | ------ | ------------------------------------------------------------------------- | ---------------- | ------------ | ------------------------ | ------- | ------------------------------------------------------------ |
| FIND-001 | IV-006 | IDOR em resetPasswordAction — userId de hidden field                      | input_validation | **CRITICAL** | C:high I:high A:low      | fail    | Revalidar token server-side, nao aceitar userId do client    |
| FIND-002 | AU-006 | Login por senha sem rate limiting ou brute force protection               | authentication   | HIGH         | C:high I:medium A:low    | fail    | Rate limit 5/min por email+IP, lockout progressivo           |
| FIND-003 | AZ-003 | Permission check so no frontend — server actions nao verificam permissoes | authorization    | HIGH         | C:medium I:high A:low    | partial | requirePermission() em todas as server actions               |
| FIND-004 | SC-008 | Senha plaintext logada no console em signup (dev)                         | secrets_config   | HIGH         | C:high I:low A:none      | fail    | Remover password do console.info()                           |
| FIND-005 | SH-001 | CSP nao implementado (documentado em AUTH.md)                             | security_headers | HIGH         | C:medium I:medium A:low  | fail    | Adicionar headers() em next.config.ts                        |
| FIND-006 | SH-002 | HSTS nao implementado                                                     | security_headers | HIGH         | C:medium I:medium A:none | fail    | Adicionar HSTS header em next.config.ts                      |
| FIND-007 | CR-005 | Zero mecanismo de key rotation para ENCRYPTION_KEY                        | cryptography     | HIGH         | C:high I:medium A:low    | fail    | Versionar keys (enc:v1:), suportar multi-key decrypt         |
| FIND-008 | DS-001 | 4 CVEs em dependencias (1 HIGH lodash, 3 MODERATE)                        | dependencies     | HIGH         | C:medium I:medium A:low  | fail    | pnpm.overrides para lodash>=4.18.0                           |
| FIND-009 | DO-002 | Zero pipeline de seguranca — sem CI, SAST, ou dependency audit            | devsecops        | HIGH         | C:high I:high A:medium   | fail    | GitHub Actions com pnpm audit + eslint-plugin-security       |
| FIND-010 | DO-003 | Sem secrets scanning (sem pre-commit hooks, sem gitleaks)                 | devsecops        | HIGH         | C:high I:low A:none      | fail    | Instalar husky + gitleaks pre-commit hook                    |
| FIND-011 | DA-003 | Politica de retencao documentada mas nao implementada                     | data_security    | HIGH         | C:medium I:low A:low     | partial | Implementar cron lgpd:data-purge antes de producao           |
| FIND-012 | DA-005 | LGPD compliance so em documentacao — sem APIs, sem consent UI             | data_security    | HIGH         | C:high I:medium A:low    | partial | Implementar endpoints LGPD e consent UI antes de dados reais |
| FIND-013 | AP-001 | Rate limit parcial — password login e waitlist sem protecao               | api_security     | HIGH         | C:medium I:low A:medium  | partial | Rate limit em loginWithPasswordAction e waitlist             |
| FIND-014 | LM-001 | Senha plaintext em logs de desenvolvimento                                | logging          | HIGH         | C:high I:low A:none      | partial | Remover password de output de log                            |
| FIND-015 | AU-003 | Nenhuma implementacao de MFA/2FA                                          | authentication   | MEDIUM       | C:high I:medium A:none   | fail    | Implementar TOTP para admin, opt-in para outros              |
| FIND-016 | AU-005 | Sessoes sem idle timeout; sem limpeza de sessoes expiradas                | authentication   | MEDIUM       | C:medium I:low A:low     | partial | Adicionar idle timeout + cron cleanup                        |
| FIND-017 | AZ-001 | ROUTE_ROLES definido mas nunca enforced; /api bypassa middleware          | authorization    | MEDIUM       | C:medium I:medium A:low  | partial | Ativar ROUTE_ROLES check; remover skip de /api               |
| FIND-018 | AZ-002 | RLS existe mas nem todas as queries usam withTenantContext()              | authorization    | MEDIUM       | C:high I:high A:none     | partial | Padronizar uso de withTenantContext()                        |
| FIND-019 | AZ-005 | Matriz de permissoes incompleta para maioria dos 11 modulos               | authorization    | MEDIUM       | C:medium I:medium A:none | partial | Completar permission matrix antes de cada modulo             |
| FIND-020 | AP-003 | User enumeration via signup ("Este email ja esta cadastrado")             | api_security     | MEDIUM       | C:medium I:none A:none   | partial | Retornar sucesso generico; enviar email informando           |
| FIND-021 | AP-004 | saveIntegration aceita credentials sem validacao Zod                      | api_security     | MEDIUM       | C:low I:medium A:low     | partial | Adicionar Zod schema por provider                            |
| FIND-022 | IV-004 | SSRF potencial via credential shop domain (Shopify)                       | input_validation | MEDIUM       | C:medium I:low A:low     | partial | Validar URLs no save, bloquear IPs privados                  |
| FIND-023 | IV-005 | XSS em template de email do waitlist (interpolacao sem escape)            | input_validation | MEDIUM       | C:low I:medium A:none    | partial | HTML-escape user input em emails                             |
| FIND-024 | IV-007 | Zero sanitizacao de HTML — sem DOMPurify ou he                            | input_validation | MEDIUM       | C:low I:medium A:none    | partial | Adicionar escapeHtml() utility                               |
| FIND-025 | AP-002 | Queries .select() buscam todas as colunas (incluindo passwordHash)        | api_security     | MEDIUM       | C:medium I:low A:none    | partial | Usar .select({}) explicito com colunas necessarias           |
| FIND-026 | AP-007 | Server actions sensiveis sem idempotency keys                             | api_security     | MEDIUM       | C:low I:medium A:low     | partial | Adicionar idempotency keys para saveIntegration              |
| FIND-027 | SH-003 | X-Frame-Options nao implementado                                          | security_headers | MEDIUM       | C:low I:medium A:none    | fail    | Adicionar header em next.config.ts                           |
| FIND-028 | SH-004 | X-Content-Type-Options nao implementado                                   | security_headers | MEDIUM       | C:low I:medium A:none    | fail    | Adicionar header em next.config.ts                           |
| FIND-029 | CR-001 | HTTPS enforced via Vercel mas sem HSTS header explicito                   | cryptography     | MEDIUM       | C:medium I:low A:none    | partial | Adicionar HSTS header                                        |
| FIND-030 | SS-005 | Sessoes sem idle timeout; lastActiveAt tracked mas nao usado              | session_security | MEDIUM       | C:medium I:low A:none    | partial | Enforce idle timeout usando lastActiveAt                     |
| FIND-031 | IF-002 | Sem WAF configurado (Cloudflare DNS/CDN mas sem regras WAF)               | infrastructure   | MEDIUM       | C:low I:low A:medium     | partial | Habilitar Cloudflare WAF OWASP rules                         |
| FIND-032 | IF-003 | Sem IP allowlist no Neon PostgreSQL                                       | infrastructure   | MEDIUM       | C:high I:high A:low      | partial | Configurar Neon IP Allow List                                |
| FIND-033 | LM-002 | Audit trail: schema existe mas hooks nao implementados                    | logging          | MEDIUM       | C:medium I:medium A:none | partial | Implementar audit hooks por modulo                           |
| FIND-034 | LM-003 | Zero structured logging — so console.log                                  | logging          | MEDIUM       | C:low I:low A:low        | fail    | Adotar pino com JSON output                                  |
| FIND-035 | LM-004 | Sem alertas de seguranca (login failures, permission denied)              | logging          | MEDIUM       | C:medium I:low A:low     | fail    | Implementar alertas via Discord webhook                      |
| FIND-036 | LM-005 | Sem correlation IDs (x-request-id)                                        | logging          | MEDIUM       | C:low I:low A:low        | fail    | Gerar requestId no middleware                                |
| FIND-037 | DA-002 | PII duplicado entre crm.contacts e crm.personal_data                      | data_security    | MEDIUM       | C:medium I:low A:none    | partial | Auditar se duplicacao e necessaria                           |
| FIND-038 | DA-004 | Sem anonimizacao de dados para ambientes nao-producao                     | data_security    | MEDIUM       | C:medium I:low A:none    | fail    | Implementar masking script para Neon branches                |
| FIND-039 | DS-005 | Sem SBOM ou politica formal de revisao de dependencias                    | dependencies     | MEDIUM       | C:low I:low A:low        | partial | Adicionar pnpm audit ao CI                                   |
| FIND-040 | DS-006 | CI nao implementado — --frozen-lockfile nao enforced                      | dependencies     | MEDIUM       | C:low I:medium A:low     | partial | Implementar CI pipeline                                      |
| FIND-041 | DO-001 | Sem branch protection ou CODEOWNERS                                       | devsecops        | MEDIUM       | C:low I:medium A:low     | fail    | Configurar branch protection no GitHub                       |
| FIND-042 | DO-004 | Sem SAST (sem eslint-plugin-security, sem Semgrep)                        | devsecops        | MEDIUM       | C:medium I:low A:none    | fail    | Adicionar eslint-plugin-security                             |
| FIND-043 | FE-003 | Sem audit automatizado de deps frontend                                   | frontend         | MEDIUM       | C:low I:low A:low        | partial | Adicionar pnpm audit ao CI                                   |
| FIND-044 | AZ-006 | Acoes destrutivas sem confirmacao server-side                             | authorization    | LOW          | C:none I:medium A:low    | partial | Adicionar confirmation token para deletes                    |
| FIND-045 | SH-005 | Referrer-Policy nao implementado                                          | security_headers | LOW          | C:low I:low A:none       | fail    | Adicionar header em next.config.ts                           |
| FIND-046 | AP-005 | API versioning documentado mas nao enforced                               | api_security     | LOW          | C:none I:low A:none      | partial | Usar /api/v1/ prefix quando implementar                      |
| FIND-047 | FU-006 | Extensao de arquivo extraida sem sanitizacao (stub)                       | file_upload      | LOW          | C:low I:low A:none       | partial | Sanitizar extensao quando upload for ativo                   |
| FIND-048 | DO-005 | Sem DAST (OWASP ZAP, etc.)                                                | devsecops        | LOW          | C:low I:low A:low        | fail    | Considerar ZAP baseline scan em staging                      |
| FIND-049 | DO-006 | Deploy audit trail apenas via Vercel logs                                 | devsecops        | LOW          | C:low I:low A:none       | partial | Notificacoes de deploy via Discord                           |

---

## 3. Riscos Prioritarios — Analise Expandida

### Risco #1: IDOR em Reset de Senha (FIND-001 / IV-006) — CRITICAL

**O que acontece se explorado:**
Um atacante pode redefinir a senha de QUALQUER usuario do sistema. Com acesso a uma conta admin, o atacante controla todas as integracoes (Shopify, pagamentos), dados de clientes, e credenciais criptografadas.

**Cenario de exploracao:**

1. Atacante solicita reset de senha com seu proprio email
2. Recebe magic link valido por email
3. Acessa `/login/reset-password?token=<valid_token>`
4. Page component (RSC) consome o token e renderiza form com `userId` em hidden field
5. Atacante modifica o hidden field `userId` para UUID de outro usuario (admin)
6. Submete o form — `resetPasswordAction` aceita o userId do form e define nova senha
7. Atacante faz login como admin com a nova senha

**Remediacao:**
| Prazo | Acao |
|-------|------|
| Imediato (24h) | Nao aceitar userId do form. Armazenar userId no server (session/cache) durante verificacao do token |
| Curto prazo | Invalidar TODAS as sessoes do usuario apos reset (ja implementado parcialmente) |
| Longo prazo | Implementar rate limit no reset + notificacao por email ao dono da conta |

**Esforco:** Horas

---

### Risco #2: Brute Force em Login por Senha (FIND-002 / AU-006) — HIGH

**O que acontece se explorado:**
Atacante testa milhoes de combinacoes de senha contra qualquer email conhecido. Sem rate limiting, apenas a forca da senha (Argon2id e lento, mas nao impede volume massivo).

**Cenario de exploracao:**

1. Atacante identifica emails validos (via signup enumeration — FIND-020)
2. Executa dictionary attack contra `loginWithPasswordAction`
3. Sem rate limit, cada tentativa e processada — Argon2id adiciona ~200ms de delay natural
4. Com 300 req/s paralelas, testa ~25 milhoes de senhas/dia

**Remediacao:**
| Prazo | Acao |
|-------|------|
| Imediato (24h) | Implementar rate limit: 5 tentativas/email/15min usando tabela PostgreSQL |
| Curto prazo | Lockout progressivo: 15min apos 5 falhas, 1h apos 10, email de alerta |
| Longo prazo | CAPTCHA apos 3 falhas + MFA para admin |

**Esforco:** Horas

---

### Risco #3: Server Actions Sem Permission Check (FIND-003 / AZ-003) — HIGH

**O que acontece se explorado:**
Um usuario com role `support` ou `commercial` pode chamar `saveIntegration()` e sobrescrever credenciais do Shopify, Mercado Pago, ou qualquer integracao — redirecionar pagamentos, alterar dados de e-commerce.

**Cenario de exploracao:**

1. Usuario `support` (Slimgust) faz login normalmente
2. Navega para `/admin/settings/integrations` (UI pode esconder, mas rota e acessivel)
3. Chama `saveIntegration("shopify", "ecommerce", {shop: "malicious.myshopify.com", ...})`
4. Todas as consultas de produto/pedido agora vao para loja controlada pelo atacante

**Remediacao:**
| Prazo | Acao |
|-------|------|
| Imediato (48h) | Adicionar `if (!session.effectivePermissions.includes("admin:settings:write")) throw` em TODAS as server actions de settings |
| Curto prazo | Criar helper `requirePermission(session, "resource:action")` reutilizavel |
| Longo prazo | Middleware-level permission enforcement usando ROUTE_ROLES |

**Esforco:** Horas

---

### Risco #4: Security Headers Ausentes (FIND-005 a FIND-028) — HIGH

**O que acontece se explorado:**
Sem CSP: XSS persistente pode executar scripts arbitrarios. Sem X-Frame-Options: clickjacking pode roubar sessoes. Sem HSTS: downgrade attacks podem interceptar cookies de sessao.

**Remediacao:**
| Prazo | Acao |
|-------|------|
| Imediato (1h) | Copiar bloco de headers de AUTH.md Section 7 para next.config.ts |

```typescript
// apps/web/next.config.ts
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://cdn.jsdelivr.net; font-src 'self' https://cdn.jsdelivr.net;" },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  }];
}
```

**Esforco:** 1 hora (quick win)

---

### Risco #5: Zero DevSecOps Pipeline (FIND-009/010/041/042) — HIGH

**O que acontece se explorado:**
Secrets podem ser commitados sem deteccao. Dependencias vulneraveis entram sem audit. Codigo inseguro e deployado sem analise estatica.

**Remediacao:**
| Prazo | Acao |
|-------|------|
| Imediato (2h) | `pnpm add -D husky lint-staged` + configurar pre-commit: `pnpm audit --audit-level=high` |
| Curto prazo | GitHub Actions: tsc, eslint com security plugin, pnpm audit |
| Longo prazo | Semgrep + OWASP ZAP baseline em staging |

**Esforco:** Dias

---

## 4. Recomendacoes Tecnicas por Tier

### Tier 1 — IMEDIATO (ate 48h) — Findings CRITICAL/HIGH

| FIND         | Acao                                                                                | Verificacao                                                             |
| ------------ | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| FIND-001     | Revalidar token server-side em resetPasswordAction; nao aceitar userId do form      | `curl -X POST /login/reset-password -d "userId=other-uuid"` deve falhar |
| FIND-002     | Rate limit em loginWithPasswordAction: 5/15min por email                            | 6a tentativa retorna 429                                                |
| FIND-003     | requirePermission() em saveIntegration/disconnectIntegration/testConnection         | Login como `support`, chamar saveIntegration → 403                      |
| FIND-004/014 | Remover `Senha: ${randomPassword}` do console.info em signup/actions.ts             | grep "randomPassword" retorna 0 matches                                 |
| FIND-005-006 | Adicionar headers() em next.config.ts com CSP + HSTS + X-Frame + nosniff + Referrer | `curl -sI https://app.ambaril.app \| grep -i strict-transport`          |
| FIND-007     | Versionar keys: `enc:v1:` prefix + multi-key decrypt support em crypto.ts           | Rotacionar ENCRYPTION_KEY sem quebrar credenciais existentes            |
| FIND-008     | `pnpm.overrides: { "lodash": ">=4.18.0" }` em root package.json                     | `pnpm audit` retorna 0 HIGH/CRITICAL                                    |
| FIND-009/010 | Instalar husky + gitleaks pre-commit + GitHub Actions basico                        | Commitar `.env` → pre-commit bloqueia                                   |

### Tier 2 — CURTO PRAZO (ate 2 semanas) — Findings HIGH restantes

| FIND         | Acao                                                              |
| ------------ | ----------------------------------------------------------------- |
| FIND-011/012 | Implementar cron lgpd:data-purge + consent UI basica              |
| FIND-013     | Rate limit no waitlist route (IP-based, 5/hora)                   |
| FIND-015     | Implementar TOTP para contas admin (otpauth ou @simplewebauthn)   |
| FIND-016     | Idle timeout: invalidar sessao se lastActiveAt > 2h               |
| FIND-017     | Ativar ROUTE_ROLES enforcement no middleware                      |
| FIND-020     | Signup: retornar sucesso generico; enviar email "conta ja existe" |
| FIND-032     | Configurar Neon IP Allow List (Vercel IPs + devs)                 |

### Tier 3 — HARDENING (proximo ciclo) — Findings MEDIUM/LOW

| FIND         | Acao                                                                 |
| ------------ | -------------------------------------------------------------------- |
| FIND-018     | Padronizar withTenantContext() em todos os data access paths         |
| FIND-019     | Completar permission matrix para todos os 11 modulos                 |
| FIND-021-024 | Zod validation em saveIntegration + escapeHtml() utility + DOMPurify |
| FIND-025     | .select({}) explicito em todas as queries (especialmente users)      |
| FIND-030     | Enforce idle timeout + cron de limpeza de sessoes expiradas          |
| FIND-031     | Habilitar Cloudflare WAF com OWASP rules                             |
| FIND-033-036 | Audit hooks + structured logging (pino) + correlation IDs            |
| FIND-037-038 | Resolver duplicacao PII + anonymization script para non-prod         |
| FIND-041-042 | Branch protection + CODEOWNERS + eslint-plugin-security              |

### Tier 4 — BOAS PRATICAS

| Dominio        | Pratica                                                            | Referencia                |
| -------------- | ------------------------------------------------------------------ | ------------------------- |
| Authentication | Hash session tokens no DB com SHA-256 (protecao contra DB dump)    | OWASP Session Management  |
| Authorization  | Implementar ABAC alem de RBAC quando B2B/Creators tiver multi-user | NIST SP 800-162           |
| Cryptography   | Documentar runbook de key rotation com script de re-encryption     | CIS Controls v8.0         |
| Data Security  | DPIA (Data Protection Impact Assessment) formal antes de producao  | LGPD Art. 38              |
| DevSecOps      | SBOM (Software Bill of Materials) gerado automaticamente           | NIST SSDF                 |
| Monitoring     | Implementar Sentry performance + error tracking                    | OWASP Logging Cheat Sheet |
| Dependencies   | socket.dev para supply chain monitoring                            | SLSA Framework            |

---

## 5. Apendice — Resultados Completos (95 Checks)

### Secrets & Configuration (SEC-010) — CRITICAL

| Check  | Nome                        | Status   | Severidade |
| ------ | --------------------------- | -------- | ---------- |
| SC-001 | Segredos hardcoded          | PASS     | CRITICAL   |
| SC-002 | Chaves API no frontend      | PASS     | HIGH       |
| SC-003 | .env commitados             | PASS     | HIGH       |
| SC-004 | CORS permissivo             | N/A      | MEDIUM     |
| SC-005 | Debug mode em producao      | PASS     | HIGH       |
| SC-006 | Credenciais padrao          | PASS     | CRITICAL   |
| SC-007 | Configs de exemplo          | PASS     | MEDIUM     |
| SC-008 | Variaveis sensiveis em logs | **FAIL** | HIGH       |

### Authentication (SEC-012) — CRITICAL

| Check  | Nome                       | Status   | Severidade |
| ------ | -------------------------- | -------- | ---------- |
| AU-001 | Senhas em texto plano      | PASS     | CRITICAL   |
| AU-002 | Hash inseguro              | PASS     | HIGH       |
| AU-003 | Ausencia de MFA            | **FAIL** | MEDIUM     |
| AU-004 | Reset inseguro             | PASS     | HIGH       |
| AU-005 | Sessoes sem expiracao      | PARTIAL  | HIGH       |
| AU-006 | Sem brute force protection | **FAIL** | HIGH       |
| AU-007 | Tokens permanentes         | PASS     | HIGH       |
| AU-008 | Session fixation           | PASS     | HIGH       |

### Authorization (SEC-013) — CRITICAL

| Check  | Nome                       | Status  | Severidade |
| ------ | -------------------------- | ------- | ---------- |
| AZ-001 | Controle de acesso ausente | PARTIAL | CRITICAL   |
| AZ-002 | IDOR                       | PARTIAL | CRITICAL   |
| AZ-003 | Permissao so no frontend   | PARTIAL | CRITICAL   |
| AZ-004 | Admin routes expostas      | PASS    | HIGH       |
| AZ-005 | Escopo de permissoes       | PARTIAL | MEDIUM     |
| AZ-006 | Acoes sem confirmacao      | PARTIAL | LOW        |

### API Security (SEC-014) — HIGH

| Check  | Nome                  | Status  | Severidade |
| ------ | --------------------- | ------- | ---------- |
| AP-001 | Sem rate limit        | PARTIAL | HIGH       |
| AP-002 | Dados excessivos      | PARTIAL | MEDIUM     |
| AP-003 | User enumeration      | PARTIAL | MEDIUM     |
| AP-004 | Sem schema validation | PARTIAL | HIGH       |
| AP-005 | Sem API versioning    | PARTIAL | LOW        |
| AP-006 | Sem paginacao         | N/A     | MEDIUM     |
| AP-007 | Replay attacks        | PARTIAL | MEDIUM     |

### Input Validation (SEC-015) — CRITICAL

| Check  | Nome                 | Status  | Severidade |
| ------ | -------------------- | ------- | ---------- |
| IV-001 | SQL injection        | PASS    | CRITICAL   |
| IV-002 | Command injection    | PASS    | CRITICAL   |
| IV-003 | Template injection   | PASS    | HIGH       |
| IV-004 | SSRF                 | PARTIAL | HIGH       |
| IV-005 | XSS                  | PARTIAL | HIGH       |
| IV-006 | Inputs nao validados | PARTIAL | MEDIUM     |
| IV-007 | Sanitizacao ausente  | PARTIAL | MEDIUM     |

### File Upload (SEC-016) — HIGH

| Check  | Nome                      | Status  | Severidade |
| ------ | ------------------------- | ------- | ---------- |
| FU-001 | Sem validacao de tipo     | N/A     | HIGH       |
| FU-002 | Sem limite de tamanho     | N/A     | MEDIUM     |
| FU-003 | Storage no app server     | N/A     | MEDIUM     |
| FU-004 | Sem antivirus             | N/A     | MEDIUM     |
| FU-005 | Upload executavel         | N/A     | CRITICAL   |
| FU-006 | Filenames nao sanitizados | PARTIAL | HIGH       |

### Session Security (SEC-017) — HIGH

| Check  | Nome                 | Status  | Severidade |
| ------ | -------------------- | ------- | ---------- |
| SS-001 | Cookies sem httpOnly | PASS    | HIGH       |
| SS-002 | Cookies sem Secure   | PASS    | HIGH       |
| SS-003 | Cookies sem SameSite | PASS    | HIGH       |
| SS-004 | Sem CSRF protection  | PASS    | HIGH       |
| SS-005 | Expiracao de sessao  | PARTIAL | MEDIUM     |
| SS-006 | Tokens reutilizaveis | PASS    | HIGH       |

### Cryptography (SEC-018) — HIGH

| Check  | Nome               | Status   | Severidade |
| ------ | ------------------ | -------- | ---------- |
| CR-001 | HTTPS obrigatorio  | PARTIAL  | HIGH       |
| CR-002 | Algoritmos fracos  | PASS     | HIGH       |
| CR-003 | Encryption at rest | PASS     | HIGH       |
| CR-004 | Chaves expostas    | PASS     | HIGH       |
| CR-005 | Rotacao de chaves  | **FAIL** | HIGH       |

### Security Headers (SEC-019) — MEDIUM

| Check  | Nome                   | Status   | Severidade |
| ------ | ---------------------- | -------- | ---------- |
| SH-001 | CSP                    | **FAIL** | HIGH       |
| SH-002 | HSTS                   | **FAIL** | HIGH       |
| SH-003 | X-Frame-Options        | **FAIL** | MEDIUM     |
| SH-004 | X-Content-Type-Options | **FAIL** | MEDIUM     |
| SH-005 | Referrer-Policy        | **FAIL** | LOW        |

### Logging & Monitoring (SEC-020) — MEDIUM

| Check  | Nome                    | Status   | Severidade |
| ------ | ----------------------- | -------- | ---------- |
| LM-001 | Dados sensiveis em logs | PARTIAL  | HIGH       |
| LM-002 | Audit trail             | PARTIAL  | MEDIUM     |
| LM-003 | Structured logging      | **FAIL** | MEDIUM     |
| LM-004 | Alertas de seguranca    | **FAIL** | MEDIUM     |
| LM-005 | Correlation IDs         | **FAIL** | MEDIUM     |

### Infrastructure (SEC-021) — HIGH

| Check  | Nome                       | Status  | Severidade |
| ------ | -------------------------- | ------- | ---------- |
| IF-001 | HTTPS enforcement          | PASS    | HIGH       |
| IF-002 | Firewall/WAF               | PARTIAL | MEDIUM     |
| IF-003 | Segmentacao de rede        | PARTIAL | MEDIUM     |
| IF-004 | Backup strategy            | PASS    | HIGH       |
| IF-005 | DDoS protection            | PASS    | HIGH       |
| IF-006 | Container/runtime security | N/A     | MEDIUM     |

### DevSecOps (SEC-022) — MEDIUM

| Check  | Nome                | Status   | Severidade |
| ------ | ------------------- | -------- | ---------- |
| DO-001 | Code review process | **FAIL** | MEDIUM     |
| DO-002 | Security pipeline   | **FAIL** | HIGH       |
| DO-003 | Secrets scanning    | **FAIL** | HIGH       |
| DO-004 | SAST integration    | **FAIL** | MEDIUM     |
| DO-005 | DAST integration    | **FAIL** | LOW        |
| DO-006 | Deploy audit trail  | PARTIAL  | LOW        |

### Data Security (SEC-023) — CRITICAL

| Check  | Nome                 | Status   | Severidade |
| ------ | -------------------- | -------- | ---------- |
| DA-001 | Protecao de PII      | PASS     | CRITICAL   |
| DA-002 | Minimizacao de dados | PARTIAL  | MEDIUM     |
| DA-003 | Politica de retencao | PARTIAL  | HIGH       |
| DA-004 | Anonimizacao         | **FAIL** | MEDIUM     |
| DA-005 | LGPD/GDPR compliance | PARTIAL  | HIGH       |

### Frontend Security (SEC-024) — MEDIUM

| Check  | Nome                       | Status  | Severidade |
| ------ | -------------------------- | ------- | ---------- |
| FE-001 | Tokens em localStorage     | PASS    | HIGH       |
| FE-002 | HTML nao sanitizado        | PASS    | HIGH       |
| FE-003 | Deps JS vulneraveis        | PARTIAL | MEDIUM     |
| FE-004 | Logica critica no frontend | PASS    | HIGH       |

### AI/LLM Security (SEC-025) — HIGH

| Check  | Nome                  | Status | Severidade |
| ------ | --------------------- | ------ | ---------- |
| AI-001 | Prompt injection      | N/A    | CRITICAL   |
| AI-002 | LLM tool scope        | N/A    | HIGH       |
| AI-003 | Input filtering       | N/A    | HIGH       |
| AI-004 | Data exfiltration     | N/A    | HIGH       |
| AI-005 | AI decision audit log | N/A    | MEDIUM     |

---

## 6. Metadados da Auditoria

| Campo             | Valor                                  |
| ----------------- | -------------------------------------- |
| Run ID            | RPT-SEC-20260402-001                   |
| Audit Start       | 2026-04-02                             |
| Audit End         | 2026-04-02                             |
| Agent Model       | Claude Opus 4.6 (1M context)           |
| Protocol          | ESAA-Security v1.0.0                   |
| Playbooks Version | 1.0.0 (95 checks)                      |
| Roadmap Schema    | 0.4.0                                  |
| Total Checks      | 95                                     |
| Executed          | 84                                     |
| Not Applicable    | 11                                     |
| Phase 1 Tasks     | 3 (SEC-001, SEC-002, SEC-003)          |
| Phase 2 Tasks     | 16 (SEC-010 to SEC-025)                |
| Phase 3 Tasks     | 3 (SEC-030, SEC-031, SEC-032)          |
| Phase 4 Tasks     | 4 (SEC-040, SEC-041, SEC-042, SEC-043) |

### Cobertura por Dominio

| Dominio            | Total | Executados | N/A | Justificativa N/A                            |
| ------------------ | ----- | ---------- | --- | -------------------------------------------- |
| secrets_config     | 8     | 7          | 1   | SC-004: Sem API routes (Server Actions only) |
| authentication     | 8     | 8          | 0   | —                                            |
| authorization      | 6     | 6          | 0   | —                                            |
| api_security       | 7     | 5          | 2   | AP-006: Sem endpoints de listagem            |
| input_validation   | 7     | 7          | 0   | —                                            |
| file_upload        | 6     | 1          | 5   | Upload nao implementado ainda                |
| session_security   | 6     | 6          | 0   | —                                            |
| cryptography       | 5     | 5          | 0   | —                                            |
| security_headers   | 5     | 5          | 0   | —                                            |
| logging_monitoring | 5     | 5          | 0   | —                                            |
| infrastructure     | 6     | 5          | 1   | IF-006: Serverless, sem containers           |
| devsecops          | 6     | 6          | 0   | —                                            |
| data_security      | 5     | 5          | 0   | —                                            |
| frontend_security  | 4     | 4          | 0   | —                                            |
| ai_llm_security    | 5     | 0          | 5   | AI module nao implementado                   |
| dependencies       | 6     | 6          | 0   | —                                            |

---

> **Protocolo:** [ESAA-Security](https://github.com/elzobrito/ESAA-Security) — Event-Sourced Architecture for Autonomous Security Auditing
> **Papers:** [ESAA](https://arxiv.org/abs/2602.23193) | [ESAA-Security](https://arxiv.org/abs/2603.06365) | [PARCER](https://arxiv.org/abs/2603.00856)
