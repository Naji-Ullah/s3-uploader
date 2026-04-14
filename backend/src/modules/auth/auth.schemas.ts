import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must have at least 8 characters")
  .max(72, "Password is too long");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80, "Name is too long"),
  email: z.string().trim().email("Invalid email"),
  password: passwordSchema
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Password is required")
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required")
});
