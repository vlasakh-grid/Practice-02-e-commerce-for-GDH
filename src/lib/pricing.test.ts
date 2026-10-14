import { describe, expect, it } from "vitest";
import { calculateTotal } from "./pricing";

describe("calculateTotal", () => {
  it("sums line items and rounds to cents", () => {
    expect(calculateTotal([{ productId: "sticker", quantity: 3 }])).toBe(14.97);
  });
});
