"use client";

import { ArrowRight, Car, Clock, UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Customer, Vehicle } from "@/lib/domain/contracts";
import { formatDateTime } from "@/lib/format";
import { loadStoredCustomers } from "@/modules/customers/client-store";
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import { loadStoredAppointments } from "../client-store";
import { AppointmentStatusBadge } from "./appointment-status-badge";
import { createLocalAppointmentReadModel } from "../read-models";
import type { Appointment } from "../types";

/**
 * المواعيد المُنشأة من الواجهة (/appointments/new) تعيش في localStorage
 * فقط — الخادم لا يراها. نمرّر بذرة الخادم كما هي وندمجها مع التخزين
 * المحلي على العميل، مع حالة "غير موجود" حقيقية بدل notFound() الخادمي
 * الذي كان يُخفي كل موعد أُنشئ من الواجهة عن صفحته الخاصة.
 */
export function AppointmentDetailView({
  id,
  initialAppointments,
  customers,
  vehicles,
}: {
  id: string;
  initialAppointments: Appointment[];
  customers: Customer[];
  vehicles: Vehicle[];
}) {
  const t = useTranslations("appointments");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";

  const [appointments] = useState<Appointment[]>(() =>
    loadStoredAppointments(initialAppointments),
  );
  const [storedCustomers] = useState<Customer[]>(() => loadStoredCustomers(customers));

  const model = useMemo(() => {
    const appointment = appointments.find((item) => item.id === id);
    if (!appointment) return null;
    return createLocalAppointmentReadModel(
      appointment,
      [...customers, ...storedCustomers],
      vehicles,
    );
  }, [appointments, customers, storedCustomers, vehicles, id]);

  if (!model) {
    return (
      <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5 py-20 text-center">
        <h1 className="text-2xl font-semibold">{t("detail.notFoundTitle")}</h1>
        <div>
          <Button asChild variant="outline">
            <Link href="/appointments">
              <ArrowRight className="size-4 ltr:rotate-180" />
              {t("detail.back")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

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
