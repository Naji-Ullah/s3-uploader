import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

import { env } from "../config/env";
import { AppError } from "./app-error";

export interface AccessTokenPayload {
  userId: string;
  email: string;
  name: string;
}

interface RefreshTokenPayload {
  userId: string;
  tokenType: "refresh";
}

function parseTokenPayload(value: string | JwtPayload): JwtPayload {
  if (typeof value === "string") {
    throw new AppError("Invalid token payload", 401, "INVALID_TOKEN");
  }

  return value;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    subject: payload.userId
  });
}

export function signRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = { userId, tokenType: "refresh" };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
    subject: userId
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const payload = parseTokenPayload(decoded);

    if (typeof payload.userId !== "string" || typeof payload.email !== "string" || typeof payload.name !== "string") {
      throw new AppError("Invalid access token", 401, "INVALID_TOKEN");
    }

    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name
    };
  } catch {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const payload = parseTokenPayload(decoded);

    if (payload.tokenType !== "refresh" || typeof payload.userId !== "string") {
      throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
    }

    return {
      userId: payload.userId,
      tokenType: "refresh"
    };
  } catch {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }
}
