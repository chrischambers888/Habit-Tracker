"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQueries } from "@tanstack/react-query";
import { z } from "zod";
import { ListChecks, Loader2, Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { habitRating } from "@/lib/schemas/shared";
import {
  habitRatingLabels,
  habitRatingOrder,
  habitRatingStyles,
} from "@/lib/constants/habit-rating";
import { useBulkUpsertHabitLogs, useHabits } from "@/hooks/use-habits";
import { habitLogsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import {
  getPeriodStartUtc,
  habitFrequencyLabels,
  hasLogForPeriod,
  isHabitActiveThisPeriod,
} from "@/lib/habit-period";
import type { HabitResponse } from "@/lib/schemas/habit";
import type { HabitLogResponse } from "@/lib/schemas/habit-log";
import { toast } from "@/hooks/use-toast";

type HabitFrequencyFilter = HabitResponse["frequency"];

const bulkEntrySchema = z.object({
  include: z.boolean().default(true),
  rating: habitRating.default("good"),
  comment: z
    .string()
    .trim()
    .max(500, "Comment must be 500 characters or fewer")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

const bulkFormSchema = z.object({
  entries: z.record(z.string(), bulkEntrySchema).default({}),
  expanded: z.record(z.string(), z.boolean()).default({}),
});

type BulkFormValues = z.infer<typeof bulkFormSchema>;
type BulkFormInputValues = z.input<typeof bulkFormSchema>;

const frequencyOrder: HabitFrequencyFilter[] = ["daily", "weekly", "monthly"];

export function BulkLogHabitsDialog() {
  const [open, setOpen] = React.useState(false);
  const [frequency, setFrequency] =
    React.useState<HabitFrequencyFilter>("daily");
  const referenceDateRef = React.useRef(new Date());

  React.useEffect(() => {
    if (open) {
      referenceDateRef.current = new Date();
    }
  }, [open]);

  const referenceDate = referenceDateRef.current;

  const { data: habits, isLoading: isLoadingHabits } = useHabits();
  const bulkLogMutation = useBulkUpsertHabitLogs();

  const habitList = habits ?? [];

  const logsQueries = useQueries({
    queries: React.useMemo(
      () =>
        habitList.map((habit) => ({
          queryKey: queryKeys.habitLogs(habit.id),
          queryFn: () => habitLogsApi.list(habit.id),
          enabled: open,
          staleTime: 1000 * 60,
        })),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [habitList.map((habit) => habit.id).join(","), open]
    ),
  });

  const logsMap = React.useMemo(() => {
    const map = new Map<string, HabitLogResponse[] | undefined>();
    habitList.forEach((habit, index) => {
      map.set(habit.id, logsQueries[index]?.data);
    });
    return map;
  }, [habitList, logsQueries]);

  const logsStatus = React.useMemo(() => {
    if (!open) return { isLoading: false, hasError: false };
    const isLoading = logsQueries.some((query) => query.status === "pending");
    const hasError = logsQueries.some((query) => query.status === "error");
    return { isLoading, hasError };
  }, [logsQueries, open]);

  const allUnloggedHabits = React.useMemo(() => {
    if (!habits || logsStatus.isLoading || logsStatus.hasError) return [];

    return habits.filter((habit) => {
      if (!isHabitActiveThisPeriod(habit, referenceDate)) return false;
      const logs = logsMap.get(habit.id);
      return !hasLogForPeriod(logs, habit.frequency, referenceDate);
    });
  }, [
    habits,
    logsMap,
    logsStatus.hasError,
    logsStatus.isLoading,
    referenceDate,
  ]);

  const unloggedCounts = React.useMemo(() => {
    return allUnloggedHabits.reduce<Record<HabitFrequencyFilter, number>>(
      (acc, habit) => {
        acc[habit.frequency] += 1;
        return acc;
      },
      { daily: 0, weekly: 0, monthly: 0 }
    );
  }, [allUnloggedHabits]);

  const unloggedHabitsByFrequency = React.useMemo(() => {
    return allUnloggedHabits.filter((habit) => habit.frequency === frequency);
  }, [allUnloggedHabits, frequency]);

  const unloggedHabitIds = React.useMemo(() => {
    return new Set(allUnloggedHabits.map((habit) => habit.id));
  }, [allUnloggedHabits]);

  const form = useForm<BulkFormInputValues, unknown, BulkFormValues>({
    resolver: zodResolver(bulkFormSchema),
    defaultValues: {
      entries: {},
      expanded: {},
    },
  });

  React.useEffect(() => {
    if (!open) return;

    unloggedHabitsByFrequency.forEach((habit) => {
      const includePath = `entries.${habit.id}.include` as const;
      const ratingPath = `entries.${habit.id}.rating` as const;
      const commentPath = `entries.${habit.id}.comment` as const;

      const includeValue = form.getValues(includePath);
      if (includeValue === undefined) {
        form.setValue(includePath, habit.frequency === "daily");
      }

      const ratingValue = form.getValues(ratingPath);
      if (!ratingValue) {
        form.setValue(ratingPath, "good");
      }

      const commentValue = form.getValues(commentPath);
      if (commentValue === undefined) {
        form.setValue(commentPath, "");
      }
    });
  }, [form, open, unloggedHabitsByFrequency]);

  const watchedEntries = form.watch("entries");
  const expandedEntries = form.watch("expanded");

  const selectedCount = React.useMemo(() => {
    return allUnloggedHabits.reduce((count, habit) => {
      const entry = watchedEntries?.[habit.id];
      const include =
        entry?.include ?? (habit.frequency === "daily" ? true : false);

      return include ? count + 1 : count;
    }, 0);
  }, [allUnloggedHabits, watchedEntries]);

  const handleSubmit = async (values: BulkFormValues) => {
    if (!habits) return;

    const entries = allUnloggedHabits.flatMap((habit) => {
      const entry = values.entries?.[habit.id];
      const include =
        entry?.include ?? (habit.frequency === "daily" ? true : false);

      if (!include) return [];

      const periodStart = getPeriodStartUtc(referenceDate, habit.frequency);

      return [
        {
          habitId: habit.id,
          input: {
            periodStart,
            rating: entry?.rating ?? "good",
            comment: entry?.comment,
          },
        },
      ];
    });

    if (entries.length === 0) {
      toast({
        title: "No habits selected",
        description: "Choose at least one habit to log or adjust your filters.",
      });
      return;
    }

    try {
      const result = await bulkLogMutation.mutateAsync(entries);

      if (!result || result.length === 0) {
        toast({
          title: "Nothing logged",
          description: "No habits were updated. Please try again.",
        });
        return;
      }

      form.reset({ entries: {}, expanded: {} });
      setOpen(false);
      setFrequency("daily");
    } catch (error) {
      console.error("Bulk log failed", error);
      toast({
        title: "Unable to log habits",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const resetAndClose = () => {
    setOpen(false);
    setFrequency("daily");
    form.reset({ entries: {}, expanded: {} });
  };

  const showLoadingState = open && (isLoadingHabits || logsStatus.isLoading);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ListChecks className="mr-2 h-4 w-4" />
          Quick Log Habits
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Log multiple habits</DialogTitle>
          <DialogDescription>
            Capture today&apos;s progress across your habits without opening
            each card.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-6"
          >
            <div className="flex items-center justify-between gap-2">
              <Tabs
                value={frequency}
                onValueChange={(value) =>
                  setFrequency(value as HabitFrequencyFilter)
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  {frequencyOrder.map((item) => (
                    <TabsTrigger key={item} value={item} className="capitalize">
                      <span className="flex items-center gap-2">
                        {item}
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                          {unloggedCounts[item]}
                        </span>
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                Only habits without a log for the current period are shown.
              </div>
            </div>
            {logsStatus.hasError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                Unable to load habit logs. Please try again later.
              </div>
            ) : showLoadingState ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing your habits...
              </div>
            ) : unloggedHabitsByFrequency.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center text-sm text-muted-foreground">
                <Sparkles className="h-5 w-5" />
                {`All ${frequency} habits are logged for this period.`}
              </div>
            ) : (
              <ScrollArea className="h-[360px]">
                <div className="grid gap-4 pr-4">
                  {unloggedHabitsByFrequency.map((habit) => {
                    const isExpanded = expandedEntries?.[habit.id] ?? false;

                    return (
                      <Card key={habit.id}>
                        <CardHeader className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                          <CardTitle className="text-base font-semibold">
                            {habit.name}
                          </CardTitle>
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              className="px-1.5 text-[10px] md:hidden"
                              onClick={() => {
                                const expanded = form.getValues(
                                  `expanded.${habit.id}` as const
                                );
                                form.setValue(
                                  `expanded.${habit.id}` as const,
                                  !expanded
                                );
                              }}
                            >
                              Comment
                            </Button>
                            <FormField
                              control={form.control}
                              name={`entries.${habit.id}.include`}
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-2">
                                  <FormLabel className="text-xs font-medium uppercase tracking-wide">
                                    Log
                                  </FormLabel>
                                  <FormControl>
                                    <Switch
                                      checked={field.value ?? true}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
                          <FormField
                            control={form.control}
                            name={`entries.${habit.id}.rating`}
                            render={({ field }) => (
                              <FormItem className="w-fit min-w-[7rem] md:min-w-[8rem]">
                                <FormLabel
                                  className={cn(
                                    "text-xs uppercase tracking-wide",
                                    habitRatingStyles[
                                      field.value as keyof typeof habitRatingStyles
                                    ]?.text
                                  )}
                                >
                                  Rating
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value ?? "good"}
                                >
                                  <FormControl>
                                    <SelectTrigger
                                      className={cn(
                                        "h-8 w-[7.5rem] min-w-[7rem] justify-start gap-2 capitalize",
                                        habitRatingStyles[
                                          field.value as keyof typeof habitRatingStyles
                                        ]?.softBadge
                                      )}
                                    >
                                      <SelectValue placeholder="Select rating" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {habitRatingOrder.map((value) => (
                                      <SelectItem
                                        key={value}
                                        value={value}
                                        className={cn(
                                          "flex items-center gap-2 capitalize",
                                          habitRatingStyles[value].text
                                        )}
                                      >
                                        <span
                                          className={cn(
                                            "h-2 w-2 rounded-full",
                                            habitRatingStyles[value].dot
                                          )}
                                        />
                                        {habitRatingLabels[value]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`entries.${habit.id}.comment`}
                            render={({ field }) => (
                              <FormItem
                                className={cn(
                                  isExpanded ? "block" : "hidden md:block",
                                  "w-full md:flex-1"
                                )}
                              >
                                <FormLabel className="text-xs uppercase tracking-wide">
                                  Comment
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    ref={(node) => {
                                      field.ref(node);
                                      if (node) {
                                        node.style.overflowY = "hidden";
                                        node.style.height = "auto";
                                        node.style.height = `${node.scrollHeight}px`;
                                      }
                                    }}
                                    rows={1}
                                    className="min-h-[2.25rem] resize-none overflow-hidden"
                                    placeholder={`Optional note for the ${
                                      habitFrequencyLabels[habit.frequency]
                                    }`}
                                    onChange={(event) => {
                                      field.onChange(event);
                                      const target = event.target;
                                      target.style.overflowY = "hidden";
                                      target.style.height = "auto";
                                      target.style.height = `${target.scrollHeight}px`;
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedCount > 0
                  ? `Ready to log ${selectedCount} habit${
                      selectedCount === 1 ? "" : "s"
                    }.`
                  : "Select at least one habit to log."}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetAndClose}
                  disabled={bulkLogMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={bulkLogMutation.isPending || selectedCount === 0}
                >
                  {bulkLogMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging...
                    </>
                  ) : (
                    `Log ${selectedCount} habit${
                      selectedCount === 1 ? "" : "s"
                    }`
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
