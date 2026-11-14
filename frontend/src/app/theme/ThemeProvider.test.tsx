import { beforeEach, describe, expect, it } from "vitest";
import { act, render } from "@testing-library/react";
import { THEME_STORAGE_KEY, useTheme, type Theme } from "./theme-context";
import { ThemeProvider } from "./ThemeProvider";

let setTheme: (theme: Theme) => void = () => {};

function Probe() {
  setTheme = useTheme().setTheme;
  return null;
}

const isDark = () => document.documentElement.classList.contains("dark");

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("applies and remembers the chosen theme", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    act(() => setTheme("dark"));
    expect(isDark()).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    act(() => setTheme("light"));
    expect(isDark()).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("restores the stored theme and forgets it when switched to system", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(isDark()).toBe(true);

    act(() => setTheme("system"));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });
});
