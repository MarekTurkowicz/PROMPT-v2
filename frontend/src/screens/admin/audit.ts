import { EL } from "@/demo/core";
import type { AuditEntry } from "@/demo/data";

export const audTarget = (a: AuditEntry) =>
  a.entity === "system" ? a.target : (EL[a.entity] || "") + " „" + a.target + "”";
