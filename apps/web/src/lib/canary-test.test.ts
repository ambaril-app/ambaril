import { describe, expect, it } from "vitest";
import { canaryTest } from "@/lib/canary-test";

describe("canaryTest", () => {
  it("returns the pipeline sentinel string", () => {
    expect(canaryTest()).toBe("pipeline works");
  });
});
