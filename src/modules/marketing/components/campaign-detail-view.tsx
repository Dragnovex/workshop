"use client";

import { ArrowRight, Target, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { StatCard } from "@/components/patterns/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { CampaignStatusBadge } from "./campaign-status-badge";
import type { Campaign } from "../types";

export function CampaignDetailView({ campaign }: { campaign: Campaign }) {
  const t = useTranslations("marketing");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {campaign.name[lang]}
            <Badge variant="secondary">{t(`channel.${campaign.channel}`)}</Badge>
            <CampaignStatusBadge status={campaign.status} label={t(`status.${campaign.status}`)} />
          </span>
        }
        description={campaign.targetSegment[lang]}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/marketing">
              <ArrowRight aria-hidden="true" className="size-4 ltr:rotate-180" />
              {t("detail.back")}
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <StatCard label={t("columns.budget")} value={formatCurrency(campaign.budget, locale)} unit={tCommon("currency")} icon={Wallet} tone="accent" />
        <StatCard label={t("detail.reach")} value={formatNumber(campaign.reach, locale)} icon={Target} />
      </div>

      <SectionCard title={t("detail.summary")} contentClassName="p-0">
        <dl className="divide-y divide-border">
          <DetailRow label={t("detail.targetSegment")} value={campaign.targetSegment[lang]} />
          <DetailRow label={t("detail.startDate")} value={formatDate(campaign.startDate, locale)} numeric />
          <DetailRow label={t("detail.endDate")} value={formatDate(campaign.endDate, locale)} numeric />
        </dl>
      </SectionCard>

      {campaign.notes ? (
        <SectionCard title={t("detail.notes")}>
          <p className="text-sm text-muted-foreground">{campaign.notes[lang]}</p>
        </SectionCard>
      ) : null}
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
