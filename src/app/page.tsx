import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <h1>Welcome to GDH Shop</h1>
      <div className="card">
        <p>Pick your favorite items and check out in a few clicks.</p>
        <Link className="button" href="/checkout">
          Go to checkout
        </Link>
      </div>
    </>
  );
}
