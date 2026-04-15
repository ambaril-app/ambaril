/**
 * Property-Based Tests for shared validators.
 *
 * These tests use fast-check to generate hundreds of random inputs and verify
 * INVARIANTS — properties that must hold for ALL inputs, not just hand-picked examples.
 *
 * Why PBT matters for LLM-generated code:
 * - LLMs write tests that mirror their own implementation logic (tautological tests)
 * - PBT breaks this cycle by testing properties derived from the SPEC, not the code
 * - Random inputs find edge cases neither the LLM nor the human anticipated
 *
 * Each property below maps to a spec requirement, not an implementation detail.
 */
import { describe, expect, it } from "vitest";
import fc from "fast-check";

import {
  addressSchema,
  cpfSchema,
  createOrderSchema,
  emailSchema,
  paginationSchema,
  passwordSchema,
  updateOrderStatusSchema,
} from "../index";

// ---------------------------------------------------------------------------
// Arbitraries — reusable generators for domain-specific random data
// ---------------------------------------------------------------------------

const validCpf = fc.stringMatching(/^\d{11}$/);
const invalidCpf = fc.oneof(
  fc.string().filter((s) => !/^\d{11}$/.test(s)),
  fc.constant(""),
  fc.constant("1234567890"), // 10 digits
  fc.constant("123456789012"), // 12 digits
);

const validEmail = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{1,10}$/),
    fc.stringMatching(/^[a-z]{2,6}$/),
    fc.constantFrom("com", "br", "app", "io"),
  )
  .map(([user, domain, tld]) => `${user}@${domain}.${tld}`);

const validUuid = fc.stringMatching(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
);

const validPrice = fc
  .integer({ min: 1, max: 99999 })
  .map((n) => `${Math.floor(n / 100)}.${String(n % 100).padStart(2, "0")}`);

const validAddress = fc.record({
  street: fc.string({ minLength: 1, maxLength: 100 }),
  number: fc.string({ minLength: 1, maxLength: 10 }),
  neighborhood: fc.string({ minLength: 1, maxLength: 50 }),
  city: fc.string({ minLength: 1, maxLength: 50 }),
  state: fc.constantFrom("SP", "RJ", "MG", "RS", "PR", "SC", "BA"),
  zipCode: fc.stringMatching(/^\d{8}$/),
});

// ---------------------------------------------------------------------------
// Property: cpfSchema — invariants
// ---------------------------------------------------------------------------
describe("PBT: cpfSchema", () => {
  it("accepts any 11-digit numeric string", () => {
    fc.assert(
      fc.property(validCpf, (cpf) => {
        expect(cpfSchema.safeParse(cpf).success).toBe(true);
      }),
    );
  });

  it("rejects any string that is not exactly 11 digits", () => {
    fc.assert(
      fc.property(invalidCpf, (cpf) => {
        expect(cpfSchema.safeParse(cpf).success).toBe(false);
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property: emailSchema — invariants
// ---------------------------------------------------------------------------
describe("PBT: emailSchema", () => {
  it("accepts well-formed emails up to 255 chars", () => {
    fc.assert(
      fc.property(validEmail, (email) => {
        expect(emailSchema.safeParse(email).success).toBe(true);
      }),
    );
  });

  it("rejects strings longer than 255 characters", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 256, maxLength: 300 }), (longStr) => {
        expect(emailSchema.safeParse(longStr).success).toBe(false);
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property: passwordSchema — invariants
// ---------------------------------------------------------------------------
describe("PBT: passwordSchema", () => {
  it("accepts strings between 8 and 128 characters", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 8, maxLength: 128 }), (pwd) => {
        expect(passwordSchema.safeParse(pwd).success).toBe(true);
      }),
    );
  });

  it("rejects strings shorter than 8 characters", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 7 }), (pwd) => {
        expect(passwordSchema.safeParse(pwd).success).toBe(false);
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property: paginationSchema — invariants
// ---------------------------------------------------------------------------
describe("PBT: paginationSchema", () => {
  it("coerces valid page/per_page to integers within bounds", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 100 }),
        (page, perPage) => {
          const result = paginationSchema.safeParse({
            page: String(page),
            per_page: String(perPage),
          });
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.page).toBe(page);
            expect(result.data.per_page).toBe(perPage);
            expect(result.data.sort_order).toBe("desc"); // default
          }
        },
      ),
    );
  });

  it("rejects per_page above 100", () => {
    fc.assert(
      fc.property(fc.integer({ min: 101, max: 10000 }), (perPage) => {
        const result = paginationSchema.safeParse({
          page: "1",
          per_page: perPage,
        });
        expect(result.success).toBe(false);
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property: updateOrderStatusSchema — enum validation invariants
// (This tests the Zod enum validator, NOT a real order FSM with transition rules.
//  Real FSM PBT will be added when ERP order state machine is implemented.)
// ---------------------------------------------------------------------------
describe("PBT: updateOrderStatusSchema (enum validation)", () => {
  const validStatuses = [
    "pending",
    "paid",
    "separating",
    "shipped",
    "delivered",
    "cancelled",
    "returned",
  ] as const;

  it("accepts all valid order statuses", () => {
    fc.assert(
      fc.property(fc.constantFrom(...validStatuses), (status) => {
        const result = updateOrderStatusSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }),
    );
  });

  it("rejects any string not in the valid status enum", () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 20 })
          .filter((s) => !(validStatuses as readonly string[]).includes(s)),
        (status) => {
          const result = updateOrderStatusSchema.safeParse({ status });
          expect(result.success).toBe(false);
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// Property: createOrderSchema — structural invariants
// ---------------------------------------------------------------------------
describe("PBT: createOrderSchema", () => {
  it("always requires at least 1 item", () => {
    fc.assert(
      fc.property(validUuid, validAddress, (contactId, addr) => {
        const result = createOrderSchema.safeParse({
          contactId,
          items: [], // empty
          paymentMethod: "pix",
          shippingAddress: addr,
          billingCpf: "12345678909",
        });
        expect(result.success).toBe(false);
      }),
    );
  });

  it("defaults installments to 1 when not provided", () => {
    fc.assert(
      fc.property(validUuid, validPrice, validAddress, (uuid, price, addr) => {
        const result = createOrderSchema.safeParse({
          contactId: uuid,
          items: [{ skuId: uuid, quantity: 1, unitPrice: price }],
          paymentMethod: "pix",
          shippingAddress: addr,
          billingCpf: "12345678909",
        });
        if (result.success) {
          expect(result.data.installments).toBe(1);
        }
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property: addressSchema — all required fields
// ---------------------------------------------------------------------------
describe("PBT: addressSchema", () => {
  it("accepts valid addresses with 2-char state codes", () => {
    fc.assert(
      fc.property(validAddress, (addr) => {
        expect(addressSchema.safeParse(addr).success).toBe(true);
      }),
    );
  });

  it("rejects addresses where any required field is empty", () => {
    const requiredFields = [
      "street",
      "number",
      "neighborhood",
      "city",
    ] as const;

    fc.assert(
      fc.property(
        validAddress,
        fc.constantFrom(...requiredFields),
        (addr, field) => {
          const broken = { ...addr, [field]: "" };
          expect(addressSchema.safeParse(broken).success).toBe(false);
        },
      ),
    );
  });

  it("rejects state codes that are not exactly 2 characters", () => {
    fc.assert(
      fc.property(
        validAddress,
        fc.string({ minLength: 3, maxLength: 10 }),
        (addr, badState) => {
          const broken = { ...addr, state: badState };
          expect(addressSchema.safeParse(broken).success).toBe(false);
        },
      ),
    );
  });
});
