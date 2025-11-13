import { addDays, startOfDay } from "date-fns";
import type { HabitDocument } from "./models/habit";
import { getPeriodStartUtc } from "./habit-period";

export function normalizePeriodStart(
  date: Date,
  frequency: HabitDocument["frequency"],
) {
  return getPeriodStartUtc(date, frequency);
}

export function normalizeDay(date: Date | string) {
  const instance = typeof date === "string" ? new Date(date) : date;
  return startOfDay(instance);
}

export function dayRange(date: Date | string) {
  const start = normalizeDay(date);
  const end = addDays(start, 1);
  return { start, end };
}

