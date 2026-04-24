import { describe, expect, it } from "vitest";
import { CircuitOpenError } from "../errors";
import { withCircuitBreaker } from "../withCircuitBreaker";

describe("withCircuitBreaker", () => {
  it("transitions from closed to open after failures", async () => {
    const guarded = withCircuitBreaker(
      async () => {
        throw new Error("down");
      },
      { failureThreshold: 2, resetMs: 20 },
    );

    await expect(guarded()).rejects.toThrow("down");
    await expect(guarded()).rejects.toThrow("down");
    await expect(guarded()).rejects.toBeInstanceOf(CircuitOpenError);
  });

  it("rejects immediately while open", async () => {
    const guarded = withCircuitBreaker(
      async () => {
        throw new Error("down");
      },
      { failureThreshold: 1, resetMs: 20 },
    );

    await expect(guarded()).rejects.toThrow("down");
    await expect(guarded()).rejects.toBeInstanceOf(CircuitOpenError);
  });

  it("recovers in half-open after reset window", async () => {
    let failing = true;
    const guarded = withCircuitBreaker(
      async () => {
        if (failing) throw new Error("down");
        return "ok";
      },
      { failureThreshold: 1, resetMs: 5 },
    );

    await expect(guarded()).rejects.toThrow("down");
    await expect(guarded()).rejects.toBeInstanceOf(CircuitOpenError);
    await new Promise((resolve) => setTimeout(resolve, 10));
    failing = false;
    await expect(guarded()).resolves.toBe("ok");
  });
});
