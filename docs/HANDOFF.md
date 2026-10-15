# Handoff

Last stage: 4 — Persist orders to data/orders.json   (Status: Done)
Next stage: 5 — Services and data layers (extra task, not in PLAN.md; see "Instructions for the next agent" below)

## Context for the next stage
- Stages 1–4 are complete and committed. `docs/PLAN.md` describes only stages 1–3; stages 4 and 5 are extra tasks approved by the user.
- Always run `nvm use` first (Node.js 22, see `.nvmrc`). Under the default Node 20.11, `npm run test:ci` fails with a vitest/rolldown startup error (`styleText` missing from `node:util`).
- Installed: next 16.4.0 (Turbopack), react / react-dom 19.3.0, typescript 7.0.2, vitest 5.0.4 (vite 8.3.4). Dev server port 3000. Path alias `@/*` → `./src/*` (`tsconfig.json`).
- `next dev` writes `AGENTS.md` in the repo root. It is not part of this task; leave it alone.
- `data/orders.json` is generated at runtime and gitignored (`data/` in `.gitignore`).
- How the current code is laid out (this is what stage 5 restructures):
  - `src/app/api/checkout/route.ts` does everything:
    - the API contract types `CheckoutRequest`, `CheckoutSuccess` and `CheckoutError`;
    - the stored-record types `Order` and `OrderItem`;
    - `parseCart`, which checks the shape and also checks that the product exists via `findProduct`;
    - `buildOrder`, which builds the snapshot and computes subtotal, discount and total;
    - file persistence: `writeOrder` + `appendOrder` + a module-level `writeQueue`;
    - the `POST` handler.
  - `src/app/api/products/route.ts` returns `PRODUCTS` from `@/lib/pricing` directly.
  - `src/app/checkout/page.tsx` imports `type Product` from `@/lib/pricing`.
  - `src/lib/pricing.ts` holds `PRODUCTS`, `findProduct`, `roundToCents`, `applyDiscounts` (a stub) and `calculateTotal`. `calculateTotal` looks prices up in `PRODUCTS` itself and throws on an unknown product.

## Open issues (carry forward)
- No agent has ever verified the client side of `/checkout` in a browser: quantity inputs, button state, the "Order placed" card and error display.
- Orders are stored relative to `process.cwd()`, and writes are serialized only inside one process. This is fine for `npm run dev`, but not for multi-instance deployments. Stage 5 keeps this behavior; a database implementation will replace it later.

## Instructions for the next agent (Sonnet): services and data layers

This is an extra task approved by the user. It is **not** in `docs/PLAN.md`.

### Goal
Prepare the app for a future move from `data/orders.json` to a database, **without changing behavior**:
- move the checkout scenario into a **services** layer (`src/services/`);
- move data access into a **data** layer (`src/data/`). That layer holds the abstractions (`OrderRepository`, `Catalog`), their current implementations (JSON file, hard-coded catalog) and one composition point that picks the implementations.

Later, a database implementation is added in `src/data/` and switched on in `src/data/container.ts`; nothing else changes.

### How to start and finish (differs from the normal stage-handoff flow)
- Before writing code, read:
  - `docs/REQUIREMENTS.md`;
  - `docs/PLAN.md` section 1 (Global rules);
  - the `app-architecture` skill. It describes the **current** architecture; this task changes it, and you update the skill as part of the task.
- Skip stage-handoff steps A.2–A.3 (finding the stage in PLAN.md and the PLAN/HANDOFF consistency check): every PLAN.md stage is `✅ Done`, and PLAN.md has no stage 5. Your stage is the one described here. **Do not edit `docs/PLAN.md` or `docs/REQUIREMENTS.md`.**
- Run `git status` first. The tree must be clean, or `docs/HANDOFF.md` may be the only modified file. Anything else → stop and ask the user.
- Run `nvm use` first.
- When done:
  - overwrite this file with the stage-handoff template (Last stage: `5 — Services and data layers`, Next stage: `None — project complete`) and carry forward still-relevant facts and open issues;
  - stop the dev server;
  - **do not commit or push.**
