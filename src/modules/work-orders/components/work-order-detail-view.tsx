"use client";

import { ArrowRight, CalendarClock, FileText, Gauge, Phone, Printer, Receipt, UserRound, Wrench } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { Customer, Vehicle } from "@/lib/domain/contracts";
import { DetailTabs } from "./detail-tabs";
import { LifecycleTracker } from "./lifecycle-tracker";
import type { WorkOrderReadModel, WorkOrderRelations } from "../read-models";
import { useLocalCollection } from "@/lib/use-local-collection";
import { nextStatusOf, workOrderStore, workOrderTombstones } from "../client-store";
import type { WorkOrder } from "../types";
import { getVehicleDisplayName } from "@/modules/vehicles/display";

function joinReadModel(
  orders: WorkOrder[],
  customers: Customer[],
  vehicles: Vehicle[],
  id: string,
): WorkOrderReadModel | null {
  const order = orders.find((item) => item.id === id);
  if (!order) return null;
  const customer = customers.find((item) => item.id === order.customerId);
  const vehicle = vehicles.find((item) => item.id === order.vehicleId);
  if (!customer || !vehicle) return null;
  return { order, customer, vehicle };
}

export function WorkOrderDetailView({
  id,
  initialOrders,
  customers,
  vehicles,
  initialRelations,
}: {
  id: string;
  initialOrders: WorkOrder[];
  customers: Customer[];
  vehicles: Vehicle[];
  initialRelations: WorkOrderRelations;
}) {
  const t = useTranslations("workOrders");
  const tStatus = useTranslations("workOrders.status");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";

  // نفس محرّك القائمة: الصلاحية تُفحص وكتابة التخزين تُتحقَّق قبل تحديث
  // الشاشة. تقديم الحالة تعديل فعلي على السجل ولا يجوز أن يمرّ بلا حارس.
  const { rows: orders, update: updateOrder } = useLocalCollection<WorkOrder>({
    resource: "workOrders",
    seed: initialOrders,
    store: workOrderStore,
    tombstones: workOrderTombstones,
  });

  const model = useMemo(
    () => joinReadModel(orders, customers, vehicles, id),
    [orders, customers, vehicles, id],
  );

  if (!model) {
    return (
      <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5 py-20 text-center">
        <h1 className="text-2xl font-semibold">{t("detail.notFoundTitle")}</h1>
        <div>
          <Button asChild variant="outline">
            <Link href="/work-orders">
              <ArrowRight className="size-4 ltr:rotate-180" />
              {t("detail.back")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const { order, customer, vehicle } = model;
  const relations = initialRelations;
  const hasRelations = relations.appointmentId || relations.estimateId || relations.invoiceId;
  const nextStatus = nextStatusOf(order.status);

  function handleAdvance() {
    if (!nextStatus) return;
    const now = new Date().toISOString();
    const ok = updateOrder(order.id, (item) => ({
      ...item,
      status: nextStatus,
      timeline: [
        ...item.timeline,
        {
          id: `t-${Date.now()}`,
          status: nextStatus,
          timestamp: now,
          actor: { ar: "الورشة", en: "Workshop" },
        },
      ],
    }));
    if (!ok) return;
    toast.success(t("advance.to", { status: tStatus(nextStatus) }));
  }

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
          <div className="flex flex-wrap items-center gap-2">
            {nextStatus ? (
              <Button size="sm" onClick={handleAdvance} className="gap-2">
                <Wrench aria-hidden="true" className="size-4" />
                {t("advance.next", { status: tStatus(nextStatus) })}
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer aria-hidden="true" className="size-4" />
              {t("detail.print")}
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/work-orders">
                <ArrowRight className="size-4 ltr:rotate-180" />
                {t("detail.back")}
              </Link>
            </Button>
          </div>
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
              href={`/customers/${customer.id}`}
            />
            <SummaryRow
              icon={Wrench}
              label={t("detail.vehicle")}
              value={getVehicleDisplayName(vehicle, locale)}
              secondary={vehicle.plate}
              ltrSecondary
              href={`/vehicles/${vehicle.id}`}
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title={t("detail.quickActions")} contentClassName="flex flex-wrap gap-2 p-4">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer aria-hidden="true" className="size-4" />
            {t("detail.print")}
          </Button>
          {customer.phone ? (
            <Button asChild variant="outline" size="sm">
              <a href={`tel:${customer.phone}`} dir="ltr">
                <Phone aria-hidden="true" className="size-4" />
                {t("detail.callCustomer")}
              </a>
            </Button>
          ) : null}
          <Button asChild variant="outline" size="sm">
            <Link href={`/customers/${customer.id}`}>
              <UserRound aria-hidden="true" className="size-4" />
              {t("detail.viewCustomer")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/vehicles/${vehicle.id}`}>
              <Wrench aria-hidden="true" className="size-4" />
              {t("detail.viewVehicle")}
            </Link>
          </Button>
        </SectionCard>

        <SectionCard title={t("detail.relations")} contentClassName="p-0">
          {hasRelations ? (
            <ul className="divide-y divide-border">
              {relations.appointmentId ? (
                <RelationRow icon={CalendarClock} label={t("detail.relationAppointment")} href={`/appointments/${relations.appointmentId}`} value={relations.appointmentId} />
              ) : null}
              {relations.estimateId ? (
                <RelationRow icon={FileText} label={t("detail.relationEstimate")} href={`/estimates/${relations.estimateId}`} value={relations.estimateId} />
              ) : null}
              {relations.invoiceId ? (
                <RelationRow icon={Receipt} label={t("detail.relationInvoice")} href={`/invoices/${relations.invoiceId}`} value={relations.invoiceId} />
              ) : null}
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t("detail.noRelations")}</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function RelationRow({
  icon: Icon,
  label,
  href,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  href: string;
  value: string;
}) {
  return (
    <li className="relative flex items-center gap-3 px-4 py-3">
      <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Link href={href} data-ltr className="text-sm font-medium outline-none after:absolute after:inset-0 focus-visible:underline">
          {value}
        </Link>
      </div>
    </li>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  secondary,
  ltrValue = false,
  ltrSecondary = false,
  href,
}: {
  icon?: typeof UserRound;
  label: string;
  value: string;
  secondary?: string;
  ltrValue?: boolean;
  ltrSecondary?: boolean;
  href?: string;
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
          {href ? (
            <Link href={href} className="hover:underline focus-visible:underline">
              {value}
            </Link>
          ) : (
            value
          )}
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

