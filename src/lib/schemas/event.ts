import { z } from "zod";
import { timeStringSchema } from "./shared";

export const eventBaseSchema = z.object({
  day: z.coerce.date(),
  title: z.string().trim().min(1).max(120),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((value) => value ?? undefined),
  startTime: z
    .union([timeStringSchema, z.literal(""), z.null(), z.undefined()])
    .optional()
    .transform((value) => {
      if (!value || value === "" || value === null) return undefined;
      return value;
    }),
  endTime: z
    .union([timeStringSchema, z.literal(""), z.null(), z.undefined()])
    .optional()
    .transform((value) => {
      if (!value || value === "" || value === null) return undefined;
      return value;
    }),
  isCompleted: z.boolean().optional(),
  favoriteId: z.string().optional(),
});

export const eventCreateSchema = eventBaseSchema;

export const eventUpdateSchema = eventBaseSchema.partial();

export const eventResponseSchema = eventBaseSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type EventInput = z.infer<typeof eventCreateSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
export type EventResponse = z.infer<typeof eventResponseSchema>;

