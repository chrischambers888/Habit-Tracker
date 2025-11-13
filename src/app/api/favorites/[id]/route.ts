import { connectToDatabase } from "@/lib/db";
import { FavoriteEvent } from "@/lib/models/favorite-event";
import {
  favoriteEventResponseSchema,
  favoriteEventUpdateSchema,
} from "@/lib/schemas/favorite-event";
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
    const updates = await parseJsonRequest(request, favoriteEventUpdateSchema);

    const favorite = await FavoriteEvent.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!favorite) {
      return errorResponse(
        new Error("Favorite not found"),
        "Favorite not found",
        { status: 404 },
      );
    }

    const result = favoriteEventResponseSchema.parse({
      ...favorite.toObject({ versionKey: false }),
      id: favorite._id.toString(),
    });

    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, "Failed to update favorite event");
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await connectToDatabase();

    const { id } = await params;

    const favorite = await FavoriteEvent.findByIdAndDelete(id);

    if (!favorite) {
      return errorResponse(
        new Error("Favorite not found"),
        "Favorite not found",
        { status: 404 },
      );
    }

    return jsonResponse({ id });
  } catch (error) {
    return errorResponse(error, "Failed to delete favorite event");
  }
}

