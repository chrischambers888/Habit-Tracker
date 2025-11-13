import { describe, expect, it } from "vitest";
import {
  normalizeDay,
  normalizePeriodStart,
  dayRange,
} from "@/lib/dates";

describe("dates utilities", () => {
  const sampleDate = new Date("2025-03-15T15:45:00Z");

  describe("normalizeDay", () => {
    it("returns the start of the day", () => {
      const normalized = normalizeDay(sampleDate);
      expect(normalized.getHours()).toBe(0);
      expect(normalized.getMinutes()).toBe(0);
      expect(normalized.getSeconds()).toBe(0);
    });
  });

  describe("normalizePeriodStart", () => {
    it("normalizes daily frequency to start of day", () => {
      const normalized = normalizePeriodStart(sampleDate, "daily");
      expect(normalized.getHours()).toBe(0);
    });

    it("normalizes weekly frequency to Monday start", () => {
      const normalized = normalizePeriodStart(sampleDate, "weekly");
      expect(normalized.getUTCDay()).toBe(1);
    });

    it("normalizes monthly frequency to first day", () => {
      const normalized = normalizePeriodStart(sampleDate, "monthly");
      expect(normalized.getUTCDate()).toBe(1);
    });
  });

  describe("dayRange", () => {
    it("returns a range spanning 24 hours", () => {
      const range = dayRange(sampleDate);
      expect(range.end.getTime() - range.start.getTime()).toBe(24 * 60 * 60 * 1000);
    });
  });
});

