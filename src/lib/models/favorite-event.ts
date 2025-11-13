import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
const FavoriteEventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startTime: { type: String },
    endTime: { type: String },
  },
  {
    timestamps: true,
  },
);

FavoriteEventSchema.index({ title: 1 }, { unique: false });

export type FavoriteEventDocument = InferSchemaType<typeof FavoriteEventSchema>;

export const FavoriteEvent =
  (models.FavoriteEvent as Model<FavoriteEventDocument> | undefined) ??
  model<FavoriteEventDocument>("FavoriteEvent", FavoriteEventSchema);

