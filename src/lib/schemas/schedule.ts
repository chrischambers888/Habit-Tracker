import { z } from "zod";
import { eventResponseSchema } from "./event";
import { backlogItemResponseSchema } from "./backlog-item";

export const scheduleTodaySchema = z.object({
  day: z.coerce.date(),
  now: z.coerce.date(),
  events: z.array(eventResponseSchema),
  backlog: z.array(backlogItemResponseSchema),
});

export const scheduleNextDaySchema = z.object({
  day: z.coerce.date(),
  events: z.array(eventResponseSchema),
  backlog: z.array(backlogItemResponseSchema),
});

export type ScheduleToday = z.infer<typeof scheduleTodaySchema>;
export type ScheduleNextDay = z.infer<typeof scheduleNextDaySchema>;

