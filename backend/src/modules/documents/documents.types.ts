export interface DocumentCategoryDto {
  id: string;
  name: string;
  color: string;
}

export interface DocumentDto {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  category: DocumentCategoryDto | null;
  s3Key: string;
  s3Url: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DocumentsListResult {
  items: DocumentDto[];
  pagination: DocumentsPagination;
}

export interface UploadDocumentInput {
  userId: string;
  file: Express.Multer.File;
  name?: string;
  description?: string;
  categoryId?: string;
}

export interface UpdateDocumentInput {
  userId: string;
  documentId: string;
  name?: string;
  description?: string | null;
  categoryId?: string | null;
}

export interface ListDocumentsInput {
  userId: string;
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
}
