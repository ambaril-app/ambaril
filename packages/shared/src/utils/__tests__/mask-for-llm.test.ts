import { describe, expect, it } from "vitest";
import { maskForLLM } from "../mask-for-llm";

describe("maskForLLM", () => {
  describe("passthrough for non-object types", () => {
    it("returns null as-is", () => {
      expect(maskForLLM(null)).toBeNull();
    });

    it("returns undefined as-is", () => {
      expect(maskForLLM(undefined)).toBeUndefined();
    });

    it("returns a number as-is", () => {
      expect(maskForLLM(42)).toBe(42);
    });

    it("returns a plain string as-is (no key context)", () => {
      // Primitives have no key — no masking at primitive level
      expect(maskForLLM("john@example.com")).toBe("john@example.com");
    });

    it("returns a boolean as-is", () => {
      expect(maskForLLM(true)).toBe(true);
    });
  });

  describe("flat objects", () => {
    it("masks email field", () => {
      const result = maskForLLM({
        email: "john@example.com",
        name: "John Doe",
      });
      expect(result.email).toBe("j***@***.com");
      expect(result.name).toBe("John Doe");
    });

    it("masks cpf field", () => {
      const result = maskForLLM({ cpf: "123.456.789-00" });
      expect(result.cpf).toBe("***.***.***-**");
    });

    it("masks password field (type token)", () => {
      const result = maskForLLM({ password: "super-secret-password-123" });
      expect(result.password).toBe("super-...");
    });

    it("masks token field", () => {
      const result = maskForLLM({ token: "sk-abc123longtoken" });
      expect(result.token).toBe("sk-abc...");
    });

    it("masks card field", () => {
      const result = maskForLLM({ card: "4111111111111234" });
      expect(result.card).toBe("**** **** **** 1234");
    });

    it("masks field with key containing sensitive substring (e.g. userEmail)", () => {
      const result = maskForLLM({ userEmail: "alice@corp.com" });
      expect(result.userEmail).toBe("a***@***.com");
    });

    it("does not mask non-sensitive string fields", () => {
      const result = maskForLLM({ productName: "Blue Hoodie", sku: "SKU-001" });
      expect(result.productName).toBe("Blue Hoodie");
      expect(result.sku).toBe("SKU-001");
    });

    it("does not mask non-string sensitive field values", () => {
      // email field with a number — isSensitiveKey returns type but value is not string
      const result = maskForLLM({ email: 12345 as unknown as string });
      expect(result.email).toBe(12345);
    });
  });

  describe("nested objects", () => {
    it("masks sensitive fields inside nested object", () => {
      const result = maskForLLM({
        user: {
          email: "alice@example.com",
          age: 30,
          address: { street: "Rua das Flores" },
        },
      });
      expect(result.user.email).toBe("a***@***.com");
      expect(result.user.age).toBe(30);
      expect(result.user.address.street).toBe("Rua das Flores");
    });
  });

  describe("arrays", () => {
    it("maps over arrays and masks objects inside", () => {
      const result = maskForLLM([
        { email: "a@b.com", role: "admin" },
        { name: "Bob", email: "bob@x.com" },
      ]);
      expect(result[0]?.email).toBe("a***@***.com");
      expect(result[0]?.role).toBe("admin");
      expect(result[1]?.email).toBe("b***@***.com");
    });

    it("handles array of primitives", () => {
      expect(maskForLLM([1, 2, 3])).toEqual([1, 2, 3]);
    });
  });

  describe("preserves structure", () => {
    it("returns object with same keys as input", () => {
      const input = { a: "1", b: 2, c: true };
      const result = maskForLLM(input);
      expect(Object.keys(result)).toEqual(["a", "b", "c"]);
    });
  });
});
