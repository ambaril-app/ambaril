# ERROR-HANDLING.md — Error Handling & Resilience Patterns

> Ambaril -- Brazilian Streetwear SaaS
> Stack: Next.js, PostgreSQL (Neon), Redis (Upstash)
> Last updated: 2026-03-17

---

## 1. Error Classification

Every error produced or handled by Ambaril falls into one of the categories below. The table maps HTTP status, a concrete example, and the expected handling strategy on the frontend.

| Category | HTTP Status | Example | Handling |
|---|---|---|---|
| Validation | 400 / 422 | Invalid CPF, missing required field, malformed email | Show inline field errors immediately below the offending input |
| Business Logic | 400 / 409 | Insufficient stock, order not cancellable in current status, duplicate coupon code | Show toast notification or confirmation modal depending on severity |
| Authentication | 401 | Session expired, missing token, invalid refresh token | Redirect to `/login`, clear local session state |
| Authorization | 403 | Creator role trying to access ERP module, analyst trying to edit production order | Show dedicated 403 page with "back to dashboard" action |
| Not Found | 404 | Order ID does not exist, SKU deleted, contact archived | Show dedicated 404 page with navigation back |
| External Service | 502 / 503 | Mercado Pago down, Focus NFe timeout, Melhor Envio rate-limited | Queue for retry, show user-friendly message explaining delay |
| System | 500 | Database connection failed, Redis unavailable, unhandled exception | Log to Sentry with full context, show generic error page to user |

### Decision tree

```
Is the error caused by user input?
  YES → Validation (400/422) — show inline errors
  NO  → Is it a business rule violation?
          YES → Business Logic (400/409) — show toast/modal
          NO  → Is it an auth problem?
                  YES → 401 (redirect) or 403 (block page)
                  NO  → Is it from an external service?
                          YES → External Service (502/503) — retry + fallback
                          NO  → System Error (500) — log + generic page
```

---

## 2. Error Response Format

All API routes return the standard Ambaril envelope (defined in API.md). On error, `data` is `null` and the `errors` array contains one or more error objects.

### Standard error envelope

```json
{
  "data": null,
  "errors": [
    {
      "code": "INSUFFICIENT_STOCK",
      "message": "Estoque insuficiente para SKU-0412",
      "field": null,
      "detail": "Requested: 5, Available: 2"
    }
  ]
}
```

### Error object fields

| Field | Type | Required | Description |
|---|---|---|---|
| `code` | `string` | Yes | Machine-readable error code, UPPER_SNAKE_CASE. Used by the frontend to look up the localized message. |
| `message` | `string` | Yes | Human-readable message in PT-BR. This is the default text shown to the user if no frontend override exists. |
| `field` | `string \| null` | Yes | The form field name that caused the error, or `null` for non-field errors. Used by the frontend to attach inline errors to specific inputs. |
| `detail` | `string \| null` | No | Additional technical context for debugging. Never shown directly to the user. |

### Multiple validation errors

When a form submission has multiple invalid fields, the API returns all errors at once so the user can fix everything in a single pass:

```json
{
  "data": null,
  "errors": [
    {
      "code": "INVALID_CPF",
      "message": "CPF inválido",
      "field": "cpf",
      "detail": "Failed checksum validation"
    },
    {
      "code": "REQUIRED_FIELD",
      "message": "Campo obrigatório",
      "field": "email",
      "detail": null
    },
    {
      "code": "INVALID_CEP",
      "message": "CEP inválido",
      "field": "cep",
      "detail": "Format must be XXXXX-XXX"
    }
  ]
}
```

### Business logic error

```json
{
  "data": null,
  "errors": [
    {
      "code": "ORDER_NOT_CANCELLABLE",
      "message": "Este pedido não pode ser cancelado no status atual",
      "field": null,
      "detail": "Order #1042 is in status 'shipped'. Only orders in 'pending' or 'separating' can be cancelled."
    }
  ]
}
```

