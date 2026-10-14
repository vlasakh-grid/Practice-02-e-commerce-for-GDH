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
