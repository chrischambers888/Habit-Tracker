"use client";

import { addDays, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventFormDialog } from "@/components/schedule/event-form-dialog";
import { EventList } from "@/components/schedule/event-list";
import { TimelineView } from "@/components/schedule/timeline-view";
import { BacklogPanel } from "@/components/schedule/backlog-panel";
import { FavoritesPanel } from "@/components/schedule/favorites-panel";
import {
  useNextDaySchedule,
  useTodaySchedule,
  useFavorites,
} from "@/hooks/use-schedule";
import { useMemo, useState } from "react";
import { List, GanttChart } from "lucide-react";

export function ScheduleView() {
  const { data: todaySchedule, isLoading: loadingToday } = useTodaySchedule();
  const { data: nextDaySchedule, isLoading: loadingNextDay } =
    useNextDaySchedule();
  const { data: favorites } = useFavorites();
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");

  const now = new Date();
  const nextDay = useMemo(() => addDays(new Date(), 1), []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
          <p className="text-sm text-muted-foreground">
            Plan today and tomorrow, with a backlog for everything else.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "timeline")}>
            <TabsList>
              <TabsTrigger value="list">
                <List className="mr-2 h-4 w-4" />
                List
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <GanttChart className="mr-2 h-4 w-4" />
                Timeline
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {todaySchedule && (
            <EventFormDialog
              label="Add today event"
              defaultDay={todaySchedule.day}
              favorites={favorites ?? []}
            />
          )}
          {nextDaySchedule && (
            <EventFormDialog
              variant="next"
              label="Plan tomorrow"
              defaultDay={nextDaySchedule.day}
              favorites={favorites ?? []}
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          {loadingToday || !todaySchedule ? (
            <Skeleton className="h-64 w-full" />
          ) : viewMode === "list" ? (
            <EventList
              title={`Today · ${format(todaySchedule.day, "EEEE, MMM d")}`}
              description={`Current time: ${format(now, "hh:mma")}`}
              day={todaySchedule.day}
              events={todaySchedule.events}
              favorites={favorites ?? []}
              emptyState={
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  Nothing scheduled yet. Use the button above to plan your day.
                </div>
              }
            />
          ) : (
            <TimelineView
              title={`Today · ${format(todaySchedule.day, "EEEE, MMM d")}`}
              description={`Current time: ${format(now, "hh:mma")}`}
              day={todaySchedule.day}
              events={todaySchedule.events}
              favorites={favorites ?? []}
              emptyState={
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  Nothing scheduled yet. Use the button above to plan your day.
                </div>
              }
            />
          )}

          {loadingNextDay || !nextDaySchedule ? (
            <Skeleton className="h-64 w-full" />
          ) : viewMode === "list" ? (
            <EventList
              title={`Tomorrow · ${format(
                nextDaySchedule.day,
                "EEEE, MMM d",
              )}`}
              description="Sketch out tomorrow so you can start focused."
              day={nextDaySchedule.day}
              events={nextDaySchedule.events}
              favorites={favorites ?? []}
              emptyState={
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  No plans yet. Add a few anchors to feel prepared.
                </div>
              }
            />
          ) : (
            <TimelineView
              title={`Tomorrow · ${format(
                nextDaySchedule.day,
                "EEEE, MMM d",
              )}`}
              description="Sketch out tomorrow so you can start focused."
              day={nextDaySchedule.day}
              events={nextDaySchedule.events}
              favorites={favorites ?? []}
              emptyState={
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  No plans yet. Add a few anchors to feel prepared.
                </div>
              }
            />
          )}
        </div>

        <div className="space-y-6">
          <div className="hidden lg:block">
            <FavoritesPanel today={todaySchedule?.day ?? new Date()} nextDay={nextDay} />
          </div>
          <BacklogPanel />
        </div>
      </div>
    </div>
  );
}

