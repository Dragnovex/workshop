"use client";

import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatDateTime } from "@/lib/format";
import type { Report } from "../types";

export function ReportDetailView({ report }: { report: Report }) {
  const t = useTranslations("reports");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {report.name[lang]}
            <Badge variant="secondary">{t(`category.${report.category}`)}</Badge>
          </span>
        }
        description={report.description[lang]}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/reports">
              <ArrowRight aria-hidden="true" className="size-4 ltr:rotate-180" />
              {t("detail.back")}
            </Link>
          </Button>
        }
      />

      <SectionCard title={t("detail.summary")} contentClassName="p-0">
        <dl className="divide-y divide-border">
          <DetailRow label={t("columns.frequency")} value={t(`frequency.${report.frequency}`)} />
          <DetailRow label={t("columns.lastGenerated")} value={formatDateTime(report.lastGeneratedAt, locale)} numeric />
        </dl>
      </SectionCard>
    </div>
  );
}

function DetailRow({ label, value, numeric = false }: { label: string; value: string; numeric?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd data-numeric={numeric ? "" : undefined} className="text-end text-sm font-medium">
        {value}
      </dd>
    </div>
  );
}