- If a check fails and you cannot fix it within the files listed below, hand off as Blocked.

### Approved exceptions to existing rules
- New directories `src/services/` and `src/data/`, a new test file and `vitest.config.ts` are allowed. This departs from REQUIREMENTS line 15 ("nothing else — no persistence layer yet") and PLAN section 1 rule 7 (create only listed files); the user approved it.
- No new npm dependencies and no `package.json` changes. Use only the `node:` built-ins already in use.
- **Do not change anything in `src/lib/`** (`pricing.ts` and `pricing.test.ts`). `pricing.ts` stays as an explicit exception in the architecture: it keeps the hard-coded catalog, and `calculateTotal` keeps reading `PRODUCTS` itself until a later refactoring. If you think `src/lib/` must change, stop and hand off as Blocked.
- Create only the files listed below. Do not add:
  - barrel `index.ts` files;
  - an in-memory repository in `src/data/`;
  - environment variables;
  - `export const dynamic` or other route config.

### Target structure
```
src/services/
  place-order.ts               placeOrder: the checkout scenario
  place-order.test.ts          tests with an in-memory OrderRepository defined inside the test
src/data/
  orders/
    types.ts                   Order, OrderItem (moved from the checkout route, unchanged)
    order-repository.ts        OrderRepository abstraction
    json-order-repository.ts   createJsonOrderRepository: current file persistence, moved 1:1
  catalog/
    catalog.ts                 Catalog abstraction
    static-catalog.ts          createStaticCatalog: over PRODUCTS / findProduct from pricing
  container.ts                 the one place that picks implementations
vitest.config.ts               lets Vitest resolve the `@/` alias
```

### Layer rules (also put this table into the `app-architecture` skill)
| Layer | Files | Responsibility | May import |
|---|---|---|---|
| Presentation | `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/checkout/page.tsx` | Render UI, call the API with `fetch` | Only `import type` from route files |
| Transport (API) | `src/app/api/*/route.ts` | Parse HTTP, validate the request shape, call a service or the catalog, map results to status codes and JSON | `@/services/*`, `@/data/container`, `import type` from `@/lib/pricing` |
| Services | `src/services/*` | Business scenarios (`placeOrder`): orchestrate catalog, pricing and persistence. No HTTP, no I/O of their own | `@/lib/pricing`; **only `import type`** from `@/data/**`. Never `@/data/container`, implementations, `node:*` or `next/*` |
| Data | `src/data/**` | Abstractions (`OrderRepository`, `Catalog`) and their implementations; `container.ts` picks the implementations | `@/lib/pricing`; `node:fs` / `node:path` only in `json-order-repository.ts` and `container.ts`. Never `@/services/*` or `@/app/*` |
| Domain (exception) | `src/lib/pricing.ts` | Catalog data, money rounding, totals, discounts (stub). Pure, no I/O | Nothing. Frozen: not changed in this stage |

Tests may import implementations (for example, `createStaticCatalog`).

### Code style
- Match the existing code:
  - function factories, not classes;
  - `type` aliases for object shapes, including the abstractions;
  - `import type` / inline `type` imports for types;
  - the `@/` alias;
  - double quotes;
  - few comments.
- Keep every user-visible error message exactly as it is today.

### Implementation steps

**1. `src/data/orders/types.ts`.** Move `OrderItem` and `Order` from `src/app/api/checkout/route.ts` unchanged, with the comment "Shape of a record stored in data/orders.json.".

**2. `src/data/orders/order-repository.ts`**
```ts
import type { Order } from "@/data/orders/types";

// Persistence for orders. Implementations must store an order atomically
// (all or nothing) and reject when storage fails.
export type OrderRepository = {
  save(order: Order): Promise<void>;
};
```

