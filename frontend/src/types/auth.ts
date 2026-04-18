export interface ApiResponse<TData> {
  success: boolean;
  message: string;
  data: TData;
  code?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface AuthPayload {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface StoredAuth {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface DashboardData {
  message: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: unknown;
}

export interface DocumentCategory {
  id: string;
  name: string;
  color: string;
}

export interface DocumentItem {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  category: DocumentCategory | null;
  s3Key: string;
  s3Url: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAccessUrlData {
  url: string;
  expiresInSeconds: number;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DocumentsListData {
  items: DocumentItem[];
  pagination: PaginationData;
}

export interface NotificationsData {
  notifications: RealtimeNotification[];
}

export interface CategoriesData {
  categories: DocumentCategory[];
}

export interface RealtimeDocumentEvent {
  documentId: string;
  userId: string;
  name: string;
  category: string | null;
  s3Url: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface RealtimeDeletedDocumentEvent {
  documentId: string;
  userId: string;
  deletedAt: string;
}

export interface RealtimeNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface RealtimeConnectionStatus {
  status: "connected" | "disconnected" | "error";
  timestamp?: string;
}
