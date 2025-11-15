import { z } from "zod";

export const backlogItemBaseSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((value) => value ?? undefined),
  category: z
    .string()
    .trim()
    .max(60)
    .optional()
    .nullable()
    .transform((value) => value ?? undefined),
  isCompleted: z.boolean().optional(),
  order: z.number().optional(),
});

export const backlogItemCreateSchema = backlogItemBaseSchema;
export const backlogItemUpdateSchema = backlogItemBaseSchema.partial().extend({
  completedAt: z.coerce.date().nullable().optional(),
  order: z.number().optional(),
});

export const backlogItemResponseSchema = backlogItemBaseSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  completedAt: z.coerce.date().nullable().optional(),
  order: z.number().optional(),
});

export type BacklogItemInput = z.infer<typeof backlogItemCreateSchema>;
export type BacklogItemUpdateInput = z.infer<typeof backlogItemUpdateSchema>;
export type BacklogItemResponse = z.infer<typeof backlogItemResponseSchema>;

