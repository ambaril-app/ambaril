import { maskSensitive } from "./mask-sensitive";
import type { MaskType } from "./mask-sensitive";

// Field names (lowercase substrings) that trigger masking
const SENSITIVE_KEY_PATTERNS: Array<{ pattern: string; type: MaskType }> = [
  { pattern: "cpf", type: "cpf" },
  { pattern: "cnpj", type: "generic" },
  { pattern: "phone", type: "phone" },
  { pattern: "telefone", type: "phone" },
  { pattern: "celular", type: "phone" },
  { pattern: "email", type: "email" },
  { pattern: "password", type: "token" },
  { pattern: "senha", type: "token" },
  { pattern: "token", type: "token" },
  { pattern: "apikey", type: "token" },
  { pattern: "api_key", type: "token" },
  { pattern: "secret", type: "token" },
  { pattern: "credential", type: "token" },
  { pattern: "creditcard", type: "card" },
  { pattern: "cartao", type: "card" },
  { pattern: "card", type: "card" },
  { pattern: "pix", type: "generic" },
];

function isSensitiveKey(key: string): MaskType | null {
  const lower = key.toLowerCase();
  for (const { pattern, type } of SENSITIVE_KEY_PATTERNS) {
    if (lower.includes(pattern)) return type;
  }
  return null;
}

/**
 * Recursively masks sensitive fields in an object before sending to LLM.
 * Preserves structure — only leaf string values at sensitive keys are masked.
 * Arrays, nested objects, and non-sensitive keys are recursed into.
 */
export function maskForLLM<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map((item) => maskForLLM(item)) as unknown as T;
  }

  if (typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      data as Record<string, unknown>,
    )) {
      const sensitiveType = isSensitiveKey(key);
      if (sensitiveType && typeof value === "string") {
        result[key] = maskSensitive(value, sensitiveType);
      } else {
        result[key] = maskForLLM(value);
      }
    }
    return result as T;
  }

  // Primitives (string, number, boolean) — returned as-is (no key context here)
  return data;
}
