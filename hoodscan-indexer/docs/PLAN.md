# hoodscan-indexer — Project Plan

> **Read this file first.** This document exists so that any future
> contributor — human or AI — can pick up this project without needing
> the full chat history that produced it. If you're an AI assistant
> reading this for the first time: this file is your source of truth
> for *why* things are built the way they are. Don't assume standard
> conventions without checking here first.

## 1. What this project is

`hoodscan-indexer` is a **standalone, dedicated block-indexing service**
for Robinhood Chain (a Layer 2 built on Arbitrum). Its only job is to
backfill the **entire transaction history** of the chain — from genesis
(block 0) to the current chain tip — into a PostgreSQL database, as
fast as reasonably possible given a rate-limited public RPC endpoint.

It intentionally does **not** include an API server or a frontend.
Those already exist in a sibling project, `hoodscan` (see section 4).

## 2. Why this project exists (context)

The main project, `hoodscan`, already has a working indexer
(`apps/indexer` inside it) that polls Robinhood Chain for the *latest*
block every ~500ms and writes it to its own Postgres database. That
part works well and should **not be touched or duplicated** here.

The problem: `hoodscan`'s indexer only starts capturing data from
whenever it was first run — it does **not** backfill historical blocks,
because Robinhood Chain produces blocks extremely fast (~100ms/block)
and by the time this project started, the chain was already at
**~7.17 million blocks**, despite mainnet only launching **July 1, 2026**
(confirmed via web search — Robinhood Chain mainnet launched publicly
on July 1, 2026, built on Arbitrum, with day-one partners including
Uniswap, Alchemy, BitGo, and Chainlink).

Backfilling ~7 million blocks through the public RPC
(`https://rpc.mainnet.chain.robinhood.com`) with conservative
concurrency would take **days**, and the public endpoint is explicitly
documented as *not recommended for production use* (rate-limited).

Rather than slow down or risk destabilizing the live `hoodscan`
indexer while solving this, we're building this backfill effort as a
**completely separate project**, with its own `package.json`, its own
Postgres database, and no shared runtime with `hoodscan`.

## 3. Non-goals

- No REST API in this project.
- No frontend in this project.
- No live "poll latest block" loop — that already exists in `hoodscan`
  and stays there. This project is backfill-only (historical data).
- Not a rewrite of `hoodscan`'s indexer logic — schema and decoding
  logic should stay **compatible** with it (see section 5), but this
  project can use a different strategy internally (batching, higher
  concurrency, multiple workers) to prioritize backfill speed.

## 4. Relationship to the `hoodscan` project — the "cutover" plan

This is the most important design decision, so it gets its own section.

**We are NOT going to migrate data between two databases.** That was
explicitly considered and rejected — moving millions of rows between
Postgres instances is slow and risky.

**Instead, the plan is:**

1. This project (`hoodscan-indexer`) runs against its **own** Postgres
   database (own `docker-compose.yml`, own `DATABASE_URL`), completely
   independent from `hoodscan`'s database, while backfill is in
   progress. This isolation means experimentation here (changing
   concurrency, retrying failed ranges, restarting the process many
   times while tuning performance) carries **zero risk** to the
   `hoodscan` project, which is being actively developed
   (frontend, API) in parallel.

2. `hoodscan`'s own indexer (`apps/indexer` in that repo) **keeps
   running independently**, capturing new blocks live, the entire time
   this backfill project is working. The two databases will
   temporarily diverge — that's expected and fine.

3. **Once this project's backfill reaches/catches up near the current
   chain tip**, the cutover is simple: change ONE line in `hoodscan`'s
   `.env` file —
   ```
   DATABASE_URL=postgresql://...   # point this at hoodscan-indexer's DB instead
   ```
   — and restart `hoodscan`'s services. No data copying, no export/
   import scripts. `hoodscan`'s API and frontend just start reading
   from the (now much more complete) database that this project built.

