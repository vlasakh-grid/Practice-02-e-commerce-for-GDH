# Handoff

Last stage: 5 — Services and data layers   (Status: Done)
Next stage: None — project complete

## What was implemented
- Checkout scenario moved into `src/services/place-order.ts` (`placeOrder`).
- Data layer in `src/data/`:
  - abstractions `OrderRepository` and `Catalog`;
  - implementations `createJsonOrderRepository` (file persistence, moved 1:1, queue now per instance) and `createStaticCatalog` (over `PRODUCTS` / `findProduct`);
  - `container.ts` as the one place that picks the implementations.
- `POST /api/checkout` and `GET /api/products` are thin routes. `ProductsResponse` / `ProductSummary` are the new contract types in the products route, and the checkout page imports `ProductsResponse`.
- `vitest.config.ts` (`resolve.tsconfigPaths: true`) so Vitest resolves `@/`.
- Docs updated: `app-architecture` skill (layers table, rules, flow, future evolution), README "Request lifecycle", `docs/APIs.md`.

## Files
Created: `src/services/place-order.ts`, `src/services/place-order.test.ts`, `src/data/container.ts`, `src/data/orders/{types,order-repository,json-order-repository}.ts`, `src/data/catalog/{catalog,static-catalog}.ts`, `vitest.config.ts`
Modified: `src/app/api/checkout/route.ts`, `src/app/api/products/route.ts`, `src/app/checkout/page.tsx`, `.claude/skills/app-architecture/SKILL.md`, `README.md`, `docs/APIs.md`, `.gitignore`, `docs/HANDOFF.md`
Not modified: `src/lib/**`, `package.json`, `docs/PLAN.md`, `docs/REQUIREMENTS.md`, `tsconfig.json` (`next build` did not rewrite it).

## Verification results
| Check | Command / action | Result |
|---|---|---|
| Baseline build (before changes) | `npm run build` | pass; `/` static, `/_not-found` static, `/api/checkout` dynamic, `/api/products` dynamic, `/checkout` static |
| Tests | `npm run test:ci` | pass, 4 tests in 2 files (1 pricing, 3 place-order) |
| Build | `npm run build` | exit 0; route table identical to baseline |
| `grep -rln "node:fs" src` | | only `src/data/orders/json-order-repository.ts` |
| `@/data` in `place-order.ts` | grep | 3 lines, all `import type` |
| forbidden imports in `place-order.ts` | grep | empty |
| `@/services` / `@/app` in `src/data` | grep | empty |
| `@/lib` / `@/data` in checkout page | grep | empty |
| `findProduct` / `node:` in `src/app/api` | grep | empty |
| `git diff --stat src/lib` | | empty |
| `GET /api/products` | curl after `rm -rf data` | same 3 products as in `docs/APIs.md` |
| Valid POST (sticker×3 + mug×1) | curl | 200, total 27.47; 1 order in file, id equals `orderId`; subtotal 27.47, discount 0, status confirmed |
| Repeat POST | curl | 2 orders |
| `{"items":[]}` | curl | 400 `items must be a non-empty array`; file hash unchanged |
| Unknown product, quantity 1 | curl | 400 `Unknown product: nope`; file unchanged |
| Unknown product, quantity 0 | curl | 400 `quantity must be an integer of at least 1` (new check order) |
| Body `not json` | curl | 400 `Request body must be valid JSON` |
| 10 parallel POSTs | curl | 12 orders, 12 distinct ids, no `orders.json.tmp` |
| Corrupt file (`[`) | POST | 500; file still `[` |
| Missing file | `rm -rf data`, POST | 200; new file with 1 order |
| `/checkout` | curl | 200 |
| requirements-check full | skill | R1–R5 all ✅; test:ci exit 0; build exit 0 |
| Cleanup | dev server stopped (port 3000 free), `rm -rf data` | done |

## Deviations from the plan
- `.gitignore`: `data/` changed to `/data/`. The old pattern also ignored `src/data/`, so the new data layer would never have been committed. Runtime `data/orders.json` is still ignored. This file was not in the handoff's list; the change is required for the task.
- Accepted behavior change (as specified): product existence is checked after the shape of all items. `{"items":[{"productId":"nope","quantity":0}]}` now returns the `quantity` error. Documented in `docs/APIs.md`.

## Open issues
- No agent has verified the client side of `/checkout` in a browser (see manual check below).
- Orders are stored relative to `process.cwd()`, and writes are serialized only inside one process (one queue per repository instance). Fine for `npm run dev`, not for multi-instance deployments; a database implementation replaces it later.
- Vitest prints a warning: `vitest.config.ts` uses ESM syntax in a CJS-loaded file (`configLoader: 'native'`). Tests pass. Fixing it needs `"type": "module"` in `package.json` or a `.mts` name, both outside this task.
- `pricing.ts` still reads `PRODUCTS` itself, bypassing `Catalog`. Refactoring it needs the user's permission.

## Context for the next stage
- Always run `nvm use` first (Node.js 22, `.nvmrc`). Under Node 20.11, `npm run test:ci` fails with a vitest/rolldown startup error.
- Installed: next 16.4.0 (Turbopack), react / react-dom 19.3.0, typescript 7.0.2, vitest 5.0.4 (vite 8.3.4). Dev server port 3000. Path alias `@/*` → `./src/*`.
- `next dev` writes `AGENTS.md` in the repo root; it is not part of this task.
- `data/orders.json` is generated at runtime and gitignored (`/data/`).
- Layer rules are in the `app-architecture` skill. To add a database: implement `OrderRepository` / `Catalog` in `src/data/` and switch them in `src/data/container.ts`.

## Manual check for the user
1. `nvm use && npm run dev`, open http://localhost:3000/checkout.
2. With all quantities at 0, "Place order" is disabled.
3. Set Sticker pack = 3 and Coffee mug = 1, click "Place order": the "Order placed" card shows an order ID and `Total: $27.47`.
4. `data/orders.json` contains that order (same id).
5. Stop the dev server; run `git status`, then review and commit.
