import { catalog } from "@/data/container";

// API contract — imported by the checkout page with `import type`.
export type ProductSummary = { id: string; name: string; price: number };
export type ProductsResponse = ProductSummary[];

export async function GET() {
  const products = await catalog.list();
  const response: ProductsResponse = products.map(({ id, name, price }) => ({ id, name, price }));
  return Response.json(response);
}
