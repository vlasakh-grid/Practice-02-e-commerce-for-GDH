import { PRODUCTS } from "@/lib/pricing";

export function GET() {
  return Response.json(PRODUCTS);
}
