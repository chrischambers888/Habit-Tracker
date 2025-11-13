import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { queryKeys } from "@/lib/query-keys";
import { habitsApi, habitLogsApi } from "@/lib/api-client";
import type { HabitUpdateInput } from "@/lib/schemas/habit";
import type { HabitLogInput, HabitLogUpdateInput } from "@/lib/schemas/habit-log";

export function useHabits() {
  return useQuery({
    queryKey: queryKeys.habits,
    queryFn: habitsApi.list,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: habitsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits });
      toast({
        title: "Habit created",
        description: "Your habit has been added.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to create habit",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: HabitUpdateInput }) =>
      habitsApi.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits });
      queryClient.invalidateQueries({
        queryKey: queryKeys.habitLogs(variables.id),
      });
      toast({
        title: "Habit updated",
        description: "Your habit has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to update habit",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: habitsApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits });
      queryClient.removeQueries({ queryKey: queryKeys.habitLogs(id) });
      toast({
        title: "Habit deleted",
        description: "The habit has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to delete habit",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useHabitLogs(habitId: string) {
  return useQuery({
    queryKey: queryKeys.habitLogs(habitId),
    queryFn: () => habitLogsApi.list(habitId),
    enabled: Boolean(habitId),
  });
}

export function useUpsertHabitLog(habitId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<HabitLogInput, "habitId">) =>
      habitLogsApi.upsert(habitId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habitLogs(habitId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.habits });
      toast({
        title: "Habit logged",
        description: "Your progress has been recorded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to log habit",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteHabitLog(habitId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logId: string) => habitLogsApi.delete(habitId, logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habitLogs(habitId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.habits });
      toast({
        title: "Log deleted",
        description: "The habit log has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to delete log",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateHabitLog(habitId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      logId,
      input,
    }: {
      logId: string;
      input: HabitLogUpdateInput;
    }) => habitLogsApi.update(habitId, logId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habitLogs(habitId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.habits });
      toast({
        title: "Log updated",
        description: "Habit log updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to update log",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

