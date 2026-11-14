import {
  Clock,
  Columns3,
  Folder,
  House,
  KeyRound,
  ListChecks,
  Network,
  ScrollText,
  SlidersHorizontal,
  Users,
  Wallet,
} from "lucide-react";

// `issue` = M4 issue that builds the screen; shown on the placeholder until then.
export const MAIN_NAV = [
  { path: "overview", label: "nav.overview", icon: House, issue: 131 },
  { path: "projects", label: "nav.projects", icon: Folder, issue: 94 },
  { path: "fundings", label: "nav.fundings", icon: Wallet, issue: 44 },
  { path: "tasks", label: "nav.tasks", icon: ListChecks, issue: 95 },
  { path: "time", label: "nav.time", icon: Clock, issue: 47 },
] as const;

export const PROJECT_TABS = [
  { path: "overview", label: "project.tabs.overview", issue: 94 },
  { path: "tasks", label: "project.tabs.tasks", issue: 95 },
  { path: "kanban", label: "project.tabs.kanban", issue: 41 },
  { path: "milestones", label: "project.tabs.milestones", issue: 43 },
  { path: "timeline", label: "project.tabs.timeline", issue: 43 },
  { path: "team", label: "project.tabs.team", issue: 130 },
  { path: "time", label: "project.tabs.time", issue: 47 },
  { path: "fundings", label: "project.tabs.fundings", issue: 44 },
  { path: "budget", label: "project.tabs.budget", issue: 45 },
  { path: "comments", label: "project.tabs.comments", issue: 42 },
  { path: "history", label: "project.tabs.history", issue: 46 },
  { path: "settings", label: "project.tabs.settings", issue: 94 },
] as const;

export const ADMIN_SECTIONS = [
  { path: "members", label: "admin.members", icon: Users, issue: 38 },
  { path: "groups", label: "admin.groups", icon: Network, issue: 39 },
  { path: "roles", label: "admin.roles", icon: KeyRound, issue: 39 },
  { path: "statuses", label: "admin.statuses", icon: Columns3, issue: 40 },
  {
    path: "settings",
    label: "admin.settings",
    icon: SlidersHorizontal,
    issue: 129,
  },
  { path: "log", label: "admin.log", icon: ScrollText, issue: 129 },
] as const;
