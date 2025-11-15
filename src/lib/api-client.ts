import { z } from "zod";
import { apiFetch, apiMutation } from "@/lib/http";
import {
  habitCreateSchema,
  habitResponseSchema,
  habitUpdateSchema,
  type HabitInput,
  type HabitResponse,
  type HabitUpdateInput,
} from "@/lib/schemas/habit";
import {
  habitLogCreateSchema,
  habitLogResponseSchema,
  habitLogUpdateSchema,
  type HabitLogInput,
  type HabitLogResponse,
  type HabitLogUpdateInput,
} from "@/lib/schemas/habit-log";
import {
  eventCreateSchema,
  eventResponseSchema,
  eventUpdateSchema,
  type EventInput,
  type EventResponse,
  type EventUpdateInput,
} from "@/lib/schemas/event";
import {
  favoriteEventCreateSchema,
  favoriteEventResponseSchema,
  favoriteEventUpdateSchema,
  type FavoriteEventInput,
  type FavoriteEventResponse,
  type FavoriteEventUpdateInput,
} from "@/lib/schemas/favorite-event";
import {
  backlogItemCreateSchema,
  backlogItemResponseSchema,
  backlogItemUpdateSchema,
  type BacklogItemInput,
  type BacklogItemResponse,
  type BacklogItemUpdateInput,
} from "@/lib/schemas/backlog-item";
import {
  scheduleNextDaySchema,
  scheduleTodaySchema,
  type ScheduleNextDay,
  type ScheduleToday,
} from "@/lib/schemas/schedule";

const habitsArraySchema = z.array(habitResponseSchema);
const habitLogsArraySchema = z.array(habitLogResponseSchema);
const eventsArraySchema = z.array(eventResponseSchema);
const favoritesArraySchema = z.array(favoriteEventResponseSchema);
const backlogArraySchema = z.array(backlogItemResponseSchema);

export const habitsApi = {
  list: async (): Promise<HabitResponse[]> => {
    const data = await apiFetch("/api/habits");
    return habitsArraySchema.parse(data);
  },

  create: async (input: HabitInput): Promise<HabitResponse> => {
    const payload = habitCreateSchema.parse(input);
    const data = await apiMutation("/api/habits", "POST", payload);
    return habitResponseSchema.parse(data);
  },

  update: async (
    id: string,
    input: HabitUpdateInput,
  ): Promise<HabitResponse> => {
    const payload = habitUpdateSchema.parse(input);
    const data = await apiMutation(`/api/habits/${id}`, "PATCH", payload);
    return habitResponseSchema.parse(data);
  },

  delete: async (id: string): Promise<{ id: string }> => {
    return apiMutation(`/api/habits/${id}`, "DELETE");
  },
};

export const habitLogsApi = {
  list: async (habitId: string): Promise<HabitLogResponse[]> => {
    const data = await apiFetch(`/api/habits/${habitId}/logs`);
    return habitLogsArraySchema.parse(data);
  },
  upsert: async (
    habitId: string,
    input: Omit<HabitLogInput, "habitId">,
  ): Promise<HabitLogResponse> => {
    const payload = habitLogCreateSchema
      .omit({ habitId: true })
      .parse(input);
    const data = await apiMutation(
      `/api/habits/${habitId}/logs`,
      "POST",
      payload,
    );
    return habitLogResponseSchema.parse(data);
  },
  update: async (
    habitId: string,
    logId: string,
    input: HabitLogUpdateInput,
  ): Promise<HabitLogResponse> => {
    const payload = habitLogUpdateSchema.parse(input);
    const data = await apiMutation(
      `/api/habits/${habitId}/logs/${logId}`,
      "PATCH",
      payload,
    );
    return habitLogResponseSchema.parse(data);
  },
  delete: async (habitId: string, logId: string): Promise<{ id: string }> => {
    return apiMutation(`/api/habits/${habitId}/logs/${logId}`, "DELETE");
  },
};

export const eventsApi = {
  list: async (params?: Record<string, string>): Promise<EventResponse[]> => {
    const query = params
      ? `?${new URLSearchParams(params).toString()}`
      : "";
    const data = await apiFetch(`/api/events${query}`);
    return eventsArraySchema.parse(data);
  },
  create: async (input: EventInput): Promise<EventResponse> => {
    const payload = eventCreateSchema.parse(input);
    const data = await apiMutation("/api/events", "POST", payload);
    return eventResponseSchema.parse(data);
  },
  update: async (
    id: string,
    input: EventUpdateInput,
  ): Promise<EventResponse> => {
    const payload = eventUpdateSchema.parse(input);
    const data = await apiMutation(`/api/events/${id}`, "PATCH", payload);
    return eventResponseSchema.parse(data);
  },
  delete: async (id: string): Promise<{ id: string }> => {
    return apiMutation(`/api/events/${id}`, "DELETE");
  },
};

export const favoritesApi = {
  list: async (): Promise<FavoriteEventResponse[]> => {
    const data = await apiFetch("/api/favorites");
    return favoritesArraySchema.parse(data);
  },
  create: async (
    input: FavoriteEventInput,
  ): Promise<FavoriteEventResponse> => {
    const payload = favoriteEventCreateSchema.parse(input);
    const data = await apiMutation("/api/favorites", "POST", payload);
    return favoriteEventResponseSchema.parse(data);
  },
  update: async (
    id: string,
    input: FavoriteEventUpdateInput,
  ): Promise<FavoriteEventResponse> => {
    const payload = favoriteEventUpdateSchema.parse(input);
    const data = await apiMutation(`/api/favorites/${id}`, "PATCH", payload);
    return favoriteEventResponseSchema.parse(data);
  },
  delete: async (id: string): Promise<{ id: string }> => {
    return apiMutation(`/api/favorites/${id}`, "DELETE");
  },
};

export const backlogApi = {
  list: async (): Promise<BacklogItemResponse[]> => {
    const data = await apiFetch("/api/backlog");
    return backlogArraySchema.parse(data);
  },
  create: async (input: BacklogItemInput): Promise<BacklogItemResponse> => {
    const payload = backlogItemCreateSchema.parse(input);
    const data = await apiMutation("/api/backlog", "POST", payload);
    return backlogItemResponseSchema.parse(data);
  },
  update: async (
    id: string,
    input: BacklogItemUpdateInput,
  ): Promise<BacklogItemResponse> => {
    const payload = backlogItemUpdateSchema.parse(input);
    const data = await apiMutation(`/api/backlog/${id}`, "PATCH", payload);
    return backlogItemResponseSchema.parse(data);
  },
  delete: async (id: string): Promise<{ id: string }> => {
    return apiMutation(`/api/backlog/${id}`, "DELETE");
  },
  reorder: async (itemIds: string[]): Promise<{ success: boolean }> => {
    return apiMutation("/api/backlog/reorder", "PATCH", { itemIds });
  },
};

export const scheduleApi = {
  today: async (): Promise<ScheduleToday> => {
    const data = await apiFetch("/api/schedule/today");
    return scheduleTodaySchema.parse(data);
  },
  nextDay: async (): Promise<ScheduleNextDay> => {
    const data = await apiFetch("/api/schedule/next-day");
    return scheduleNextDaySchema.parse(data);
  },
};

