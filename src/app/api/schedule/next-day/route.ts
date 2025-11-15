import { connectToDatabase } from "@/lib/db";
import { Event } from "@/lib/models/event";
import { BacklogItem } from "@/lib/models/backlog-item";
import { eventResponseSchema } from "@/lib/schemas/event";
import { backlogItemResponseSchema } from "@/lib/schemas/backlog-item";
import { jsonResponse, errorResponse } from "@/lib/api";
import { dayRange, normalizeDay } from "@/lib/dates";
import { addDays } from "date-fns";

export async function GET() {
  try {
    await connectToDatabase();

    const now = new Date();
    // Get local date for display (midnight in user's timezone)
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextDayLocal = addDays(todayLocal, 1);
    // Use UTC normalization for querying - normalize the local date to ensure consistency
    // Query for events that match tomorrow's local date
    const rangeStart = normalizeDay(nextDayLocal);
    const rangeEnd = normalizeDay(new Date(nextDayLocal.getFullYear(), nextDayLocal.getMonth(), nextDayLocal.getDate() + 1));
    const range = { start: rangeStart, end: rangeEnd };

    const [events, backlog] = await Promise.all([
      Event.find({ day: { $gte: range.start, $lt: range.end } })
        .sort({ startTime: 1 })
        .lean(),
      BacklogItem.find({ isCompleted: false }).sort({ createdAt: -1 }).lean(),
    ]);

    const eventResults = events.map((event) =>
      eventResponseSchema.parse({
        ...event,
        id: event._id.toString(),
        favoriteId: event.favoriteId?.toString(),
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      }),
    );

    const backlogResults = backlog.map((item) =>
      backlogItemResponseSchema.parse({
        ...item,
        id: item._id.toString(),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        completedAt: item.completedAt ?? null,
      }),
    );

    return jsonResponse({
      day: nextDayLocal,
      events: eventResults,
      backlog: backlogResults,
    });
  } catch (error) {
    return errorResponse(error, "Failed to load next day's schedule");
  }
}