**3. `src/data/orders/json-order-repository.ts`.** Export `createJsonOrderRepository(file: string): OrderRepository`.
- Move `writeOrder` and the queue logic of `appendOrder` from the route **with the same behavior**:
  - `mkdir(path.dirname(file), { recursive: true })`;
  - read the file; `ENOENT` → `[]`;
  - non-array or unparsable content throws, so existing data is never overwritten;
  - push, write `${file}.tmp` with 2-space JSON, then `rename` over `file`.
- `writeQueue` becomes a variable inside the factory closure (one queue per repository instance). `save` is the former `appendOrder`: `const run = writeQueue.then(() => writeOrder(order)); writeQueue = run.catch(() => {}); return run;`.
- Keep the two existing comments (serialization; missing file vs corrupt data).

**4. `src/data/catalog/catalog.ts`**
```ts
import type { Product } from "@/lib/pricing";

// Read access to the product catalog.
export type Catalog = {
  list(): Promise<Product[]>;
  // Returns only the products that exist, keyed by id.
  getByIds(ids: string[]): Promise<Map<string, Product>>;
};
```

**5. `src/data/catalog/static-catalog.ts`.** Export `createStaticCatalog(): Catalog`.
- `list` returns `[...PRODUCTS]`.
- `getByIds` builds a `Map` with `findProduct` for each id and skips unknown ids.
- Both are `async`.

**6. `src/data/container.ts`**
```ts
import path from "node:path";
import { createStaticCatalog } from "@/data/catalog/static-catalog";
import { createJsonOrderRepository } from "@/data/orders/json-order-repository";

// The one place that picks implementations. A database implementation is switched on here.
export const catalog = createStaticCatalog();
export const orderRepository = createJsonOrderRepository(
  path.join(process.cwd(), "data", "orders.json"),
);
```

**7. `src/services/place-order.ts`**
```ts
export type PlaceOrderDeps = { catalog: Catalog; orders: OrderRepository };
export type PlaceOrderError = { error: string };

// Assumes items passed the route's shape validation (string productId, integer quantity >= 1).
export async function placeOrder(
  items: CartItem[],
  deps: PlaceOrderDeps,
): Promise<Order | PlaceOrderError>
```
Steps, keeping today's `buildOrder` logic 1:1:
1. `const products = await deps.catalog.getByIds([...new Set(items.map((item) => item.productId))])`. The catalog is read once per order.
2. For each item in order, if `products.get(item.productId)` is missing, return `{ error: \`Unknown product: ${item.productId}\` }`. Nothing is saved. This must happen before `calculateTotal`, which throws on unknown products.
3. `items` of the order: `{ productId, name: product.name, quantity, unitPrice: product.price }`.
4. `subtotal = roundToCents(sum of quantity × unitPrice)`, `total = calculateTotal(items)`, `discount = roundToCents(subtotal − total)`.
5. `id = crypto.randomUUID()`, `userId: "guest"` (keep the comment "no auth yet; never trust a client-sent id"), `status: "confirmed"`, `createdAt = new Date().toISOString()`.
6. `await deps.orders.save(order)` (do not catch errors), then `return order`.

`Order` has no `error` key, so callers tell the two results apart with `"error" in result`, the same pattern `parseCart` already uses.

**8. `src/app/api/checkout/route.ts`.** The route becomes thin.
- Remove `buildOrder`, `writeOrder`, `appendOrder`, `writeQueue`, the `Order`/`OrderItem` types, and the `node:fs/promises` / `node:path` / `findProduct` / `calculateTotal` / `roundToCents` imports.
- Imports: `import type { CartItem } from "@/lib/pricing"`, `placeOrder` from `@/services/place-order`, and `catalog` and `orderRepository` from `@/data/container`.
- Keep `CheckoutRequest`, `CheckoutSuccess`, `CheckoutError` and `badRequest` unchanged.
- `parseCart` checks only the shape. Replace the product check with `if (typeof productId !== "string") return { error: \`Unknown product: ${String(productId)}\` };`. The quantity check is unchanged.
- `POST`:
  1. invalid JSON → 400 (unchanged);
  2. `parseCart` error → 400;
  3. `const result = await placeOrder(cart.items, { catalog, orders: orderRepository })`;
  4. `"error" in result` → `badRequest(result.error)`;
  5. otherwise `200 { orderId: result.id, total: result.total }` typed as `CheckoutSuccess`.

  Storage errors stay uncaught (500).
