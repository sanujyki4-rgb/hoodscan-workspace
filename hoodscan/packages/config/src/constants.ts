/**
 * Shared constants for Robinhood Chain across indexer, api, and web.
 * Values verified directly against the public mainnet RPC (chain ID
 * confirmed via docs.robinhood.com/chain and live curl checks).
 */

export const ROBINHOOD_CHAIN_ID = 4663;
export const ROBINHOOD_TESTNET_CHAIN_ID = 46646;

export const RPC_URL_MAINNET =
  process.env.RH_RPC_URL_MAINNET ?? "https://rpc.mainnet.chain.robinhood.com";
export const RPC_URL_TESTNET =
  process.env.RH_RPC_URL_TESTNET ?? "https://rpc.testnet.chain.robinhood.com";

export const BLOCK_EXPLORER_URL = "https://robinhoodchain.blockscout.com";

// How often the indexer polls for new blocks, in milliseconds.
// Robinhood Chain block time is ~100ms; we poll less aggressively
// than that to avoid hammering the public RPC (rate-limited).
export const INDEXER_POLL_INTERVAL_MS = Number(
  process.env.INDEXER_POLL_INTERVAL_MS ?? 500
);

// Known Arbitrum "system" sender/receiver address pattern observed
// on Robinhood Chain (type 0x6a txs), used to flag internal L1<->L2
// sync transactions distinctly in the explorer UI.
export const ARBITRUM_SYSTEM_ADDRESS_SUFFIX = "0a4b05";
