import { Router } from "express";
import multer from "multer";

import { requireAuth } from "../../middlewares/auth.middleware";
import { uploadFileController } from "./files.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

const filesRouter = Router();

filesRouter.post("/upload", requireAuth, upload.single("file"), uploadFileController);

export default filesRouter;
