import { connectToDatabase } from "@/lib/db";
import { BacklogItem } from "@/lib/models/backlog-item";
import {
  backlogItemResponseSchema,
  backlogItemUpdateSchema,
} from "@/lib/schemas/backlog-item";
import { jsonResponse, errorResponse, parseJsonRequest } from "@/lib/api";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    await connectToDatabase();

    const { id } = await params;
    const updates = await parseJsonRequest(request, backlogItemUpdateSchema);

    let completedAt = updates.completedAt;

    if (updates.isCompleted !== undefined && completedAt === undefined) {
      completedAt = updates.isCompleted ? new Date() : null;
    }

    const updatePayload = {
      ...updates,
      ...(completedAt !== undefined ? { completedAt } : {}),
    };

    const item = await BacklogItem.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return errorResponse(
        new Error("Backlog item not found"),
        "Backlog item not found",
        { status: 404 },
      );
    }

    const result = backlogItemResponseSchema.parse({
      ...item.toObject({ versionKey: false }),
      id: item._id.toString(),
      completedAt: item.completedAt ?? null,
    });

    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, "Failed to update backlog item");
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await connectToDatabase();

    const { id } = await params;

    const item = await BacklogItem.findByIdAndDelete(id);

    if (!item) {
      return errorResponse(
        new Error("Backlog item not found"),
        "Backlog item not found",
        { status: 404 },
      );
    }

    return jsonResponse({ id });
  } catch (error) {
    return errorResponse(error, "Failed to delete backlog item");
  }
}

