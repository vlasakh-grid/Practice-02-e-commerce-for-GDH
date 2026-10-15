# Handoff

Last stage: 3 — Checkout API, order submission, request-lifecycle docs   (Status: Done with open issues)
Next stage: 4 — Persist orders to data/orders.json (extra task, not in PLAN.md; see "Instructions for the next agent" at the end)

## What was implemented
- `POST /api/checkout` validates the cart (`parseCart`), prices it with `calculateTotal`, and returns `200 { orderId, total }` or `400 { error }`. Nothing is stored. API contract types (`CheckoutRequest`, `CheckoutSuccess`, `CheckoutError`) are exported from the route file.
- `/checkout` keeps all stage 2 behavior and adds a "Place order" button (disabled while submitting or when no quantity > 0), an "Order placed" card (order ID, total) and error display (`error` from the API, `"Checkout failed."`, `"Network error."`).
- API documentation (`GET /api/products`, `POST /api/checkout` with request, 200, 400 and all error messages) lives in `docs/APIs.md`, moved out of the README at the user's request. `README.md` only links to it and has a numbered "Request lifecycle" section.

## Files
Created: `src/app/api/checkout/route.ts`, `docs/APIs.md` (not in the plan's file list; added at the user's request)
Modified: `src/app/checkout/page.tsx`, `README.md`, `docs/PLAN.md` (checkboxes and status only), `docs/HANDOFF.md`
`src/lib/pricing.ts` untouched. `tsconfig.json` unchanged by this stage's build.

## Verification results
| Check | Command / action | Result |
|---|---|---|
| Valid cart | POST sticker×3 + mug×1 | 200, `total` 27.47, UUID `orderId` |
| Empty items | POST `{"items":[]}` | 400 `items must be a non-empty array` |
| Unknown product | POST productId `nope` | 400 `Unknown product: nope` |
| Quantity 0 | POST mug×0 | 400 `quantity must be an integer of at least 1` |
| Quantity 1.5 | POST mug×1.5 | 400 `quantity must be an integer of at least 1` |
| Invalid JSON | POST `not json` | 400 `Request body must be valid JSON` |
| Build | `npm run build` | pass (exit 0; routes `/`, `/_not-found`, `/api/checkout`, `/api/products`, `/checkout`) |
| Tests | `npm run test:ci` | pass (1 test, vitest 5.0.4) |
| Checkout page | `curl -s -o /dev/null -w '%{http_code}' localhost:3000/checkout` | 200 |
| Pricing untouched | `git diff --stat src/lib/pricing.ts` | empty |
| requirements-check (full) | skill | 0 ❌, 0 ⏳; R1–R5 ✅; build and test:ci exit 0 |
| Dev server | port 3000 | stopped, nothing listening |
| Client rendering in a real browser | Claude in Chrome | not run: extension not connected. Covered by "Manual check" below |

## Deviations from the plan
- None.

## Open issues
- The client side of `/checkout` (quantity inputs, button enabled/disabled state, "Order placed" card, error display) was not verified in a browser by the agent: the Chrome extension was not connected, as in stage 2. Only the API (curl), build and tests were checked. Please do the manual check below.
- The default shell here has Node 20.11, and `npm run test:ci` fails there with a vitest/rolldown startup error (`styleText` missing from `node:util`). Under Node 22 (`nvm use`, per `.nvmrc`) everything passes. Always run `nvm use` first.

## Context for the next stage
- Stages 1–3 of `docs/PLAN.md` are complete and committed. The next task is the extra stage 4 described at the end of this file.
- Installed: next 16.4.0 (Turbopack), react / react-dom 19.3.0, typescript 7.0.2, vitest 5.0.4. Node.js 22 (`.nvmrc`). Dev server port 3000. `npm audit`: 0 vulnerabilities (as of stage 2).
- `next build` rewrote `tsconfig.json` in stage 1 (`jsx: react-jsx`, `allowJs: true`, `.next/dev/types/**/*.ts` in `include`); accepted per rule 8.
- `next dev` writes `AGENTS.md` in the repo root; it is not in the plan's file list. Keep or delete it as you prefer.
- Stage 3 changes are not committed; the user commits after the manual check.

## Manual check for the user
1. Run `nvm use && npm install && npm run dev` and open http://localhost:3000/checkout.
2. With all quantities at 0, "Place order" is disabled.
3. Set Sticker pack = 3 and Coffee mug = 1, click "Place order". You should see "Order placed", an order ID and `Total: $27.47`.
4. Run a failing request and see the error JSON:
   `curl -s -w '\n%{http_code}\n' -X POST http://localhost:3000/api/checkout -H 'Content-Type: application/json' -d '{"items":[]}'` → `400` `{"error":"items must be a non-empty array"}`.
5. Run `npm run build` and `npm run test:ci`; both should pass.

## Instructions for the next agent (Sonnet): order persistence

This is an extra task approved by the user. It is **not** in `docs/PLAN.md`.

### How to start and finish (differs from the normal stage-handoff flow)
- Read `docs/REQUIREMENTS.md`, `docs/PLAN.md` section 1 (Global rules) and load the `app-architecture` skill before writing code.
- Skip stage-handoff step A.3 (PLAN/HANDOFF consistency): PLAN.md has no stage 4. **Do not edit `docs/PLAN.md`** (no checkboxes exist for this task). Do not edit `docs/REQUIREMENTS.md`.
- Run `git status` first; the tree should be clean (stages 1–3 committed). If not, stop and ask the user.
- Run `nvm use` first (Node 22). Node 20 breaks `npm run test:ci`.
- When done: overwrite this file with the stage-handoff template (Last stage: `4 — Persist orders to data/orders.json`, Next stage: `None — project complete`), carry forward still-relevant facts, stop the dev server. **Do not commit or push.**

