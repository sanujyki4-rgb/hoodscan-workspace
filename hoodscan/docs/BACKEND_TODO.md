# Backend TODO — L1 Tx hash for L1↔L2 messages panel

## Status

Frontend (`apps/web/components/L1L2Table.tsx`) is ready for this data
and will render it correctly the moment the API sends it. Until then
it shows a "Not indexed yet" placeholder — nothing is broken, this is
a deliberate placeholder while backend work is pending.

## What the frontend expects

`GET /transactions/l1-to-l2` (in `apps/api`) should include a new
field on each transaction object:

```ts
l1TxHash: string | null   // e.g. "0xabc123...", or null if unknown
```

So a single item in the response array should look like:

```json
{
  "hash": "0x7c80c9...",          // existing L2 tx hash, already sent
  "blockNumber": "8616122",        // existing, already sent
  "l1TxHash": "0xdef456...",       // NEW — add this
  "block": {
    "timestamp": "...",
    "isFinalized": false,
    "l1BlockNumber": "25523281"    // existing, already sent
  }
}
```

## Why we don't have this today

The system transactions we index (`txType == "0x6a"`) come from
Robinhood Chain's own L2 RPC. Their `input` field only encodes the L1
and L2 **block numbers** for the sync checkpoint — it does not contain
a reference to any specific L1 transaction hash. There is currently no
L1 transaction hash anywhere in our indexed data for these rows.

## How to actually get a real L1 Tx hash (the hard part)

Robinhood Chain is Arbitrum-based. Real L1↔L2 messages (deposits, the
kind Arbiscan shows on `arbiscan.io/txsDeposits`) originate from a
user calling `createRetryableTicket` (or similar) on the **Inbox
contract on Ethereum L1** — not from our L2 RPC at all. To get a real
`l1TxHash`, you'd need to:

1. **Run/use an Ethereum L1 RPC** (Alchemy, Infura, etc. — separate
   from the Robinhood Chain RPC we already use).
2. **Find and index the Inbox contract address** for Robinhood Chain
   on L1 (check Robinhood Chain's official docs/contracts page for
   this address — not yet verified in this project).
3. **Watch/backfill `TicketCreated` (or equivalent) events** on that
   contract via `eth_getLogs`, which include the L1 transaction hash.
4. **Correlate each L1 event to the corresponding L2 system tx** —
   likely via a shared ticket ID, sequence number, or L1/L2 block
   number proximity encoded in both sides. The exact correlation key
   depends on how Robinhood Chain's Inbox contract emits these events
   — needs to be checked against the actual contract/ABI once you have
   the address.
5. Store the matched `l1TxHash` on the corresponding `Transaction` row
   (likely needs a new nullable column in the Prisma schema, e.g.
   `l1TxHash String?` on the `Transaction` model, in **both**
   `hoodscan/packages/database/prisma/schema.prisma` and
   `hoodscan-indexer/prisma/schema.prisma` to keep them compatible —
   see `hoodscan-indexer/docs/PLAN.md` section 4).

This is meaningfully more work than anything else in the `apps/api`
layer so far — it's a second, separate indexing pipeline (L1-side),
not just a new query against data we already have.

## Once the schema + data exist

The only `apps/api` change needed is adding `l1TxHash: true` to the
`select`/mapping in `listL1ToL2Transactions`
(`apps/api/src/controllers/transactions.controller.ts`) so it's
included in the JSON response. No frontend changes should be required
— `L1L2Table.tsx` already handles both the present and absent cases.
