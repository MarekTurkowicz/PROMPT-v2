// Brand colour maths (contrast, CSS variables) for the Branding screen.
import type { Brand } from "@/demo/data";
import { BRAND0 } from "@/demo/data";

export const ACC_PRESETS = ["#4f46e5", "#2563eb", "#0f766e", "#b45309", "#be123c", "#7c3aed"];
export const NAV_PRESETS = ["#0e1a3a", "#0f172a", "#1e1b4b", "#052e2b", "#2a1a12", "#ffffff"];

export const hex2rgb = (hex: string): [number, number, number] => {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const relLum = (hex: string) => {
  const [r, g, b] = hex2rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const ratio = (a: string, b: string) => {
  const x = relLum(a);
  const y = relLum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

export function brandVars(b: Pick<Brand, "accent" | "nav">): Record<string, string> {
  const light = ratio(b.nav, "#ffffff") >= ratio(b.nav, "#0f172a");
  return {
    "--accent": b.accent,
    "--nav-bg": b.nav,
    "--nav-strong": light ? "#ffffff" : "#0f172a",
    "--nav-ink": light ? "#e2e8f0" : "#1e293b",
    "--nav-muted": light ? "#a9b6cc" : "#475569",
    "--nav-hover": light ? "rgba(255,255,255,.07)" : "rgba(15,23,42,.06)",
    "--nav-active": light ? "rgba(255,255,255,.14)" : "rgba(15,23,42,.1)",
    "--nav-line": light ? "rgba(255,255,255,.12)" : "rgba(15,23,42,.12)",
  };
}

export function applyBrand(b: Brand) {
  const v = brandVars(b);
  for (const k in v) document.documentElement.style.setProperty(k, v[k]);
  document.title = b.name;
}

export const defaultBrand = (): Brand => ({ ...BRAND0 });
