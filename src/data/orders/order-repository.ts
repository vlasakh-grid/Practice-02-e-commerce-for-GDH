import type { Order } from "@/data/orders/types";

// Persistence for orders. Implementations must store an order atomically
// (all or nothing) and reject when storage fails.
export type OrderRepository = {
  save(order: Order): Promise<void>;
};
