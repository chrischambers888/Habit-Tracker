"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import {
  habitLogCreateSchema,
  type HabitLogResponse,
} from "@/lib/schemas/habit-log";
import { useUpsertHabitLog, useUpdateHabitLog } from "@/hooks/use-habits";
import {
  habitRatingLabels,
  habitRatingOrder,
  habitRatingStyles,
} from "@/lib/constants/habit-rating";
import type { HabitResponse } from "@/lib/schemas/habit";
import {
  formatPeriodLabel,
  getPeriodRange,
  getPeriodStartUtc,
  habitFrequencyLabels,
  normalizePeriodStart,
  WEEK_START,
} from "@/lib/habit-period";
import type { DateRange } from "react-day-picker";

type LogHabitDialogProps = {
  habitId: string;
  frequency: HabitResponse["frequency"];
  trigger?: React.ReactNode;
  initialLog?: HabitLogResponse;
  onCompleted?: () => void;
};

const createSchema = habitLogCreateSchema.omit({ habitId: true });

type LogHabitFormValues = z.input<typeof createSchema>;
type LogHabitSubmitValues = z.output<typeof createSchema>;

export function LogHabitDialog({
  habitId,
  frequency,
  trigger,
  initialLog,
  onCompleted,
}: LogHabitDialogProps) {
  const [open, setOpen] = React.useState(false);
  const isEditing = Boolean(initialLog);
  const upsertLog = useUpsertHabitLog(habitId);
  const updateLog = useUpdateHabitLog(habitId);

  const defaultValues = React.useMemo(
    () =>
      ({
        periodStart: normalizePeriodStart(
          initialLog ? new Date(initialLog.periodStart) : new Date(),
          frequency
        ),
        rating: initialLog?.rating ?? "good",
        comment: initialLog?.comment ?? "",
      } satisfies LogHabitFormValues),
    [initialLog, frequency]
  );

  const form = useForm<LogHabitFormValues, unknown, LogHabitSubmitValues>({
    resolver: zodResolver(createSchema),
    defaultValues,
  });

  const currentRating = form.watch("rating");
  const currentRatingStyles = currentRating
    ? habitRatingStyles[currentRating]
    : undefined;

  const onSubmit = async (values: LogHabitSubmitValues) => {
    const payload: LogHabitSubmitValues = {
      ...values,
      periodStart: getPeriodStartUtc(values.periodStart, frequency),
    };

    if (isEditing && initialLog) {
      await updateLog.mutateAsync({
        logId: initialLog.id,
        input: payload,
      });
    } else {
      await upsertLog.mutateAsync(payload);
    }
    onCompleted?.();
    setOpen(false);
  };

  React.useEffect(() => {
    if (open && isEditing && initialLog) {
      form.reset({
        periodStart: normalizePeriodStart(
          new Date(initialLog.periodStart),
          frequency
        ),
        rating: initialLog.rating,
        comment: initialLog.comment ?? "",
      } satisfies LogHabitFormValues);
    }
  }, [open, isEditing, initialLog, form, frequency]);

  React.useEffect(() => {
    if (!open && !isEditing) {
      form.reset({
        periodStart: normalizePeriodStart(new Date(), frequency),
        rating: "good",
        comment: "",
      } satisfies LogHabitFormValues);
    }
  }, [form, open, isEditing, frequency]);

  const isSubmitting = isEditing ? updateLog.isPending : upsertLog.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="secondary" size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Log Progress
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Habit Log" : "Log Habit Progress"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 pt-2"
          >
            <FormField
              control={form.control}
              name="periodStart"
              render={({ field }) => {
                const rawValue =
                  field.value instanceof Date
                    ? field.value
                    : typeof field.value === "string" ||
                      typeof field.value === "number"
                    ? new Date(field.value)
                    : undefined;

                const value = rawValue
                  ? normalizePeriodStart(rawValue, frequency)
                  : undefined;

                const periodRange = value
                  ? getPeriodRange(value, frequency)
                  : undefined;

                const calendarRange = periodRange
                  ? { from: periodRange.start, to: periodRange.end }
                  : undefined;

                const isRangeMode = frequency !== "daily";

                const periodDescriptor = habitFrequencyLabels[frequency];

                const buttonLabel = value
                  ? formatPeriodLabel(value, frequency)
                  : `Select ${periodDescriptor}`;

                const handleSelect = (
                  selection: Date | DateRange | undefined
                ) => {
                  if (!selection) return;

                  if (!isRangeMode && selection instanceof Date) {
                    field.onChange(normalizePeriodStart(selection, frequency));
                    return;
                  }

                  if (
                    isRangeMode &&
                    selection &&
                    typeof selection === "object"
                  ) {
                    const range = selection as DateRange;
                    const nextDate = range?.from ?? range?.to;
                    if (!nextDate) return;
                    field.onChange(normalizePeriodStart(nextDate, frequency));
                  }
                };

                return (
                  <FormItem className="flex flex-col">
                    <FormLabel className="capitalize">
                      {periodDescriptor} to log
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !value && "text-muted-foreground"
                            )}
                          >
                            {value ? buttonLabel : <span>Select period</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode={isRangeMode ? "range" : "single"}
                          selected={isRangeMode ? calendarRange : value}
                          defaultMonth={value}
                          weekStartsOn={WEEK_START}
                          onSelect={handleSelect}
                          captionLayout={
                            frequency === "monthly"
                              ? "dropdown-buttons"
                              : "label"
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {frequency !== "daily" && (
                      <p className="text-xs text-muted-foreground">
                        {frequency === "weekly"
                          ? "Select any day in the week you want to log. We'll record the full week."
                          : "Select any day in the month you want to log. We'll record the full month."}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={cn(currentRatingStyles?.text)}>
                      Rating
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={cn(
                            "capitalize",
                            currentRatingStyles?.softBadge
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
                name="comment"
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Comment</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Optional notes"
                          rows={3}
                          {...rest}
                          value={value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Save Changes"
                  : "Save Log"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
