import { describe, expect, it } from "vitest";
import {
  applyDiscount,
  formatBRL,
  roundHalfUp,
  splitInstallments,
} from "./money";

/**
 * Boundary tests for money.ts — validates integer-cents invariants
 * against the DB schema (NUMERIC(12,2)) and BRL formatting rules.
 *
 * The codebase uses integer cents internally; the database stores
 * NUMERIC(12,2) decimals. These tests guard the conversion boundary.
 */
describe("Money Conversion Boundary", () => {
  describe("roundHalfUp", () => {
    it("rounds 0.5 up (half-up rule)", () => {
      expect(roundHalfUp(1519.5)).toBe(1520);
      expect(roundHalfUp(0.5)).toBe(1);
    });

    it("rounds negative 0.5 toward zero (JS Math.round behavior)", () => {
      // Math.round(-0.5) returns -0 in JS; Object.is(-0, 0) is false.
      // In money contexts, negative amounts are rejected upstream before reaching roundHalfUp.
      expect(Object.is(roundHalfUp(-0.5), -0)).toBe(true);
    });

    it("returns integer unchanged", () => {
      expect(roundHalfUp(100)).toBe(100);
      expect(roundHalfUp(0)).toBe(0);
    });

    it("rejects non-finite values", () => {
      expect(() => roundHalfUp(NaN)).toThrow();
      expect(() => roundHalfUp(Infinity)).toThrow();
      expect(() => roundHalfUp(-Infinity)).toThrow();
    });
  });

  describe("splitInstallments — penny preservation", () => {
    it("sum always equals original for 3 installments", () => {
      // R$ 100.00 / 3 = 3333 + 3334 + 3333 = 10000
      const parts = splitInstallments(10000, 3);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(10000);
      expect(parts).toHaveLength(3);
    });

    it("sum always equals original for 7 installments", () => {
      const parts = splitInstallments(10000, 7);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(10000);
    });

    it("handles single installment", () => {
      expect(splitInstallments(1999, 1)).toEqual([1999]);
    });

    it("handles zero total", () => {
      expect(splitInstallments(0, 3)).toEqual([0, 0, 0]);
    });

    it("handles total smaller than installment count", () => {
      // 2 cents split 5 ways: two installments get 1, three get 0
      const parts = splitInstallments(2, 5);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(2);
      expect(parts.filter((p) => p === 1)).toHaveLength(2);
      expect(parts.filter((p) => p === 0)).toHaveLength(3);
    });

    it("rejects negative total", () => {
      expect(() => splitInstallments(-100, 3)).toThrow();
    });

    it("rejects zero or negative installments", () => {
      expect(() => splitInstallments(100, 0)).toThrow();
      expect(() => splitInstallments(100, -1)).toThrow();
    });

    it("rejects non-integer total", () => {
      expect(() => splitInstallments(99.5, 3)).toThrow();
    });
  });

  describe("applyDiscount — integer-cent precision", () => {
    it("10% off R$ 100.00 = R$ 90.00", () => {
      expect(applyDiscount(10000, 0.1)).toBe(9000);
    });

    it("33% off R$ 100.00 produces integer cents", () => {
      const result = applyDiscount(10000, 0.33);
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBe(6700);
    });

    it("result is always non-negative integer", () => {
      const result = applyDiscount(1, 0.99);
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it("100% discount returns zero", () => {
      expect(applyDiscount(10000, 1)).toBe(0);
    });

    it("0% discount returns original", () => {
      expect(applyDiscount(10000, 0)).toBe(10000);
    });

    it("rejects discount > 1", () => {
      expect(() => applyDiscount(10000, 1.5)).toThrow();
    });

    it("rejects negative discount", () => {
      expect(() => applyDiscount(10000, -0.1)).toThrow();
    });

    it("rejects negative price", () => {
      expect(() => applyDiscount(-100, 0.1)).toThrow();
    });

    it("rejects non-integer price", () => {
      expect(() => applyDiscount(99.5, 0.1)).toThrow();
    });
  });

  describe("formatBRL — NUMERIC(12,2) boundary", () => {
    it("formats zero correctly", () => {
      expect(formatBRL(0)).toContain("0,00");
    });

    it("formats one cent", () => {
      expect(formatBRL(1)).toContain("0,01");
    });

    it("formats R$ 19.99", () => {
      expect(formatBRL(1999)).toContain("19,99");
    });

    it("formats R$ 1.000,00 with thousand separator", () => {
      const result = formatBRL(100000);
      expect(result).toContain("1.000,00");
    });

    it("handles NUMERIC(12,2) max value: 9999999999.99", () => {
      // 999_999_999_999 cents = R$ 9.999.999.999,99
      const maxCents = 999_999_999_999;
      const result = formatBRL(maxCents);
      expect(result).toContain("9,99");
      expect(result).toContain("R$");
    });

    it("rejects non-integer input", () => {
      expect(() => formatBRL(19.99)).toThrow();
    });
  });

  describe("round-trip integrity (cents → format → visual check)", () => {
    it.each([0, 1, 99, 100, 1999, 999999])(
      "formatBRL(%i) produces valid BRL string",
      (cents) => {
        const result = formatBRL(cents);
        expect(result).toMatch(/R\$\s/);
        expect(result).toContain(",");
      },
    );
  });
});
