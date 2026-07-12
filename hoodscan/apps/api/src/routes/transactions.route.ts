import { Router } from "express";
import { getTransactionByHash } from "../controllers/transactions.controller";
import { cacheMiddleware } from "../middlewares/cache";

const router = Router();

// A transaction's core data never changes once mined; only its
// `isFinalized` flag (via the joined block) can flip false -> true.
// Short TTL keeps that flag reasonably fresh without hitting the DB
// on every page view.
router.get("/:hash", cacheMiddleware(15), getTransactionByHash);

export default router;
