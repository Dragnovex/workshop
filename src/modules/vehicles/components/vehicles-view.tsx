"use client";

import { Car, ClipboardList, Fingerprint, Search, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/patterns/page-header";
import { StatusBadge } from "@/components/patterns/status-badge";
import { StatCard } from "@/components/patterns/stat-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { getVehicleDisplayName } from "../display";
import type { VehicleReadModel } from "../read-models";

type ServiceFilter = "all" | "active" | "inactive";

export function VehiclesView({
  vehicles,
  stats,
}: {
  vehicles: VehicleReadModel[];
  stats: { total: number; active: number; withVin: number; customers: number };
}) {
  const t = useTranslations("vehicles");
  const tStatus = useTranslations("workOrders.status");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("all");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vehicles.filter(({ vehicle, customer, activeOrder }) => {
      if (serviceFilter === "active" && !activeOrder) return false;
      if (serviceFilter === "inactive" && activeOrder) return false;
      if (!query) return true;
      return (
        getVehicleDisplayName(vehicle, "ar").toLowerCase().includes(query) ||
        getVehicleDisplayName(vehicle, "en").toLowerCase().includes(query) ||
        vehicle.plate.toLowerCase().includes(query) ||
        vehicle.vin?.toLowerCase().includes(query) ||
        customer.displayName.ar.toLowerCase().includes(query) ||
        customer.displayName.en.toLowerCase().includes(query)
      );
    });
  }, [search, serviceFilter, vehicles]);

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("stats.total")} value={formatNumber(stats.total, locale)} icon={Car} tone="accent" />
        <StatCard label={t("stats.active")} value={formatNumber(stats.active, locale)} icon={ClipboardList} />
        <StatCard label={t("stats.withVin")} value={formatNumber(stats.withVin, locale)} icon={Fingerprint} />
        <StatCard label={t("stats.customers")} value={formatNumber(stats.customers, locale)} icon={Users} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="vehicle-search" className="sr-only">{t("searchLabel")}</label>
          <Input
            id="vehicle-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <Select value={serviceFilter} onValueChange={(value) => setServiceFilter(value as ServiceFilter)}>
          <SelectTrigger aria-label={t("serviceFilterLabel")} className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("serviceFilter.all")}</SelectItem>
            <SelectItem value="active">{t("serviceFilter.active")}</SelectItem>
            <SelectItem value="inactive">{t("serviceFilter.inactive")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="ps-4 text-xs whitespace-nowrap">{t("columns.vehicle")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.plate")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.customer")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.service")}</TableHead>
                <TableHead className="text-end text-xs whitespace-nowrap">{t("columns.orders")}</TableHead>
                <TableHead className="text-end text-xs whitespace-nowrap">{t("columns.mileage")}</TableHead>
                <TableHead className="pe-4 text-end text-xs whitespace-nowrap">{t("columns.lastVisit")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    {tCommon("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(({ vehicle, customer, workOrders, activeOrder, lastMileage, lastVisitAt }) => (
                  <TableRow key={vehicle.id} className="relative cursor-pointer">
                    <TableCell className="ps-4">
                      <Link
                        href={`/vehicles/${vehicle.id}`}
                        aria-label={t("openVehicle", { name: getVehicleDisplayName(vehicle, locale) })}
                        data-numeric
                        className="font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                      >
                        {getVehicleDisplayName(vehicle, locale)}
                      </Link>
                    </TableCell>
                    <TableCell data-ltr className="text-sm">{vehicle.plate}</TableCell>
                    <TableCell className="max-w-[13rem] truncate text-sm">{customer.displayName[lang]}</TableCell>
                    <TableCell>
                      {activeOrder ? (
                        <StatusBadge status={activeOrder.order.status} label={tStatus(activeOrder.order.status)} />
                      ) : (
                        <Badge variant="secondary">{t("noActiveOrder")}</Badge>
                      )}
                    </TableCell>
                    <TableCell data-numeric className="text-end text-sm">{formatNumber(workOrders.length, locale)}</TableCell>
                    <TableCell data-numeric className="text-end text-sm whitespace-nowrap">
                      {lastMileage === undefined ? t("notAvailable") : `${formatNumber(lastMileage, locale)} ${t("kilometers")}`}
                    </TableCell>
                    <TableCell data-numeric className="pe-4 text-end text-xs whitespace-nowrap text-muted-foreground">
                      {lastVisitAt ? formatDate(lastVisitAt, locale) : t("neverVisited")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
