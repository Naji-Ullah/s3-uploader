import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80, "Name is too long"),
  color: z
    .string()
    .trim()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Color must be a valid hex code")
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
