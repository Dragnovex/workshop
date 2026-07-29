"use client";

import { Building2, ClipboardList, Search, UserRound, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/patterns/page-header";
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
import type { CustomerReadModel } from "../read-models";

type CustomerKindFilter = "all" | "individual" | "company";

export function CustomersView({
  customers,
  stats,
}: {
  customers: CustomerReadModel[];
  stats: {
    total: number;
    individuals: number;
    companies: number;
    openOrders: number;
  };
}) {
  const t = useTranslations("customers");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<CustomerKindFilter>("all");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return customers.filter(({ customer }) => {
      if (kindFilter !== "all" && customer.kind !== kindFilter) return false;
      if (!query) return true;
      return (
        customer.displayName.ar.toLowerCase().includes(query) ||
        customer.displayName.en.toLowerCase().includes(query)
      );
    });
  }, [customers, kindFilter, search]);

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("stats.total")} value={formatNumber(stats.total, locale)} icon={Users} tone="accent" />
        <StatCard label={t("stats.individuals")} value={formatNumber(stats.individuals, locale)} icon={UserRound} />
        <StatCard label={t("stats.companies")} value={formatNumber(stats.companies, locale)} icon={Building2} />
        <StatCard label={t("stats.openOrders")} value={formatNumber(stats.openOrders, locale)} icon={ClipboardList} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="customer-search" className="sr-only">{t("searchLabel")}</label>
          <Input
            id="customer-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <Select value={kindFilter} onValueChange={(value) => setKindFilter(value as CustomerKindFilter)}>
          <SelectTrigger aria-label={t("kindFilterLabel")} className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("kind.all")}</SelectItem>
            <SelectItem value="individual">{t("kind.individual")}</SelectItem>
            <SelectItem value="company">{t("kind.company")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="ps-4 text-xs whitespace-nowrap">{t("columns.customer")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.kind")}</TableHead>
                <TableHead className="text-end text-xs whitespace-nowrap">{t("columns.vehicles")}</TableHead>
                <TableHead className="text-end text-xs whitespace-nowrap">{t("columns.orders")}</TableHead>
                <TableHead className="text-end text-xs whitespace-nowrap">{t("columns.openOrders")}</TableHead>
                <TableHead className="pe-4 text-end text-xs whitespace-nowrap">{t("columns.lastVisit")}</TableHead>
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
                filtered.map(({ customer, vehicles, workOrders, openOrderCount, lastVisitAt }) => (
                  <TableRow key={customer.id} className="relative cursor-pointer">
                    <TableCell className="ps-4">
                      <Link
                        href={`/customers/${customer.id}`}
                        aria-label={t("openCustomer", { name: customer.displayName[lang] })}
                        className="font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                      >
                        {customer.displayName[lang]}
                      </Link>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{t(`kind.${customer.kind}`)}</Badge></TableCell>
                    <TableCell data-numeric className="text-end text-sm">{formatNumber(vehicles.length, locale)}</TableCell>
                    <TableCell data-numeric className="text-end text-sm">{formatNumber(workOrders.length, locale)}</TableCell>
                    <TableCell data-numeric className="text-end text-sm">{formatNumber(openOrderCount, locale)}</TableCell>
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
