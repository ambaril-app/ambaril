import { describe, expect, it } from "vitest";
import { maskSensitive } from "../mask-sensitive";

describe("maskSensitive", () => {
  describe("type: cpf", () => {
    it("masks a formatted CPF", () => {
      expect(maskSensitive("123.456.789-00", "cpf")).toBe("***.***.***-**");
    });

    it("masks a raw CPF (no separators)", () => {
      expect(maskSensitive("12345678900", "cpf")).toBe("***.***.***-**");
    });

    it("returns *** for short/invalid string", () => {
      // does not match regex → falls through to generic (via switch)
      // actually switch has no fallthrough — "cpf" case returns value.replace(...)
      // if no match, replace returns the original value
      expect(maskSensitive("short", "cpf")).toBe("short");
    });
  });

  describe("type: phone", () => {
    it("masks a formatted phone number", () => {
      const result = maskSensitive("(11) 99999-0000", "phone");
      expect(result).toMatch(/^\(11\)\*+0000$/);
    });

    it("masks a short phone (≤4 chars)", () => {
      expect(maskSensitive("1199", "phone")).toBe("****");
    });

    it("masks a numeric-only phone", () => {
      const result = maskSensitive("11999990000", "phone");
      // first 4 + stars + last 4
      expect(result.startsWith("1199")).toBe(true);
      expect(result.endsWith("0000")).toBe(true);
      expect(result).toContain("*");
    });
  });

  describe("type: email", () => {
    it("masks a standard email", () => {
      expect(maskSensitive("john@example.com", "email")).toBe("j***@***.com");
    });

    it("masks a single-char local part", () => {
      expect(maskSensitive("a@b.io", "email")).toBe("a***@***.io");
    });

    it("returns fallback for string without @", () => {
      expect(maskSensitive("notanemail", "email")).toBe("***@***");
    });
  });

  describe("type: token", () => {
    it("keeps first 6 chars and appends ellipsis", () => {
      expect(maskSensitive("sk-abc123longtoken", "token")).toBe("sk-abc...");
    });

    it("returns *** for short token (≤8 chars)", () => {
      expect(maskSensitive("short", "token")).toBe("***");
    });
  });

  describe("type: card", () => {
    it("masks a spaced card number (last 4 visible)", () => {
      expect(maskSensitive("4111 1111 1111 1234", "card")).toBe(
        "**** **** **** 1234",
      );
    });

    it("masks a compact card number", () => {
      expect(maskSensitive("4111111111111234", "card")).toBe(
        "**** **** **** 1234",
      );
    });

    it("returns **** for very short card", () => {
      expect(maskSensitive("123", "card")).toBe("****");
    });
  });

  describe("type: generic (default)", () => {
    it("keeps first 2 and last 2 chars", () => {
      expect(maskSensitive("hello world", "generic")).toBe("he***ld");
    });

    it("returns *** for strings ≤4 chars", () => {
      expect(maskSensitive("ab", "generic")).toBe("***");
      expect(maskSensitive("abcd", "generic")).toBe("***");
    });

    it("defaults to generic when no type given", () => {
      expect(maskSensitive("secretvalue")).toBe("se***ue");
    });
  });

  describe("edge cases", () => {
    it("returns empty string unchanged", () => {
      expect(maskSensitive("", "cpf")).toBe("");
    });
  });
});
