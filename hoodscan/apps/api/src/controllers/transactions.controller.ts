import type { Request, Response } from "express";
import { prisma } from "@hoodscan/database";
import { TX_TYPE_LABELS } from "@hoodscan/types";
import { serializeBigInt } from "../utils/serialize";

/**
 * GET /transactions/:hash
 * Single transaction by hash, with a human-readable type label
 * (e.g. "0x6a" -> "System (L1<->L2 sync)") and its parent block's
 * finalized status attached, so the frontend doesn't need a second
 * request just to render the Finalized/Pending badge.
 */
export async function getTransactionByHash(req: Request, res: Response) {
  const { hash } = req.params;

  const tx = await prisma.transaction.findUnique({
    where: { hash },
    include: {
      block: {
        select: { number: true, timestamp: true, isFinalized: true },
      },
    },
  });

  if (!tx) {
    return res.status(404).json({ error: "Transaction not found" });
  }

  res.json(
    serializeBigInt({
      ...tx,
      txTypeLabel: TX_TYPE_LABELS[tx.txType] ?? "Unknown",
    })
  );
}

/**
 * GET /blocks/:number/transactions
 * All transactions in a given block, in execution order.
 */
export async function listTransactionsByBlock(req: Request, res: Response) {
  const number = req.params.number;

  if (!/^\d+$/.test(number)) {
    return res.status(400).json({ error: "Block number must be a positive integer" });
  }

  const transactions = await prisma.transaction.findMany({
    where: { blockNumber: BigInt(number) },
    orderBy: { transactionIndex: "asc" },
  });

  res.json(serializeBigInt(transactions));
}
