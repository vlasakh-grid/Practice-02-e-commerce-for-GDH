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
3. The route handler parses JSON and validates the shape of the cart (`parseCart`) → 400 on error.
4. The route calls `placeOrder` (`src/services/place-order.ts`) with the catalog and the order repository from `src/data/container.ts`.
5. `placeOrder` loads the products (unknown product → 400), builds the order snapshot and gets the total from `calculateTotal` in `src/lib/pricing.ts` (discounts are currently a stub).
6. `OrderRepository.save` (the JSON implementation) appends the order to `data/orders.json` (the file is created if missing).
7. The response `{ orderId, total }` is returned.
8. The page shows the confirmation.
