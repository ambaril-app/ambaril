# Ambaril — Security Checklist

> Baseado em ESAA-Security (16 domínios, 95 checks) + OWASP Top 10 + ASVS
> Adaptado para: Next.js 15 + Drizzle ORM + Neon PostgreSQL + RLS + Custom Auth
> Referência: https://github.com/elzobrito/ESAA-Security | https://arxiv.org/abs/2603.06365
> Status: Ativo — verificar a cada Wave

---

## Como Usar

- Agentes verificam os checks **relevantes ao escopo da Wave** antes de marcar task como done
- Lead verifica checklist completo no cross-review (Wave 5)
- Checks marcados `[P1]` são obrigatórios em toda Wave; `[P2]` a partir da Wave 3; `[P3]` antes do deploy

---

## Domínio 1: Secrets & Configuration

| # | Check | Prioridade | Notas |
|---|-------|-----------|-------|
| S01 | Nenhuma API key/secret hardcoded em código-fonte | P1 | Usar apenas `.env` |
| S02 | `.env` listado no `.gitignore` | P1 | Já configurado |
| S03 | `.env.example` não contém valores reais | P1 | Apenas placeholders |
| S04 | Variáveis sensíveis NÃO usam prefixo `NEXT_PUBLIC_` | P1 | NEXT_PUBLIC_ expõe no client bundle |
| S05 | Chaves de API (R2, Shopify, Yever, Resend) são rotacionáveis | P3 | Documentar processo de rotação |
| S06 | `DATABASE_URL` usa `sslmode=require` | P1 | Já no `.env` |
| S07 | Nenhum console.log com dados sensíveis em produção | P2 | Mascarar CPF, PIX, tokens |

---

## Domínio 2: Authentication

| # | Check | Prioridade | Notas |
|---|-------|-----------|-------|
| A01 | Senhas hasheadas com Argon2id (não bcrypt, não SHA) | P1 | Já implementado em `auth.ts` |
| A02 | Sessions armazenadas em PostgreSQL (`global.sessions`) | P1 | NÃO Redis (ADR-012) |
| A03 | Cookie `ambaril_session`: HttpOnly, Secure, SameSite=Lax, Path=/ | P1 | Verificar em `auth.ts` |
| A04 | Session ID gerado com `crypto.randomUUID()` ou UUID v7 | P1 | Não sequencial/previsível |
| A05 | Sliding window: `lastActiveAt` atualizado a cada request | P1 | Já implementado |
| A06 | Session TTL: 7 dias padrão, 30 dias com "remember me" | P2 | Configurável |
| A07 | Brute force: max 5 tentativas / 15 min por IP | P2 | PostgreSQL counter, não Redis |
| A08 | Password reset: token com TTL em PostgreSQL (1h expiry) | P2 | Tabela `password_reset_tokens` |
| A09 | Nenhum dado sensível no cookie (apenas session ID) | P1 | Não guardar role/permissions no cookie |
| A10 | Logout invalida session no banco (DELETE, não apenas expirar cookie) | P2 | Importante para revogação |

---

## Domínio 3: Authorization & Tenant Isolation

| # | Check | Prioridade | Notas |
|---|-------|-----------|-------|
| T01 | RLS policies ativas em TODAS as tabelas com `tenant_id` (~54 tabelas) | P1 | Verificar via query no Neon |
| T02 | `set_config('app.tenant_id', ...)` chamado em TODA transação | P1 | Via `withTenantContext()` |
| T03 | `getTenantSession()` usado em TODO server action | P1 | Retorna session com tenantId |
| T04 | Permission check `resource:action` antes de operações | P1 | Ex: `creators:write` |
| T05 | User de tenant A NÃO acessa dados de tenant B | P1 | Testar com 2 tenants no seed |
| T06 | Admin bypass restrito a `role='admin'` do MESMO tenant | P1 | Não cross-tenant |
| T07 | Creators/B2B acessam APENAS rotas do seu portal | P2 | Middleware route guard |
| T08 | Creator não acessa dados de outro creator | P2 | `creator_id` filter + RLS |
| T09 | Nenhum endpoint público retorna `tenant_id` ao client | P2 | Não expor internals |

---

## Domínio 4: Input Validation

