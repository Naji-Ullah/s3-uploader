import { Router } from "express";
import multer from "multer";

import { requireAuth } from "../../middlewares/auth.middleware";
import { validateBody, validateQuery } from "../../middlewares/validate.middleware";
import { AppError } from "../../utils/app-error";
import {
  deleteDocumentController,
  getDocumentAccessUrlController,
  getDocumentController,
  listDocumentsController,
  updateDocumentController,
  uploadDocumentController
} from "./documents.controller";
import {
  listDocumentsQuerySchema,
  updateDocumentBodySchema,
  uploadDocumentBodySchema
} from "./documents.schemas";
import { MAX_DOCUMENT_FILE_SIZE_BYTES } from "./documents.constants";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_DOCUMENT_FILE_SIZE_BYTES
  }
});

const documentsRouter = Router();

function normalizeUploadBodyFields(reqBody: Record<string, unknown>): void {
  if (typeof reqBody.name === "string") {
    reqBody.name = reqBody.name.trim();
  }

  if (typeof reqBody.description === "string") {
    reqBody.description = reqBody.description.trim();
  }

  if (typeof reqBody.categoryId === "string") {
    reqBody.categoryId = reqBody.categoryId.trim();
  }
}

documentsRouter.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  (req, _res, next) => {
    normalizeUploadBodyFields(req.body as Record<string, unknown>);

    const parsed = uploadDocumentBodySchema.safeParse(req.body);

    if (!parsed.success) {
      next(new AppError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.flatten()));
      return;
    }

    req.body = parsed.data;
    next();
  },
  uploadDocumentController
);

documentsRouter.get("/", requireAuth, validateQuery(listDocumentsQuerySchema), listDocumentsController);

documentsRouter.get("/:id/access-url", requireAuth, getDocumentAccessUrlController);
documentsRouter.get("/:id", requireAuth, getDocumentController);
documentsRouter.put("/:id", requireAuth, validateBody(updateDocumentBodySchema), updateDocumentController);
documentsRouter.delete("/:id", requireAuth, deleteDocumentController);

export default documentsRouter;
