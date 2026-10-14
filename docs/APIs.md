# API

## `GET /api/products`

Returns the product catalog as a JSON array. Prices are in dollars.

```json
[
  { "id": "tshirt", "name": "T-shirt", "price": 19.99 },
  { "id": "mug", "name": "Coffee mug", "price": 12.5 },
  { "id": "sticker", "name": "Sticker pack", "price": 4.99 }
]
```

## `POST /api/checkout`

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
