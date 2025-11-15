import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const BacklogItemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, trim: true },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

BacklogItemSchema.index({ category: 1, isCompleted: 1 });

export type BacklogItemDocument = InferSchemaType<typeof BacklogItemSchema>;

export const BacklogItem =
  (models.BacklogItem as Model<BacklogItemDocument> | undefined) ??
  model<BacklogItemDocument>("BacklogItem", BacklogItemSchema);

