import { NextFunction, Request, Response } from "express";

import { AppError } from "../utils/app-error";
import { verifyAccessToken } from "../utils/jwt";

function extractBearerToken(header?: string): string | null {
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    next(new AppError("Missing auth token", 401, "UNAUTHORIZED"));
    return;
  }

  const payload = verifyAccessToken(token);

  req.user = {
    id: payload.userId,
    email: payload.email,
    name: payload.name
  };

  next();
}
