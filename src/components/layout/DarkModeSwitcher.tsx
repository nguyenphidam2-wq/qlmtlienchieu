"use client";

import { useTheme } from "../ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function DarkModeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Chuyển chế độ giao diện Sáng / Tối"
      className="relative flex h-9 w-16 cursor-pointer items-center rounded-full bg-slate-200 dark:bg-slate-700 p-1 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-slate-900 text-slate-800 dark:text-yellow-400 shadow-md transform transition-transform duration-300 ${
          theme === "dark" ? "translate-x-7" : "translate-x-0"
        }`}
      >
        {theme === "dark" ? (
          <Moon className="w-4 h-4" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </div>
    </button>
  );
}
