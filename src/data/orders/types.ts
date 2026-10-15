// Shape of a record stored in data/orders.json.
export type OrderItem = { productId: string; name: string; quantity: number; unitPrice: number };
export type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  createdAt: string;
};
