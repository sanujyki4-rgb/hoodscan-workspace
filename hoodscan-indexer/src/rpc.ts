import "dotenv/config";
import { createPublicClient, http, defineChain } from "viem";

const ALCHEMY_RPC_URLS = process.env.ALCHEMY_RPC_URLS;
const RH_CHAIN_ID = Number(process.env.RH_CHAIN_ID ?? 4663);

if (!ALCHEMY_RPC_URLS) {
  throw new Error(
    "ALCHEMY_RPC_URLS is not set. Copy .env.example to .env and fill in at least one Alchemy endpoint (comma-separated if you have more than one)."
  );
}

const rpcUrls = ALCHEMY_RPC_URLS.split(",")
  .map((url) => url.trim())
  .filter(Boolean);

if (rpcUrls.length === 0) {
  throw new Error("ALCHEMY_RPC_URLS is set but contains no valid URLs.");
}

export const robinhoodChain = defineChain({
  id: RH_CHAIN_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [rpcUrls[0]] },
  },
});

// One viem client per configured endpoint.
//
// IMPORTANT: as of mid-2026 Alchemy enforces throughput (CU/s) at the
// ACCOUNT level, not per-app (see https://www.alchemy.com/docs/reference/throughput
// — "combined usage of all your Alchemy apps counts toward your
// overall throughput limit"). So multiple apps under the SAME account
// do NOT multiply total capacity. This round-robin is still wired up
// because it was explicitly requested, it's harmless to run this way,
// and it would help if the URLs ever span different accounts/providers.
const rpcClients = rpcUrls.map((url) =>
  createPublicClient({
    chain: robinhoodChain,
    transport: http(url, {
      // Short transport retries only; backfill.ts owns longer 429 backoff
      // so we don't hammer the same endpoint in a tight loop.
      retryCount: 2,
      retryDelay: 1_000,
      timeout: 30_000,
    }),
  })
);

export const rpcClientCount = rpcClients.length;

let rrIndex = 0;

/**
 * Returns the next RPC client in round-robin order across every
 * endpoint listed in ALCHEMY_RPC_URLS. Call this fresh for every
 * outgoing request (don't cache the result in a variable) so load
 * spreads evenly — see fetchBlock() in backfill.ts for the pattern.
 */
export function getRpcClient() {
  const client = rpcClients[rrIndex % rpcClients.length];
  rrIndex++;
  return client;
}
