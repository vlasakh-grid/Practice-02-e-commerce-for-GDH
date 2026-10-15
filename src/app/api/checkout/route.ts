import type { CartItem } from "@/lib/pricing";
import { placeOrder } from "@/services/place-order";
import { catalog, orderRepository } from "@/data/container";

// API contract — imported by the checkout page with `import type`.
export type CheckoutRequest = { items: CartItem[] };
export type CheckoutSuccess = { orderId: string; total: number };
export type CheckoutError = { error: string };

function badRequest(error: string) {
  const response: CheckoutError = { error };
  return Response.json(response, { status: 400 });
}

function parseCart(body: unknown): CheckoutRequest | CheckoutError {
  const rawItems = (body as { items?: unknown } | null)?.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: "items must be a non-empty array" };
  }
  const items: CartItem[] = [];
  for (const raw of rawItems) {
    if (typeof raw !== "object" || raw === null) {
      return { error: "Each item must be an object with productId and quantity" };
    }
    const { productId, quantity } = raw as Record<string, unknown>;
    if (typeof productId !== "string") {
      return { error: `Unknown product: ${String(productId)}` };
    }
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
      return { error: "quantity must be an integer of at least 1" };
    }
    items.push({ productId, quantity });
  }
  return { items };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON");
  }

  const cart = parseCart(body);
  if ("error" in cart) {
    return badRequest(cart.error);
  }

  const result = await placeOrder(cart.items, { catalog, orders: orderRepository });
  if ("error" in result) {
    return badRequest(result.error);
  }
  const response: CheckoutSuccess = { orderId: result.id, total: result.total };
  return Response.json(response);
}
