import { z } from "zod";

export const listDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  search: z.string().trim().max(150).optional(),
  categoryId: z.string().trim().min(1).optional()
});

export const uploadDocumentBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name cannot be empty")
    .max(150, "Name is too long")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(500, "Description is too long")
    .optional()
    .or(z.literal("")),
  categoryId: z.string().trim().min(1).optional().or(z.literal(""))
});

export const updateDocumentBodySchema = z
  .object({
    name: z.string().trim().min(1, "Name cannot be empty").max(150, "Name is too long").optional(),
    description: z.string().trim().max(500, "Description is too long").nullable().optional(),
    categoryId: z.string().trim().min(1).nullable().optional()
  })
  .refine((value) => value.name !== undefined || value.description !== undefined || value.categoryId !== undefined, {
    message: "At least one field is required"
  });

export type ListDocumentsQueryInput = z.infer<typeof listDocumentsQuerySchema>;
export type UploadDocumentBodyInput = z.infer<typeof uploadDocumentBodySchema>;
export type UpdateDocumentBodyInput = z.infer<typeof updateDocumentBodySchema>;
