import {
  ApiResponse,
  CategoriesData,
  DocumentAccessUrlData,
  DocumentCategory,
  DocumentItem,
  DocumentsListData,
  NotificationsData,
  RealtimeNotification
} from "@/types/auth";

import { apiClient } from "./api-client";

export interface ListDocumentsParams {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
}

export interface UploadDocumentPayload {
  file: File;
  name?: string;
  description?: string;
  categoryId?: string;
  onUploadProgress?: (percent: number) => void;
}

export interface UpdateDocumentPayload {
  name?: string;
  description?: string | null;
  categoryId?: string | null;
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized || undefined;
}

export async function uploadDocumentRequest(payload: UploadDocumentPayload): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append("file", payload.file);

  const name = normalizeOptionalString(payload.name);
  const description = normalizeOptionalString(payload.description);
  const categoryId = normalizeOptionalString(payload.categoryId);

  if (name) {
    formData.append("name", name);
  }

  if (description) {
    formData.append("description", description);
  }

  if (categoryId) {
    formData.append("categoryId", categoryId);
  }

  const response = await apiClient.post<ApiResponse<DocumentItem>>("/api/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    },
    onUploadProgress: (event) => {
      if (!payload.onUploadProgress || !event.total) {
        return;
      }

      const percent = Math.min(Math.round((event.loaded / event.total) * 100), 100);
      payload.onUploadProgress(percent);
    }
  });

  return response.data.data;
}

export async function listDocumentsRequest(params: ListDocumentsParams): Promise<DocumentsListData> {
  const response = await apiClient.get<ApiResponse<DocumentsListData>>("/api/documents", {
    params: {
      page: params.page,
      limit: params.limit,
      search: normalizeOptionalString(params.search),
      categoryId: normalizeOptionalString(params.categoryId)
    }
  });

  return response.data.data;
}

export async function updateDocumentRequest(documentId: string, payload: UpdateDocumentPayload): Promise<DocumentItem> {
  const response = await apiClient.put<ApiResponse<DocumentItem>>(`/api/documents/${documentId}`, payload);
  return response.data.data;
}

export async function deleteDocumentRequest(documentId: string): Promise<void> {
  await apiClient.delete(`/api/documents/${documentId}`);
}

export async function getDocumentAccessUrlRequest(documentId: string): Promise<DocumentAccessUrlData> {
  const response = await apiClient.get<ApiResponse<DocumentAccessUrlData>>(
    `/api/documents/${documentId}/access-url`
  );

  return response.data.data;
}

export async function listCategoriesRequest(): Promise<DocumentCategory[]> {
  const response = await apiClient.get<ApiResponse<CategoriesData>>("/api/categories");
  return response.data.data.categories;
}

export async function listNotificationsRequest(): Promise<RealtimeNotification[]> {
  const response = await apiClient.get<ApiResponse<NotificationsData>>("/api/notifications");
  return response.data.data.notifications;
}

export async function markNotificationReadRequest(notificationId: string): Promise<void> {
  await apiClient.patch(`/api/notifications/${notificationId}/read`);
}
