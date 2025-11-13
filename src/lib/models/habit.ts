import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { habitFrequency } from "@/lib/schemas/habit";

const RatingDescriptionsSchema = new Schema(
  {
    good: { type: String, trim: true, default: "" },
    okay: { type: String, trim: true, default: "" },
    bad: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const HabitSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    ratingDescriptions: {
      type: RatingDescriptionsSchema,
      default: () => ({ good: "", okay: "", bad: "" }),
    },
    frequency: {
      type: String,
      enum: habitFrequency.options,
      required: true,
    },
    startDate: { type: Date },
  },
  {
    timestamps: true,
  },
);

export type HabitDocument = InferSchemaType<typeof HabitSchema>;

export const Habit =
  (models.Habit as Model<HabitDocument> | undefined) ??
  model<HabitDocument>("Habit", HabitSchema);