| # | Check | Prioridade | Notas |
|---|-------|-----------|-------|
| V01 | Zod schema em TODA entrada de server action | P1 | `safeParse()` antes de qualquer DB query |
| V02 | CPF validado com check-digit (não apenas formato) | P1 | 11 dígitos + verificação |
| V03 | Email validado com Zod `.email()` | P1 | |
| V04 | Instagram handle: formato válido (alfanumérico + underscore + ponto) | P2 | |
| V05 | Valores monetários: `NUMERIC(12,2)` no DB, nunca float/double | P1 | CLAUDE.md rule |
| V06 | HTML sanitizado em campos de texto livre (bio, descrição) | P2 | Prevenir XSS stored |
| V07 | File upload: tipo, tamanho, dimensão validados server-side | P1 | Ver domínio 7 |
| V08 | UUIDs validados antes de query (prevenir SQL injection em params) | P1 | Zod `.uuid()` |
| V09 | Paginação: `limit` com máximo enforçado (ex: 100) | P2 | Prevenir DoS por query pesada |
| V10 | Coupon codes: uppercase, alfanumérico, sem caracteres especiais | P2 | Regras de creators.md |

---

## Domínio 5: Dependency & Supply Chain

| # | Check | Prioridade | Notas |
|---|-------|-----------|-------|
| D01 | `pnpm audit` sem vulnerabilidades críticas/altas | P2 | Rodar antes de deploy |
| D02 | `pnpm-lock.yaml` commitado no repositório | P1 | Garante builds reproduzíveis |
| D03 | Sem dependências com `*` ou `latest` em `package.json` | P2 | Pinar versões |
| D04 | Dependências revisadas: sem pacotes maliciosos conhecidos | P3 | Socket.dev ou npm provenance |
| D05 | `node_modules/` no `.gitignore` | P1 | Já configurado |

---

## Domínio 6: API Security

| # | Check | Prioridade | Notas |
|---|-------|-----------|-------|
| R01 | Server Actions para CRUD (não API routes) | P1 | CSRF built-in no Next.js |
| R02 | API routes apenas para: webhooks, SSE, public endpoints | P1 | Ver API.md |
| R03 | Rate limiting em endpoints públicos (login, creator apply) | P2 | PostgreSQL counter |
| R04 | Webhook receivers validam assinatura (HMAC/SHA256) | P2 | Mercado Pago, Shopify |
| R05 | CORS: apenas `NEXT_PUBLIC_APP_URL` em produção | P2 | Next.js config |
| R06 | Response envelope padrão `{ data, meta, errors }` | P1 | Ver API.md |
| R07 | Nenhum endpoint retorna stack traces em produção | P2 | Error boundaries |
| R08 | SSE streams autenticados (War Room, notificações) | P2 | Validar session no handler |

---

## Domínio 7: File Upload Security

| # | Check | Prioridade | Notas |
|---|-------|-----------|-------|
| F01 | Whitelist de tipos: JPEG, PNG, WebP apenas | P1 | Foto de creator |
| F02 | Limite de tamanho: 5MB por arquivo | P1 | Validar client + server |
| F03 | Upload via presigned URL direto ao R2 (não via server) | P1 | Reduz carga no server |
| F04 | Filename: UUID gerado pelo server (não nome original do user) | P1 | Prevenir path traversal |
| F05 | Content-Type validado server-side (magic bytes, não apenas extensão) | P2 | Prevenir upload de executável |
| F06 | Dimensão máxima: 4096x4096px | P2 | Prevenir DoS por imagem gigante |
| F07 | Imagens servidas via CDN (R2 custom domain) com cache headers | P3 | Performance + segurança |

---

## Domínio 8: Cryptography

| # | Check | Prioridade | Notas |
|---|-------|-----------|-------|
| C01 | HTTPS enforçado em produção | P1 | Vercel enforces por padrão |
| C02 | Neon conexão com `sslmode=require` + `channel_binding=require` | P1 | Já no `.env` |
| C03 | Argon2id para senhas (não bcrypt/SHA/MD5) | P1 | Já implementado |
| C04 | Tokens de reset: `crypto.randomBytes(32).toString('hex')` | P2 | 256 bits de entropia |
| C05 | PIX keys e CPF: encrypted at rest (AES-256-GCM) em `crm.personal_data` | P2 | Chave de encriptação em env var |
| C06 | Shopify API tokens: armazenados apenas em `.env`, nunca no DB | P1 | Rotação via env var update |
| C07 | Session IDs não contêm informação decodificável (não JWT, não base64 de dados) | P1 | UUID opaco |

---

## Domínio 9: LGPD Compliance