- The route file still exports only the three contract types and `POST`.
- Accepted behavior change: product existence is now checked after the shape of **all** items. Example: `{"items":[{"productId":"nope","quantity":0}]}` returned `Unknown product: nope` before; now it returns `quantity must be an integer of at least 1`. Both are 400. Document it (step 11).

**9. `src/app/api/products/route.ts`**
```ts
import { catalog } from "@/data/container";

// API contract — imported by the checkout page with `import type`.
export type ProductSummary = { id: string; name: string; price: number };
export type ProductsResponse = ProductSummary[];

export async function GET() {
  const products = await catalog.list();
  const response: ProductsResponse = products.map(({ id, name, price }) => ({ id, name, price }));
  return Response.json(response);
}
```
The JSON response must stay exactly the same as today.

**10. `src/app/checkout/page.tsx`.**
- Replace `import type { Product } from "@/lib/pricing";` with `import type { ProductsResponse } from "@/app/api/products/route";`.
- Use `useState<ProductsResponse>([])` and `(await res.json()) as ProductsResponse`.
- No other changes.

**11. Tests and config**
- `vitest.config.ts`: `import { defineConfig } from "vitest/config"; export default defineConfig({ resolve: { tsconfigPaths: true } });`. Vite 8 supports `tsconfigPaths` natively; it is `false` by default, so without it `@/` does not resolve in tests.
  - Fallback if that does not work: `resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } }` with `fileURLToPath` from `node:url`.
  - `next build` type-checks this file too (`tsconfig.json` includes `**/*.ts`).
- `src/services/place-order.test.ts`. Use `createStaticCatalog()` and an in-memory repository defined in the test: `const saved: Order[] = []; const orders: OrderRepository = { save: async (order) => { saved.push(order); } };`. Three tests:
  1. sticker×3 + mug×1 returns an order with:
     - `subtotal` 27.47, `discount` 0, `total` 27.47;
     - `items`: Sticker pack 4.99 ×3 and Coffee mug 12.5 ×1;
     - `userId` "guest", `status` "confirmed";
     - `id` matching a UUID regex;
     - `createdAt` equal to `new Date(createdAt).toISOString()`.

     `saved` must equal `[order]`.
  2. `[{ productId: "nope", quantity: 1 }]` returns `{ error: "Unknown product: nope" }`, and `saved` is empty.
  3. A repository whose `save` rejects with `new Error("disk full")` makes `placeOrder` reject with that error.

**12. Docs** (English):
- `.claude/skills/app-architecture/SKILL.md`:
  - replace the opening paragraph: layers now live in their own directories; `src/lib/pricing.ts` is a frozen exception;
  - put in the "Layers" table above;
  - rules:
    - dependencies point inward (`app` → `services` → `data` abstractions; `container` is the only place that knows implementations);
    - keep rules 2–6 and adapt their wording;
    - rule 7, where new code goes: UI → `src/app/**`, HTTP → route files, business scenarios → `src/services/`, data access → `src/data/` (abstraction + implementation, wired in `container.ts`), `src/lib/` → only with the user's explicit permission;
  - "Request flow (checkout)":
    ```
    page → route (request.json → 400, parseCart → 400)
         → placeOrder (catalog.getByIds → 400 Unknown product, calculateTotal, orders.save)
         → 200 { orderId, total }
    ```
  - rewrite "Future evolution":
    - add `createPostgresOrderRepository` / `createPostgresCatalog` in `src/data/` and switch them in `container.ts`;
    - `save` runs one transaction (order + items);
    - add idempotency (client key + unique constraint);
    - store money as integer cents (or `NUMERIC`) in the DB and keep float dollars on the wire;
    - later, refactor `pricing.ts` so that it receives prices from the catalog instead of reading `PRODUCTS`. This needs the user's permission.
