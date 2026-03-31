// Yever integration — checkout platform for sale attribution
// API docs: https://docs.yever.com.br/developers/
// Base URL: https://api.yever.com.br/api/v1
// Auth: Authorization: Bearer {token}
// Endpoints: GET /order/list, GET /cart/list
// NOTE: Yever has NO filter by coupon_code. Discovery requires scanning all orders.

const YEVER_API_URL = process.env.YEVER_API_URL;
// Support both YEVER_API_TOKEN (original) and YEVER_API_KEY (alias) for backwards compat
const YEVER_API_KEY = process.env.YEVER_API_TOKEN ?? process.env.YEVER_API_KEY;

// ---------------------------------------------------------------------------
// Raw API types (snake_case — matches Yever API response exactly)
// ---------------------------------------------------------------------------

interface YeverApiCustomer {
  name: string;
  email: string;
  phone: string;
  type: string;
  document: string; // CPF/CNPJ
  birthday: string;
}

interface YeverApiOrder {
  reference: string;        // order ID
  cart_reference: string;
  customer: YeverApiCustomer;
  status: string;           // paid | pending_payment | refunded | charged_back | canceled
  coupon_code: string | null;
  currency: string;
  price_total: number;      // final price paid
  price_subtotal: number;
  price_shipment: number;
  price_coupon_discount: number;
  price_shipment_discount: number;
  price_offer_discount: number;
  price_payment_discount: number;
  payment_method: string;
  created_at: string;
  updated_at: string;
  utms: {
    source: string | null;
    campaign: string | null;
    medium: string | null;
    content: string | null;
    term: string | null;
  };
}

interface YeverApiListResponse {
  orders: YeverApiOrder[];
  paginate: {
    current: number;
    last: number;
    total: number;
    per_page: number;
  };
}

// ---------------------------------------------------------------------------
// Normalized types (camelCase — used internally and by providers)
// ---------------------------------------------------------------------------

export interface YeverOrder {
  id: string;           // reference
  total: number;        // price_total
  discount: number;     // price_coupon_discount
  couponCode: string | null;
  customerCpf?: string; // customer.document
  createdAt: string;
  status: string;
}

