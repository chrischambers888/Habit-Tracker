import { z } from "zod";

export const habitRating = z.enum(["bad", "okay", "good"]);

export const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:MM (24h) format");

