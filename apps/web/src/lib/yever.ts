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
