import { authHandlers } from "./auth";
import { organizationHandlers } from "./organizations";

// When the backend implements an endpoint, delete its handler here:
// the request then goes to Django (onUnhandledRequest: "bypass").
export const handlers = [...authHandlers, ...organizationHandlers];
