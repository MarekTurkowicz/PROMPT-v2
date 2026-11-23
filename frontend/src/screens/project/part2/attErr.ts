import { ATT_OK, MAX_ATT } from "@/demo/core";

/** Validation message for an uploaded file (type and size), empty when fine. */
export function attErr(f: { name: string; size: number }): string {
  const ext = f.name.split(".").pop()!.toLowerCase();
  if (!ATT_OK.includes(ext)) return "Niedozwolony typ pliku. Dozwolone: " + ATT_OK.join(", ") + ".";
  if (f.size <= 0 || f.size > MAX_ATT) return "Plik musi mieć od 1 B do 50 MB.";
  return "";
}
