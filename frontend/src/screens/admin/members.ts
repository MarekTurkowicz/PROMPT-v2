// Membership logic shared by the members screen and the CSV import.
import { off, type RoleCode } from "@/demo/core";
import type { Membership, User } from "@/demo/data";
import { memOf } from "@/demo/helpers";
import { logAudit, store } from "@/demo/store";

export const userCnt = (u: User) => ({
  t: store.TASKS.filter((t) => t.assg.includes(u.id)).length,
  d: store.TASKS.filter((t) => t.assg.includes(u.id) && t.status === "done").length,
});

/** Why this person cannot have their membership ended ("" when they can). */
export function delBlock(u: User) {
  if (u.id === store.ME) return "Nie możesz zakończyć własnego członkostwa.";
  if (u.role === "admin" && store.USERS.filter((x) => x.role === "admin").length === 1)
    return "Nie można usunąć ostatniego administratora.";
  return "";
}

/** Sets membership to "left", unassigns the person from tasks and logs it. Call inside update(). */
export function removeUser(u: User) {
  const m = memOf(u.id);
  if (m) m.status = "left";
  store.TASKS.forEach((t) => {
    t.assg = t.assg.filter((a) => a !== u.id);
  });
  logAudit("update", "member", u.email, "Członkostwo → odszedł");
}

/** Creates the account when missing and an "invited" membership in the current organization. */
export function addUser(
  d: { email: string; first: string; last: string },
  role: RoleCode,
  md: Partial<Pick<Membership, "job" | "phone" | "email" | "avatar">> = {},
) {
  let x = store.USERS.find((y) => y.email.toLowerCase() === d.email.toLowerCase());
  if (x) x.role = role;
  else {
    const u = {
      id: ++store.seq.user,
      ...d,
      phone: "",
      org: store.orgId,
      active: true,
      roles: { [store.orgId]: role },
    } as User;
    Object.defineProperty(u, "role", {
      get() {
        return this.roles[store.orgId] || "viewer";
      },
      set(v: RoleCode) {
        this.roles[store.orgId] = v;
      },
      enumerable: true,
      configurable: true,
    });
    store.USERS.push(u);
    x = u;
  }
  store.MEMS.push({
    org: store.orgId,
    user: x.id,
    status: "invited",
    joined: null,
    invited: off(0),
    job: "",
    phone: "",
    email: "",
    avatar: "",
    ...md,
  });
  return x;
}
