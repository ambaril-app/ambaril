/**
 * Unit tests for safe-fetch SSRF protection.
 *
 * These test validateExternalUrl (pure, sync, no deps) and safeFetch behavior.
 * Always-on — no DATABASE_URL or network required.
 */
import { describe, it, expect } from "vitest";
import { validateExternalUrl } from "@/lib/safe-fetch";

// ---------------------------------------------------------------------------
// validateExternalUrl — allowed domains
// ---------------------------------------------------------------------------
describe("validateExternalUrl — allowed domains", () => {
  const allowed = [
    "https://test-store.myshopify.com/admin/api/2024-01/orders.json",
    "https://api.yever.com.br/v1/sales",
    "https://api.instagram.com/v18.0/me",
    "https://graph.facebook.com/v18.0/me",
    "https://graph.instagram.com/me/media",
    "https://api.resend.com/emails",
    "https://viacep.com.br/ws/01001000/json/",
    "https://api.mercadopago.com/v1/payments",
    "https://api.focusnfe.com.br/v2/nfe",
    "https://api.melhorenvio.com.br/api/v2/me/shipment/calculate",
    "https://bucket.r2.cloudflarestorage.com/key",
  ];

  for (const url of allowed) {
    it(`passes: ${new URL(url).hostname}`, () => {
      const result = validateExternalUrl(url);
      expect(result).toBeInstanceOf(URL);
      expect(result.href).toContain(new URL(url).hostname);
    });
  }
});

// ---------------------------------------------------------------------------
// validateExternalUrl — blocked internal addresses
// ---------------------------------------------------------------------------
describe("validateExternalUrl — blocked internal addresses", () => {
  const blocked = [
    "https://127.0.0.1/admin",
    "https://10.0.0.1/internal",
    "https://172.16.0.1/private",
    "https://172.31.255.255/edge",
    "https://192.168.1.1/local",
    "https://169.254.169.254/latest/meta-data/", // AWS IMDS
    "https://0.0.0.0/",
    "https://localhost/admin",
    "https://LOCALHOST/admin",
  ];

  for (const url of blocked) {
    it(`blocks: ${new URL(url).hostname}`, () => {
      expect(() => validateExternalUrl(url)).toThrow(
        "Blocked internal address",
      );
    });
  }
});

// ---------------------------------------------------------------------------
// validateExternalUrl — non-allowlisted public domains
// ---------------------------------------------------------------------------
describe("validateExternalUrl — non-allowlisted domains", () => {
  const rejected = [
    "https://evil.com/steal",
    "https://api.example.com/data",
    "https://myshopify.com.evil.com/phish", // subdomain trick
    "https://notyever.com.br/fake",
  ];

  for (const url of rejected) {
    it(`rejects: ${new URL(url).hostname}`, () => {
      expect(() => validateExternalUrl(url)).toThrow("Domain not in allowlist");
    });
  }
});

// ---------------------------------------------------------------------------
// validateExternalUrl — invalid URLs
// ---------------------------------------------------------------------------
describe("validateExternalUrl — invalid URLs", () => {
  it("rejects garbage string", () => {
    expect(() => validateExternalUrl("not-a-url")).toThrow("Invalid URL");
  });

  it("rejects empty string", () => {
    expect(() => validateExternalUrl("")).toThrow("Invalid URL");
  });
});

// ---------------------------------------------------------------------------
// validateExternalUrl — blocked protocols
// ---------------------------------------------------------------------------
describe("validateExternalUrl — blocked protocols", () => {
  it("rejects ftp://", () => {
    expect(() => validateExternalUrl("ftp://api.resend.com/emails")).toThrow(
      "Blocked protocol",
    );
  });

  it("rejects file://", () => {
    expect(() => validateExternalUrl("file:///etc/passwd")).toThrow(
      "Blocked protocol",
    );
  });

  it("rejects javascript:", () => {
    expect(() => validateExternalUrl("javascript:alert(1)")).toThrow(
      "Blocked protocol",
    );
  });
});

// ---------------------------------------------------------------------------
// safeFetch — validation + timeout
// ---------------------------------------------------------------------------
describe("safeFetch — behavior", () => {
  it("rejects non-allowlisted URL before any network call", async () => {
    const { safeFetch } = await import("@/lib/safe-fetch");
    await expect(safeFetch("https://evil.com/steal")).rejects.toThrow(
      "Domain not in allowlist",
    );
  });

  it("passes 30s default AbortSignal.timeout when no signal provided", async () => {
    const { safeFetch } = await import("@/lib/safe-fetch");
    const originalFetch = globalThis.fetch;
    let capturedInit: RequestInit | undefined;
    globalThis.fetch = async (
      _url: string | URL | Request,
      init?: RequestInit,
    ) => {
      capturedInit = init;
      return new Response("ok");
    };
    try {
      await safeFetch("https://api.resend.com/emails");
      expect(capturedInit).toBeDefined();
      expect(capturedInit!.signal).toBeDefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("preserves caller-provided signal", async () => {
    const { safeFetch } = await import("@/lib/safe-fetch");
    const originalFetch = globalThis.fetch;
    let capturedInit: RequestInit | undefined;
    globalThis.fetch = async (
      _url: string | URL | Request,
      init?: RequestInit,
    ) => {
      capturedInit = init;
      return new Response("ok");
    };
    const controller = new AbortController();
    try {
      await safeFetch("https://api.resend.com/emails", {
        signal: controller.signal,
      });
      expect(capturedInit!.signal).toBe(controller.signal);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
