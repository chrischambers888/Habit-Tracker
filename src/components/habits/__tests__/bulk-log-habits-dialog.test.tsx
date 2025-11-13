import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { BulkLogHabitsDialog } from "@/components/habits/bulk-log-habits-dialog";
import type { HabitResponse } from "@/lib/schemas/habit";

const sampleHabits: HabitResponse[] = [
  {
    id: "habit-1",
    name: "Meditate",
    description: "Morning meditation",
    frequency: "daily",
    ratingDescriptions: { good: "", okay: "", bad: "" },
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "habit-2",
    name: "Workout",
    description: "Gym session",
    frequency: "daily",
    ratingDescriptions: { good: "", okay: "", bad: "" },
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "habit-3",
    name: "Read",
    description: "Read 20 pages",
    frequency: "daily",
    ratingDescriptions: { good: "", okay: "", bad: "" },
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
];

const mockMutateAsync = vi.fn();

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  // @ts-expect-error – test environment polyfill
  global.ResizeObserver = ResizeObserverMock;
});

vi.mock("@/hooks/use-habits", () => ({
  useHabits: () => ({
    data: sampleHabits,
    isLoading: false,
  }),
  useBulkUpsertHabitLogs: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<
    Record<string, unknown>
  >("@tanstack/react-query");

  return {
    ...actual,
    useQueries: () =>
      sampleHabits.map(() => ({
        data: [],
        status: "success",
      })),
  };
});

describe("BulkLogHabitsDialog", () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue(
      sampleHabits.map((habit) => ({
        habitId: habit.id,
        log: {
          id: `log-${habit.id}`,
          habitId: habit.id,
          periodStart: new Date(),
          rating: "good",
          comment: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })),
    );
  });

  it("submits selected habits when the form is submitted", async () => {
    render(<BulkLogHabitsDialog />);

    fireEvent.click(screen.getByRole("button", { name: /quick log habits/i }));

    const submitButton = await screen.findByRole("button", {
      name: /log 3 habits/i,
    });
    const form = submitButton.closest("form");
    expect(form).not.toBeNull();

    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });

    const entries = mockMutateAsync.mock.calls[0][0];
    expect(entries).toHaveLength(3);
    entries.forEach((entry: any, index: number) => {
      expect(entry.habitId).toBe(sampleHabits[index].id);
      expect(entry.input.periodStart instanceof Date).toBe(true);
    });
  });
});


