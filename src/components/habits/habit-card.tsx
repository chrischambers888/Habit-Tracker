"use client";

import * as React from "react";
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
import { LogHabitDialog } from "@/components/habits/log-habit-dialog";
import { HabitEditorDialog } from "@/components/habits/habit-editor-dialog";
import { HabitDetailModal } from "@/components/habits/habit-detail-modal";
import {
  useHabitLogs,
  useDeleteHabit,
  useDeleteHabitLog,
} from "@/hooks/use-habits";
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

type HabitCardProps = {
  habit: HabitResponse;
};

export function HabitCard({ habit }: HabitCardProps) {
  const deleteHabit = useDeleteHabit();
  const { data: logs, isLoading } = useHabitLogs(habit.id);
  const deleteHabitLog = useDeleteHabitLog(habit.id);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);

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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 md:pb-4">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base md:text-lg font-semibold truncate">
                {habit.name}
              </CardTitle>
              <HabitEditorDialog
                habit={habit}
                trigger={
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit habit</span>
                  </Button>
                }
              />
            </div>
            <div className="space-y-1 text-xs md:text-sm text-muted-foreground">
              {ratingDescriptionsList.map((item) => (
                <p
                  key={item.key}
                  className="flex items-start gap-2 whitespace-pre-line"
                >
                  <span
                    className={cn(
                      "flex min-w-[4rem] md:min-w-[5rem] items-center gap-1 font-medium shrink-0",
                      habitRatingStyles[item.key].text
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 md:h-2.5 md:w-2.5 rounded-full shrink-0",
                        habitRatingStyles[item.key].dot
                      )}
                    />
                    {item.label}:
                  </span>
                  <span className="flex-1 text-muted-foreground text-xs md:text-sm">
                    {item.text.trim().length > 0 ? item.text : "—"}
                  </span>
                </p>
              ))}
            </div>
            {habit.description ? (
              <CardDescription className="text-xs md:text-sm">{habit.description}</CardDescription>
            ) : hasRatingDescriptions ? null : (
              <CardDescription className="capitalize text-xs md:text-sm">
                {habit.frequency} habit
              </CardDescription>
            )}
            {!hasRatingDescriptions && (
              <p className="text-xs text-muted-foreground">
                Add guidance for each rating so you know what Good/Okay/Bad
                means.
              </p>
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
        <CardContent className="space-y-3 md:space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <Badge variant="secondary" className="capitalize text-xs">
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
              <span className="text-xs md:text-sm">No logs yet</span>
            )}
          </div>
          <div className="h-40 md:h-52">
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
                    <XAxis 
                      dataKey="axisLabel" 
                      stroke="currentColor"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      domain={[-0.25, 2.25]}
                      allowDataOverflow
                      ticks={[0, 1, 2]}
                      stroke="currentColor"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value: number) => {
                        const key =
                          habitRatingOrder[value as 0 | 1 | 2] ?? "okay";
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
                        stroke={habitRatingColors[averageRatingKey].solid}
                        strokeDasharray="4 4"
                        strokeWidth={2}
                        label={{
                          value: `Avg (${habitRatingLabels[averageRatingKey]})`,
                          position: "right",
                          fill: habitRatingColors[averageRatingKey].solid,
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
                        const point = payload as (typeof chartData)[number];
                        const color = habitRatingColors[point.ratingKey].solid;
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
                        const point = payload as (typeof chartData)[number];
                        const color = habitRatingColors[point.ratingKey].solid;
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
          <div className="grid gap-2">
            {logs
              ?.slice(-3)
              .reverse()
              .map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-md border p-2 md:p-3 gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium truncate">
                      {formatPeriodLabel(log.periodStart, habit.frequency)}
                    </p>
                    {log.comment && (
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                        {log.comment}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      className={cn(
                        "capitalize text-xs",
                        habitRatingStyles[log.rating].badge
                      )}
                    >
                      {habitRatingLabels[log.rating]}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open log actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <LogHabitDialog
                          habitId={habit.id}
                          frequency={habit.frequency}
                          initialLog={log}
                          trigger={
                            <DropdownMenuItem
                              onSelect={(event) => event.preventDefault()}
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
            {logs && logs.length > 3 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setDetailModalOpen(true)}
              >
                See all logs ({logs.length})
              </Button>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <LogHabitDialog habitId={habit.id} frequency={habit.frequency} />
        </CardFooter>
      </Card>
      <HabitDetailModal
        habit={habit}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </>
  );
}
