# Implementation plan

This plan implements [REQUIREMENTS.md](REQUIREMENTS.md) in three stages. After every stage the app is fully runnable and can be tested by hand; each stage only adds functionality.

## 0. How to use this plan (read first, every agent)

Progress is tracked by the checkboxes and stage statuses in this file plus a single `docs/HANDOFF.md`. How to read and write them is defined in the **`stage-handoff` skill** (`.claude/skills/stage-handoff/SKILL.md`). Use it at both ends of every stage. The app's architecture and layering rules are defined in the **`app-architecture` skill** (`.claude/skills/app-architecture/SKILL.md`).

Workflow:

1. Read `docs/REQUIREMENTS.md`, then this file (sections 0–2).
2. **Start:** use the `stage-handoff` skill (part A, Receiving) to find your stage and load the handoff context.
3. Before writing code, load the `app-architecture` skill and follow it.
4. Implement **only that stage**, task by task, in order. As you finish each task, change its `- [ ]` to `- [x]`.
5. Run every acceptance check of the stage.
6. **Finish:** use the `stage-handoff` skill (part B, Handing off). It covers both Done and Blocked. Then stop; do not start the next stage.

In `docs/PLAN.md` you may change only checkboxes and status lines. Never edit task text.

## 1. Global rules (apply to every stage)

1. Stack: Next.js App Router, TypeScript `strict`, `src/` directory, npm.
2. `package.json` `scripts` has **exactly** three keys: `dev`, `build`, `test:ci`. Never add `start`, `lint` or anything else.
3. Allowed dependencies only:
   - `next`, `react`, `react-dom`;
   - dev: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `vitest`.
   - Never add others: no DB/ORM, Tailwind, UI kits, CSS-in-JS, zod, auth, or external services. No Docker.
4. Styling: only `src/app/globals.css` plus `className`. Inline `style` is allowed for one-off tweaks. One accent color, `#2563eb`.
5. **`src/lib/pricing.ts` is a sensitive module.** It is created in stage 1 and must not be modified in later stages. If you think it needs a change, do not change it: hand off as Blocked using the `stage-handoff` skill and explain why under "Open issues".
6. Money: a JS `number` in dollars (e.g. `4.99`).
   - Any computed amount goes through `roundToCents`.
   - In the UI, display as `` `$${value.toFixed(2)}` ``.
7. Create only the files your stage lists, plus updates to `docs/HANDOFF.md` and the checkboxes in `docs/PLAN.md`. Generated files (`package-lock.json`, `next-env.d.ts`, `.next/`) are expected.
8. If `next build` rewrites `tsconfig.json` (adds or changes fields), accept the change and mention it in the handoff.
9. If a check fails, fix it inside the files of your stage. If you cannot, hand off as Blocked using the `stage-handoff` skill.
10. Do **not** run `git commit` or `git push`. The user commits after manual verification. `git mv` is allowed only where this plan says so.
11. Always stop the dev server you started before finishing the stage.

## 2. Final target (after stage 3)

```
.claude/skills/app-architecture/SKILL.md
.claude/skills/requirements-check/SKILL.md
.claude/skills/stage-handoff/SKILL.md
.gitignore
CLAUDE.md
README.md
next.config.ts
package.json
tsconfig.json
docs/REQUIREMENTS.md
docs/PLAN.md
docs/HANDOFF.md
src/app/globals.css
src/app/layout.tsx
src/app/page.tsx
src/app/checkout/page.tsx
src/app/api/products/route.ts
src/app/api/checkout/route.ts
src/lib/pricing.ts
src/lib/pricing.test.ts
```

Clarified decisions (binding, agreed with the user):

| Topic | Decision |
|---|---|
| Catalog | Hard-coded `PRODUCTS` in `src/lib/pricing.ts`; no data files |
| Discounts | `applyDiscounts` is a stub that returns the subtotal unchanged |
| Checkout request | `{ "items": [{ "productId": string, "quantity": integer >= 1 }] }`; the server computes prices from the catalog and never trusts client prices |
| Checkout response | `200 { orderId, total }` / `400 { error }`; nothing is stored |
| `GET /api/products` | Returns the `PRODUCTS` array as JSON |
| Checkout page | Loads `/api/products`; the user sets quantities; submits |
| Tests | Vitest, one placeholder test in `src/lib/pricing.test.ts` |
| Language | English for UI, code and docs |

---

## Stage 1 — Skeleton, shared design, pricing module, placeholder test

Status: ✅ Done

**Result:** `npm install && npm run dev` serves:
- a home page with a heading and a link to `/checkout`;
- `/checkout` with a "not available yet" card;
- the same layout on both pages.

`npm run build` and `npm run test:ci` pass.

### Tasks

- [x] 1. Rename the existing empty readme: `git mv readme.md README.md`.

