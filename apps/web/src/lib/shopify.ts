// Shopify integration — OAuth Client Credentials (2026 pattern)
// Tokens expire every 24h. Auto-refresh on 401.
// GraphQL endpoint: https://{shop}.myshopify.com/admin/api/2025-01/graphql.json

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP;
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;

interface ShopifyToken {
  accessToken: string;
  expiresAt: number;
}

interface ShopifyAuthResponse {
  access_token: string;
  expires_in?: number;
}

interface ShopifyGraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface ShopifyUserError {
  field: string[];
  message: string;
}

interface DiscountCodeBasicCreateData {
  discountCodeBasicCreate: {
    codeDiscountNode: { id: string };
    userErrors: ShopifyUserError[];
  };
}

interface ProductNode {
  id: string;
  title: string;
  handle: string;
}

interface ProductsData {
  products: {
    edges: Array<{ node: ProductNode }>;
  };
}

let cachedToken: ShopifyToken | null = null;

function assertConfigured(operation: string): void {
  if (!SHOPIFY_SHOP || !SHOPIFY_CLIENT_ID || !SHOPIFY_CLIENT_SECRET) {
    throw new Error(
      `[Shopify] Not configured for "${operation}". Set SHOPIFY_SHOP, SHOPIFY_CLIENT_ID, and SHOPIFY_CLIENT_SECRET.`,
    );
  }
}

async function getAccessToken(): Promise<string> {
  assertConfigured("auth");

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const res = await fetch(
    `https://${SHOPIFY_SHOP}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Shopify auth failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as ShopifyAuthResponse;
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 86_400) * 1000,
  };

  return cachedToken.accessToken;
}

async function shopifyGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = await getAccessToken();

  const res = await fetch(
    `https://${SHOPIFY_SHOP}/admin/api/2025-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    },
  );

  if (res.status === 401) {
    // Token expired — clear cache and retry once
    cachedToken = null;
    const freshToken = await getAccessToken();

    const retryRes = await fetch(
      `https://${SHOPIFY_SHOP}/admin/api/2025-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": freshToken,
        },
        body: JSON.stringify({ query, variables }),
      },
    );

    if (!retryRes.ok) {
      throw new Error(`Shopify GraphQL error after retry: ${retryRes.status}`);
    }

    const retryJson =
      (await retryRes.json()) as ShopifyGraphQLResponse<T>;
    if (retryJson.errors) {
      throw new Error(
        `Shopify GraphQL: ${JSON.stringify(retryJson.errors)}`,
      );
    }
    return retryJson.data as T;
  }

  if (!res.ok) {
    throw new Error(`Shopify GraphQL error: ${res.status}`);
  }

  const json = (await res.json()) as ShopifyGraphQLResponse<T>;
  if (json.errors) {
    throw new Error(`Shopify GraphQL: ${JSON.stringify(json.errors)}`);
  }

  return json.data as T;
}

// Create a basic discount code (for store credit payouts)
export async function createDiscountCode(
  code: string,
  amount: number,
): Promise<{ id: string }> {
  assertConfigured("createDiscountCode");

  const query = `
    mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode { id }
        userErrors { field message }
      }
    }
  `;

  const variables = {
    basicCodeDiscount: {
      title: `Store Credit - ${code}`,
      code,
      startsAt: new Date().toISOString(),
      customerGets: {
        value: {
          discountAmount: {
            amount: amount.toFixed(2),
            appliesOnEachItem: false,
          },
        },
        items: { all: true },
      },
      usageLimit: 1,
    },
  };

  const data = await shopifyGraphQL<DiscountCodeBasicCreateData>(
    query,
    variables,
  );

  if (data.discountCodeBasicCreate.userErrors.length > 0) {
    const firstError = data.discountCodeBasicCreate.userErrors[0];
    throw new Error(
      `Shopify discount error: ${firstError?.message ?? "Unknown error"}`,
    );
  }

  return { id: data.discountCodeBasicCreate.codeDiscountNode.id };
}

// Query products (placeholder for future catalog integration)
export async function getProducts(
  first = 10,
): Promise<Array<{ id: string; title: string; handle: string }>> {
  if (!SHOPIFY_SHOP || !SHOPIFY_CLIENT_ID || !SHOPIFY_CLIENT_SECRET) {
    console.warn(
      "[Shopify] Not configured. Returning empty product list.",
    );
    return [];
  }

  const query = `
    query products($first: Int!) {
      products(first: $first) {
        edges { node { id title handle } }
      }
    }
  `;

  const data = await shopifyGraphQL<ProductsData>(query, { first });
  return data.products.edges.map((e) => e.node);
}
