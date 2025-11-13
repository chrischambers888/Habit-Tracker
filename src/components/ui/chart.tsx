"use client";

import * as React from "react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChartContextType = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextType | null>(null);

export type ChartConfig = Record<
  string,
  {
    label?: ReactNode;
    color?: string;
  }
>;

export type ChartContainerProps = ComponentProps<"div"> & {
  config: ChartConfig;
};

export function ChartContainer({
  children,
  className,
  config,
  ...props
}: ChartContainerProps) {
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        className={cn(
          "flex h-full w-full flex-col gap-2 rounded-xl border bg-card p-4 text-card-foreground shadow-sm",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  );
}

export function ChartTooltip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-md">
      {children}
    </div>
  );
}

export function useChartConfig() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChartConfig must be used within a ChartContainer");
  }

  return context.config;
}

