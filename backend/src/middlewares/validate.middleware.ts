import { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodTypeAny } from "zod";

import { AppError } from "../utils/app-error";

export function validateBody<TSchema extends ZodTypeAny>(schema: TSchema): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      next(new AppError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.flatten()));
      return;
    }

    req.body = parsed.data;
    next();
  };
}

export function validateQuery<TSchema extends ZodTypeAny>(schema: TSchema): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);

    if (!parsed.success) {
      next(new AppError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.flatten()));
      return;
    }

    req.query = parsed.data;
    next();
  };
}
