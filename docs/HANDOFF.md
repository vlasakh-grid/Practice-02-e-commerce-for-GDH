# Handoff

Last stage: 4 — Persist orders to data/orders.json   (Status: Done with open issues)
Next stage: None — project complete

## What was implemented
- `POST /api/checkout` now appends every successful order to `data/orders.json` (`node:fs/promises`, `node:path` only; no new dependencies) and returns `200 { orderId, total }` where `orderId` is the stored order's id. `CheckoutSuccess` is unchanged, so the checkout page needed no change.
- Order record: `{ id, userId: "guest", items: [{ productId, name, quantity, unitPrice }], subtotal, discount, total, status: "confirmed", createdAt }`. `total` still comes from `calculateTotal`; `subtotal` is the rounded sum of `quantity × unitPrice`; `discount = roundToCents(subtotal − total)` (0 today, `applyDiscounts` is a stub).
- Writes: `mkdir -p data`, read the file (`ENOENT` → `[]`; non-array or unparsable content throws, so existing data is never overwritten), push, write `orders.json.tmp`, `rename` over `orders.json`. Calls are serialized by a module-level promise chain that stays alive after a failed write.
- Errors from fs are not caught: Next.js returns 500 (architecture rule 5). 400 paths write nothing.
- `Order` and `OrderItem` types are exported from the route file; helpers (`buildOrder`, `writeOrder`, `appendOrder`) are module-private.

## Files
Created: None (`data/orders.json` is generated at runtime and gitignored)
Modified: `src/app/api/checkout/route.ts`, `.gitignore` (`data/`), `docs/APIs.md` (persistence note and `Order` shape), `README.md` (lifecycle step 5), `.claude/skills/app-architecture/SKILL.md` (request flow), `docs/HANDOFF.md`
Untouched: `src/lib/pricing.ts`, `src/app/checkout/page.tsx`, `package.json`, `docs/PLAN.md`, `docs/REQUIREMENTS.md`, `tsconfig.json`.

## Verification results
| Check | Command / action | Result |
|---|---|---|
| Valid cart, fresh start | `rm -rf data`, dev server, POST sticker×3 + mug×1 | 200, `total` 27.47; `data/orders.json` created with 1 order: `id` = returned `orderId`, `userId` guest, items Sticker pack 4.99 ×3 and Coffee mug 12.5 ×1, `subtotal` 27.47, `discount` 0, `total` 27.47, `status` confirmed, ISO `createdAt` |
| Append | Repeat the request | 2 orders (appended, not overwritten) |
| Invalid cart | POST `{"items":[]}` | 400 `items must be a non-empty array`; file checksum unchanged |
| Concurrency | 10 parallel valid POSTs | 12 orders, 12 distinct ids, valid JSON, no leftover `.tmp` file |
| Corrupt file | Write `[` into `data/orders.json`, POST | 500; file still contains `[` (not overwritten) |
| Recovery | `rm -rf data`, POST | 200, new file with 1 order; `data/` removed afterwards |
| Build | `npm run build` | pass (exit 0; routes unchanged) |
| Tests | `npm run test:ci` | pass (1 test, Node 22.23.3) |
| Pricing untouched | `git diff --stat src/lib/pricing.ts` | empty |
| requirements-check (full) | skill | 0 ❌, 0 ⚠️, 0 ⏳. R1–R5 ✅ (`POST` and `GET` exported, scripts exactly dev/build/test:ci, only allowlisted deps, pricing.ts non-empty); test:ci and build exit 0. The skill does not check "no data files" / "in-memory only" (REQUIREMENTS lines 7 and 15), which the approved persistence change intentionally departs from |
| tsconfig | `git status` after build | unchanged |
| Dev server | port 3000 | stopped, nothing listening |
| Client rendering in a real browser | Claude in Chrome | not run (no browser check this stage; UI unchanged) |

## Deviations from the plan
- None. `docs/PLAN.md` has no stage 4; it was intentionally not edited, per the user-approved instructions. The persistence departs from REQUIREMENTS lines 7 and 15 ("in-memory only", "no data files") by the user's approval.

## Open issues
- The client side of `/checkout` (quantity inputs, button state, "Order placed" card, error display) has still not been verified in a browser by an agent. Please do the manual check below.
- The default shell has Node 20.11, where `npm run test:ci` fails with a vitest/rolldown startup error (`styleText` missing from `node:util`). Under Node 22 (`nvm use`, per `.nvmrc`) everything passes. Always run `nvm use` first.
- Orders are stored relative to `process.cwd()`, so the file lands in the directory the server is started from; this is fine for `npm run dev` from the repo root but would not suit a read-only or multi-instance deployment.

## Context for the next stage
- Project complete; stages 1–4 done. Nothing is committed for stage 4: the user commits after the manual check.
- Installed: next 16.4.0 (Turbopack), react / react-dom 19.3.0, typescript 7.0.2, vitest 5.0.4. Node.js 22 (`.nvmrc`). Dev server port 3000.
- `next build` rewrote `tsconfig.json` in stage 1 (accepted per rule 8); no change since.
- `next dev` writes `AGENTS.md` in the repo root (not in the plan's file list). Keep or delete it.
- If a real DB is ever allowed, `appendOrder` is the seam to replace (see "Future evolution" in the `app-architecture` skill).

## Manual check for the user
1. Run `nvm use && npm install && rm -rf data && npm run dev` and open http://localhost:3000/checkout.
2. With all quantities at 0, "Place order" is disabled.
3. Set Sticker pack = 3 and Coffee mug = 1, click "Place order". You should see "Order placed", an order ID and `Total: $27.47`.
4. Open `data/orders.json`: it should contain one order whose `id` equals the shown order ID (`userId` "guest", `status` "confirmed", `subtotal` and `total` 27.47). Place another order: the file now has 2 orders.
5. Run `curl -s -w '\n%{http_code}\n' -X POST http://localhost:3000/api/checkout -H 'Content-Type: application/json' -d '{"items":[]}'` → `400` `{"error":"items must be a non-empty array"}`, and the file is unchanged.
6. Run `npm run build` and `npm run test:ci`; both should pass. `git status` should not list `data/`.
