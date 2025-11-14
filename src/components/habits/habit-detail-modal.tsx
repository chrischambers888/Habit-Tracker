"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { LogHabitDialog } from "@/components/habits/log-habit-dialog";
import { HabitEditorDialog } from "@/components/habits/habit-editor-dialog";
import { Calendar as CalendarIcon, List } from "lucide-react";
import {
  useHabitLogs,
  useDeleteHabit,
  useDeleteHabitLog,
} from "@/hooks/use-habits";
import type { HabitLogResponse } from "@/lib/schemas/habit-log";
import type { HabitResponse } from "@/lib/schemas/habit";
import { toast } from "@/hooks/use-toast";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  habitRatingLabels,
  habitRatingOrder,
  habitRatingStyles,
  habitRatingColors,
} from "@/lib/constants/habit-rating";
import {
  formatPeriodAxisLabel,
  formatPeriodLabel,
  normalizePeriodStart,
} from "@/lib/habit-period";

const ratingValue = {
  bad: 0,
  okay: 1,
  good: 2,
};

const ratingBackgrounds: {
  key: keyof typeof habitRatingStyles;
  y1: number;
  y2: number;
}[] = [
  { key: "bad", y1: -0.25, y2: 0.5 },
  { key: "okay", y1: 0.5, y2: 1.5 },
  { key: "good", y1: 1.5, y2: 2.25 },
];

const chartConfig = {
  rating: {
    label: "Rating",
    color: habitRatingColors.good.solid,
  },
  average: {
    label: "Average",
    color: habitRatingColors.okay.solid,
  },
};

