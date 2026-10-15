import path from "node:path";
import { createStaticCatalog } from "@/data/catalog/static-catalog";
import { createJsonOrderRepository } from "@/data/orders/json-order-repository";

// The one place that picks implementations. A database implementation is switched on here.
export const catalog = createStaticCatalog();
export const orderRepository = createJsonOrderRepository(
  path.join(process.cwd(), "data", "orders.json"),
);
