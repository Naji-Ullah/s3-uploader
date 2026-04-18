import { Prisma } from "@prisma/client";

import { DocumentCategoryDto, DocumentDto } from "./documents.types";

interface CategoryShape {
  id: string;
  name: string;
  color: string;
}

export type DocumentWithCategory = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  s3Key: string;
  s3Url: string;
  fileSize: number;
  fileType: string;
  createdAt: Date;
  updatedAt: Date;
  category: CategoryShape | null;
};

export function mapCategoryToDto(category: CategoryShape): DocumentCategoryDto {
  return {
    id: category.id,
    name: category.name,
    color: category.color
  };
}

export function mapDocumentToDto(document: DocumentWithCategory): DocumentDto {
  return {
    id: document.id,
    userId: document.userId,
    name: document.name,
    description: document.description,
    category: document.category ? mapCategoryToDto(document.category) : null,
    s3Key: document.s3Key,
    s3Url: document.s3Url,
    fileSize: document.fileSize,
    fileType: document.fileType,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}

export function normalizeOptionalText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

export function normalizeOptionalNullableText(value: string | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

export function buildDocumentWhereInput(input: {
  userId: string;
  search?: string;
  categoryId?: string;
}): Prisma.DocumentWhereInput {
  return {
    userId: input.userId,
    ...(input.search
      ? {
          name: {
            contains: input.search,
            mode: "insensitive"
          }
        }
      : null),
    ...(input.categoryId
      ? {
          categoryId: input.categoryId
        }
      : null)
  };
}
