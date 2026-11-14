import { Eye, EyeOff } from "lucide-react";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOCK_API } from "@/mocks/enabled";
import { useLoginMutation, useMeQuery } from "./authApi";

const FAIL_KEY = "login_fail_count";
const MAX_BACKOFF_MS = 5000;

function httpStatus(e: unknown): number {
  if (typeof e === "object" && e && "status" in e) {
    const s = (e as { status?: unknown }).status;
    return typeof s === "number" ? s : 0;
  }
  return 0;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function LoginPage() {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const { data: me, isLoading: meLoading } = useMeQuery();
  const [login, { isLoading }] = useLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (meLoading) return null;
  if (me) return <Navigate to="/overview" replace />;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");

    const fails = Number(sessionStorage.getItem(FAIL_KEY) ?? 0);
    const delay = Math.min(MAX_BACKOFF_MS, fails * 500);
    if (delay > 0) {
      toast(t("backoff"), { id: "backoff", duration: 1000 });
      await sleep(delay);
    }

    try {
      await login({ email, password }).unwrap();
      sessionStorage.removeItem(FAIL_KEY);
      toast.success(t("success"));
      navigate("/overview", { replace: true });
    } catch (err: unknown) {
      sessionStorage.setItem(FAIL_KEY, String(fails + 1));
      const status = httpStatus(err);
      const message =
        status === 429
          ? t("errors.tooManyAttempts")
          : status === 400
            ? t("errors.invalidCredentials")
            : t("errors.failed");
      setFormError(message);
      toast.error(message);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-background p-4">
      <Card className="w-full max-w-[380px]">
        <CardHeader>
          <div className="mb-3 flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-[34px] items-center justify-center rounded-[9px] bg-primary font-semibold text-primary-foreground"
            >
              {t("common:appName")[0]}
            </span>
            <span className="font-semibold">{t("common:appName")}</span>
          </div>
          <h1 className="text-[22px] font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          {MOCK_API && (
            <p className="mt-2 rounded-lg bg-brand-tint px-3 py-2 text-sm text-brand-ink">
              {t("demoHint", { email: "pm@example.com" })}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4" noValidate={false}>
            <div className="grid gap-1.5">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                className="h-10"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">{t("password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder={t("passwordPlaceholder")}
                  className="h-10 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1"
                  aria-label={
                    showPassword ? t("hidePassword") : t("showPassword")
                  }
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              className="h-10"
              disabled={isLoading}
            >
              {isLoading ? t("submitting") : t("submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
