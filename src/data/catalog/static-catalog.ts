import { PRODUCTS, findProduct, type Product } from "@/lib/pricing";
import type { Catalog } from "@/data/catalog/catalog";

export function createStaticCatalog(): Catalog {
  return {
    async list() {
      return [...PRODUCTS];
    },
    async getByIds(ids) {
      const products = new Map<string, Product>();
      for (const id of ids) {
        const product = findProduct(id);
        if (product) {
          products.set(id, product);
        }
      }
      return products;
    },
  };
}
