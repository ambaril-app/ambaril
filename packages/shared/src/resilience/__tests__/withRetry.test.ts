import { describe, expect, it, vi } from "vitest";
import { withRetry } from "../withRetry";

describe("withRetry", () => {
  it("returns on first success", async () => {
    await expect(withRetry(async () => "ok", { backoffMs: 1 })).resolves.toBe(
      "ok",
    );
  });

  it("retries transient errors until success", async () => {
    let attempts = 0;
    const result = await withRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) throw new Error("temporary");
        return "done";
      },
      { backoffMs: 1 },
    );

    expect(result).toBe("done");
    expect(attempts).toBe(3);
  });

  it("throws after max attempts", async () => {
    const fn = vi.fn(async () => {
      throw new Error("still failing");
    });

    await expect(
      withRetry(fn, { maxAttempts: 2, backoffMs: 1 }),
    ).rejects.toThrow("still failing");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("uses custom retryOn filter", async () => {
    const fatal = new Error("fatal");
    const fn = vi.fn(async () => {
      throw fatal;
    });

    await expect(
      withRetry(fn, { retryOn: (error) => error !== fatal, backoffMs: 1 }),
    ).rejects.toBe(fatal);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
