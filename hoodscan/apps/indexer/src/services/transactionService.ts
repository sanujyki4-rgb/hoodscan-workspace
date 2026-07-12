import { prisma } from "@hoodscan/database";
import type { DecodedTransaction } from "@hoodscan/types";

/**
 * Bulk-insert transactions for a block. Uses createMany with
 * skipDuplicates so re-running the same block (e.g. after a retry)
 * doesn't throw on unique hash conflicts.
 */
export async function saveTransactions(transactions: DecodedTransaction[]) {
  if (transactions.length === 0) return { count: 0 };

  return prisma.transaction.createMany({
    data: transactions.map((tx) => ({
      hash: tx.hash,
      blockNumber: tx.blockNumber,
      transactionIndex: tx.transactionIndex,
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress,
      nonce: tx.nonce,
      value: tx.value,
      gas: tx.gas,
      gasPrice: tx.gasPrice,
      maxFeePerGas: tx.maxFeePerGas,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      input: tx.input,
      functionSelector: tx.functionSelector,
      txType: tx.txType,
    })),
    skipDuplicates: true,
  });
}
