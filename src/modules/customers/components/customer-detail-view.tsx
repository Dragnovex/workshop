"use client";

import { ArrowRight, Car, ClipboardList, UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { StatCard } from "@/components/patterns/stat-card";
import { Badge } from "@/components/ui/badge";
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
import { formatDate, formatNumber } from "@/lib/format";
import { RelatedWorkOrdersTable } from "@/modules/work-orders/components/related-work-orders-table";
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import type { CustomerReadModel } from "../read-models";

export function CustomerDetailView({ model }: { model: CustomerReadModel }) {
  const t = useTranslations("customers");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
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
        <RelatedWorkOrdersTable workOrders={workOrders} />
      </SectionCard>
    </div>
  );
}
