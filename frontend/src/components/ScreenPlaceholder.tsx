import { Construction } from "lucide-react";
import { useTranslation } from "react-i18next";

const ISSUES_URL = "https://github.com/MarekTurkowicz/PROMPT-v2/issues";

export function ScreenPlaceholder({ issue }: { issue: number }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      <Construction
        className="size-8 text-muted-foreground"
        aria-hidden="true"
      />
      <h2 className="text-base font-semibold">{t("placeholder.title")}</h2>
      <p className="text-sm text-muted-foreground">
        {t("placeholder.body")}{" "}
        <a
          href={`${ISSUES_URL}/${issue}`}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("placeholder.issue", { number: issue })}
        </a>
      </p>
    </div>
  );
}
