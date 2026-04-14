import { createServer } from "http";

import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import { connectRedis, getRedisClient } from "./lib/redis";
import { initSocketServer } from "./lib/socket";

const httpServer = createServer(app);
const io = initSocketServer(httpServer);

async function startServer(): Promise<void> {
  await prisma.$connect();
  await connectRedis();

  httpServer.listen(env.PORT, () => {
    console.log(`API server is running on port ${env.PORT}`);
  });
}

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received. Shutting down gracefully...`);

  io.close();

  const redis = getRedisClient();

  if (redis) {
    try {
      await redis.quit();
    } catch {
      redis.disconnect();
    }
  }

  await prisma.$disconnect();

  httpServer.close(() => {
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10000).unref();
}

void startServer().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
