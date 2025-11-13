import { endOfMonth, endOfWeek, format } from "date-fns";
import type { HabitResponse } from "@/lib/schemas/habit";
import type { HabitLogResponse } from "@/lib/schemas/habit-log";

export type HabitFrequency = HabitResponse["frequency"];

export const WEEK_START = 1;

export const habitFrequencyLabels: Record<HabitFrequency, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
};

function ensureDate(date: Date | string | number): Date {
  if (date instanceof Date) {
    return date;
  }

  if (typeof date === "string" || typeof date === "number") {
    return new Date(date);
  }

  return new Date();
}

export function normalizePeriodStart(
  dateInput: Date | string | number,
  frequency: HabitFrequency
) {
  return getPeriodStartLocal(dateInput, frequency);
}

export function getPeriodRange(
  dateInput: Date | string | number,
  frequency: HabitFrequency
) {
  const start = normalizePeriodStart(dateInput, frequency);

  switch (frequency) {
    case "weekly":
      return {
        start,
        end: endOfWeek(start, { weekStartsOn: WEEK_START }),
      };
    case "monthly":
      return {
        start,
        end: endOfMonth(start),
      };
    case "daily":
    default:
      return { start, end: start };
  }
}

export function formatPeriodLabel(
  dateInput: Date | string | number,
  frequency: HabitFrequency
) {
  const { start, end } = getPeriodRange(dateInput, frequency);

  switch (frequency) {
    case "weekly": {
      const sameMonth = start.getMonth() === end.getMonth();
      const sameYear = start.getFullYear() === end.getFullYear();

      const startLabel = format(start, "MMM d");
      const endLabel = sameMonth
        ? format(end, "d")
        : sameYear
        ? format(end, "MMM d")
        : format(end, "MMM d, yyyy");

      const suffix = sameYear ? format(end, ", yyyy") : "";

      return `Week of ${startLabel} – ${endLabel}${suffix}`;
    }
    case "monthly":
      return format(start, "MMMM yyyy");
    case "daily":
    default:
      return format(start, "MMM d, yyyy");
  }
}

export function formatPeriodAxisLabel(
  dateInput: Date | string | number,
  frequency: HabitFrequency
) {
  const { start } = getPeriodRange(dateInput, frequency);

  switch (frequency) {
    case "monthly":
      return format(start, "MMM yyyy");
    case "weekly":
      return format(start, "MMM d");
    case "daily":
    default:
      return format(start, "MMM d");
  }
}

export function getCurrentPeriodStart(
  frequency: HabitFrequency,
  referenceDate: Date = new Date()
) {
  return normalizePeriodStart(referenceDate, frequency);
}

export function isDateWithinPeriod(
  dateInput: Date | string | number,
  frequency: HabitFrequency,
  referenceDate: Date = new Date()
) {
  const { start, end } = getPeriodRange(referenceDate, frequency);
  const date = normalizePeriodStart(dateInput, frequency);
  return date >= start && date <= end;
}

export function isLogForPeriod(
  logPeriodStart: Date | string | number,
  frequency: HabitFrequency,
  referenceDate: Date = new Date()
) {
  const logKey = getPeriodStartKey(logPeriodStart, frequency);
  const currentKey = getPeriodStartKey(referenceDate, frequency);
  return logKey === currentKey;
}

export function hasLogForPeriod(
  logs: HabitLogResponse[] | undefined,
  frequency: HabitFrequency,
  referenceDate: Date = new Date()
) {
  if (!logs?.length) return false;
  const currentKey = getPeriodStartKey(referenceDate, frequency);
  return logs.some(
    (log) => getPeriodStartKey(log.periodStart, frequency) === currentKey
  );
}

export function isHabitActiveThisPeriod(
  habit: Pick<HabitResponse, "frequency" | "startDate">,
  referenceDate: Date = new Date()
) {
  if (!habit.startDate) return true;
  const { end } = getPeriodRange(referenceDate, habit.frequency);
  return habit.startDate <= end;
}

function normalizePeriodStartUtc(
  dateInput: Date | string | number,
  frequency: HabitFrequency
) {
  const date = ensureDate(dateInput);

  switch (frequency) {
    case "weekly": {
      const utcDay = date.getUTCDay();
      const diff = (utcDay + 6) % 7;
      return new Date(
        Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate() - diff
        )
      );
    }
    case "monthly":
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    case "daily":
    default:
      return new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
      );
  }
}

export function getPeriodStartUtc(
  dateInput: Date | string | number,
  frequency: HabitFrequency
) {
  return normalizePeriodStartUtc(dateInput, frequency);
}

function getPeriodStartLocal(
  dateInput: Date | string | number,
  frequency: HabitFrequency
) {
  const utcStart = getPeriodStartUtc(dateInput, frequency);
  return new Date(
    utcStart.getUTCFullYear(),
    utcStart.getUTCMonth(),
    utcStart.getUTCDate()
  );
}

export function getPeriodStartKey(
  dateInput: Date | string | number,
  frequency: HabitFrequency
) {
  return getPeriodStartUtc(dateInput, frequency).toISOString();
}
