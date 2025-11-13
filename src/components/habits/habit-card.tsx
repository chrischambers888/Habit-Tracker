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
import { ChartContainer } from "@/components/ui/chart";
import { LogHabitDialog } from "@/components/habits/log-habit-dialog";
import { HabitEditorDialog } from "@/components/habits/habit-editor-dialog";
import {
  useHabitLogs,
  useDeleteHabit,
  useDeleteHabitLog,
} from "@/hooks/use-habits";
import type { HabitResponse } from "@/lib/schemas/habit";
import { format } from "date-fns";
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
} from "recharts";
import { cn } from "@/lib/utils";
import {
  habitRatingLabels,
  habitRatingOrder,
  habitRatingStyles,
} from "@/lib/constants/habit-rating";

const ratingValue = {
  bad: 0,
  okay: 1,
  good: 2,
};

const chartConfig = {
  rating: {
    label: "Rating",
    color: "hsl(var(--chart-3))",
  },
};

type HabitCardProps = {
  habit: HabitResponse;
};

export function HabitCard({ habit }: HabitCardProps) {
  const deleteHabit = useDeleteHabit();
  const { data: logs, isLoading } = useHabitLogs(habit.id);
  const deleteHabitLog = useDeleteHabitLog(habit.id);

  const ratingDescriptionsList = habitRatingOrder.map((key) => ({
    key,
    label: habitRatingLabels[key],
    text: habit.ratingDescriptions?.[key] ?? "",
  }));

  const hasRatingDescriptions = ratingDescriptionsList.some(
    (item) => item.text.trim().length > 0,
  );

  const latestLog = logs?.[logs.length - 1];
  const average =
    logs && logs.length > 0
      ? logs.reduce((sum, log) => sum + ratingValue[log.rating], 0) /
        logs.length
      : null;
  const averageRatingKey =
    average !== null
      ? habitRatingOrder[Math.round(average) as 0 | 1 | 2] ?? "okay"
      : null;

  const chartData =
    logs?.map((log) => ({
      date: format(log.periodStart, "MMM d"),
      rating: ratingValue[log.rating],
      ratingKey: log.rating,
      label: habitRatingLabels[log.rating],
      comment: log.comment,
    })) ?? [];

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete habit "${habit.name}"? This cannot be undone.`,
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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">{habit.name}</CardTitle>
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
                    habitRatingStyles[item.key].text,
                  )}
                >
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      habitRatingStyles[item.key].dot,
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
          {!hasRatingDescriptions && (
            <p className="text-xs text-muted-foreground">
              Add guidance for each rating so you know what Good/Okay/Bad means.
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
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="capitalize">
            {habit.frequency}
          </Badge>
          {average !== null ? (
            <span className="flex items-center gap-2">
              Average: {average.toFixed(1)} / 2
              {averageRatingKey && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                    habitRatingStyles[averageRatingKey].softBadge,
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      habitRatingStyles[averageRatingKey].dot,
                    )}
                  />
                  {habitRatingLabels[averageRatingKey]}
                </span>
              )}
            </span>
          ) : (
            <span>No logs yet</span>
          )}
          {latestLog && (
            <span>
              Last logged {format(latestLog.periodStart, "MMM d")}{" "}
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                  habitRatingStyles[latestLog.rating].softBadge,
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    habitRatingStyles[latestLog.rating].dot,
                  )}
                />
                {habitRatingLabels[latestLog.rating]}
              </span>
            </span>
          )}
        </div>
        <div className="h-52">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading chart...
            </div>
          ) : logs && logs.length > 0 ? (
            <ChartContainer className="h-full" config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" stroke="currentColor" />
                  <YAxis
                    domain={[0, 2]}
                    ticks={[0, 1, 2]}
                    stroke="currentColor"
                    tickFormatter={(value: number) => {
                      const key =
                        habitRatingOrder[value as 0 | 1 | 2] ?? "okay";
                      return habitRatingLabels[key];
                    }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload as (typeof chartData)[number];
                      return (
                        <div className="rounded-md border bg-background p-2 text-xs shadow-md">
                          <div className="font-semibold">{label}</div>
                          <div
                            className={cn(
                              "mt-0.5 flex items-center gap-1 font-medium capitalize",
                              habitRatingStyles[
                                data.ratingKey as keyof typeof habitRatingStyles
                              ].text,
                            )}
                          >
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                habitRatingStyles[
                                  data.ratingKey as keyof typeof habitRatingStyles
                                ].dot,
                              )}
                            />
                            {data.label}
                          </div>
                          {data.comment ? (
                            <div className="text-muted-foreground">
                              {data.comment}
                            </div>
                          ) : null}
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    dot
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
          {logs?.slice(-5).reverse().map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {format(log.periodStart, "MMM d, yyyy")}
                </p>
                {log.comment && (
                  <p className="text-sm text-muted-foreground">{log.comment}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    "capitalize",
                    habitRatingStyles[log.rating].badge,
                  )}
                >
                  {habitRatingLabels[log.rating]}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open log actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <LogHabitDialog
                      habitId={habit.id}
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
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <LogHabitDialog habitId={habit.id} />
      </CardFooter>
    </Card>
  );
}

