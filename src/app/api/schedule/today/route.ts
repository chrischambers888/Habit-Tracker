import { connectToDatabase } from "@/lib/db";
import { Event } from "@/lib/models/event";
import { BacklogItem } from "@/lib/models/backlog-item";
import { eventResponseSchema } from "@/lib/schemas/event";
import { backlogItemResponseSchema } from "@/lib/schemas/backlog-item";
import { jsonResponse, errorResponse } from "@/lib/api";
import { dayRange, normalizeDay } from "@/lib/dates";

export async function GET() {
  try {
    await connectToDatabase();

    const today = normalizeDay(new Date());
    const range = dayRange(today);

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
      day: today,
      now: new Date(),
      events: eventResults,
      backlog: backlogResults,
    });
  } catch (error) {
    return errorResponse(error, "Failed to load today's schedule");
  }
}

