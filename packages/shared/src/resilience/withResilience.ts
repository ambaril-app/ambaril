import {
  type CircuitBreakerOptions,
  withCircuitBreaker,
} from "./withCircuitBreaker";
import { type RetryOptions, withRetry } from "./withRetry";
import { withTimeout } from "./withTimeout";

export interface ResilienceOptions {
  timeoutMs?: number;
  retry?: RetryOptions;
  circuitBreaker?: CircuitBreakerOptions;
}

/**
 * Compose timeout, retry, and circuit breaker for a provider call.
 *
 * @example
 * const callProvider = withResilience(
 *   () => fetch("https://api.example.com/provider/orders").then((res) => res.json()),
 *   {
 *     timeoutMs: 5_000,
 *     retry: { maxAttempts: 3, backoffMs: 250 },
 *     circuitBreaker: { failureThreshold: 5, resetMs: 60_000 },
 *   },
 * );
 * const orders = await callProvider();
 */
export function withResilience<T>(
  fn: () => Promise<T>,
  options: ResilienceOptions = {},
): () => Promise<T> {
  return withCircuitBreaker(
    () => withRetry(() => withTimeout(fn, options.timeoutMs), options.retry),
    options.circuitBreaker,
  );
}
