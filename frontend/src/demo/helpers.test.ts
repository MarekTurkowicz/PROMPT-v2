import { beforeEach, describe, expect, it } from "vitest";
import { effRoles, fundUse, isOverdue, projStats, stOf, tt } from "./helpers";
import { resetDemo, store, switchOrg } from "./store";

describe("demo data", () => {
  beforeEach(() => resetDemo());

  it("has a non-empty bank for organizations 1 and 2", () => {
    for (const o of [1, 2]) {
      const b = store.banks[o];
      expect(b.PROJECTS.length).toBeGreaterThan(0);
      expect(b.TASKS.length).toBeGreaterThan(0);
      expect(b.STATUSES.length).toBeGreaterThan(0);
    }
    expect(store.banks[3].STATUSES.length).toBeGreaterThan(0);
  });

  it("gives every task a status of its own organization, in both banks", () => {
    for (const o of [1, 2]) {
      switchOrg(o);
      expect(store.TASKS.length).toBeGreaterThan(0);
      for (const t of store.TASKS) {
        expect(stOf(t)?.org, `${t.title} in org ${o}`).toBe(o);
      }
    }
  });

  it("creates mandatory tasks from funding templates", () => {
    const tpl = store.TEMPL.filter((x) => x.funding === 1);
    expect(tpl.length).toBeGreaterThan(0);
    const mandatory = store.TASKS.filter((t) => t.mand && t.funding === 1);
    expect(mandatory.map((t) => t.tpl).sort()).toEqual(tpl.map((x) => x.id).sort());
    expect(mandatory.every((t) => t.pf != null)).toBe(true);
  });

  it("keeps priorities within 1..5 and the category key in sync with the status", () => {
    for (const t of store.TASKS) {
      expect(t.prio).toBeGreaterThanOrEqual(1);
      expect(t.prio).toBeLessThanOrEqual(5);
      expect(t.status).toBe(
        { todo: "todo", in_progress: "doing", done: "done", cancelled: "cancelled" }[stOf(t)!.cat],
      );
    }
  });

  it("derives progress, budget and overdue state like the mock", () => {
    const s = projStats(store.PROJECTS[0]);
    expect(s.n).toBeGreaterThan(0);
    expect(s.pct).toBeGreaterThanOrEqual(0);
    expect(fundUse(store.FUNDINGS[0]).pc).toBeLessThanOrEqual(100);
    expect(isOverdue(tt("Integracja z systemem płatności")!)).toBe(true);
  });

  it("resolves roles through membership and groups", () => {
    expect(effRoles(2, 1).length).toBeGreaterThan(0);
    expect(effRoles(5, null).some((x) => x.r.name === "Księgowość")).toBe(true);
  });

  it("switches organization and restores priorities", () => {
    switchOrg(2);
    expect(store.orgId).toBe(2);
    expect(store.PROJECTS.map((p) => p.id)).toEqual([2]);
  });
});
