import { safeRedisDel, safeRedisSetJson } from "../../lib/redis";

const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const SESSION_KEY_PREFIX = "auth:session:user:";

interface UserSessionPayload {
  userId: string;
  email: string;
  name: string;
  issuedAt: string;
}

function parseDurationToSeconds(value: string): number {
  const normalized = value.trim().toLowerCase();
  const numeric = Number(normalized);

  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.floor(numeric);
  }

  const match = normalized.match(/^(\d+)\s*([smhdw])$/);

  if (!match) {
    return DEFAULT_SESSION_TTL_SECONDS;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  if (!Number.isFinite(amount) || amount <= 0) {
    return DEFAULT_SESSION_TTL_SECONDS;
  }

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
    w: 60 * 60 * 24 * 7
  };

  return amount * multipliers[unit];
}

function sessionKey(userId: string): string {
  return `${SESSION_KEY_PREFIX}${userId}`;
}

export async function cacheUserSession(session: UserSessionPayload, refreshTtlInput: string): Promise<void> {
  const ttlSeconds = parseDurationToSeconds(refreshTtlInput);

  await safeRedisSetJson(sessionKey(session.userId), session, ttlSeconds);
}

export async function clearUserSession(userId: string): Promise<void> {
  await safeRedisDel(sessionKey(userId));
}
