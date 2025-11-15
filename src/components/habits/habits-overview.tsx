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
import { BarChart3, CalendarIcon, Info } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [isMobile, setIsMobile] = React.useState(false);
  const [visibleHabitIds, setVisibleHabitIds] = React.useState<Set<string>>(new Set());
  const [progressInfoOpen, setProgressInfoOpen] = React.useState(false);

  // Initialize all habits as visible when habits data loads
  React.useEffect(() => {
    if (habits && habits.length > 0) {
      setVisibleHabitIds(new Set(habits.map(h => h.id)));
    }
  }, [habits?.map(h => h.id).join(",")]);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleHabitVisibility = React.useCallback((habitId: string) => {
    setVisibleHabitIds(prev => {
      const next = new Set(prev);
      if (next.has(habitId)) {
        next.delete(habitId);
      } else {
        next.add(habitId);
      }
      return next;
    });
  }, []);

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
      <CardContent className="space-y-4 md:space-y-6">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-3 md:p-4">
            <div className="text-xs md:text-sm font-medium text-muted-foreground">
              Total Habits
            </div>
            <div className="mt-1 text-xl md:text-2xl font-bold">{stats.totalHabits}</div>
          </div>

          <div className="rounded-lg border p-3 md:p-4">
            <div className="text-xs md:text-sm font-medium text-muted-foreground">
              Total Logs
            </div>
            <div className="mt-1 text-xl md:text-2xl font-bold">{stats.totalLogs}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {stats.habitsWithLogs} of {stats.totalHabits} habits tracked
            </div>
          </div>

          <div className="rounded-lg border p-3 md:p-4">
            <div className="text-xs md:text-sm font-medium text-muted-foreground">
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
                      "text-xl md:text-2xl font-bold capitalize",
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
              <div className="mt-1 text-xl md:text-2xl font-bold text-muted-foreground">
                No data
              </div>
            )}
          </div>

          <div className="rounded-lg border p-3 md:p-4">
            <div className="text-xs md:text-sm font-medium text-muted-foreground">
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
              <div className="mt-1 text-xs md:text-sm text-muted-foreground">No logs yet</div>
            )}
          </div>
        </div>

        {/* Combined Chart */}
        {chartData.length > 0 && (
          <div>
            <div className="mb-3 md:mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                  <SelectTrigger className="w-[140px] text-xs md:text-sm">
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
                          "w-[180px] md:w-[240px] justify-start text-left font-normal text-xs md:text-sm",
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
                        numberOfMonths={isMobile ? 1 : 2}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-64 md:h-80 w-full">
                <ChartContainer 
                  config={chartConfig} 
                  className="h-full w-full !p-0 !gap-0 !border-0 !bg-transparent !shadow-none"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: 5, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="period"
                        stroke="currentColor"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 11 }}
                      />
                    <YAxis
                      domain={[-0.25, 2.25]}
                      allowDataOverflow
                      ticks={[0, 1, 2]}
                      stroke="currentColor"
                      tick={{ fontSize: 11 }}
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
                              .filter((p) => p.value != null && visibleHabitIds.has(p.dataKey as string))
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
                      {habits?.filter(habit => visibleHabitIds.has(habit.id)).map((habit) => (
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
              <div className="flex flex-wrap items-center justify-center gap-3 px-2 pt-2 pb-1 text-xs">
                {habits?.map((habit, index) => {
                  const isVisible = visibleHabitIds.has(habit.id);
                  return (
                    <button
                      key={`legend-item-${habit.id}`}
                      type="button"
                      onClick={() => toggleHabitVisibility(habit.id)}
                      className={cn(
                        "flex items-center gap-1.5 transition-opacity hover:opacity-80 cursor-pointer",
                        !isVisible && "opacity-40"
                      )}
                    >
                      <div
                        className={cn(
                          "h-3 w-3 rounded-sm transition-all border",
                          isVisible ? "border-foreground/20" : "border-transparent"
                        )}
                        style={{
                          backgroundColor: habitColors[habit.id] ?? "rgb(156, 163, 175)",
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {habit.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Habit Progress Section */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-base font-semibold">Habit Progress</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-foreground"
              onClick={() => setProgressInfoOpen(true)}
            >
              <Info className="h-4 w-4" />
              <span className="sr-only">Learn more about Habit Progress</span>
            </Button>
          </div>
          <Dialog open={progressInfoOpen} onOpenChange={setProgressInfoOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Habit Progress Explained</DialogTitle>
                <DialogDescription>
                  This section highlights significant changes and patterns in your habits to help you stay motivated and identify areas that need attention.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                {/* Hot Streaks */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔥</span>
                    <h3 className="font-semibold">Hot Streaks</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Habits with 3 or more consecutive "Good" ratings. This shows you're consistently performing well and maintaining momentum!
                  </p>
                  <div className="rounded-md bg-green-500/10 border border-green-500/20 p-3 text-xs text-muted-foreground">
                    <strong>Example:</strong> If your last 5 logs are Good, Good, Good, Okay, Bad, you'll see "3 consecutive Good ratings" (the streak counts from most recent backwards).
                  </div>
                </div>

                {/* Improving */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">✨</span>
                    <h3 className="font-semibold">Improving</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Habits that have improved significantly. We compare your recent average (last 3-5 logs) with your previous average (3-5 logs before that).
                  </p>
                  <div className="rounded-md bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-muted-foreground">
                    <strong>Example:</strong> If you averaged "Bad" in your first few logs but now average "Good", you'll see "Improved from Bad to Good".
                  </div>
                </div>

                {/* Back on Track */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    <h3 className="font-semibold">Back on Track</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Habits where you logged a "Good" rating after a significant gap in tracking. This celebrates getting back into a habit after some time away.
                  </p>
                  <div className="rounded-md bg-purple-500/10 border border-purple-500/20 p-3 text-xs text-muted-foreground">
                    <strong>Example:</strong> If your last log was 20 days ago (for a daily habit) and you just logged "Good" today, you'll see this category.
                  </div>
                </div>

                {/* Declining */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📉</span>
                    <h3 className="font-semibold">Declining</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Habits where your recent performance has dropped compared to earlier. We compare recent average with previous average to detect significant declines.
                  </p>
                  <div className="rounded-md bg-orange-500/10 border border-orange-500/20 p-3 text-xs text-muted-foreground">
                    <strong>Example:</strong> If you averaged "Good" previously but now average "Bad", you'll see "Declined from Good to Bad". This helps you catch issues early.
                  </div>
                </div>

                {/* Needs Attention */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚠️</span>
                    <h3 className="font-semibold">Needs Attention</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Habits with 3 or more consecutive "Bad" ratings. This is a clear signal that something might need to change or that you're struggling with this habit.
                  </p>
                  <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-xs text-muted-foreground">
                    <strong>Example:</strong> If your last 4 logs are Bad, Bad, Bad, Good, you'll see "3 consecutive Bad ratings". Consider reviewing why this habit is challenging right now.
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> Each habit only appears in one category, prioritized in this order: Hot Streaks → Needs Attention (Bad Streaks) → Improving → Declining → Back on Track. This ensures the most important information is highlighted first.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {React.useMemo(() => {
            if (!habits || habits.length === 0) return null;

            type ProgressItem = {
              habit: typeof habits[0];
              type: "hot-streak" | "needs-attention" | "improving" | "declining" | "new-activity";
              message: string;
              streakCount?: number;
              recentAverage?: number;
              previousAverage?: number;
              recentRating?: keyof typeof habitRatingLabels;
            };

            const progressItems: ProgressItem[] = [];

            habits.forEach((habit) => {
              const logs = logsMap.get(habit.id) ?? [];
              if (logs.length === 0) return;

              // Sort logs by periodStart (most recent first)
              const sortedLogs = [...logs].sort((a, b) => 
                new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime()
              );

              // Calculate consecutive streak from most recent
              // Count consecutive ratings of the same type from the most recent log
              let goodStreak = 0;
              let badStreak = 0;
              
              if (sortedLogs.length > 0) {
                const mostRecentRating = sortedLogs[0].rating;
                
                // Count consecutive ratings matching the most recent rating type
                if (mostRecentRating === "good") {
                  for (const log of sortedLogs) {
                    if (log.rating === "good") {
                      goodStreak++;
                    } else {
                      break; // Streak broken by different rating
                    }
                  }
                } else if (mostRecentRating === "bad") {
                  for (const log of sortedLogs) {
                    if (log.rating === "bad") {
                      badStreak++;
                    } else {
                      break; // Streak broken by different rating
                    }
                  }
                }
              }

              // Hot Streak: 3+ consecutive Good ratings
              if (goodStreak >= 3) {
                progressItems.push({
                  habit,
                  type: "hot-streak",
                  message: `${goodStreak} consecutive ${goodStreak === 1 ? "Good rating" : "Good ratings"}`,
                  streakCount: goodStreak,
                });
                return; // Don't check other categories if hot streak
              }

              // Needs Attention: 3+ consecutive Bad ratings
              if (badStreak >= 3) {
                progressItems.push({
                  habit,
                  type: "needs-attention",
                  message: `${badStreak} consecutive ${badStreak === 1 ? "Bad rating" : "Bad ratings"}`,
                  streakCount: badStreak,
                });
                return; // Don't check other categories if needs attention
              }

              // Need at least 4 logs to compare recent vs previous
              if (logs.length >= 4) {
                // Split into recent (last 3-5) and previous (before that)
                const recentCount = Math.min(5, Math.floor(logs.length / 2));
                const recentLogs = sortedLogs.slice(0, recentCount);
                const previousLogs = sortedLogs.slice(recentCount, recentCount + Math.min(5, logs.length - recentCount));

                if (previousLogs.length > 0) {
                  const recentAverage = recentLogs.reduce((sum, log) => sum + ratingValue[log.rating], 0) / recentLogs.length;
                  const previousAverage = previousLogs.reduce((sum, log) => sum + ratingValue[log.rating], 0) / previousLogs.length;
                  const difference = recentAverage - previousAverage;

                  // Improving: Recent average is ≥1 level better (difference ≥ 0.5)
                  if (difference >= 0.5) {
                    const recentKey = habitRatingOrder[Math.round(recentAverage) as 0 | 1 | 2] ?? "okay";
                    const previousKey = habitRatingOrder[Math.round(previousAverage) as 0 | 1 | 2] ?? "okay";
                    
                    if (recentKey !== previousKey) {
                      progressItems.push({
                        habit,
                        type: "improving",
                        message: `Improved from ${habitRatingLabels[previousKey]} to ${habitRatingLabels[recentKey]}`,
                        recentAverage,
                        previousAverage,
                        recentRating: recentKey,
                      });
                      return;
                    }
                  }

                  // Declining: Recent average is ≥1 level worse (difference ≤ -0.5)
                  if (difference <= -0.5) {
                    const recentKey = habitRatingOrder[Math.round(recentAverage) as 0 | 1 | 2] ?? "okay";
                    const previousKey = habitRatingOrder[Math.round(previousAverage) as 0 | 1 | 2] ?? "okay";
                    
                    if (recentKey !== previousKey) {
                      progressItems.push({
                        habit,
                        type: "declining",
                        message: `Declined from ${habitRatingLabels[previousKey]} to ${habitRatingLabels[recentKey]}`,
                        recentAverage,
                        previousAverage,
                        recentRating: recentKey,
                      });
                      return;
                    }
                  }
                }
              }

              // New Activity: Recent log after a gap (if there's a log from last 2 periods and the one before that is older)
              if (sortedLogs.length >= 2) {
                const mostRecent = new Date(sortedLogs[0].periodStart);
                const secondRecent = new Date(sortedLogs[1].periodStart);
                const daysDiff = (mostRecent.getTime() - secondRecent.getTime()) / (1000 * 60 * 60 * 24);
                
                // If gap is significant (more than 2 periods worth of days based on frequency)
                const gapThreshold = habit.frequency === "daily" ? 14 : habit.frequency === "weekly" ? 21 : 60;
                
                if (daysDiff > gapThreshold && sortedLogs[0].rating === "good") {
                  progressItems.push({
                    habit,
                    type: "new-activity",
                    message: `Back on track after ${Math.round(daysDiff)} day gap`,
                    recentRating: sortedLogs[0].rating,
                  });
                }
              }
            });

            if (progressItems.length === 0) {
              return (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No significant changes detected. Keep tracking your habits!
                  </p>
                </div>
              );
            }

            // Group by type
            const grouped: Record<string, ProgressItem[]> = {
              "hot-streak": [],
              "improving": [],
              "new-activity": [],
              "declining": [],
              "needs-attention": [],
            };

            progressItems.forEach(item => {
              grouped[item.type].push(item);
            });

            // Sort within each group (by streak count or recency)
            Object.keys(grouped).forEach(key => {
              grouped[key].sort((a, b) => {
                if (a.streakCount && b.streakCount) {
                  return b.streakCount - a.streakCount;
                }
                return 0;
              });
            });

            return (
              <div className="space-y-4">
                {/* Hot Streaks */}
                {grouped["hot-streak"].length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <span>🔥</span> Hot Streaks
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {grouped["hot-streak"].map((item) => (
                        <div
                          key={item.habit.id}
                          className="group relative overflow-hidden rounded-lg border border-green-500/20 bg-green-500/5 p-4 transition-all hover:shadow-md hover:border-green-500/30"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm leading-tight truncate">
                                {item.habit.name}
                              </h4>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {item.message}
                              </p>
                            </div>
                            <div className="text-2xl">🔥</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improving */}
                {grouped["improving"].length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <span>✨</span> Improving
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {grouped["improving"].map((item) => (
                        <div
                          key={item.habit.id}
                          className="group relative overflow-hidden rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 transition-all hover:shadow-md hover:border-blue-500/30"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm leading-tight truncate">
                                {item.habit.name}
                              </h4>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {item.message}
                              </p>
                              {item.recentRating && (
                                <span
                                  className={cn(
                                    "mt-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                                    habitRatingStyles[item.recentRating].softBadge
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "h-1.5 w-1.5 rounded-full",
                                      habitRatingStyles[item.recentRating].dot
                                    )}
                                  />
                                  Current: {habitRatingLabels[item.recentRating]}
                                </span>
                              )}
                            </div>
                            <div className="text-2xl">📈</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Activity */}
                {grouped["new-activity"].length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <span>🎯</span> Back on Track
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {grouped["new-activity"].map((item) => (
                        <div
                          key={item.habit.id}
                          className="group relative overflow-hidden rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 transition-all hover:shadow-md hover:border-purple-500/30"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm leading-tight truncate">
                                {item.habit.name}
                              </h4>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {item.message}
                              </p>
                            </div>
                            <div className="text-2xl">🎯</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Declining */}
                {grouped["declining"].length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <span>📉</span> Declining
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {grouped["declining"].map((item) => (
                        <div
                          key={item.habit.id}
                          className="group relative overflow-hidden rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 transition-all hover:shadow-md hover:border-orange-500/30"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm leading-tight truncate">
                                {item.habit.name}
                              </h4>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {item.message}
                              </p>
                              {item.recentRating && (
                                <span
                                  className={cn(
                                    "mt-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                                    habitRatingStyles[item.recentRating].softBadge
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "h-1.5 w-1.5 rounded-full",
                                      habitRatingStyles[item.recentRating].dot
                                    )}
                                  />
                                  Current: {habitRatingLabels[item.recentRating]}
                                </span>
                              )}
                            </div>
                            <div className="text-2xl">📉</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Needs Attention (Bad Streaks) */}
                {grouped["needs-attention"].length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <span>⚠️</span> Needs Attention
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {grouped["needs-attention"].map((item) => (
                        <div
                          key={item.habit.id}
                          className="group relative overflow-hidden rounded-lg border border-red-500/20 bg-red-500/5 p-4 transition-all hover:shadow-md hover:border-red-500/30"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm leading-tight truncate">
                                {item.habit.name}
                              </h4>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {item.message}
                              </p>
                            </div>
                            <div className="text-2xl">⚠️</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }, [habits, logsMap])}
        </div>
      </CardContent>
    </Card>
  );
}