- [x] 2. Create `package.json`:
  ```json
  {
    "name": "practice-02-e-commerce-for-gdh",
    "version": "0.1.0",
    "private": true,
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "test:ci": "vitest run"
    }
  }
  ```

- [x] 3. Install dependencies (exact versions are written to `package.json`):
  ```bash
  npm install --save-exact next@latest react@latest react-dom@latest
  npm install --save-exact --save-dev typescript @types/node @types/react @types/react-dom vitest
  ```
  Afterwards confirm `scripts` still has exactly 3 keys.

- [x] 4. Create `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "target": "ES2017",
      "lib": ["dom", "dom.iterable", "esnext"],
      "skipLibCheck": true,
      "strict": true,
      "noEmit": true,
      "esModuleInterop": true,
      "module": "esnext",
      "moduleResolution": "bundler",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "jsx": "preserve",
      "incremental": true,
      "plugins": [{ "name": "next" }],
      "paths": { "@/*": ["./src/*"] }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
  }
  ```

- [x] 5. Create `next.config.ts`:
  ```ts
  import type { NextConfig } from "next";

  const nextConfig: NextConfig = {};

  export default nextConfig;
  ```

- [x] 6. Create `.gitignore`:
  ```
  node_modules/
  .next/
  next-env.d.ts
  *.tsbuildinfo
  .DS_Store
  ```

- [x] 7. Create `src/lib/pricing.ts` **exactly** as below. This is the sensitive module; it is written only once.
  ```ts
  export type Product = {
    id: string;
    name: string;
    price: number; // dollars, e.g. 4.99
  };

  export type CartItem = {
    productId: string;
    quantity: number;
  };

  // A discount takes the current total and returns the amount to subtract.
  export type Discount = (total: number) => number;

  export const PRODUCTS: readonly Product[] = [
    { id: "tshirt", name: "T-shirt", price: 19.99 },
    { id: "mug", name: "Coffee mug", price: 12.5 },
    { id: "sticker", name: "Sticker pack", price: 4.99 },
  ];

  export function roundToCents(value: number): number {
    return Math.round(value * 100) / 100;
  }

  export function findProduct(productId: string): Product | undefined {
    return PRODUCTS.find((product) => product.id === productId);
  }

  // Stub: discount stacking is not implemented yet, the subtotal is returned unchanged.
  export function applyDiscounts(subtotal: number, _discounts: Discount[] = []): number {
    return subtotal;
  }

  // Assumes items are already validated (known productId, integer quantity >= 1).
  export function calculateTotal(items: CartItem[]): number {
    const subtotal = items.reduce((sum, item) => {
      const product = findProduct(item.productId);
      if (!product) {
        throw new Error(`Unknown product: ${item.productId}`);
      }
      return roundToCents(sum + product.price * item.quantity);
    }, 0);
    return roundToCents(applyDiscounts(subtotal));
  }
  ```

- [x] 8. Create `src/lib/pricing.test.ts` (the single placeholder test):
  ```ts
  import { describe, expect, it } from "vitest";
  import { calculateTotal } from "./pricing";

  describe("calculateTotal", () => {
    it("sums line items and rounds to cents", () => {
      expect(calculateTotal([{ productId: "sticker", quantity: 3 }])).toBe(14.97);
    });
  });
  ```

- [x] 9. Create `src/app/globals.css`:
  ```css
  :root {
    --accent: #2563eb;
    --text: #111827;
    --muted: #6b7280;
    --border: #e5e7eb;
    --bg: #f9fafb;
    --card: #ffffff;
    --error: #b91c1c;
    --radius: 8px;
    --space: 16px;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: var(--text);
    background: var(--bg);
    line-height: 1.5;
  }

  .container { max-width: 720px; margin: 0 auto; padding: calc(var(--space) * 2) var(--space); }
  .header { margin-bottom: calc(var(--space) * 2); font-weight: 600; }
  .header a { color: var(--text); text-decoration: none; }

  h1 { margin: 0 0 var(--space); font-size: 1.75rem; }
  a { color: var(--accent); }

  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: var(--space);
    margin-bottom: var(--space);
  }

  .button {
    display: inline-block;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: var(--radius);
    padding: 10px 18px;
    font: inherit;
    text-decoration: none;
    cursor: pointer;
  }
  .button:hover { opacity: 0.9; }
  .button:disabled { opacity: 0.5; cursor: not-allowed; }

  .muted { color: var(--muted); }
  .error { color: var(--error); }
  ```

- [x] 10. Create `src/app/layout.tsx` (root layout shared by every page):
  - import `./globals.css`;
  - export `metadata` with title `"GDH Shop"`;
  - render `<html lang="en"><body><div className="container">`, inside it `<header className="header">` containing `<Link href="/">GDH Shop</Link>` (from `next/link`), then `<main>{children}</main>`;
  - type `children` as `ReactNode` imported from `react`.

