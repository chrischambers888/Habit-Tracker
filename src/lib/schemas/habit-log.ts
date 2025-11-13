import { z } from "zod";
import { habitRating } from "./shared";

export const habitLogBaseSchema = z.object({
  habitId: z.string().min(1, "Habit id is required"),
  periodStart: z.coerce.date(),
  rating: habitRating,
  comment: z
    .string()
    .trim()
    .max(500, "Comment must be 500 characters or fewer")
    .optional()
    .nullable()
    .transform((value) => value ?? undefined),
});

export const habitLogCreateSchema = habitLogBaseSchema;
export const habitLogResponseSchema = habitLogBaseSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export const habitLogUpdateSchema = habitLogBaseSchema.partial({
  habitId: true,
  periodStart: true,
  rating: true,
  comment: true,
});

export type HabitLogInput = z.infer<typeof habitLogCreateSchema>;
export type HabitLogResponse = z.infer<typeof habitLogResponseSchema>;
export type HabitLogUpdateInput = z.infer<typeof habitLogUpdateSchema>;

