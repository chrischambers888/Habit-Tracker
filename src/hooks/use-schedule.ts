import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { queryKeys } from "@/lib/query-keys";
import {
  eventsApi,
  favoritesApi,
  backlogApi,
  scheduleApi,
} from "@/lib/api-client";
import type { FavoriteEventUpdateInput } from "@/lib/schemas/favorite-event";
import type {
  BacklogItemUpdateInput,
  BacklogItemResponse,
} from "@/lib/schemas/backlog-item";
import type { EventUpdateInput } from "@/lib/schemas/event";

export function useTodaySchedule() {
  return useQuery({
    queryKey: queryKeys.scheduleToday,
    queryFn: scheduleApi.today,
  });
}

export function useNextDaySchedule() {
  return useQuery({
    queryKey: queryKeys.scheduleNextDay,
    queryFn: scheduleApi.nextDay,
  });
}

export function useEvents(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.events(params),
    queryFn: () => eventsApi.list(params),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduleToday });
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduleNextDay });
      toast({
        title: "Event created",
        description: "The event has been added to your schedule.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to create event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EventUpdateInput }) =>
      eventsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduleToday });
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduleNextDay });
      toast({
        title: "Event updated",
        description: "The event has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to update event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduleToday });
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduleNextDay });
      toast({
        title: "Event deleted",
        description: "The event has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to delete event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: queryKeys.favorites,
    queryFn: favoritesApi.list,
  });
}

export function useCreateFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favoritesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
      toast({
        title: "Favorite added",
        description: "The event has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to add favorite",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: FavoriteEventUpdateInput;
    }) => favoritesApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
      toast({
        title: "Favorite updated",
        description: "Your favorite has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to update favorite",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favoritesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
      toast({
        title: "Favorite deleted",
        description: "The favorite has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to delete favorite",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useBacklog() {
  return useQuery({
    queryKey: queryKeys.backlog,
    queryFn: backlogApi.list,
  });
}

export function useCreateBacklogItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: backlogApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.backlog });
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduleToday });
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduleNextDay });
      toast({
        title: "Backlog item created",
        description: "The item has been added.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to create backlog item",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBacklogItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: BacklogItemUpdateInput;
    }) => backlogApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.backlog });
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduleToday });
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduleNextDay });
      toast({
        title: "Backlog item updated",
        description: "The item has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to update backlog item",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBacklogItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: backlogApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.backlog });
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduleToday });
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduleNextDay });
      toast({
        title: "Backlog item deleted",
        description: "The item has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to delete backlog item",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useReorderBacklogItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: backlogApi.reorder,
    onMutate: async (itemIds: string[]) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.backlog });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData<BacklogItemResponse[]>(
        queryKeys.backlog
      );

      // Optimistically update to the new value
      if (previousItems) {
        const openItems = previousItems.filter((item) => !item.isCompleted);
        const completedItems = previousItems.filter((item) => item.isCompleted);
        
        // Create a map for quick lookup
        const itemMap = new Map(openItems.map((item) => [item.id, item]));
        
        // Reorder open items based on itemIds order
        const reorderedOpenItems = itemIds
          .map((id) => itemMap.get(id))
          .filter((item): item is BacklogItemResponse => item !== undefined);
        
        // Add any items that weren't in itemIds (shouldn't happen, but safety check)
        const remainingItems = openItems.filter(
          (item) => !itemIds.includes(item.id)
        );
        
        // Update order values and combine
        const updatedOpenItems = [
          ...reorderedOpenItems.map((item, index) => ({
            ...item,
            order: index,
          })),
          ...remainingItems.map((item, index) => ({
            ...item,
            order: reorderedOpenItems.length + index,
          })),
        ];

        const updatedItems = [...updatedOpenItems, ...completedItems];
        
        queryClient.setQueryData(queryKeys.backlog, updatedItems);
      }

      return { previousItems };
    },
    onSuccess: () => {
      // Don't refetch - the optimistic update is correct
      // The order is already updated in the query cache
      // Natural refetches (window focus, etc.) will sync eventually
    },
    onError: (error: Error, _itemIds, context) => {
      // Rollback to previous value on error
      if (context?.previousItems) {
        queryClient.setQueryData(queryKeys.backlog, context.previousItems);
      }
      toast({
        title: "Unable to reorder backlog items",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

