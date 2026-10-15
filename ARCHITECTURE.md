# Architecture

The app is split into layers that live in their own directories: `src/app/` (presentation and transport), `src/services/` (business scenarios) and `src/data/` (abstractions, implementations and one composition point). `src/lib/pricing.ts` is a frozen exception: it keeps the hard-coded catalog and the money rules, and it is not changed until a later refactoring.

## Layers

| Layer | Files | Responsibility | May import |
|---|---|---|---|
| Presentation | `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/checkout/page.tsx` | Render UI, call the API with `fetch` | Only `import type` from route files |
| Transport (API) | `src/app/api/*/route.ts` | Parse HTTP, validate the request shape, call a service or the catalog, map results to status codes and JSON | `@/services/*`, `@/data/container`, `import type` from `@/lib/pricing` |
| Services | `src/services/*` | Business scenarios (`placeOrder`): orchestrate catalog, pricing and persistence. No HTTP, no I/O of their own | `@/lib/pricing`; **only `import type`** from `@/data/**`. Never `@/data/container`, implementations, `node:*` or `next/*` |
| Data | `src/data/**` | Abstractions (`OrderRepository`, `Catalog`) and their implementations; `container.ts` picks the implementations | `@/lib/pricing`; `node:fs` / `node:path` only in `json-order-repository.ts` and `container.ts`. Never `@/services/*` or `@/app/*` |
| Domain (exception) | `src/lib/pricing.ts` | Catalog data, money rounding, totals, discounts (stub). Pure, no I/O | Nothing. Frozen: not changed in this stage |

Tests may import implementations (for example, `createStaticCatalog`).

## Rules

1. **Dependencies point inward:** `app` → `services` → `data` abstractions. `container.ts` is the only place that knows the implementations. `data/` and `lib/` never import from `app/` or `services/`, and nothing below `app/` imports `next/*`.
2. **The server is the source of truth for money.**
   - The client sends only `productId` and `quantity`.
   - The total is computed only by `calculateTotal` in `pricing.ts`, called from `placeOrder`.
   - The client never computes or sends prices or totals.
3. **Validate at the boundary.** The route handler turns `unknown` JSON into a typed `CartItem[]` (shape only). `placeOrder` checks that the products exist and assumes the rest is valid.
4. **The API contract lives in the route file** as `export type` (request and response shapes). The client imports it with `import type`. A route file must not export runtime values other than HTTP method handlers (`GET`, `POST`, …); Next.js rejects them.
5. **Errors:**
   - expected input errors → `400 { error: string }`; services return `{ error }` for them instead of throwing;
   - unexpected errors (for example, storage failures) are not caught, and Next.js returns 500.
6. **Server components by default.** Only `src/app/checkout/page.tsx` is `"use client"`, because it has state and events.
7. **Where new code goes:**
   - UI → `src/app/**`;
   - HTTP concerns → route files;
   - business scenarios → `src/services/`;
   - data access → `src/data/` (an abstraction plus its implementation, wired in `container.ts`);
   - `src/lib/` → only with the user's explicit permission.

## Request flow (checkout)

```
page → route (request.json → 400, parseCart → 400)
     → placeOrder (catalog.getByIds → 400 Unknown product, calculateTotal, orders.save)
     → 200 { orderId, total }
```

## Future evolution

- Add `createPostgresOrderRepository` / `createPostgresCatalog` in `src/data/` and switch them on in `container.ts`. Nothing else changes.
- `save` runs one transaction (order + items).
- Add idempotency (client key + unique constraint).
- Store money as integer cents (or `NUMERIC`) in the DB and keep float dollars on the wire.
- Later, refactor `pricing.ts` so that it receives prices from the catalog instead of reading `PRODUCTS`. This needs the user's permission.
