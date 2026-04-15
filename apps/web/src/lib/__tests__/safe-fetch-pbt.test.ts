/**
 * Property-Based Tests for safe-fetch SSRF protection.
 *
 * Properties derived from CLAUDE.md S5 (safeFetch requirement):
 * - Private/internal hostnames are ALWAYS blocked
 * - Non-allowlisted public hostnames are ALWAYS rejected
 * - Allowlisted domains with HTTPS are ALWAYS accepted
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { validateExternalUrl } from "@/lib/safe-fetch";

// ---------------------------------------------------------------------------
// Property: blocked internal addresses always throw
// ---------------------------------------------------------------------------
describe("PBT: validateExternalUrl — internal addresses always blocked", () => {
  const rfc1918_10 = fc
    .tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
    )
    .map(([b, c, d]) => `10.${b}.${c}.${d}`);

  const rfc1918_172 = fc
    .tuple(
      fc.integer({ min: 16, max: 31 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
    )
    .map(([b, c, d]) => `172.${b}.${c}.${d}`);

  const rfc1918_192 = fc
    .tuple(fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }))
    .map(([c, d]) => `192.168.${c}.${d}`);

  const loopback = fc
    .tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
    )
    .map(([b, c, d]) => `127.${b}.${c}.${d}`);

  const allPrivate = fc.oneof(rfc1918_10, rfc1918_172, rfc1918_192, loopback);

  it("any RFC 1918 / loopback IP is rejected", () => {
    fc.assert(
      fc.property(allPrivate, (ip) => {
        expect(() => validateExternalUrl(`https://${ip}/path`)).toThrow(
          "Blocked internal address",
        );
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property: non-allowlisted public hostnames always rejected
// ---------------------------------------------------------------------------
describe("PBT: validateExternalUrl — non-allowlisted hosts rejected", () => {
  // Generate random domain-like hostnames that can't match the allowlist
  const randomDomain = fc
    .tuple(
      fc.stringMatching(/^[a-z]{3,8}$/),
      fc.constantFrom(".com", ".net", ".org", ".xyz", ".io"),
    )
    .map(([name, tld]) => `${name}${tld}`)
    // filter out anything that could accidentally match an allowed pattern
    .filter(
      (d) =>
        !d.includes("shopify") &&
        !d.includes("yever") &&
        !d.includes("instagram") &&
        !d.includes("facebook") &&
        !d.includes("resend") &&
        !d.includes("viacep") &&
        !d.includes("mercadopago") &&
        !d.includes("focusnfe") &&
        !d.includes("melhorenvio") &&
        !d.includes("cloudflarestorage"),
    );

  it("random public hostnames not in allowlist are rejected", () => {
    fc.assert(
      fc.property(randomDomain, (domain) => {
        expect(() => validateExternalUrl(`https://${domain}/api`)).toThrow(
          "Domain not in allowlist",
        );
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property: allowlisted domains with HTTPS always accepted
// ---------------------------------------------------------------------------
describe("PBT: validateExternalUrl — allowlisted domains accepted", () => {
  const allowedHosts = fc.constantFrom(
    "test.myshopify.com",
    "api.yever.com.br",
    "api.instagram.com",
    "graph.facebook.com",
    "graph.instagram.com",
    "api.resend.com",
    "viacep.com.br",
    "api.mercadopago.com",
    "api.focusnfe.com.br",
    "api.melhorenvio.com.br",
    "bucket.r2.cloudflarestorage.com",
  );

  const randomPath = fc.stringMatching(/^[a-z0-9/]{0,20}$/).map((p) => `/${p}`);

  it("any HTTPS URL to an allowlisted host is accepted", () => {
    fc.assert(
      fc.property(allowedHosts, randomPath, (host, path) => {
        const result = validateExternalUrl(`https://${host}${path}`);
        expect(result).toBeInstanceOf(URL);
      }),
    );
  });
});