### Goal
`POST /api/checkout` must append every successful order to `data/orders.json` using Node's `fs`, creating the directory, file and array if they do not exist, and return the new order's id. The file holds an array of `Order` records. The shapes are fixed:

```json
{ "id": "...", "userId": "...", "items": [ /* Item[] */ ], "subtotal": 0, "discount": 0, "total": 0, "status": "...", "createdAt": "ISO-8601" }
```
```json
{ "productId": "...", "name": "...", "quantity": 0, "unitPrice": 0 }
```

- `id`: unique order id. `userId`: who placed the order. `items`: cart lines.
- `subtotal` = sum of `quantity × unitPrice`. `discount` = order-level discount from `pricing.ts`. `total` = `subtotal − discount`.
- `status`: order state, use `"confirmed"`. `createdAt`: ISO-8601 timestamp.
- `name`: product name at time of order. `unitPrice`: price per unit, floating-point dollars (money rule).

### Approved exceptions to existing rules
- REQUIREMENTS/PLAN say "nothing is stored"; the user approved file persistence. No new npm dependencies (only `node:fs/promises`, `node:path`), so "no database dependency" still holds.
- New runtime file `data/orders.json` is allowed (generated, gitignored).
- **`src/lib/pricing.ts` must not change** (sensitive module). If you think it must, stop and hand off as Blocked.

### Implementation (all code in `src/app/api/checkout/route.ts`)
Keep code in the route file (transport layer); `src/lib/` must stay pure with no I/O. Route files may export only HTTP handlers and `export type`; helpers stay module-private (not exported).

1. Add `export type OrderItem = { productId: string; name: string; quantity: number; unitPrice: number }` and `export type Order = { id: string; userId: string; items: OrderItem[]; subtotal: number; discount: number; total: number; status: string; createdAt: string }`. Keep `CheckoutSuccess = { orderId, total }` unchanged; the checkout page already uses it, so no UI change.
2. After `parseCart` succeeds, build the order (import `roundToCents` and `findProduct` from `@/lib/pricing`):
   - `items`: map each `CartItem` via `findProduct()` → `name = product.name`, `unitPrice = product.price`.
   - `subtotal = roundToCents(sum of quantity × unitPrice)`.
   - `total = calculateTotal(result.items)` (still the single source of truth for the total).
   - `discount = roundToCents(subtotal − total)` (0 today because `applyDiscounts` is a stub).
   - `id = crypto.randomUUID()`, `userId = "guest"` (no auth; never trust a client-sent id), `status = "confirmed"`, `createdAt = new Date().toISOString()`.
3. Add a private `appendOrder(order)`:
   - path `path.join(process.cwd(), "data", "orders.json")`; `mkdir(dir, { recursive: true })`;
   - read the file; on `ENOENT` start from `[]`; if the parsed content is not an array, throw (never overwrite existing data);
   - push the order, write JSON (2-space indent) to `orders.json.tmp`, then `rename` over `orders.json` (atomic replace);
   - serialize calls with a module-level promise chain (`let writeQueue: Promise<unknown> = Promise.resolve()`), and keep the chain alive after a failed write, so concurrent checkouts cannot lose orders.
4. In `POST`: 400 paths unchanged (nothing written). On success: build order → `await appendOrder(order)` → `Response.json({ orderId: order.id, total: order.total })`. Do not catch fs errors (Next.js returns 500, architecture rule 5). Replace the `// Future: persist the order here` comment.
5. Other files:
   - `.gitignore`: add `data/`.
   - `docs/APIs.md`: under `POST /api/checkout` say that a successful order is appended to `data/orders.json` and show the `Order` shape. `README.md` "Request lifecycle": add the persistence step.
   - `.claude/skills/app-architecture/SKILL.md`: in "Request flow", replace `(future) order repository save` with `appendOrder() → data/orders.json`.
   - Do not touch `src/lib/pricing.ts`, `src/app/checkout/page.tsx`, `package.json`.

### Verification (record every result in the new handoff)
1. `rm -rf data && npm run dev`.
2. `curl -s -X POST localhost:3000/api/checkout -H 'Content-Type: application/json' -d '{"items":[{"productId":"sticker","quantity":3},{"productId":"mug","quantity":1}]}'` → 200, `total` 27.47. `data/orders.json` exists with one order: `id` = returned `orderId`, `userId` "guest", 2 items with names and unitPrices (4.99, 12.5), `subtotal` 27.47, `discount` 0, `total` 27.47, `status` "confirmed", ISO `createdAt`.
3. Repeat the request → file has 2 orders (appended, not overwritten).
4. `{"items":[]}` → 400 `items must be a non-empty array`, file unchanged.
5. 10 parallel valid requests (`for i in $(seq 10); do curl ... & done; wait`) → 12 orders total, file is valid JSON (`node -e "console.log(require('./data/orders.json').length)"`).
6. Write `[` into `data/orders.json` (corrupt) → POST returns 500 and the file is not overwritten; then restore it with `rm -rf data`.
7. `npm run build` and `npm run test:ci` pass. `git diff --stat src/lib/pricing.ts` is empty. Run the `requirements-check` skill and report results; it may flag the persistence change as differing from REQUIREMENTS line 7, which is expected and approved.
8. Stop the dev server.
