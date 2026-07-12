import type { Request, Response } from "express";
import { prisma } from "@hoodscan/database";
import { serializeBigInt } from "../utils/serialize";

/**
 * GET /address/:address/transactions?limit=20&offset=0
 * Transactions where the address appears as sender OR receiver,
 * newest first.
 */
export async function listTransactionsByAddress(req: Request, res: Response) {
  const address = req.params.address.toLowerCase();
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;

  const where = {
    OR: [{ fromAddress: address }, { toAddress: address }],
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: [{ blockNumber: "desc" }, { transactionIndex: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.transaction.count({ where }),
  ]);

  res.json(
    serializeBigInt({
      address,
      total,
      limit,
      offset,
      transactions,
    })
  );
}
