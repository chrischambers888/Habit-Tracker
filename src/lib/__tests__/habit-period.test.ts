import { describe, expect, it } from "vitest";

import {
  getPeriodStartKey,
  getPeriodStartUtc,
  hasLogForPeriod,
  normalizePeriodStart,
} from "@/lib/habit-period";
import type { HabitLogResponse } from "@/lib/schemas/habit-log";

describe("habit-period utils", () => {
  it("produces identical period keys regardless of local timezone", () => {
    const localMidnight = new Date("2025-03-15T00:00:00-0500");
    const canonical = getPeriodStartUtc(localMidnight, "daily");

    const fromLocalKey = getPeriodStartKey(localMidnight, "daily");
    const fromCanonicalKey = getPeriodStartKey(canonical, "daily");

    expect(fromLocalKey).toBe("2025-03-15T00:00:00.000Z");
    expect(fromLocalKey).toBe(fromCanonicalKey);
  });

  it("detects an existing log for the same weekly period across timezones", () => {
    const referenceDate = new Date("2025-03-15T12:00:00-0500"); // Saturday
    const storedPeriodStart = getPeriodStartUtc(referenceDate, "weekly");

    const logs = [
      {
        periodStart: storedPeriodStart,
      } as HabitLogResponse,
    ];

    expect(hasLogForPeriod(logs, "weekly", referenceDate)).toBe(true);
  });

  it("returns local midnight when normalizing a canonical period start", () => {
    const canonical = new Date("2025-03-15T00:00:00.000Z");
    const normalized = normalizePeriodStart(canonical, "daily");

    expect(normalized.getHours()).toBe(0);
    expect(normalized.getFullYear()).toBe(2025);
    expect(normalized.getMonth()).toBe(2);
    expect(normalized.getDate()).toBe(15);
  });
});


