import type { Request } from "express";

/**
 * Parses `?limit=&offset=` off a request, shared by every list
 * endpoint (blocks, transactions, l1-to-l2) so the clamping rules and
 * the "was offset explicitly passed" check live in exactly one place.
 *
 * `hasOffset` powers the bare-array-vs-{data,total}-envelope split
 * each controller does: the homepage panels call these endpoints
 * with no offset and want a plain array back; the "view all" pages
 * pass offset=0 explicitly and want the paginated envelope.
 */
export function parsePagination(
  req: Request,
  defaultLimit: number,
  maxLimit: number
): { limit: number; offset: number; hasOffset: boolean } {
  const limit = Math.min(Number(req.query.limit) || defaultLimit, maxLimit);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const hasOffset = Boolean(req.query.offset);
  return { limit, offset, hasOffset };
}
