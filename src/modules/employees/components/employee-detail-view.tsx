"use client";

import { ArrowRight, Mail, Phone, UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { EmployeeStatusBadge } from "./employee-status-badge";
import type { Employee } from "../types";

export function EmployeeDetailView({ employee }: { employee: Employee }) {
  const t = useTranslations("employees");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {employee.name[lang]}
            <Badge variant="secondary">{t(`department.${employee.department}`)}</Badge>
            <EmployeeStatusBadge status={employee.status} label={t(`status.${employee.status}`)} />
          </span>
        }
        description={employee.role[lang]}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/employees">
              <ArrowRight aria-hidden="true" className="size-4 ltr:rotate-180" />
              {t("detail.back")}
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title={t("detail.profile")} contentClassName="p-0">
          <div className="flex items-center gap-3 p-4">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-muted-foreground">
              <UserRound aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-medium">{employee.name[lang]}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{employee.role[lang]}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t("detail.contact")} contentClassName="p-0">
          <dl className="divide-y divide-border">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone aria-hidden="true" className="size-3.5" />
                {t("detail.phone")}
              </dt>
              <dd data-ltr className="text-end text-sm font-medium">{employee.phone}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail aria-hidden="true" className="size-3.5" />
                {t("detail.email")}
              </dt>
              <dd data-ltr className="text-end text-sm font-medium">{employee.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-xs text-muted-foreground">{t("detail.hireDate")}</dt>
              <dd data-numeric className="text-end text-sm font-medium">{formatDate(employee.hireDate, locale)}</dd>
            </div>
          </dl>
        </SectionCard>
      </div>
    </div>
  );
}
