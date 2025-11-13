import { Suspense } from "react";
import { HabitsView } from "@/components/habits/habits-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function HabitsPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-64 w-full" />
          ))}
        </div>
      }
    >
      <HabitsView />
    </Suspense>
  );
}

