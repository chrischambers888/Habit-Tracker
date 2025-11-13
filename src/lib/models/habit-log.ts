import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { habitRating } from "@/lib/schemas/shared";

const HabitLogSchema = new Schema(
  {
    habitId: {
      type: Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
    },
    periodStart: { type: Date, required: true },
    rating: {
      type: String,
      enum: habitRating.options,
      required: true,
    },
    comment: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);

HabitLogSchema.index({ habitId: 1, periodStart: 1 }, { unique: true });

export type HabitLogDocument = InferSchemaType<typeof HabitLogSchema>;

export const HabitLog =
  (models.HabitLog as Model<HabitLogDocument> | undefined) ??
  model<HabitLogDocument>("HabitLog", HabitLogSchema);

