import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { calculateTotal, findProduct, roundToCents, type CartItem } from "@/lib/pricing";

// API contract — imported by the checkout page with `import type`.
export type CheckoutRequest = { items: CartItem[] };
export type CheckoutSuccess = { orderId: string; total: number };
export type CheckoutError = { error: string };

// Shape of a record stored in data/orders.json.
export type OrderItem = { productId: string; name: string; quantity: number; unitPrice: number };
export type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  createdAt: string;
};

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
    if (typeof productId !== "string" || !findProduct(productId)) {
      return { error: `Unknown product: ${String(productId)}` };
    }
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
      return { error: "quantity must be an integer of at least 1" };
    }
    items.push({ productId, quantity });
  }
  return { items };
}

// Assumes items are already validated by parseCart (known productId).
function buildOrder(items: CartItem[]): Order {
  const orderItems: OrderItem[] = items.map((item) => {
    const product = findProduct(item.productId)!;
    return {
      productId: item.productId,
      name: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
    };
  });
  const subtotal = roundToCents(
    orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
  );
  const total = calculateTotal(items);
  return {
    id: crypto.randomUUID(),
    userId: "guest", // no auth yet; never trust a client-sent id
    items: orderItems,
    subtotal,
    discount: roundToCents(subtotal - total),
    total,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };
}

// Concurrent checkouts are serialized so read-modify-write cycles cannot lose orders.
let writeQueue: Promise<unknown> = Promise.resolve();

async function writeOrder(order: Order): Promise<void> {
  const dir = path.join(process.cwd(), "data");
  const file = path.join(dir, "orders.json");
  await mkdir(dir, { recursive: true });

  let orders: unknown[] = [];
  try {
    const parsed: unknown = JSON.parse(await readFile(file, "utf8"));
    if (!Array.isArray(parsed)) {
      throw new Error("data/orders.json must contain an array");
    }
    orders = parsed;
  } catch (error) {
    // A missing file starts a new array; anything else (corrupt data) must not be overwritten.
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
  orders.push(order);

  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(orders, null, 2));
  await rename(tmp, file);
}

function appendOrder(order: Order): Promise<void> {
  const run = writeQueue.then(() => writeOrder(order));
  writeQueue = run.catch(() => {}); // keep the chain alive after a failed write
  return run;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON");
  }

  const result = parseCart(body);
  if ("error" in result) {
    return badRequest(result.error);
  }

  const order = buildOrder(result.items);
  await appendOrder(order);
  const response: CheckoutSuccess = { orderId: order.id, total: order.total };
  return Response.json(response);
}
