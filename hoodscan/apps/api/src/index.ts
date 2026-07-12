import express from "express";
import cors from "cors";
import blocksRouter from "./routes/blocks.route";
import transactionsRouter from "./routes/transactions.route";
import addressRouter from "./routes/address.route";

const app = express();
const PORT = Number(process.env.API_PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/blocks", blocksRouter);
app.use("/transactions", transactionsRouter);
app.use("/address", addressRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`[api] hoodscan API listening on http://localhost:${PORT}`);
});