---

## 3. Frontend Error Display

All user-facing copy follows the DS.md microcopy rules: PT-BR, neutral tone, direct language, no exclamation marks, no emoji.

### 3.1 Field-level inline errors (validation)

Used for: form validation errors (400/422) where the `field` property is set.

**Visual spec:**
- Red text positioned directly below the input
- Font size: 12px
- Color: `var(--danger)` (from DS.md color tokens)
- Icon: none (the red color is sufficient)

**Behavior:**
- Errors appear on blur (when the user leaves the field) or on form submit
- Errors clear automatically when the user corrects the input and the value passes validation
- If the server returns field-level errors after submit, those override any client-side messages

**Examples:**
| Field | Error message |
|---|---|
| CPF | "CPF inválido" |
| Email | "E-mail inválido" |
| CEP | "CEP inválido" |
| Telefone | "Telefone inválido" |
| Quantidade | "Quantidade deve ser maior que zero" |
| Preço | "Preço deve ser maior que zero" |
| Data | "Data inválida" |
| Campo obrigatório | "Campo obrigatório" |

**Implementation pattern:**

```tsx
// Field error component
function FieldError({ name }: { name: string }) {
  const { errors } = useFormContext();
  const error = errors[name];
  if (!error) return null;
  return (
    <span className="text-xs text-danger mt-1" role="alert">
      {error.message}
    </span>
  );
}
```

### 3.2 Toast notifications (async operations)

Per DS.md section 12.3 — used for feedback on completed or failed async actions.

**Variants:**

| Variant | Border color | Icon | Auto-dismiss | Use case |
|---|---|---|---|---|
| Success | Green left border (4px) | `CheckCircle` | 3 seconds | Order saved, NF-e emitted, label generated |
| Error | Red left border (4px) | `XCircle` | Persistent (user must close) | Payment failed, API error, stock insufficient |
| Warning | Yellow left border (4px) | `Warning` | 5 seconds | Low stock alert, approaching deadline |
| Info | Blue left border (4px) | `Info` | 5 seconds | Background job completed, webhook received |

**Position and stacking:**
- Fixed position: bottom-right of the viewport
- Stack direction: from bottom up (newest at the bottom)
- Maximum visible: 3 toasts — older ones collapse into a "+N more" indicator
- Animation: slide in from right (200ms ease-out), slide out to right on dismiss (150ms ease-in)

**Error toasts are persistent.** The user must explicitly close them. This ensures critical failures are not missed because the user looked away for 3 seconds.

**Implementation pattern:**

```tsx
// Toast usage in API call handler
async function handleShipOrder(orderId: string) {
  try {
    await api.patch(`/orders/${orderId}/ship`);
    toast.success("Pedido marcado como enviado");
  } catch (error) {
    if (error instanceof ApiError) {
      toast.error(error.message); // PT-BR message from API
    } else {
      toast.error("Erro interno. Tente novamente em alguns instantes.");
    }
  }
}
```

### 3.3 Full-page error states

Dedicated pages for unrecoverable navigation errors.

**404 — Not Found:**
- Headline: "Pagina nao encontrada"
- Subtext: "O recurso que voce procura nao existe ou foi removido."
- Action: "Voltar" button (navigates to previous page or dashboard)
- Visual: Minimalist illustration consistent with DS.md brand style

**403 — Forbidden:**
- Headline: "Acesso nao autorizado"
- Subtext: "Voce nao tem permissao para acessar esta pagina."
- Action: "Voltar ao painel" button (navigates to `/dashboard`)
- Do not reveal what the page contains or which role is required

**500 — Internal Server Error:**
- Headline: "Erro interno. Tente novamente em alguns instantes."
- Subtext: "Se o problema persistir, entre em contato com o suporte."
- Action: "Tentar novamente" button (reloads the page)
- Sentry error ID displayed in small gray text at the bottom for support reference

