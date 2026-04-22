import { describe, expect, it } from "vitest";
import { echoHello } from "@/echo";

describe("echoHello", () => {
  it("returns hello", () => {
    expect(echoHello()).toBe("hello");
  });
});
