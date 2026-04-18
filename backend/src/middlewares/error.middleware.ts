import { ErrorRequestHandler } from "express";
import multer from "multer";

import { AppError } from "../utils/app-error";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        success: false,
        code: "FILE_TOO_LARGE",
        message: "File size exceeds 10MB limit"
      });
      return;
    }

    res.status(400).json({
      success: false,
      code: "UPLOAD_ERROR",
      message: error.message
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      code: error.code,
      message: error.message,
      details: error.details
    });
    return;
  }

  const possiblePrismaError = error as { code?: string };

  if (possiblePrismaError?.code === "P2002") {
    res.status(409).json({
      success: false,
      code: "CONFLICT",
      message: "A resource with this unique field already exists"
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong"
  });
};
