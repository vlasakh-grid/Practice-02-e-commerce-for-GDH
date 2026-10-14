"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/pricing";

export default function CheckoutPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    </>
  );
}
