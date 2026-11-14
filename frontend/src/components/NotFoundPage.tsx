import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <h1 className="text-[22px] font-semibold">{t("notFound.title")}</h1>
      <Button size="lg" asChild>
        <Link to="/overview">{t("notFound.back")}</Link>
      </Button>
    </div>
  );
}