- [x] 11. Create `src/app/page.tsx` (server component):
  - `<h1>Welcome to GDH Shop</h1>`;
  - a `<div className="card">` with one short sentence and `<Link className="button" href="/checkout">Go to checkout</Link>`.

- [x] 12. Create `src/app/checkout/page.tsx` (server component, temporary — replaced in stage 2):
  - `<h1>Checkout</h1>`;
  - a `<div className="card">` with `<p className="muted">Checkout is not available yet.</p>`.

- [x] 13. Write `README.md`:
  - project title and one-line description;
  - Requirements: Node.js 20+ and npm;
  - Getting started: `npm install`, `npm run dev`, then open http://localhost:3000;
  - Scripts: `dev`, `build`, `test:ci` — one line each.

- [x] 14. Update `CLAUDE.md`:
  - fill `## Commands` with `npm run dev`, `npm run build`, `npm run test:ci`, and how to run a single test: `npx vitest run src/lib/pricing.test.ts` or `npx vitest run -t "<test name>"`;
  - do not change other sections and do not copy rules from `docs/PLAN.md`, `docs/REQUIREMENTS.md` or the skills.

### Acceptance checks

- [x] `npm run build` exits 0.
- [x] `npm run test:ci` reports 1 test passed.
- [x] With `npm run dev` running, `curl -s http://localhost:3000/` contains "Welcome to GDH Shop".
- [x] With `npm run dev` running, `curl -s http://localhost:3000/checkout` contains "Checkout is not available yet".
- [x] `package.json` has exactly 3 scripts: `dev`, `build`, `test:ci`.
- [x] `requirements-check` skill (static) reports 0 ❌ (⏳ pending is fine).
- [x] Dev server stopped.

**Manual check for the user:** open `/`, click "Go to checkout", see the checkout page with the same layout, click "GDH Shop" to go back.

---

## Stage 2 — Product catalog API and product selection

Status: ⬜ Not started

**Result:**
- `GET /api/products` returns the catalog;
- `/checkout` lists products with prices and quantity inputs.

There is no ordering yet.

**Do not modify:** `src/lib/pricing.ts`.

### Tasks

- [ ] 1. Create `src/app/api/products/route.ts`:
  ```ts
  import { PRODUCTS } from "@/lib/pricing";

  export function GET() {
    return Response.json(PRODUCTS);
  }
  ```

- [ ] 2. Replace `src/app/checkout/page.tsx` with a client component:
  - first line: `"use client";`
  - `import type { Product } from "@/lib/pricing";` (type only — do not import `PRODUCTS` into the client);
  - state:
    - `products: Product[]` (initially `[]`);
    - `quantities: Record<string, number>` (missing key means 0);
    - `loading: boolean` (initially `true`);
    - `loadError: string | null`;
  - in `useEffect`, call `fetch("/api/products")`. If the response is not OK or the call throws, set `loadError` to `"Could not load products."`. Always set `loading` to `false` at the end;
  - render:
    - `<h1>Checkout</h1>`;
    - while loading: `<p className="muted">Loading products…</p>`;
    - on error: `<p className="error">{loadError}</p>`;
    - otherwise, one `<div className="card">` per product with the name, the price as `` `$${product.price.toFixed(2)}` ``, and a `<label>` wrapping `<input type="number" min={0} step={1}>` bound to `quantities[product.id] ?? 0`;
  - on input change, sanitize with `Math.max(0, Math.floor(Number(value) || 0))`.

- [ ] 3. `README.md`: add an "API" section documenting `GET /api/products` with an example response.

### Acceptance checks

- [ ] `npm run build` exits 0.
- [ ] `npm run test:ci` passes.
- [ ] With `npm run dev` running, `curl -s http://localhost:3000/api/products` returns a JSON array of 3 products.
- [ ] With `npm run dev` running, `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/checkout` returns `200`.
- [ ] `git diff --stat src/lib/pricing.ts` is empty.
- [ ] `requirements-check` skill (static) reports 0 ❌ (⏳ pending is fine).
- [ ] Dev server stopped.

**Manual check for the user:** open `/checkout`. You should see 3 products with prices. Change the quantities; negative and fractional values are corrected.

---

## Stage 3 — Checkout API, order submission, request-lifecycle docs

Status: ⬜ Not started

**Result:**
- `POST /api/checkout` validates the cart and returns `{ orderId, total }`;
- the checkout page submits the order and shows the result or the error;
- the README describes the request lifecycle.

**Do not modify:** `src/lib/pricing.ts`.

### Tasks

