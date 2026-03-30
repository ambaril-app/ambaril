// Provider Catalog — static metadata for the integration settings UI.
// Each entry describes a provider that tenants can connect.
// This is a static list; runtime resolution is handled by registry.ts.

import type { Capability } from "./types";

/** Configuration field definition for provider setup forms */
export interface ConfigField {
  key: string;
  label: string;
  type: "text" | "password" | "url";
  required: boolean;
  placeholder?: string;
}

/** Catalog entry describing an available provider */
export interface ProviderCatalogEntry {
  /** Unique slug for the provider (e.g., "shopify", "yever") */
  id: string;
  /** Human-readable name */
  name: string;
  /** Which capability this provider implements */
  capability: Capability;
  /** Description shown in the app-store-style catalog UI */
  description: string;
  /** Lucide React icon name */
  icon: string;
  /** Fields required to configure this provider */
  configFields: ConfigField[];
}

/**
 * Static catalog of all supported providers.
 * Rendered in `/admin/settings/integrations` as an app-store-style list.
 */
export const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  {
    id: "shopify",
    name: "Shopify",
    capability: "ecommerce",
    description: "Cat\u00e1logo de produtos, cupons e estoque",
    icon: "ShoppingBag",
    configFields: [
      {
        key: "shop",
        label: "Shopify Store",
        type: "text",
        required: true,
        placeholder: "mystore.myshopify.com",
      },
      {
        key: "clientId",
        label: "Client ID",
        type: "text",
        required: true,
      },
      {
        key: "clientSecret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
    ],
  },
  {
    id: "yever",
    name: "Yever",
    capability: "checkout",
    description: "Checkout e atribui\u00e7\u00e3o de vendas",
    icon: "CreditCard",
    configFields: [
      {
        key: "apiUrl",
        label: "API URL",
        type: "url",
        required: true,
        placeholder: "https://api.yever.com.br",
      },
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
      },
    ],
  },
  {
    id: "resend",
    name: "Resend",
    capability: "messaging",
    description: "Email transacional e marketing",
    icon: "Mail",
    configFields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
      },
      {
        key: "fromEmail",
        label: "Remetente",
        type: "text",
        required: true,
        placeholder: "no-reply@suamarca.com.br",
      },
    ],
  },
  {
    id: "cloudflare-r2",
    name: "Cloudflare R2",
    capability: "storage",
    description: "Armazenamento de arquivos e imagens",
    icon: "HardDrive",
    configFields: [
      {
        key: "accountId",
        label: "Account ID",
        type: "text",
        required: true,
      },
      {
        key: "accessKeyId",
        label: "Access Key ID",
        type: "text",
        required: true,
      },
      {
        key: "secretAccessKey",
        label: "Secret Access Key",
        type: "password",
        required: true,
      },
      {
        key: "bucketName",
        label: "Bucket Name",
        type: "text",
        required: true,
        placeholder: "ambaril-assets",
      },
      {
        key: "publicUrl",
        label: "Public URL",
        type: "url",
        required: false,
        placeholder: "https://assets.suamarca.com.br",
      },
    ],
  },
  {
    id: "instagram",
    name: "Instagram",
    capability: "social",
    description: "Monitoramento de men\u00e7\u00f5es e perfis",
    icon: "Camera",
    configFields: [
      {
        key: "accessToken",
        label: "Access Token",
        type: "password",
        required: true,
      },
      {
        key: "businessAccountId",
        label: "Business Account ID",
        type: "text",
        required: true,
      },
    ],
  },
];
