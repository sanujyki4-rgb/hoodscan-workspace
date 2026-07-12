# hoodscan-indexer

Standalone backfill indexer for Robinhood Chain — fills historical
block/transaction data into its own PostgreSQL database, independent
from the main `hoodscan` project.

**Start here:** [`docs/PLAN.md`](./docs/PLAN.md) — full context, design
decisions, and the plan for eventually connecting this project's
database to `hoodscan`. Read it before writing or changing any code.
