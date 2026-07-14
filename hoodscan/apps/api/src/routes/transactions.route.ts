import { Router } from "express";
import {
  getTransactionByHash,
  listLatestTransactions,
  listL1ToL2Transactions,
} from "../controllers/transactions.controller";
import { cacheMiddleware } from "../middlewares/cache";

const router = Router();

// Latest transactions change every ~100ms (same cadence as blocks),
// so cache briefly — same rationale as GET /blocks.
router.get("/", cacheMiddleware(2), listLatestTransactions);

// IMPORTANT: literal routes like "/l1-to-l2" must be registered
// BEFORE the "/:hash" param route below, otherwise Express matches
// "/l1-to-l2" as if "l1-to-l2" were a tx hash param.
router.get("/l1-to-l2", cacheMiddleware(2), listL1ToL2Transactions);

// A transaction's core data never changes once mined; only its
// `isFinalized` flag (via the joined block) can flip false -> true.
// Short TTL keeps that flag reasonably fresh without hitting the DB
// on every page view.
router.get("/:hash", cacheMiddleware(15), getTransactionByHash);

export default router;
