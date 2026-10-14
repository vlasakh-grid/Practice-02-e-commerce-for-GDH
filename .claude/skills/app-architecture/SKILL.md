---
name: app-architecture
description: Architecture and layering rules of this Next.js app (presentation / transport / domain, dependency rule, API contract types, error mapping, future DB seam). Use before writing or changing any code under src/, and when deciding where new code belongs.
---

# App architecture

The app uses layers defined by **dependency rules inside the allowed files**, not by extra folders. The requirements forbid files beyond the listed ones, so there are no separate service, repository or DTO modules.

## Layers

| Layer | Files | Responsibility | May import |
|---|---|---|---|
| Presentation | `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/checkout/page.tsx` | Render UI, call the API with `fetch`, show server results. No business logic, no price math | Only `import type` from `@/lib/pricing` and route files |
| Transport (API) | `src/app/api/*/route.ts` | Parse HTTP, validate input at the boundary, call the domain, map results to status codes and JSON | `@/lib/pricing` |
| Domain | `src/lib/pricing.ts` | Catalog, money rounding, totals, discounts (stub). Pure functions | Nothing from the project; no `next/*`, no I/O |

## Rules

1. **Dependencies point inward:** `app/` → `lib/`. `lib/` never imports from `app/` or from `next`.
2. **The server is the source of truth for money.**
   - The client sends only `productId` and `quantity`.
   - The total is computed only by `calculateTotal` in `pricing.ts`.
   - The client never computes or sends prices or totals.
3. **Validate at the boundary.** The route handler turns `unknown` JSON into a typed `CartItem[]` before calling the domain. The domain assumes valid input.
4. **The API contract lives in the route file** as `export type` (request and response shapes). The client imports it with `import type`. A route file must not export runtime values other than HTTP method handlers (`GET`, `POST`, …); Next.js rejects them.
5. **Errors:**
   - expected input errors → `400 { error: string }`;
   - unexpected errors are not caught, and Next.js returns 500.
6. **Server components by default.** Only `src/app/checkout/page.tsx` is `"use client"`, because it has state and events.
7. **Where new code goes:**
   - UI goes in `src/app/**`;
   - HTTP concerns go in route files;
   - money and catalog rules go in `src/lib/pricing.ts`, which is a sensitive module and needs the user's explicit permission;
   - nothing new goes into `src/lib/` without a requirement change.

## Request flow (checkout)

```
checkout/page.tsx --POST {items}--> api/checkout/route.ts
                                      ├─ request.json()      → 400 on bad JSON
                                      ├─ parseCart()         → 400 on invalid cart
                                      ├─ calculateTotal()    (src/lib/pricing.ts)
                                      ├─ (future) order repository save
                                      └─ 200 { orderId, total } --> page renders confirmation
```

## Future evolution (out of scope until the requirements allow a DB)

When persistence is allowed, add `src/lib/orders/` with:
- an `OrderRepository` interface and its DB implementation;
- a `placeOrder` service that validates, prices (via `pricing.ts`) and saves.

The route handler then calls `placeOrder` and stays thin. `pricing.ts` does not change. Do not build any of this now.
