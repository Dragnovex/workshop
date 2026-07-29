"use client";

import { ArrowRight, Car, Clock, UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatDateTime } from "@/lib/format";
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import { AppointmentStatusBadge } from "./appointment-status-badge";
import type { AppointmentReadModel } from "../read-models";

export function AppointmentDetailView({ model }: { model: AppointmentReadModel }) {
  const t = useTranslations("appointments");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const { appointment, customer, vehicle } = model;

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {appointment.serviceType[lang]}
            <AppointmentStatusBadge status={appointment.status} label={t(`status.${appointment.status}`)} />
          </span>
        }
        description={<span data-numeric>{formatDateTime(appointment.scheduledAt, locale)}</span>}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/appointments">
              <ArrowRight aria-hidden="true" className="size-4 ltr:rotate-180" />
              {t("detail.back")}
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title={t("detail.customer")} contentClassName="p-0">
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

        <SectionCard title={t("detail.vehicle")} contentClassName="p-0">
          <div className="flex items-center gap-3 p-4">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-muted-foreground">
              <Car aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <Link href={`/vehicles/${vehicle.id}`} data-numeric className="font-medium hover:underline focus-visible:underline">
                {getVehicleDisplayName(vehicle, locale)}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground" data-ltr>{vehicle.plate}</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title={t("detail.summary")} contentClassName="p-0">
        <dl className="divide-y divide-border">
          <DetailRow label={t("detail.scheduledAt")} value={formatDateTime(appointment.scheduledAt, locale)} numeric />
          <DetailRow label={t("detail.duration")} value={t("detail.durationValue", { minutes: appointment.durationMinutes })} numeric />
          <DetailRow label={t("detail.service")} value={appointment.serviceType[lang]} />
          {appointment.linkedWorkOrderId ? (
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-xs text-muted-foreground">{t("detail.linkedWorkOrder")}</dt>
              <dd className="text-end text-sm font-medium">
                <Link href={`/work-orders/${appointment.linkedWorkOrderId}`} className="hover:underline focus-visible:underline" data-ltr>
                  {appointment.linkedWorkOrderId}
                </Link>
              </dd>
            </div>
          ) : null}
        </dl>
      </SectionCard>

      {appointment.notes ? (
        <SectionCard title={t("detail.notes")}>
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {appointment.notes[lang]}
          </p>
        </SectionCard>
      ) : null}
    </div>
  );
}

function DetailRow({
  label,
  value,
  numeric = false,
}: {
  label: string;
  value: string;
  numeric?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd data-numeric={numeric ? "" : undefined} className="text-end text-sm font-medium">
        {value}
      </dd>
    </div>
  );
}
