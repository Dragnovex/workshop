"use client";

import { ClipboardCheck, ClipboardList, Plus, Search, Timer, Wrench } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { workOrderStatuses } from "@/components/patterns/status-badge";
import { StatusBadge } from "@/components/patterns/status-badge";
import { StatCard } from "@/components/patterns/stat-card";
import { Button } from "@/components/ui/button";
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
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import {
  getWorkOrderTotals,
  type WorkOrderReadModel,
} from "../read-models";
import type { WorkOrderStatus } from "../types";
import { getVehicleDisplayName } from "@/modules/vehicles/display";

const PRIORITY_STYLES = {
  low: "text-muted-foreground text-xs",
  normal: "text-muted-foreground text-xs",
  high: "text-warning-text text-xs font-medium",
  urgent: "text-danger-text text-xs font-semibold",
} as const;

export function WorkOrdersView({
  workOrders,
  stats,
}: {
  workOrders: WorkOrderReadModel[];
  stats: { open: number; awaitingApproval: number; inProgress: number; readyForDelivery: number };
}) {
  const t = useTranslations("workOrders");
  const tStatus = useTranslations("workOrders.status");
  const tPriority = useTranslations("workOrders.priority");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | "all">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return workOrders.filter(({ order, customer, vehicle }) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        order.number.toLowerCase().includes(q) ||
        customer.displayName.ar.toLowerCase().includes(q) ||
        customer.displayName.en.toLowerCase().includes(q) ||
        vehicle.plate.toLowerCase().includes(q) ||
        getVehicleDisplayName(vehicle, "ar").toLowerCase().includes(q) ||
        getVehicleDisplayName(vehicle, "en").toLowerCase().includes(q)
      );
    });
  }, [workOrders, search, statusFilter]);

  function handleNew() {
    toast.info(t("newDisabled"));
  }

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      {/* رأس الصفحة */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={handleNew} className="shrink-0 gap-2">
          <Plus className="size-4" />
          {t("new")}
        </Button>
      </div>

      {/* بطاقات المؤشرات */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label={t("stats.open")}
          value={formatNumber(stats.open, locale)}
          icon={ClipboardList}
          tone="neutral"
        />
        <StatCard
          label={t("stats.awaitingApproval")}
          value={formatNumber(stats.awaitingApproval, locale)}
          icon={Timer}
          tone="neutral"
        />
        <StatCard
          label={t("stats.inProgress")}
          value={formatNumber(stats.inProgress, locale)}
          icon={Wrench}
          tone="accent"
        />
        <StatCard
          label={t("stats.readyForDelivery")}
          value={formatNumber(stats.readyForDelivery, locale)}
          icon={ClipboardCheck}
          tone="neutral"
        />
      </div>

      {/* شريط البحث والفلتر */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as WorkOrderStatus | "all")}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            {workOrderStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {tStatus(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* الجدول */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="ps-4 text-xs whitespace-nowrap">
                  {t("columns.number")}
                </TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.customer")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.vehicle")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.status")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">
                  {t("columns.technician")}
                </TableHead>
                <TableHead className="text-end text-xs whitespace-nowrap">
                  {t("columns.total")}
                </TableHead>
                <TableHead className="pe-4 text-end text-xs whitespace-nowrap">
                  {t("columns.received")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    {tCommon("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(({ order: wo, customer, vehicle }) => {
                  const { total } = getWorkOrderTotals(wo);
                  return (
                    <TableRow key={wo.id} className="relative cursor-pointer">
                      <TableCell className="ps-4">
                        <div className="flex flex-col gap-0.5">
                          <Link
                            href={`/work-orders/${wo.id}`}
                            aria-label={t("openOrder", { number: wo.number })}
                            data-ltr
                            className="font-mono text-xs font-medium whitespace-nowrap outline-none after:absolute after:inset-0 focus-visible:underline"
                          >
                            {wo.number}
                          </Link>
                          <span className={PRIORITY_STYLES[wo.priority]}>
                            {tPriority(wo.priority)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[13rem] truncate text-sm">
                        {customer.displayName[lang]}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span data-numeric className="max-w-[14rem] truncate text-sm">
                            {getVehicleDisplayName(vehicle, locale)}
                          </span>
                          <span data-ltr className="text-2xs text-muted-foreground">
                            {vehicle.plate}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={wo.status} label={tStatus(wo.status)} />
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                        {wo.technician[lang]}
                      </TableCell>
                      <TableCell className="text-end whitespace-nowrap">
                        {total > 0 ? (
                          <>
                            <span data-numeric className="text-sm font-medium">
                              {formatCurrency(total, locale)}
                            </span>
                            <span className="ms-1 text-2xs text-muted-foreground">
                              {tCommon("currency")}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="pe-4 text-end text-xs whitespace-nowrap text-muted-foreground">
                        {formatDate(wo.receivedAt, locale)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
