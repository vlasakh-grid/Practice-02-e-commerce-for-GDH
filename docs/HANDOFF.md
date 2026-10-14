# Handoff

Last stage: 3 — Checkout API, order submission, request-lifecycle docs   (Status: Done with open issues)
Next stage: None — project complete

## What was implemented
- `POST /api/checkout` validates the cart (`parseCart`), prices it with `calculateTotal`, and returns `200 { orderId, total }` or `400 { error }`. Nothing is stored. API contract types (`CheckoutRequest`, `CheckoutSuccess`, `CheckoutError`) are exported from the route file.
- `/checkout` keeps all stage 2 behavior and adds a "Place order" button (disabled while submitting or when no quantity > 0), an "Order placed" card (order ID, total) and error display (`error` from the API, `"Checkout failed."`, `"Network error."`).
- `README.md` documents `POST /api/checkout` (request, 200, 400 with all error messages) and has a numbered "Request lifecycle" section.

## Files
Created: `src/app/api/checkout/route.ts`
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
- Project is complete; there is no next stage.
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
