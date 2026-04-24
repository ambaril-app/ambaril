export interface RetryOptions {
  maxAttempts?: number;
  backoffMs?: number;
  backoffMultiplier?: number;
  retryOn?: (error: unknown) => boolean;
}

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BACKOFF_MS = 1_000;
const DEFAULT_BACKOFF_MULTIPLIER = 2;

/**
 * Retry an async operation with exponential backoff.
 *
 * @example
 * const response = await withRetry(
 *   () => fetch("https://api.example.com/orders"),
 *   { retryOn: (error) => error instanceof TypeError, backoffMs: 250 },
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const backoffMs = options.backoffMs ?? DEFAULT_BACKOFF_MS;
  const multiplier = options.backoffMultiplier ?? DEFAULT_BACKOFF_MULTIPLIER;
  const retryOn = options.retryOn ?? (() => true);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts - 1 || !retryOn(error)) throw error;
      await wait(backoffMs * multiplier ** attempt);
    }
  }

  throw new Error("Retry attempts exhausted");
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
