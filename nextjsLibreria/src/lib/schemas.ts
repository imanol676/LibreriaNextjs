import { z } from "zod";

// Schema for book authors array
export const authorsSchema = z.array(z.string()).optional().default([]);

// Schema for book categories array
export const categoriesSchema = z.array(z.string()).optional().default([]);

// Comprehensive book schema for validation
export const bookCreateSchema = z.object({
  id: z.string().min(1, "Book ID is required"),
  title: z.string().min(1, "Title is required"),
  authors: authorsSchema,
  thumbnailUrl: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  pageCount: z.number().positive().optional().nullable(),
  categories: categoriesSchema,
  publishedDate: z.string().optional().nullable(),
});

// Schema for book update operations
export const bookUpdateSchema = bookCreateSchema.partial().extend({
  id: z.string().min(1, "Book ID is required"),
});

// Review creation schema with enhanced validation
export const reviewCreateSchema = z.object({
  googleId: z.string().min(1, "Google ID is required"),
  title: z.string().min(1, "Book title is required"),
  authors: z
    .union([z.array(z.string()), z.string()])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .default([]),
  thumbnail: z.string().url().optional().nullable(),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  content: z
    .string()
    .min(3, "Review must be at least 3 characters")
    .max(5000, "Review cannot exceed 5000 characters"),
});

export type BookCreate = z.infer<typeof bookCreateSchema>;
export type BookUpdate = z.infer<typeof bookUpdateSchema>;
export type ReviewCreate = z.infer<typeof reviewCreateSchema>;
