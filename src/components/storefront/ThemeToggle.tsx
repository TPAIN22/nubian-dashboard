"use client";

/**
 * Header theme switch — one tap between light and dark.
 *
 * The site defaults to light (see `defaultTheme` in app/layout.tsx); this is
 * how a shopper opts into dark, and next-themes remembers the choice. Before
 * mount the resolved theme is unknown on the server, so the button renders
 * both icons and lets the `dark:` variant pick one (no flash of the wrong
 * icon), and the label waits for mount (no hydration mismatch).
 */

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // The theme is only known in the browser; until mount, render a neutral
  // label so server and client HTML agree.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const label = !mounted
    ? "تبديل المظهر"
    : isDark
      ? "التبديل إلى الوضع الفاتح"
      : "التبديل إلى الوضع الداكن";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className="sf-focus text-sf-ink hover:text-sf-accent hover:bg-sf-well relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors"
    >
      <Sun aria-hidden="true" className="h-[1.15rem] w-[1.15rem] dark:hidden" strokeWidth={1.75} />
      <Moon aria-hidden="true" className="hidden h-[1.15rem] w-[1.15rem] dark:block" strokeWidth={1.75} />
    </button>
  );
}
