"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { MoonStar, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = React.useCallback(() => {
    const nextTheme =
      (theme ?? resolvedTheme) === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme, theme]);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonStar className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

