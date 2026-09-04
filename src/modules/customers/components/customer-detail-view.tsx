"use client";

import { ArrowRight, Car, ClipboardList, UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { StatCard } from "@/components/patterns/stat-card";
import { Badge } from "@/components/ui/badge";
import { WhatsAppLink } from "@/components/patterns/whatsapp-link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import type { Customer, Vehicle } from "@/lib/domain/contracts";
import { formatAddress } from "@/lib/domain/address";
import { formatDate, formatNumber } from "@/lib/format";
import { loadStoredCustomers } from "../client-store";
import { RelatedWorkOrdersTable } from "@/modules/work-orders/components/related-work-orders-table";
import { createWorkOrderReadModels } from "@/modules/work-orders/read-models";
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import { createCustomerReadModels } from "../read-models";
import type { WorkOrder } from "@/modules/work-orders/types";

/**
 * عملاء الواجهة (من /customers/new) يعيشون في localStorage فقط — الخادم لا
 * يراهم. نمرّر بذرة الخادم كما هي وندمجها مع التخزين المحلي على العميل،
 * مع حالة "غير موجود" حقيقية بدل notFound() الخادمي الذي كان يُخفي كل عميل
 * أُنشئ من الواجهة عن صفحته الخاصة.
 */
export function CustomerDetailView({
  id,
  initialCustomers,
  vehicles: allVehicles,
  workOrders: allWorkOrders,
}: {
  id: string;
  initialCustomers: Customer[];
  vehicles: Vehicle[];
  workOrders: WorkOrder[];
}) {
  const t = useTranslations("customers");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";

  const [customers] = useState<Customer[]>(() => loadStoredCustomers(initialCustomers));

  const model = useMemo(() => {
    // بذرة أوامر التشغيل وحدها — لا مصدر محلي لها بعد على هذه الصفحة،
    // وهي آمنة هنا لأن كل علاقاتها تشير إلى عملاء ومركبات البذرة نفسها.
    const joinedOrders = createWorkOrderReadModels(allWorkOrders, customers, allVehicles);
    return createCustomerReadModels(customers, allVehicles, joinedOrders).find(
      (item) => item.customer.id === id,
    );
  }, [customers, allVehicles, allWorkOrders, id]);

  if (!model) {
    return (
      <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5 py-20 text-center">
        <h1 className="text-2xl font-semibold">{t("detail.notFoundTitle")}</h1>
        <div>
          <Button asChild variant="outline">
            <Link href="/customers">
              <ArrowRight className="size-4 ltr:rotate-180" />
              {t("detail.back")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const { customer, vehicles, workOrders, openOrderCount, lastVisitAt } = model;

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {customer.displayName[lang]}
            <Badge variant="secondary">{t(`kind.${customer.kind}`)}</Badge>
          </span>
        }
        description={t("detail.subtitle")}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/customers">
              <ArrowRight aria-hidden="true" className="size-4 ltr:rotate-180" />
              {t("detail.back")}
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("detail.stats.vehicles")} value={formatNumber(vehicles.length, locale)} icon={Car} tone="accent" />
        <StatCard label={t("detail.stats.orders")} value={formatNumber(workOrders.length, locale)} icon={ClipboardList} />
        <StatCard label={t("detail.stats.openOrders")} value={formatNumber(openOrderCount, locale)} icon={ClipboardList} />
        <StatCard
          label={t("detail.stats.lastVisit")}
          value={lastVisitAt ? formatDate(lastVisitAt, locale) : t("neverVisited")}
          icon={UserRound}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title={t("detail.billing.contactTitle")} contentClassName="p-0">
          <dl className="divide-y divide-border">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-xs text-muted-foreground">{t("detail.billing.phone")}</dt>
              <dd className="text-end text-sm font-medium">
                {customer.phone ? (
                  <span className="inline-flex items-center gap-1.5">
                    <a href={`tel:${customer.phone}`} dir="ltr" className="hover:underline focus-visible:underline">
                      {customer.phone}
                    </a>
                    <WhatsAppLink phone={customer.phone} label={t("new.whatsapp")} />
                  </span>
                ) : (
                  t("detail.notAvailable")
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-xs text-muted-foreground">{t("detail.billing.email")}</dt>
              <dd className="text-end text-sm font-medium">
                {customer.email ? (
                  <a href={`mailto:${customer.email}`} dir="ltr" className="hover:underline focus-visible:underline">
                    {customer.email}
                  </a>
                ) : (
                  t("detail.notAvailable")
                )}
              </dd>
            </div>
            {customer.billingAddress ?? customer.nationalAddress ? (
              <DetailRow
                label={t("detail.billing.address")}
                value={formatAddress((customer.billingAddress ?? customer.nationalAddress)!, locale)}
              />
            ) : null}
          </dl>
        </SectionCard>

        <SectionCard title={t("detail.billing.legalTitle")} contentClassName="p-0">
          {customer.legalName || customer.vatNumber || customer.commercialRegistration ? (
            <dl className="divide-y divide-border">
              {customer.legalName ? (
                <DetailRow label={t("detail.billing.legalName")} value={customer.legalName[lang]} />
              ) : null}
              {customer.vatNumber ? (
                <DetailRow label={t("detail.billing.vatNumber")} value={customer.vatNumber} ltr numeric />
              ) : null}
              {customer.commercialRegistration ? (
                <DetailRow label={t("detail.billing.commercialRegistration")} value={customer.commercialRegistration} ltr numeric />
              ) : null}
            </dl>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t("detail.billing.noLegalData")}</p>
          )}
        </SectionCard>
      </div>

      <SectionCard title={t("detail.vehicles")} contentClassName="p-0">
        {vehicles.length === 0 ? (
          <EmptyState icon={Car} title={t("detail.noVehicles")} description={t("detail.noVehiclesDescription")} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="ps-4 text-xs whitespace-nowrap">{t("detail.vehicleColumns.vehicle")}</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">{t("detail.vehicleColumns.plate")}</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">{t("detail.vehicleColumns.vin")}</TableHead>
                  <TableHead className="pe-4 text-end text-xs whitespace-nowrap">{t("detail.vehicleColumns.orders")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => {
                  const orderCount = workOrders.filter(({ order }) => order.vehicleId === vehicle.id).length;
                  return (
                    <TableRow key={vehicle.id} className="relative cursor-pointer">
                      <TableCell className="ps-4">
                        <Link
                          href={`/vehicles/${vehicle.id}`}
                          aria-label={t("detail.openVehicle", { name: getVehicleDisplayName(vehicle, locale) })}
                          data-numeric
                          className="font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                        >
                          {getVehicleDisplayName(vehicle, locale)}
                        </Link>
                      </TableCell>
                      <TableCell data-ltr className="text-sm">{vehicle.plate}</TableCell>
                      <TableCell data-ltr className="text-xs text-muted-foreground">
                        {vehicle.vin ?? t("detail.notAvailable")}
                      </TableCell>
                      <TableCell data-numeric className="pe-4 text-end text-sm">{formatNumber(orderCount, locale)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <SectionCard title={t("detail.workOrders")} contentClassName="p-0">
        <RelatedWorkOrdersTable workOrders={workOrders} showVehicle={vehicles.length > 1} />
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
