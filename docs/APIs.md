# API

## `GET /api/products`

Returns the product catalog as a JSON array. Prices are in dollars. The response type is `ProductsResponse` in `src/app/api/products/route.ts`.

```json
[
  { "id": "tshirt", "name": "T-shirt", "price": 19.99 },
  { "id": "mug", "name": "Coffee mug", "price": 12.5 },
  { "id": "sticker", "name": "Sticker pack", "price": 4.99 }
]
```

## `POST /api/checkout`

Validates the cart and returns the order total. The server prices the items from the catalog; client prices are never accepted. A successful order is appended to `data/orders.json` (created on first use, gitignored); the file holds an array of `Order` records (the `Order` type in `src/data/orders/types.ts`):

```json
{
  "id": "3f1c2a52-8d0e-4a57-b0a4-6f3f6a6a9c11",
  "userId": "guest",
  "items": [
    { "productId": "sticker", "name": "Sticker pack", "quantity": 3, "unitPrice": 4.99 },
    { "productId": "mug", "name": "Coffee mug", "quantity": 1, "unitPrice": 12.5 }
  ],
  "subtotal": 27.47,
  "discount": 0,
  "total": 27.47,
  "status": "confirmed",
  "createdAt": "2026-10-14T12:00:00.000Z"
}
```

`subtotal` is the sum of `quantity × unitPrice`, `discount` is `subtotal − total`, where `total` comes from `calculateTotal` in `pricing.ts`. If `data/orders.json` cannot be read as an array or written, the endpoint responds `500` and the file is left untouched. Failed validation (`400`) writes nothing.

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

Validation order: the shape of **all** items is checked first (`items`, object, string `productId`, `quantity`); only then does the order service check that every product exists. For example, `{"items":[{"productId":"nope","quantity":0}]}` returns the `quantity` error, not `Unknown product: nope`.

Possible `error` messages:

- `Request body must be valid JSON`
- `items must be a non-empty array`
- `Each item must be an object with productId and quantity`
- `Unknown product: <productId>`
- `quantity must be an integer of at least 1`