| # | Check | Prioridade | Notas |
|---|-------|-----------|-------|
| L01 | Dados pessoais (CPF, PIX, endereço) isolados em `crm.personal_data` | P2 | Separação da tabela principal |
| L02 | Exclusão de conta: DELETE de `personal_data`, histórico de vendas anonimizado | P2 | `deleted_at` + anonymize |
| L03 | Consentimento de coleta registrado com timestamp | P2 | Formulário de cadastro creator |
| L04 | Export de dados pessoais (direito de portabilidade) | P3 | Endpoint para download JSON |
| L05 | Audit log de acesso a dados pessoais (quem, quando, o quê) | P3 | Tabela `global.audit_log` |
| L06 | Dados de menores: não coletar (verificação de idade no cadastro) | P3 | Min 18 anos para creators |
| L07 | Termos de uso e política de privacidade linkados no cadastro | P2 | Checkbox obrigatório |

---

## Domínio 10: Logging & Monitoring

| # | Check | Prioridade | Notas |
|---|-------|-----------|-------|
| M01 | Sentry configurado com DSN em env var | P3 | Error tracking |
| M02 | Audit log para: approve/reject creator, payouts, tier changes | P2 | Tabela `global.audit_log` |
| M03 | Nenhum dado sensível em logs (mascarar CPF: `***.***.789-00`, PIX, tokens) | P2 | Helper `maskSensitive()` |
| M04 | Login attempts logados (success + failure) | P2 | Para detecção de brute force |
| M05 | Rate limit violations logadas | P3 | Para ajustar thresholds |
| M06 | Server action errors logados com requestId para correlação | P2 | Structured logging |

---

## Resumo por Prioridade

| Prioridade | Total | Quando verificar |
|-----------|-------|-----------------|
| **P1** | 30 checks | Toda Wave — obrigatório antes de avançar |
| **P2** | 22 checks | A partir de Wave 3 — obrigatório antes de deploy staging |
| **P3** | 8 checks | Antes do deploy production |
| **Total** | **60 checks** | |

> **Domínio 11 (AI/Agent Security):** 8 checks adicionais ativados na Phase 15. Total futuro: 68 checks.

---

## Domínio 11: AI/Agent Security (Phase 15 — Adiado)

> Ativar quando Phase 15 (ClawdBot) iniciar. Baseado em OWASP Agentic Skills Top 10 + OWASP Top 10 for Agentic Applications.

| # | Check | Prioridade | Notas |
|---|-------|-----------|-------|
| AI01 | PII masking antes de enviar ao LLM (CPF: `***.***.789-00`, PIX, endereço) | P1 | Helper `maskForLLM()` |
| AI02 | System prompt com guardrails rígidos (não revelar dados de outros tenants) | P1 | Prompt template versionado |
| AI03 | Rate limiting em chamadas Claude API (por tenant, por user) | P1 | PostgreSQL counter |
| AI04 | Output filtering — validar resposta do LLM antes de exibir ao user | P2 | Regex + Zod para structured output |
| AI05 | API key rotation documentada e testada | P2 | ANTHROPIC_API_KEY em env var |
| AI06 | Token usage tracking com budget por tenant | P2 | Tabela `global.llm_usage` |
| AI07 | Audit log de chamadas LLM (prompt hash, tokens used, latency) | P2 | Tabela `global.audit_log` |
| AI08 | Prompt injection prevention — sanitizar user input antes do prompt | P1 | Não concatenar input diretamente |

---

## Referências

| Doc | Relevância |
|-----|-----------|
| `docs/architecture/AUTH.md` | Domínios 2, 3 |
| `docs/architecture/API.md` | Domínios 4, 6 |
| `docs/architecture/DATABASE.md` | Domínios 3, 9 |
| `docs/architecture/STACK.md` | ADRs aprovados |
| `CLAUDE.md` | Regras absolutas |
| `DS.md` | Não relacionado a segurança |
| ESAA-Security | Framework base (16 domínios, 95 checks originais) |
| OWASP Top 10 | A01-A10 cobertos |
| OWASP ASVS | Verification levels L1-L2 cobertos |
| OWASP Agentic Skills Top 10 | Riscos de AI agent skills (AST01-AST10) — aplicável ao nosso workflow de agent teams |
| OWASP Top 10 for Agentic Applications | Riscos de aplicações agênticas — pré-requisitos para Phase 15 (ClawdBot) |
