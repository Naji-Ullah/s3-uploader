import { Request, Response } from "express";

import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-error";
import {
  createCategory,
  deleteDocument,
  getDocumentAccessUrl,
  getDocumentById,
  listCategories,
  listDocuments,
  listUserNotifications,
  markNotificationAsRead,
  updateDocumentMetadata,
  uploadDocument
} from "./documents.service";
import { ListDocumentsQueryInput, UpdateDocumentBodyInput, UploadDocumentBodyInput } from "./documents.schemas";

function requireUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  return req.user.id;
}

export const uploadDocumentController = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const body = req.body as UploadDocumentBodyInput;

  if (!req.file) {
    throw new AppError("No file uploaded", 400, "FILE_REQUIRED");
  }

  const document = await uploadDocument({
    userId,
    file: req.file,
    name: body.name,
    description: body.description,
    categoryId: body.categoryId
  });

  res.status(201).json({
    success: true,
    message: "Document uploaded",
    data: document
  });
});

export const listDocumentsController = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const query = req.query as unknown as ListDocumentsQueryInput;

  const documents = await listDocuments({
    userId,
    page: query.page,
    limit: query.limit,
    search: query.search,
    categoryId: query.categoryId
  });

  res.status(200).json({
    success: true,
    message: "Documents fetched",
    data: documents
  });
});

export const getDocumentController = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const documentId = req.params.id;

  if (!documentId) {
    throw new AppError("Document id is required", 400, "VALIDATION_ERROR");
  }

  const document = await getDocumentById(userId, documentId);

  res.status(200).json({
    success: true,
    message: "Document fetched",
    data: document
  });
});

export const getDocumentAccessUrlController = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const documentId = req.params.id;

  if (!documentId) {
    throw new AppError("Document id is required", 400, "VALIDATION_ERROR");
  }

  const access = await getDocumentAccessUrl(userId, documentId);

  res.status(200).json({
    success: true,
    message: "Document access URL generated",
    data: access
  });
});

export const updateDocumentController = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const documentId = req.params.id;
  const body = req.body as UpdateDocumentBodyInput;

  if (!documentId) {
    throw new AppError("Document id is required", 400, "VALIDATION_ERROR");
  }

  const document = await updateDocumentMetadata({
    userId,
    documentId,
    name: body.name,
    description: body.description,
    categoryId: body.categoryId
  });

  res.status(200).json({
    success: true,
    message: "Document updated",
    data: document
  });
});

export const deleteDocumentController = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const documentId = req.params.id;

  if (!documentId) {
    throw new AppError("Document id is required", 400, "VALIDATION_ERROR");
  }

  await deleteDocument(userId, documentId);

  res.status(200).json({
    success: true,
    message: "Document deleted"
  });
});

export const listCategoriesController = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await listCategories();

  res.status(200).json({
    success: true,
    message: "Categories fetched",
    data: {
      categories
    }
  });
});

export const createCategoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const body = req.body as { name: string; color: string };

    const category = await createCategory({
      requestUserId: userId,
      name: body.name,
      color: body.color
    });

    res.status(201).json({
      success: true,
      message: "Category created",
      data: category
    });
  }
);

export const listNotificationsController = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const notifications = await listUserNotifications(userId);

  res.status(200).json({
    success: true,
    message: "Notifications fetched",
    data: {
      notifications
    }
  });
});

export const markNotificationAsReadController = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const notificationId = req.params.id;

  if (!notificationId) {
    throw new AppError("Notification id is required", 400, "VALIDATION_ERROR");
  }

  await markNotificationAsRead(userId, notificationId);

  res.status(200).json({
    success: true,
    message: "Notification marked as read"
  });
});
