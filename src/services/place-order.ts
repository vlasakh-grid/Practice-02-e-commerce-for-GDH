import { calculateTotal, roundToCents, type CartItem } from "@/lib/pricing";
import type { Catalog } from "@/data/catalog/catalog";
import type { Order, OrderItem } from "@/data/orders/types";
import type { OrderRepository } from "@/data/orders/order-repository";

export type PlaceOrderDeps = { catalog: Catalog; orders: OrderRepository };
export type PlaceOrderError = { error: string };

// Assumes items passed the route's shape validation (string productId, integer quantity >= 1).
export async function placeOrder(
  items: CartItem[],
  deps: PlaceOrderDeps,
): Promise<Order | PlaceOrderError> {
  const products = await deps.catalog.getByIds([...new Set(items.map((item) => item.productId))]);

  const orderItems: OrderItem[] = [];
  for (const item of items) {
    const product = products.get(item.productId);
    if (!product) {
      return { error: `Unknown product: ${item.productId}` };
    }
    orderItems.push({
      productId: item.productId,
      name: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
    });
  }

  const subtotal = roundToCents(
    orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
  );
  const total = calculateTotal(items);
  const order: Order = {
    id: crypto.randomUUID(),
    userId: "guest", // no auth yet; never trust a client-sent id
    items: orderItems,
    subtotal,
    discount: roundToCents(subtotal - total),
    total,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };

  await deps.orders.save(order);
  return order;
}
