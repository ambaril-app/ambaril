import { describe, expect, it } from "vitest";
import { applyDiscount, formatBRL, splitInstallments } from "./money";

describe("money", () => {
  it("keeps installment sums exact for 12x", () => {
    const parts = splitInstallments(15990, 12);
    const total = parts.reduce((sum, part) => sum + part, 0);

    expect(total).toBe(15990);
  });

  it("applies discount with rounded cents", () => {
    expect(applyDiscount(15990, 0.05)).toBe(15190);
  });

  it("returns zero when discounting zero", () => {
    expect(applyDiscount(0, 0.99)).toBe(0);
  });

  it("splits uneven values deterministically", () => {
    expect(splitInstallments(100, 3)).toEqual([34, 33, 33]);
  });

  it("formats BRL for display", () => {
    expect(formatBRL(15990)).toContain("159,90");
  });

  it("avoids IEEE rounding drift on decimal discount rates", () => {
    expect(applyDiscount(5, 0.3)).toBe(3);
  });
});
