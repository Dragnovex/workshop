"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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

  async function onSubmit() {
    await new Promise((resolve) => setTimeout(resolve, 700));
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
    </div>
  );
}
