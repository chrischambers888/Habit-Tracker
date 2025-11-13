"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useFavorites,
  useDeleteFavorite,
  useCreateEvent,
} from "@/hooks/use-schedule";
import { Badge } from "@/components/ui/badge";
import { Star, Trash } from "lucide-react";
import { format } from "date-fns";

type FavoritesPanelProps = {
  today: Date;
  nextDay: Date;
};

export function FavoritesPanel({ today, nextDay }: FavoritesPanelProps) {
  const { data: favorites, isLoading } = useFavorites();
  const deleteFavorite = useDeleteFavorite();
  const createEvent = useCreateEvent();

  const handleQuickAdd = (favoriteId: string, day: Date) => {
    const favorite = favorites?.find((item) => item.id === favoriteId);
    if (!favorite) return;

    createEvent.mutate({
      day,
      title: favorite.title,
      description: favorite.description ?? "",
      startTime: favorite.startTime ?? "",
      endTime: favorite.endTime ?? "",
      favoriteId: favorite.id,
    });
  };

  const handleDelete = (favoriteId: string) => {
    deleteFavorite.mutate(favoriteId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="h-5 w-5" />
          Favorites
        </CardTitle>
        <CardDescription>
          Save routines to quickly schedule them for today or tomorrow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading favorites...</p>
        ) : !favorites || favorites.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Save an event from your schedule to reuse it here.
          </p>
        ) : (
          favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="rounded-lg border p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{favorite.title}</p>
                  {favorite.description && (
                    <p className="text-sm text-muted-foreground">
                      {favorite.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {favorite.startTime ? (
                      <Badge variant="outline">
                        {favorite.startTime}
                        {favorite.endTime ? ` – ${favorite.endTime}` : ""}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Flexible time</Badge>
                    )}
                    <span>
                      Saved {format(favorite.createdAt, "MMM d")}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(favorite.id)}
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Delete favorite</span>
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleQuickAdd(favorite.id, today)}
                >
                  Plan today
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickAdd(favorite.id, nextDay)}
                >
                  Plan tomorrow
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

