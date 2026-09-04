"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field } from "@/modules/auth/components/field";
import { PasswordInput } from "@/modules/auth/components/password-input";
import { cn } from "@/lib/utils";

/** مقياس بسيط ومقروء: طول + تنوّع محارف. */
function scorePassword(value: string): 0 | 1 | 2 | 3 | 4 {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^\w\s]/.test(value)) score += 1;
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
}

const meterColors = [
  "bg-border-strong",
  "bg-danger",
  "bg-warning",
  "bg-info",
  "bg-success",
];

export function ResetPasswordForm() {
  const t = useTranslations("auth.reset");
  const tv = useTranslations("auth.validation");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const schema = React.useMemo(
    () =>
      z
        .object({
          password: z.string().min(8, tv("passwordMin")),
          confirmPassword: z.string().min(1, tv("passwordRequired")),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: tv("passwordMismatch"),
          path: ["confirmPassword"],
        }),
    [tv],
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = watch("password");
  const score = scorePassword(password);
  const strengthKeys = ["weak", "weak", "fair", "good", "strong"] as const;

  async function onSubmit(values: z.infer<typeof schema>) {
    setSubmitError(null);
    setSaved(false);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      setSubmitError(t("errorUnavailable"));
      return;
    }

    // ينشئ العميل جلسة الاسترداد من access_token الموجود في رابط البريد،
    // ثم يحدّث كلمة المرور على حساب المستخدم نفسه.
    const supabase = createBrowserClient(url, anonKey);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setSubmitError(t("errorExpired"));
      return;
    }

    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field
          id="password"
          label={t("password")}
          error={errors.password?.message}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          {password ? (
            <div className="space-y-1.5 pt-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      step <= score ? meterColors[score] : "bg-surface-sunken",
                    )}
                  />
                ))}
              </div>
              <p className="text-2xs text-muted-foreground">
                {t("strength.label")} — {t(`strength.${strengthKeys[score]}`)}
              </p>
            </div>
          ) : null}
        </Field>

        <Field
          id="confirmPassword"
          label={t("confirmPassword")}
          error={errors.confirmPassword?.message}
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword ? "confirmPassword-error" : undefined
            }
            {...register("confirmPassword")}
          />
        </Field>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("submitting")}
            </>
          ) : (
            t("submit")
          )}
        </Button>
      </form>

      {saved ? (
        <div role="status" className="flex items-start gap-2.5 rounded-lg border border-success/30 bg-success/5 px-3 py-2.5">
          <CheckCircle2 className="mt-px size-4 shrink-0 text-success" />
          <p className="text-xs leading-5 text-success">{t("success")}</p>
        </div>
      ) : null}

      {submitError ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <AlertCircle className="mt-px size-4 shrink-0 text-destructive" />
          <p className="text-xs leading-5 text-destructive">{submitError}</p>
        </div>
      ) : null}
    </div>
  );
}