**Empty states (no results):**
- Pattern: "Nenhum [recurso] encontrado"
- Examples:
  - "Nenhum pedido encontrado"
  - "Nenhum contato encontrado"
  - "Nenhuma tarefa encontrada"
- Always include a CTA when applicable: "Criar primeiro [recurso]"

### 3.4 Optimistic UI rollback

For actions where we show success before the server confirms, to make the UI feel instant.

**How it works:**
1. User performs action (e.g., marks order as shipped)
2. UI immediately updates to reflect the new state
3. API request fires in the background
4. If the server returns success: do nothing (UI is already correct)
5. If the server returns an error: revert the UI to the previous state and show an error toast

**Use cases:**

| Action | Optimistic behavior | Rollback on error |
|---|---|---|
| Mark order as shipped | Status badge changes to "Enviado" immediately | Revert to previous status + error toast |
| Toggle task status (PCP) | Checkbox/status updates instantly | Revert toggle + error toast |
| Archive a contact (CRM) | Contact disappears from list | Contact reappears + error toast |
| Delete a draft coupon | Coupon removed from list | Coupon reappears + error toast |

**Implementation pattern:**

```tsx
// React Query optimistic update
const mutation = useMutation({
  mutationFn: (orderId: string) => api.patch(`/orders/${orderId}/ship`),
  onMutate: async (orderId) => {
    await queryClient.cancelQueries({ queryKey: ['orders', orderId] });
    const previous = queryClient.getQueryData(['orders', orderId]);
    queryClient.setQueryData(['orders', orderId], (old: Order) => ({
      ...old,
      status: 'shipped',
    }));
    return { previous };
  },
  onError: (_err, _orderId, context) => {
    queryClient.setQueryData(['orders', orderId], context?.previous);
    toast.error("Nao foi possivel atualizar o pedido. Tente novamente.");
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  },
});
```

---

## 4. External Service Resilience

Ambaril depends on several external APIs. Each integration must implement circuit breaking, retry logic, and fallback behavior to prevent cascading failures.

### 4.1 Circuit Breaker

The circuit breaker pattern prevents the system from repeatedly calling a failing external service, which would slow down responses and waste resources.

**Three states:**
1. **Closed** (normal) — requests pass through normally. Failures are counted.
2. **Open** (failing) — all requests are immediately rejected without calling the external service. A fallback is used instead.
3. **Half-open** (testing recovery) — a single test request is allowed through. If it succeeds, the circuit closes. If it fails, the circuit opens again.

**Per-service configuration:**

| Service | Failure Threshold | Open Duration | Half-Open Test | Priority |
|---|---|---|---|---|
| Mercado Pago | 5 failures in 1 min | 30s | 1 request | Critical |
| Focus NFe | 3 failures in 2 min | 60s | 1 request | Critical |
| Melhor Envio | 5 failures in 1 min | 30s | 1 request | High |
| WhatsApp API (Z-API) | 5 failures in 1 min | 60s | 1 request | High |
| Instagram API | 10 failures in 5 min | 120s | 1 request | Low |
| ViaCEP | 3 failures in 1 min | 30s | 1 request | Medium |
| Claude API | 3 failures in 2 min | 60s | 1 request | Medium |

**Priority levels determine alerting:**
- **Critical:** Immediately alert Ana Clara via WhatsApp (if WhatsApp itself is not the failing service) and Discord `#ops-alerts`
- **High:** Alert via Discord `#ops-alerts` within 1 minute
- **Medium:** Log to monitoring dashboard, no immediate alert
- **Low:** Log only, review in daily ops check

**Implementation approach:**

```typescript
// Circuit breaker wrapper
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private openedAt: number | null = null;

  constructor(
    private readonly name: string,
    private readonly failureThreshold: number,
    private readonly failureWindow: number,   // ms
    private readonly openDuration: number,     // ms
  ) {}

  async execute<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.openedAt! > this.openDuration) {
        this.state = 'half-open';
      } else {
        if (fallback) return fallback();
        throw new CircuitOpenError(this.name);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) return fallback();
      throw error;
    }
  }
}
```

