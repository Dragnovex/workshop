"use client";

import { ArrowRight, CalendarClock, Gauge, UserRound, Wrench } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatDateTime, formatNumber } from "@/lib/format";
import { DetailTabs } from "./detail-tabs";
import { LifecycleTracker } from "./lifecycle-tracker";
import {
  type WorkOrderReadModel,
} from "../read-models";
import { getVehicleDisplayName } from "@/modules/vehicles/display";

export function WorkOrderDetailView({
  model,
}: {
  model: WorkOrderReadModel;
}) {
  const t = useTranslations("workOrders");
  const tStatus = useTranslations("workOrders.status");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const { order, customer, vehicle } = model;

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span data-ltr className="font-mono">
              {order.number}
            </span>
            <StatusBadge status={order.status} label={tStatus(order.status)} />
          </span>
        }
        description={getVehicleDisplayName(vehicle, locale)}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/work-orders">
              <ArrowRight className="size-4 ltr:rotate-180" />
              {t("detail.back")}
            </Link>
          </Button>
        }
      />

      <section
        aria-labelledby="work-order-lifecycle"
        className="surface-card overflow-x-auto p-4"
      >
        <h2 id="work-order-lifecycle" className="mb-4 text-sm font-semibold">
          {t("detail.lifecycle")}
        </h2>
        <LifecycleTracker status={order.status} />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <DetailTabs order={order} />
        </div>

        <SectionCard title={t("detail.summary")} contentClassName="p-0">
          <dl className="divide-y divide-border">
            <SummaryRow
              icon={UserRound}
              label={t("detail.customer")}
              value={customer.displayName[lang]}
            />
            <SummaryRow
              icon={Wrench}
              label={t("detail.vehicle")}
              value={getVehicleDisplayName(vehicle, locale)}
              secondary={vehicle.plate}
              ltrSecondary
            />
            {vehicle.vin ? (
              <SummaryRow
                label={t("detail.vin")}
                value={vehicle.vin}
                ltrValue
              />
            ) : null}
            <SummaryRow
              icon={Gauge}
              label={t("detail.mileage")}
              value={`${formatNumber(order.mileageAtReception, locale)} ${t("detail.kilometers")}`}
            />
            <SummaryRow
              label={t("detail.technician")}
              value={order.technician[lang]}
              secondary={
                order.bay
                  ? t("detail.bayValue", { number: order.bay })
                  : undefined
              }
            />
            <SummaryRow
              icon={CalendarClock}
              label={t("detail.receivedAt")}
              value={formatDateTime(order.receivedAt, locale)}
            />
            {order.estimatedDelivery ? (
              <SummaryRow
                label={t("detail.estimatedDelivery")}
                value={formatDateTime(order.estimatedDelivery, locale)}
              />
            ) : null}
          </dl>
        </SectionCard>
      </div>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  secondary,
  ltrValue = false,
  ltrSecondary = false,
}: {
  icon?: typeof UserRound;
  label: string;
  value: string;
  secondary?: string;
  ltrValue?: boolean;
  ltrSecondary?: boolean;
}) {
  return (
    <div className="flex gap-3 px-4 py-3">
      {Icon ? (
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      ) : (
        <span className="size-4 shrink-0" />
      )}
      <div className="min-w-0">
        <dt className="text-2xs text-muted-foreground">{label}</dt>
        <dd
          data-ltr={ltrValue ? "" : undefined}
          className="mt-0.5 truncate text-sm font-medium"
        >
          {value}
        </dd>
        {secondary ? (
          <dd
            data-ltr={ltrSecondary ? "" : undefined}
            className="mt-0.5 text-xs text-muted-foreground"
          >
            {secondary}
          </dd>
        ) : null}
      </div>
    </div>
  );
}

