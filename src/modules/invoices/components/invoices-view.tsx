"use client";

import { AlertCircle, CheckCircle2, Receipt, Search } from "lucide-react";
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
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { invoiceStatuses, type InvoiceStatus } from "../types";
import type { InvoiceReadModel } from "../read-models";

type StatusFilter = "all" | InvoiceStatus;

export function InvoicesView({
  invoices,
  stats,
}: {
  invoices: InvoiceReadModel[];
  stats: { total: number; overdue: number; paid: number; outstandingValue: number };
}) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return invoices
      .filter(({ invoice, customer, vehicle }) => {
        if (statusFilter !== "all" && invoice.status !== statusFilter) return false;
        if (!query) return true;
        return (
          invoice.number.toLowerCase().includes(query) ||
          customer.displayName.ar.toLowerCase().includes(query) ||
          customer.displayName.en.toLowerCase().includes(query) ||
          vehicle.plate.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => Date.parse(b.invoice.issuedAt) - Date.parse(a.invoice.issuedAt));
  }, [invoices, search, statusFilter]);

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("stats.total")} value={formatNumber(stats.total, locale)} icon={Receipt} tone="accent" />
        <StatCard label={t("stats.overdue")} value={formatNumber(stats.overdue, locale)} icon={AlertCircle} />
        <StatCard label={t("stats.paid")} value={formatNumber(stats.paid, locale)} icon={CheckCircle2} />
        <StatCard
          label={t("stats.outstandingValue")}
          value={formatCurrency(stats.outstandingValue, locale)}
          unit={tCommon("currency")}
          icon={Receipt}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="invoice-search" className="sr-only">{t("searchLabel")}</label>
          <Input
            id="invoice-search"
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
            {invoiceStatuses.map((status) => (
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
                <TableHead className="text-xs whitespace-nowrap">{t("columns.customer")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.vehicle")}</TableHead>
                <TableHead className="text-end text-xs whitespace-nowrap">{t("columns.total")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.dueAt")}</TableHead>
                <TableHead className="pe-4 text-end text-xs whitespace-nowrap">{t("columns.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    {tCommon("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(({ invoice, customer, vehicle, total }) => (
                  <TableRow key={invoice.id} className="relative cursor-pointer">
                    <TableCell data-ltr className="ps-4">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        aria-label={t("openInvoice", { number: invoice.number })}
                        className="font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                      >
                        {invoice.number}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[13rem] truncate text-sm">{customer.displayName[lang]}</TableCell>
                    <TableCell data-numeric className="text-sm">{getVehicleDisplayName(vehicle, locale)}</TableCell>
                    <TableCell data-numeric className="text-end text-sm">{formatCurrency(total, locale)}</TableCell>
                    <TableCell data-numeric className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDate(invoice.dueAt, locale)}
                    </TableCell>
                    <TableCell className="pe-4 text-end">
                      <InvoiceStatusBadge status={invoice.status} label={t(`status.${invoice.status}`)} />
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
