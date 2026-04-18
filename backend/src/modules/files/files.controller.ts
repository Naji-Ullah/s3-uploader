import { Request, Response } from "express";

import { uploadDocument } from "../documents/documents.service";
import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-error";

export const uploadFileController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  if (!req.file) {
    throw new AppError("No file uploaded", 400, "FILE_REQUIRED");
  }

  const document = await uploadDocument({
    userId: req.user.id,
    file: req.file,
    name: req.body.name,
    description: req.body.description,
    categoryId: req.body.categoryId
  });

  res.status(201).json({
    success: true,
    message: "File uploaded",
    data: {
      key: document.s3Key,
      url: document.s3Url,
      fileName: document.name,
      mimeType: document.fileType,
      size: document.fileSize,
      documentId: document.id
    }
  });
});
