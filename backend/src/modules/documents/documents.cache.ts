import { safeRedisDel, safeRedisDeleteByPattern, safeRedisGetJson, safeRedisSetJson } from "../../lib/redis";
import {
  CATEGORY_LIST_CACHE_TTL_SECONDS,
  DOCUMENT_ITEM_CACHE_TTL_SECONDS,
  DOCUMENT_LIST_CACHE_TTL_SECONDS
} from "./documents.constants";
import { DocumentCategoryDto, DocumentDto, DocumentsListResult } from "./documents.types";

const DOCUMENT_LIST_KEY_PREFIX = "documents:list:";
const DOCUMENT_KEY_PREFIX = "documents:item:";
const CATEGORIES_KEY = "documents:categories:all";

function normalizeSearch(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

export function buildDocumentListCacheKey(input: {
  userId: string;
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
}): string {
  const search = normalizeSearch(input.search);
  const category = input.categoryId?.trim() ?? "all";

  return `${DOCUMENT_LIST_KEY_PREFIX}${input.userId}:page=${input.page}:limit=${input.limit}:search=${encodeURIComponent(search)}:category=${encodeURIComponent(category)}`;
}

export function buildDocumentItemCacheKey(documentId: string): string {
  return `${DOCUMENT_KEY_PREFIX}${documentId}`;
}

export async function getCachedDocumentsList(cacheKey: string): Promise<DocumentsListResult | null> {
  return safeRedisGetJson<DocumentsListResult>(cacheKey);
}

export async function cacheDocumentsList(cacheKey: string, payload: DocumentsListResult): Promise<void> {
  await safeRedisSetJson(cacheKey, payload, DOCUMENT_LIST_CACHE_TTL_SECONDS);
}

export async function getCachedDocument(documentId: string): Promise<DocumentDto | null> {
  return safeRedisGetJson<DocumentDto>(buildDocumentItemCacheKey(documentId));
}

export async function cacheDocument(document: DocumentDto): Promise<void> {
  await safeRedisSetJson(buildDocumentItemCacheKey(document.id), document, DOCUMENT_ITEM_CACHE_TTL_SECONDS);
}

export async function invalidateDocumentCache(userId: string, documentId: string): Promise<void> {
  await Promise.all([
    safeRedisDel(buildDocumentItemCacheKey(documentId)),
    safeRedisDeleteByPattern(`${DOCUMENT_LIST_KEY_PREFIX}${userId}:*`)
  ]);
}

export async function getCachedCategories(): Promise<DocumentCategoryDto[] | null> {
  return safeRedisGetJson<DocumentCategoryDto[]>(CATEGORIES_KEY);
}

export async function cacheCategories(categories: DocumentCategoryDto[]): Promise<void> {
  await safeRedisSetJson(CATEGORIES_KEY, categories, CATEGORY_LIST_CACHE_TTL_SECONDS);
}

export async function invalidateCategoriesCache(): Promise<void> {
  await safeRedisDel(CATEGORIES_KEY);
}
