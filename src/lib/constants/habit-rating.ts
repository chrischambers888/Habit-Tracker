import { z } from "zod";
import { habitRating } from "@/lib/schemas/shared";

export type HabitRating = z.infer<typeof habitRating>;

export const habitRatingLabels: Record<HabitRating, string> = {
  bad: "Bad",
  okay: "Okay",
  good: "Good",
};

export const habitRatingStyles: Record<
  HabitRating,
  {
    badge: string;
    text: string;
    softBadge: string;
    dot: string;
  }
> = {
  bad: {
    badge: "bg-rose-500 text-rose-50",
    text: "text-rose-600",
    softBadge: "bg-rose-100 text-rose-700 border border-rose-200",
    dot: "bg-rose-500",
  },
  okay: {
    badge: "bg-amber-400 text-amber-950",
    text: "text-amber-600",
    softBadge: "bg-amber-100 text-amber-800 border border-amber-200",
    dot: "bg-amber-400",
  },
  good: {
    badge: "bg-emerald-500 text-emerald-50",
    text: "text-emerald-600",
    softBadge: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    dot: "bg-emerald-500",
  },
};

export const habitRatingOrder: HabitRating[] = ["bad", "okay", "good"];

