import { connectToDatabase } from "@/lib/db";
import { FavoriteEvent } from "@/lib/models/favorite-event";
import {
  favoriteEventCreateSchema,
  favoriteEventResponseSchema,
} from "@/lib/schemas/favorite-event";
import { jsonResponse, errorResponse, parseJsonRequest } from "@/lib/api";

export async function GET() {
  try {
    await connectToDatabase();

    const favorites = await FavoriteEvent.find().sort({ createdAt: -1 }).lean();

    const result = favorites.map((favorite) =>
      favoriteEventResponseSchema.parse({
        ...favorite,
        id: favorite._id.toString(),
        createdAt: favorite.createdAt,
        updatedAt: favorite.updatedAt,
      }),
    );

    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, "Failed to fetch favorite events");
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const payload = await parseJsonRequest(request, favoriteEventCreateSchema);

    const favorite = await FavoriteEvent.create(payload);

    const result = favoriteEventResponseSchema.parse({
      ...favorite.toObject({ versionKey: false }),
      id: favorite._id.toString(),
    });

    return jsonResponse(result, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Failed to create favorite event");
  }
}

