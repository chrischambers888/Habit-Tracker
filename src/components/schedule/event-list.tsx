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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { EventResponse } from "@/lib/schemas/event";
import { useUpdateEvent, useDeleteEvent, useCreateFavorite } from "@/hooks/use-schedule";
import { CalendarClock, Clock, MoreHorizontal, Star } from "lucide-react";

type EventListProps = {
  title: string;
  description?: string;
  day: Date;
  events: EventResponse[];
  emptyState?: React.ReactNode;
};

export function EventList({
  title,
  description,
  day,
  events,
  emptyState,
}: EventListProps) {
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const createFavorite = useCreateFavorite();

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
    const confirmed = window.confirm(`Delete event "${event.title}"?`);
    if (!confirmed) return;
    deleteEvent.mutate(event.id);
  };

  const handleFavorite = (event: EventResponse) => {
    createFavorite.mutate({
      title: event.title,
      description: event.description ?? "",
      startTime: event.startTime ?? "",
      endTime: event.endTime ?? "",
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
              event.startTime &&
              event.endTime &&
              isWithinTimeRange(event.startTime, event.endTime, now);
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
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold">
                        {event.title}
                      </h3>
                      {event.isCompleted && (
                        <Badge variant="secondary">Done</Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      {event.startTime ? (
                        <>
                          <Clock className="h-4 w-4" />
                          <span>
                            {event.startTime}
                            {event.endTime ? ` – ${event.endTime}` : ""}
                          </span>
                        </>
                      ) : (
                        <span>No set time</span>
                      )}
                    </div>
                    {event.description && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {event.description}
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
                <div className="mt-2 text-xs text-muted-foreground">
                  Created {format(event.createdAt, "MMM d, yyyy")}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
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

