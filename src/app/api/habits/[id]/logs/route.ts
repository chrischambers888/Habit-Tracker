import { connectToDatabase } from "@/lib/db";
import { Habit } from "@/lib/models/habit";
import { HabitLog } from "@/lib/models/habit-log";
import {
  habitLogCreateSchema,
  habitLogResponseSchema,
} from "@/lib/schemas/habit-log";
import { jsonResponse, errorResponse, parseJsonRequest } from "@/lib/api";
import { toPlainObject } from "@/lib/mongo";
import { normalizePeriodStart } from "@/lib/dates";
import { z } from "zod";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

const createLogSchema = habitLogCreateSchema.omit({ habitId: true });

export async function GET(_: Request, { params }: Params) {
  try {
    await connectToDatabase();

    const { id } = await params;

    const logs = await HabitLog.find({ habitId: id }).sort({
      periodStart: 1,
    });

    const result = logs.map((log) =>
      habitLogResponseSchema.parse(toPlainObject(log)),
    );

    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, "Failed to fetch habit logs");
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    await connectToDatabase();

    const { id } = await params;

    const habit = await Habit.findById(id);

    if (!habit) {
      return errorResponse(new Error("Habit not found"), "Habit not found", {
        status: 404,
      });
    }

    const payload = await parseJsonRequest(request, createLogSchema);

    const periodStart = normalizePeriodStart(payload.periodStart, habit.frequency);

    let log = await HabitLog.findOne({ habitId: habit._id, periodStart });

    if (log) {
      log.rating = payload.rating;
      log.comment = payload.comment ?? undefined;
      log.periodStart = periodStart;
      await log.save();
    } else {
      log = await HabitLog.create({
        habitId: habit._id,
        periodStart,
        rating: payload.rating,
        comment: payload.comment ?? undefined,
      });
    }

    const result = habitLogResponseSchema.parse(toPlainObject(log));

    return jsonResponse(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/habits/[id]/logs error", error);
    if (error instanceof z.ZodError) {
      return errorResponse(error, "Invalid habit log");
    }

    return errorResponse(error, "Failed to create habit log");
  }
}

