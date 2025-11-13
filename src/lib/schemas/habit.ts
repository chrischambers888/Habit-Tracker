import { z } from "zod";

export const habitFrequency = z.enum(["daily", "weekly", "monthly"]);

export const habitBaseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer")
    .optional()
    .nullable()
    .transform((value) => {
      if (!value) return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }),
  ratingDescriptions: z
    .object({
      good: z
        .string()
        .max(500)
        .optional()
        .nullable()
        .transform((value) => (value ? value.trim() : "")),
      okay: z
        .string()
        .max(500)
        .optional()
        .nullable()
        .transform((value) => (value ? value.trim() : "")),
      bad: z
        .string()
        .max(500)
        .optional()
        .nullable()
        .transform((value) => (value ? value.trim() : "")),
    })
    .default({ good: "", okay: "", bad: "" }),
  frequency: habitFrequency,
  startDate: z.coerce.date().optional(),
});

export const habitCreateSchema = habitBaseSchema;

export const habitUpdateSchema = habitBaseSchema.partial();

export const habitResponseSchema = habitBaseSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type HabitInput = z.infer<typeof habitCreateSchema>;
export type HabitUpdateInput = z.infer<typeof habitUpdateSchema>;
export type HabitResponse = z.infer<typeof habitResponseSchema>;

