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
import { CalendarClock, Clock, MoreHorizontal, Star, Pencil, Settings, ChevronUp, ChevronDown } from "lucide-react";
import { EventFormDialog } from "@/components/schedule/event-form-dialog";

type TimelineViewProps = {
  title: string;
  description?: string;
  day: Date;
  events: EventResponse[];
  emptyState?: React.ReactNode;
  favorites?: FavoriteEventResponse[];
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const PIXELS_PER_HOUR = 60; // Height of each hour in pixels
type HourIncrement = 1 | 2 | 4;

export function TimelineView({
  title,
  description,
  day,
  events,
  emptyState,
  favorites = [],
}: TimelineViewProps) {
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const createFavorite = useCreateFavorite();
  const [editingEvent, setEditingEvent] = React.useState<EventResponse | null>(null);
  const [hourIncrement, setHourIncrement] = React.useState<HourIncrement>(4);
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const [containerHeight, setContainerHeight] = React.useState(0);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const now = new Date();
  const isToday = day.toDateString() === now.toDateString();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimePosition = isToday
    ? (currentHour + currentMinute / 60) * PIXELS_PER_HOUR
    : null;

  // Calculate events with/without times early
  const eventsWithTimes = events.filter((e) => e.startTime || e.endTime);
  const eventsWithoutTimes = events.filter((e) => !e.startTime && !e.endTime);

  // Helper functions for event positioning (defined early for use in useMemo)
  const getEventPosition = React.useCallback((event: EventResponse) => {
    if (event.startTime) {
      const [hour, minute] = event.startTime.split(":").map(Number);
      return (hour + minute / 60) * PIXELS_PER_HOUR;
    } else if (event.endTime) {
      // If only end time, position at top (start of day)
      return 0;
    }
    return null;
  }, []);

  const getEventHeight = React.useCallback((event: EventResponse) => {
    if (event.startTime && event.endTime) {
      const [startHour, startMinute] = event.startTime.split(":").map(Number);
      const [endHour, endMinute] = event.endTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      const duration = Math.max(endMinutes - startMinutes, 15); // Minimum 15 minutes
      return (duration / 60) * PIXELS_PER_HOUR;
    } else if (event.startTime) {
      // If only start time, default to 1 hour
      return PIXELS_PER_HOUR;
    } else if (event.endTime) {
      // If only end time, show from start of day to end time
      const [endHour, endMinute] = event.endTime.split(":").map(Number);
      return (endHour + endMinute / 60) * PIXELS_PER_HOUR;
    }
    // No times - show as a small indicator at the top
    return 20;
  }, []);

  // Track scroll position and container height
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateScrollInfo = () => {
      setScrollPosition(container.scrollTop);
      setContainerHeight(container.clientHeight);
    };

    updateScrollInfo();
    container.addEventListener('scroll', updateScrollInfo);
    const resizeObserver = new ResizeObserver(updateScrollInfo);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', updateScrollInfo);
      resizeObserver.disconnect();
    };
  }, []);

  // Scroll to center current time on mount for today's timeline
  React.useEffect(() => {
    if (isToday && currentTimePosition !== null && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        const containerHeight = container.clientHeight;
        // Account for sticky header if events without times exist
        const stickyHeaderHeight = eventsWithoutTimes.length > 0 ? 100 : 0;
        const scrollPosition = currentTimePosition + stickyHeaderHeight - containerHeight / 2;
        
        // Scroll to center the current time
        container.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'auto', // Instant scroll on load
        });
      }, 0);
    }
  }, [isToday, currentTimePosition, eventsWithoutTimes.length]);

  // Check if there are events above or below viewport
  const hasEventsAbove = React.useMemo(() => {
    if (eventsWithTimes.length === 0) return false;
    const stickyHeaderHeight = eventsWithoutTimes.length > 0 ? 100 : 0;
    const viewportTop = scrollPosition + stickyHeaderHeight;
    return eventsWithTimes.some((event) => {
      const position = getEventPosition(event);
      return position !== null && position < viewportTop;
    });
  }, [eventsWithTimes, scrollPosition, eventsWithoutTimes.length, getEventPosition]);

  const hasEventsBelow = React.useMemo(() => {
    if (eventsWithTimes.length === 0) return false;
    const stickyHeaderHeight = eventsWithoutTimes.length > 0 ? 100 : 0;
    const viewportBottom = scrollPosition + containerHeight;
    const timelineHeight = 24 * PIXELS_PER_HOUR;
    return eventsWithTimes.some((event) => {
      const position = getEventPosition(event);
      const height = getEventHeight(event);
      if (position === null) return false;
      const eventBottom = position + height + stickyHeaderHeight;
      return eventBottom > viewportBottom && position + stickyHeaderHeight < timelineHeight + stickyHeaderHeight;
    });
  }, [eventsWithTimes, scrollPosition, containerHeight, eventsWithoutTimes.length, getEventPosition, getEventHeight]);

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
      startTime: event.startTime,
      endTime: event.endTime,
    });
  };

  // Group hours by increment
  const hourGroups = React.useMemo(() => {
    const groups: number[][] = [];
    for (let i = 0; i < 24; i += hourIncrement) {
      groups.push(HOURS.slice(i, i + hourIncrement));
    }
    return groups;
  }, [hourIncrement]);

  const pixelsPerIncrement = PIXELS_PER_HOUR * hourIncrement;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock className="h-5 w-5" />
              <span>{title}</span>
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Timeline settings</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setHourIncrement(1)}>
                {hourIncrement === 1 && "✓ "}1 hour increments
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHourIncrement(2)}>
                {hourIncrement === 2 && "✓ "}2 hour increments
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHourIncrement(4)}>
                {hourIncrement === 4 && "✓ "}4 hour increments
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          emptyState ?? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              No events scheduled yet.
            </div>
          )
        ) : (
          <div ref={scrollContainerRef} className="relative max-h-[600px] overflow-y-auto">
            {/* Indicator for events above viewport */}
            {hasEventsAbove && (
              <div className="sticky top-0 z-30 flex justify-center py-2 pointer-events-none">
                <div className="flex items-center gap-2 rounded-full bg-primary/90 text-primary-foreground px-3 py-1.5 text-xs font-medium shadow-lg pointer-events-auto">
                  <ChevronUp className="h-4 w-4" />
                  <span>More events above</span>
                </div>
              </div>
            )}
            {/* Events without times - shown at top, sticky */}
            {eventsWithoutTimes.length > 0 && (
              <div className="sticky top-0 z-20 mb-4 space-y-3 border-b bg-background pb-4 pt-2">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Events without specific times
                </div>
                {eventsWithoutTimes.map((event) => (
                  <EventBlock
                    key={event.id}
                    event={event}
                    position={0}
                    height={80}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDelete}
                    onFavorite={handleFavorite}
                    onEdit={setEditingEvent}
                    isFloating
                  />
                ))}
              </div>
            )}
            {/* Timeline grid */}
            <div className="relative border-l-2 border-muted" style={{ height: `${24 * PIXELS_PER_HOUR}px` }}>
              {hourGroups.map((hours, groupIndex) => {
                const startHour = hours[0];
                const endHour = hours[hours.length - 1];
                return (
                  <div
                    key={`group-${startHour}`}
                    className="flex items-start border-b border-dashed border-muted/50"
                    style={{ height: `${pixelsPerIncrement}px` }}
                  >
                    <div className="w-16 shrink-0 pt-1 text-xs text-muted-foreground">
                      {(() => {
                        const date = new Date();
                        date.setHours(startHour, 0, 0, 0);
                        const startTime = format(date, "h:mma");
                        if (hourIncrement > 1) {
                          date.setHours(endHour, 0, 0, 0);
                          const endTime = format(date, "h:mma");
                          return `${startTime} - ${endTime}`;
                        }
                        return startTime;
                      })()}
                    </div>
                    <div className="flex-1 relative">
                      {/* Show hour markers within the group if increment > 1 */}
                      {hourIncrement > 1 &&
                        hours.slice(1).map((hour) => (
                          <div
                            key={hour}
                            className="absolute left-0 right-0 border-t border-dashed border-muted/30"
                            style={{
                              top: `${((hour - startHour) * PIXELS_PER_HOUR)}px`,
                            }}
                          />
                        ))}
                      {/* Current time indicator */}
                      {currentTimePosition !== null &&
                        hours.includes(currentHour) && (
                          <div
                            className="absolute left-0 right-0 z-10 border-t-2 border-primary"
                            style={{
                              top: `${((currentHour - startHour) * PIXELS_PER_HOUR) + (currentMinute / 60) * PIXELS_PER_HOUR}px`,
                            }}
                          >
                            <div className="absolute -left-2 -top-1.5 h-3 w-3 rounded-full bg-primary" />
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Events positioned on timeline */}
            <div className="absolute top-0 left-16 right-0" style={{ height: `${24 * PIXELS_PER_HOUR}px` }}>
              {eventsWithTimes.map((event) => {
                const position = getEventPosition(event);
                const height = getEventHeight(event);

                if (position === null) return null;

                return (
                  <EventBlock
                    key={event.id}
                    event={event}
                    position={position}
                    height={height}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDelete}
                    onFavorite={handleFavorite}
                    onEdit={setEditingEvent}
                    isFloating={false}
                  />
                );
              })}
            </div>
            {/* Indicator for events below viewport */}
            {hasEventsBelow && (
              <div className="sticky bottom-0 z-30 flex justify-center py-2 pointer-events-none">
                <div className="flex items-center gap-2 rounded-full bg-primary/90 text-primary-foreground px-3 py-1.5 text-xs font-medium shadow-lg pointer-events-auto">
                  <ChevronDown className="h-4 w-4" />
                  <span>More events below</span>
                </div>
              </div>
            )}
          </div>
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

type EventBlockProps = {
  event: EventResponse;
  position: number;
  height: number;
  onToggleComplete: (event: EventResponse) => void;
  onDelete: (event: EventResponse) => void;
  onFavorite: (event: EventResponse) => void;
  onEdit: (event: EventResponse) => void;
  isFloating?: boolean;
};

function EventBlock({
  event,
  position,
  height,
  onToggleComplete,
  onDelete,
  onFavorite,
  onEdit,
  isFloating = false,
}: EventBlockProps) {
  return (
    <div
      className={cn(
        "group absolute left-0 right-4 rounded border p-2 transition-all overflow-hidden",
        isFloating && "relative",
        event.isCompleted
          ? "border-muted bg-muted/40"
          : "border-primary/50 bg-primary/10 hover:bg-primary/20",
      )}
      style={{
        top: `${position}px`,
        height: isFloating ? "auto" : `${Math.max(height, 60)}px`,
        minHeight: isFloating ? "auto" : "60px",
      }}
    >
      <div className="flex h-full items-start justify-between gap-2">
        <div className="flex flex-1 items-start gap-2 min-w-0 overflow-hidden">
          <Checkbox
            checked={event.isCompleted}
            onCheckedChange={() => onToggleComplete(event)}
            className="mt-0.5 shrink-0"
            aria-label={event.isCompleted ? "Mark as incomplete" : "Mark as complete"}
          />
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className={cn(
                  "text-sm font-semibold break-words",
                  event.isCompleted && "line-through text-muted-foreground",
                )}
              >
                {event.title}
              </h4>
              {event.isCompleted && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  Done
                </Badge>
              )}
            </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="break-words">
              {event.startTime && event.endTime
                ? `${event.startTime} – ${event.endTime}`
                : event.startTime
                  ? `After ${event.startTime}`
                  : event.endTime
                    ? `By ${event.endTime}`
                    : "Sometime today"}
            </span>
          </div>
            {event.description && (
              <p className="mt-1 text-xs text-muted-foreground break-words line-clamp-2">
                {event.description}
              </p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
              <MoreHorizontal className="h-3 w-3" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(event)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleComplete(event)}>
              {event.isCompleted ? "Mark as incomplete" : "Mark as complete"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFavorite(event)}>
              <Star className="mr-2 h-4 w-4" />
              Save as favorite
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(event)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

