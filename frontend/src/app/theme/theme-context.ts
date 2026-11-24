import { createContext, useContext } from "react";

export type Theme = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "promt-theme";

export const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
} | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
