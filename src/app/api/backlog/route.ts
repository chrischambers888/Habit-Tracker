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
      .sort({ isCompleted: 1, order: 1, createdAt: -1 })
      .lean();

    // Initialize order for items that don't have it
    let maxOrder = -1;
    const itemsWithOrder = items.map((item, index) => {
      if (item.order === undefined || item.order === null) {
        maxOrder = Math.max(maxOrder, index);
        return { ...item, order: index };
      }
      maxOrder = Math.max(maxOrder, item.order);
      return item;
    });

    // If any items were missing order, update them in the database
    const itemsNeedingOrder = items.filter(
      (item) => item.order === undefined || item.order === null
    );
    if (itemsNeedingOrder.length > 0) {
      await Promise.all(
        itemsNeedingOrder.map((item, idx) =>
          BacklogItem.updateOne(
            { _id: item._id },
            { $set: { order: maxOrder + 1 + idx } }
          )
        )
      );
      // Refetch to get updated order values
      const updatedItems = await BacklogItem.find()
        .sort({ isCompleted: 1, order: 1, createdAt: -1 })
        .lean();
      const result = updatedItems.map((item) =>
        backlogItemResponseSchema.parse({
          ...item,
          id: item._id.toString(),
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          completedAt: item.completedAt ?? null,
        }),
      );
      return jsonResponse(result);
    }

    const result = itemsWithOrder.map((item) =>
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

    // Set order to max + 1 for new items (or 0 if no items exist)
    const maxOrderItem = await BacklogItem.findOne()
      .sort({ order: -1 })
      .select("order")
      .lean();
    const newOrder = maxOrderItem?.order !== undefined ? (maxOrderItem.order + 1) : 0;

    const backlogItem = await BacklogItem.create({
      ...payload,
      order: newOrder,
    });

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

