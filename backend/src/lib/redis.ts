import Redis from "ioredis";

import { env } from "../config/env";

const redisClient = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false
    })
  : null;

if (redisClient) {
  redisClient.on("error", (error) => {
    console.error("Redis error", error.message);
  });
}

export async function connectRedis(): Promise<void> {
  if (!redisClient) {
    return;
  }

  if (redisClient.status === "connecting" || redisClient.status === "ready") {
    return;
  }

  await redisClient.connect();
}

export function getRedisClient(): Redis | null {
  return redisClient;
}
