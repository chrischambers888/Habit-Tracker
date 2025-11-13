import { addDays, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import type { HabitDocument } from "./models/habit";

export function normalizePeriodStart(
  date: Date,
  frequency: HabitDocument["frequency"],
) {
  switch (frequency) {
    case "daily":
      return startOfDay(date);
    case "weekly":
      return startOfWeek(date, { weekStartsOn: 1 });
    case "monthly":
      return startOfMonth(date);
  }
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

