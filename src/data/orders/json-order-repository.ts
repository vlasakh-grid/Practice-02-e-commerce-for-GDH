import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Order } from "@/data/orders/types";
import type { OrderRepository } from "@/data/orders/order-repository";

export function createJsonOrderRepository(file: string): OrderRepository {
  // Concurrent checkouts are serialized so read-modify-write cycles cannot lose orders.
  let writeQueue: Promise<unknown> = Promise.resolve();

  async function writeOrder(order: Order): Promise<void> {
    await mkdir(path.dirname(file), { recursive: true });

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

  return {
    save(order) {
      const run = writeQueue.then(() => writeOrder(order));
      writeQueue = run.catch(() => {}); // keep the chain alive after a failed write
      return run;
    },
  };
}
