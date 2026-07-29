"use client";

import { AlertTriangle, ArrowRight, MapPin, Package, Warehouse } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { StatCard } from "@/components/patterns/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Part } from "../types";

export function PartDetailView({ part }: { part: Part }) {
  const t = useTranslations("inventory");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const isLow = part.qtyOnHand <= part.reorderLevel;

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {part.name[lang]}
            <Badge variant="secondary">{t(`category.${part.category}`)}</Badge>
            {isLow ? (
              <Badge className="bg-warning-subtle text-warning-text">{t("lowStock")}</Badge>
            ) : null}
          </span>
        }
        description={<span data-ltr>{part.sku}</span>}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/inventory">
              <ArrowRight aria-hidden="true" className="size-4 ltr:rotate-180" />
              {t("detail.back")}
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label={t("detail.stats.qtyOnHand")} value={formatNumber(part.qtyOnHand, locale)} icon={Package} tone="accent" />
        <StatCard label={t("detail.stats.reorderLevel")} value={formatNumber(part.reorderLevel, locale)} icon={AlertTriangle} />
        <StatCard
          label={t("detail.stats.totalValue")}
          value={formatCurrency(part.qtyOnHand * part.unitPrice, locale)}
          icon={Warehouse}
        />
      </div>

      <SectionCard title={t("detail.partData")} contentClassName="p-0">
        <dl className="divide-y divide-border">
          <DetailRow label={t("columns.sku")} value={part.sku} ltr />
          <DetailRow label={t("columns.name")} value={part.name[lang]} />
          <DetailRow label={t("columns.category")} value={t(`category.${part.category}`)} />
          <DetailRow label={t("columns.unitPrice")} value={formatCurrency(part.unitPrice, locale)} numeric />
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-xs text-muted-foreground">{t("columns.location")}</dt>
            <dd className="flex items-center gap-1.5 text-end text-sm font-medium" data-ltr>
              <MapPin aria-hidden="true" className="size-3.5 text-muted-foreground" />
              {part.location}
            </dd>
          </div>
        </dl>
      </SectionCard>
    </div>
  );
}

function DetailRow({
  label,
  value,
  ltr = false,
  numeric = false,
}: {
  label: string;
  value: string;
  ltr?: boolean;
  numeric?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd data-ltr={ltr ? "" : undefined} data-numeric={numeric ? "" : undefined} className="text-end text-sm font-medium">
        {value}
      </dd>
    </div>
  );
}
