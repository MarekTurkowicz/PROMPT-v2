import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { useMeQuery } from "./authApi";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { isLoading, isError } = useMeQuery();

  if (isLoading) return <div className="p-6">{t("loading")}</div>;
  if (isError) return <Navigate to="/login" replace />;

  return children;
}
