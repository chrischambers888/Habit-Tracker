"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LineChart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  {
    href: "/habits",
    label: "Habits",
    icon: LineChart,
  },
  {
    href: "/schedule",
    label: "Schedule",
    icon: CalendarDays,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>Habit Tracker</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 grid gap-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                      pathname === link.href
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <Link href="/" className="text-sm font-semibold md:text-base">
            Habit Tracker
          </Link>
        </div>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                pathname === link.href
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}

