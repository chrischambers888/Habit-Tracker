import { connectToDatabase } from "@/lib/db";
import { Habit } from "@/lib/models/habit";
import { HabitLog } from "@/lib/models/habit-log";
import {
  habitLogResponseSchema,
  habitLogUpdateSchema,
} from "@/lib/schemas/habit-log";
import { jsonResponse, errorResponse, parseJsonRequest } from "@/lib/api";
import { toPlainObject } from "@/lib/mongo";
import { normalizePeriodStart } from "@/lib/dates";

type Params = {
  params: Promise<{
    id: string;
    logId: string;
  }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    await connectToDatabase();

    const { id, logId } = await params;

    const log = await HabitLog.findOne({
      _id: logId,
      habitId: id,
    });

    if (!log) {
      return errorResponse(new Error("Log not found"), "Log not found", {
        status: 404,
      });
    }

    const updates = await parseJsonRequest(request, habitLogUpdateSchema);

    if (updates.periodStart) {
      const habit = await Habit.findById(id);

      if (!habit) {
        return errorResponse(new Error("Habit not found"), "Habit not found", {
          status: 404,
        });
      }

      log.periodStart = normalizePeriodStart(updates.periodStart, habit.frequency);
    }

    if (updates.rating) {
      log.rating = updates.rating;
    }

    if (updates.comment !== undefined) {
      log.comment = updates.comment;
    }

    await log.save();

    const result = habitLogResponseSchema.parse(toPlainObject(log));
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, "Failed to update habit log");
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await connectToDatabase();

    const { id, logId } = await params;

    const log = await HabitLog.findOneAndDelete({
      _id: logId,
      habitId: id,
    });

    if (!log) {
      return errorResponse(new Error("Log not found"), "Log not found", {
        status: 404,
      });
    }

    return jsonResponse({ id: logId });
  } catch (error) {
    return errorResponse(error, "Failed to delete habit log");
  }
}

