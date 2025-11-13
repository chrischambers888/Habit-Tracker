import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
const EventSchema = new Schema(
  {
    day: { type: Date, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startTime: { type: String },
    endTime: { type: String },
    isCompleted: { type: Boolean, default: false },
    favoriteId: { type: Schema.Types.ObjectId, ref: "FavoriteEvent" },
  },
  {
    timestamps: true,
  },
);

EventSchema.index({ day: 1, startTime: 1 });

export type EventDocument = InferSchemaType<typeof EventSchema>;

export const Event =
  (models.Event as Model<EventDocument> | undefined) ??
  model<EventDocument>("Event", EventSchema);

