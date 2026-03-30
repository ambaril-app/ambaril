// TODO: Replace when ERP module is implemented

interface Product {
  id: string;
  name: string;
  price: string;
  imageUrl: string | null;
  category: string | null;
}

export async function getProducts(): Promise<Product[]> {
  // TODO: Replace with real ERP product query when erp module is implemented
  return [];
}

export async function getProductById(
  _id: string,
): Promise<Product | null> {
  // TODO: Replace with real ERP product query when erp module is implemented
  return null;
}
