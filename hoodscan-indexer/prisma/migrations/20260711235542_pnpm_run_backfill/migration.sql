-- CreateTable
CREATE TABLE "Block" (
    "number" BIGINT NOT NULL,
    "hash" TEXT NOT NULL,
    "parentHash" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "gasUsed" BIGINT NOT NULL,
    "gasLimit" BIGINT NOT NULL,
    "baseFeePerGas" BIGINT NOT NULL,
    "l1BlockNumber" BIGINT NOT NULL,
    "sendCount" BIGINT NOT NULL,
    "sendRoot" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "txCount" INTEGER NOT NULL,
    "isFinalized" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("number")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "hash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "transactionIndex" INTEGER NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT,
    "nonce" BIGINT NOT NULL,
    "value" DECIMAL(38,0) NOT NULL,
    "gas" BIGINT NOT NULL,
    "gasPrice" DECIMAL(38,0),
    "maxFeePerGas" DECIMAL(38,0),
    "maxPriorityFeePerGas" DECIMAL(38,0),
    "input" TEXT NOT NULL,
    "functionSelector" TEXT,
    "txType" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "BackfillProgress" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "lastIndexedBlock" BIGINT NOT NULL DEFAULT 0,
    "targetBlock" BIGINT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackfillProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Block_hash_key" ON "Block"("hash");

-- CreateIndex
CREATE INDEX "Block_timestamp_idx" ON "Block"("timestamp");

-- CreateIndex
CREATE INDEX "Transaction_blockNumber_idx" ON "Transaction"("blockNumber");

-- CreateIndex
CREATE INDEX "Transaction_fromAddress_idx" ON "Transaction"("fromAddress");

-- CreateIndex
CREATE INDEX "Transaction_toAddress_idx" ON "Transaction"("toAddress");

-- CreateIndex
CREATE INDEX "Transaction_functionSelector_idx" ON "Transaction"("functionSelector");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_blockNumber_fkey" FOREIGN KEY ("blockNumber") REFERENCES "Block"("number") ON DELETE RESTRICT ON UPDATE CASCADE;
