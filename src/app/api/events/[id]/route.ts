import { connectToDatabase } from "@/lib/db";
import { Event } from "@/lib/models/event";
import {
  eventResponseSchema,
  eventUpdateSchema,
} from "@/lib/schemas/event";
import { jsonResponse, errorResponse, parseJsonRequest } from "@/lib/api";
import { toPlainObject } from "@/lib/mongo";
import { normalizeDay } from "@/lib/dates";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const event = await Event.findById(id);

    if (!event) {
      return errorResponse(new Error("Event not found"), "Event not found", {
        status: 404,
      });
    }

    const result = eventResponseSchema.parse(toPlainObject(event));
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, "Failed to fetch event");
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const updates = await parseJsonRequest(request, eventUpdateSchema);

    if (updates.startTime && updates.endTime) {
      if (updates.startTime > updates.endTime) {
        return errorResponse(
          new Error("Start time must be before end time"),
          "Start time must be before end time",
          { status: 400 },
        );
      }
    }

    const updatePayload = {
      ...updates,
      ...(updates.day ? { day: normalizeDay(updates.day) } : {}),
    };

    const event = await Event.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!event) {
      return errorResponse(new Error("Event not found"), "Event not found", {
        status: 404,
      });
    }

    const result = eventResponseSchema.parse(toPlainObject(event));
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, "Failed to update event");
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await connectToDatabase();

    const { id } = await params;

    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return errorResponse(new Error("Event not found"), "Event not found", {
        status: 404,
      });
    }

    return jsonResponse({ id });
  } catch (error) {
    return errorResponse(error, "Failed to delete event");
  }
}

