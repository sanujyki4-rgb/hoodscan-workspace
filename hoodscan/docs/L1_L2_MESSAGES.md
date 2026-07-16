# L1↔L2 Messages — implementation notes

Formerly `BACKEND_TODO.md`. That TODO is done — renamed so this
reads as a reference doc instead of a stale to-do list.

## Status: implemented and running

The `l1TxHash` field the frontend (`apps/web/components/L1L2Table.tsx`)
expects is fully wired end to end:

- **Schema** (`packages/database/prisma/schema.prisma`) — a dedicated
  `L1ToL2Message` model, not a column bolted onto `Transaction`.
  `originTxHash` is the real L1 (Ethereum) transaction hash. It links
  to `Transaction` via `requestId` / `l2TxHash` once the retryable
  ticket lands on L2. This ended up cleaner than the column-on-
  Transaction approach this doc originally proposed, since a message
  can exist (status `"initiated"`) before any L2 transaction for it
  exists at all.
- **Indexer** (`apps/indexer`) —
  `rpc/l1Client.ts` connects to Ethereum L1 via `L1_RPC_URL_MAINNET`
  and registers Robinhood Chain with `@arbitrum/sdk`.
  `jobs/watchL1Messages.ts` watches the Bridge contract's
  `MessageDelivered` events on L1, and — instead of reimplementing
  the request-ID hash formula by hand — asks `@arbitrum/sdk`
  (`ParentTransactionReceipt.getParentToChildMessages`) to compute it
  from the real L1 tx data, the same logic Offchain Labs' own SDK
  uses. `services/l1MessageService.ts` saves each message and links it
  to its L2 ticket transaction once one is seen.
  Wired into the main loop in `src/index.ts` (`l1WatchLoop`, every
  15s) — runs alongside the existing L2 poll loop, and no-ops safely
  with a warning log if `L1_RPC_URL_MAINNET` isn't set.
- **API** (`apps/api/src/controllers/transactions.controller.ts`) —
  both `listL1ToL2Transactions` and `getTransactionByHash` flatten
  `l1ToL2Message.originTxHash` into `l1TxHash` in the JSON response,
  which is exactly what `L1L2Table.tsx` and the tx detail page
  already expect. No frontend changes were needed for this, as
  planned.

## What's still genuinely open

- **Historical backfill.** `watchL1Messages` intentionally starts
  scanning from the *current* L1 head on a fresh database, not from
  Robinhood Chain's mainnet launch block on L1 — see the doc comment
  in `watchL1Messages.ts`. Older L1↔L2 messages that happened before
  the watcher first ran will stay unindexed unless someone explicitly
  calls it with a `fromBlock` far enough back.
- **Config check.** None of this runs without `L1_RPC_URL_MAINNET` set
  in `.env` (a separate Ethereum L1 RPC endpoint — Alchemy, Infura,
  etc. — distinct from the Robinhood Chain RPC used everywhere else).
  Worth confirming it's actually set before assuming this pipeline is
  live in any given environment.
- **`eth_getLogs` range limit.** `watchL1Messages.ts` scans L1 blocks
  10 at a time (`LOG_BATCH_SIZE`), sized for Alchemy's Free-tier
  `eth_getLogs` range cap. If the L1 RPC key moves to a paid tier,
  this could be raised for fewer round trips — not urgent, just a
  known lever if the watcher ever falls behind.
