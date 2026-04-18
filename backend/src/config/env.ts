import "dotenv/config";

import { z } from "zod";

function resolveDatabaseUrl(input: {
  DATABASE_URL?: string;
  DB_HOST?: string;
  DB_PORT?: string;
  DB_NAME?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;
}): string | null {
  const directUrl = input.DATABASE_URL?.trim();

  if (directUrl && !directUrl.includes("${")) {
    return directUrl;
  }

  const host = input.DB_HOST?.trim();
  const portRaw = input.DB_PORT?.trim();
  const dbName = input.DB_NAME?.trim();
  const user = input.DB_USER?.trim();
  const password = input.DB_PASSWORD;

  if (!host || !portRaw || !dbName || !user || !password) {
    return null;
  }

  const port = Number(portRaw);

  if (!Number.isInteger(port) || port <= 0) {
    return null;
  }

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${dbName}?schema=public`;
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.string().optional(),
  DB_NAME: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  REDIS_URL: z.union([z.string().url(), z.literal("")]).optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().optional(),
  S3_PUBLIC_BASE_URL: z.string().url().optional(),
  S3_GET_URL_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().max(3600).default(300),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  ALLOWED_ORIGIN: z.string().default("http://localhost:3000")
}).transform((value, ctx) => {
  const databaseUrl = resolveDatabaseUrl(value);

  if (!databaseUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Provide DATABASE_URL or all of DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
    });

    return z.NEVER;
  }

  return {
    ...value,
    DATABASE_URL: databaseUrl
  };
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed.");
}

process.env.DATABASE_URL = parsed.data.DATABASE_URL;

export const env = parsed.data;
