import { connectToDatabase } from "@/lib/db";
import { BacklogItem } from "@/lib/models/backlog-item";
import { jsonResponse, errorResponse, parseJsonRequest } from "@/lib/api";
import { z } from "zod";

const reorderSchema = z.object({
  itemIds: z.array(z.string()).min(1),
});

export async function PATCH(request: Request) {
  try {
    await connectToDatabase();

    const { itemIds } = await parseJsonRequest(request, reorderSchema);

    // Update order for each item based on its position in the array
    const updates = itemIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index } },
      },
    }));

    await BacklogItem.bulkWrite(updates);

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error, "Failed to reorder backlog items");
  }
}

