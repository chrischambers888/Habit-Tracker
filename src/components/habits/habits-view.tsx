"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateHabitDialog } from "@/components/habits/create-habit-dialog";
import { BulkLogHabitsDialog } from "@/components/habits/bulk-log-habits-dialog";
import { HabitCard } from "@/components/habits/habit-card";
import { HabitsOverview } from "@/components/habits/habits-overview";
import { useHabits } from "@/hooks/use-habits";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HabitResponse } from "@/lib/schemas/habit";

const frequencyOrder: HabitResponse["frequency"][] = [
  "daily",
  "weekly",
  "monthly",
];

export function HabitsView() {
  const { data: habits, isLoading } = useHabits();
  const [search, setSearch] = useState("");

  const filteredAndGroupedHabits = useMemo(() => {
    if (!habits) return { daily: [], weekly: [], monthly: [] };

    // Filter by search
    const filtered = habits.filter((habit) => {
      const matchesSearch =
        habit.name.toLowerCase().includes(search.toLowerCase()) ||
        habit.description?.toLowerCase().includes(search.toLowerCase());

      return matchesSearch;
    });

    // Group by frequency
    const grouped = {
      daily: filtered.filter((h) => h.frequency === "daily"),
      weekly: filtered.filter((h) => h.frequency === "weekly"),
      monthly: filtered.filter((h) => h.frequency === "monthly"),
    };

    return grouped;
  }, [habits, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Habit Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your habits and visualize progress over time.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <BulkLogHabitsDialog />
          <CreateHabitDialog />
        </div>
      </div>

      {/* Overview Widget */}
      <HabitsOverview />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search habits..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-64 w-full" />
          ))}
        </div>
      ) : (
        <>
          {frequencyOrder.map((frequency) => {
            const habitsInGroup = filteredAndGroupedHabits[frequency];
            if (habitsInGroup.length === 0) return null;

            return (
              <div key={frequency} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold capitalize">
                    {frequency} Habits
                  </h2>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-sm text-muted-foreground">
                    {habitsInGroup.length}{" "}
                    {habitsInGroup.length === 1 ? "habit" : "habits"}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {habitsInGroup.map((habit) => (
                    <HabitCard key={habit.id} habit={habit} />
                  ))}
                </div>
              </div>
            );
          })}

          {Object.values(filteredAndGroupedHabits).every(
            (group) => group.length === 0
          ) && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
              <div className="space-y-2">
                <p className="text-lg font-medium">No habits found</p>
                <p className="text-sm text-muted-foreground">
                  {habits && habits.length > 0
                    ? "Try adjusting your search filters."
                    : "Create your first habit to start tracking."}
                </p>
              </div>
              {habits && habits.length === 0 && (
                <div className="mt-6">
                  <CreateHabitDialog />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