- [ ] 1. Create `src/app/api/checkout/route.ts`:
  ```ts
  import { calculateTotal, findProduct, type CartItem } from "@/lib/pricing";

  // API contract — imported by the checkout page with `import type`.
  export type CheckoutRequest = { items: CartItem[] };
  export type CheckoutSuccess = { orderId: string; total: number };
  export type CheckoutError = { error: string };

  function badRequest(error: string) {
    const response: CheckoutError = { error };
    return Response.json(response, { status: 400 });
  }

  function parseCart(body: unknown): CheckoutRequest | CheckoutError {
    const rawItems = (body as { items?: unknown } | null)?.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return { error: "items must be a non-empty array" };
    }
    const items: CartItem[] = [];
    for (const raw of rawItems) {
      if (typeof raw !== "object" || raw === null) {
        return { error: "Each item must be an object with productId and quantity" };
      }
      const { productId, quantity } = raw as Record<string, unknown>;
      if (typeof productId !== "string" || !findProduct(productId)) {
        return { error: `Unknown product: ${String(productId)}` };
      }
      if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
        return { error: "quantity must be an integer of at least 1" };
      }
      items.push({ productId, quantity });
    }
    return { items };
  }

  export async function POST(request: Request) {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Request body must be valid JSON");
    }

    const result = parseCart(body);
    if ("error" in result) {
      return badRequest(result.error);
    }

    const total = calculateTotal(result.items);
    // Future: persist the order here (DB write) before responding.
    const response: CheckoutSuccess = { orderId: crypto.randomUUID(), total };
    return Response.json(response);
  }
  ```

- [ ] 2. Extend `src/app/checkout/page.tsx`, keeping all stage 2 behavior:
  - add `import type { CheckoutRequest, CheckoutSuccess, CheckoutError } from "@/app/api/checkout/route";`
  - new state:
    - `submitting: boolean`;
    - `order: CheckoutSuccess | null`;
    - `submitError: string | null`;
  - a `<button className="button">Place order</button>` below the product list, disabled while `submitting` or when no quantity is > 0;
  - on click:
    - clear `order` and `submitError`, set `submitting` to `true`;
    - build the body `const payload: CheckoutRequest = { items }` from quantities > 0 as `{ productId, quantity }`;
    - `fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })`;
    - if `res.ok`, set `order` from the JSON as `CheckoutSuccess`; otherwise read it as `CheckoutError` and set `submitError` to its `error` or `"Checkout failed."`;
    - if the call throws, set `submitError` to `"Network error."`;
    - always set `submitting` back to `false`;
  - on success, show a `<div className="card">` with "Order placed", the order ID, and `` `Total: $${order.total.toFixed(2)}` ``;
  - on failure, show `<p className="error">{submitError}</p>`.

- [ ] 3. `README.md`:
  - document `POST /api/checkout`: request body, the 200 response, the 400 response and all error messages;
  - add a **"Request lifecycle"** section as a numbered list:
    1. the user clicks "Place order" on `/checkout`;
    2. the client builds `{ items }` from quantities > 0 and calls `fetch POST /api/checkout`;
    3. the route handler parses JSON and validates the cart (`parseCart`) → 400 on error;
    4. `calculateTotal` in `src/lib/pricing.ts` prices items from the catalog and applies discounts (currently a stub);
    5. *(future)* the order is written to the database at this point;
    6. the response `{ orderId, total }` is returned;
    7. the page shows the confirmation.

### Acceptance checks

Run with `npm run dev` running. Use `curl -s -w '\n%{http_code}\n' -X POST http://localhost:3000/api/checkout -H 'Content-Type: application/json' -d '<body>'`:

- [ ] Body `{"items":[{"productId":"sticker","quantity":3},{"productId":"mug","quantity":1}]}` → `200`, `total` is `27.47`, `orderId` is a UUID.
- [ ] Body `{"items":[]}` → `400` `items must be a non-empty array`.
- [ ] Body `{"items":[{"productId":"nope","quantity":1}]}` → `400` `Unknown product: nope`.
- [ ] Body `{"items":[{"productId":"mug","quantity":0}]}` → `400` `quantity must be an integer of at least 1`.
- [ ] Body `{"items":[{"productId":"mug","quantity":1.5}]}` → `400` `quantity must be an integer of at least 1`.
- [ ] Body `not json` → `400` `Request body must be valid JSON`.
- [ ] `npm run build` exits 0.
- [ ] `npm run test:ci` passes.
- [ ] `git diff --stat src/lib/pricing.ts` is empty.
- [ ] `requirements-check` skill in full mode reports 0 ❌ and 0 ⏳.
- [ ] Dev server stopped. (In the handoff, "Next stage" is "None — project complete".)

**Manual check for the user:**
1. Open `/checkout`, set Sticker pack = 3 and Coffee mug = 1, click "Place order". You should see "Order placed" and Total $27.47.
2. With all quantities at 0, the button is disabled.
3. Run one of the 400 curl commands above and see the error JSON.
