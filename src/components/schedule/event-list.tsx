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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { EventResponse } from "@/lib/schemas/event";
import type { FavoriteEventResponse } from "@/lib/schemas/favorite-event";
import { useUpdateEvent, useDeleteEvent, useCreateFavorite } from "@/hooks/use-schedule";
import { CalendarClock, Clock, MoreHorizontal, Star, Pencil } from "lucide-react";
import { EventFormDialog } from "@/components/schedule/event-form-dialog";

type EventListProps = {
  title: string;
  description?: string;
  day: Date;
  events: EventResponse[];
  emptyState?: React.ReactNode;
  favorites?: FavoriteEventResponse[];
};

export function EventList({
  title,
  description,
  day,
  events,
  emptyState,
  favorites = [],
}: EventListProps) {
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const createFavorite = useCreateFavorite();
  const [editingEvent, setEditingEvent] = React.useState<EventResponse | null>(null);

  const now = new Date();
  const isToday =
    day.toDateString() === new Date().toDateString();

  const handleToggleComplete = (event: EventResponse) => {
    updateEvent.mutate({
      id: event.id,
      input: { isCompleted: !event.isCompleted },
    });
  };

  const handleDelete = (event: EventResponse) => {
    deleteEvent.mutate(event.id);
  };

  const handleFavorite = (event: EventResponse) => {
    createFavorite.mutate({
      title: event.title,
      description: event.description ?? "",
      startTime: event.startTime,
      endTime: event.endTime,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarClock className="h-5 w-5" />
          <span>{title}</span>
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {events.length === 0 ? (
          emptyState ?? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              No events scheduled yet.
            </div>
          )
        ) : (
          events.map((event) => {
            const isCurrent =
              isToday &&
              ((event.startTime &&
                event.endTime &&
                isWithinTimeRange(event.startTime, event.endTime, now)) ||
                (event.startTime &&
                  !event.endTime &&
                  now >= getTimeFromString(event.startTime, day)) ||
                (!event.startTime &&
                  event.endTime &&
                  now <= getTimeFromString(event.endTime, day)));
            return (
              <div
                key={event.id}
                className={cn(
                  "group rounded-lg border p-4 transition-colors",
                  event.isCompleted
                    ? "border-muted bg-muted/40"
                    : isCurrent
                      ? "border-primary/50 bg-primary/5"
                      : "",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-1 items-start gap-3">
                    <Checkbox
                      checked={event.isCompleted}
                      onCheckedChange={() => handleToggleComplete(event)}
                      className="mt-1"
                      aria-label={event.isCompleted ? "Mark as incomplete" : "Mark as complete"}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3
                          className={cn(
                            "text-base font-semibold",
                            event.isCompleted && "line-through text-muted-foreground"
                          )}
                        >
                          {event.title}
                        </h3>
                        {event.isCompleted && (
                          <Badge variant="secondary">Done</Badge>
                        )}
                      </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      {event.startTime && event.endTime ? (
                        <>
                          <Clock className="h-4 w-4" />
                          <span>
                            {event.startTime} – {event.endTime}
                          </span>
                        </>
                      ) : event.startTime ? (
                        <>
                          <Clock className="h-4 w-4" />
                          <span>After {event.startTime}</span>
                        </>
                      ) : event.endTime ? (
                        <>
                          <Clock className="h-4 w-4" />
                          <span>By {event.endTime}</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4" />
                          <span>Sometime today</span>
                        </>
                      )}
                    </div>
                      {event.description && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingEvent(event)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleComplete(event)}>
                        {event.isCompleted ? "Mark as incomplete" : "Mark as complete"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleFavorite(event)}>
                        <Star className="mr-2 h-4 w-4" />
                        Save as favorite
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(event)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
      {editingEvent && (
        <EventFormDialog
          label="Edit Event"
          defaultDay={editingEvent.day ? new Date(editingEvent.day) : day}
          event={editingEvent}
          favorites={favorites}
          onUpdated={() => {
            setEditingEvent(null);
          }}
        />
      )}
    </Card>
  );
}

function isWithinTimeRange(startTime: string, endTime: string, current: Date) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const start = new Date(current);
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date(current);
  end.setHours(endHour, endMinute, 0, 0);

  return current >= start && current <= end;
}

function getTimeFromString(timeString: string, day: Date): Date {
  const [hour, minute] = timeString.split(":").map(Number);
  const date = new Date(day);
  date.setHours(hour, minute, 0, 0);
  return date;
}

