"use client";

import { CalendarCheck, Scale, Search, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/patterns/page-header";
import { SortableTableHead, nextSortState, type SortDirection } from "@/components/patterns/sortable-table-head";
import { StatCard } from "@/components/patterns/stat-card";
import { TablePagination } from "@/components/patterns/table-pagination";
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
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { getDailyClosingTotals } from "@/lib/services/daily-closing-service";
import { loadStoredDailyClosings } from "../client-store";
import { DailyClosingStatusBadge } from "./daily-closing-status-badge";
import { dailyClosingStatuses, type DailyClosing, type DailyClosingStatus } from "../types";

type StatusFilter = "all" | DailyClosingStatus;
type SortKey = "date" | "opening" | "closingBalance";

const PAGE_SIZE = 10;

export function DailyClosingView({ closings: seedClosings }: { closings: DailyClosing[] }) {
  const t = useTranslations("dailyClosing");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  // تعديلات مُحفَظة محليًا (من شاشة التفاصيل) تحل محل نسخة البذرة لنفس
  // اليومية — وإلا تظهر القائمة أرقامًا قديمة بعد حفظ تعديل فعلي.
  const [closings] = useState<DailyClosing[]>(() => loadStoredDailyClosings(seedClosings));

  const rows = useMemo(
    () => closings.map((closing) => ({ closing, totals: getDailyClosingTotals(closing) })),
    [closings],
  );

  const closedCount = closings.filter((c) => c.status === "closed").length;
  const draftCount = closings.filter((c) => c.status === "draft").length;
  const latestBalance = rows.length > 0 ? rows[rows.length - 1].totals.closingBalance : 0;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter(({ closing }) => {
      if (statusFilter !== "all" && closing.status !== statusFilter) return false;
      if (!query) return true;
      return closing.date.includes(query);
    });
  }, [rows, search, statusFilter]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return filtered;
    const factor = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "date":
          return factor * (Date.parse(a.closing.date) - Date.parse(b.closing.date));
        case "opening":
          return factor * (a.closing.openingBalance - b.closing.openingBalance);
        case "closingBalance":
          return factor * (a.totals.closingBalance - b.totals.closingBalance);
        default:
          return 0;
      }
    });
  }, [filtered, sortDirection, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSort(key: SortKey) {
    const next = nextSortState(sortKey, sortDirection, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
    setPage(1);
  }

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label={t("stats.closed")} value={formatNumber(closedCount, locale)} icon={CalendarCheck} tone="accent" />
        <StatCard label={t("stats.draft")} value={formatNumber(draftCount, locale)} icon={Scale} />
        <StatCard label={t("stats.latestBalance")} value={formatMoney(latestBalance, locale)} unit={tCommon("currency")} icon={Wallet} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="closing-search" className="sr-only">{t("searchLabel")}</label>
          <Input
            id="closing-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as StatusFilter);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label={t("statusFilterLabel")} className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            {dailyClosingStatuses.map((status) => (
              <SelectItem key={status} value={status}>{t(`status.${status}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableTableHead label={t("columns.date")} sortKey="date" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="ps-4" />
                <SortableTableHead label={t("columns.opening")} sortKey="opening" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="end" />
                <TableHead className="text-end text-xs whitespace-nowrap">{t("columns.receipts")}</TableHead>
                <TableHead className="text-end text-xs whitespace-nowrap">{t("columns.expenses")}</TableHead>
                <TableHead className="text-end text-xs whitespace-nowrap">{t("columns.purchases")}</TableHead>
                <SortableTableHead label={t("columns.closingBalance")} sortKey="closingBalance" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="end" />
                <TableHead className="pe-4 text-end text-xs whitespace-nowrap">{t("columns.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    {tCommon("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map(({ closing, totals }) => (
                  <TableRow key={closing.id} className="relative cursor-pointer">
                    <TableCell data-numeric className="ps-4">
                      <Link
                        href={`/daily-closing/${closing.id}`}
                        aria-label={t("openClosing", { date: formatDate(closing.date, locale) })}
                        className="font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                      >
                        {formatDate(closing.date, locale)}
                      </Link>
                    </TableCell>
                    <TableCell data-numeric className="text-end text-sm">{formatMoney(closing.openingBalance, locale)}</TableCell>
                    <TableCell data-numeric className="text-end text-sm text-success-text">{formatMoney(totals.totalReceipts, locale)}</TableCell>
                    <TableCell data-numeric className="text-end text-sm">{formatMoney(totals.totalExpenses, locale)}</TableCell>
                    <TableCell data-numeric className="text-end text-sm">{formatMoney(totals.totalPurchases, locale)}</TableCell>
                    <TableCell data-numeric className="text-end text-sm font-medium">{formatMoney(totals.closingBalance, locale)}</TableCell>
                    <TableCell className="pe-4 text-end">
                      <DailyClosingStatusBadge status={closing.status} label={t(`status.${closing.status}`)} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination page={currentPage} pageCount={pageCount} totalItems={sorted.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>
    </div>
  );
}
