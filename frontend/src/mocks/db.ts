import { seedMemberships, seedOrganizations } from "./seed/organizations";
import { seedUsers } from "./seed/users";

// In-memory data behind the MSW handlers. Data resets on page reload;
// only the logged-in user survives it (sessionStorage), like a session cookie.
const SESSION_KEY = "promt-mock-session";

const fresh = () => ({
  users: structuredClone(seedUsers),
  organizations: structuredClone(seedOrganizations),
  memberships: structuredClone(seedMemberships),
});

export const db = fresh();

export function currentUser() {
  try {
    const id = Number(sessionStorage.getItem(SESSION_KEY));
    return db.users.find((u) => u.id === id) ?? null;
  } catch {
    return null;
  }
}

export function setCurrentUser(id: number | null) {
  try {
    if (id == null) sessionStorage.removeItem(SESSION_KEY);
    else sessionStorage.setItem(SESSION_KEY, String(id));
  } catch {
    // storage blocked: the login lasts until reload
  }
}

export function resetDb() {
  Object.assign(db, fresh());
  setCurrentUser(null);
}
