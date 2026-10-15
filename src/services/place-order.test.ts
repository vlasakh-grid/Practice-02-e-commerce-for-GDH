import { describe, expect, it } from "vitest";
import { placeOrder } from "@/services/place-order";
import { createStaticCatalog } from "@/data/catalog/static-catalog";
import type { Order } from "@/data/orders/types";
import type { OrderRepository } from "@/data/orders/order-repository";

describe("placeOrder", () => {
  const catalog = createStaticCatalog();

  it("builds, saves and returns a confirmed order", async () => {
    const saved: Order[] = [];
    const orders: OrderRepository = {
      save: async (order) => {
        saved.push(order);
      },
    };

    const result = await placeOrder(
      [
        { productId: "sticker", quantity: 3 },
        { productId: "mug", quantity: 1 },
      ],
      { catalog, orders },
    );

    expect("error" in result).toBe(false);
    const order = result as Order;
    expect(order.subtotal).toBe(27.47);
    expect(order.discount).toBe(0);
    expect(order.total).toBe(27.47);
    expect(order.items).toEqual([
      { productId: "sticker", name: "Sticker pack", quantity: 3, unitPrice: 4.99 },
      { productId: "mug", name: "Coffee mug", quantity: 1, unitPrice: 12.5 },
    ]);
    expect(order.userId).toBe("guest");
    expect(order.status).toBe("confirmed");
    expect(order.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(order.createdAt).toBe(new Date(order.createdAt).toISOString());
    expect(saved).toEqual([order]);
  });

  it("returns an error and saves nothing for an unknown product", async () => {
    const saved: Order[] = [];
    const orders: OrderRepository = {
      save: async (order) => {
        saved.push(order);
      },
    };

    const result = await placeOrder([{ productId: "nope", quantity: 1 }], { catalog, orders });

    expect(result).toEqual({ error: "Unknown product: nope" });
    expect(saved).toEqual([]);
  });

  it("rejects when the repository fails", async () => {
    const orders: OrderRepository = {
      save: async () => {
        throw new Error("disk full");
      },
    };

    await expect(
      placeOrder([{ productId: "sticker", quantity: 1 }], { catalog, orders }),
    ).rejects.toThrow("disk full");
  });
});
