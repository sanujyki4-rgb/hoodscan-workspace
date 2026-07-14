import type { Request, Response } from "express";
import { prisma } from "@hoodscan/database";
import { serializeBigInt } from "../utils/serialize";

/**
 * GET /blocks?limit=20&offset=0
 * Latest blocks, newest first. Supports pagination for the "view all
 * blocks" page; the homepage just uses limit with no offset.
 */
export async function listLatestBlocks(req: Request, res: Response) {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  // Homepage calls this without wanting the {blocks, total} envelope —
  // keep that shape (bare array) for backward compatibility, and only
  // return the paginated envelope when offset is explicitly used.
  if (!req.query.offset) {
    const blocks = await prisma.block.findMany({
      orderBy: { number: "desc" },
      take: limit,
    });
    return res.json(serializeBigInt(blocks));
  }

  const [blocks, total] = await Promise.all([
    prisma.block.findMany({
      orderBy: { number: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.block.count(),
  ]);

  res.json(serializeBigInt({ blocks, total, limit, offset }));
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