type HabitDetailModalProps = {
  habit: HabitResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HabitDetailModal({
  habit,
  open,
  onOpenChange,
}: HabitDetailModalProps) {
  const deleteHabit = useDeleteHabit();
  const { data: logs, isLoading } = useHabitLogs(habit.id);
  const deleteHabitLog = useDeleteHabitLog(habit.id);

  const ratingDescriptionsList = habitRatingOrder.map((key) => ({
    key,
    label: habitRatingLabels[key],
    text: habit.ratingDescriptions?.[key] ?? "",
  }));

  const hasRatingDescriptions = ratingDescriptionsList.some(
    (item) => item.text.trim().length > 0
  );

  const averageRatingValue =
    logs && logs.length > 0
      ? logs.reduce((sum, log) => sum + ratingValue[log.rating], 0) /
        logs.length
      : null;

  const averageRatingKey =
    averageRatingValue != null
      ? habitRatingOrder[Math.round(averageRatingValue) as 0 | 1 | 2] ?? "okay"
      : null;

  const chartData =
    logs?.map((log) => {
      const periodStart = normalizePeriodStart(
        log.periodStart,
        habit.frequency
      );

      return {
        id: log.id,
        axisLabel: formatPeriodAxisLabel(periodStart, habit.frequency),
        periodLabel: formatPeriodLabel(periodStart, habit.frequency),
        rating: ratingValue[log.rating],
        ratingKey: log.rating,
        ratingLabel: habitRatingLabels[log.rating],
        comment: log.comment,
      };
    }) ?? [];

  const gradientId = React.useId();

  const gradientStops = React.useMemo(() => {
    if (!chartData.length) {
      return [];
    }

    if (chartData.length === 1) {
      const color = habitRatingColors[chartData[0].ratingKey].solid;
      return [
        { offset: "0%", color },
        { offset: "100%", color },
      ];
    }

    const lastIndex = chartData.length - 1;
    return chartData.map((entry, index) => ({
      offset: `${(index / lastIndex) * 100}%`,
      color: habitRatingColors[entry.ratingKey].solid,
    }));
  }, [chartData]);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete habit "${habit.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteHabit.mutateAsync(habit.id);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Unable to delete habit",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  };

  const handleDeleteLog = async (logId: string) => {
    const confirmed = window.confirm("Delete this log? This cannot be undone.");
    if (!confirmed) return;
    try {
      await deleteHabitLog.mutateAsync(logId);
    } catch (error) {
      toast({
        title: "Unable to delete log",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  };

  const allLogsReversed = logs ? [...logs].reverse() : [];
  const [viewMode, setViewMode] = React.useState<"list" | "calendar">("list");

  // Create a map of dates to logs for the calendar
  const logsByDate = React.useMemo(() => {
    if (!logs || logs.length === 0)
      return new Map<string, Array<HabitLogResponse>>();

    const map = new Map<string, Array<HabitLogResponse>>();
    logs.forEach((log) => {
      const periodStart = normalizePeriodStart(
        log.periodStart,
        habit.frequency
      );
      const dateKey = periodStart.toISOString().split("T")[0]; // YYYY-MM-DD

      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      const existingLogs = map.get(dateKey);
      if (existingLogs) {
        existingLogs.push(log);
      }
    });

    return map;
  }, [logs, habit.frequency]);

  // Get dates with logs for calendar highlighting
  const datesWithLogs = React.useMemo(() => {
    return Array.from(logsByDate.keys()).map((dateStr) => new Date(dateStr));
  }, [logsByDate]);

  // Get logs for a selected date
  const getLogsForDate = (date: Date) => {
    const dateKey = date.toISOString().split("T")[0];
    return logsByDate.get(dateKey) ?? [];
  };

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    undefined
  );
  const selectedDateLogs = selectedDate ? getLogsForDate(selectedDate) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
          <DialogTitle>{habit.name}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full px-6">
            <div className="space-y-6 pb-6">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-semibold">
                        {habit.name}
                      </CardTitle>
                      <HabitEditorDialog
                        habit={habit}
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit habit</span>
                          </Button>
                        }
                      />
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {ratingDescriptionsList.map((item) => (
                        <p
                          key={item.key}
                          className="flex items-start gap-2 whitespace-pre-line text-sm"
                        >
                          <span
                            className={cn(
                              "flex min-w-[5rem] items-center gap-1 font-medium",
                              habitRatingStyles[item.key].text
                            )}
                          >
                            <span
                              className={cn(
                                "h-2.5 w-2.5 rounded-full",
                                habitRatingStyles[item.key].dot
                              )}
                            />
                            {item.label}:
                          </span>
                          <span className="flex-1 text-muted-foreground">
                            {item.text.trim().length > 0 ? item.text : "—"}
                          </span>
                        </p>
                      ))}
                    </div>
                    {habit.description ? (
                      <CardDescription>{habit.description}</CardDescription>
                    ) : hasRatingDescriptions ? null : (
                      <CardDescription className="capitalize">
                        {habit.frequency} habit
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={handleDelete}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete habit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="capitalize">
                      {habit.frequency}
                    </Badge>
                    {averageRatingKey ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          habitRatingStyles[averageRatingKey].softBadge
                        )}
                      >
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            habitRatingStyles[averageRatingKey].dot
                          )}
                        />
                        {habitRatingLabels[averageRatingKey]}
                      </span>
                    ) : (
                      <span>No logs yet</span>
                    )}
                  </div>
                  <div className="h-64">
                    {isLoading ? (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Loading chart...
                      </div>
                    ) : logs && logs.length > 0 ? (
                      <ChartContainer className="h-full" config={chartConfig}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <defs>
                              <linearGradient
                                id={gradientId}
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                              >
                                {gradientStops.map((stop, index) => (
                                  <stop
                                    key={`${stop.color}-${index}`}
                                    offset={stop.offset}
                                    stopColor={stop.color}
                                  />
                                ))}
                              </linearGradient>
                            </defs>
                            {ratingBackgrounds.map((band) => (
                              <ReferenceArea
                                key={band.key}
                                y1={band.y1}
                                y2={band.y2}
                                fill={habitRatingColors[band.key].translucent}
                                strokeOpacity={0}
                              />
                            ))}
                            <CartesianGrid
                              strokeDasharray="3 3"
                              className="stroke-muted"
                            />
                            <XAxis dataKey="axisLabel" stroke="currentColor" />
                            <YAxis
                              domain={[-0.25, 2.25]}
                              allowDataOverflow
                              ticks={[0, 1, 2]}
                              stroke="currentColor"
                              tickFormatter={(value: number) => {
                                const key =
                                  habitRatingOrder[value as 0 | 1 | 2] ??
                                  "okay";
                                return habitRatingLabels[key];
                              }}
                            />
                            <Tooltip
                              cursor={{ strokeDasharray: "3 3" }}
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const data = payload[0]
                                  .payload as (typeof chartData)[number];
                                return (
                                  <ChartTooltip>
                                    <div className="font-semibold">
                                      {data.periodLabel}
                                    </div>
                                    <div
                                      className={cn(
                                        "mt-0.5 flex items-center gap-1 font-medium capitalize",
                                        habitRatingStyles[
                                          data.ratingKey as keyof typeof habitRatingStyles
                                        ].text
                                      )}
                                    >
                                      <span
                                        className={cn(
                                          "h-2 w-2 rounded-full",
                                          habitRatingStyles[
                                            data.ratingKey as keyof typeof habitRatingStyles
                                          ].dot
                                        )}
                                      />
                                      {data.ratingLabel}
                                    </div>
                                    {data.comment ? (
                                      <div className="text-muted-foreground">
                                        {data.comment}
                                      </div>
                                    ) : null}
                                  </ChartTooltip>
                                );
                              }}
                            />
                            {averageRatingValue != null && averageRatingKey ? (
                              <ReferenceLine
                                y={averageRatingValue}
                                stroke={
                                  habitRatingColors[averageRatingKey].solid
                                }
                                strokeDasharray="4 4"
                                strokeWidth={2}
                                label={{
                                  value: `Avg (${habitRatingLabels[averageRatingKey]})`,
                                  position: "right",
                                  fill: habitRatingColors[averageRatingKey]
                                    .solid,
                                  fontSize: 12,
                                }}
                              />
                            ) : null}
                            <Line
                              type="monotone"
                              dataKey="rating"
                              stroke={
                                gradientStops.length
                                  ? `url(#${gradientId})`
                                  : habitRatingColors.good.solid
                              }
                              strokeWidth={2}
                              dot={({ cx, cy, payload }) => {
                                if (cx == null || cy == null) return null;
                                const point =
                                  payload as (typeof chartData)[number];
                                const color =
                                  habitRatingColors[point.ratingKey].solid;
                                return (
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={5}
                                    fill={color}
                                    stroke="white"
                                    strokeWidth={1.5}
                                  />
                                );
                              }}
                              activeDot={({ cx, cy, payload }) => {
                                if (cx == null || cy == null) return null;
                                const point =
                                  payload as (typeof chartData)[number];
                                const color =
                                  habitRatingColors[point.ratingKey].solid;
                                return (
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={7}
                                    fill={color}
                                    stroke="white"
                                    strokeWidth={2}
                                  />
                                );
                              }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                        <p>No logs yet. Log your first entry to see trends.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <LogHabitDialog
                    habitId={habit.id}
                    frequency={habit.frequency}
                  />
                </CardFooter>
              </Card>

              {/* All Logs Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">All Logs</h3>
                    <p className="text-sm text-muted-foreground">
                      {logs?.length ?? 0} total{" "}
                      {logs?.length === 1 ? "entry" : "entries"}
                    </p>
                  </div>
                  <Tabs
                    value={viewMode}
                    onValueChange={(v) => setViewMode(v as "list" | "calendar")}
                  >
                    <TabsList>
                      <TabsTrigger value="list">
                        <List className="mr-2 h-4 w-4" />
                        List
                      </TabsTrigger>
                      <TabsTrigger value="calendar">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Calendar
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {viewMode === "list" ? (
                  <ScrollArea className="h-[300px]">
                    <div className="grid gap-2 pr-4">
                      {allLogsReversed.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between rounded-md border p-3"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {formatPeriodLabel(
                                log.periodStart,
                                habit.frequency
                              )}
                            </p>
                            {log.comment && (
                              <p className="text-sm text-muted-foreground">
                                {log.comment}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={cn(
                                "capitalize",
                                habitRatingStyles[log.rating].badge
                              )}
                            >
                              {habitRatingLabels[log.rating]}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">
                                    Open log actions
                                  </span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <LogHabitDialog
                                  habitId={habit.id}
                                  frequency={habit.frequency}
                                  initialLog={log}
                                  trigger={
                                    <DropdownMenuItem
                                      onSelect={(event) =>
                                        event.preventDefault()
                                      }
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit log
                                    </DropdownMenuItem>
                                  }
                                />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteLog(log.id)}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete log
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                      {allLogsReversed.length === 0 && (
                        <div className="flex items-center justify-center rounded-md border border-dashed py-8 text-center">
                          <p className="text-sm text-muted-foreground">
                            No logs yet. Log your first entry to start tracking.
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border p-6">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        modifiers={{
                          hasLogs: datesWithLogs,
                        }}
                        modifiersClassNames={{
                          hasLogs: "relative",
                        }}
                        className="w-full [--cell-size:2.5rem]"
                        classNames={{
                          table: "w-full border-collapse",
                          weekdays: "flex",
                          weekday:
                            "flex-1 text-center text-sm font-medium text-muted-foreground",
                          week: "mt-2 flex w-full",
                          day: "relative aspect-square h-full w-full p-0 text-center text-sm",
                        }}
                        components={{
                          Day: (props) => {
                            const { day } = props;
                            const dateKey = day.date
                              .toISOString()
                              .split("T")[0];
                            const dayLogs = logsByDate.get(dateKey);
                            const isSelected =
                              selectedDate &&
                              dateKey ===
                                selectedDate.toISOString().split("T")[0];

                            return (
                              <div className="relative h-full w-full">
                                <Button
                                  variant="ghost"
                                  className={cn(
                                    "h-full w-full font-normal",
                                    isSelected &&
                                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                                  )}
                                  onClick={() => setSelectedDate(day.date)}
                                >
                                  <div className="flex flex-col items-center justify-center gap-1">
                                    <span className="text-sm">
                                      {day.date.getDate()}
                                    </span>
                                    {dayLogs && dayLogs.length > 0 && (
                                      <div
                                        className="h-1.5 w-1.5 rounded-full"
                                        style={{
                                          backgroundColor:
                                            habitRatingColors[
                                              dayLogs[0]
                                                .rating as keyof typeof habitRatingColors
                                            ].solid,
                                        }}
                                      />
                                    )}
                                  </div>
                                </Button>
                              </div>
                            );
                          },
                        }}
                      />
                    </div>
                    {selectedDate && selectedDateLogs.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">
                          Logs for{" "}
                          {formatPeriodLabel(selectedDate, habit.frequency)}
                        </h4>
                        <div className="space-y-2">
                          {selectedDateLogs.map((log) => (
                            <div
                              key={log.id}
                              className="flex items-center justify-between rounded-md border p-3"
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {formatPeriodLabel(
                                    log.periodStart,
                                    habit.frequency
                                  )}
                                </p>
                                {log.comment && (
                                  <p className="text-sm text-muted-foreground">
                                    {log.comment}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={cn(
                                    "capitalize",
                                    habitRatingStyles[
                                      log.rating as keyof typeof habitRatingStyles
                                    ].badge
                                  )}
                                >
                                  {
                                    habitRatingLabels[
                                      log.rating as keyof typeof habitRatingLabels
                                    ]
                                  }
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">
                                        Open log actions
                                      </span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <LogHabitDialog
                                      habitId={habit.id}
                                      frequency={habit.frequency}
                                      initialLog={log}
                                      trigger={
                                        <DropdownMenuItem
                                          onSelect={(event) =>
                                            event.preventDefault()
                                          }
                                        >
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Edit log
                                        </DropdownMenuItem>
                                      }
                                    />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => handleDeleteLog(log.id)}
                                    >
                                      <Trash className="mr-2 h-4 w-4" />
                                      Delete log
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedDate && selectedDateLogs.length === 0 && (
                      <div className="rounded-md border border-dashed p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          No logs for this date.
                        </p>
                      </div>
                    )}
                    {!selectedDate && logs && logs.length === 0 && (
                      <div className="rounded-md border border-dashed p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          No logs yet. Log your first entry to start tracking.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
