"use client";

import { CheckCircle2, PackageSearch, Search, Truck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/patterns/page-header";
import { StatCard } from "@/components/patterns/stat-card";
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
import { PurchaseOrderStatusBadge } from "./purchase-order-status-badge";
import { getPurchaseOrderTotal } from "../read-models";
import { purchaseOrderStatuses, type PurchaseOrder, type PurchaseOrderStatus } from "../types";

type StatusFilter = "all" | PurchaseOrderStatus;

export function PurchasingView({
  orders,
  stats,
}: {
  orders: PurchaseOrder[];
  stats: { total: number; ordered: number; partiallyReceived: number; pendingValue: number };
}) {
  const t = useTranslations("purchasing");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders
      .filter((order) => {
        if (statusFilter !== "all" && order.status !== statusFilter) return false;
        if (!query) return true;
        return (
          order.number.toLowerCase().includes(query) ||
          order.supplier.ar.toLowerCase().includes(query) ||
          order.supplier.en.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => Date.parse(b.orderedAt) - Date.parse(a.orderedAt));
  }, [orders, search, statusFilter]);

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("stats.total")} value={formatNumber(stats.total, locale)} icon={PackageSearch} tone="accent" />
        <StatCard label={t("stats.ordered")} value={formatNumber(stats.ordered, locale)} icon={Truck} />
        <StatCard label={t("stats.partiallyReceived")} value={formatNumber(stats.partiallyReceived, locale)} icon={CheckCircle2} />
        <StatCard
          label={t("stats.pendingValue")}
          value={formatCurrency(stats.pendingValue, locale)}
          unit={tCommon("currency")}
          icon={PackageSearch}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="po-search" className="sr-only">{t("searchLabel")}</label>
          <Input
            id="po-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
          <SelectTrigger aria-label={t("statusFilterLabel")} className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            {purchaseOrderStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`status.${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="ps-4 text-xs whitespace-nowrap">{t("columns.number")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.supplier")}</TableHead>
                <TableHead className="text-end text-xs whitespace-nowrap">{t("columns.total")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.expected")}</TableHead>
                <TableHead className="pe-4 text-end text-xs whitespace-nowrap">{t("columns.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    {tCommon("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((order) => (
                  <TableRow key={order.id} className="relative cursor-pointer">
                    <TableCell data-ltr className="ps-4">
                      <Link
                        href={`/purchasing/${order.id}`}
                        aria-label={t("openOrder", { number: order.number })}
                        className="font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                      >
                        {order.number}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[16rem] truncate text-sm">{order.supplier[lang]}</TableCell>
                    <TableCell data-numeric className="text-end text-sm">{formatCurrency(getPurchaseOrderTotal(order), locale)}</TableCell>
                    <TableCell data-numeric className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDate(order.expectedAt, locale)}
                    </TableCell>
                    <TableCell className="pe-4 text-end">
                      <PurchaseOrderStatusBadge status={order.status} label={t(`status.${order.status}`)} />
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
