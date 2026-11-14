import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ADMIN_SECTIONS, MAIN_NAV, PROJECT_TABS } from "@/app/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { NotFoundPage } from "@/components/NotFoundPage";
import { ScreenPlaceholder } from "@/components/ScreenPlaceholder";
import LoginPage from "@/features/auth/LoginPage";
import ProtectedRoute from "@/features/auth/ProtectedRoute";

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
            element={<ScreenPlaceholder issue={item.issue} />}
          />
        ))}
        <Route path="projects/:projectId" element={<ProjectLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          {PROJECT_TABS.map((tab) => (
            <Route
              key={tab.path}
              path={tab.path}
              element={<ScreenPlaceholder issue={tab.issue} />}
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
              element={<ScreenPlaceholder issue={section.issue} />}
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
