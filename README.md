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

### `GET /api/products`

Returns the product catalog as a JSON array. Prices are in dollars.

```json
[
  { "id": "tshirt", "name": "T-shirt", "price": 19.99 },
  { "id": "mug", "name": "Coffee mug", "price": 12.5 },
  { "id": "sticker", "name": "Sticker pack", "price": 4.99 }
]
```

### `POST /api/checkout`

Validates the cart and returns the order total. The server prices the items from the catalog; client prices are never accepted. Nothing is stored.

Request body:

```json
{ "items": [{ "productId": "sticker", "quantity": 3 }, { "productId": "mug", "quantity": 1 }] }
```

`200` response (`orderId` is a UUID, `total` is in dollars):

```json
{ "orderId": "3f1c2a52-8d0e-4a57-b0a4-6f3f6a6a9c11", "total": 27.47 }
```

`400` response:

```json
{ "error": "items must be a non-empty array" }
```

Possible `error` messages:

- `Request body must be valid JSON`
- `items must be a non-empty array`
- `Each item must be an object with productId and quantity`
- `Unknown product: <productId>`
- `quantity must be an integer of at least 1`

## Request lifecycle

1. The user clicks "Place order" on `/checkout`.
2. The client builds `{ items }` from quantities > 0 and calls `fetch POST /api/checkout`.
3. The route handler parses JSON and validates the cart (`parseCart`) → 400 on error.
4. `calculateTotal` in `src/lib/pricing.ts` prices items from the catalog and applies discounts (currently a stub).
5. *(future)* The order is written to the database at this point.
6. The response `{ orderId, total }` is returned.
7. The page shows the confirmation.
