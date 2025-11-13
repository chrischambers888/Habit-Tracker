import { connectToDatabase } from "@/lib/db";
import { Habit } from "@/lib/models/habit";
import {
  habitResponseSchema,
  habitUpdateSchema,
} from "@/lib/schemas/habit";
import { jsonResponse, errorResponse, parseJsonRequest } from "@/lib/api";
import { toPlainObject } from "@/lib/mongo";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const habit = await Habit.findById(id);

    if (!habit) {
      return errorResponse(new Error("Habit not found"), "Habit not found", {
        status: 404,
      });
    }

    const result = habitResponseSchema.parse(toPlainObject(habit));
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, "Failed to fetch habit");
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const updates = await parseJsonRequest(request, habitUpdateSchema);

    const habit = await Habit.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!habit) {
      return errorResponse(new Error("Habit not found"), "Habit not found", {
        status: 404,
      });
    }

    const result = habitResponseSchema.parse(toPlainObject(habit));
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, "Failed to update habit");
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await connectToDatabase();

    const { id } = await params;

    const habit = await Habit.findByIdAndDelete(id);

    if (!habit) {
      return errorResponse(new Error("Habit not found"), "Habit not found", {
        status: 404,
      });
    }

    return jsonResponse({ id });
  } catch (error) {
    return errorResponse(error, "Failed to delete habit");
  }
}