4. After cutover, a decision needs to be made about which project's
   *live* indexer keeps running going forward (likely: keep using
   `hoodscan`'s existing live poller, since it's already proven to
   work — see the "Indexed block ..." logs referenced in chat history
   — and this project's job is done once backfill is complete). This
   project can then be stopped/archived.

**Critical requirement for the cutover to work:** the Prisma schema in
this project **must stay compatible** with `hoodscan`'s schema at
`packages/database/prisma/schema.prisma` (same table names, same
column names/types). If they drift apart, the cutover in step 3 won't
work cleanly. Copy that schema as the starting point here — don't
redesign it from scratch.

## 5. Facts already established (don't re-derive these)

These were verified directly against the live chain via `curl` during
initial exploration — treat them as ground truth, not assumptions:

- **Chain ID:** `4663`
- **Mainnet RPC:** `https://rpc.mainnet.chain.robinhood.com`
- **Testnet RPC:** `https://rpc.testnet.chain.robinhood.com`
- **Mainnet launch date:** July 1, 2026 (confirmed via web search)
- **Block time:** ~100ms average (measured: 9,210 blocks produced in
  919 seconds between a "latest" and "finalized" block query)
- **"finalized" block tag** lags "latest" by roughly 15 minutes /
  ~9,000 blocks — this reflects L1 (Ethereum) consensus finality, and
  is a **different concept** from the ~7-day Arbitrum withdrawal
  challenge period (which applies only to L2→L1 withdrawals, tracked
  separately, not per-block).
- **Transaction types observed on this chain:**
  - `0x0` — Legacy
  - `0x2` — EIP-1559 (most common)
  - `0x6a` — Arbitrum-style **system transaction** (L1↔L2 sync). These
    have `from == to == "0x00...0a4b05"` and `gas/value == 0`. They
    should be tagged distinctly, not treated as user transactions.
- **The public RPC does NOT expose direct "finality window" or
  contract-source data** — those come from block explorer APIs
  (Blockscout at `robinhoodchain.blockscout.com`), not raw JSON-RPC.
- As of this document, chain tip is approximately **block 7,170,000+**
  (moving fast — re-check `eth_blockNumber` before estimating backfill
  size).

## 6. Speed strategy (in priority order)

These were discussed and agreed on before writing any code. Implement
in roughly this order — each one compounds with the last:

1. **Switch off the public RPC.** Use a provider with higher rate
   limits and concurrency allowance (Alchemy free tier was the
   preferred first choice — Robinhood's own docs recommend Alchemy).
   This unblocks everything else; concurrency increases are pointless
   against a throttled public endpoint.
2. **Run backfill as its own resumable process with an explicit
   checkpoint** (e.g., a `backfill_progress` table or a simple state
   file storing the last successfully indexed block number). Must
   survive interruption (laptop sleep, crash, manual stop) and resume
   from the checkpoint, not from block 0.
3. **Bulk insert into Postgres** — accumulate a batch of decoded
   blocks/transactions in memory, then write with `createMany` /
   multi-row inserts, rather than one row at a time.
4. **Batch JSON-RPC requests** — combine multiple `eth_getBlockByNumber`
   calls into a single HTTP request (JSON-RPC batching), reducing
   network round-trip overhead. Confirm the RPC provider supports
   batched requests before relying on this.
5. **Multi-worker parallelization** — split the full block range into
   N chunks, run N worker processes concurrently, each independently
   checkpointed. Only worth adding if steps 1–4 aren't fast enough on
   their own; adds coordination complexity.

## 7. Open questions / decisions not yet made

- [x] ~~Which RPC provider account will actually be used~~ — **Decided: Alchemy.**
      A dedicated Alchemy app was created for "Robinhood Chain Mainnet".
      Endpoint format: `https://robinhood-mainnet.g.alchemy.com/v2/<API_KEY>`.
      The API key must live in `.env` only — never hardcoded, never
      committed to version control, never pasted in chat/docs again.
      (Note: an earlier key was briefly exposed in chat during setup;
      it should be rotated in the Alchemy dashboard as a precaution.)
- [ ] Exact starting point for backfill: genesis block `0`, or a
      specific known block (e.g. first Stock Token contract
      deployment)? Earlier discussion concluded that **targeting a
      specific "token launch" block does not meaningfully reduce the
      work**, since the backfill volume is dominated by total block
      count regardless of where in history the target sits. Default
      assumption: backfill from block `0` unless decided otherwise.
- [ ] Where will this backfill process actually run — the same
      machine as `hoodscan`, or a separate server? (Affects whether
      the two Postgres instances need to be network-accessible to each
      other, or whether cutover happens by literally moving a
      connection string once the process is done.)
- [ ] Target completion time / is there a deadline driving urgency?

## 8. Status log

Keep this updated as work progresses — newest entry on top.

- **Switched RPC to multi-endpoint round-robin; confirmed account is
  now Pay As You Go.** `ALCHEMY_RPC_URLS` (plural, comma-separated)
  replaces the old single `ALCHEMY_RPC_URL` — `src/rpc.ts` now builds
  one viem client per URL and `src/backfill.ts` calls `getRpcClient()`
  to round-robin across them per-request. `.env.example` updated to
  match. **Caveat worth remembering (checked against Alchemy's current
  docs):** throughput is enforced at the ACCOUNT level, not per-app,
  so multiple apps under the *same* Alchemy account don't actually
  multiply capacity — round-robin is kept anyway since it was
  explicitly requested and is harmless, but the real throughput gain
  is from the Pay As You Go plan itself (`.env` now runs
  `BACKFILL_CONCURRENCY=100` / `RPC_MAX_REQUESTS_PER_SECOND=150`, up
  from the Free-tier template defaults of 15/20 in `.env.example`).
  Only one endpoint URL is filled in as of this entry — add more
  comma-separated URLs to `ALCHEMY_RPC_URLS` in `.env` directly
  (not via chat) if/when more are ready.

- **Scaffolded and ready for first run.** Created: `package.json`,
  `prisma/schema.prisma` (Block + Transaction copied identically from
  `hoodscan`, plus a `BackfillProgress` table unique to this project
  for resumable checkpointing), `docker-compose.yml` (own Postgres on
  port `5434`, separate from `hoodscan`'s `5432`), `.env` with a live
  Alchemy endpoint for Robinhood Chain Mainnet, and `src/` containing
  `db.ts`, `rpc.ts` (Alchemy-backed viem client), `decoder.ts` (kept
  logically identical to hoodscan's decoder), and `backfill.ts` (the
  main resumable, checkpointed, concurrent, batch-inserting backfill
  loop — implements strategy steps 1, 2, and 3 from section 6; steps 4
  and 5 — batched JSON-RPC requests and multi-worker parallelization —
  are NOT implemented yet, only add them if steps 1-3 prove too slow).
  Not yet run end-to-end. Next steps: `npm install`, `docker-compose up
  -d`, `npx prisma migrate dev`, then `npm run backfill`.

- **Project created, not yet scaffolded.** Plan written before any
  code. Next step: scaffold `package.json`, copy/adapt Prisma schema
  from `hoodscan/packages/database/prisma/schema.prisma`, set up local
  Postgres for this project.