### 4.2 Retry Strategy

Exponential backoff with jitter to prevent thundering herd on recovery.

**Timing:**

| Attempt | Base Delay | Jitter Range | Effective Delay |
|---|---|---|---|
| 1 (initial) | 0ms | 0ms | Immediate |
| 2 | 1,000ms | +/- 200ms | 800ms -- 1,200ms |
| 3 | 2,000ms | +/- 400ms | 1,600ms -- 2,400ms |
| 4 | 4,000ms | +/- 800ms | 3,200ms -- 4,800ms |

**Retry limits by context:**
- **Synchronous requests** (user waiting): max 3 retries, then fail with user-facing error
- **Async background jobs** (Inngest): max 5 retries with longer backoff, then move to dead letter queue
- **Webhook delivery**: max 5 retries, then alert ops

**Which errors are retryable:**
- 429 (Too Many Requests) — always retry, respect `Retry-After` header
- 502, 503, 504 — retry (transient infrastructure failures)
- Network timeouts — retry
- 400, 401, 403, 404, 409, 422 — never retry (deterministic failures)
- 500 — retry once (might be transient), then fail

**Implementation pattern:**

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    baseDelay: number;
    jitterFactor: number;
  }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (!isRetryable(error) || attempt === options.maxRetries) throw error;

      const delay = options.baseDelay * Math.pow(2, attempt);
      const jitter = delay * options.jitterFactor * (Math.random() * 2 - 1);
      await sleep(delay + jitter);
    }
  }

  throw lastError!;
}
```

### 4.3 Fallback Behaviors

When an external service is unavailable (circuit open or max retries exhausted), Ambaril degrades gracefully rather than failing entirely.

| Service Down | Fallback Behavior | User Impact |
|---|---|---|
| Mercado Pago (webhook) | Queue payment for manual reconciliation. Order stays in "aguardando pagamento" until manually verified or webhook recovers. | User sees "Pagamento em processamento" instead of instant confirmation |
| Focus NFe | Queue NF-e emission as background job. Alert Ana Clara via Discord. NF-e will be emitted when service recovers. | Shipping proceeds without NF-e. NF-e is emitted retroactively. |
| Melhor Envio | Queue label generation as background job. Alert Ana Clara via Discord. | Shipping label delayed. Ana Clara can generate manually if urgent. |
| ViaCEP | Show manual address form with all fields editable (street, neighborhood, city, state). No auto-fill. | User must type full address instead of just CEP. Minor inconvenience. |
| WhatsApp API (Z-API) | Queue message for later delivery via background job. Messages are sent in order when service recovers. | Message arrives late but is not lost. |
| Instagram API | Skip UGC poll for this cycle. Log warning. Next scheduled poll will pick up missed content. | UGC content may be delayed by one poll interval (typically 15 min). |
| Claude API | Show "Assistente indisponivel no momento" in ClawdBot. Queue report generation for retry. | User cannot use AI assistant until service recovers. |

**Queue implementation:** All fallback queues use Inngest background jobs with the async retry strategy (5 retries, exponential backoff). If all retries fail, the job moves to a dead letter queue and an alert fires.

### 4.4 Timeout Values

Every external HTTP call must have explicit connect and read timeouts. No request should hang indefinitely.

| Service | Connect Timeout | Read Timeout | Rationale |
|---|---|---|---|
| Mercado Pago | 5s | 15s | Payment processing can take a few seconds |
| Focus NFe | 5s | 30s | NF-e validation and emission is inherently slow due to SEFAZ processing |
| Melhor Envio | 5s | 15s | Label generation involves external carrier lookup |
| WhatsApp API (Z-API) | 5s | 10s | Message sending is fast once connected |
| Instagram API | 5s | 10s | Standard REST API response times |
| ViaCEP | 2s | 5s | Simple lookup, should be very fast. Lower timeouts to fail fast. |
| Claude API | 5s | 60s | LLM generation (especially report generation) can take up to 45s for complex queries |

**Timeout handling:**
- When a connect timeout fires: increment circuit breaker failure count, try next retry
- When a read timeout fires: increment circuit breaker failure count, try next retry
- Both timeout types are retryable errors

---

## 5. Error Logging

All errors are logged as structured JSON for searchability and alerting.

### 5.1 Log fields

Every error log entry includes:

| Field | Type | Description |
|---|---|---|
| `timestamp` | `string` (ISO 8601) | When the error occurred |
| `level` | `string` | `error`, `warn`, `info` |
| `message` | `string` | Human-readable description of the error |
| `error_code` | `string` | Machine-readable code (e.g., `INSUFFICIENT_STOCK`) |
| `stack_trace` | `string \| null` | Full stack trace for system errors. Null for business errors. |
| `correlation_id` | `string` (UUID) | Unique ID generated per incoming request. Propagated through all downstream calls and logs. |
| `user_id` | `string \| null` | The authenticated user's ID, or null for unauthenticated requests |
| `tenant_id` | `string` | tenant slug (e.g., `ciena` for CIENA Lab) |
| `module` | `string` | Which Ambaril module: `erp`, `crm`, `checkout`, `pcp`, `creators`, `trocas`, `clawdbot`, `dashboard`, `auth`, etc. |
| `endpoint` | `string` | The API route that was called (e.g., `POST /api/orders/:id/ship`) |
| `http_status` | `number` | The HTTP status code returned |
| `duration_ms` | `number` | Request duration in milliseconds |
| `external_service` | `string \| null` | If the error involves an external API, which one (e.g., `mercado_pago`, `focus_nfe`) |
| `metadata` | `object` | Arbitrary additional context (e.g., `{ orderId: "1042", sku: "SKU-0412" }`) |

### 5.2 Example log entry

```json
{
  "timestamp": "2026-03-17T14:23:11.042Z",
  "level": "error",
  "message": "NF-e emission failed for order #1042",
  "error_code": "NFE_EMISSION_FAILED",
  "stack_trace": null,
  "correlation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "usr_ana_clara",
  "tenant_id": "ciena",
  "module": "erp",
  "endpoint": "POST /api/orders/1042/nfe",
  "http_status": 502,
  "duration_ms": 31204,
  "external_service": "focus_nfe",
  "metadata": {
    "order_id": "1042",
    "focus_response_code": "TIMEOUT",
    "retry_attempt": 3
  }
}
```

### 5.3 Sentry integration

- **Automatic capture:** All uncaught exceptions are automatically reported to Sentry via the Next.js Sentry integration
- **Manual capture:** Business errors that exceed a severity threshold are manually reported (e.g., payment failures, NF-e failures, circuit breaker state changes)
- **Context enrichment:** Every Sentry event includes `correlation_id`, `user_id`, `module`, and relevant metadata
- **Breadcrumbs:** API calls, database queries, and external service calls are added as breadcrumbs for debugging
- **Fingerprinting:** Custom fingerprinting rules group similar errors together (e.g., all `NFE_EMISSION_FAILED` errors are grouped regardless of the specific order ID)

### 5.4 Correlation ID

The correlation ID is the thread that ties together all logs, Sentry events, and external service calls for a single user request.

**Generation:** A UUID v4 is generated at the API edge (middleware) for every incoming request.

**Propagation:**
- Passed to all internal function calls via async context (Node.js `AsyncLocalStorage`)
- Included as a header (`X-Correlation-ID`) in all outbound HTTP requests to external services
- Included in all database query comments for traceability
- Included in Sentry breadcrumbs and event context
- Returned to the frontend in the response header `X-Correlation-ID` for support reference

---

## 6. User-Facing Error Messages (PT-BR)

Standard error messages following DS.md microcopy rules: neutral tone, direct, no exclamation marks, no emoji.

### 6.1 Core error messages

| Code | Message (PT-BR) | Context |
|---|---|---|
| `VALIDATION_ERROR` | "Verifique os campos destacados" | Generic validation — shown as a toast when field-level errors are also present |
| `NOT_FOUND` | "Registro nao encontrado" | Generic 404 for API resources |
| `UNAUTHORIZED` | "Sessao expirada. Faca login novamente." | 401 — session expired or invalid token |
| `FORBIDDEN` | "Voce nao tem permissao para esta acao" | 403 — role-based access denied |
| `INSUFFICIENT_STOCK` | "Estoque insuficiente para {sku}" | ERP — trying to ship more than available |
| `INVALID_CPF` | "CPF invalido" | Checkout/CRM — CPF fails checksum |
| `DUPLICATE_COUPON` | "Este cupom ja existe" | Marketing — coupon code already in use |
| `ORDER_NOT_CANCELLABLE` | "Este pedido nao pode ser cancelado no status atual" | ERP — order state machine violation |
| `NFE_EMISSION_FAILED` | "Nao foi possivel emitir a NF-e. Tente novamente." | ERP — Focus NFe failure |
| `PAYMENT_FAILED` | "Pagamento nao aprovado. Tente outro metodo." | Checkout — Mercado Pago rejection |
| `WHATSAPP_RATE_LIMITED` | "Limite de mensagens atingido. Tente em alguns minutos." | CRM/Notifications — Z-API rate limit |
| `GENERIC_ERROR` | "Erro interno. Tente novamente em alguns instantes." | Catch-all for 500 errors |

### 6.2 Extended business error messages

| Code | Message (PT-BR) | Module |
|---|---|---|
| `DUPLICATE_CPF` | "Este CPF ja esta cadastrado" | CRM |
| `DUPLICATE_EMAIL` | "Este e-mail ja esta cadastrado" | CRM / Checkout |
| `INVALID_CEP` | "CEP invalido" | Checkout |
| `CEP_NOT_FOUND` | "CEP nao encontrado. Preencha o endereco manualmente." | Checkout |
| `SHIPPING_UNAVAILABLE` | "Frete indisponivel para este CEP" | Checkout |
| `CART_EMPTY` | "Carrinho vazio" | Checkout |
| `COUPON_EXPIRED` | "Este cupom expirou" | Checkout |
| `COUPON_MIN_VALUE` | "Valor minimo para este cupom: R$ {value}" | Checkout |
| `COUPON_NOT_APPLICABLE` | "Este cupom nao se aplica aos itens do carrinho" | Checkout |
| `ORDER_ALREADY_SHIPPED` | "Este pedido ja foi enviado" | ERP |
| `LABEL_GENERATION_FAILED` | "Nao foi possivel gerar a etiqueta. Tente novamente." | ERP |
| `PRODUCTION_STAGE_INVALID` | "Transicao de estagio invalida" | PCP |
| `SAFETY_MARGIN_BREACH` | "Margem de seguranca atingida para {material}" | PCP |
| `SUPPLIER_INACTIVE` | "Fornecedor inativo" | PCP |
| `CREATOR_NOT_APPROVED` | "Cadastro de criador pendente de aprovacao" | Creators |
| `PAYOUT_MIN_NOT_MET` | "Valor minimo para saque: R$ 50,00" | Creators |
| `PAYOUT_MONTHLY_CAP` | "Limite mensal de saque atingido (R$ 3.000)" | Creators |
| `CREATOR_SELF_PURCHASE` | "Criadores nao podem comprar com o proprio link" | Creators |
| `EXCHANGE_WINDOW_EXPIRED` | "Prazo para troca expirado" | Trocas |
| `EXCHANGE_NOT_ELIGIBLE` | "Este item nao e elegivel para troca" | Trocas |
| `RETURN_LABEL_FAILED` | "Nao foi possivel gerar a etiqueta de devolucao" | Trocas |
| `AUTOMATION_TRIGGER_INVALID` | "Gatilho de automacao invalido" | CRM |
| `SEGMENT_EMPTY` | "Nenhum contato corresponde a este segmento" | CRM |
| `REPORT_GENERATION_FAILED` | "Nao foi possivel gerar o relatorio. Tente novamente." | ClawdBot |
| `AI_UNAVAILABLE` | "Assistente indisponivel no momento" | ClawdBot |
| `TASK_ALREADY_ASSIGNED` | "Esta tarefa ja esta atribuida" | PCP |
| `METRIC_DATA_UNAVAILABLE` | "Dados indisponiveis para o periodo selecionado" | Dashboard |

### 6.3 Message interpolation

Some messages contain placeholders (e.g., `{sku}`, `{value}`, `{material}`). The frontend replaces these with the actual values from the error's `detail` field or from local context.

```typescript
function formatErrorMessage(error: ApiError): string {
  let message = ERROR_MESSAGES[error.code] ?? ERROR_MESSAGES.GENERIC_ERROR;

  // Replace placeholders with values from error detail or metadata
  if (error.detail) {
    const placeholders = message.match(/\{(\w+)\}/g);
    placeholders?.forEach((placeholder) => {
      const key = placeholder.slice(1, -1);
      message = message.replace(placeholder, error.metadata?.[key] ?? placeholder);
    });
  }

  return message;
}
```

---

## 7. Error Handling by Layer

### 7.1 API route handler (Next.js App Router)

```typescript
// Standard error handling wrapper for API routes
export function withErrorHandling(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();

    try {
      return await handler(req);
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json(
          { data: null, errors: error.toErrors() },
          { status: 422, headers: { 'X-Correlation-ID': correlationId } }
        );
      }

      if (error instanceof BusinessError) {
        return NextResponse.json(
          { data: null, errors: [error.toError()] },
          { status: error.status, headers: { 'X-Correlation-ID': correlationId } }
        );
      }

      // Unexpected error — log and return generic
      logger.error({
        correlation_id: correlationId,
        message: error.message,
        stack_trace: error.stack,
        endpoint: `${req.method} ${req.nextUrl.pathname}`,
      });

      Sentry.captureException(error, {
        extra: { correlationId },
      });

      return NextResponse.json(
        {
          data: null,
          errors: [{
            code: 'GENERIC_ERROR',
            message: 'Erro interno. Tente novamente em alguns instantes.',
            field: null,
          }],
        },
        { status: 500, headers: { 'X-Correlation-ID': correlationId } }
      );
    }
  };
}
```

### 7.2 Frontend global error boundary

```tsx
// Global error boundary for uncaught React errors
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <ErrorPage
          title="Erro interno. Tente novamente em alguns instantes."
          subtitle="Se o problema persistir, entre em contato com o suporte."
          action={{ label: 'Tentar novamente', onClick: reset }}
          reference={error.digest}
        />
      </body>
    </html>
  );
}
```

### 7.3 Frontend API client

```typescript
// Centralized API client with error handling
class ApiClient {
  async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const body = await response.json();

    if (!response.ok) {
      // Handle authentication errors globally
      if (response.status === 401) {
        router.push('/login');
        throw new AuthError('Session expired');
      }

      // Throw API error with structured error data
      throw new ApiError(response.status, body.errors);
    }

    return body.data;
  }
}
```

---

## Cross-References

- **API.md** — Standard envelope format, endpoint conventions
- **DS.md** — Microcopy rules (section 12), toast specification (section 12.3), color tokens
- **ARCH.md** — System architecture, service boundaries
- **INFRA.md** — Sentry configuration, monitoring setup
- **Module docs** — Module-specific error codes and state machines
