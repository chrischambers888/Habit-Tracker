import { z } from "zod";
import { timeStringSchema } from "./shared";

export const favoriteEventBaseSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((value) => value ?? undefined),
  startTime: timeStringSchema.optional(),
  endTime: timeStringSchema.optional(),
});

export const favoriteEventCreateSchema = favoriteEventBaseSchema;
export const favoriteEventUpdateSchema = favoriteEventBaseSchema.partial();

export const favoriteEventResponseSchema = favoriteEventBaseSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type FavoriteEventInput = z.infer<typeof favoriteEventCreateSchema>;
export type FavoriteEventUpdateInput = z.infer<
  typeof favoriteEventUpdateSchema
>;
export type FavoriteEventResponse = z.infer<typeof favoriteEventResponseSchema>;

