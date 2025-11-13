import { connectToDatabase } from "@/lib/db";
import { Event } from "@/lib/models/event";
import {
  eventCreateSchema,
  eventResponseSchema,
} from "@/lib/schemas/event";
import { jsonResponse, errorResponse, parseJsonRequest } from "@/lib/api";
import { toPlainObject } from "@/lib/mongo";
import { dayRange, normalizeDay } from "@/lib/dates";
import { addMilliseconds } from "date-fns";

const millisecondsInDay = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const day = searchParams.get("day");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const query: Record<string, unknown> = {};

    if (day) {
      const range = dayRange(day);
      query.day = { $gte: range.start, $lt: range.end };
    } else if (from || to) {
      if (from) {
        query.day = { ...(query.day as object), $gte: normalizeDay(from) };
      }
      if (to) {
        const end = addMilliseconds(normalizeDay(to), millisecondsInDay);
        query.day = { ...(query.day as object), $lt: end };
      }
    }

    const events = await Event.find(query)
      .sort({ day: 1, startTime: 1 })
      .lean();

    const result = events.map((event) =>
      eventResponseSchema.parse({
        ...event,
        id: event._id.toString(),
        day: event.day,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      }),
    );

    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, "Failed to fetch events");
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const payload = await parseJsonRequest(request, eventCreateSchema);

    if (payload.startTime && payload.endTime) {
      if (payload.startTime > payload.endTime) {
        return errorResponse(
          new Error("Start time must be before end time"),
          "Start time must be before end time",
          { status: 400 },
        );
      }
    }

    const event = await Event.create({
      ...payload,
      day: normalizeDay(payload.day),
    });

    const result = eventResponseSchema.parse(toPlainObject(event));
    return jsonResponse(result, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Failed to create event");
  }
}

