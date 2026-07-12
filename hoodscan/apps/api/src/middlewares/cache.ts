import Redis from "ioredis";
import type { Request, Response, NextFunction } from "express";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
  // Don't crash the API if Redis is briefly unavailable — cache is an
  // optimization, not a hard dependency. Failed cache reads/writes are
  // logged and the request falls through to the database.
  maxRetriesPerRequest: 2,
  lazyConnect: true,
});

redis.on("error", (err) => {
  console.error("[cache] Redis error:", err.message);
});

/**
 * Express middleware factory: caches a JSON response in Redis under
 * the given key (derived from the request URL by default) for `ttlSeconds`.
 *
 * Usage: router.get("/blocks/:number", cacheMiddleware(30), controller)
 */
export function cacheMiddleware(ttlSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `hoodscan:cache:${req.originalUrl}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      console.error("[cache] Read failed, falling back to DB:", err);
    }

    // Intercept res.json to store the response before sending it.
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      redis
        .set(key, JSON.stringify(body), "EX", ttlSeconds)
        .catch((err) => console.error("[cache] Write failed:", err));
      res.setHeader("X-Cache", "MISS");
      return originalJson(body);
    };

    next();
  };
}
