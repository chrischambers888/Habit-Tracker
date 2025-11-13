import { connectToDatabase } from "@/lib/db";
import { Habit } from "@/lib/models/habit";
import {
  habitCreateSchema,
  habitResponseSchema,
} from "@/lib/schemas/habit";
import { jsonResponse, errorResponse, parseJsonRequest } from "@/lib/api";
import { toPlainObject } from "@/lib/mongo";

export async function GET() {
  try {
    await connectToDatabase();

    const habits = await Habit.find().sort({ createdAt: -1 });

    const result = habits.map((habit) =>
      habitResponseSchema.parse(toPlainObject(habit)),
    );

    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, "Failed to fetch habits");
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const payload = await parseJsonRequest(request, habitCreateSchema);

    const habit = await Habit.create(payload);

    const result = habitResponseSchema.parse(toPlainObject(habit));

    return jsonResponse(result, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Failed to create habit");
  }
}

