import { connectToDatabase } from "@/lib/db";
import { BacklogItem } from "@/lib/models/backlog-item";
import {
  backlogItemCreateSchema,
  backlogItemResponseSchema,
} from "@/lib/schemas/backlog-item";
import { jsonResponse, errorResponse, parseJsonRequest } from "@/lib/api";

export async function GET() {
  try {
    await connectToDatabase();

    const items = await BacklogItem.find()
      .sort({ isCompleted: 1, createdAt: -1 })
      .lean();

    const result = items.map((item) =>
      backlogItemResponseSchema.parse({
        ...item,
        id: item._id.toString(),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        completedAt: item.completedAt ?? null,
      }),
    );

    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, "Failed to fetch backlog items");
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const payload = await parseJsonRequest(request, backlogItemCreateSchema);

    const backlogItem = await BacklogItem.create(payload);

    const result = backlogItemResponseSchema.parse({
      ...backlogItem.toObject({ versionKey: false }),
      id: backlogItem._id.toString(),
      completedAt: backlogItem.completedAt ?? null,
    });

    return jsonResponse(result, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Failed to create backlog item");
  }
}

