import Redis from "ioredis";

import { env } from "../config/env";

const redisClient = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false
    })
  : null;

let redisAvailable = Boolean(redisClient);

if (redisClient) {
  redisClient.on("error", (error) => {
    redisAvailable = false;
    console.error("Redis error", error.message);
  });

  redisClient.on("ready", () => {
    redisAvailable = true;
    console.log("Redis connected");
  });

  redisClient.on("end", () => {
    redisAvailable = false;
    console.warn("Redis connection closed");
  });
}

export async function connectRedis(): Promise<void> {
  if (!redisClient) {
    return;
  }

  if (redisClient.status === "connecting" || redisClient.status === "ready") {
    return;
  }

  try {
    await redisClient.connect();
  } catch (error) {
    redisAvailable = false;
    console.error("Failed to connect Redis", error);
  }
}

export function getRedisClient(): Redis | null {
  return redisClient;
}

export function isRedisAvailable(): boolean {
  if (!redisClient) {
    return false;
  }

  return redisAvailable && redisClient.status === "ready";
}

function getReadyRedisClient(): Redis | null {
  if (!redisClient || !isRedisAvailable()) {
    return null;
  }

  return redisClient;
}

export async function safeRedisGet(key: string): Promise<string | null> {
  const client = getReadyRedisClient();

  if (!client) {
    return null;
  }

  try {
    return await client.get(key);
  } catch (error) {
    console.error("Redis GET failed", { key, error });
    return null;
  }
}

export async function safeRedisSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  const client = getReadyRedisClient();

  if (!client) {
    return;
  }

  try {
    if (ttlSeconds && ttlSeconds > 0) {
      await client.set(key, value, "EX", ttlSeconds);
      return;
    }

    await client.set(key, value);
  } catch (error) {
    console.error("Redis SET failed", { key, error });
  }
}

export async function safeRedisSetJson<TValue>(key: string, value: TValue, ttlSeconds?: number): Promise<void> {
  await safeRedisSet(key, JSON.stringify(value), ttlSeconds);
}

export async function safeRedisGetJson<TValue>(key: string): Promise<TValue | null> {
  const raw = await safeRedisGet(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as TValue;
  } catch (error) {
    console.error("Redis JSON parse failed", { key, error });
    return null;
  }
}

export async function safeRedisDel(keys: string | string[]): Promise<void> {
  const client = getReadyRedisClient();

  if (!client) {
    return;
  }

  const normalized = Array.isArray(keys) ? keys.filter(Boolean) : [keys];

  if (normalized.length === 0) {
    return;
  }

  try {
    await client.del(...normalized);
  } catch (error) {
    console.error("Redis DEL failed", { keys: normalized, error });
  }
}

export async function safeRedisExists(key: string): Promise<boolean> {
  const client = getReadyRedisClient();

  if (!client) {
    return false;
  }

  try {
    const result = await client.exists(key);
    return result > 0;
  } catch (error) {
    console.error("Redis EXISTS failed", { key, error });
    return false;
  }
}

export async function safeRedisDeleteByPattern(pattern: string, count = 100): Promise<void> {
  const client = getReadyRedisClient();

  if (!client) {
    return;
  }

  try {
    let cursor = "0";

    do {
      const [nextCursor, keys] = await client.scan(cursor, "MATCH", pattern, "COUNT", String(count));

      if (keys.length > 0) {
        await client.del(...keys);
      }

      cursor = nextCursor;
    } while (cursor !== "0");
  } catch (error) {
    console.error("Redis SCAN delete failed", { pattern, error });
  }
}

export async function safeRedisSAdd(key: string, value: string): Promise<void> {
  const client = getReadyRedisClient();

  if (!client) {
    return;
  }

  try {
    await client.sadd(key, value);
  } catch (error) {
    console.error("Redis SADD failed", { key, error });
  }
}

export async function safeRedisSRem(key: string, value: string): Promise<void> {
  const client = getReadyRedisClient();

  if (!client) {
    return;
  }

  try {
    await client.srem(key, value);
  } catch (error) {
    console.error("Redis SREM failed", { key, error });
  }
}

export async function safeRedisSCard(key: string): Promise<number> {
  const client = getReadyRedisClient();

  if (!client) {
    return 0;
  }

  try {
    return await client.scard(key);
  } catch (error) {
    console.error("Redis SCARD failed", { key, error });
    return 0;
  }
}

export async function safeRedisExpire(key: string, ttlSeconds: number): Promise<void> {
  const client = getReadyRedisClient();

  if (!client || ttlSeconds <= 0) {
    return;
  }

  try {
    await client.expire(key, ttlSeconds);
  } catch (error) {
    console.error("Redis EXPIRE failed", { key, error });
  }
}
