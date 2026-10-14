"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/pricing";
import type {
  CheckoutRequest,
  CheckoutSuccess,
  CheckoutError,
} from "@/app/api/checkout/route";

export default function CheckoutPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<CheckoutSuccess | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) {
          setLoadError("Could not load products.");
        } else {
          setProducts((await res.json()) as Product[]);
        }
      } catch {
        setLoadError("Could not load products.");
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  function setQuantity(productId: string, value: string) {
    const quantity = Math.max(0, Math.floor(Number(value) || 0));
    setQuantities((current) => ({ ...current, [productId]: quantity }));
  }

  const items = Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([productId, quantity]) => ({ productId, quantity }));

  async function placeOrder() {
    setOrder(null);
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payload: CheckoutRequest = { items };
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setOrder((await res.json()) as CheckoutSuccess);
      } else {
        const body = (await res.json()) as CheckoutError;
        setSubmitError(body.error ?? "Checkout failed.");
      }
    } catch {
      setSubmitError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1>Checkout</h1>
      {loading && <p className="muted">Loading products…</p>}
      {loadError && <p className="error">{loadError}</p>}
      {!loading &&
        !loadError &&
        products.map((product) => (
          <div className="card" key={product.id}>
            <strong>{product.name}</strong>
            <p className="muted">{`$${product.price.toFixed(2)}`}</p>
            <label>
              Quantity{" "}
              <input
                type="number"
                min={0}
                step={1}
                value={quantities[product.id] ?? 0}
                onChange={(event) => setQuantity(product.id, event.target.value)}
              />
            </label>
          </div>
        ))}
      {!loading && !loadError && (
        <button
          className="button"
          disabled={submitting || items.length === 0}
          onClick={placeOrder}
        >
          Place order
        </button>
      )}
      {order && (
        <div className="card" style={{ marginTop: "var(--space)" }}>
          <strong>Order placed</strong>
          <p className="muted">{`Order ID: ${order.orderId}`}</p>
          <p>{`Total: $${order.total.toFixed(2)}`}</p>
        </div>
      )}
      {submitError && <p className="error">{submitError}</p>}
    </>
  );
}
