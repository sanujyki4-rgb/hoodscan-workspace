import type { Request, Response } from "express";
import { prisma } from "@hoodscan/database";
import { TX_TYPE_LABELS } from "@hoodscan/types";
import { serializeBigInt } from "../utils/serialize";

/**
 * GET /transactions?limit=15&offset=0
 * Latest transactions across the whole chain (not scoped to one
 * block), newest first. Powers the homepage "Latest Transactions"
 * panel (no offset) and the "view all transactions" page (with offset).
 */
export async function listLatestTransactions(req: Request, res: Response) {
  const limit = Math.min(Number(req.query.limit) || 15, 50);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  if (!req.query.offset) {
    const transactions = await prisma.transaction.findMany({
      orderBy: [{ blockNumber: "desc" }, { transactionIndex: "desc" }],
      take: limit,
      include: {
        block: { select: { timestamp: true, isFinalized: true } },
      },
    });
    return res.json(serializeBigInt(transactions));
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      orderBy: [{ blockNumber: "desc" }, { transactionIndex: "desc" }],
      take: limit,
      skip: offset,
      include: {
        block: { select: { timestamp: true, isFinalized: true } },
      },
    }),
    prisma.transaction.count(),
  ]);

  res.json(serializeBigInt({ transactions, total, limit, offset }));
}

/**
 * GET /transactions/l1-to-l2?limit=15&offset=0
 * Latest Arbitrum-style system transactions (txType "0x6a") — these
 * represent L1<->L2 sync messages, not user-initiated transfers.
 * Powers the homepage's "Latest L1<->L2 Messages" panel (no offset)
 * and the "view all" page (with offset).
 */
export async function listL1ToL2Transactions(req: Request, res: Response) {
  const limit = Math.min(Number(req.query.limit) || 15, 50);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const where = { txType: "0x6a" };

  if (!req.query.offset) {
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: [{ blockNumber: "desc" }, { transactionIndex: "desc" }],
      take: limit,
      include: {
        block: { select: { timestamp: true, isFinalized: true, l1BlockNumber: true } },
      },
    });
    return res.json(serializeBigInt(transactions));
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: [{ blockNumber: "desc" }, { transactionIndex: "desc" }],
      take: limit,
      skip: offset,
      include: {
        block: { select: { timestamp: true, isFinalized: true, l1BlockNumber: true } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  res.json(serializeBigInt({ transactions, total, limit, offset }));
}

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
