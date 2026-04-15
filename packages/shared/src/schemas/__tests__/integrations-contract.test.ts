import { describe, expect, it } from "vitest";
import type { ZodTypeAny } from "zod";

import {
  accountOptionsSchema,
  couponCreatorLinkSchema,
  csvImportRowSchema,
  csvImportSchema,
  importCouponsSelectionSchema,
} from "../integrations";

type SchemaCase = {
  name: string;
  schema: ZodTypeAny;
  valid: unknown;
  invalid: unknown;
};

const schemaCases: SchemaCase[] = [
  {
    name: "importCouponsSelectionSchema",
    schema: importCouponsSelectionSchema,
    valid: {
      selectedCoupons: ["DROP01", "DROP02"],
    },
    invalid: {
      selectedCoupons: [""],
    },
  },
  {
    name: "couponCreatorLinkSchema",
    schema: couponCreatorLinkSchema,
    valid: {
      links: [
        {
          couponCode: "DROP01",
          creatorName: "Julia Creator",
          creatorEmail: "julia@ambaril.app",
          tierId: "018f7d76-5cf8-74f0-b9b1-5f9d2e7dc204",
        },
      ],
    },
    invalid: {
      links: [
        {
          couponCode: "",
          creatorName: "J",
          creatorEmail: "email-invalido",
        },
      ],
    },
  },
  {
    name: "accountOptionsSchema",
    schema: accountOptionsSchema,
    valid: {
      onboardingMode: "both",
      sendWelcomeEmail: true,
    },
    invalid: {
      onboardingMode: "manual",
      sendWelcomeEmail: "sim",
    },
  },
  {
    name: "csvImportRowSchema",
    schema: csvImportRowSchema,
    valid: {
      name: "Julia Creator",
      email: "julia@ambaril.app",
      couponCode: "DROP01",
      instagram: "@julia",
      phone: "11999999999",
    },
    invalid: {
      name: "J",
      email: "email-invalido",
      couponCode: "",
    },
  },
  {
    name: "csvImportSchema",
    schema: csvImportSchema,
    valid: {
      rows: [
        {
          name: "Julia Creator",
          email: "julia@ambaril.app",
          couponCode: "DROP01",
        },
      ],
    },
    invalid: {
      rows: [],
    },
  },
];

describe("shared schema contracts", () => {
  for (const schemaCase of schemaCases) {
    it(`${schemaCase.name} accepts a canonical payload`, () => {
      expect(schemaCase.schema.safeParse(schemaCase.valid).success).toBe(true);
    });

    it(`${schemaCase.name} rejects an invalid payload`, () => {
      expect(schemaCase.schema.safeParse(schemaCase.invalid).success).toBe(
        false,
      );
    });
  }
});
