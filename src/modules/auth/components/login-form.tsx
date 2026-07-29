"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { Field } from "@/modules/auth/components/field";
import { PasswordInput } from "@/modules/auth/components/password-input";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const tv = useTranslations("auth.validation");
  const [notice, setNotice] = React.useState(false);

  const schema = React.useMemo(
    () =>
      z.object({
        email: z
          .string()
          .min(1, tv("emailRequired"))
          .pipe(z.email(tv("emailInvalid"))),
        password: z.string().min(8, tv("passwordMin")),
        remember: z.boolean(),
      }),
    [tv],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  /**
   * المرحلة الأولى: لا مزوّد مصادقة ولا جلسة.
   * هذه الدالة هي بالضبط موضع استدعاء signIn من Auth.js في المرحلة الثانية.
   */
  async function onSubmit() {
    setNotice(false);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setNotice(true);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field id="email" label={t("email")} error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
        </Field>

        <Field
          id="password"
          label={t("password")}
          error={errors.password?.message}
          action={
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-primary-text hover:underline"
            >
              {t("forgot")}
            </Link>
          }
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder={t("passwordPlaceholder")}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
        </Field>

        <div className="flex items-center gap-2 pt-0.5">
          <Checkbox
            id="remember"
            checked={watch("remember")}
            onCheckedChange={(checked) =>
              setValue("remember", checked === true)
            }
          />
          <Label
            htmlFor="remember"
            className="text-sm font-normal text-muted-foreground"
          >
            {t("remember")}
          </Label>
        </div>

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

      {notice ? (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-subtle px-3 py-2.5"
        >
          <Info className="mt-px size-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-5 text-muted-foreground">
            {t("notReady")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
