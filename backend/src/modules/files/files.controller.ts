import { randomUUID } from "crypto";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Request, Response } from "express";

import { env } from "../../config/env";
import { s3Client } from "../../lib/s3";
import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-error";

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export const uploadFileController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  if (!req.file) {
    throw new AppError("No file uploaded", 400, "FILE_REQUIRED");
  }

  if (!env.S3_BUCKET) {
    throw new AppError("S3 bucket is not configured", 500, "S3_NOT_CONFIGURED");
  }

  const key = `${req.user.id}/${Date.now()}-${randomUUID()}-${sanitizeFileName(req.file.originalname)}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    })
  );

  res.status(201).json({
    success: true,
    message: "File uploaded",
    data: {
      key,
      url: `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${key}`,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    }
  });
});
