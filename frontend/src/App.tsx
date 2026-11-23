import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ADMIN_SECTIONS, MAIN_NAV, PROJECT_TABS } from "@/app/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { NotFoundPage } from "@/components/NotFoundPage";
import LoginPage from "@/features/auth/LoginPage";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import BrandingSection from "@/screens/admin/BrandingSection";
import DashboardSection from "@/screens/admin/DashboardSection";
import ExportSection from "@/screens/admin/ExportSection";
import GroupsSection from "@/screens/admin/GroupsSection";
import ImportSection from "@/screens/admin/ImportSection";
import LogSection from "@/screens/admin/LogSection";
import MembersSection from "@/screens/admin/MembersSection";
import RolesSection from "@/screens/admin/RolesSection";
import SettingsSection from "@/screens/admin/SettingsSection";
import StatusesSection from "@/screens/admin/StatusesSection";
import FundingsPage from "@/screens/fundings/FundingsPage";
import OverviewPage from "@/screens/overview/OverviewPage";
import BudgetTab from "@/screens/project/BudgetTab";
import CommentsTab from "@/screens/project/CommentsTab";
import FundingsTab from "@/screens/project/FundingsTab";
import HistoryTab from "@/screens/project/HistoryTab";
import KanbanTab from "@/screens/project/KanbanTab";
import MilestonesTab from "@/screens/project/MilestonesTab";
import ProjectOverviewTab from "@/screens/project/OverviewTab";
import ProjectSettingsTab from "@/screens/project/SettingsTab";
import TasksTab from "@/screens/project/TasksTab";
import TeamTab from "@/screens/project/TeamTab";
import TimeTab from "@/screens/project/TimeTab";
import TimelineTab from "@/screens/project/TimelineTab";
import ProjectsPage from "@/screens/projects/ProjectsPage";
import TasksPage from "@/screens/tasks/TasksPage";
import MyTimePage from "@/screens/time/MyTimePage";

const MAIN_SCREENS: Record<(typeof MAIN_NAV)[number]["path"], ReactElement> = {
  overview: <OverviewPage />,
  projects: <ProjectsPage />,
  fundings: <FundingsPage />,
  tasks: <TasksPage />,
  time: <MyTimePage />,
};

const PROJECT_SCREENS: Record<(typeof PROJECT_TABS)[number]["path"], ReactElement> = {
  overview: <ProjectOverviewTab />,
  tasks: <TasksTab />,
  kanban: <KanbanTab />,
  milestones: <MilestonesTab />,
  timeline: <TimelineTab />,
  team: <TeamTab />,
  time: <TimeTab />,
  fundings: <FundingsTab />,
  budget: <BudgetTab />,
  comments: <CommentsTab />,
  history: <HistoryTab />,
  settings: <ProjectSettingsTab />,
};

const ADMIN_SCREENS: Record<(typeof ADMIN_SECTIONS)[number]["path"], ReactElement> = {
  dashboard: <DashboardSection />,
  members: <MembersSection />,
  groups: <GroupsSection />,
  roles: <RolesSection />,
  statuses: <StatusesSection />,
  settings: <SettingsSection />,
  branding: <BrandingSection />,
  import: <ImportSection />,
  export: <ExportSection />,
  log: <LogSection />,
};

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/overview" replace />} />
        {MAIN_NAV.map((item) => (
          <Route
            key={item.path}
            path={item.path}
            element={MAIN_SCREENS[item.path]}
          />
        ))}
        <Route path="projects/:projectId" element={<ProjectLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          {PROJECT_TABS.map((tab) => (
            <Route
              key={tab.path}
              path={tab.path}
              element={PROJECT_SCREENS[tab.path]}
            />
          ))}
        </Route>
        <Route path="admin" element={<AdminLayout />}>
          <Route
            index
            element={<Navigate to={ADMIN_SECTIONS[0].path} replace />}
          />
          {ADMIN_SECTIONS.map((section) => (
            <Route
              key={section.path}
              path={section.path}
              element={ADMIN_SCREENS[section.path]}
            />
          ))}
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
