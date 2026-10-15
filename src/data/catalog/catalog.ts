import type { Product } from "@/lib/pricing";

// Read access to the product catalog.
export type Catalog = {
  list(): Promise<Product[]>;
  // Returns only the products that exist, keyed by id.
  getByIds(ids: string[]): Promise<Map<string, Product>>;
};
