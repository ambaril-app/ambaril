import { afterEach, describe, expect, it, vi } from "vitest";
import { TimeoutError } from "../errors";
import { withTimeout } from "../withTimeout";

describe("withTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns result for a fast function", async () => {
    await expect(withTimeout(async () => "ok", 100)).resolves.toBe("ok");
  });

  it("throws TimeoutError for a slow function", async () => {
    vi.useFakeTimers();
    const pending = expect(
      withTimeout(async () => new Promise<string>(() => undefined), 50),
    ).rejects.toBeInstanceOf(TimeoutError);

    await vi.advanceTimersByTimeAsync(50);
    await pending;
  });
});
