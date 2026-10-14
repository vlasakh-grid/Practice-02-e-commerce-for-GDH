# Handoff

Last stage: 2 — Product catalog API and product selection   (Status: Done with open issues)
Next stage: 3 — Checkout API, order submission, request-lifecycle docs

## What was implemented
- `GET /api/products` returns the hard-coded `PRODUCTS` array as JSON.
- `/checkout` is now a client component: loads `/api/products`, shows one card per product (name, `$x.xx` price, quantity input). Quantities are sanitized to non-negative integers. Loading and load-error states are handled. No ordering yet.
- `README.md` has an "API" section for `GET /api/products`.

## Files
Created: `src/app/api/products/route.ts`
Modified: `src/app/checkout/page.tsx` (replaced), `README.md`, `docs/PLAN.md` (checkboxes and status only), `docs/HANDOFF.md`
`src/lib/pricing.ts` untouched.

## Verification results
| Check | Command / action | Result |
|---|---|---|
| Build | `npm run build` | pass (exit 0; routes `/`, `/_not-found`, `/api/products` dynamic, `/checkout`) |
| Tests | `npm run test:ci` | pass (1 test, vitest 5.0.4) |
| Products API | `curl -s localhost:3000/api/products` | JSON array of 3 products |
| Checkout page | `curl -s -o /dev/null -w '%{http_code}' localhost:3000/checkout` | 200 (server HTML contains "Loading products…") |
| Pricing untouched | `git diff --stat src/lib/pricing.ts` | empty |
| requirements-check (static) | skill | 0 ❌; R2, R3, R4, R5 ✅; R1 ⏳ (stage 3) |
| Dev server | port 3000 | stopped, nothing listening |
| Client rendering in a real browser | Claude in Chrome | not run: extension not connected. Covered by "Manual check" below |

## Deviations from the plan
- None.

## Open issues
- Client-side rendering of `/checkout` (3 product cards after fetch, quantity sanitizing) was not verified in a browser by the agent; only server HTML and the API were checked with curl. Please do the manual check below.
- `next dev` writes `AGENTS.md` in the repo root on every start. It is not in the plan's file list; `next.config.ts` is given verbatim by the plan, so `agentRules: false` was not set. Keep or delete it as you prefer.

## Context for the next stage
- Installed: next 16.4.0 (Turbopack), react / react-dom 19.3.0, typescript 7.0.2, vitest 5.0.4. Node.js 22 (`.nvmrc`; run `nvm use`). Dev server runs on port 3000. `npm audit`: 0 vulnerabilities.
- `next build` rewrote `tsconfig.json` in stage 1 (`jsx: react-jsx`, `allowJs: true`, `.next/dev/types/**/*.ts` in `include`); accepted per rule 8.
- This Next.js version may differ from older conventions; docs are in `node_modules/next/dist/docs/`.
- Stage 3 extends the current `src/app/checkout/page.tsx` (state names: `products`, `quantities`, `loading`, `loadError`; helper `setQuantity`) and keeps all stage 2 behavior.
- Stage 3 requires stage 2 files to be committed first (`git status` check in `stage-handoff`).

## Manual check for the user
1. Run `nvm use && npm install && npm run dev` and open http://localhost:3000/checkout.
2. You should see 3 products (T-shirt $19.99, Coffee mug $12.50, Sticker pack $4.99), each with a quantity input at 0.
3. Type a negative number or a fraction (e.g. `-3`, `2.7`); the value is corrected to `0` / `2`.
4. Open http://localhost:3000/api/products and see the JSON array.
5. Run `npm run build` and `npm run test:ci`; both should pass.
