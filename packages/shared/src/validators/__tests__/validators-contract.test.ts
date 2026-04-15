import { describe, expect, it } from "vitest";
import type { ZodTypeAny } from "zod";

import {
  addressSchema,
  contactFiltersSchema,
  cpfSchema,
  createContactSchema,
  createOrderSchema,
  createProductSchema,
  createSkuSchema,
  emailSchema,
  loginSchema,
  orderFiltersSchema,
  paginationSchema,
  passwordSchema,
  productFiltersSchema,
  searchSchema,
  updateContactSchema,
  updateOrderStatusSchema,
  updateProductSchema,
  uuidSchema,
} from "../index";

type SchemaCase = {
  name: string;
  schema: ZodTypeAny;
  valid: unknown;
  invalid: unknown;
  assertParsed?: (value: unknown) => void;
};

const schemaCases: SchemaCase[] = [
  {
    name: "emailSchema",
    schema: emailSchema,
    valid: "contato@ambaril.app",
    invalid: "email-invalido",
  },
  {
    name: "passwordSchema",
    schema: passwordSchema,
    valid: "senha-super-segura-123",
    invalid: "curta",
  },
  {
    name: "cpfSchema",
    schema: cpfSchema,
    valid: "12345678909",
    invalid: "123",
  },
  {
    name: "uuidSchema",
    schema: uuidSchema,
    valid: "018f7d76-5cf8-74f0-b9b1-5f9d2e7dc201",
    invalid: "uuid-invalido",
  },
  {
    name: "loginSchema",
    schema: loginSchema,
    valid: {
      email: "operacoes@ambaril.app",
      password: "senha-super-segura-123",
    },
    invalid: {
      email: "operacoes",
      password: "123",
    },
    assertParsed: (value) => {
      expect(value).toMatchObject({
        email: "operacoes@ambaril.app",
        password: "senha-super-segura-123",
        remember: false,
      });
    },
  },
  {
    name: "paginationSchema",
    schema: paginationSchema,
    valid: {
      page: "2",
      per_page: "50",
    },
    invalid: {
      page: 0,
      per_page: 200,
    },
    assertParsed: (value) => {
      expect(value).toMatchObject({
        page: 2,
        per_page: 50,
        sort_order: "desc",
      });
    },
  },
  {
    name: "searchSchema",
    schema: searchSchema,
    valid: {
      q: "hoodie oversized",
    },
    invalid: {
      q: "a".repeat(256),
    },
  },
  {
    name: "addressSchema",
    schema: addressSchema,
    valid: {
      street: "Rua Augusta",
      number: "123",
      neighborhood: "Consolacao",
      city: "Sao Paulo",
      state: "SP",
      zipCode: "01305000",
    },
    invalid: {
      street: "",
      number: "123",
      neighborhood: "Consolacao",
      city: "Sao Paulo",
      state: "Sao Paulo",
      zipCode: "1305000",
    },
  },
  {
    name: "createOrderSchema",
    schema: createOrderSchema,
    valid: {
      contactId: "018f7d76-5cf8-74f0-b9b1-5f9d2e7dc201",
      items: [
        {
          skuId: "018f7d76-5cf8-74f0-b9b1-5f9d2e7dc202",
          quantity: 2,
          unitPrice: "199.90",
        },
      ],
      paymentMethod: "pix",
      shippingAddress: {
        street: "Rua Augusta",
        number: "123",
        neighborhood: "Consolacao",
        city: "Sao Paulo",
        state: "SP",
        zipCode: "01305000",
      },
      billingCpf: "12345678909",
    },
    invalid: {
      contactId: "nao-e-uuid",
      items: [],
      paymentMethod: "dinheiro",
      shippingAddress: {
        street: "Rua Augusta",
        number: "123",
        neighborhood: "Consolacao",
        city: "Sao Paulo",
        state: "SP",
        zipCode: "01305000",
      },
      billingCpf: "123",
    },
    assertParsed: (value) => {
      expect(value).toMatchObject({
        installments: 1,
        paymentMethod: "pix",
      });
    },
  },
  {
    name: "updateOrderStatusSchema",
    schema: updateOrderStatusSchema,
    valid: {
      status: "shipped",
      trackingCode: "BR123456789",
    },
    invalid: {
      status: "unknown",
    },
  },
  {
    name: "orderFiltersSchema",
    schema: orderFiltersSchema,
    valid: {
      page: "1",
      status: "paid",
      paymentMethod: "credit_card",
    },
    invalid: {
      status: "invalido",
    },
  },
  {
    name: "createContactSchema",
    schema: createContactSchema,
    valid: {
      name: "Marcus Ambaril",
      email: "marcus@ambaril.app",
      phone: "11999999999",
      source: "manual",
      tags: ["vip"],
    },
    invalid: {
      name: "M",
      email: "email-invalido",
      phone: "123",
    },
  },
  {
    name: "updateContactSchema",
    schema: updateContactSchema,
    valid: {
      email: "novo@ambaril.app",
      optOutEmail: true,
    },
    invalid: {
      email: "email-invalido",
      optOutEmail: "sim",
    },
  },
  {
    name: "contactFiltersSchema",
    schema: contactFiltersSchema,
    valid: {
      page: "3",
      source: "checkout",
      hasEmail: true,
    },
    invalid: {
      source: "newsletter",
    },
  },
  {
    name: "createProductSchema",
    schema: createProductSchema,
    valid: {
      name: "Hoodie Core",
      slug: "hoodie-core",
    },
    invalid: {
      name: "",
      slug: "Hoodie Core",
    },
    assertParsed: (value) => {
      expect(value).toMatchObject({
        isActive: true,
      });
    },
  },
  {
    name: "updateProductSchema",
    schema: updateProductSchema,
    valid: {
      description: "Nova descricao curta",
    },
    invalid: {
      slug: "Slug Invalido",
    },
  },
  {
    name: "createSkuSchema",
    schema: createSkuSchema,
    valid: {
      productId: "018f7d76-5cf8-74f0-b9b1-5f9d2e7dc203",
      skuCode: "SKU-001",
      size: "M",
      color: "Preto",
      costPrice: "89.90",
      sellPrice: "199.90",
      weight: 0.45,
    },
    invalid: {
      productId: "nao-e-uuid",
      skuCode: "",
      size: "",
      color: "",
      costPrice: "89",
      sellPrice: "199",
      weight: 0,
    },
  },
  {
    name: "productFiltersSchema",
    schema: productFiltersSchema,
    valid: {
      search: "hoodie",
      isActive: true,
    },
    invalid: {
      search: "a".repeat(256),
    },
  },
];

describe("shared validator contracts", () => {
  for (const schemaCase of schemaCases) {
    it(`${schemaCase.name} accepts a canonical payload`, () => {
      const result = schemaCase.schema.safeParse(schemaCase.valid);

      expect(result.success).toBe(true);

      if (result.success) {
        schemaCase.assertParsed?.(result.data);
      }
    });

    it(`${schemaCase.name} rejects an invalid payload`, () => {
      const result = schemaCase.schema.safeParse(schemaCase.invalid);

      expect(result.success).toBe(false);
    });
  }
});
