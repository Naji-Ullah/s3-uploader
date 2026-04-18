export const MAX_DOCUMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const SUPPORTED_DOCUMENT_MIME_TYPES = new Set<string>([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/png",
  "image/jpeg"
]);

export const DOCUMENT_LIST_CACHE_TTL_SECONDS = 60 * 5;
export const DOCUMENT_ITEM_CACHE_TTL_SECONDS = 60 * 10;
export const CATEGORY_LIST_CACHE_TTL_SECONDS = 60 * 60;

export function isSupportedDocumentMimeType(mimeType: string): boolean {
  return SUPPORTED_DOCUMENT_MIME_TYPES.has(mimeType.toLowerCase());
}
