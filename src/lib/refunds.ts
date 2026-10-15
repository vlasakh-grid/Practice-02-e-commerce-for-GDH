import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type Refund = {
  id: string;
  orderId: string;
  amount: number; // integer cents, e.g. 499
  processingFee: number; // integer cents, e.g. 150
  createdAt: string;
};

const REFUNDS_PATH = path.join(process.cwd(), "data", "refunds.json");

async function readRefunds(): Promise<Refund[]> {
  const parsed: unknown = JSON.parse(await fs.readFile(REFUNDS_PATH, "utf8"));
  if (!Array.isArray(parsed)) {
    throw new Error("data/refunds.json must contain an array");
  }
  return parsed as Refund[];
}

export async function recordRefund(
  orderId: string,
  amount: number /* cents */,
  processingFee: number /* cents */,
): Promise<Refund> {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Refund amount must be a positive integer number of cents");
  }
  if (!Number.isInteger(processingFee) || processingFee < 0) {
    throw new Error("Refund processing fee must be a non-negative integer number of cents");
  }
  const refund: Refund = {
    id: randomUUID(),
    orderId,
    amount,
    processingFee,
    createdAt: new Date().toISOString(),
  };
  const refunds = await readRefunds();
  refunds.push(refund);
  await fs.writeFile(REFUNDS_PATH, JSON.stringify(refunds, null, 2) + "\n");
  return refund;
}
