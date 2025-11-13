"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  FormDescription,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  habitCreateSchema,
  habitFrequency,
} from "@/lib/schemas/habit";
import { useCreateHabit } from "@/hooks/use-habits";
import { habitRatingStyles } from "@/lib/constants/habit-rating";

type HabitFormValues = z.input<typeof habitCreateSchema>;
type HabitFormSubmitValues = z.output<typeof habitCreateSchema>;

export function CreateHabitDialog() {
  const [open, setOpen] = React.useState(false);
  const createHabit = useCreateHabit();

  const form = useForm<HabitFormValues, unknown, HabitFormSubmitValues>({
    resolver: zodResolver(habitCreateSchema),
    defaultValues: {
      name: "",
      description: "",
      frequency: "daily",
      startDate: undefined,
      ratingDescriptions: {
        good: "",
        okay: "",
        bad: "",
      },
    } satisfies HabitFormValues,
  });

  const onSubmit = async (values: HabitFormSubmitValues) => {
    await createHabit.mutateAsync(values);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Habit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Habit</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 pt-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Morning workout" {...field} />
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
                        placeholder="Optional details about this habit"
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
                  Clarify what each rating means for this habit.
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
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {habitFrequency.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How often you plan to log this habit.
                    </FormDescription>
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
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Optional start date for tracking.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createHabit.isPending}>
                {createHabit.isPending ? "Saving..." : "Save Habit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

