"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { Field } from "@/modules/auth/components/field";

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgot");
  const tLogin = useTranslations("auth.login");
  const tv = useTranslations("auth.validation");
  const [sent, setSent] = React.useState(false);

  const schema = React.useMemo(
    () =>
      z.object({
        email: z
          .string()
          .min(1, tv("emailRequired"))
          .pipe(z.email(tv("emailInvalid"))),
      }),
    [tv],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit() {
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSent(true);
  }

  const backLink = (
    <Link
      href="/login"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
    >
      <ArrowLeft className="size-3.5 ltr:rotate-180" />
      {t("backToLogin")}
    </Link>
  );

  if (sent) {
    return (
      <div className="space-y-6">
        <span className="flex size-11 items-center justify-center rounded-lg border border-border bg-surface-subtle text-muted-foreground">
          <MailCheck className="size-5" />
        </span>
        <header className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("sentTitle")}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("sentBody")}
          </p>
        </header>
        {backLink}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field id="email" label={tLogin("email")} error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            placeholder={tLogin("emailPlaceholder")}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
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

      {backLink}
    </div>
  );
}
