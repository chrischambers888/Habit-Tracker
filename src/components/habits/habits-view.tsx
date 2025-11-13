"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateHabitDialog } from "@/components/habits/create-habit-dialog";
import { HabitCard } from "@/components/habits/habit-card";
import { useHabits } from "@/hooks/use-habits";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HabitsView() {
  const { data: habits, isLoading } = useHabits();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "daily" | "weekly" | "monthly">("all");

  const filteredHabits = useMemo(() => {
    if (!habits) return [];

    return habits.filter((habit) => {
      const matchesSearch =
        habit.name.toLowerCase().includes(search.toLowerCase()) ||
        habit.description?.toLowerCase().includes(search.toLowerCase());

      const matchesFrequency = tab === "all" || habit.frequency === tab;

      return matchesSearch && matchesFrequency;
    });
  }, [habits, search, tab]);

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
        <CreateHabitDialog />
      </div>

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
        <Tabs
          value={tab}
          onValueChange={(value) =>
            setTab(value as typeof tab)
          }
          className="w-full md:w-auto"
        >
          <TabsList className="grid w-full grid-cols-4 md:w-auto md:grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-64 w-full" />
          ))}
        </div>
      ) : filteredHabits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <div className="space-y-2">
            <p className="text-lg font-medium">No habits yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first habit to start tracking or adjust your filters.
            </p>
          </div>
          <Button className="mt-6" onClick={() => setTab("all")}>
            Show all habits
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredHabits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </div>
      )}
    </div>
  );
}

