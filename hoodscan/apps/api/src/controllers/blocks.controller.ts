import type { Request, Response } from "express";
import { prisma } from "@hoodscan/database";
import { serializeBigInt } from "../utils/serialize";

/**
 * GET /blocks?limit=20
 * Latest blocks, newest first.
 */
export async function listLatestBlocks(req: Request, res: Response) {
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const blocks = await prisma.block.findMany({
    orderBy: { number: "desc" },
    take: limit,
  });

  res.json(serializeBigInt(blocks));
}

/**
 * GET /blocks/:number
 * Single block by number, including its transactions.
 */
export async function getBlockByNumber(req: Request, res: Response) {
  const number = req.params.number;

  if (!/^\d+$/.test(number)) {
    return res.status(400).json({ error: "Block number must be a positive integer" });
  }

  const block = await prisma.block.findUnique({
    where: { number: BigInt(number) },
    include: {
      transactions: {
        orderBy: { transactionIndex: "asc" },
      },
    },
  });

  if (!block) {
    return res.status(404).json({ error: "Block not found" });
  }

  res.json(serializeBigInt(block));
}
