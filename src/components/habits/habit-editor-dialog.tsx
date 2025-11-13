"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { habitUpdateSchema, type HabitResponse } from "@/lib/schemas/habit";
import { useUpdateHabit } from "@/hooks/use-habits";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { habitRatingStyles } from "@/lib/constants/habit-rating";

type HabitEditorDialogProps = {
  habit: HabitResponse;
  trigger?: React.ReactNode;
};

type HabitEditorFormValues = z.input<typeof habitUpdateSchema>;
type HabitEditorSubmitValues = z.output<typeof habitUpdateSchema>;

export function HabitEditorDialog({ habit, trigger }: HabitEditorDialogProps) {
  const [open, setOpen] = React.useState(false);
  const updateHabit = useUpdateHabit();
  const form = useForm<HabitEditorFormValues, unknown, HabitEditorSubmitValues>({
    resolver: zodResolver(habitUpdateSchema),
    defaultValues: {
      name: habit.name,
      description: habit.description ?? "",
      frequency: habit.frequency,
      startDate: habit.startDate ? new Date(habit.startDate) : undefined,
      ratingDescriptions: {
        good: habit.ratingDescriptions?.good ?? "",
        okay: habit.ratingDescriptions?.okay ?? "",
        bad: habit.ratingDescriptions?.bad ?? "",
      },
    } satisfies HabitEditorFormValues,
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: habit.name,
        description: habit.description ?? "",
        frequency: habit.frequency,
        startDate: habit.startDate ? new Date(habit.startDate) : undefined,
        ratingDescriptions: {
          good: habit.ratingDescriptions?.good ?? "",
          okay: habit.ratingDescriptions?.okay ?? "",
          bad: habit.ratingDescriptions?.bad ?? "",
        },
      } satisfies HabitEditorFormValues);
    }
  }, [habit, open, form]);

  const onSubmit = async (values: HabitEditorSubmitValues) => {
    await updateHabit.mutateAsync({
      id: habit.id,
      input: values,
    });
    setOpen(false);
  };

  const isPending = updateHabit.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Habit</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 pt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Habit name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => {
                const { value, ...rest } = field;
                return (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional description"
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
            <div className="grid gap-3">
              <div>
                <p className="text-sm font-medium leading-none">Rating descriptions</p>
                <p className="text-sm text-muted-foreground">
                  Adjust what each rating means for this habit.
                </p>
              </div>
              <FormField
                control={form.control}
                name="ratingDescriptions.good"
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel
                        className={cn(
                          "text-xs uppercase tracking-wide",
                          habitRatingStyles.good.text,
                        )}
                      >
                        Good
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what a good outcome looks like"
                          {...rest}
                          value={value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="ratingDescriptions.okay"
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel
                        className={cn(
                          "text-xs uppercase tracking-wide",
                          habitRatingStyles.okay.text,
                        )}
                      >
                        Okay
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Define what an okay day looks like"
                          {...rest}
                          value={value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="ratingDescriptions.bad"
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel
                        className={cn(
                          "text-xs uppercase tracking-wide",
                          habitRatingStyles.bad.text,
                        )}
                      >
                        Bad
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Clarify when a day should be rated bad"
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
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => {
                const value =
                  field.value instanceof Date
                    ? field.value
                    : typeof field.value === "string" ||
                        typeof field.value === "number"
                      ? new Date(field.value)
                      : undefined;

                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !value && "text-muted-foreground",
                            )}
                          >
                            {value ? (
                              format(value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

