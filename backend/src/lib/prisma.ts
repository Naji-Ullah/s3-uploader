import { PrismaClient } from "@prisma/client";

import { env } from "../config/env";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

export const prisma = global.__prisma__ ?? new PrismaClient();

void env.DATABASE_URL;

if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = prisma;
}
