// TODO: Replace when ERP module is implemented

interface GiftingOrder {
  id: string;
  status: string;
  trackingCode: string | null;
}

export async function createGiftingOrder(
  creatorName: string,
  productName: string,
  _shippingAddress: Record<string, unknown>,
): Promise<GiftingOrder | null> {
  // TODO: Replace with real ERP order creation when erp module is implemented
  console.log(
    `[ERP Stub] Would create gifting order for ${creatorName}: ${productName}`,
  );
  return null;
}

export async function getOrderById(
  _orderId: string,
): Promise<GiftingOrder | null> {
  // TODO: Replace with real ERP order query when erp module is implemented
  return null;
}
