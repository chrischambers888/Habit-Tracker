"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { useHabits } from "@/hooks/use-habits";
import { habitLogsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQueries } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Legend,
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
  normalizePeriodStart,
} from "@/lib/habit-period";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import type { DateRange } from "react-day-picker";

const ratingValue = {
  bad: 0,
  okay: 1,
  good: 2,
};

type HabitsOverviewProps = {
  className?: string;
};

type DateRangePreset = "7d" | "30d" | "90d" | "all" | "custom";

export function HabitsOverview({ className }: HabitsOverviewProps) {
  const { data: habits, isLoading: isLoadingHabits } = useHabits();
  const habitList = habits ?? [];

  // Date range state - default to last 7 days
  const today = React.useMemo(() => endOfDay(new Date()), []);
  const defaultStartDate = React.useMemo(() => startOfDay(subDays(today, 7)), [today]);
  
  const [dateRangePreset, setDateRangePreset] = React.useState<DateRangePreset>("7d");
  const [customDateRange, setCustomDateRange] = React.useState<DateRange | undefined>({
    from: defaultStartDate,
    to: today,
  });
  const [dateRangePopoverOpen, setDateRangePopoverOpen] = React.useState(false);

  // Calculate actual date range based on preset
  const dateRange = React.useMemo(() => {
    switch (dateRangePreset) {
      case "7d":
        return {
          from: startOfDay(subDays(today, 7)),
          to: today,
        };
      case "30d":
        return {
          from: startOfDay(subDays(today, 30)),
          to: today,
        };
      case "90d":
        return {
          from: startOfDay(subDays(today, 90)),
          to: today,
        };
      case "all":
        return null; // No date filter
      case "custom":
        return customDateRange ?? null;
      default:
        return {
          from: defaultStartDate,
          to: today,
        };
    }
  }, [dateRangePreset, customDateRange, today, defaultStartDate]);

  // Fetch logs for all habits
  const logsQueries = useQueries({
    queries: React.useMemo(
      () =>
        habitList.map((habit) => ({
          queryKey: queryKeys.habitLogs(habit.id),
          queryFn: () => habitLogsApi.list(habit.id),
          staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        })),
      [habitList.map((habit) => habit.id).join(",")]
    ),
  });

  const logsMap = React.useMemo(() => {
    const map = new Map<string, typeof logsQueries[0]["data"]>();
    habitList.forEach((habit, index) => {
      map.set(habit.id, logsQueries[index]?.data);
    });
    return map;
  }, [habitList, logsQueries]);

  const isLoadingLogs = logsQueries.some((query) => query.isLoading);

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!habits || habits.length === 0) {
      return {
        totalHabits: 0,
        totalLogs: 0,
        averageRating: null,
        habitsWithLogs: 0,
        ratingDistribution: { good: 0, okay: 0, bad: 0 },
      };
    }

    let totalLogs = 0;
    let totalRatingValue = 0;
    let habitsWithLogs = 0;
    const ratingDistribution = { good: 0, okay: 0, bad: 0 };

    habits.forEach((habit) => {
      const logs = logsMap.get(habit.id);
      if (logs && logs.length > 0) {
        habitsWithLogs++;
        totalLogs += logs.length;
        logs.forEach((log) => {
          const value = ratingValue[log.rating];
          totalRatingValue += value;
          ratingDistribution[log.rating]++;
        });
      }
    });

    const averageRating =
      totalLogs > 0 ? totalRatingValue / totalLogs : null;

    return {
      totalHabits: habits.length,
      totalLogs,
      averageRating,
      habitsWithLogs,
      ratingDistribution,
    };
  }, [habits, logsMap]);

  // Prepare chart data - combine all habits into a unified timeline
  const chartData = React.useMemo(() => {
    if (!habits || habits.length === 0) return [];

    // Collect all periods with their associated data
    const periodDataMap = new Map<string, {
      periodStart: Date;
      labels: Map<string, string>; // habitId -> label
      ratings: Record<string, number>; // habitId -> rating value
    }>();

    habits.forEach((habit) => {
      const logs = logsMap.get(habit.id) ?? [];
      logs.forEach((log) => {
        const periodStart = normalizePeriodStart(log.periodStart, habit.frequency);
        const key = periodStart.toISOString();
        
        if (!periodDataMap.has(key)) {
          periodDataMap.set(key, {
            periodStart,
            labels: new Map(),
            ratings: {},
          });
        }
        
        const periodData = periodDataMap.get(key)!;
        periodData.labels.set(habit.id, formatPeriodAxisLabel(periodStart, habit.frequency));
        periodData.ratings[habit.id] = ratingValue[log.rating];
      });
    });

    // Sort periods chronologically and filter by date range
    let sortedPeriods = Array.from(periodDataMap.entries())
      .sort((a, b) => a[1].periodStart.getTime() - b[1].periodStart.getTime());

    // Filter by date range if specified
    if (dateRange && dateRange.from && dateRange.to) {
      const rangeStart = dateRange.from;
      const rangeEnd = dateRange.to;
      const rangeStartTime = rangeStart.getTime();
      const rangeEndTime = rangeEnd.getTime();
      
      sortedPeriods = sortedPeriods.filter(([_, periodData]) => {
        const periodStart = periodData.periodStart;
        // Compare dates (period start should be within or equal to the range)
        const periodTime = periodStart.getTime();
        return periodTime >= rangeStartTime && periodTime <= rangeEndTime;
      });
    } else {
      // If no date range (all time), keep only last 20 periods
      sortedPeriods = sortedPeriods.slice(-20);
    }

    // Determine the most common label format for each period
    return sortedPeriods.map(([key, periodData]) => {
      // Find the most common frequency for labels on this period
      const labelEntries = Array.from(periodData.labels.entries());
      const primaryLabel = labelEntries[0]?.[1] ?? "";

      return {
        period: primaryLabel,
        periodKey: key,
        ...Object.fromEntries(
          habits.map((habit) => [
            habit.id,
            periodData.ratings[habit.id] ?? null,
          ])
        ),
      };
    });
  }, [habits, logsMap, dateRange]);

  // Generate colors for each habit
  const habitColors = React.useMemo(() => {
    const colors = [
      "rgb(59, 130, 246)", // blue-500
      "rgb(236, 72, 153)", // pink-500
      "rgb(168, 85, 247)", // purple-500
      "rgb(34, 197, 94)", // green-500
      "rgb(234, 179, 8)", // yellow-500
      "rgb(249, 115, 22)", // orange-500
      "rgb(239, 68, 68)", // red-500
      "rgb(14, 165, 233)", // sky-500
      "rgb(168, 85, 247)", // violet-500
      "rgb(236, 72, 153)", // fuchsia-500
    ];

    return habits?.reduce((acc, habit, index) => {
      acc[habit.id] = colors[index % colors.length];
      return acc;
    }, {} as Record<string, string>) ?? {};
  }, [habits]);

  const averageRatingKey =
    stats.averageRating != null
      ? habitRatingOrder[Math.round(stats.averageRating) as 0 | 1 | 2] ?? "okay"
      : null;

  const chartConfig = React.useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    habits?.forEach((habit) => {
      config[habit.id] = {
        label: habit.name,
        color: habitColors[habit.id] ?? "rgb(156, 163, 175)",
      };
    });
    return config;
  }, [habits, habitColors]);

  if (isLoadingHabits || isLoadingLogs) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!habits || habits.length === 0) {
    return null;
  }

  const totalRatingCount =
    stats.ratingDistribution.good +
    stats.ratingDistribution.okay +
    stats.ratingDistribution.bad;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <CardTitle>Habits Overview</CardTitle>
        </div>
        <CardDescription>
          Overall progress across all your habits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium text-muted-foreground">
              Total Habits
            </div>
            <div className="mt-1 text-2xl font-bold">{stats.totalHabits}</div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium text-muted-foreground">
              Total Logs
            </div>
            <div className="mt-1 text-2xl font-bold">{stats.totalLogs}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {stats.habitsWithLogs} of {stats.totalHabits} habits tracked
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium text-muted-foreground">
              Average Rating
            </div>
            {averageRatingKey ? (
              <>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      habitRatingStyles[averageRatingKey].dot
                    )}
                  />
                  <span
                    className={cn(
                      "text-2xl font-bold capitalize",
                      habitRatingStyles[averageRatingKey].text
                    )}
                  >
                    {habitRatingLabels[averageRatingKey]}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Across all logs
                </div>
              </>
            ) : (
              <div className="mt-1 text-2xl font-bold text-muted-foreground">
                No data
              </div>
            )}
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium text-muted-foreground">
              Rating Distribution
            </div>
            {totalRatingCount > 0 ? (
              <div className="mt-1 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <span className={cn("h-2 w-2 rounded-full", habitRatingStyles.good.dot)} />
                    Good
                  </span>
                  <span className="font-medium">
                    {Math.round((stats.ratingDistribution.good / totalRatingCount) * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <span className={cn("h-2 w-2 rounded-full", habitRatingStyles.okay.dot)} />
                    Okay
                  </span>
                  <span className="font-medium">
                    {Math.round((stats.ratingDistribution.okay / totalRatingCount) * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <span className={cn("h-2 w-2 rounded-full", habitRatingStyles.bad.dot)} />
                    Bad
                  </span>
                  <span className="font-medium">
                    {Math.round((stats.ratingDistribution.bad / totalRatingCount) * 100)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-1 text-sm text-muted-foreground">No logs yet</div>
            )}
          </div>
        </div>

        {/* Combined Chart */}
        {chartData.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-medium">Trend Over Time</div>
              <div className="flex items-center gap-2">
                <Select
                  value={dateRangePreset}
                  onValueChange={(value) => {
                    const preset = value as DateRangePreset;
                    setDateRangePreset(preset);
                    if (preset !== "custom") {
                      setDateRangePopoverOpen(false);
                    } else {
                      // When switching to custom, open the calendar if no range is set
                      if (!customDateRange?.from || !customDateRange?.to) {
                        setDateRangePopoverOpen(true);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
                {dateRangePreset === "custom" && (
                  <Popover
                    open={dateRangePopoverOpen}
                    onOpenChange={setDateRangePopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          (!customDateRange?.from || !customDateRange?.to) && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateRange?.from && customDateRange?.to ? (
                          <>
                            {format(customDateRange.from, "LLL dd, y")} -{" "}
                            {format(customDateRange.to, "LLL dd, y")}
                          </>
                        ) : customDateRange?.from ? (
                          <>
                            {format(customDateRange.from, "LLL dd, y")} - ...
                          </>
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={customDateRange?.from || defaultStartDate}
                        selected={customDateRange}
                        onSelect={(range) => {
                          setCustomDateRange(range);
                          // Close popover when both dates are selected
                          if (range?.from && range?.to) {
                            setDateRangePopoverOpen(false);
                          }
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
            <div className="h-80">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="period"
                      stroke="currentColor"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      domain={[-0.25, 2.25]}
                      allowDataOverflow
                      ticks={[0, 1, 2]}
                      stroke="currentColor"
                      tickFormatter={(value: number) => {
                        const key = habitRatingOrder[value as 0 | 1 | 2] ?? "okay";
                        return habitRatingLabels[key];
                      }}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <ChartTooltip>
                            <div className="font-semibold mb-2">
                              {payload[0].payload.period}
                            </div>
                            {payload
                              .filter((p) => p.value != null)
                              .map((p, index) => {
                                const habitId = p.dataKey as string;
                                const habit = habits?.find((h) => h.id === habitId);
                                const value = p.value as number;
                                const key = habitRatingOrder[Math.round(value) as 0 | 1 | 2] ?? "okay";
                                if (!habit) return null;
                                return (
                                  <div key={index} className="flex items-center gap-2">
                                    <div
                                      className="h-3 w-3 rounded-full"
                                      style={{ backgroundColor: habitColors[habitId] }}
                                    />
                                    <span className="font-medium">{habit.name}:</span>
                                    <span className={cn("capitalize", habitRatingStyles[key].text)}>
                                      {habitRatingLabels[key]}
                                    </span>
                                  </div>
                                );
                              })}
                          </ChartTooltip>
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: "20px" }}
                      iconType="line"
                      formatter={(value: string) => {
                        const habit = habits?.find((h) => h.id === value);
                        return habit?.name ?? value;
                      }}
                    />
                    {habits?.map((habit) => (
                      <Line
                        key={habit.id}
                        type="monotone"
                        dataKey={habit.id}
                        stroke={habitColors[habit.id]}
                        strokeWidth={2}
                        dot={false}
                        connectNulls={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        )}

        {/* Quick Status Grid */}
        <div>
          <div className="mb-4 text-sm font-medium">Habit Status</div>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {habits.map((habit) => {
              const logs = logsMap.get(habit.id) ?? [];
              const recentLogs = logs.slice(-3).reverse();
              const latestLog = logs[logs.length - 1];
              const averageValue =
                logs.length > 0
                  ? logs.reduce((sum, log) => sum + ratingValue[log.rating], 0) / logs.length
                  : null;
              const averageKey =
                averageValue != null
                  ? habitRatingOrder[Math.round(averageValue) as 0 | 1 | 2] ?? "okay"
                  : null;

              return (
                <div
                  key={habit.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{habit.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {habit.frequency}
                      </Badge>
                      {averageKey ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                            habitRatingStyles[averageKey].softBadge
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              habitRatingStyles[averageKey].dot
                            )}
                          />
                          Avg: {habitRatingLabels[averageKey]}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No logs</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {recentLogs.length > 0 ? (
                      recentLogs.map((log, index) => (
                        <div
                          key={log.id}
                          className={cn(
                            "h-2 w-2 rounded-full",
                            habitRatingStyles[log.rating].dot
                          )}
                          title={`${habitRatingLabels[log.rating]} - ${new Date(log.periodStart).toLocaleDateString()}`}
                        />
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

