"use client";

import { ArrowRight, CalendarClock, ClipboardList, Gauge, UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { StatusBadge } from "@/components/patterns/status-badge";
import { StatCard } from "@/components/patterns/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatDate, formatNumber } from "@/lib/format";
import { RelatedWorkOrdersTable } from "@/modules/work-orders/components/related-work-orders-table";
import { getVehicleDisplayName } from "../display";
import type { VehicleReadModel } from "../read-models";
import { VehicleImage } from "./vehicle-image";

export function VehicleDetailView({ model }: { model: VehicleReadModel }) {
  const t = useTranslations("vehicles");
  const tStatus = useTranslations("workOrders.status");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const { vehicle, customer, workOrders, activeOrder, lastVisitAt, lastMileage } = model;

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span data-numeric>{getVehicleDisplayName(vehicle, locale)}</span>
            {activeOrder ? (
              <StatusBadge status={activeOrder.order.status} label={tStatus(activeOrder.order.status)} />
            ) : (
              <Badge variant="secondary">{t("noActiveOrder")}</Badge>
            )}
          </span>
        }
        description={<span data-ltr>{vehicle.plate}</span>}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/vehicles">
              <ArrowRight aria-hidden="true" className="size-4 ltr:rotate-180" />
              {t("detail.back")}
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={t("detail.stats.orders")} value={formatNumber(workOrders.length, locale)} icon={ClipboardList} tone="accent" />
        <StatCard
          label={t("detail.stats.lastMileage")}
          value={lastMileage === undefined ? t("notAvailable") : formatNumber(lastMileage, locale)}
          unit={lastMileage === undefined ? undefined : t("kilometers")}
          icon={Gauge}
        />
        <StatCard
          label={t("detail.stats.lastVisit")}
          value={lastVisitAt ? formatDate(lastVisitAt, locale) : t("neverVisited")}
          icon={CalendarClock}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title={t("detail.vehicleData")} contentClassName="p-0">
          <VehicleImage
            imageUrl={vehicle.imageUrl}
            alt={getVehicleDisplayName(vehicle, locale)}
            className="h-40 w-full"
          />
          <dl className="divide-y divide-border">
            <DetailRow label={t("detail.make")} value={vehicle.make[lang]} />
            <DetailRow label={t("detail.model")} value={vehicle.model[lang]} />
            <DetailRow label={t("detail.year")} value={String(vehicle.year)} numeric />
            <DetailRow label={t("detail.plate")} value={vehicle.plate} ltr />
            <DetailRow label={t("detail.vin")} value={vehicle.vin ?? t("notAvailable")} ltr={vehicle.vin !== undefined} />
          </dl>
        </SectionCard>

        <SectionCard title={t("detail.owner")} contentClassName="p-0">
          <div className="flex items-center gap-3 p-4">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-muted-foreground">
              <UserRound aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <Link href={`/customers/${customer.id}`} className="font-medium hover:underline focus-visible:underline">
                {customer.displayName[lang]}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">{t(`customerKind.${customer.kind}`)}</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title={t("detail.workOrders")} contentClassName="p-0">
        <RelatedWorkOrdersTable workOrders={workOrders} />
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
