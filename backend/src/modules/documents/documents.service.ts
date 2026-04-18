import { randomUUID } from "crypto";

import { NotificationType, Prisma, UserRole } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { createPresignedGetObjectUrl, deleteFileFromS3, buildS3FileUrl, uploadBufferToS3 } from "../../lib/s3";
import {
  emitCategoryUpdated,
  emitDocumentDeleted,
  emitDocumentUpdated,
  emitDocumentUploaded,
  emitNotification,
  RealtimeDocumentPayload,
  RealtimeNotificationPayload
} from "../../lib/socket";
import { AppError } from "../../utils/app-error";
import {
  buildDocumentListCacheKey,
  cacheCategories,
  cacheDocument,
  cacheDocumentsList,
  getCachedCategories,
  getCachedDocument,
  getCachedDocumentsList,
  invalidateCategoriesCache,
  invalidateDocumentCache
} from "./documents.cache";
import { isSupportedDocumentMimeType } from "./documents.constants";
import {
  buildDocumentWhereInput,
  mapCategoryToDto,
  mapDocumentToDto,
  normalizeOptionalNullableText,
  normalizeOptionalText
} from "./documents.mapper";
import {
  DocumentCategoryDto,
  DocumentDto,
  DocumentsListResult,
  ListDocumentsInput,
  UpdateDocumentInput,
  UploadDocumentInput
} from "./documents.types";

const DOCUMENT_SELECT = {
  id: true,
  userId: true,
  name: true,
  description: true,
  categoryId: true,
  s3Key: true,
  s3Url: true,
  fileSize: true,
  fileType: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      color: true
    }
  }
} satisfies Prisma.DocumentSelect;

const NOTIFICATION_SELECT = {
  id: true,
  userId: true,
  type: true,
  title: true,
  message: true,
  read: true,
  createdAt: true
} satisfies Prisma.NotificationSelect;

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function buildS3Key(userId: string, originalName: string): string {
  const safeName = sanitizeFileName(originalName);
  return `documents/${userId}/${Date.now()}-${randomUUID()}-${safeName}`;
}

function toRealtimeDocumentPayload(document: DocumentDto): RealtimeDocumentPayload {
  return {
    documentId: document.id,
    userId: document.userId,
    name: document.name,
    category: document.category?.name ?? null,
    s3Url: document.s3Url,
    fileType: document.fileType,
    fileSize: document.fileSize,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
}

function toRealtimeNotificationPayload(notification: {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}): RealtimeNotificationPayload {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    createdAt: notification.createdAt.toISOString()
  };
}

async function createDocumentNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
}): Promise<void> {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message
    },
    select: NOTIFICATION_SELECT
  });

  emitNotification(toRealtimeNotificationPayload(notification));
}

async function validateCategory(categoryId: string | undefined): Promise<string | undefined> {
  const normalized = normalizeOptionalText(categoryId);

  if (!normalized) {
    return undefined;
  }

  const category = await prisma.category.findUnique({
    where: { id: normalized },
    select: { id: true }
  });

  if (!category) {
    throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
  }

  return category.id;
}

function ensureUploadIsValid(file: Express.Multer.File): void {
  if (!isSupportedDocumentMimeType(file.mimetype)) {
    throw new AppError("Unsupported file type", 400, "UNSUPPORTED_FILE_TYPE");
  }
}

export async function uploadDocument(input: UploadDocumentInput): Promise<DocumentDto> {
  ensureUploadIsValid(input.file);

  const categoryId = await validateCategory(input.categoryId);
  const key = buildS3Key(input.userId, input.file.originalname);

  try {
    await uploadBufferToS3({
      key,
      body: input.file.buffer,
      contentType: input.file.mimetype
    });
  } catch (error) {
    throw new AppError("Failed to upload file to S3", 502, "S3_UPLOAD_FAILED", {
      error: error instanceof Error ? error.message : String(error)
    });
  }

  const uploaded = await prisma.document.create({
    data: {
      userId: input.userId,
      name: normalizeOptionalText(input.name) ?? input.file.originalname,
      description: normalizeOptionalNullableText(input.description),
      categoryId,
      s3Key: key,
      s3Url: buildS3FileUrl(key),
      fileSize: input.file.size,
      fileType: input.file.mimetype
    },
    select: DOCUMENT_SELECT
  });

  const document = mapDocumentToDto(uploaded);

  await Promise.all([
    invalidateDocumentCache(input.userId, document.id),
    cacheDocument(document),
    createDocumentNotification({
      userId: input.userId,
      type: NotificationType.DOCUMENT_UPLOADED,
      title: "Document uploaded",
      message: `${document.name} was uploaded successfully`
    })
  ]);

  emitDocumentUploaded(toRealtimeDocumentPayload(document));

  return document;
}

export async function listDocuments(input: ListDocumentsInput): Promise<DocumentsListResult> {
  const search = normalizeOptionalText(input.search);
  const categoryId = normalizeOptionalText(input.categoryId);
  const cacheKey = buildDocumentListCacheKey({
    userId: input.userId,
    page: input.page,
    limit: input.limit,
    search,
    categoryId
  });

  const cached = await getCachedDocumentsList(cacheKey);

  if (cached) {
    return cached;
  }

  const where = buildDocumentWhereInput({
    userId: input.userId,
    search,
    categoryId
  });

  const [total, rows] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      orderBy: {
        createdAt: "desc"
      },
      select: DOCUMENT_SELECT
    })
  ]);

  const payload: DocumentsListResult = {
    items: rows.map(mapDocumentToDto),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.max(Math.ceil(total / input.limit), 1)
    }
  };

  await cacheDocumentsList(cacheKey, payload);

  return payload;
}

