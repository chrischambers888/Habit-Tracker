"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { eventCreateSchema } from "@/lib/schemas/event";
import { useCreateEvent } from "@/hooks/use-schedule";
import type { FavoriteEventResponse } from "@/lib/schemas/favorite-event";

type EventFormValues = z.input<typeof eventCreateSchema>;
type EventFormSubmitValues = z.output<typeof eventCreateSchema>;

type EventFormDialogProps = {
  variant?: "today" | "next";
  label: string;
  defaultDay: Date;
  favorites?: FavoriteEventResponse[];
  trigger?: React.ReactNode;
  onCreated?: () => void;
};

export function EventFormDialog({
  variant = "today",
  label,
  defaultDay,
  favorites = [],
  trigger,
  onCreated,
}: EventFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const createEvent = useCreateEvent();

  const form = useForm<EventFormValues, unknown, EventFormSubmitValues>({
    resolver: zodResolver(eventCreateSchema),
    defaultValues: {
      day: defaultDay,
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      favoriteId: undefined,
    } satisfies EventFormValues,
  });

  const handleFavoriteSelect = (favoriteId: string) => {
    const favorite = favorites.find((item) => item.id === favoriteId);
    if (!favorite) return;

    form.setValue("title", favorite.title);
    form.setValue("description", favorite.description ?? "");
    form.setValue("startTime", favorite.startTime ?? "");
    form.setValue("endTime", favorite.endTime ?? "");
    form.setValue("favoriteId", favorite.id);
  };

  const onSubmit = async (values: EventFormSubmitValues) => {
    await createEvent.mutateAsync(values);
    form.reset({
      day: defaultDay,
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      favoriteId: undefined,
    } satisfies EventFormValues);
    setOpen(false);
    onCreated?.();
  };

  React.useEffect(() => {
    if (open) {
      form.reset({
        day: defaultDay,
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        favoriteId: undefined,
      } satisfies EventFormValues);
    }
  }, [defaultDay, form, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={variant === "today" ? "outline" : "default"}>
            {label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 pt-2"
          >
            <FormField
              control={form.control}
              name="day"
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
                    <FormLabel>Day</FormLabel>
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
                              <span>Select day</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Start time</FormLabel>
                      <FormControl>
                        <Input type="time" {...rest} value={value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>End time</FormLabel>
                      <FormControl>
                        <Input type="time" {...rest} value={value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Focus work" {...field} />
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
                        placeholder="Optional details or links"
                        {...rest}
                        value={value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            {favorites.length > 0 && (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4" /> Quick add from favorite
                </FormLabel>
                <Select onValueChange={handleFavoriteSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a favorite event" />
                  </SelectTrigger>
                  <SelectContent>
                    {favorites.map((favorite) => (
                      <SelectItem key={favorite.id} value={favorite.id}>
                        {favorite.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Prefill the form using a saved favorite.
                </FormDescription>
              </FormItem>
            )}
            <DialogFooter>
              <Button type="submit" disabled={createEvent.isPending}>
                {createEvent.isPending ? "Saving..." : "Save Event"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

