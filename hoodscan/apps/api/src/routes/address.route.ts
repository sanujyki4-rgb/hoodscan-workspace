import { Router } from "express";
import { listTransactionsByAddress } from "../controllers/address.controller";
import { cacheMiddleware } from "../middlewares/cache";

const router = Router();

router.get("/:address/transactions", cacheMiddleware(5), listTransactionsByAddress);

export default router;