export interface YeverDiscoveredCoupon {
  code: string;
  orderCount: number;
  totalRevenue: number;
  totalDiscount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapApiOrder(o: YeverApiOrder): YeverOrder {
  return {
    id: o.reference,
    total: o.price_total,
    discount: o.price_coupon_discount,
    couponCode: o.coupon_code,
    customerCpf: o.customer?.document,
    createdAt: o.created_at,
    status: o.status,
  };
}

function isConfigured(): boolean {
  return Boolean(YEVER_API_URL && YEVER_API_KEY);
}

/** Normalize Yever base URL — always ends with /api/v1 */
function normalizeApiUrl(url: string): string {
  const base = url.replace(/\/+$/, "");
  return base.endsWith("/api/v1") ? base : `${base}/api/v1`;
}

async function fetchOrderPage(
  apiUrl: string,
  apiKey: string,
  page: number,
  params?: Record<string, string>,
): Promise<YeverApiListResponse> {
  const base = normalizeApiUrl(apiUrl);
  const query = new URLSearchParams({
    page: page.toString(),
    per_page: "500",
    ...params,
  });

  const res = await fetch(`${base}/order/list?${query.toString()}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    throw new Error(`Yever API error: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as YeverApiListResponse;
}

// ---------------------------------------------------------------------------
// Public functions (platform .env credentials)
// ---------------------------------------------------------------------------

/**
 * Discover coupon codes by scanning all paid orders.
 * Yever has no dedicated coupon endpoint — this is the only way to find active coupons.
 */
export async function discoverCouponsFromOrders(): Promise<YeverDiscoveredCoupon[]> {
  if (!isConfigured()) {
    console.warn("[Yever] API not configured. Returning empty.");
    return [];
  }

  const couponMap = new Map<string, { orderCount: number; totalRevenue: number; totalDiscount: number }>();
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await fetchOrderPage(YEVER_API_URL!, YEVER_API_KEY!, page, { status: "paid" });

    for (const order of data.orders) {
      if (order.coupon_code?.trim()) {
        const code = order.coupon_code.toUpperCase().trim();
        const existing = couponMap.get(code) ?? { orderCount: 0, totalRevenue: 0, totalDiscount: 0 };
        couponMap.set(code, {
          orderCount: existing.orderCount + 1,
          totalRevenue: existing.totalRevenue + order.price_total,
          totalDiscount: existing.totalDiscount + order.price_coupon_discount,
        });
      }
    }

    hasMore = data.paginate.current < data.paginate.last;
    page++;
  }

  return Array.from(couponMap.entries())
    .map(([code, stats]) => ({ code, ...stats }))
    .sort((a, b) => b.orderCount - a.orderCount);
}

/**
 * Get all orders that used a specific coupon code (client-side filter).
 * NOTE: Yever has no server-side filter by coupon — scans all orders.
 */
export async function getOrdersByCoupon(
  couponCode: string,
  since?: Date,
): Promise<YeverOrder[]> {
  if (!isConfigured()) {
    console.warn("[Yever] API not configured. Returning empty.");
    return [];
  }

  const results: YeverOrder[] = [];
  let page = 1;
  let hasMore = true;
  const targetCode = couponCode.toUpperCase().trim();
  const sinceParams: Record<string, string> = {};
  if (since) sinceParams.created_at_inicial = since.toISOString().replace("T", " ").substring(0, 19);

  while (hasMore) {
    const data = await fetchOrderPage(YEVER_API_URL!, YEVER_API_KEY!, page, {
      status: "paid",
      ...sinceParams,
    });

    for (const order of data.orders) {
      if (order.coupon_code?.toUpperCase().trim() === targetCode) {
        results.push(mapApiOrder(order));
      }
    }

    hasMore = data.paginate.current < data.paginate.last;
    page++;
  }

  return results;
}

export async function getOrderById(
  orderId: string,
): Promise<YeverOrder | null> {
  if (!isConfigured()) {
    console.warn("[Yever] API not configured. Returning null.");
    return null;
  }

  const data = await fetchOrderPage(YEVER_API_URL!, YEVER_API_KEY!, 1, { reference: orderId });
  const order = data.orders[0];
  return order ? mapApiOrder(order) : null;
}

// ---------------------------------------------------------------------------
// Per-tenant client factory
// ---------------------------------------------------------------------------

export interface YeverConfig {
  apiUrl: string;
  apiKey: string;
}

/**
 * Create a Yever client bound to specific tenant credentials.
 * Used by YeverCheckoutProvider when tenant credentials are loaded from DB.
 */
export function createYeverClient(config: YeverConfig) {
  return {
    async discoverCouponsFromOrders(): Promise<YeverDiscoveredCoupon[]> {
      const couponMap = new Map<string, { orderCount: number; totalRevenue: number; totalDiscount: number }>();
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const data = await fetchOrderPage(config.apiUrl, config.apiKey, page, { status: "paid" });

        for (const order of data.orders) {
          if (order.coupon_code?.trim()) {
            const code = order.coupon_code.toUpperCase().trim();
            const existing = couponMap.get(code) ?? { orderCount: 0, totalRevenue: 0, totalDiscount: 0 };
            couponMap.set(code, {
              orderCount: existing.orderCount + 1,
              totalRevenue: existing.totalRevenue + order.price_total,
              totalDiscount: existing.totalDiscount + order.price_coupon_discount,
            });
          }
        }

        hasMore = data.paginate.current < data.paginate.last;
        page++;
      }

      return Array.from(couponMap.entries())
        .map(([code, stats]) => ({ code, ...stats }))
        .sort((a, b) => b.orderCount - a.orderCount);
    },

    async getOrdersByCoupon(
      couponCode: string,
      since?: Date,
    ): Promise<YeverOrder[]> {
      const results: YeverOrder[] = [];
      let page = 1;
      let hasMore = true;
      const targetCode = couponCode.toUpperCase().trim();
      const sinceParams: Record<string, string> = {};
      if (since) sinceParams.created_at_inicial = since.toISOString().replace("T", " ").substring(0, 19);

      while (hasMore) {
        const data = await fetchOrderPage(config.apiUrl, config.apiKey, page, {
          status: "paid",
          ...sinceParams,
        });

        for (const order of data.orders) {
          if (order.coupon_code?.toUpperCase().trim() === targetCode) {
            results.push(mapApiOrder(order));
          }
        }

        hasMore = data.paginate.current < data.paginate.last;
        page++;
      }

      return results;
    },

    async getOrderById(orderId: string): Promise<YeverOrder | null> {
      const data = await fetchOrderPage(config.apiUrl, config.apiKey, 1, { reference: orderId });
      const order = data.orders[0];
      return order ? mapApiOrder(order) : null;
    },

    async testConnection(): Promise<boolean> {
      try {
        const base = normalizeApiUrl(config.apiUrl);
        const res = await fetch(
          `${base}/order/list?per_page=1`,
          { headers: { Authorization: `Bearer ${config.apiKey}` } },
        );
        return res.ok;
      } catch {
        return false;
      }
    },
  };
}
