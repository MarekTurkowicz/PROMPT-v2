import { beforeEach, describe, expect, it } from "vitest";
import { resetDemo, store } from "@/demo/store";
import { csvCell, importResult, parseCSV } from "./csv";

describe("parseCSV", () => {
  it("detects semicolons and handles quoted cells", () => {
    const { head, rows } = parseCSV('Email;name\r\n"a@b.pl";"Ala ""X"""\r\n');
    expect(head).toEqual(["email", "name"]);
    expect(rows).toEqual([["a@b.pl", 'Ala "X"']]);
  });
  it("round-trips csvCell", () => {
    expect(parseCSV("x\n" + csvCell('a,"b"')).rows[0][0]).toBe('a,"b"');
  });
});

describe("importResult", () => {
  beforeEach(() => resetDemo());
  it("flags missing columns, bad emails and duplicates", () => {
    expect(importResult("users", "name\nx")!.missing).toEqual(["email"]);
    const dup = store.USERS[0].email;
    const r = importResult("users", `email,role\nnew@x.pl,pm\nbad,\n${dup},member\nz@x.pl,boss`)!;
    expect(r.ok).toHaveLength(1);
    expect(r.bad.map((b) => b.msg)).toEqual(["Niepoprawny e-mail", "E-mail już istnieje", "Nieznana rola"]);
  });
  it("validates task priority and dates", () => {
    const r = importResult("tasks", "title,priority,due_date\na,9,\nb,2,2026/01/01\nc,2,2026-01-01")!;
    expect(r.ok).toHaveLength(1);
    expect(r.bad).toHaveLength(2);
  });
});
