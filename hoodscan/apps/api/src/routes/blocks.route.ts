import { Router } from "express";
import { listLatestBlocks, getBlockByNumber } from "../controllers/blocks.controller";
import { listTransactionsByBlock } from "../controllers/transactions.controller";
import { cacheMiddleware } from "../middlewares/cache";

const router = Router();

// Latest blocks change every ~100ms, so cache briefly (2s) — enough
// to absorb a burst of concurrent homepage loads without serving
// stale data for long.
router.get("/", cacheMiddleware(2), listLatestBlocks);

// A specific block's data never changes once mined, so this can be
// cached much longer.
router.get("/:number", cacheMiddleware(300), getBlockByNumber);
router.get("/:number/transactions", cacheMiddleware(300), listTransactionsByBlock);

export default router;