- `README.md` "Request lifecycle":
  - route parses JSON and validates the shape (`parseCart`) → 400;
  - route calls `placeOrder` (`src/services/place-order.ts`) with the catalog and order repository from `src/data/container.ts`;
  - `placeOrder` loads the products (unknown → 400), builds the order snapshot and gets the total from `calculateTotal`;
  - `OrderRepository.save` (JSON implementation) appends to `data/orders.json`;
  - response;
  - confirmation.
- `docs/APIs.md`:
  - `GET /api/products`: response type `ProductsResponse` in `src/app/api/products/route.ts`;
  - `POST /api/checkout`:
    - the stored record is the `Order` type in `src/data/orders/types.ts`;
    - fix the sentence about `discount`: it is `subtotal − total`, where `total` comes from `calculateTotal`;
    - add a short note on validation order: shape of all items first, then product existence.

### Verification (record every result in the new handoff)
1. **Before any code change:** run `npm run build` and save the route table (`/api/products` static or dynamic).
2. `npm run test:ci` → pass. 4 tests in 2 files: 1 in `pricing.test.ts`, 3 in `place-order.test.ts`.
3. `npm run build` → exit 0. The route table must match step 1; if it differs, record the difference.
4. Layer boundaries:
   - `grep -rln "node:fs" src` → only `src/data/orders/json-order-repository.ts`;
   - `grep -n "@/data" src/services/place-order.ts` → every line is an `import type`;
   - `grep -nE "container|json-order-repository|static-catalog|\"node:|\"next" src/services/place-order.ts` → empty;
   - `grep -rnE "@/services|@/app" src/data` → empty;
   - `grep -nE "@/lib|@/data" src/app/checkout/page.tsx` → empty;
   - `grep -rnE "findProduct|node:" src/app/api` → empty;
   - `git diff --stat src/lib` → empty.
5. Start the dev server after `rm -rf data`, then check:
   - `curl -s localhost:3000/api/products` → the same 3 products as in `docs/APIs.md`.
   - POST `{"items":[{"productId":"sticker","quantity":3},{"productId":"mug","quantity":1}]}` → 200, `total` 27.47. `data/orders.json` has 1 order, and its `id` equals the returned `orderId`; `subtotal` 27.47, `discount` 0, `status` "confirmed".
   - Repeat → 2 orders.
   - `{"items":[]}` → 400 `items must be a non-empty array`; file unchanged (`shasum` before/after).
   - `{"items":[{"productId":"nope","quantity":1}]}` → 400 `Unknown product: nope`; file unchanged.
   - `{"items":[{"productId":"nope","quantity":0}]}` → 400 `quantity must be an integer of at least 1` (the new order of checks).
   - Body `not json` → 400 `Request body must be valid JSON`.
   - 10 parallel valid POSTs → 12 orders with 12 distinct ids, valid JSON, no `orders.json.tmp`. Check with `node -e "const o=require('./data/orders.json');console.log(o.length,new Set(o.map(x=>x.id)).size)"`.
   - Write `[` into `data/orders.json`, then POST → 500, and the file still contains `[`.
   - `rm -rf data`, then POST → 200 and a new file with 1 order.
   - `curl -s -o /dev/null -w '%{http_code}' localhost:3000/checkout` → 200.
6. Run the `requirements-check` skill with `full`. Report the result. The new directories and the persistence are expected, approved departures.
7. Stop the dev server, `rm -rf data`. `git status` must list only:
   - the files created or modified by this task;
   - `docs/HANDOFF.md`;
   - `tsconfig.json`, only if `next build` rewrote it (then say so in the handoff).
8. In the new handoff, under "Manual check for the user", include a browser check of `/checkout`:
   - with all quantities at 0, "Place order" is disabled;
   - Sticker pack 3 + Coffee mug 1 → "Order placed", an order ID and `Total: $27.47`;
   - the order is in `data/orders.json`.
