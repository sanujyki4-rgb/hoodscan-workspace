import { PrismaClient } from "@prisma/client";

// Single shared Prisma instance, reused by both the indexer and the API
// so we don't open a new connection pool per import.
declare global {
  // eslint-disable-next-line no-var
  var __hoodscanPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__hoodscanPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__hoodscanPrisma = prisma;
}

export * from "@prisma/client";
