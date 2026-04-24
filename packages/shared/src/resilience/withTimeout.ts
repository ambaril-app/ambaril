import { TimeoutError } from "./errors";

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Enforce a maximum runtime for an async operation.
 *
 * @example
 * const payload = await withTimeout(
 *   () => fetch("https://api.example.com/slow-endpoint").then((res) => res.json()),
 *   5_000,
 * );
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new TimeoutError(timeoutMs)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
