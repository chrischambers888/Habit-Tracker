export const queryKeys = {
  habits: ["habits"] as const,
  habitLogs: (habitId: string) => ["habits", habitId, "logs"] as const,
  scheduleToday: ["schedule", "today"] as const,
  scheduleNextDay: ["schedule", "next-day"] as const,
  events: (params?: Record<string, string>) =>
    ["events", params ? JSON.stringify(params) : "all"] as const,
  favorites: ["favorites"] as const,
  backlog: ["backlog"] as const,
};

