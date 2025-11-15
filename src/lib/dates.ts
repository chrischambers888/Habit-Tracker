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
  // Normalize to UTC midnight for the date
  // Always use local date components to ensure consistency:
  // - When creating events, dates come from the form as local dates
  // - When querying, we create local dates for "today"/"tomorrow"
  // - This ensures the same local date always maps to the same UTC date
  // - Even if a UTC date is passed, we interpret it in local timezone for consistency
  return new Date(
    Date.UTC(
      instance.getFullYear(),
      instance.getMonth(),
      instance.getDate()
    )
  );
}

export function dayRange(date: Date | string) {
  const start = normalizeDay(date);
  const end = addDays(start, 1);
  return { start, end };
}

