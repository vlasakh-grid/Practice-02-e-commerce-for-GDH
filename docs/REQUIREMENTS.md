# Requirements

Everyone builds the same thing, from the same spec, so answers are consistent and reviewable. These requirements are the single source of truth for the tasks below — Task 0 turns them into a plan, Task 2 turns them into a validation skill.

| Piece | Value |
|---|---|
| Primary write endpoint | **`POST /api/checkout`** — validates a cart payload, returns a stubbed success + order total (in-memory only, no DB yet) |
| Read endpoint | **`GET /api/products`** — serves a small hard-coded product list |
| Core computation module | **`src/lib/pricing.ts`** (discount stacking, stub for now) |
| Sensitive module (never edit directly) | payments / pricing |
| Money representation | floating-point dollars with a decimal point, e.g. **`4.99`** |

**Stack:** Next.js (App Router) + TypeScript strict, using a src/ directory · no database dependency, ever · npm package.json scripts exactly dev / build / test:ci.

**Files to create:** a home page with a short heading and a link to checkout; a checkout page that posts a cart to /api/checkout; the two API routes above; the pricing module; a README.md describing the request lifecycle from checkout click to (future) DB write; one placeholder unit test wired to test:ci. Nothing else — no data files, no persistence layer yet.

**Design:** plain inline styles or a single global CSS file only — no Tailwind, no UI/component library, no CSS-in-JS package. System-ui font, one accent color, simple rounded cards/buttons. Every page shares the same look — max-width centered container, consistent spacing.

**Constraints:** must run with npm install && npm run dev; no auth providers, no external services, no Docker; keep it small.
