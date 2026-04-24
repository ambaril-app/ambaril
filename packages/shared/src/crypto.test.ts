import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptPII, encryptPII, hashCPF } from "./crypto";

const previousSalt = process.env.CRYPTO_SALT;
const previousKey = process.env.ENCRYPTION_KEY;
const testKey = Buffer.alloc(32, 7).toString("hex");

describe("crypto helpers", () => {
  beforeEach(() => {
    process.env.CRYPTO_SALT = "quality-sprint-test-salt";
    process.env.ENCRYPTION_KEY = testKey;
  });

  afterEach(() => {
    process.env.CRYPTO_SALT = previousSalt;
    process.env.ENCRYPTION_KEY = previousKey;
  });

  it("creates deterministic CPF hashes", () => {
    expect(hashCPF("123.456.789-09")).toBe(hashCPF("12345678909"));
  });

  it("roundtrips encrypted CPF values", () => {
    const encrypted = encryptPII("123.456.789-09");

    expect(decryptPII(encrypted)).toBe("12345678909");
  });
});
