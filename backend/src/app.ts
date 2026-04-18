import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env";
import { errorHandler } from "./middlewares/error.middleware";
import { notFoundHandler } from "./middlewares/not-found.middleware";
import authRouter from "./modules/auth/auth.routes";
import categoriesRouter from "./modules/categories/categories.routes";
import dashboardRouter from "./modules/dashboard/dashboard.routes";
import documentsRouter from "./modules/documents/documents.routes";
import filesRouter from "./modules/files/files.routes";
import notificationsRouter from "./modules/notifications/notifications.routes";

const allowedOrigins = env.ALLOWED_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const app = express();

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
  });

  next();
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is healthy"
  });
});

app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/files", filesRouter);

app.use(notFoundHandler);
app.use(errorHandler);
