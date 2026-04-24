import { afterEach, describe, expect, it, vi } from "vitest";
import { CircuitOpenError } from "../errors";
import { withResilience } from "../withResilience";

describe("withResilience", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries and succeeds before opening the circuit", async () => {
    let attempts = 0;
    const guarded = withResilience(
      async () => {
        attempts += 1;
        if (attempts < 2) throw new Error("temporary");
        return "ok";
      },
      {
        retry: { maxAttempts: 2, backoffMs: 1 },
        circuitBreaker: { failureThreshold: 2 },
      },
    );

    await expect(guarded()).resolves.toBe("ok");
    expect(attempts).toBe(2);
  });

  it("times out and eventually opens the circuit", async () => {
    vi.useFakeTimers();
    const guarded = withResilience(
      async () => new Promise<string>(() => undefined),
      {
        timeoutMs: 10,
        retry: { maxAttempts: 1 },
        circuitBreaker: { failureThreshold: 1, resetMs: 50 },
      },
    );

    const first = expect(guarded()).rejects.toThrow(/timed out/i);
    await vi.advanceTimersByTimeAsync(10);
    await first;
    await expect(guarded()).rejects.toBeInstanceOf(CircuitOpenError);
  });
});
