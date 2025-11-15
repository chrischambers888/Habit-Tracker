import type { Metadata } from "next";
import { DashboardNav } from "@/components/layout/dashboard-nav";

export const metadata: Metadata = {
  title: "Habit Tracker",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 md:py-8">{children}</div>
      </main>
    </div>
  );
}