export async function getDocumentById(userId: string, documentId: string): Promise<DocumentDto> {
  const cached = await getCachedDocument(documentId);

  if (cached && cached.userId === userId) {
    return cached;
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: DOCUMENT_SELECT
  });

  if (!document || document.userId !== userId) {
    throw new AppError("Document not found", 404, "DOCUMENT_NOT_FOUND");
  }

  const dto = mapDocumentToDto(document);
  await cacheDocument(dto);

  return dto;
}

export async function getDocumentAccessUrl(userId: string, documentId: string): Promise<{ url: string; expiresInSeconds: number }> {
  const document = await getDocumentById(userId, documentId);
  const expiresInSeconds = env.S3_GET_URL_EXPIRES_IN_SECONDS;

  try {
    const url = await createPresignedGetObjectUrl(document.s3Key, expiresInSeconds);

    return {
      url,
      expiresInSeconds
    };
  } catch (error) {
    throw new AppError("Failed to generate document access URL", 502, "S3_ACCESS_URL_FAILED", {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function updateDocumentMetadata(input: UpdateDocumentInput): Promise<DocumentDto> {
  const existing = await prisma.document.findUnique({
    where: { id: input.documentId },
    select: DOCUMENT_SELECT
  });

  if (!existing || existing.userId !== input.userId) {
    throw new AppError("Document not found", 404, "DOCUMENT_NOT_FOUND");
  }

  const categoryId =
    input.categoryId === undefined
      ? undefined
      : input.categoryId === null
        ? null
        : await validateCategory(input.categoryId);

  const updated = await prisma.document.update({
    where: { id: input.documentId },
    data: {
      name: normalizeOptionalText(input.name),
      description: normalizeOptionalNullableText(input.description),
      categoryId
    },
    select: DOCUMENT_SELECT
  });

  const dto = mapDocumentToDto(updated);

  await Promise.all([
    invalidateDocumentCache(input.userId, input.documentId),
    cacheDocument(dto),
    createDocumentNotification({
      userId: input.userId,
      type: NotificationType.DOCUMENT_UPDATED,
      title: "Document updated",
      message: `${dto.name} metadata was updated`
    })
  ]);

  emitDocumentUpdated(toRealtimeDocumentPayload(dto));

  return dto;
}

export async function deleteDocument(userId: string, documentId: string): Promise<void> {
  const existing = await prisma.document.findUnique({
    where: { id: documentId },
    select: DOCUMENT_SELECT
  });

  if (!existing || existing.userId !== userId) {
    throw new AppError("Document not found", 404, "DOCUMENT_NOT_FOUND");
  }

  try {
    await deleteFileFromS3(existing.s3Key);
  } catch (error) {
    throw new AppError("Failed to delete file from S3", 502, "S3_DELETE_FAILED", {
      error: error instanceof Error ? error.message : String(error)
    });
  }

  await prisma.document.delete({
    where: { id: documentId }
  });

  await Promise.all([
    invalidateDocumentCache(userId, documentId),
    createDocumentNotification({
      userId,
      type: NotificationType.DOCUMENT_DELETED,
      title: "Document deleted",
      message: `${existing.name} was removed`
    })
  ]);

  emitDocumentDeleted({
    documentId,
    userId,
    deletedAt: new Date().toISOString()
  });
}

export async function listCategories(): Promise<DocumentCategoryDto[]> {
  const cached = await getCachedCategories();

  if (cached) {
    return cached;
  }

  const rows = await prisma.category.findMany({
    orderBy: {
      name: "asc"
    },
    select: {
      id: true,
      name: true,
      color: true
    }
  });

  const categories = rows.map(mapCategoryToDto);
  await cacheCategories(categories);

  return categories;
}

export async function createCategory(input: {
  requestUserId: string;
  name: string;
  color: string;
}): Promise<DocumentCategoryDto> {
  const requestUser = await prisma.user.findUnique({
    where: { id: input.requestUserId },
    select: {
      role: true
    }
  });

  if (!requestUser || requestUser.role !== UserRole.ADMIN) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  const category = await prisma.category.create({
    data: {
      name: input.name.trim(),
      color: input.color.trim()
    },
    select: {
      id: true,
      name: true,
      color: true
    }
  });

  await invalidateCategoriesCache();

  emitCategoryUpdated({
    id: category.id,
    name: category.name,
    color: category.color,
    action: "created"
  });

  return mapCategoryToDto(category);
}

export async function listUserNotifications(userId: string): Promise<RealtimeNotificationPayload[]> {
  const rows = await prisma.notification.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 50,
    select: NOTIFICATION_SELECT
  });

  return rows.map(toRealtimeNotificationPayload);
}

export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  const existing = await prisma.notification.findUnique({
    where: {
      id: notificationId
    },
    select: {
      id: true,
      userId: true
    }
  });

  if (!existing || existing.userId !== userId) {
    throw new AppError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");
  }

  await prisma.notification.update({
    where: {
      id: notificationId
    },
    data: {
      read: true
    }
  });
}
