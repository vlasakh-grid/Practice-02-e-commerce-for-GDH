# GDH Shop

A small Next.js e-commerce demo: a home page, a checkout page and a pricing module.

## Requirements

- Node.js 22+ (see `.nvmrc`; `nvm use`)
- npm

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Scripts

- `npm run dev` — start the development server.
- `npm run build` — create a production build.
- `npm run test:ci` — run the unit tests once with Vitest.

## API

See [docs/APIs.md](docs/APIs.md) for the `GET /api/products` and `POST /api/checkout` endpoints.

## Request lifecycle

1. The user clicks "Place order" on `/checkout`.
2. The client builds `{ items }` from quantities > 0 and calls `fetch POST /api/checkout`.
3. The route handler parses JSON and validates the cart (`parseCart`) → 400 on error.
4. `calculateTotal` in `src/lib/pricing.ts` prices items from the catalog and applies discounts (currently a stub).
5. *(future)* The order is written to the database at this point.
6. The response `{ orderId, total }` is returned.
7. The page shows the confirmation.
