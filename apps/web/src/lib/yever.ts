// Yever integration — checkout platform for sale attribution
// Used for looking up orders by coupon code (creator attribution)

const YEVER_API_URL = process.env.YEVER_API_URL;
const YEVER_API_KEY = process.env.YEVER_API_KEY;

interface YeverOrder {
  id: string;
  orderNumber: string;
  total: number;
  discount: number;
  couponCode: string;
  customerCpf?: string;
  createdAt: string;
  status: string;
}

interface YeverOrdersResponse {
  orders?: YeverOrder[];
}

function isConfigured(): boolean {
  return Boolean(YEVER_API_URL && YEVER_API_KEY);
}

export async function getOrdersByCoupon(
  couponCode: string,
  since?: Date,
): Promise<YeverOrder[]> {
  if (!isConfigured()) {
    console.warn("[Yever] API not configured. Returning empty.");
    return [];
  }

  const params = new URLSearchParams({ coupon: couponCode });
  if (since) params.set("since", since.toISOString());

  const res = await fetch(`${YEVER_API_URL}/orders?${params.toString()}`, {
    headers: { Authorization: `Bearer ${YEVER_API_KEY}` },
  });

  if (!res.ok) {
    throw new Error(`Yever API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as YeverOrdersResponse;
  return data.orders ?? [];
}

export async function getOrderById(
  orderId: string,
): Promise<YeverOrder | null> {
  if (!isConfigured()) {
    console.warn("[Yever] API not configured. Returning null.");
    return null;
  }

  const res = await fetch(`${YEVER_API_URL}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${YEVER_API_KEY}` },
  });

  if (!res.ok) return null;
  return (await res.json()) as YeverOrder;
}

// ---------------------------------------------------------------------------
// Per-tenant client factory
// ---------------------------------------------------------------------------

interface YeverConfig {
  apiUrl: string;
  apiKey: string;
}

/**
 * Create a Yever client bound to specific credentials.
 * Used by YeverCheckoutProvider when tenant credentials are loaded from DB.
 */
export function createYeverClient(config: YeverConfig) {
  return {
    async getOrdersByCoupon(
      couponCode: string,
      since?: Date,
    ): Promise<YeverOrder[]> {
      const params = new URLSearchParams({ coupon: couponCode });
      if (since) params.set("since", since.toISOString());

      const res = await fetch(
        `${config.apiUrl}/orders?${params.toString()}`,
        { headers: { Authorization: `Bearer ${config.apiKey}` } },
      );

      if (!res.ok) {
        throw new Error(`Yever API error: ${res.status} ${res.statusText}`);
      }

      const data = (await res.json()) as YeverOrdersResponse;
      return data.orders ?? [];
    },

    async getOrderById(orderId: string): Promise<YeverOrder | null> {
      const res = await fetch(`${config.apiUrl}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });

      if (!res.ok) return null;
      return (await res.json()) as YeverOrder;
    },

    async testConnection(): Promise<boolean> {
      try {
        const res = await fetch(`${config.apiUrl}/orders?limit=1`, {
          headers: { Authorization: `Bearer ${config.apiKey}` },
        });
        // 2xx or 404 = server is reachable; 401/403 = bad credentials
        return res.ok || res.status === 404;
      } catch {
        return false;
      }
    },
  };
}
