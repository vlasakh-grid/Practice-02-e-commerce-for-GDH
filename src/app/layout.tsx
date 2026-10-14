import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "GDH Shop",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <Link href="/">GDH Shop</Link>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
