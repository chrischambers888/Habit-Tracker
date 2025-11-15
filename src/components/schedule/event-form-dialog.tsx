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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { eventCreateSchema, eventUpdateSchema } from "@/lib/schemas/event";
import { useCreateEvent, useUpdateEvent } from "@/hooks/use-schedule";
import type { FavoriteEventResponse } from "@/lib/schemas/favorite-event";
import type { EventResponse } from "@/lib/schemas/event";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type EventFormValues = z.input<typeof eventCreateSchema>;
type EventFormSubmitValues = z.output<typeof eventCreateSchema>;
type EventUpdateFormValues = z.input<typeof eventUpdateSchema>;
type EventUpdateFormSubmitValues = z.output<typeof eventUpdateSchema>;

type EventFormDialogProps = {
  variant?: "today" | "next";
  label: string;
  defaultDay: Date;
  favorites?: FavoriteEventResponse[];
  trigger?: React.ReactNode;
  event?: EventResponse; // If provided, dialog is in edit mode
  onCreated?: () => void;
  onUpdated?: () => void;
};

export function EventFormDialog({
  variant = "today",
  label,
  defaultDay,
  favorites = [],
  trigger,
  event,
  onCreated,
  onUpdated,
}: EventFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [favoritePopoverOpen, setFavoritePopoverOpen] = React.useState(false);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const isEditMode = !!event;

  const form = useForm<EventFormValues | EventUpdateFormValues, unknown, EventFormSubmitValues | EventUpdateFormSubmitValues>({
    resolver: zodResolver(isEditMode ? eventUpdateSchema : eventCreateSchema),
    defaultValues: {
      day: event?.day ? new Date(event.day) : defaultDay,
      title: event?.title ?? "",
      description: event?.description ?? "",
      startTime: event?.startTime,
      endTime: event?.endTime,
      favoriteId: event?.favoriteId,
    } satisfies EventFormValues,
  });

  const handleFavoriteSelect = (favoriteId: string) => {
    const favorite = favorites.find((item) => item.id === favoriteId);
    if (!favorite) return;

    form.setValue("title", favorite.title);
    form.setValue("description", favorite.description ?? "");
    form.setValue("startTime", favorite.startTime);
    form.setValue("endTime", favorite.endTime);
    form.setValue("favoriteId", favorite.id);
    setFavoritePopoverOpen(false);
  };

  const onSubmit = async (values: EventFormSubmitValues | EventUpdateFormSubmitValues) => {
    if (isEditMode && event) {
      await updateEvent.mutateAsync({
        id: event.id,
        input: values as EventUpdateFormSubmitValues,
      });
      setSubmitted(true);
      setOpen(false);
      onUpdated?.();
    } else {
      await createEvent.mutateAsync(values as EventFormSubmitValues);
      form.reset({
        day: defaultDay,
        title: "",
        description: "",
        startTime: undefined,
        endTime: undefined,
        favoriteId: undefined,
      } satisfies EventFormValues);
      setOpen(false);
      onCreated?.();
    }
  };

  // Reset form when dialog closes or when switching between create/edit modes
  React.useEffect(() => {
    if (!open) {
      if (isEditMode && event) {
        form.reset({
          day: event.day ? new Date(event.day) : defaultDay,
          title: event.title ?? "",
          description: event.description ?? "",
          startTime: event.startTime,
          endTime: event.endTime,
          favoriteId: event.favoriteId,
        } satisfies EventFormValues);
      } else {
        form.reset({
          day: defaultDay,
          title: "",
          description: "",
          startTime: undefined,
          endTime: undefined,
          favoriteId: undefined,
        } satisfies EventFormValues);
      }
    }
  }, [open, defaultDay, form, isEditMode, event]);

  // Auto-open dialog when event is provided (edit mode)
  React.useEffect(() => {
    if (event && !open) {
      setOpen(true);
    }
  }, [event, open]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    // If dialog is closed in edit mode without submitting, call onUpdated to reset state
    if (!newOpen && isEditMode && event && !submitted) {
      onUpdated?.();
    }
    if (!newOpen) {
      setSubmitted(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isEditMode && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button variant={variant === "today" ? "outline" : "default"}>
              {label}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Event" : label}</DialogTitle>
        </DialogHeader>
        {!isEditMode && favorites.length > 0 && (
          <div className="flex items-center justify-end pb-2">
            <Popover open={favoritePopoverOpen} onOpenChange={setFavoritePopoverOpen}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Quick add from favorite</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <PopoverContent className="w-64 p-0" align="end">
                <div className="p-2">
                  <p className="px-2 py-1.5 text-sm font-semibold">Select a favorite</p>
                  <div className="mt-1 space-y-1">
                    {favorites.map((favorite) => (
                      <button
                        key={favorite.id}
                        onClick={() => handleFavoriteSelect(favorite.id)}
                        className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        {favorite.title}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
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
                  const { value, onChange, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Start time (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...rest}
                          value={value ?? ""}
                          onChange={(e) => {
                            onChange(e.target.value || undefined);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Event won&apos;t happen before this time
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => {
                  const { value, onChange, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>End time (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...rest}
                          value={value ?? ""}
                          onChange={(e) => {
                            onChange(e.target.value || undefined);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Event will be over by this time
                      </FormDescription>
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
            <DialogFooter>
              <Button
                type="submit"
                disabled={isEditMode ? updateEvent.isPending : createEvent.isPending}
              >
                {isEditMode
                  ? updateEvent.isPending
                    ? "Updating..."
                    : "Update Event"
                  : createEvent.isPending
                    ? "Saving..."
                    : "Save Event"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

