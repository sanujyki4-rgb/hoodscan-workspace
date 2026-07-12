/**
 * Prisma returns BigInt for our BigInt columns (number, gas, nonce, etc).
 * JSON.stringify() throws on BigInt by default, so every API response
 * needs to pass through this before res.json().
 */
export function serializeBigInt<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, val) =>
      typeof val === "bigint" ? val.toString() : val
    )
  );
}
